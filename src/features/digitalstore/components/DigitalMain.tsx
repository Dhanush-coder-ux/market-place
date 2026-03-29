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
  avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=nova&backgroundColor=e2e8f0",
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-3 antialiased">
      <div className="mx-auto space-y-6">

        {/* ── PROFILE HEADER CARD ── */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          
          {/* Cover Banner */}
          <div className="h-40 relative bg-gradient-to-b from-slate-100 to-slate-200/50">
            {/* Optional subtle image overlay */}
            <img 
              src="/Shops_Assets/banner.png" 
              alt="" 
              className="w-full h-full object-cover mix-blend-multiply opacity-40" 
              onError={(e) => e.currentTarget.style.display = 'none'} 
            />
            
            {/* Edit Button */}
            <div className="absolute right-4 top-4">
              <button className="flex items-center gap-2 bg-white/80 hover:bg-white backdrop-blur-sm border border-slate-200 text-slate-700 text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all shadow-sm">
                <Edit3 size={14} />
                <span className="hidden sm:inline">Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Profile Body */}
          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-6">
              
              {/* Avatar */}
              <div className="-mt-14 relative z-10 shrink-0">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-sm bg-slate-50 flex items-center justify-center overflow-hidden">
                  <img src={storeProfile.avatar} alt="Store Logo" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Name & Badges */}
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-semibold text-xl text-slate-900 tracking-tight">
                    {storeProfile.name}
                  </h1>
                  {storeProfile.verified && (
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-medium px-2 py-0.5 rounded-full">
                      <BadgeCheck size={14} className="text-blue-500" />
                      Verified
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-slate-900 text-[14px] font-medium">
                    {storeProfile.username}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-slate-500 text-[14px]">
                    <MapPin size={14} />
                    {storeProfile.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Tagline & Description */}
            <div className="max-w-2xl mb-8">
              <h2 className="font-medium text-[15px] text-slate-900 mb-1">
                {storeProfile.tagline}
              </h2>
              <p className="text-slate-500 text-[14px] leading-relaxed">
                {storeProfile.description}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="flex flex-wrap gap-4">
              {storeProfile.stats.map((s) => (
                <div 
                  key={s.label} 
                  className="bg-white border border-slate-200 rounded-xl px-5 py-3 min-w-[110px] hover:border-slate-300 transition-colors duration-200"
                >
                  <div className="font-semibold text-lg text-slate-900">{s.value}</div>
                  <div className="text-[12px] text-slate-500 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS + CONTENT CONTAINER ── */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          
          {/* Segmented Tab Navigation */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="inline-flex flex-wrap gap-1 bg-slate-100/80 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ease-in-out ${
                    activeTab === tab 
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  {renderTabIcon(tab)}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="p-6 md:p-4 min-h-[400px]">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
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