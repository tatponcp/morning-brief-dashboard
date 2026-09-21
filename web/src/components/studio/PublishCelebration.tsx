"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ExternalLink, ImageUp, LayoutGrid, X } from "lucide-react";
import { thaiDate } from "@/lib/format";

export type PublishDone = {
  date: string;
  images: number;
  ready: number;
  total: number;
};

/** ปิดเองหลังกี่วินาที (ชี้เมาส์ค้างไว้ = หยุดนับ) */
const STAY_MS = 6000;
const subscribeNever = () => () => {};

/**
 * ป๊อปอัปกลางจอหลังเผยแพร่สำเร็จ — การ์ดนิ่ง ค่อย ๆ จางและขยายเข้ามา
 * แถบด้านล่างนับถอยหลังแล้วปิดเอง (ชี้เมาส์ค้าง = หยุด) · กดปุ่ม / Esc / คลิกพื้นหลัง = ปิดทันที
 */
export function PublishCelebration({
  done,
  open,
  onClose,
}: {
  /** ผลการเผยแพร่ล่าสุด (เก็บไว้แสดงระหว่างจางหาย) */
  done: PublishDone | null;
  open: boolean;
  onClose: () => void;
}) {
  const [paused, setPaused] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  // ปิดทุกทาง (ปุ่ม / Esc / พื้นหลัง) ล้างสถานะชี้เมาส์ค้างด้วย เปิดครั้งหน้าจะได้นับเวลาตามปกติ
  const close = useCallback(() => {
    setPaused(false);
    onClose();
  }, [onClose]);

  // ตัวจับเวลาปิดเอง — เก็บเวลาที่เหลือไว้ ชี้เมาส์ค้างแล้วออกจะนับต่อจากเดิม
  const left = useRef(STAY_MS);
  useEffect(() => {
    if (open) left.current = STAY_MS;
  }, [open, done]);
  useEffect(() => {
    if (!open || paused) return;
    const start = Date.now();
    const t = window.setTimeout(onClose, left.current);
    return () => {
      window.clearTimeout(t);
      left.current = Math.max(0, left.current - (Date.now() - start));
    };
  }, [open, paused, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!mounted || !done) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: open ? 1 : 0 }}
      transition={{ duration: 0.25 }}
      // ปิดแล้วไม่รับคลิกทันที (ไม่รอแอนิเมชันจางจบ) — หน้าข้างหลังกดได้เลย
      style={{ pointerEvents: open ? "auto" : "none" }}
      aria-hidden={!open}
      inert={!open}
      role="dialog"
      aria-modal
      aria-label="เผยแพร่แล้ว"
    >
      {/* พื้นหลัง — คลิกเพื่อปิด */}
      <button
        type="button"
        aria-label="ปิด"
        onClick={close}
        className="absolute inset-0 cursor-default bg-ink-950/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={
          open
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.97, y: 6 }
        }
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        className="relative w-full max-w-[440px] overflow-hidden rounded-[28px] border border-white/12 px-7 pt-8 pb-7 text-center shadow-2xl"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, color-mix(in srgb, var(--c-green) 18%, transparent), transparent 60%), linear-gradient(180deg, var(--ink-800), var(--ink-900))",
          boxShadow:
            "0 40px 80px -30px rgba(0,0,0,0.7), 0 0 80px -30px var(--c-green)",
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="ปิด"
          className="absolute top-3.5 right-3.5 rounded-xl p-2 text-slate-400 transition hover:bg-white/8 hover:text-white"
        >
          <X className="size-5" />
        </button>

        {/* เหรียญเครื่องหมายถูก (นิ่ง) */}
        <div
          className="relative mx-auto grid size-24 place-items-center rounded-full"
          style={{
            background:
              "linear-gradient(150deg, color-mix(in srgb, var(--c-green) 65%, white), var(--c-green) 45%, color-mix(in srgb, var(--c-green) 60%, #0b1020))",
            boxShadow:
              "inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -4px 0 rgba(0,0,0,0.22), 0 14px 36px -10px var(--c-green)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-12"
            fill="none"
            stroke="#fff"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              key={open ? "on" : "off"}
              d="M20 6 9 17l-5-5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            />
          </svg>
        </div>

        <h2 className="mt-5 font-display text-[32px] leading-none font-bold text-white">
          เผยแพร่แล้ว
        </h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-slate-300">
          Morning Brief วันที่{" "}
          <span className="font-semibold text-white">
            {thaiDate(done.date)}
          </span>{" "}
          ขึ้นเว็บแล้ว
          <br />
          ลูกค้าเปิดลิงก์เดิมก็เห็นฉบับใหม่ทันที
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Stat
            icon={<LayoutGrid className="size-4" />}
            label="section พร้อม"
            value={`${done.ready}/${done.total}`}
          />
          <Stat
            icon={<ImageUp className="size-4" />}
            label="อัปโหลดภาพ"
            value={`${done.images} รูป`}
          />
        </div>

        <div className="mt-5 flex gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-neon px-4 py-3 text-[15px] font-semibold text-ink-950 transition hover:brightness-110"
          >
            <ExternalLink className="size-4.5" />
            เปิดดูหน้าเว็บ
          </a>
          <button
            type="button"
            onClick={close}
            className="rounded-2xl border border-white/15 px-5 py-3 text-[15px] font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/5"
          >
            ปิด
          </button>
        </div>

        {/* แถบนับถอยหลัง (ภาพอย่างเดียว เวลาจริงนับด้วย timer ข้างบน) */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
          <div
            key={open ? `${done.date}-${done.images}-on` : "off"}
            className="h-full origin-left bg-green-neon"
            style={{
              animation: `mb-countdown ${STAY_MS}ms linear forwards`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 px-3.5 py-3 text-left">
      <p className="flex items-center gap-1.5 text-[12.5px] text-slate-400">
        {icon}
        {label}
      </p>
      <p className="font-display text-[22px] font-bold text-white">{value}</p>
    </div>
  );
}
