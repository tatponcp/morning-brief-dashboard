import type { Brief, FlowRow, Section } from "@/lib/types";
import { brief20260805 } from "./2026-08-05";

/**
 * Brief 14 ก.ย. 2569
 *
 *   ข้อ 2             : ยอดสะสมต่างชาติ/กองทุนจากชีต IC (26 มิ.ย.–11 ก.ย.) — วางชีตใน /studio ได้
 *   ข้อ 1, 3, 4, 5, 6 : IC แคปภาพจากระบบมาวางใน /studio แล้วเลือกสัญญาณ
 */

const PENDING = "รอ IC ใส่มุมมองใน /studio ก่อนเผยแพร่";

const pending = {
  summary: [] as string[],
  interpretation: PENDING,
  actions: [{ label: "สถานะ", value: "รอ IC ยืนยัน", tone: "neutral" as const }],
  insight: PENDING,
};

const flowRows: FlowRow[] = [
  { t: "2026-06-26", foreign: -6354, fund: -554, total: -6908, set50: 1013.2 },
  { t: "2026-06-29", foreign: 29872, fund: -5989, total: 23883, set50: 1013.1 },
  { t: "2026-06-30", foreign: 42863, fund: -10372, total: 32491, set50: 1046.5 },
  { t: "2026-07-01", foreign: 29637, fund: -6867, total: 22770, set50: 1041.1 },
  { t: "2026-07-02", foreign: 37318, fund: -10768, total: 26550, set50: 1049.6 },
  { t: "2026-07-03", foreign: 38818, fund: -17384, total: 21434, set50: 1065.2 },
  { t: "2026-07-06", foreign: 26435, fund: -15835, total: 10600, set50: 1063.8 },
  { t: "2026-07-07", foreign: 4340, fund: -6023, total: -1683, set50: 1057.6 },
  { t: "2026-07-08", foreign: -10596, fund: -198, total: -10794, set50: 1040.5 },
  { t: "2026-07-09", foreign: 7870, fund: -2384, total: 5486, set50: 1055.0 },
  { t: "2026-07-10", foreign: 13810, fund: -1017, total: 12793, set50: 1065.7 },
  { t: "2026-07-13", foreign: 22982, fund: -4415, total: 18567, set50: 1071.9 },
  { t: "2026-07-14", foreign: 13053, fund: 285, total: 13338, set50: 1069.8 },
  { t: "2026-07-15", foreign: 13833, fund: -4584, total: 9249, set50: 1073.3 },
  { t: "2026-07-16", foreign: 27228, fund: -7640, total: 19588, set50: 1082.0 },
  { t: "2026-07-17", foreign: 28583, fund: -4833, total: 23750, set50: 1088.5 },
  { t: "2026-07-20", foreign: 21347, fund: -2832, total: 18515, set50: 1095.2 },
  { t: "2026-07-21", foreign: 16697, fund: -1584, total: 15113, set50: 1096.7 },
  { t: "2026-07-22", foreign: 9994, fund: -2869, total: 7125, set50: 1089.6 },
  { t: "2026-07-23", foreign: 6519, fund: -3019, total: 3500, set50: 1085.3 },
  { t: "2026-07-24", foreign: 17261, fund: -4845, total: 12416, set50: 1092.2 },
  { t: "2026-07-27", foreign: -859, fund: -3338, total: -4197, set50: 1083.8 },
  { t: "2026-07-30", foreign: -32378, fund: 9419, total: -22959, set50: 1067.9 },
  { t: "2026-07-31", foreign: -2226, fund: 8264, total: 6038, set50: 1084.1 },
  { t: "2026-08-03", foreign: -8599, fund: 9437, total: 838, set50: 1082.2 },
  { t: "2026-08-04", foreign: -10666, fund: 10736, total: 70, set50: 1080.6 },
  { t: "2026-08-05", foreign: -25949, fund: 12603, total: -13346, set50: 1076.3 },
  { t: "2026-08-06", foreign: 612, fund: 4949, total: 5561, set50: 1083.2 },
  { t: "2026-08-07", foreign: -14726, fund: 8664, total: -6062, set50: 1079.5 },
  { t: "2026-08-10", foreign: -11383, fund: 9789, total: -1594, set50: 1082.1 },
  { t: "2026-08-11", foreign: -23084, fund: 14246, total: -8838, set50: 1076.5 },
  { t: "2026-08-13", foreign: -25367, fund: 15144, total: -10223, set50: 1077.0 },
  { t: "2026-08-14", foreign: -34562, fund: 17801, total: -16761, set50: 1071.6 },
  { t: "2026-08-17", foreign: -1572, fund: 10677, total: 9105, set50: 1084.9 },
  { t: "2026-08-18", foreign: -24784, fund: 17765, total: -7019, set50: 1077.9 },
  { t: "2026-08-19", foreign: -35681, fund: 19247, total: -16434, set50: 1072.6 },
  { t: "2026-08-20", foreign: -37111, fund: 22262, total: -14849, set50: 1072.9 },
  { t: "2026-08-21", foreign: -12551, fund: 16932, total: 4381, set50: 1080.7 },
  { t: "2026-08-24", foreign: -41762, fund: 27642, total: -14120, set50: 1071.6 },
  { t: "2026-08-25", foreign: -30757, fund: 25605, total: -5152, set50: 1072.9 },
  { t: "2026-08-26", foreign: -20779, fund: 24406, total: 3627, set50: 1075.0 },
  { t: "2026-08-27", foreign: -39404, fund: 27548, total: -11856, set50: 1070.5 },
  { t: "2026-08-28", foreign: -51791, fund: 33088, total: -18703, set50: 1065.3 },
  { t: "2026-08-31", foreign: -40683, fund: 31689, total: -8994, set50: 1068.3 },
  { t: "2026-09-01", foreign: -40579, fund: 33766, total: -6813, set50: 1065.0 },
  { t: "2026-09-02", foreign: -56675, fund: 38764, total: -17911, set50: 1058.1 },
  { t: "2026-09-03", foreign: -41919, fund: 34140, total: -7779, set50: 1062.4 },
  { t: "2026-09-04", foreign: -22858, fund: 30190, total: 7332, set50: 1072.2 },
  { t: "2026-09-07", foreign: -11262, fund: 32667, total: 21405, set50: 1079.4 },
  { t: "2026-09-08", foreign: -14179, fund: 34651, total: 20472, set50: 1083.5 },
  { t: "2026-09-09", foreign: -24766, fund: 41799, total: 17033, set50: 1081.8 },
  { t: "2026-09-10", foreign: -27155, fund: 44246, total: 17091, set50: 1082.3 },
  { t: "2026-09-11", foreign: -38595, fund: 47391, total: 8796, set50: 1075.5 },
];

const sections: Section[] = brief20260805.sections.map((s) => {
  // ข้อ 1: แนบภาพ Series + Open Interest จาก TQ Pro — ชื่อ series แก้ได้ใน Studio
  if (s.id === "s50-oi") {
    return {
      ...s,
      demo: false,
      mode: "image",
      title: "Series + Open Interest",
      series: "S50U26",
      source: "TQ Pro · แคปภาพจากระบบ",
      contracts: undefined,
      spread: undefined,
      asOfLabel: undefined,
      board: { images: [], stats: [] },
      narrative: pending,
    };
  }
  // ข้อ 6: แนบภาพแทนกราฟที่ดึงราคาสด — IC ใช้ภาพเดียวกับที่ดูอยู่
  if (s.id === "macro") {
    return {
      ...s,
      demo: false,
      mode: "image",
      source: "แคปภาพจากระบบ",
      groups: undefined,
      instruments: undefined,
      board: { images: [], stats: [] },
      narrative: pending,
    };
  }
  // ข้อ 3: IC แคปภาพจาก VM มาวาง แล้วเขียนคำอธิบาย (ไม่วาดกราฟจากข้อมูลจำลอง)
  if (s.id === "usd-futures") {
    return {
      ...s,
      demo: false,
      mode: "image",
      source: "VM · แคปภาพจากระบบ",
      contracts: undefined,
      groups: undefined,
      board: { images: [], stats: [] },
      narrative: pending,
    };
  }
  if (s.id === "flows") {
    return {
      ...s,
      demo: false,
      asOfLabel: "11 ก.ย. 2569",
      source: "ชีต IC · ล้านบาท (สะสม) · แกนขวาคือราคาปิด S50U26",
      flows: flowRows,
      narrative: {
        summary: [
          "ต่างชาติสะสม -38,595 (ขายสุทธิ 11,440 ในวันล่าสุด)",
          "กองทุนสะสม +47,391 (ซื้อสุทธิ 3,145 ในวันล่าสุด)",
          "ต่างชาติ + กองทุน +8,796 ลดลงจาก +17,091",
        ],
        interpretation: PENDING,
        actions: pending.actions,
        insight: PENDING,
      },
    };
  }
  // ข้อ 4–5 ยังไม่มีของใหม่ แสดงวันที่ของข้อมูลเดิมกำกับไว้ ไม่ให้ดูเหมือนเป็นของวันนี้
  return s;
});

export const brief20260914: Brief = {
  ...brief20260805,
  date: "2026-09-14",
  dateLabelTH: "14 ก.ย. 2569",
  bigPicture: [{ rank: 1, title: "S50 / หุ้นใหญ่", body: PENDING, tone: "neutral" }],
  dataSays: [
    "ต่างชาติสะสม -38,595 · กองทุนสะสม +47,391",
  ],
  todayActions: [{ label: "สถานะ", value: "รอ IC ยืนยันก่อนเผยแพร่", tone: "neutral" }],
  insight: PENDING,
  sections,
};
