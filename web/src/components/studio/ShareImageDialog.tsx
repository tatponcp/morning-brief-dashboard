"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Download, ImageDown, Loader2, Share2, X } from "lucide-react";
import type { Draft } from "@/lib/drafts";
import type { Instrument, Section } from "@/lib/types";
import {
  canCopyImage,
  canShareFiles,
  copyPng,
  downloadPng,
  renderPng,
  sharePng,
} from "@/lib/share-image";
import { SHARE_WIDTH, ShareCard, type ShareOptions } from "./ShareCard";

type Status =
  | { kind: "idle" }
  | { kind: "working"; text: string }
  | { kind: "done"; text: string }
  | { kind: "error"; text: string };

/** รอให้กราฟวาดเสร็จก่อนถ่าย — Recharts เล่นแอนิเมชันเส้นประมาณ 1.5 วินาที */
const SETTLE_MS = 1600;

const subscribeNever = () => () => {};

export function ShareImageDialog({
  open,
  onClose,
  section,
  draft,
  dateLabel,
  dateISO,
  instruments,
}: {
  open: boolean;
  onClose: () => void;
  section: Section;
  draft: Draft;
  dateLabel: string;
  dateISO: string;
  instruments?: Instrument[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(0);

  const [options, setOptions] = useState<ShareOptions>({ narrative: true });
  const [scale, setScale] = useState(0.5);
  const [cardHeight, setCardHeight] = useState(900);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const isClient = useSyncExternalStore(subscribeNever, () => true, () => false);
  const supportsCopy = isClient && canCopyImage();
  const supportsShare = isClient && canShareFiles();

  const filename = `morning-brief-${dateISO}-${section.index}-${section.id}.png`;

  // จับเวลาตอนเปิด เพื่อรอกราฟวาดเสร็จก่อนถ่าย
  useEffect(() => {
    if (open) openedAt.current = performance.now();
  }, [open]);

  // ย่อการ์ด 1080px ให้พอดีหน้าต่าง โดยไม่เปลี่ยนขนาดจริงของรูป
  useLayoutEffect(() => {
    if (!open) return;
    const frame = frameRef.current;
    const card = cardRef.current;
    if (!frame || !card) return;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, frame.clientWidth / SHARE_WIDTH));
      setCardHeight(card.offsetHeight);
    });
    ro.observe(frame);
    ro.observe(card);
    return () => ro.disconnect();
  }, [open, options]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function make(): Promise<Blob> {
    const wait = SETTLE_MS - (performance.now() - openedAt.current);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    if (!cardRef.current) throw new Error("ไม่พบการ์ด");
    return renderPng(cardRef.current);
  }

  async function run(label: string, action: () => Promise<string>) {
    setStatus({ kind: "working", text: label });
    try {
      setStatus({ kind: "done", text: await action() });
    } catch (err) {
      // ผู้ใช้กดยกเลิกหน้าต่างแชร์เอง ไม่นับเป็นข้อผิดพลาด
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus({ kind: "idle" });
        return;
      }
      setStatus({
        kind: "error",
        text:
          label === "กำลังคัดลอก…"
            ? "เบราว์เซอร์ไม่อนุญาตให้คัดลอกรูป ลองกด ดาวน์โหลด แทน"
            : "สร้างรูปไม่สำเร็จ ลองใหม่อีกครั้ง",
      });
    }
  }

  const busy = status.kind === "working";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col bg-ink-950/92 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="สร้างรูปส่งลูกค้า"
        >
          {/* ---------- แถบบน ---------- */}
          <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-ink-900/80 px-4 py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-neon to-violet-neon text-ink-950">
              <ImageDown className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-bold text-white">สร้างรูปส่งลูกค้า</p>
              <p className="truncate text-[11.5px] text-slate-400">
                {section.index} · {section.title} · {dateLabel}
              </p>
            </div>

            <label className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-[12px] text-slate-300">
              <input
                type="checkbox"
                checked={options.narrative}
                onChange={(e) => setOptions((o) => ({ ...o, narrative: e.target.checked }))}
                className="size-3.5 accent-cyan-neon"
              />
              ใส่ สรุปสั้น / แปลความ / Action
            </label>

            <button
              onClick={onClose}
              aria-label="ปิด"
              className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* ---------- พรีวิว: สิ่งที่อยู่ในกรอบคือรูปที่ลูกค้าจะได้รับ ---------- */}
          <div className="scroll-slim flex-1 overflow-auto px-4 py-5">
            <div ref={frameRef} className="mx-auto w-full max-w-[1080px]">
              <div
                className="overflow-hidden rounded-xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
                style={{ height: cardHeight * scale, width: SHARE_WIDTH * scale }}
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <ShareCard
                    ref={cardRef}
                    section={section}
                    draft={draft}
                    dateLabel={dateLabel}
                    instruments={instruments}
                    options={options}
                  />
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                ขนาดรูป {SHARE_WIDTH * 2} × {Math.round(cardHeight * 2)} px · คมชัดพอซูมดูในมือถือ
              </p>
            </div>
          </div>

          {/* ---------- ปุ่มส่งออก ---------- */}
          <div className="border-t border-white/10 bg-ink-900/90 px-4 py-3">
            <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-2">
              <span
                aria-live="polite"
                className={`flex items-center gap-1.5 text-[12.5px] ${
                  status.kind === "error"
                    ? "text-rose-neon"
                    : status.kind === "done"
                      ? "text-green-neon"
                      : "text-slate-400"
                }`}
              >
                {status.kind === "working" && <Loader2 className="size-4 animate-spin" />}
                {status.kind === "done" && <Check className="size-4" />}
                {status.kind === "idle"
                  ? supportsCopy
                    ? "กดคัดลอกแล้วไปวาง (Ctrl+V) ในแชต LINE ได้เลย"
                    : "กดดาวน์โหลดแล้วแนบรูปในแชต"
                  : status.text}
              </span>

              <div className="ml-auto flex flex-wrap gap-2">
                {supportsShare && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      run("กำลังเปิดหน้าต่างแชร์…", async () => {
                        await sharePng(await make(), filename, section.title);
                        return "ส่งไปแอปที่เลือกแล้ว";
                      })
                    }
                    className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-[13px] text-slate-200 transition hover:border-white/25 disabled:opacity-50"
                  >
                    <Share2 className="size-4" />
                    แชร์ (LINE ฯลฯ)
                  </button>
                )}

                <button
                  disabled={busy}
                  onClick={() =>
                    run("กำลังสร้างไฟล์…", async () => {
                      downloadPng(await make(), filename);
                      return `ดาวน์โหลด ${filename} แล้ว`;
                    })
                  }
                  className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-[13px] text-slate-200 transition hover:border-white/25 disabled:opacity-50"
                >
                  <Download className="size-4" />
                  ดาวน์โหลด PNG
                </button>

                {supportsCopy && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      run("กำลังคัดลอก…", async () => {
                        await copyPng(make);
                        return "คัดลอกรูปแล้ว — ไปวางในแชตได้เลย";
                      })
                    }
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-neon to-green-neon px-5 py-2.5 text-[13px] font-semibold text-ink-950 transition hover:brightness-110 disabled:opacity-60"
                  >
                    {busy && status.text === "กำลังคัดลอก…" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    คัดลอกรูป
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
