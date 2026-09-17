import "server-only";
import { getSupabase, IMAGE_BUCKET } from "./supabase";
import type { Templates, TextTemplate } from "./scenarios";

/**
 * คำที่ IC บันทึกทับคำตั้งต้นของสถานการณ์ — เก็บเป็นไฟล์ JSON ใน Supabase Storage
 * ไม่ต้องสร้างตารางใหม่ และทุกเครื่องของทีม IC เห็นคำชุดเดียวกัน
 */
const PATH = "config/text-templates.json";

export async function loadTemplates(): Promise<Templates> {
  const db = getSupabase();
  if (!db) return {};
  try {
    const { data, error } = await db.storage.from(IMAGE_BUCKET).download(PATH);
    if (error || !data) return {};
    return JSON.parse(await data.text()) as Templates;
  } catch {
    return {};
  }
}

export async function saveTemplate(key: string, template: TextTemplate | null) {
  const db = getSupabase();
  if (!db) return { ok: false as const, reason: "ยังไม่ได้เชื่อม Supabase" };
  const all = await loadTemplates();
  if (template) all[key] = template;
  else delete all[key];
  const { error } = await db.storage
    .from(IMAGE_BUCKET)
    .upload(PATH, Buffer.from(JSON.stringify(all), "utf8"), {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) return { ok: false as const, reason: `บันทึกไม่สำเร็จ: ${error.message}` };
  return { ok: true as const, templates: all };
}
