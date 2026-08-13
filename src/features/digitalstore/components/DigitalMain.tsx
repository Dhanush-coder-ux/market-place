import { useState, useEffect } from "react";
import {
  Megaphone,
  Package,
  Edit3,
  Share2,
  ExternalLink,
  MapPin,
  BadgeCheck,
  Settings2,
  AlertCircle,
  ChevronRight,
  Wifi,
  WifiOff,
  Calendar,
  Hash,
  Tag,
  QrCode,
  Users,
} from "lucide-react";
import { shopApi } from "@/services/api/shop";
import { inventoryApi } from "@/services/api/inventory";
import { SHOP_ID } from "@/services/endpoints";
import ProductDashboard from "../pages/StoreProductManagement";
import Promotions from "../pages/Promotions";
import { StoreSettingsLayout } from "./StoreSettingsLayout";
import { useNavigate } from "react-router-dom";
type TabType = "Announcements" | "Products" | "Settings";

interface ShopData {
  id: string;
  name: string;
  description: string | null;
  tagline: string | null;
  categories: string[];
  visible_online: boolean;
  banner_url: string | null;
  logo_url: string | null;
  business_infos: {
    type: string;
    currency: string;
    gst_infos: { registered: boolean; number?: string | null };
  };
  address: { full_address: string };
  created_at: string;
  sequence_id: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className ?? ""}`} />
);

const HeaderSkeleton = () => (
  <div className="bg-white border-b border-slate-100">
    <div className="h-40 bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse" />
    <div className="px-6 pb-6">
      <div className="flex items-end gap-5 -mt-12 mb-5">
        <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
        <div className="flex-1 pt-14 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mt-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </div>
  </div>
);


// ─── Tab config ───────────────────────────────────────────────────────────────
const TAB_CONFIG: { tab: TabType; icon: React.ElementType; desc: string }[] = [
  { tab: "Announcements", icon: Megaphone, desc: "Announcements & Banners" },
  { tab: "Products", icon: Package, desc: "Manage items" },
  { tab: "Settings", icon: Settings2, desc: "Store configuration" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const DigitalMain = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("Announcements");
  const [shop, setShop] = useState<ShopData | null>(null);
  const [fallbackProductImage, setFallbackProductImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!SHOP_ID || SHOP_ID === "string") {
      navigate("/setup-digital-store");
      return;
    }
    const fetch = async () => {
      setLoading(true);
      try {
        const [shopRes, productsRes] = await Promise.all([
          shopApi.getShopById(SHOP_ID),
          inventoryApi.getInventoriesByShop(SHOP_ID, { limit: "50" })
        ]);
        const data = shopRes?.data ?? shopRes;
        if (data) {
          setShop(data);
          const products = productsRes?.data ?? productsRes ?? [];
          const prodWithImg = products.find((p: any) => p.image_url || p.image || p.datas?.image_url || p.datas?.image);
          if (prodWithImg) {
            setFallbackProductImage(prodWithImg.image_url || prodWithImg.image || prodWithImg.datas?.image_url || prodWithImg.datas?.image);
          }
        } else {
          setError("Shop not found");
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load shop details.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [navigate]);



  if (loading) return (
    <div className="min-h-screen bg-slate-50/60">
      <HeaderSkeleton />
      <div className="px-4 pt-5 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Skeleton className="h-10 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (error || !shop) return (
    <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <h3 className="font-bold text-slate-800 mb-1">Failed to load store</h3>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const initials = shop.name?.charAt(0)?.toUpperCase() ?? "S";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        {/* Banner */}
        <div className="relative h-40 overflow-hidden">
          {shop.banner_url ? (
            <img src={shop.banner_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 40%, #bfdbfe 100%)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "radial-gradient(circle, #93c5fd55 1.5px, transparent 1.5px)",
                  backgroundSize: "22px 22px",
                }}
              />
              <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-blue-300/20 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-44 h-44 rounded-full bg-blue-400/15 blur-xl" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute right-4 top-4 flex gap-2 z-10">
            <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white shadow-sm border border-white/80 transition-all">
              <Share2 size={11} strokeWidth={2.5} /> Share
            </button>
            <button
              onClick={() => {
                setActiveTab("Settings");
                document.getElementById("digital-store-tabs")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-md transition-all"
            >
              <Edit3 size={11} strokeWidth={2.5} /> Edit Store
            </button>
            <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white shadow-sm border border-white/80 transition-all">
              <ExternalLink size={11} strokeWidth={2.5} /> Preview
            </button>
          </div>
        </div>

        {/* Profile Row */}
        <div className="px-5 md:px-7 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-11 mb-4 relative z-10">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-22 h-22 w-[88px] h-[88px] rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-blue-50 flex items-center justify-center">
                {shop.logo_url ? (
                  <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                ) : fallbackProductImage ? (
                  <img src={fallbackProductImage} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold text-blue-600">{initials}</span>
                )}
              </div>
              {/* Visibility badge */}
              <div className={`absolute -bottom-2 -right-2 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm ${shop.visible_online ? "bg-emerald-500 text-white" : "bg-slate-400 text-white"}`}>
                {shop.visible_online
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-white inline-block" style={{ animation: "pulse 2s infinite" }} />ONLINE</>
                  : <><WifiOff size={8} />OFFLINE</>
                }
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pt-2 sm:pt-10">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">{shop.name}</h1>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  <BadgeCheck size={10} /> Verified
                </span>
                {shop.categories?.[0] && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    <Tag size={9} className="inline mr-0.5" />{shop.categories[0]}
                  </span>
                )}
              </div>
              {shop.tagline && <p className="text-sm text-slate-500 font-medium">{shop.tagline}</p>}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Hash size={10} />Store #{shop.sequence_id}</span>
                <span className="flex items-center gap-1"><MapPin size={10} />{shop.address?.full_address || "Address not set"}</span>
                <span className="flex items-center gap-1"><Calendar size={10} />Since {shop.created_at}</span>
              </div>
            </div>

            {/* Status pill */}
            <div className="flex items-center gap-2 pb-1">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${shop.visible_online ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                {shop.visible_online ? <Wifi size={12} /> : <WifiOff size={12} />}
                {shop.visible_online ? "Visible Online" : "Not Visible"}
              </div>
            </div>
          </div>

          {/* Description */}
          {shop.description && (
            <p className="text-sm text-slate-500 leading-relaxed mb-4 max-w-2xl">{shop.description}</p>
          )}

          {/* QR Code & Followers */}
          <div className="flex flex-wrap items-center gap-4 pt-2 pb-2">
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-all">
              <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-100">
                <QrCode size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Store QR</p>
                <p className="text-sm font-extrabold text-slate-800 leading-none">View & Share</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                <Users size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Followers</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-slate-800 leading-none">1.2K</span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">+12 new</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── MAIN CONTENT ──────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5">
        <div className="flex flex-col gap-5">



          {/* BOTTOM — Tabs & Content */}
          <div className="w-full space-y-4">
            {/* Tab Bar — sticky when scrolled to top */}
            <div id="digital-store-tabs" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-1 p-2 overflow-x-auto scrollbar-hide">
                {TAB_CONFIG.map(({ tab, icon: Icon, desc }) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-150 border ${isActive
                        ? "bg-blue-50 text-blue-700 border-blue-100 shadow-sm"
                        : "bg-transparent border-transparent text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                        }`}
                    >
                      <Icon size={13} strokeWidth={2.5} className={isActive ? "text-blue-600" : "text-slate-400"} />
                      {tab}
                      {!isActive && (
                        <span className="text-[9px] text-slate-300 hidden md:inline">{desc}</span>
                      )}
                    </button>
                  );
                })}
                <div className="flex-1" />
                <span className="text-[10px] text-slate-300 pr-2 hidden lg:flex items-center gap-1 shrink-0">
                  <ChevronRight size={10} /> section
                </span>
              </div>
            </div>

            {/* Tab Content Card */}
            <div
              key={activeTab}
              className="relative z-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              style={{ animation: "slideUp 0.18s ease" }}
            >
              <div className="min-h-[360px]">
                {activeTab === "Announcements" && <Promotions />}
                {activeTab === "Products" && <ProductDashboard />}
                {activeTab === "Settings" && <StoreSettingsLayout shop={shop} />}
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

export default DigitalMain;
