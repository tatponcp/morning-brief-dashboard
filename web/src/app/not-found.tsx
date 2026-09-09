import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#22d3ee] to-[#a78bfa] text-ink-950">
          <Compass className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-bold text-white">ไม่พบหน้าที่ต้องการ</h1>
        <p className="mt-2 text-[14px] text-slate-400">
          ลิงก์อาจพิมพ์ผิด หรือ section นี้ถูกย้ายไปแล้ว
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#34f5a0] px-5 py-2.5 text-[13.5px] font-semibold text-ink-950 transition hover:brightness-110"
        >
          กลับไปหน้าสรุปภาพรวม
        </Link>
      </div>
    </main>
  );
}
