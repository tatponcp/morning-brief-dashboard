import { ACCENT, type Accent } from "@/lib/accent";

export function SectionHero({
  index,
  title,
  subtitle,
  source,
  accent,
  dateLabel,
}: {
  index: number;
  title: string;
  subtitle: string;
  source: string;
  accent: Accent;
  dateLabel: string;
}) {
  const a = ACCENT[accent];
  return (
    <div className="panel relative mb-6 overflow-hidden px-5 py-6 md:px-8 md:py-7">
      <div
        className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full blur-3xl"
        style={{ background: a.soft }}
      />
      <div className="relative flex flex-wrap items-start gap-x-5 gap-y-4">
        <div
          className={`grid size-14 shrink-0 place-items-center rounded-2xl border font-display text-2xl font-bold ${a.glow}`}
          style={{ borderColor: a.hex, color: a.hex, background: a.soft }}
        >
          {index}
        </div>

        <div className="min-w-0 flex-1">
          <h1
            className={`bg-gradient-to-r ${a.grad} text-gradient font-display text-2xl leading-tight font-bold md:text-[34px]`}
          >
            {title}
          </h1>
          <p className="mt-1.5 text-[14px] text-slate-400 md:text-[15px]">{subtitle}</p>
          <p className="mt-2 inline-flex rounded-full border border-white/8 bg-white/3 px-2.5 py-1 text-[11px] text-slate-500">
            แหล่งข้อมูล · {source}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-850/80 px-4 py-3 text-right">
          <p className="text-[11px] text-slate-500">ข้อมูล ณ</p>
          <p className="font-display text-lg font-bold text-[#ffc53d]">{dateLabel}</p>
        </div>
      </div>
    </div>
  );
}
