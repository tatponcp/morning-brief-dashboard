"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { toneOf } from "@/lib/accent";
import { optionOf, type SignalForm as Form } from "@/lib/signal-forms";
import type { Bias } from "@/lib/types";

const ICON: Record<Bias, React.ReactNode> = {
  bull: <TrendingUp className="size-4" />,
  neutral: <Minus className="size-4" />,
  bear: <TrendingDown className="size-4" />,
};

const ease = [0.16, 1, 0.3, 1] as const;

/** ข้อ 4 และ 5: เลือกจาก dropdown ทีละเส้น ระบบสรุปให้ทันทีเมื่อครบ */
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[14px] font-semibold text-slate-100">{form.question}</p>
        <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11.5px] text-slate-400">
          เลือกแล้ว {done}/{form.fields.length}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {form.fields.map((f, i) => {
          const opt = optionOf(form, values[f.key]);
          const t = toneOf(opt?.tone);
          return (
            <motion.label
              key={f.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ease }}
              className="relative flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 transition-colors duration-300"
              style={{
                borderColor: opt ? `color-mix(in srgb, ${t.hex} 45%, transparent)` : "rgba(148,163,184,0.16)",
                background: opt ? `color-mix(in srgb, ${t.hex} 8%, transparent)` : "var(--c-hover)",
              }}
            >
              <motion.span
                key={opt?.value ?? "empty"}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className={`grid size-8 shrink-0 place-items-center rounded-xl ${t.bg} ${t.text}`}
              >
                {opt ? ICON[opt.tone] : <Minus className="size-4 opacity-40" />}
              </motion.span>

              <span className="min-w-0 flex-1">
                <span className="block text-[12px] text-slate-400">{f.label}</span>
                <span className={`block truncate text-[14px] font-semibold ${opt ? t.text : "text-slate-500"}`}>
                  {opt?.label ?? "เลือกทิศทาง"}
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-slate-500" />

              <select
                aria-label={f.label}
                value={values[f.key] ?? ""}
                onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="">เลือกทิศทาง</option>
                {form.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </motion.label>
          );
        })}
      </div>

      <p className="text-[12px] leading-relaxed text-slate-500">กติกาสรุป · {form.rule}</p>

      <AnimatePresence initial={false} mode="wait">
        {result && (
          <motion.div
            key={result.id}
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
            <p className="flex items-center gap-2 text-[12px] text-slate-400">
              <Check className="size-3.5" style={{ color: rt.hex }} />
              ระบบสรุปให้แล้ว
            </p>
            <p className={`font-display text-[18px] font-bold ${rt.text}`}>{result.title}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-slate-200">{result.interpretation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
