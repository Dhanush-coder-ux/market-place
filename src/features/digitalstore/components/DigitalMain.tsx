import { useState, useEffect } from "react";
import {
  Megaphone, Package, Settings2, AlertCircle,
  WifiOff,
  Edit3, QrCode, Users, X, Download,
  Hash,
  BadgeCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { shopApi } from "@/services/api/shop";
import { inventoryApi } from "@/services/api/inventory";
import { SHOP_ID } from "@/services/endpoints";
import ProductDashboard from "../pages/StoreProductManagement";
import Promotions from "../pages/Promotions";
import { StoreSettingsLayout } from "./StoreSettingsLayout";
import { useNavigate } from "react-router-dom";

type TabType = "Announcements" | "Products" | "Settings";

// ─── Full API response types ───────────────────────────────────────────────────
interface OperatingHour {
  id: number;
  shop_id: string;
  open_at: string;
  close_at: string;
  day: string;
}

interface DeliveryOption {
  id: number;
  shop_id: string;
  type: string;
  speed: string;
  free_shipping_amount: number;
  delivery_by: string;
}

interface ShopAnnouncement {
  id: number;
  shop_id: string;
  type: string;
  message: string;
  status: string;
  created_at: string;
}

interface ShopData {
  id: string;
  ui_id: number;
  sequence_id: number;
  user_id: string;
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
  address: {
    full_address: string;
    landmark?: string;
    zip_code?: string;
    latitude?: number;
    longitude?: number;
  };
  additional_infos: {
    emails: string[] | null;
    website: string | null;
    mobile_numbers: string[] | null;
  };
  operating_hours: OperatingHour[];
  delivery_options: DeliveryOption[];
  announcements: ShopAnnouncement[];
  created_at?: string;
}


// ─── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className ?? ""}`} />
);

const HeaderSkeleton = () => (
  <div className="bg-white border-b border-slate-200">
    <div className="h-32 bg-slate-100 animate-pulse" />
    <div className="px-6 py-4 flex items-center gap-4">
      <Skeleton className="w-16 h-16 rounded-xl shrink-0 -mt-10" />
      <div className="flex-1 space-y-2 pt-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
    <div className="px-6 flex gap-6 border-t border-slate-100">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-28 my-2" />)}
    </div>
  </div>
);

// ─── QR Popup ──────────────────────────────────────────────────────────────────
function QRModal({ shop, onClose }: { shop: ShopData; onClose: () => void }) {
  const storeUrl = shop.additional_infos?.website
    || `${window.location.origin}/store/${shop.id}`;

  const handleDownload = () => {
    const svg = document.getElementById("store-qr-svg") as unknown as SVGSVGElement;
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${shop.name.replace(/\s+/g, "-").toLowerCase()}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: "qr-fadeIn 0.15s ease" }}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-[340px] overflow-hidden" style={{ animation: "qr-slideUp 0.2s ease" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-slate-800">Store QR Code</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {/* QR body */}
        <div className="px-5 py-6 flex flex-col items-center gap-4">
          {/* Logo + QR */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <QRCodeSVG
              id="store-qr-svg"
              value={storeUrl}
              size={196}
              level="M"
              includeMargin={false}
              imageSettings={
                shop.logo_url
                  ? { src: shop.logo_url, height: 36, width: 36, excavate: true }
                  : undefined
              }
            />
          </div>

          {/* Store info */}
          <div className="text-center w-full">
            <p className="text-sm font-semibold text-slate-800">{shop.name}</p>
            {shop.address?.full_address && (
              <p className="text-[11px] text-slate-400 mt-0.5">{shop.address.full_address}</p>
            )}
            <p className="text-[10px] text-slate-300 mt-1 font-mono break-all">{storeUrl}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <button
              onClick={handleCopy}
              className={`flex-1 h-9 border rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                copied
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download size={13} /> Download
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes qr-fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes qr-slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}

// ─── Tab config ────────────────────────────────────────────────────────────────
const TAB_CONFIG: { tab: TabType; icon: React.ElementType }[] = [
  { tab: "Announcements", icon: Megaphone },
  { tab: "Products",      icon: Package   },
  { tab: "Settings",      icon: Settings2 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const DigitalMain = () => {
  const navigate  = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("Announcements");
  const [shop, setShop]           = useState<ShopData | null>(null);
  const [fallbackImg, setFallbackImg] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showQR, setShowQR]       = useState(false);

  useEffect(() => {
    if (!SHOP_ID || SHOP_ID === "string") { navigate("/setup-digital-store"); return; }
    const load = async () => {
      setLoading(true);
      try {
        const [shopRes, productsRes] = await Promise.all([
          shopApi.getShopById(SHOP_ID),
          inventoryApi.getInventoriesByShop(SHOP_ID, { limit: "50" }),
        ]);
        const data = shopRes?.data ?? shopRes;
        if (data) {
          setShop(data);
          const prods = productsRes?.data ?? productsRes ?? [];
          const withImg = prods.find((p: any) => p.image_url || p.image || p.datas?.image_url || p.datas?.image);
          if (withImg) setFallbackImg(withImg.image_url || withImg.image || withImg.datas?.image_url || withImg.datas?.image);
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
    load();
  }, [navigate]);

  if (loading) return <div className="min-h-screen bg-slate-50"><HeaderSkeleton /><div className="px-6 pt-6 space-y-4"><Skeleton className="h-64 rounded-xl" /></div></div>;
  if (error || !shop) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertCircle size={20} className="text-red-500" /></div>
        <h3 className="font-semibold text-slate-800 mb-1">Failed to load store</h3>
        <p className="text-sm text-slate-500 mb-5">{error}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">Retry</button>
      </div>
    </div>
  );

  const initials   = shop.name?.charAt(0)?.toUpperCase() ?? "S";
  
  

  return (
    <div className="min-h-screen bg-slate-50 pb-16" style={{ fontFamily: "Inter, sans-serif" }}>

      {showQR && <QRModal shop={shop} onClose={() => setShowQR(false)} />}

      {/* ─── HEADER ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">

        {/* Banner */}
        <div className="relative h-36 overflow-hidden">
          {shop.banner_url ? (
            <img src={shop.banner_url} alt="Store banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg,#dbeafe 0%,#eff6ff 50%,#e0f2fe 100%)" }}>
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle,#93c5fd 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
            </div>
          )}

          {/* Overlay buttons */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button
              onClick={() => { setActiveTab("Settings"); document.getElementById("digital-store-tabs")?.scrollIntoView({ behavior: "smooth" }); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-all"
            >
              <Edit3 size={11} /> Edit Store
            </button>
          </div>
        </div>

        {/* ── Profile Row ── */}
        {/*
          Layout:
          ┌───────────────────────────────────────────────────────┐
          │ [Logo overlapping banner]                             │
          │                                                       │
          │ Shop Name  #Store1  ● Online       [QR]  [Followers] │
          │ "Good Clothings"                                      │
          │ super store                                           │
          │ 📍 22, pandian street…                                │
          │ 🏷 Restaurant & Cafe  OTHERS  INR                     │
          └───────────────────────────────────────────────────────┘
        */}
        <div className="px-6 pb-4">

          {/* Logo — pulled up to overlap banner */}
          <div className="relative z-10 -mt-10 mb-3">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-xl border-4 border-white shadow-md overflow-hidden bg-blue-50 flex items-center justify-center">
                {shop.logo_url ? (
                  <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                ) : fallbackImg ? (
                  <img src={fallbackImg} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-blue-600">{initials}</span>
                )}
              </div>
              {/* Online dot on logo */}
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${shop.visible_online ? "bg-emerald-500" : "bg-slate-400"}`} />
            </div>
          </div>

          {/* Info row: name/details (left) + QR/Followers (right) */}
          <div className="flex items-start justify-between gap-4">

            {/* ── Left: all shop info stacked ── */}
            <div className="flex-1 min-w-0 space-y-1.5">

              {/* Row 1: Name + badges */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-semibold text-slate-900 leading-tight">{shop.name}</h1>
                {shop.sequence_id && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <Hash size={9} /> Store #{shop.sequence_id}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${
                  shop.visible_online
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                  {shop.visible_online
                    ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Online</>
                    : <><WifiOff size={9} />Offline</>
                  }
                </span>
                {shop.business_infos?.gst_infos?.registered && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <BadgeCheck size={10} /> GST Registered
                  </span>
                )}
              </div>

              {/* Row 2: Tagline */}
              {shop.tagline && (
                <p className="text-[13px] text-slate-500 italic">"{shop.tagline}"</p>
              )}

              {/* Row 3: Description */}
              {shop.description && (
                <p className="text-[12px] text-slate-500 leading-relaxed max-w-xl">{shop.description}</p>
              )}


            </div>

            {/* ── Right: QR + Followers ── */}
            <div className="flex items-center gap-2 shrink-0 self-start mt-1">
              <button
                onClick={() => setShowQR(true)}
                title="View Store QR Code"
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <QrCode size={15} className="text-blue-500 group-hover:text-blue-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">QR Code</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
                <Users size={15} className="text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-400 leading-none mb-0.5">Followers</p>
                  <p className="text-sm font-semibold text-slate-800 leading-none">1.2K</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Quick info strips: Hours + Delivery ── */}
          <div className="flex flex-wrap gap-3 mt-1 pt-3 border-t border-slate-100">


            {/* Announcement count strip */}
            {shop.announcements?.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <Megaphone size={12} className="text-blue-400" />
                <span className="text-[11px] text-slate-500">
                  <span className="font-semibold text-blue-600">{shop.announcements.length}</span> active announcement{shop.announcements.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── TAB BAR ──────────────────────────────────────────── */}
        <div id="digital-store-tabs" className="px-6 flex items-center gap-0 border-t border-slate-100">
          {TAB_CONFIG.map(({ tab, icon: Icon }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
              >
                <Icon size={14} strokeWidth={2} />
                {tab}
                {/* badge for announcements */}
                {tab === "Announcements" && (shop.announcements?.length ?? 0) > 0 && (
                  <span className="ml-0.5 text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                    {shop.announcements.length}
                  </span>
                )}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN CONTENT ──────────────────────────────────────── */}
      <div className="px-6 pt-5">
        <div key={activeTab} style={{ animation: "fadeIn 0.15s ease" }}>
          {activeTab === "Announcements" && <Promotions />}
          {activeTab === "Products"      && <ProductDashboard />}
          {activeTab === "Settings"      && <StoreSettingsLayout shop={shop} />}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
};

export default DigitalMain;
