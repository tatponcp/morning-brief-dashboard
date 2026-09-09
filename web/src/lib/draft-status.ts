import type { Draft } from "./drafts";
import type { Section } from "./types";

export type FieldKey = "image" | "data" | "summary" | "interpretation" | "actions" | "insight";

export type DraftStatus = {
  /** ช่องที่ยังว่างอยู่ */
  missing: FieldKey[];
  /** กรอกครบทุกช่องที่จำเป็นแล้วหรือยัง */
  complete: boolean;
  /** 0-1 ใช้วาดแถบความคืบหน้า */
  ratio: number;
};

const LABEL: Record<FieldKey, string> = {
  image: "ภาพ",
  data: "ข้อมูล",
  summary: "สรุปสั้น",
  interpretation: "แปลความ",
  actions: "Action",
  insight: "Insight",
};

export function fieldLabel(k: FieldKey) {
  return LABEL[k];
}

/**
 * ตรวจว่า section นี้กรอกครบหรือยัง
 * ใช้ทั้งกับป้ายสถานะในแถบซ้าย และแถบความคืบหน้ารวมด้านล่าง
 */
export function draftStatus(section: Section, draft: Draft): DraftStatus {
  const required: FieldKey[] = ["summary", "interpretation", "actions", "insight"];
  if (section.mode === "image") required.unshift("image");

  const missing = required.filter((k) => {
    switch (k) {
      case "image":
        return !draft.board.images.some((im) => im.src);
      case "summary":
        return !draft.summary.some((s) => s.trim());
      case "interpretation":
        return !draft.interpretation.trim();
      case "actions":
        return !draft.actions.some((a) => a.label.trim() || a.value.trim());
      case "insight":
        return !draft.insight.trim();
      default:
        return false;
    }
  });

  return {
    missing,
    complete: missing.length === 0,
    ratio: (required.length - missing.length) / required.length,
  };
}
