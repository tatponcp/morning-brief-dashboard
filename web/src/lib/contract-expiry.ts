/**
 * ปฏิทินหมดอายุของ SET50 Index Futures — ใช้บอกช่วงย้ายสัญญา (Rollover)
 *
 * สเปก TFEX: วันซื้อขายวันสุดท้าย = วันทำการก่อนวันทำการสุดท้ายของเดือนที่สัญญาหมดอายุ
 * เช่น S50U26 → เดือนทำการสุดท้ายของ ก.ย. 2569 คือ พ. 30 → ซื้อขายวันสุดท้าย อ. 29 ก.ย.
 *
 * ช่วงใกล้หมดอายุ คนย้ายสถานะจาก series เดิมไป series ถัดไป → OI ของ series เดิมลดลงเอง
 * ไม่ได้แปลว่ามีการปิดสถานะจริง ต้องดู OI รวมทุก series แทน
 *
 * วันหยุด: นับเสาร์-อาทิตย์ + วันหยุดตลาดที่วันที่ตายตัว (วันหยุดตามจันทรคติไม่ได้นับ)
 * ถ้าปีไหนตลาดประกาศวันหยุดพิเศษปลายเดือน ให้เพิ่มใน EXTRA_HOLIDAYS
 */

/** เหลือไม่เกินกี่วันทำการก่อนวันซื้อขายสุดท้าย ถือว่าอยู่ช่วงย้ายสัญญา */
export const ROLL_WINDOW = 7;
/** เหลือไม่เกินกี่วันทำการ ควรเริ่มใช้ series ถัดไปเป็นตัวหลัก (สภาพคล่องย้ายไปแล้ว) */
export const SWITCH_MAIN = 2;

const MONTH_CODE = "FGHJKMNQUVXZ";
const QUARTERLY = [2, 5, 8, 11]; // H M U Z (index 0-based)

/** วันหยุดตลาดที่วันที่ตายตัว (MM-DD) */
const FIXED_HOLIDAYS = new Set([
  "01-01", "04-06", "04-13", "04-14", "04-15", "05-01", "06-03",
  "07-28", "08-12", "10-13", "10-23", "12-05", "12-10", "12-31",
]);
/** วันหยุดพิเศษรายปี (YYYY-MM-DD) */
const EXTRA_HOLIDAYS = new Set<string>([]);

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (s: string) => new Date(s + "T00:00:00Z");

function isBusinessDay(d: Date) {
  const wd = d.getUTCDay();
  if (wd === 0 || wd === 6) return false;
  const s = iso(d);
  return !FIXED_HOLIDAYS.has(s.slice(5)) && !EXTRA_HOLIDAYS.has(s);
}

function prevBusinessDay(d: Date) {
  const x = new Date(d);
  do x.setUTCDate(x.getUTCDate() - 1);
  while (!isBusinessDay(x));
  return x;
}

export type SeriesCode = { root: string; month: number; year: number };

/** "S50U26" → { month: 8 (ก.ย.), year: 2026 } */
export function parseSeries(code: string): SeriesCode | null {
  const m = /^([A-Z0-9]+?)([FGHJKMNQUVXZ])(\d{2})$/.exec(code.trim().toUpperCase());
  if (!m) return null;
  return { root: m[1], month: MONTH_CODE.indexOf(m[2]), year: 2000 + Number(m[3]) };
}

/** วันซื้อขายวันสุดท้าย (ISO) */
export function lastTradingDay(code: string): string | null {
  const p = parseSeries(code);
  if (!p) return null;
  // วันทำการสุดท้ายของเดือน แล้วถอยไปอีก 1 วันทำการ
  let last = new Date(Date.UTC(p.year, p.month + 1, 1));
  last = prevBusinessDay(last);
  return iso(prevBusinessDay(last));
}

/** series ไตรมาสถัดไป — S50U26 → S50Z26 · S50Z26 → S50H27 */
export function nextSeries(code: string): string | null {
  const p = parseSeries(code);
  if (!p) return null;
  const q = QUARTERLY.find((m) => m > p.month);
  const month = q ?? QUARTERLY[0];
  const year = q === undefined ? p.year + 1 : p.year;
  return `${p.root}${MONTH_CODE[month]}${String(year % 100).padStart(2, "0")}`;
}

/** จำนวนวันทำการหลัง from จนถึง to (นับ to ด้วย) — to ก่อน from ได้ค่าติดลบ */
export function businessDaysBetween(from: string, to: string): number {
  const a = utc(from);
  const b = utc(to);
  if (b < a) return -businessDaysBetween(to, from);
  let n = 0;
  const x = new Date(a);
  while (x < b) {
    x.setUTCDate(x.getUTCDate() + 1);
    if (isBusinessDay(x)) n++;
  }
  return n;
}

export type ExpiryPhase = "normal" | "rollover" | "last-day" | "expired";

export type ExpiryInfo = {
  series: string;
  lastTrade: string;
  /** วันทำการที่เหลือหลังวันนี้ จนถึงวันซื้อขายสุดท้าย (0 = วันนี้คือวันสุดท้าย) */
  daysLeft: number;
  phase: ExpiryPhase;
  next: string;
};

/** สถานะของ series ณ วันที่ของ brief */
export function expiryInfo(code: string, date: string): ExpiryInfo | null {
  const lastTrade = lastTradingDay(code);
  const next = nextSeries(code);
  if (!lastTrade || !next || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const daysLeft = businessDaysBetween(date, lastTrade);
  const phase: ExpiryPhase =
    daysLeft < 0 ? "expired" : daysLeft === 0 ? "last-day" : daysLeft <= ROLL_WINDOW ? "rollover" : "normal";
  return { series: code.trim().toUpperCase(), lastTrade, daysLeft, phase, next };
}

/** อยู่ช่วงที่ OI ของ series นี้บิดเพราะการย้ายสัญญาไหม */
export const inRoll = (e?: ExpiryInfo | null) => !!e && e.phase !== "normal";
