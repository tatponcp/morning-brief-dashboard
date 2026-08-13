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

/* ───────── โมเดล pane สำหรับ section ที่วาดกราฟเอง (ข้อ 3, 6) ─────────
   หนึ่ง "group" = การ์ดหนึ่งใบ ข้างในซ้อนได้หลาย pane เหมือนหน้าจอโปรแกรมเทรด */

export type PaneKind = "candle" | "line" | "area";

export type SeriesDef = {
  key: string;
  name: string;
  color: string;
  strokeWidth?: number;
  /** วาดเป็นพื้นที่ไล่สีใต้เส้น */
  fill?: boolean;
  digits?: number;
};

export type RefLine = {
  y: number;
  color: string;
  label?: string;
  dash?: boolean;
};

export type PaneRow = { t: string } & Record<string, number | string>;

export type Pane = {
  id: string;
  title: string;
  note?: string;
  kind: PaneKind;
  height?: number;
  series: SeriesDef[];
  rows: PaneRow[];
  refLines?: RefLine[];
  /** ลากเส้น 0 (สำหรับกราฟสะสม) */
  zeroLine?: boolean;
  /** ป้ายค่าล่าสุดมุมขวา */
  lastBadge?: boolean;
  digits?: number;
};

export type PaneGroup = {
  id: string;
  title: string;
  subtitle?: string;
  accentHex?: string;
  panes: Pane[];
  footer?: { label: string; value: string; tone?: Bias }[];
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

/** จุดชี้บนภาพ — ระบบวาดกล่องคำอธิบาย + เส้นโยงให้เอง */
export type Callout = {
  /** ตำแหน่งจุดบนภาพ หน่วยเป็น % */
  x: number;
  y: number;
  text: string;
  tone?: Bias;
  /** ทิศที่กล่องคำอธิบายจะกางออก */
  side?: "left" | "right";
};

export type BoardImage = {
  src: string;
  alt: string;
  /** หัวข้อกำกับใต้ภาพ เช่น "S50U26 (Daily)" */
  caption?: string;
  callouts?: Callout[];
};

export type BoardStat = {
  label: string;
  value: string;
  delta?: string;
  tone?: Bias;
  spark?: number[];
};

/** โหมดภาพ — IC แคปภาพมาวาง ระบบครอบกรอบ/ชี้จุด/ตัวเลขให้เป็น Infographic */
export type ImageBoard = {
  images: BoardImage[];
  /** ตัวเลขเด่นแถวล่าง */
  stats?: BoardStat[];
};

export type Section = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  source: string;
  accent: "cyan" | "green" | "amber" | "violet" | "rose" | "sky";
  mode: "data" | "image";
  /** true = ตัวเลขยังเป็นข้อมูลจำลอง ยังไม่ใช่ของจริง (จะขึ้นป้ายเตือนบนหน้าเว็บ) */
  demo?: boolean;
  narrative: Narrative;
  contracts?: ContractSeries[];
  flows?: FlowRow[];
  board?: ImageBoard;
  /** ข้อ 3 · 6 — วาดกราฟเองจากข้อมูล ไม่ใช้ภาพแคป */
  groups?: PaneGroup[];
  /** การ์ดตัวเลขเด่นใต้กราฟหลัก (ข้อ 6) */
  instruments?: Instrument[];
};

/** เครื่องมือหนึ่งตัวในหน้า Global Macro */
export type Instrument = {
  id: string;
  label: string;
  sub: string;
  color: string;
  value: number;
  change: number;
  changePct: number;
  suffix?: string;
  digits?: number;
  note?: string;
  tone?: Bias;
  rows: { t: string; c: number }[];
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
