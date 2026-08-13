-- Morning Brief · โครงตารางสำหรับ Supabase
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางทั้งไฟล์นี้ → Run

create table if not exists public.briefs (
  -- วันที่ของ brief เป็นคีย์ เผยแพร่ซ้ำวันเดิม = ทับของเดิม
  date          date primary key,
  date_label_th text not null default '',
  -- เนื้อหาทั้งวันเก็บเป็น JSON ก้อนเดียว (รูปแบบเดียวกับไฟล์ที่ export จาก /studio)
  payload       jsonb not null,
  published_at  timestamptz not null default now(),
  published_by  text
);

create index if not exists briefs_published_at_idx
  on public.briefs (published_at desc);

-- เปิด RLS แล้วไม่สร้าง policy ใด ๆ
-- = anon key อ่านไม่ได้เลย เข้าถึงได้เฉพาะ service role key ที่อยู่ฝั่งเซิร์ฟเวอร์
-- (เว็บฝั่งลูกค้าอ่านผ่าน server component ไม่ได้ยิงตรงจาก browser)
alter table public.briefs enable row level security;

-- ถังเก็บภาพที่ IC อัปโหลด (เปิดให้อ่านสาธารณะ เพราะต้องแสดงบนหน้าเว็บ)
insert into storage.buckets (id, name, public)
values ('brief-images', 'brief-images', true)
on conflict (id) do nothing;
