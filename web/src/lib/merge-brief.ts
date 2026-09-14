import type { Brief, Narrative, Section } from "./types";

/** รูปร่างของไฟล์ที่กด "ส่งออก Brief" ออกมาจาก /studio (narrative ถูกแบให้แบนอยู่ระดับเดียวกับ id) */
export type PublishedSection = { id: string } & Partial<Narrative> &
  Partial<Pick<Section, "board" | "contracts" | "flows" | "spread" | "asOfLabel">>;

export type PublishedFile = {
  date?: string;
  dateLabelTH?: string;
  sections?: PublishedSection[];
};

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

  return {
    ...brief,
    dateLabelTH: file?.dateLabelTH || brief.dateLabelTH,
    sections: brief.sections.map((s) => {
      const o = overrides.find((x) => x.id === s.id);
      if (!o) return s;
      return {
        ...s,
        narrative: {
          summary: o.summary ?? s.narrative.summary,
          interpretation: o.interpretation ?? s.narrative.interpretation,
          actions: o.actions ?? s.narrative.actions,
          insight: o.insight ?? s.narrative.insight,
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
}
