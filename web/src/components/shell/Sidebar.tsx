"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  Compass,
  DollarSign,
  Globe2,
  LayoutGrid,
  PenSquare,
  Radar,
  Users,
} from "lucide-react";
import { ACCENT, type Accent } from "@/lib/accent";

type Item = {
  href: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
  badge?: string;
};

const NAV: Item[] = [
  { href: "/", label: "สรุปภาพรวม", hint: "Action วันนี้", icon: LayoutGrid, accent: "cyan" },
  { href: "/s50-oi", label: "S50 Futures + OI", hint: "TQ Pro · SET", icon: BarChart3, accent: "cyan", badge: "1" },
  { href: "/flows", label: "สะสม Long / Short", hint: "ต่างชาติ · กองทุน", icon: Users, accent: "green", badge: "2" },
  { href: "/usd-futures", label: "USD Futures Flow", hint: "VM", icon: DollarSign, accent: "sky", badge: "3" },
  { href: "/confirm", label: "Confirm Up / Down", hint: "Website", icon: Activity, accent: "amber", badge: "4" },
  { href: "/breadth", label: "Market Breadth", hint: "VM · Indy 2090", icon: Radar, accent: "violet", badge: "5" },
  { href: "/macro", label: "Global Macro", hint: "Gold · VIX · DXY", icon: Globe2, accent: "rose", badge: "6" },
];

const STUDIO: Item[] = [
  { href: "/studio", label: "IC Studio", hint: "สร้าง Brief วันนี้", icon: PenSquare, accent: "amber" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("mb:sidebar");
    if (saved === "1") setCollapsed(true);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem("mb:sidebar", collapsed ? "1" : "0");
  }, [collapsed, ready]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 272 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-white/8 bg-ink-900/70 backdrop-blur-xl md:flex"
    >
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#22d3ee] to-[#a78bfa] shadow-[0_0_28px_-6px_rgba(34,211,238,0.8)]">
          <Compass className="size-5 text-ink-950" />
        </div>
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
        <ul className="space-y-1">
          {NAV.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </ul>

        <SectionLabel collapsed={collapsed}>สำหรับผู้ทำสัญญาณ</SectionLabel>
        <ul className="space-y-1">
          {STUDIO.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>

      <button
        onClick={() => setCollapsed((v) => !v)}
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
      className={`px-3 pt-5 pb-2 text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase transition ${
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
  const Icon = item.icon;
  return (
    <li className="relative">
      <Link
        href={item.href}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
          active ? "bg-white/7" : "hover:bg-white/4"
        }`}
      >
        {active && (
          <motion.span
            layoutId="nav-active"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="absolute inset-0 -z-10 rounded-xl"
            style={{
              background: `linear-gradient(90deg, ${a.soft}, transparent 70%)`,
              boxShadow: `inset 2px 0 0 0 ${a.hex}`,
            }}
          />
        )}
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg border transition"
          style={{
            borderColor: active ? a.hex : "rgba(148,163,184,0.16)",
            background: active ? a.soft : "rgba(255,255,255,0.02)",
            color: active ? a.hex : "#94a3b8",
          }}
        >
          <Icon className="size-4" />
        </span>

        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-[13.5px] leading-tight ${
                active ? "font-semibold text-white" : "text-slate-300"
              }`}
            >
              {item.label}
            </span>
            <span className="block truncate text-[11px] text-slate-500">{item.hint}</span>
          </span>
        )}

        {!collapsed && item.badge && (
          <span
            className="grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-bold"
            style={{ background: a.soft, color: a.hex }}
          >
            {item.badge}
          </span>
        )}

        {collapsed && (
          <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg border border-white/10 bg-ink-800 px-3 py-1.5 text-[12px] text-white shadow-xl group-hover:block">
            {item.label}
          </span>
        )}
      </Link>
    </li>
  );
}
