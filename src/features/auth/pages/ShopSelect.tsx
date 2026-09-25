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
  electronics: { bg: "bg-blue-50", text: "text-blue-500", border: "border-blue-200" },
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
        <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 animate-pulse">
          <Store className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span>Opening your retail storefronts…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 font-sans flex flex-col overflow-y-auto selection:bg-blue-600/20">
      {/* =========================================================================
          TOP NAVIGATION BAR (COMPACT & STICKY)
          ========================================================================= */}
      <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
            ★
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-slate-900 leading-none block">
              inventQ
            </span>
            <span className="text-[8.5px] font-extrabold tracking-widest text-slate-400 uppercase leading-none block mt-0.5">
              STORE WORKSPACE HUB
            </span>
          </div>
        </div>

        {/* User Account / Sign Out */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 capitalize leading-tight">
              {userName}
            </span>
            <span className="text-[10.5px] text-slate-400 leading-tight">
              {userEmail || "inventQ Account"}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Sign out"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN STOREFRONT SHOWCASE & 3-COLUMN GRID
          ========================================================================= */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-20 space-y-6">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 text-blue-600 text-[10px] font-bold tracking-wider uppercase">
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
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            <div className="relative flex-1 md:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search storefronts…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 shadow-2xs transition-all"
              />
            </div>

            <button
              onClick={handleCreateShop}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Store</span>
            </button>
          </div>
        </div>

        {/* 3-COLUMN STOREFRONT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShops.map((shop, idx) => {
            const isCurrent = selecting === shop.id;
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
                className={`group relative bg-white border rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isCurrent
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10 scale-[0.99]"
                    : "border-slate-200 hover:border-blue-600 hover:-translate-y-0.5"
                }`}
              >
                {/* ─── CLEAN MUTED BLUE HEADER STRIP ─── */}
                <div className="bg-blue-500 px-3.5 py-2.5 flex items-center justify-between text-white border-b border-blue-500">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-blue-200">
                      <Store size={12} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Outlet #{idx + 1}
                    </span>
                  </div>

                  {/* Active status badge */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[9.5px] font-semibold text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active</span>
                  </span>
                </div>

                {/* ─── STORE SIGNBOARD & BODY ─── */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Store Monogram & Title */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform">
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
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {shop.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <MapPin size={12} className="text-blue-500 shrink-0" />
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
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
                            >
                              <Tag size={9} />
                              <span className="capitalize">{cat}</span>
                            </span>
                          );
                        })}
                        {shop.categories.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            +{shop.categories.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {shop.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {shop.description}
                      </p>
                    )}
                  </div>

                  {/* Store Counter & POS Features */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <ShoppingBag size={13} className="text-blue-500" />
                        <span>Counter POS Ready</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Ready
                      </span>
                    </div>

                    {/* "Enter Storefront" Button */}
                    <div className="w-full py-2 px-3.5 rounded-lg bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white font-semibold text-xs flex items-center justify-between transition-all duration-150">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 mx-auto text-blue-500 group-hover:text-white">
                          <Loader2 size={13} className="animate-spin" />
                          <span>Entering Store…</span>
                        </span>
                      ) : (
                        <>
                          <span className="flex items-center gap-1.5">
                            <Store size={13} />
                            <span>Enter Storefront</span>
                          </span>
                          <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ─── "OPEN NEW STORE" CARD ─── */}
          <div
            onClick={handleCreateShop}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/20 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3.5 cursor-pointer transition-all duration-200 group min-h-[230px]"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-500 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
              <Plus size={22} />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                Open a New Store
              </h3>
              <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
                Add another retail outlet, set up catalog, thermal billing, and digital orders.
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 group-hover:border-blue-400 text-xs font-bold text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
              + Launch Storefront
            </span>
          </div>
        </div>

        {/* Empty Search State */}
        {filteredShops.length === 0 && shops.length > 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-6 space-y-2.5 max-w-sm mx-auto">
            <Store className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No matching storefronts found</h3>
            <p className="text-xs text-slate-500">
              Try searching with another store name or category keyword.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Helper Footer Note */}
        <div className="pt-2 text-center">
          <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" />
            <span>You can switch between storefront branches anytime from your top navigation menu.</span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ShopSelect;
