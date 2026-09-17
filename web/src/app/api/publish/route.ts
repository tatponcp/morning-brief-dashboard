import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { saveBrief } from "@/lib/brief-store";
import { guardStudio } from "@/lib/studio-guard";
import type { PublishedFile } from "@/lib/merge-brief";

/** เผยแพร่ Brief ขึ้นเว็บทันที — เรียกจากปุ่มใน /studio */
export async function POST(req: Request) {
  const denied = await guardStudio();
  if (denied) return denied;

  let payload: PublishedFile;
  try {
    payload = (await req.json()) as PublishedFile;
  } catch {
    return NextResponse.json({ ok: false, reason: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (!payload?.sections?.length) {
    return NextResponse.json({ ok: false, reason: "ไม่มีข้อมูล section" }, { status: 400 });
  }

  const result = await saveBrief(payload);
  if (!result.ok) return NextResponse.json(result, { status: 400 });

  // ล้าง cache ให้ลูกค้าเห็นของใหม่ทันที ไม่ต้องรอ ISR
  for (const path of ["/", "/s50-oi", "/flows", "/usd-futures", "/confirm", "/breadth", "/macro"]) {
    revalidatePath(path);
  }

  return NextResponse.json(result);
}
