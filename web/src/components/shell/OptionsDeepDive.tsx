"use client";

import { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { ArrowUpRight, Box } from "lucide-react";

export const OPTIONS_DASHBOARD_URL = "https://s50-dashboard.vercel.app/";

const CHIPS = ["OI 3 มิติ", "Max Pain", "PCR", "IV", "Expected Range"];

/**
 * ปุ่มลิงก์ไปเว็บ S50 Options (OI รายสไตรค์เชิงลึก) — วางใต้ Global Macro ในเมนูซ้าย
 *
 * ออกแบบให้เด่นกว่าเมนูปกติ แต่ไม่แย่งสายตาจาก 6 ชุดข้อมูลหลัก:
 * แสงไฟตามเมาส์, การ์ดเอียงตามตำแหน่งเมาส์เล็กน้อย, แท่ง OI ขยับเบา ๆ
 * เปิดในแท็บใหม่ ลูกค้าจะได้ไม่หลุดออกจาก Morning Brief
 */
export function OptionsDeepDive({ collapsed }: { collapsed: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hover, setHover] = useState(false);

  // ตำแหน่งแสงไฟ (px ภายในการ์ด)
  const mx = useMotionValue(120);
  const my = useMotionValue(40);
  // มุมเอียง — ใช้ spring ให้นุ่ม ไม่กระตุกตามเมาส์
  const rx = useSpring(0, { stiffness: 220, damping: 18 });
  const ry = useSpring(0, { stiffness: 220, damping: 18 });

  const glow = useMotionTemplate`radial-gradient(180px circle at ${mx}px ${my}px, rgba(34,211,238,0.22), transparent 70%)`;

  function onMove(e: React.PointerEvent<HTMLAnchorElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    mx.set(x);
    my.set(y);
    ry.set(((x / r.width) - 0.5) * 8);
    rx.set(-((y / r.height) - 0.5) * 8);
  }

  function onLeave() {
    setHover(false);
    rx.set(0);
    ry.set(0);
  }

  /* ---------- ตอนย่อเมนู: เหลือไอคอนเรืองแสง + tooltip ---------- */
  if (collapsed) {
    return (
      <a
        href={OPTIONS_DASHBOARD_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="เปิด S50 Options Dashboard — Open Interest รายสไตรค์เชิงลึก (แท็บใหม่)"
        className="group relative mx-auto mt-3 grid size-11 place-items-center rounded-xl border border-cyan-neon/40 bg-gradient-to-br from-cyan-neon/20 to-violet-neon/20 text-cyan-neon shadow-[0_0_24px_-6px_rgba(34,211,238,0.7)] transition hover:scale-105"
      >
        <span className="absolute inset-0 animate-ping rounded-xl border border-cyan-neon/30 [animation-duration:2.6s]" />
        <Box className="size-5" />
        <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg border border-white/10 bg-ink-800 px-3 py-1.5 text-[12px] text-white shadow-xl group-hover:block">
          S50 Options · OI เชิงลึก ↗
        </span>
      </a>
    );
  }

  /* ---------- ตอนกางเมนู: การ์ดเต็ม ---------- */
  return (
    <div className="px-3 pt-3" style={{ perspective: 700 }}>
      <p className="px-1 pb-1.5 text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
        เจาะลึกเพิ่มเติม
      </p>

      <motion.a
        ref={ref}
        href={OPTIONS_DASHBOARD_URL}
        target="_blank"
        rel="noopener noreferrer"
        onPointerEnter={() => setHover(true)}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        whileTap={{ scale: 0.97 }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        aria-label="เปิด S50 Options Dashboard — Open Interest รายสไตรค์เชิงลึก (แท็บใหม่)"
        className="group relative block overflow-hidden rounded-2xl p-px"
      >
        {/* ขอบไล่สีหมุนรอบการ์ด */}
        <span
          aria-hidden
          className="absolute inset-[-60%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,var(--c-cyan),var(--c-violet),var(--c-rose),var(--c-amber),var(--c-green),var(--c-cyan))] opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        />

        <span className="relative block overflow-hidden rounded-[15px] bg-ink-900/95 px-3 py-2.5">
          {/* แสงไฟตามเมาส์ */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{ background: glow, opacity: hover ? 1 : 0 }}
          />

          {/* หัวการ์ด */}
          <span className="relative flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-neon to-violet-neon text-ink-950 shadow-[0_0_20px_-4px_rgba(34,211,238,0.8)]">
              <Box className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate font-display text-[13.5px] font-bold text-white">
                  S50 Options
                </span>
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-neon opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-green-neon" />
                </span>
              </span>
              <span className="block truncate text-[11px] text-slate-400">
                OI รายสไตรค์ · อัปเดตทุกเย็น
              </span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-slate-500 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-neon" />
          </span>

          {/* แท่ง OI จำลอง Call / Put — ขยับเมื่อ hover */}
          <span aria-hidden className="relative mt-2 flex h-7 items-end justify-center gap-[3px] [@media(max-height:860px)]:hidden">
            <span className="absolute top-0 left-0 text-[8.5px] leading-none text-green-neon/80">Call</span>
            <span className="absolute top-0 right-0 text-[8.5px] leading-none text-rose-neon/80">Put</span>
            {[
              [30, 18],
              [46, 26],
              [62, 40],
              [88, 58],
              [100, 92],
              [70, 100],
              [48, 74],
              [32, 50],
              [20, 34],
            ].map(([call, put], i) => (
              <span key={i} className="flex h-full items-end gap-px">
                <motion.span
                  className="w-[5px] rounded-t-sm bg-green-neon/80"
                  animate={{ height: `${hover ? call : call * 0.55}%` }}
                  transition={{ type: "spring", stiffness: 180, damping: 16, delay: i * 0.025 }}
                />
                <motion.span
                  className="w-[5px] rounded-t-sm bg-rose-neon/80"
                  animate={{ height: `${hover ? put : put * 0.55}%` }}
                  transition={{ type: "spring", stiffness: 180, damping: 16, delay: i * 0.025 + 0.02 }}
                />
              </span>
            ))}
          </span>

          {/* สิ่งที่มีในเว็บปลายทาง */}
          <span className="relative mt-2 flex flex-wrap gap-1">
            {CHIPS.map((c, i) => (
              <motion.span
                key={c}
                animate={{ y: hover ? -1 : 0, opacity: hover ? 1 : 0.75 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-md border border-white/10 bg-white/4 px-1.5 py-0.5 text-[10px] text-slate-300"
              >
                {c}
              </motion.span>
            ))}
          </span>

          {/* ปุ่มเรียกให้กด */}
          <span className="relative mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-neon to-violet-neon py-1.5 text-[12px] font-semibold text-ink-950 transition group-hover:brightness-110">
            เปิดดู OI เชิงลึก
            <ArrowUpRight className="size-3.5" />
          </span>
        </span>
      </motion.a>
    </div>
  );
}
