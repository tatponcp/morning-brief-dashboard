"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Compass,
  Download,
  Eye,
  History,
  ImageDown,
  Redo2,
  Rocket,
  RotateCcw,
  Save,
  TriangleAlert,
  Undo2,
  Wand2,
} from "lucide-react";
import { ACCENT } from "@/lib/accent";
import {
  clearDrafts,
  initialDrafts,
  loadDrafts,
  saveDrafts,
  type Draft,
  type DraftMap,
  type SaveState,
} from "@/lib/drafts";
import { draftStatus, fieldLabel } from "@/lib/draft-status";
import { thaiDate, todayBangkok } from "@/lib/format";
import type { Brief, Instrument, Section } from "@/lib/types";
import { NarrativeGrid } from "@/components/ui/NarrativeGrid";
import { ImageBoard } from "@/components/ui/ImageBoard";
import { PriceOIPanel } from "@/components/charts/PriceOIPanel";
import { FlowPanel } from "@/components/charts/FlowPanel";
import { SpreadPanel } from "@/components/charts/SpreadPanel";
import { BoardEditor } from "./BoardEditor";
import { DataImporter } from "./DataImporter";
import { DailySheetImporter } from "./DailySheetImporter";
import type { DailySheet } from "@/lib/csv";
import { NarrativeEditor } from "./NarrativeEditor";
import { SectionRail } from "./SectionRail";
import { ScenarioPicker } from "./ScenarioPicker";
import { ShareImageDialog } from "./ShareImageDialog";

/** subscribe ที่ไม่เคยแจ้งเปลี่ยน — ใช้แค่ให้รู้ว่าอยู่ฝั่ง client แล้ว */
const subscribeNever = () => () => {};

/** ร่างเก็บคีย์เดียว ไม่ผูกกับวันที่ของ brief ในโค้ด (เปลี่ยนวันแล้วร่างไม่หาย) */
const STUDIO_DRAFT = "studio";

type Step = "media" | "scenario" | "text";

/** ขั้นของแต่ละ section: (ใส่ภาพ/วางชีต) → เลือกสถานการณ์ → ตรวจและแก้คำ */
function stepsFor(s: Section, d: Draft) {
  const list: { key: Step; label: string; done: boolean }[] = [];
  if (s.mode === "image") list.push({ key: "media", label: "ใส่ภาพ", done: d.board.images.some((im) => im.src) });
  else if (s.contracts || s.flows)
    list.push({ key: "media", label: "วางชีต", done: !!(d.contracts?.length || d.flows?.length) });
  list.push({ key: "scenario", label: "เลือกสถานการณ์", done: !!d.scenario });
  list.push({ key: "text", label: "ตรวจและแก้คำ", done: draftStatus(s, d).complete });
  return list;
}

const firstOpen = (s: Section, d: Draft): Step => stepsFor(s, d).find((x) => !x.done)?.key ?? "scenario";

export function StudioEditor({
  brief,
  canPublish,
  instruments,
}: {
  brief: Brief;
  /** true = ต่อ Supabase แล้ว กดเผยแพร่ขึ้นเว็บได้เลย */
  canPublish: boolean;
  /** ราคา Gold / VIX / DXY / US10Y สำหรับใส่ในรูปข้อ 6 */
  instruments?: Instrument[];
}) {
  const [sectionId, setSectionId] = useState(brief.sections[0].id);
  const section = brief.sections.find((s) => s.id === sectionId)!;
  const a = ACCENT[section.accent];

  const isClient = useSyncExternalStore(subscribeNever, () => true, () => false);
  const stored = useMemo(
    () => (isClient ? loadDrafts(brief, STUDIO_DRAFT) : { drafts: initialDrafts(brief), restored: false }),
    [isClient, brief],
  );

  const [edits, setEdits] = useState<DraftMap | null>(null);
  const drafts = edits ?? stored.drafts;
  const draft = drafts[sectionId];

  const [past, setPast] = useState<DraftMap[]>([]);
  const [future, setFuture] = useState<DraftMap[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  // วันที่ของ brief ที่จะเผยแพร่ ตั้งต้นเป็นวันนี้ (เวลาไทย) ไม่ใช่วันของ brief เดิม
  const [date, setDate] = useState(() => todayBangkok());
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [exported, setExported] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  /* ---------- แก้ไข + ประวัติ undo ---------- */

  const commit = useCallback(
    (next: DraftMap) => {
      setPast((p) => [...p.slice(-29), drafts]);
      setFuture([]);
      setEdits(next);
      setSaveState(saveDrafts(STUDIO_DRAFT, next));
    },
    [drafts],
  );

  const patch = useCallback(
    (p: Partial<Draft>) => commit({ ...drafts, [sectionId]: { ...drafts[sectionId], ...p } }),
    [commit, drafts, sectionId],
  );

  /** ชีตประจำวันแผ่นเดียว → ข้อ 1 และข้อ 2 ใน commit เดียว (ย้อนกลับได้ในครั้งเดียว) */
  const applyDailySheet = useCallback(
    (sheet: DailySheet, withSummary: boolean) => {
      const next = { ...drafts };
      const s50 = next["s50-oi"];
      const flow = next["flows"];
      if (s50) {
        next["s50-oi"] = {
          ...s50,
          contracts: sheet.contracts,
          spread: sheet.spread ?? undefined,
          asOfLabel: sheet.s50.asOfLabel,
          ...(withSummary && sheet.s50.summary.length ? { summary: sheet.s50.summary } : {}),
        };
      }
      if (flow) {
        next["flows"] = {
          ...flow,
          flows: sheet.flows,
          asOfLabel: sheet.flow.asOfLabel,
          ...(withSummary && sheet.flow.summary.length ? { summary: sheet.flow.summary } : {}),
        };
      }
      commit(next);
    },
    [commit, drafts],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [drafts, ...f.slice(0, 29)]);
      setEdits(prev);
      saveDrafts(STUDIO_DRAFT, prev);
      return p.slice(0, -1);
    });
  }, [drafts]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setPast((p) => [...p, drafts]);
      setEdits(next);
      saveDrafts(STUDIO_DRAFT, next);
      return f.slice(1);
    });
  }, [drafts]);

  /* ---------- ขั้นของ section นี้ ---------- */

  const steps = useMemo(() => stepsFor(section, draft), [section, draft]);
  const [stepPref, setStepPref] = useState<Step>(() =>
    firstOpen(brief.sections[0], initialDrafts(brief)[brief.sections[0].id]),
  );
  const step = steps.some((x) => x.key === stepPref) ? stepPref : steps[0].key;

  const selectSection = useCallback(
    (id: string) => {
      const s = brief.sections.find((x) => x.id === id);
      if (!s) return;
      setSectionId(id);
      setStepPref(firstOpen(s, drafts[id]));
    },
    [brief.sections, drafts],
  );

  /* ---------- คีย์ลัด ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      // Alt + 1-6 สลับ section โดยไม่ต้องละมือจากคีย์บอร์ด
      if (e.altKey && /^[1-6]$/.test(e.key)) {
        e.preventDefault();
        const s = brief.sections[Number(e.key) - 1];
        if (s) selectSection(s.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, brief.sections, selectSection]);


  /* ---------- ความคืบหน้ารวม ---------- */

  const progress = useMemo(() => {
    const all = brief.sections.map((s) => draftStatus(s, drafts[s.id]));
    return {
      done: all.filter((x) => x.complete).length,
      total: all.length,
      current: draftStatus(section, draft),
    };
  }, [brief.sections, drafts, section, draft]);

  const payload = useMemo(
    () =>
      JSON.stringify(
        {
          date,
          dateLabelTH: thaiDate(date),
          sections: brief.sections.map((s) => {
            // วันที่กำกับข้อมูลใช้เฉพาะข้อ 2 (ยอด SET ประกาศช้ากว่า 1 วัน) ที่เหลือใช้วันที่ของ brief
            const { asOfLabel, contracts, flows, spread, ...rest } = drafts[s.id];
            return {
              id: s.id,
              index: s.index,
              title: s.title,
              ...rest,
              ...(s.flows ? { flows, asOfLabel } : {}),
              ...(s.contracts ? { contracts, spread } : {}),
            };
          }),
        },
        null,
        2,
      ),
    [brief.sections, drafts, date],
  );

  async function publish() {
    setPublishing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
      });
      const json = (await res.json()) as
        | { ok: true; date: string; imagesUploaded: number }
        | { ok: false; reason: string };
      setMsg(
        json.ok
          ? {
              ok: true,
              text: `เผยแพร่ ${thaiDate(json.date)} ขึ้นเว็บแล้ว${
                json.imagesUploaded ? ` · อัปโหลดภาพ ${json.imagesUploaded} รูป` : ""
              }`,
            }
          : { ok: false, text: json.reason },
      );
    } catch {
      setMsg({ ok: false, text: "ติดต่อเซิร์ฟเวอร์ไม่ได้" });
    } finally {
      setPublishing(false);
    }
  }

  function exportJson() {
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brief-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 1800);
  }

  return (
    <div className="pb-16">
      {/* ---------- header ---------- */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel relative mb-3 flex flex-wrap items-center gap-3 overflow-hidden px-4 py-3"
      >
        <div className="pointer-events-none absolute -top-20 -left-10 size-56 rounded-full bg-amber-neon/10 blur-3xl" />
        <span className="relative grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-neon/25 to-rose-neon/20 text-amber-neon">
          <Wand2 className="size-5" />
        </span>
        <div className="relative">
          <h1 className="font-display text-[18px] leading-tight font-bold text-white">IC Studio</h1>
          <p className="text-[11.5px] text-slate-400">เลือกสถานการณ์ แก้คำ แล้วเผยแพร่</p>
        </div>

        <label className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-ink-950/60 px-3 py-1.5 transition focus-within:border-amber-neon/50">
          <span className="text-[11.5px] text-slate-500">วันที่</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-[12.5px] text-white outline-none"
          />
          <span className="text-[12px] font-semibold text-amber-neon">{thaiDate(date)}</span>
        </label>

        <div className="relative ml-auto flex items-center gap-3">
          <ProgressRing done={progress.done} total={progress.total} />
          <button
            onClick={() => setShowPreview((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] transition xl:hidden ${
              showPreview
                ? "border-cyan-neon/40 bg-cyan-neon/10 text-cyan-neon"
                : "border-white/10 text-slate-400"
            }`}
          >
            <Eye className="size-3.5" />
            พรีวิว
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
      {msg && (
        <motion.div
          key={msg.text}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          className={`mb-3 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] ${
            msg.ok
              ? "border-green-neon/30 bg-green-neon/8 text-green-neon"
              : "border-rose-neon/30 bg-rose-neon/8 text-rose-neon"
          }`}
        >
          {msg.ok ? <Check className="size-4" /> : <TriangleAlert className="size-4" />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto text-[11.5px] opacity-70 hover:opacity-100">
            ปิด
          </button>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ---------- 3 คอลัมน์: rail / editor / preview ---------- */}
      <div className="grid gap-3 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <SectionRail
            sections={brief.sections}
            drafts={drafts}
            activeId={sectionId}
            onSelect={selectSection}
          />
          <p className="mt-2 hidden text-[11px] leading-relaxed text-slate-600 lg:block">
            คีย์ลัด · Alt+1-6 สลับ section · Ctrl+Z ย้อนกลับ
          </p>
        </div>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={sectionId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* หัว section */}
              <div
                className="panel relative mb-3 overflow-hidden px-4 py-3"
                style={{ borderColor: `color-mix(in srgb, ${a.hex} 30%, transparent)` }}
              >
                <div
                  className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full blur-3xl"
                  style={{ background: a.soft }}
                />
                <div className="relative flex flex-wrap items-center gap-2.5">
                  <span
                    className="grid size-8 place-items-center rounded-xl font-display text-[13px] font-bold"
                    style={{ background: a.hex, color: "var(--ink-950)" }}
                  >
                    {section.index}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-[16px] leading-tight font-bold" style={{ color: a.hex }}>
                      {section.title}
                    </p>
                    <p className="truncate text-[11.5px] text-slate-400">{section.subtitle}</p>
                  </div>
                  <span className="ml-auto">
                    {progress.current.missing.length > 0 ? (
                      <span className="flex items-center gap-1.5 rounded-lg bg-amber-neon/10 px-2 py-1 text-[11px] text-amber-neon">
                        <TriangleAlert className="size-3" />
                        ยังขาด: {progress.current.missing.map(fieldLabel).join(", ")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-lg bg-green-neon/10 px-2 py-1 text-[11px] text-green-neon">
                        <Check className="size-3" />
                        พร้อมเผยแพร่
                      </span>
                    )}
                  </span>
                </div>

                <Stepper steps={steps} current={step} onSelect={setStepPref} accent={a.hex} />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {step === "media" && (
                    <div className="space-y-3">
                      {section.mode === "image" ? (
                        <BoardEditor board={draft.board} onChange={(board) => patch({ board })} />
                      ) : (
                        <>
                          <DailySheetImporter onApply={applyDailySheet} />
                          <details className="rounded-xl border border-white/10 px-3 py-2">
                            <summary className="cursor-pointer text-[12px] text-slate-400">
                              จับคู่คอลัมน์เองเฉพาะ section นี้ (ใช้เมื่อระบบอ่านชีตไม่ถูก)
                            </summary>
                            <div className="pt-3">
                              <DataImporter
                                kind={section.contracts ? "contracts" : "flows"}
                                onApply={(data) => patch(data)}
                              />
                            </div>
                          </details>
                        </>
                      )}
                      <NextButton onClick={() => setStepPref("scenario")} label="ไปเลือกสถานการณ์" />
                    </div>
                  )}

                  {step === "scenario" && (
                    <ScenarioPicker
                      sectionId={section.id}
                      value={draft}
                      data={{ contracts: draft.contracts, flows: draft.flows, instruments }}
                      onApply={patch}
                      onNext={() => setStepPref("text")}
                    />
                  )}

                  {step === "text" && (
                    <div className="space-y-3">
                      {draft.scenario && (
                        <button
                          onClick={() => setStepPref("scenario")}
                          className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-left text-[12.5px] text-slate-300 transition hover:border-white/20"
                        >
                          <Compass className="size-4 text-violet-neon" />
                          สถานการณ์: <span className="font-semibold text-white">{draft.scenario.title}</span>
                          <span className="ml-auto text-[11.5px] text-slate-500">เปลี่ยน</span>
                        </button>
                      )}
                      <NarrativeEditor
                        value={{
                          summary: draft.summary,
                          interpretation: draft.interpretation,
                          actions: draft.actions,
                          insight: draft.insight,
                        }}
                        onChange={patch}
                      />
                      {(() => {
                        const i = brief.sections.findIndex((x) => x.id === sectionId);
                        const next = brief.sections[i + 1];
                        return next ? (
                          <NextButton onClick={() => selectSection(next.id)} label={`ไปข้อ ${next.index} ${next.title}`} />
                        ) : null;
                      })()}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* พรีวิว */}
        <div className={`${showPreview ? "" : "hidden"} xl:sticky xl:top-20 xl:block xl:self-start`}>
          <p className="mb-2 flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <Eye className="size-3.5" />
            สิ่งที่ลูกค้าจะเห็น
          </p>
          <div className="panel scroll-slim max-h-[calc(100dvh-9rem)] overflow-y-auto px-3 py-3">
            {!!draft.contracts?.length && (
              <div className="mb-3 space-y-3">
                {draft.contracts.map((c) => (
                  <PriceOIPanel key={c.symbol} series={c} />
                ))}
                {draft.spread && <SpreadPanel spread={draft.spread} />}
              </div>
            )}
            {!!draft.flows?.length && (
              <div className="mb-3">
                <FlowPanel rows={draft.flows} />
              </div>
            )}
            {draft.board.images.some((im) => im.src) && (
              <div className="mb-3">
                <ImageBoard
                  board={{ ...draft.board, images: draft.board.images.filter((im) => im.src) }}
                  accent={section.accent}
                />
              </div>
            )}
            <NarrativeGrid
              n={{
                summary: draft.summary.filter(Boolean),
                interpretation: draft.interpretation,
                actions: draft.actions.filter((x) => x.label || x.value),
                insight: draft.insight,
              }}
              layout="stack"
            />
          </div>
        </div>
      </div>

      {/* ---------- แถบล่างติดหน้าจอ ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-3 py-2 md:px-6">
          <span
            className={`flex items-center gap-1.5 text-[11.5px] ${
              saveState === "saved" ? "text-slate-500" : "text-amber-neon"
            }`}
          >
            {saveState === "saved" ? (
              <>
                <Save className="size-3.5" /> บันทึกร่างอัตโนมัติ
              </>
            ) : saveState === "too-big" ? (
              <>
                <TriangleAlert className="size-3.5" /> ภาพใหญ่เกินเก็บในเครื่อง — ข้อความถูกบันทึก
              </>
            ) : (
              <>
                <TriangleAlert className="size-3.5" /> บันทึกร่างไม่สำเร็จ
              </>
            )}
          </span>

          {stored.restored && !edits && (
            <span className="flex items-center gap-1.5 text-[11.5px] text-cyan-neon">
              <History className="size-3.5" /> กู้ร่างเดิมแล้ว
            </span>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <button
              onClick={undo}
              disabled={!past.length}
              title="ย้อนกลับ (Ctrl+Z)"
              aria-label="ย้อนกลับ"
              className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white disabled:opacity-30"
            >
              <Undo2 className="size-4" />
            </button>
            <button
              onClick={redo}
              disabled={!future.length}
              title="ทำซ้ำ (Ctrl+Shift+Z)"
              aria-label="ทำซ้ำ"
              className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white disabled:opacity-30"
            >
              <Redo2 className="size-4" />
            </button>
            <button
              onClick={() => commit({ ...drafts, [sectionId]: initialDrafts(brief)[sectionId] })}
              title="คืนค่า section นี้"
              aria-label="คืนค่า section นี้"
              className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white"
            >
              <RotateCcw className="size-4" />
            </button>

            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-neon/40 bg-cyan-neon/10 px-3 py-2 text-[12.5px] text-cyan-neon transition hover:bg-cyan-neon/20"
            >
              <ImageDown className="size-4" />
              <span className="hidden sm:inline">รูปส่งลูกค้า</span>
            </button>

            <button
              onClick={exportJson}
              title="ส่งออก .json (สำรอง)"
              aria-label="ส่งออก .json"
              className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white"
            >
              {exported ? <Check className="size-4 text-green-neon" /> : <Download className="size-4" />}
            </button>

            {canPublish ? (
              <motion.button
                onClick={publish}
                disabled={publishing}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-green-neon to-cyan-neon px-4 py-2 text-[13px] font-semibold text-ink-950 shadow-[0_0_24px_-6px_var(--c-green)] transition hover:brightness-110 disabled:opacity-60"
              >
                <motion.span
                  animate={publishing ? { y: [0, -3, 0] } : { y: 0 }}
                  transition={publishing ? { repeat: Infinity, duration: 0.6 } : undefined}
                >
                  <Rocket className="size-4" />
                </motion.span>
                {publishing ? "กำลังเผยแพร่…" : `เผยแพร่ขึ้นเว็บ · ${progress.done}/${progress.total}`}
              </motion.button>
            ) : (
              <span className="hidden text-[11px] text-slate-600 lg:block">
                เผยแพร่: วางไฟล์ทับ src/data/published.json แล้ว push
              </span>
            )}
          </div>
        </div>
      </div>

      <ShareImageDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        section={section}
        draft={draft}
        dateLabel={thaiDate(date)}
        dateISO={date}
        instruments={section.id === "macro" ? instruments : undefined}
      />
    </div>
  );
}

function Stepper({
  steps,
  current,
  onSelect,
  accent,
}: {
  steps: { key: Step; label: string; done: boolean }[];
  current: Step;
  onSelect: (s: Step) => void;
  accent: string;
}) {
  return (
    <div className="relative mt-3 flex items-center gap-1 rounded-xl border border-white/8 bg-ink-950/40 p-1">
      {steps.map((st, i) => {
        const on = st.key === current;
        return (
          <button
            key={st.key}
            onClick={() => onSelect(st.key)}
            className="relative flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-[12.5px] transition-colors"
          >
            {on && (
              <motion.span
                layoutId="studio-step"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
                className="absolute inset-0 rounded-lg"
                style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 45%, transparent)` }}
              />
            )}
            <span
              className="relative grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors"
              style={
                st.done
                  ? { background: "var(--c-green)", color: "var(--ink-950)" }
                  : on
                    ? { background: accent, color: "var(--ink-950)" }
                    : { background: "var(--c-hover)", color: "var(--c-neutral)" }
              }
            >
              {st.done ? <Check className="size-3" /> : i + 1}
            </span>
            <span className={`relative truncate ${on ? "font-semibold text-white" : "text-slate-400"}`}>{st.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function NextButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="flex justify-end pt-1">
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-[13px] text-slate-100 transition-colors hover:border-white/25"
      >
        {label} <ArrowRight className="size-4" />
      </motion.button>
    </div>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const ratio = total ? done / total : 0;
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--c-hover)" strokeWidth="3.5" />
        <motion.circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={ratio === 1 ? "var(--c-green)" : "var(--c-cyan)"}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - ratio) }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>
      <div className="leading-tight">
        <p className="font-display text-[14px] font-bold text-white">
          {done}/{total}
        </p>
        <p className="text-[11px] text-slate-400">section พร้อม</p>
      </div>
    </div>
  );
}

/** เผื่ออยากล้างร่างทั้งหมดจากที่อื่น */
export function resetAllDrafts(date: string) {
  clearDrafts(date);
}
