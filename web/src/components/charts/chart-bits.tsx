"use client";

export const AXIS = { stroke: "rgba(148,163,184,0.18)" };

export function thaiShortDate(iso: string) {
  const m = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  const d = new Date(iso + "T00:00:00Z");
  return `${d.getUTCDate()} ${m[d.getUTCMonth()]}`;
}

export function num(v: number, digits = 2) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function int(v: number) {
  return Math.round(v).toLocaleString("en-US");
}

type Payload = { name?: string; value?: number; color?: string; dataKey?: string | number };

export type TipProps = {
  active?: boolean;
  label?: unknown;
  payload?: readonly Payload[];
  formatter?: (key: string, v: number) => string;
};

export function GlassTooltip({ active, payload, label, formatter }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/12 bg-ink-850/95 px-3.5 py-2.5 shadow-2xl backdrop-blur">
      <p className="mb-1.5 text-[11px] tracking-wide text-slate-400">
        {typeof label === "string" && /^\d{4}-\d{2}-\d{2}$/.test(label)
          ? thaiShortDate(label)
          : String(label)}
      </p>
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2.5 text-[12.5px]">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-slate-400">{p.name}</span>
            <span className="ml-auto font-semibold text-white">
              {formatter && p.value !== undefined
                ? formatter(String(p.dataKey), p.value)
                : int(p.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({
  data,
  color,
  width = 96,
  height = 30,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / span) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const id = `sp-${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts.join(" ")} ${width},${height}`} fill={`url(#${id})`} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={width}
        cy={Number(pts[pts.length - 1].split(",")[1])}
        r={2.6}
        fill={color}
      />
    </svg>
  );
}
