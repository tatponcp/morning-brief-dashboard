import { S50_PRICE_REFERENCE } from "@/data/price-reference";
import type { Brief, ContractSeries, FlowRow, Narrative, Section } from "./types";

/** รูปร่างของไฟล์ที่กด "ส่งออก Brief" ออกมาจาก /studio (narrative ถูกแบให้แบนอยู่ระดับเดียวกับ id) */
export type PublishedSection = { id: string } & Partial<Narrative> &
  Partial<Pick<Section, "board" | "contracts" | "flows" | "spread" | "asOfLabel" | "title" | "subtitle" | "series">>;

export type PublishedFile = {
  date?: string;
  dateLabelTH?: string;
  sections?: PublishedSection[];
  /** ประทับตอนเผยแพร่ (ฝั่งเซิร์ฟเวอร์) — ใช้ตรวจความแม่นย้อนหลัง */
  meta?: PublishMeta;
};

export type PublishMeta = {
  /** เวอร์ชันกติกาการให้คะแนน — เปลี่ยนกติกาแล้วข้อมูลเก่าไม่ถูกคิดใหม่ปนกัน */
  rules: string;
  overall: number | null;
  counted: number;
  scores: Record<string, number | null>;
  biases: Record<string, "bull" | "neutral" | "bear" | undefined>;
};

/**
 * ชื่อหัวข้อตั้งต้นรุ่นก่อน — Studio รุ่นเก่าส่งชื่อนี้ติดมาทุกครั้งที่เผยแพร่
 * ถ้าเจอให้ใช้ชื่อใหม่ในโค้ด (เช่น "Series + Open Interest") แทน ไม่ใช่ชื่อที่ IC ตั้งเอง
 */
const LEGACY_TITLES = ["S50 Futures + Open Interest"];

/**
 * ทับข้อมูลตั้งต้นด้วยของที่ IC เผยแพร่
 *
 * ใช้ร่วมกันทั้งสองทาง — อ่านจาก published.json (ไม่มี DB) และอ่านจาก Supabase
 * ช่องไหนไม่ได้ส่งมาจะคงของเดิมไว้ ไม่ทำให้ข้อมูลหาย
 */
export function mergePublished(brief: Brief, file: PublishedFile | null): Brief {
  const overrides = file?.sections ?? [];
  if (!overrides.length) return brief;
  if (file?.date && file.date !== brief.date) return brief;

  const merged = {
    ...brief,
    dateLabelTH: file?.dateLabelTH || brief.dateLabelTH,
    sections: brief.sections.map((s) => {
      const o = overrides.find((x) => x.id === s.id);
      if (!o) return s;
      return {
        ...s,
        // ชื่อหัวข้อ คำโปรย และ series ที่ IC ปรับใน Studio
        title: o.title?.trim() && !LEGACY_TITLES.includes(o.title.trim()) ? o.title.trim() : s.title,
        subtitle: o.subtitle?.trim() || s.subtitle,
        series: o.series?.trim() || s.series,
        narrative: {
          summary: o.summary ?? s.narrative.summary,
          interpretation: o.interpretation ?? s.narrative.interpretation,
          actions: o.actions ?? s.narrative.actions,
          insight: o.insight ?? s.narrative.insight,
          scenario: o.scenario ?? s.narrative.scenario,
        },
        board:
          o.board && o.board.images?.some((im) => im.src)
            ? { ...o.board, images: o.board.images.filter((im) => im.src) }
            : s.board,
        // ข้อมูลกราฟรับเฉพาะ section ที่ยังวาดกราฟ — ของที่เคยเผยแพร่ก่อนเปลี่ยนเป็นภาพจะไม่ย้อนกลับมา
        contracts:
          s.contracts && o.contracts?.length
            ? o.contracts.map((c, i) => ({
                ...c,
                // importer รุ่นแรกตั้งชื่อจากหัวคอลัมน์ "SERIES" — ใช้ชื่อสัญญาจริงแทน
                symbol: /^series$/i.test(c.symbol) ? (s.contracts?.[i]?.symbol ?? c.symbol) : c.symbol,
              }))
            : s.contracts,
        flows: s.flows && o.flows?.length ? o.flows : s.flows,
        spread: s.spread && o.spread?.rows?.length ? o.spread : s.spread,
        asOfLabel: o.asOfLabel ?? s.asOfLabel,
        // IC ใส่ข้อมูลหรือภาพจริงมาแล้ว → ไม่ขึ้นป้าย "ข้อมูลจำลอง"
        demo:
          (s.contracts && !!o.contracts?.length) ||
          (s.flows && !!o.flows?.length) ||
          !!o.board?.images?.some((im) => im.src)
            ? false
            : s.demo,
      } satisfies Section;
    }),
  };

  const contracts = merged.sections.find((s) => s.contracts?.length)?.contracts ?? [S50_PRICE_REFERENCE];
  return {
    ...merged,
    sections: merged.sections.map((s) => (s.flows ? { ...s, flows: repairFlows(s.flows, contracts) } : s)),
  };
}

/**
 * ซ่อมยอดสะสมที่เผยแพร่ด้วย importer รุ่นแรก
 *  - แถวที่ชีตยังไม่มียอด (เช่นวันนี้ที่มีแค่ OI) ถูกเติมเป็นค่าซ้ำของวันก่อนและราคา 0
 *  - คอลัมน์ราคา (แกนขวา) ถูกจับคู่กับ spread S50U26Z26 แทนราคาปิด
 */
export function repairFlows(flows: FlowRow[], contracts?: ContractSeries[]): FlowRow[] {
  const rows: FlowRow[] = [];
  for (const r of flows) {
    const p = rows[rows.length - 1];
    if (p && !r.set50 && r.foreign === p.foreign && r.fund === p.fund) continue;
    rows.push(r);
  }
  const close = new Map((contracts?.[0]?.rows ?? []).map((r) => [r.t, r.close]));
  // ราคา S50 อยู่หลักพัน ถ้าทุกแถวต่ำกว่า 100 แปลว่าเป็น spread ไม่ใช่ราคา
  const wrongColumn = rows.length > 0 && close.size > 0 && rows.every((r) => Math.abs(r.set50) < 100);
  if (!wrongColumn) return rows;
  return rows.filter((r) => close.has(r.t)).map((r) => ({ ...r, set50: close.get(r.t)! }));
}
