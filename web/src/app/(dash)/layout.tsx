import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { getLatestBrief } from "@/data";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  const brief = getLatestBrief();
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar dateLabel={brief.dateLabelTH} />
        <main className="grid-lines mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
