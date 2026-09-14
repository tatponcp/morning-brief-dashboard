import type { ContractSeries, FlowRow, SpreadSeries } from "./types";

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
  /** ชื่อ spread series มีรหัสเดือนสองชุด เช่น S50U26Z26 */
  spread: /[A-Z0-9]{2,}[FGHJKMNQUVXZ]\d{2}[FGHJKMNQUVXZ]\d{2}/i,
};

export type ColumnMap = Partial<Record<keyof typeof PATTERNS, number>>;

export function guessColumns(headers: string[], rows: string[][] = []): ColumnMap {
  const map: ColumnMap = {};
  const used = new Set<number>();
  const take = (key: keyof ColumnMap, idx: number) => {
    if (idx < 0 || used.has(idx)) return;
    map[key] = idx;
    used.add(idx);
  };

  // ชีตที่มีทั้งยอดรายวันและยอดสะสม ต้องใช้คอลัมน์สะสม ("รวม…", "สะสม", "cum")
  const cum = /รวม|สะสม|cum/i;
  const hasForeign = /foreign|ต่างชาติ/i;
  const hasFund = /fund|กองทุน|สถาบัน/i;
  take("total", headers.findIndex((h) => hasForeign.test(h) && hasFund.test(h)));
  take("foreign", headers.findIndex((h, i) => !used.has(i) && cum.test(h) && hasForeign.test(h) && !hasFund.test(h)));
  take("fund", headers.findIndex((h, i) => !used.has(i) && cum.test(h) && hasFund.test(h) && !hasForeign.test(h)));

  // spread ต้องจับก่อน close ไม่งั้น "close S50U26Z26" จะถูกเข้าใจเป็นราคาปิด
  take("spread", headers.findIndex((h) => PATTERNS.spread.test(h)));

  // หัวคอลัมน์วันที่ว่างบ่อย (ชีตที่วันที่อยู่คอลัมน์แรก) → ดูจากค่าข้างในแทน
  const dateByHeader = headers.findIndex((h) => PATTERNS.date.test(h.trim()));
  const dateByValue = headers.findIndex((_, i) => {
    const sample = rows.slice(0, 5).map((r) => r[i] ?? "").filter((v) => v.trim());
    return sample.length > 0 && sample.every((v) => toIsoDate(v) !== null && toNumber(v) === null);
  });
  take("date", dateByHeader >= 0 ? dateByHeader : dateByValue);
  // เรียงให้ตัวที่เจาะจงกว่ามาก่อน กัน "total" ไปคว้าคอลัมน์ "รวมกองทุน"
  for (const key of ["date", "symbol", "oi", "close", "foreign", "fund", "total"] as const) {
    if (map[key] !== undefined) continue;
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
    if (close === null) return issues.push({ line: i + 2, reason: "ยังไม่มีราคาปิด" });

    // ไม่มีคอลัมน์ชื่อสัญญา: ลองอ่านจากหัวคอลัมน์ราคา เช่น "close S50U26"
    const fromHeader =
      map.close !== undefined ? table.headers[map.close]?.match(/[A-Z0-9]{2,}[FGHJKMNQUVXZ]\d{2}/)?.[0] : undefined;
    const symbol = (map.symbol !== undefined ? r[map.symbol] : "")?.trim() || fromHeader || "SERIES";
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

    const fundRaw = map.fund !== undefined ? toNumber(r[map.fund] ?? "") : null;
    const foreignRaw = map.foreign !== undefined ? toNumber(r[map.foreign] ?? "") : null;
    if (fundRaw === null && foreignRaw === null) {
      return issues.push({ line: i + 2, reason: "ยังไม่มียอดกองทุน/ต่างชาติ" });
    }
    const fund = fundRaw ?? 0;
    const foreign = foreignRaw ?? 0;
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

/* ───────────────── ชีตประจำวันของ IC: ข้อ 1 + ข้อ 2 ในไฟล์เดียว ───────────────── */

export function toSpread(table: Table, map: ColumnMap): SpreadSeries | null {
  if (map.spread === undefined || map.date === undefined) return null;
  const col = map.spread;
  const dateCol = map.date;
  const symbol = table.headers[col].match(PATTERNS.spread)?.[0]?.toUpperCase() ?? "SPREAD";
  const rows = table.rows
    .map((r) => ({ t: toIsoDate(r[dateCol] ?? ""), v: toNumber(r[col] ?? "") }))
    .filter((x): x is { t: string; v: number } => !!x.t && x.v !== null)
    .sort((a, b) => a.t.localeCompare(b.t));
  return rows.length ? { symbol, rows } : null;
}

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const thDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${TH_MONTHS[m - 1]} ${y + 543}`;
};
const n2 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n0 = (v: number) => Math.round(v).toLocaleString("en-US");
const signed = (v: number) => (v > 0 ? "+" : "") + n0(v);

export type DailySheet = {
  contracts: ContractSeries[];
  spread: SpreadSeries | null;
  flows: FlowRow[];
  /** แถวที่ข้าม เช่นวันนี้ที่ยังไม่มีราคาปิด — บอก IC ให้รู้ ไม่ใช่ error */
  skipped: ImportIssue[];
  missing: string[];
  s50: { asOfLabel?: string; summary: string[] };
  flow: { asOfLabel?: string; summary: string[] };
};

/**
 * อ่านชีตทั้งแผ่นแล้วแยกเป็นข้อมูลข้อ 1 และข้อ 2
 * สรุปสั้นที่ร่างให้เป็นข้อเท็จจริงจากตัวเลขเท่านั้น — มุมมองการลงทุนเป็นหน้าที่ IC
 */
export function toDailySheet(table: Table): DailySheet {
  const map = guessColumns(table.headers, table.rows);
  const missing: string[] = [];
  if (map.date === undefined) missing.push("วันที่");
  if (map.close === undefined) missing.push("ราคาปิด (close …)");
  if (map.foreign === undefined || map.fund === undefined) missing.push("รวมต่างชาติ / รวมกองทุน");

  const empty = { data: [], issues: [] as ImportIssue[] };
  const c = map.close !== undefined ? toContracts(table, map) : { ...empty, data: [] as ContractSeries[] };
  const f = map.foreign !== undefined || map.fund !== undefined ? toFlows(table, map) : { ...empty, data: [] as FlowRow[] };
  const spread = toSpread(table, map);

  const s50: DailySheet["s50"] = { summary: [] };
  const main = c.data[0];
  if (main?.rows.length) {
    const last = main.rows[main.rows.length - 1];
    const prev = main.rows[main.rows.length - 2];
    s50.asOfLabel = thDate(last.t);
    if (prev) {
      const d = last.close - prev.close;
      s50.summary.push(`${main.symbol} ${n2(last.close)} ${d >= 0 ? "เพิ่มขึ้น" : "ลดลง"} ${n2(Math.abs(d))} จุดจากวันก่อน (${n2(prev.close)})`);
      if (last.oi && prev.oi) {
        const doi = last.oi - prev.oi;
        s50.summary.push(`OI ${n0(last.oi)} ${doi >= 0 ? "เพิ่มขึ้น" : "ลดลง"} ${n0(Math.abs(doi))} สัญญา`);
      }
    }
    if (spread) {
      const sl = spread.rows[spread.rows.length - 1];
      s50.summary.push(`Spread ${spread.symbol} ${sl.v}${sl.t !== last.t ? ` (${thDate(sl.t)})` : ""}`);
    }
  }

  const flow: DailySheet["flow"] = { summary: [] };
  const fl = f.data[f.data.length - 1];
  const fp = f.data[f.data.length - 2];
  if (fl) {
    flow.asOfLabel = thDate(fl.t);
    if (fp) {
      const df = fl.foreign - fp.foreign;
      const dk = fl.fund - fp.fund;
      flow.summary.push(`ต่างชาติสะสม ${signed(fl.foreign)} (${df >= 0 ? "ซื้อ" : "ขาย"}สุทธิ ${n0(Math.abs(df))} ในวันล่าสุด)`);
      flow.summary.push(`กองทุนสะสม ${signed(fl.fund)} (${dk >= 0 ? "ซื้อ" : "ขาย"}สุทธิ ${n0(Math.abs(dk))} ในวันล่าสุด)`);
      flow.summary.push(`ต่างชาติ + กองทุน ${signed(fl.total)} ${fl.total >= fp.total ? "เพิ่มขึ้น" : "ลดลง"}จาก ${signed(fp.total)}`);
    }
  }

  const skipped = [...c.issues, ...f.issues].filter(
    (x, i, all) => all.findIndex((y) => y.line === x.line) === i,
  );
  return { contracts: c.data, spread, flows: f.data, skipped, missing, s50, flow };
}
