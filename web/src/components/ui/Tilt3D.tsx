"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * การ์ดเอียงตามเมาส์แบบ 3 มิติ พร้อมแสงสะท้อน
 * ปิดเองบนจอสัมผัสและเมื่อผู้ใช้ตั้งลดการเคลื่อนไหว
 */
export function Tilt({
  children,
  className,
  max = 8,
  lift = 0,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  lift?: number;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const cfg = { stiffness: 220, damping: 22 };
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), cfg);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), cfg);
  const z = useSpring(lift, cfg);
  const shineX = useTransform(px, (v) => `${v * 100}%`);
  const shineY = useTransform(py, (v) => `${v * 100}%`);
  const shine = useMotionTemplate`radial-gradient(420px circle at ${shineX} ${shineY}, rgba(255,255,255,0.09), transparent 45%)`;

  useEffect(() => {
    z.set(lift);
  }, [lift, z]);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={`relative [transform-style:preserve-3d] ${className ?? ""}`}
      style={{ rotateX, rotateY, z, transformPerspective: 1000 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      {children}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: shine }}
      />
    </motion.div>
  );
}
