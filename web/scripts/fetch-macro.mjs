/**
 * ดึงข้อมูล Global Macro (ข้อ 6) มาเก็บเป็น snapshot ไว้ใน repo
 * ใช้เป็น fallback เวลา provider ล่ม และเป็นข้อมูลตั้งต้นตอน build
 *
 *   node scripts/fetch-macro.mjs
 */
import { writeFile } from "node:fs/promises";

const INSTRUMENTS = [
  { id: "gold", symbol: "GC=F", label: "GOLD", sub: "COMEX · ราคาทองคำ", digits: 2 },
  { id: "vix", symbol: "^VIX", label: "VIX", sub: "Volatility Index", digits: 2 },
  { id: "dxy", symbol: "DX-Y.NYB", label: "DXY", sub: "Dollar Index", digits: 2 },
  { id: "us10y", symbol: "^TNX", label: "US10Y", sub: "10Y Treasury Yield", digits: 2, suffix: "%" },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

async function fetchSeries(symbol, range = "1y") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=${range}&interval=1d`;
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);
  const json = await res.json();
  const r = json?.chart?.result?.[0];
  if (!r) throw new Error(`${symbol}: empty result`);

  const q = r.indicators.quote[0];
  const rows = [];
  r.timestamp.forEach((ts, i) => {
    const c = q.close[i];
    if (c == null) return;
    rows.push({
      t: new Date(ts * 1000).toISOString().slice(0, 10),
      o: round(q.open[i] ?? c),
      h: round(q.high[i] ?? c),
      l: round(q.low[i] ?? c),
      c: round(c),
    });
  });
  return rows;
}

const round = (v) => Number(Number(v).toFixed(4));

const out = { fetchedAt: new Date().toISOString(), instruments: [] };

for (const inst of INSTRUMENTS) {
  try {
    const rows = await fetchSeries(inst.symbol);
    out.instruments.push({ ...inst, rows });
    const last = rows.at(-1);
    console.log(`✓ ${inst.label.padEnd(6)} ${rows.length} แท่ง · ล่าสุด ${last.c} (${last.t})`);
  } catch (e) {
    console.error(`✗ ${inst.label}: ${e.message}`);
    process.exitCode = 1;
  }
}

await writeFile(
  new URL("../src/data/macro-snapshot.json", import.meta.url),
  JSON.stringify(out, null, 1),
  "utf8",
);
console.log("→ เขียนลง src/data/macro-snapshot.json แล้ว");
