import { CheckCircle2, Lightbulb, MessageSquareText, Zap } from "lucide-react";
import { toneOf } from "@/lib/accent";
import type { Narrative } from "@/lib/types";
import { Reveal } from "./Reveal";

/** บล็อกมาตรฐาน 3 ช่อง: สรุปสั้น / แปลความ / Action วันนี้ + แถบ Insight */
export function NarrativeGrid({ n }: { n: Narrative }) {
  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal>
          <Card
            title="สรุปสั้น"
            step="1"
            color="#22d3ee"
            icon={<CheckCircle2 className="size-5" />}
          >
            <ul className="space-y-3">
              {n.summary.map((s, i) => (
                <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed text-slate-200">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#22d3ee]" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card
            title="แปลความ"
            step="2"
            color="#a78bfa"
            icon={<MessageSquareText className="size-5" />}
          >
            <p className="text-[14.5px] leading-[1.9] text-slate-200">{n.interpretation}</p>
          </Card>
        </Reveal>

        <Reveal delay={0.16}>
          <Card title="Action วันนี้" step="3" color="#ffc53d" icon={<Zap className="size-5" />}>
            <ul className="space-y-2.5">
              {n.actions.map((a, i) => {
                const t = toneOf(a.tone);
                return (
                  <li
                    key={i}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg border border-white/6 bg-white/2 px-3 py-2"
                  >
                    <span className="text-[12.5px] text-slate-400">{a.label}:</span>
                    <span className={`text-[14px] font-semibold ${t.text}`}>{a.value}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.2}>
        <div className="relative overflow-hidden rounded-2xl border border-[#22d3ee]/25 bg-gradient-to-r from-[#22d3ee]/10 via-transparent to-[#a78bfa]/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#ffc53d]/15 text-[#ffc53d]">
              <Lightbulb className="size-5" />
            </span>
            <p className="text-[15px] leading-snug text-slate-100">
              <span className="font-display font-bold text-[#22d3ee]">Insight: </span>
              {n.insight}
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Card({
  title,
  step,
  color,
  icon,
  children,
}: {
  title: string;
  step: string;
  color: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="panel h-full px-5 py-5 transition duration-300 hover:-translate-y-0.5"
      style={{ borderColor: `${color}33` }}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className="grid size-9 place-items-center rounded-xl"
          style={{ background: `${color}1f`, color }}
        >
          {icon}
        </span>
        <h3 className="font-display text-[17px] font-bold" style={{ color }}>
          <span className="mr-1.5 opacity-50">{step}</span>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
