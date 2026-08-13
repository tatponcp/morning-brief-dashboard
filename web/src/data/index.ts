import type { Brief, Narrative, Section } from "@/lib/types";
import { brief20260805 } from "./2026-08-05";
import published from "./published.json";

/** ที่เดียวที่ต้องเปลี่ยนเมื่อย้ายไป CMS/DB จริง */
const ALL: Brief[] = [brief20260805];

/** รูปร่างของไฟล์ที่กด "ส่งออก Brief" ออกมาจาก /studio (narrative ถูกแบให้แบนอยู่ระดับเดียวกับ id) */
type PublishedSection = { id: string } & Partial<Narrative> &
  Partial<Pick<Section, "board" | "contracts" | "flows">>;
type PublishedFile = { date?: string; dateLabelTH?: string; sections?: PublishedSection[] };

/**
 * ทับข้อมูลตั้งต้นด้วยของที่ IC เผยแพร่ไว้ใน published.json
 *
 * วิธีใช้: /studio → กด "ส่งออก Brief (.json)" → เอาไฟล์มาวางทับ
 * src/data/published.json → git push → เว็บอัปเดตเอง
 */
function applyPublished(brief: Brief): Brief {
  const file = published as PublishedFile;
  const overrides = file.sections ?? [];
  if (!overrides.length) return brief;
  if (file.date && file.date !== brief.date) return brief;

  return {
    ...brief,
    sections: brief.sections.map((s) => {
      const o = overrides.find((x) => x.id === s.id);
      if (!o) return s;
      return {
        ...s,
        // ข้อความ 3 ช่อง + Insight
        narrative: {
          summary: o.summary ?? s.narrative.summary,
          interpretation: o.interpretation ?? s.narrative.interpretation,
          actions: o.actions ?? s.narrative.actions,
          insight: o.insight ?? s.narrative.insight,
        },
        // ภาพ (เฉพาะที่มี src จริง ไม่เอาช่องว่าง)
        board:
          o.board && o.board.images?.some((im) => im.src)
            ? { ...o.board, images: o.board.images.filter((im) => im.src) }
            : s.board,
        // ข้อมูลที่ import เข้ามา
        contracts: o.contracts?.length ? o.contracts : s.contracts,
        flows: o.flows?.length ? o.flows : s.flows,
      } satisfies Section;
    }),
  };
}

const RESOLVED: Brief[] = ALL.map(applyPublished);

export function getLatestBrief(): Brief {
  return [...RESOLVED].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function getBrief(date?: string): Brief {
  return RESOLVED.find((b) => b.date === date) ?? getLatestBrief();
}

export function listDates(): { date: string; label: string }[] {
  return [...RESOLVED]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((b) => ({ date: b.date, label: b.dateLabelTH }));
}

export function getSection(id: string, date?: string): Section | undefined {
  return getBrief(date).sections.find((s) => s.id === id);
}

/** true = กำลังแสดงข้อมูลที่ IC เผยแพร่ไว้ ไม่ใช่ค่าตั้งต้น */
export function hasPublishedData(): boolean {
  return ((published as PublishedFile).sections ?? []).length > 0;
}
