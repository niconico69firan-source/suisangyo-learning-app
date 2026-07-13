"use client";

import { useMemo, useState } from "react";
import { FishingBoatIllustration } from "./FisheryIllustrations";

export type StrategyFormState = {
  title: string;
  problems: string[];
  evidence: string;
  action: string;
};

type FeedbackCheck = {
  label: string;
  ok: boolean;
};

export type StrategyFeedback = {
  status: string;
  checks: FeedbackCheck[];
  strengths: string[];
  nextStep: string;
  completeCount: number;
};

const blank: StrategyFormState = { title: "", problems: [], evidence: "", action: "" };
const problemOptions = ["水産資源・とれる量", "漁場・海の環境", "働く人・高齢化", "国内生産と輸入", "品質・届け方"];
const evidenceMarkers = ["資料", "グラフ", "年", "万人", "万t", "％", "%", "減", "増", "学習", "分かった", "漁業生産量", "働く人", "輸入"];
const actorMarkers = ["漁業者", "生産者", "漁協", "研究者", "消費者", "わたしたち", "国", "自治体", "店", "会社", "工場", "運ぶ人"];
const actionMarkers = ["放流", "育て", "守", "減ら", "増や", "選ぶ", "調べ", "研究", "養殖", "規制", "決まり", "協力", "届け", "加工", "取りすぎ"];
const effectMarkers = ["ため", "ことで", "その結果", "つなが", "増え", "減り", "守れる", "続け", "安定", "高め", "食べられ", "手に入", "よくなる"];

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function getStrategyFeedback(form: StrategyFormState): StrategyFeedback {
  const evidence = form.evidence.replace(/\s+/g, "").trim();
  const action = form.action.replace(/\s+/g, "").trim();
  const checks: FeedbackCheck[] = [
    { label: "レスキューしたい課題を選べています。", ok: form.problems.length > 0 },
    { label: "資料や学習した事実を根拠にできています。", ok: evidence.length >= 15 && hasAny(evidence, evidenceMarkers) },
    { label: "だれが、どんな取組をするかが書けています。", ok: action.length >= 25 && hasAny(action, actorMarkers) && hasAny(action, actionMarkers) },
    { label: "取組によって、どうよくなるかまで書けています。", ok: action.length >= 25 && hasAny(action, effectMarkers) },
  ];
  const completeCount = checks.filter((item) => item.ok).length;
  const strengths = checks.filter((item) => item.ok).map((item) => item.label);

  let nextStep = "レスキューしたい課題を一つ選んでみよう。";
  if (form.problems.length > 0 && !checks[1].ok) {
    nextStep = "教科書や資料から、数値の変化や分かった事実を一つ加えてみよう。";
  } else if (checks[1].ok && !hasAny(action, actorMarkers)) {
    nextStep = "『だれが取り組むのか』を加えると、作戦がもっと具体的になるよ。";
  } else if (checks[1].ok && !checks[2].ok) {
    nextStep = "選んだ課題に対して、何をするのかをもう少し具体的に書いてみよう。";
  } else if (checks[2].ok && !checks[3].ok) {
    nextStep = "『そうすることで、どうよくなるか』を続けて書いてみよう。";
  } else if (completeCount === checks.length) {
    nextStep = "よくつながった作戦だね。別の課題にも役立つか考えると、さらに深まるよ。";
  }

  const status = completeCount === checks.length
    ? "作戦がしっかりつながっているよ！"
    : completeCount >= 3
      ? "あと一つで、もっと伝わる作戦になるよ！"
      : "いいスタート！つぎの一歩を見てみよう。";

  return { status, checks, strengths, nextStep, completeCount };
}

export function StrategyChecker() {
  const [form, setForm] = useState<StrategyFormState>(blank);
  const [hasChecked, setHasChecked] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [notice, setNotice] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const feedback = useMemo(() => getStrategyFeedback(form), [form]);

  function set<K extends keyof StrategyFormState>(key: K, value: StrategyFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setShowFeedback(false);
    setNotice("");
    setCopyNotice("");
  }

  function toggleProblem(value: string) {
    const values = form.problems;
    set("problems", values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function checkStrategy() {
    if (form.problems.length === 0) {
      setNotice("まず、レスキューしたい課題を一つ選んでみよう。");
      setShowFeedback(false);
      return;
    }
    if (form.evidence.trim().length + form.action.trim().length < 10) {
      setNotice("資料から分かったことや、考えた取組をもう少し書いてからチェックしよう。");
      setShowFeedback(false);
      return;
    }
    setNotice("");
    setCopyNotice("");
    setHasChecked(true);
    setShowFeedback(true);
  }

  function fillExample() {
    setForm({
      title: "ヒラメすくすく・海も守る作戦",
      problems: ["水産資源・とれる量", "漁場・海の環境"],
      evidence: "資料3から漁業生産量が減っていることと、学習したヒラメの放流では稚魚を育てて海へ戻していることが分かった。",
      action: "漁協や研究者が元気な稚魚を育てて放流し、漁業者がとってよい魚の大きさや量を守る。そうすることで、育つ前の魚を守り、将来とれる魚を増やして水産業を長く続けられるようにする。",
    });
    setShowFeedback(false);
    setNotice("作戦の例を入れました。取組と効果がどのようにつながっているか見てみよう。");
    setCopyNotice("");
  }

  function clearForm() {
    setForm(blank);
    setShowFeedback(false);
    setNotice("");
    setCopyNotice("");
  }

  async function copyDraft() {
    const draft = `【${form.title || "作戦名"}】\nレスキューする課題：${form.problems.join("、") || "未入力"}\n根拠：${form.evidence || "未入力"}\n取組と効果：${form.action || "未入力"}`;
    try {
      await navigator.clipboard.writeText(draft);
      setCopyNotice("発表用の下書きをコピーしました。");
    } catch {
      setCopyNotice("コピーできませんでした。画面の文を見ながら発表の準備をしよう。");
    }
  }

  return (
    <div className="strategy-layout">
      <section className="strategy-form panel">
        <div className="panel-heading"><span>MAKE A PLAN</span><h2>作戦を入力</h2></div>
        <label className="field-label" htmlFor="strategy-title">作戦名</label>
        <input id="strategy-title" value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="自分で作戦名を考えよう" />

        <fieldset>
          <legend>どの課題をレスキューする？</legend>
          <div className="choice-grid">
            {problemOptions.map((option) => <label key={option}><input type="checkbox" checked={form.problems.includes(option)} onChange={() => toggleProblem(option)} /><span>{option}</span></label>)}
          </div>
        </fieldset>

        <label className="field-label" htmlFor="evidence">根拠にする資料・学習した事実</label>
        <textarea id="evidence" rows={4} value={form.evidence} onChange={(event) => set("evidence", event.target.value)} placeholder="資料の数値や変化、これまでに学習した取組などを書こう" />

        <label className="field-label" htmlFor="action">どんな取組で、どんな効果がある？</label>
        <textarea id="action" rows={7} value={form.action} onChange={(event) => set("action", event.target.value)} placeholder="だれが、どんな取組をするのか。その取組によって、課題がどうよくなるのかを書こう" />

        <div className={`form-buttons${hasChecked ? "" : " single-strategy-action"}`}>
          <button className="button button-primary" type="button" onClick={checkStrategy}>作戦をチェック</button>
          {hasChecked && <button className="button button-secondary" type="button" onClick={fillExample}>作戦の例を見る</button>}
          {hasChecked && <button className="button button-ghost" type="button" onClick={clearForm}>すべて消す</button>}
        </div>
        {notice && <p className="notice">{notice}</p>}
        <p className="privacy-note">名前や出席番号は書かず、作戦の内容だけを入れよう。入力内容は保存されません。</p>
      </section>

      <aside className="strategy-check panel" aria-live="polite">
        <div className="sticky-check">
          {!showFeedback ? (
            <div className="strategy-empty-result">
              <FishingBoatIllustration className="strategy-empty-art" />
              <p className="strategy-empty-kicker">STEP 2</p>
              <h2>作戦へのアドバイス</h2>
              <p>自分の作戦を書いて「作戦をチェック」を押すと、よいところと、つぎの一歩が分かります。</p>
            </div>
          ) : (
            <div className={`strategy-feedback feedback-level-${feedback.completeCount}`}>
              <div className="strategy-feedback-mark" aria-hidden="true">✓</div>
              <p className="strategy-status">{feedback.status}</p>

              <h3>作戦のよいところ</h3>
              <ul className="strategy-strengths">
                {(feedback.strengths.length > 0 ? feedback.strengths : ["自分の作戦を書き始めたことが、最初の一歩だよ。"]).map((item) => <li key={item}>{item}</li>)}
              </ul>

              <div className="strategy-next-step">
                <small>つぎの一歩</small>
                <p>{feedback.nextStep}</p>
              </div>

              <div className="strategy-mini-checks" aria-label="作戦のチェックポイント">
                {feedback.checks.map((item) => <div className={item.ok ? "is-ok" : ""} key={item.label}><span aria-hidden="true">{item.ok ? "✓" : "·"}</span><p>{item.label}</p></div>)}
              </div>

              <button className="button button-primary full-button" type="button" onClick={copyDraft}>発表用の下書きをコピー</button>
              {copyNotice && <p className="notice">{copyNotice}</p>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
