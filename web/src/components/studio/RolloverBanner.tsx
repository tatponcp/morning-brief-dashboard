"use client";

import { motion } from "motion/react";
import { ArrowRightLeft, CalendarClock, Plus } from "lucide-react";
import { ROLL_WINDOW, SWITCH_MAIN, expiryInfo, inRoll } from "@/lib/contract-expiry";
import { thaiDate } from "@/lib/format";
import { seriesList } from "@/lib/signal-forms";

/**
 * ข้อ 1 ช่วงใกล้หมดอายุ — ระบบนับวันจากรหัส series เอง (เช่น S50U26 → ซื้อขายวันสุดท้าย 29 ก.ย.)
 * บอก IC ว่า OI ที่ลดลงช่วงนี้อาจมาจากการย้ายสัญญา และช่วยเพิ่ม/สลับ series ถัดไปได้คลิกเดียว
 */
export function RolloverBanner({
  series,
  date,
  onSeries,
}: {
  series?: string;
  date: string;
  onSeries: (next: string) => void;
}) {
  const list = seriesList(series);
  const front = list.map((s) => expiryInfo(s, date)).find(inRoll);
  if (!front) return null;

  const hasNext = list.includes(front.next);
  const mainIsFront = list[0] === front.series;
  const expired = front.phase === "expired";
  const text = expired ? "text-rose-neon" : "text-amber-neon";
  const color = expired ? "var(--color-rose-neon)" : "var(--color-amber-neon)";

  const replaceFront = () =>
    onSeries((hasNext ? list.filter((s) => s !== front.series) : list.map((s) => (s === front.series ? front.next : s))).join(" / "));
  const addNext = () => onSeries([...list, front.next].join(" / "));
  const makeNextMain = () => onSeries([front.next, ...list.filter((s) => s !== front.next)].join(" / "));

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border px-3.5 py-3"
      style={{
        borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
        background: `color-mix(in srgb, ${color} 7%, transparent)`,
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <CalendarClock className={`size-4 ${text}`} />
        <p className={`text-[13.5px] font-semibold ${text}`}>
          {expired
            ? `${front.series} หมดอายุแล้ว`
            : front.phase === "last-day"
              ? `วันนี้ซื้อขายวันสุดท้ายของ ${front.series}`
              : `${front.series} เหลือ ${front.daysLeft} วันทำการ · ช่วงย้ายสัญญา`}
        </p>
        <span className="text-[12px] text-slate-400">ซื้อขายวันสุดท้าย {thaiDate(front.lastTrade)}</span>
        {!expired && (
          <span className="ml-auto flex gap-1" aria-hidden>
            {Array.from({ length: ROLL_WINDOW }, (_, i) => (
              <span
                key={i}
                className="h-1.5 w-3 rounded-full"
                style={{ background: i < front.daysLeft ? color : "rgba(255,255,255,0.1)" }}
              />
            ))}
          </span>
        )}
      </div>

      <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-300">
        {expired
          ? `ภาพวันนี้ควรเป็น ${front.next} แล้ว`
          : `OI ของ ${front.series} ช่วงนี้ลดลงเองเพราะคนย้ายไป ${front.next} ไม่ได้แปลว่าปิดสถานะเสมอ — ระบบถามเพิ่ม "OI รวมทุก series" และใช้ค่านั้นให้คะแนนแทน`}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {expired && (
          <Btn onClick={replaceFront} icon={<ArrowRightLeft className="size-3.5" />}>
            เปลี่ยนเป็น {front.next}
          </Btn>
        )}
        {!expired && !hasNext && (
          <Btn onClick={addNext} icon={<Plus className="size-3.5" />}>
            เพิ่ม {front.next} มาเทียบ
          </Btn>
        )}
        {!expired && hasNext && mainIsFront && front.daysLeft <= SWITCH_MAIN && (
          <Btn onClick={makeNextMain} icon={<ArrowRightLeft className="size-3.5" />}>
            ให้ {front.next} เป็นตัวหลัก (สภาพคล่องย้ายแล้ว)
          </Btn>
        )}
      </div>
    </motion.div>
  );
}

function Btn({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-ink-950/50 px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-100 transition hover:border-white/30"
    >
      {icon}
      {children}
    </motion.button>
  );
}
