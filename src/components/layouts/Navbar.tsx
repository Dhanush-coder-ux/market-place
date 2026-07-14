import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Settings,
  Search,
  ArrowRight,
  Store,
  ChevronDown,
  Check,
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
  Command,
  Settings2,
  LogOut,
  X,
  Loader2,
  Users,
  Printer,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { setShopId } from "@/services/endpoints";
import { fetchMyShops } from "@/services/api/shopHelpers";

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
// Signout Confirmation Modal
// -----------------------------
const SignOutModal = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    />
    {/* Dialog */}
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      >
        <X size={16} />
      </button>

      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 border border-red-100 mx-auto mb-4">
        <LogOut className="w-6 h-6 text-red-500" />
      </div>

      <h2 className="text-center text-base font-black text-slate-800 mb-1">
        Sign Out?
      </h2>
      <p className="text-center text-sm text-slate-500 font-medium mb-6">
        You'll be redirected to the login page. All unsaved changes will be lost.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-md shadow-red-100"
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>
);

// -----------------------------
// Navbar
// -----------------------------
export const Navbar = () => {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [shops, setShops] = useState<Array<{ id: string; name: string; logo_url?: string; categories?: string[] }>>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(
    localStorage.getItem("shop_id")
  );
  const [shopsLoading, setShopsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Fetch real shops
  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchMyShops();
        setShops(list);
      } catch (e) {
        console.error("Failed to fetch shops for navbar:", e);
      } finally {
        setShopsLoading(false);
      }
    };
    load();
  }, []);

  const selectedShop = shops.find((s) => s.id === selectedShopId) ?? shops[0];

  const handleSelectShop = useCallback((shop: { id: string; name: string }) => {
    setSelectedShopId(shop.id);
    setShopId(shop.id);
    localStorage.setItem("shop_id", shop.id);
    // Reload to re-fetch data for the newly selected shop
    window.location.reload();
  }, []);

  const handleSignOut = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("shop_id");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  }, [navigate]);

  // Filter routes
  const filteredRoutes = SEARCHABLE_ROUTES.filter((route) =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  return (
    <>
      {showSignOutModal && (
        <SignOutModal
          onConfirm={handleSignOut}
          onCancel={() => setShowSignOutModal(false)}
        />
      )}

      <div className="sticky top-0 z-40 w-full flex items-center justify-between px-4 lg:px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">

        {/* LEFT - Shop Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 py-1.5 px-2 md:hover:bg-slate-100 rounded-lg md:transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 group">
              <div className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-lg text-blue-600 border border-blue-100 md:group-hover:bg-blue-100 md:transition-colors font-black text-sm">
                {selectedShop?.logo_url ? (
                  <img src={selectedShop.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : selectedShop ? (
                  selectedShop.name.charAt(0).toUpperCase()
                ) : (
                  <Store className="w-4 h-4" />
                )}
              </div>
              <div className="flex flex-col items-start text-left hidden sm:flex">
                <span className="text-slate-800 font-semibold text-sm leading-tight">
                  {shopsLoading ? "Loading..." : (selectedShop?.name ?? "Select Shop")}
                </span>
                <span className="text-[11px] font-normal text-slate-400 leading-tight">
                  Switch Workspace
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 md:group-hover:text-slate-600 md:transition-colors hidden sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-lg shadow-xl border-slate-100">
            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 px-2 py-1.5">
              My Shops
            </DropdownMenuLabel>

            {shopsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            ) : shops.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 font-medium text-center">
                No shops found
              </div>
            ) : (
              shops.map((shop) => (
                <DropdownMenuItem
                  key={shop.id}
                  onClick={() => handleSelectShop(shop)}
                  className={`flex items-center justify-between cursor-pointer rounded-lg px-2.5 py-2 my-0.5 md:transition-colors ${
                    selectedShopId === shop.id
                      ? "bg-blue-50 text-blue-700"
                      : "md:hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                        selectedShopId === shop.id
                          ? "bg-white border-blue-200 text-blue-600"
                          : "bg-slate-100 border-slate-200 text-slate-500"
                      }`}
                    >
                      {shop.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{shop.name}</span>
                      {shop.categories && shop.categories.length > 0 && (
                        <span className="text-[10px] text-slate-400 capitalize">
                          {shop.categories[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedShopId === shop.id && <Check className="w-4 h-4 text-blue-600" />}
                </DropdownMenuItem>
              ))
            )}

            <DropdownMenuSeparator className="bg-slate-100 my-1.5" />

            <Link to="/create-shop">
              <DropdownMenuItem className="cursor-pointer text-blue-600 rounded-lg px-2.5 py-2 hover:bg-blue-50 font-medium">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Shop
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator className="bg-slate-100 my-1.5" />

            <DropdownMenuItem
              onClick={() => setShowSignOutModal(true)}
              className="cursor-pointer text-red-500 rounded-lg px-2.5 py-2 hover:bg-red-50 font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* CENTER - Global Search */}
        <div className="relative flex-1 max-w-lg mx-4 lg:mx-8 hidden md:block" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 md:group-focus-within:text-blue-500 md:transition-colors" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search pages, orders, products..."
              className="w-full pl-10 pr-12 py-2 bg-slate-100/70 border border-slate-200/60 rounded-full text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white md:transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
              <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-medium text-slate-400 shadow-sm">
                <Command size={10} /> K
              </kbd>
            </div>
          </div>

          {isSearchOpen && searchQuery && (
            <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
              {filteredRoutes.length > 0 ? (
                <div className="p-1.5">
                  <p className="px-3 py-2 text-[10px] font-bold text-slate-400">
                    Quick Navigation
                  </p>
                  {filteredRoutes.map((route) => {
                    const Icon = route.icon;
                    return (
                      <button
                        key={route.path}
                        onClick={() => handleNavigate(route.path)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg md:hover:bg-blue-50 text-sm group md:transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-slate-100 md:group-hover:bg-white md:group-hover:text-blue-600 md:group-hover:shadow-sm md:transition-all">
                            <Icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
                          </div>
                          <span className="text-slate-700 group-hover:text-blue-700 font-semibold">
                            {route.name}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 text-blue-600 md:transition-all md:duration-200" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No results found</p>
                  <p className="text-xs text-slate-400 mt-1">Try searching for something else.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT - Actions */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Animated Highlighted Digital Store Button */}
          <div className="relative group/ds hidden md:block select-none">
            <Link
              to="/profile"
              className="relative inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-100/50 hover:shadow-lg hover:shadow-blue-200/50 transition-all hover:-translate-y-0.5 overflow-hidden"
            >
              {/* Shine effect ray */}
              <div className="absolute top-0 -inset-full h-full w-1/2 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2.5s_infinite_linear] pointer-events-none" />
              
              <Store size={13} className="relative z-10 shrink-0 text-blue-50" />
              
              {/* Slideshow scrolling text container with reduced width */}
              <div className="relative z-10 overflow-hidden h-4 w-[190px]">
                <div className="animate-[slideText_9s_infinite] flex flex-col absolute left-0 w-full text-left">
                  <div className="h-4 leading-4 truncate">Digital Store: 1000+ onboarded</div>
                  <div className="h-4 leading-4 truncate">Digital Store: Make it yours & grow</div>
                  <div className="h-4 leading-4 truncate">Digital Store: Start shop in 60s</div>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button className="relative p-2 text-slate-400 md:hover:bg-slate-100 md:hover:text-slate-700 rounded-full md:transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <Link to={"/settings"}>
              <button className="p-2 text-slate-400 md:hover:bg-slate-100 md:hover:text-slate-700 rounded-full md:transition-colors group">
                <Settings className="w-5 h-5 md:group-hover:rotate-45 md:transition-transform md:duration-300" />
              </button>
            </Link>

          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1"></div>

        </div>
      </div>
      
      {/* Dynamic CSS animations for Navbar text slideshow and shimmer */}
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
    </>
  );
};
