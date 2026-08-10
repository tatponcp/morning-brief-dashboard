import { ACCENT } from "@/lib/accent";
import snapshot from "@/data/macro-snapshot.json";
import type { Section } from "@/lib/types";

/** เส้นตัวอย่างเล็ก ๆ ในการ์ดหน้าสรุป — server component, วาดด้วย SVG ล้วน */
export function MiniSpark({ section }: { section: Section }) {
  const a = ACCENT[section.accent];
  const values = pick(section);
  if (!values.length) return <div className="h-[42px]" />;

  const w = 220;
  const h = 42;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const gid = `mini-${section.id}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[42px] w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a.hex} stopOpacity={0.32} />
          <stop offset="100%" stopColor={a.hex} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={`url(#${gid})`} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={a.hex}
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function pick(section: Section): number[] {
  if (section.contracts?.length) return section.contracts[0].rows.map((r) => r.close);
  if (section.flows?.length) return section.flows.map((r) => r.total);

  const pane = section.groups?.[0]?.panes?.[0];
  if (pane) {
    const key = pane.kind === "candle" ? "c" : pane.series[0]?.key;
    if (key) {
      const vals = pane.rows
        .map((r) => r[key])
        .filter((v): v is number => typeof v === "number");
      if (vals.length) return vals;
    }
  }

  if (section.id === "macro") {
    const gold = snapshot.instruments.find((x) => x.id === "gold");
    if (gold) return gold.rows.slice(-90).map((r) => r.c);
  }

  const spark = section.board?.stats?.find((s) => s.spark)?.spark;
  return spark ?? [];
}
