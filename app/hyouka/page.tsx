import { Evaluator } from "../components/Evaluator";
import { FishSchoolIllustration } from "../components/FisheryIllustrations";
import { SiteHeader } from "../components/SiteHeader";

export default function EvaluationPage() {
  return (
    <main className="site-shell inner-page">
      <SiteHeader current="hyouka" />
      <section className="page-intro page-intro-grid wrap">
        <div>
          <p className="eyebrow">MISSION 01 / まとめから作戦のヒントを見付けよう</p>
          <h1 className="page-rescue-title"><span>水産業レスキュー作戦</span><small>自分のまとめ ABCチェック</small></h1>
          <p>自分で書いたまとめを入れると、できているところと「つぎの一歩」が分かります。Bが今日の目標です。</p>
        </div>
        <FishSchoolIllustration className="page-intro-art" />
      </section>
      <div className="wrap"><Evaluator /></div>
      <footer className="tool-footer wrap">名前や出席番号は入力せず、できているところと「つぎの一歩」を確かめよう。</footer>
    </main>
  );
}
