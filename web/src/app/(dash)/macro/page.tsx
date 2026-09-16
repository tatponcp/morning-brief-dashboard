import { Radio } from "lucide-react";
import { loadBrief } from "@/lib/brief-store";
import { loadMacro } from "@/lib/market";
import { PaneGroupCard } from "@/components/charts/PaneGroupCard";
import { InstrumentCard } from "@/components/charts/InstrumentCard";
import { NarrativeGrid } from "@/components/ui/NarrativeGrid";
import { SectionHero } from "@/components/ui/SectionHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionNav } from "@/components/ui/SectionNav";
import { thaiDate } from "@/lib/format";
import { goldGroup } from "@/lib/macro-view";
import { AnswerBar } from "@/components/ui/AnswerBar";

export const metadata = { title: "6 · Global Macro Signals" };

/** ดึงราคาใหม่ทุกชั่วโมง — หน้ายังเสิร์ฟแบบ static */
export const revalidate = 3600;

export default async function MacroPage() {
  const { brief } = await loadBrief();
  const s = brief.sections.find((x) => x.id === "macro")!;
  const macro = await loadMacro();

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

      <AnswerBar id={s.id} accent={s.accent} n={s.narrative} />

      <Reveal>
        <div
          className={`mb-3 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] ${
            macro.live
              ? "border-green-neon/30 bg-green-neon/8 text-green-neon"
              : "border-amber-neon/30 bg-amber-neon/8 text-amber-neon"
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
        <PaneGroupCard group={goldGroup(macro)} />
      </Reveal>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {macro.instruments.map((inst, i) => (
          <Reveal key={inst.id} delay={i * 0.06}>
            <InstrumentCard inst={inst} />
          </Reveal>
        ))}
      </div>

      <NarrativeGrid n={s.narrative} hideInsight />
      <SectionNav sections={brief.sections} currentId={s.id} />
    </div>
  );
}
