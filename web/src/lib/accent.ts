import type { Bias, Section } from "./types";

export type Accent = Section["accent"];

export const ACCENT: Record<
  Accent,
  { hex: string; soft: string; text: string; glow: string; grad: string }
> = {
  cyan: {
    hex: "#22d3ee",
    soft: "rgba(34,211,238,0.14)",
    text: "text-[#22d3ee]",
    glow: "ring-glow-cyan",
    grad: "from-[#22d3ee] to-[#34f5a0]",
  },
  green: {
    hex: "#34f5a0",
    soft: "rgba(52,245,160,0.14)",
    text: "text-[#34f5a0]",
    glow: "ring-glow-green",
    grad: "from-[#34f5a0] to-[#a3e635]",
  },
  amber: {
    hex: "#ffc53d",
    soft: "rgba(255,197,61,0.14)",
    text: "text-[#ffc53d]",
    glow: "ring-glow-amber",
    grad: "from-[#ffc53d] to-[#fb923c]",
  },
  violet: {
    hex: "#a78bfa",
    soft: "rgba(167,139,250,0.14)",
    text: "text-[#a78bfa]",
    glow: "ring-glow-violet",
    grad: "from-[#a78bfa] to-[#f0abfc]",
  },
  rose: {
    hex: "#fb7185",
    soft: "rgba(251,113,133,0.14)",
    text: "text-[#fb7185]",
    glow: "ring-glow-rose",
    grad: "from-[#fb7185] to-[#fbbf24]",
  },
  sky: {
    hex: "#38bdf8",
    soft: "rgba(56,189,248,0.14)",
    text: "text-[#38bdf8]",
    glow: "ring-glow-sky",
    grad: "from-[#38bdf8] to-[#22d3ee]",
  },
};

export const TONE: Record<Bias, { text: string; bg: string; hex: string }> = {
  bull: { text: "text-[#34f5a0]", bg: "bg-[#34f5a0]/12", hex: "#34f5a0" },
  bear: { text: "text-[#fb7185]", bg: "bg-[#fb7185]/12", hex: "#fb7185" },
  neutral: { text: "text-[#e2e8f0]", bg: "bg-white/6", hex: "#cbd5e1" },
};

export function toneOf(t?: Bias) {
  return TONE[t ?? "neutral"];
}
