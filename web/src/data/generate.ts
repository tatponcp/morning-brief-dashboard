import type { ContractSeries, FlowRow, PaneRow } from "@/lib/types";

/** LCG แบบ deterministic — server กับ client ต้องได้ค่าเดียวกันเสมอ */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function businessDays(from: string, count: number) {
  const out: string[] = [];
  const d = new Date(from + "T00:00:00Z");
  while (out.length < count) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/**
 * สร้างซีรีส์ราคา + OI แบบมีทิศทาง (ใช้เป็น demo data จนกว่าจะต่อ TQ Pro / SET จริง)
 */
export function makeContract(
  symbol: string,
  seed: number,
  opts: {
    days: number;
    priceFrom: number;
    priceTo: number;
    oiFrom: number;
    oiTo: number;
    /** วันที่ OI กระโดด (rollover) เป็นสัดส่วน 0-1 ของช่วง; undefined = ค่อย ๆ ไต่ */
    oiJumpAt?: number;
    oiJumpTo?: number;
  },
): ContractSeries {
  const r = rng(seed);
  const dates = businessDays("2026-04-01", opts.days);
  const rows = dates.map((t, i) => {
    const p = i / (opts.days - 1);
    const drift = opts.priceFrom + (opts.priceTo - opts.priceFrom) * p;
    const wave = Math.sin(p * 9.2 + seed) * (opts.priceTo - opts.priceFrom) * 0.09;
    const noise = (r() - 0.5) * (opts.priceTo - opts.priceFrom) * 0.14;
    const close = drift + wave + noise;

    let oi: number;
    if (opts.oiJumpAt !== undefined && opts.oiJumpTo !== undefined) {
      oi =
        p < opts.oiJumpAt
          ? opts.oiFrom * (0.95 + r() * 0.1)
          : opts.oiJumpTo * (0.94 + r() * 0.12) +
            (opts.oiTo - opts.oiJumpTo) * ((p - opts.oiJumpAt) / (1 - opts.oiJumpAt));
    } else {
      oi = opts.oiFrom + (opts.oiTo - opts.oiFrom) * Math.pow(p, 1.9) * (0.92 + r() * 0.16);
    }
    return { t, close: Number(close.toFixed(2)), oi: Math.round(oi) };
  });

  // ปักหมุดค่าล่าสุดให้ตรงกับตัวเลขที่ IC กรอก
  rows[rows.length - 1] = {
    ...rows[rows.length - 1],
    close: opts.priceTo,
    oi: opts.oiTo,
  };
  return { symbol, rows };
}

/** สะสม Long/Short ต่างชาติ + กองทุน (หน่วย: ล้านบาท, สะสม) */
export function makeFlows(seed: number, days: number): FlowRow[] {
  const r = rng(seed);
  const dates = businessDays("2026-06-26", days);
  let fund = 0;
  let foreign = 0;
  return dates.map((t, i) => {
    const p = i / (days - 1);
    fund += (r() - 0.32) * 2200;
    foreign += (r() - 0.72) * 2600;
    const set50 = 1050 + Math.sin(p * 3.1) * 26 + p * 34 - Math.pow(p, 3) * 46 + (r() - 0.5) * 4;
    return {
      t,
      fund: Math.round(fund),
      foreign: Math.round(foreign),
      total: Math.round(fund + foreign),
      set50: Number(set50.toFixed(2)),
    };
  });
}

/** เส้น breadth 0-100 สำหรับ sparkline / mini chart */
export function makeBreadth(seed: number, days: number, endAt: number) {
  const r = rng(seed);
  let v = 55;
  const out: { i: number; v: number }[] = [];
  for (let i = 0; i < days; i++) {
    const pull = (endAt - v) * (i / days) * 0.08;
    v = Math.max(2, Math.min(98, v + (r() - 0.5) * 16 + pull));
    out.push({ i, v: Number(v.toFixed(1)) });
  }
  out[out.length - 1].v = endAt;
  return out;
}

/** แท่งเทียนรายวัน — ใช้กับ pane kind "candle" */
export function makeCandles(
  seed: number,
  days: number,
  from: number,
  peak: number,
  to: number,
): PaneRow[] {
  const r = rng(seed);
  const dates = businessDays("2026-05-20", days);
  let prev = from;
  return dates.map((t, i) => {
    const p = i / (days - 1);
    // ขึ้นไปทำยอดแถว ๆ 70% ของช่วง แล้วย่อลงมาปิดที่ to
    const path =
      p < 0.7
        ? from + (peak - from) * (p / 0.7)
        : peak + (to - peak) * ((p - 0.7) / 0.3);
    const o = prev;
    const c = path + (r() - 0.5) * (peak - from) * 0.12;
    const h = Math.max(o, c) + r() * (peak - from) * 0.07;
    const l = Math.min(o, c) - r() * (peak - from) * 0.07;
    prev = c;
    return {
      t,
      o: Number(o.toFixed(2)),
      h: Number(h.toFixed(2)),
      l: Number(l.toFixed(2)),
      c: Number(c.toFixed(2)),
    };
  });
}

/** เส้นสะสมที่ไหลไปจบที่ค่าที่กำหนด */
export function makeCumulative(
  seed: number,
  days: number,
  key: string,
  from: number,
  to: number,
  startDate = "2026-05-20",
): PaneRow[] {
  const r = rng(seed);
  const dates = businessDays(startDate, days);
  return dates.map((t, i) => {
    const p = i / (days - 1);
    const v = from + (to - from) * Math.pow(p, 1.15) + (r() - 0.5) * Math.abs(to - from) * 0.16;
    return { t, [key]: Math.round(p === 1 ? to : v) };
  });
}

/** ซีรีส์ intraday 15 นาที (ใช้กับกราฟระยะสั้นข้อ 3) */
export function make15m(
  seed: number,
  bars: number,
  fields: { key: string; from: number; to: number; jitter?: number }[],
): PaneRow[] {
  const r = rng(seed);
  const out: PaneRow[] = [];
  const start = new Date("2026-08-04T10:00:00Z");
  for (let i = 0; i < bars; i++) {
    const d = new Date(start.getTime() + i * 15 * 60 * 1000);
    const p = i / (bars - 1);
    const row: PaneRow = {
      t: `${d.toISOString().slice(0, 10)}T${d.toISOString().slice(11, 16)}`,
    };
    for (const f of fields) {
      const jit = f.jitter ?? Math.abs(f.to - f.from) * 0.12;
      const v = f.from + (f.to - f.from) * Math.pow(p, 1.1) + (r() - 0.5) * jit;
      row[f.key] = Number((p === 1 ? f.to : v).toFixed(4));
    }
    out.push(row);
  }
  return out;
}

export function makeSpark(seed: number, n: number, from: number, to: number) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const p = i / (n - 1);
    return Number((from + (to - from) * p + (r() - 0.5) * Math.abs(to - from) * 0.5).toFixed(2));
  });
}
