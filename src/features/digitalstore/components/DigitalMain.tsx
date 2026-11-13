import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Megaphone, Package, Settings2, AlertCircle,
  PowerOff,
  QrCode, X, Download, ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { QRCodeSVG } from "qrcode.react";
import { shopApi } from "@/services/api/shop";
import { inventoryApi } from "@/services/api/inventory";
import { SHOP_ID } from "@/services/endpoints";
import ProductDashboard from "../pages/StoreProductManagement";
import Promotions from "../pages/Promotions";
import { StoreSettingsLayout, SettingSection, SETTING_SIDEBAR_ITEMS } from "./StoreSettingsLayout";
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
    <div className="h-64 sm:h-72 lg:h-80 bg-slate-200 animate-pulse" />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 pt-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 min-w-0 flex-1">
          <Skeleton className="w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-3xl border-4 border-white shadow-xl shrink-0 -mt-14 sm:-mt-18 lg:-mt-20" />
          <div className="space-y-3 pt-2 sm:pt-3 flex-1">
            <Skeleton className="h-9 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0">
          <Skeleton className="h-11 w-32 rounded-xl" />
          <Skeleton className="h-11 w-28 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>
    </div>
    <div className="border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-28 my-3 rounded-lg" />)}
      </div>
    </div>
  </div>
);

// ─── QR Popup ──────────────────────────────────────────────────────────────────
function QRModal({ shop, onClose }: { shop: ShopData; onClose: () => void }) {
  const storeUrl = shop.additional_infos?.website
    || `${window.location.origin}/store/${shop.id}`;

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[340px] overflow-hidden animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-[#286038]" />
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
            <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-left">
              <span className="text-[11px] text-slate-600 font-mono truncate flex-1" title={storeUrl}>{storeUrl}</span>
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Link in New Tab"
                className="text-[#286038] hover:text-[#1e4a2b] p-1 hover:bg-emerald-50 rounded shrink-0 transition-colors"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <button
              onClick={handleCopy}
              className={`flex-1 h-9 border rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                copied
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 h-9 bg-[#286038] hover:bg-[#1e4a2b] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Download size={13} /> Download
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Tab config ────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const DigitalMain = () => {
  const navigate  = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("Announcements");
  const [activeSettingSection, setActiveSettingSection] = useState<SettingSection>("details");
  const [shop, setShop]           = useState<ShopData | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [productsCount, setProductsCount]   = useState<number>(0);
  const [copiedStoreUrl, setCopiedStoreUrl] = useState(false);
  const [fallbackImg, setFallbackImg] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showQR, setShowQR]       = useState(false);
  const [showTurnOffConfirm, setShowTurnOffConfirm] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleCopyStoreUrl = () => {
    const storeUrl = shop?.additional_infos?.website || `${window.location.origin}/store/${shop?.id || SHOP_ID}`;
    navigator.clipboard.writeText(storeUrl);
    setCopiedStoreUrl(true);
    showToast("Store URL copied to clipboard", "success");
    setTimeout(() => setCopiedStoreUrl(false), 2000);
  };

  const handleToggleStoreVisibility = async () => {
    if (!shop) return;
    if (shop.visible_online) {
      setShowTurnOffConfirm(true);
    } else {
      try {
        setUpdatingVisibility(true);
        await shopApi.updateShop({ id: shop.id, visible_online: true });
        setShop({ ...shop, visible_online: true });
        showToast("Digital store is now online", "success");
      } catch (err: any) {
        showToast(err?.message || "Failed to turn on digital store", "error");
      } finally {
        setUpdatingVisibility(false);
      }
    }
  };

  const handleConfirmTurnOff = async () => {
    if (!shop) return;
    try {
      setUpdatingVisibility(true);
      await shopApi.updateShop({ id: shop.id, visible_online: false });
      showToast("Digital store turned off", "success");
      setShowTurnOffConfirm(false);
      setShop((prev) => (prev ? { ...prev, visible_online: false } : null));
    } catch (err: any) {
      showToast(err?.message || "Failed to turn off digital store", "error");
    } finally {
      setUpdatingVisibility(false);
    }
  };

  useEffect(() => {
    const activeShopId = localStorage.getItem("shop_id") || SHOP_ID;
    if (!activeShopId || activeShopId === "string") {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [shopRes, productsRes, followersRes] = await Promise.allSettled([
          shopApi.getShopById(activeShopId),
          inventoryApi.getInventoriesByShop(activeShopId, { limit: "50" }),
          shopApi.getShopFollowers(activeShopId),
        ]);

        if (shopRes.status === "fulfilled" && (shopRes.value?.data || shopRes.value)) {
          const data = shopRes.value?.data ?? shopRes.value;
          const isConfigured =
            data.can_show_digital_store_dashboard === true ||
            data.is_digital_store_configured === true ||
            data.has_operating_hours === true ||
            data.has_delivery_options === true ||
            (Array.isArray(data.operating_hours) && data.operating_hours.length > 0) ||
            (Array.isArray(data.delivery_options) && data.delivery_options.length > 0);

          if (!data.visible_online && !isConfigured) {
            setNeedsSetup(true);
            setLoading(false);
            return;
          }
          setShop(data);

          if (productsRes.status === "fulfilled") {
            const prodsData = productsRes.value?.data ?? productsRes.value ?? [];
            const prodsList = Array.isArray(prodsData) ? prodsData : (prodsData.inventories || prodsData.items || []);
            setProductsCount(prodsList.length);
            const withImg = prodsList.find((p: any) => p.image_url || p.image || p.datas?.image_url || p.datas?.image);
            if (withImg) setFallbackImg(withImg.image_url || withImg.image || withImg.datas?.image_url || withImg.datas?.image);
          }

          if (followersRes.status === "fulfilled") {
            const rawFollowers = followersRes.value?.data ?? (Array.isArray(followersRes.value) ? followersRes.value : []);
            setFollowersCount(Array.isArray(rawFollowers) ? rawFollowers.length : 0);
          }
        } else {
          setNeedsSetup(true);
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
  
  if (needsSetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
            <Settings2 size={28} className="text-blue-500" />
          </div>
          <h2 className="text-[20px] font-black text-slate-800 mb-2">Create your Digital Store</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            You haven't set up your digital store profile yet. Create one to start selling online and managing your catalog.
          </p>
          <button
            onClick={() => navigate("/setup-digital-store")}
            className="w-full py-3 bg-blue-600 text-white text-[14px] font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Create digital store profile
          </button>
        </div>
      </div>
    );
  }

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
    <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs animate-in fade-in duration-300" style={{ fontFamily: "Inter, sans-serif" }}>

      {showQR && <QRModal shop={shop} onClose={() => setShowQR(false)} />}

      {/* ── Left Secondary Navigation Sidebar (Digital Store Nav) ── */}
      <aside className={`w-full ${isSidebarOpen ? "md:w-64 lg:w-72" : "md:w-[68px]"} border-b md:border-b-0 md:border-r border-slate-200/80 bg-slate-50/70 flex flex-col shrink-0 transition-all duration-200 ease-in-out`}>
        
        {/* Store Profile Card Header in Sidebar */}
        <div className={`p-3 md:p-3.5 border-b border-slate-200/80 bg-white flex flex-col ${isSidebarOpen ? "" : "items-center"}`}>
          <div className={`flex items-center w-full ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Store Avatar / Logo */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shadow-xs">
                  {shop.logo_url ? (
                    <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                  ) : fallbackImg ? (
                    <img src={fallbackImg} alt={shop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#286038]">
                      <span className="text-sm font-semibold">{initials}</span>
                    </div>
                  )}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    shop.visible_online ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                  title={shop.visible_online ? "Live Online" : "Offline"}
                />
              </div>

              {isSidebarOpen && (
                <div className="min-w-0 flex-1">
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-800 truncate leading-snug" title={shop.name}>
                    {shop.name}
                  </h2>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium shrink-0 ${
                      shop.visible_online ? "text-emerald-700" : "text-slate-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${shop.visible_online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      {shop.visible_online ? "Live Online" : "Offline"}
                    </span>
                    {followersCount > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        • {followersCount} {followersCount === 1 ? "follower" : "followers"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            </button>
          </div>

          {/* Quick Action Pill Bar */}
          {isSidebarOpen && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 w-full">
              <button
                type="button"
                onClick={handleToggleStoreVisibility}
                disabled={updatingVisibility}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer border ${
                  shop.visible_online
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${shop.visible_online ? "bg-emerald-600" : "bg-slate-400"}`} />
                <span>{shop.visible_online ? "Store is Online" : "Store is Offline"}</span>
              </button>

              <a
                href={shop.additional_infos?.website || `${window.location.origin}/store/${shop.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors"
                title="View live storefront in new tab"
              >
                <span>Preview</span>
                <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>

        {/* Digital Store Nav Links (Middle Column) */}
        <div className="p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto no-scrollbar md:custom-scrollbar flex-1">
          
          {/* 1. Announcements */}
          <div className="relative group shrink-0 md:w-full">
            <button
              type="button"
              onClick={() => setActiveTab("Announcements")}
              className={`w-full flex items-center gap-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                isSidebarOpen ? "px-3 justify-between" : "px-0 md:justify-center"
              } ${
                activeTab === "Announcements"
                  ? "bg-white text-emerald-950 font-semibold shadow-xs border border-slate-200/90 ring-1 ring-emerald-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeTab === "Announcements" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                }`}>
                  <Megaphone size={15} />
                </div>
                {isSidebarOpen && (
                  <div className="min-w-0 hidden md:block">
                    <div className="text-xs font-semibold leading-tight text-slate-800">Announcements</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">Promos & broadcasts</div>
                  </div>
                )}
                <span className="text-xs font-medium md:hidden whitespace-nowrap px-1">Announcements</span>
              </div>
              {isSidebarOpen && (shop.announcements?.length ?? 0) > 0 && (
                <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full hidden md:inline-block ${
                  activeTab === "Announcements" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}>
                  {shop.announcements.length}
                </span>
              )}
            </button>

            {!isSidebarOpen && (
              <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 hidden md:group-hover:flex flex-col whitespace-nowrap bg-slate-900/95 text-white px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">Announcements</span>
                  {(shop.announcements?.length ?? 0) > 0 && (
                    <span className="text-[9.5px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
                      {shop.announcements.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-300 font-normal">Promos & broadcasts</span>
              </div>
            )}
          </div>

          {/* 2. Products */}
          <div className="relative group shrink-0 md:w-full">
            <button
              type="button"
              onClick={() => setActiveTab("Products")}
              className={`w-full flex items-center gap-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                isSidebarOpen ? "px-3 justify-between" : "px-0 md:justify-center"
              } ${
                activeTab === "Products"
                  ? "bg-white text-emerald-950 font-semibold shadow-xs border border-slate-200/90 ring-1 ring-emerald-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeTab === "Products" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                }`}>
                  <Package size={15} />
                </div>
                {isSidebarOpen && (
                  <div className="min-w-0 hidden md:block">
                    <div className="text-xs font-semibold leading-tight text-slate-800">Products</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">Digital catalog & sync</div>
                  </div>
                )}
                <span className="text-xs font-medium md:hidden whitespace-nowrap px-1">Products</span>
              </div>
              {isSidebarOpen && productsCount > 0 && (
                <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full hidden md:inline-block ${
                  activeTab === "Products" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}>
                  {productsCount}
                </span>
              )}
            </button>

            {!isSidebarOpen && (
              <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 hidden md:group-hover:flex flex-col whitespace-nowrap bg-slate-900/95 text-white px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">Products</span>
                  {productsCount > 0 && (
                    <span className="text-[9.5px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
                      {productsCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-300 font-normal">Digital catalog & sync</span>
              </div>
            )}
          </div>

          {/* 3. Settings */}
          <div className="pt-2">
            {isSidebarOpen && (
              <div className="px-3 pb-1.5 hidden md:flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                <Settings2 size={12} className="text-slate-400" />
                <span>Settings</span>
              </div>
            )}
            {!isSidebarOpen && <div className="border-t border-slate-200/60 my-1 hidden md:block" />}

            <div className="flex md:flex-col gap-1">
              {SETTING_SIDEBAR_ITEMS.map((item) => {
                const isCurrent = activeTab === "Settings" && activeSettingSection === item.id;
                const isDanger = item.id === "danger";
                const Icon = item.icon;
                return (
                  <div key={item.id} className="relative group shrink-0 md:w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("Settings");
                        setActiveSettingSection(item.id);
                      }}
                      className={`w-full flex items-center gap-2.5 py-1.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSidebarOpen ? "px-3" : "px-0 md:justify-center"
                      } ${
                        isCurrent
                          ? isDanger
                            ? "bg-rose-50 text-rose-700 font-semibold border border-rose-200 shadow-2xs"
                            : "bg-white text-emerald-950 font-semibold shadow-xs border border-slate-200/90 ring-1 ring-emerald-500/20"
                          : isDanger
                            ? "text-rose-500 hover:bg-rose-50/60 hover:text-rose-700 border border-transparent"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isCurrent
                            ? isDanger ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                            : isDanger ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      {isSidebarOpen && (
                        <div className="min-w-0 hidden md:block flex-1">
                          <div className="text-xs font-semibold leading-tight truncate text-slate-800">{item.label}</div>
                          <div className="text-[9.5px] text-slate-400 font-normal truncate mt-0.5">{item.description}</div>
                        </div>
                      )}
                      <span className="text-xs font-medium md:hidden whitespace-nowrap px-1">{item.label}</span>
                    </button>

                    {!isSidebarOpen && (
                      <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 hidden md:group-hover:flex flex-col whitespace-nowrap bg-slate-900/95 text-white px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        <span className={`text-xs font-semibold ${isDanger ? "text-rose-300" : "text-white"}`}>{item.label}</span>
                        <span className="text-[10px] text-slate-300 font-normal">{item.description}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Secondary Sidebar Footer */}
        <div className="p-2.5 border-t border-slate-200/80 bg-white/70 hidden md:flex items-center justify-between gap-1.5">
          {isSidebarOpen ? (
            <>
              <button
                type="button"
                onClick={() => setShowQR(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-medium text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                title="Store QR Code"
              >
                <QrCode size={13} className="text-slate-500" />
                <span>QR Code</span>
              </button>

              <button
                type="button"
                onClick={handleCopyStoreUrl}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-medium text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                title="Copy Store URL"
              >
                {copiedStoreUrl ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} className="text-slate-500" />}
                <span>{copiedStoreUrl ? "Copied" : "Copy Link"}</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 w-full">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setShowQR(true)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  <QrCode size={14} />
                </button>
                <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 hidden md:group-hover:flex whitespace-nowrap bg-slate-900/95 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 pointer-events-none">
                  Store QR Code
                </div>
              </div>

              <div className="relative group">
                <button
                  type="button"
                  onClick={handleCopyStoreUrl}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  {copiedStoreUrl ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
                <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 hidden md:group-hover:flex whitespace-nowrap bg-slate-900/95 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 pointer-events-none">
                  {copiedStoreUrl ? "Copied!" : "Copy Store Link"}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Right Content Area (Selected Nav Tab Content) ── */}
      <main className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
        
        {/* Header Strip */}
        <header className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
              {activeTab === "Announcements" && <Megaphone size={16} />}
              {activeTab === "Products" && <Package size={16} />}
              {activeTab === "Settings" && (
                (() => {
                  const currentItem = SETTING_SIDEBAR_ITEMS.find(s => s.id === activeSettingSection);
                  const Icon = currentItem?.icon || Settings2;
                  return <Icon size={16} />;
                })()
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
                {activeTab === "Announcements" && "Store Announcements"}
                {activeTab === "Products" && "Product Catalog & Sync"}
                {activeTab === "Settings" && (
                  SETTING_SIDEBAR_ITEMS.find(s => s.id === activeSettingSection)?.label || "Store Settings"
                )}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {activeTab === "Announcements" && "Manage broadcast banners and promotional messages for your digital storefront"}
                {activeTab === "Products" && "Control products visibility, online pricing, and categories for customer ordering"}
                {activeTab === "Settings" && (
                  SETTING_SIDEBAR_ITEMS.find(s => s.id === activeSettingSection)?.description || "Configure digital store preferences"
                )}
              </p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className={`flex-1 min-h-0 ${activeTab === "Products" ? "overflow-hidden p-3 sm:p-5 flex flex-col" : "overflow-y-auto p-4 sm:p-6 custom-scrollbar"}`}>
          <div
            key={`${activeTab}-${activeSettingSection}`}
            className={activeTab === "Products" ? "flex-1 min-h-0 flex flex-col h-full" : undefined}
            style={{ animation: "fadeIn 0.15s ease" }}
          >
            {activeTab === "Announcements" && <Promotions />}
            {activeTab === "Products" && <ProductDashboard />}
            {activeTab === "Settings" && (
              <StoreSettingsLayout
                shop={shop}
                activeSection={activeSettingSection}
                onSectionChange={setActiveSettingSection}
                hideInternalNav={true}
              />
            )}
          </div>
        </div>
      </main>

      {/* ── Confirmation Modal for Turning Off Digital Store ── */}
      {showTurnOffConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <PowerOff className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Turn Off Digital Store?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Take your online storefront offline</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Your digital store will be taken offline and hidden from customers. All your existing products, categories, delivery options, and operating hours will be preserved so you can turn it back on anytime.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTurnOffConfirm(false)}
                  disabled={updatingVisibility}
                  className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTurnOff}
                  disabled={updatingVisibility}
                  className="h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {updatingVisibility ? "Turning Off..." : "Turn Off Store"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
};

export default DigitalMain;
