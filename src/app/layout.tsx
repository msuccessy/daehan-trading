import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-notoSans",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "대한무역 | DAEHAN TRADING",
  description: "글로벌 중고폰 수출 무역의 새로운 기준, 대한무역입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${notoSansKR.variable}`}>
        {children}
      </body>
    </html>
  );
}
