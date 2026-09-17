"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Eraser, ImagePlus, MousePointerClick, Plus, Trash2 } from "lucide-react";
import { toneOf } from "@/lib/accent";
import type { Bias, BoardImage, BoardStat, Callout, ImageBoard } from "@/lib/types";

const TONES: { key: Bias; label: string }[] = [
  { key: "bull", label: "บวก" },
  { key: "neutral", label: "กลาง" },
  { key: "bear", label: "ลบ" },
];

export function BoardEditor({
  board,
  onChange,
}: {
  board: ImageBoard;
  onChange: (b: ImageBoard) => void;
}) {
  const setImages = (images: BoardImage[]) => onChange({ ...board, images });
  const filled = board.images.filter((im) => im.src).length;

  return (
    <div className="space-y-3">
      {filled > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-neon/25 bg-rose-neon/6 px-3 py-2">
          <p className="min-w-0 flex-1 text-[12.5px] text-slate-300">
            มีรูปอยู่ {filled} รูป · ถ้าเป็นรูปของวันก่อน ล้างทิ้งแล้วใส่รูปใหม่ได้เลย
          </p>
          <button
            onClick={() => setImages([{ src: "", alt: "", callouts: [] }])}
            className="flex items-center gap-1.5 rounded-lg bg-rose-neon/15 px-3 py-1.5 text-[12.5px] font-semibold text-rose-neon transition hover:bg-rose-neon/25"
          >
            <Eraser className="size-4" />
            ล้างรูปทั้งหมดในข้อนี้
          </button>
        </div>
      )}

      {board.images.map((im, i) => (
        <ImageSlot
          key={i}
          image={im}
          index={i}
          canRemove={board.images.length > 1}
          onPatch={(p) => setImages(board.images.map((x, j) => (j === i ? { ...x, ...p } : x)))}
          onRemove={() =>
            board.images.length > 1
              ? setImages(board.images.filter((_, j) => j !== i))
              : setImages([{ src: "", alt: "", callouts: [] }])
          }
        />
      ))}

      <button
        onClick={() => setImages([...board.images, { src: "", alt: "", callouts: [] }])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-2.5 text-[12.5px] text-slate-400 transition hover:border-white/30 hover:text-white"
      >
        <Plus className="size-4" />
        เพิ่มภาพอีกใบ (วางคู่กันอัตโนมัติ)
      </button>

      <StatsEditor stats={board.stats ?? []} onChange={(stats) => onChange({ ...board, stats })} />
    </div>
  );
}

function ImageSlot({
  image,
  index,
  canRemove,
  onPatch,
  onRemove,
}: {
  image: BoardImage;
  index: number;
  canRemove: boolean;
  onPatch: (p: Partial<BoardImage>) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const callouts = image.callouts ?? [];

  function pick(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPatch({ src: String(reader.result), alt: image.alt || file.name });
    reader.readAsDataURL(file);
  }

  /** แปลงพิกัดเมาส์เป็น % ของภาพ */
  function toPercent(clientX: number, clientY: number) {
    const r = frameRef.current!.getBoundingClientRect();
    return {
      x: Number(Math.min(98, Math.max(2, ((clientX - r.left) / r.width) * 100)).toFixed(1)),
      y: Number(Math.min(96, Math.max(4, ((clientY - r.top) / r.height) * 100)).toFixed(1)),
    };
  }

  const patchCallout = (i: number, p: Partial<Callout>) =>
    onPatch({ callouts: callouts.map((c, j) => (j === i ? { ...c, ...p } : c)) });

  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-2.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-white/6 px-2 py-0.5 text-[11px] text-slate-400">
          ภาพที่ {index + 1}
        </span>
        {image.src && (
          <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <MousePointerClick className="size-3.5" />
            คลิกบนภาพเพื่อเพิ่มคำอธิบาย · ลากจุดเพื่อย้าย
          </span>
        )}
        {(canRemove || image.src) && (
          <button
            onClick={onRemove}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-rose-neon/30 px-2.5 py-1 text-[12px] text-rose-neon transition hover:bg-rose-neon/10"
          >
            <Trash2 className="size-3.5" />
            {image.src ? "ลบรูปนี้" : "เอาช่องนี้ออก"}
          </button>
        )}
      </div>

      <div
        ref={frameRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0]);
        }}
        onPaste={(e) => pick(e.clipboardData.files?.[0])}
        onClick={(e) => {
          if (!image.src) return fileRef.current?.click();
          if (dragging !== null) return;
          const p = toPercent(e.clientX, e.clientY);
          onPatch({ callouts: [...callouts, { ...p, text: "", tone: "neutral" }] });
        }}
        onPointerMove={(e) => {
          if (dragging === null) return;
          patchCallout(dragging, toPercent(e.clientX, e.clientY));
        }}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
        tabIndex={0}
        className={`relative overflow-hidden rounded-lg border border-dashed border-white/15 transition ${
          image.src
            ? "cursor-crosshair"
            : "grid cursor-pointer place-items-center px-4 py-10 text-center hover:border-amber-neon/50"
        }`}
      >
        {image.src ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-lg bg-ink-950/85 px-2.5 py-1.5 text-[12px] font-semibold text-rose-neon opacity-90 shadow-lg backdrop-blur transition hover:bg-rose-neon hover:text-ink-950"
            >
              <Trash2 className="size-3.5" />
              ลบรูป
            </button>
            <Image
              src={image.src}
              alt={image.alt || "preview"}
              width={1600}
              height={900}
              unoptimized
              draggable={false}
              className="h-auto w-full select-none"
            />
            {callouts.map((c, ci) => {
              const t = toneOf(c.tone);
              return (
                <span
                  key={ci}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDragging(ci);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute grid size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full border-2 text-[9px] font-bold active:cursor-grabbing"
                  style={{
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    borderColor: t.hex,
                    background: `color-mix(in srgb, ${t.hex} 20%, transparent)`,
                    color: t.hex,
                    boxShadow: `0 0 10px color-mix(in srgb, ${t.hex} 40%, transparent)`,
                  }}
                >
                  {ci + 1}
                </span>
              );
            })}
          </>
        ) : (
          <>
            <ImagePlus className="mb-2 size-7 text-slate-500" />
            <p className="text-[13px] text-slate-400">
              ลากไฟล์มาวาง · คลิกเพื่อเลือก · หรือกด Ctrl+V
            </p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      {image.src && (
        <input
          value={image.caption ?? ""}
          onChange={(e) => onPatch({ caption: e.target.value })}
          placeholder="คำกำกับใต้ภาพ เช่น S50U26 (Daily)"
          className="mt-2 w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-[12.5px] text-slate-200 outline-none focus:border-cyan-neon/60"
        />
      )}

      {callouts.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {callouts.map((c, ci) => {
            const t = toneOf(c.tone);
            return (
              <div key={ci} className="flex flex-wrap items-center gap-1.5">
                <span
                  className="grid size-5 shrink-0 place-items-center rounded-full border text-[9px] font-bold"
                  style={{ borderColor: t.hex, color: t.hex }}
                >
                  {ci + 1}
                </span>
                <input
                  value={c.text}
                  placeholder="พิมพ์คำอธิบายจุดนี้"
                  onChange={(e) => patchCallout(ci, { text: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-1.5 text-[12.5px] text-slate-100 outline-none focus:border-cyan-neon/60"
                />
                <div className="flex overflow-hidden rounded-lg border border-white/10">
                  {TONES.map((tn) => (
                    <button
                      key={tn.key}
                      onClick={() => patchCallout(ci, { tone: tn.key })}
                      className={`px-2 py-1.5 text-[11px] transition ${
                        (c.tone ?? "neutral") === tn.key
                          ? `${toneOf(tn.key).bg} ${toneOf(tn.key).text}`
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {tn.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => patchCallout(ci, { side: c.side === "left" ? "right" : "left" })}
                  title="สลับด้านกล่องข้อความ"
                  className="rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-slate-400 transition hover:text-white"
                >
                  {c.side === "left" ? "◀" : "▶"}
                </button>
                <button
                  onClick={() => onPatch({ callouts: callouts.filter((_, j) => j !== ci) })}
                  aria-label="ลบจุดอธิบายนี้"
                  className="rounded-lg border border-white/8 px-2 py-1.5 text-slate-500 transition hover:border-rose-neon/40 hover:text-rose-neon"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatsEditor({
  stats,
  onChange,
}: {
  stats: BoardStat[];
  onChange: (s: BoardStat[]) => void;
}) {
  const patch = (i: number, p: Partial<BoardStat>) =>
    onChange(stats.map((s, j) => (j === i ? { ...s, ...p } : s)));

  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-2.5">
      <p className="mb-2 text-[12.5px] font-semibold text-slate-300">
        ตัวเลขเด่นแถวล่าง <span className="font-normal text-slate-500">(สูงสุด 4 ช่องต่อแถว)</span>
      </p>
      <div className="space-y-1.5">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-wrap gap-1.5">
            <input
              value={s.label}
              placeholder="ชื่อ"
              onChange={(e) => patch(i, { label: e.target.value })}
              className="w-32 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-1.5 text-[12.5px] text-slate-300 outline-none focus:border-amber-neon/60"
            />
            <input
              value={s.value}
              placeholder="ค่า"
              onChange={(e) => patch(i, { value: e.target.value })}
              className="w-28 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-1.5 text-[12.5px] text-white outline-none focus:border-amber-neon/60"
            />
            <input
              value={s.delta ?? ""}
              placeholder="คำอธิบาย / % เปลี่ยนแปลง"
              onChange={(e) => patch(i, { delta: e.target.value })}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-1.5 text-[12.5px] text-slate-200 outline-none focus:border-amber-neon/60"
            />
            <div className="flex overflow-hidden rounded-lg border border-white/10">
              {TONES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => patch(i, { tone: t.key })}
                  className={`px-2 py-1.5 text-[11px] transition ${
                    (s.tone ?? "neutral") === t.key
                      ? `${toneOf(t.key).bg} ${toneOf(t.key).text}`
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => onChange(stats.filter((_, j) => j !== i))}
              aria-label="ลบตัวเลขนี้"
              className="rounded-lg border border-white/8 px-2 py-1.5 text-slate-500 transition hover:border-rose-neon/40 hover:text-rose-neon"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {stats.length < 8 && (
          <button
            onClick={() => onChange([...stats, { label: "", value: "", tone: "neutral" }])}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-1.5 text-[12px] text-slate-400 transition hover:border-white/30 hover:text-white"
          >
            <Plus className="size-3.5" />
            เพิ่มตัวเลข
          </button>
        )}
      </div>
    </div>
  );
}
