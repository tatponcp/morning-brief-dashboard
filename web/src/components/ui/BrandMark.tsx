"use client";

import { useContext, useId } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { StaticRender } from "./Reveal";

/**
 * โลโก้ Morning Brief — "Signal Sunrise"
 *
 *  ☀ พระอาทิตย์กำลังขึ้น   = Morning · สรุปก่อนตลาดเปิด
 *  ⟋ รังสี 6 เส้น           = 6 สัญญาณ (ข้อ 1–6) ติดไล่ทีละเส้นเหมือนระบบอ่านสัญญาณทีละข้อ
 *  ∿ ขอบฟ้าเป็นกราฟรูปตัว S = S50 และทิศทางที่ชี้ขึ้น
 *
 * ซ้อน 3 ชั้น (แผ่นหลัง → ดวงอาทิตย์ → ขอบฟ้ากระจก) บนระนาบ 3 มิติ เอียงตามเมาส์ให้เห็นระยะลึก
 * still = วาดนิ่ง ใช้ในรูปส่งลูกค้า
 */
export function BrandMark({ size = 40, still = false }: { size?: number; still?: boolean }) {
  const isStatic = useContext(StaticRender);
  const reduce = useReducedMotion();
  const calm = still || isStatic || !!reduce;
  const id = useId().replace(/:/g, "");

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-26, 26]), { stiffness: 260, damping: 20 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [22, -22]), { stiffness: 260, damping: 20 });

  const rays = [-75, -45, -15, 15, 45, 75];

  return (
    <motion.div
      aria-hidden
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
        perspective: size * 6,
      }}
      onPointerMove={(e) => {
        if (calm || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width - 0.5);
        py.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          rotateX: calm ? 10 : rotateX,
          rotateY: calm ? -12 : rotateY,
        }}
        initial={calm ? false : { rotateX: 10, rotateY: -12 }}
      >
        {/* ชั้นหลัง: แผ่นกระจกฟ้ายามเช้า */}
        <svg viewBox="0 0 48 48" className="absolute inset-0 size-full" style={{ transform: `translateZ(${-size * 0.12}px)` }}>
          <defs>
            <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="55%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
            <radialGradient id={`${id}-glow`} cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="1" y="1" width="46" height="46" rx="13" fill={`url(#${id}-sky)`} />
          <rect x="1" y="1" width="46" height="46" rx="13" fill={`url(#${id}-glow)`} />
          <rect x="1.5" y="1.5" width="45" height="45" rx="12.5" fill="none" stroke="rgba(255,255,255,0.22)" />
        </svg>

        {/* ชั้นกลาง: ดวงอาทิตย์ + รังสี 6 สัญญาณ */}
        <motion.svg
          viewBox="0 0 48 48"
          className="absolute inset-0 size-full"
          style={{ transform: `translateZ(${size * 0.08}px)` }}
          animate={calm ? undefined : { y: [1.5, -0.5, 1.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <defs>
            <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          {rays.map((deg, i) => (
            <motion.rect
              key={deg}
              x="23"
              y="7"
              width="2"
              height="6.5"
              rx="1"
              fill="#fcd34d"
              transform={`rotate(${deg} 24 29)`}
              initial={false}
              animate={calm ? { opacity: 0.9 } : { opacity: [0.35, 1, 0.35] }}
              transition={calm ? undefined : { duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
            />
          ))}
          <circle cx="24" cy="29" r="9" fill={`url(#${id}-sun)`} />
          <circle cx="21" cy="26" r="3" fill="#fff7ed" opacity="0.55" />
        </motion.svg>

        {/* ชั้นหน้า: ขอบฟ้ากระจก + เส้นกราฟรูปตัว S ชี้ขึ้น */}
        <svg viewBox="0 0 48 48" className="absolute inset-0 size-full" style={{ transform: `translateZ(${size * 0.24}px)` }}>
          <defs>
            <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(15,23,42,0.35)" />
              <stop offset="100%" stopColor="rgba(15,23,42,0.85)" />
            </linearGradient>
            <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
          </defs>
          <path d="M1 33 H47 V34 A13 13 0 0 1 34 47 H14 A13 13 0 0 1 1 34 Z" fill={`url(#${id}-glass)`} />
          <path
            d="M7 39 C 13 39, 14 33, 20 33 S 27 38, 32 34 S 38 27, 42 27"
            fill="none"
            stroke={`url(#${id}-line)`}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="42" cy="27" r="2.2" fill="#4ade80" />
        </svg>
      </motion.div>

      {/* เงาใต้โลโก้ ให้ดูลอยจากพื้น */}
      <div
        className="pointer-events-none absolute inset-x-[12%] -bottom-[14%] h-[20%] rounded-full blur-md"
        style={{ background: "rgba(245,158,11,0.35)" }}
      />
    </motion.div>
  );
}
