import { ImagePlus } from "lucide-react";
import { ACCENT, type Accent } from "@/lib/accent";

/** section ที่เป็นภาพ แต่ IC ยังไม่ได้อัปโหลดภาพของวันนี้ */
export function ImagePending({ accent, title }: { accent: Accent; title: string }) {
  const a = ACCENT[accent];
  return (
    <div
      className="panel grid min-h-[260px] place-items-center px-6 py-10 text-center"
      style={{ borderColor: `color-mix(in srgb, ${a.hex} 22%, transparent)` }}
    >
      <div>
        <span
          className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl"
          style={{ background: a.soft, color: a.hex }}
        >
          <ImagePlus className="size-6" />
        </span>
        <p className="font-display text-[15px] font-semibold text-slate-100">รอภาพ {title} ของวันนี้</p>
        <p className="mt-1 text-[12.5px] text-slate-400">IC จะอัปเดตภาพจากระบบก่อนตลาดเปิด</p>
      </div>
    </div>
  );
}
