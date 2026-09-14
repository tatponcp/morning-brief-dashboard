"use client";

import type { SpreadSeries } from "@/lib/types";
import { PaneGroupCard } from "./PaneGroupCard";

/** ราคา spread series (เช่น S50U26Z26) — การ์ดเล็กคู่กับกราฟราคา + OI ของข้อ 1 */
export function SpreadPanel({ spread }: { spread: SpreadSeries }) {
  const rows = spread.rows;
  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const values = rows.map((r) => r.v);
  const change = prev ? last.v - prev.v : 0;

  return (
    <PaneGroupCard
      group={{
        id: `spread-${spread.symbol}`,
        title: `Spread ${spread.symbol}`,
        subtitle: "ส่วนต่างราคาระหว่างสัญญา ใช้ดูจังหวะ rollover",
        accentHex: "var(--c-violet)",
        panes: [
          {
            id: `spread-${spread.symbol}-line`,
            title: "ราคา Spread",
            kind: "line",
            height: 170,
            digits: 1,
            series: [{ key: "v", name: "Spread", color: "var(--c-violet)", fill: true }],
            rows: rows.map((r) => ({ t: r.t, v: r.v })),
          },
        ],
        footer: [
          { label: "ล่าสุด", value: last.v.toFixed(1), tone: "neutral" },
          {
            label: "เทียบวันก่อน",
            value: `${change > 0 ? "+" : ""}${change.toFixed(1)}`,
            tone: "neutral",
          },
          {
            label: "ช่วงในข้อมูล",
            value: `${Math.min(...values).toFixed(1)} – ${Math.max(...values).toFixed(1)}`,
            tone: "neutral",
          },
        ],
      }}
    />
  );
}
