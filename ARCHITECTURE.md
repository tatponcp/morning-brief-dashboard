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
