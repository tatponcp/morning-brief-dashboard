# การติดตั้งและ deploy

## ตัวแปรสภาพแวดล้อม

| ชื่อ | จำเป็นไหม | ใช้ทำอะไร |
|---|---|---|
| `STUDIO_PASSWORD` | จำเป็นบน production | รหัสเข้า `/studio` — ถ้าไม่ตั้ง หน้านั้นจะปิดตัวเองและตอบ 503 |
| `SUPABASE_URL` | แนะนำให้ตั้ง | เปิดโหมดเผยแพร่ขึ้นเว็บด้วยปุ่มเดียว |
| `SUPABASE_SERVICE_ROLE_KEY` | แนะนำให้ตั้ง | คู่กับตัวบน — **ห้ามขึ้นต้นด้วย `NEXT_PUBLIC_`** |
| `CRON_SECRET` | ไม่จำเป็น | กั้น `/api/cron/set50` ไม่ให้คนนอกเรียก |

ถ้าไม่ตั้งค่า Supabase ระบบจะใช้ไฟล์ `web/src/data/published.json` แทน
วิธีใช้คือส่งออกไฟล์จาก Studio แล้ว commit ทับ เว็บจะอัปเดตตอน deploy รอบถัดไป

## ติดตั้งในเครื่อง

```bash
cd web
npm install
npm run dev
```

เปิด <http://localhost:3000> · ในโหมด dev เข้า `/studio` ได้เลยโดยไม่ต้องใส่รหัส
ถ้าจะต่อ Supabase ให้สร้างไฟล์ `web/.env.local`

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxx
STUDIO_PASSWORD=xxxx
```

ไฟล์ `.env*.local` ถูก ignore ไว้แล้ว ห้าม commit ค่าจริงขึ้น repo เพราะ repo นี้เป็น public

## ตั้งค่า Supabase

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com)
2. SQL Editor → วางไฟล์ [`web/supabase/schema.sql`](../web/supabase/schema.sql) ทั้งไฟล์ → Run
   จะได้ตาราง `briefs` (เปิด RLS ไม่มี policy) และถังเก็บภาพ `brief-images`
3. คัดลอก Project URL และ service role key ไปใส่เป็นตัวแปรสภาพแวดล้อม

service role key ข้ามสิทธิ์ทั้งหมดของฐานข้อมูล จึงต้องอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น
และต้องไม่ขึ้นต้นด้วย `NEXT_PUBLIC_` เด็ดขาด

## Deploy บน Vercel

1. Import repo นี้
2. **ตั้ง Root Directory เป็น `web`** (สำคัญที่สุด ไม่ตั้งแล้ว build จะไม่ผ่าน)
3. เพิ่มตัวแปรสภาพแวดล้อมตามตารางข้างบน
4. Deploy

ทุก push ขึ้น `main` จะ deploy อัตโนมัติ ส่วน pull request จะได้ URL พรีวิวของตัวเอง

## งานตามเวลา

[`web/vercel.json`](../web/vercel.json) ตั้ง cron ไว้ยิง `/api/cron/set50` ทุกวันทำการ
เวลา `0 11 * * 1-5` UTC ซึ่งตรงกับ 18:00 น. ไทย เพื่อจดราคาปิด SET50 ของวันนั้น

ตรวจว่า cron ทำงานได้ที่ Vercel → Settings → Cron Jobs
ถ้าตั้ง `CRON_SECRET` ไว้ ให้ใส่ค่าเดียวกันในตัวแปรสภาพแวดล้อมของโปรเจกต์
ทีม IC กดจดเองจากหน้า `/studio/log` ได้ตลอดเวลา

## การตรวจก่อน merge

[CI](../.github/workflows/ci.yml) รัน 3 อย่างทุก push และทุก pull request

```bash
cd web
npx tsc --noEmit    # ตรวจชนิดข้อมูล
npx eslint src      # ตรวจโค้ด
npm run build       # build จริง
```

ควรรันทั้งสามคำสั่งนี้ในเครื่องก่อนเปิด pull request
