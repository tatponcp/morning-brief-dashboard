import type { Bias, ContractSeries, FlowRow, Instrument, Narrative } from "./types";

/**
 * คู่มือสถานการณ์ของแต่ละ section — IC เลือกการ์ดแล้วระบบร่างข้อความให้ แก้คำต่อได้ทุกช่อง
 * ข้อความเป็นร่างตั้งต้นจากหลักการอ่าน indicator ทั่วไป ทีม IC ปรับคำในไฟล์นี้ได้เลย
 */

export type Scenario = {
  id: string;
  title: string;
  /** คำอธิบายสั้นใต้ชื่อการ์ด */
  tag: string;
  bias: Bias;
  summary: string[];
  interpretation: string;
  insight: string;
  /** มุมมองที่เลือกไว้ให้ก่อนเมื่อกดการ์ดนี้ */
  views: ViewId[];
};

export type ViewId = "hold-long" | "buy-dip" | "selective-long" | "wait" | "reduce-long" | "short-rebound";

export const VIEWS: { id: ViewId; label: string; tone: Bias }[] = [
  { id: "hold-long", label: "ถือ Long ได้", tone: "bull" },
  { id: "buy-dip", label: "Buy on dip", tone: "bull" },
  { id: "selective-long", label: "Selective Long", tone: "neutral" },
  { id: "wait", label: "รอดูก่อน", tone: "neutral" },
  { id: "reduce-long", label: "ลดสถานะ Long", tone: "bear" },
  { id: "short-rebound", label: "Short on rebound", tone: "bear" },
];

export type Guide = {
  /** คำถามที่ IC ต้องตอบเมื่อดูภาพ/ข้อมูลของ section นี้ */
  question: string;
  /** ช่องตัวเลขที่ใส่ใน Action วันนี้ */
  levels: { label: string; placeholder: string }[];
  scenarios: Scenario[];
};

export const GUIDES: Record<string, Guide> = {
  "s50-oi": {
    question: "ราคาและ Open Interest วันล่าสุดไปทางไหน",
    levels: [
      { label: "แนวรับ", placeholder: "1,070" },
      { label: "แนวต้าน", placeholder: "1,085" },
    ],
    scenarios: [
      {
        id: "px-up-oi-up",
        title: "ราคาขึ้น + OI เพิ่ม",
        tag: "Long ใหม่เข้า",
        bias: "bull",
        summary: ["ราคา S50 ขึ้นพร้อม Open Interest เพิ่ม", "มีสถานะ Long ใหม่เข้ามา"],
        interpretation: "แรงซื้อเป็นเงินใหม่ ไม่ใช่แค่การปิด Short แนวโน้มขาขึ้นจึงแข็งแรงและมีโอกาสไปต่อ",
        insight: "ขาขึ้นที่มี OI หนุนมักไปต่อได้",
        views: ["hold-long", "buy-dip"],
      },
      {
        id: "px-up-oi-down",
        title: "ราคาขึ้น + OI ลด",
        tag: "แรงปิด Short",
        bias: "neutral",
        summary: ["ราคา S50 ขึ้น แต่ Open Interest ลดลง", "แรงขึ้นมาจากการปิดสถานะ Short"],
        interpretation: "การขึ้นรอบนี้ยังไม่มีเงินใหม่หนุน อาจเป็นเพียงรีบาวด์ระยะสั้น ไม่ควรไล่ราคา",
        insight: "ขึ้นเพราะ Short cover ระวังหมดแรงเร็ว",
        views: ["selective-long"],
      },
      {
        id: "px-down-oi-up",
        title: "ราคาลง + OI เพิ่ม",
        tag: "Short ใหม่เข้า",
        bias: "bear",
        summary: ["ราคา S50 ย่อลง แต่ Open Interest เพิ่มขึ้น", "มีสถานะใหม่เข้ามาฝั่ง Short"],
        interpretation: "ภาพนี้ไม่ใช่การพักตัวธรรมดา มีแรงกดดันใหม่เข้ามา ต้องระวังการลงต่อ",
        insight: "ราคาลงพร้อม OI เพิ่ม แรงขายใหม่ยังไม่หมด",
        views: ["reduce-long", "short-rebound"],
      },
      {
        id: "px-down-oi-down",
        title: "ราคาลง + OI ลด",
        tag: "ปิด Long / ขายทำกำไร",
        bias: "neutral",
        summary: ["ราคา S50 ย่อลงพร้อม Open Interest ลดลง", "เป็นการปิดสถานะ Long มากกว่า Short ใหม่"],
        interpretation: "แรงขายมาจากการขายทำกำไร ไม่ใช่การเปิด Short ใหม่ แรงกดดันจึงเริ่มจำกัด",
        insight: "ย่อแบบ OI ลด มักเป็นการพัก ไม่ใช่กลับตัว",
        views: ["wait"],
      },
    ],
  },

  flows: {
    question: "ต่างชาติและกองทุนสะสมสถานะไปทางไหน",
    levels: [],
    scenarios: [
      {
        id: "both-long",
        title: "ซื้อทั้งคู่",
        tag: "สะสม Long เพิ่ม",
        bias: "bull",
        summary: ["ต่างชาติและกองทุนสะสม Long เพิ่มพร้อมกัน", "ยอดรวมสองกลุ่มเพิ่มขึ้น"],
        interpretation: "เงินรายใหญ่อยู่ฝั่งเดียวกัน เป็นแรงหนุนให้ S50 ไปต่อได้",
        insight: "เงินใหญ่สองกลุ่มหนุนพร้อมกัน",
        views: ["hold-long", "buy-dip"],
      },
      {
        id: "foreign-sell-fund-buy",
        title: "ต่างชาติขาย กองทุนรับ",
        tag: "สองฝั่งถ่วงกัน",
        bias: "neutral",
        summary: ["ต่างชาติเพิ่มสถานะ Short", "กองทุนรับซื้อ ยอดรวมยังทรงตัว"],
        interpretation: "สองฝั่งถ่วงกัน ตลาดมีแนวโน้มแกว่งในกรอบมากกว่าวิ่งเป็นเทรนด์",
        insight: "ถ่วงกันแบบนี้ รอดูฝั่งที่ยอมก่อน",
        views: ["selective-long", "wait"],
      },
      {
        id: "both-short",
        title: "ขายทั้งคู่",
        tag: "ลด Long พร้อมกัน",
        bias: "bear",
        summary: ["ต่างชาติและกองทุนลดสถานะ Long พร้อมกัน", "ยอดรวมสองกลุ่มลดลง"],
        interpretation: "ไม่มีเงินรายใหญ่รับ แรงกดดันต่อ S50 ยังมีต่อเนื่อง",
        insight: "ไม่มีใครรับ ระวังลงต่อ",
        views: ["reduce-long"],
      },
      {
        id: "foreign-turn",
        title: "ต่างชาติกลับทิศ",
        tag: "เริ่มปิด Short",
        bias: "bull",
        summary: ["ต่างชาติเริ่มซื้อคืนหลังสะสม Short", "ยอดสะสมดีขึ้นจากจุดต่ำ"],
        interpretation: "เงินต่างชาติเริ่มเปลี่ยนทิศ มักเป็นสัญญาณนำการฟื้นของดัชนี",
        insight: "จับตาต่างชาติกลับมาฝั่ง Long",
        views: ["selective-long"],
      },
    ],
  },

  "usd-futures": {
    question: "USD Futures และ flow ในภาพบอกอะไรเรื่องค่าเงิน",
    levels: [{ label: "โซนเฝ้าดู", placeholder: "32.93 – 32.96" }],
    scenarios: [
      {
        id: "usd-strong",
        title: "USD แข็ง บาทอ่อน",
        tag: "เงินไหลออก",
        bias: "bear",
        summary: ["USD Futures ยืนเหนือแนวต้าน", "flow ฝั่ง Long USD เพิ่มขึ้น"],
        interpretation: "บาทอ่อนมักมาพร้อมต่างชาติขายหุ้น เป็นแรงกดดันต่อหุ้นใหญ่และ S50",
        insight: "บาทอ่อนต่อ ระวังหุ้นใหญ่",
        views: ["reduce-long"],
      },
      {
        id: "usd-weak",
        title: "USD อ่อน บาทแข็ง",
        tag: "เงินไหลเข้า",
        bias: "bull",
        summary: ["USD Futures หลุดแนวรับ", "flow ฝั่ง Short USD เพิ่มขึ้น"],
        interpretation: "บาทแข็งสะท้อนเงินไหลเข้า เป็นแรงหนุนหุ้นใหญ่และ S50",
        insight: "บาทแข็ง หนุนตลาดหุ้น",
        views: ["hold-long"],
      },
      {
        id: "usd-range",
        title: "แกว่งในโซน",
        tag: "ยังไม่เลือกทาง",
        bias: "neutral",
        summary: ["USD แกว่งในกรอบ", "flow ยังไม่ชัดทั้งสองฝั่ง"],
        interpretation: "ค่าเงินยังไม่ให้สัญญาณชัด ให้น้ำหนักกับปัจจัยอื่นมากกว่า",
        insight: "ค่าเงินยังไม่ใช่ตัวตัดสิน",
        views: ["wait"],
      },
    ],
  },

  confirm: {
    question: "ราคาและเส้น Confirm Up/Down ไปทางเดียวกันไหม",
    levels: [
      { label: "แนวรับ", placeholder: "1,070" },
      { label: "แนวต้าน", placeholder: "1,085" },
    ],
    scenarios: [
      {
        id: "up-confirmed",
        title: "ขึ้น + Confirm Up",
        tag: "ขาขึ้นได้รับการยืนยัน",
        bias: "bull",
        summary: ["ราคายืนเหนือโซนสำคัญ", "Confirm Up ขึ้นตาม"],
        interpretation: "ราคาและ money flow ไปทางเดียวกัน ขาขึ้นได้รับการยืนยัน",
        insight: "ราคาและ flow ยืนยันกัน",
        views: ["hold-long", "buy-dip"],
      },
      {
        id: "up-unconfirmed",
        title: "ขึ้นแต่ไม่ Confirm",
        tag: "ระวัง divergence",
        bias: "neutral",
        summary: ["ราคายังยืนได้", "แต่ Trend ระยะสั้นเริ่มอ่อนลง"],
        interpretation: "ขาขึ้นใหญ่ยังไม่เสีย แต่ยังต้องการแรง confirm จาก money flow ก่อนจะแข็งแรงจริง",
        insight: "ยังไม่เสีย แต่ต้องการ confirm เพิ่ม",
        views: ["selective-long"],
      },
      {
        id: "down-confirmed",
        title: "ลง + Confirm Down",
        tag: "ขาลงได้รับการยืนยัน",
        bias: "bear",
        summary: ["ราคาหลุดโซนสำคัญ", "Confirm Down ลงตาม"],
        interpretation: "ราคาและ money flow อ่อนพร้อมกัน ขาลงได้รับการยืนยัน ไม่ควรรีบรับ",
        insight: "ขาลงยืนยัน อย่ารีบรับ",
        views: ["reduce-long", "short-rebound"],
      },
      {
        id: "down-flow-improving",
        title: "ลงแต่ flow ดีขึ้น",
        tag: "ใกล้กลับตัว",
        bias: "bull",
        summary: ["ราคายังอ่อน", "แต่ Confirm เริ่มดีขึ้น"],
        interpretation: "แรงขายเริ่มลดลง เป็นสัญญาณแรกของการกลับตัว รอราคายืนยันอีกครั้ง",
        insight: "flow นำราคา จับตาจุดกลับตัว",
        views: ["wait"],
      },
    ],
  },

  breadth: {
    question: "หุ้นทั้งกระดานไปทางเดียวกับดัชนีไหม",
    levels: [],
    scenarios: [
      {
        id: "broad",
        title: "Breadth กว้าง",
        tag: "ขึ้นทั้งกระดาน",
        bias: "bull",
        summary: ["หุ้นขึ้นมากกว่าลงชัดเจน", "Indy ยืนเหนือเส้นกลาง"],
        interpretation: "ตลาดแข็งแรงทั้งกระดาน ไม่ได้พึ่งหุ้นใหญ่เพียงไม่กี่ตัว",
        insight: "ขึ้นกว้าง แข็งแรงจริง",
        views: ["hold-long"],
      },
      {
        id: "narrow",
        title: "ดัชนีขึ้น Breadth แคบ",
        tag: "ขึ้นเฉพาะตัวใหญ่",
        bias: "neutral",
        summary: ["ดัชนีขึ้น", "แต่หุ้นส่วนใหญ่ไม่ขึ้นตาม"],
        interpretation: "การขึ้นกระจุกอยู่ในหุ้นใหญ่ ความแข็งแรงของตลาดยังไม่กว้าง",
        insight: "ดัชนีขึ้น แต่ตลาดส่วนใหญ่ไม่ตาม",
        views: ["selective-long"],
      },
      {
        id: "oversold",
        title: "Oversold",
        tag: "ใกล้เด้ง",
        bias: "bull",
        summary: ["Breadth ลงไปโซน oversold", "แรงขายกระจายทั้งกระดาน"],
        interpretation: "แรงขายกระจายไปมากแล้ว มีโอกาสเด้งทางเทคนิคในระยะสั้น",
        insight: "ลงลึกทั้งกระดาน รอเด้ง",
        views: ["wait", "buy-dip"],
      },
      {
        id: "overbought",
        title: "Overbought",
        tag: "ระวังพักตัว",
        bias: "bear",
        summary: ["Breadth ขึ้นไปโซน overbought", "หุ้นส่วนใหญ่ขึ้นแรงต่อเนื่อง"],
        interpretation: "ตลาดร้อนแรง มีโอกาสพักตัวระยะสั้นก่อนไปต่อ",
        insight: "ร้อนเกิน ระวังพัก",
        views: ["reduce-long"],
      },
    ],
  },

  macro: {
    question: "VIX, DXY, Yield และทองคำ บอกบรรยากาศตลาดโลกแบบไหน",
    levels: [],
    scenarios: [
      {
        id: "risk-on",
        title: "Risk-on",
        tag: "เปิดรับความเสี่ยง",
        bias: "bull",
        summary: ["VIX ลดลง DXY อ่อนตัว", "Yield ทรงตัว"],
        interpretation: "บรรยากาศตลาดโลกเปิดรับความเสี่ยง หนุนเงินไหลเข้าตลาดเกิดใหม่",
        insight: "ตลาดโลกหนุน",
        views: ["hold-long"],
      },
      {
        id: "risk-off",
        title: "Risk-off",
        tag: "หนีความเสี่ยง",
        bias: "bear",
        summary: ["VIX เพิ่มขึ้น DXY แข็งค่า", "ทองคำขึ้นแรง"],
        interpretation: "นักลงทุนหนีความเสี่ยง กดดันตลาดหุ้นเกิดใหม่รวมถึงตลาดไทย",
        insight: "ตลาดโลกกดดัน ระวังเงินไหลออก",
        views: ["reduce-long"],
      },
      {
        id: "mixed",
        title: "ปัจจัยผสม",
        tag: "ยังไม่ชี้ทาง",
        bias: "neutral",
        summary: ["ตัวแปรหลักให้สัญญาณสวนกัน"],
        interpretation: "ปัจจัยต่างประเทศยังไม่ชี้ทาง ให้น้ำหนักกับ flow ในประเทศมากกว่า",
        insight: "ต่างประเทศยังไม่ใช่ตัวนำ",
        views: ["wait"],
      },
    ],
  },
};

/* ───────────────── เดาการ์ดจากตัวเลขที่มี ───────────────── */

export function suggestScenario(
  sectionId: string,
  data: { contracts?: ContractSeries[]; flows?: FlowRow[]; instruments?: Instrument[] },
): { id: string; reason: string } | null {
  if (sectionId === "s50-oi") {
    const rows = data.contracts?.[0]?.rows ?? [];
    const [prev, last] = rows.slice(-2);
    if (!prev || !last) return null;
    const up = last.close >= prev.close;
    const oiUp = last.oi >= prev.oi;
    return {
      id: `px-${up ? "up" : "down"}-oi-${oiUp ? "up" : "down"}`,
      reason: `ราคา${up ? "ขึ้น" : "ลง"} ${Math.abs(last.close - prev.close).toFixed(2)} จุด · OI ${oiUp ? "เพิ่ม" : "ลด"} ${Math.abs(last.oi - prev.oi).toLocaleString("en-US")} สัญญา`,
    };
  }
  if (sectionId === "flows") {
    const [prev, last] = (data.flows ?? []).slice(-2);
    if (!prev || !last) return null;
    const f = last.foreign - prev.foreign;
    const k = last.fund - prev.fund;
    const text = `ต่างชาติ${f >= 0 ? "ซื้อ" : "ขาย"}สุทธิ ${Math.abs(f).toLocaleString("en-US")} · กองทุน${k >= 0 ? "ซื้อ" : "ขาย"}สุทธิ ${Math.abs(k).toLocaleString("en-US")}`;
    if (f >= 0 && k >= 0) return { id: "both-long", reason: text };
    if (f < 0 && k < 0) return { id: "both-short", reason: text };
    if (f < 0) return { id: "foreign-sell-fund-buy", reason: text };
    return { id: last.foreign < 0 ? "foreign-turn" : "both-long", reason: text };
  }
  if (sectionId === "macro") {
    const vix = data.instruments?.find((x) => x.id === "vix");
    const dxy = data.instruments?.find((x) => x.id === "dxy");
    if (!vix || !dxy) return null;
    const text = `VIX ${vix.changePct >= 0 ? "+" : ""}${vix.changePct.toFixed(2)}% · DXY ${dxy.changePct >= 0 ? "+" : ""}${dxy.changePct.toFixed(2)}%`;
    if (vix.changePct < 0 && dxy.changePct <= 0) return { id: "risk-on", reason: text };
    if (vix.changePct > 0 && dxy.changePct > 0) return { id: "risk-off", reason: text };
    return { id: "mixed", reason: text };
  }
  return null;
}

/* ───────────────── การ์ด → ข้อความ ───────────────── */

export function viewsLabel(ids: ViewId[]) {
  return VIEWS.filter((v) => ids.includes(v.id))
    .map((v) => v.label)
    .join(" / ");
}

/** Action วันนี้จากมุมมองและตัวเลขที่ IC ใส่ — ช่องที่เว้นว่างจะไม่ขึ้น */
export function buildActions(
  views: ViewId[],
  levels: Record<string, string>,
  bias: Bias,
): Narrative["actions"] {
  const first = VIEWS.find((v) => views.includes(v.id));
  const rows: Narrative["actions"] = [];
  if (views.length) rows.push({ label: "มุมมอง", value: viewsLabel(views), tone: first?.tone ?? bias });
  for (const [label, value] of Object.entries(levels)) {
    if (value.trim()) rows.push({ label, value: value.trim(), tone: "neutral" });
  }
  return rows;
}

export function applyScenario(
  sc: Scenario,
  views: ViewId[],
  levels: Record<string, string>,
): Partial<Narrative> {
  return {
    summary: [...sc.summary],
    interpretation: sc.interpretation,
    insight: sc.insight,
    actions: buildActions(views, levels, sc.bias),
    scenario: { id: sc.id, title: sc.title, bias: sc.bias, views, levels },
  };
}
