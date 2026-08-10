"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Maximize2, MousePointerClick, X } from "lucide-react";
import { ACCENT, toneOf, type Accent } from "@/lib/accent";
import { Sparkline } from "@/components/charts/chart-bits";
import type { ImageBoard as Board } from "@/lib/types";

/**
 * แกนหลักของ workflow "IC แคปภาพ → ได้ Infographic"
 * ระบบวางกรอบ / callout / stat tiles ให้อัตโนมัติ IC แค่กรอกข้อความ
 */
export function ImageBoard({ board, accent }: { board: Board; accent: Accent }) {
  const a = ACCENT[accent];
  const [open, setOpen] = useState(false);
  const [showCallouts, setShowCallouts] = useState(true);

  return (
    <>
      <div className="panel overflow-hidden">
        <div className="flex items-center gap-3 border-b border-white/6 px-5 py-3.5">
          <span className="size-2 rounded-full" style={{ background: a.hex }} />
          <p className="text-[12.5px] text-slate-300">ภาพจากระบบสัญญาณ</p>
          <div className="ml-auto flex items-center gap-2">
            {!!board.callouts?.length && (
              <button
                onClick={() => setShowCallouts((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] transition ${
                  showCallouts
                    ? "border-white/16 bg-white/6 text-slate-100"
                    : "border-white/8 bg-white/2 text-slate-500"
                }`}
              >
                <MousePointerClick className="size-3.5" />
                คำอธิบายบนภาพ
              </button>
            )}
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-2.5 py-1.5 text-[11.5px] text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              <Maximize2 className="size-3.5" />
              ขยาย
            </button>
          </div>
        </div>

        <div className="group relative m-3 overflow-hidden rounded-xl border border-white/8 bg-ink-950">
          <Image
            src={board.src}
            alt={board.alt}
            width={1920}
            height={1080}
            priority
            className="h-auto w-full cursor-zoom-in transition duration-500 group-hover:scale-[1.01]"
            onClick={() => setOpen(true)}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{ boxShadow: `inset 0 0 90px -30px ${a.hex}` }}
          />

          <AnimatePresence>
            {showCallouts &&
              board.callouts?.map((c, i) => {
                const t = toneOf(c.tone);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: 0.15 * i }}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  >
                    <div
                      className="max-w-[240px] rounded-xl border bg-ink-900/92 px-3 py-2 text-[12px] leading-snug backdrop-blur"
                      style={{ borderColor: `${t.hex}66`, color: t.hex }}
                    >
                      <span className="relative flex">
                        <span
                          className="absolute -top-4 -left-4 size-2.5 animate-ping rounded-full opacity-70"
                          style={{ background: t.hex }}
                        />
                      </span>
                      {c.text}
                    </div>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>

        {!!board.stats?.length && (
          <div className="grid grid-cols-2 gap-px border-t border-white/6 bg-white/6 lg:grid-cols-4">
            {board.stats.map((s, i) => {
              const t = toneOf(s.tone);
              return (
                <div key={i} className="bg-ink-900 px-4 py-4">
                  <p className="truncate text-[11.5px] text-slate-500">{s.label}</p>
                  <div className="flex items-end justify-between gap-2">
                    <p className="font-display text-xl font-bold text-white">{s.value}</p>
                    {s.spark && <Sparkline data={s.spark} color={t.hex} width={72} height={26} />}
                  </div>
                  {s.delta && (
                    <p className={`mt-0.5 text-[12px] font-semibold ${t.text}`}>{s.delta}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-ink-950/92 p-4 backdrop-blur-sm"
          >
            <button className="absolute top-5 right-5 rounded-xl border border-white/12 bg-white/6 p-2 text-slate-200">
              <X className="size-5" />
            </button>
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="max-h-[92dvh] w-full max-w-6xl overflow-auto rounded-2xl border border-white/10"
            >
              <Image
                src={board.src}
                alt={board.alt}
                width={2400}
                height={1400}
                className="h-auto w-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
