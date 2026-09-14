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

  /**
   * Section ที่เป็นภาพ (ข้อ 4, 5) — วางภาพซ้าย คำอธิบายขวา
   * อ่านจบได้ในจอเดียว ไม่ต้องเลื่อนลงไปหาสรุป
   */
  if (s.board) {
    return (
      <div>
        {hero}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] xl:items-start">
          <Reveal>
            <ImageBoard board={s.board} accent={s.accent} />
          </Reveal>
          <Reveal delay={0.06}>
            <NarrativeGrid n={s.narrative} layout="stack" />
          </Reveal>
        </div>
        <SectionNav sections={brief.sections} currentId={s.id} />
      </div>
    );
  }

  return (
    <div>
      {hero}

      {s.contracts && (
        <div
          className={`grid items-start gap-3 ${
            s.contracts.length > 1
              ? "xl:grid-cols-2"
              : s.spread
                ? "xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
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

      <NarrativeGrid n={s.narrative} />
      <SectionNav sections={brief.sections} currentId={s.id} />
    </div>
  );
}
