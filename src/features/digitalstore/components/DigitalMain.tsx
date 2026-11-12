import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Megaphone, Package, Settings2, AlertCircle,
  PowerOff,
  Edit3, QrCode, Users, X, Download, ExternalLink,
  BadgeCheck,
  MapPin,
  Tag,
  Store,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
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
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("Announcements");
  const [shop, setShop]           = useState<ShopData | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [fallbackImg, setFallbackImg] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showQR, setShowQR]       = useState(false);
  const [showTurnOffConfirm, setShowTurnOffConfirm] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

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
            const prods = productsRes.value?.data ?? productsRes.value ?? [];
            const withImg = prods.find((p: any) => p.image_url || p.image || p.datas?.image_url || p.datas?.image);
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
    <div className="min-h-screen bg-slate-50 pb-16" style={{ fontFamily: "Inter, sans-serif" }}>

      {showQR && <QRModal shop={shop} onClose={() => setShowQR(false)} />}

      {/* ─── HEADER ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">

        {/* Banner */}
        <div className="relative h-64 sm:h-72 lg:h-80 w-full overflow-hidden bg-slate-900">
          {shop.banner_url ? (
            <>
              <img src={shop.banner_url} alt="Store banner" className="w-full h-full object-cover object-center" />
              {/* Bottom gradient scrim for smooth visual transition */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent" />
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-950/30 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full relative overflow-hidden bg-gradient-to-r from-emerald-50/90 via-[#EAF4E6] to-[#DCEDD9]">
              {/* Ambient radial glow highlights */}
              <div className="absolute -top-24 -left-20 w-96 h-96 bg-emerald-200/50 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 right-10 w-96 h-96 bg-[#8FBC8F]/30 rounded-full blur-3xl pointer-events-none" />
              {/* Subtle geometric dot pattern */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: "radial-gradient(#286038 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>
          )}

          {/* Banner Floating Top Badges (Aligned to max-w-7xl container) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-start justify-between pt-5 sm:pt-6 relative z-10">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-md text-[#286038] border border-white/60 shadow-sm transition-all">
              <Store size={13} className="text-[#286038]" />
              <span>Digital Storefront</span>
            </span>

            <a
              href={shop.additional_infos?.website || `${window.location.origin}/store/${shop.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/95 hover:bg-white backdrop-blur-md text-slate-800 hover:text-[#286038] border border-white/60 shadow-md transition-all cursor-pointer"
              title="Preview Public Storefront"
            >
              <ExternalLink size={13} />
              <span>View Public Store</span>
            </a>
          </div>
        </div>

        {/* ── Profile Header Row (Spacious & Aligned) ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 pt-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">

            {/* Left: Avatar + Store Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 min-w-0 flex-1">

              {/* Store Avatar - Only the avatar has negative margin to overlap banner */}
              <div className="-mt-14 sm:-mt-18 lg:-mt-20 relative shrink-0 z-10">
                <div className="w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
                  {shop.logo_url ? (
                    <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                  ) : fallbackImg ? (
                    <img src={fallbackImg} alt={shop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#EAF4E6] border border-[#D5E8D0] flex items-center justify-center text-[#286038]">
                      <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">{initials}</span>
                    </div>
                  )}
                </div>

                {/* Online status indicator on avatar */}
                <div
                  className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-lg"
                  title={shop.visible_online ? "Storefront is Online" : "Storefront is Offline"}
                >
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full ${
                      shop.visible_online ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  >
                    {shop.visible_online ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-white/70" />
                    )}
                  </span>
                </div>
              </div>

              {/* Identity & Details */}
              <div className="flex-1 min-w-0 space-y-2.5 pt-2 sm:pt-4">
                
                {/* Title line with badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {shop.name}
                  </h1>

                  {/* GST Registered Badge */}
                  {shop.business_infos?.gst_infos?.registered && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-[#1e4a2b] border border-emerald-200/90 shadow-2xs"
                      title={shop.business_infos?.gst_infos?.number ? `GSTIN: ${shop.business_infos.gst_infos.number}` : "GST Registered Merchant"}
                    >
                      <BadgeCheck size={14} className="text-[#286038]" />
                      <span>GST Registered</span>
                    </span>
                  )}

                  {/* Status badge pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                      shop.visible_online
                        ? "bg-emerald-50 text-[#1e4a2b] border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${shop.visible_online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    <span>{shop.visible_online ? "Live Online" : "Offline"}</span>
                  </span>
                </div>

                {/* Tagline */}
                {shop.tagline && (
                  <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                    {shop.tagline}
                  </p>
                )}

                {/* Description */}
                {shop.description && (
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl line-clamp-2">
                    {shop.description}
                  </p>
                )}

                {/* Meta details strip: Followers, Categories, Address */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs sm:text-sm text-slate-500 pt-1.5">
                  {/* Followers */}
                  <div className="inline-flex items-center gap-2 font-medium text-slate-700">
                    <Users size={15} className="text-slate-400" />
                    <span>
                      <strong className="text-slate-900 font-bold">{followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}K` : followersCount}</strong> {followersCount === 1 ? "follower" : "followers"}
                    </span>
                  </div>

                  {/* Categories */}
                  {Array.isArray(shop.categories) && shop.categories.length > 0 && (
                    <div className="inline-flex items-center gap-2 text-slate-600">
                      <Tag size={14} className="text-slate-400" />
                      <span className="truncate max-w-xs" title={shop.categories.join(", ")}>
                        {shop.categories.slice(0, 3).join(", ")}{shop.categories.length > 3 ? ` +${shop.categories.length - 3}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Address */}
                  {shop.address?.full_address && (
                    <div className="inline-flex items-center gap-2 text-slate-600 truncate max-w-xs" title={shop.address.full_address}>
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{shop.address.full_address}</span>
                    </div>
                  )}

                  {/* Announcements counter */}
                  {shop.announcements?.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 text-[#1e4a2b] font-medium bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      <Megaphone size={13} className="text-[#286038]" />
                      <span>{shop.announcements.length} active {shop.announcements.length === 1 ? "announcement" : "announcements"}</span>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Right: Executive Action Bar */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 pt-4 lg:pt-0 lg:pb-1">
              
              {/* Online/Offline Toggle Switch Button */}
              <button
                type="button"
                onClick={handleToggleStoreVisibility}
                disabled={updatingVisibility}
                className={`inline-flex items-center gap-3 h-11 px-4.5 rounded-xl border text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                  shop.visible_online
                    ? "bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                }`}
                title={shop.visible_online ? "Storefront is Online. Click to turn off." : "Storefront is Offline. Click to turn on."}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${shop.visible_online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  <span className="font-semibold">{shop.visible_online ? "Online" : "Offline"}</span>
                </span>
                <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  shop.visible_online ? "bg-emerald-600" : "bg-slate-300"
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    shop.visible_online ? "translate-x-4.5" : "translate-x-0.5"
                  }`} />
                </span>
              </button>

              {/* QR Code */}
              <button
                onClick={() => setShowQR(true)}
                title="View Store QR Code"
                className="inline-flex items-center gap-2 h-11 px-4.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <QrCode size={15} className="text-slate-500" />
                <span>QR Code</span>
              </button>

              {/* Edit Store Button */}
              <button
                onClick={() => {
                  setActiveTab("Settings");
                  document.getElementById("digital-store-tabs")?.scrollIntoView({ behavior: "smooth" });
                }}
                title="Edit Store Profile & Settings"
                className="inline-flex items-center gap-2 h-11 px-5 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                style={{
                  backgroundColor: "#286038",
                  boxShadow: "0 2px 10px rgba(40, 96, 56, 0.25)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e4a2b")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#286038")}
              >
                <Edit3 size={14} />
                <span>Edit Store</span>
              </button>

            </div>

          </div>
        </div>

        {/* ─── TAB BAR ──────────────────────────────────────────── */}
        <div className="border-t border-slate-200/90 bg-white">
          <div id="digital-store-tabs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto">
            {TAB_CONFIG.map(({ tab, icon: Icon }) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex items-center gap-2.5 px-6 py-4.5 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive ? "text-[#286038]" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 rounded-t-lg"
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{tab}</span>
                  {/* badge for announcements */}
                  {tab === "Announcements" && (shop.announcements?.length ?? 0) > 0 && (
                    <span className={`ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-emerald-100 text-[#1e4a2b]" : "bg-slate-100 text-slate-600"
                    }`}>
                      {shop.announcements.length}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#286038] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div key={activeTab} style={{ animation: "fadeIn 0.15s ease" }}>
          {activeTab === "Announcements" && <Promotions />}
          {activeTab === "Products"      && <ProductDashboard />}
          {activeTab === "Settings"      && <StoreSettingsLayout shop={shop} />}
        </div>
      </div>

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
