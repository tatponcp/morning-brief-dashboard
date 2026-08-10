export type Bias = "bull" | "bear" | "neutral";

/** บล็อกที่ทุก Section ต้องมี: สรุปสั้น / แปลความ / Action วันนี้ */
export type Narrative = {
  /** 1. สรุปสั้น — bullet สั้น ๆ 2-4 ข้อ */
  summary: string[];
  /** 2. แปลความ — ย่อหน้าเดียว บอกว่า "ภาพนี้แปลว่าอะไร" */
  interpretation: string;
  /** 3. Action วันนี้ — key/value ที่ IC กรอกเอง */
  actions: { label: string; value: string; tone?: Bias }[];
  /** แถบ Insight ปิดท้าย section */
  insight: string;
};

export type Candle = {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
};

/** Section 1 — S50 Futures + Open Interest (กรอกข้อมูลย้อนหลังได้) */
export type ContractSeries = {
  symbol: string;
  rows: { t: string; close: number; oi: number }[];
};

/** Section 2 — สะสม Long/Short ต่างชาติและกองทุน (กรอกข้อมูลย้อนหลังได้) */
export type FlowRow = {
  t: string;
  fund: number;
  foreign: number;
  total: number;
  set50: number;
};

/** Section 3-6 — IC แคปภาพมาวาง แล้วเติมคำอธิบาย */
export type ImageBoard = {
  src: string;
  alt: string;
  /** จุดโฟกัสบนภาพ (0-100%) ที่ให้ระบบวาด callout สวย ๆ ทับให้ */
  callouts?: { x: number; y: number; text: string; tone?: Bias }[];
  /** ตัวเลขเด่นข้างภาพ */
  stats?: { label: string; value: string; delta?: string; tone?: Bias; spark?: number[] }[];
};

export type Section = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  source: string;
  accent: "cyan" | "green" | "amber" | "violet" | "rose" | "sky";
  mode: "data" | "image";
  narrative: Narrative;
  contracts?: ContractSeries[];
  flows?: FlowRow[];
  board?: ImageBoard;
};

export type Brief = {
  /** ISO date */
  date: string;
  dateLabelTH: string;
  headline: string;
  bigPicture: { rank: number; title: string; body: string; tone: Bias }[];
  dataSays: string[];
  todayActions: { label: string; value: string; tone?: Bias }[];
  insight: string;
  sections: Section[];
};
