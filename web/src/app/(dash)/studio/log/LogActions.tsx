"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";
import type { EvalRow } from "@/lib/signal-eval";

/** ปุ่มดาวน์โหลด CSV (เอาไปวิเคราะห์ต่อใน Sheets) และจดราคาปิดวันนี้เอง */
export function LogActions({ rows, sections }: { rows: EvalRow[]; sections: { id: string; title: string }[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function downloadCsv() {
    const head = ["date", "rules", "overall", "overall_ex_macro", ...sections.map((s) => `score_${s.id}`), ...sections.map((s) => `bias_${s.id}`), "close", "prev_close", "ret_pct", "hit", "price_source"];
    const cell = (v: unknown) => (v === null || v === undefined ? "" : `"${String(v).replaceAll('"', '""')}"`);
    const lines = rows.map((r) =>
      [
        r.date,
        r.rules,
        r.overall,
        r.overallExMacro,
        ...sections.map((s) => r.scores[s.id]),
        ...sections.map((s) => r.biases[s.id]),
        r.close,
        r.prevClose,
        r.ret === null ? null : r.ret.toFixed(4),
        r.hit === null ? null : r.hit ? 1 : 0,
        r.source,
      ]
        .map(cell)
        .join(","),
    );
    // BOM ให้ Excel อ่านภาษาไทยถูก
    const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `morning-brief-signal-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function recordToday() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/cron/set50");
      const json = (await res.json()) as { ok: boolean; reason?: string; date?: string; close?: number };
      setMsg(json.ok ? `จดราคาปิด SET50 ${json.date} = ${json.close} แล้ว` : (json.reason ?? "จดไม่สำเร็จ"));
      if (json.ok) router.refresh();
    } catch {
      setMsg("ติดต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ml-auto flex flex-wrap items-center gap-2">
      {msg && <span className="text-[12px] text-slate-400">{msg}</span>}
      <button
        onClick={recordToday}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-xl border border-white/12 px-3 py-2 text-[12.5px] text-slate-200 transition hover:border-white/25 disabled:opacity-50"
      >
        <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
        จดราคาปิดวันนี้
      </button>
      <button
        onClick={downloadCsv}
        className="flex items-center gap-1.5 rounded-xl bg-violet-neon/20 px-3 py-2 text-[12.5px] font-semibold text-violet-neon transition hover:bg-violet-neon/30"
      >
        <Download className="size-4" />
        ดาวน์โหลด CSV
      </button>
    </div>
  );
}
