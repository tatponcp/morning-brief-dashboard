"use client";

import { useRef, useState } from "react";
import { Check, ClipboardPaste, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import { parseCsv, toDailySheet, type DailySheet } from "@/lib/csv";

/**
 * นำเข้าชีตประจำวันของ IC ครั้งเดียว ใส่ข้อ 1 (ราคา + OI + spread) และข้อ 2 (ต่างชาติ/กองทุน)
 * รับได้ทั้งไฟล์ CSV และการคัดลอกช่วงเซลล์จาก Google Sheets มาวางตรง ๆ
 */
export function DailySheetImporter({
  onApply,
}: {
  onApply: (sheet: DailySheet, withSummary: boolean) => void;
}) {
  const [sheet, setSheet] = useState<DailySheet | null>(null);
  const [source, setSource] = useState("");
  const [withSummary, setWithSummary] = useState(true);
  const [applied, setApplied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function ingest(text: string, from: string) {
    if (!text.trim()) return;
    setSheet(toDailySheet(parseCsv(text)));
    setSource(from);
    setApplied(false);
  }

  function pickFile(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => ingest(String(reader.result), file.name);
    reader.readAsText(file, "utf-8");
  }

  const main = sheet?.contracts[0];
  const ready = !!sheet && sheet.missing.length === 0 && !!main && sheet.flows.length > 0;

  return (
    <div className="space-y-3">
      <div
        tabIndex={0}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pickFile(e.dataTransfer.files?.[0]);
        }}
        onPaste={(e) => {
          const file = e.clipboardData.files?.[0];
          if (file) return pickFile(file);
          ingest(e.clipboardData.getData("text/plain"), "วางจากคลิปบอร์ด");
        }}
        onClick={() => fileRef.current?.click()}
        className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-cyan-neon/40 bg-cyan-neon/5 px-4 py-6 text-center transition outline-none hover:bg-cyan-neon/10 focus:border-cyan-neon"
      >
        <FileSpreadsheet className="mb-2 size-7 text-cyan-neon" />
        <p className="text-[14px] font-semibold text-slate-100">
          วางชีตประจำวัน ใส่ข้อ 1 และข้อ 2 พร้อมกัน
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-400">
          <ClipboardPaste className="size-3.5" />
          คลิกที่นี่แล้วกด Ctrl+V หลังคัดลอกตารางใน Google Sheets (รวมแถวหัวตาราง) · หรือลากไฟล์ CSV มาวาง
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      {sheet && (
        <div className="panel space-y-3 px-4 py-3">
          <p className="text-[11px] text-slate-500">ที่มา: {source}</p>

          {sheet.missing.length > 0 && (
            <p className="flex items-center gap-1.5 rounded-lg border border-rose-neon/30 bg-rose-neon/10 px-3 py-2 text-[12.5px] text-rose-neon">
              <TriangleAlert className="size-4" />
              หาคอลัมน์ไม่เจอ: {sheet.missing.join(", ")}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Result
              title="ข้อ 1 · S50 + OI"
              lines={[
                main ? `${main.symbol} ${main.rows.length} วัน` : "ไม่พบราคาปิด",
                sheet.spread ? `${sheet.spread.symbol} ${sheet.spread.rows.length} วัน` : "ไม่พบ spread",
                sheet.s50.asOfLabel ? `ล่าสุด ${sheet.s50.asOfLabel}` : "",
              ]}
              summary={sheet.s50.summary}
            />
            <Result
              title="ข้อ 2 · ต่างชาติ / กองทุน"
              lines={[
                `${sheet.flows.length} วัน (ยอดสะสม)`,
                sheet.flow.asOfLabel ? `ล่าสุด ${sheet.flow.asOfLabel}` : "",
              ]}
              summary={sheet.flow.summary}
            />
          </div>

          {sheet.skipped.length > 0 && (
            <p className="text-[12px] text-slate-400">
              ข้าม {sheet.skipped.length} แถว:{" "}
              {sheet.skipped
                .slice(0, 3)
                .map((x) => `บรรทัด ${x.line} ${x.reason}`)
                .join(" · ")}
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-2 text-[12.5px] text-slate-300">
            <input
              type="checkbox"
              checked={withSummary}
              onChange={(e) => setWithSummary(e.target.checked)}
              className="mt-0.5 size-3.5 accent-[var(--c-cyan)]"
            />
            <span>
              ร่าง &ldquo;สรุปสั้น&rdquo; จากตัวเลขให้ด้วย
              <span className="block text-[11px] text-slate-500">
                เป็นข้อเท็จจริงจากตัวเลขเท่านั้น · แปลความและ Action ยังต้องเขียนเอง
              </span>
            </span>
          </label>

          <button
            disabled={!ready}
            onClick={() => {
              onApply(sheet, withSummary);
              setApplied(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-neon to-green-neon py-2.5 text-[13px] font-semibold text-ink-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {applied ? <Check className="size-4" /> : <Upload className="size-4" />}
            {applied ? "ใส่ข้อ 1 และข้อ 2 แล้ว" : "ใส่ข้อ 1 และข้อ 2"}
          </button>
        </div>
      )}
    </div>
  );
}

function Result({ title, lines, summary }: { title: string; lines: string[]; summary: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/3 px-3 py-2.5">
      <p className="text-[12.5px] font-semibold text-slate-100">{title}</p>
      {lines.filter(Boolean).map((l) => (
        <p key={l} className="text-[12px] text-slate-400">
          {l}
        </p>
      ))}
      {summary.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 border-t border-white/8 pt-1.5">
          {summary.map((s) => (
            <li key={s} className="text-[11.5px] text-slate-300">
              · {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
