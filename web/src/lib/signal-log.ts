import "server-only";
import { getBrief, listDates } from "@/data";
import { getSupabase, IMAGE_BUCKET } from "./supabase";
import { sectionScore } from "./market-score";
import type { PublishedFile } from "./merge-brief";
import type { LogEntry, PriceSource } from "./signal-eval";
import type { FlowRow } from "./types";

/**
 * ข้อมูลสำหรับตรวจความแม่นย้อนหลัง
 *  - สัญญาณของแต่ละวัน: จากตาราง briefs ที่เผยแพร่แล้ว (1 แถวต่อวัน)
 *  - ผลจริง: ราคาปิด S50 จากชีตข้อ 2 ที่ IC วางทุกวัน + ราคาปิด SET50 ที่จดอัตโนมัติทุกเย็น
 */

const CLOSES_PATH = "config/set50-daily.json";

/** สัญญาณทุกวันที่เผยแพร่ เรียงเก่า → ใหม่ */
export async function loadHistory(): Promise<LogEntry[]> {
  const db = getSupabase();
  if (!db) {
    // ไม่มีฐานข้อมูล: ใช้ brief ในโค้ด (ใช้ตอนพัฒนาในเครื่อง)
    return listDates().map(({ date }) => toEntry(date, getBrief(date).sections.map((s) => ({ id: s.id, ...s.narrative }))));
  }
  const { data, error } = await db
    .from("briefs")
    .select("date, payload")
    .order("date", { ascending: true })
    .limit(1000);
  if (error || !data) return [];
  return data.map((row) => {
    const p = row.payload as PublishedFile;
    // วันที่มีตราประทับใช้ค่าตอนเผยแพร่ · วันก่อนหน้ามีตราประทับคิดจากสถานการณ์ที่บันทึกไว้
    if (p.meta) return { date: row.date, scores: p.meta.scores, biases: p.meta.biases, rules: p.meta.rules };
    return toEntry(row.date, p.sections ?? []);
  });
}

function toEntry(date: string, sections: { id: string; scenario?: Parameters<typeof sectionScore>[0] }[]): LogEntry {
  const scores: LogEntry["scores"] = {};
  const biases: LogEntry["biases"] = {};
  for (const s of sections) {
    scores[s.id] = sectionScore(s.scenario);
    biases[s.id] = s.scenario && s.scenario.id !== "pending" ? s.scenario.bias : undefined;
  }
  return { date, scores, biases, rules: "ก่อนประทับเวอร์ชัน" };
}

/**
 * แหล่งราคาปิดรายวัน เรียงตามลำดับที่ใช้
 *  1) ชีตข้อ 2 — ราคาปิดสัญญา S50 ที่ทีมใช้จริง
 *  2) SET50 ที่จดอัตโนมัติทุกเย็น — ใช้วันที่ชีตยังไม่มี
 */
export async function loadPriceSources(flows: FlowRow[] | undefined): Promise<PriceSource[]> {
  const sheet = new Map<string, number>();
  for (const r of flows ?? []) {
    // ราคาปิดในชีตต้องเป็นหลักพัน — กันแถวที่ importer รุ่นแรกใส่ spread มาแทน
    if (r.set50 > 100) sheet.set(r.t, r.set50);
  }
  const index = new Map(Object.entries(await readCloses()));
  return [
    { label: "ชีต IC (ราคาปิดสัญญา S50)", prices: sheet },
    { label: "SET50 (จดอัตโนมัติ)", prices: index },
  ];
}

async function readCloses(): Promise<Record<string, number>> {
  const db = getSupabase();
  if (!db) return {};
  try {
    const { data, error } = await db.storage.from(IMAGE_BUCKET).download(CLOSES_PATH);
    if (error || !data) return {};
    return JSON.parse(await data.text()) as Record<string, number>;
  } catch {
    return {};
  }
}

/**
 * จดราคาปิด SET50 ของวันนี้ (เรียกจาก cron หลังตลาดปิด)
 * Yahoo ให้ประวัติย้อนหลังของดัชนีไทยไม่ได้ จึงต้องจดเก็บเองวันต่อวัน
 */
export async function recordSet50Close(now = new Date()) {
  const db = getSupabase();
  if (!db) return { ok: false as const, reason: "ยังไม่ได้เชื่อม Supabase" };

  const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5ESET50.BK?range=5d&interval=1d", {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  }).catch(() => null);
  const meta = res?.ok ? (await res.json())?.chart?.result?.[0]?.meta : null;
  const price = Number(meta?.regularMarketPrice);
  const at = Number(meta?.regularMarketTime);
  if (!price || !at) return { ok: false as const, reason: "ดึงราคา SET50 ไม่ได้" };

  const bkk = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d);
  const date = bkk(new Date(at * 1000));
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", hourCycle: "h23" }).format(new Date(at * 1000)));
  // ราคาต้องเป็นของวันนี้และหลังตลาดปิด (16:30) ไม่งั้นยังไม่ใช่ราคาปิด
  if (date !== bkk(now) || hour < 16) return { ok: false as const, reason: `ยังไม่มีราคาปิดของวันนี้ (ราคาล่าสุด ${date})` };

  const all = await readCloses();
  all[date] = Math.round(price * 100) / 100;
  const { error } = await db.storage
    .from(IMAGE_BUCKET)
    .upload(CLOSES_PATH, Buffer.from(JSON.stringify(all), "utf8"), {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const, date, close: all[date] };
}
