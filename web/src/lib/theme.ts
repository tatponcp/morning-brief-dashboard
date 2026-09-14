/**
 * ธีม มืด / สว่าง / ตามระบบ
 *
 * ค่าที่เลือกเก็บใน localStorage แล้วตั้ง <html data-theme> ก่อนหน้าเว็บวาด
 * (ผ่าน THEME_INIT_SCRIPT ใน layout) หน้าจอจึงไม่กระพริบเป็นสีผิดตอนโหลด
 */

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "mb:theme";
/** ดีไซน์หลักของแบรนด์เป็นธีมมืด ผู้ใช้เดิมจึงเห็นเหมือนเดิมจนกว่าจะเปลี่ยนเอง */
export const DEFAULT_THEME: ThemePref = "dark";

export const THEME_COLORS: Record<ResolvedTheme, string> = { dark: "#04070e", light: "#f3f6fb" };

/** รันแบบ blocking ใน <head> — ต้องสั้นและไม่พึ่งโค้ดอื่น */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_KEY}");if(p!=="light"&&p!=="dark"&&p!=="system")p="${DEFAULT_THEME}";var r=p==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):p;var e=document.documentElement;e.dataset.theme=r;e.dataset.themePref=p;}catch(_){document.documentElement.dataset.theme="${DEFAULT_THEME}";}})();`;

const listeners = new Set<() => void>();
let mediaBound = false;

function resolve(pref: ThemePref): ResolvedTheme {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(pref: ThemePref, animate: boolean) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 320);
  }
  root.dataset.theme = resolve(pref);
  root.dataset.themePref = pref;
  syncMetaColor();
  listeners.forEach((l) => l());
}

/** สีแถบเบราว์เซอร์บนมือถือ — Next ใส่ค่าสีมืดไว้ตอน build จึงต้องแก้ให้ตรงหลังโหลด */
function syncMetaColor() {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[getResolvedTheme()]);
}

export function getThemePref(): ThemePref {
  const p = document.documentElement.dataset.themePref;
  return p === "light" || p === "dark" || p === "system" ? p : DEFAULT_THEME;
}

export function getResolvedTheme(): ResolvedTheme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setThemePref(pref: ThemePref) {
  try {
    window.localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* โหมดส่วนตัวของเบราว์เซอร์ — ใช้ได้เฉพาะแท็บนี้ */
  }
  apply(pref, true);
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);

  // ถ้าเลือก "ตามระบบ" แล้วผู้ใช้เปลี่ยนโหมดของเครื่อง ให้เว็บเปลี่ยนตาม
  if (!mediaBound) {
    mediaBound = true;
    syncMetaColor();
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
      if (getThemePref() === "system") apply("system", true);
    });
    // เปิดหลายแท็บ: เปลี่ยนแท็บหนึ่ง แท็บอื่นเปลี่ยนตาม
    window.addEventListener("storage", (e) => {
      if (e.key !== THEME_KEY) return;
      const p = e.newValue;
      apply(p === "light" || p === "dark" || p === "system" ? p : DEFAULT_THEME, true);
    });
  }
  return () => listeners.delete(listener);
}
