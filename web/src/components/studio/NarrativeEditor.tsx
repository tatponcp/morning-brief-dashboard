"use client";

import { CheckCircle2, MessageSquareText, Plus, Trash2, Zap } from "lucide-react";
import { toneOf } from "@/lib/accent";
import type { Bias, Narrative } from "@/lib/types";

const TONES: { key: Bias; label: string }[] = [
  { key: "bull", label: "บวก" },
  { key: "neutral", label: "กลาง" },
  { key: "bear", label: "ลบ" },
];

/** หัวข้อ Action ที่ IC ใช้บ่อย — กดเพิ่มได้เลยไม่ต้องพิมพ์ */
const ACTION_PRESETS = [
  "สินค้าที่เด่น",
  "มุมมอง",
  "โซนเฝ้าดู",
  "สัญญาณเฝ้าดู",
  "ถ้ายืนได้",
  "ถ้าหลุด",
];

export function NarrativeEditor({
  value,
  onChange,
}: {
  value: Narrative;
  onChange: (patch: Partial<Narrative>) => void;
}) {
  return (
    <div className="space-y-3">
      {/* 1 สรุปสั้น */}
      <Block title="สรุปสั้น" step="1" color="var(--c-cyan)" icon={<CheckCircle2 className="size-4" />}>
        <div className="space-y-2">
          {value.summary.map((s, i) => (
            <div key={i} className="flex gap-2">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-cyan-neon" />
              <input
                value={s}
                placeholder={`บูลเล็ตที่ ${i + 1}`}
                onChange={(e) =>
                  onChange({ summary: value.summary.map((x, j) => (j === i ? e.target.value : x)) })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onChange({ summary: [...value.summary, ""] });
                  }
                }}
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-[13.5px] text-slate-100 outline-none focus:border-cyan-neon/60"
              />
              <IconBtn onClick={() => onChange({ summary: value.summary.filter((_, j) => j !== i) })} />
            </div>
          ))}
          <AddBtn onClick={() => onChange({ summary: [...value.summary, ""] })}>
            เพิ่มบูลเล็ต (หรือกด Enter)
          </AddBtn>
        </div>
      </Block>

      {/* 2 แปลความ */}
      <Block
        title="แปลความ"
        step="2"
        color="var(--c-violet)"
        icon={<MessageSquareText className="size-4" />}
        hint={`${value.interpretation.length} ตัวอักษร`}
      >
        <textarea
          value={value.interpretation}
          onChange={(e) => onChange({ interpretation: e.target.value })}
          rows={5}
          placeholder="ภาพนี้แปลว่าอะไร ตลาดกำลังบอกอะไร"
          className="w-full resize-y rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2.5 text-[13.5px] leading-relaxed text-slate-100 outline-none focus:border-violet-neon/60"
        />
      </Block>

      {/* 3 Action */}
      <Block title="Action วันนี้" step="3" color="var(--c-amber)" icon={<Zap className="size-4" />}>
        <div className="space-y-2">
          {value.actions.map((act, i) => (
            <div key={i} className="flex flex-wrap gap-1.5">
              <input
                value={act.label}
                placeholder="หัวข้อ"
                onChange={(e) =>
                  onChange({
                    actions: value.actions.map((x, j) =>
                      j === i ? { ...x, label: e.target.value } : x,
                    ),
                  })
                }
                className="w-32 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-2 text-[12.5px] text-slate-300 outline-none focus:border-amber-neon/60"
              />
              <input
                value={act.value}
                placeholder="ค่า"
                onChange={(e) =>
                  onChange({
                    actions: value.actions.map((x, j) =>
                      j === i ? { ...x, value: e.target.value } : x,
                    ),
                  })
                }
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-[13.5px] text-slate-100 outline-none focus:border-amber-neon/60"
              />
              <ToneToggle
                value={act.tone ?? "neutral"}
                onChange={(tone) =>
                  onChange({
                    actions: value.actions.map((x, j) => (j === i ? { ...x, tone } : x)),
                  })
                }
              />
              <IconBtn onClick={() => onChange({ actions: value.actions.filter((_, j) => j !== i) })} />
            </div>
          ))}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {ACTION_PRESETS.filter((p) => !value.actions.some((a) => a.label === p)).map((p) => (
              <button
                key={p}
                onClick={() =>
                  onChange({ actions: [...value.actions, { label: p, value: "", tone: "neutral" }] })
                }
                className="rounded-full border border-dashed border-white/15 px-2.5 py-1 text-[11.5px] text-slate-400 transition hover:border-amber-neon/50 hover:text-amber-neon"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>
      </Block>

      {/* Insight */}
      <Block title="Insight ปิดท้าย" step="4" color="var(--c-green)" icon={<Zap className="size-4" />}>
        <input
          value={value.insight}
          placeholder="ประโยคเดียวที่อยากให้ลูกค้าจำกลับไป"
          onChange={(e) => onChange({ insight: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2.5 text-[13.5px] text-slate-100 outline-none focus:border-green-neon/60"
        />
      </Block>
    </div>
  );
}

function Block({
  title,
  step,
  color,
  icon,
  hint,
  children,
}: {
  title: string;
  step: string;
  color: string;
  icon: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel px-4 py-3" style={{ borderColor: `color-mix(in srgb, ${color} 18%, transparent)` }}>
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className="grid size-6 place-items-center rounded-md"
          style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
        >
          {icon}
        </span>
        <p className="font-display text-[14px] font-bold" style={{ color }}>
          <span className="mr-1 opacity-50">{step}</span>
          {title}
        </p>
        {hint && <span className="ml-auto text-[11px] text-slate-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ToneToggle({ value, onChange }: { value: Bias; onChange: (t: Bias) => void }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-white/10">
      {TONES.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-2 py-2 text-[11px] transition ${
            value === t.key
              ? `${toneOf(t.key).bg} ${toneOf(t.key).text}`
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function IconBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="ลบรายการนี้"
      className="rounded-lg border border-white/8 px-2 text-slate-500 transition hover:border-rose-neon/40 hover:text-rose-neon"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-1.5 text-[12px] text-slate-400 transition hover:border-white/30 hover:text-white"
    >
      <Plus className="size-3.5" />
      {children}
    </button>
  );
}
