import { ArrowDown, ArrowUp, Layers } from "lucide-react";
import { toneOf } from "@/lib/accent";
import type { SeriesRead } from "@/lib/types";
import { Reveal } from "./Reveal";

const BIAS_LABEL = { bull: "บวก", neutral: "กลาง", bear: "ลบ" } as const;

/**
 * ข้อ 1 ที่มีหลาย series (เช่นช่วงย้ายสัญญา) — การ์ดเทียบกันทีละ series
 * ลูกค้าเห็นทันทีว่าแต่ละสัญญาไปทางไหน และตัวไหนคือตัวหลัก
 * big = ขนาดสำหรับรูปส่งลูกค้า
 */
export function SeriesBreakdown({ reads, big = false }: { reads: SeriesRead[]; big?: boolean }) {
  const agree = reads.every((r) => r.bias === reads[0].bias);

  return (
    <div className={big ? "space-y-2.5" : "mt-3 space-y-2"}>
      <p className={`flex items-center gap-1.5 text-slate-400 ${big ? "text-[15px]" : "text-[12.5px]"}`}>
        <Layers className={big ? "size-4.5" : "size-3.5"} />
        อ่านแยกทีละ series ·{" "}
        <span className={agree ? "text-green-neon" : "text-amber-neon"}>
          {agree ? "ทุก series ไปทางเดียวกัน" : "series ไปคนละทาง ใช้ตัวหลักเป็นเกณฑ์"}
        </span>
      </p>
      <div className={`grid gap-2 ${reads.length > 1 ? "sm:grid-cols-2" : ""} ${big ? "grid-cols-2 gap-2.5" : ""}`}>
        {reads.map((r, i) => {
          const t = toneOf(r.bias);
          const card = (
            <div
              className={`relative overflow-hidden rounded-2xl border ${big ? "px-4 py-3.5" : "px-3.5 py-3"} transition-transform duration-300 hover:-translate-y-0.5`}
              style={{
                borderColor: `color-mix(in srgb, ${t.hex} ${i === 0 ? 45 : 28}%, transparent)`,
                background: `color-mix(in srgb, ${t.hex} ${i === 0 ? 10 : 6}%, transparent)`,
              }}
            >
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: t.hex, opacity: i === 0 ? 1 : 0.5 }} />
              <div className="flex items-center gap-2">
                <span className={`font-display font-bold text-white ${big ? "text-[19px]" : "text-[15.5px]"}`}>{r.series}</span>
                {i === 0 && (
                  <span className="rounded-md bg-cyan-neon/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-cyan-neon">ตัวหลัก</span>
                )}
                <span className={`ml-auto rounded-full px-2 py-0.5 font-semibold ${t.bg} ${t.text} ${big ? "text-[13px]" : "text-[11.5px]"}`}>
                  {r.score}% · {BIAS_LABEL[r.bias]}
                </span>
              </div>
              <div className={`mt-2 flex flex-wrap gap-1.5 ${big ? "text-[14.5px]" : "text-[12.5px]"}`}>
                <Move label="ราคา" up={r.price === "up"} good={r.price === "up"} text={r.price === "up" ? "ขึ้น" : "ลง"} />
                <Move label="OI" up={r.oi === "up"} good={null} text={r.oi === "up" ? "เพิ่ม" : "ลด"} />
              </div>
              <p className={`mt-1.5 text-slate-300 ${big ? "text-[14.5px]" : "text-[12.5px]"}`}>
                <span className={`font-semibold ${t.text}`}>{r.tag}</span>
              </p>
            </div>
          );
          return big ? (
            <div key={r.series}>{card}</div>
          ) : (
            <Reveal key={r.series} delay={0.05 + i * 0.06}>
              {card}
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

function Move({ label, up, good, text }: { label: string; up: boolean; good: boolean | null; text: string }) {
  const cls = good === null ? "text-slate-100" : good ? "text-green-neon" : "text-rose-neon";
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-ink-950/40 px-2 py-1">
      <span className="text-slate-400">{label}</span>
      <Icon className={`size-3.5 ${cls}`} />
      <span className={`font-semibold ${cls}`}>{text}</span>
    </span>
  );
}
