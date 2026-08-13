import type { Brief, Narrative, Section } from "./types";

/** รูปร่างของไฟล์ที่กด "ส่งออก Brief" ออกมาจาก /studio (narrative ถูกแบให้แบนอยู่ระดับเดียวกับ id) */
export type PublishedSection = { id: string } & Partial<Narrative> &
  Partial<Pick<Section, "board" | "contracts" | "flows">>;

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
        contracts: o.contracts?.length ? o.contracts : s.contracts,
        flows: o.flows?.length ? o.flows : s.flows,
      } satisfies Section;
    }),
  };
}
