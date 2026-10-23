import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONE STUDIO",
  description: "포즈 프레임과 함께 만드는 네 컷의 순간",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
