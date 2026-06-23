import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Megaphone,
  Truck,
  Package,
  MapPin,
  BadgeCheck,
  Edit3,
  Timer,
  Eye,
  ShoppingBag,
  IndianRupee,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Star,
  Share2,
  ExternalLink,
  Wifi,
  ChevronRight,
  Users,
} from "lucide-react";
import DeliveryPreferences from "../pages/Deliveryinfo";
import ProductDashboard from "../pages/StoreProductManagement";
import Promotions from "../pages/Promotions";
import OperatingHours from "../pages/OperatingHours";

type TabType = "Promotions" | "Delivery Preferences" | "Product Dashboard" | "Operating Hours";

const THEMES = {
  Blue: {
    primary: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#2563eb",
  },
  Emerald: {
    primary: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    text: "#059669",
  },
  Violet: {
    primary: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    text: "#7c3aed",
  },
  Indigo: {
    primary: "#6366f1",
    bg: "#e0e7ff",
    border: "#c7d2fe",
    text: "#4f46e5",
  },
  Rose: {
    primary: "#f43f5e",
    bg: "#fff1f2",
    border: "#fecdd3",
    text: "#e11d48",
  },
  Amber: {
    primary: "#d97706",
    bg: "#fef3c7",
    border: "#fde68a",
    text: "#b45309",
  },
};

// ─── Mock Data & Dynamic LocalStorage Loader ──────────────────────────────────
const storeProfile = (() => {
  const defaults = {
    name: "Grace Super Market",
    username: "@gracemarket",
    location: "Chennai, Tamil Nadu",
    tagline: "Fresh picks, fair prices — delivered to your door.",
    description:
      "Your trusted neighbourhood supermarket, now online. Shop from 500+ daily essentials, fresh produce, and specialty items with same-day delivery.",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=grace&backgroundColor=dbeafe",
    rating: 4.8,
    reviews: 2340,
    followers: 12500,
    verified: true,
    online: true,
    memberSince: "Jan 2023",
    category: "Grocery & Essentials",
    themeColor: "Blue",
    banner: "",
  };

  const saved = localStorage.getItem("active-store-profile");
  if (saved) {
    try {
      return { ...defaults, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Failed to parse store profile from localStorage", e);
    }
  }
  return defaults;
})();

const theme = THEMES[(storeProfile.themeColor as keyof typeof THEMES) || "Blue"];


// Stat cards — each has its own muted solid color
const STORE_STATS = [
  {
    id: "views",
    label: "Store Views",
    sublabel: "Today",
    value: "347",
    suffix: undefined as string | undefined,
    trend: "+22%",
    trendUp: true,
    trendDesc: "from yesterday",
    icon: <Eye size={17} strokeWidth={2} />,
    iconColor: "#3b82f6",   // blue-500
    iconBg:    "#eff6ff",   // blue-50
    barColor:  "#3b82f6",
    labelColor:"#3b82f6",
  },
  {
    id: "orders",
    label: "Orders",
    sublabel: "Today",
    value: "12",
    suffix: undefined as string | undefined,
    trend: "+3",
    trendUp: true,
    trendDesc: "vs yesterday",
    icon: <ShoppingBag size={17} strokeWidth={2} />,
    iconColor: "#16a34a",   // green-600
    iconBg:    "#f0fdf4",   // green-50
    barColor:  "#16a34a",
    labelColor:"#16a34a",
  },
  {
    id: "revenue",
    label: "Revenue",
    sublabel: "Today",
    value: "₹4,820",
    suffix: undefined as string | undefined,
    trend: "avg ₹402/order",
    trendUp: true,
    trendDesc: "",
    icon: <IndianRupee size={17} strokeWidth={2} />,
    iconColor: "#ca8a04",   // yellow-600
    iconBg:    "#fefce8",   // yellow-50
    barColor:  "#ca8a04",
    labelColor:"#ca8a04",
  },
  {
    id: "products",
    label: "Products Live",
    sublabel: "",
    value: "18",
    suffix: "/ 24",
    trend: "6 hidden",
    trendUp: false,
    trendDesc: "from store",
    icon: <LayoutGrid size={17} strokeWidth={2} />,
    iconColor: "#ea580c",   // orange-600
    iconBg:    "#fff7ed",   // orange-50
    barColor:  "#ea580c",
    labelColor:"#ea580c",
  },
];

const TAB_CONFIG: { tab: TabType; icon: React.ReactNode; desc: string }[] = [
  { tab: "Promotions",           icon: <Megaphone size={15} strokeWidth={2.5} />, desc: "Announcements & Banners"  },
  { tab: "Delivery Preferences", icon: <Truck     size={15} strokeWidth={2.5} />, desc: "Zones & timing"      },
  { tab: "Product Dashboard",    icon: <Package   size={15} strokeWidth={2.5} />, desc: "Manage items"        },
  { tab: "Operating Hours",      icon: <Timer     size={15} strokeWidth={2.5} />, desc: "Open & close times"  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const DigitalMain = () => {
  const [activeTab, setActiveTab] = useState<TabType>("Promotions");

  return (
    <>
      <style>{`
        @keyframes dm-fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dm-slideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes dm-pulse   { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }

        .dm-stat-card { transition: box-shadow 0.18s ease, transform 0.18s ease; }
        .dm-stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px ${theme.primary}18; }

        .dm-tab-btn { transition: all 0.14s ease; }
        .dm-tab-btn:hover:not(.dm-tab-active) { background: ${theme.bg}; color: ${theme.text}; }

        .dm-online-dot { animation: dm-pulse 2s ease infinite; }
      `}</style>

      <div className="min-h-screen pb-16 bg-slate-50" style={{ fontFamily: "Inter, Poppins, sans-serif" }}>

        {/* ══════════════════════════════════════════════════
            PROFILE CARD
        ══════════════════════════════════════════════════ */}
        <div style={{ animation: "dm-fadeIn 0.3s ease" }}>

          {/* Cover — matches selected theme accent */}
          <div
            className="relative h-44 overflow-hidden"
            style={{ backgroundColor: theme.bg }}
          >
            {/* Subtle dot pattern */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, ${theme.border} 1.5px, transparent 1.5px)`,
                backgroundSize: "22px 22px",
              }}
            />
            {/* Soft light circle accent */}
            <div
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full"
              style={{ background: theme.bg, borderColor: theme.border, borderWidth: 1, opacity: 0.6 }}
            />
            <div
              className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full"
              style={{ background: theme.border, opacity: 0.35 }}
            />

            {/* Banner image */}
            <img
              src={storeProfile.banner || "/Shops_Assets/banner.png"}
              alt="Store Banner"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity ${storeProfile.banner ? "opacity-90" : "opacity-10"}`}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />

            {/* Action buttons */}
            <div className="absolute right-5 top-4 flex gap-2 z-10">
              <button 
                className="flex items-center gap-1.5 bg-white text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer shadow-sm border"
                style={{ color: theme.primary, borderColor: theme.border }}
              >
                <Share2 size={12} strokeWidth={2.5} /> Share
              </button>
              <Link to="/create-digital-store">
                <button
                  className="flex items-center gap-1.5 text-white text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md hover:opacity-90"
                  style={{ background: theme.primary }}
                >
                  <Edit3 size={12} strokeWidth={2.5} /> Edit Profile
                </button>
              </Link>
            </div>

            {/* View public store */}
            <div className="absolute left-5 bottom-4 z-10">
              <a
                href="#"
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-600 text-[11.5px] font-medium transition-colors cursor-pointer"
              >
                <ExternalLink size={11} /> View public store
              </a>
            </div>
          </div>

          {/* White body */}
          <div className="bg-white border-b border-slate-100">
            <div className="px-6 pb-0">

              {/* Avatar + name row */}
              <div className="flex items-end gap-5 -mt-14 mb-5 relative z-10">

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-28 h-28 rounded-2xl border-4 border-white overflow-hidden bg-slate-50"
                    style={{ boxShadow: `0 4px 20px ${theme.primary}25` }}
                  >
                    <img src={storeProfile.avatar} alt="Store Logo" className="w-full h-full object-cover" />
                  </div>
                  {storeProfile.online && (
                    <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white inline-block dm-online-dot" />
                      OPEN
                    </div>
                  )}
                </div>

                {/* Name & meta */}
                <div className="flex-1 pb-3 pt-16">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                    <h1 className="text-[21px] font-extrabold text-slate-800 tracking-tight leading-none">
                      {storeProfile.name}
                    </h1>
                    {storeProfile.verified && (
                      <span
                        className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border"
                        style={{ background: theme.bg, color: theme.text, borderColor: theme.border }}
                      >
                        <BadgeCheck size={11} /> Verified
                      </span>
                    )}
                    <span
                      className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border"
                      style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}
                    >
                      <Wifi size={10} /> Online
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap text-[13px]">
                    <span className="text-slate-400 font-medium">{storeProfile.username}</span>
                    <span className="text-slate-200">·</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users size={12} className="text-slate-400" />
                      <span className="font-bold text-slate-700">{storeProfile.followers.toLocaleString()}</span> Followers
                    </span>
                    <span className="text-slate-200">·</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin size={12} className="text-slate-400" />
                      {storeProfile.location}
                    </span>
                    <span className="text-slate-200">·</span>
                    <span
                      className="text-[11.5px] font-medium px-2.5 py-0.5 rounded-lg border"
                      style={{ background: theme.bg, color: theme.text, borderColor: theme.border }}
                    >
                      {storeProfile.category}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="pb-3 hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    <span className="text-[15px] font-extrabold text-slate-700">{storeProfile.rating}</span>
                    <span className="text-[11px] text-slate-400 font-medium">({storeProfile.reviews.toLocaleString()})</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-medium">Since {storeProfile.memberSince}</span>
                </div>
              </div>

              {/* Description */}
              <div className="max-w-2xl mb-5">
                <p className="text-[14px] font-semibold text-slate-700 mb-1">{storeProfile.tagline}</p>
                <p className="text-[13px] text-slate-400 leading-relaxed">{storeProfile.description}</p>
              </div>

              {/* ── TODAY'S STATS STRIP ── */}
              <div className="grid grid-cols-4 gap-3 border-t border-slate-100 pt-4 pb-4 -mx-6 px-6">
                {STORE_STATS.map((stat, idx) => (
                  <div
                    key={stat.id}
                    className="dm-stat-card bg-white rounded-xl border border-slate-200 p-4 relative overflow-hidden"
                    style={{ animation: `dm-slideUp 0.2s ease ${idx * 0.06}s both` }}
                  >
                    {/* Icon */}
                    <div
                      className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: stat.iconBg, color: stat.iconColor }}
                    >
                      {stat.icon}
                    </div>

                    {/* Label */}
                    <p
                      className="m-0 text-[10px] font-black tracking-[0.09em] uppercase mb-2"
                      style={{ color: stat.labelColor }}
                    >
                      {stat.sublabel
                        ? `${stat.label} (${stat.sublabel})`
                        : stat.label}
                    </p>

                    {/* Value */}
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="text-[26px] font-extrabold text-slate-800 leading-none tracking-tight">
                        {stat.value}
                      </span>
                      {stat.suffix && (
                        <span className="text-[13px] font-semibold text-slate-400">{stat.suffix}</span>
                      )}
                    </div>

                    {/* Trend */}
                    <div className="flex items-center gap-1">
                      {stat.trendUp
                        ? <TrendingUp  size={11} className="text-emerald-500 shrink-0" />
                        : <TrendingDown size={11} className="text-slate-400 shrink-0" />
                      }
                      <span className={`text-[11px] font-bold ${stat.trendUp ? "text-emerald-600" : "text-slate-500"}`}>
                        {stat.trend}
                      </span>
                      {stat.trendDesc && (
                        <span className="text-[10.5px] text-slate-400 font-medium">{stat.trendDesc}</span>
                      )}
                    </div>

                    {/* Colored bottom bar */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2.5px]"
                      style={{ background: stat.barColor }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            TABS + CONTENT
        ══════════════════════════════════════════════════ */}
        <div
          className="px-4 pt-4 mx-auto"
          style={{ animation: "dm-slideUp 0.25s ease 0.1s both" }}
        >
          {/* Tab Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
            <div className="flex items-center gap-1 p-2.5 overflow-x-auto scrollbar-hide">
              {TAB_CONFIG.map(({ tab, icon, desc }) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`dm-tab-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold whitespace-nowrap cursor-pointer border flex-shrink-0 ${
                      isActive ? "dm-tab-active" : "bg-transparent border-transparent text-slate-500"
                    }`}
                    style={
                      isActive
                        ? { background: theme.bg, color: theme.text, borderColor: theme.border }
                        : undefined
                    }
                  >
                    <span style={{ color: isActive ? theme.primary : "#94a3b8" }}>{icon}</span>
                    {tab}
                    {!isActive && (
                      <span className="text-[10px] text-slate-300 font-medium hidden md:inline">{desc}</span>
                    )}
                  </button>
                );
              })}

              <div className="flex-1" />
              <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-300 pr-1 shrink-0">
                <ChevronRight size={11} />
                <span>Select a section</span>
              </div>
            </div>
          </div>

          {/* Content card */}
          <div
            key={activeTab}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            style={{ animation: "dm-slideUp 0.18s ease" }}
          >
            {/* Strip header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100" style={{ background: "#f8fafc" }}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#eff6ff", color: "#3b82f6" }}
              >
                {TAB_CONFIG.find((t) => t.tab === activeTab)?.icon}
              </div>
              <div>
                <p className="m-0 text-[13px] font-bold text-slate-700 leading-none mb-0.5">{activeTab}</p>
                <p className="m-0 text-[11px] text-slate-400 font-medium">
                  {TAB_CONFIG.find((t) => t.tab === activeTab)?.desc}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block dm-online-dot" />
                <span className="text-[10.5px] font-bold text-emerald-600">Live</span>
              </div>
            </div>

            <div className="min-h-[400px]">
              {activeTab === "Promotions"           && <Promotions />}
              {activeTab === "Delivery Preferences" && <DeliveryPreferences />}
              {activeTab === "Product Dashboard"    && <ProductDashboard />}
              {activeTab === "Operating Hours"      && <OperatingHours />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DigitalMain;
