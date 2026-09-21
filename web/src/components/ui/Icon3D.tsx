"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * ไอคอนแบบกระเบื้อง 3 มิติ — ตัวกระเบื้องไล่สี มีขอบหนา (bevel) เงาใต้ และแสงเงาบนผิว
 * ตัวไอคอนซ้อน 3 ชั้นบนแกน Z ให้ดูนูนออกมาจริง (ต้องอยู่ใต้ element ที่ preserve-3d ถึงจะเห็นระยะลึกเวลาเอียง)
 *
 * lift = ยกขึ้น (hover) · on = กำลังเลือกอยู่ (สว่าง + เรืองแสง)
 */
export function Icon3D({
  icon: Icon,
  color,
  color2,
  size = 36,
  lift = false,
  on = false,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  color: string;
  /** สีปลายไล่ (ไม่ใส่ = ใช้สีเดียวกันไล่เข้ม) */
  color2?: string;
  size?: number;
  lift?: boolean;
  on?: boolean;
}) {
  const reduce = useReducedMotion();
  const c2 = color2 ?? `color-mix(in srgb, ${color} 55%, #0b1020)`;
  const up = !reduce && (lift || on);
  const iconPx = Math.round(size * 0.48);

  return (
    <motion.span
      aria-hidden
      className="relative block shrink-0"
      style={{ width: size, height: size, transformStyle: "preserve-3d" }}
      animate={{ z: up ? 10 : 0, rotateZ: lift && !reduce ? -6 : 0, scale: lift && !reduce ? 1.06 : 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 20 }}
    >
      {/* เงาใต้กระเบื้อง */}
      <motion.span
        className="absolute inset-[8%] rounded-[32%] blur-md"
        style={{ background: color, z: -8 }}
        animate={{ opacity: on ? 0.75 : lift ? 0.55 : 0.22, y: up ? 6 : 3 }}
      />

      {/* ตัวกระเบื้อง */}
      <span
        className="absolute inset-0 overflow-hidden rounded-[32%]"
        style={{
          background: `linear-gradient(150deg, color-mix(in srgb, ${color} 72%, white) 0%, ${color} 42%, ${c2} 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -3px 0 color-mix(in srgb, ${c2} 70%, black), 0 2px 0 color-mix(in srgb, ${c2} 60%, black)`,
          filter: on || lift ? "none" : "saturate(0.72) brightness(0.9)",
          transition: "filter 300ms",
        }}
      >
        {/* แสงเงาบนผิว */}
        <span
          className="absolute -top-1/3 left-[-20%] h-[75%] w-[140%] rounded-[50%]"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0))" }}
        />
      </span>

      {/* ไอคอนนูน: ชั้นลึก 2 ชั้น + หน้าไอคอน */}
      {[
        { z: 2, dy: 2, c: `color-mix(in srgb, ${c2} 65%, black)`, o: 0.55 },
        { z: 4, dy: 1, c: `color-mix(in srgb, ${c2} 40%, black)`, o: 0.7 },
      ].map((l) => (
        <span
          key={l.z}
          className="absolute inset-0 grid place-items-center"
          style={{ transform: `translateZ(${l.z}px) translateY(${l.dy}px)`, opacity: l.o }}
        >
          <Icon strokeWidth={2.4} style={{ width: iconPx, height: iconPx, color: l.c }} />
        </span>
      ))}
      <motion.span
        className="absolute inset-0 grid place-items-center"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ z: up ? 9 : 6 }}
      >
        <Icon
          strokeWidth={2.4}
          style={{ width: iconPx, height: iconPx, color: "#fff", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.35))" }}
        />
      </motion.span>
    </motion.span>
  );
}
