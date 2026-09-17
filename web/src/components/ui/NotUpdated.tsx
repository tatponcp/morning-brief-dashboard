"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clock3, Eye, EyeOff, RadioTower } from "lucide-react";
import { ACCENT, type Accent } from "@/lib/accent";
import { pendingReason, type FreshnessInput } from "@/lib/freshness";
import { Tilt } from "./Tilt3D";

const ease = [0.16, 1, 0.3, 1] as const;

/** นาฬิกาเวลาไทย เปลี่ยนทุก 30 วินาที — ใช้ทั้งแสดงเวลาและเช็กข้ามวัน */
function subscribeClock(cb: () => void) {
  const t = setInterval(cb, 30_000);
  return () => clearInterval(t);
}
const clockNow = () => Math.floor(Date.now() / 30_000);

function bangkokTime(tick: number) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(tick * 30_000));
}

/** section นี้ยังไม่อัปเดตหรือยัง — ตัดสินด้วยนาฬิกาของลูกค้า ไม่ใช่เวลาที่หน้าเว็บถูก cache */
export function usePending(input: FreshnessInput) {
  const tick = useSyncExternalStore(subscribeClock, clockNow, clockNow);
  return { reason: pendingReason(input, new Date(tick * 30_000)), tick };
}

/**
 * ครอบเนื้อหาของ section — ถ้ายังไม่อัปเดตจะแสดงฉากรอแบบ 3 มิติแทน
 * ลูกค้ายังกดดูข้อมูลล่าสุดของวันก่อนได้ ถ้ามี
 */
export function PendingGate({
  input,
  title,
  accent,
  lastLabel,
  hasPrevious,
  children,
}: {
  input: FreshnessInput;
  title: string;
  accent: Accent;
  lastLabel: string;
  hasPrevious: boolean;
  children: React.ReactNode;
}) {
  const { reason, tick } = usePending(input);
  const [peek, setPeek] = useState(false);

  if (!reason) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {peek ? (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 16, rotateX: -8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease }}
          style={{ transformPerspective: 1200 }}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-neon/30 bg-amber-neon/8 px-4 py-2.5 text-[13px] text-amber-neon">
            <Clock3 className="size-4" />
            กำลังดูข้อมูลล่าสุดของ {lastLabel} · ยังไม่ใช่ของวันนี้
            <button
              onClick={() => setPeek(false)}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-amber-neon/40 px-2.5 py-1 text-[12px] transition hover:bg-amber-neon/15"
            >
              <EyeOff className="size-3.5" />
              กลับ
            </button>
          </div>
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="pending"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97, rotateX: 10 }}
          transition={{ duration: 0.45, ease }}
        >
          <NotUpdatedScene
            title={title}
            accent={accent}
            lastLabel={lastLabel}
            reason={reason}
            time={bangkokTime(tick)}
            onPeek={hasPrevious ? () => setPeek(true) : undefined}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** ฉาก "ยังไม่อัปเดต" — แกนสัญญาณลอยหมุนในวงโคจร 3 มิติ เอียงตามเมาส์ */
export function NotUpdatedScene({
  title,
  accent,
  lastLabel,
  reason,
  time,
  onPeek,
  compact,
}: {
  title: string;
  accent: Accent;
  lastLabel: string;
  reason: "stale" | "empty";
  time?: string;
  onPeek?: () => void;
  compact?: boolean;
}) {
  const a = ACCENT[accent];
  const reduce = useReducedMotion();
  const spin = (duration: number, reverse = false) =>
    reduce ? {} : { animate: { rotate: reverse ? -360 : 360 }, transition: { duration, repeat: Infinity, ease: "linear" as const } };

  return (
    <Tilt className="rounded-3xl" max={6}>
      <div
        className={`panel relative overflow-hidden rounded-3xl ${compact ? "px-5 py-6" : "px-6 py-10 md:px-10 md:py-14"}`}
        style={{ borderColor: `color-mix(in srgb, ${a.hex} 30%, transparent)` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 size-[30rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `color-mix(in srgb, ${a.hex} 14%, transparent)` }}
        />

        <div className={`relative grid items-center gap-8 ${compact ? "" : "md:grid-cols-[auto_minmax(0,1fr)]"}`}>
          {/* แกนสัญญาณ 3 มิติ */}
          <div
            className={`relative mx-auto grid place-items-center ${compact ? "size-36" : "size-56"}`}
            style={{ perspective: 800, transform: "translateZ(50px)" }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden
                className="absolute"
                style={{
                  inset: `${i * 10}%`,
                  transform: `rotateX(${64 + i * 5}deg) rotateY(${(i - 1) * 22}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full border-2"
                  style={{
                    borderColor: `color-mix(in srgb, ${a.hex} ${55 - i * 12}%, transparent)`,
                    borderStyle: i === 1 ? "dashed" : "solid",
                  }}
                  {...spin(9 + i * 5, i % 2 === 1)}
                >
                  <span
                    className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full"
                    style={{ background: a.hex, boxShadow: `0 0 14px ${a.hex}` }}
                  />
                </motion.span>
              </span>
            ))}

            {!reduce &&
              [0, 1].map((i) => (
                <motion.span
                  key={`wave-${i}`}
                  aria-hidden
                  className="absolute inset-[30%] rounded-full border"
                  style={{ borderColor: a.hex }}
                  initial={{ scale: 0.6, opacity: 0.6 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }}
                />
              ))}

            <motion.div
              className="relative grid size-[38%] place-items-center rounded-2xl border backdrop-blur"
              style={{
                borderColor: `color-mix(in srgb, ${a.hex} 50%, transparent)`,
                background: `linear-gradient(135deg, color-mix(in srgb, ${a.hex} 30%, transparent), color-mix(in srgb, ${a.hex} 6%, transparent))`,
                boxShadow: `0 20px 60px -20px ${a.hex}`,
                transformStyle: "preserve-3d",
              }}
              animate={reduce ? undefined : { rotateY: [0, 18, 0, -18, 0], rotateX: [8, -6, 8], y: [0, -6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <RadioTower className={compact ? "size-7" : "size-10"} style={{ color: a.hex }} />
            </motion.div>
          </div>

          <div className={`min-w-0 ${compact ? "text-center" : "text-center md:text-left"}`} style={{ transform: "translateZ(30px)" }}>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-amber-neon/35 bg-amber-neon/8 px-3 py-1 text-[12.5px] text-amber-neon"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-neon opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-amber-neon" />
              </span>
              {reason === "stale" ? "ยังไม่อัปเดตของวันนี้" : "สัญญาณยังไม่มา"}
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 14, rotateX: 25 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, ease }}
              className={`mt-3 font-display leading-tight font-bold text-white ${compact ? "text-[22px]" : "text-[30px] md:text-[40px]"}`}
            >
              รอสัญญาณ <span style={{ color: a.hex }}>{title}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-[15px] leading-relaxed text-slate-300"
            >
              IC กำลังอ่านภาพและอัปเดตก่อนตลาดเปิด แวะกลับมาอีกครั้งในไม่ช้า
            </motion.p>

            <div className={`mt-5 flex flex-wrap items-center gap-2 ${compact ? "justify-center" : "justify-center md:justify-start"}`}>
              {time && (
                <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-[13px] text-slate-300">
                  <Clock3 className="size-4" />
                  ตอนนี้ {time} น.
                </span>
              )}
              <span className="rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-[13px] text-slate-300">
                ข้อมูลล่าสุด {lastLabel}
              </span>
              {onPeek && (
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onPeek}
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-ink-950"
                  style={{ background: a.hex }}
                >
                  <Eye className="size-4" />
                  ดูข้อมูลล่าสุดไปก่อน
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Tilt>
  );
}
