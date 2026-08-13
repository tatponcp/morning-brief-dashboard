import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * ตัวเชื่อม Supabase — ใช้เฉพาะฝั่งเซิร์ฟเวอร์เท่านั้น
 *
 * ต้องมี 2 อย่าง (ตั้งที่ Vercel → Settings → Environment Variables):
 *   1) URL ของโปรเจกต์  เช่น https://xxxxx.supabase.co
 *   2) secret key        (ชื่อเดิมคือ service_role key) ขึ้นต้นด้วย eyJ... หรือ sb_secret_...
 *
 * ชื่อ env var เป็น case-sensitive และ Supabase เปลี่ยนชื่อ key ไปมาหลายรอบ
 * เลยรับหลายชื่อไว้กันพลาด ดู ACCEPTED_* ด้านล่าง
 *
 * ⚠️ secret key ข้ามสิทธิ์ RLS ทั้งหมด ห้ามส่งไปฝั่ง browser
 *    ชื่อ env ต้องไม่ขึ้นต้นด้วย NEXT_PUBLIC_
 */

const ACCEPTED_URL = [
  "SUPABASE_URL",
  "supabase_url",
  "SUPABASE_PROJECT_URL",
  "Project_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
];

const ACCEPTED_SECRET = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "supabase_service_role_key",
  "SUPABASE_SECRET_KEY",
  "Secret_keys",
  "secret_keys",
  "Secret_key",
  "secret_key",
  "SUPABASE_KEY",
];

function read(keys: string[]): string | undefined {
  const env = process.env as Record<string, string | undefined>;
  for (const k of keys) {
    const v = env[k];
    if (v && v.trim()) return v.trim();
  }
  return undefined;
}

/**
 * เผื่อกรณีตั้ง key ไว้แต่ลืมใส่ URL — key แบบ JWT (eyJ...) มีรหัสโปรเจกต์อยู่ข้างใน
 * ถอดออกมาประกอบเป็น URL ได้ ถ้าถอดไม่ได้ก็ยอมแพ้ตามปกติ
 */
function urlFromJwt(key: string): string | undefined {
  try {
    if (!key.startsWith("eyJ")) return undefined;
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64").toString("utf8"),
    ) as { ref?: string };
    return payload.ref ? `https://${payload.ref}.supabase.co` : undefined;
  } catch {
    return undefined;
  }
}

export function getSupabase(): SupabaseClient | null {
  const secret = read(ACCEPTED_SECRET);
  if (!secret) return null;

  const url = read(ACCEPTED_URL) ?? urlFromJwt(secret);
  if (!url) return null;

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

/** บอกว่าขาดอะไรอยู่ ใช้ในข้อความ error ให้ตั้งค่าได้ถูกโดยไม่ต้องเดา */
export function supabaseStatus(): { ready: boolean; missing: string[]; hint: string } {
  const secret = read(ACCEPTED_SECRET);
  const url = read(ACCEPTED_URL) ?? (secret ? urlFromJwt(secret) : undefined);

  const missing: string[] = [];
  if (!url) missing.push("SUPABASE_URL");
  if (!secret) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  return {
    ready: missing.length === 0,
    missing,
    hint: missing.length
      ? `ยังขาด env: ${missing.join(", ")} — ตั้งที่ Vercel → Settings → Environment Variables (Production) แล้ว Redeploy`
      : "พร้อมใช้งาน",
  };
}

export const IMAGE_BUCKET = "brief-images";
