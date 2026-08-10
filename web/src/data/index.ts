import type { Brief, Section } from "@/lib/types";
import { brief20260805 } from "./2026-08-05";

/** ที่เดียวที่ต้องเปลี่ยนเมื่อย้ายไป CMS/DB จริง */
const ALL: Brief[] = [brief20260805];

export function getLatestBrief(): Brief {
  return [...ALL].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function getBrief(date?: string): Brief {
  return ALL.find((b) => b.date === date) ?? getLatestBrief();
}

export function listDates(): { date: string; label: string }[] {
  return [...ALL]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((b) => ({ date: b.date, label: b.dateLabelTH }));
}

export function getSection(id: string, date?: string): Section | undefined {
  return getBrief(date).sections.find((s) => s.id === id);
}
