import type { Metadata, Viewport } from "next";
import { Anuphan, Sora } from "next/font/google";
import "./globals.css";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/lib/theme";

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
  themeColor: THEME_COLORS.dark,
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-theme ถูกตั้งโดยสคริปต์ก่อน React hydrate จึงต่างจาก HTML ที่ server ส่งมาได้
    <html lang="th" className={`${thai.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
