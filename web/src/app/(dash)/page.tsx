import { loadBrief } from "@/lib/brief-store";
import { isSectionEmpty } from "@/lib/freshness";
import { sectionScore } from "@/lib/market-score";
import { displayTitle } from "@/lib/section-title";
import { sparkValues } from "@/components/ui/MiniSpark";
import { OverviewExperience, type SignalCard } from "@/components/overview/OverviewExperience";

/** ย่อจุดของเส้นเล็กให้เหลือพอวาด ไม่ส่งข้อมูลทั้งชุดไปฝั่งลูกค้า */
function downsample(values: number[], n = 48) {
  if (values.length <= n) return values;
  const step = (values.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => values[Math.round(i * step)]);
}

export default async function SummaryPage() {
  const { brief } = await loadBrief();

  const cards: SignalCard[] = brief.sections.map((s) => {
    const view = s.narrative.actions.find((a) => a.label === "มุมมอง");
    return {
      id: s.id,
      index: s.index,
      title: displayTitle(s.title, s.series),
      subtitle: s.subtitle,
      accent: s.accent,
      bias: s.narrative.scenario?.bias,
      scenario: s.narrative.scenario?.id === "pending" ? undefined : s.narrative.scenario?.title,
      score: sectionScore(s.narrative.scenario),
      empty: isSectionEmpty(s),
      insight: s.narrative.insight,
      summary: s.narrative.summary.filter(Boolean).slice(0, 3),
      view: view?.value ? { value: view.value, tone: view.tone } : undefined,
      levels: s.narrative.actions
        .filter((a) => a.label !== "มุมมอง" && a.label && a.value && !a.value.startsWith("รอ IC"))
        .slice(0, 3)
        .map((a) => ({ label: a.label, value: a.value })),
      spark: downsample(sparkValues(s)),
    };
  });

  return <OverviewExperience dateLabel={brief.dateLabelTH} briefDate={brief.date} cards={cards} />;
}
