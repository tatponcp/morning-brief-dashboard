import { NextResponse, type NextRequest } from "next/server";
import { readStudioPassword, STUDIO_COOKIE, studioToken } from "@/lib/studio-auth";

/**
 * กั้น /studio ไม่ให้ลูกค้าเข้าถึง
 *
 * ตั้งรหัสผ่านที่ Vercel → Settings → Environment Variables → STUDIO_PASSWORD
 * (อย่าเขียนรหัสลงในโค้ด เพราะ repo เป็น public)
 *
 * ถ้าไม่ได้ตั้ง STUDIO_PASSWORD ไว้ ระบบจะปิด /studio ทั้งหมดบน production
 * — ปลอดภัยไว้ก่อน ดีกว่าเผลอเปิดทิ้งไว้
 */
export function middleware(req: NextRequest) {
  const password = readStudioPassword();

  // dev ในเครื่อง: เข้าได้เลย ไม่ต้องใส่รหัส
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  if (!password) {
    return new NextResponse(
      "ยังไม่ได้ตั้งค่า STUDIO_PASSWORD — /studio ถูกปิดไว้เพื่อความปลอดภัย",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  if (req.cookies.get(STUDIO_COOKIE)?.value === studioToken(password)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/studio-login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/studio", "/studio/:path*"],
};
