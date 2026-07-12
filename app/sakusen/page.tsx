import { SiteHeader } from "../components/SiteHeader";
import { FishingBoatIllustration } from "../components/FisheryIllustrations";
import { StrategyChecker } from "../components/StrategyChecker";

export default function StrategyPage() {
  return (
    <main className="site-shell inner-page strategy-page">
      <SiteHeader current="sakusen" />
      <section className="page-intro page-intro-grid wrap">
        <div>
          <p className="eyebrow">FINAL MISSION / 考えた作戦を点検しよう</p>
          <h1 className="page-rescue-title"><span>水産業レスキュー作戦</span><small>作戦チェック</small></h1>
          <p>レスキューする課題と、根拠・取組・効果が一本につながっているかを確認します。</p>
        </div>
        <FishingBoatIllustration className="page-intro-art boat-intro-art" />
      </section>
      <div className="wrap"><StrategyChecker /></div>
      <footer className="tool-footer wrap">作戦の正解を一つに決めるものではありません。根拠と立場を明らかにし、対話でよりよくするためのチェックです。</footer>
    </main>
  );
}
