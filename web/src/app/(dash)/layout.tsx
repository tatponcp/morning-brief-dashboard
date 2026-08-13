import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { loadBrief } from "@/lib/brief-store";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const { brief } = await loadBrief();
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar dateLabel={brief.dateLabelTH} />
        <main className="grid-lines mx-auto w-full max-w-[1500px] px-3 py-4 md:px-6 md:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
