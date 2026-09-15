"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * เกจภาพรวมของวัน — เข็มชี้จากจำนวนสัญญาณบวก/ลบที่ IC เลือก
 * score อยู่ระหว่าง -1 (ลบทั้งหมด) ถึง 1 (บวกทั้งหมด)
 */
export function BiasGauge({ score, label, sub }: { score: number; label: string; sub: string }) {
  const reduce = useReducedMotion();
  const angle = Math.max(-1, Math.min(1, score)) * 80;
  const color = score > 0.25 ? "var(--c-green)" : score < -0.25 ? "var(--c-rose)" : "var(--c-amber)";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-[220px] max-w-full">
        <defs>
          <linearGradient id="gauge-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--c-rose)" />
            <stop offset="50%" stopColor="var(--c-amber)" />
            <stop offset="100%" stopColor="var(--c-green)" />
          </linearGradient>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--c-hover)" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gauge-arc)"
          strokeWidth="14"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          opacity={0.9}
        />
        <motion.g
          style={{ originX: "100px", originY: "100px" }}
          initial={reduce ? false : { rotate: -80 }}
          animate={{ rotate: angle }}
          transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.3 }}
        >
          <line x1="100" y1="100" x2="100" y2="34" stroke={color} strokeWidth="4" strokeLinecap="round" />
        </motion.g>
        <circle cx="100" cy="100" r="8" fill={color} />
        <circle cx="100" cy="100" r="3.5" fill="var(--ink-950)" />
        <text x="18" y="116" fontSize="10" fill="var(--c-neutral)">ลบ</text>
        <text x="170" y="116" fontSize="10" fill="var(--c-neutral)">บวก</text>
      </svg>
      <p className="-mt-1 font-display text-[22px] font-bold" style={{ color }}>
        {label}
      </p>
      <p className="text-[12px] text-slate-400">{sub}</p>
    </div>
  );
}
