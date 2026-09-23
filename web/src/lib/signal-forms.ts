import type { Bias, SeriesRead } from "./types";
import { GUIDES, fillText, type ScenarioBase, type ViewId } from "./scenarios";
import { TONE_SCORE } from "./market-score";
import { expiryInfo, inRoll, type ExpiryInfo } from "./contract-expiry";
import { thaiDate, todayBangkok } from "./format";

/**
 * ข้อที่แนบภาพ (1, 3, 4, 5, 6) — IC ดูภาพแล้วเลือกจาก dropdown แบบเดียวกับชีตที่ทีมใช้
 * ระบบสรุปทิศทาง เขียนข้อความ และให้คะแนน 0–100 สำหรับภาพรวมให้เอง
 *
 * tone ของตัวเลือก = ผลต่อตลาดหุ้น / S50 (bull = หนุน · bear = กดดัน) ใช้ระบายสีและคิดคะแนน
 */

/** เวอร์ชันกติกาปัจจุบัน — เปลี่ยนทุกครั้งที่ปรับวิธีให้คะแนน (ใช้แยกข้อมูลย้อนหลังตามกติกา) */
export const RULES_VERSION = "2026-09-21";

export type SignalOption = { value: string; label: string; tone: Bias; short?: string; /** บรรทัดอธิบายเล็กใต้ตัวเลือก */ hint?: string };

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

const opt = (value: string, label: string, tone: Bias, short?: string, hint?: string): SignalOption => ({
  value,
  label,
  tone,
  short,
  ...(hint ? { hint } : {}),
});

/** series ที่ IC ใส่ไว้ เช่น "S50U26 / S50Z26" → ["S50U26", "S50Z26"] */
export function seriesList(series?: string): string[] {
  return (series ?? "")
    .split(/[/,]/)
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
}

/* ───────── ข้อ 1: แท่ง Day + OI ต่อ series (ภาพเดียวมีได้หลาย series ช่วงย้ายสัญญา) ─────────
 *
 * ราคา — TF Day อ่านจากแท่งเทียน 2 มุมพร้อมกัน
 *   ปิดเทียบเปิด     = ใครคุมตลาดระหว่างวัน (แท่งเขียว/แดง)
 *   ปิดเทียบวันก่อน  = ทิศทางรวมของวัน
 *   → ขึ้นชัด · ดีดกลับ (เปิดต่ำปิดสูง) · Doji · โดนขายคืน (เปิดสูงปิดต่ำ) · ลงชัด
 *
 * OI — เพิ่ม / ทรงตัว / ลด · ช่วงใกล้หมดอายุ OI ของ series เดิมลดเพราะคนย้ายสัญญา
 *   จึงถามเพิ่ม "OI รวมทุก series" แล้วใช้ค่านั้นแทน (ดูไม่ได้ = ไม่นับ OI วันนั้น อ่านจากราคาอย่างเดียว)
 */

const PRICE_OPTIONS = [
  opt("up", "ขึ้นชัด", "bull", "ขึ้นชัด", "ปิด > เปิด และ > วันก่อน"),
  opt("rebound", "ดีดกลับ (เปิดต่ำปิดสูง)", "bull", "ดีดกลับ", "ปิด > เปิด แต่ยัง < วันก่อน"),
  opt("doji", "Doji · ลังเล", "neutral", "Doji", "ปิดใกล้ราคาเปิด ตัวแท่งเล็กมาก"),
  opt("fade", "โดนขายคืน (เปิดสูงปิดต่ำ)", "bear", "โดนขายคืน", "ปิด < เปิด แต่ยัง > วันก่อน"),
  opt("down", "ลงชัด", "bear", "ลงชัด", "ปิด < เปิด และ < วันก่อน"),
];
const OI_OPTIONS = [
  opt("up", "เพิ่มขึ้น", "neutral", "เพิ่ม"),
  opt("flat", "ทรงตัว", "neutral", "ทรงตัว", "เปลี่ยนไม่ถึง ~1%"),
  opt("down", "ลดลง", "neutral", "ลด"),
];
const OI_ALL_OPTIONS = [
  opt("up", "OI รวมเพิ่มขึ้น", "neutral", "รวมเพิ่ม"),
  opt("flat", "OI รวมทรงตัว", "neutral", "รวมทรงตัว"),
  opt("down", "OI รวมลดลง", "neutral", "รวมลด"),
  opt("unknown", "ดูไม่ได้", "neutral", "ไม่นับ OI", "ไม่นับ OI วันนี้ อ่านจากราคาอย่างเดียว"),
];

/** คะแนน [แท่งราคา][OI ที่ใช้] — ขึ้นชัด/ลงชัด ตรงกับตารางเดิมของทีม (90 · 60 · 40 · 10) */
const PX_OI_SCORE: Record<string, Record<string, number>> = {
  up: { up: 90, flat: 70, down: 60 },
  rebound: { up: 65, flat: 60, down: 55 },
  doji: { up: 50, flat: 50, down: 50 },
  fade: { up: 35, flat: 45, down: 45 },
  down: { up: 10, flat: 30, down: 40 },
};

function pxScenario(price: string, oi: string) {
  if (price === "up" || price === "down") return `px-${price}-oi-${oi}`;
  return `px-${price}`;
}

/** แท่งที่ไม่ใช่ขึ้นชัด/ลงชัด ใช้การ์ดเดียวกันทุกกรณี OI → บอกเรื่อง OI เพิ่มอีกบรรทัด */
const OI_NOTE: Record<string, string> = {
  up: "Open Interest เพิ่มขึ้น มีสถานะใหม่เข้ามาพร้อมการเคลื่อนไหวนี้",
  flat: "Open Interest ยังไม่ยืนยันทิศทาง",
  down: "Open Interest ลดลง เป็นการปิดสถานะมากกว่าเปิดใหม่",
};

const OI_ALL_NOTE: Record<string, string> = {
  up: "OI รวมทุก series เพิ่มขึ้น — มีสถานะใหม่จริง ไม่ใช่แค่ย้ายสัญญา",
  flat: "OI รวมทุก series ทรงตัว — ส่วนใหญ่เป็นการย้ายสัญญา ยังไม่มีเงินใหม่",
  down: "OI รวมทุก series ลดลง — มีการปิดสถานะจริง ไม่ใช่แค่ย้ายสัญญา",
  unknown: "วันนี้ไม่นับ OI เพราะอยู่ช่วงย้ายสัญญา อ่านจากแท่งราคาอย่างเดียว",
};

function expiryNote(e: ExpiryInfo) {
  const when = `ซื้อขายวันสุดท้าย ${thaiDate(e.lastTrade).replace(/ \d{4}$/, "")}`;
  if (e.phase === "expired") return `${e.series} หมดอายุแล้ว (${when}) — ควรดู ${e.next} แทน`;
  if (e.phase === "last-day") return `วันนี้เป็นวันซื้อขายวันสุดท้ายของ ${e.series} — OI ลดลงจากการย้ายไป ${e.next} เป็นเรื่องปกติ`;
  return `${e.series} เหลือ ${e.daysLeft} วันทำการ (${when}) — OI ที่ลดลงส่วนหนึ่งมาจากการย้ายไป ${e.next}`;
}

function s50Form(series?: string, date = todayBangkok()): SignalForm {
  const list = seriesList(series);
  // series เดียวใช้คีย์เดิม (price / oi) ร่างที่บันทึกไว้ก่อนหน้าจะยังใช้ได้
  const key = (k: string, s: string) => (list.length > 1 ? `${k}:${s}` : k);
  const shown = list.length ? list : [""];
  const expiries = list.map((s) => expiryInfo(s, date));
  const rolling = expiries.find(inRoll) ?? null;

  const fields: SignalField[] = shown.flatMap((s) => {
    const e = expiries[list.indexOf(s)];
    return [
      { key: key("price", s), label: s ? `แท่ง Day ${s}` : "แท่ง Day", options: PRICE_OPTIONS },
      {
        key: key("oi", s),
        label: `${s ? `OI ${s}` : "Open Interest"}${inRoll(e) ? " · ช่วงย้ายสัญญา" : ""}`,
        options: OI_OPTIONS,
      },
    ];
  });
  if (rolling) fields.push({ key: "oiAll", label: "OI รวมทุก series (ใช้แทนช่วงย้ายสัญญา)", options: OI_ALL_OPTIONS });

  return {
    question:
      list.length > 1
        ? `แท่งราคา Day และ Open Interest ของแต่ละ series (${list.join(" · ")})`
        : "แท่งราคา Day และ Open Interest ในภาพเป็นแบบไหน",
    rule:
      "ขึ้นชัด + OI เพิ่ม 90 · ทรงตัว 70 · ลด 60 | ดีดกลับ 55–65 | Doji 50 | โดนขายคืน 35–45 | ลงชัด + OI ลด 40 · ทรงตัว 30 · เพิ่ม 10" +
      (rolling ? " · ช่วงย้ายสัญญาใช้ OI รวมทุก series แทน OI ของแต่ละตัว" : "") +
      (list.length > 1 ? " · หลาย series: series แรกเป็นตัวหลัก คะแนนเฉลี่ยทุก series" : ""),
    fields,
    conclude(values) {
      if (!answers(this.fields, values)) return null;
      const oiAll = rolling ? values.oiAll : undefined;
      const per = shown.map((s, i) => {
        const price = values[key("price", s)];
        const oi = values[key("oi", s)];
        // ช่วงย้ายสัญญา OI ของแต่ละตัวบิด → ใช้ OI รวม · ดูไม่ได้ = ไม่นับ OI (เท่ากับทรงตัว)
        const used = oiAll ? (oiAll === "unknown" ? "flat" : oiAll) : oi;
        const id = pxScenario(price, used);
        return { s, price, oi, used, id, score: PX_OI_SCORE[price]?.[used] ?? 50, expiry: expiries[i] ?? null };
      });
      const main = per[0];
      const score = Math.round(per.reduce((n, x) => n + x.score, 0) / per.length);
      const base = fromGuide("s50-oi", main.id, score);
      const notes: string[] = [];

      // ช่วงย้ายสัญญาบรรทัด OI รวมบอกเรื่อง OI แทนแล้ว
      if (main.price !== "up" && main.price !== "down" && !oiAll) notes.push(OI_NOTE[main.used]);
      if (rolling && oiAll) {
        notes.push(expiryNote(rolling));
        notes.push(OI_ALL_NOTE[oiAll]);
      }
      // series อื่นไปคนละทาง → บอกลูกค้าตรง ๆ
      for (const other of per.slice(1)) {
        const sc = GUIDES["s50-oi"].scenarios.find((x) => x.id === other.id)!;
        notes.push(
          other.id === main.id
            ? `${other.s} ไปทางเดียวกัน (${fillText(sc.title, { series: other.s })})`
            : `${other.s} ต่างออกไป: ${fillText(sc.title, { series: other.s })} — ${sc.tag}`,
        );
      }
      base.notes = notes;

      if (list.length) {
        base.perSeries = per.map((x) => {
          const sc = GUIDES["s50-oi"].scenarios.find((g) => g.id === x.id)!;
          const po = PRICE_OPTIONS.find((o) => o.value === x.price);
          const e = x.expiry;
          return {
            series: x.s,
            price: x.price,
            priceLabel: po?.short,
            priceTone: po?.tone,
            oi: x.oi,
            ...(oiAll ? { oiUsed: oiAll } : {}),
            ...(e && e.phase !== "normal"
              ? { expiry: { lastTrade: e.lastTrade, daysLeft: e.daysLeft, phase: e.phase, next: e.next } }
              : {}),
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
  if (values.oiAll) next.oiAll = values.oiAll;
  return next;
}

/* ───────── ข้อ 3: USD Futures 3 อินดี้ตามชีต ───────── */

/**
 * ทิศทางของ USD — 3 ทางตามที่ทีมดูจริงในภาพ
 * ค่าบวกคือดอลลาร์ขึ้น (บาทอ่อน) ซึ่งกดดันหุ้นไทย
 */
const USD_DIR = [
  { value: "up", label: "Break High", hint: "ทะลุกรอบบน · USD แข็ง บาทอ่อน", level: 1, tone: "bear" as Bias },
  { value: "side", label: "Sideway", hint: "ยังอยู่ในกรอบ ไม่ทะลุด้านไหน", level: 0, tone: "neutral" as Bias },
  { value: "down", label: "Break Low", hint: "หลุดกรอบล่าง · USD อ่อน บาทแข็ง", level: -1, tone: "bull" as Bias },
];
const USD_OPTIONS = USD_DIR.map((d) => opt(d.value, d.label, d.tone, d.label, d.hint));
/** ค่าที่ทีมเคยเลือกไว้ตอนยังมี 5 ตัวเลือก — ร่างเก่ายังอ่านได้ */
const USD_LEGACY: Record<string, number> = { "side-up": 0.5, "side-down": -0.5 };
const usdLevel = (v?: string) => USD_DIR.find((d) => d.value === v)?.level ?? USD_LEGACY[v ?? ""] ?? 0;

/** ระดับเฉลี่ย → คำเรียกทิศทาง (เฉลี่ยจาก 2 อินดี้ จึงมีกรณีเอนไปทางเดียว) */
function dirLabel(level: number) {
  if (level >= 0.75) return "Break High";
  if (level >= 0.25) return "ค่อนไป Break High";
  if (level > -0.25) return "Sideway";
  if (level > -0.75) return "ค่อนไป Break Low";
  return "Break Low";
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
      "ระยะกลาง-ยาว = เฉลี่ย Super Flow กับ PBC สะสม · ระยะสั้น = PBC รายวัน · Break High (บาทอ่อน) กดดันหุ้นไทย, Break Low (บาทแข็ง) หนุนหุ้นไทย",
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
      // เลือกสถานการณ์จากมุมมองระยะกลาง-ยาว — เอนไปทางเดียว (2 อินดี้ไม่ตรงกัน) ยังนับเป็นแกว่ง
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
              ? "USD เอนขึ้นเล็กน้อย ยังไม่ Break High ทั้งสองอินดี้"
              : mid < 0
                ? "USD เอนลงเล็กน้อย ยังไม่ Break Low ทั้งสองอินดี้"
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
export function getSignalForm(sectionId: string, ctx: { series?: string; date?: string } = {}): SignalForm | undefined {
  if (sectionId === "s50-oi") return s50Form(ctx.series, ctx.date);
  return SIGNAL_FORMS[sectionId];
}
