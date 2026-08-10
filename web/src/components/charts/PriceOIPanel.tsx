"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Layers } from "lucide-react";
import type { ContractSeries } from "@/lib/types";
import { AXIS, GlassTooltip, int, num, thaiShortDate, type TipProps } from "./chart-bits";

const RANGES = [
  { key: "1M", days: 22 },
  { key: "3M", days: 66 },
  { key: "ทั้งหมด", days: 9999 },
] as const;

export function PriceOIPanel({ series }: { series: ContractSeries }) {
  const [range, setRange] = useState<string>("3M");

  const rows = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? 9999;
    return series.rows.slice(-days);
  }, [series.rows, range]);

  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2] ?? last;
  const dPrice = last.close - prev.close;
  const dOI = last.oi - prev.oi;
  const up = dPrice >= 0;
  const oiUp = dOI >= 0;

  return (
    <div className="panel overflow-hidden">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/6 px-5 py-4">
        <h3 className="font-display text-xl font-bold text-[#34f5a0]">{series.symbol}</h3>
        <span className="rounded-lg bg-white/4 px-2.5 py-1 font-display text-lg font-bold text-[#ffc53d]">
          C: {num(last.close)}
        </span>
        <div className="ml-auto flex gap-1 rounded-lg border border-white/8 bg-white/3 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2.5 py-1 text-[11.5px] transition ${
                range === r.key
                  ? "bg-[#22d3ee]/16 text-[#22d3ee]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      {/* price */}
      <div className="px-2 pt-4">
        <div className="mb-1 flex items-center gap-2 px-3">
          <TrendingUp className="size-4 text-[#34f5a0]" />
          <span className="text-[12px] font-semibold tracking-wide text-slate-300">
            PRICE <span className="font-normal text-slate-500">(Daily)</span>
          </span>
          <span
            className={`ml-auto rounded-md px-2 py-0.5 text-[12px] font-semibold ${
              up ? "bg-[#34f5a0]/12 text-[#34f5a0]" : "bg-[#fb7185]/12 text-[#fb7185]"
            }`}
          >
            {up ? "+" : ""}
            {num(dPrice)} ({up ? "+" : ""}
            {num((dPrice / prev.close) * 100)}%)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
            <XAxis dataKey="t" tickFormatter={thaiShortDate} axisLine={AXIS} tickLine={false} minTickGap={40} />
            <YAxis
              orientation="right"
              domain={["dataMin - 15", "dataMax + 15"]}
              tickFormatter={(v) => int(v)}
              axisLine={false}
              tickLine={false}
              width={62}
            />
            <Tooltip
              content={(p) => (
                <GlassTooltip {...(p as TipProps)} formatter={(k, v) => (k === "close" ? num(v) : int(v))} />
              )}
              cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "4 4" }}
            />
            <ReferenceLine
              y={last.close}
              stroke="#ffc53d"
              strokeDasharray="5 5"
              strokeOpacity={0.6}
            />
            <Line
              type="monotone"
              dataKey="close"
              name="Close"
              stroke="#34f5a0"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#34f5a0" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* open interest */}
      <div className="px-2 pt-2 pb-4">
        <div className="mb-1 flex items-center gap-2 px-3">
          <Layers className="size-4 text-[#22d3ee]" />
          <span className="text-[12px] font-semibold tracking-wide text-slate-300">
            OPEN INTEREST
          </span>
          <span
            className={`ml-auto rounded-md px-2 py-0.5 text-[12px] font-semibold ${
              oiUp ? "bg-[#34f5a0]/12 text-[#34f5a0]" : "bg-[#fb7185]/12 text-[#fb7185]"
            }`}
          >
            {oiUp ? "+" : ""}
            {int(dOI)} ({oiUp ? "+" : ""}
            {num((dOI / prev.oi) * 100)}%)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`oi-${series.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
            <XAxis dataKey="t" tickFormatter={thaiShortDate} axisLine={AXIS} tickLine={false} minTickGap={40} />
            <YAxis
              orientation="right"
              tickFormatter={(v) => int(v)}
              axisLine={false}
              tickLine={false}
              width={62}
            />
            <Tooltip
              content={(p) => <GlassTooltip {...(p as TipProps)} formatter={(_, v) => int(v)} />}
              cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="oi"
              name="Open Interest"
              stroke="#22d3ee"
              strokeWidth={2}
              fill={`url(#oi-${series.symbol})`}
              activeDot={{ r: 4, fill: "#22d3ee" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* footer stats */}
      <div className="grid grid-cols-2 gap-px border-t border-white/6 bg-white/6">
        <Stat label="Close" value={num(last.close)} delta={`${up ? "+" : ""}${num(dPrice)} (${up ? "+" : ""}${num((dPrice / prev.close) * 100)}%)`} up={up} />
        <Stat label="Open Interest" value={int(last.oi)} delta={`${oiUp ? "+" : ""}${int(dOI)} (${oiUp ? "+" : ""}${num((dOI / prev.oi) * 100)}%)`} up={oiUp} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}) {
  return (
    <div className="bg-ink-900 px-5 py-4">
      <p className="text-[11.5px] text-slate-500">{label}</p>
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className={`text-[12.5px] font-semibold ${up ? "text-[#34f5a0]" : "text-[#fb7185]"}`}>
        {delta}
      </p>
    </div>
  );
}
