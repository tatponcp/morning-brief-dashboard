"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Minus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { toneOf } from "@/lib/accent";
import { bandOf } from "@/lib/market-score";
import { optionOf, type SignalForm as Form, type SignalOption } from "@/lib/signal-forms";
import type { Bias } from "@/lib/types";

const ICON: Record<Bias, React.ReactNode> = {
  bull: <TrendingUp className="size-4" />,
  neutral: <Minus className="size-4" />,
  bear: <TrendingDown className="size-4" />,
};

const ease = [0.16, 1, 0.3, 1] as const;

/** เลือกทิศทางของแต่ละตัวในภาพ ระบบสรุปและให้คะแนนทันทีเมื่อครบ */
export function SignalForm({
  form,
  values,
  onChange,
}: {
  form: Form;
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const done = form.fields.filter((f) => values[f.key]).length;
  const result = form.conclude(values);
  const rt = toneOf(result?.bias);
  const band = result ? bandOf(result.score) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[14px] font-semibold text-slate-100">{form.question}</p>
        <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11.5px] text-slate-400">
          เลือกแล้ว {done}/{form.fields.length}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {form.fields.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ease }}
          >
            <Dropdown
              label={f.label}
              options={f.options}
              value={optionOf(f, values[f.key])}
              onPick={(o) => onChange({ ...values, [f.key]: o.value })}
            />
          </motion.div>
        ))}
      </div>

      <p className="text-[12px] leading-relaxed text-slate-500">กติกาสรุป · {form.rule}</p>

      <AnimatePresence initial={false} mode="wait">
        {result && band && (
          <motion.div
            key={`${result.id}-${result.score}`}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
            className="rounded-2xl border px-4 py-3"
            style={{
              borderColor: `color-mix(in srgb, ${rt.hex} 45%, transparent)`,
              background: `color-mix(in srgb, ${rt.hex} 10%, transparent)`,
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex items-center gap-1.5 text-[12px] text-slate-400">
                <Sparkles className="size-3.5" style={{ color: rt.hex }} />
                ระบบสรุปให้แล้ว
              </p>
              <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${rt.bg} ${rt.text}`}>
                คะแนนข้อนี้ {result.score}% · {band.label}
              </span>
            </div>
            <p className={`font-display text-[18px] font-bold ${rt.text}`}>{result.title}</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.score}%` }}
                transition={{ duration: 0.6, ease }}
                className="h-full rounded-full"
                style={{ background: rt.hex }}
              />
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-200">{result.interpretation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** dropdown ที่วาดเอง — หน้าตาเข้าธีมเว็บ ไม่ใช่กล่องขาวของระบบปฏิบัติการ */
function Dropdown({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: SignalOption[];
  value?: SignalOption;
  onPick: (o: SignalOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const t = toneOf(value?.tone);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-colors duration-300 hover:border-white/25"
        style={{
          borderColor: value ? `color-mix(in srgb, ${t.hex} 45%, transparent)` : "rgba(148,163,184,0.16)",
          background: value ? `color-mix(in srgb, ${t.hex} 8%, transparent)` : "var(--c-hover)",
        }}
      >
        <motion.span
          key={value?.value ?? "empty"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className={`grid size-8 shrink-0 place-items-center rounded-xl ${t.bg} ${t.text}`}
        >
          {value ? ICON[value.tone] : <Minus className="size-4 opacity-40" />}
        </motion.span>

        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-slate-400">{label}</span>
          <span className={`block truncate text-[14px] font-semibold ${value ? t.text : "text-slate-500"}`}>
            {value?.label ?? "เลือกทิศทาง"}
          </span>
        </span>

        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease }}
            className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-white/12 bg-ink-900/95 p-1 shadow-2xl backdrop-blur-xl"
          >
            {options.map((o) => {
              const ot = toneOf(o.tone);
              const on = o.value === value?.value;
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      onPick(o);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13.5px] transition-colors ${
                      on ? `${ot.bg} ${ot.text}` : "text-slate-200 hover:bg-white/6"
                    }`}
                  >
                    <span className={`grid size-6 shrink-0 place-items-center rounded-lg ${ot.bg} ${ot.text}`}>
                      {ICON[o.tone]}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {on && <Check className="size-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
