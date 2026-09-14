"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CornerDownLeft, Search } from "lucide-react";
import { ACCENT, type Accent } from "@/lib/accent";

type Entry = { href: string; label: string; hint: string; accent: Accent; keys: string; external?: boolean };

const ENTRIES: Entry[] = [
  { href: "/", label: "สรุปภาพรวม", hint: "Action วันนี้", accent: "cyan", keys: "summary sarup ภาพรวม" },
  { href: "/s50-oi", label: "1 · S50 Futures + Open Interest", hint: "TQ Pro · SET", accent: "cyan", keys: "s50 oi open interest" },
  { href: "/flows", label: "2 · สะสม Long / Short", hint: "ต่างชาติ · กองทุน", accent: "green", keys: "flow long short foreign fund" },
  { href: "/usd-futures", label: "3 · USD Futures Flow", hint: "VM", accent: "sky", keys: "usd dollar bath" },
  { href: "/confirm", label: "4 · Confirm Up / Down S50", hint: "Website", accent: "amber", keys: "confirm trend" },
  { href: "/breadth", label: "5 · Market Breadth SET50", hint: "Indy 2090", accent: "violet", keys: "breadth ma200 rsi" },
  { href: "/macro", label: "6 · Global Macro Signals", hint: "Gold · VIX · DXY", accent: "rose", keys: "macro gold vix dxy bond" },
  { href: "https://s50-dashboard.vercel.app/", label: "S50 Options · OI เชิงลึก ↗", hint: "OI รายสไตรค์ · Max Pain · PCR · IV (เปิดแท็บใหม่)", accent: "cyan", keys: "options oi strike max pain pcr iv ออปชัน", external: true },
];

/** เปิด entry — ลิงก์นอกเว็บเปิดแท็บใหม่ ลูกค้าจะได้ไม่หลุดจาก Morning Brief */
function openEntry(e: Entry, push: (href: string) => void) {
  if (e.external) window.open(e.href, "_blank", "noopener,noreferrer");
  else push(e.href);
}

/**
 * กด Ctrl+K เพื่อค้นหาและกระโดดไป section ที่ต้องการ
 * และกดเลข 1-6 ได้ตรง ๆ เมื่อไม่ได้อยู่ในช่องกรอกข้อความ
 */
export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ENTRIES;
    return ENTRIES.filter(
      (e) =>
        e.label.toLowerCase().includes(s) ||
        e.hint.toLowerCase().includes(s) ||
        e.keys.includes(s),
    );
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setCursor(0);
        return;
      }

      // เลข 1-6 ข้ามไป section ได้ แต่ต้องไม่ทับคีย์ลัดอื่น
      // และไม่ทำงานใน /studio เพราะที่นั่นใช้ Alt+1-6 สลับ section ของตัวเอง
      if (
        !open &&
        !typing &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !pathname.startsWith("/studio") &&
        /^[1-6]$/.test(e.key)
      ) {
        router.push(ENTRIES[Number(e.key)].href);
        return;
      }

      if (!open) return;

      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (e.key === "Enter" && results[cursor]) {
        openEntry(results[cursor], router.push);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, cursor, router, pathname]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/80 px-4 pt-[12vh] backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="panel w-full max-w-lg overflow-hidden"
          >
            <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-3">
              <Search className="size-4 text-slate-500" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setCursor(0);
                }}
                placeholder="ค้นหา section… (เช่น ทอง, breadth, ต่างชาติ)"
                className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-slate-600"
              />
              <kbd className="rounded border border-white/12 px-1.5 py-0.5 text-[10px] text-slate-500">
                Esc
              </kbd>
            </div>

            <div className="scroll-slim max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <p className="px-3 py-6 text-center text-[13px] text-slate-500">ไม่พบ section ที่ค้นหา</p>
              )}
              {results.map((e, i) => {
                const a = ACCENT[e.accent];
                return (
                  <button
                    key={e.href}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => {
                      openEntry(e, router.push);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      i === cursor ? "bg-white/8" : "hover:bg-white/4"
                    }`}
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: a.hex }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-slate-100">{e.label}</span>
                      <span className="block truncate text-[11px] text-slate-500">{e.hint}</span>
                    </span>
                    {i === cursor && <CornerDownLeft className="size-3.5 shrink-0 text-slate-500" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 border-t border-white/8 px-4 py-2 text-[10.5px] text-slate-600">
              <span>↑ ↓ เลือก</span>
              <span>Enter เปิด</span>
              <span className="ml-auto">กดเลข 1-6 ข้ามไป section ได้เลย</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
