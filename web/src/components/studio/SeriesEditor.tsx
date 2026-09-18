"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { seriesList } from "@/lib/signal-forms";

/**
 * Series ที่อยู่ในภาพข้อ 1 — ช่วงย้ายสัญญาภาพเดียวอาจมี 2 series (เช่น S50U26 และ S50Z26)
 * series แรกคือตัวหลัก ใช้ตัดสินสถานการณ์ · dropdown จะมีชุดราคา/OI ให้ทุก series
 */
export function SeriesEditor({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const list = seriesList(value);
  const [draft, setDraft] = useState("");

  const commit = (next: string[]) => onChange(next.join(" / "));
  const add = () => {
    const s = draft.trim().toUpperCase();
    if (!s || list.includes(s)) return setDraft("");
    commit([...list, s]);
    setDraft("");
  };

  return (
    <div className="sm:col-span-2">
      <span className="mb-1 block text-[11.5px] text-slate-400">
        Series ในภาพ · ตัวแรกคือตัวหลัก · ช่วงย้ายสัญญาเพิ่มได้หลาย series
      </span>
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-ink-950/60 px-2 py-1.5">
        <AnimatePresence initial={false}>
          {list.map((s, i) => (
            <motion.span
              key={s}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-semibold ${
                i === 0 ? "bg-cyan-neon/15 text-cyan-neon" : "bg-white/8 text-slate-200"
              }`}
            >
              {i === 0 && <span className="text-[10.5px] font-normal opacity-70">หลัก</span>}
              {s}
              {i > 0 && (
                <button
                  type="button"
                  title="ตั้งเป็นตัวหลัก"
                  onClick={() => commit([s, ...list.filter((x) => x !== s)])}
                  className="ml-0.5 text-[10.5px] font-normal text-slate-400 hover:text-cyan-neon"
                >
                  ↑หลัก
                </button>
              )}
              <button
                type="button"
                aria-label={`เอา ${s} ออก`}
                onClick={() => commit(list.filter((x) => x !== s))}
                className="ml-0.5 rounded p-0.5 text-slate-400 hover:bg-rose-neon/15 hover:text-rose-neon"
              >
                <X className="size-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={list.length ? "เพิ่ม series เช่น S50Z26" : "S50U26"}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-[13.5px] text-white outline-none placeholder:text-slate-600"
        />
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[12px] text-slate-300 transition hover:border-cyan-neon/50 hover:text-cyan-neon"
        >
          <Plus className="size-3.5" />
          เพิ่ม
        </button>
      </div>
    </div>
  );
}
