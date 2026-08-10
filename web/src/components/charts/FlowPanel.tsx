"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FlowRow } from "@/lib/types";
import { AXIS, GlassTooltip, int, num, thaiShortDate, type TipProps } from "./chart-bits";

const KEYS = [
  { key: "fund", name: "รวมกองทุน", color: "#34f5a0" },
  { key: "foreign", name: "ต่างชาติ (ไม่รวมกองทุน)", color: "#38bdf8" },
  { key: "total", name: "รวมต่างชาติ + กองทุน", color: "#ffc53d" },
  { key: "set50", name: "SET50 Index (แกนขวา)", color: "#fb7185" },
] as const;

export function FlowPanel({ rows }: { rows: FlowRow[] }) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setHidden((h) => ({ ...h, [k]: !h[k] }));
  const last = rows[rows.length - 1];

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/6 px-5 py-4">
        <div>
          <h3 className="font-display text-[17px] font-bold text-[#34f5a0]">
            สะสม Long / Short ของต่างชาติและกองทุน (Cumulative)
          </h3>
          <p className="text-[11.5px] text-slate-500">หน่วย: ล้านบาท (สะสม) · คลิกที่ legend เพื่อซ่อน/แสดงเส้น</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {KEYS.map((k) => (
            <button
              key={k.key}
              onClick={() => toggle(k.key)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition ${
                hidden[k.key]
                  ? "border-white/8 bg-white/2 text-slate-600"
                  : "border-white/12 bg-white/5 text-slate-200"
              }`}
            >
              <span className="size-2 rounded-full" style={{ background: k.color }} />
              {k.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={rows} margin={{ top: 10, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={thaiShortDate}
              axisLine={AXIS}
              tickLine={false}
              minTickGap={36}
            />
            <YAxis
              yAxisId="flow"
              tickFormatter={(v) => int(v)}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <YAxis
              yAxisId="idx"
              orientation="right"
              domain={["dataMin - 8", "dataMax + 8"]}
              tickFormatter={(v) => num(v, 0)}
              axisLine={false}
              tickLine={false}
              width={56}
              tick={{ fill: "#fb7185" }}
            />
            <ReferenceLine yAxisId="flow" y={0} stroke="rgba(255,255,255,0.35)" />
            <Tooltip
              content={(p) => (
                <GlassTooltip {...(p as TipProps)} formatter={(k, v) => (k === "set50" ? num(v) : int(v))} />
              )}
              cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "4 4" }}
            />
            <Legend wrapperStyle={{ display: "none" }} />
            {KEYS.filter((k) => k.key !== "set50").map((k) => (
              <Line
                key={k.key}
                yAxisId="flow"
                type="monotone"
                dataKey={k.key}
                name={k.name}
                stroke={k.color}
                strokeWidth={2}
                dot={false}
                hide={hidden[k.key]}
                activeDot={{ r: 4, fill: k.color }}
              />
            ))}
            <Line
              yAxisId="idx"
              type="monotone"
              dataKey="set50"
              name="SET50 Index"
              stroke="#fb7185"
              strokeWidth={2}
              dot={false}
              hide={hidden.set50}
              activeDot={{ r: 4, fill: "#fb7185" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-white/6 bg-white/6 md:grid-cols-4">
        {KEYS.map((k) => {
          const v = last[k.key as keyof FlowRow] as number;
          const pos = v >= 0;
          return (
            <div key={k.key} className="bg-ink-900 px-4 py-3.5">
              <p className="truncate text-[11px] text-slate-500">{k.name}</p>
              <p
                className="font-display text-xl font-bold"
                style={{ color: k.key === "set50" ? "#fb7185" : pos ? "#34f5a0" : "#fb7185" }}
              >
                {k.key === "set50" ? num(v) : int(v)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
