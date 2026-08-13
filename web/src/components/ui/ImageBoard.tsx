"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Maximize2, MousePointerClick, X } from "lucide-react";
import { ACCENT, toneOf, type Accent } from "@/lib/accent";
import { Sparkline } from "@/components/charts/chart-bits";
import type { BoardImage, ImageBoard as Board } from "@/lib/types";

/**
 * โหมดภาพ — หัวใจของ workflow "IC แคปภาพ → ได้ Infographic"
 * ภาพเป็นแค่ layer เดียว ส่วนกรอบ / จุดชี้ / ตัวเลข / คำอธิบาย ระบบวาดให้ทั้งหมด
 */
export function ImageBoard({ board, accent }: { board: Board; accent: Accent }) {
  const a = ACCENT[accent];
  const [zoom, setZoom] = useState<BoardImage | null>(null);
  const [showCallouts, setShowCallouts] = useState(true);

  const hasCallouts = board.images.some((im) => !!im.callouts?.length);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setZoom(null);
  }, []);

  useEffect(() => {
    if (!zoom) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, onKey]);

  return (
    <>
      <div className="panel overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-white/6 px-4 py-2">
          <span
            className="size-2 rounded-full"
            style={{ background: a.hex, boxShadow: `0 0 12px ${a.hex}` }}
          />
          <p className="text-[12.5px] text-slate-300">ภาพจากระบบสัญญาณ</p>
          {hasCallouts && (
            <button
              onClick={() => setShowCallouts((v) => !v)}
              className={`ml-auto flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] transition ${
                showCallouts
                  ? "border-white/16 bg-white/6 text-slate-100"
                  : "border-white/8 bg-white/2 text-slate-500"
              }`}
            >
              <MousePointerClick className="size-3.5" />
              คำอธิบายบนภาพ
            </button>
          )}
        </div>

        <div
          className={`grid gap-2 p-2 ${board.images.length > 1 ? "lg:grid-cols-2" : ""}`}
        >
          {board.images.map((im, i) => (
            <Figure
              key={i}
              image={im}
              accentHex={a.hex}
              showCallouts={showCallouts}
              onZoom={() => setZoom(im)}
            />
          ))}
        </div>

        {!!board.stats?.length && (
          <div className="grid grid-cols-2 gap-px border-t border-white/6 bg-white/6 lg:grid-cols-4">
            {board.stats.map((s, i) => {
              const t = toneOf(s.tone);
              return (
                <div key={i} className="bg-ink-900 px-3 py-2.5">
                  <p className="truncate text-[11px] text-slate-500">{s.label}</p>
                  <div className="flex items-end justify-between gap-2">
                    <p className="font-display text-[17px] font-bold text-white">{s.value}</p>
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
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
            className="fixed inset-0 z-50 grid place-items-center bg-ink-950/93 p-4 backdrop-blur-sm"
          >
            <button
              onClick={() => setZoom(null)}
              aria-label="ปิด"
              className="absolute top-5 right-5 rounded-xl border border-white/12 bg-white/6 p-2 text-slate-200 transition hover:bg-white/12"
            >
              <X className="size-5" />
            </button>
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92dvh] w-full max-w-6xl overflow-auto rounded-2xl border border-white/10"
            >
              <Image
                src={zoom.src}
                alt={zoom.alt}
                width={2400}
                height={1400}
                unoptimized={zoom.src.startsWith("data:")}
                className="h-auto w-full"
              />
            </motion.div>
            <p className="mt-3 text-[12px] text-slate-500">คลิกที่ใดก็ได้ หรือกด Esc เพื่อปิด</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Figure({
  image,
  accentHex,
  showCallouts,
  onZoom,
}: {
  image: BoardImage;
  accentHex: string;
  showCallouts: boolean;
  onZoom: () => void;
}) {
  return (
    <figure className="group relative">
      <div
        className="relative overflow-hidden rounded-xl border bg-ink-950"
        style={{ borderColor: `${accentHex}2e` }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={1920}
          height={1080}
          unoptimized={image.src.startsWith("data:")}
          className="mx-auto h-auto max-h-[58vh] w-full cursor-zoom-in object-contain"
          onClick={onZoom}
        />

        {/* ขอบเรืองแสง + ขีดมุม ให้ดูเป็นการ์ดอินโฟกราฟิก ไม่ใช่ภาพแปะ */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ boxShadow: `inset 0 0 80px -28px ${accentHex}` }}
        />
        {[
          "left-2 top-2 border-l-2 border-t-2 rounded-tl-md",
          "right-2 top-2 border-r-2 border-t-2 rounded-tr-md",
          "left-2 bottom-2 border-l-2 border-b-2 rounded-bl-md",
          "right-2 bottom-2 border-r-2 border-b-2 rounded-br-md",
        ].map((cls) => (
          <span
            key={cls}
            className={`pointer-events-none absolute size-4 ${cls}`}
            style={{ borderColor: `${accentHex}88` }}
          />
        ))}

        <button
          onClick={onZoom}
          className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg border border-white/12 bg-ink-900/80 px-2.5 py-1.5 text-[11.5px] text-slate-200 opacity-0 backdrop-blur transition group-hover:opacity-100"
        >
          <Maximize2 className="size-3.5" />
          ขยาย
        </button>

        <AnimatePresence>
          {showCallouts &&
            image.callouts?.map((c, i) => <CalloutPin key={i} c={c} index={i} />)}
        </AnimatePresence>
      </div>

      {image.caption && (
        <figcaption
          className="mt-1.5 flex items-center gap-2 px-1 text-[12px] font-semibold"
          style={{ color: accentHex }}
        >
          <span className="h-3 w-0.5 rounded" style={{ background: accentHex }} />
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}

function CalloutPin({
  c,
  index,
}: {
  c: { x: number; y: number; text: string; tone?: string; side?: "left" | "right" };
  index: number;
}) {
  const t = toneOf(c.tone as never);
  const side = c.side ?? (c.x > 55 ? "left" : "right");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ delay: 0.12 * index, type: "spring", stiffness: 380, damping: 26 }}
      className="absolute z-10"
      style={{ left: `${c.x}%`, top: `${c.y}%` }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        {/* จุดชี้ + วงกระเพื่อม */}
        <span
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: t.hex, boxShadow: `0 0 14px ${t.hex}` }}
        />
        <span
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full opacity-60"
          style={{ background: t.hex }}
        />
        {/* เส้นโยงไปกล่องข้อความ */}
        <span
          className="absolute top-0 h-px w-8"
          style={{
            background: `linear-gradient(${side === "right" ? "90deg" : "270deg"}, ${t.hex}, transparent)`,
            [side === "right" ? "left" : "right"]: 0,
          }}
        />
      </div>

      <div
        className={`absolute top-0 max-w-[230px] -translate-y-1/2 rounded-xl border bg-ink-900/94 px-3 py-2 text-[12px] leading-snug backdrop-blur ${
          side === "right" ? "left-8" : "right-8"
        }`}
        style={{ borderColor: `${t.hex}66`, color: t.hex }}
      >
        {c.text}
      </div>
    </motion.div>
  );
}
