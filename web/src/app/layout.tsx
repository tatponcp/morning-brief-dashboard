import type { Metadata, Viewport } from "next";
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

const DESCRIPTION =
  "อ่าน 6 ชุดข้อมูลก่อนตลาดเปิด — S50 Futures + OI, Flow ต่างชาติ/กองทุน, USD Futures, Confirm Up/Down, Market Breadth และ Global Macro";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://morning-brief-dashboard-delta.vercel.app",
  ),
  title: {
    default: "Morning Brief · S50 Signal Dashboard",
    template: "%s · Morning Brief",
  },
  description: DESCRIPTION,
  applicationName: "Morning Brief",
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "Morning Brief",
    title: "Morning Brief · S50 Signal Dashboard",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#04070e",
  colorScheme: "dark",
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
