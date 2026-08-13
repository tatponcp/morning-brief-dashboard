import "server-only";
import { getBrief } from "@/data";
import { mergePublished, type PublishedFile } from "./merge-brief";
import { getSupabase, IMAGE_BUCKET, supabaseStatus } from "./supabase";
import type { Brief } from "./types";

/**
 * ชั้นอ่าน/เขียน Brief ของหน้าเว็บ
 *
 * มีสองโหมด สลับอัตโนมัติตาม env:
 *   ไม่มี Supabase → ใช้ src/data + published.json (ต้อง git push ถึงจะอัปเดต)
 *   มี Supabase    → อ่านจาก DB (กดเผยแพร่ใน /studio แล้วขึ้นเว็บเลย)
 */

export type BriefSource = "static" | "supabase";

export type LoadedBrief = {
  brief: Brief;
  source: BriefSource;
  publishedAt?: string;
};

export async function loadBrief(date?: string): Promise<LoadedBrief> {
  const base = getBrief(date);
  const db = getSupabase();
  if (!db) return { brief: base, source: "static" };

  try {
    const query = db
      .from("briefs")
      .select("date, date_label_th, payload, published_at")
      .order("date", { ascending: false })
      .limit(1);

    const { data, error } = date ? await query.eq("date", date) : await query;
    if (error || !data?.length) return { brief: base, source: "static" };

    const row = data[0];
    const payload = row.payload as PublishedFile;
    return {
      brief: mergePublished(getBrief(row.date), {
        ...payload,
        date: row.date,
        dateLabelTH: payload.dateLabelTH || row.date_label_th,
      }),
      source: "supabase",
      publishedAt: row.published_at,
    };
  } catch {
    // DB ล่มไม่ควรทำให้เว็บล่ม — ถอยไปใช้ข้อมูลใน repo
    return { brief: base, source: "static" };
  }
}

/** อัปโหลดภาพที่เป็น data URL ขึ้น Storage แล้วคืน public URL แทน */
async function uploadImages(date: string, payload: PublishedFile): Promise<PublishedFile> {
  const db = getSupabase();
  if (!db) return payload;

  const sections = await Promise.all(
    (payload.sections ?? []).map(async (s) => {
      if (!s.board?.images?.length) return s;
      const images = await Promise.all(
        s.board.images.map(async (im, i) => {
          if (!im.src.startsWith("data:")) return im;
          try {
            const [meta, b64] = im.src.split(",");
            const type = meta.match(/data:(.*?);/)?.[1] ?? "image/png";
            const ext = type.split("/")[1]?.split("+")[0] ?? "png";
            const bytes = Buffer.from(b64, "base64");
            const path = `${date}/${s.id}-${i}-${Date.now()}.${ext}`;

            const { error } = await db.storage
              .from(IMAGE_BUCKET)
              .upload(path, bytes, { contentType: type, upsert: true });
            if (error) return im;

            const { data } = db.storage.from(IMAGE_BUCKET).getPublicUrl(path);
            return { ...im, src: data.publicUrl };
          } catch {
            return im; // อัปโหลดไม่ได้ก็เก็บ data URL ไว้ในฐานข้อมูลไปก่อน
          }
        }),
      );
      return { ...s, board: { ...s.board, images } };
    }),
  );

  return { ...payload, sections };
}

export type SaveResult =
  | { ok: true; date: string; imagesUploaded: number }
  | { ok: false; reason: string };

export async function saveBrief(payload: PublishedFile): Promise<SaveResult> {
  const db = getSupabase();
  if (!db) {
    const status = supabaseStatus();
    return {
      ok: false,
      reason: status.missing.length
        ? `${status.hint} · ระหว่างนี้ใช้ปุ่ม "ส่งออก Brief (.json)" แล้ววางทับ src/data/published.json ได้`
        : "เชื่อมต่อ Supabase ไม่สำเร็จ",
    };
  }

  const date = payload.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, reason: "ไม่พบวันที่ของ brief" };
  }

  const before = countDataUrls(payload);
  const withUrls = await uploadImages(date, payload);
  const after = countDataUrls(withUrls);

  const { error } = await db.from("briefs").upsert(
    {
      date,
      date_label_th: withUrls.dateLabelTH ?? "",
      payload: withUrls,
      published_at: new Date().toISOString(),
    },
    { onConflict: "date" },
  );

  if (error) return { ok: false, reason: `บันทึกลงฐานข้อมูลไม่สำเร็จ: ${error.message}` };
  return { ok: true, date, imagesUploaded: before - after };
}

function countDataUrls(p: PublishedFile) {
  return (p.sections ?? []).reduce(
    (n, s) => n + (s.board?.images ?? []).filter((im) => im.src.startsWith("data:")).length,
    0,
  );
}
