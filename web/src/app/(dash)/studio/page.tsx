"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  Copy,
  Download,
  History,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import { getBrief } from "@/data";
import { ACCENT, toneOf } from "@/lib/accent";
import {
  clearDrafts,
  initialDrafts,
  loadDrafts,
  saveDrafts,
  type Draft,
  type DraftMap,
  type SaveState,
} from "@/lib/drafts";
import type { Bias } from "@/lib/types";
import { NarrativeGrid } from "@/components/ui/NarrativeGrid";
import { ImageBoard } from "@/components/ui/ImageBoard";
import { BoardEditor } from "@/components/studio/BoardEditor";
import { DataImporter } from "@/components/studio/DataImporter";
import { PriceOIPanel } from "@/components/charts/PriceOIPanel";
import { FlowPanel } from "@/components/charts/FlowPanel";

/** subscribe ที่ไม่เคยแจ้งเปลี่ยน — ใช้แค่ให้ useSyncExternalStore บอกว่าอยู่ฝั่ง client แล้ว */
const subscribeNever = () => () => {};

const TONES: { key: Bias; label: string }[] = [
  { key: "bull", label: "บวก" },
  { key: "neutral", label: "กลาง" },
  { key: "bear", label: "ลบ" },
];

export default function StudioPage() {
  const brief = getBrief();
  const [sectionId, setSectionId] = useState(brief.sections[3].id);
  const section = brief.sections.find((s) => s.id === sectionId)!;
  const a = ACCENT[section.accent];

  /**
   * รู้ว่าตอนนี้อยู่ฝั่ง browser แล้วหรือยัง โดยไม่ต้อง setState ใน effect
   * (บน server คืน false → HTML ที่ render ตรงกับตอน hydrate ไม่มี mismatch)
   */
  const isClient = useSyncExternalStore(subscribeNever, () => true, () => false);

  /** ร่างที่ค้างไว้ในเครื่องจากครั้งก่อน */
  const stored = useMemo(
    () => (isClient ? loadDrafts(brief) : { drafts: initialDrafts(brief), restored: false }),
    [isClient, brief],
  );

  /**
   * ร่างของทุก section เก็บรวมไว้ที่เดียว — สลับแท็บแล้วค่าไม่หาย
   * null = ยังไม่ได้แก้อะไรในรอบนี้ ใช้ค่าจาก stored ไปก่อน
   */
  const [edits, setEdits] = useState<DraftMap | null>(null);
  const drafts = edits ?? stored.drafts;

  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useState(false);

  const draft = drafts[sectionId];

  /** บันทึกทันทีที่แก้ ไม่ผ่าน effect — กันร่างหายเวลาปิดแท็บกะทันหัน */
  const commit = useCallback(
    (next: DraftMap) => {
      setEdits(next);
      setSaveState(saveDrafts(brief.date, next));
    },
    [brief.date],
  );

  const patch = useCallback(
    (p: Partial<Draft>) =>
      commit({ ...drafts, [sectionId]: { ...drafts[sectionId], ...p } }),
    [commit, drafts, sectionId],
  );

  const resetSection = () =>
    commit({ ...drafts, [sectionId]: initialDrafts(brief)[sectionId] });

  const resetAll = () => {
    clearDrafts(brief.date);
    setEdits(initialDrafts(brief));
    setSaveState("saved");
  };

  const restored = stored.restored;

  const payload = useMemo(
    () =>
      JSON.stringify(
        {
          date: brief.date,
          dateLabelTH: brief.dateLabelTH,
          sections: brief.sections.map((s) => ({
            id: s.id,
            index: s.index,
            title: s.title,
            ...drafts[s.id],
          })),
        },
        null,
        2,
      ),
    [brief, drafts],
  );

  function exportJson() {
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brief-${brief.date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 1800);
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
              วางภาพที่แคปมา → กรอก 3 ช่อง → ระบบจัดหน้าให้เป็น Infographic อัตโนมัติ
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
            <button
              onClick={exportJson}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ffc53d] to-[#fb923c] px-3.5 py-2.5 text-[13px] font-semibold text-ink-950 transition hover:brightness-110"
            >
              {exported ? <Check className="size-4" /> : <Download className="size-4" />}
              {exported ? "ดาวน์โหลดแล้ว" : "ส่งออก Brief (.json)"}
            </button>
          </div>
        </div>
      </div>

      {/* แถบสถานะร่าง */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] ${
            saveState === "saved"
              ? "border-[#34f5a0]/30 bg-[#34f5a0]/8 text-[#34f5a0]"
              : "border-[#ffc53d]/30 bg-[#ffc53d]/8 text-[#ffc53d]"
          }`}
        >
          {saveState === "saved" ? (
            <>
              <Save className="size-3.5" /> บันทึกร่างอัตโนมัติในเครื่องแล้ว
            </>
          ) : saveState === "too-big" ? (
            <>
              <TriangleAlert className="size-3.5" /> ภาพใหญ่เกินเก็บในเครื่อง — ข้อความถูกบันทึก
              แต่ภาพจะหายถ้ารีเฟรช
            </>
          ) : (
            <>
              <TriangleAlert className="size-3.5" /> บันทึกร่างไม่สำเร็จ
            </>
          )}
        </span>

        {restored && (
          <span className="flex items-center gap-1.5 rounded-lg border border-[#22d3ee]/30 bg-[#22d3ee]/8 px-3 py-1.5 text-[12px] text-[#22d3ee]">
            <History className="size-3.5" /> กู้ร่างที่ค้างไว้จากครั้งก่อนแล้ว
          </span>
        )}

        <span className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-[12px] text-slate-400 lg:flex">
          เผยแพร่: กด &ldquo;ส่งออก Brief&rdquo; → วางทับ{" "}
          <code className="rounded bg-white/8 px-1 text-[11px] text-slate-200">
            src/data/published.json
          </code>{" "}
          → git push
        </span>

        <button
          onClick={resetSection}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] text-slate-400 transition hover:border-white/25 hover:text-white"
        >
          <RotateCcw className="size-3.5" /> คืนค่า section นี้
        </button>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] text-slate-500 transition hover:border-[#fb7185]/40 hover:text-[#fb7185]"
        >
          <Trash2 className="size-3.5" /> ล้างร่างทั้งหมด
        </button>
      </div>

      {/* section picker */}
      <div className="scroll-slim flex gap-2 overflow-x-auto pb-1">
        {brief.sections.map((s) => {
          const sa = ACCENT[s.accent];
          const on = s.id === sectionId;
          return (
            <button
              key={s.id}
              onClick={() => setSectionId(s.id)}
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
          {(section.contracts || section.flows) && (
            <Block
              title={
                section.contracts
                  ? "นำเข้าข้อมูลย้อนหลัง (ราคาปิด + Open Interest)"
                  : "นำเข้าข้อมูลย้อนหลัง (กองทุน / ต่างชาติ)"
              }
              color="#22d3ee"
            >
              <DataImporter
                kind={section.contracts ? "contracts" : "flows"}
                onApply={(data) => patch(data)}
              />
            </Block>
          )}

          <Block title="ภาพ + จุดอธิบาย (แคปมาวางได้เลย)" color={a.hex}>
            <BoardEditor board={draft.board} onChange={(board) => patch({ board })} />
          </Block>

          <Block title="1 · สรุปสั้น" color="#22d3ee">
            <div className="space-y-2">
              {draft.summary.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s}
                    onChange={(e) =>
                      patch({
                        summary: draft.summary.map((x, j) => (j === i ? e.target.value : x)),
                      })
                    }
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-[13.5px] text-slate-100 outline-none focus:border-[#22d3ee]/60"
                  />
                  <button
                    onClick={() => patch({ summary: draft.summary.filter((_, j) => j !== i) })}
                    className="rounded-lg border border-white/8 px-2 text-slate-500 hover:border-[#fb7185]/40 hover:text-[#fb7185]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <AddButton onClick={() => patch({ summary: [...draft.summary, ""] })}>
                เพิ่มบูลเล็ต
              </AddButton>
            </div>
          </Block>

          <Block title="2 · แปลความ" color="#a78bfa">
            <textarea
              value={draft.interpretation}
              onChange={(e) => patch({ interpretation: e.target.value })}
              rows={5}
              className="w-full resize-y rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2.5 text-[13.5px] leading-relaxed text-slate-100 outline-none focus:border-[#a78bfa]/60"
            />
          </Block>

          <Block title="3 · Action วันนี้" color="#ffc53d">
            <div className="space-y-2">
              {draft.actions.map((act, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input
                    value={act.label}
                    placeholder="หัวข้อ"
                    onChange={(e) =>
                      patch({
                        actions: draft.actions.map((x, j) =>
                          j === i ? { ...x, label: e.target.value } : x,
                        ),
                      })
                    }
                    className="w-32 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-[13px] text-slate-300 outline-none focus:border-[#ffc53d]/60"
                  />
                  <input
                    value={act.value}
                    placeholder="ค่า"
                    onChange={(e) =>
                      patch({
                        actions: draft.actions.map((x, j) =>
                          j === i ? { ...x, value: e.target.value } : x,
                        ),
                      })
                    }
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-[13.5px] text-slate-100 outline-none focus:border-[#ffc53d]/60"
                  />
                  <div className="flex overflow-hidden rounded-lg border border-white/10">
                    {TONES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() =>
                          patch({
                            actions: draft.actions.map((x, j) =>
                              j === i ? { ...x, tone: t.key } : x,
                            ),
                          })
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
                    onClick={() => patch({ actions: draft.actions.filter((_, j) => j !== i) })}
                    className="rounded-lg border border-white/8 px-2 text-slate-500 hover:border-[#fb7185]/40 hover:text-[#fb7185]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <AddButton
                onClick={() =>
                  patch({ actions: [...draft.actions, { label: "", value: "", tone: "neutral" }] })
                }
              >
                เพิ่มบรรทัด Action
              </AddButton>
            </div>
          </Block>

          <Block title="Insight ปิดท้าย" color="#34f5a0">
            <input
              value={draft.insight}
              onChange={(e) => patch({ insight: e.target.value })}
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
            {!!draft.contracts?.length && (
              <div className="mb-3 grid gap-3">
                {draft.contracts.map((c) => (
                  <PriceOIPanel key={c.symbol} series={c} />
                ))}
              </div>
            )}

            {!!draft.flows?.length && (
              <div className="mb-3">
                <FlowPanel rows={draft.flows} />
              </div>
            )}

            {draft.board.images.some((im) => im.src) && (
              <ImageBoard
                board={{
                  ...draft.board,
                  images: draft.board.images.filter((im) => im.src),
                }}
                accent={section.accent}
              />
            )}
            <NarrativeGrid
              n={{
                summary: draft.summary.filter(Boolean),
                interpretation: draft.interpretation,
                actions: draft.actions.filter((x) => x.label || x.value),
                insight: draft.insight,
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
