import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Plus,
  ArrowRight,
  Loader2,
  Building2,
  MapPin,
  Search,
  LogOut,
  ShoppingBag,
  Sparkles,
  Tag,
  CheckCircle2
} from "lucide-react";
import { setShopId } from "@/services/endpoints";
import { fetchMyShops } from "@/services/api/shopHelpers";
import { useToast } from "@/context/ToastContext";

interface ShopItem {
  id: string;
  _id?: string;
  name: string;
  categories?: string[];
  logo_url?: string;
  description?: string;
  city?: string;
  state?: string;
  address?: string;
  visible_online?: boolean;
  is_digital_store_configured?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  groceries: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  clothing: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  electronics: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  books: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  default: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" }
};

const getCategoryStyle = (cat: string) => {
  const key = cat.toLowerCase();
  for (const k in CATEGORY_COLORS) {
    if (key.includes(k)) return CATEGORY_COLORS[k];
  }
  return CATEGORY_COLORS.default;
};

// Store Awning Themes
const AWNING_THEMES = [
  { gradient: "from-blue-600 via-blue-700 to-indigo-800" },
  { gradient: "from-indigo-600 via-blue-600 to-blue-800" },
  { gradient: "from-blue-700 via-indigo-700 to-blue-900" }
];

const ShopSelect = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const userEmail = localStorage.getItem("user_email") || "";
  const userName = localStorage.getItem("user_name") || userEmail.split("@")[0] || "Retailer";

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const list = await fetchMyShops();
        const normalized = (list || []).map((s: any) => ({
          ...s,
          id: s.id || s._id || String(s.shop_id || "")
        }));
        setShops(normalized);
      } catch (e) {
        console.error("Failed to fetch shops:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const handleSelectShop = async (shop: ShopItem) => {
    const targetId = shop.id || shop._id;
    if (!targetId) return;

    setSelecting(targetId);
    try {
      setShopId(targetId);
      localStorage.setItem("shop_id", targetId);
      localStorage.setItem("selected_shop_name", shop.name);
      showToast(`Entering ${shop.name}…`, "success");
      await new Promise((r) => setTimeout(r, 200));
      navigate("/");
    } catch (err: any) {
      console.error("Failed to select shop:", err);
      showToast(err.message || "Failed to switch shop", "error");
    } finally {
      setSelecting(null);
    }
  };

  const handleCreateShop = () => {
    navigate("/create-shop");
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
  };

  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return shops;
    const q = searchQuery.toLowerCase();
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.categories && s.categories.some((c) => c.toLowerCase().includes(q))) ||
        (s.city && s.city.toLowerCase().includes(q))
    );
  }, [shops, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-2.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-md shadow-blue-600/30 animate-pulse">
          <Store className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>Opening your retail storefronts…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-auto w-full bg-slate-50 text-slate-900 font-sans flex flex-col overflow-y-auto selection:bg-blue-500/20">
      {/* =========================================================================
          TOP NAVIGATION BAR (COMPACT)
          ========================================================================= */}
      <header className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-black text-xs shadow-xs">
            ★
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-slate-900 leading-none block">
              RetailerPro
            </span>
            <span className="text-[8.5px] font-extrabold tracking-widest text-slate-400 uppercase leading-none block mt-0.5">
              STORE WORKSPACE HUB
            </span>
          </div>
        </div>

        {/* User Account / Sign Out */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11.5px] font-bold text-slate-800 capitalize leading-tight">
              {userName}
            </span>
            <span className="text-[10px] text-slate-400 leading-tight">
              {userEmail || "Retailer Account"}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/70 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Sign out"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN STOREFRONT SHOWCASE HERO & COMPACT 3-COLUMN GRID
          ========================================================================= */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 pb-16 space-y-5">
        {/* Hero Header (Compact) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-slate-200/80 pb-3.5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-[10px] font-extrabold tracking-wider uppercase">
              <Building2 size={11} />
              <span>Select Active Storefront</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Your Retail Stores & Outlets
            </h1>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Choose a storefront branch to enter your live counter POS billing, inventory records, and digital orders.
            </p>
          </div>

          {/* Search bar & Add Store CTA */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search storefronts…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
              />
            </div>

            <button
              onClick={handleCreateShop}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Store</span>
            </button>
          </div>
        </div>

        {/* 3-COLUMN COMPACT STOREFRONT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredShops.map((shop, idx) => {
            const isCurrent = selecting === shop.id;
            const theme = AWNING_THEMES[idx % AWNING_THEMES.length];
            const initials = shop.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "S";

            return (
              <div
                key={shop.id || idx}
                onClick={() => !selecting && handleSelectShop(shop)}
                className={`group relative bg-white border rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isCurrent
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 scale-[0.99]"
                    : "border-slate-200 hover:border-blue-400 hover:-translate-y-0.5"
                }`}
              >
                {/* ─── STOREFRONT ROOF CANOPY / AWNING (COMPACT) ─── */}
                <div className={`relative bg-gradient-to-r ${theme.gradient} pt-2.5 pb-2 px-3.5 text-white overflow-hidden`}>
                  {/* Striped pattern */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: "repeating-linear-gradient(45deg, #fff, #fff 10px, transparent 10px, transparent 20px)"
                    }}
                  />

                  {/* Top highlight */}
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-white/20" />

                  {/* Awning Content */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-white">
                        <Store size={12} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                        Outlet #{idx + 1}
                      </span>
                    </div>

                    {/* Open badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-300/40 text-[9.5px] font-bold text-emerald-200">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Open</span>
                    </span>
                  </div>

                  {/* Scalloped Awning Valance */}
                  <svg
                    className="absolute -bottom-0.5 left-0 right-0 w-full h-1.5 text-white fill-current"
                    preserveAspectRatio="none"
                    viewBox="0 0 120 6"
                  >
                    <path d="M0,0 Q10,6 20,0 Q30,6 40,0 Q50,6 60,0 Q70,6 80,0 Q90,6 100,0 Q110,6 120,0 L120,6 L0,6 Z" />
                  </svg>
                </div>

                {/* ─── STORE SIGNBOARD & BODY (COMPACT) ─── */}
                <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Store Monogram & Title */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 overflow-hidden border border-white -mt-1.5 group-hover:scale-105 transition-transform">
                        {shop.logo_url ? (
                          <img
                            src={shop.logo_url}
                            alt={shop.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {shop.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <MapPin size={11} className="text-blue-500 shrink-0" />
                          <span className="truncate">
                            {shop.city || shop.state || "Main Store Location"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Department / Category Tags */}
                    {shop.categories && shop.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {shop.categories.slice(0, 3).map((cat, i) => {
                          const style = getCategoryStyle(cat);
                          return (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-0.5 px-2 py-0.2 rounded-md text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
                            >
                              <Tag size={8.5} />
                              <span className="capitalize">{cat}</span>
                            </span>
                          );
                        })}
                        {shop.categories.length > 3 && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            +{shop.categories.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {shop.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {shop.description}
                      </p>
                    )}
                  </div>

                  {/* Store Counter & POS Features */}
                  <div className="pt-2.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1 text-slate-700 font-semibold">
                        <ShoppingBag size={12} className="text-blue-600" />
                        <span>Counter POS Ready</span>
                      </div>
                      <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCircle2 size={11} /> Ready
                      </span>
                    </div>

                    {/* "Enter Storefront" Button */}
                    <div className="w-full py-1.5 px-3 rounded-lg bg-slate-50 group-hover:bg-blue-600 text-slate-700 group-hover:text-white font-semibold text-xs flex items-center justify-between transition-all duration-150">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 mx-auto text-blue-600 group-hover:text-white">
                          <Loader2 size={12} className="animate-spin" />
                          <span>Entering Store…</span>
                        </span>
                      ) : (
                        <>
                          <span className="flex items-center gap-1">
                            <Store size={12} />
                            <span>Enter Storefront</span>
                          </span>
                          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ─── "OPEN NEW STORE" CARD (CLEAN WITHOUT NEW BRANCH BADGE) ─── */}
          <div
            onClick={handleCreateShop}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white/70 hover:bg-blue-50/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-200 group min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-blue-800 group-hover:text-white transition-all shadow-2xs">
              <Plus size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                Open a New Store
              </h3>
              <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
                Add another retail outlet, set up catalog, thermal billing, and digital orders.
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-blue-300 text-xs font-bold text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
              + Launch Storefront
            </span>
          </div>
        </div>

        {/* Empty Search State */}
        {filteredShops.length === 0 && shops.length > 0 && (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-2 max-w-sm mx-auto">
            <Store className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No matching storefronts found</h3>
            <p className="text-xs text-slate-500">
              Try searching with another store name or category keyword.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Helper Footer Note */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            <span>You can switch between storefront branches anytime from your top navigation menu.</span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ShopSelect;
