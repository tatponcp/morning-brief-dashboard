import Link from "next/link";
import { ArrowUpRight, Compass, Gauge, Lightbulb, TriangleAlert, Zap } from "lucide-react";
import { loadBrief } from "@/lib/brief-store";
import { ACCENT, toneOf } from "@/lib/accent";
import type { Bias, Section } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { MiniSpark } from "@/components/ui/MiniSpark";
import { BiasGauge } from "@/components/ui/BiasGauge";

const BIAS_LABEL: Record<Bias, string> = { bull: "บวก", neutral: "กลาง", bear: "ลบ" };

/** ภาพรวมของวันคำนวณจากสถานการณ์ที่ IC เลือกในแต่ละ section */
function summarize(sections: Section[]) {
  const picked = sections.filter((s) => s.narrative.scenario);
  const count = { bull: 0, neutral: 0, bear: 0 } as Record<Bias, number>;
  for (const s of picked) count[s.narrative.scenario!.bias]++;
  const score = picked.length ? (count.bull - count.bear) / picked.length : 0;
  const label = !picked.length
    ? "รอ IC เลือกสถานการณ์"
    : score > 0.15
      ? "ภาพรวมเอียงบวก"
      : score < -0.15
        ? "ภาพรวมเอียงลบ"
        : "ภาพรวมกลาง ๆ";
  return { picked, count, score, label };
}

export default async function SummaryPage() {
  const { brief } = await loadBrief();
  const { picked, count, score, label } = summarize(brief.sections);

  const bulls = picked.filter((s) => s.narrative.scenario!.bias === "bull");
  const bears = picked.filter((s) => s.narrative.scenario!.bias === "bear");

  const views = brief.sections
    .map((s) => ({ s, view: s.narrative.actions.find((a) => a.label === "มุมมอง") }))
    .filter((x) => x.view?.value);
  const levels = brief.sections.flatMap((s) =>
    s.narrative.actions
      // ข้ามแถวตั้งต้นที่ยังรอ IC
      .filter((a) => a.label !== "มุมมอง" && a.label && a.value && !a.value.startsWith("รอ IC"))
      .slice(0, 3)
      .map((a) => ({ s, a })),
  );

  return (
    <div className="space-y-5">
      {/* hero + gauge */}
      <div className="panel relative overflow-hidden px-6 py-7 md:px-9">
        <div className="pointer-events-none absolute -top-32 right-0 size-96 animate-float rounded-full bg-cyan-neon/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-10 size-80 rounded-full bg-violet-neon/8 blur-3xl" />
        <div className="relative grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-neon/30 bg-amber-neon/8 px-3 py-1 text-[11.5px] text-amber-neon">
              <Gauge className="size-3.5" /> Morning Brief · {brief.dateLabelTH}
            </p>
            <h1 className="font-display text-3xl leading-tight font-bold text-white md:text-[42px]">
              สรุปภาพรวม{" "}
              <span className="text-gradient bg-gradient-to-r from-amber-neon to-rose-neon">Action วันนี้</span>
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["bull", "neutral", "bear"] as Bias[]).map((b) => {
                const t = toneOf(b);
                return (
                  <span
                    key={b}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[13px] ${t.bg} ${t.text}`}
                    style={{ borderColor: `color-mix(in srgb, ${t.hex} 30%, transparent)` }}
                  >
                    <span className="font-display text-[18px] font-bold">{count[b]}</span>
                    สัญญาณ{BIAS_LABEL[b]}
                  </span>
                );
              })}
            </div>
            {bulls.length > 0 && bears.length > 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-neon/25 bg-amber-neon/6 px-3 py-2 text-[13px] text-amber-neon">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                สัญญาณขัดกัน: {bulls.map((s) => `ข้อ ${s.index}`).join(", ")} บวก แต่{" "}
                {bears.map((s) => `ข้อ ${s.index}`).join(", ")} ลบ
              </p>
            )}
          </div>
          <BiasGauge
            score={score}
            label={label}
            sub={picked.length ? `เลือกแล้ว ${picked.length} จาก ${brief.sections.length} ข้อ` : "IC ยังไม่ได้เลือกสถานการณ์ใน Studio"}
          />
        </div>
      </div>

      {/* 6 สัญญาณ */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {brief.sections.map((s, i) => {
          const a = ACCENT[s.accent];
          const sc = s.narrative.scenario;
          const t = toneOf(sc?.bias);
          const view = s.narrative.actions.find((x) => x.label === "มุมมอง");
          return (
            <Reveal key={s.id} delay={i * 0.05}>
              <Link
                href={`/${s.id}`}
                className="panel group relative flex h-full flex-col overflow-hidden px-4 py-4 transition duration-300 hover:-translate-y-1"
                style={{ borderColor: `color-mix(in srgb, ${sc ? t.hex : a.hex} 22%, transparent)` }}
              >
                <span
                  className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-50 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: sc ? t.hex : a.hex }}
                />
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="grid size-6 place-items-center rounded-md font-display text-[11px] font-bold"
                    style={{ background: a.soft, color: a.hex }}
                  >
                    {s.index}
                  </span>
                  <p className="truncate text-[13px] font-semibold text-slate-100">{s.title}</p>
                  <ArrowUpRight className="ml-auto size-4 text-slate-600 transition group-hover:rotate-45 group-hover:text-white" />
                </div>

                {sc ? (
                  <span
                    className={`mb-2 inline-flex w-max items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-semibold ${t.bg} ${t.text}`}
                  >
                    <Compass className="size-3.5" />
                    {sc.title}
                  </span>
                ) : (
                  <span className="mb-2 text-[12px] text-slate-500">ยังไม่ได้เลือกสถานการณ์</span>
                )}

                <MiniSpark section={s} />
                <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-slate-300">{s.narrative.insight}</p>
                {view?.value && (
                  <p className="mt-auto pt-2 text-[12px] text-slate-500">
                    มุมมอง: <span className={`font-semibold ${toneOf(view.tone).text}`}>{view.value}</span>
                  </p>
                )}
              </Link>
            </Reveal>
          );
        })}
      </div>

      {/* Action รวม */}
      {(views.length > 0 || levels.length > 0) && (
        <Reveal>
          <div className="panel relative overflow-hidden px-5 py-5">
            <div className="pointer-events-none absolute -right-16 -bottom-16 size-64 rounded-full bg-green-neon/8 blur-3xl" />
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-amber-neon/15 text-amber-neon">
                <Zap className="size-5" />
              </span>
              <h2 className="font-display text-[19px] font-bold text-amber-neon">Action วันนี้</h2>
            </div>
            <div className="relative grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {views.map(({ s, view }) => {
                const t = toneOf(view!.tone);
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border bg-white/3 px-4 py-3"
                    style={{ borderColor: `color-mix(in srgb, ${t.hex} 25%, transparent)` }}
                  >
                    <p className="text-[11.5px] text-slate-500">
                      ข้อ {s.index} · {s.title}
                    </p>
                    <p className={`font-display text-[16px] font-bold ${t.text}`}>{view!.value}</p>
                  </div>
                );
              })}
            </div>
            {levels.length > 0 && (
              <div className="relative mt-3 flex flex-wrap gap-2">
                {levels.map(({ s, a }, i) => (
                  <span key={i} className="rounded-lg border border-white/8 bg-white/2 px-2.5 py-1 text-[12px] text-slate-300">
                    <span className="text-slate-500">ข้อ {s.index} {a.label}:</span> {a.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      )}

      {/* Insight ของแต่ละข้อ */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-cyan-neon/25 bg-gradient-to-r from-cyan-neon/10 via-transparent to-rose-neon/10 px-5 py-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-neon/15 text-amber-neon">
              <Lightbulb className="size-5" />
            </span>
            <h2 className="font-display text-[17px] font-bold text-cyan-neon">Insight สั้น ๆ</h2>
          </div>
          <ul className="grid gap-2 md:grid-cols-2">
            {brief.sections.map((s) => (
              <li key={s.id} className="flex gap-2.5 text-[14px] leading-snug text-slate-100">
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ background: toneOf(s.narrative.scenario?.bias).hex }}
                />
                <span>
                  <span className="text-slate-500">ข้อ {s.index} </span>
                  {s.narrative.insight}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
