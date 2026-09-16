import { loadBrief } from "@/lib/brief-store";
import { isSupabaseConfigured } from "@/lib/supabase";
import { loadMacro } from "@/lib/market";
import { goldGroup } from "@/lib/macro-view";
import { StudioEditor } from "@/components/studio/StudioEditor";

export const metadata = { title: "IC Studio", robots: { index: false } };

/** หน้าเครื่องมือของ IC — ตัวหน้าเป็น server เพื่อโหลดของที่เผยแพร่ล่าสุดมาเป็นจุดตั้งต้น */
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const [{ brief }, macro] = await Promise.all([loadBrief(), loadMacro()]);
  return (
    <StudioEditor
      brief={brief}
      canPublish={isSupabaseConfigured()}
      instruments={macro.instruments}
      macroGroup={goldGroup(macro)}
    />
  );
}
