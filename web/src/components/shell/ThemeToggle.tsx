"use client";

import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  DEFAULT_THEME,
  getThemePref,
  setThemePref,
  subscribeTheme,
  type ThemePref,
} from "@/lib/theme";

const OPTIONS: { key: ThemePref; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "สว่าง", icon: Sun },
  { key: "dark", label: "มืด", icon: Moon },
  { key: "system", label: "ตามเครื่อง", icon: Monitor },
];

/** ปุ่มสลับธีม 3 แบบ — จอกว้างเห็นชื่อ จอแคบเหลือไอคอน */
export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribeTheme, getThemePref, () => DEFAULT_THEME);

  return (
    <div
      role="radiogroup"
      aria-label="ธีมของหน้าเว็บ"
      className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/4 p-0.5"
    >
      {OPTIONS.map(({ key, label, icon: Icon }) => {
        const on = pref === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={on}
            title={`ธีม${label}`}
            onClick={() => setThemePref(key)}
            className={`relative flex items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-[12px] transition ${
              on ? "text-white" : "text-slate-500 hover:text-slate-200"
            }`}
          >
            {on && (
              <motion.span
                layoutId="theme-pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-[10px] bg-white/10 ring-1 ring-white/10"
              />
            )}
            <Icon className="relative size-3.5" />
            <span className="relative hidden xl:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
