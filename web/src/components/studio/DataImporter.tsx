"use client";

import { useMemo, useRef, useState } from "react";
import { Check, FileSpreadsheet, Sigma, TriangleAlert, Upload } from "lucide-react";
import {
  accumulate,
  guessColumns,
  parseCsv,
  toContracts,
  toFlows,
  type ColumnMap,
  type Table,
} from "@/lib/csv";
import type { ContractSeries, FlowRow } from "@/lib/types";

type Kind = "contracts" | "flows";

const FIELDS: Record<Kind, { key: keyof ColumnMap; label: string; required?: boolean }[]> = {
  contracts: [
    { key: "date", label: "วันที่", required: true },
    { key: "symbol", label: "ชื่อสัญญา" },
    { key: "close", label: "ราคาปิด", required: true },
    { key: "oi", label: "Open Interest" },
  ],
  flows: [
    { key: "date", label: "วันที่", required: true },
    { key: "fund", label: "กองทุน", required: true },
    { key: "foreign", label: "ต่างชาติ", required: true },
    { key: "total", label: "รวม (ถ้าไม่มีจะคำนวณให้)" },
    { key: "set50", label: "SET50 Index" },
  ],
};

export function DataImporter({
  kind,
  onApply,
}: {
  kind: Kind;
  onApply: (data: { contracts?: ContractSeries[]; flows?: FlowRow[] }) => void;
}) {
  const [table, setTable] = useState<Table | null>(null);
  const [map, setMap] = useState<ColumnMap>({});
  const [cumulative, setCumulative] = useState(true);
  const [fileName, setFileName] = useState("");
  const [applied, setApplied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function ingest(text: string, name = "") {
    const t = parseCsv(text);
    setTable(t);
    setMap(guessColumns(t.headers));
    setFileName(name);
    setApplied(false);
  }

  function pickFile(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => ingest(String(reader.result), file.name);
    reader.readAsText(file, "utf-8");
  }

  const result = useMemo(() => {
    if (!table) return null;
    if (kind === "contracts") return toContracts(table, map);
    const r = toFlows(table, map);
    return cumulative ? { ...r, data: r.data } : { ...r, data: accumulate(r.data) };
  }, [table, map, kind, cumulative]);

  const missing = FIELDS[kind]
    .filter((f) => f.required && map[f.key] === undefined)
    .map((f) => f.label);

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pickFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => fileRef.current?.click()}
        className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-white/15 bg-white/2 px-4 py-6 text-center transition hover:border-[#22d3ee]/50 hover:bg-[#22d3ee]/4"
      >
        <FileSpreadsheet className="mb-2 size-6 text-slate-500" />
        <p className="text-[13px] text-slate-300">
          ลากไฟล์ CSV มาวาง หรือคลิกเพื่อเลือก
        </p>
        <p className="mt-0.5 text-[11.5px] text-slate-500">
          ถ้าเป็น Excel ให้ Save As → CSV UTF-8 ก่อน · รองรับวันที่แบบ พ.ศ. และตัวเลขมีลูกน้ำ
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,text/csv"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      <details className="rounded-xl border border-white/10 bg-white/2 px-3 py-2">
        <summary className="cursor-pointer text-[12px] text-slate-400">
          หรือวางข้อมูลเป็นข้อความตรงนี้
        </summary>
        <textarea
          onChange={(e) => e.target.value.trim() && ingest(e.target.value)}
          rows={4}
          placeholder={
            kind === "contracts"
              ? "วันที่,สัญญา,ราคาปิด,OI\n2026-08-05,S50U26,1076.30,582497"
              : "วันที่,กองทุน,ต่างชาติ,SET50\n2026-08-05,1200,-2400,1076.9"
          }
          className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 font-mono text-[11.5px] text-slate-200 outline-none focus:border-[#22d3ee]/60"
        />
      </details>

      {table && result && (
        <>
          <div className="rounded-xl border border-white/10 bg-white/2 p-3">
            <p className="mb-2 text-[12px] text-slate-400">
              จับคู่คอลัมน์ {fileName && <span className="text-slate-500">· {fileName}</span>}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {FIELDS[kind].map((f) => (
                <label key={String(f.key)} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 text-[12px] text-slate-400">
                    {f.label}
                    {f.required && <span className="text-[#fb7185]"> *</span>}
                  </span>
                  <select
                    value={map[f.key] ?? -1}
                    onChange={(e) =>
                      setMap((m) => ({
                        ...m,
                        [f.key]: Number(e.target.value) < 0 ? undefined : Number(e.target.value),
                      }))
                    }
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-2 py-1.5 text-[12px] text-slate-100 outline-none focus:border-[#22d3ee]/60"
                  >
                    <option value={-1}>— ไม่ใช้ —</option>
                    {table.headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `คอลัมน์ ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            {kind === "flows" && (
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12px] text-slate-300">
                <input
                  type="checkbox"
                  checked={cumulative}
                  onChange={(e) => setCumulative(e.target.checked)}
                  className="size-3.5 accent-[#22d3ee]"
                />
                <Sigma className="size-3.5 text-slate-500" />
                ไฟล์นี้เป็นยอดสะสมอยู่แล้ว (ถ้าเป็นยอดรายวัน ให้เอาติ๊กออก ระบบจะบวกสะสมให้)
              </label>
            )}
          </div>

          {/* พรีวิว */}
          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="flex flex-wrap items-center gap-2 border-b border-white/8 bg-white/3 px-3 py-2 text-[12px]">
              <span className="text-[#34f5a0]">อ่านได้ {result.ok.toLocaleString()} แถว</span>
              {result.issues.length > 0 && (
                <span className="flex items-center gap-1 text-[#ffc53d]">
                  <TriangleAlert className="size-3.5" />
                  ข้าม {result.issues.length} แถว ({result.issues[0].reason} บรรทัด{" "}
                  {result.issues[0].line})
                </span>
              )}
              {kind === "contracts" && (
                <span className="text-slate-400">
                  {(result.data as ContractSeries[]).length} สัญญา:{" "}
                  {(result.data as ContractSeries[]).map((c) => c.symbol).join(", ")}
                </span>
              )}
            </div>
            <div className="scroll-slim max-h-44 overflow-auto">
              <table className="w-full text-[11.5px]">
                <tbody className="divide-y divide-white/5">
                  {previewRows(kind, result.data).map((r, i) => (
                    <tr key={i} className="text-slate-300">
                      {r.map((c, j) => (
                        <td key={j} className="px-3 py-1.5 whitespace-nowrap">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            disabled={!!missing.length || result.ok === 0}
            onClick={() => {
              onApply(
                kind === "contracts"
                  ? { contracts: result.data as ContractSeries[] }
                  : { flows: result.data as FlowRow[] },
              );
              setApplied(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#34f5a0] py-2.5 text-[13px] font-semibold text-ink-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500"
          >
            {applied ? <Check className="size-4" /> : <Upload className="size-4" />}
            {missing.length
              ? `ยังขาดคอลัมน์: ${missing.join(", ")}`
              : applied
                ? "ใช้ข้อมูลนี้แล้ว — ดูกราฟด้านขวา"
                : "ใช้ข้อมูลนี้"}
          </button>
        </>
      )}
    </div>
  );
}

function previewRows(kind: Kind, data: ContractSeries[] | FlowRow[]): string[][] {
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (kind === "contracts") {
    const all = (data as ContractSeries[]).flatMap((c) =>
      c.rows.slice(-4).map((r) => [c.symbol, r.t, fmt(r.close), fmt(r.oi)]),
    );
    return all.slice(-8);
  }
  return (data as FlowRow[])
    .slice(-8)
    .map((r) => [r.t, fmt(r.fund), fmt(r.foreign), fmt(r.total), fmt(r.set50)]);
}
