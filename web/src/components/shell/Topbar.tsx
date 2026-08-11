"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, Share2, Sparkles } from "lucide-react";

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
  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-ink-950/70 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 md:px-8">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5">
          <Sparkles className="size-3.5 text-[#22d3ee]" />
          <span className="text-[11.5px] tracking-wide text-slate-300">
            Morning Brief · ก่อนตลาดเปิด
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-[12.5px] text-slate-200 transition hover:border-[#ffc53d]/40 hover:bg-[#ffc53d]/8">
            <CalendarDays className="size-4 text-[#ffc53d]" />
            <span className="font-semibold text-[#ffc53d]">{dateLabel}</span>
            <ChevronDown className="size-3.5 text-slate-500 transition group-hover:text-slate-300" />
          </button>
          <button className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-[12.5px] text-slate-300 transition hover:border-white/20 hover:text-white sm:flex">
            <Share2 className="size-4" />
            แชร์ให้ลูกค้า
          </button>
        </div>
      </div>

      <nav className="scroll-slim flex gap-1.5 overflow-x-auto px-4 pb-3 md:hidden">
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
