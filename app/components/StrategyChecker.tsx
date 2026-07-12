"use client";

import { useMemo, useState, type CSSProperties } from "react";

type FormState = {
  title: string;
  problems: string[];
  evidence: string;
  action: string;
  actors: string[];
  effect: string;
  concern: string;
};

const blank: FormState = { title: "", problems: [], evidence: "", action: "", actors: [], effect: "", concern: "" };
const problemOptions = ["水産資源・とれる量", "漁場・海の環境", "働く人・高齢化", "国内生産と輸入", "品質・届け方"];
const actorOptions = ["漁業者・生産者", "消費者・わたしたち", "国・自治体", "研究者・漁協", "販売・加工・運輸"];
const evidenceMarkers = ["資料", "グラフ", "年", "万人", "減", "増", "学習", "分かった", "漁業生産量", "働く人"];
const effectMarkers = ["ため", "ことで", "つなが", "増", "減", "守", "続", "安定", "高め"];

function hasAny(text: string, words: string[]) { return words.some((word) => text.includes(word)); }

export function StrategyChecker() {
  const [form, setForm] = useState<FormState>(blank);
  const [notice, setNotice] = useState("");

  const checks = useMemo(() => [
    { label: "解決したい課題が具体的", ok: form.problems.length > 0 },
    { label: "学習した資料・事実が根拠", ok: form.evidence.trim().length >= 20 && hasAny(form.evidence, evidenceMarkers) },
    { label: "課題に合う取組を説明", ok: form.action.trim().length >= 25 },
    { label: "だれが何をするか明確", ok: form.actors.length > 0 && form.action.trim().length >= 25 },
    { label: "取組の効果まで説明", ok: form.effect.trim().length >= 18 && hasAny(form.effect, effectMarkers) },
    { label: "別の立場・心配にも着目", ok: form.actors.length >= 2 || form.concern.trim().length >= 18 },
  ], [form]);

  const score = checks.filter((item) => item.ok).length;
  const status = score >= 6 ? "作戦OK！" : score >= 4 ? "あと一歩！" : "ここからよくなる！";

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function toggle(key: "problems" | "actors", value: string) {
    const values = form[key];
    set(key, values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }
  function fillExample() {
    setForm({
      title: "ヒラメすくすく・海も守る作戦",
      problems: ["水産資源・とれる量", "漁場・海の環境"],
      evidence: "資料3から漁業生産量が減っていること、学習したヒラメの放流から稚魚を育てて海へ戻す取組があることが分かった。",
      action: "漁協や研究者が元気な稚魚を育てて放流し、漁業者はとってよい魚の大きさや量を守る。消費者も資源に配慮した水産物を選ぶ。",
      actors: ["漁業者・生産者", "消費者・わたしたち", "研究者・漁協"],
      effect: "育つ前の魚を守りながら将来とれる魚を増やし、水産資源と漁業者の仕事を長く続けやすくする。",
      concern: "放流するだけでなく、魚が育つ海の環境や費用、放流後にどれだけ生き残るかも確かめる必要がある。",
    });
    setNotice("");
  }
  async function copyDraft() {
    const draft = `【${form.title || "作戦名"}】\n解決したい課題：${form.problems.join("、") || "未入力"}\n根拠：${form.evidence || "未入力"}\n作戦：${form.action || "未入力"}\n取り組む人：${form.actors.join("、") || "未入力"}\n期待する効果：${form.effect || "未入力"}\n心配な点・工夫：${form.concern || "未入力"}`;
    await navigator.clipboard.writeText(draft);
    setNotice("発表用の下書きをコピーしました。");
  }

  return (
    <div className="strategy-layout">
      <section className="strategy-form panel">
        <div className="panel-heading"><span>MAKE A PLAN</span><h2>作戦を入力</h2></div>
        <label className="field-label" htmlFor="strategy-title">作戦名</label>
        <input id="strategy-title" value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="例：ヒラメすくすく・海も守る作戦" />

        <fieldset>
          <legend>どの課題をレスキューする？</legend>
          <div className="choice-grid">
            {problemOptions.map((option) => <label key={option}><input type="checkbox" checked={form.problems.includes(option)} onChange={() => toggle("problems", option)} /><span>{option}</span></label>)}
          </div>
        </fieldset>

        <label className="field-label" htmlFor="evidence">根拠にする資料・学習した事実</label>
        <textarea id="evidence" rows={4} value={form.evidence} onChange={(event) => set("evidence", event.target.value)} placeholder="資料番号、変化、数値、これまでに学習した取組など" />

        <label className="field-label" htmlFor="action">どんな取組をする？</label>
        <textarea id="action" rows={5} value={form.action} onChange={(event) => set("action", event.target.value)} placeholder="だれが、何を、どのようにするかを書きます。" />

        <fieldset>
          <legend>作戦に関わる人</legend>
          <div className="choice-grid">
            {actorOptions.map((option) => <label key={option}><input type="checkbox" checked={form.actors.includes(option)} onChange={() => toggle("actors", option)} /><span>{option}</span></label>)}
          </div>
        </fieldset>

        <label className="field-label" htmlFor="effect">どんな効果がある？</label>
        <textarea id="effect" rows={4} value={form.effect} onChange={(event) => set("effect", event.target.value)} placeholder="この取組によって、課題がどう改善するか" />

        <label className="field-label" htmlFor="concern">心配な点・さらに必要な工夫</label>
        <textarea id="concern" rows={3} value={form.concern} onChange={(event) => set("concern", event.target.value)} placeholder="費用、環境、別の立場から見た心配など" />

        <div className="form-buttons">
          <button className="button button-secondary" type="button" onClick={fillExample}>例を入れる</button>
          <button className="button button-ghost" type="button" onClick={() => { setForm(blank); setNotice(""); }}>すべて消す</button>
        </div>
      </section>

      <aside className="strategy-check panel" aria-live="polite">
        <div className="sticky-check">
          <div className="score-ring" style={{ "--progress": `${(score / checks.length) * 360}deg` } as CSSProperties}>
            <div><strong>{score}</strong><span>/ {checks.length}</span></div>
          </div>
          <p className={`strategy-status status-${score >= 6 ? "ok" : score >= 4 ? "mid" : "low"}`}>{status}</p>
          <div className="check-list">
            {checks.map((item) => <div className={item.ok ? "is-ok" : ""} key={item.label}><span aria-hidden="true">{item.ok ? "✓" : "·"}</span><p>{item.label}</p></div>)}
          </div>
          {score < 6 && <div className="advice-box"><small>つぎに足すとよいところ</small><p>{checks.find((item) => !item.ok)?.label}</p></div>}
          {notice && <p className="notice">{notice}</p>}
          <button className="button button-primary full-button" type="button" onClick={copyDraft}>発表用の下書きをコピー</button>
          <p className="privacy-note">入力内容は保存されません。児童名などの個人情報は入力しないでください。</p>
        </div>
      </aside>
    </div>
  );
}
