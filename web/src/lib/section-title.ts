/**
 * ชื่อหัวข้อที่ลูกค้าเห็น — คำว่า "Series" ในชื่อถูกแทนด้วยชื่อสัญญาที่ใช้อยู่
 * เช่น "Series + Open Interest" + S50Z26 → "S50Z26 + Open Interest"
 */
export function displayTitle(title: string, series?: string) {
  return series?.trim() ? title.replace(/\bSeries\b/, series.trim()) : title;
}

/** ชื่อหัวข้อมีช่องให้ใส่ series อยู่แล้ว (จึงไม่ต้องขึ้นป้าย series ซ้ำ) */
export function hasSeriesSlot(title: string) {
  return /\bSeries\b/.test(title);
}
