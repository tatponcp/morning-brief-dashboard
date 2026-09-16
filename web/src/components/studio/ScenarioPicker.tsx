"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { toneOf } from "@/lib/accent";
import {
  GUIDES,
  VIEWS,
  applyScenario,
  buildActions,
  suggestScenario,
  type ViewId,
} from "@/lib/scenarios";
import { SIGNAL_FORMS, optionOf } from "@/lib/signal-forms";
import { SignalForm } from "./SignalForm";
import type { Bias, ContractSeries, FlowRow, Instrument, Narrative } from "@/lib/types";

const BIAS_LABEL: Record<Bias, string> = { bull: "บวก", neutral: "กลาง", bear: "ลบ" };
const BIAS_ICON: Record<Bias, React.ReactNode> = {
  bull: <TrendingUp className="size-3.5" />,
  neutral: <Minus className="size-3.5" />,
  bear: <TrendingDown className="size-3.5" />,
};

const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

/**
 * ขั้น "เลือกสถานการณ์" — กดการ์ด → ระบบร่างสรุป/แปลความ/Action/Insight ให้
 * มุมมองกับตัวเลขแนวรับ-แนวต้านอัปเดตเฉพาะ Action ไม่ทับข้อความที่ IC แก้ไว้
 */
export function ScenarioPicker({
  sectionId,
  value,
  data,
  onApply,
  onNext,
}: {
  sectionId: string;
  value: Narrative;
  data: { contracts?: ContractSeries[]; flows?: FlowRow[]; instruments?: Instrument[] };
  onApply: (patch: Partial<Narrative>) => void;
  onNext: () => void;
}) {
  const guide = GUIDES[sectionId];
  const form = SIGNAL_FORMS[sectionId];
  if (!guide) return null;

  const picked = value.scenario;
  const current = guide.scenarios.find((s) => s.id === picked?.id);
  const views = (picked?.views ?? []) as ViewId[];
  const levels = picked?.levels ?? {};
  const suggestion = form ? null : suggestScenario(sectionId, data);
  const bias = current?.bias ?? picked?.bias ?? "neutral";
  const ready = !!current || (!!form && !!form.conclude(picked?.values ?? {}));

  /** เลือก dropdown ครบเมื่อไหร่ ระบบเขียนสรุป/แปลความ/Action ให้ทันที */
  function applySignals(nextValues: Record<string, string>) {
    const result = form.conclude(nextValues);
    const signals = form.fields
      .map((f) => ({ label: f.label, opt: optionOf(form, nextValues[f.key]) }))
      .filter((x) => x.opt)
      .map((x) => ({ label: x.label, value: x.opt!.label.split(" (")[0], tone: x.opt!.tone }));

    if (!result) {
      onApply({
        scenario: {
          id: "pending",
          title: "ยังเลือกไม่ครบ",
          bias: "neutral",
          views,
          levels,
          values: nextValues,
          signals,
        },
      });
      return;
    }
    onApply({
      summary: [...result.summary],
      interpretation: result.interpretation,
      insight: result.insight,
      actions: buildActions(result.views, levels, result.bias),
      scenario: {
        id: result.id,
        title: result.title,
        bias: result.bias,
        views: result.views,
        levels,
        values: nextValues,
        signals,
      },
    });
  }

  /** เปลี่ยนเฉพาะแถวที่มาจากการ์ด — แถวที่ IC เพิ่มเองในขั้นแก้คำยังอยู่ */
  function updateActions(nextViews: ViewId[], nextLevels: Record<string, string>) {
    if (!picked || !ready) return;
    const managed = new Set(["มุมมอง", ...guide.levels.map((l) => l.label)]);
    const kept = value.actions.filter((a) => !managed.has(a.label) && (a.label || a.value));
    onApply({
      actions: [...buildActions(nextViews, nextLevels, bias), ...kept],
      scenario: { ...picked, views: nextViews, levels: nextLevels },
    });
  }

  return (
    <div className="space-y-4">
      {!form && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-semibold text-slate-100">{guide.question}</p>
          {suggestion && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 rounded-full border border-violet-neon/30 bg-violet-neon/10 px-2.5 py-1 text-[11.5px] text-violet-neon"
            >
              <Sparkles className="size-3.5" />
              จากข้อมูล: {suggestion.reason}
            </motion.span>
          )}
        </div>
      )}

      {form && (
        <SignalForm form={form} values={picked?.values ?? {}} onChange={applySignals} />
      )}

      {/* การ์ดสถานการณ์ */}
      <div className={`grid gap-2.5 sm:grid-cols-2 ${form ? "hidden" : ""}`}>
        {guide.scenarios.map((sc, i) => {
          const on = sc.id === picked?.id;
          const t = toneOf(sc.bias);
          const suggested = sc.id === suggestion?.id;
          return (
            <motion.button
              key={sc.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onApply(applyScenario(sc, sc.views, levels))}
              className={`relative overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                on ? "border-transparent" : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
              }`}
            >
              {on && (
                <motion.span
                  layoutId={`scenario-on-${sectionId}`}
                  transition={spring}
                  className="absolute inset-0 rounded-2xl border-2"
                  style={{
                    borderColor: t.hex,
                    background: `color-mix(in srgb, ${t.hex} 10%, transparent)`,
                  }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <span
                  className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${t.bg} ${t.text}`}
                >
                  {BIAS_ICON[sc.bias]}
                  {BIAS_LABEL[sc.bias]}
                </span>
                {suggested && (
                  <span className="flex items-center gap-1 text-[11px] text-violet-neon">
                    <Sparkles className="size-3" /> แนะนำ
                  </span>
                )}
                <AnimatePresence>
                  {on && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={spring}
                      className="ml-auto grid size-5 place-items-center rounded-full"
                      style={{ background: t.hex }}
                    >
                      <Check className="size-3.5 text-ink-950" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="relative mt-2 block font-display text-[15px] font-bold text-white">{sc.title}</span>
              <span className="relative block text-[12.5px] text-slate-400">{sc.tag}</span>
            </motion.button>
          );
        })}
      </div>

      {/* มุมมอง + ตัวเลข — โผล่หลังเลือกการ์ด */}
      <AnimatePresence initial={false}>
        {ready && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 rounded-2xl border border-white/8 bg-white/2 px-4 py-4">
              <div>
                <p className="mb-2 text-[12px] text-slate-400">มุมมองสำหรับลูกค้า · เลือกได้หลายอัน</p>
                <div className="flex flex-wrap gap-2">
                  {VIEWS.map((v) => {
                    const on = views.includes(v.id);
                    const t = toneOf(v.tone);
                    return (
                      <motion.button
                        key={v.id}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() =>
                          updateActions(on ? views.filter((x) => x !== v.id) : [...views, v.id], levels)
                        }
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                          on ? `${t.bg} ${t.text}` : "border-white/10 text-slate-300 hover:border-white/25"
                        }`}
                        style={on ? { borderColor: `color-mix(in srgb, ${t.hex} 45%, transparent)` } : undefined}
                      >
                        <AnimatePresence initial={false}>
                          {on && (
                            <motion.span
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ width: "auto", opacity: 1 }}
                              exit={{ width: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <Check className="size-3.5" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {v.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {guide.levels.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {guide.levels.map((l) => (
                    <label key={l.label} className="block">
                      <span className="mb-1 block text-[12px] text-slate-400">{l.label}</span>
                      <input
                        value={levels[l.label] ?? ""}
                        placeholder={l.placeholder}
                        onChange={(e) => updateActions(views, { ...levels, [l.label]: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-ink-950/60 px-3 py-2 text-[13.5px] text-white transition outline-none placeholder:text-slate-600 focus:border-cyan-neon/60"
                      />
                    </label>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-white/6 bg-ink-950/40 px-3.5 py-3">
                <p className="mb-1 text-[11px] text-slate-500">ร่างที่ได้</p>
                <p className="text-[13px] leading-relaxed text-slate-200">{value.interpretation}</p>
                <p className="mt-1.5 text-[12.5px] text-cyan-neon">Insight: {value.insight}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11.5px] text-slate-500">
                  {form ? "เปลี่ยน dropdown จะเขียนข้อความให้ใหม่" : "กดการ์ดใหม่จะแทนข้อความเดิม"} · Ctrl+Z ย้อนได้
                </p>
                <motion.button
                  type="button"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onNext}
                  className="ml-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-neon to-green-neon px-4 py-2 text-[13px] font-semibold text-ink-950"
                >
                  ตรวจและแก้คำ <ArrowRight className="size-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
