import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  IndianRupee,
  Package,
  Database,
  ShoppingCart,
  Printer,
  UserCircle,
  Store,
  X,
  ChevronRight,
  Search,
  Plus,
  Bookmark,
  ClipboardList,
  History,
  FileText,
  UserPlus,
  RefreshCw,
} from "lucide-react";

// Top-level nav items (max 5 for bottom bar + "More")
const TOP_NAV = [
  { name: "Home", icon: LayoutDashboard, path: "/" },
  { name: "Sales", icon: IndianRupee, path: "/sales" },
  { name: "Billing", icon: Printer, path: "/billing" },
  { name: "Orders", icon: ShoppingCart, path: "/orders" },
  { name: "More", icon: null, path: null }, // triggers dialog
];

// All navigation groups for the dialog
const ALL_NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/" },
      { name: "Sales Management", icon: IndianRupee, path: "/sales" },
      { name: "Orders History", icon: ShoppingCart, path: "/orders" },
      { name: "Billing & Invoices", icon: Printer, path: "/billing" },
    ],
  },
  {
    label: "Products",
    items: [
      { name: "Products List", icon: ClipboardList, path: "/product/all" },
      { name: "Add New Product", icon: Plus, path: "/product/add" },
      { name: "Product Detail", icon: FileText, path: "/product" },
      { name: "Product Drafts", icon: Bookmark, path: "/product/drafts" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { name: "Current Stock", icon: Database, path: "/inventory" },
      { name: "Stock Movements", icon: History, path: "/stock-movement" },
      { name: "Stock Adjustments", icon: RefreshCw, path: "/stock-adjustment" },
      { name: "Adjustment Drafts", icon: Bookmark, path: "/stock-adjustment/drafts" },
    ],
  },
  {
    label: "Purchase & Production",
    items: [
      { name: "Add Purchase", icon: Plus, path: "/purchase/add" },
      { name: "Purchase Drafts", icon: Bookmark, path: "/purchase/drafts" },
      { label: "History & Tracking", type: "sub-header" },
      { name: "Purchase History", icon: History, path: "/purchase-history" },
      { label: "Purchase Orders (PO)", type: "sub-header" },
      { name: "Purchase Order List", icon: ClipboardList, path: "/po-grn" },
      { name: "Add Purchase Order", icon: Plus, path: "/po-grn/add" },
      { name: "Update Purchase Order", icon: RefreshCw, path: "/po-grn/update" },
      { label: "Manufacturing", type: "sub-header" },
      { name: "Production Entry", icon: Package, path: "/production-entry/add" },
    ],
  },
  {
    label: "People Management",
    items: [
      { label: "Customers", type: "sub-header" },
      { name: "Customers Summary", icon: ClipboardList, path: "/customers-Summary" },
      { name: "Add New Customer", icon: UserPlus, path: "/customers/add" },
      { name: "Customer Details", icon: FileText, path: "/customers" },
      { name: "Customer Drafts", icon: Bookmark, path: "/customers/drafts" },
      
      { label: "Suppliers", type: "sub-header" },
      { name: "Suppliers Infos", icon: ClipboardList, path: "/supplier/all" },
      { name: "Add New Supplier", icon: UserPlus, path: "/supplier/add" },
      { name: "Supplier Details", icon: FileText, path: "/supplier" },
      { name: "Supplier Drafts", icon: Bookmark, path: "/supplier/drafts" },

      { label: "Employees", type: "sub-header" },
      { name: "Employee Infos", icon: ClipboardList, path: "/employee/all" },
      { name: "Add New Employee", icon: UserPlus, path: "/employee/add" },
      { name: "Employee Details", icon: FileText, path: "/employee" },
      { name: "Employee Drafts", icon: Bookmark, path: "/employee/drafts" },
    ],
  },
  {
    label: "Store & Settings",
    items: [
      { name: "Store Profile", icon: Store, path: "/digital-store/profile" },
      { name: "Create Store", icon: Plus, path: "/create-digital-store" },
      { name: "Account Settings", icon: UserCircle, path: "/profile" },
    ],
  },
];

// ─── More Icon (grid dots) ────────────────────────────────────────────────────
const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="5" cy="5" r="1.5" fill="currentColor" />
    <circle cx="10" cy="5" r="1.5" fill="currentColor" />
    <circle cx="15" cy="5" r="1.5" fill="currentColor" />
    <circle cx="5" cy="10" r="1.5" fill="currentColor" />
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="15" cy="10" r="1.5" fill="currentColor" />
    <circle cx="5" cy="15" r="1.5" fill="currentColor" />
    <circle cx="10" cy="15" r="1.5" fill="currentColor" />
    <circle cx="15" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

// ─── Navigation Dialog ────────────────────────────────────────────────────────
const NavigationDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
    setQuery("");
  };

  // Filter items based on search query
  const filteredGroups = query
    ? ALL_NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) => {
          const searchContent = (i.name || i.label || "").toLowerCase();
          return searchContent.includes(query.toLowerCase());
        }),
      })).filter((g) => g.items.length > 0)
    : ALL_NAV_GROUPS;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-800 tracking-tight">
                  Navigate To
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a page to go to
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-6 bg-slate-50/30">
              {filteredGroups.map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">
                    {group.label}
                  </p>
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden divide-y divide-slate-100">
                    {group.items.map((item, idx) => {
                      if (item.type === "sub-header") {
                        return (
                          <div key={idx} className="bg-slate-50/80 px-4 py-2 border-y border-slate-100/50">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                              {item.label}
                            </span>
                          </div>
                        );
                      }

                      const Icon = item.icon;
                      const isActive = pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => item.path && handleNav(item.path)}
                          className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-all active:scale-[0.98] ${
                            isActive
                              ? "bg-blue-50/50 text-blue-700"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                isActive
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {Icon && <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />}
                            </div>
                            <span
                              className={`font-medium ${
                                isActive ? "font-semibold" : ""
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>
                          {isActive ? (
                            <motion.span 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-[10px] font-bold bg-blue-600 text-white px-2.5 py-1 rounded-lg"
                            >
                              ACTIVE
                            </motion.span>
                          ) : (
                            <ChevronRight
                              size={14}
                              className="text-slate-300"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredGroups.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm font-medium text-slate-600">
                    No pages found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Mobile Bottom Bar ────────────────────────────────────────────────────────
const MobileBottomBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const isMoreActive =
    !TOP_NAV.slice(0, -1).some((n) => n.path === pathname) &&
    pathname !== "/" &&
    dialogOpen === false;

  return (
    <>
      <NavigationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      <motion.nav
        initial={false}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 260, delay: 0.1 }}
        className="fixed bottom-0 left-0 right-0 z-[70] md:hidden gpu-layer"
      >
        {/* Frosted glass bar */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          {/* Safe area padding for phones with home indicator */}
          <div className="flex items-center justify-around px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
            {TOP_NAV.map((item) => {
              const isMore = item.path === null;
              const Icon = item.icon;
              const isActive = isMore
                ? isMoreActive
                : pathname === item.path;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (isMore) {
                      setDialogOpen(true);
                    } else {
                      navigate(item.path!);
                    }
                  }}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
                >
                  {/* Active pill indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomBarIndicator"
                      className="absolute inset-0 bg-blue-50 rounded-xl"
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    />
                  )}

                  <div className="relative z-10">
                    {isMore ? (
                      <span
                        className={`transition-colors ${
                          isMoreActive ? "text-blue-600" : "text-slate-400"
                        }`}
                      >
                        <MoreIcon />
                      </span>
                    ) : (
                      Icon && (
                        <Icon
                          size={20}
                          strokeWidth={isActive ? 2 : 1.75}
                          className={`transition-colors ${
                            isActive ? "text-blue-600" : "text-slate-400"
                          }`}
                        />
                      )
                    )}
                  </div>

                  <span
                    className={`relative z-10 text-[10px] font-medium transition-colors leading-none ${
                      isActive ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default MobileBottomBar;
