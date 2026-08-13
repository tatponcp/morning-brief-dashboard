import { Radio } from "lucide-react";
import { loadBrief } from "@/lib/brief-store";
import { loadMacro } from "@/lib/market";
import { PaneGroupCard } from "@/components/charts/PaneGroupCard";
import { InstrumentCard } from "@/components/charts/InstrumentCard";
import { NarrativeGrid } from "@/components/ui/NarrativeGrid";
import { SectionHero } from "@/components/ui/SectionHero";
import { Reveal } from "@/components/ui/Reveal";
import { thaiDate } from "@/lib/format";
import type { PaneGroup } from "@/lib/types";

/** ดึงราคาใหม่ทุกชั่วโมง — หน้ายังเสิร์ฟแบบ static */
export const revalidate = 3600;

export default async function MacroPage() {
  const { brief } = await loadBrief();
  const s = brief.sections.find((x) => x.id === "macro")!;
  const macro = await loadMacro();

  const goldGroup: PaneGroup = {
    id: "gold",
    title: "GOLD (COMEX) — ราคาทองคำ",
    subtitle: "แท่งเทียนรายวัน 1 ปีย้อนหลัง · hover เพื่อดูราคาแต่ละวัน",
    accentHex: "#ffc53d",
    panes: [
      {
        id: "gold-d",
        title: "GOLD (Daily)",
        kind: "candle",
        height: 300,
        digits: 2,
        series: [{ key: "c", name: "Gold", color: "#ffc53d" }],
        rows: macro.gold,
        refLines: [
          {
            y: macro.gold.at(-1)?.c ?? 0,
            color: "#ffc53d",
            label: String(macro.gold.at(-1)?.c?.toFixed(2) ?? ""),
          },
        ],
      },
    ],
  };

  return (
    <div>
      <SectionHero
        index={s.index}
        title={s.title}
        subtitle={s.subtitle}
        source={s.source}
        accent={s.accent}
        dateLabel={thaiDate(macro.asOf)}
      />

      <Reveal>
        <div
          className={`mb-4 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px] ${
            macro.live
              ? "border-[#34f5a0]/30 bg-[#34f5a0]/8 text-[#34f5a0]"
              : "border-[#ffc53d]/30 bg-[#ffc53d]/8 text-[#ffc53d]"
          }`}
        >
          <Radio className="size-4" />
          {macro.live ? (
            <>ข้อมูลสดจาก provider · ราคาล่าสุด {thaiDate(macro.asOf)}</>
          ) : (
            <>provider ไม่ตอบสนอง — กำลังแสดง snapshot ล่าสุดที่เก็บไว้ ({thaiDate(macro.asOf)})</>
          )}
          <span className="ml-auto text-slate-500">section นี้ไม่ต้องแคปภาพแล้ว</span>
        </div>
      </Reveal>

      <Reveal>
        <PaneGroupCard group={goldGroup} />
      </Reveal>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {macro.instruments.map((inst, i) => (
          <Reveal key={inst.id} delay={i * 0.06}>
            <InstrumentCard inst={inst} />
          </Reveal>
        ))}
      </div>

      <NarrativeGrid n={s.narrative} />
    </div>
  );
}
