"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  Download,
  ImagePlus,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { getBrief } from "@/data";
import { ACCENT, toneOf } from "@/lib/accent";
import type { Bias } from "@/lib/types";
import { NarrativeGrid } from "@/components/ui/NarrativeGrid";

const TONES: { key: Bias; label: string }[] = [
  { key: "bull", label: "บวก" },
  { key: "neutral", label: "กลาง" },
  { key: "bear", label: "ลบ" },
];

export default function StudioPage() {
  const brief = getBrief();
  const [sectionId, setSectionId] = useState(brief.sections[2].id);
  const section = brief.sections.find((s) => s.id === sectionId)!;
  const a = ACCENT[section.accent];

  const [summary, setSummary] = useState<string[]>(section.narrative.summary);
  const [interpretation, setInterpretation] = useState(section.narrative.interpretation);
  const [actions, setActions] = useState(section.narrative.actions);
  const [insight, setInsight] = useState(section.narrative.insight);
  const [image, setImage] = useState<string | null>(section.board?.src ?? null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function loadSection(id: string) {
    const s = brief.sections.find((x) => x.id === id)!;
    setSectionId(id);
    setSummary(s.narrative.summary);
    setInterpretation(s.narrative.interpretation);
    setActions(s.narrative.actions);
    setInsight(s.narrative.insight);
    setImage(s.board?.src ?? null);
  }

  const payload = useMemo(
    () =>
      JSON.stringify(
        {
          date: brief.date,
          sectionId,
          image: image?.startsWith("data:") ? "<uploaded-file>" : image,
          narrative: { summary, interpretation, actions, insight },
        },
        null,
        2,
      ),
    [brief.date, sectionId, image, summary, interpretation, actions, insight],
  );

  function onPick(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <div className="panel relative overflow-hidden px-6 py-7">
        <div className="pointer-events-none absolute -top-24 right-10 size-72 rounded-full bg-[#ffc53d]/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#ffc53d]/15 text-[#ffc53d] ring-glow-amber">
            <Wand2 className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
              IC Studio · สร้าง Brief วันนี้
            </h1>
            <p className="mt-1 text-[14px] text-slate-400">
              วางภาพที่แคปมา → กรอก 3 ช่อง (สรุปสั้น / แปลความ / Action) → ระบบจัดหน้าให้เป็น
              Infographic อัตโนมัติ
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(payload);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-[13px] text-slate-200 transition hover:border-white/25"
            >
              {copied ? <Check className="size-4 text-[#34f5a0]" /> : <Copy className="size-4" />}
              {copied ? "คัดลอกแล้ว" : "คัดลอก JSON"}
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ffc53d] to-[#fb923c] px-3.5 py-2.5 text-[13px] font-semibold text-ink-950">
              <Download className="size-4" />
              เผยแพร่
            </button>
          </div>
        </div>
      </div>

      {/* section picker */}
      <div className="scroll-slim flex gap-2 overflow-x-auto pb-1">
        {brief.sections.map((s) => {
          const sa = ACCENT[s.accent];
          const on = s.id === sectionId;
          return (
            <button
              key={s.id}
              onClick={() => loadSection(s.id)}
              className="flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] transition"
              style={{
                borderColor: on ? sa.hex : "rgba(148,163,184,0.16)",
                background: on ? sa.soft : "rgba(255,255,255,0.02)",
                color: on ? sa.hex : "#94a3b8",
              }}
            >
              <span className="font-display font-bold">{s.index}</span>
              {s.title}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* ---------- editor ---------- */}
        <div className="space-y-4">
          <Block title="ภาพประกอบ (แคปมาวางได้เลย)" color={a.hex}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onPick(e.dataTransfer.files?.[0]);
              }}
              onPaste={(e) => onPick(e.clipboardData.files?.[0])}
              onClick={() => fileRef.current?.click()}
              tabIndex={0}
              className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-white/15 bg-white/2 px-4 py-8 text-center transition hover:border-[#ffc53d]/50 hover:bg-[#ffc53d]/4"
            >
              {image ? (
                <Image
                  src={image}
                  alt="preview"
                  width={1200}
                  height={700}
                  unoptimized
                  className="h-auto max-h-64 w-auto rounded-lg border border-white/10 object-contain"
                />
              ) : (
                <>
                  <ImagePlus className="mb-2 size-7 text-slate-500" />
                  <p className="text-[13px] text-slate-400">
                    ลากไฟล์มาวาง · คลิกเพื่อเลือก · หรือกด Ctrl+V วางภาพที่แคปไว้
                  </p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onPick(e.target.files?.[0] ?? undefined)}
              />
            </div>
          </Block>

          <Block title="1 · สรุปสั้น" color="#22d3ee">
            <div className="space-y-2">
              {summary.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s}
                    onChange={(e) =>
                      setSummary((v) => v.map((x, j) => (j === i ? e.target.value : x)))
                    }
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-[13.5px] text-slate-100 outline-none focus:border-[#22d3ee]/60"
                  />
                  <button
                    onClick={() => setSummary((v) => v.filter((_, j) => j !== i))}
                    className="rounded-lg border border-white/8 px-2 text-slate-500 hover:border-[#fb7185]/40 hover:text-[#fb7185]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <AddButton onClick={() => setSummary((v) => [...v, ""])}>เพิ่มบูลเล็ต</AddButton>
            </div>
          </Block>

          <Block title="2 · แปลความ" color="#a78bfa">
            <textarea
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              rows={5}
              className="w-full resize-y rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2.5 text-[13.5px] leading-relaxed text-slate-100 outline-none focus:border-[#a78bfa]/60"
            />
          </Block>

          <Block title="3 · Action วันนี้" color="#ffc53d">
            <div className="space-y-2">
              {actions.map((act, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input
                    value={act.label}
                    placeholder="หัวข้อ"
                    onChange={(e) =>
                      setActions((v) =>
                        v.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                      )
                    }
                    className="w-32 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-[13px] text-slate-300 outline-none focus:border-[#ffc53d]/60"
                  />
                  <input
                    value={act.value}
                    placeholder="ค่า"
                    onChange={(e) =>
                      setActions((v) =>
                        v.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)),
                      )
                    }
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-[13.5px] text-slate-100 outline-none focus:border-[#ffc53d]/60"
                  />
                  <div className="flex overflow-hidden rounded-lg border border-white/10">
                    {TONES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() =>
                          setActions((v) =>
                            v.map((x, j) => (j === i ? { ...x, tone: t.key } : x)),
                          )
                        }
                        className={`px-2.5 py-2 text-[11.5px] transition ${
                          (act.tone ?? "neutral") === t.key
                            ? `${toneOf(t.key).bg} ${toneOf(t.key).text}`
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setActions((v) => v.filter((_, j) => j !== i))}
                    className="rounded-lg border border-white/8 px-2 text-slate-500 hover:border-[#fb7185]/40 hover:text-[#fb7185]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <AddButton
                onClick={() =>
                  setActions((v) => [...v, { label: "", value: "", tone: "neutral" }])
                }
              >
                เพิ่มบรรทัด Action
              </AddButton>
            </div>
          </Block>

          <Block title="Insight ปิดท้าย" color="#34f5a0">
            <input
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2.5 text-[13.5px] text-slate-100 outline-none focus:border-[#34f5a0]/60"
            />
          </Block>
        </div>

        {/* ---------- live preview ---------- */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="mb-3 flex items-center gap-2 text-[12.5px] text-slate-400">
            <Sparkles className="size-4 text-[#22d3ee]" />
            พรีวิวสิ่งที่ลูกค้าจะเห็น (อัปเดตทันที)
          </div>
          <div className="panel overflow-hidden px-4 py-4">
            <div className="mb-3 flex items-center gap-3">
              <span
                className="grid size-10 place-items-center rounded-xl font-display text-lg font-bold"
                style={{ background: a.soft, color: a.hex }}
              >
                {section.index}
              </span>
              <div>
                <p className={`font-display text-[17px] font-bold ${a.text}`}>{section.title}</p>
                <p className="text-[11.5px] text-slate-500">{section.subtitle}</p>
              </div>
            </div>
            {image && (
              <Image
                src={image}
                alt="preview"
                width={1600}
                height={900}
                unoptimized
                className="mb-1 h-auto w-full rounded-xl border border-white/8"
              />
            )}
            <NarrativeGrid
              n={{
                summary: summary.filter(Boolean),
                interpretation,
                actions: actions.filter((x) => x.label || x.value),
                insight,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel px-5 py-4" style={{ borderColor: `${color}2e` }}>
      <p className="mb-3 font-display text-[14.5px] font-bold" style={{ color }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-1.5 text-[12px] text-slate-400 transition hover:border-white/30 hover:text-white"
    >
      <Plus className="size-3.5" />
      {children}
    </button>
  );
}
