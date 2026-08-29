import { useState, useEffect, useRef, useCallback } from "react";
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
  Command,
  Settings2,
  Users,
  Printer,
} from "lucide-react";
import { notificationApi } from "@/services/api/notification";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);


  // Notifications
  const [latestNotification, setLatestNotification] = useState<{ title: string; message: string } | null>(null);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);

  // A ref to keep track of all seen notification IDs
  const seenNotifIds = useRef<Set<string>>(new Set());
  // A ref to store the queue of incoming notifications
  const notifQueue = useRef<{ id: string; title: string; message: string }[]>([]);
  // A ref to track if we're currently animating a notification
  const isAnimating = useRef(false);

  const processQueue = useCallback(() => {
    if (isAnimating.current || notifQueue.current.length === 0) return;

    isAnimating.current = true;
    const nextNotif = notifQueue.current.shift()!;
    setLatestNotification(nextNotif);
    setIsIslandExpanded(true);

    // Hide after 4 seconds
    setTimeout(() => {
      setIsIslandExpanded(false);
      // Wait for the hide animation to finish, then process the next one
      setTimeout(() => {
        isAnimating.current = false;
        processQueue();
      }, 500); // 500ms for CSS transition
    }, 4000);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    let isFirstLoad = true;

    const fetchNotifs = async () => {
      try {
        const data = await notificationApi.getNotifications(userId);
        if (data && Array.isArray(data)) {
          if (isFirstLoad) {
            // First load: just record seen IDs and set the latest as current without animating
            data.forEach((n: any) => seenNotifIds.current.add(n.id));
            if (data.length > 0) {
              setLatestNotification(data[0]);
            }
            isFirstLoad = false;
          } else {
            // Subsequent loads: find new notifications
            // Since data is usually newest first, we reverse it to queue older new messages first
            const newNotifs = data.filter((n: any) => !seenNotifIds.current.has(n.id)).reverse();
            if (newNotifs.length > 0) {
              newNotifs.forEach((n: any) => {
                seenNotifIds.current.add(n.id);
                notifQueue.current.push(n);
              });
              processQueue();
            }
          }
        }
      } catch (e) { }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [processQueue]);



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


      <div className="sticky top-0 z-40 w-full flex items-center justify-between px-4 lg:px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm h-14">

        {/* Search */}
        <div className="relative flex-1 mr-3 lg:mr-6 hidden md:flex" ref={searchRef}>
          <div className="relative group w-[180px] hover:w-[240px] focus-within:w-[350px] focus-within:!w-[350px] transition-all duration-300 ease-out">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 md:group-focus-within:text-blue-500 md:transition-colors z-10" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search the pages"
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100/70 border border-slate-200/60 rounded-md text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
              <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-xs font-medium text-slate-400 shadow-sm">
                <Command size={12} /> K
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
                  {filteredRoutes.map((route) => (
                      <button
                        key={route.path}
                        onClick={() => handleNavigate(route.path)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg md:hover:bg-blue-50 text-sm group md:transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-slate-700 group-hover:text-blue-700 font-semibold">
                            {route.name}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 text-blue-600 md:transition-all md:duration-200" />
                      </button>
                    ))}
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



          <div className="flex items-center gap-1">
            <Link to="/notifications" className="group">
              <button className="relative flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 backdrop-blur-md hover:bg-blue-500/20 text-blue-600 rounded-full transition-all duration-300 ease-out shadow-sm overflow-hidden border border-blue-500/20">
                <div className="relative flex shrink-0 items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors" />
                  {latestNotification && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_0_2px_white] transition-shadow animate-pulse"></span>
                  )}
                </div>
                <div className={`flex flex-col items-start transition-all duration-500 ease-out overflow-hidden whitespace-nowrap ${isIslandExpanded ? 'w-[130px] opacity-100' : 'w-0 opacity-0 group-hover:w-[130px] group-hover:opacity-100'}`}>
                  <span className="text-[9px] font-extrabold text-blue-500/80 uppercase tracking-wider leading-none mb-0.5">
                    {latestNotification ? "New Message" : "Notifications"}
                  </span>
                  <span className="text-[11px] font-semibold text-blue-900 leading-none truncate w-full text-left">
                    {latestNotification ? (latestNotification.title || latestNotification.message) : "No new alerts"}
                  </span>
                </div>
              </button>
            </Link>
            <Link to={"/settings"}>
              <button className="p-2 text-slate-400 md:hover:bg-slate-100 md:hover:text-slate-700 rounded-full md:transition-colors group">
                <Settings className="w-5 h-5 md:group-hover:rotate-45 md:transition-transform md:duration-300" />
              </button>
            </Link>

          </div>

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
