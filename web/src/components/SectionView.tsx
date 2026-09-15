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

export async function SectionView({ id }: { id: string }) {
  const { brief } = await loadBrief();
  const s = brief.sections.find((x) => x.id === id);
  if (!s) notFound();

  const hero = (
    <SectionHero
      index={s.index}
      title={s.title}
      subtitle={s.subtitle}
      source={s.source}
      accent={s.accent}
      dateLabel={s.asOfLabel ?? brief.dateLabelTH}
      demo={s.demo}
    />
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
        {answer}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] xl:items-start">
          <Reveal>
            {images.length ? (
              <ImageBoard board={{ ...s.board, images }} accent={s.accent} />
            ) : (
              <ImagePending accent={s.accent} title={s.title} />
            )}
          </Reveal>
          <Reveal delay={0.06}>
            <NarrativeGrid n={s.narrative} layout="stack" hideInsight />
          </Reveal>
        </div>
        <SectionNav sections={brief.sections} currentId={s.id} />
      </div>
    );
  }

  return (
    <div>
      {hero}
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
      <SectionNav sections={brief.sections} currentId={s.id} />
    </div>
  );
}
