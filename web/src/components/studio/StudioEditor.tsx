"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  Download,
  Eye,
  History,
  ImageIcon,
  Redo2,
  Rocket,
  RotateCcw,
  Save,
  Table2,
  TriangleAlert,
  Type,
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
import { thaiDate } from "@/lib/format";
import type { Brief } from "@/lib/types";
import { NarrativeGrid } from "@/components/ui/NarrativeGrid";
import { ImageBoard } from "@/components/ui/ImageBoard";
import { PriceOIPanel } from "@/components/charts/PriceOIPanel";
import { FlowPanel } from "@/components/charts/FlowPanel";
import { BoardEditor } from "./BoardEditor";
import { DataImporter } from "./DataImporter";
import { NarrativeEditor } from "./NarrativeEditor";
import { SectionRail } from "./SectionRail";

/** subscribe ที่ไม่เคยแจ้งเปลี่ยน — ใช้แค่ให้รู้ว่าอยู่ฝั่ง client แล้ว */
const subscribeNever = () => () => {};

type Tab = "visual" | "data" | "text";

export function StudioEditor({
  brief,
  canPublish,
}: {
  brief: Brief;
  /** true = ต่อ Supabase แล้ว กดเผยแพร่ขึ้นเว็บได้เลย */
  canPublish: boolean;
}) {
  const [sectionId, setSectionId] = useState(brief.sections[0].id);
  const section = brief.sections.find((s) => s.id === sectionId)!;
  const a = ACCENT[section.accent];

  const isClient = useSyncExternalStore(subscribeNever, () => true, () => false);
  const stored = useMemo(
    () => (isClient ? loadDrafts(brief) : { drafts: initialDrafts(brief), restored: false }),
    [isClient, brief],
  );

  const [edits, setEdits] = useState<DraftMap | null>(null);
  const drafts = edits ?? stored.drafts;
  const draft = drafts[sectionId];

  const [past, setPast] = useState<DraftMap[]>([]);
  const [future, setFuture] = useState<DraftMap[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [date, setDate] = useState(brief.date);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [exported, setExported] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  /* ---------- แก้ไข + ประวัติ undo ---------- */

  const commit = useCallback(
    (next: DraftMap) => {
      setPast((p) => [...p.slice(-29), drafts]);
      setFuture([]);
      setEdits(next);
      setSaveState(saveDrafts(brief.date, next));
    },
    [drafts, brief.date],
  );

  const patch = useCallback(
    (p: Partial<Draft>) => commit({ ...drafts, [sectionId]: { ...drafts[sectionId], ...p } }),
    [commit, drafts, sectionId],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [drafts, ...f.slice(0, 29)]);
      setEdits(prev);
      saveDrafts(brief.date, prev);
      return p.slice(0, -1);
    });
  }, [drafts, brief.date]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setPast((p) => [...p, drafts]);
      setEdits(next);
      saveDrafts(brief.date, next);
      return f.slice(1);
    });
  }, [drafts, brief.date]);

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
        if (s) setSectionId(s.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, brief.sections]);

  /* ---------- แท็บของ section นี้ ---------- */

  const tabs = useMemo(() => {
    const list: { key: Tab; label: string; icon: React.ReactNode }[] = [];
    if (section.mode === "image")
      list.push({ key: "visual", label: "ภาพ + จุดอธิบาย", icon: <ImageIcon className="size-3.5" /> });
    if (section.contracts || section.flows)
      list.push({ key: "data", label: "นำเข้าข้อมูล", icon: <Table2 className="size-3.5" /> });
    list.push({ key: "text", label: "ข้อความ", icon: <Type className="size-3.5" /> });
    return list;
  }, [section]);

  // จำแท็บที่เลือกไว้ ถ้า section ใหม่ไม่มีแท็บนั้นค่อยถอยไปแท็บแรก
  const [tabPref, setTabPref] = useState<Tab>("text");
  const tab = tabs.some((t) => t.key === tabPref) ? tabPref : tabs[0].key;
  const setTab = setTabPref;

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
      <div className="panel mb-3 flex flex-wrap items-center gap-3 px-4 py-2.5">
        <span className="grid size-8 place-items-center rounded-xl bg-[#ffc53d]/15 text-[#ffc53d]">
          <Wand2 className="size-4" />
        </span>
        <h1 className="font-display text-[17px] font-bold text-white">IC Studio</h1>

        <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-1.5">
          <span className="text-[11.5px] text-slate-500">วันที่</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-[12.5px] text-white outline-none"
          />
          <span className="text-[11.5px] font-semibold text-[#ffc53d]">{thaiDate(date)}</span>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#22d3ee] to-[#34f5a0] transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <span className="text-[11.5px] text-slate-400">
              กรอกครบ {progress.done}/{progress.total}
            </span>
          </div>

          <button
            onClick={() => setShowPreview((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] transition xl:hidden ${
              showPreview
                ? "border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]"
                : "border-white/10 text-slate-400"
            }`}
          >
            <Eye className="size-3.5" />
            พรีวิว
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-3 rounded-xl border px-4 py-2.5 text-[13px] ${
            msg.ok
              ? "border-[#34f5a0]/30 bg-[#34f5a0]/8 text-[#34f5a0]"
              : "border-[#fb7185]/30 bg-[#fb7185]/8 text-[#fb7185]"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* ---------- 3 คอลัมน์: rail / editor / preview ---------- */}
      <div className="grid gap-3 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <SectionRail
            sections={brief.sections}
            drafts={drafts}
            activeId={sectionId}
            onSelect={setSectionId}
          />
          <p className="mt-2 hidden text-[10.5px] leading-relaxed text-slate-600 lg:block">
            คีย์ลัด · Alt+1-6 สลับ section · Ctrl+Z ย้อนกลับ
          </p>
        </div>

        <div className="min-w-0">
          {/* หัว section + สิ่งที่ยังขาด */}
          <div className="panel mb-3 flex flex-wrap items-center gap-2 px-3 py-2">
            <span
              className="grid size-6 place-items-center rounded-md font-display text-[11px] font-bold"
              style={{ background: a.soft, color: a.hex }}
            >
              {section.index}
            </span>
            <p className="font-display text-[14px] font-bold" style={{ color: a.hex }}>
              {section.title}
            </p>
            {progress.current.missing.length > 0 ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-[#ffc53d]/10 px-2 py-1 text-[11px] text-[#ffc53d]">
                <TriangleAlert className="size-3" />
                ยังขาด: {progress.current.missing.map(fieldLabel).join(", ")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-lg bg-[#34f5a0]/10 px-2 py-1 text-[11px] text-[#34f5a0]">
                <Check className="size-3" />
                กรอกครบแล้ว
              </span>
            )}
          </div>

          {/* แท็บ */}
          {tabs.length > 1 && (
            <div className="mb-3 flex gap-1 rounded-xl border border-white/8 bg-white/3 p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] transition ${
                    tab === t.key ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {tab === "visual" && (
            <BoardEditor board={draft.board} onChange={(board) => patch({ board })} />
          )}

          {tab === "data" && (
            <DataImporter
              kind={section.contracts ? "contracts" : "flows"}
              onApply={(data) => patch(data)}
            />
          )}

          {tab === "text" && (
            <NarrativeEditor
              value={{
                summary: draft.summary,
                interpretation: draft.interpretation,
                actions: draft.actions,
                insight: draft.insight,
              }}
              onChange={patch}
            />
          )}
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
              saveState === "saved" ? "text-slate-500" : "text-[#ffc53d]"
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
            <span className="flex items-center gap-1.5 text-[11.5px] text-[#22d3ee]">
              <History className="size-3.5" /> กู้ร่างเดิมแล้ว
            </span>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <button
              onClick={undo}
              disabled={!past.length}
              title="ย้อนกลับ (Ctrl+Z)"
              className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white disabled:opacity-30"
            >
              <Undo2 className="size-4" />
            </button>
            <button
              onClick={redo}
              disabled={!future.length}
              title="ทำซ้ำ (Ctrl+Shift+Z)"
              className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white disabled:opacity-30"
            >
              <Redo2 className="size-4" />
            </button>
            <button
              onClick={() => commit({ ...drafts, [sectionId]: initialDrafts(brief)[sectionId] })}
              title="คืนค่า section นี้"
              className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white"
            >
              <RotateCcw className="size-4" />
            </button>

            <button
              onClick={exportJson}
              className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-[12.5px] text-slate-200 transition hover:border-white/25"
            >
              {exported ? <Check className="size-4 text-[#34f5a0]" /> : <Download className="size-4" />}
              ส่งออก .json
            </button>

            {canPublish ? (
              <button
                onClick={publish}
                disabled={publishing}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#34f5a0] to-[#22d3ee] px-3.5 py-2 text-[12.5px] font-semibold text-ink-950 transition hover:brightness-110 disabled:opacity-60"
              >
                <Rocket className="size-4" />
                {publishing ? "กำลังเผยแพร่…" : "เผยแพร่ขึ้นเว็บ"}
              </button>
            ) : (
              <span className="hidden text-[11px] text-slate-600 lg:block">
                เผยแพร่: วางไฟล์ทับ src/data/published.json แล้ว push
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** เผื่ออยากล้างร่างทั้งหมดจากที่อื่น */
export function resetAllDrafts(date: string) {
  clearDrafts(date);
}
