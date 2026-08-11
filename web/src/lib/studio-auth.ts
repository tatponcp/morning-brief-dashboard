/** ชื่อ cookie ที่บอกว่าผ่านรหัส Studio แล้ว */
export const STUDIO_COOKIE = "mb_studio";

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
