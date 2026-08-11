import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { STUDIO_COOKIE, studioToken } from "@/lib/studio-auth";

export const metadata = { title: "เข้าสู่ IC Studio" };

async function login(formData: FormData) {
  "use server";

  const password = process.env.STUDIO_PASSWORD;
  const input = String(formData.get("password") ?? "");
  const next = String(formData.get("next") || "/studio");

  if (!password || input !== password) {
    redirect(`/studio-login?error=1&next=${encodeURIComponent(next)}`);
  }

  const jar = await cookies();
  jar.set(STUDIO_COOKIE, studioToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 ชั่วโมง — หมดอายุทุกวัน
  });

  redirect(next.startsWith("/") ? next : "/studio");
}

export default async function StudioLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="panel w-full max-w-sm px-6 py-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#ffc53d]/15 text-[#ffc53d] ring-glow-amber">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold text-white">IC Studio</h1>
            <p className="text-[12px] text-slate-500">เฉพาะผู้ทำสัญญาณเท่านั้น</p>
          </div>
        </div>

        <form action={login} className="space-y-3">
          <input type="hidden" name="next" value={sp.next ?? "/studio"} />
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] text-slate-400">รหัสผ่าน</span>
            <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-ink-950/60 px-3 focus-within:border-[#ffc53d]/60">
              <KeyRound className="size-4 shrink-0 text-slate-500" />
              <input
                name="password"
                type="password"
                autoFocus
                required
                className="w-full bg-transparent py-2.5 text-[14px] text-white outline-none"
              />
            </div>
          </label>

          {sp.error && (
            <p className="rounded-lg border border-[#fb7185]/30 bg-[#fb7185]/10 px-3 py-2 text-[12.5px] text-[#fb7185]">
              รหัสผ่านไม่ถูกต้อง
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-[#ffc53d] to-[#fb923c] py-2.5 text-[14px] font-semibold text-ink-950 transition hover:brightness-110"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <a
          href="/"
          className="mt-4 block text-center text-[12.5px] text-slate-500 transition hover:text-slate-300"
        >
          ← กลับไปหน้า Dashboard
        </a>
      </div>
    </main>
  );
}
