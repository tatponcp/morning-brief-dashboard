import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readStudioPassword, STUDIO_COOKIE, studioToken } from "./studio-auth";

/** ตรวจสิทธิ์ IC ด้วย cookie เดียวกับที่ใช้เข้า /studio — คืน response ถ้าไม่ผ่าน, null ถ้าผ่าน */
export async function guardStudio(): Promise<NextResponse | null> {
  if (process.env.NODE_ENV !== "production") return null;
  const password = readStudioPassword();
  if (!password) {
    return NextResponse.json({ ok: false, reason: "ยังไม่ได้ตั้ง STUDIO_PASSWORD" }, { status: 503 });
  }
  const jar = await cookies();
  if (jar.get(STUDIO_COOKIE)?.value !== studioToken(password)) {
    return NextResponse.json({ ok: false, reason: "ไม่มีสิทธิ์" }, { status: 401 });
  }
  return null;
}
