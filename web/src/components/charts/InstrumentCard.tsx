"use client";

import { useState } from "react";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { toneOf } from "@/lib/accent";
import type { Instrument } from "@/lib/types";
import { GlassTooltip, num, thaiShortDate, type TipProps } from "./chart-bits";

const RANGES = [
  { key: "1M", n: 22 },
  { key: "3M", n: 66 },
  { key: "1Y", n: Infinity },
] as const;

export function InstrumentCard({ inst }: { inst: Instrument }) {
  const [range, setRange] = useState<string>("3M");
  const n = RANGES.find((r) => r.key === range)?.n ?? Infinity;
  const rows = n === Infinity ? inst.rows : inst.rows.slice(-n);
  const t = toneOf(inst.tone);
  const up = inst.change >= 0;
  const digits = inst.digits ?? 2;

  return (
    <div
      className="panel flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5"
      style={{ borderColor: `${inst.color}33` }}
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl font-display text-[12px] font-bold"
          style={{ background: `${inst.color}1f`, color: inst.color }}
        >
          {inst.label.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold" style={{ color: inst.color }}>
            {inst.label}
          </p>
          <p className="truncate text-[11px] text-slate-500">{inst.sub}</p>
        </div>
        <div className="flex gap-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className="rounded px-1.5 py-0.5 text-[10.5px] transition"
              style={
                range === r.key
                  ? { background: `${inst.color}22`, color: inst.color }
                  : { color: "#64748b" }
              }
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-2">
        <p className="font-display text-[26px] leading-none font-bold text-white">
          {num(inst.value, digits)}
          {inst.suffix}
        </p>
        <p className={`mt-1 flex items-center gap-1 text-[12.5px] font-semibold ${t.text}`}>
          {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {up ? "+" : ""}
          {num(inst.change, digits)} ({up ? "+" : ""}
          {num(inst.changePct, 2)}%)
        </p>
      </div>

      <div className="mt-2 grow px-1">
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`inst-${inst.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={inst.color} stopOpacity={0.34} />
                <stop offset="100%" stopColor={inst.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis domain={["dataMin", "dataMax"]} hide />
            <Tooltip
              content={(p) => (
                <GlassTooltip {...(p as TipProps)} formatter={(_, v) => num(v, digits)} />
              )}
              cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "4 4" }}
            />
            <ReferenceLine y={inst.value} stroke={inst.color} strokeOpacity={0.3} strokeDasharray="3 6" />
            <Area
              type="monotone"
              dataKey="c"
              name={inst.label}
              stroke={inst.color}
              strokeWidth={1.9}
              fill={`url(#inst-${inst.id})`}
              isAnimationActive={false}
              activeDot={{ r: 3.5, fill: inst.color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {inst.note && (
        <p
          className="mx-3 mb-3 rounded-lg border px-3 py-2 text-center text-[12px]"
          style={{ borderColor: `${t.hex}44`, color: t.hex, background: `${t.hex}0f` }}
        >
          {inst.note}
        </p>
      )}

      <p className="px-4 pb-3 text-[10px] text-slate-600">
        {rows.length} จุด · ล่าสุด {thaiShortDate(rows.at(-1)?.t ?? "")}
      </p>
    </div>
  );
}
