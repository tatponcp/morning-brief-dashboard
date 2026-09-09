import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ACCENT } from "@/lib/accent";
import type { Section } from "@/lib/types";

/** ปุ่มไป section ก่อนหน้า / ถัดไป ท้ายหน้า — อ่านไล่ทีละข้อได้โดยไม่ต้องกลับไปที่เมนู */
export function SectionNav({
  sections,
  currentId,
}: {
  sections: Section[];
  currentId: string;
}) {
  const i = sections.findIndex((s) => s.id === currentId);
  const prev = i > 0 ? sections[i - 1] : null;
  const next = i < sections.length - 1 ? sections[i + 1] : null;

  return (
    <nav className="mt-3 grid gap-2 sm:grid-cols-2">
      {prev ? <NavCard section={prev} dir="prev" /> : <span className="hidden sm:block" />}
      {next && <NavCard section={next} dir="next" />}
    </nav>
  );
}

function NavCard({ section, dir }: { section: Section; dir: "prev" | "next" }) {
  const a = ACCENT[section.accent];
  const isNext = dir === "next";
  return (
    <Link
      href={`/${section.id}`}
      className={`panel group flex items-center gap-3 px-4 py-2.5 transition hover:-translate-y-0.5 ${
        isNext ? "sm:flex-row-reverse sm:text-right" : ""
      }`}
      style={{ borderColor: `${a.hex}22` }}
    >
      {isNext ? (
        <ArrowRight className="size-4 shrink-0 text-slate-600 transition group-hover:text-white" />
      ) : (
        <ArrowLeft className="size-4 shrink-0 text-slate-600 transition group-hover:text-white" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] text-slate-500">
          {isNext ? "ถัดไป" : "ก่อนหน้า"}
        </span>
        <span className="block truncate text-[13px] font-semibold" style={{ color: a.hex }}>
          {section.index} · {section.title}
        </span>
      </span>
    </Link>
  );
}
