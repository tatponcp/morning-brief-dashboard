"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toneOf } from "@/lib/accent";
import type { Pane, PaneGroup, PaneRow } from "@/lib/types";
import { AXIS, GlassTooltip, num, thaiShortDate, type TipProps } from "./chart-bits";

const RANGES = [
  { key: "1M", n: 22 },
  { key: "3M", n: 66 },
  { key: "6M", n: 130 },
  { key: "ทั้งหมด", n: Infinity },
] as const;

export function PaneGroupCard({ group }: { group: PaneGroup }) {
  const [range, setRange] = useState<string>("3M");
  const n = RANGES.find((r) => r.key === range)?.n ?? Infinity;
  const accent = group.accentHex ?? "#38bdf8";

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/6 px-5 py-4">
        <div className="min-w-0">
          <h3 className="font-display text-[17px] font-bold" style={{ color: accent }}>
            {group.title}
          </h3>
          {group.subtitle && (
            <p className="text-[12px] text-slate-500">{group.subtitle}</p>
          )}
        </div>
        <div className="ml-auto flex gap-1 rounded-lg border border-white/8 bg-white/3 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className="rounded-md px-2.5 py-1 text-[11.5px] transition"
              style={
                range === r.key
                  ? { background: `${accent}26`, color: accent }
                  : { color: "#94a3b8" }
              }
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-white/6">
        {group.panes.map((p) => (
          <PaneChart key={p.id} pane={p} take={n} />
        ))}
      </div>

      {!!group.footer?.length && (
        <div className="grid gap-px border-t border-white/6 bg-white/6 sm:grid-cols-3">
          {group.footer.map((f, i) => {
            const t = toneOf(f.tone);
            return (
              <div key={i} className="bg-ink-900 px-4 py-3.5">
                <p className="truncate text-[11.5px] text-slate-500">{f.label}</p>
                <p className={`font-display text-lg font-bold ${t.text}`}>{f.value}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaneChart({ pane, take }: { pane: Pane; take: number }) {
  const rows = useMemo(
    () => (take === Infinity ? pane.rows : pane.rows.slice(-take)),
    [pane.rows, take],
  );
  const digits = pane.digits ?? 2;
  const last = rows[rows.length - 1];
  const lastValue =
    pane.kind === "candle"
      ? (last?.c as number)
      : (last?.[pane.series[0]?.key] as number | undefined);

  // ให้แท่งเทียนมีช่วงแกน Y ครอบ high/low พอดี
  const domain = useMemo<[number | string, number | string]>(() => {
    if (pane.kind !== "candle") return ["auto", "auto"];
    let lo = Infinity;
    let hi = -Infinity;
    for (const r of rows) {
      lo = Math.min(lo, r.l as number);
      hi = Math.max(hi, r.h as number);
    }
    const pad = (hi - lo) * 0.06 || 1;
    return [lo - pad, hi + pad];
  }, [rows, pane.kind]);

  const data = useMemo(
    () =>
      pane.kind === "candle"
        ? rows.map((r) => ({ ...r, _wick: [r.l as number, r.h as number] }))
        : rows,
    [rows, pane.kind],
  );

  return (
    <div className="px-2 py-3">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3">
        <span className="text-[12.5px] font-semibold text-slate-200">{pane.title}</span>
        {pane.note && <span className="text-[11.5px] text-slate-500">{pane.note}</span>}
        {pane.lastBadge !== false && lastValue !== undefined && (
          <span
            className="ml-auto rounded-md px-2 py-0.5 font-display text-[12.5px] font-bold"
            style={{
              background: `${pane.series[0]?.color ?? "#22d3ee"}1f`,
              color: pane.series[0]?.color ?? "#22d3ee",
            }}
          >
            {num(lastValue, digits)}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={pane.height ?? 170}>
        {/* _wick เก็บช่วง [low, high] ให้ Recharts คำนวณตำแหน่งแท่งเทียนให้ */}
        <ComposedChart
          data={data as unknown as PaneRow[]}
          margin={{ top: 6, right: 10, bottom: 0, left: 0 }}
        >
          <defs>
            {pane.series
              .filter((s) => s.fill)
              .map((s) => (
                <linearGradient key={s.key} id={`g-${pane.id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.38} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
          </defs>

          <CartesianGrid stroke="rgba(148,163,184,0.07)" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={(v: string) => (v.includes("T") ? v.split("T")[1] : thaiShortDate(v))}
            axisLine={AXIS}
            tickLine={false}
            minTickGap={44}
          />
          <YAxis
            orientation="right"
            domain={domain}
            tickFormatter={(v: number) => num(v, digits === 0 ? 0 : v >= 1000 ? 0 : digits)}
            axisLine={false}
            tickLine={false}
            width={66}
          />
          <Tooltip
            content={(p) => (
              <GlassTooltip {...(p as TipProps)} formatter={(_, v) => num(v, digits)} />
            )}
            cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "4 4" }}
          />

          {pane.zeroLine && <ReferenceLine y={0} stroke="rgba(255,255,255,0.32)" />}
          {pane.refLines?.map((r, i) => (
            <ReferenceLine
              key={i}
              y={r.y}
              stroke={r.color}
              strokeOpacity={0.75}
              strokeDasharray={r.dash === false ? undefined : "5 5"}
              label={
                r.label
                  ? { value: r.label, position: "insideTopLeft", fill: r.color, fontSize: 10 }
                  : undefined
              }
            />
          ))}

          {pane.kind === "candle" ? (
            <Bar dataKey="_wick" name="ราคา" shape={<CandleShape />} isAnimationActive={false} />
          ) : (
            pane.series.map((s) =>
              s.fill ? (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={s.strokeWidth ?? 2}
                  fill={`url(#g-${pane.id}-${s.key})`}
                  activeDot={{ r: 3.5, fill: s.color }}
                  isAnimationActive={false}
                />
              ) : (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={s.strokeWidth ?? 2}
                  dot={false}
                  activeDot={{ r: 3.5, fill: s.color }}
                  isAnimationActive={false}
                />
              ),
            )
          )}

          {lastValue !== undefined && pane.kind !== "candle" && (
            <ReferenceLine
              y={lastValue}
              stroke={pane.series[0]?.color ?? "#22d3ee"}
              strokeOpacity={0.35}
              strokeDasharray="3 6"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** แท่งเทียน: Recharts ส่ง y/height ของช่วง [low, high] มาให้ แล้วเราเทียบสัดส่วนหา open/close */
type ShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: PaneRow;
};

function CandleShape({ x = 0, y = 0, width = 0, height = 0, payload }: ShapeProps) {
  if (!payload) return null;
  const o = payload.o as number;
  const h = payload.h as number;
  const l = payload.l as number;
  const c = payload.c as number;
  if ([o, h, l, c].some((v) => typeof v !== "number")) return null;

  const span = h - l;
  const toY = (v: number) => (span === 0 ? y + height / 2 : y + ((h - v) / span) * height);

  const up = c >= o;
  const color = up ? "#34f5a0" : "#fb7185";
  const bodyTop = toY(Math.max(o, c));
  const bodyH = Math.max(1, Math.abs(toY(o) - toY(c)));
  const bw = Math.max(1.5, Math.min(width * 0.62, 9));
  const cx = x + width / 2;

  return (
    <g>
      <line x1={cx} x2={cx} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect
        x={cx - bw / 2}
        y={bodyTop}
        width={bw}
        height={bodyH}
        fill={up ? "transparent" : color}
        stroke={color}
        strokeWidth={1.2}
        rx={0.5}
      />
    </g>
  );
}
