/**
 * ธีม มืด / สว่าง
 *
 * ค่าที่เลือกเก็บใน localStorage แล้วตั้ง <html data-theme> ก่อนหน้าเว็บวาด
 * (ผ่าน THEME_INIT_SCRIPT ใน layout) หน้าจอจึงไม่กระพริบเป็นสีผิดตอนโหลด
 */

export type Theme = "light" | "dark";

export const THEME_KEY = "mb:theme";
/** ดีไซน์หลักของแบรนด์เป็นธีมมืด ผู้ใช้เดิมจึงเห็นเหมือนเดิมจนกว่าจะเปลี่ยนเอง */
export const DEFAULT_THEME: Theme = "dark";

export const THEME_COLORS: Record<Theme, string> = { dark: "#04070e", light: "#f3f6fb" };

/**
 * รันแบบ blocking ใน <head> — ต้องสั้นและไม่พึ่งโค้ดอื่น
 * ค่าเก่า "system" จากเวอร์ชันก่อนจะถูกมองเป็นค่าเริ่มต้น
 */
export const THEME_INIT_SCRIPT = `(function(){var t="${DEFAULT_THEME}";try{var s=localStorage.getItem("${THEME_KEY}");if(s==="light"||s==="dark")t=s;}catch(_){}document.documentElement.dataset.theme=t;})();`;

const listeners = new Set<() => void>();
let storageBound = false;

function isTheme(v: unknown): v is Theme {
  return v === "light" || v === "dark";
}

export function getTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return isTheme(t) ? t : DEFAULT_THEME;
}

/** สีแถบเบราว์เซอร์บนมือถือ — Next ใส่ค่าสีมืดไว้ตอน build จึงต้องแก้ให้ตรงหลังโหลด */
function syncMetaColor() {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[getTheme()]);
}

/** เปลี่ยนธีมทันที (ส่วนแอนิเมชันอยู่ที่ ThemeToggle) */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  syncMetaColor();
  listeners.forEach((l) => l());
}

export function saveTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* โหมดส่วนตัวของเบราว์เซอร์ — ใช้ได้เฉพาะแท็บนี้ */
  }
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  if (!storageBound) {
    storageBound = true;
    syncMetaColor();
    // เปิดหลายแท็บ: เปลี่ยนแท็บหนึ่ง แท็บอื่นเปลี่ยนตาม
    window.addEventListener("storage", (e) => {
      if (e.key === THEME_KEY && isTheme(e.newValue)) applyTheme(e.newValue);
    });
  }
  return () => listeners.delete(listener);
}
