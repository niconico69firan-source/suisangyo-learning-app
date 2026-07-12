"use client";

import { useEffect, useMemo, useState } from "react";
import { getLesson, lessons, type Lesson } from "../data/lessons";

type Grade = "A" | "B" | "C";
type AiUsage = {
  month: string;
  requests: number;
  requestLimit: number;
  usedUsd: number;
  budgetUsd: number;
  remainingUsd: number;
  inputTokens: number;
  outputTokens: number;
};
type AiStatus = {
  configured: boolean;
  model: string;
  requiresAccessCode: boolean;
  authorized?: boolean;
  reason?: string;
  usage?: AiUsage;
};
type Result = {
  grade: Grade;
  label: string;
  reasons: string[];
  evidence: string[];
  nextPrompt: string;
  caution: string;
  mode: "rubric" | "ai";
  usage?: AiUsage;
};
type ApiError = { code?: string; error?: string; usage?: AiUsage };

const relationWords = ["ため", "ので", "から", "によって", "ことで", "その結果", "関係", "つなが", "一方", "しかし", "補う"];
const effectWords = ["食卓", "生活", "将来", "続", "安定", "守", "品質", "新鮮", "収入", "消費者", "生産者", "漁師", "わたしたち"];
const evidenceWords = ["資料", "グラフ", "地図", "写真", "本文", "年", "万人", "万t", "％", "%", "ページ"];

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function matchedGroups(text: string, lesson: Lesson) {
  return lesson.groups
    .map((words, index) => ({ index, words: words.filter((word) => text.includes(word)) }))
    .filter((item) => item.words.length > 0);
}

function localEvaluate(text: string, lesson: Lesson): Result {
  const clean = text.replace(/\s+/g, "").trim();
  const groups = matchedGroups(clean, lesson);
  const relation = containsAny(clean, relationWords);
  const effect = containsAny(clean, effectWords);
  const source = containsAny(clean, evidenceWords) || /\d/.test(clean);
  const longEnough = clean.length >= 70;

  let grade: Grade = "C";
  if (lesson.id === 6) {
    if (groups.length >= 3 && relation && effect && source && clean.length >= 100) grade = "A";
    else if (groups.length >= 2 && relation && source) grade = "B";
  } else if (lesson.id === 7) {
    if (groups.length >= 5 && relation && clean.length >= 110) grade = "A";
    else if (groups.length >= 4 && relation && longEnough) grade = "B";
  } else {
    if (groups.length >= 3 && relation && effect && clean.length >= 95) grade = "A";
    else if (groups.length >= 2 && (relation || source) && longEnough) grade = "B";
  }

  const reasons: string[] = [];
  if (groups.length >= 2) reasons.push(`本時に関わる内容を${groups.length}つの観点から書いています。`);
  else reasons.push("本時に関わる事実が、まだ一つの観点にとどまっています。");
  if (source) reasons.push("資料・数値など、考えの根拠が示されています。");
  else reasons.push("どの資料から分かったのかが文章から読み取りにくいです。");
  if (relation) reasons.push("事実と意味、または複数の事柄をつなげて説明しています。");
  else reasons.push("『なぜ』『どのようにつながるか』の説明を加える余地があります。");
  if (grade === "A") reasons.push("学習した事実が水産業や生活に与える意味まで考えています。");

  const evidence = groups.flatMap((group) => group.words).slice(0, 8);
  let nextPrompt = "根拠にした資料を一つ選び、『このことから〜』と続けると、どんなことが言えますか。";
  if (!source) nextPrompt = "どの資料の、どの変化や事実を根拠にしましたか。資料番号や数値を入れてみましょう。";
  else if (!relation) nextPrompt = "書いた二つの事実は、どのようにつながっていますか。『〜すると、〜』で結んでみましょう。";
  else if (!effect) nextPrompt = "そのことは、生産者・消費者やこれからの水産業にどんな影響がありますか。";
  else if (grade === "A") nextPrompt = "別の立場から見ると、よさや心配な点はありますか。";

  return {
    grade,
    label: grade === "A" ? "十分満足できる" : grade === "B" ? "おおむね満足できる" : "支援して伸ばす",
    reasons,
    evidence,
    nextPrompt,
    caution: "この判定は文章だけを見た補助結果です。授業中の発言や学習過程も合わせて、教師が最終判断してください。",
    mode: "rubric",
  };
}

function getClientId() {
  const storageKey = "suisan-ai-client-id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const created = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(storageKey, created);
  return created;
}

async function fetchAiStatus(accessCode: string) {
  const headers: Record<string, string> = {};
  if (accessCode) headers["x-app-access-code"] = accessCode;
  const response = await fetch("/api/evaluate", { method: "GET", headers, cache: "no-store" });
  if (!response.ok) throw new Error("status unavailable");
  return (await response.json()) as AiStatus;
}

function formatUsd(value: number) {
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

export function Evaluator() {
  const [lessonId, setLessonId] = useState(6);
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [useAi, setUseAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [accessCode, setAccessCode] = useState(() =>
    typeof window === "undefined" ? "" : window.sessionStorage.getItem("suisan-access-code") ?? "",
  );
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [statusBusy, setStatusBusy] = useState(true);
  const lesson = useMemo(() => getLesson(lessonId), [lessonId]);

  useEffect(() => {
    const savedCode = window.sessionStorage.getItem("suisan-access-code") ?? "";
    fetchAiStatus(savedCode)
      .then(setAiStatus)
      .catch(() => setAiStatus({ configured: false, model: "gpt-5.4-nano", requiresAccessCode: false, reason: "AI設定を確認できませんでした。" }))
      .finally(() => setStatusBusy(false));
  }, []);

  async function checkAccessCode() {
    setStatusBusy(true);
    setNotice("");
    try {
      const status = await fetchAiStatus(accessCode.trim());
      setAiStatus(status);
      if (status.authorized) {
        window.sessionStorage.setItem("suisan-access-code", accessCode.trim());
        setNotice("クラス用合言葉を確認しました。");
      } else {
        window.sessionStorage.removeItem("suisan-access-code");
        setNotice("合言葉が違います。先生に確認してください。");
      }
    } catch {
      setNotice("AIの利用状況を確認できませんでした。");
    } finally {
      setStatusBusy(false);
    }
  }

  async function evaluate() {
    if (text.trim().length < 15) {
      setNotice("まとめを15文字以上入力してください。");
      setResult(null);
      return;
    }
    setBusy(true);
    setNotice("");
    const fallback = localEvaluate(text, lesson);
    if (!useAi) {
      setResult(fallback);
      setBusy(false);
      return;
    }
    if (aiStatus?.requiresAccessCode && !aiStatus.authorized) {
      setResult(fallback);
      setNotice("AI精査にはクラス用合言葉が必要です。無料判定を表示しました。");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-client-id": getClientId(),
          ...(accessCode.trim() ? { "x-app-access-code": accessCode.trim() } : {}),
        },
        body: JSON.stringify({ lessonId, text }),
      });
      const payload = (await response.json()) as Result & ApiError;
      if (!response.ok) {
        if (payload.usage && aiStatus) setAiStatus({ ...aiStatus, usage: payload.usage });
        if (payload.code === "monthly_limit") setUseAi(false);
        if (payload.code === "access_denied" && aiStatus) {
          setAiStatus({ ...aiStatus, authorized: false });
          window.sessionStorage.removeItem("suisan-access-code");
        }
        throw new Error(payload.error || "AI精査を利用できませんでした。");
      }
      setResult(payload);
      if (payload.usage && aiStatus) {
        setAiStatus({ ...aiStatus, authorized: true, usage: payload.usage });
        if (payload.usage.requests >= payload.usage.requestLimit || payload.usage.usedUsd >= payload.usage.budgetUsd) {
          setUseAi(false);
        }
      }
    } catch (error) {
      setResult(fallback);
      setNotice(`${error instanceof Error ? error.message : "AI精査を利用できませんでした。"} 無料のルーブリック判定を表示しました。`);
    } finally {
      setBusy(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    const value = `第${lesson.id}時 ${lesson.shortTitle}\n判定：${result.grade}（${result.label}）\n見取り：${result.reasons.join(" ")}\n次の問い：${result.nextPrompt}`;
    await navigator.clipboard.writeText(value);
    setNotice("判定結果をコピーしました。");
  }

  const aiLimitReached = Boolean(
    aiStatus?.usage &&
      (aiStatus.usage.requests >= aiStatus.usage.requestLimit || aiStatus.usage.usedUsd >= aiStatus.usage.budgetUsd),
  );
  const usagePercent = aiStatus?.usage
    ? Math.min(100, Math.max(
        (aiStatus.usage.usedUsd / aiStatus.usage.budgetUsd) * 100,
        (aiStatus.usage.requests / aiStatus.usage.requestLimit) * 100,
      ))
    : 0;

  return (
    <div className="evaluator-layout">
      <section className="input-panel panel">
        <div className="panel-heading">
          <span>STEP 1</span><h2>本時とまとめを入力</h2>
        </div>
        <label className="field-label" htmlFor="lesson">授業を選ぶ</label>
        <select id="lesson" value={lessonId} onChange={(event) => { setLessonId(Number(event.target.value)); setResult(null); }}>
          {lessons.map((item) => <option key={item.id} value={item.id}>第{item.id}時　{item.shortTitle}</option>)}
        </select>

        <div className="lesson-focus">
          <small>本時の問い</small>
          <p>{lesson.question}</p>
          <small>主な見取り</small>
          <p>{lesson.focus}</p>
        </div>

        <div className="label-row">
          <label className="field-label" htmlFor="summary">児童のまとめ</label>
          <span>{text.length} / 1200</span>
        </div>
        <textarea
          id="summary"
          maxLength={1200}
          value={text}
          onChange={(event) => { setText(event.target.value); setResult(null); }}
          placeholder="児童名を入れず、まとめの文章だけを貼り付けます。"
          rows={9}
        />

        <div className="ai-settings" aria-label="AI精査の設定">
          <label className="toggle-row ai-toggle">
            <input
              type="checkbox"
              checked={useAi}
              disabled={!aiStatus?.configured || (aiStatus.requiresAccessCode && !aiStatus.authorized) || aiLimitReached}
              onChange={(event) => setUseAi(event.target.checked)}
            />
            <span>
              GPT-5.4 nanoで精査する
              <small>オフなら料金のかからないルーブリック判定</small>
            </span>
          </label>

          {statusBusy ? (
            <p className="ai-status-line">AI設定を確認しています…</p>
          ) : !aiStatus?.configured ? (
            <p className="ai-status-line ai-status-off">AI精査は未設定です。{aiStatus?.reason}</p>
          ) : aiStatus.requiresAccessCode && !aiStatus.authorized ? (
            <div className="access-code-row">
              <label htmlFor="access-code">クラス用合言葉</label>
              <div>
                <input
                  id="access-code"
                  type="password"
                  autoComplete="off"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") void checkAccessCode(); }}
                />
                <button className="button button-secondary" type="button" onClick={checkAccessCode}>確認</button>
              </div>
              <small>合言葉はこのタブを閉じるまでだけ保存します。</small>
            </div>
          ) : aiStatus.usage ? (
            <div className="usage-box">
              <div className="usage-heading">
                <span>{aiStatus.usage.month} のAI利用</span>
                <strong>{aiStatus.usage.requests} / {aiStatus.usage.requestLimit}回</strong>
              </div>
              <div className="usage-meter" aria-label={`AI利用量 ${Math.round(usagePercent)}%`}>
                <span style={{ width: `${usagePercent}%` }} />
              </div>
              <p>{aiLimitReached ? "今月のAI上限に達しました。無料判定は利用できます。" : <>概算 {formatUsd(aiStatus.usage.usedUsd)} / 上限 {formatUsd(aiStatus.usage.budgetUsd)}。どちらかの上限で自動停止します。</>}</p>
            </div>
          ) : (
            <p className="ai-status-line">GPT-5.4 nanoを利用できます。</p>
          )}
        </div>

        <div className="input-actions">
          <button className="button button-secondary" type="button" onClick={() => { setText(lesson.sample); setResult(null); }}>例文を入れる</button>
          <button className="button button-primary" type="button" disabled={busy} onClick={evaluate}>{busy ? "判定中…" : useAi ? "AIでABC判定" : "無料でABC判定"}</button>
        </div>
        <p className="privacy-note">児童名・出席番号・学校名など、個人を特定できる情報は入力しないでください。入力したまとめ本文は保存しません。</p>
      </section>

      <section className="result-panel panel" aria-live="polite">
        <div className="panel-heading"><span>STEP 2</span><h2>見取りと次の問い</h2></div>
        {notice && <p className="notice">{notice}</p>}
        {!result ? (
          <div className="empty-result">
            <div className="empty-mark">A<br /><span>B　C</span></div>
            <p>判定すると、根拠・関連付け・次の問いがここに表示されます。</p>
          </div>
        ) : (
          <div className={`result-card grade-${result.grade.toLowerCase()}`}>
            <div className="grade-row">
              <div className="grade-badge"><strong>{result.grade}</strong><span>{result.label}</span></div>
              <span className="mode-badge">{result.mode === "ai" ? "GPT-5.4 nano精査" : "無料ルーブリック判定"}</span>
            </div>
            <h3>見取れたこと</h3>
            <ul>{result.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>
            {result.evidence.length > 0 && <div className="evidence-chips">{result.evidence.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>}
            <div className="next-prompt"><small>児童への次の問い</small><p>{result.nextPrompt}</p></div>
            <p className="caution">{result.caution}</p>
            <button className="button button-secondary full-button" type="button" onClick={copyResult}>結果をコピー</button>
          </div>
        )}
      </section>
    </div>
  );
}
