import { loadBrief } from "@/lib/brief-store";
import { isSupabaseConfigured } from "@/lib/supabase";
import { StudioEditor } from "@/components/studio/StudioEditor";

/** หน้าเครื่องมือของ IC — ตัวหน้าเป็น server เพื่อโหลดของที่เผยแพร่ล่าสุดมาเป็นจุดตั้งต้น */
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const { brief } = await loadBrief();
  return <StudioEditor brief={brief} canPublish={isSupabaseConfigured()} />;
}
