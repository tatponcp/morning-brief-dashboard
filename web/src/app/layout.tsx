import type { Metadata } from "next";
import { Anuphan, Sora } from "next/font/google";
import "./globals.css";

const thai = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-thai",
  display: "swap",
});

const display = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Morning Brief · S50 Signal Dashboard",
  description:
    "อ่าน 6 ชุดข้อมูลก่อนตลาดเปิด — S50 Futures + OI, Flow ต่างชาติ/กองทุน, USD Futures, Confirm Up/Down, Market Breadth และ Global Macro",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${thai.variable} ${display.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
