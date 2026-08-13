import type { Brief, ContractSeries, FlowRow, ImageBoard, Narrative } from "./types";

/** ร่างของ 1 section ที่ IC กำลังแก้อยู่ */
export type Draft = Narrative & {
  board: ImageBoard;
  /** ข้อมูลที่ import เข้ามาใหม่ (ข้อ 1) — ไม่มี = ใช้ของเดิมที่เผยแพร่อยู่ */
  contracts?: ContractSeries[];
  /** ข้อมูลที่ import เข้ามาใหม่ (ข้อ 2) */
  flows?: FlowRow[];
};

export type DraftMap = Record<string, Draft>;

const emptyBoard = (): ImageBoard => ({
  images: [{ src: "", alt: "", callouts: [] }],
  stats: [],
});

/** ค่าตั้งต้นจากข้อมูลที่เผยแพร่อยู่ตอนนี้ */
export function initialDrafts(brief: Brief): DraftMap {
  const out: DraftMap = {};
  for (const s of brief.sections) {
    out[s.id] = {
      ...structuredClone(s.narrative),
      board: s.board ? structuredClone(s.board) : emptyBoard(),
      ...(s.contracts ? { contracts: structuredClone(s.contracts) } : {}),
      ...(s.flows ? { flows: structuredClone(s.flows) } : {}),
    };
  }
  return out;
}

export function draftKey(date: string) {
  return `mb:draft:${date}`;
}

export type LoadResult = { drafts: DraftMap; restored: boolean };

/** อ่านร่างที่ค้างไว้จากครั้งก่อน (ถ้ามี) แล้วเติมส่วนที่ขาดด้วยค่าตั้งต้น */
export function loadDrafts(brief: Brief): LoadResult {
  const base = initialDrafts(brief);
  try {
    const raw = window.localStorage.getItem(draftKey(brief.date));
    if (!raw) return { drafts: base, restored: false };
    const saved = JSON.parse(raw) as DraftMap;
    let restored = false;
    for (const id of Object.keys(base)) {
      if (saved[id]) {
        base[id] = { ...base[id], ...saved[id] };
        restored = true;
      }
    }
    return { drafts: base, restored };
  } catch {
    return { drafts: base, restored: false };
  }
}

export type SaveState = "saved" | "too-big" | "error";

/**
 * เก็บร่างลงเครื่อง
 *
 * ภาพที่อัปโหลดเป็น data URL ซึ่งกินพื้นที่มาก localStorage มีเพดานราว 5MB
 * ถ้าเต็มจะลองเก็บใหม่แบบไม่รวมภาพ เพื่อให้ข้อความที่พิมพ์ไว้ไม่หาย
 */
export function saveDrafts(date: string, drafts: DraftMap): SaveState {
  try {
    window.localStorage.setItem(draftKey(date), JSON.stringify(drafts));
    return "saved";
  } catch {
    try {
      const lite: DraftMap = {};
      for (const [id, d] of Object.entries(drafts)) {
        lite[id] = {
          ...d,
          board: {
            ...d.board,
            images: d.board.images.map((im) =>
              im.src.startsWith("data:") ? { ...im, src: "" } : im,
            ),
          },
        };
      }
      window.localStorage.setItem(draftKey(date), JSON.stringify(lite));
      return "too-big";
    } catch {
      return "error";
    }
  }
}

export function clearDrafts(date: string) {
  try {
    window.localStorage.removeItem(draftKey(date));
  } catch {
    /* เงียบไว้ — ไม่ใช่เรื่องคอขาดบาดตาย */
  }
}
