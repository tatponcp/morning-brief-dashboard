"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  DollarSign,
  Globe2,
  LayoutGrid,
  Radar,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { Icon3D } from "@/components/ui/Icon3D";
import { ACCENT, type Accent } from "@/lib/accent";

type Item = {
  href: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  accent: Accent;
  /** สีปลายไล่ของไอคอน 3 มิติ */
  color2?: string;
  badge?: string;
};

const NAV: Item[] = [
  { href: "/", label: "สรุปภาพรวม", hint: "ภาพรวมและสิ่งที่ควรทำ", icon: LayoutGrid, accent: "cyan", color2: "var(--c-violet)" },
  { href: "/s50-oi", label: "S50 Futures + OI", hint: "ราคาและสถานะคงค้าง", icon: BarChart3, accent: "cyan", badge: "1" },
  { href: "/flows", label: "สะสม Long / Short", hint: "เงินต่างชาติและกองทุน", icon: Users, accent: "green", badge: "2" },
  { href: "/usd-futures", label: "USD Futures Flow", hint: "ทิศทางค่าเงินบาท", icon: DollarSign, accent: "sky", badge: "3" },
  { href: "/confirm", label: "Confirm Up / Down", hint: "แรงเงินยืนยันราคา", icon: Activity, accent: "amber", badge: "4" },
  { href: "/breadth", label: "Market Breadth", hint: "หุ้นทั้งตลาดไปทางไหน", icon: Radar, accent: "violet", badge: "5" },
  { href: "/macro", label: "Global Macro", hint: "บรรยากาศตลาดโลก", icon: Globe2, accent: "rose", badge: "6" },
];

/**
 * IC Studio ไม่อยู่ในเมนู — ลูกค้าไม่ควรเห็นว่ามีหน้าเครื่องมือหลังบ้าน
 * IC เข้าผ่าน URL /studio โดยตรง (bookmark ไว้) แล้วใส่รหัสผ่าน
 * การกั้นจริงอยู่ที่ src/middleware.ts ไม่ใช่การซ่อนลิงก์
 */

const STORE_KEY = "mb:sidebar";
const subscribeNever = () => () => {};

export function Sidebar() {
  const pathname = usePathname();

  // อ่านค่าที่จำไว้แบบไม่ผ่าน effect — เมนูจะได้ไม่กางแล้วหุบให้เห็นตอนโหลดหน้า
  const isClient = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [override, setOverride] = useState<boolean | null>(null);
  // หน้า Studio หุบเมนูไว้ก่อน ให้พื้นที่ทำงานกว้าง (กดขยายเองได้)
  const onStudio = pathname.startsWith("/studio");
  const collapsed =
    override ?? (onStudio || (isClient && window.localStorage.getItem(STORE_KEY) === "1"));

  const toggle = () => {
    const next = !collapsed;
    setOverride(next);
    try {
      window.localStorage.setItem(STORE_KEY, next ? "1" : "0");
    } catch {
      /* โหมดส่วนตัวของเบราว์เซอร์อาจเขียนไม่ได้ — ไม่เป็นไร */
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 272 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-white/8 bg-ink-900/70 backdrop-blur-xl md:flex"
    >
      <div className="flex items-center gap-3 px-5 py-6">
        <BrandMark size={42} />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="min-w-0"
            >
              <p className="font-display text-[15px] leading-tight font-bold tracking-tight text-white">
                Morning Brief
              </p>
              <p className="truncate text-[11px] text-slate-400">S50 Signal Desk</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="scroll-slim flex-1 overflow-y-auto px-3 pb-4">
        <SectionLabel collapsed={collapsed}>Dashboard</SectionLabel>
        <ul className="space-y-1.5">
          {NAV.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </ul>

      </nav>

      <button
        onClick={toggle}
        className="group m-3 flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/3 py-2.5 text-[12px] text-slate-400 transition hover:border-white/16 hover:bg-white/6 hover:text-white"
      >
        <ChevronLeft
          className={`size-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
        />
        {!collapsed && <span>ย่อเมนู</span>}
      </button>
    </motion.aside>
  );
}

function SectionLabel({
  children,
  collapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
}) {
  return (
    <p
      className={`px-3 pt-5 pb-2 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase transition ${
        collapsed ? "opacity-0" : "opacity-100"
      }`}
    >
      {collapsed ? " " : children}
    </p>
  );
}

function NavRow({
  item,
  active,
  collapsed,
}: {
  item: Item;
  active: boolean;
  collapsed: boolean;
}) {
  const a = ACCENT[item.accent];
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  // เอียงตามเมาส์ + แสงไฟส่องตามตำแหน่งเมาส์
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateY = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 300, damping: 22 });
  const rotateX = useSpring(useTransform(my, [0, 1], [5, -5]), { stiffness: 300, damping: 22 });
  const spot = useTransform(
    [mx, my],
    ([x, y]: number[]) =>
      `radial-gradient(160px circle at ${x * 100}% ${y * 100}%, color-mix(in srgb, ${a.hex} 16%, transparent), transparent 70%)`,
  );

  return (
    <li className="relative" style={{ perspective: 700 }}>
      <motion.div
        style={{ rotateX: reduce ? 0 : rotateX, rotateY: reduce ? 0 : rotateY, transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => {
          setHover(false);
          mx.set(0.5);
          my.set(0.5);
        }}
      >
        <Link
          href={item.href}
          className={`group relative flex items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* แผ่นของเมนูที่เลือกอยู่ — เลื่อนตามไปเมื่อเปลี่ยนหน้า */}
          {active && (
            <motion.span
              layoutId="nav-active"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute inset-0 rounded-2xl border"
              style={{
                borderColor: `color-mix(in srgb, ${a.hex} 40%, transparent)`,
                background: `linear-gradient(100deg, color-mix(in srgb, ${a.hex} 20%, transparent), color-mix(in srgb, ${a.hex} 4%, transparent) 75%)`,
                boxShadow: `0 10px 26px -12px ${a.hex}, inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
            />
          )}
          {/* แสงไฟตามเมาส์ */}
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ background: spot }}
            animate={{ opacity: hover && !reduce ? 1 : 0 }}
          />

          <Icon3D icon={item.icon} color={a.hex} color2={item.color2} size={36} lift={hover} on={active} />

          {!collapsed && (
            <motion.span
              className="relative min-w-0 flex-1"
              animate={{ x: hover && !reduce ? 3 : 0 }}
              style={{ z: 6 }}
            >
              <span
                className={`block truncate text-[13.5px] leading-tight transition-colors ${
                  active ? "font-semibold text-white" : "text-slate-300 group-hover:text-white"
                }`}
              >
                {item.label}
              </span>
              <span className="block truncate text-[11.5px] text-slate-400">{item.hint}</span>
            </motion.span>
          )}

          {!collapsed && item.badge && (
            <motion.span
              className="relative grid size-6 shrink-0 place-items-center rounded-lg font-display text-[11px] font-bold"
              animate={{ scale: active ? 1.08 : 1, rotateY: hover && !reduce ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              style={{
                background: active ? a.hex : a.soft,
                color: active ? "var(--ink-950)" : a.hex,
                boxShadow: active ? `0 4px 12px -4px ${a.hex}` : "none",
              }}
            >
              <span style={{ transform: hover && !reduce ? "rotateY(180deg)" : undefined }}>{item.badge}</span>
            </motion.span>
          )}

          {collapsed && (
            <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg border border-white/10 bg-ink-800 px-3 py-1.5 text-[12px] text-white shadow-xl group-hover:block">
              {item.label}
            </span>
          )}
        </Link>
      </motion.div>
    </li>
  );
}
