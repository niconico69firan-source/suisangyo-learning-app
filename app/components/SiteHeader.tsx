import Link from "next/link";

type Current = "home" | "hyouka" | "sakusen";

export function SiteHeader({ current }: { current: Current }) {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link className="brand" href="/" aria-label="水産業学習ツール ホーム">
          <span className="brand-mark" aria-hidden="true">水</span>
          <span>水産業 学習ツール<small>5年社会</small></span>
        </Link>
        <nav aria-label="主なメニュー">
          <Link aria-current={current === "hyouka" ? "page" : undefined} href="/hyouka">まとめチェック</Link>
          <Link aria-current={current === "sakusen" ? "page" : undefined} href="/sakusen">作戦チェック</Link>
        </nav>
      </div>
    </header>
  );
}
