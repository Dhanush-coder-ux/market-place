import { useState } from "react";
import Announcement from "./Announcement";
import CarouselBanners from "./CarouselBanners";
import { Megaphone, Image as ImageIcon } from "lucide-react";

export default function Promotions() {
  const [activeSubTab, setActiveSubTab] = useState<"announcements" | "banners">("announcements");

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* ── Sub-navigation ── */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex justify-center sticky top-0 z-20 shadow-sm">
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveSubTab("announcements")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
              activeSubTab === "announcements"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Megaphone size={16} strokeWidth={2.5} />
            Store Announcements
          </button>
          <button
            onClick={() => setActiveSubTab("banners")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
              activeSubTab === "banners"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <ImageIcon size={16} strokeWidth={2.5} />
            Carousel Banners
          </button>
        </div>
      </div>
      
      {/* ── Content ── */}
      <div className="flex-1">
        {activeSubTab === "announcements" && <Announcement />}
        {activeSubTab === "banners" && <CarouselBanners />}
      </div>
    </div>
  );
}
