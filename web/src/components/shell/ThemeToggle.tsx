"use client";

import { useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import {
  applyTheme,
  DEFAULT_THEME,
  getTheme,
  saveTheme,
  subscribeTheme,
  type Theme,
} from "@/lib/theme";

/** ระยะเวลาและ easing ของวงกลมที่ขยายออกจากปุ่ม — เร็วตอนต้น นุ่มตอนจบ */
const REVEAL_MS = 620;
const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type ViewTransitionDoc = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/**
 * สวิตช์ธีม มืด ↔ สว่าง
 *
 * ใช้ View Transitions: เบราว์เซอร์ถ่ายภาพหน้าเดิมไว้ แล้วเผยธีมใหม่เป็นวงกลมจากปุ่ม
 * เป็นแอนิเมชันเดียวที่การ์ดจอทำให้ จึงลื่นแม้หน้าจะมีกราฟหลายร้อยเส้น
 * (วิธีเดิมที่สั่ง transition ทุก element ทำให้กระตุก และพื้นหลังไล่สีเปลี่ยนไม่พร้อมตัวอักษร)
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => DEFAULT_THEME);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const running = useRef(false);

  const isDark = theme === "dark";
  const next: Theme = isDark ? "light" : "dark";

  function toggle() {
    if (running.current) return;
    saveTheme(next);

    const doc = document as ViewTransitionDoc;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // เบราว์เซอร์เก่า หรือผู้ใช้ปิดแอนิเมชัน: เปลี่ยนทันที ดีกว่าเปลี่ยนแบบครึ่ง ๆ กลาง ๆ
    if (!doc.startViewTransition || reduceMotion) {
      applyTheme(next);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 80;
    const y = rect ? rect.top + rect.height / 2 : 28;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    running.current = true;
    const transition = doc.startViewTransition(() => {
      // บังคับให้ React วาดสวิตช์ตำแหน่งใหม่ทันที ภาพ "หลัง" จะได้ถูกต้อง
      flushSync(() => applyTheme(next));
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: REVEAL_MS,
            easing: REVEAL_EASE,
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => undefined);

    transition.finished.finally(() => {
      running.current = false;
    });
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
      title={isDark ? "ธีมมืด · กดเพื่อเปลี่ยนเป็นสว่าง" : "ธีมสว่าง · กดเพื่อเปลี่ยนเป็นมืด"}
      onClick={toggle}
      className="relative flex h-9 w-[66px] shrink-0 items-center rounded-full border border-white/10 bg-white/5 px-1 transition-colors hover:border-white/20"
    >
      {/* ไอคอนจาง ๆ ทั้งสองฝั่ง บอกว่ากดแล้วจะได้อะไร */}
      <Sun className="absolute left-2.5 size-3.5 text-slate-500" aria-hidden />
      <Moon className="absolute right-2.5 size-3.5 text-slate-500" aria-hidden />

      <motion.span
        aria-hidden
        className="relative z-10 grid size-7 place-items-center rounded-full"
        initial={false}
        animate={{ x: isDark ? 28 : 0, backgroundColor: isDark ? "#1b2640" : "#ffffff" }}
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.25), 0 0 0 1px rgba(15,23,42,0.08)" }}
      >
        <motion.span
          key={theme}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="grid place-items-center"
        >
          {isDark ? (
            <Moon className="size-4 text-[#ffd76a]" fill="#ffd76a" strokeWidth={1.5} />
          ) : (
            <Sun className="size-4 text-[#f59e0b]" strokeWidth={2.2} />
          )}
        </motion.span>
      </motion.span>
    </button>
  );
}
