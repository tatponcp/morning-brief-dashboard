"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  ChevronDown,
  Clock3,
  Hand,
  Minus,
  Quote,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { ACCENT, toneOf, type Accent } from "@/lib/accent";
import { BANDS, bandOf, overallScore } from "@/lib/market-score";
import { pendingReason } from "@/lib/freshness";
import type { Bias } from "@/lib/types";
import { BiasGauge } from "@/components/ui/BiasGauge";
import { Tilt } from "@/components/ui/Tilt3D";
import { NotUpdatedScene, usePending } from "@/components/ui/NotUpdated";

export type SignalCard = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  accent: Accent;
  bias?: Bias;
  scenario?: string;
  score: number | null;
  empty: boolean;
  insight: string;
  summary: string[];
  view?: { value: string; tone?: Bias };
  levels: { label: string; value: string }[];
  spark: number[];
};

const BIAS_ICON: Record<Bias, typeof TrendingUp> = { bull: TrendingUp, neutral: Minus, bear: TrendingDown };
const ease = [0.16, 1, 0.3, 1] as const;

export function OverviewExperience({
  dateLabel,
  briefDate,
  cards: raw,
}: {
  dateLabel: string;
  briefDate: string;
  cards: SignalCard[];
}) {
  // ตัดสินว่าข้อไหนยังไม่อัปเดตด้วยนาฬิกาของลูกค้า
  const { tick } = usePending({ briefDate, empty: false });
  const cards = useMemo(
    () =>
      raw.map((c) => ({ ...c, pending: pendingReason({ briefDate, empty: c.empty }, new Date(tick * 30_000)) })),
    [raw, briefDate, tick],
  );

  const live = cards.filter((c) => !c.pending);
  const { score, counted, band } = overallScore(live.map((c) => c.score));
  const allPending = live.length === 0;
  const [peek, setPeek] = useState(false);

  // มุมมองที่ IC ใช้บ่อยที่สุดในข้อที่อัปเดตแล้ว
  // ตอนแอบดูของวันก่อน (ทุกข้อยังไม่อัปเดต) ใช้ข้อที่มีข้อมูลแทน
  const basis = allPending ? cards.filter((c) => !c.empty) : live;
  const freq = new Map<string, { n: number; tone?: Bias }>();
  for (const c of basis)
    for (const v of c.view?.value.split(" / ") ?? []) {
      const cur = freq.get(v) ?? { n: 0, tone: c.view?.tone };
      freq.set(v, { n: cur.n + 1, tone: cur.tone });
    }
  const topView = [...freq.entries()].sort((a, b) => b[1].n - a[1].n)[0];

  const [active, setActive] = useState(() => raw.find((c) => c.bias)?.id ?? raw[0].id);
  const detailRef = useRef<HTMLDivElement>(null);
  const i = cards.findIndex((c) => c.id === active);
  const card = cards[i];
  const go = (dir: 1 | -1) => setActive(cards[(i + dir + cards.length) % cards.length].id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowRight") setActive((id) => raw[(raw.findIndex((c) => c.id === id) + 1) % raw.length].id);
      if (e.key === "ArrowLeft")
        setActive((id) => raw[(raw.findIndex((c) => c.id === id) - 1 + raw.length) % raw.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [raw]);

  function select(id: string) {
    setActive(id);
    if (window.matchMedia("(max-width: 1023px)").matches)
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (allPending && !peek) {
    return (
      <NotUpdatedScene
        title="Morning Brief วันนี้"
        accent="cyan"
        lastLabel={dateLabel}
        reason="stale"
        onPeek={raw.some((c) => !c.empty) ? () => setPeek(true) : undefined}
      />
    );
  }

  const shownScore = allPending ? overallScore(basis.map((c) => c.score)) : { score, counted, band };
  const t = toneOf(shownScore.band?.tone);

  return (
    <div className="space-y-5">
      {allPending && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-neon/30 bg-amber-neon/8 px-4 py-2.5 text-[13px] text-amber-neon">
          <Clock3 className="size-4" />
          กำลังดูข้อมูลล่าสุดของ {dateLabel} · วันนี้ยังไม่อัปเดต
          <button onClick={() => setPeek(false)} className="ml-auto text-[12px] underline-offset-2 hover:underline">
            กลับ
          </button>
        </div>
      )}

      {/* ───────── คะแนนภาพรวม ───────── */}
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
                key={shownScore.band?.label}
                initial={{ opacity: 0, y: 16, rotateX: 30 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, ease }}
                className="font-display text-[36px] leading-[1.05] font-bold md:text-[54px]"
                style={{ color: t.hex, textShadow: `0 0 40px color-mix(in srgb, ${t.hex} 35%, transparent)` }}
              >
                {shownScore.band?.label ?? "รอสรุปสัญญาณ"}
              </motion.h1>
              <p className="mt-2 text-[16px] text-slate-300 md:text-[18px]">
                {shownScore.band?.hint ?? "IC กำลังอ่าน 6 ชุดข้อมูลก่อนตลาดเปิด"}
              </p>

              {topView && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, ease }}
                  className="mt-5 inline-flex items-center gap-3 rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: `color-mix(in srgb, ${toneOf(topView[1].tone).hex} 35%, transparent)`,
                    background: `color-mix(in srgb, ${toneOf(topView[1].tone).hex} 8%, transparent)`,
                  }}
                >
                  <span className="text-[13px] text-slate-400">กลยุทธ์หลักวันนี้</span>
                  <span className={`font-display text-[20px] font-bold ${toneOf(topView[1].tone).text}`}>
                    {topView[0]}
                  </span>
                </motion.div>
              )}

              <p className="mt-4 text-[12.5px] text-slate-500">
                คิดจาก {shownScore.counted} จาก {cards.length} ข้อที่อัปเดตแล้ว · น้ำหนักเท่ากันทุกข้อ
              </p>
            </div>

            <div style={{ transform: "translateZ(60px)" }} className="justify-self-center">
              <BiasGauge percent={shownScore.score} color={t.hex} label="คะแนนภาพรวม" />
            </div>
          </div>

          <Criteria score={shownScore.score} />
        </div>
      </Tilt>

      <HowScored
        // ตอนแอบดูของวันก่อน นับข้อที่มีข้อมูล ไม่ใช่ข้อที่อัปเดตวันนี้
        cards={cards.map((c) => ({ ...c, pending: allPending ? (c.empty ? "empty" : null) : c.pending }))}
        onSelect={select}
      />

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
              <SignalTile card={c} pending={!!c.pending && !allPending} active={c.id === active} onSelect={() => select(c.id)} />
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
              {card.pending && !allPending ? (
                <div className="space-y-2">
                  <NotUpdatedScene
                    compact
                    title={card.title}
                    accent={card.accent}
                    lastLabel={dateLabel}
                    reason={card.pending}
                  />
                  <div className="flex justify-between gap-2">
                    <IconBtn label="ข้อก่อนหน้า" onClick={() => go(-1)}>
                      <ArrowLeft className="size-4" />
                    </IconBtn>
                    <IconBtn label="ข้อถัดไป" onClick={() => go(1)}>
                      <ArrowRight className="size-4" />
                    </IconBtn>
                  </div>
                </div>
              ) : (
                <Detail card={card} onPrev={() => go(-1)} onNext={() => go(1)} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ───────── เกณฑ์คะแนน ───────── */

function Criteria({ score }: { score: number | null }) {
  const reduce = useReducedMotion();
  const ordered = [...BANDS].reverse();
  return (
    <div className="relative mt-7" style={{ transform: "translateZ(20px)" }}>
      <p className="mb-2 text-[12.5px] text-slate-400">เกณฑ์คะแนนภาพรวม</p>
      <div className="relative grid grid-cols-5 gap-1">
        {ordered.map((b) => {
          const on = score !== null && bandOf(score).label === b.label;
          const bt = toneOf(b.tone);
          return (
            <div
              key={b.label}
              className="rounded-xl border px-2 py-2 text-center transition-all duration-500"
              style={{
                borderColor: on ? bt.hex : "rgba(148,163,184,0.12)",
                background: on ? `color-mix(in srgb, ${bt.hex} 16%, transparent)` : "var(--c-hover)",
                transform: on ? "translateY(-3px)" : undefined,
              }}
            >
              <p className={`text-[12px] leading-tight font-semibold ${on ? bt.text : "text-slate-300"}`}>{b.label}</p>
              <p className="text-[11px] text-slate-500">
                {b.min}–{b.max}%
              </p>
            </div>
          );
        })}
        {score !== null && (
          <motion.span
            aria-hidden
            className="absolute -top-2 size-3 -translate-x-1/2 rotate-45 rounded-sm bg-white shadow"
            initial={reduce ? false : { left: "50%" }}
            animate={{ left: `${score}%` }}
            transition={{ duration: 1.2, ease, delay: 0.3 }}
          />
        )}
      </div>
    </div>
  );
}

/* ───────── วิธีคิดคะแนน ───────── */

function HowScored({
  cards,
  onSelect,
}: {
  cards: (SignalCard & { pending: "stale" | "empty" | null })[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="panel overflow-hidden rounded-2xl">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-5 py-3 text-left text-[14px] text-slate-200 transition-colors hover:bg-white/3"
      >
        <Calculator className="size-4 text-cyan-neon" />
        คะแนนแต่ละข้อ และวิธีคิด
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="ml-auto">
          <ChevronDown className="size-4 text-slate-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-5 pb-4">
              <p className="text-[13px] leading-relaxed text-slate-400">
                แต่ละตัวในภาพที่ IC เลือก: ขึ้น/หนุน = 100 · ทรง = 50 · ลง/กดดัน = 0 แล้วเฉลี่ยเป็นคะแนนของข้อนั้น
                คะแนนภาพรวมคือค่าเฉลี่ยของทุกข้อที่อัปเดตแล้ว
              </p>
              {cards.map((c, k) => {
                const ct = toneOf(c.bias);
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className="grid w-full grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1.2fr)_3.5rem] items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/4"
                  >
                    <span className="font-display text-[14px] font-bold" style={{ color: ACCENT[c.accent].hex }}>
                      {c.index}
                    </span>
                    <span className="truncate text-[13px] text-slate-200">{c.title}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-white/6">
                      {c.score !== null && !c.pending && (
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ background: ct.hex }}
                          initial={{ width: 0 }}
                          animate={{ width: `${c.score}%` }}
                          transition={{ duration: 0.8, delay: k * 0.05, ease }}
                        />
                      )}
                    </span>
                    <span className={`text-right text-[13px] font-semibold ${c.pending || c.score === null ? "text-slate-500" : ct.text}`}>
                      {c.pending ? "รอ" : c.score === null ? "—" : `${c.score}%`}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────── การ์ดสัญญาณ ───────── */

function SignalTile({
  card,
  pending,
  active,
  onSelect,
}: {
  card: SignalCard;
  pending: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  const a = ACCENT[card.accent];
  const t = toneOf(card.bias);
  const Icon = card.bias ? BIAS_ICON[card.bias] : Minus;
  const color = pending ? "var(--c-amber)" : card.bias ? t.hex : a.hex;

  return (
    <Tilt className="h-full rounded-2xl" max={10} lift={active ? 18 : 0}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className="panel group relative flex h-full min-h-[160px] w-full flex-col overflow-hidden rounded-2xl px-3.5 py-3.5 text-left transition-[border-color,box-shadow,opacity] duration-300"
        style={{
          borderColor: active ? color : `color-mix(in srgb, ${color} 20%, transparent)`,
          boxShadow: active ? `0 18px 50px -18px ${color}, inset 0 0 0 1px ${color}` : undefined,
          opacity: pending && !active ? 0.75 : 1,
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
          {pending ? (
            <span className="grid size-9 place-items-center rounded-xl bg-amber-neon/15 text-amber-neon">
              <Clock3 className="size-4" />
            </span>
          ) : card.score !== null ? (
            <ScoreRing score={card.score} color={color} />
          ) : (
            <span className="grid size-9 place-items-center rounded-xl" style={{ color }}>
              <Icon className="size-4" />
            </span>
          )}
        </span>
        <span className="relative mt-2 line-clamp-2 text-[13px] leading-snug font-semibold text-slate-100">
          {card.title}
        </span>
        <span className="relative mt-auto pt-2" style={{ transform: "translateZ(20px)" }}>
          {pending ? (
            <span className="text-[12px] font-semibold text-amber-neon">ยังไม่อัปเดต</span>
          ) : card.scenario ? (
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

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid size-10 place-items-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--c-hover)" strokeWidth="3" />
        <motion.circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1, ease }}
        />
      </svg>
      <span className="text-[11px] font-bold" style={{ color }}>
        {score}
      </span>
    </span>
  );
}

/* ───────── รายละเอียดข้อที่เลือก ───────── */

function Detail({ card, onPrev, onNext }: { card: SignalCard; onPrev: () => void; onNext: () => void }) {
  const a = ACCENT[card.accent];
  const t = toneOf(card.bias);
  const color = card.bias ? t.hex : a.hex;
  const vt = toneOf(card.view?.tone);

  return (
    <div className="panel relative overflow-hidden rounded-3xl" style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}>
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
            {card.scenario}
            {card.score !== null && <span className="opacity-80">· {card.score}%</span>}
          </motion.span>
        )}

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
        อ่านข้อ {card.index} แบบเต็ม · ภาพและรายละเอียด
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
  const pts = values.map(
    (v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * (h - 6) - 3).toFixed(1)}`,
  );
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
