"use client";

import { getFontEmbedCSS, toBlob } from "html-to-image";

/**
 * แปลงการ์ดบนหน้าจอเป็นไฟล์ PNG สำหรับส่งลูกค้าทาง LINE / แชต
 *
 * ทำในเบราว์เซอร์ทั้งหมด ไม่ต้องมีเซิร์ฟเวอร์ — ข้อมูลร่างที่ยังไม่เผยแพร่จึงไม่รั่วออกไปไหน
 */

let fontCSS: Promise<string> | null = null;

/** ปุ่มควบคุม (เลือกช่วงเวลา, ขยาย ฯลฯ) ใส่ data-export-hide ไว้ จะไม่ติดไปในรูป */
function keep(node: HTMLElement) {
  return !(node instanceof Element && node.hasAttribute("data-export-hide"));
}

async function imagesReady(root: HTMLElement) {
  const imgs = [...root.querySelectorAll("img")];
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? img.decode().catch(() => undefined)
        : new Promise<void>((done) => {
            img.addEventListener("load", () => done(), { once: true });
            img.addEventListener("error", () => done(), { once: true });
          }),
    ),
  );
}

export async function renderPng(node: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  await imagesReady(node);

  // ฝังฟอนต์ไทยครั้งเดียวต่อการเปิดหน้า รูปถัดไปจะสร้างเร็วขึ้นมาก
  fontCSS ??= getFontEmbedCSS(node).catch(() => "");

  const blob = await toBlob(node, {
    pixelRatio: 2,
    cacheBust: true,
    // ใช้พื้นตามธีมปัจจุบัน IC เลือกได้ว่าจะส่งรูปโทนมืดหรือสว่าง
    backgroundColor:
      getComputedStyle(document.documentElement).getPropertyValue("--ink-950").trim() || "#04070e",
    fontEmbedCSS: await fontCSS,
    filter: keep,
  });
  if (!blob) throw new Error("สร้างรูปไม่สำเร็จ");
  return blob;
}

export function canCopyImage() {
  return (
    typeof window !== "undefined" &&
    !!navigator.clipboard?.write &&
    typeof ClipboardItem !== "undefined"
  );
}

/**
 * คัดลอกรูปลงคลิปบอร์ด แล้วไปกด Ctrl+V ในแชตได้เลย
 * ส่ง Promise เข้า ClipboardItem ตรง ๆ เพราะ Safari จะไม่ยอมถ้า await ก่อนแล้วค่อยเขียน
 */
export async function copyPng(make: () => Promise<Blob>) {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": make() })]);
}

export function downloadPng(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function canShareFiles() {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    return navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

/** มือถือ: เปิดหน้าต่างแชร์ของระบบ เลือก LINE ได้เลย */
export async function sharePng(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: "image/png" });
  await navigator.share({ files: [file], title });
}
