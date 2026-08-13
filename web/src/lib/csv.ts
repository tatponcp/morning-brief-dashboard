import type { ContractSeries, FlowRow } from "./types";

/**
 * ตัวอ่านไฟล์ CSV ของ Morning Brief
 *
 * ออกแบบให้ทนกับไฟล์จริง: คั่นด้วย , หรือ ; หรือ tab, มีเครื่องหมายคำพูด,
 * ตัวเลขมีลูกน้ำ, วันที่หลายรูปแบบ (รวม พ.ศ.) และหัวคอลัมน์ไทย/อังกฤษ
 */

/* ───────────────── parser ───────────────── */

export function detectDelimiter(text: string): string {
  const line = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const counts = [",", ";", "\t", "|"].map((d) => ({
    d,
    n: line.split(d).length - 1,
  }));
  return counts.sort((a, b) => b.n - a.n)[0].n > 0
    ? counts.sort((a, b) => b.n - a.n)[0].d
    : ",";
}

/** แยกบรรทัดโดยเคารพเครื่องหมายคำพูด */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === delim && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export type Table = { headers: string[]; rows: string[][] };

export function parseCsv(text: string): Table {
  const clean = text.replace(/^﻿/, "");
  const delim = detectDelimiter(clean);
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  return {
    headers: splitLine(lines[0], delim),
    rows: lines.slice(1).map((l) => splitLine(l, delim)),
  };
}

/* ───────────────── ค่าแต่ละช่อง ───────────────── */

export function toNumber(raw: string): number | null {
  if (raw == null) return null;
  const s = raw.replace(/[,\s]/g, "").replace(/[()]/g, (m) => (m === "(" ? "-" : ""));
  if (!s || !/^-?\d*\.?\d+$/.test(s)) return null;
  return Number(s);
}

/**
 * รองรับ 2026-08-05, 05/08/2026, 5-8-69, 05/08/2569
 * ปี 4 หลักที่มากกว่า 2400 ถือว่าเป็น พ.ศ. · ปี 2 หลักถือว่าเป็น พ.ศ. ย่อ
 */
export function toIsoDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return norm(+iso[1], +iso[2], +iso[3]);

  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dmy) return norm(+dmy[3], +dmy[2], +dmy[1]);

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);

  function norm(y: number, m: number, day: number) {
    let year = y;
    if (year < 100) year += year > 50 ? 1900 : 2000;
    if (year > 2400) year -= 543; // พ.ศ. → ค.ศ.
    if (m < 1 || m > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
}

/* ───────────────── เดาว่าคอลัมน์ไหนคืออะไร ───────────────── */

const PATTERNS: Record<string, RegExp> = {
  date: /^(date|day|time|t|วันที่|วัน)$|date|วันที่/i,
  symbol: /symbol|series|contract|ticker|สัญญา|ซีรีส์/i,
  close: /close|ปิด|price|last|settle/i,
  oi: /\boi\b|open.?int|คงค้าง|สถานะคงค้าง/i,
  fund: /fund|institution|กองทุน|สถาบัน/i,
  foreign: /foreign|ต่างชาติ|ตปท/i,
  total: /total|sum|รวม/i,
  set50: /set ?50|index|ดัชนี/i,
};

export type ColumnMap = Partial<Record<keyof typeof PATTERNS, number>>;

export function guessColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  const used = new Set<number>();
  // เรียงให้ตัวที่เจาะจงกว่ามาก่อน กัน "total" ไปคว้าคอลัมน์ "รวมกองทุน"
  for (const key of ["date", "symbol", "oi", "close", "set50", "foreign", "fund", "total"] as const) {
    const idx = headers.findIndex((h, i) => !used.has(i) && PATTERNS[key].test(h.trim()));
    if (idx >= 0) {
      map[key] = idx;
      used.add(idx);
    }
  }
  return map;
}

/* ───────────────── แปลงเป็นข้อมูลของระบบ ───────────────── */

export type ImportIssue = { line: number; reason: string };

export type ImportResult<T> = {
  data: T;
  ok: number;
  issues: ImportIssue[];
};

/** ข้อ 1 — ราคา + OI (แยกเป็นหลายสัญญาได้ถ้ามีคอลัมน์ symbol) */
export function toContracts(table: Table, map: ColumnMap): ImportResult<ContractSeries[]> {
  const issues: ImportIssue[] = [];
  const bySymbol = new Map<string, ContractSeries["rows"]>();

  table.rows.forEach((r, i) => {
    const t = map.date !== undefined ? toIsoDate(r[map.date] ?? "") : null;
    const close = map.close !== undefined ? toNumber(r[map.close] ?? "") : null;
    const oi = map.oi !== undefined ? toNumber(r[map.oi] ?? "") : null;

    if (!t) return issues.push({ line: i + 2, reason: "อ่านวันที่ไม่ได้" });
    if (close === null) return issues.push({ line: i + 2, reason: "อ่านราคาปิดไม่ได้" });

    const symbol = (map.symbol !== undefined ? r[map.symbol] : "")?.trim() || "SERIES";
    if (!bySymbol.has(symbol)) bySymbol.set(symbol, []);
    bySymbol.get(symbol)!.push({ t, close, oi: oi ?? 0 });
  });

  const data = [...bySymbol.entries()].map(([symbol, rows]) => ({
    symbol,
    rows: rows.sort((a, b) => a.t.localeCompare(b.t)),
  }));

  return { data, ok: data.reduce((n, c) => n + c.rows.length, 0), issues };
}

/** ข้อ 2 — สะสม Long/Short ต่างชาติ + กองทุน */
export function toFlows(table: Table, map: ColumnMap): ImportResult<FlowRow[]> {
  const issues: ImportIssue[] = [];
  const rows: FlowRow[] = [];

  table.rows.forEach((r, i) => {
    const t = map.date !== undefined ? toIsoDate(r[map.date] ?? "") : null;
    if (!t) return issues.push({ line: i + 2, reason: "อ่านวันที่ไม่ได้" });

    const fund = (map.fund !== undefined ? toNumber(r[map.fund] ?? "") : null) ?? 0;
    const foreign = (map.foreign !== undefined ? toNumber(r[map.foreign] ?? "") : null) ?? 0;
    const total = (map.total !== undefined ? toNumber(r[map.total] ?? "") : null) ?? fund + foreign;
    const set50 = (map.set50 !== undefined ? toNumber(r[map.set50] ?? "") : null) ?? 0;

    if (map.fund === undefined && map.foreign === undefined) {
      return issues.push({ line: i + 2, reason: "ไม่พบคอลัมน์กองทุน/ต่างชาติ" });
    }
    rows.push({ t, fund, foreign, total, set50 });
  });

  rows.sort((a, b) => a.t.localeCompare(b.t));
  return { data: rows, ok: rows.length, issues };
}

/** ตัวเลขสะสมหรือรายวัน? ถ้าเป็นรายวันให้บวกสะสมให้ */
export function accumulate(rows: FlowRow[]): FlowRow[] {
  let fund = 0;
  let foreign = 0;
  return rows.map((r) => {
    fund += r.fund;
    foreign += r.foreign;
    return { ...r, fund, foreign, total: fund + foreign };
  });
}
