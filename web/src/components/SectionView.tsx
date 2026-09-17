import { notFound } from "next/navigation";
import { loadBrief } from "@/lib/brief-store";
import { PriceOIPanel } from "@/components/charts/PriceOIPanel";
import { SpreadPanel } from "@/components/charts/SpreadPanel";
import { FlowPanel } from "@/components/charts/FlowPanel";
import { PaneGroupCard } from "@/components/charts/PaneGroupCard";
import { ImageBoard } from "@/components/ui/ImageBoard";
import { NarrativeGrid } from "@/components/ui/NarrativeGrid";
import { SectionHero } from "@/components/ui/SectionHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionNav } from "@/components/ui/SectionNav";
import { AnswerBar } from "@/components/ui/AnswerBar";
import { ImagePending } from "@/components/ui/ImagePending";
import { PendingGate } from "@/components/ui/NotUpdated";
import { isSectionEmpty } from "@/lib/freshness";
import { displayTitle, hasSeriesSlot } from "@/lib/section-title";

export async function SectionView({ id }: { id: string }) {
  const { brief } = await loadBrief();
  const s = brief.sections.find((x) => x.id === id);
  if (!s) notFound();

  const hero = (
    <SectionHero
      index={s.index}
      title={displayTitle(s.title, s.series)}
      subtitle={s.subtitle}
      source={s.source}
      accent={s.accent}
      dateLabel={s.asOfLabel ?? brief.dateLabelTH}
      demo={s.demo}
      // ชื่อหัวข้อมี series อยู่แล้วก็ไม่ต้องขึ้นป้ายซ้ำ
      series={hasSeriesSlot(s.title) ? undefined : s.series}
    />
  );
  const empty = isSectionEmpty(s);
  /** ยังไม่อัปเดตวันนี้ → ฉากรอ 3 มิติ ลูกค้ากดดูข้อมูลล่าสุดได้ถ้ามี */
  const gate = (children: React.ReactNode) => (
    <PendingGate
      input={{ briefDate: brief.date, empty }}
      title={displayTitle(s.title, s.series)}
      accent={s.accent}
      lastLabel={s.asOfLabel ?? brief.dateLabelTH}
      hasPrevious={!empty}
    >
      {children}
    </PendingGate>
  );
  // คำตอบของข้อนี้อยู่บนสุด ก่อนกราฟ — Insight จึงไม่ต้องซ้ำด้านล่าง
  const answer = <AnswerBar id={s.id} accent={s.accent} n={s.narrative} />;

  /**
   * Section ที่เป็นภาพ (ข้อ 4, 5) — วางภาพซ้าย คำอธิบายขวา
   * อ่านจบได้ในจอเดียว ไม่ต้องเลื่อนลงไปหาสรุป
   */
  if (s.board) {
    const images = s.board.images.filter((im) => im.src);
    return (
      <div>
        {hero}
        {gate(
          <>
        {answer}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] xl:items-start">
          <Reveal>
            {images.length ? (
              <ImageBoard board={{ ...s.board, images }} accent={s.accent} />
            ) : (
              <ImagePending accent={s.accent} title={displayTitle(s.title, s.series)} />
            )}
          </Reveal>
          <Reveal delay={0.06}>
            <NarrativeGrid n={s.narrative} layout="stack" hideInsight />
          </Reveal>
        </div>
          </>,
        )}
        <SectionNav sections={brief.sections} currentId={s.id} />
      </div>
    );
  }

  return (
    <div>
      {hero}
      {gate(
        <>
      {answer}

      {s.contracts && (
        <div
          className={`grid items-start gap-3 ${
            s.contracts.length > 1
              ? "xl:grid-cols-2"
              : ""
          }`}
        >
          {s.contracts.map((c, i) => (
            <Reveal key={c.symbol} delay={i * 0.08}>
              <PriceOIPanel series={c} />
            </Reveal>
          ))}
          {s.spread && (
            <Reveal delay={0.08}>
              <SpreadPanel spread={s.spread} />
            </Reveal>
          )}
        </div>
      )}

      {s.flows && (
        <Reveal>
          <FlowPanel rows={s.flows} />
        </Reveal>
      )}

      {!!s.groups?.length && (
        <div className="grid gap-3 xl:grid-cols-2">
          {s.groups.map((g, i) => (
            <Reveal key={g.id} delay={i * 0.08}>
              <PaneGroupCard group={g} />
            </Reveal>
          ))}
        </div>
      )}

      <NarrativeGrid n={s.narrative} hideInsight />
        </>,
      )}
      <SectionNav sections={brief.sections} currentId={s.id} />
    </div>
  );
}
