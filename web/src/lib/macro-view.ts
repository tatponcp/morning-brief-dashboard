import type { MacroData } from "./market";
import type { PaneGroup } from "./types";

/**
 * กราฟทองคำของข้อ 6 — ใช้ร่วมกันระหว่างหน้าเว็บ, พรีวิวใน Studio และรูปส่งลูกค้า
 * (ข้อมูลโหลดสดจาก provider จึงไม่ได้เก็บไว้ใน section เหมือนข้ออื่น)
 */
export function goldGroup(macro: MacroData): PaneGroup {
  const last = macro.gold.at(-1)?.c ?? 0;
  return {
    id: "gold",
    title: "GOLD (COMEX) — ราคาทองคำ",
    subtitle: "แท่งเทียนรายวัน 1 ปีย้อนหลัง · hover เพื่อดูราคาแต่ละวัน",
    accentHex: "var(--c-amber)",
    panes: [
      {
        id: "gold-d",
        title: "GOLD (Daily)",
        kind: "candle",
        height: 300,
        digits: 2,
        series: [{ key: "c", name: "Gold", color: "var(--c-amber)" }],
        rows: macro.gold,
        refLines: [{ y: last, color: "var(--c-amber)", label: last.toFixed(2) }],
      },
    ],
  };
}
