import Link from "next/link";
import { FishSchoolIllustration, FishingBoatIllustration, RescueHeroIllustration } from "./components/FisheryIllustrations";
import { SiteHeader } from "./components/SiteHeader";

export default function Home() {
  return (
    <main className="site-shell">
      <SiteHeader current="home" />

      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">小学5年社会・水産業のさかんな地域</p>
          <h1 className="rescue-title">
            <span className="rescue-kicker">未来の魚を守れ！</span>
            <span className="rescue-main"><em>水産業</em><br />レスキュー作戦</span>
          </h1>
          <p className="hero-lead">
            資料から水産業の困ったことを見付け、考えをつなぎ、未来の魚を守る作戦を考えよう。
          </p>
          <div className="hero-notes" aria-label="利用上の注意">
            <span>入力内容は保存しません</span>
            <span>児童名は入力しないでください</span>
          </div>
        </div>

        <div className="hero-board rescue-hero-board" aria-label="水産業レスキュー作戦の学習サイクル">
          <div className="board-label">MISSION / 水産業を未来へつなごう</div>
          <RescueHeroIllustration className="rescue-hero-illustration" />
          <div className="cycle-row">
            <div><b>01</b><span>資料を読む</span></div>
            <i aria-hidden="true">→</i>
            <div><b>02</b><span>考えをつなぐ</span></div>
            <i aria-hidden="true">→</i>
            <div><b>03</b><span>作戦にする</span></div>
          </div>
          <p>資料の事実 → 課題のつながり → よりよい水産業</p>
        </div>
      </section>

      <section className="tool-grid wrap" aria-label="二つのツール">
        <Link className="tool-card tool-card-blue" href="/hyouka">
          <span className="tool-number">01</span>
          <div>
            <p className="card-kicker">FOR EACH LESSON</p>
            <h2>自分のまとめ<br />ABCチェック</h2>
            <p>できているところと、次の学習で考えるヒントを確かめます。</p>
          </div>
          <FishSchoolIllustration className="tool-card-art tool-card-fish" />
          <span className="card-arrow" aria-hidden="true">→</span>
        </Link>

        <Link className="tool-card tool-card-coral" href="/sakusen">
          <span className="tool-number">02</span>
          <div>
            <p className="card-kicker">FOR THE FINAL TASK</p>
            <h2>水産業作戦<br />チェック</h2>
            <p>課題・根拠・取組・効果のつながりを確認し、発表用の文章に整えます。</p>
          </div>
          <FishingBoatIllustration className="tool-card-art tool-card-boat" />
          <span className="card-arrow" aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="principles wrap">
        <div>
          <p className="eyebrow">大切にしていること</p>
          <h2>今日の学びを、次の一歩へ。</h2>
        </div>
        <div className="principle-list">
          <p><b>1</b><span><strong>Bが今日の目標</strong>です。Aは文章の長さではなく、つながりや見方の深まりです。</span></p>
          <p><b>2</b><span>資料・友達の考え・板書を手がかりに、<strong>困ったことのつながり</strong>を考えよう。</span></p>
          <p><b>3</b><span>できているところを自信にして、<strong>つぎの一歩</strong>を次の学習で意識しよう。</span></p>
        </div>
      </section>
    </main>
  );
}
