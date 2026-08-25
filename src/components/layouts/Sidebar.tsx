import { useState, useEffect, FC, useMemo, useCallback, memo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ListMinus, Plus, Printer, ArrowRight } from "lucide-react";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import type { SidebarLink, SubItem, SubGroup, SubLink } from "@/utils/constants";
import { employeeApi } from "@/services/api/employee";
import { apiClient } from "@/services/api/apiClient";
import { ENDPOINTS } from "@/services/endpoints";

// ─── Type Guards ─────────────────────────────────────────────────────────────

const isSubGroup = (item: SubItem): item is SubGroup =>
  (item as SubGroup).type === "group";

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
      className="relative flex flex-col h-full flex-shrink-0 overflow-hidden min-h-screen border-r border-white/10 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
    >
      {/* Subtle inner texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(0,0,0,0.15) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between flex-shrink-0 h-12 px-2.5 border-b border-white/10">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 min-w-0"
            >
              <div className="w-6 h-6 rounded-md bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                  <rect x="0.5" y="0.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.9" />
                  <rect x="7.5" y="0.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.5" />
                  <rect x="0.5" y="7.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.5" />
                  <rect x="7.5" y="7.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.9" />
                </svg>
              </div>
              <span className="text-[12.5px] font-semibold tracking-tight text-white/90 truncate">
                MarketPlace
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 rounded-md text-white/40 bg-transparent hover:bg-white/10 hover:text-white/70 transition-colors flex items-center justify-center shrink-0 ${!isOpen ? "mx-auto" : ""}`}
        >
          <motion.div animate={{ rotate: isOpen ? 0 : 180 }} transition={{ duration: 0.22 }}>
            <ChevronLeft size={13} strokeWidth={2} />
          </motion.div>
        </button>
      </div>

      {/* Section label */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="px-3 pt-3 pb-1 flex items-center justify-between"
          >
            <span className="text-[9px] font-semibold tracking-[0.1em] uppercase text-white/25">
              Navigation
            </span>
            <button
              onClick={handleCollapseAll}
              className="w-5 h-5 rounded flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white/70 transition-all cursor-pointer"
              title="Collapse All"
            >
              <ListMinus size={11} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-px px-1.5 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[340px] bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <Printer size={24} className="text-blue-500" />
                </div>
                <h3 className="text-[17px] font-bold text-slate-800 mb-2">Open Billing Terminal</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
                  Would you like to open the POS billing interface in a dedicated new tab for a distraction-free experience?
                </p>

                <div className="grid gap-3">
                  <button
                    onClick={() => confirmNavigation(true)}
                    className="w-full py-3 rounded-lg bg-blue-600 text-white text-[14px] font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Open in New Tab <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => confirmNavigation(false)}
                    className="w-full py-3 rounded-lg bg-slate-50 text-slate-600 text-[14px] font-bold hover:bg-slate-100 active:scale-[0.98] transition-all"
                  >
                    Keep in same page
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400">Recommended for POS</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Hover Card (Portal-like Fixed Positioning) */}
      <AnimatePresence initial={false}>
        {hoveredItem && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'fixed', top: hoveredItem.top, left: 60 }}
            onMouseEnter={() => setHoveredItem(hoveredItem)}
            onMouseLeave={() => setHoveredItem(null)}
            className="z-[9999] pl-2"
          >
            <div className="bg-gradient-to-br from-blue-600/95 via-blue-700/95 to-blue-900/95 border border-white/20 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-2.5 w-[210px] overflow-hidden backdrop-blur-xl">
              <div className="px-3.5 pb-2 mb-1 border-b border-white/5">
                <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">{hoveredItem.link.name}</span>
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
      <div className="h-px bg-white/5 mx-2.5" />

      {/* Footer */}
      <div className="p-2 px-1.5">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/5 ${isOpen ? "justify-start" : "justify-center"}`}
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
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
                className="min-w-0"
              >
                <p className="text-[11px] font-medium text-white/70 leading-none mb-0.5 truncate">
                  Admin User
                </p>
                <p className="text-[9.5px] text-white/30 leading-none truncate">
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

  const baseItemClasses =
    "group relative flex items-center w-full px-2 h-9 rounded-[7px] text-[13px] font-medium transition-all outline-none cursor-pointer tracking-normal";

  const getActiveClass = (isActive: boolean) =>
    isActive
      ? "bg-white/15 text-white"
      : "bg-transparent text-white/75 hover:bg-white/8 hover:text-white/90";

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
            className={`${baseItemClasses} flex-1 ${getActiveClass(isChildActive)} ${sidebarOpen ? "justify-between" : "justify-center"}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon size={14} strokeWidth={1.6} className="shrink-0" />
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
                className="text-white/40 flex shrink-0 ml-auto"
              >
                {/* Zoho-style filled triangle */}
                <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor">
                  <polygon points="0,0 7,3.5 0,7" />
                </svg>
              </motion.div>
            )}

            {!sidebarOpen && !hasSub && <Tooltip label={link.name} />}
          </button>

          {link.addPath && sidebarOpen && (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (link.askNewTab) {
                  onNavigate(link.addPath!, true);
                } else {
                  navigate(link.addPath!);
                }
              }}
              className="absolute right-6 w-5 h-5 rounded flex items-center justify-center bg-white/10 text-white/50 hover:bg-white hover:text-blue-600 hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-150 border border-white/10 active:scale-95"
            >
              <Plus size={11} strokeWidth={3} />
            </div>
          )}
        </div>
      ) : (
        /* ── Plain NavLink ── */
        <div className="group/sub relative flex items-center w-full">
          {link.askNewTab ? (
            <div
              onClick={() => onNavigate(link.path!, true)}
              className={`${baseItemClasses} flex-1 ${getActiveClass(false)} ${sidebarOpen ? "justify-between" : "justify-center"}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon size={14} strokeWidth={1.6} className="shrink-0 opacity-70" />
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
                `${baseItemClasses} flex-1 ${getActiveClass(isActive)} ${sidebarOpen ? "justify-between" : "justify-center"}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && sidebarOpen && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-[14px] bg-white/70 rounded-full"
                    />
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      size={14}
                      strokeWidth={1.6}
                      className={`shrink-0 ${isActive ? "opacity-100" : "opacity-65"}`}
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
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (link.askNewTab) {
                  onNavigate(link.addPath!, true);
                } else {
                  navigate(link.addPath!);
                }
              }}
              className="absolute right-1.5 w-5 h-5 rounded flex items-center justify-center bg-white/5 text-white/40 hover:bg-white/15 hover:text-white/90 opacity-0 group-hover/sub:opacity-100 transition-all duration-150 border border-white/5"
            >
              <Plus size={11} strokeWidth={2.5} />
            </div>
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
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden ml-2.5 mt-px"
          >
            <div className="border-l border-white/10 ml-[6px] py-0.5 flex flex-col gap-px">
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
        className={`group flex items-center justify-between pl-3 pr-2 py-1.5 rounded-r-[6px] text-[12px] font-medium tracking-normal transition-colors w-full text-left ${isChildActive
          ? "text-white/85 bg-white/5"
          : "text-white/60 hover:text-white/80 hover:bg-white/5"
          }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && (
            <Icon
              size={11}
              strokeWidth={1.75}
              className={`shrink-0 ${isChildActive ? "opacity-85" : "opacity-45"}`}
            />
          )}
          <span className="truncate">{group.name}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          className={`shrink-0 ${isChildActive ? "text-white/50" : "text-white/25"}`}
        >
          <svg width="6" height="6" viewBox="0 0 7 7" fill="currentColor">
            <polygon points="0,0 7,3.5 0,7" />
          </svg>
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
            <div className="ml-3 border-l border-white/[0.07] py-0.5 flex flex-col gap-px">
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
    <div className="group/sub relative flex items-center w-full pr-1">
      <NavLink
        to={sub.path}
        className={({ isActive }) => {
          const isReallyActive = active || isActive;
          return `flex-1 flex items-center gap-1.5 py-1.5 px-3 text-[12px] font-medium rounded-[6px] no-underline tracking-normal leading-none transition-all duration-150 ${isReallyActive
            ? (isPopup ? "bg-[#3B82F6] text-white font-medium shadow-sm" : "bg-white/8 text-white/90")
            : (isPopup ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-white/50 hover:text-white/75 hover:bg-white/5")
          }`;
        }}
      >
        {({ isActive }) => (
          <>
            {Icon && (
              <Icon
                size={11}
                strokeWidth={1.75}
                className={`shrink-0 ${isActive ? "opacity-90" : "opacity-45"}`}
              />
            )}
            <span className="truncate">{sub.name}</span>
          </>
        )}
      </NavLink>

      {sub.addPath && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(sub.addPath!);
          }}
          className={`absolute right-2 w-5 h-5 rounded flex items-center justify-center transition-all duration-150 ${isPopup
            ? `bg-transparent text-white/50 hover:text-white ${active ? "opacity-100" : "opacity-0"}`
            : "bg-white/10 text-white/50 hover:bg-white hover:text-blue-600 hover:scale-110 border border-white/10 opacity-0"
            } group-hover/sub:opacity-100 active:scale-95`}
          title={`Add New ${sub.name.replace(/s\sInfos|Infos|List/g, '')}`}
        >
          <Plus size={11} strokeWidth={active ? 3 : 2} />
        </button>
      )}
    </div>
  );
});

// ─── Tooltip (collapsed state) ────────────────────────────────────────────────

const Tooltip: FC<{ label: string }> = ({ label }) => (
  <div className="absolute left-[60px] bg-slate-800 text-white/90 text-[11px] font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap z-[9999] border border-white/10 shadow-lg tracking-tight opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
    {label}
  </div>
);

export default Sidebar;
