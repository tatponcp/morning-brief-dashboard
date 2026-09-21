"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { Check, ExternalLink, ImageUp, LayoutGrid, X } from "lucide-react";
import { thaiDate } from "@/lib/format";

export type PublishDone = { date: string; images: number; ready: number; total: number };

/** ปิดเองหลังกี่วินาที (ชี้เมาส์ค้างไว้ = หยุดนับ) */
const STAY_MS = 6000;
const subscribeNever = () => () => {};

const BURST = ["var(--c-cyan)", "var(--c-green)", "var(--c-amber)", "var(--c-violet)", "var(--c-rose)", "var(--c-sky)"];

/**
 * ป๊อปอัปกลางจอหลังเผยแพร่สำเร็จ — การ์ดพลิกเข้ามาแบบ 3 มิติ เหรียญเครื่องหมายถูกนูน มีวงแสงกับพลุกระจาย
 * การ์ดเอียงตามเมาส์ แถบเวลาด้านล่างนับถอยหลังแล้วปิดเอง (Esc / คลิกนอกการ์ด = ปิดทันที)
 */
export function PublishCelebration({ done, onClose }: { done: PublishDone | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  // แถบเวลา 1 → 0 · ชี้เมาส์ค้าง = หยุด แล้วนับต่อจากเดิม
  const bar = useMotionValue(1);
  useEffect(() => {
    if (done) bar.set(1);
  }, [done, bar]);
  useEffect(() => {
    if (!done || paused) return;
    const ctl = animate(bar, 0, { duration: (bar.get() * STAY_MS) / 1000, ease: "linear", onComplete: onClose });
    return () => ctl.stop();
  }, [done, paused, bar, onClose]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 18 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 18 });

  useEffect(() => {
    if (!done) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {done && (
        <motion.div
          key="publish-done"
          className="fixed inset-0 z-[100] grid place-items-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.1 } }}
          onClick={onClose}
          role="dialog"
          aria-modal
          aria-label="เผยแพร่แล้ว"
        >
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-md" />

          <div style={{ perspective: 1100 }} className="relative w-full max-w-[460px]">
            <motion.div
              onClick={(e) => e.stopPropagation()}
              onPointerMove={(e) => {
                if (reduce || e.pointerType !== "mouse") return;
                const r = e.currentTarget.getBoundingClientRect();
                px.set((e.clientX - r.left) / r.width - 0.5);
                py.set((e.clientY - r.top) / r.height - 0.5);
              }}
              onPointerEnter={() => setPaused(true)}
              onPointerLeave={() => {
                setPaused(false);
                px.set(0);
                py.set(0);
              }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, rotateX: 55, y: 80, scale: 0.8 }}
              animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, rotateX: -30, y: -40, scale: 0.9, transition: { duration: 0.35 } }}
              transition={{ type: "spring", stiffness: 190, damping: 18 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                className="relative rounded-[28px] border border-white/12 px-7 pt-9 pb-6 text-center shadow-2xl"
                style={{
                  rotateX: reduce ? 0 : rotateX,
                  rotateY: reduce ? 0 : rotateY,
                  transformStyle: "preserve-3d",
                  background:
                    "radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--c-green) 22%, transparent), transparent 60%), linear-gradient(180deg, var(--ink-800), var(--ink-900))",
                  boxShadow: "0 40px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 0 90px -30px var(--c-green)",
                }}
              >
                <button
                  onClick={onClose}
                  aria-label="ปิด"
                  className="absolute top-3 right-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-white"
                  style={{ transform: "translateZ(30px)" }}
                >
                  <X className="size-4" />
                </button>

                <Medallion reduce={!!reduce} />

                <motion.h2
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 22 }}
                  className="mt-6 font-display text-[34px] leading-none font-bold text-white"
                  style={{ z: 40 }}
                >
                  เผยแพร่แล้ว!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="mt-2 text-[14.5px] text-slate-300"
                  style={{ z: 30 }}
                >
                  Morning Brief วันที่ <span className="font-semibold text-white">{thaiDate(done.date)}</span> ขึ้นเว็บแล้ว
                  <br />
                  ลูกค้าเปิดลิงก์เดิมก็เห็นฉบับใหม่ทันที
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="mt-5 grid grid-cols-2 gap-2.5"
                  style={{ z: 24 }}
                >
                  <Stat icon={<LayoutGrid className="size-4" />} label="section พร้อม" value={`${done.ready}/${done.total}`} />
                  <Stat icon={<ImageUp className="size-4" />} label="อัปโหลดภาพ" value={`${done.images} รูป`} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.65 }}
                  className="mt-5 flex gap-2"
                  style={{ z: 20 }}
                >
                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-neon px-4 py-2.5 text-[14px] font-semibold text-ink-950 transition hover:brightness-110"
                  >
                    <ExternalLink className="size-4" />
                    เปิดดูหน้าเว็บ
                  </a>
                  <button
                    onClick={onClose}
                    className="rounded-xl border border-white/12 px-4 py-2.5 text-[14px] text-slate-200 transition hover:border-white/25"
                  >
                    ปิด
                  </button>
                </motion.div>

                {/* แถบนับถอยหลัง — ชี้เมาส์ค้างไว้ = หยุด */}
                <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-[28px] bg-white/5">
                  <motion.div className="h-full origin-left bg-green-neon" style={{ scaleX: bar }} />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** เหรียญเครื่องหมายถูกซ้อน 3 ชั้นบนแกน Z + วงแสงขยายออก + พลุกระจาย */
function Medallion({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative mx-auto size-28" style={{ transformStyle: "preserve-3d" }}>
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border-2 border-green-neon"
            initial={{ scale: 0.6, opacity: 0.7 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ delay: 0.25 + i * 0.35, duration: 1.4, ease: "easeOut" }}
          />
        ))}

      {!reduce &&
        Array.from({ length: 22 }, (_, i) => {
          const ang = (i / 22) * Math.PI * 2;
          const dist = 95 + (i % 3) * 28;
          return (
            <motion.span
              key={i}
              className="absolute top-1/2 left-1/2 rounded-sm"
              style={{
                width: i % 2 ? 6 : 9,
                height: i % 2 ? 6 : 4,
                background: BURST[i % BURST.length],
                marginLeft: -3,
                marginTop: -3,
              }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
              animate={{
                x: Math.cos(ang) * dist,
                y: Math.sin(ang) * dist + 30,
                opacity: [0, 1, 1, 0],
                rotate: 180 + i * 40,
                scale: 1,
              }}
              transition={{ delay: 0.3, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}

      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        initial={reduce ? false : { rotateY: -180, scale: 0.3 }}
        animate={reduce ? undefined : { rotateY: [-180, 0], scale: 1, y: [0, -5, 0] }}
        transition={{
          rotateY: { type: "spring", stiffness: 120, damping: 12, delay: 0.1 },
          scale: { type: "spring", stiffness: 200, damping: 14, delay: 0.1 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
        }}
      >
        {/* เงา */}
        <span
          className="absolute inset-2 rounded-full blur-xl"
          style={{ background: "var(--c-green)", opacity: 0.55, transform: "translateZ(-20px) translateY(10px)" }}
        />
        {/* ขอบหนาของเหรียญ */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(160deg, color-mix(in srgb, var(--c-green) 55%, black), color-mix(in srgb, var(--c-green) 30%, black))",
            transform: "translateZ(-6px)",
          }}
        />
        {/* หน้าเหรียญ */}
        <span
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{
            background: "linear-gradient(150deg, color-mix(in srgb, var(--c-green) 65%, white), var(--c-green) 45%, color-mix(in srgb, var(--c-green) 60%, #0b1020))",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -4px 0 rgba(0,0,0,0.25)",
          }}
        >
          <span
            className="absolute -top-1/3 left-[-15%] h-3/4 w-[130%] rounded-[50%]"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))" }}
          />
        </span>
        {/* เครื่องหมายถูกนูน */}
        <span className="absolute inset-0 grid place-items-center" style={{ transform: "translateZ(8px) translateY(3px)" }}>
          <Check className="size-14 opacity-50" strokeWidth={3.5} style={{ color: "color-mix(in srgb, var(--c-green) 40%, black)" }} />
        </span>
        <span className="absolute inset-0 grid place-items-center" style={{ transform: "translateZ(16px)" }}>
          <motion.svg viewBox="0 0 24 24" className="size-14" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
            <motion.path
              d="M20 6 9 17l-5-5"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.55, duration: 0.45, ease: "easeOut" }}
            />
          </motion.svg>
        </span>
      </motion.div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 px-3 py-2.5 text-left">
      <p className="flex items-center gap-1.5 text-[12px] text-slate-400">
        {icon}
        {label}
      </p>
      <p className="font-display text-[20px] font-bold text-white">{value}</p>
    </div>
  );
}
