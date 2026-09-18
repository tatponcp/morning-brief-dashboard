import type { Bias, ScenarioPick } from "./types";

/**
 * คะแนนภาพรวมตลาด 0–100%
 *
 * แต่ละข้อได้คะแนนจากสัญญาณที่ IC เลือก (ขึ้น = 100 · ทรง = 50 · ลง = 0 แล้วเฉลี่ยทุกเส้นในข้อนั้น)
 * ภาพรวม = ค่าเฉลี่ยของทุกข้อที่อัปเดตแล้ว น้ำหนักเท่ากัน
 */

export const TONE_SCORE: Record<Bias, number> = { bull: 100, neutral: 50, bear: 0 };

export type Band = { min: number; max: number; label: string; tone: Bias; hint: string };

/** เกณฑ์ของภาพรวม — แสดงให้ลูกค้าเห็นบนหน้าแรกด้วย */
export const BANDS: Band[] = [
  { min: 80, max: 100, label: "บวกชัดเจน", tone: "bull", hint: "สัญญาณเกือบทุกข้อหนุนฝั่ง Long" },
  { min: 60, max: 80, label: "ค่อนข้างบวก", tone: "bull", hint: "ส่วนใหญ่หนุนขึ้น แต่ยังมีบางข้อที่ต้องระวัง" },
  { min: 40, max: 60, label: "กลาง · รอดูทิศทาง", tone: "neutral", hint: "สัญญาณผสม ยังไม่มีฝั่งไหนชนะชัด" },
  { min: 20, max: 40, label: "ค่อนข้างลบ", tone: "bear", hint: "ส่วนใหญ่กดดัน ควรระวังความเสี่ยง" },
  { min: 0, max: 20, label: "ลบชัดเจน", tone: "bear", hint: "สัญญาณเกือบทุกข้อกดดัน" },
];

export function bandOf(score: number): Band {
  return BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1];
}

/** คะแนนของหนึ่ง section — ยังไม่เลือกสถานการณ์ = ไม่นับ */
export function sectionScore(sc?: ScenarioPick): number | null {
  if (!sc || sc.id === "pending") return null;
  return Math.round(sc.score ?? TONE_SCORE[sc.bias]);
}

export function overallScore(scores: (number | null)[]) {
  const counted = scores.filter((x): x is number => x !== null);
  const score = counted.length ? Math.round(counted.reduce((a, b) => a + b, 0) / counted.length) : null;
  return { score, counted: counted.length, band: score === null ? null : bandOf(score) };
}
