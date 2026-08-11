"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Crosshair, ImagePlus, Plus, Trash2 } from "lucide-react";
import { toneOf } from "@/lib/accent";
import type { Bias, BoardImage, BoardStat, ImageBoard } from "@/lib/types";

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
  const [placing, setPlacing] = useState<number | null>(null);

  const setImages = (images: BoardImage[]) => onChange({ ...board, images });
  const patchImage = (i: number, patch: Partial<BoardImage>) =>
    setImages(board.images.map((im, j) => (j === i ? { ...im, ...patch } : im)));

  return (
    <div className="space-y-4">
      {board.images.map((im, i) => (
        <ImageSlot
          key={i}
          image={im}
          index={i}
          placing={placing === i}
          onTogglePlacing={() => setPlacing(placing === i ? null : i)}
          onPatch={(p) => patchImage(i, p)}
          onRemove={() => setImages(board.images.filter((_, j) => j !== i))}
        />
      ))}

      <button
        onClick={() => setImages([...board.images, { src: "", alt: "", callouts: [] }])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-[12.5px] text-slate-400 transition hover:border-white/30 hover:text-white"
      >
        <Plus className="size-4" />
        เพิ่มภาพอีกใบ (จะจัดวางคู่กันอัตโนมัติ)
      </button>

      <StatsEditor
        stats={board.stats ?? []}
        onChange={(stats) => onChange({ ...board, stats })}
      />
    </div>
  );
}

function ImageSlot({
  image,
  index,
  placing,
  onTogglePlacing,
  onPatch,
  onRemove,
}: {
  image: BoardImage;
  index: number;
  placing: boolean;
  onTogglePlacing: () => void;
  onPatch: (p: Partial<BoardImage>) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function pick(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      onPatch({ src: String(reader.result), alt: image.alt || file.name });
    reader.readAsDataURL(file);
  }

  function addCalloutAt(e: React.MouseEvent<HTMLDivElement>) {
    if (!placing) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Number((((e.clientX - r.left) / r.width) * 100).toFixed(1));
    const y = Number((((e.clientY - r.top) / r.height) * 100).toFixed(1));
    onPatch({
      callouts: [...(image.callouts ?? []), { x, y, text: "คำอธิบายใหม่", tone: "neutral" }],
    });
    onTogglePlacing();
  }

  const patchCallout = (ci: number, p: Partial<NonNullable<BoardImage["callouts"]>[number]>) =>
    onPatch({
      callouts: (image.callouts ?? []).map((c, j) => (j === ci ? { ...c, ...p } : c)),
    });

  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-white/6 px-2 py-0.5 text-[11px] text-slate-400">
          ภาพที่ {index + 1}
        </span>
        {image.src && (
          <button
            onClick={onTogglePlacing}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] transition ${
              placing
                ? "border-[#22d3ee]/60 bg-[#22d3ee]/12 text-[#22d3ee]"
                : "border-white/12 text-slate-300 hover:border-white/25"
            }`}
          >
            <Crosshair className="size-3.5" />
            {placing ? "คลิกบนภาพเพื่อวางจุด…" : "ปักจุดอธิบาย"}
          </button>
        )}
        <button
          onClick={onRemove}
          className="ml-auto rounded-lg border border-white/8 px-2 py-1 text-slate-500 transition hover:border-[#fb7185]/40 hover:text-[#fb7185]"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0]);
        }}
        onPaste={(e) => pick(e.clipboardData.files?.[0])}
        onClick={(e) => {
          if (!image.src) fileRef.current?.click();
          else addCalloutAt(e);
        }}
        tabIndex={0}
        className={`relative overflow-hidden rounded-lg border border-dashed transition ${
          placing ? "cursor-crosshair border-[#22d3ee]/60" : "border-white/15"
        } ${!image.src ? "grid cursor-pointer place-items-center px-4 py-10 text-center hover:border-[#ffc53d]/50" : ""}`}
      >
        {image.src ? (
          <>
            <Image
              src={image.src}
              alt={image.alt || "preview"}
              width={1600}
              height={900}
              unoptimized
              className="h-auto w-full"
            />
            {image.callouts?.map((c, ci) => {
              const t = toneOf(c.tone);
              return (
                <span
                  key={ci}
                  className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 text-[9px] font-bold"
                  style={{
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    borderColor: t.hex,
                    background: `${t.hex}44`,
                  }}
                />
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

      <input
        value={image.caption ?? ""}
        onChange={(e) => onPatch({ caption: e.target.value })}
        placeholder="คำกำกับใต้ภาพ เช่น S50U26 (Daily)"
        className="mt-2 w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-[12.5px] text-slate-200 outline-none focus:border-[#22d3ee]/60"
      />

      {!!image.callouts?.length && (
        <div className="mt-2 space-y-2">
          {image.callouts.map((c, ci) => (
            <div key={ci} className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-white/6 px-1.5 py-1 text-[10.5px] text-slate-500">
                {c.x}% , {c.y}%
              </span>
              <input
                value={c.text}
                onChange={(e) => patchCallout(ci, { text: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-1.5 text-[12.5px] text-slate-100 outline-none focus:border-[#22d3ee]/60"
              />
              <div className="flex overflow-hidden rounded-lg border border-white/10">
                {TONES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => patchCallout(ci, { tone: t.key })}
                    className={`px-2 py-1.5 text-[11px] transition ${
                      (c.tone ?? "neutral") === t.key
                        ? `${toneOf(t.key).bg} ${toneOf(t.key).text}`
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  patchCallout(ci, { side: c.side === "left" ? "right" : "left" })
                }
                className="rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-slate-400 transition hover:text-white"
                title="สลับด้านของกล่องข้อความ"
              >
                {c.side === "left" ? "◀" : "▶"}
              </button>
              <button
                onClick={() =>
                  onPatch({ callouts: image.callouts!.filter((_, j) => j !== ci) })
                }
                className="rounded-lg border border-white/8 px-2 py-1.5 text-slate-500 transition hover:border-[#fb7185]/40 hover:text-[#fb7185]"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
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
    <div className="rounded-xl border border-white/10 bg-white/2 p-3">
      <p className="mb-2 text-[12.5px] font-semibold text-slate-300">
        ตัวเลขเด่นแถวล่าง <span className="font-normal text-slate-500">(แสดง 4 ช่องต่อแถว)</span>
      </p>
      <div className="space-y-2">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-wrap gap-1.5">
            <input
              value={s.label}
              placeholder="ชื่อ"
              onChange={(e) => patch(i, { label: e.target.value })}
              className="w-36 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-1.5 text-[12.5px] text-slate-300 outline-none focus:border-[#ffc53d]/60"
            />
            <input
              value={s.value}
              placeholder="ค่า"
              onChange={(e) => patch(i, { value: e.target.value })}
              className="w-28 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-1.5 text-[12.5px] text-white outline-none focus:border-[#ffc53d]/60"
            />
            <input
              value={s.delta ?? ""}
              placeholder="คำอธิบาย / %เปลี่ยน"
              onChange={(e) => patch(i, { delta: e.target.value })}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-1.5 text-[12.5px] text-slate-200 outline-none focus:border-[#ffc53d]/60"
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
              className="rounded-lg border border-white/8 px-2 py-1.5 text-slate-500 transition hover:border-[#fb7185]/40 hover:text-[#fb7185]"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...stats, { label: "", value: "", tone: "neutral" }])}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-1.5 text-[12px] text-slate-400 transition hover:border-white/30 hover:text-white"
        >
          <Plus className="size-3.5" />
          เพิ่มตัวเลข
        </button>
      </div>
    </div>
  );
}
