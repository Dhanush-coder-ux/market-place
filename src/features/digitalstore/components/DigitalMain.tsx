import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Megaphone, Package, Settings2, AlertCircle,
  PowerOff, QrCode, X, Download, ExternalLink,
  Copy, Check, Edit3, Store, Users, ChevronDown,
  Plus,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { QRCodeSVG } from "qrcode.react";
import { shopApi } from "@/services/api/shop";
import { inventoryApi } from "@/services/api/inventory";
import { SHOP_ID, setShopId } from "@/services/endpoints";
import { fetchMyShops } from "@/services/api/shopHelpers";
import ProductDashboard from "../pages/StoreProductManagement";
import Announcements from "../pages/Announcement";
import { StoreSettingsLayout } from "./StoreSettingsLayout";

type TabType = "Announcements" | "Products" | "Settings";

// ─── API response types ─────────────────────────────────────────────────────
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

// ─── Skeletons ──────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className ?? ""}`} />
);

const HeaderSkeleton = () => (
  <div className="bg-white border-b border-slate-200">
    <div className="h-56 sm:h-64 lg:h-72 bg-slate-200 animate-pulse" />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
      </div>
    </div>
  </div>
);

// ─── QR Modal ───────────────────────────────────────────────────────────────
function QRModal({ shop, onClose }: { shop: ShopData; onClose: () => void }) {
  const storeUrl =
    shop.additional_infos?.website || `${window.location.origin}/store/${shop.id}`;

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
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-[#286038]" />
            <span className="text-sm font-semibold text-slate-800">Store QR Code</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-6 flex flex-col items-center gap-4">
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

          <div className="text-center w-full">
            <p className="text-sm font-semibold text-slate-800">{shop.name}</p>
            {shop.address?.full_address && (
              <p className="text-[11px] text-slate-400 mt-0.5">{shop.address.full_address}</p>
            )}
            <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-left">
              <span className="text-[11px] text-slate-600 font-mono truncate flex-1" title={storeUrl}>
                {storeUrl}
              </span>
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

// ─── Switch Shop Modal ───────────────────────────────────────────────────────
function SwitchShopModal({
  currentShopId,
  onClose,
}: {
  currentShopId: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyShops()
      .then((list) => {
        setShops(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("Failed to fetch shops:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSelectShop = (targetShop: any) => {
    if (targetShop.id === currentShopId) {
      onClose();
      return;
    }
    localStorage.setItem("shop_id", targetShop.id);
    localStorage.setItem("shop_name", targetShop.name);
    if (targetShop.logo_url) {
      localStorage.setItem("shop_logo", targetShop.logo_url);
    } else {
      localStorage.removeItem("shop_logo");
    }
    setShopId(targetShop.id);
    onClose();
    window.location.reload();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#286038] border border-emerald-100 flex items-center justify-center font-bold shrink-0">
              <Store size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Switch Store</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Select a store to manage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal List */}
        <div className="p-4 max-h-[360px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No other stores found for your account.
            </div>
          ) : (
            shops.map((s: any) => {
              const isCurrent = s.id === currentShopId;
              const initial = (s.name?.charAt(0) || "S").toUpperCase();
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectShop(s)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20"
                      : "bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center text-[#286038] font-bold text-sm">
                      {s.logo_url ? (
                        <img src={s.logo_url} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {s.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {s.address?.full_address || s.tagline || "Store"}
                      </p>
                    </div>
                  </div>

                  {isCurrent && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check size={13} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/create-shop");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#286038] hover:text-[#1e4a2b] transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Create New Store</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: Digital Store Page
// ═════════════════════════════════════════════════════════════════════════════
const DigitalMain = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Tabs state
  const [activeTab, setActiveTab] = useState<TabType>("Announcements");

  // Shop data state
  const [shop, setShop] = useState<ShopData | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [announcementsCount, setAnnouncementsCount] = useState<number>(0);
  const [fallbackImg, setFallbackImg] = useState<string | null>(null);
  const [copiedStoreUrl, setCopiedStoreUrl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Modals state
  const [showQR, setShowQR] = useState(false);
  const [showSwitchShop, setShowSwitchShop] = useState(false);
  const [showTurnOffConfirm, setShowTurnOffConfirm] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  const handleCopyStoreUrl = () => {
    const storeUrl =
      shop?.additional_infos?.website || `${window.location.origin}/store/${shop?.id || SHOP_ID}`;
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
          if (Array.isArray(data.announcements)) {
            setAnnouncementsCount(data.announcements.length);
          }

          if (productsRes.status === "fulfilled") {
            const prodsData = productsRes.value?.data ?? productsRes.value ?? [];
            const prodsList = Array.isArray(prodsData)
              ? prodsData
              : prodsData.inventories || prodsData.items || [];
            setProductsCount(prodsList.length);
            const withImg = prodsList.find(
              (p: any) =>
                p.image_url || p.image || p.datas?.image_url || p.datas?.image
            );
            if (withImg)
              setFallbackImg(
                withImg.image_url ||
                  withImg.image ||
                  withImg.datas?.image_url ||
                  withImg.datas?.image
              );
          }

          if (followersRes.status === "fulfilled") {
            const rawFollowers =
              followersRes.value?.data ??
              (Array.isArray(followersRes.value) ? followersRes.value : []);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <HeaderSkeleton />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
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
            className="w-full py-3 bg-[#286038] text-white text-[14px] font-bold rounded-xl hover:bg-[#1e4a2b] shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
          >
            Create digital store profile
          </button>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Failed to load store</h3>
          <p className="text-sm text-slate-500 mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-[#286038] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4a2b] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const initials = shop.name?.charAt(0)?.toUpperCase() ?? "S";

  return (
    <div
      className="h-full flex flex-col min-h-0 overflow-hidden bg-slate-50/60"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Modals ── */}
      {showQR && <QRModal shop={shop} onClose={() => setShowQR(false)} />}
      {showSwitchShop && (
        <SwitchShopModal
          currentShopId={shop.id}
          onClose={() => setShowSwitchShop(false)}
        />
      )}

      {/* ── Fixed Top Section Container (Banner + Tabs always visible) ── */}
      <header className="shrink-0 z-20 shadow-xs">

      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO / BANNER HEADER (Matching Wireframe Image 1)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-slate-900 border-b border-slate-200/90 shadow-xs">
        
        {/* Background Shop Banner with Blur Effect */}
        {shop.banner_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-md scale-105 opacity-60 transition-transform duration-700"
            style={{ backgroundImage: `url(${shop.banner_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#122e1b] via-[#1b4328] to-[#0d2214]" />
        )}

        {/* Dark High-Contrast Backdrop Overlay for Sharp Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/75 to-slate-950/90 backdrop-blur-md" />

        {/* Foreground Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">

            {/* Left side: Circular Shop Logo + Details */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 min-w-0">
              
              {/* Circular Logo with border & shadow */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 sm:border-4 border-white/95 shadow-2xl bg-white overflow-hidden flex items-center justify-center">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                  ) : fallbackImg ? (
                    <img
                      src={fallbackImg}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 text-[#286038] flex items-center justify-center text-2xl font-black">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Online Indicator Badge */}
                <span
                  className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    shop.visible_online ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                  title={shop.visible_online ? "Live Online" : "Offline"}
                />
              </div>

              {/* Text Info */}
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                    {shop.name}
                  </h1>

                  {/* Online/Offline status pill toggle */}
                  <button
                    type="button"
                    onClick={handleToggleStoreVisibility}
                    disabled={updatingVisibility}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${
                      shop.visible_online
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30"
                        : "bg-white/10 text-slate-300 border-white/20 hover:bg-white/20"
                    }`}
                    title="Click to toggle store visibility"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        shop.visible_online ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    <span>{shop.visible_online ? "Live Online" : "Store Offline"}</span>
                  </button>
                </div>

                {/* Followers count */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-300 font-semibold">
                  <Users size={14} className="text-emerald-400 shrink-0" />
                  <span>
                    {followersCount} {followersCount === 1 ? "follower" : "followers"}
                  </span>
                  {shop.address?.full_address && (
                    <>
                      <span className="text-white/40">•</span>
                      <span className="text-white/75 truncate text-xs font-normal">
                        {shop.address.full_address}
                      </span>
                    </>
                  )}
                </div>

                {/* Tagline / Description */}
                <p className="text-xs sm:text-sm text-slate-200/90 max-w-xl font-normal leading-relaxed line-clamp-2">
                  {shop.description ||
                    shop.tagline ||
                    "Welcome to our digital storefront. Manage announcements, product catalog, and operational store settings."}
                </p>
              </div>
            </div>

            {/* Right side: Styled Action Buttons */}
            <div className="flex flex-wrap sm:flex-col lg:flex-row items-stretch sm:items-end lg:items-center gap-2.5 shrink-0">
              
              {/* 1. "Edit Store" button */}
              <button
                type="button"
                onClick={() => navigate("/setup-digital-store?mode=edit")}
                className="h-10 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-md text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Edit digital store profile"
              >
                <Edit3 size={15} />
                <span>Edit Store</span>
              </button>

              {/* 2. "Switch Shop" button */}
              <button
                type="button"
                onClick={() => setShowSwitchShop(true)}
                className="h-10 px-4 rounded-xl bg-[#286038] hover:bg-[#1e4a2b] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
                title="Switch active store"
              >
                <Store size={15} />
                <span>Switch Shop</span>
                <ChevronDown size={14} className="opacity-80" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. NAVIGATION TABS (Directly Underneath the Hero Header)
      ═══════════════════════════════════════════════════════════════════════ */}
      <nav className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Tabs List */}
            <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
              
              {/* 1. Announcements Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("Announcements")}
                className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "Announcements"
                    ? "border-[#286038] text-[#286038]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Megaphone size={16} />
                <span>Announcements</span>
                {announcementsCount > 0 && (
                  <span className="text-[11px] px-2 py-0.2 rounded-full bg-emerald-100 text-[#286038] font-mono font-bold">
                    {announcementsCount}
                  </span>
                )}
              </button>

              {/* 2. Products Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("Products")}
                className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "Products"
                    ? "border-[#286038] text-[#286038]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Package size={16} />
                <span>Products</span>
                {productsCount > 0 && (
                  <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono font-bold">
                    {productsCount}
                  </span>
                )}
              </button>

              {/* 3. Settings Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("Settings")}
                className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "Settings"
                    ? "border-[#286038] text-[#286038]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Settings2 size={16} />
                <span>Settings</span>
              </button>
            </div>

            {/* Quick Actions (Store QR, Copy Link, Preview) */}
            <div className="hidden sm:flex items-center gap-2 py-2">
              <button
                type="button"
                onClick={() => setShowQR(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#286038] hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                title="View Store QR Code"
              >
                <QrCode size={13} className="text-slate-500" />
                <span>Store QR</span>
              </button>

              <button
                type="button"
                onClick={handleCopyStoreUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#286038] hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                title="Copy Store URL"
              >
                {copiedStoreUrl ? (
                  <Check size={13} className="text-emerald-600" />
                ) : (
                  <Copy size={13} className="text-slate-500" />
                )}
                <span>{copiedStoreUrl ? "Copied" : "Copy Link"}</span>
              </button>

              <a
                href={
                  shop.additional_infos?.website || `${window.location.origin}/store/${shop.id}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#286038] hover:bg-[#1e4a2b] shadow-xs transition-colors"
                title="Open customer storefront in new tab"
              >
                <span>Preview Store</span>
                <ExternalLink size={12} />
              </a>
            </div>

          </div>
        </div>
      </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. SCROLLABLE ACTIVE TAB CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-28">
        
        {/* Tab 1: Announcements (Two-column layout matching Wireframe Image 2) */}
        {activeTab === "Announcements" && (
          <div className="animate-in fade-in duration-200">
            <Announcements
              onCountChange={(total) => {
                setAnnouncementsCount(total);
              }}
            />
          </div>
        )}

        {/* Tab 2: Products (StoreProductManagement) */}
        {activeTab === "Products" && (
          <div className="animate-in fade-in duration-200">
            <ProductDashboard />
          </div>
        )}

        {/* Tab 3: Settings (StoreSettingsLayout) */}
        {activeTab === "Settings" && (
          <div className="animate-in fade-in duration-200">
            <StoreSettingsLayout shop={shop} hideInternalNav={false} />
          </div>
        )}
        </div>
      </main>

      {/* ── Fixed Bottom Action Bar Section (Compatible with Action Portal) ── */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-8 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-20 flex items-center justify-between gap-3 min-h-[56px]">
        <div id="digital-store-bottom-status" className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs text-slate-400 font-medium">Digital Store Controls</span>
        </div>
        <div id="digital-store-bottom-actions" className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto" />
      </footer>

      {/* ── Turn Off Store Confirmation Modal ── */}
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
    </div>
  );
};

export default DigitalMain;
