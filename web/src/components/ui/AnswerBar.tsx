import { BookOpen, ChevronDown, Compass, HelpCircle, Lightbulb } from "lucide-react";
import { ACCENT, toneOf, type Accent } from "@/lib/accent";
import { READING_GUIDE } from "@/lib/reading-guide";
import type { Narrative } from "@/lib/types";
import { Reveal } from "./Reveal";
import { SeriesBreakdown } from "./SeriesBreakdown";

const BIAS_LABEL = { bull: "บวก", neutral: "กลาง", bear: "ลบ" } as const;

/**
 * คำตอบของ section วางไว้บนสุด — ลูกค้าอ่านบรรทัดเดียวรู้เลยว่าข้อนี้บอกอะไรและควรทำอะไร
 * ส่วนวิธีอ่านกราฟและคำศัพท์พับเก็บไว้ เปิดดูเมื่ออยากรู้
 */
export function AnswerBar({ id, accent, n }: { id: string; accent: Accent; n: Narrative }) {
  const a = ACCENT[accent];
  const guide = READING_GUIDE[id];
  const sc = n.scenario;
  const t = toneOf(sc?.bias);
  const view = n.actions.find((x) => x.label === "มุมมอง" && x.value);
  const vt = toneOf(view?.tone);
  const color = sc ? t.hex : a.hex;

  return (
    <Reveal>
      <div
        className="panel relative mb-3 overflow-hidden"
        style={{ borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}
      >
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
        <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-6">
          <div className="min-w-0">
            {guide && (
              <p className="mb-1.5 flex items-center gap-1.5 text-[13px] text-slate-400">
                <HelpCircle className="size-4 shrink-0" />
                {guide.question}
              </p>
            )}
            <p className="flex items-start gap-2.5">
              <Lightbulb className="mt-1 size-5 shrink-0" style={{ color }} />
              <span className="font-display text-[20px] leading-snug font-bold text-white md:text-[22px]">
                {n.insight}
              </span>
            </p>
            {sc?.perSeries && sc.perSeries.length > 1 && sc.id !== "pending" ? (
              <SeriesBreakdown reads={sc.perSeries} />
            ) : !!sc?.signals?.length && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {sc.signals.map((sig, i) => {
                  const st = toneOf(sig.tone);
                  return (
                    <Reveal key={sig.label} delay={0.05 + i * 0.05}>
                      <span
                        className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[13px] transition-transform duration-300 hover:-translate-y-0.5"
                        style={{
                          borderColor: `color-mix(in srgb, ${st.hex} 35%, transparent)`,
                          background: `color-mix(in srgb, ${st.hex} 8%, transparent)`,
                        }}
                      >
                        <span className="text-slate-400">{sig.label}</span>
                        <span className={`font-semibold ${st.text}`}>{sig.value}</span>
                      </span>
                    </Reveal>
                  );
                })}
              </div>
            )}

            {sc && sc.id !== "pending" && (
              <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${t.bg} ${t.text}`}>
                <Compass className="size-3.5" />
                {sc.title} · สัญญาณ{BIAS_LABEL[sc.bias]}
              </span>
            )}
          </div>

          {view && (
            <div
              className="rounded-2xl border px-4 py-3 md:min-w-[220px]"
              style={{
                borderColor: `color-mix(in srgb, ${vt.hex} 35%, transparent)`,
                background: `color-mix(in srgb, ${vt.hex} 8%, transparent)`,
              }}
            >
              <p className="text-[12.5px] text-slate-400">ควรทำอะไร</p>
              <p className={`font-display text-[19px] leading-tight font-bold ${vt.text}`}>{view.value}</p>
            </div>
          )}
        </div>

        {guide && (
          <details className="group border-t border-white/6">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-2.5 text-[13px] text-slate-300 transition-colors hover:bg-white/3 md:px-6 [&::-webkit-details-marker]:hidden">
              <BookOpen className="size-4" style={{ color: a.hex }} />
              อ่านข้อนี้ยังไง · คำศัพท์
              <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-4 px-5 pb-4 md:grid-cols-2 md:px-6">
              <ul className="space-y-2">
                {guide.howTo.map((h) => (
                  <li key={h} className="flex gap-2.5 text-[14px] leading-relaxed text-slate-200">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: a.hex }} />
                    {h}
                  </li>
                ))}
              </ul>
              <dl className="space-y-2">
                {guide.terms.map((x) => (
                  <div key={x.term} className="rounded-xl border border-white/6 bg-white/2 px-3 py-2">
                    <dt className="text-[13px] font-semibold" style={{ color: a.hex }}>
                      {x.term}
                    </dt>
                    <dd className="text-[13.5px] text-slate-300">{x.meaning}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        )}
      </div>
    </Reveal>
  );
}
