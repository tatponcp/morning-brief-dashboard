"use client";

import { forwardRef } from "react";
import { TriangleAlert } from "lucide-react";
import { ACCENT } from "@/lib/accent";
import type { Draft } from "@/lib/drafts";
import type { Instrument, Section } from "@/lib/types";
import { StaticRender } from "@/components/ui/Reveal";
import { NarrativeGrid } from "@/components/ui/NarrativeGrid";
import { ImageBoard } from "@/components/ui/ImageBoard";
import { PriceOIPanel } from "@/components/charts/PriceOIPanel";
import { FlowPanel } from "@/components/charts/FlowPanel";
import { PaneGroupCard } from "@/components/charts/PaneGroupCard";
import { InstrumentCard } from "@/components/charts/InstrumentCard";

/** ความกว้างคงที่ของรูป — 1080px ตรงกับขนาดที่ LINE / IG แสดงคมที่สุด */
export const SHARE_WIDTH = 1080;

export type ShareOptions = {
  narrative: boolean;
};

/**
 * การ์ดสำหรับถ่ายเป็นรูปส่งลูกค้า
 * ไม่ใช้ breakpoint ของจอเลย เพื่อให้รูปออกมาเหมือนกันไม่ว่า IC จะเปิดจากโน้ตบุ๊กหรือมือถือ
 */
export const ShareCard = forwardRef<
  HTMLDivElement,
  {
    section: Section;
    draft: Draft;
    dateLabel: string;
    instruments?: Instrument[];
    options: ShareOptions;
  }
>(function ShareCard({ section, draft, dateLabel, instruments, options }, ref) {
  const a = ACCENT[section.accent];
  const hasImages = draft.board.images.some((im) => im.src);

  return (
    <StaticRender.Provider value={true}>
      <div
        ref={ref}
        style={{ width: SHARE_WIDTH }}
        className="share-card relative overflow-hidden bg-ink-950 p-7 text-slate-100"
      >
        {/* แสงพื้นหลังตามสีประจำ section */}
        <div
          className="pointer-events-none absolute -top-40 -left-24 size-[520px] rounded-full blur-3xl"
          style={{ background: a.soft }}
        />
        <div className="pointer-events-none absolute -right-32 -bottom-40 size-[460px] rounded-full bg-violet-neon/10 blur-3xl" />

        {/* ---------- หัวรูป ---------- */}
        <header className="relative mb-5 flex items-center gap-4">
          <div
            className="grid size-14 shrink-0 place-items-center rounded-2xl border font-display text-[26px] font-bold"
            style={{ borderColor: a.hex, color: a.hex, background: a.soft }}
          >
            {section.index}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className={`bg-gradient-to-r ${a.grad} text-gradient font-display text-[32px] leading-tight font-bold`}
            >
              {section.title}
            </h2>
            <p className="mt-0.5 text-[15px] text-slate-400">{section.subtitle}</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/4 px-4 py-2 text-right">
            <p className="text-[12px] text-slate-500">ข้อมูล ณ</p>
            <p className="font-display text-[20px] font-bold text-amber-neon">{dateLabel}</p>
          </div>
        </header>

        {section.demo && (
          <div className="relative mb-4 flex items-center gap-2 rounded-xl border border-amber-neon/40 bg-amber-neon/10 px-4 py-2 text-[14px] font-semibold text-amber-neon">
            <TriangleAlert className="size-4" />
            ตัวเลขในภาพนี้เป็นข้อมูลจำลอง ยังไม่ใช่ราคาจริง
          </div>
        )}

        {/* ---------- เนื้อหาหลัก ---------- */}
        <div className="relative space-y-3">
          {!!draft.contracts?.length && (
            <div className="grid grid-cols-2 gap-3">
              {draft.contracts.map((c) => (
                <PriceOIPanel key={c.symbol} series={c} />
              ))}
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

          {!!instruments?.length && (
            <div className="grid grid-cols-4 gap-3">
              {instruments.map((inst) => (
                <InstrumentCard key={inst.id} inst={inst} />
              ))}
            </div>
          )}

          {hasImages && (
            <ImageBoard
              board={{ ...draft.board, images: draft.board.images.filter((im) => im.src) }}
              accent={section.accent}
            />
          )}

          {options.narrative && (
            <NarrativeGrid
              layout="row"
              n={{
                summary: draft.summary.filter((s) => s.trim()),
                interpretation: draft.interpretation,
                actions: draft.actions.filter((x) => x.label || x.value),
                insight: draft.insight,
              }}
            />
          )}
        </div>

        {/* ---------- ท้ายรูป ---------- */}
        <footer className="relative mt-5 flex items-center gap-3 border-t border-white/8 pt-4 text-[13px] text-slate-500">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-cyan-neon to-violet-neon font-display text-[12px] font-bold text-ink-950">
            MB
          </span>
          <span className="font-display font-semibold text-slate-300">Morning Brief</span>
          <span>· S50 Signal Desk</span>
          <span className="ml-auto">morning-brief-dashboard-delta.vercel.app</span>
        </footer>
      </div>
    </StaticRender.Provider>
  );
});
