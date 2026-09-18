import Link from "next/link";
import { ArrowLeft, BarChart3, FlaskConical, TriangleAlert } from "lucide-react";
import { loadBrief } from "@/lib/brief-store";
import { loadHistory, loadPriceSources } from "@/lib/signal-log";
import { evaluate, summarize, FLAT_PCT, type Stat } from "@/lib/signal-eval";
import { RULES_VERSION } from "@/lib/signal-forms";
import { thaiDate } from "@/lib/format";
import { LogActions } from "./LogActions";

export const metadata = { title: "บันทึกสัญญาณ · IC Studio", robots: { index: false } };
export const dynamic = "force-dynamic";

/** ต้องมีอย่างน้อยเท่านี้ก่อนจะเริ่มเชื่อตัวเลขความแม่น */
const MIN_DAYS = 20;

export default async function SignalLogPage() {
  const [{ brief }, history] = await Promise.all([loadBrief(), loadHistory()]);
  const flows = brief.sections.find((s) => s.id === "flows")?.flows;
  const sources = await loadPriceSources(flows);
  const rows = evaluate(history, sources);
  const sections = brief.sections.map((s) => ({ id: s.id, title: `${s.index} · ${s.title}` }));
  const sum = summarize(rows, sections);
  const enough = sum.overall.n >= MIN_DAYS;

  return (
    <div className="space-y-4 pb-10">
      <div className="panel flex flex-wrap items-center gap-3 px-5 py-4">
        <Link href="/studio" className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white" aria-label="กลับ Studio">
          <ArrowLeft className="size-4" />
        </Link>
        <span className="grid size-10 place-items-center rounded-2xl bg-violet-neon/15 text-violet-neon">
          <FlaskConical className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-[20px] font-bold text-white">บันทึกสัญญาณ &amp; ความแม่น</h1>
          <p className="text-[12.5px] text-slate-400">
            เห็นเฉพาะทีม IC · กติกาปัจจุบัน {RULES_VERSION} · เผยแพร่แล้ว {rows.length} วัน
          </p>
        </div>
        <LogActions rows={rows} sections={sections} />
      </div>

      {!enough && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-neon/30 bg-amber-neon/8 px-4 py-3 text-[13.5px] text-amber-neon">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          วัดผลได้แล้ว {sum.overall.n} วัน — ควรมีอย่างน้อย {MIN_DAYS} วันก่อนเชื่อตัวเลขความแม่น (ประมาณ 1 เดือนทำการ)
          ช่วงนี้ใช้ดูแนวโน้มคร่าว ๆ และเช็กว่าข้อมูลเข้าครบทุกวัน
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Big stat={sum.overall} note="คะแนนรวม 6 ข้อ เทียบทิศ S50 วันนั้น" />
        <Big stat={sum.exMacro} note="ไม่นับข้อ 6 (ข้อ 6 ตีความเป็นทองคำ)" />
        <div className="panel px-5 py-4">
          <p className="text-[12.5px] text-slate-400">รอผล</p>
          <p className="font-display text-[34px] leading-tight font-bold text-slate-200">{sum.pending} วัน</p>
          <p className="text-[12px] text-slate-500">ยังไม่มีราคาปิดของวันนั้น หรือยังไม่ได้เลือกสัญญาณ</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <StatTable title="แยกตามเกณฑ์ภาพรวม" rows={sum.byBand} />
        <StatTable title="แยกตามข้อ (ทิศที่ข้อนั้นชี้ vs ทิศ S50)" rows={sum.bySection} />
      </div>

      <div className="panel overflow-x-auto">
        <p className="flex items-center gap-2 px-5 pt-4 text-[14px] font-semibold text-slate-200">
          <BarChart3 className="size-4 text-cyan-neon" />
          รายวัน
        </p>
        <table className="mt-2 w-full min-w-[860px] text-[13px]">
          <thead className="text-left text-[12px] text-slate-500">
            <tr className="border-b border-white/6">
              <th className="px-5 py-2 font-normal">วันที่</th>
              <th className="px-2 py-2 font-normal">ภาพรวม</th>
              {sections.map((s) => (
                <th key={s.id} className="px-2 py-2 text-center font-normal">
                  ข้อ {s.title.split(" · ")[0]}
                </th>
              ))}
              <th className="px-2 py-2 text-right font-normal">S50 วันนั้น</th>
              <th className="px-2 py-2 text-center font-normal">ผล</th>
              <th className="px-5 py-2 font-normal">แหล่งราคา / กติกา</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((r) => (
              <tr key={r.date} className="border-b border-white/4 hover:bg-white/2">
                <td className="px-5 py-2 whitespace-nowrap text-slate-200">{thaiDate(r.date)}</td>
                <td className="px-2 py-2 whitespace-nowrap">
                  {r.overall === null ? (
                    <span className="text-slate-600">—</span>
                  ) : (
                    <span className="font-semibold text-white">
                      {r.overall}% <span className="font-normal text-slate-400">{r.band?.label}</span>
                    </span>
                  )}
                </td>
                {sections.map((s) => (
                  <td key={s.id} className="px-2 py-2 text-center text-slate-300">
                    {r.scores[s.id] ?? <span className="text-slate-600">—</span>}
                  </td>
                ))}
                <td className={`px-2 py-2 text-right font-semibold ${r.ret === null ? "text-slate-600" : r.ret > 0 ? "text-green-neon" : r.ret < 0 ? "text-rose-neon" : "text-slate-300"}`}>
                  {r.ret === null ? "รอ" : `${r.ret > 0 ? "+" : ""}${r.ret.toFixed(2)}%`}
                </td>
                <td className="px-2 py-2 text-center">
                  {r.hit === null ? <span className="text-slate-600">รอ</span> : r.hit ? <span className="text-green-neon">ถูก</span> : <span className="text-rose-neon">พลาด</span>}
                </td>
                <td className="px-5 py-2 text-[12px] whitespace-nowrap text-slate-500">
                  {r.source ?? "—"} · {r.rules ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel space-y-1.5 px-5 py-4 text-[13px] leading-relaxed text-slate-400">
        <p className="font-semibold text-slate-200">วิธีวัดผล</p>
        <p>
          Brief ของวันไหน วัดกับ S50 ของวันนั้น (ราคาปิดวันนั้นเทียบวันทำการก่อนหน้า) เพราะเผยแพร่ช่วงเช้าก่อนตลาดเปิด
        </p>
        <p>
          ภาพรวม ≥ 60% ถือว่าชี้ขึ้น · ≤ 40% ชี้ลง · 40–60% ชี้แกว่ง (ถูกเมื่อ S50 ขยับไม่เกิน ±{FLAT_PCT}%)
        </p>
        <p>
          ราคาใช้ราคาปิดสัญญา S50 จากชีตข้อ 2 ก่อน วันที่ชีตยังไม่มีใช้ SET50 ที่ระบบจดอัตโนมัติทุกวันทำการ 18:00 น.
          ราคาของวันนั้นกับวันก่อนมาจากแหล่งเดียวกันเสมอ
        </p>
        <p>วันที่เผยแพร่ก่อนมีตราประทับเวอร์ชัน คะแนนคิดจากสถานการณ์ที่บันทึกไว้ในวันนั้น</p>
      </div>
    </div>
  );
}

function Big({ stat, note }: { stat: Stat; note: string }) {
  return (
    <div className="panel px-5 py-4">
      <p className="text-[12.5px] text-slate-400">{stat.label}</p>
      <p className="font-display text-[34px] leading-tight font-bold text-white">
        {stat.rate === null ? "—" : `${stat.rate}%`}
        <span className="ml-2 text-[14px] font-normal text-slate-400">
          ถูก {stat.hits}/{stat.n} วัน
        </span>
      </p>
      <p className="text-[12px] text-slate-500">{note}</p>
    </div>
  );
}

function StatTable({ title, rows }: { title: string; rows: Stat[] }) {
  return (
    <div className="panel px-5 py-4">
      <p className="mb-2 text-[14px] font-semibold text-slate-200">{title}</p>
      <table className="w-full text-[13px]">
        <thead className="text-left text-[12px] text-slate-500">
          <tr>
            <th className="py-1 font-normal" />
            <th className="py-1 text-right font-normal">วัน</th>
            <th className="py-1 text-right font-normal">ถูก</th>
            <th className="py-1 text-right font-normal">S50 เฉลี่ย</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-white/4">
              <td className="py-1.5 text-slate-300">{r.label}</td>
              <td className="py-1.5 text-right text-slate-400">{r.n}</td>
              <td className="py-1.5 text-right font-semibold text-white">{r.rate === null ? "—" : `${r.rate}%`}</td>
              <td className="py-1.5 text-right text-slate-400">
                {r.avgRet === null ? "—" : `${r.avgRet > 0 ? "+" : ""}${r.avgRet.toFixed(2)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
