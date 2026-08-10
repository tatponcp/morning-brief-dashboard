import "server-only";
import snapshot from "@/data/macro-snapshot.json";
import type { Candle, Instrument } from "./types";

/**
 * แหล่งข้อมูล Global Macro (ข้อ 6)
 *
 * ลำดับการทำงาน: ยิง provider จริง → ถ้าล้มเหลว/ช้า ใช้ snapshot ใน repo แทน
 * ทำให้ build ไม่มีวันพังเพราะ provider ล่ม และหน้าเว็บมีข้อมูลเสมอ
 *
 * ถ้าจะใช้เชิงพาณิชย์จริงจัง ควรย้ายไป provider ที่มีสัญญา (Twelve Data, Polygon,
 * EOD Historical ฯลฯ) — แก้แค่ฟังก์ชัน fetchDaily() ตัวเดียว
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

export const MACRO_SPEC = [
  { id: "gold", symbol: "GC=F", label: "GOLD", sub: "COMEX · ราคาทองคำ", color: "#ffc53d" },
  { id: "vix", symbol: "^VIX", label: "VIX", sub: "Volatility Index", color: "#fb923c" },
  { id: "dxy", symbol: "DX-Y.NYB", label: "DXY", sub: "Dollar Index", color: "#fb7185" },
  { id: "us10y", symbol: "^TNX", label: "US10Y", sub: "10Y Treasury Yield", color: "#22d3ee", suffix: "%" },
] as const;

type SnapRow = { t: string; o: number; h: number; l: number; c: number };

async function fetchDaily(symbol: string): Promise<Candle[] | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol,
      )}?range=1y&interval=1d`,
      {
        headers: { "user-agent": UA, accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        // ดึงใหม่ทุก 1 ชม. — หน้าเว็บยังเสิร์ฟแบบ static ตลอด
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const r = json?.chart?.result?.[0];
    const q = r?.indicators?.quote?.[0];
    if (!r?.timestamp || !q) return null;

    const rows: Candle[] = [];
    r.timestamp.forEach((ts: number, i: number) => {
      const c = q.close[i];
      if (c == null) return;
      rows.push({
        t: new Date(ts * 1000).toISOString().slice(0, 10),
        o: q.open[i] ?? c,
        h: q.high[i] ?? c,
        l: q.low[i] ?? c,
        c,
      });
    });
    return rows.length > 20 ? rows : null;
  } catch {
    return null;
  }
}

function fromSnapshot(id: string): Candle[] {
  const inst = snapshot.instruments.find((x) => x.id === id);
  return ((inst?.rows ?? []) as SnapRow[]).map((r) => ({ ...r }));
}

export type MacroData = {
  gold: Candle[];
  instruments: Instrument[];
  /** true = ได้ข้อมูลสดจาก provider, false = ใช้ snapshot ใน repo */
  live: boolean;
  asOf: string;
};

export async function loadMacro(): Promise<MacroData> {
  const results = await Promise.all(
    MACRO_SPEC.map(async (spec) => {
      const live = await fetchDaily(spec.symbol);
      return { spec, rows: live ?? fromSnapshot(spec.id), live: live !== null };
    }),
  );

  const gold = results.find((r) => r.spec.id === "gold")!.rows;

  const instruments: Instrument[] = results.map(({ spec, rows }) => {
    const last = rows.at(-1);
    const prev = rows.at(-2) ?? last;
    const value = last?.c ?? 0;
    const change = value - (prev?.c ?? value);
    const changePct = prev?.c ? (change / prev.c) * 100 : 0;
    return {
      id: spec.id,
      label: spec.label,
      sub: spec.sub,
      color: spec.color,
      value,
      change,
      changePct,
      suffix: "suffix" in spec ? spec.suffix : undefined,
      digits: 2,
      tone: readTone(spec.id, change),
      note: readNote(spec.id, value, change),
      rows: rows.map((r) => ({ t: r.t, c: r.c })),
    };
  });

  return {
    gold,
    instruments,
    live: results.every((r) => r.live),
    asOf: gold.at(-1)?.t ?? snapshot.fetchedAt.slice(0, 10),
  };
}

/** กติกาอ่านสัญญาณของ section นี้: มองจากมุม "ดีต่อทอง" ตามที่ IC ใช้อยู่ */
function readTone(id: string, change: number) {
  if (id === "gold") return change >= 0 ? "bull" : "bear";
  // VIX / DXY / US10Y ลง = หนุนทอง = บวก
  return change <= 0 ? "bull" : "bear";
}

function readNote(id: string, value: number, change: number) {
  const down = change < 0;
  switch (id) {
    case "gold":
      return change >= 0 ? "ได้แรงหนุน ขึ้นมายืนได้" : "ย่อลง ต้องดูแรงรับ";
    case "vix":
      return value < 20 ? "VIX ยังต่ำ = ตลาดโลกไม่ panic" : "VIX สูงขึ้น = ตลาดเริ่มกังวล";
    case "dxy":
      return value < 100 ? "DXY ต่ำกว่า 100 = หนุนทอง" : "DXY เหนือ 100 = กดดันทอง";
    case "us10y":
      return down ? "Bond Yield อ่อนลง" : "Bond Yield เด้งขึ้น ระวังทองย่อ";
    default:
      return "";
  }
}
