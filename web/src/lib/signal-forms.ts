import type { Bias } from "./types";
import { GUIDES, type ScenarioBase, type ViewId } from "./scenarios";
import { TONE_SCORE } from "./market-score";

/**
 * ข้อที่แนบภาพ (1, 3, 4, 5, 6) — IC ดูภาพแล้วเลือกจาก dropdown ว่าแต่ละตัวเป็นทิศไหน
 * ระบบเลือกสถานการณ์ เขียนข้อความ และให้คะแนน 0–100 สำหรับภาพรวมให้เอง
 */

export type SignalOption = { value: string; label: string; tone: Bias; short?: string };

export type SignalField = { key: string; label: string; options: SignalOption[] };

export type SignalConclusion = ScenarioBase & { views: ViewId[]; score: number };

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

/** คำตอบครบทุกช่องแล้วเท่านั้นถึงจะสรุปได้ */
function answers(fields: SignalField[], values: Record<string, string>) {
  const list = fields.map((f) => ({ ...f, opt: optionOf(f, values[f.key]) }));
  return list.every((x) => x.opt) ? (list as (SignalField & { opt: SignalOption })[]) : null;
}

const avgScore = (list: { opt: SignalOption }[]) =>
  Math.round(list.reduce((n, x) => n + TONE_SCORE[x.opt.tone], 0) / list.length);

const count = (list: { opt: SignalOption }[], tone: Bias) => list.filter((x) => x.opt.tone === tone).length;

/** ดึงข้อความของสถานการณ์จากคู่มือกลาง — ทีมแก้คำที่ scenarios.ts หรือบันทึกคำเองใน Studio */
function fromGuide(sectionId: string, scenarioId: string, score: number): SignalConclusion {
  const sc = GUIDES[sectionId].scenarios.find((x) => x.id === scenarioId)!;
  return { ...sc, score };
}

const opt = (value: string, label: string, tone: Bias, short?: string): SignalOption => ({
  value,
  label,
  tone,
  short,
});

const TREND = [opt("up", "ขาขึ้น", "bull"), opt("flat", "ยังไม่ชัด", "neutral"), opt("down", "ขาลง", "bear")];
const ZONE = [
  opt("ovb", "Overbought (เหนือเส้นแดง)", "bull", "Overbought"),
  opt("side", "Sideway (อยู่ระหว่างเส้น)", "neutral", "Sideway"),
  opt("ovs", "Oversold (ต่ำเส้นเขียว)", "bear", "Oversold"),
];

export const SIGNAL_FORMS: Record<string, SignalForm> = {
  /* ───────── ข้อ 1 ───────── */
  "s50-oi": {
    question: "ราคาและ Open Interest ในภาพไปทางไหน",
    rule: "ราคาขึ้น + OI เพิ่ม = 90% · ราคาขึ้น + OI ลด = 60% · ราคาลง + OI ลด = 40% · ราคาลง + OI เพิ่ม = 10%",
    fields: [
      { key: "price", label: "ราคา", options: [opt("up", "ขึ้น", "bull", "ราคาขึ้น"), opt("down", "ลง", "bear", "ราคาลง")] },
      {
        key: "oi",
        label: "Open Interest",
        options: [opt("up", "เพิ่มขึ้น", "neutral", "OI เพิ่ม"), opt("down", "ลดลง", "neutral", "OI ลด")],
      },
    ],
    conclude(values) {
      if (!answers(this.fields, values)) return null;
      const up = values.price === "up";
      const oiUp = values.oi === "up";
      const score = up ? (oiUp ? 90 : 60) : oiUp ? 10 : 40;
      return fromGuide("s50-oi", `px-${up ? "up" : "down"}-oi-${oiUp ? "up" : "down"}`, score);
    },
  },

  /* ───────── ข้อ 3 ───────── */
  "usd-futures": {
    question: "USD Futures และ flow ในภาพไปทางไหน",
    rule: "USD อ่อน + Short USD เพิ่ม = บาทแข็ง (บวก) · USD แข็ง + Long USD เพิ่ม = บาทอ่อน (ลบ) · นอกนั้น = แกว่ง",
    fields: [
      {
        key: "usd",
        label: "ทิศทาง USD Futures",
        options: [
          opt("weak", "อ่อนค่า (บาทแข็ง)", "bull", "USD อ่อน"),
          opt("range", "แกว่งในกรอบ", "neutral"),
          opt("strong", "แข็งค่า (บาทอ่อน)", "bear", "USD แข็ง"),
        ],
      },
      {
        key: "flow",
        label: "Flow",
        options: [
          opt("short", "Short USD เพิ่ม", "bull"),
          opt("none", "ยังไม่ชัด", "neutral"),
          opt("long", "Long USD เพิ่ม", "bear"),
        ],
      },
    ],
    conclude(values) {
      const list = answers(this.fields, values);
      if (!list) return null;
      const score = avgScore(list);
      const id = score >= 75 ? "usd-weak" : score <= 25 ? "usd-strong" : "usd-range";
      return fromGuide("usd-futures", id, score);
    },
  },

  /* ───────── ข้อ 4 ───────── */
  confirm: {
    question: "แต่ละเส้นกำลังเป็นแนวโน้มไหน",
    rule: "ทั้งสามเส้นไปทางเดียวกัน = ยืนยันชัด · สองในสามและไม่มีเส้นสวน = เอียงไปทางนั้น · สวนกัน = ยังไม่ชัด",
    fields: [
      { key: "confirm", label: "Confirm Up/Down S50", options: TREND },
      { key: "trend", label: "Trend", options: TREND },
      { key: "mid", label: "Mid Trend", options: TREND },
    ],
    conclude(values) {
      const list = answers(this.fields, values);
      if (!list) return null;
      const up = count(list, "bull");
      const down = count(list, "bear");
      const score = avgScore(list);
      const names = (tone: Bias) =>
        list
          .filter((x) => x.opt.tone === tone)
          .map((x) => x.label)
          .join(" และ ");

      if (up === 3 || down === 3) {
        const bull = up === 3;
        return {
          id: bull ? "confirm-all-up" : "confirm-all-down",
          title: bull ? "ขาขึ้นทั้งสามเส้น" : "ขาลงทั้งสามเส้น",
          bias: bull ? "bull" : "bear",
          summary: [
            `ทั้ง 3 เส้นเป็น${bull ? "ขาขึ้น" : "ขาลง"}พร้อมกัน`,
            "ราคาและแรงเงินยืนยันไปทางเดียวกัน",
            bull ? "ขาขึ้นน่าเชื่อถือ ถือสถานะต่อได้" : "แรงขายยังมีต่อ ยังไม่ใช่จังหวะรับ",
          ],
          interpretation: bull
            ? "ทั้งสามเส้นเป็นขาขึ้นพร้อมกัน ราคาและแรงเงินยืนยันไปทางเดียวกัน ขาขึ้นจึงน่าเชื่อถือ"
            : "ทั้งสามเส้นเป็นขาลงพร้อมกัน แรงเงินยืนยันฝั่งลง ยังไม่ใช่จังหวะรับ",
          insight: bull ? "สามเส้นยืนยันขาขึ้นพร้อมกัน" : "สามเส้นยืนยันขาลงพร้อมกัน",
          views: bull ? ["hold-long", "buy-dip"] : ["reduce-long", "short-rebound"],
          score,
        };
      }
      if ((up >= 2 && down === 0) || (down >= 2 && up === 0)) {
        const bull = up >= 2;
        return {
          id: bull ? "confirm-lean-up" : "confirm-lean-down",
          title: bull ? "เอียงขาขึ้น" : "เอียงขาลง",
          bias: bull ? "bull" : "bear",
          summary: [
            `${bull ? up : down} ใน 3 เส้นเป็น${bull ? "ขาขึ้น" : "ขาลง"} และไม่มีเส้นไหนสวน`,
            `ยังเหลือ ${names("neutral")} ที่ยังไม่ยืนยัน`,
            bull ? "ภาพเอียงขึ้น แต่ยังไม่เต็มแรง" : "ภาพเอียงลง ควรระวังการลงต่อ",
          ],
          interpretation: bull
            ? "ส่วนใหญ่เป็นขาขึ้นและไม่มีเส้นไหนสวนลง ภาพรวมเอียงขึ้น แต่ยังรอเส้นที่เหลือยืนยัน"
            : "ส่วนใหญ่เป็นขาลงและไม่มีเส้นไหนสวนขึ้น ภาพรวมเอียงลง ควรระวังการลงต่อ",
          insight: bull ? "เอียงขาขึ้น รอเส้นที่เหลือตาม" : "เอียงขาลง ยังไม่ควรรีบรับ",
          views: bull ? ["selective-long"] : ["reduce-long"],
          score,
        };
      }
      return {
        id: "confirm-mixed",
        title: "สัญญาณขัดกัน",
        bias: "neutral",
        summary: [`ขาขึ้น ${up} เส้น · ขาลง ${down} เส้น`, "สัญญาณสวนกัน ยังไม่ยืนยันทิศทาง", "รอให้ตรงกันก่อนค่อยเพิ่มสถานะ"],
        interpretation: "เส้นแต่ละอันไปคนละทาง ยังไม่มีการยืนยันทิศทาง รอให้สัญญาณตรงกันก่อนค่อยเพิ่มสถานะ",
        insight: "สัญญาณขัดกัน รอความชัดเจน",
        views: ["wait"],
        score,
      };
    },
  },

  /* ───────── ข้อ 5 ───────── */
  breadth: {
    question: "แต่ละเส้นอยู่โซนไหน",
    rule: "3 ใน 4 เส้นไปทางเดียวกัน = มีโอกาสไปทางนั้น · Sideway ทั้งหมด = ยังไม่ชัด · ทิศทางขัดกัน = ยังไม่ชัด",
    fields: [
      { key: "yellow", label: "เส้นเหลือง", options: ZONE },
      { key: "green", label: "เส้นเขียว", options: ZONE },
      { key: "white", label: "เส้นขาว", options: ZONE },
      { key: "purple", label: "เส้นม่วง", options: ZONE },
    ],
    conclude(values) {
      const list = answers(this.fields, values);
      if (!list) return null;
      const ovb = count(list, "bull");
      const ovs = count(list, "bear");
      const side = count(list, "neutral");
      const score = avgScore(list);
      const others = (tone: Bias) =>
        list
          .filter((x) => x.opt.tone !== tone)
          .map((x) => x.label)
          .join(" และ ");

      if (ovb >= 3 || ovs >= 3) {
        const bull = ovb >= 3;
        const n = bull ? ovb : ovs;
        const zone = bull ? "Overbought" : "Oversold";
        const tail =
          n === 4
            ? bull
              ? "ขึ้นมามากแล้ว ระวังจังหวะพักตัวระยะสั้น"
              : "ลงมาลึกแล้ว มีโอกาสเด้งทางเทคนิค"
            : `ยังเหลือ ${others(bull ? "bull" : "bear")} ที่ยังไม่ตาม`;
        return {
          id: bull ? "breadth-ovb" : "breadth-ovs",
          title: `${zone} ${n} ใน 4 เส้น`,
          bias: bull ? "bull" : "bear",
          summary: [
            `หุ้นส่วนใหญ่อยู่โซน ${zone} (${n} ใน 4 เส้น)`,
            bull ? "ตลาดขึ้นกว้างทั้งกระดาน ไม่ได้ขึ้นเฉพาะหุ้นใหญ่ไม่กี่ตัว" : "แรงขายกระจายทั้งกระดาน ไม่ใช่แค่หุ้นบางตัว",
            tail,
          ],
          interpretation: bull
            ? "หุ้นส่วนใหญ่อยู่โซน Overbought ตลาดแข็งแรงทั้งกระดาน แต่ขึ้นมามากแล้ว ให้ระวังจังหวะพักตัวระยะสั้น"
            : "หุ้นส่วนใหญ่อยู่โซน Oversold แรงขายกระจายทั้งกระดาน ยังไม่ควรรีบรับจนกว่าจะเห็นสัญญาณฟื้น",
          insight: bull ? "แรงซื้อกว้างทั้งกระดาน แต่เริ่มร้อน" : "แรงขายกระจายทั้งกระดาน",
          views: bull ? ["hold-long"] : ["wait", "reduce-long"],
          score,
        };
      }
      if (side === 4) {
        return {
          id: "breadth-side",
          title: "Sideway ทั้ง 4 เส้น",
          bias: "neutral",
          summary: ["ทั้ง 4 เส้นอยู่ในโซน Sideway", "ยังไม่มีฝั่งไหนคุมตลาดได้", "รอสัญญาณระหว่างวันก่อนตัดสินใจ"],
          interpretation: "ทุกเส้นอยู่ระหว่างเส้นเขียวและเส้นแดง ตลาดยังไม่มีทิศทางชัดเจน รอสัญญาณภายในวัน",
          insight: "ยังไม่มีทิศทางชัดเจน รอสัญญาณ",
          views: ["wait"],
          score,
        };
      }
      return {
        id: "breadth-mixed",
        title: "ทิศทางขัดกัน",
        bias: "neutral",
        summary: [
          `Overbought ${ovb} เส้น · Sideway ${side} เส้น · Oversold ${ovs} เส้น`,
          "เส้นยังไปคนละทาง ภาพรวมตลาดจึงยังไม่ชัด",
          "รอให้ส่วนใหญ่ไปทางเดียวกันก่อน",
        ],
        interpretation: "เส้นแต่ละอันอยู่คนละโซน ภาพรวมของตลาดยังไม่ชัด ควรรอให้เส้นส่วนใหญ่ไปทางเดียวกันก่อน",
        insight: "เส้นขัดกัน ภาพยังไม่ชัด",
        views: ["wait"],
        score,
      };
    },
  },

  /* ───────── ข้อ 6 ───────── */
  macro: {
    question: "ตัวแปรตลาดโลกในภาพไปทางไหน",
    rule: "ลดลง = หนุนตลาดหุ้น (100) · ทรงตัว = 50 · เพิ่มขึ้น = กดดัน (0) · เฉลี่ย ≥ 67% = Risk-on · ≤ 33% = Risk-off",
    fields: [
      {
        key: "vix",
        label: "VIX",
        options: [opt("down", "ลดลง", "bull", "VIX ลด"), opt("flat", "ทรงตัว", "neutral", "VIX ทรง"), opt("up", "เพิ่มขึ้น", "bear", "VIX เพิ่ม")],
      },
      {
        key: "dxy",
        label: "DXY (ดอลลาร์)",
        options: [opt("down", "อ่อนค่า", "bull", "DXY อ่อน"), opt("flat", "ทรงตัว", "neutral", "DXY ทรง"), opt("up", "แข็งค่า", "bear", "DXY แข็ง")],
      },
      {
        key: "us10y",
        label: "US10Y (Bond Yield)",
        options: [opt("down", "ลดลง", "bull", "Yield ลด"), opt("flat", "ทรงตัว", "neutral", "Yield ทรง"), opt("up", "เพิ่มขึ้น", "bear", "Yield เพิ่ม")],
      },
    ],
    conclude(values) {
      const list = answers(this.fields, values);
      if (!list) return null;
      const score = avgScore(list);
      const id = score >= 67 ? "risk-on" : score <= 33 ? "risk-off" : "mixed";
      return fromGuide("macro", id, score);
    },
  },
};
