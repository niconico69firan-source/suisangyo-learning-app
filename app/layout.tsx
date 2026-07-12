import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "水産業レスキュー作戦 | 小学5年社会",
  description: "小学5年社会『水産業のさかんな地域』のまとめチェックと水産業レスキュー作戦",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
