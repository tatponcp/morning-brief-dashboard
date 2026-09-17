import type { Section } from "./types";

/**
 * บอกว่า section ไหน "ยังไม่อัปเดต" สำหรับวันนี้
 * คำนวณฝั่งเบราว์เซอร์ด้วยนาฬิกาของลูกค้า — หน้าเว็บที่ cache ไว้ข้ามวันจะไม่หลอกว่าเป็นของใหม่
 */

const BKK = "Asia/Bangkok";

/** วันทำการล่าสุด (จันทร์–ศุกร์) ตามเวลาไทย — เสาร์อาทิตย์ถือว่าข้อมูลวันศุกร์ยังใหม่อยู่ */
export function expectedTradingDate(now = new Date()): string {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: BKK }).format(now);
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = d.getUTCDay();
  if (dow === 6) d.setUTCDate(d.getUTCDate() - 1);
  if (dow === 0) d.setUTCDate(d.getUTCDate() - 2);
  return d.toISOString().slice(0, 10);
}

export type PendingReason = "stale" | "empty";

/** ข้อมูลที่ส่งจาก server ไปให้ฝั่งเบราว์เซอร์ตัดสิน */
export type FreshnessInput = { briefDate: string; empty: boolean };

/** section นี้ IC ยังไม่ได้ใส่ของจริง (ยังเป็นข้อความตั้งต้นหรือยังไม่มีภาพ) */
export function isSectionEmpty(s: Section): boolean {
  const insight = s.narrative.insight.trim();
  const noText = !insight || insight.startsWith("รอ IC");
  const noImage = s.mode === "image" && !s.board?.images.some((im) => im.src);
  return noText || noImage;
}

export function pendingReason({ briefDate, empty }: FreshnessInput, now = new Date()): PendingReason | null {
  if (briefDate < expectedTradingDate(now)) return "stale";
  if (empty) return "empty";
  return null;
}
