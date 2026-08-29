import { useState, useEffect, useRef, FC, useMemo, useCallback, memo } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, ListMinus, Plus, Printer, ArrowRight, Store, Loader2, Check, PlusCircle, LogOut } from "lucide-react";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import type { SidebarLink, SubItem, SubGroup, SubLink } from "@/utils/constants";
import { employeeApi } from "@/services/api/employee";
import { apiClient } from "@/services/api/apiClient";
import { ENDPOINTS, setShopId } from "@/services/endpoints";
import { fetchMyShops } from "@/services/api/shopHelpers";

// ─── Type Guards ─────────────────────────────────────────────────────────────

const isSubGroup = (item: SubItem): item is SubGroup =>
  (item as SubGroup).type === "group";

// ─── Design tokens (kept within the existing blue theme) ────────────────────
// Centralising the recurring class strings keeps every nav level visually
// consistent and makes future tweaks a one-line change instead of a find/replace.

const tokens = {
  itemBase:
    "group relative flex items-center w-full rounded-md text-[13px] font-medium leading-none outline-none cursor-pointer select-none transition-colors duration-150",
  itemActive: "bg-white/[0.12] text-white",
  itemInactive: "text-white/70 hover:bg-white/[0.06] hover:text-white/95",
  iconActive: "opacity-100",
  iconInactive: "opacity-60 group-hover:opacity-80",
  subItemActive: "bg-white/10 text-white",
  subItemInactive: "text-white/55 hover:bg-white/[0.05] hover:text-white/85",
  addBtn:
    "flex items-center justify-center rounded-[5px] bg-white/10 text-white/60 hover:bg-white hover:text-blue-700 border border-white/10 transition-all duration-150 active:scale-95 opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface SidebarItemProps {
  link: SidebarLink;
  sidebarOpen: boolean;
  collapseTrigger: number;
  activeAccordion: string | null;
  setActiveAccordion: (name: string | null) => void;
  onHover: (link: SidebarLink | null, top: number) => void;
  onNavigate: (path: string, askNewTab?: boolean) => void;
}

interface SubGroupItemProps {
  group: SubGroup;
  sidebarOpen: boolean;
  collapseTrigger: number;
}

// ─── Sidebar Root ─────────────────────────────────────────────────────────────

const Sidebar: FC<{ links: SidebarLink[] }> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<{ link: SidebarLink; top: number } | null>(null);
  const [collapseTrigger, setCollapseTrigger] = useState(0);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [promptData, setPromptData] = useState<{ path: string; open: boolean } | null>(null);
  const { settings } = usePurchaseSettings();
  const navigate = useNavigate();

  // ── Shop selector state ──────────────────────────────────────────────────────
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [shops, setShops] = useState<Array<{ id: string; name: string; logo_url?: string; categories?: string[] }>>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [currentShopId, setCurrentShopId] = useState<string | null>(() => localStorage.getItem("shop_id"));
  const [selectedShop, setSelectedShop] = useState<{ name: string; initial: string; logo_url?: string }>({
    name: "Loading...",
    initial: "S",
  });
  const shopMenuRef = useRef<HTMLDivElement>(null);

  // Fetch shops
  useEffect(() => {
    fetchMyShops()
      .then((list) => {
        setShops(list);
        const shopId = localStorage.getItem("shop_id");
        const shop = list.find((s: any) => s.id === shopId) ?? list[0];
        if (shop) {
          setCurrentShopId(shop.id);
          setSelectedShop({ name: shop.name, initial: shop.name.charAt(0).toUpperCase(), logo_url: shop.logo_url });
        }
      })
      .catch(() => setSelectedShop({ name: "My Shop", initial: "M" }))
      .finally(() => setShopsLoading(false));
  }, []);

  // Close shop menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shopMenuRef.current && !shopMenuRef.current.contains(e.target as Node)) {
        setIsShopMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleShopSwitch = useCallback((shop: { id: string; name: string }) => {
    setCurrentShopId(shop.id);
    setShopId(shop.id);
    localStorage.setItem("shop_id", shop.id);
    setIsShopMenuOpen(false);
    window.location.reload();
  }, []);

  const handleSignOut = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("shop_id");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  }, [navigate]);
  // ── End shop selector state ──────────────────────────────────────────────────

  const handleNavigation = useCallback((path: string, askNewTab?: boolean) => {
    if (askNewTab) {
      setPromptData({ path, open: true });
    }
  }, []);

  const confirmNavigation = (newTab: boolean) => {
    if (promptData) {
      if (newTab) {
        const cleanPath = `${promptData.path}?mode=clean`;
        window.open(cleanPath, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = promptData.path;
      }
      setPromptData(null);
    }
  };

  const [allowedModules, setAllowedModules] = useState<string[] | null>(null);

  useEffect(() => {
    const shopId = localStorage.getItem("shop_id");
    const userId = localStorage.getItem("user_id");
    if (!shopId || !userId) return;

    employeeApi.getEmployeesByShop(shopId)
      .then(() => {
        // Call allowed modules API
        return apiClient.get(`${ENDPOINTS.EMPLOYEES}/modules/allowed`);
      })
      .then((res: any) => {
        if (res?.data && Array.isArray(res.data)) {
          setAllowedModules(res.data);
        }
      })
      .catch(() => {
        // Fallback: try fetching modules directly
        apiClient.get(`${ENDPOINTS.EMPLOYEES}/modules/allowed`)
          .then((res: any) => {
            if (res?.data && Array.isArray(res.data)) {
              setAllowedModules(res.data);
            }
          })
          .catch((err) => console.error("Failed to fetch allowed modules:", err));
      });
  }, []);

  const MODULE_MAP: Record<string, string> = {
    Dashboard: "DASHBOARD",
    Products: "PRODUCTS",
    Suppliers: "SUPPLIERS",
    Purchases: "PURCHASES",
    Inventory: "INVENTORY",
    Billing: "BILLING",
    Sales: "SALES",
    Customers: "CUSTOMERS",
    Employees: "EMPLOYEES",
    "Digital Store": "DIGITAL_STORE",
    "Online Orders": "ONLINE_ORDERS",
  };

  const filteredLinks: SidebarLink[] = useMemo(() => {
    return links
      .filter((link) => {
        if (!allowedModules) return true; // Show default until loaded
        const moduleKey = MODULE_MAP[link.name];
        if (!moduleKey) return true;
        return allowedModules.includes(moduleKey);
      })
      .map((link) => {
        if (!link.subLinks) return link;

        const visibleSubItems = link.subLinks.filter((item) => {
          if (item.name === "Saved Drafts" || (!isSubGroup(item) && (item as SubLink).path?.includes('/drafts'))) {
            return false;
          }
          if (link.name === "Purchases" && isSubGroup(item) && item.settingsKey) {
            return settings[item.settingsKey] === true;
          }
          return true;
        });

        return { ...link, subLinks: visibleSubItems };
      });
  }, [links, settings, allowedModules]);

  const handleHover = useCallback(
    (link: SidebarLink | null, top: number) => setHoveredItem(link ? { link, top } : null),
    []
  );

  const handleCollapseAll = useCallback(() => {
    setCollapseTrigger(prev => prev + 1);
    setActiveAccordion(null);
  }, []);

  return (
    <div
      style={{ width: isOpen ? 220 : 56, willChange: "width" }}
      className="relative flex flex-col h-full flex-shrink-0 border-r border-white/10 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
    >
      {/* Subtle inner texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(0,0,0,0.16) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <div className="relative flex-shrink-0 border-b border-white/10 z-[110]">
        <div ref={shopMenuRef} className="relative">
          <div
            className={`flex items-center h-14 px-3 gap-2.5 cursor-pointer hover:bg-white/[0.06] transition-colors duration-150 ${isOpen ? "" : "justify-center"}`}
            onClick={() => isOpen && setIsShopMenuOpen((v) => !v)}
          >
            {/* Shop avatar */}
            <div className="w-8 h-8 rounded-[9px] bg-white/10 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden flex-none">
              {selectedShop.logo_url ? (
                <img src={selectedShop.logo_url} alt="" className="w-full h-full object-cover" />
              ) : selectedShop.initial !== "S" ? (
                <span className="text-[14px] font-black text-white">{selectedShop.initial}</span>
              ) : (
                <Store size={14} className="text-white/70" />
              )}
            </div>

            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.div
                  key="shopname"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex-1 min-w-0 flex items-center gap-1"
                >
                  <div className="min-w-0 flex-1 flex flex-col">
                    <span className="text-[13px] font-bold tracking-[-0.01em] text-white truncate leading-tight">
                      {selectedShop.name}
                    </span>
                    <span className="text-[10px] text-white/50 leading-tight font-medium">Switch workspace</span>
                  </div>
                  <ChevronDown
                    size={13}
                    strokeWidth={2}
                    className={`text-white/50 shrink-0 transition-transform duration-150 ${isShopMenuOpen ? "rotate-180" : ""}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shop dropdown panel (Light theme to match UI standard) */}
          <AnimatePresence>
            {isShopMenuOpen && isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.13 }}
                className="absolute top-full left-2 right-2 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] overflow-hidden"
              >
                {/* Shop list */}
                <div className="px-1.5 pt-1.5 pb-1">
                  <p className="text-[10px] font-bold text-slate-400 px-2 py-1.5">My Shops</p>
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

                {/* Divider + actions */}
                <div className="border-t border-slate-100 px-1.5 py-1.5 flex flex-col gap-0.5">
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
      </div>

      {/* ── Floating collapse toggle — right edge of sidebar ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={isOpen}
        style={{ right: -12 }}
        className="absolute top-[72px] z-[100] w-6 h-6 rounded-full bg-blue-600 border border-blue-500 shadow-md shadow-blue-900/40 flex items-center justify-center text-white/70 hover:text-white hover:bg-blue-500 transition-all duration-150 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
      >
        <motion.div animate={{ rotate: isOpen ? 0 : 180 }} transition={{ duration: 0.2 }}>
          <ChevronLeft size={12} strokeWidth={2.5} />
        </motion.div>
      </button>

      {/* Section label */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="px-3 pt-4 pb-1.5 flex items-center justify-between"
          >
            <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-white/35">
              Navigation
            </span>
            <button
              onClick={handleCollapseAll}
              aria-label="Collapse all sections"
              className="w-5 h-5 rounded flex items-center justify-center text-white/35 hover:bg-white/10 hover:text-white/75 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40 transition-colors duration-150 cursor-pointer"
              title="Collapse all"
            >
              <ListMinus size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-0.5 px-2 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filteredLinks.map((link) => (
          <SidebarItem
            key={link.name}
            link={link}
            sidebarOpen={isOpen}
            collapseTrigger={collapseTrigger}
            activeAccordion={activeAccordion}
            setActiveAccordion={setActiveAccordion}
            onHover={handleHover}
            onNavigate={handleNavigation}
          />
        ))}
      </nav>

      {/* New Tab Prompt Modal */}
      <AnimatePresence>
        {promptData?.open && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPromptData(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-[340px] bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <Printer size={22} className="text-blue-600" />
                </div>
                <h3 className="text-[16px] font-semibold text-slate-800 mb-1.5">Open billing terminal</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
                  Open the POS billing interface in a dedicated new tab for a distraction-free experience?
                </p>

                <div className="grid gap-2.5">
                  <button
                    onClick={() => confirmNavigation(true)}
                    className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-[13.5px] font-semibold shadow-sm shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5"
                  >
                    Open in new tab <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={() => confirmNavigation(false)}
                    className="w-full py-2.5 rounded-lg bg-slate-50 text-slate-600 text-[13.5px] font-semibold hover:bg-slate-100 active:scale-[0.98] transition-all duration-150"
                  >
                    Keep in same page
                  </button>
                </div>
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-[10px] font-semibold text-slate-400 tracking-wide">Recommended for POS</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Hover Card (collapsed-state flyout submenu) */}
      <AnimatePresence initial={false}>
        {hoveredItem && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.12 }}
            style={{ position: 'fixed', top: hoveredItem.top, left: 60 }}
            onMouseEnter={() => setHoveredItem(hoveredItem)}
            onMouseLeave={() => setHoveredItem(null)}
            className="z-[9999] pl-2"
          >
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 border border-white/15 rounded-lg shadow-2xl py-2 w-[208px] overflow-hidden">
              <div className="px-3.5 pb-2 mb-1 border-b border-white/10">
                <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">{hoveredItem.link.name}</span>
              </div>
              <div className="px-1.5 py-0.5 flex flex-col gap-0.5">
                {hoveredItem.link.subLinks!.map((item) => (
                  isSubGroup(item) ? (
                    item.children.map(child => <FlatSubLink key={child.path} sub={child} isPopup />)
                  ) : (
                    <FlatSubLink key={(item as SubLink).path} sub={item as SubLink} isPopup />
                  )
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="h-px bg-white/10 mx-2.5" />

      {/* Footer */}
      <div className="p-2 flex flex-col gap-1">

        {/* User */}
        <div
          className={`flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.06] transition-colors duration-150 cursor-default ${isOpen ? "justify-start" : "justify-center"}`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shrink-0 flex items-center justify-center text-[11px] font-semibold text-white ring-2 ring-white/10">
            A
          </div>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                key="user"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="min-w-0 flex-1"
              >
                <p className="text-[12px] font-medium text-white/85 leading-none mb-1 truncate">
                  Admin User
                </p>
                <p className="text-[10px] text-white/40 leading-none truncate">
                  admin@marketplace.io
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ─── Top-level Sidebar Item ───────────────────────────────────────────────────

const SidebarItem = memo(({ link, sidebarOpen, collapseTrigger, activeAccordion, setActiveAccordion, onHover, onNavigate }: SidebarItemProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const Icon = link.icon;
  const hasSub = !!link.subLinks?.length;

  const isDescendantActive = (items: SubItem[]): boolean =>
    items.some((item) => {
      if (isSubGroup(item)) return item.children.some((c) => pathname === c.path);
      const pathToCheck = (item as SubLink).path;
      if (pathToCheck === "/sales/detail") {
        return pathname.startsWith("/sales/") && pathname !== "/sales";
      }
      if (pathToCheck === "/purchase/detail") {
        return pathname.startsWith("/purchase/detail/") && pathname !== "/purchase/detail";
      }
      return pathname === pathToCheck;
    });

  const isChildActive = hasSub && isDescendantActive(link.subLinks!);

  // Accordion: controlled by parent's activeAccordion state
  const isDrop = hasSub && activeAccordion === link.name;

  // Auto-open if a child is active
  useEffect(() => {
    if (isChildActive && hasSub) {
      setActiveAccordion(link.name);
    }
  }, [isChildActive, hasSub, link.name, setActiveAccordion]);

  // Collapse All Trigger
  useEffect(() => {
    if (collapseTrigger > 0) {
      // setActiveAccordion(null) is called from parent; nothing needed here
    }
  }, [collapseTrigger]);

  const handleToggle = useCallback(() => {
    if (!sidebarOpen) return;
    setActiveAccordion(isDrop ? null : link.name);
  }, [sidebarOpen, isDrop, link.name, setActiveAccordion]);

  const getActiveClass = (isActive: boolean) =>
    isActive ? tokens.itemActive : tokens.itemInactive;

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (!sidebarOpen && hasSub) {
      const rect = e.currentTarget.getBoundingClientRect();
      onHover(link, rect.top);
    }
  }, [sidebarOpen, hasSub, onHover, link]);

  const handleMouseLeave = useCallback(() => {
    if (!sidebarOpen) {
      onHover(null, 0);
    }
  }, [sidebarOpen, onHover]);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex flex-col relative"
    >
      {hasSub ? (
        /* ── Dropdown trigger ── */
        <div className="relative flex items-center w-full">
          <button
            onClick={handleToggle}
            className={`${tokens.itemBase} h-9 px-2.5 flex-1 ${getActiveClass(isChildActive)} ${sidebarOpen ? "justify-between" : "justify-center"}`}
          >
            {isChildActive && sidebarOpen && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 bg-white/70 rounded-full" />
            )}
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon size={15} strokeWidth={1.6} className={`shrink-0 ${isChildActive ? tokens.iconActive : tokens.iconInactive}`} />
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.08 }}
                    className="truncate"
                  >
                    {link.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {sidebarOpen && (
              <motion.div
                animate={{ rotate: isDrop ? 90 : 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="text-white/35 flex shrink-0 ml-auto"
              >
                <ChevronRight size={13} strokeWidth={2} />
              </motion.div>
            )}

            {!sidebarOpen && <Tooltip label={link.name} />}
          </button>

          {link.addPath && sidebarOpen && (
            <AddButton
              className="absolute right-7"
              title={`Add ${link.name}`}
              onClick={() => {
                if (link.askNewTab) {
                  onNavigate(link.addPath!, true);
                } else {
                  navigate(link.addPath!);
                }
              }}
            />
          )}
        </div>
      ) : (
        /* ── Plain NavLink ── */
        <div className="group/sub relative flex items-center w-full">
          {link.askNewTab ? (
            <div
              onClick={() => onNavigate(link.path!, true)}
              className={`${tokens.itemBase} h-9 px-2.5 flex-1 ${getActiveClass(false)} ${sidebarOpen ? "justify-between" : "justify-center"}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon size={15} strokeWidth={1.6} className={`shrink-0 ${tokens.iconInactive}`} />
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.08 }}
                      className="truncate"
                    >
                      {link.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {!sidebarOpen && <Tooltip label={link.name} />}
            </div>
          ) : (
            <NavLink
              to={link.path!}
              target={link.newTab ? "_blank" : undefined}
              rel={link.newTab ? "noopener noreferrer" : undefined}
              className={({ isActive }) =>
                `${tokens.itemBase} h-9 px-2.5 flex-1 ${getActiveClass(isActive)} ${sidebarOpen ? "justify-between" : "justify-center"}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && sidebarOpen && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 bg-white/70 rounded-full"
                    />
                  )}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      size={15}
                      strokeWidth={1.6}
                      className={`shrink-0 ${isActive ? tokens.iconActive : tokens.iconInactive}`}
                    />
                    <AnimatePresence mode="wait">
                      {sidebarOpen && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.08 }}
                          className="truncate"
                        >
                          {link.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {!sidebarOpen && <Tooltip label={link.name} />}
                </>
              )}
            </NavLink>
          )}
          {link.addPath && sidebarOpen && (
            <AddButton
              className="absolute right-2"
              title={`Add ${link.name}`}
              onClick={() => {
                if (link.askNewTab) {
                  onNavigate(link.addPath!, true);
                } else {
                  navigate(link.addPath!);
                }
              }}
            />
          )}
        </div>
      )}

      {/* ── Submenu panel ── */}
      <AnimatePresence initial={false}>
        {hasSub && isDrop && sidebarOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 ml-[17px] pl-2.5 border-l border-white/10 py-0.5 flex flex-col gap-0.5">
              {link.subLinks!.map((item) =>
                isSubGroup(item) ? (
                  <SubGroupItem
                    key={item.name}
                    group={item}
                    sidebarOpen={sidebarOpen}
                    collapseTrigger={collapseTrigger}
                  />
                ) : (
                  <FlatSubLink key={(item as SubLink).path} sub={item as SubLink} />
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── SubGroup (folder) Item — Level 2 ────────────────────────────────────────

const SubGroupItem: FC<SubGroupItemProps> = ({ group, collapseTrigger }) => {
  const { pathname } = useLocation();
  const isChildActive = group.children.some((c) => pathname === c.path);
  const [isOpen, setIsOpen] = useState(isChildActive);
  const Icon = group.icon;

  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  useEffect(() => {
    if (collapseTrigger > 0) {
      setIsOpen(false);
    }
  }, [collapseTrigger]);

  return (
    <div className="flex flex-col">
      {/* Group header button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11.5px] font-medium tracking-normal transition-colors duration-150 w-full text-left ${isChildActive
          ? "text-white/85"
          : "text-white/50 hover:text-white/75"
          }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && (
            <Icon
              size={12}
              strokeWidth={1.75}
              className={`shrink-0 ${isChildActive ? "opacity-80" : "opacity-40"}`}
            />
          )}
          <span className="truncate">{group.name}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          className={`shrink-0 ${isChildActive ? "text-white/45" : "text-white/25"}`}
        >
          <ChevronRight size={11} strokeWidth={2} />
        </motion.div>
      </button>

      {/* Level 3: children */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-3 pl-2 py-0.5 flex flex-col gap-0.5">
              {group.children.map((child) => (
                <FlatSubLink key={child.path} sub={child} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Flat SubLink — reusable leaf node ───────────────────────────────────────

const FlatSubLink: FC<{ sub: SubLink; isPopup?: boolean }> = memo(({ sub, isPopup = false }) => {
  const Icon = sub.icon;
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const active = useMemo(() => {
    if (sub.path === "/sales/detail") {
      return pathname.startsWith("/sales/") && pathname !== "/sales";
    }
    if (sub.path === "/purchase/detail") {
      return pathname.startsWith("/purchase/detail/") && pathname !== "/purchase/detail";
    }
    return pathname === sub.path;
  }, [pathname, sub.path]);

  return (
    <div className="group/sub relative flex items-center w-full">
      <NavLink
        to={sub.path}
        className={({ isActive }) => {
          const isReallyActive = active || isActive;
          return `flex-1 flex items-center gap-1.5 py-1.5 pl-2.5 pr-1 text-[12px] font-medium rounded-[5px] no-underline tracking-normal leading-none transition-colors duration-150 ${isReallyActive
            ? (isPopup ? "bg-white/15 text-white font-semibold" : tokens.subItemActive)
            : (isPopup ? "text-white/60 hover:text-white hover:bg-white/[0.06]" : tokens.subItemInactive)
            }`;
        }}
      >
        {({ isActive }) => (
          <>
            {Icon && (
              <Icon
                size={12}
                strokeWidth={1.75}
                className={`shrink-0 ${isActive || active ? "opacity-90" : "opacity-40"}`}
              />
            )}
            <span className="truncate">{sub.name}</span>
          </>
        )}
      </NavLink>

      {sub.addPath && (
        <AddButton
          className={`absolute right-1.5 ${isPopup ? "bg-transparent border-transparent hover:bg-white/10" : ""} ${active ? "opacity-100" : ""}`}
          title={`Add ${sub.name.replace(/s\sInfos|Infos|List/g, '')}`}
          onClick={() => navigate(sub.addPath!)}
        />
      )}
    </div>
  );
});

// ─── Shared "+" action button ─────────────────────────────────────────────────

const AddButton: FC<{ onClick: () => void; title: string; className?: string }> = ({ onClick, title, className = "" }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    title={title}
    aria-label={title}
    className={`w-5 h-5 shrink-0 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40 ${tokens.addBtn} ${className}`}
  >
    <Plus size={11} strokeWidth={2.5} />
  </button>
);

// ─── Tooltip (collapsed state) ────────────────────────────────────────────────

const Tooltip: FC<{ label: string }> = ({ label }) => (
  <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 flex items-center bg-slate-800 text-white text-[11.5px] font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap z-[9999] border border-white/10 shadow-lg tracking-tight opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 delay-150">
    {label}
  </div>
);

export default Sidebar;