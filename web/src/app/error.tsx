"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // เก็บไว้ดูใน Vercel logs เวลามีคนเจอจริง
    console.error("[morning-brief]", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="panel max-w-md px-6 py-7">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-rose-neon/15 text-rose-neon">
          <TriangleAlert className="size-6" />
        </span>
        <h1 className="font-display text-xl font-bold text-white">หน้านี้โหลดไม่สำเร็จ</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-400">
          ข้อมูลบางส่วนอาจดึงไม่ได้ชั่วคราว ลองโหลดใหม่อีกครั้ง
          ถ้ายังไม่หายให้แจ้งผู้ดูแลระบบ
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-slate-600">รหัสอ้างอิง: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-neon to-green-neon px-5 py-2.5 text-[13.5px] font-semibold text-ink-950 transition hover:brightness-110"
        >
          <RefreshCw className="size-4" />
          ลองใหม่
        </button>
      </div>
    </main>
  );
}
