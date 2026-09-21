"use client";

import { motion } from "motion/react";
import { Check, CircleDashed } from "lucide-react";
import { toneOf } from "@/lib/accent";
import { displayTitle } from "@/lib/section-title";
import { ACCENT } from "@/lib/accent";
import { draftStatus } from "@/lib/draft-status";
import type { DraftMap } from "@/lib/drafts";
import type { Section } from "@/lib/types";

/** แถบเลือก section พร้อมบอกว่าอันไหนกรอกครบแล้ว */
export function SectionRail({
  sections,
  drafts,
  activeId,
  onSelect,
}: {
  sections: Section[];
  drafts: DraftMap;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="scroll-slim flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {sections.map((s) => {
        const a = ACCENT[s.accent];
        const on = s.id === activeId;
        const st = draftStatus(s, drafts[s.id]);
        return (
          <motion.button
            key={s.id}
            onClick={() => onSelect(s.id)}
            whileHover={{ x: on ? 0 : 3 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex shrink-0 items-center gap-3 rounded-2xl border border-white/8 bg-[var(--c-hover)] px-3.5 py-3 text-left lg:w-full"
          >
            {on && (
              <motion.span
                layoutId="studio-rail"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
                className="absolute inset-0 rounded-2xl border"
                style={{ borderColor: a.hex, background: a.soft }}
              />
            )}
            <span
              className="relative grid size-8 shrink-0 place-items-center rounded-lg font-display text-[14px] font-bold"
              style={{ background: on ? a.hex : "var(--c-hover)", color: on ? "var(--ink-950)" : a.hex }}
            >
              {s.index}
            </span>

            <span className="relative min-w-0 flex-1">
              <span
                className={`block truncate text-[14px] ${on ? "font-semibold text-white" : "text-slate-300"}`}
              >
                {displayTitle(drafts[s.id]?.title || s.title, drafts[s.id]?.series)}
              </span>
              <span className="hidden truncate text-[12.5px] lg:block">
                {drafts[s.id]?.scenario ? (
                  <span className={toneOf(drafts[s.id].scenario!.bias).text}>{drafts[s.id].scenario!.title}</span>
                ) : (
                  <span className="text-slate-400">
                    {st.complete ? "กรอกครบแล้ว" : `เหลือ ${st.missing.length} ช่อง`}
                  </span>
                )}
              </span>
            </span>

            {st.complete ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative">
                <Check className="size-5 shrink-0 text-green-neon" />
              </motion.span>
            ) : (
              <CircleDashed className="relative size-5 shrink-0 text-slate-600" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
