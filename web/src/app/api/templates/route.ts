import { NextResponse } from "next/server";
import { guardStudio } from "@/lib/studio-guard";
import { saveTemplate } from "@/lib/templates-store";
import type { TextTemplate } from "@/lib/scenarios";

/** บันทึก / ลบ คำที่ IC ตั้งเองของหนึ่งสถานการณ์ */
export async function POST(req: Request) {
  const denied = await guardStudio();
  if (denied) return denied;

  let body: { key?: string; template?: TextTemplate | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  if (!body.key || !/^[a-z0-9-]+:[a-z0-9-]+$/.test(body.key)) {
    return NextResponse.json({ ok: false, reason: "ไม่พบสถานการณ์" }, { status: 400 });
  }
  const t = body.template;
  if (t && (!Array.isArray(t.summary) || typeof t.interpretation !== "string" || typeof t.insight !== "string")) {
    return NextResponse.json({ ok: false, reason: "ข้อความไม่ครบ" }, { status: 400 });
  }

  const result = await saveTemplate(body.key, t ?? null);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
