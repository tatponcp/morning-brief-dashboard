import type { Bias } from "./types";
import type { ViewId } from "./scenarios";

/**
 * ข้อ 4 และ 5 ไม่ต้องพิมพ์ตัวเลข — IC เลือกจาก dropdown ว่าแต่ละเส้นเป็นทิศไหน
 * ระบบสรุปให้เองตามกติกาที่ทีมใช้จริง แล้วลูกค้าเห็นเป็นแถบสัญญาณสีเดียวกัน
 */

export type SignalOption = { value: string; label: string; tone: Bias };

export type SignalConclusion = {
  id: string;
  title: string;
  bias: Bias;
  summary: string[];
  interpretation: string;
  insight: string;
  views: ViewId[];
};

export type SignalForm = {
  /** คำถามที่ IC ตอบด้วย dropdown */
  question: string;
  rule: string;
  fields: { key: string; label: string }[];
  options: SignalOption[];
  conclude: (values: Record<string, string>) => SignalConclusion | null;
};

const TREND: SignalOption[] = [
  { value: "up", label: "ขาขึ้น", tone: "bull" },
  { value: "down", label: "ขาลง", tone: "bear" },
  { value: "flat", label: "ยังไม่ชัด", tone: "neutral" },
];

const ZONE: SignalOption[] = [
  { value: "ovb", label: "Overbought (เหนือเส้นแดง)", tone: "bull" },
  { value: "side", label: "Sideway (อยู่ระหว่างเส้น)", tone: "neutral" },
  { value: "ovs", label: "Oversold (ต่ำเส้นเขียว)", tone: "bear" },
];

export function optionOf(form: SignalForm, value?: string) {
  return form.options.find((o) => o.value === value);
}

/** คำตอบที่เลือกครบแล้วเท่านั้นถึงจะสรุปได้ */
function answers(form: SignalForm, values: Record<string, string>) {
  const list = form.fields.map((f) => ({ ...f, opt: optionOf(form, values[f.key]) }));
  return list.every((x) => x.opt) ? (list as { key: string; label: string; opt: SignalOption }[]) : null;
}

const count = (list: { opt: SignalOption }[], tone: Bias) => list.filter((x) => x.opt.tone === tone).length;

export const SIGNAL_FORMS: Record<string, SignalForm> = {
  confirm: {
    question: "แต่ละเส้นกำลังเป็นแนวโน้มไหน",
    rule: "ทั้งสามเส้นไปทางเดียวกัน = ยืนยันชัด · สองในสามและไม่มีเส้นสวน = เอียงไปทางนั้น · สวนกัน = ยังไม่ชัด",
    fields: [
      { key: "confirm", label: "Confirm Up/Down S50" },
      { key: "trend", label: "Trend" },
      { key: "mid", label: "Mid Trend" },
    ],
    options: TREND,
    conclude(values) {
      const list = answers(this, values);
      if (!list) return null;
      const up = count(list, "bull");
      const down = count(list, "bear");
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
        };
      }
      if (up >= 2 && down === 0) {
        return {
          id: "confirm-lean-up",
          title: "เอียงขาขึ้น",
          bias: "bull",
          summary: [
            `${up} ใน 3 เส้นเป็นขาขึ้น และไม่มีเส้นไหนสวนลง`,
            `ยังเหลือ ${names("neutral")} ที่ยังไม่ยืนยัน`,
            "ภาพเอียงขึ้น แต่ยังไม่เต็มแรง",
          ],
          interpretation: "ส่วนใหญ่เป็นขาขึ้นและไม่มีเส้นไหนสวนลง ภาพรวมเอียงขึ้น แต่ยังรอเส้นที่เหลือยืนยัน",
          insight: "เอียงขาขึ้น รอเส้นที่เหลือตาม",
          views: ["selective-long"],
        };
      }
      if (down >= 2 && up === 0) {
        return {
          id: "confirm-lean-down",
          title: "เอียงขาลง",
          bias: "bear",
          summary: [
            `${down} ใน 3 เส้นเป็นขาลง และไม่มีเส้นไหนสวนขึ้น`,
            `ยังเหลือ ${names("neutral")} ที่ยังไม่ยืนยัน`,
            "ภาพเอียงลง ควรระวังการลงต่อ",
          ],
          interpretation: "ส่วนใหญ่เป็นขาลงและไม่มีเส้นไหนสวนขึ้น ภาพรวมเอียงลง ควรระวังการลงต่อ",
          insight: "เอียงขาลง ยังไม่ควรรีบรับ",
          views: ["reduce-long"],
        };
      }
      return {
        id: "confirm-mixed",
        title: "สัญญาณขัดกัน",
        bias: "neutral",
        summary: [
          `ขาขึ้น ${up} เส้น · ขาลง ${down} เส้น`,
          "สัญญาณสวนกัน ยังไม่ยืนยันทิศทาง",
          "รอให้ตรงกันก่อนค่อยเพิ่มสถานะ",
        ],
        interpretation: "เส้นแต่ละอันไปคนละทาง ยังไม่มีการยืนยันทิศทาง รอให้สัญญาณตรงกันก่อนค่อยเพิ่มสถานะ",
        insight: "สัญญาณขัดกัน รอความชัดเจน",
        views: ["wait"],
      };
    },
  },

  breadth: {
    question: "แต่ละเส้นอยู่โซนไหน",
    rule: "3 ใน 4 เส้นไปทางเดียวกัน = มีโอกาสไปทางนั้น · Sideway ทั้งหมด = ยังไม่ชัด · ทิศทางขัดกัน = ยังไม่ชัด",
    fields: [
      { key: "yellow", label: "เส้นเหลือง" },
      { key: "green", label: "เส้นเขียว" },
      { key: "white", label: "เส้นขาว" },
      { key: "purple", label: "เส้นม่วง" },
    ],
    options: ZONE,
    conclude(values) {
      const list = answers(this, values);
      if (!list) return null;
      const ovb = count(list, "bull");
      const ovs = count(list, "bear");
      const side = count(list, "neutral");
      const others = (tone: Bias) =>
        list
          .filter((x) => x.opt.tone !== tone)
          .map((x) => x.label)
          .join(" และ ");

      if (ovb >= 3) {
        return {
          id: "breadth-ovb",
          title: `Overbought ${ovb} ใน 4 เส้น`,
          bias: "bull",
          summary: [
            `หุ้นส่วนใหญ่อยู่โซน Overbought (${ovb} ใน 4 เส้น)`,
            "ตลาดขึ้นกว้างทั้งกระดาน ไม่ได้ขึ้นเฉพาะหุ้นใหญ่ไม่กี่ตัว",
            ovb === 4 ? "ขึ้นมามากแล้ว ระวังจังหวะพักตัวระยะสั้น" : `ยังเหลือ ${others("bull")} ที่ยังไม่ตาม`,
          ],
          interpretation:
            "หุ้นส่วนใหญ่อยู่โซน Overbought ตลาดแข็งแรงทั้งกระดาน แต่ขึ้นมามากแล้ว ให้ระวังจังหวะพักตัวระยะสั้น",
          insight: "แรงซื้อกว้างทั้งกระดาน แต่เริ่มร้อน",
          views: ["hold-long"],
        };
      }
      if (ovs >= 3) {
        return {
          id: "breadth-ovs",
          title: `Oversold ${ovs} ใน 4 เส้น`,
          bias: "bear",
          summary: [
            `หุ้นส่วนใหญ่อยู่โซน Oversold (${ovs} ใน 4 เส้น)`,
            "แรงขายกระจายทั้งกระดาน ไม่ใช่แค่หุ้นบางตัว",
            ovs === 4 ? "ลงมาลึกแล้ว มีโอกาสเด้งทางเทคนิค" : `ยังเหลือ ${others("bear")} ที่ยังไม่ตาม`,
          ],
          interpretation:
            "หุ้นส่วนใหญ่อยู่โซน Oversold แรงขายกระจายทั้งกระดาน ยังไม่ควรรีบรับจนกว่าจะเห็นสัญญาณฟื้น",
          insight: "แรงขายกระจายทั้งกระดาน",
          views: ["wait", "reduce-long"],
        };
      }
      if (side === 4) {
        return {
          id: "breadth-side",
          title: "Sideway ทั้ง 4 เส้น",
          bias: "neutral",
          summary: [
            "ทั้ง 4 เส้นอยู่ในโซน Sideway",
            "ยังไม่มีฝั่งไหนคุมตลาดได้",
            "รอสัญญาณระหว่างวันก่อนตัดสินใจ",
          ],
          interpretation: "ทุกเส้นอยู่ระหว่างเส้นเขียวและเส้นแดง ตลาดยังไม่มีทิศทางชัดเจน รอสัญญาณภายในวัน",
          insight: "ยังไม่มีทิศทางชัดเจน รอสัญญาณ",
          views: ["wait"],
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
      };
    },
  },
};
