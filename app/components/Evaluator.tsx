"use client";

import { useEffect, useMemo, useState } from "react";
import { getLesson, lessons, type Lesson } from "../data/lessons";

type Grade = "A" | "B" | "C";
type AiStatus = {
  configured: boolean;
  requiresAccessCode: boolean;
  authorized?: boolean;
};
type Result = {
  grade: Grade;
  label: string;
  reasons: string[];
  evidence: string[];
  nextPrompt: string;
  caution: string;
  mode: "rubric" | "ai";
};
type ApiError = { code?: string; error?: string };

const relationWords = ["ため", "ので", "から", "によって", "ことで", "その結果", "関係", "つなが", "すると", "なり", "一方", "しかし", "補う"];
const lessonSixEffectWords = ["食生活", "食卓", "食べにく", "安定供給", "国民", "消費者", "わたしたち", "値段", "価格", "手に入り"];
const perspectiveWords = ["一方", "しかし", "反対", "両方", "面がある", "立場", "助け", "役割", "よさ", "心配", "漁業者", "消費者"];
const generalEffectWords = ["食卓", "生活", "将来", "安定", "守", "品質", "新鮮", "収入", "消費者", "生産者", "漁師", "わたしたち"];
const evidenceWords = ["資料", "グラフ", "地図", "写真", "本文", "年", "万人", "万t", "％", "%", "ページ"];

const gradeLabels: Record<Grade, string> = {
  A: "すごい！考えが深まっているよ",
  B: "目標クリア！",
  C: "あと一歩！",
};

const encouragements: Record<Grade, string> = {
  A: "自分の言葉で、考えをしっかりつなげられたね。すばらしい！",
  B: "今日の大切なところが書けています。この調子！",
  C: "ここまでまとめを書けたことが大事です。つぎの一歩を一つ意識してみよう。",
};

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function matchedGroups(text: string, lesson: Lesson) {
  return lesson.groups
    .map((words, index) => ({ index, words: words.filter((word) => text.includes(word)) }))
    .filter((item) => item.words.length > 0);
}

export function localEvaluate(text: string, lesson: Lesson): Result {
  const clean = text.replace(/\s+/g, "").trim();
  const groups = matchedGroups(clean, lesson);
  const relation = containsAny(clean, relationWords);
  const source = containsAny(clean, evidenceWords) || /\d/.test(clean);
  const lessonSixEffect = containsAny(clean, lessonSixEffectWords);
  const perspective = containsAny(clean, perspectiveWords);
  const generalEffect = containsAny(clean, generalEffectWords);

  let grade: Grade = "C";
  if (lesson.id === 6) {
    const bReached = groups.length >= 2 && relation;
    if (bReached && (lessonSixEffect || perspective)) grade = "A";
    else if (bReached) grade = "B";
  } else if (lesson.id === 7) {
    const bReached = groups.length >= 4 && relation;
    if (bReached && (groups.length >= 5 || perspective)) grade = "A";
    else if (bReached) grade = "B";
  } else {
    const bReached = groups.length >= 2 && (relation || source);
    if (bReached && groups.length >= 3 && generalEffect) grade = "A";
    else if (bReached) grade = "B";
  }

  const reasons: string[] = [];
  if (groups.length >= 2) reasons.push(`今日の学習に関わることを、${groups.length}つのまとまりから書けています。`);
  else if (groups.length === 1) reasons.push("今日の学習で大切なことを、一つしっかり見付けています。");
  else reasons.push("自分の言葉で、最後までまとめを書けました。");

  if (relation) reasons.push("二つのことを「〜すると、〜につながる」とつないで考えています。");
  else if (source) reasons.push("資料や数値をもとに、分かったことを書いています。");

  if (lesson.id === 6 && lessonSixEffect) {
    reasons.push("水産業の課題が、私たちの食生活にどう関わるかまで考えています。");
  } else if (lesson.id === 6 && perspective) {
    reasons.push("役立つ面や心配な面など、別の見方からも考えています。");
  } else if (grade === "A") {
    reasons.push("学習した事実の意味や、その先の影響まで考えています。");
  }

  const evidence = groups.flatMap((group) => group.words).slice(0, 8);
  let nextPrompt = "授業で見付けた、もう一つの大切なことを思い出してみよう。";
  if (groups.length >= 2 && !relation) {
    nextPrompt = "二つのことを「〜すると、〜につながる」と、頭の中でつないでみよう。";
  } else if (lesson.id === 6 && grade === "B") {
    nextPrompt = "先生や友だちの話を思い出して、その先、私たちの食生活にどんな影響があるか考えてみよう。";
  } else if (lesson.id === 6 && grade === "A") {
    nextPrompt = "輸入や水産業の課題を、漁業者と消費者の両方から見ると、どんな違いがあるかな。";
  } else if (grade === "B") {
    nextPrompt = "そのことが、働く人や私たちの生活にどんなよさを生むか考えてみよう。";
  } else if (grade === "A") {
    nextPrompt = "よく深められたね。別の立場から見ると、どんな考えができるかな。";
  }

  return {
    grade,
    label: gradeLabels[grade],
    reasons,
    evidence,
    nextPrompt,
    caution: encouragements[grade],
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

export function Evaluator() {
  const [lessonId, setLessonId] = useState(6);
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
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
      .catch(() => setAiStatus({ configured: false, requiresAccessCode: false }))
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
        setNotice("合言葉を確認できました。");
      } else {
        window.sessionStorage.removeItem("suisan-access-code");
        setNotice("合言葉がちがいます。先生に聞いてみよう。");
      }
    } catch {
      setNotice("今は合言葉を確認できません。まとめのチェックはそのまま使えます。");
    } finally {
      setStatusBusy(false);
    }
  }

  async function evaluate() {
    if (text.trim().length < 15) {
      setNotice("まとめをもう少し書いてから、チェックしてみよう。");
      setResult(null);
      return;
    }

    setBusy(true);
    setNotice("");
    const fallback = localEvaluate(text, lesson);
    const canUseAi = aiStatus?.configured && (!aiStatus.requiresAccessCode || aiStatus.authorized);

    if (!canUseAi) {
      setResult(fallback);
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
        if (payload.code === "access_denied" && aiStatus) {
          setAiStatus({ ...aiStatus, authorized: false });
          window.sessionStorage.removeItem("suisan-access-code");
        }
        throw new Error(payload.error || "check unavailable");
      }
      setResult(payload);
    } catch {
      setResult(fallback);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="evaluator-layout">
      <section className="input-panel panel">
        <div className="panel-heading">
          <span>STEP 1</span><h2>自分のまとめを入れよう</h2>
        </div>

        <label className="field-label" htmlFor="lesson">今日の授業</label>
        <select id="lesson" value={lessonId} onChange={(event) => { setLessonId(Number(event.target.value)); setResult(null); }}>
          {lessons.map((item) => <option key={item.id} value={item.id}>第{item.id}時　{item.shortTitle}</option>)}
        </select>

        <div className="lesson-focus">
          <small>今日の問い</small>
          <p>{lesson.question}</p>
          <small>チェックのポイント</small>
          <p>{lesson.focus}</p>
        </div>

        <div className="label-row">
          <label className="field-label" htmlFor="summary">自分で書いたまとめ</label>
          <span>{text.length} / 1200</span>
        </div>
        <textarea
          id="summary"
          maxLength={1200}
          value={text}
          onChange={(event) => { setText(event.target.value); setResult(null); }}
          placeholder="自分で書いたまとめを、ここに入力しよう。"
          rows={9}
        />

        {!statusBusy && aiStatus?.configured && aiStatus.requiresAccessCode && !aiStatus.authorized && (
          <div className="access-code-row student-access-code">
            <label htmlFor="access-code">先生から聞いたクラスの合言葉</label>
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
          </div>
        )}

        <div className="input-actions child-actions">
          <button className="button button-secondary" type="button" onClick={() => { setText(lesson.sample); setResult(null); }}>例を見る</button>
          <button className="button button-primary" type="button" disabled={busy} onClick={evaluate}>{busy ? "チェック中…" : "まとめをチェック"}</button>
        </div>
        {notice && <p className="notice">{notice}</p>}
        <p className="privacy-note">名前や出席番号は書かず、まとめの文だけを入れよう。入力した文は保存されません。</p>
      </section>

      <section className="result-panel panel" aria-live="polite">
        <div className="panel-heading"><span>STEP 2</span><h2>チェックの結果</h2></div>
        {!result ? (
          <div className="empty-result">
            <div className="empty-mark">A<br /><span>B　C</span></div>
            <p>まとめを書いて「まとめをチェック」を押すと、できているところと、つぎの一歩が分かります。</p>
          </div>
        ) : (
          <div className={`result-card grade-${result.grade.toLowerCase()}`}>
            <div className="grade-row">
              <div className="grade-badge"><strong>{result.grade}</strong><span>{result.label}</span></div>
            </div>

            <h3>できているところ</h3>
            <ul>{result.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>

            {result.evidence.length > 0 && (
              <>
                <h3>まとめに入っていた大切な言葉</h3>
                <div className="evidence-chips">{result.evidence.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
              </>
            )}

            <div className="next-prompt"><small>つぎの一歩</small><p>{result.nextPrompt}</p></div>
            <p className="encouragement">{result.caution}</p>
          </div>
        )}
      </section>
    </div>
  );
}

