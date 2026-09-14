"use client";

import { Check, CircleDashed } from "lucide-react";
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
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="group flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition lg:w-full"
            style={{
              borderColor: on ? a.hex : "rgba(148,163,184,0.14)",
              background: on ? a.soft : "var(--c-hover)",
            }}
          >
            <span
              className="grid size-6 shrink-0 place-items-center rounded-md font-display text-[11px] font-bold"
              style={{ background: on ? a.hex : "var(--c-hover)", color: on ? "var(--ink-950)" : a.hex }}
            >
              {s.index}
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-[12.5px] ${on ? "font-semibold text-white" : "text-slate-300"}`}
              >
                {s.title}
              </span>
              <span className="hidden text-[11px] text-slate-400 lg:block">
                {st.complete ? "กรอกครบแล้ว" : `เหลือ ${st.missing.length} ช่อง`}
              </span>
            </span>

            {st.complete ? (
              <Check className="size-4 shrink-0 text-green-neon" />
            ) : (
              <CircleDashed className="size-4 shrink-0 text-slate-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}
