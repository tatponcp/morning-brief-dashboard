"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";

/**
 * เกจคะแนนภาพรวม 0–100% — เข็มหมุนและตัวเลขนับขึ้นพร้อมกัน
 * percent = null หมายถึงยังไม่มีข้อไหนอัปเดต
 */
export function BiasGauge({ percent, color, label }: { percent: number | null; color: string; label: string }) {
  const reduce = useReducedMotion();
  const target = percent ?? 50;
  const value = useMotionValue(reduce ? target : 0);
  const shown = useTransform(value, (v) => Math.round(v));
  // ปลายเข็มคำนวณเป็นพิกัดตรง ๆ — การหมุนกลุ่ม SVG ด้วย transform-origin ไม่นิ่งในทุกเบราว์เซอร์
  const tipX = useTransform(value, (v) => 100 + Math.sin((((v - 50) / 50) * 80 * Math.PI) / 180) * 64);
  const tipY = useTransform(value, (v) => 100 - Math.cos((((v - 50) / 50) * 80 * Math.PI) / 180) * 64);

  useEffect(() => {
    const c = animate(value, target, { duration: reduce ? 0 : 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 });
    return () => c.stop();
  }, [target, value, reduce]);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 124" className="w-[240px] max-w-full" aria-hidden>
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
          opacity={percent === null ? 0.35 : 0.9}
        />
        {/* ขีดแบ่งเกณฑ์ 20 / 40 / 60 / 80 */}
        {[20, 40, 60, 80].map((p) => {
          const r = ((p - 50) / 50) * 80 * (Math.PI / 180);
          return (
            <line
              key={p}
              x1={100 + Math.sin(r) * 62}
              y1={100 - Math.cos(r) * 62}
              x2={100 + Math.sin(r) * 70}
              y2={100 - Math.cos(r) * 70}
              stroke="var(--c-neutral)"
              strokeOpacity={0.5}
              strokeWidth={1.5}
            />
          );
        })}
        {percent !== null && (
          <motion.line x1={100} y1={100} x2={tipX} y2={tipY} stroke={color} strokeWidth={4} strokeLinecap="round" />
        )}
        <circle cx="100" cy="100" r="8" fill={color} />
        <circle cx="100" cy="100" r="3.5" fill="var(--ink-950)" />
        <text x="14" y="120" fontSize="10" fill="var(--c-neutral)">0%</text>
        <text x="166" y="120" fontSize="10" fill="var(--c-neutral)">100%</text>
      </svg>
      <p className="-mt-2 font-display text-[40px] leading-none font-bold" style={{ color }}>
        {percent === null ? "—" : <motion.span>{shown}</motion.span>}
        {percent !== null && <span className="text-[22px]">%</span>}
      </p>
      <p className="mt-1 font-display text-[16px] font-bold" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
