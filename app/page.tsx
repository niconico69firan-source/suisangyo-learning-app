import Link from "next/link";
import { SiteHeader } from "./components/SiteHeader";

export default function Home() {
  return (
    <main className="site-shell">
      <SiteHeader current="home" />

      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">小学5年社会・水産業のさかんな地域</p>
          <h1>
            学びを見取り、<br />
            <span>次の一歩へ。</span>
          </h1>
          <p className="hero-lead">
            毎時間のまとめをA・B・Cで見取るツールと、単元のゴール「水産業レスキュー作戦」を点検するツールです。
          </p>
          <div className="hero-notes" aria-label="利用上の注意">
            <span>入力内容は保存しません</span>
            <span>児童名は入力しないでください</span>
          </div>
        </div>

        <div className="hero-board" aria-label="単元の学習サイクル">
          <div className="board-label">LEARNING CYCLE</div>
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
            <h2>毎時間まとめ<br />ABC評価</h2>
            <p>本時のねらいに合わせて、根拠・関連付け・理解の深まりを見取ります。</p>
          </div>
          <span className="card-arrow" aria-hidden="true">→</span>
        </Link>

        <Link className="tool-card tool-card-coral" href="/sakusen">
          <span className="tool-number">02</span>
          <div>
            <p className="card-kicker">FOR THE FINAL TASK</p>
            <h2>水産業作戦<br />チェック</h2>
            <p>課題・根拠・取組・効果のつながりを確認し、発表用の文章に整えます。</p>
          </div>
          <span className="card-arrow" aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="principles wrap">
        <div>
          <p className="eyebrow">大切にしていること</p>
          <h2>判定で終わらず、問い返しへ。</h2>
        </div>
        <div className="principle-list">
          <p><b>1</b><span><strong>Bが本時の到達目標</strong>です。Aは量ではなく、関連付けや意味の深まりで判断します。</span></p>
          <p><b>2</b><span>自動判定は<strong>教師の見取りを支える補助</strong>です。評定・指導要録へ自動反映しません。</span></p>
          <p><b>3</b><span>児童へはA・B・Cよりも、<strong>次に考える問い</strong>を返せるようにしています。</span></p>
        </div>
      </section>
    </main>
  );
}
