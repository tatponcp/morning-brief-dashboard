import type { Brief, Section } from "@/lib/types";
import { mergePublished, type PublishedFile } from "@/lib/merge-brief";
import { brief20260805 } from "./2026-08-05";
import published from "./published.json";

/** ที่เดียวที่ต้องเปลี่ยนเมื่อเพิ่ม brief วันใหม่แบบไม่ใช้ DB */
const ALL: Brief[] = [brief20260805];

/**
 * ข้อมูลตั้งต้น + ของที่วางไว้ใน published.json
 *
 * ถ้าต่อ Supabase แล้ว หน้าเว็บจะอ่านผ่าน src/lib/brief-store.ts แทน
 * ซึ่งจะเอาข้อมูลจาก DB มาทับอีกชั้นหนึ่ง
 */
const RESOLVED: Brief[] = ALL.map((b) => mergePublished(b, published as PublishedFile));

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
