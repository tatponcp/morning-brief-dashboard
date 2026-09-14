"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Layers, TrendingUp } from "lucide-react";
import type { ContractSeries } from "@/lib/types";
import { thaiDate } from "@/lib/format";
import { AXIS, GlassTooltip, int, num, thaiShortDate, type TipProps } from "./chart-bits";

const RANGES = [
  { key: "1M", days: 22 },
  { key: "3M", days: 66 },
  { key: "ทั้งหมด", days: 9999 },
] as const;

type Key = "close" | "oi";

/** ตัวเลขทั้งหมดคิดจากข้อมูลจริงในชีต: เทียบวันก่อน = แถวสุดท้ายกับแถวก่อนหน้า, ในช่วง = แถวสุดท้ายกับแถวแรกของช่วงที่เลือก */
function stats(rows: ContractSeries["rows"], key: Key) {
  const last = rows[rows.length - 1][key];
  const prev = (rows[rows.length - 2] ?? rows[rows.length - 1])[key];
  const first = rows[0][key];
  const values = rows.map((r) => r[key]);
  return {
    last,
    day: last - prev,
    dayPct: prev ? ((last - prev) / prev) * 100 : 0,
    period: last - first,
    periodPct: first ? ((last - first) / first) * 100 : 0,
    high: Math.max(...values),
    low: Math.min(...values),
  };
}

const signed = (v: number, f: (n: number) => string) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${f(Math.abs(v))}`;

export function PriceOIPanel({ series }: { series: ContractSeries }) {
  const [range, setRange] = useState<string>("3M");

  const rows = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? 9999;
    return series.rows.slice(-days);
  }, [series.rows, range]);

  const price = stats(rows, "close");
  const oi = stats(rows, "oi");
  const lastDate = rows[rows.length - 1].t;
  const rangeLabel = range === "ทั้งหมด" ? `ตั้งแต่ ${thaiShortDate(rows[0].t)}` : range;

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/6 px-5 py-3">
        <h3 className="font-display text-xl font-bold text-green-neon">{series.symbol}</h3>
        <span className="text-[12px] text-slate-500">
          ข้อมูลรายวัน · ล่าสุด {thaiDate(lastDate)} · {rows.length} วันทำการ
        </span>
        <div data-export-hide className="ml-auto flex gap-1 rounded-lg border border-white/8 bg-white/3 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2.5 py-1 text-[11.5px] transition ${
                range === r.key ? "bg-cyan-neon/16 text-cyan-neon" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      <div data-share-cols="2" className="grid divide-y divide-white/6 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <Half
          icon={<TrendingUp className="size-4" />}
          title="Price"
          unit="จุด"
          color="var(--c-green)"
          gradientId={`px-${series.symbol}`}
          rows={rows}
          dataKey="close"
          s={price}
          fmt={num}
          axisFmt={(v) => int(v)}
          rangeLabel={rangeLabel}
          refLast
        />
        <Half
          icon={<Layers className="size-4" />}
          title="Open Interest"
          unit="สัญญา"
          color="var(--c-cyan)"
          gradientId={`oi-${series.symbol}`}
          rows={rows}
          dataKey="oi"
          s={oi}
          fmt={int}
          axisFmt={(v) => `${Math.round(v / 1000)}K`}
          rangeLabel={rangeLabel}
        />
      </div>
    </div>
  );
}

function Half({
  icon,
  title,
  unit,
  color,
  gradientId,
  rows,
  dataKey,
  s,
  fmt,
  axisFmt,
  rangeLabel,
  refLast,
}: {
  icon: React.ReactNode;
  title: string;
  unit: string;
  color: string;
  gradientId: string;
  rows: ContractSeries["rows"];
  dataKey: Key;
  s: ReturnType<typeof stats>;
  fmt: (n: number) => string;
  axisFmt: (n: number) => string;
  rangeLabel: string;
  refLast?: boolean;
}) {
  const pad = (s.high - s.low) * 0.12 || s.last * 0.01;

  return (
    <div className="min-w-0 px-2 pt-4 pb-3">
      <div className="px-3">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-slate-300" style={{ color }}>
          {icon}
          <span className="uppercase">{title}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <p className="font-display text-[28px] leading-none font-bold text-white">{fmt(s.last)}</p>
          <span className="text-[11.5px] text-slate-500">{unit}</span>
          <Delta value={s.day} pct={s.dayPct} fmt={fmt} label="เทียบวันก่อน" />
          <span className="text-[11px] text-slate-500">จากวันก่อน</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <AreaChart data={rows} margin={{ top: 14, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="t" tickFormatter={thaiShortDate} axisLine={AXIS} tickLine={false} minTickGap={36} />
          <YAxis
            orientation="right"
            domain={[s.low - pad, s.high + pad]}
            tickCount={5}
            tickFormatter={axisFmt}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <Tooltip
            content={(p) => <GlassTooltip {...(p as TipProps)} formatter={(_, v) => fmt(v)} />}
            cursor={{ stroke: "var(--c-cursor)", strokeDasharray: "4 4" }}
          />
          {refLast && (
            <ReferenceLine y={s.last} stroke="var(--c-amber)" strokeDasharray="5 5" strokeOpacity={0.55} />
          )}
          <Area
            type="monotone"
            dataKey={dataKey}
            name={title}
            baseValue="dataMin"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <dl className="mx-3 mt-1 grid grid-cols-3 gap-2 rounded-lg border border-white/6 bg-white/2 px-3 py-2 text-[11px]">
        <div className="min-w-0">
          <dt className="text-slate-500">สูงสุด ({rangeLabel})</dt>
          <dd className="font-semibold text-slate-200">{fmt(s.high)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">ต่ำสุด</dt>
          <dd className="font-semibold text-slate-200">{fmt(s.low)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">เปลี่ยนในช่วง</dt>
          <dd className={`font-semibold ${tone(s.period)}`}>
            {signed(s.period, fmt)} ({signed(s.periodPct, num)}%)
          </dd>
        </div>
      </dl>
    </div>
  );
}

const tone = (v: number) => (v > 0 ? "text-green-neon" : v < 0 ? "text-rose-neon" : "text-slate-300");

function Delta({ value, pct, fmt, label }: { value: number; pct: number; fmt: (n: number) => string; label: string }) {
  const bg = value > 0 ? "bg-green-neon/12" : value < 0 ? "bg-rose-neon/12" : "bg-white/6";
  return (
    <span title={label} className={`rounded-md px-2 py-0.5 text-[12px] font-semibold ${bg} ${tone(value)}`}>
      {signed(value, fmt)} ({signed(pct, num)}%)
    </span>
  );
}
