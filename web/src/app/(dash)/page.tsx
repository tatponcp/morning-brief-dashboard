import Link from "next/link";
import { ArrowUpRight, Gauge, Lightbulb, MessageSquareText, Target, Zap } from "lucide-react";
import { loadBrief } from "@/lib/brief-store";
import { ACCENT, toneOf } from "@/lib/accent";
import { Reveal } from "@/components/ui/Reveal";
import { MiniSpark } from "@/components/ui/MiniSpark";

export default async function SummaryPage() {
  const { brief } = await loadBrief();

  return (
    <div className="space-y-5">
      {/* hero */}
      <div className="panel relative overflow-hidden px-6 py-8 md:px-10 md:py-10">
        <div className="pointer-events-none absolute -top-32 right-0 size-96 animate-float rounded-full bg-[#22d3ee]/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end gap-6">
          <div className="min-w-0 flex-1">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#ffc53d]/30 bg-[#ffc53d]/8 px-3 py-1 text-[11.5px] text-[#ffc53d]">
              <Gauge className="size-3.5" /> ข้อมูล ณ {brief.dateLabelTH}
            </p>
            <h1 className="font-display text-3xl leading-tight font-bold text-white md:text-[44px]">
              สรุปภาพรวม{" "}
              <span className="text-gradient bg-gradient-to-r from-[#ffc53d] to-[#fb7185]">
                Action วันนี้
              </span>
            </h1>
            <p className="mt-2 text-[15px] text-slate-400">{brief.headline}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        {/* big picture */}
        <Reveal>
          <div className="panel h-full px-5 py-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#22d3ee]/15 text-[#22d3ee]">
                <Target className="size-5" />
              </span>
              <h2 className="font-display text-[19px] font-bold text-[#22d3ee]">Big Picture วันนี้</h2>
            </div>
            <div className="space-y-3">
              {brief.bigPicture.map((b) => {
                const t = toneOf(b.tone);
                return (
                  <div
                    key={b.rank}
                    className="flex gap-4 rounded-xl border border-white/8 bg-white/2 px-4 py-3.5 transition hover:border-white/16 hover:bg-white/4"
                  >
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg border font-display text-[13px] font-bold"
                      style={{ borderColor: `${t.hex}55`, color: t.hex, background: `${t.hex}14` }}
                    >
                      {b.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-[16px] font-bold text-white">{b.title}</p>
                      <p className={`text-[14px] leading-snug ${t.text}`}>{b.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* 6 section tiles */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brief.sections.map((s, i) => {
            const a = ACCENT[s.accent];
            return (
              <Reveal key={s.id} delay={i * 0.05}>
                <Link
                  href={`/${s.id}`}
                  className="panel group flex h-full flex-col px-4 py-4 transition duration-300 hover:-translate-y-1"
                  style={{ borderColor: `${a.hex}2e` }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="grid size-6 place-items-center rounded-md font-display text-[11px] font-bold"
                      style={{ background: a.soft, color: a.hex }}
                    >
                      {s.index}
                    </span>
                    <p className="truncate text-[13px] font-semibold text-slate-100">{s.title}</p>
                    <ArrowUpRight className="ml-auto size-4 text-slate-600 transition group-hover:text-white" />
                  </div>
                  <MiniSpark section={s} />
                  <p className="mt-2 line-clamp-2 text-[11.5px] leading-snug text-slate-500">
                    {s.narrative.insight}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* data says + action */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Reveal>
          <div className="panel h-full px-5 py-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#a78bfa]/15 text-[#a78bfa]">
                <MessageSquareText className="size-5" />
              </span>
              <h2 className="font-display text-[19px] font-bold text-[#a78bfa]">
                สิ่งที่ Data กำลังบอก
              </h2>
            </div>
            <ul className="space-y-3">
              {brief.dataSays.map((d, i) => (
                <li key={i} className="flex gap-3 text-[14.5px] text-slate-200">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#a78bfa]" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="panel relative h-full overflow-hidden px-5 py-5">
            <div className="pointer-events-none absolute -right-16 -bottom-16 size-64 rounded-full bg-[#34f5a0]/8 blur-3xl" />
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#ffc53d]/15 text-[#ffc53d]">
                <Zap className="size-5" />
              </span>
              <h2 className="font-display text-[19px] font-bold text-[#ffc53d]">Action วันนี้</h2>
            </div>
            <div className="relative grid gap-2.5 sm:grid-cols-2">
              {brief.todayActions.map((a, i) => {
                const t = toneOf(a.tone);
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-white/8 bg-white/3 px-4 py-3"
                    style={{ borderColor: `${t.hex}33` }}
                  >
                    <p className="text-[11.5px] text-slate-500">{a.label}</p>
                    <p className={`font-display text-[16px] font-bold ${t.text}`}>{a.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-[#22d3ee]/25 bg-gradient-to-r from-[#22d3ee]/10 via-transparent to-[#fb7185]/10 px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffc53d]/15 text-[#ffc53d]">
              <Lightbulb className="size-5" />
            </span>
            <p className="text-[15.5px] leading-relaxed text-slate-100">
              <span className="font-display font-bold text-[#22d3ee]">Insight: </span>
              {brief.insight}
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
