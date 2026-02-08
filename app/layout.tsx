import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "キーボード・マウステスター",
  description: "キーボードとマウスの入力をテストするためのツール。チャタリング検出にも対応。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
