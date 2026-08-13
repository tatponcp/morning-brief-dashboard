import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * ตัวเชื่อม Supabase — ใช้เฉพาะฝั่งเซิร์ฟเวอร์เท่านั้น
 *
 * ต้องตั้ง env 2 ตัว (ที่ Vercel → Settings → Environment Variables):
 *   SUPABASE_URL                เช่น https://xxxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY   key ยาว ๆ ที่ขึ้นต้นด้วย eyJ...
 *
 * ถ้ายังไม่ได้ตั้ง ระบบจะทำงานต่อได้ตามปกติโดยใช้ published.json แทน
 * (ดู src/lib/brief-store.ts)
 *
 * ⚠️ service role key ข้ามสิทธิ์ RLS ทั้งหมด ห้ามส่งไปฝั่ง browser เด็ดขาด
 *    ชื่อ env ต้องไม่ขึ้นต้นด้วย NEXT_PUBLIC_
 */

function read(...keys: string[]): string | undefined {
  const env = process.env as Record<string, string | undefined>;
  for (const k of keys) if (env[k]) return env[k];
  return undefined;
}

export function getSupabase(): SupabaseClient | null {
  const url = read("SUPABASE_URL", "supabase_url", "NEXT_PUBLIC_SUPABASE_URL");
  const key = read("SUPABASE_SERVICE_ROLE_KEY", "supabase_service_role_key");
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

export const IMAGE_BUCKET = "brief-images";
