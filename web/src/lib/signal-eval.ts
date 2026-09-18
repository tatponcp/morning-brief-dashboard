import { bandOf, overallScore, type Band } from "./market-score";
import type { Bias } from "./types";

/**
 * ตรวจความแม่นของสัญญาณย้อนหลัง
 *
 * Brief วันที่ d เผยแพร่ช่วงเช้าก่อนตลาดเปิด → วัดผลด้วยการเปลี่ยนแปลงของ S50 ในวันนั้น
 *   ผลจริง = ราคาปิดวัน d เทียบราคาปิดวันทำการก่อนหน้า
 * ทำนายถูก:
 *   ภาพรวมบวก (≥ 60%)  → S50 ปิดบวก
 *   ภาพรวมลบ (≤ 40%)   → S50 ปิดลบ
 *   ภาพรวมกลาง         → S50 แกว่งไม่เกิน ±FLAT_PCT%
 */

export const FLAT_PCT = 0.5;

export type LogEntry = {
  date: string;
  /** คะแนนของแต่ละข้อตอนเผยแพร่ (null = ข้อนั้นยังไม่ได้เลือกสัญญาณ) */
  scores: Record<string, number | null>;
  /** ทิศของแต่ละข้อ ใช้ดูว่าข้อไหนชี้ถูกบ่อย */
  biases: Record<string, Bias | undefined>;
  /** เวอร์ชันกติกาที่ใช้ตอนเผยแพร่ */
  rules?: string;
};

export type EvalRow = LogEntry & {
  overall: number | null;
  counted: number;
  /** คะแนนรวมแบบไม่นับข้อ 6 (ข้อ 6 ตีความเป็นทองคำ) */
  overallExMacro: number | null;
  band: Band | null;
  close: number | null;
  prevClose: number | null;
  /** แหล่งราคาที่ใช้วัดผลวันนั้น */
  source: string | null;
  /** % เปลี่ยนแปลงของวันนั้น · null = ยังไม่มีราคาปิด */
  ret: number | null;
  hit: boolean | null;
};

export type Call = "up" | "down" | "flat";

export function callOf(score: number): Call {
  return score >= 60 ? "up" : score <= 40 ? "down" : "flat";
}

export function isHit(call: Call, ret: number) {
  if (call === "up") return ret > 0;
  if (call === "down") return ret < 0;
  return Math.abs(ret) <= FLAT_PCT;
}

/** ราคาปิดวันทำการล่าสุดก่อนวันที่กำหนด */
function prevOf(prices: Map<string, number>, date: string) {
  let best: string | null = null;
  for (const d of prices.keys()) if (d < date && (!best || d > best)) best = d;
  return best ? prices.get(best)! : null;
}

export type PriceSource = { label: string; prices: Map<string, number> };

/**
 * sources เรียงตามลำดับที่อยากใช้ — ราคาวันนั้นและวันก่อนต้องมาจากแหล่งเดียวกัน
 * (ราคาสัญญา S50 กับดัชนี SET50 ต่างกันเล็กน้อย ถ้าผสมกันจะได้ % ปลอม)
 */
export function evaluate(entries: LogEntry[], sources: PriceSource[] | Map<string, number>): EvalRow[] {
  const list: PriceSource[] = sources instanceof Map ? [{ label: "ราคา", prices: sources }] : sources;
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const all = overallScore(Object.values(e.scores));
      const ex = overallScore(Object.entries(e.scores).filter(([id]) => id !== "macro").map(([, v]) => v));
      let close: number | null = null;
      let prevClose: number | null = null;
      let source: string | null = null;
      for (const src of list) {
        const c = src.prices.get(e.date);
        const p = c === undefined ? null : prevOf(src.prices, e.date);
        if (c !== undefined && p) {
          close = c;
          prevClose = p;
          source = src.label;
          break;
        }
      }
      const ret = close !== null && prevClose ? ((close - prevClose) / prevClose) * 100 : null;
      return {
        ...e,
        overall: all.score,
        counted: all.counted,
        overallExMacro: ex.score,
        band: all.score === null ? null : bandOf(all.score),
        close,
        prevClose,
        source,
        ret,
        hit: all.score === null || ret === null ? null : isHit(callOf(all.score), ret),
      };
    });
}

export type Stat = { label: string; n: number; hits: number; rate: number | null; avgRet: number | null };

const stat = (label: string, rows: { hit: boolean; ret: number }[]): Stat => ({
  label,
  n: rows.length,
  hits: rows.filter((r) => r.hit).length,
  rate: rows.length ? Math.round((rows.filter((r) => r.hit).length / rows.length) * 100) : null,
  avgRet: rows.length ? rows.reduce((s, r) => s + r.ret, 0) / rows.length : null,
});

/** สรุปความแม่น: รวม · แยกตามเกณฑ์ · แยกตามข้อ · แบบไม่นับข้อ 6 */
export function summarize(rows: EvalRow[], sections: { id: string; title: string }[]) {
  const done = rows.filter((r) => r.ret !== null && r.overall !== null) as (EvalRow & { ret: number; overall: number })[];

  const overall = stat(
    "ภาพรวม 6 ข้อ",
    done.map((r) => ({ hit: isHit(callOf(r.overall), r.ret), ret: r.ret })),
  );
  const exMacro = stat(
    "ไม่นับข้อ 6 (ทองคำ)",
    done
      .filter((r) => r.overallExMacro !== null)
      .map((r) => ({ hit: isHit(callOf(r.overallExMacro!), r.ret), ret: r.ret })),
  );

  const byBand = ["บวกชัดเจน", "ค่อนข้างบวก", "กลาง · รอดูทิศทาง", "ค่อนข้างลบ", "ลบชัดเจน"].map((label) =>
    stat(
      label,
      done.filter((r) => bandOf(r.overall).label === label).map((r) => ({ hit: isHit(callOf(r.overall), r.ret), ret: r.ret })),
    ),
  );

  // แต่ละข้อ: ทิศที่ข้อนั้นชี้ (บวก/ลบ) ตรงกับทิศของ S50 วันนั้นไหม · ข้อที่ชี้กลางไม่นับ
  const bySection = sections.map((s) =>
    stat(
      s.title,
      done
        .filter((r) => r.biases[s.id] === "bull" || r.biases[s.id] === "bear")
        .map((r) => ({ hit: r.biases[s.id] === "bull" ? r.ret > 0 : r.ret < 0, ret: r.ret })),
    ),
  );

  return { overall, exMacro, byBand, bySection, pending: rows.filter((r) => r.ret === null).length };
}
