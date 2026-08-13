import Announcement from "./Announcement";

export default function Promotions() {
  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* ── Content ── */}
      <div className="flex-1">
        <Announcement />
      </div>
    </div>
  );
}
