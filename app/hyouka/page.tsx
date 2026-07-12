import { Evaluator } from "../components/Evaluator";
import { SiteHeader } from "../components/SiteHeader";

export default function EvaluationPage() {
  return (
    <main className="site-shell inner-page">
      <SiteHeader current="hyouka" />
      <section className="page-intro wrap">
        <p className="eyebrow">TOOL 01 / EACH LESSON</p>
        <h1>自分のまとめ ABCチェック</h1>
        <p>自分で書いたまとめを入れると、できているところと「つぎの一歩」が分かります。Bが今日の目標です。</p>
      </section>
      <div className="wrap"><Evaluator /></div>
      <footer className="tool-footer wrap">まとめは一度だけで大丈夫。書き直しはせず、出てきたヒントを次の学習に生かそう。</footer>
    </main>
  );
}
