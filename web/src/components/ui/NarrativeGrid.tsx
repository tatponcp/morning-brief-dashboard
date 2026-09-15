import { CheckCircle2, Lightbulb, MessageSquareText, Zap } from "lucide-react";
import { toneOf } from "@/lib/accent";
import type { Narrative } from "@/lib/types";
import { Reveal } from "./Reveal";

/**
 * บล็อกมาตรฐาน 3 ช่อง: สรุปสั้น / แปลความ / Action วันนี้ + แถบ Insight
 *
 * layout "grid"  = เรียง 3 คอลัมน์เต็มความกว้าง (ใช้กับ section ที่กราฟกว้าง)
 * layout "stack" = ซ้อนลงมาในคอลัมน์เดียว (ใช้คู่กับภาพที่วางข้าง ๆ จะได้ไม่ต้องเลื่อนยาว)
 */
export function NarrativeGrid({
  n,
  layout = "grid",
  hideInsight,
}: {
  n: Narrative;
  /** หน้า section แสดง Insight ไว้บนสุดแล้ว */
  hideInsight?: boolean;
  /** "row" = 3 คอลัมน์เสมอไม่ขึ้นกับขนาดจอ ใช้กับรูปส่งลูกค้าที่ความกว้างคงที่ */
  layout?: "grid" | "stack" | "row";
}) {
  const stack = layout === "stack";
  const cols =
    layout === "stack" ? "space-y-3" : layout === "row" ? "grid grid-cols-3 gap-3" : "grid gap-3 lg:grid-cols-3";
  return (
    <div className={stack ? "space-y-3" : "mt-4 space-y-3"}>
      <div className={cols}>
        <Reveal>
          <Card
            title="สรุปสั้น"
            hint="เกิดอะไรขึ้น"
            step="1"
            color="var(--c-cyan)"
            icon={<CheckCircle2 className="size-5" />}
          >
            <ul className="space-y-2">
              {n.summary.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-100">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-neon" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card
            title="แปลความ"
            hint="หมายความว่าอะไร"
            step="2"
            color="var(--c-violet)"
            icon={<MessageSquareText className="size-5" />}
          >
            <p className="text-[15px] leading-[1.85] text-slate-100">{n.interpretation}</p>
          </Card>
        </Reveal>

        <Reveal delay={0.16}>
          <Card title="Action วันนี้" hint="ควรทำอะไร" step="3" color="var(--c-amber)" icon={<Zap className="size-5" />}>
            <ul className="space-y-1.5">
              {n.actions.map((a, i) => {
                const t = toneOf(a.tone);
                return (
                  <li
                    key={i}
                    className="flex flex-wrap items-baseline gap-x-2 rounded-lg border border-white/6 bg-white/2 px-3 py-2"
                  >
                    <span className="text-[13.5px] text-slate-400">{a.label}:</span>
                    <span className={`text-[15px] font-semibold ${t.text}`}>{a.value}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </Reveal>
      </div>

      {!hideInsight && (
      <Reveal delay={0.2}>
        <div className="relative overflow-hidden rounded-xl border border-cyan-neon/25 bg-gradient-to-r from-cyan-neon/10 via-transparent to-violet-neon/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-amber-neon/15 text-amber-neon">
              <Lightbulb className="size-4" />
            </span>
            <p className="text-[13.5px] leading-snug text-slate-100">
              <span className="font-display font-bold text-cyan-neon">Insight: </span>
              {n.insight}
            </p>
          </div>
        </div>
      </Reveal>
      )}
    </div>
  );
}

function Card({
  title,
  hint,
  step,
  color,
  icon,
  children,
}: {
  title: string;
  hint?: string;
  step: string;
  color: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="panel h-full px-4 py-3.5 transition duration-300 hover:-translate-y-0.5"
      style={{ borderColor: `color-mix(in srgb, ${color} 20%, transparent)` }}
    >
      <div className="mb-2.5 flex items-center gap-2.5">
        <span
          className="grid size-7 place-items-center rounded-lg"
          style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
        >
          {icon}
        </span>
        <h3 className="font-display text-[16px] font-bold" style={{ color }}>
          <span className="mr-1.5 opacity-50">{step}</span>
          {title}
          {hint && <span className="ml-2 font-sans text-[13px] font-normal text-slate-400">{hint}</span>}
        </h3>
      </div>
      {children}
    </div>
  );
}
