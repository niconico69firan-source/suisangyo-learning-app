import { SiteHeader } from "../components/SiteHeader";
import { StrategyChecker } from "../components/StrategyChecker";

export default function StrategyPage() {
  return (
    <main className="site-shell inner-page strategy-page">
      <SiteHeader current="sakusen" />
      <section className="page-intro wrap">
        <p className="eyebrow">TOOL 02 / FINAL TASK</p>
        <h1>水産業作戦チェック</h1>
        <p>レスキューする課題と、根拠・取組・効果が一本につながっているかを確認します。</p>
      </section>
      <div className="wrap"><StrategyChecker /></div>
      <footer className="tool-footer wrap">作戦の正解を一つに決めるものではありません。根拠と立場を明らかにし、対話でよりよくするためのチェックです。</footer>
    </main>
  );
}
