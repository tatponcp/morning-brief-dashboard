/** ชื่อ cookie ที่บอกว่าผ่านรหัส Studio แล้ว */
export const STUDIO_COOKIE = "mb_studio";

/**
 * อ่านรหัสผ่านจาก environment
 *
 * สองเรื่องที่ต้องระวัง จึงต้องเขียนแบบนี้:
 * 1. ชื่อ env var เป็น case-sensitive — รับทั้ง STUDIO_PASSWORD และ studio_password
 *    กันพลาดตอนตั้งค่าบน dashboard
 * 2. Next.js จะแทนค่า process.env.XXX ตอน build สำหรับโค้ดที่รันบน edge (middleware)
 *    แต่ env var ที่ติ๊ก "Sensitive" ไว้บน Vercel จะไม่ถูกส่งให้ตอน build
 *    การอ่านผ่านตัวแปร (env[key]) แทนการเขียนชื่อตรง ๆ ทำให้ไม่โดนแทนค่า
 *    และได้อ่านค่าจริงตอน runtime
 */
export function readStudioPassword(): string | undefined {
  const env = process.env as Record<string, string | undefined>;
  for (const key of ["STUDIO_PASSWORD", "studio_password"]) {
    const value = env[key];
    if (value) return value;
  }
  return undefined;
}

/**
 * แปลงรหัสผ่านเป็น token สั้น ๆ เพื่อไม่ต้องเก็บรหัสตรง ๆ ใน cookie
 *
 * หมายเหตุ: นี่เป็นการกันคนทั่วไปเข้าหน้าเครื่องมือ ไม่ใช่ระบบยืนยันตัวตนจริง
 * ถ้าต้องแยกสิทธิ์รายคน / เก็บ log ว่าใครแก้อะไร ให้เปลี่ยนไปใช้ Supabase Auth
 */
export function studioToken(password: string) {
  let h = 2166136261;
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
