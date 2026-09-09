"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Check, Link2, Search, Sparkles } from "lucide-react";

const MOBILE = [
  { href: "/", label: "สรุป" },
  { href: "/s50-oi", label: "1 · S50+OI" },
  { href: "/flows", label: "2 · Flow" },
  { href: "/usd-futures", label: "3 · USD" },
  { href: "/confirm", label: "4 · Confirm" },
  { href: "/breadth", label: "5 · Breadth" },
  { href: "/macro", label: "6 · Macro" },
];

export function Topbar({ dateLabel }: { dateLabel: string }) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* บางเบราว์เซอร์ไม่ให้สิทธิ์ clipboard — ปล่อยผ่าน */
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-ink-950/70 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-2 md:px-6">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5">
          <Sparkles className="size-3.5 text-[#22d3ee]" />
          <span className="text-[11.5px] tracking-wide text-slate-300">
            Morning Brief · ก่อนตลาดเปิด
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() =>
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
            }
            title="ค้นหา section (Ctrl+K)"
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-[12.5px] text-slate-400 transition hover:border-white/20 hover:text-white sm:flex"
          >
            <Search className="size-3.5" />
            ค้นหา
            <kbd className="rounded border border-white/12 px-1 text-[10px]">Ctrl K</kbd>
          </button>
          <span
            title="วันที่ของข้อมูลที่กำลังแสดง"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-[12.5px]"
          >
            <CalendarDays className="size-4 text-[#ffc53d]" />
            <span className="font-semibold text-[#ffc53d]">{dateLabel}</span>
          </span>
          <button
            onClick={copyLink}
            title="คัดลอกลิงก์หน้านี้ไปส่งให้ลูกค้า"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-[12.5px] text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="size-4 text-[#34f5a0]" />
                <span className="hidden sm:inline">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Link2 className="size-4" />
                <span className="hidden sm:inline">คัดลอกลิงก์</span>
              </>
            )}
          </button>
        </div>
      </div>

      <nav className="scroll-slim flex gap-1.5 overflow-x-auto px-4 pb-2 md:hidden">
        {MOBILE.map((m) => {
          const active = pathname === m.href;
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] transition ${
                active
                  ? "border-[#22d3ee]/50 bg-[#22d3ee]/12 text-[#22d3ee]"
                  : "border-white/10 bg-white/3 text-slate-400"
              }`}
            >
              {m.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
