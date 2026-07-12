import { Evaluator } from "../components/Evaluator";
import { SiteHeader } from "../components/SiteHeader";

export default function EvaluationPage() {
  return (
    <main className="site-shell inner-page">
      <SiteHeader current="hyouka" />
      <section className="page-intro wrap">
        <p className="eyebrow">TOOL 01 / EACH LESSON</p>
        <h1>毎時間まとめ ABC評価</h1>
        <p>無料ルーブリック判定、または月額上限付きのGPT-5.4 nano精査で文章を見取り、評価理由と「次に考える問い」を返します。Bが本時の目標です。</p>
      </section>
      <div className="wrap"><Evaluator /></div>
      <footer className="tool-footer wrap">自動判定は補助資料です。児童の発言・ノート・学習過程を合わせて教師が最終判断してください。</footer>
    </main>
  );
}
