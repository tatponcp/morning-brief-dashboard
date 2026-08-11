# Morning Brief Dashboard — สรุปสถาปัตยกรรมและข้อแนะนำ

## 1. เว็บเดียวหรือสองเว็บ?

**เว็บเดียว แต่แยก route + สิทธิ์** — อย่าแยกโปรเจกต์

```
/            สรุปภาพรวม Action วันนี้        ← ลูกค้า
/s50-oi …    Dashboard 1–6 (แยกแท็บซ้าย)     ← ลูกค้า
/studio      IC Studio (กรอก/อัปโหลด)        ← เฉพาะ IC (ต้อง login)
```

เหตุผล: component/ธีม/ชนิดข้อมูลใช้ร่วมกันทั้งหมด ถ้าแยก repo จะต้อง sync type
กับสไตล์สองที่ตลอด และ preview ของ IC จะไม่มีทางเหมือนของจริง 100%
สิ่งที่ต้องแยกคือ **สิทธิ์เข้าถึง** ไม่ใช่เว็บ — ใช้ middleware กัน `/studio` ก็พอ

## 2. Tech stack

| ชั้น | เลือก | เหตุผล |
|---|---|---|
| Framework | **Next.js 16 (App Router)** | ตอบคำถามที่ถามมา: ใช่ เหมาะที่สุด — deploy Vercel คลิกเดียว, image optimization, SSR/ISR |
| Styling | **Tailwind v4** | ธีมนีออนคุมด้วย token ชุดเดียว (`globals.css`) |
| Chart | **Recharts** | โค้ดสั้น สวย interactive ได้ทันที (ถ้าอนาคตอยากได้แบบ TradingView ค่อยเปลี่ยนเป็น `lightweight-charts`) |
| Animation | **Motion** (framer-motion) | sidebar ย่อ/ขยาย, reveal on scroll |
| Icon | **lucide-react** | |
| Font | **Anuphan** (ไทย) + **Sora** (ตัวเลข/อังกฤษ) | ไทยคมชัด ตัวเลขอ่านง่ายบนพื้นดำ |

## 3. Backend — GitHub ทำได้ แต่ไม่แนะนำเป็นตัวหลัก

- **GitHub as CMS** เขียน brief เป็น JSON commit ลง repo → Vercel redeploy อัตโนมัติ
  - ดี: ฟรี, มี version history ครบ, rollback ง่าย
  - เสีย: อัปโหลดภาพเข้า git จะบวมเร็วมาก (ภาพ 300–500KB × 6 รูป × ทุกวันทำการ ≈ 400MB/ปี)
    และแก้ทีต้องรอ build ~1 นาที
- **แนะนำ: Supabase (free tier)** — Postgres เก็บข้อความ/ตัวเลข + Storage เก็บภาพ + Auth ให้ IC login
  หน้าเว็บใช้ ISR/revalidate ก็เร็วเท่า static
- ทางสายกลางถ้าอยากอยู่กับ GitHub จริง ๆ: ข้อความเก็บใน repo, **ภาพเก็บที่ Vercel Blob**

## 4. คำถามเรื่อง "IC วางภาพแล้วได้ Infographic อัตโนมัติ"

**ทำได้ และคือหัวใจของงานนี้** — แต่ต้องเปลี่ยนนิยามนิดเดียว:

- ❌ ไม่ใช่ "อัปโหลดภาพ แล้ว AI วาดกราฟิกทับให้เป็นรูปเดียวจบ" (ผลลัพธ์จะคุมคุณภาพไม่ได้)
- ✅ แต่เป็น "**ภาพเป็นแค่ layer เดียว** ส่วนกรอบ/หัวข้อ/callout/stat tile/สรุป 3 ช่อง
  เว็บ render ให้เองทั้งหมด" → IC แค่วางภาพ + กรอก 3 ช่อง = ได้หน้าที่สวยเท่า
  Result Example ทุกวัน โดยไม่ต้องเปิดโปรแกรมแต่งภาพ

ดูของจริงได้ที่ `/studio` — ลากภาพมาวาง (หรือ Ctrl+V) ซ้ายกรอก ขวาพรีวิวสด

ถ้าอยากได้ **ไฟล์ภาพ** ไว้ส่งไลน์/เฟซบุ๊กด้วย: เพิ่ม route `/og/[section]` แล้วใช้
`@vercel/og` หรือ Playwright screenshot หน้าเดียวกันออกมาเป็น PNG 1080×1080 — โค้ดชุดเดิม
ได้ทั้งเว็บและรูป

## 4.1 สถานะการแปลงภาพ → ข้อมูลจริง (อัปเดต)

| # | Section | สถานะ | หมายเหตุ |
|---|---|---|---|
| 1 | S50 + OI | 🟩 native | รอต่อข้อมูลจริงจาก TFEX |
| 2 | Long/Short ต่างชาติ–กองทุน | 🟩 native | รอต่อ SET Investor Type |
| 3 | USD Futures Flow | 🟩 native | กราฟวาดเองครบทั้ง 6 pane (แท่งเทียน + Super Flow + OI + 15m PBC) ข้อมูลยังเป็น demo — ต้องได้ CSV export จาก VM ก่อน |
| 4 | Confirm Up/Down S50 | 🖼️ ภาพ | ตามที่ตกลง |
| 5 | Market Breadth | 🖼️ ภาพ | ตามที่ตกลง (ถ้าอยากได้ native ภายหลัง คำนวณเองจากราคาหุ้น SET50 ได้) |
| 6 | Global Macro | 🟩 **native + ข้อมูลจริง** | ดึงราคา Gold/VIX/DXY/US10Y สดอัตโนมัติ ไม่ต้องแคปภาพอีกแล้ว |

### ข้อ 6 ทำงานยังไง

- [`src/lib/market.ts`](web/src/lib/market.ts) — ยิง provider จริง ถ้าล่ม/ช้าเกิน 8 วิ จะ fallback
  ไปใช้ snapshot ใน repo → **build ไม่มีวันพังเพราะ provider ล่ม**
- หน้า `/macro` เป็น ISR `revalidate = 3600` → ราคาอัปเดตทุกชั่วโมง แต่ยังเสิร์ฟเร็วเท่า static
- มีแถบบอกสถานะบนหน้าเว็บว่ากำลังใช้ข้อมูลสดหรือ snapshot
- อัปเดต snapshot ด้วยมือ: `npm run fetch:macro`

> ⚠️ ตอนนี้ default provider เป็น endpoint สาธารณะของ Yahoo Finance ซึ่งไม่มีสัญญารองรับ
> เหมาะกับ demo/ภายใน ถ้าจะใช้เชิงพาณิชย์จริงจังควรย้ายไป provider ที่มีสัญญา
> (Twelve Data, Polygon, EOD Historical) — แก้แค่ฟังก์ชัน `fetchDaily()` ตัวเดียว

## 4.2 การกั้น IC Studio

ลูกค้า **ไม่เห็น** `/studio` แล้ว — ทั้งไม่มีลิงก์ในเมนู และเข้า URL ตรงก็ไม่ได้

| กลไก | ที่ไหน |
|---|---|
| กั้น route | [`src/middleware.ts`](web/src/middleware.ts) — ไม่มี cookie ที่ถูกต้อง → เด้งไป `/studio-login` |
| หน้าใส่รหัส | [`/studio-login`](web/src/app/studio-login/page.tsx) — cookie เป็น httpOnly อายุ 12 ชม. |
| เอาออกจากเมนู | Sidebar / Topbar ไม่มีลิงก์ IC Studio อีกแล้ว (แต่การกั้นจริงอยู่ที่ middleware ไม่ใช่การซ่อนลิงก์) |

**ต้องตั้งค่าก่อน deploy:** Vercel → Settings → Environment Variables → `STUDIO_PASSWORD`
ถ้าไม่ตั้ง `/studio` จะตอบ 503 ปิดตัวเองไว้ (ปลอดภัยไว้ก่อน) · ตอน `npm run dev` ในเครื่องไม่ต้องใส่รหัส

> นี่เป็นการกันคนทั่วไปเข้าหน้าเครื่องมือ ไม่ใช่ระบบยืนยันตัวตนรายคน
> ถ้าต้องแยกสิทธิ์ว่าใครแก้อะไร / เก็บ log ให้เปลี่ยนไปใช้ Supabase Auth

## 5. Scrape อัตโนมัติ (Input 1, 2) — recheck แล้ว

| ชุดข้อมูล | อัตโนมัติได้ไหม | วิธี |
|---|---|---|
| Open Interest / ราคา settlement S50 (SET, TFEX) | **ได้** | TFEX เผยแพร่ไฟล์สรุปรายวันหลังตลาดปิด ดึงแล้ว parse ได้ |
| Long/Short ต่างชาติ–กองทุน (SET Investor Type) | **ได้** | หน้าสรุปรายวันของ SET ดึงเป็นตารางได้ |
| TQ Pro (price close) | **ไม่ได้ตรง ๆ** | เป็นโปรแกรม desktop ไม่มี public API — ใช้ราคา settlement ของ TFEX แทน |
| VM / Indy 2090 (ข้อ 3, 5) | **ไม่ได้** | เป็น indicator ในโปรแกรมเทรด → ต้องแคปภาพ |

ข้อควรระวัง: scraper เว็บสาธารณะพังง่ายเวลาเขาแก้หน้าเว็บ และต้องเช็คเงื่อนไขการใช้ข้อมูลของ
SET/TFEX ก่อนใช้เชิงพาณิชย์

**ลำดับที่แนะนำ:** เฟส 1 กรอกมือ + import CSV (ทำงานได้ทันที) → เฟส 2 ค่อยเพิ่ม
Vercel Cron ยิง scraper ตอน 18:00 เขียนลง DB โดยยังให้ IC กดยืนยันก่อน publish เสมอ

## 6. โครงไฟล์

```
web/src/
  app/(dash)/            layout = sidebar + topbar
    page.tsx             สรุปภาพรวม
    s50-oi|flows|usd-futures|confirm|breadth|macro/page.tsx
    studio/page.tsx      IC Studio
  components/
    shell/Sidebar.tsx    เมนูซ้าย ย่อได้ (จำสถานะใน localStorage)
    charts/              PriceOIPanel, FlowPanel, sparkline, tooltip
    ui/ImageBoard.tsx    ภาพ + callout + stat tile + lightbox
    ui/NarrativeGrid.tsx บล็อก สรุปสั้น / แปลความ / Action / Insight
  data/                  ตัวอย่าง brief 1 วัน (จุดเดียวที่ต้องเปลี่ยนตอนต่อ DB)
  lib/types.ts           สัญญาข้อมูลของทั้งระบบ
```

## 7. ขั้นถัดไป

1. `npm run dev` ใน `web/` แล้วดู UX/UI ก่อน — ปรับสี/ตัวหนังสือให้ถูกใจ
2. ตัดสินใจ backend (แนะนำ Supabase) แล้วย้าย `src/data` ไปเป็น query
3. ใส่ Auth กัน `/studio` + middleware
4. ต่อ TFEX/SET scraper เป็น Vercel Cron
5. เพิ่ม export PNG สำหรับส่งลูกค้าทางไลน์

> หมายเหตุ: ตัวเลขในกราฟตอนนี้เป็น demo data ที่ปักหมุดค่าล่าสุดให้ตรงกับ Result Example
> ข้อความทั้งหมดคัดมาจากอินโฟกราฟิกที่ IC ทำไว้จริง
