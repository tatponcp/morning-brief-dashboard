/** โครงหน้าระหว่างรอข้อมูล — กันจอกระพริบตอนสลับ section */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-[90px] rounded-2xl bg-white/4" />
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="h-72 rounded-2xl bg-white/4" />
        <div className="h-72 rounded-2xl bg-white/4" />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-32 rounded-2xl bg-white/4" />
        <div className="h-32 rounded-2xl bg-white/4" />
        <div className="h-32 rounded-2xl bg-white/4" />
      </div>
    </div>
  );
}
