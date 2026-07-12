import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "水産業 学習・評価ツール",
  description: "小学5年社会『水産業のさかんな地域』のまとめ評価と作戦チェック",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
