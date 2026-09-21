import { ArrowDown, ArrowRight, ArrowUp, CalendarClock, Layers } from "lucide-react";
import { toneOf } from "@/lib/accent";
import { thaiDate } from "@/lib/format";
import type { Bias, SeriesRead } from "@/lib/types";
import { Reveal } from "./Reveal";

const BIAS_LABEL = { bull: "บวก", neutral: "กลาง", bear: "ลบ" } as const;

/** ข้อมูลเก่าเก็บแค่ up / down */
const PRICE_FALLBACK: Record<string, { label: string; tone: Bias }> = {
  up: { label: "ขึ้น", tone: "bull" },
  down: { label: "ลง", tone: "bear" },
};
const OI_LABEL: Record<string, string> = { up: "เพิ่ม", flat: "ทรงตัว", down: "ลด", unknown: "ไม่นับ" };

/** มีอะไรให้ลูกค้าเห็นมากกว่าชิปธรรมดาไหม (หลาย series หรือช่วงย้ายสัญญา) */
export const hasSeriesStory = (reads?: SeriesRead[]) =>
  !!reads && (reads.length > 1 || reads.some((r) => r.expiry || r.oiUsed));

/**
 * ข้อ 1 — การ์ดทีละ series: แท่ง Day, OI, ความหมาย, คะแนน
 * ช่วงใกล้หมดอายุบอกลูกค้าตรง ๆ ว่า OI ที่ลดลงมาจากการย้ายสัญญา และระบบอ่าน OI รวมแทน
 * big = ขนาดสำหรับรูปส่งลูกค้า
 */
export function SeriesBreakdown({ reads, big = false }: { reads: SeriesRead[]; big?: boolean }) {
  const agree = reads.every((r) => r.bias === reads[0].bias);
  const roll = reads.find((r) => r.expiry);
  const oiUsed = reads.find((r) => r.oiUsed)?.oiUsed;
  const sm = big ? "text-[14.5px]" : "text-[12.5px]";

  return (
    <div className={big ? "space-y-2.5" : "mt-3 space-y-2"}>
      {reads.length > 1 && (
        <p className={`flex items-center gap-1.5 text-slate-400 ${big ? "text-[15px]" : "text-[12.5px]"}`}>
          <Layers className={big ? "size-4.5" : "size-3.5"} />
          อ่านแยกทีละ series ·{" "}
          <span className={agree ? "text-green-neon" : "text-amber-neon"}>
            {agree ? "ทุก series ไปทางเดียวกัน" : "series ไปคนละทาง ใช้ตัวหลักเป็นเกณฑ์"}
          </span>
        </p>
      )}

      {roll?.expiry && (
        <div
          className={`flex items-start gap-2 rounded-xl border border-amber-neon/30 bg-amber-neon/8 ${big ? "px-4 py-2.5 text-[14.5px]" : "px-3 py-2 text-[12.5px]"} text-slate-200`}
        >
          <CalendarClock className={`mt-0.5 shrink-0 text-amber-neon ${big ? "size-4.5" : "size-4"}`} />
          <span>
            <span className="font-semibold text-amber-neon">
              {roll.expiry.phase === "expired"
                ? `${roll.series} หมดอายุแล้ว`
                : roll.expiry.phase === "last-day"
                  ? `วันนี้ซื้อขายวันสุดท้ายของ ${roll.series}`
                  : `${roll.series} เหลือ ${roll.expiry.daysLeft} วันทำการ`}
            </span>{" "}
            (ซื้อขายวันสุดท้าย {thaiDate(roll.expiry.lastTrade)}) · ช่วงย้ายไป {roll.expiry.next} OI ของ series เดิมลดลงเองจากการย้ายสถานะ
            {oiUsed && (
              <>
                {" "}
                — วันนี้อ่านจาก{" "}
                <span className="font-semibold text-white">
                  {oiUsed === "unknown" ? "แท่งราคาอย่างเดียว" : `OI รวมทุก series (${OI_LABEL[oiUsed]})`}
                </span>
              </>
            )}
          </span>
        </div>
      )}

      <div className={`grid gap-2 ${reads.length > 1 ? (big ? "grid-cols-2 gap-2.5" : "sm:grid-cols-2") : ""}`}>
        {reads.map((r, i) => {
          const t = toneOf(r.bias);
          const px = r.priceLabel
            ? { label: r.priceLabel, tone: r.priceTone ?? "neutral" }
            : (PRICE_FALLBACK[r.price] ?? { label: r.price, tone: "neutral" as Bias });
          const card = (
            <div
              className={`relative overflow-hidden rounded-2xl border ${big ? "px-4 py-3.5" : "px-3.5 py-3"} transition-transform duration-300 hover:-translate-y-0.5`}
              style={{
                borderColor: `color-mix(in srgb, ${t.hex} ${i === 0 ? 45 : 28}%, transparent)`,
                background: `color-mix(in srgb, ${t.hex} ${i === 0 ? 10 : 6}%, transparent)`,
              }}
            >
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: t.hex, opacity: i === 0 ? 1 : 0.5 }} />
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-display font-bold text-white ${big ? "text-[19px]" : "text-[15.5px]"}`}>{r.series}</span>
                {i === 0 && reads.length > 1 && (
                  <span className="rounded-md bg-cyan-neon/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-cyan-neon">ตัวหลัก</span>
                )}
                {r.expiry && (
                  <span className="rounded-md bg-amber-neon/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-neon">
                    {r.expiry.phase === "expired" ? "หมดอายุ" : `ใกล้หมดอายุ · ${r.expiry.daysLeft} วัน`}
                  </span>
                )}
                <span className={`ml-auto rounded-full px-2 py-0.5 font-semibold ${t.bg} ${t.text} ${big ? "text-[13px]" : "text-[11.5px]"}`}>
                  {r.score}% · {BIAS_LABEL[r.bias]}
                </span>
              </div>
              <div className={`mt-2 flex flex-wrap gap-1.5 ${sm}`}>
                <Move label="แท่ง Day" dir={px.tone === "bull" ? "up" : px.tone === "bear" ? "down" : "flat"} tone={px.tone} text={px.label} />
                <Move
                  label="OI"
                  dir={r.oi === "up" ? "up" : r.oi === "down" ? "down" : "flat"}
                  tone={null}
                  text={`${OI_LABEL[r.oi] ?? r.oi}${r.expiry && r.oi === "down" ? " (ย้ายสัญญา)" : ""}`}
                />
              </div>
              <p className={`mt-1.5 text-slate-300 ${sm}`}>
                <span className={`font-semibold ${t.text}`}>{r.tag}</span>
              </p>
            </div>
          );
          return big ? (
            <div key={r.series}>{card}</div>
          ) : (
            <Reveal key={r.series} delay={0.05 + i * 0.06}>
              {card}
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

function Move({ label, dir, tone, text }: { label: string; dir: "up" | "down" | "flat"; tone: Bias | null; text: string }) {
  const cls = tone === null || tone === "neutral" ? "text-slate-100" : tone === "bull" ? "text-green-neon" : "text-rose-neon";
  const Icon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : ArrowRight;
  return (
    <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-ink-950/40 px-2 py-1">
      <span className="text-slate-400">{label}</span>
      <Icon className={`size-3.5 ${cls}`} />
      <span className={`font-semibold ${cls}`}>{text}</span>
    </span>
  );
}
