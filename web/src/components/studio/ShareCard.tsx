"use client";

import { forwardRef } from "react";
import { CheckCircle2, Lightbulb, MessageSquareText, Minus, TrendingDown, TrendingUp, TriangleAlert, Zap } from "lucide-react";
import { ACCENT, toneOf } from "@/lib/accent";
import { bandOf } from "@/lib/market-score";
import type { Draft } from "@/lib/drafts";
import type { Bias, Section } from "@/lib/types";
import { StaticRender } from "@/components/ui/Reveal";
import { BrandMark } from "@/components/ui/BrandMark";
import { SeriesBreakdown } from "@/components/ui/SeriesBreakdown";
import { ImageBoard } from "@/components/ui/ImageBoard";
import { PriceOIPanel } from "@/components/charts/PriceOIPanel";
import { SpreadPanel } from "@/components/charts/SpreadPanel";
import { FlowPanel } from "@/components/charts/FlowPanel";
import { PaneGroupCard } from "@/components/charts/PaneGroupCard";

/** ความกว้างคงที่ของรูป — 1080px ตรงกับขนาดที่ LINE / IG แสดงคมที่สุด */
export const SHARE_WIDTH = 1080;

export type ShareOptions = {
  narrative: boolean;
};

const BIAS_ICON: Record<Bias, typeof TrendingUp> = { bull: TrendingUp, neutral: Minus, bear: TrendingDown };

/**
 * การ์ดสำหรับถ่ายเป็นรูปส่งลูกค้า
 * อ่านจากบนลงล่าง: หัวข้อ → คำตอบของวัน (ใหญ่สุด) → สัญญาณ → ภาพ → รายละเอียด 3 ช่อง
 * ไม่ใช้ breakpoint ของจอ รูปจึงออกมาเหมือนกันทุกเครื่อง
 */
export const ShareCard = forwardRef<
  HTMLDivElement,
  {
    section: Section;
    draft: Draft;
    dateLabel: string;
    options: ShareOptions;
  }
>(function ShareCard({ section, draft, dateLabel, options }, ref) {
  const a = ACCENT[section.accent];
  const sc = draft.scenario && draft.scenario.id !== "pending" ? draft.scenario : undefined;
  const t = toneOf(sc?.bias);
  const color = sc ? t.hex : a.hex;
  const Icon = sc ? BIAS_ICON[sc.bias] : Minus;
  const band = sc?.score !== undefined ? bandOf(sc.score) : undefined;
  const images = draft.board.images.filter((im) => im.src);
  const view = draft.actions.find((x) => x.label === "มุมมอง" && x.value);
  const others = draft.actions.filter((x) => x.label !== "มุมมอง" && (x.label || x.value));
  const summary = draft.summary.filter((s) => s.trim());

  return (
    <StaticRender.Provider value={true}>
      <div
        ref={ref}
        style={{ width: SHARE_WIDTH }}
        className="share-card relative overflow-hidden bg-ink-950 text-slate-100"
      >
        {/* พื้นหลัง: ตารางจาง ๆ + แสงตามสีสัญญาณ */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="pointer-events-none absolute -top-48 -left-32 size-[560px] rounded-full blur-3xl" style={{ background: a.soft }} />
        <div
          className="pointer-events-none absolute -right-40 top-40 size-[520px] rounded-full blur-3xl"
          style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}
        />

        {/* ---------- แถบแบรนด์ ---------- */}
        <div className="relative flex items-center gap-3 border-b border-white/8 px-8 py-4">
          <BrandMark size={36} still />
          <span className="font-display text-[17px] font-bold text-white">Morning Brief</span>
          <span className="text-[14px] text-slate-500">S50 Signal Desk</span>
          <span className="ml-auto rounded-full border border-amber-neon/40 bg-amber-neon/10 px-4 py-1.5 font-display text-[15px] font-bold text-amber-neon">
            {draft.asOfLabel ?? dateLabel}
          </span>
        </div>

        <div className="relative space-y-5 px-8 pt-6 pb-7">
          {/* ---------- หัวข้อ ---------- */}
          <header className="flex items-center gap-4">
            <div
              className="grid size-16 shrink-0 place-items-center rounded-2xl font-display text-[30px] font-bold"
              style={{ background: a.hex, color: "var(--ink-950)" }}
            >
              {section.index}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={`bg-gradient-to-r ${a.grad} text-gradient font-display text-[34px] leading-tight font-bold`}>
                {section.title}
              </h2>
              <p className="mt-0.5 text-[16px] text-slate-400">{section.subtitle}</p>
            </div>
          </header>

          {section.demo && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-neon/40 bg-amber-neon/10 px-4 py-2 text-[14px] font-semibold text-amber-neon">
              <TriangleAlert className="size-4" />
              ตัวเลขในภาพนี้เป็นข้อมูลจำลอง ยังไม่ใช่ราคาจริง
            </div>
          )}

          {/* ---------- คำตอบของวัน ---------- */}
          {(sc || draft.insight) && (
            <div
              className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 overflow-hidden rounded-3xl border px-7 py-6"
              style={{
                borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                background: `linear-gradient(120deg, color-mix(in srgb, ${color} 16%, transparent), color-mix(in srgb, ${color} 3%, transparent))`,
              }}
            >
              <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} />
              <div className="min-w-0">
                {sc && (
                  <p className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[15px] font-bold ${t.bg} ${t.text}`}>
                    <Icon className="size-4" />
                    {sc.title}
                  </p>
                )}
                <p className="flex items-start gap-3">
                  <Lightbulb className="mt-1.5 size-7 shrink-0" style={{ color }} />
                  <span className="font-display text-[32px] leading-snug font-bold text-white">{draft.insight}</span>
                </p>
                {view && (
                  <p className="mt-3 text-[17px] text-slate-300">
                    ควรทำอะไร: <span className={`font-display text-[20px] font-bold ${toneOf(view.tone).text}`}>{view.value}</span>
                  </p>
                )}
              </div>

              {sc?.score !== undefined && band && <ScoreDial score={sc.score} color={color} label={band.label} />}
            </div>
          )}

          {/* ---------- สัญญาณที่ IC เลือก ---------- */}
          {sc?.perSeries && sc.perSeries.length > 1 && sc.id !== "pending" ? (
            <SeriesBreakdown reads={sc.perSeries} big />
          ) : !!sc?.signals?.length && (
            <div className="grid grid-cols-2 gap-2.5">
              {sc.signals.map((sig) => {
                const st = toneOf(sig.tone);
                const SIcon = BIAS_ICON[sig.tone];
                return (
                  <div
                    key={sig.label}
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                    style={{
                      borderColor: `color-mix(in srgb, ${st.hex} 35%, transparent)`,
                      background: `color-mix(in srgb, ${st.hex} 8%, transparent)`,
                    }}
                  >
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${st.bg} ${st.text}`}>
                      <SIcon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] text-slate-300">{sig.label}</span>
                    <span className={`font-display text-[17px] font-bold ${st.text}`}>{sig.value}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------- กราฟ / ภาพ ---------- */}
          {!!draft.contracts?.length && (
            <div className={`grid items-start gap-3 ${draft.contracts.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {draft.contracts.map((c) => (
                <PriceOIPanel key={c.symbol} series={c} />
              ))}
              {draft.spread && <SpreadPanel spread={draft.spread} />}
            </div>
          )}
          {!!draft.flows?.length && <FlowPanel rows={draft.flows} />}
          {!!section.groups?.length && (
            <div className="grid grid-cols-2 gap-3">
              {section.groups.map((g) => (
                <PaneGroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
          {images.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <ImageBoard board={{ ...draft.board, images }} accent={section.accent} />
            </div>
          )}

          {/* ---------- รายละเอียด 3 ช่อง ---------- */}
          {options.narrative && (
            <div className="grid grid-cols-3 gap-3">
              <Block title="สรุปสั้น" hint="เกิดอะไรขึ้น" color="var(--c-cyan)" icon={<CheckCircle2 className="size-5" />}>
                <ul className="space-y-2">
                  {summary.map((s) => (
                    <li key={s} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-100">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-cyan-neon" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Block>
              <Block title="แปลความ" hint="หมายความว่าอะไร" color="var(--c-violet)" icon={<MessageSquareText className="size-5" />}>
                <p className="text-[15px] leading-[1.8] text-slate-100">{draft.interpretation}</p>
              </Block>
              <Block title="Action วันนี้" hint="ควรทำอะไร" color="var(--c-amber)" icon={<Zap className="size-5" />}>
                <ul className="space-y-1.5">
                  {[...(view ? [view] : []), ...others].map((x, i) => (
                    <li key={i} className="rounded-xl border border-white/8 bg-white/3 px-3 py-2">
                      <span className="block text-[13px] text-slate-400">{x.label}</span>
                      <span className={`text-[16px] font-semibold ${toneOf(x.tone).text}`}>{x.value}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            </div>
          )}
        </div>

        {/* ---------- ท้ายรูป ---------- */}
        <footer className="relative flex items-center gap-3 border-t border-white/8 bg-white/2 px-8 py-4 text-[13.5px] text-slate-500">
          <span>ข้อมูลเพื่อประกอบการตัดสินใจ ไม่ใช่คำแนะนำให้ซื้อขาย</span>
          <span className="ml-auto font-semibold text-slate-400">morning-brief-dashboard-delta.vercel.app</span>
        </footer>
      </div>
    </StaticRender.Provider>
  );
});

function Block({
  title,
  hint,
  color,
  icon,
  children,
}: {
  title: string;
  hint: string;
  color: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-4"
      style={{ borderColor: `color-mix(in srgb, ${color} 25%, transparent)`, background: "rgba(255,255,255,0.02)" }}
    >
      <p className="mb-3 flex items-center gap-2 font-display text-[18px] font-bold" style={{ color }}>
        <span className="grid size-8 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
          {icon}
        </span>
        {title}
        <span className="font-sans text-[13px] font-normal text-slate-400">{hint}</span>
      </p>
      {children}
    </div>
  );
}

/** วงคะแนนของข้อนี้ — วาดนิ่ง (ไม่มีแอนิเมชัน) เพราะใช้ถ่ายเป็นรูป */
function ScoreDial({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div className="relative grid size-32 place-items-center">
        <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - score / 100)}
          />
        </svg>
        <p className="font-display text-[34px] leading-none font-bold" style={{ color }}>
          {score}
          <span className="text-[18px]">%</span>
        </p>
      </div>
      <p className="mt-1 text-[14px] font-semibold" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
