import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Settings,
  Search,
  ArrowRight,
  Store,
  PlusCircle,
  LayoutDashboard,
  Package,
  UserPlus,
  Boxes,
  Receipt,
  History,
  Truck,
  RefreshCw,
  Plus,
  ShoppingCart,

  Settings2,
  Users,
  Printer,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { fetchMyShops } from "@/services/api/shopHelpers";
import { setShopId } from "@/services/endpoints";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Check, LogOut, Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { DesktopInstallModal } from "@/components/common/DesktopInstallModal";
import { useKeyboardShortcuts } from "@/context/KeyboardShortcutsContext";
import KeyboardKey from "@/components/common/KeyboardKey";

// -----------------------------
// Route Config
const SEARCHABLE_ROUTES = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Orders", path: "/orders", icon: ShoppingCart },
  { name: "Sales", path: "/sales", icon: Receipt },
  { name: "Products List", path: "/product/all", icon: Package },
  { name: "Add Products", path: "/product/add", icon: PlusCircle },
  { name: "Employee List", path: "/employee/all", icon: Users },
  { name: "Add Employee", path: "/employee/add", icon: UserPlus },
  { name: "Customers List", path: "/customers/all", icon: Users },
  { name: "Add Customer", path: "/customers/add", icon: UserPlus },
  { name: "Inventory", path: "/inventory", icon: Boxes },
  { name: "Stock Adjustment", path: "/stock-adjustment", icon: RefreshCw },
  { name: "Billing & Invoices", path: "/billing", icon: Printer },
  { name: "Purchase History", path: "/purchase-history", icon: History },
  { name: "Suppliers List", path: "/supplier/all", icon: Truck },
  { name: "Add Suppliers", path: "/supplier/add", icon: PlusCircle },
  { name: "Create Shop", path: "/create-shop", icon: Plus },
  { name: "Store Profile", path: "/profile", icon: Store },
  { name: "Settings", path: "/settings", icon: Settings2 },
];

// -----------------------------
// Navbar
// -----------------------------
export const Navbar = () => {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const { setCommandPaletteOpen } = useKeyboardShortcuts();

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // ── PWA Desktop/Mobile App Installation ─────────────────────────────────────
  const { isInstalled, promptInstall, isModalOpen, setIsModalOpen, isPromptReady } = usePWAInstall();

  // ── Shop selector state ──────────────────────────────────────────────────────
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [shops, setShops] = useState<Array<{ id: string; name: string; logo_url?: string; categories?: string[]; visible_online?: boolean }>>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [currentShopId, setCurrentShopId] = useState<string | null>(() => {
    const sid = localStorage.getItem("shop_id");
    return sid && sid !== "string" ? sid : null;
  });
  const cachedShopName = localStorage.getItem("shop_name") || "Shop A";
  const [selectedShop, setSelectedShop] = useState<{ name: string; initial: string; logo_url?: string }>({
    name: cachedShopName,
    initial: (cachedShopName.charAt(0) || "S").toUpperCase(),
  });
  const shopMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyShops()
      .then((list) => {
        setShops(list);
        const shopId = localStorage.getItem("shop_id");
        const shop = (shopId && shopId !== "string" ? list.find((s: any) => s.id === shopId) : null) ?? list[0];
        if (shop) {
          setCurrentShopId(shop.id);
          setShopId(shop.id);
          localStorage.setItem("shop_id", shop.id);
          setSelectedShop({ name: shop.name, initial: shop.name.charAt(0).toUpperCase(), logo_url: shop.logo_url });
          localStorage.setItem("shop_name", shop.name);
          if (shop.logo_url) {
            localStorage.setItem("shop_logo", shop.logo_url);
          } else {
            localStorage.removeItem("shop_logo");
          }
        }
      })
      .catch(() => setSelectedShop({ name: "My Shop", initial: "M" }))
      .finally(() => setShopsLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shopMenuRef.current && !shopMenuRef.current.contains(e.target as Node)) {
        setIsShopMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleShopSwitch = (shop: { id: string; name: string; logo_url?: string }) => {
    setCurrentShopId(shop.id);
    setShopId(shop.id);
    localStorage.setItem("shop_id", shop.id);
    localStorage.setItem("shop_name", shop.name);
    if (shop.logo_url) {
      localStorage.setItem("shop_logo", shop.logo_url);
    } else {
      localStorage.removeItem("shop_logo");
    }
    setIsShopMenuOpen(false);
    window.location.reload();
  };

  const handleSignOut = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("shop_id");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  // Real-time WebSocket Notifications from Context
  const { unreadCount, notifications, latestNotification, isIslandExpanded } = useNotifications();
  const lastNotification = latestNotification || notifications[0] || null;

  // Filter routes
  const filteredRoutes = SEARCHABLE_ROUTES.filter((route) =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleNavigate = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setIsMobileSearchOpen(false);
  };

  return (
    <>
      <div className="sticky top-0 z-40 w-full flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm min-h-14 pt-[env(safe-area-inset-top)]">

        {/* Shop Selector */}
        <div ref={shopMenuRef} className="relative z-50 min-w-0">
          <div
            className="flex items-center h-9 px-2 sm:px-2.5 gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors duration-150 max-w-[165px] sm:max-w-[240px]"
            onClick={() => setIsShopMenuOpen((v) => !v)}
          >
            {/* Shop avatar */}
            <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
              {selectedShop.logo_url ? (
                <img src={selectedShop.logo_url} alt="" className="w-full h-full object-cover" />
              ) : selectedShop.initial !== "S" ? (
                <span className="text-[12px] font-bold text-slate-700">{selectedShop.initial}</span>
              ) : (
                <Store size={12} className="text-slate-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-1">
              <div className="min-w-0 flex-1 flex flex-col">
                <span className="text-[12px] font-bold text-slate-700 truncate leading-tight">
                  {selectedShop.name}
                </span>
              </div>
              <ChevronDown
                size={13}
                strokeWidth={2}
                className={`text-slate-400 shrink-0 transition-transform duration-150 ${isShopMenuOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          <AnimatePresence>
            {isShopMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.13 }}
                className="absolute top-full left-0 mt-1.5 w-[235px] max-w-[calc(100vw-24px)] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
              >
                <div className="px-1.5 pt-1.5 pb-1">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-[10px] font-bold text-slate-400">My Shops</p>
                    <Link
                      to="/shop-select"
                      onClick={() => setIsShopMenuOpen(false)}
                      className="text-[10.5px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                    >
                      View Full <ArrowRight size={10} />
                    </Link>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {shopsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 size={15} className="animate-spin text-slate-400" />
                      </div>
                    ) : shops.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3">No shops found</p>
                    ) : (
                      shops.map((shop) => (
                        <button
                          key={shop.id}
                          onClick={() => handleShopSwitch(shop)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-100 ${
                            currentShopId === shop.id
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${
                            currentShopId === shop.id ? "bg-white border-blue-200 text-blue-600" : "bg-slate-100 border-slate-200 text-slate-500"
                          }`}>
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-semibold text-[12.5px] truncate">{shop.name}</span>
                            {shop.categories && shop.categories.length > 0 && (
                              <span className="text-[10px] text-slate-400 capitalize truncate">{shop.categories[0]}</span>
                            )}
                          </div>
                          {currentShopId === shop.id && <Check size={13} className="text-blue-500 shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 px-1.5 py-1.5 flex flex-col gap-0.5">
                  <Link
                    to="/shop-select"
                    onClick={() => setIsShopMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-[12.5px] font-semibold transition-colors"
                  >
                    <Store size={13} strokeWidth={2} className="text-slate-500" />
                    View Full (All Shops)
                  </Link>
                  <Link
                    to="/create-shop"
                    onClick={() => setIsShopMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-blue-600 hover:bg-blue-50 text-[12.5px] font-semibold transition-colors"
                  >
                    <PlusCircle size={13} strokeWidth={2} />
                    Create New Shop
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-500 hover:bg-red-50 text-[12.5px] font-semibold transition-colors"
                  >
                    <LogOut size={13} strokeWidth={2} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search & Command Palette trigger - Centered */}
        <div className="relative flex-1 flex items-center justify-center px-2 sm:px-4 hidden md:flex" ref={searchRef}>
          <div
            onClick={() => setCommandPaletteOpen(true)}
            className="relative group w-full max-w-[280px] lg:max-w-[340px] transition-all duration-200 ease-out cursor-pointer"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors z-10" />
            <div className="w-full pl-9 pr-2.5 py-1.5 bg-slate-100/70 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center justify-between transition-all shadow-xs select-none">
              <span>Search pages & hotkeys...</span>
              <KeyboardKey combo="ctrl+k" size="xs" />
            </div>
          </div>
        </div>

        {/* RIGHT - Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-slate-100/80 text-slate-600 active:scale-95 transition-all"
              title="Quick Navigation Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {!isInstalled && (
              <button
                type="button"
                onClick={promptInstall}
                style={{
                  background: `linear-gradient(135deg, var(--t-primary, #286038), var(--t-sidebar-via, #103020))`,
                  boxShadow: `0 2px 8px var(--t-btn-shadow, rgba(40, 96, 56, 0.25))`,
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-white font-semibold text-xs hover:opacity-95 hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0 border border-white/20"
                title="Download / Install inventQ as Desktop App"
              >
                <Download size={13} strokeWidth={2.5} />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            <Link to="/notifications" className="group">
              <button 
                className="relative flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-blue-500/10 backdrop-blur-md hover:bg-blue-500/20 text-blue-600 rounded-full transition-all duration-300 ease-out shadow-sm overflow-hidden border border-blue-500/20 min-h-9"
                title="View Notifications"
              >
                <div className="relative flex shrink-0 items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <div className={`hidden sm:flex flex-col items-start transition-all duration-500 ease-out overflow-hidden whitespace-nowrap ${isIslandExpanded ? 'w-[180px] opacity-100' : 'w-0 opacity-0 group-hover:w-[180px] group-hover:opacity-100'}`}>
                  <span className="text-[9px] font-extrabold text-blue-500/80 uppercase tracking-wider leading-none mb-0.5">
                    {latestNotification ? "New Alert" : (unreadCount > 0 ? `${unreadCount} Unread` : "Notifications")}
                  </span>
                  <span className="text-[11px] font-semibold text-blue-900 leading-none truncate w-full text-left" title={lastNotification ? (lastNotification.title || lastNotification.message) : "All caught up"}>
                    {lastNotification ? (lastNotification.title || lastNotification.message) : "All caught up"}
                  </span>
                </div>
              </button>
            </Link>
            <Link to={"/settings"}>
              <button className="w-9 h-9 flex items-center justify-center text-slate-500 md:hover:bg-slate-100 md:hover:text-slate-700 rounded-full md:transition-colors group active:scale-95">
                <Settings className="w-5 h-5 md:group-hover:rotate-45 md:transition-transform md:duration-300" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Quick Navigation Search Sheet */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-[100] md:hidden flex flex-col justify-start">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setIsMobileSearchOpen(false)}
            />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="relative z-10 bg-white border-b border-slate-200 shadow-xl rounded-b-2xl pt-[max(12px,env(safe-area-inset-top))] px-3.5 pb-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Jump to any page..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-100">
                {(searchQuery ? filteredRoutes : SEARCHABLE_ROUTES.slice(0, 8)).map((route) => {
                  const Icon = route.icon;
                  return (
                    <button
                      key={route.path}
                      onClick={() => handleNavigate(route.path)}
                      className="w-full flex items-center justify-between px-2.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-3 font-medium">
                        <Icon size={16} className="text-slate-400" />
                        {route.name}
                      </span>
                      <ArrowRight size={14} className="text-slate-300" />
                    </button>
                  );
                })}
                {searchQuery && filteredRoutes.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-400">No matching pages found</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic CSS animations */}
      <style>{`
        @keyframes slideText {
          0%, 28% { transform: translateY(0); }
          33%, 61% { transform: translateY(-1rem); }
          66%, 94% { transform: translateY(-2rem); }
          100% { transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>

      {/* Desktop App Install Modal */}
      <DesktopInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInstall={promptInstall}
        isPromptReady={isPromptReady}
      />
    </>
  );
};
