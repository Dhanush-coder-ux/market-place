import { useState } from "react";
import { 
  Megaphone, 
  Truck, 
  Package, 
  MapPin, 
  BadgeCheck, 
  Edit3, 

} from "lucide-react";
import DeliveryPreferences from "../pages/Deliveryinfo";
import ProductDashboard from "../pages/StoreProductManagement";
import Announcement from "./Announcement";

type TabType = "Announcements" | "Delivery Preferences" | "Product Dashboard";

// Mock profile data
const storeProfile = {
  name: "Grace Super Market",
  username: "@novadigital",
  location: "San Francisco, CA",
  tagline: "Premium design assets, templates & UI kits for modern creators.",
  description:
    "We craft high-quality digital products that help designers and developers build faster. Trusted by 12,000+ creators worldwide.",
  avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=nova&backgroundColor=6366f1",
  coverGradient: "from-indigo-600 via-violet-600 to-purple-700",
  stats: [
    { label: "Products", value: "48" },
    { label: "Sales", value: "3.2k" },
    { label: "Rating", value: "4.9★" },
    { label: "Followers", value: "12k" },
  ],
  verified: true,
};

const DigitalMain = () => {
  const tabs: TabType[] = [
    "Announcements",
    "Delivery Preferences",
    "Product Dashboard",
  ];

  const [activeTab, setActiveTab] = useState<TabType>("Announcements");

  const renderTabIcon = (tab: TabType) => {
    switch (tab) {
      case "Announcements": return <Megaphone size={16} />;
      case "Delivery Preferences": return <Truck size={16} />;
      case "Product Dashboard": return <Package size={16} />;
    }
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-[#f0f4ff] via-[#faf5ff] to-[#f0fdf4]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* ── PROFILE CARD ── */}
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_24px_rgba(99,102,241,0.08)] rounded-3xl overflow-hidden">
          
          {/* Cover Banner (Fixed h-50 to h-48) */}
          <div className="h-48  relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_2px,_transparent_2px)] bg-[size:20px_20px]"></div>
            <img src="/Shops_Assets/banner.png" alt="" className="w-full h-full object-cover " />
            
            {/* Edit Button */}
            <div className="absolute right-4 top-4">
              <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                <Edit3 size={14} />
                <span className="hidden sm:inline">Edit Store</span>
              </button>
            </div>
          </div>

          {/* Profile Body */}
          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 mb-6">
              
              {/* Avatar (Fixed w-34/h-34 to w-32/h-32) */}
              <div className="-mt-12 relative z-10 shrink-0">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
                  <img src="/Shops_Assets/logo.png" alt="Store Logo" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Name & Badges */}
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-syne font-bold text-2xl text-slate-800 tracking-tight">
                    {storeProfile.name}
                  </h1>
                  {storeProfile.verified && (
                    <span className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      <BadgeCheck size={12} /> Verified
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  <span className="text-indigo-600 text-sm font-bold">
                    {storeProfile.username}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400 text-sm font-medium">
                    <MapPin size={14} />
                    {storeProfile.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Tagline & Description */}
            <h2 className="font-syne font-bold text-[15px] text-indigo-600 tracking-tight mb-2">
              "{storeProfile.tagline}"
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mb-6">
              {storeProfile.description}
            </p>

            {/* Stats Grid */}
            <div className="flex flex-wrap gap-3">
              {storeProfile.stats.map((s) => (
                <div 
                  key={s.label} 
                  className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl px-5 py-2.5 text-center hover:bg-indigo-50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="font-syne font-bold text-lg text-slate-800">{s.value}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS + CONTENT ── */}
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_24px_rgba(99,102,241,0.08)] rounded-3xl p-1.5">
          
          {/* Tab Bar */}
          <div className="p-3">
            <div className="flex flex-wrap gap-1 bg-slate-50/50 border border-slate-100 p-1.5 rounded-2xl w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 ${
                    activeTab === tab 
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-100/50" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  }`}
                >
                  {renderTabIcon(tab)}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100 mx-4" />

          {/* Tab Content Area */}
          <div className="p-6 min-h-[400px]">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTab === "Announcements" && <Announcement />}
              {activeTab === "Delivery Preferences" && <DeliveryPreferences />}
              {activeTab === "Product Dashboard" && <ProductDashboard />}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DigitalMain;