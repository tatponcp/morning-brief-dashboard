const TH_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/** 2026-08-10 → "10 ส.ค. 2569" */
export function thaiDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getUTCDate()).padStart(2, "0")} ${TH_MONTHS[d.getUTCMonth()]} ${
    d.getUTCFullYear() + 543
  }`;
}

/** วันนี้ตามเวลาไทย (ISO) — เครื่องของ IC อาจตั้งเขตเวลาอื่นไว้ */
export function todayBangkok(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);
}
