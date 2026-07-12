import { getLesson } from "../../data/lessons";

type RequestBody = { lessonId?: number; text?: string };
type UsageRow = {
  month_key: string;
  request_count: number;
  reserved_cost_micros: number;
  actual_cost_micros: number;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
};
type OpenAIUsage = {
  input_tokens?: number;
  input_tokens_details?: { cached_tokens?: number };
  output_tokens?: number;
};
type OpenAIResponse = {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  output_text?: string;
  usage?: OpenAIUsage;
};
type Bindings = {
  DB?: D1Database;
  OPENAI_API_KEY?: string;
  APP_ACCESS_CODE?: string;
  AI_MONTHLY_BUDGET_USD?: string;
  AI_MONTHLY_REQUEST_LIMIT?: string;
  AI_PER_MINUTE_LIMIT?: string;
  AI_RATE_LIMIT_SALT?: string;
};

const MODEL = "gpt-5.4-nano";
const MAX_INPUT_CHARS = 1200;
const MAX_OUTPUT_TOKENS = 350;

// GPT-5.4 nano standard-processing prices per 1M tokens.
const INPUT_PRICE_USD_PER_MILLION = 0.2;
const CACHED_INPUT_PRICE_USD_PER_MILLION = 0.02;
const OUTPUT_PRICE_USD_PER_MILLION = 1.25;

// A deliberately conservative per-request reservation. The unused portion is
// released after the API returns, while concurrent requests remain protected.
const RESERVED_INPUT_TOKENS = 6000;
const RESERVED_OUTPUT_TOKENS = MAX_OUTPUT_TOKENS;

let bindings: Bindings = {};
let bindingsPromise: Promise<Bindings> | null = null;

function loadBindings() {
  if (!bindingsPromise) {
    bindingsPromise = import("cloudflare:workers")
      .then((module) => module.env as unknown as Bindings)
      .catch(() => ({}));
  }
  return bindingsPromise;
}

function numberSetting(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function integerSetting(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  return Math.round(numberSetting(value, fallback, minimum, maximum));
}

function getSettings() {
  const monthlyBudgetUsd = numberSetting(
    bindings.AI_MONTHLY_BUDGET_USD ?? process.env.AI_MONTHLY_BUDGET_USD,
    1,
    0.1,
    100,
  );
  const monthlyRequestLimit = integerSetting(
    bindings.AI_MONTHLY_REQUEST_LIMIT ?? process.env.AI_MONTHLY_REQUEST_LIMIT,
    2000,
    1,
    100000,
  );
  const perMinuteLimit = integerSetting(
    bindings.AI_PER_MINUTE_LIMIT ?? process.env.AI_PER_MINUTE_LIMIT,
    2,
    1,
    30,
  );
  return {
    monthlyBudgetUsd,
    monthlyBudgetMicros: Math.floor(monthlyBudgetUsd * 1_000_000),
    monthlyRequestLimit,
    perMinuteLimit,
  };
}

function json(data: unknown, init?: ResponseInit) {
  const response = Response.json(data, init);
  response.headers.set("cache-control", "no-store");
  return response;
}

function currentMonthInJapan(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  return `${year}-${month}`;
}

function currentMinuteWindow(date = new Date()) {
  return date.toISOString().slice(0, 16);
}

function priceMicros(inputTokens: number, cachedInputTokens: number, outputTokens: number) {
  const nonCachedInputTokens = Math.max(0, inputTokens - cachedInputTokens);
  const usd =
    (nonCachedInputTokens * INPUT_PRICE_USD_PER_MILLION) / 1_000_000 +
    (cachedInputTokens * CACHED_INPUT_PRICE_USD_PER_MILLION) / 1_000_000 +
    (outputTokens * OUTPUT_PRICE_USD_PER_MILLION) / 1_000_000;
  return Math.ceil(usd * 1_000_000);
}

const reservationMicros = priceMicros(RESERVED_INPUT_TOKENS, 0, RESERVED_OUTPUT_TOKENS);

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function accessCodeMatches(request: Request) {
  const expected = bindings.APP_ACCESS_CODE ?? process.env.APP_ACCESS_CODE ?? "";
  if (!expected) return true;
  const received = request.headers.get("x-app-access-code") ?? "";
  if (!received) return false;
  const [expectedHash, receivedHash] = await Promise.all([sha256(expected), sha256(received)]);
  return expectedHash === receivedHash;
}

async function clientKey(request: Request) {
  const deviceId = (request.headers.get("x-client-id") ?? "unknown-device").slice(0, 100);
  const forwarded = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown-ip";
  const ip = forwarded.split(",")[0]?.trim().slice(0, 80) ?? "unknown-ip";
  const salt = bindings.AI_RATE_LIMIT_SALT ?? process.env.AI_RATE_LIMIT_SALT ?? "suisan-evaluator";
  return sha256(`${salt}|${deviceId}|${ip}`);
}

async function ensureTables(db: D1Database) {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_monthly_usage (
        month_key TEXT PRIMARY KEY NOT NULL,
        request_count INTEGER NOT NULL DEFAULT 0,
        reserved_cost_micros INTEGER NOT NULL DEFAULT 0,
        actual_cost_micros INTEGER NOT NULL DEFAULT 0,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        cached_input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_rate_limits (
        client_key TEXT NOT NULL,
        window_key TEXT NOT NULL,
        request_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (client_key, window_key)
      )
    `),
  ]);
}

async function readUsage(db: D1Database, monthKey: string) {
  return db
    .prepare(`SELECT * FROM ai_monthly_usage WHERE month_key = ?`)
    .bind(monthKey)
    .first<UsageRow>();
}

function publicUsage(row: UsageRow | null, settings: ReturnType<typeof getSettings>) {
  const usedMicros = row?.actual_cost_micros ?? 0;
  return {
    month: row?.month_key ?? currentMonthInJapan(),
    requests: row?.request_count ?? 0,
    requestLimit: settings.monthlyRequestLimit,
    usedUsd: Number((usedMicros / 1_000_000).toFixed(6)),
    budgetUsd: settings.monthlyBudgetUsd,
    remainingUsd: Number((Math.max(0, settings.monthlyBudgetMicros - usedMicros) / 1_000_000).toFixed(6)),
    inputTokens: row?.input_tokens ?? 0,
    outputTokens: row?.output_tokens ?? 0,
  };
}

async function enforceRateLimit(db: D1Database, request: Request, limit: number) {
  const key = await clientKey(request);
  const window = currentMinuteWindow();
  const result = await db
    .prepare(`
      INSERT INTO ai_rate_limits (client_key, window_key, request_count, updated_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(client_key, window_key) DO UPDATE SET
        request_count = ai_rate_limits.request_count + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE ai_rate_limits.request_count < ?
      RETURNING request_count
    `)
    .bind(key, window, limit)
    .first<{ request_count: number }>();

  // Keep the small rate-limit table tidy without storing raw IP addresses.
  if (Math.random() < 0.03) {
    await db.prepare(`DELETE FROM ai_rate_limits WHERE updated_at < datetime('now', '-2 days')`).run();
  }
  return Boolean(result);
}

async function reserveMonthlyUsage(
  db: D1Database,
  monthKey: string,
  settings: ReturnType<typeof getSettings>,
) {
  return db
    .prepare(`
      INSERT INTO ai_monthly_usage (
        month_key, request_count, reserved_cost_micros, actual_cost_micros,
        input_tokens, cached_input_tokens, output_tokens, updated_at
      ) VALUES (?, 1, ?, 0, 0, 0, 0, CURRENT_TIMESTAMP)
      ON CONFLICT(month_key) DO UPDATE SET
        request_count = ai_monthly_usage.request_count + 1,
        reserved_cost_micros = ai_monthly_usage.reserved_cost_micros + excluded.reserved_cost_micros,
        updated_at = CURRENT_TIMESTAMP
      WHERE ai_monthly_usage.request_count < ?
        AND ai_monthly_usage.actual_cost_micros
          + ai_monthly_usage.reserved_cost_micros
          + excluded.reserved_cost_micros <= ?
      RETURNING *
    `)
    .bind(monthKey, reservationMicros, settings.monthlyRequestLimit, settings.monthlyBudgetMicros)
    .first<UsageRow>();
}

async function releaseReservation(db: D1Database, monthKey: string) {
  await db
    .prepare(`
      UPDATE ai_monthly_usage SET
        request_count = MAX(request_count - 1, 0),
        reserved_cost_micros = MAX(reserved_cost_micros - ?, 0),
        updated_at = CURRENT_TIMESTAMP
      WHERE month_key = ?
    `)
    .bind(reservationMicros, monthKey)
    .run();
}

async function settleUsage(db: D1Database, monthKey: string, usage: OpenAIUsage | undefined) {
  const inputTokens = Math.max(0, usage?.input_tokens ?? 0);
  const cachedInputTokens = Math.max(0, usage?.input_tokens_details?.cached_tokens ?? 0);
  const outputTokens = Math.max(0, usage?.output_tokens ?? 0);
  const actualMicros = priceMicros(inputTokens, cachedInputTokens, outputTokens);

  await db
    .prepare(`
      UPDATE ai_monthly_usage SET
        reserved_cost_micros = MAX(reserved_cost_micros - ?, 0),
        actual_cost_micros = actual_cost_micros + ?,
        input_tokens = input_tokens + ?,
        cached_input_tokens = cached_input_tokens + ?,
        output_tokens = output_tokens + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE month_key = ?
    `)
    .bind(
      reservationMicros,
      actualMicros,
      inputTokens,
      cachedInputTokens,
      outputTokens,
      monthKey,
    )
    .run();
}

function getApiKey() {
  return bindings.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
}

export async function GET(request: Request) {
  bindings = await loadBindings();
  const settings = getSettings();
  const apiKey = getApiKey();
  const db = bindings.DB;
  const requiresAccessCode = Boolean(bindings.APP_ACCESS_CODE ?? process.env.APP_ACCESS_CODE);

  if (!apiKey || !db) {
    return json({
      configured: false,
      model: MODEL,
      requiresAccessCode,
      reason: !apiKey ? "OPENAI_API_KEY が未設定です。" : "月額上限用のDBが未設定です。",
    });
  }

  await ensureTables(db);
  const authorized = await accessCodeMatches(request);
  if (!authorized) {
    return json({ configured: true, model: MODEL, requiresAccessCode: true, authorized: false });
  }

  const row = await readUsage(db, currentMonthInJapan());
  return json({
    configured: true,
    model: MODEL,
    requiresAccessCode,
    authorized: true,
    maxInputChars: MAX_INPUT_CHARS,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    usage: publicUsage(row, settings),
  });
}

export async function POST(request: Request) {
  bindings = await loadBindings();
  const apiKey = getApiKey();
  const db = bindings.DB;
  const settings = getSettings();

  if (!apiKey || !db) {
    return json(
      { code: "not_configured", error: "AI精査は現在利用できません。無料のルーブリック判定を使います。" },
      { status: 503 },
    );
  }

  if (!(await accessCodeMatches(request))) {
    return json({ code: "access_denied", error: "クラス用合言葉を確認してください。" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return json({ code: "invalid_request", error: "送信内容を読み取れませんでした。" }, { status: 400 });
  }

  const text = body.text?.trim() ?? "";
  const lesson = getLesson(Number(body.lessonId ?? 1));
  if (text.length < 15 || text.length > MAX_INPUT_CHARS) {
    return json(
      { code: "invalid_text", error: `まとめは15〜${MAX_INPUT_CHARS}文字で入力してください。` },
      { status: 400 },
    );
  }

  await ensureTables(db);
  if (!(await enforceRateLimit(db, request, settings.perMinuteLimit))) {
    return json(
      { code: "rate_limit", error: `送信が続いています。1分ほど待ってから、もう一度試してください。` },
      { status: 429 },
    );
  }

  const monthKey = currentMonthInJapan();
  const reserved = await reserveMonthlyUsage(db, monthKey, settings);
  if (!reserved) {
    const current = await readUsage(db, monthKey);
    return json(
      {
        code: "monthly_limit",
        error: "今月のAI利用上限に達しました。無料のルーブリック判定を表示します。",
        usage: publicUsage(current, settings),
      },
      { status: 429 },
    );
  }

  const system = `あなたは小学校5年社会科で、児童本人にまとめのよさと次の一歩を返す学習サポーターです。
判定は文章量や語句の数ではなく、書かれた内容の質で行ってください。文章にない能力を推測せず、人格を評価しません。

第6時の基準：
- B：資料から分かる二つ以上の課題を書き、課題同士のつながりを一つ説明している。資料番号や数値の明記は必須にしない。
- A：Bに加え、国民の食生活・安定供給への影響まで考えている。または、輸入の役割と課題など、別の立場や複数の面から考えている。
- C：一つの課題は書けているが、別の課題とのつながりがまだ十分に表れていない。
第6時以外は、本時の問いとチェックのポイントに照らし、Bを今日の目標、Aを意味・影響・別の立場まで深まった状態として判断してください。

児童向け出力の約束：
- labelはA「すごい！考えが深まっているよ」、B「目標クリア！」、C「あと一歩！」のいずれか。
- reasonsは、できていることだけを、具体的でやさしい言葉で2〜3点。足りない点、教師、評価処理、API、料金には触れない。
- nextPromptは、書き直しを求めず、授業での交流や板書を思い出して次の学習で意識できる問いを一つ。
- cautionは短い励ましの言葉。`;
  const prompt = `第${lesson.id}時「${lesson.shortTitle}」\n今日の問い：${lesson.question}\nチェックのポイント：${lesson.focus}\n自分で書いたまとめ：${text}`;

  let reservationActive = true;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        reasoning: { effort: "none" },
        store: false,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        input: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "lesson_evaluation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                grade: { type: "string", enum: ["A", "B", "C"] },
                label: { type: "string" },
                reasons: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 3,
                },
                evidence: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 6,
                },
                nextPrompt: { type: "string" },
                caution: { type: "string" },
                mode: { type: "string", enum: ["ai"] },
              },
              required: ["grade", "label", "reasons", "evidence", "nextPrompt", "caution", "mode"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      await releaseReservation(db, monthKey);
      reservationActive = false;
      return json(
        { code: "api_failed", error: "AI精査に接続できませんでした。無料のルーブリック判定を表示します。" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as OpenAIResponse;
    await settleUsage(db, monthKey, data.usage);
    reservationActive = false;

    const outputText =
      data.output_text ??
      data.output
        ?.flatMap((item) => item.content ?? [])
        .find((item) => item.type === "output_text")
        ?.text;
    if (!outputText) {
      return json(
        { code: "empty_output", error: "AIの判定結果を読み取れませんでした。無料判定を表示します。" },
        { status: 502 },
      );
    }

    const evaluation = JSON.parse(outputText) as Record<string, unknown> & { grade?: "A" | "B" | "C" };
    const grade = evaluation.grade === "A" || evaluation.grade === "B" ? evaluation.grade : "C";
    const labels = {
      A: "すごい！考えが深まっているよ",
      B: "目標クリア！",
      C: "あと一歩！",
    } as const;
    const encouragements = {
      A: "自分の言葉で、考えをしっかりつなげられたね。すばらしい！",
      B: "今日の大切なところが書けています。この調子！",
      C: "ここまでまとめを書けたことが大事です。つぎの一歩を一つ意識してみよう。",
    } as const;
    const current = await readUsage(db, monthKey);
    return json({
      ...evaluation,
      grade,
      label: labels[grade],
      caution: encouragements[grade],
      mode: "ai",
      usage: publicUsage(current, settings),
    });
  } catch {
    if (reservationActive) await releaseReservation(db, monthKey);
    return json(
      { code: "api_failed", error: "AI精査に接続できませんでした。無料のルーブリック判定を表示します。" },
      { status: 502 },
    );
  }
}
