import { TriangleAlert } from "lucide-react";
import { ACCENT, type Accent } from "@/lib/accent";

/** หัว section — คุมให้เตี้ย จะได้ไม่กินพื้นที่จอก่อนถึงเนื้อหา */
export function SectionHero({
  index,
  title,
  subtitle,
  source,
  accent,
  dateLabel,
  demo,
  series,
}: {
  index: number;
  title: string;
  subtitle: string;
  source: string;
  accent: Accent;
  dateLabel: string;
  /** true = ตัวเลขยังเป็นข้อมูลจำลอง */
  demo?: boolean;
  /** ชื่อสัญญาที่ใช้อยู่ เช่น S50Z26 */
  series?: string;
}) {
  const a = ACCENT[accent];
  return (
    <div className="panel relative mb-3 overflow-hidden px-4 py-3 md:px-5 md:py-3.5">
      <div
        className="pointer-events-none absolute -top-16 -left-16 size-44 rounded-full blur-3xl"
        style={{ background: a.soft }}
      />
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          className="grid size-9 shrink-0 place-items-center rounded-xl border font-display text-[15px] font-bold"
          style={{ borderColor: a.hex, color: a.hex, background: a.soft }}
        >
          {index}
        </div>

        <h1
          className={`bg-gradient-to-r ${a.grad} text-gradient font-display text-[19px] leading-tight font-bold md:text-[23px]`}
        >
          {title}
        </h1>

        {series && (
          <span
            className="rounded-lg border px-2 py-0.5 font-display text-[13px] font-bold"
            style={{ borderColor: a.hex, color: a.hex, background: a.soft }}
          >
            {series}
          </span>
        )}

        <span className="hidden h-4 w-px bg-white/12 lg:block" />
        <p className="hidden max-w-lg truncate text-[14px] text-slate-300 lg:block">{subtitle}</p>

        <div className="ml-auto flex items-center gap-2">
          {demo && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-neon/40 bg-amber-neon/10 px-2 py-1 text-[11px] font-semibold text-amber-neon">
              <TriangleAlert className="size-3" />
              ข้อมูลจำลอง
            </span>
          )}
          <span className="rounded-lg border border-white/10 bg-ink-850/80 px-2.5 py-1 text-[11.5px]">
            <span className="text-slate-500">ข้อมูล ณ </span>
            <span className="font-display font-bold text-amber-neon">{dateLabel}</span>
          </span>
        </div>

        {/* บรรทัดรองบนจอเล็ก — ไม่เบียดหัวข้อ */}
        <p className="w-full text-[14px] text-slate-300 lg:hidden">{subtitle}</p>
        <p className="w-full text-[12px] text-slate-500">แหล่งข้อมูล · {source}</p>
      </div>
    </div>
  );
}
