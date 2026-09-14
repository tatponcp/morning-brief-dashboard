"use client";

import { createContext, useContext } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * ปิดแอนิเมชันทั้งหมดใต้ Provider นี้
 * ใช้ตอนสร้างรูปส่งลูกค้า — ถ้าแอนิเมชันยังเล่นไม่จบ รูปจะออกมาจางหรือว่าง
 */
export const StaticRender = createContext(false);

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const isStatic = useContext(StaticRender);
  const reduce = useReducedMotion();

  if (isStatic || reduce) return <div className={className}>{children}</div>;

  // เล่นตอน mount แทน whileInView: ถ้า IntersectionObserver ไม่ทำงาน
  // (แท็บพื้นหลัง, iframe ที่ถูกซ่อน) เนื้อหาจะไม่ค้างเป็นจอว่าง
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
