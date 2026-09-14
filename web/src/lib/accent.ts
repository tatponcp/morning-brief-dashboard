import type { Bias, Section } from "./types";

export type Accent = Section["accent"];

export const ACCENT: Record<
  Accent,
  { hex: string; soft: string; text: string; glow: string; grad: string }
> = {
  cyan: {
    hex: "var(--c-cyan)",
    soft: "color-mix(in srgb, var(--c-cyan) 14%, transparent)",
    text: "text-cyan-neon",
    glow: "ring-glow-cyan",
    grad: "from-cyan-neon to-green-neon",
  },
  green: {
    hex: "var(--c-green)",
    soft: "color-mix(in srgb, var(--c-green) 14%, transparent)",
    text: "text-green-neon",
    glow: "ring-glow-green",
    grad: "from-green-neon to-lime-neon",
  },
  amber: {
    hex: "var(--c-amber)",
    soft: "color-mix(in srgb, var(--c-amber) 14%, transparent)",
    text: "text-amber-neon",
    glow: "ring-glow-amber",
    grad: "from-amber-neon to-orange-neon",
  },
  violet: {
    hex: "var(--c-violet)",
    soft: "color-mix(in srgb, var(--c-violet) 14%, transparent)",
    text: "text-violet-neon",
    glow: "ring-glow-violet",
    grad: "from-violet-neon to-pink-neon",
  },
  rose: {
    hex: "var(--c-rose)",
    soft: "color-mix(in srgb, var(--c-rose) 14%, transparent)",
    text: "text-rose-neon",
    glow: "ring-glow-rose",
    grad: "from-rose-neon to-yellow-neon",
  },
  sky: {
    hex: "var(--c-sky)",
    soft: "color-mix(in srgb, var(--c-sky) 14%, transparent)",
    text: "text-sky-neon",
    glow: "ring-glow-sky",
    grad: "from-sky-neon to-cyan-neon",
  },
};

export const TONE: Record<Bias, { text: string; bg: string; hex: string }> = {
  bull: { text: "text-green-neon", bg: "bg-green-neon/12", hex: "var(--c-green)" },
  bear: { text: "text-rose-neon", bg: "bg-rose-neon/12", hex: "var(--c-rose)" },
  neutral: { text: "text-slate-200", bg: "bg-white/6", hex: "var(--c-neutral)" },
};

export function toneOf(t?: Bias) {
  return TONE[t ?? "neutral"];
}
