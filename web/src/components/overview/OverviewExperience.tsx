"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Hand, Minus, Quote, TrendingDown, TrendingUp } from "lucide-react";
import { ACCENT, toneOf, type Accent } from "@/lib/accent";
import type { Bias } from "@/lib/types";
import { BiasGauge } from "@/components/ui/BiasGauge";

export type SignalCard = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  accent: Accent;
  bias?: Bias;
  scenario?: string;
  insight: string;
  summary: string[];
  view?: { value: string; tone?: Bias };
  levels: { label: string; value: string }[];
  spark: number[];
};

const BIAS_LABEL: Record<Bias, string> = { bull: "บวก", neutral: "กลาง", bear: "ลบ" };
const BIAS_ICON: Record<Bias, typeof TrendingUp> = { bull: TrendingUp, neutral: Minus, bear: TrendingDown };
const ease = [0.16, 1, 0.3, 1] as const;

/** คำตัดสินของวันจากสถานการณ์ที่ IC เลือก — ประโยคเดียวที่ลูกค้าอ่านแล้วรู้เลย */
function verdict(cards: SignalCard[]) {
  const picked = cards.filter((c) => c.bias);
  const count: Record<Bias, number> = { bull: 0, neutral: 0, bear: 0 };
  for (const c of picked) count[c.bias!]++;
  const score = picked.length ? (count.bull - count.bear) / picked.length : 0;
  // ต้องเอียงชัดเกินหนึ่งในสี่ถึงนับว่าเอียง — บวก 2 ลบ 1 กลาง 3 ยังถือว่ากลาง
  const tone: Bias = score > 0.25 ? "bull" : score < -0.25 ? "bear" : "neutral";
  const strength = Math.abs(score) >= 0.6 ? "ชัดเจน" : tone === "neutral" ? "" : "เล็กน้อย";

  // มุมมองที่ IC ใช้บ่อยที่สุดในวันนี้
  const freq = new Map<string, { n: number; tone?: Bias }>();
  for (const c of cards)
    for (const v of c.view?.value.split(" / ") ?? []) {
      const cur = freq.get(v) ?? { n: 0, tone: c.view?.tone };
      freq.set(v, { n: cur.n + 1, tone: cur.tone });
    }
  const topView = [...freq.entries()].sort((a, b) => b[1].n - a[1].n)[0];

  const headline = !picked.length
    ? { big: "รอสรุปสัญญาณเช้านี้", small: "IC กำลังอ่าน 6 ชุดข้อมูลก่อนตลาดเปิด" }
    : tone === "bull"
      ? { big: "ตลาดเอียงบวก", small: "สัญญาณส่วนใหญ่หนุนฝั่ง Long" }
      : tone === "bear"
        ? { big: "ตลาดเอียงลบ", small: "สัญญาณส่วนใหญ่กดดัน ระวังความเสี่ยง" }
        : { big: "ตลาดยังไม่เลือกทาง", small: "สัญญาณผสม รอการยืนยันก่อน" };

  return { picked, count, score, tone, strength, headline, topView };
}

export function OverviewExperience({ dateLabel, cards }: { dateLabel: string; cards: SignalCard[] }) {
  const v = useMemo(() => verdict(cards), [cards]);
  const [active, setActive] = useState(() => cards.find((c) => c.bias)?.id ?? cards[0].id);
  const detailRef = useRef<HTMLDivElement>(null);
  const i = cards.findIndex((c) => c.id === active);
  const card = cards[i];

  const go = (dir: 1 | -1) => setActive(cards[(i + dir + cards.length) % cards.length].id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowRight") setActive((id) => cards[(cards.findIndex((c) => c.id === id) + 1) % cards.length].id);
      if (e.key === "ArrowLeft")
        setActive((id) => cards[(cards.findIndex((c) => c.id === id) - 1 + cards.length) % cards.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards]);

  function select(id: string) {
    setActive(id);
    // จอเล็ก: เลื่อนไปที่รายละเอียดให้เห็นทันที
    if (window.matchMedia("(max-width: 1023px)").matches)
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const t = toneOf(v.tone);

  return (
    <div className="space-y-5">
      {/* ───────── คำตัดสินของวัน ───────── */}
      <Tilt className="rounded-3xl" max={4}>
        <div className="panel relative overflow-hidden rounded-3xl px-6 py-7 md:px-10 md:py-9">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-40 -right-20 size-[28rem] rounded-full blur-3xl"
            style={{ background: `color-mix(in srgb, ${t.hex} 16%, transparent)` }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0" style={{ transform: "translateZ(40px)" }}>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1 text-[12px] text-slate-300"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full opacity-60" style={{ background: t.hex }} />
                  <span className="relative inline-flex size-2 rounded-full" style={{ background: t.hex }} />
                </span>
                Morning Brief · {dateLabel}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 16, rotateX: 30 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, ease }}
                className="font-display text-[38px] leading-[1.05] font-bold md:text-[58px]"
                style={{ color: t.hex, textShadow: `0 0 40px color-mix(in srgb, ${t.hex} 35%, transparent)` }}
              >
                {v.headline.big}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-2 text-[16px] text-slate-300 md:text-[18px]"
              >
                {v.headline.small}
              </motion.p>

              {v.topView && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, ease }}
                  className="mt-5 inline-flex items-center gap-3 rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: `color-mix(in srgb, ${toneOf(v.topView[1].tone).hex} 35%, transparent)`,
                    background: `color-mix(in srgb, ${toneOf(v.topView[1].tone).hex} 8%, transparent)`,
                  }}
                >
                  <span className="text-[13px] text-slate-400">กลยุทธ์หลักวันนี้</span>
                  <span className={`font-display text-[20px] font-bold ${toneOf(v.topView[1].tone).text}`}>
                    {v.topView[0]}
                  </span>
                </motion.div>
              )}

              {/* แถบสัดส่วนสัญญาณ */}
              <div className="mt-6 max-w-md">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-white/6">
                  {(["bull", "neutral", "bear"] as Bias[]).map((b, k) => (
                    <motion.span
                      key={b}
                      initial={{ width: 0 }}
                      animate={{ width: `${(v.count[b] / cards.length) * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.4 + k * 0.1, ease }}
                      style={{ background: toneOf(b).hex }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
                  {(["bull", "neutral", "bear"] as Bias[]).map((b) => (
                    <span key={b} className="flex items-center gap-1.5 text-slate-400">
                      <span className="size-2 rounded-full" style={{ background: toneOf(b).hex }} />
                      {BIAS_LABEL[b]} <span className="font-semibold text-slate-100">{v.count[b]}</span>
                    </span>
                  ))}
                  {v.picked.length < cards.length && (
                    <span className="text-slate-500">รอสรุป {cards.length - v.picked.length}</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ transform: "translateZ(60px)" }} className="justify-self-center">
              <BiasGauge
                score={v.score}
                label={!v.picked.length ? "—" : v.tone === "neutral" ? "สมดุล" : `${BIAS_LABEL[v.tone]}${v.strength}`}
                sub="น้ำหนักสัญญาณรวม"
              />
            </div>
          </div>
        </div>
      </Tilt>

      {/* ───────── 6 สัญญาณ ───────── */}
      <div className="flex items-center gap-2 px-1 text-[13px] text-slate-400">
        <Hand className="size-4" />
        แตะการ์ดเพื่ออ่านสรุปของแต่ละข้อ
        <span className="hidden text-slate-600 md:inline">· ใช้ปุ่ม ← → ได้</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid grid-cols-2 gap-3 [perspective:1200px] sm:grid-cols-3">
          {cards.map((c, k) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24, rotateX: -25 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, delay: 0.1 + k * 0.06, ease }}
            >
              <SignalTile card={c} active={c.id === active} onSelect={() => select(c.id)} />
            </motion.div>
          ))}
        </div>

        <div ref={detailRef} className="scroll-mt-20 lg:sticky lg:top-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={card.id}
              initial={{ opacity: 0, rotateY: -12, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: 10, x: -20, scale: 0.98 }}
              transition={{ duration: 0.45, ease }}
              style={{ transformPerspective: 1200 }}
            >
              <Detail card={card} onPrev={() => go(-1)} onNext={() => go(1)} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ───────── การ์ดสัญญาณ ───────── */

function SignalTile({ card, active, onSelect }: { card: SignalCard; active: boolean; onSelect: () => void }) {
  const a = ACCENT[card.accent];
  const t = toneOf(card.bias);
  const Icon = card.bias ? BIAS_ICON[card.bias] : Minus;
  const color = card.bias ? t.hex : a.hex;

  return (
    <Tilt className="h-full rounded-2xl" max={10} lift={active ? 18 : 0}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className="panel group relative flex h-full min-h-[150px] w-full flex-col overflow-hidden rounded-2xl px-3.5 py-3.5 text-left transition-[border-color,box-shadow] duration-300"
        style={{
          borderColor: active ? color : `color-mix(in srgb, ${color} 20%, transparent)`,
          boxShadow: active ? `0 18px 50px -18px ${color}, inset 0 0 0 1px ${color}` : undefined,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full blur-2xl transition-opacity duration-500"
          style={{ background: color, opacity: active ? 0.28 : 0.1 }}
        />
        <span className="relative flex items-center justify-between" style={{ transform: "translateZ(30px)" }}>
          <span className="font-display text-[30px] leading-none font-bold" style={{ color: a.hex }}>
            {card.index}
          </span>
          <span
            className="grid size-8 place-items-center rounded-xl"
            style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
          >
            <Icon className="size-4" />
          </span>
        </span>
        <span className="relative mt-2 line-clamp-2 text-[13px] leading-snug font-semibold text-slate-100">
          {card.title}
        </span>
        <span className="relative mt-auto pt-2" style={{ transform: "translateZ(20px)" }}>
          {card.scenario ? (
            <span className={`line-clamp-1 text-[12px] font-semibold ${t.text}`}>{card.scenario}</span>
          ) : (
            <span className="text-[12px] text-slate-500">รอ IC สรุป</span>
          )}
          <Spark values={card.spark} color={color} className="mt-1.5 h-6 w-full opacity-80" />
        </span>
      </button>
    </Tilt>
  );
}

/* ───────── รายละเอียดข้อที่เลือก ───────── */

function Detail({ card, onPrev, onNext }: { card: SignalCard; onPrev: () => void; onNext: () => void }) {
  const a = ACCENT[card.accent];
  const t = toneOf(card.bias);
  const color = card.bias ? t.hex : a.hex;
  const vt = toneOf(card.view?.tone);

  return (
    <div
      className="panel relative overflow-hidden rounded-3xl"
      style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full blur-3xl"
        style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}
      />

      <div className="relative px-5 pt-5 pb-4 md:px-6">
        <div className="flex items-center gap-3">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-2xl font-display text-[20px] font-bold"
            style={{ background: a.hex, color: "var(--ink-950)" }}
          >
            {card.index}
          </span>
          <div className="min-w-0">
            <p className="font-display text-[18px] leading-tight font-bold text-white">{card.title}</p>
            <p className="truncate text-[12.5px] text-slate-400">{card.subtitle}</p>
          </div>
          <div className="ml-auto flex gap-1">
            <IconBtn label="ข้อก่อนหน้า" onClick={onPrev}>
              <ArrowLeft className="size-4" />
            </IconBtn>
            <IconBtn label="ข้อถัดไป" onClick={onNext}>
              <ArrowRight className="size-4" />
            </IconBtn>
          </div>
        </div>

        {card.scenario && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${t.bg} ${t.text}`}
          >
            สถานการณ์: {card.scenario}
          </motion.span>
        )}

        {/* ประโยคเดียวที่ต้องจำ */}
        <motion.blockquote
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, ease }}
          className="mt-4 flex gap-3"
        >
          <Quote className="mt-1 size-5 shrink-0" style={{ color }} />
          <p className="font-display text-[22px] leading-snug font-bold text-white md:text-[24px]">{card.insight}</p>
        </motion.blockquote>

        {card.view && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease }}
            className="mt-4 rounded-2xl border px-4 py-3"
            style={{
              borderColor: `color-mix(in srgb, ${vt.hex} 35%, transparent)`,
              background: `color-mix(in srgb, ${vt.hex} 8%, transparent)`,
            }}
          >
            <p className="text-[12px] text-slate-400">ลูกค้าควรทำอะไร</p>
            <p className={`font-display text-[20px] font-bold ${vt.text}`}>{card.view.value}</p>
            {card.levels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {card.levels.map((l) => (
                  <span key={l.label} className="rounded-lg bg-white/5 px-2 py-1 text-[12px] text-slate-300">
                    {l.label} <span className="font-semibold text-white">{l.value}</span>
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {card.summary.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {card.summary.map((s, k) => (
              <motion.li
                key={s}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + k * 0.05 }}
                className="flex gap-2.5 text-[14px] text-slate-300"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
                {s}
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <Spark values={card.spark} color={color} className="h-16 w-full" fill />

      <Link
        href={`/${card.id}`}
        className="group relative flex items-center justify-between border-t border-white/6 px-5 py-3.5 text-[14px] font-semibold transition-colors hover:bg-white/4 md:px-6"
        style={{ color }}
      >
        อ่านข้อ {card.index} แบบเต็ม · กราฟและรายละเอียด
        <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </div>
  );
}

/* ───────── ชิ้นส่วนเล็ก ───────── */

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-xl border border-white/10 text-slate-300 transition-colors hover:border-white/25 hover:text-white"
    >
      {children}
    </motion.button>
  );
}

function Spark({ values, color, className, fill }: { values: number[]; color: string; className?: string; fill?: boolean }) {
  const reduce = useReducedMotion();
  if (values.length < 2) return <div className={className} />;
  const w = 200;
  const h = 40;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * (h - 6) - 3).toFixed(1)}`);
  const d = `M${pts.join(" L")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      {fill && <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity={0.12} />}
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease }}
      />
    </svg>
  );
}

/**
 * การ์ดเอียงตามเมาส์แบบ 3 มิติ พร้อมแสงสะท้อน
 * ปิดเองบนจอสัมผัสและเมื่อผู้ใช้ตั้งลดการเคลื่อนไหว
 */
function Tilt({
  children,
  className,
  max = 8,
  lift = 0,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  lift?: number;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const cfg = { stiffness: 220, damping: 22 };
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), cfg);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), cfg);
  const z = useSpring(lift, cfg);
  const shineX = useTransform(px, (v) => `${v * 100}%`);
  const shineY = useTransform(py, (v) => `${v * 100}%`);
  const shine = useMotionTemplate`radial-gradient(420px circle at ${shineX} ${shineY}, rgba(255,255,255,0.09), transparent 45%)`;

  useEffect(() => {
    z.set(lift);
  }, [lift, z]);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={`relative [transform-style:preserve-3d] ${className ?? ""}`}
      style={{ rotateX, rotateY, z, transformPerspective: 1000 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      {children}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: shine }}
      />
    </motion.div>
  );
}
