import type { Bias, SeriesRead } from "./types";
import { GUIDES, fillText, type ScenarioBase, type ViewId } from "./scenarios";
import { TONE_SCORE } from "./market-score";

/**
 * ข้อที่แนบภาพ (1, 3, 4, 5, 6) — IC ดูภาพแล้วเลือกจาก dropdown แบบเดียวกับชีตที่ทีมใช้
 * ระบบสรุปทิศทาง เขียนข้อความ และให้คะแนน 0–100 สำหรับภาพรวมให้เอง
 *
 * tone ของตัวเลือก = ผลต่อตลาดหุ้น / S50 (bull = หนุน · bear = กดดัน) ใช้ระบายสีและคิดคะแนน
 */

/** เวอร์ชันกติกาปัจจุบัน — เปลี่ยนทุกครั้งที่ปรับวิธีให้คะแนน (ใช้แยกข้อมูลย้อนหลังตามกติกา) */
export const RULES_VERSION = "2026-09-18";

export type SignalOption = { value: string; label: string; tone: Bias; short?: string };

export type SignalField = { key: string; label: string; options: SignalOption[] };

export type SignalConclusion = ScenarioBase & { views: ViewId[]; score: number; perSeries?: SeriesRead[] };

export type SignalForm = {
  question: string;
  /** กติกาสรุปแบบภาษาคน แสดงใต้ dropdown */
  rule: string;
  fields: SignalField[];
  conclude: (values: Record<string, string>) => SignalConclusion | null;
};

export function optionOf(field: SignalField, value?: string) {
  return field.options.find((o) => o.value === value);
}

type Answered = SignalField & { opt: SignalOption };

/** คำตอบครบทุกช่องแล้วเท่านั้นถึงจะสรุปได้ */
function answers(fields: SignalField[], values: Record<string, string>) {
  const list = fields.map((f) => ({ ...f, opt: optionOf(f, values[f.key]) }));
  return list.every((x) => x.opt) ? (list as Answered[]) : null;
}

const avgScore = (list: { opt: SignalOption }[]) =>
  Math.round(list.reduce((n, x) => n + TONE_SCORE[x.opt.tone], 0) / list.length);

const names = (list: Answered[], pick: (o: SignalOption) => boolean) =>
  list
    .filter((x) => pick(x.opt))
    .map((x) => x.label)
    .join(" และ ");

/** ดึงข้อความของสถานการณ์จากคู่มือกลาง — ทีมแก้คำที่ scenarios.ts หรือบันทึกคำเองใน Studio */
function fromGuide(sectionId: string, scenarioId: string, score: number): SignalConclusion {
  const sc = GUIDES[sectionId].scenarios.find((x) => x.id === scenarioId)!;
  return { ...sc, summary: [...sc.summary], score };
}

const opt = (value: string, label: string, tone: Bias, short?: string): SignalOption => ({
  value,
  label,
  tone,
  short,
});

/** series ที่ IC ใส่ไว้ เช่น "S50U26 / S50Z26" → ["S50U26", "S50Z26"] */
export function seriesList(series?: string): string[] {
  return (series ?? "")
    .split(/[/,]/)
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
}

/* ───────── ข้อ 1: ราคา + OI ต่อ series (ภาพเดียวมีได้หลาย series ช่วงย้ายสัญญา) ───────── */

const PX_OI_SCORE: Record<string, number> = {
  "px-up-oi-up": 90,
  "px-up-oi-down": 60,
  "px-down-oi-down": 40,
  "px-down-oi-up": 10,
};

function s50Form(series?: string): SignalForm {
  const list = seriesList(series);
  // series เดียวใช้คีย์เดิม (price / oi) ร่างที่บันทึกไว้ก่อนหน้าจะยังใช้ได้
  const key = (k: string, s: string) => (list.length > 1 ? `${k}:${s}` : k);
  const shown = list.length ? list : [""];

  return {
    question:
      list.length > 1 ? `ราคาและ Open Interest ของแต่ละ series (${list.join(" · ")})` : "ราคาและ Open Interest ในภาพไปทางไหน",
    rule:
      "ราคาขึ้น + OI เพิ่ม = 90% · ราคาขึ้น + OI ลด = 60% · ราคาลง + OI ลด = 40% · ราคาลง + OI เพิ่ม = 10%" +
      (list.length > 1 ? " · หลาย series: ใช้ series แรกเป็นหลัก คะแนนเฉลี่ยทุก series" : ""),
    fields: shown.flatMap((s) => [
      {
        key: key("price", s),
        label: s ? `ราคา ${s}` : "ราคา",
        options: [opt("up", "ขึ้น", "bull", "ขึ้น"), opt("down", "ลง", "bear", "ลง")],
      },
      {
        key: key("oi", s),
        label: s ? `OI ${s}` : "Open Interest",
        options: [opt("up", "เพิ่มขึ้น", "neutral", "เพิ่ม"), opt("down", "ลดลง", "neutral", "ลด")],
      },
    ]),
    conclude(values) {
      if (!answers(this.fields, values)) return null;
      const per = shown.map((s) => {
        const up = values[key("price", s)] === "up";
        const oiUp = values[key("oi", s)] === "up";
        const id = `px-${up ? "up" : "down"}-oi-${oiUp ? "up" : "down"}`;
        return { s, id, up, oiUp, score: PX_OI_SCORE[id] };
      });
      const main = per[0];
      const score = Math.round(per.reduce((n, x) => n + x.score, 0) / per.length);
      const base = fromGuide("s50-oi", main.id, score);
      // series อื่นไปคนละทาง → บอกลูกค้าตรง ๆ ในสรุป
      for (const other of per.slice(1)) {
        const sc = GUIDES["s50-oi"].scenarios.find((x) => x.id === other.id)!;
        base.summary.push(
          other.id === main.id
            ? `${other.s} ไปทางเดียวกัน (${fillText(sc.title, { series: other.s })})`
            : `${other.s} ต่างออกไป: ${fillText(sc.title, { series: other.s })} — ${sc.tag}`,
        );
      }
      if (list.length) {
        base.perSeries = per.map((x) => {
          const sc = GUIDES["s50-oi"].scenarios.find((g) => g.id === x.id)!;
          return {
            series: x.s,
            price: x.up ? "up" : "down",
            oi: x.oiUp ? "up" : "down",
            title: fillText(sc.title, { series: x.s }),
            tag: sc.tag,
            bias: sc.bias,
            score: x.score,
          };
        });
      }
      return base;
    },
  };
}

/**
 * เพิ่ม/ลบ/สลับ series แล้วคีย์ของ dropdown เปลี่ยน (series เดียวใช้ "price", หลายตัวใช้ "price:S50U26")
 * ย้ายค่าที่เลือกไว้ตาม series เดิม ไม่ต้องเลือกใหม่
 */
export function remapSeriesValues(values: Record<string, string>, from?: string, to?: string) {
  const a = seriesList(from);
  const b = seriesList(to);
  const oldKey = (k: string, s: string) => (a.length > 1 ? `${k}:${s}` : a.length === 1 && a[0] !== s ? null : k);
  const newKey = (k: string, s: string) => (b.length > 1 ? `${k}:${s}` : k);
  const next: Record<string, string> = {};
  for (const s of b.length ? b : [a[0] ?? ""]) {
    for (const k of ["price", "oi"]) {
      const ok = a.length || !s ? oldKey(k, s) : b.indexOf(s) === 0 ? k : null;
      const v = ok ? values[ok] : undefined;
      if (v) next[newKey(k, s)] = v;
    }
  }
  return next;
}

/* ───────── ข้อ 3: USD Futures 3 อินดี้ตามชีต ───────── */

/** ทิศทางของ USD — ค่าบวกคือดอลลาร์ขึ้น (บาทอ่อน) ซึ่งกดดันหุ้นไทย */
const USD_DIR = [
  { value: "up", label: "ขาขึ้น Breakout", level: 1, tone: "bear" as Bias },
  { value: "side-up", label: "Sideway Up", level: 0.5, tone: "bear" as Bias },
  { value: "side", label: "Sideway", level: 0, tone: "neutral" as Bias },
  { value: "side-down", label: "Sideway Down", level: -0.5, tone: "bull" as Bias },
  { value: "down", label: "ขาลง Breakdown", level: -1, tone: "bull" as Bias },
];
const USD_OPTIONS = USD_DIR.map((d) => opt(d.value, d.label, d.tone));
const usdLevel = (v?: string) => USD_DIR.find((d) => d.value === v)?.level ?? 0;

/** ระดับเฉลี่ย → คำเรียกทิศทางแบบที่ทีมใช้ในชีต */
function dirLabel(level: number) {
  if (level >= 0.75) return "ขาขึ้น";
  if (level >= 0.25) return "Sideway Up";
  if (level > -0.25) return "Sideway";
  if (level > -0.75) return "Sideway Down";
  return "ขาลง";
}

/* ───────── ข้อ 5 ───────── */

const ZONE = [
  opt("ovb", "Overbought (เหนือเส้นแดง) · มีโอกาสลง", "bear", "Overbought"),
  opt("side", "Sideway (อยู่ระหว่างเส้นเขียวกับแดง)", "neutral", "Sideway"),
  opt("ovs", "Oversold (ต่ำกว่าเส้นเขียว) · มีโอกาสขึ้น", "bull", "Oversold"),
];

const UPDOWN = [opt("up", "ขาขึ้น", "bull"), opt("down", "ขาลง", "bear")];

export const SIGNAL_FORMS: Record<string, SignalForm> = {
  "s50-oi": s50Form(),

  /* ───────── ข้อ 3 ───────── */
  "usd-futures": {
    question: "มุมมอง USD Futures จาก 3 อินดี้ในภาพ",
    rule:
      "ระยะกลาง-ยาว = เฉลี่ย Super Flow กับ PBC สะสม · ระยะสั้น = PBC รายวัน · USD ขึ้น (บาทอ่อน) กดดันหุ้นไทย, USD ลง (บาทแข็ง) หนุนหุ้นไทย",
    fields: [
      { key: "superflow", label: "① Super Flow · เงินไหลเข้า/ออก สะสมของต่างชาติ (ระยะยาว)", options: USD_OPTIONS },
      { key: "pbc", label: "② PBC · เงินไหลเข้า/ออก สะสม (ระยะยาว)", options: USD_OPTIONS },
      { key: "pbcDay", label: "③ PBC · เงินไหลเข้า/ออก รายวัน (ระยะสั้น วันนี้)", options: USD_OPTIONS },
    ],
    conclude(values) {
      if (!answers(this.fields, values)) return null;
      const mid = (usdLevel(values.superflow) + usdLevel(values.pbc)) / 2;
      const short = usdLevel(values.pbcDay);
      const midLabel = dirLabel(mid);
      const shortLabel = dirLabel(short);
      // ระยะกลาง-ยาวน้ำหนัก 2 ระยะสั้น 1 · USD ขึ้น = คะแนนหุ้นไทยลดลง
      const combined = (mid * 2 + short) / 3;
      const score = Math.round(50 - combined * 50);
      // เลือกสถานการณ์จากมุมมองระยะกลาง-ยาว — Sideway Up/Down ยังนับเป็นแกว่ง ไม่ใช่เทรนด์
      const id = mid >= 0.75 ? "usd-strong" : mid <= -0.75 ? "usd-weak" : "usd-range";
      const base = fromGuide("usd-futures", id, score);
      base.title = `USD ${midLabel}`;
      base.summary = [
        `ระยะกลาง-ยาว USD มองเป็น ${midLabel}`,
        `ระยะสั้นภายในวัน USD มองเป็น ${shortLabel}`,
        id === "usd-strong"
          ? "บาทมีแนวโน้มอ่อน กดดันหุ้นใหญ่"
          : id === "usd-weak"
            ? "บาทมีแนวโน้มแข็ง หนุนหุ้นใหญ่"
            : mid > 0
              ? "USD เอนขึ้นเล็กน้อย บาทยังไม่อ่อนชัด"
              : mid < 0
                ? "USD เอนลงเล็กน้อย บาทยังไม่แข็งชัด"
                : "ค่าเงินยังไม่ใช่ตัวตัดสิน",
      ];
      base.interpretation = `สรุประยะกลาง-ยาวมองว่า USD เป็น ${midLabel} · ระยะสั้นภายในวันมองว่าเป็น ${shortLabel} — ${base.interpretation}`;
      return base;
    },
  },

  /* ───────── ข้อ 4: ตามชีต ระยะกลาง-ยาว ───────── */
  confirm: {
    question: "แต่ละอินดี้เป็นแนวโน้มไหน",
    rule: "ขาขึ้น 3 = ขาขึ้น · ขาขึ้น 2 = Sideway Up · ขาขึ้น 1 = Sideway Down · ขาขึ้น 0 = ขาลง (มุมมองระยะกลาง-ยาว)",
    fields: [
      { key: "confirm", label: "Confirm Up/Down S50", options: UPDOWN },
      { key: "trend", label: "Trend", options: UPDOWN },
      { key: "mid", label: "Mid Trend", options: UPDOWN },
    ],
    conclude(values) {
      const list = answers(this.fields, values);
      if (!list) return null;
      const up = list.filter((x) => x.opt.value === "up").length;
      const score = Math.round((up / 3) * 100);
      const dir = ["ขาลง", "Sideway Down", "Sideway Up", "ขาขึ้น"][up];
      const lines = list.map((x) => `${x.label} : เป็นแนวโน้ม ${x.opt.label}`);
      const interpretation = `สรุปจากทั้ง 3 อินดี้ ระยะกลาง-ยาว มองว่า S50 มีทิศทาง ${dir}`;
      const views: ViewId[][] = [["reduce-long", "short-rebound"], ["reduce-long"], ["selective-long"], ["hold-long", "buy-dip"]];
      return {
        id: ["confirm-down", "confirm-sideway-down", "confirm-sideway-up", "confirm-up"][up],
        title: `S50 ${dir}`,
        bias: up >= 2 ? "bull" : "bear",
        summary: lines,
        interpretation,
        insight: `ขาขึ้น ${up} ใน 3 อินดี้ · ระยะกลาง-ยาวมอง ${dir}`,
        views: views[up],
        score,
      };
    },
  },

  /* ───────── ข้อ 5: ตามชีต ระยะสั้นภายในวัน ───────── */
  breadth: {
    question: "แต่ละเส้นอยู่โซนไหน",
    rule:
      "Overbought (เหนือเส้นแดง) = มีโอกาสลง · Oversold (ต่ำกว่าเส้นเขียว) = มีโอกาสขึ้น · 3 ใน 4 เส้นไปทางเดียวกัน = มีโอกาสไปทางนั้น · Sideway ทั้งหมดหรือขัดกัน = ยังไม่ชัด",
    fields: [
      { key: "yellow", label: "เส้นเหลือง", options: ZONE },
      { key: "green", label: "เส้นเขียว", options: ZONE },
      { key: "white", label: "เส้นขาว", options: ZONE },
      { key: "purple", label: "เส้นม่วง", options: ZONE },
    ],
    conclude(values) {
      const list = answers(this.fields, values);
      if (!list) return null;
      const ovb = list.filter((x) => x.opt.value === "ovb").length;
      const ovs = list.filter((x) => x.opt.value === "ovs").length;
      const side = list.filter((x) => x.opt.value === "side").length;
      const score = avgScore(list);
      const counts = `Overbought ${ovb} · Sideway ${side} · Oversold ${ovs}`;

      if (ovb >= 3 || ovs >= 3) {
        const down = ovb >= 3;
        const n = down ? ovb : ovs;
        return {
          id: down ? "breadth-ovb" : "breadth-ovs",
          title: down ? "หุ้นใน SET50 มีโอกาสลง" : "หุ้นใน SET50 มีโอกาสขึ้น",
          bias: down ? "bear" : "bull",
          summary: [
            `${n} ใน 4 เส้นอยู่โซน ${down ? "Overbought (เหนือเส้นแดง)" : "Oversold (ต่ำกว่าเส้นเขียว)"}`,
            down ? "หุ้นส่วนใหญ่ขึ้นมามากแล้ว ระยะสั้นมีโอกาสย่อลง" : "หุ้นส่วนใหญ่ลงมามากแล้ว ระยะสั้นมีโอกาสเด้งขึ้น",
            n === 4 ? "ทุกเส้นไปทางเดียวกัน สัญญาณชัด" : `ยังเหลือ ${names(list, (o) => o.value !== (down ? "ovb" : "ovs"))} ที่ยังไม่ตาม`,
          ],
          interpretation: `มุมมอง S50 ระยะสั้นภายในวัน โดยคำนวณจากหุ้นใน SET50 — ${down ? "มีโอกาสลง" : "มีโอกาสขึ้น"} รอสัญญาณภายในวันยืนยัน`,
          insight: down ? "ระยะสั้นมีโอกาสลง" : "ระยะสั้นมีโอกาสขึ้น",
          views: down ? ["reduce-long", "wait"] : ["buy-dip", "selective-long"],
          score,
        };
      }
      return {
        id: side === 4 ? "breadth-side" : "breadth-mixed",
        title: "หุ้นใน SET50 ยังไม่มีทิศทางชัดเจน",
        bias: "neutral",
        summary: [
          counts,
          side === 4 ? "ทุกเส้นอยู่ระหว่างเส้นเขียวกับเส้นแดง" : "เส้นยังไปคนละทาง",
          "รอสัญญาณภายในวันก่อนตัดสินใจ",
        ],
        interpretation: "มุมมอง S50 ระยะสั้นภายในวัน โดยคำนวณจากหุ้นใน SET50 — ยังไม่มีทิศทางชัดเจน รอสัญญาณภายในวัน",
        insight: "ระยะสั้นยังไม่มีทิศทาง รอสัญญาณ",
        views: ["wait"],
        score,
      };
    },
  },

  /* ───────── ข้อ 6: ตามชีต อ่านเป็นทิศทางทองคำ ───────── */
  macro: {
    question: "ตัวแปรตลาดโลกในภาพเป็นแนวโน้มไหน",
    rule:
      "Trend ขึ้น = ทองขึ้น · DXY ขึ้น = ทองลง · US10Y ขึ้น = ทองลง · นับ 3 ตัว: 3 = ทองขาขึ้น · 2 = ค่อนข้างขึ้น · 1 = ค่อนข้างลง · 0 = ทองขาลง · VIX ไม่ปกติ = ตลาดกังวล",
    fields: [
      { key: "trend", label: "Trend", options: [opt("up", "ขาขึ้น → ทองขาขึ้น", "bull", "Trend ขาขึ้น"), opt("down", "ขาลง → ทองขาลง", "bear", "Trend ขาลง")] },
      { key: "dxy", label: "DXY", options: [opt("up", "ขาขึ้น → ทองขาลง", "bear", "DXY ขาขึ้น"), opt("down", "ขาลง → ทองขาขึ้น", "bull", "DXY ขาลง")] },
      { key: "us10y", label: "US10Y", options: [opt("up", "ขาขึ้น → ทองขาลง", "bear", "US10Y ขาขึ้น"), opt("down", "ขาลง → ทองขาขึ้น", "bull", "US10Y ขาลง")] },
      { key: "vix", label: "VIX", options: [opt("normal", "ปกติ", "bull", "VIX ปกติ"), opt("abnormal", "ไม่ปกติ · ตลาดกังวล", "bear", "VIX ไม่ปกติ")] },
    ],
    conclude(values) {
      const list = answers(this.fields, values);
      if (!list) return null;
      const goldUp = list.filter((x) => x.key !== "vix" && x.opt.tone === "bull").length;
      const vixCalm = values.vix === "normal";
      const score = avgScore(list);
      const dir = ["ทองขาลง", "ทองค่อนข้างลง", "ทองค่อนข้างขึ้น", "ทองขาขึ้น"][goldUp];
      const views: ViewId[][] = [["reduce-long"], ["wait"], ["selective-long"], ["hold-long", "buy-dip"]];
      const lines = list
        .filter((x) => x.key !== "vix")
        .map((x) => `${x.label} เป็นแนวโน้ม${x.opt.label.replace(" → ", " ดังนั้น ")}`);
      return {
        id: ["gold-down", "gold-lean-down", "gold-lean-up", "gold-up"][goldUp],
        title: dir,
        bias: goldUp >= 2 ? "bull" : "bear",
        summary: [...lines, vixCalm ? "VIX ปกติ ตลาดยังไม่ตื่นตระหนก" : "VIX ไม่ปกติ ตลาดกังวล ระวังความผันผวน"],
        interpretation: `${goldUp} ใน 3 ปัจจัยหนุนทอง มองว่า${dir}${vixCalm ? "" : " · VIX ไม่ปกติ ความผันผวนสูง ควรลดขนาดสถานะ"}`,
        insight: `${goldUp} ใน 3 ปัจจัยหนุนทอง${vixCalm ? "" : " · VIX ไม่ปกติ ระวังผันผวน"}`,
        views: views[goldUp],
        score,
      };
    },
  },
};

/** ฟอร์มของ section — ข้อ 1 สร้างตาม series ที่ IC ใส่ (มีได้หลาย series ในภาพเดียว) */
export function getSignalForm(sectionId: string, ctx: { series?: string } = {}): SignalForm | undefined {
  if (sectionId === "s50-oi") return s50Form(ctx.series);
  return SIGNAL_FORMS[sectionId];
}
