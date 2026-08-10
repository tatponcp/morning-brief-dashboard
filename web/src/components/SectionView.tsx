import { notFound } from "next/navigation";
import { getBrief } from "@/data";
import { PriceOIPanel } from "@/components/charts/PriceOIPanel";
import { FlowPanel } from "@/components/charts/FlowPanel";
import { PaneGroupCard } from "@/components/charts/PaneGroupCard";
import { ImageBoard } from "@/components/ui/ImageBoard";
import { NarrativeGrid } from "@/components/ui/NarrativeGrid";
import { SectionHero } from "@/components/ui/SectionHero";
import { Reveal } from "@/components/ui/Reveal";

export function SectionView({ id }: { id: string }) {
  const brief = getBrief();
  const s = brief.sections.find((x) => x.id === id);
  if (!s) notFound();

  return (
    <div>
      <SectionHero
        index={s.index}
        title={s.title}
        subtitle={s.subtitle}
        source={s.source}
        accent={s.accent}
        dateLabel={brief.dateLabelTH}
      />

      {s.contracts && (
        <div className="grid gap-4 xl:grid-cols-2">
          {s.contracts.map((c, i) => (
            <Reveal key={c.symbol} delay={i * 0.08}>
              <PriceOIPanel series={c} />
            </Reveal>
          ))}
        </div>
      )}

      {s.flows && (
        <Reveal>
          <FlowPanel rows={s.flows} />
        </Reveal>
      )}

      {!!s.groups?.length && (
        <div className="grid gap-4 xl:grid-cols-2">
          {s.groups.map((g, i) => (
            <Reveal key={g.id} delay={i * 0.08}>
              <PaneGroupCard group={g} />
            </Reveal>
          ))}
        </div>
      )}

      {s.board && (
        <Reveal>
          <ImageBoard board={s.board} accent={s.accent} />
        </Reveal>
      )}

      <NarrativeGrid n={s.narrative} />
    </div>
  );
}
