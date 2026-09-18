import { NextResponse } from "next/server";
import { guardStudio } from "@/lib/studio-guard";
import { recordSet50Close } from "@/lib/signal-log";

export const dynamic = "force-dynamic";

/**
 * จดราคาปิด SET50 ทุกวันทำการ 18:00 น. (ตั้งเวลาใน vercel.json)
 * รับได้ 2 ทาง: cron ของ Vercel หรือ IC ที่ล็อกอิน Studio กดเองจากหน้าบันทึกสัญญาณ
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const fromCron = secret
    ? req.headers.get("authorization") === `Bearer ${secret}`
    : (req.headers.get("user-agent") ?? "").startsWith("vercel-cron");
  if (!fromCron) {
    const denied = await guardStudio();
    if (denied) return denied;
  }
  const result = await recordSet50Close();
  return NextResponse.json(result, { status: result.ok ? 200 : 202 });
}
