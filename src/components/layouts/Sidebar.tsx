import { useState, useEffect, FC } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown, ListMinus, Plus } from "lucide-react";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import type { SidebarLink, SubItem, SubGroup, SubLink } from "@/utils/constants";

// ─── Type Guards ─────────────────────────────────────────────────────────────

const isSubGroup = (item: SubItem): item is SubGroup =>
  (item as SubGroup).type === "group";

// ─── Props ───────────────────────────────────────────────────────────────────

interface SidebarItemProps {
  link: SidebarLink;
  sidebarOpen: boolean;
  index: number;
  collapseTrigger: number;
  onHover: (link: SidebarLink | null, top: number) => void;
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
  const { settings } = usePurchaseSettings();

  /**
   * Filter logic lives here — outside JSX, scalable, type-safe.
   * For "Purchase", we filter each SubItem based on its settingsKey.
   * All other top-level links pass through untouched.
   */
  const filteredLinks: SidebarLink[] = links.map((link) => {
    if (link.name === "Purchase" && link.subLinks) {
      const visibleSubItems = link.subLinks.filter((item) => {
        if (!isSubGroup(item)) return true; // plain SubLinks always visible
        if (!item.settingsKey) return true; // no gate = always visible
        return settings[item.settingsKey] === true;
      });
      return { ...link, subLinks: visibleSubItems };
    }
    return link;
  });

  return (
    <motion.div
      animate={{ width: isOpen ? 220 : 56 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full flex-shrink-0 overflow-hidden min-h-screen border-r border-white/10 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900"
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
      <div className="relative flex items-center justify-between flex-shrink-0 h-14 px-3 border-b border-white/10">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="w-[26px] h-[26px] rounded-md bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="0.5" y="0.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.9" />
                  <rect x="7.5" y="0.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.5" />
                  <rect x="0.5" y="7.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.5" />
                  <rect x="7.5" y="7.5" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.9" />
                </svg>
              </div>
              <span className="text-[13px] font-semibold tracking-tight text-white/95 truncate">
                MarketPlace
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 rounded-md text-white/35 bg-transparent hover:bg-white/10 hover:text-white/70 transition-colors flex items-center justify-center shrink-0 ${!isOpen ? "mx-auto" : ""
            }`}
        >
          <motion.div animate={{ rotate: isOpen ? 0 : 180 }} transition={{ duration: 0.28 }}>
            <ChevronLeft size={14} strokeWidth={2.5} />
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
            transition={{ duration: 0.15 }}
            className="px-4 pt-4 pb-1.5 flex items-center justify-between"
          >
            <span className="text-[9.5px] font-bold tracking-[0.09em] uppercase text-white/30">
              Navigation
            </span>
            <button
              onClick={() => setCollapseTrigger(prev => prev + 1)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-white bg-white/5 backdrop-blur-sm border border-white/30 hover:bg-white/15 hover:text-white/80 transition-all group/collapse shadow-inner cursor-pointer"
              title="Collapse All"
            >
              <ListMinus size={12} className="group-hover/collapse:scale-110 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-0.5 px-2 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filteredLinks.map((link, i) => (
          <SidebarItem
            key={link.name}
            link={link}
            sidebarOpen={isOpen}
            index={i}
            collapseTrigger={collapseTrigger}
            onHover={(link, top) => setHoveredItem(link ? { link, top } : null)}
          />
        ))}
      </nav>

      {/* Floating Hover Card (Portal-like Fixed Positioning) */}
      <AnimatePresence>
        {hoveredItem && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', top: hoveredItem.top, left: 60 }}
            onMouseEnter={() => setHoveredItem(hoveredItem)}
            onMouseLeave={() => setHoveredItem(null)}
            className="z-[9999] pl-2"
          >
            <div className="bg-gradient-to-br from-blue-600/95 via-blue-700/95 to-blue-900/95 border border-white/20 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-3 w-[220px] overflow-hidden backdrop-blur-xl">
              <div className="px-4 pb-2.5 mb-1.5 border-b border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{hoveredItem.link.name}</span>
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
      <div className="h-px bg-white/5 mx-3" />

      {/* Footer */}
      <div className="p-2.5 px-2">
        <div
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/5 border border-white/5 ${isOpen ? "justify-start" : "justify-center"
            }`}
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 shrink-0 flex items-center justify-center text-[11px] font-bold text-white shadow-md">
            A
          </div>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                key="user"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="text-[11.5px] font-semibold text-white/80 leading-none mb-1 truncate">
                  Admin User
                </p>
                <p className="text-[10px] text-white/30 leading-none truncate">
                  admin@marketplace.io
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Top-level Sidebar Item ───────────────────────────────────────────────────

const SidebarItem: FC<SidebarItemProps> = ({ link, sidebarOpen, index, collapseTrigger, onHover }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const Icon = link.icon;
  const hasSub = !!link.subLinks?.length;

  // A top-level item is "active" if any of its descendants match the path
  const isDescendantActive = (items: SubItem[]): boolean =>
    items.some((item) => {
      if (isSubGroup(item)) return item.children.some((c) => pathname === c.path);
      return pathname === (item as SubLink).path;
    });

  const isChildActive = hasSub && isDescendantActive(link.subLinks!);
  const [isDrop, setIsDrop] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setIsDrop(true);
  }, [isChildActive]);

  // Collapse All Trigger
  useEffect(() => {
    if (collapseTrigger > 0) {
      setIsDrop(false);
    }
  }, [collapseTrigger]);

  const baseItemClasses =
    "group relative flex items-center w-full px-2.5 h-9 rounded-[9px] text-[12.5px] font-medium transition-colors outline-none cursor-pointer tracking-tight";

  const getActiveClass = (isActive: boolean) =>
    isActive
      ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
      : "bg-transparent text-white/55 hover:bg-white/10 hover:text-white/80";

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!sidebarOpen && hasSub) {
      const rect = e.currentTarget.getBoundingClientRect();
      onHover(link, rect.top);
    }
  };

  const handleMouseLeave = () => {
    if (!sidebarOpen) {
      onHover(null, 0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex flex-col relative group/sub"
    >
      {hasSub ? (
        /* ── Dropdown trigger ── */
        <div className="group/sub relative flex items-center w-full">
          <button
            onClick={() => sidebarOpen && setIsDrop(!isDrop)}
            className={`${baseItemClasses} flex-1 ${getActiveClass(isChildActive)} ${sidebarOpen ? "justify-between" : "justify-center"
              }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon size={15} strokeWidth={1.75} className="shrink-0" />
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="truncate"
                  >
                    {link.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {sidebarOpen && (
              <motion.div
                animate={{ rotate: isDrop ? 180 : 0 }}
                transition={{ duration: 0.22 }}
                className="text-white/20 flex shrink-0"
              >
                <ChevronDown size={12} strokeWidth={2.5} />
              </motion.div>
            )}

            {!sidebarOpen && !hasSub && <Tooltip label={link.name} />}
          </button>

          {link.addPath && sidebarOpen && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(link.addPath!);
              }}
              className="absolute right-7 w-6 h-6 rounded-md flex items-center justify-center bg-white/10 text-white/50 hover:bg-white hover:text-blue-600 hover:scale-110 opacity-0 group-hover/sub:opacity-100 transition-all duration-200 shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/10 active:scale-95"
            >
              <Plus size={12} strokeWidth={3.5} />
            </button>
          )}
        </div>
      ) : (
        /* ── Plain NavLink ── */
        <div className="group/sub relative flex items-center w-full">
          <NavLink
            to={link.path!}
            className={({ isActive }) =>
              `${baseItemClasses} flex-1 ${getActiveClass(isActive)} ${
                sidebarOpen ? "justify-between" : "justify-center"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && sidebarOpen && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-white/70 rounded-full"
                  />
                )}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    size={15}
                    strokeWidth={1.75}
                    className={`shrink-0 ${isActive ? "opacity-100" : "opacity-75"}`}
                  />
                  <AnimatePresence mode="wait">
                    {sidebarOpen && (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
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
          {link.addPath && sidebarOpen && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(link.addPath!);
              }}
              className="absolute right-2 w-6 h-6 rounded-md flex items-center justify-center bg-white/5 text-white/40 hover:bg-white/15 hover:text-white/90 opacity-0 group-hover/sub:opacity-100 transition-all duration-200 shadow-sm border border-white/5"
            >
              <Plus size={12} strokeWidth={3} />
            </button>
          )}
        </div>
      )}

      {/* ── Submenu panel ── */}
      <AnimatePresence>
        {hasSub && isDrop && sidebarOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden ml-3 mt-0.5"
          >
            <div className="border-l border-white/10 ml-[7px] py-1 flex flex-col gap-0.5">
              {link.subLinks!.map((item) =>
                isSubGroup(item) ? (
                  // ── Level 2: SubGroup (folder) ──
                  <SubGroupItem
                    key={item.name}
                    group={item}
                    sidebarOpen={sidebarOpen}
                    collapseTrigger={collapseTrigger}
                  />
                ) : (
                  // ── Level 2: Flat SubLink ──
                  <FlatSubLink key={(item as SubLink).path} sub={item as SubLink} />
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── SubGroup (folder) Item — Level 2 ────────────────────────────────────────

const SubGroupItem: FC<SubGroupItemProps> = ({ group, collapseTrigger }) => {
  const { pathname } = useLocation();
  const isChildActive = group.children.some((c) => pathname === c.path);
  const [isOpen, setIsOpen] = useState(isChildActive);
  const Icon = group.icon;

  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  // Collapse All Trigger
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
        className={`group flex items-center justify-between pl-3.5 pr-2.5 py-1.5 rounded-r-[7px] text-[11.5px] font-semibold tracking-tight transition-colors w-full text-left ${isChildActive
            ? "text-white/90 bg-white/5"
            : "text-white/50 hover:text-white/70 hover:bg-white/5"
          }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <Icon
              size={12}
              strokeWidth={2}
              className={`shrink-0 ${isChildActive ? "opacity-90" : "opacity-50"}`}
            />
          )}
          <span className="truncate">{group.name}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`shrink-0 ${isChildActive ? "text-white/40" : "text-white/20"}`}
        >
          <ChevronDown size={10} strokeWidth={2.5} />
        </motion.div>
      </button>

      {/* Level 3: children */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-3 border-l border-white/[0.07] py-0.5 flex flex-col gap-0.5">
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

const FlatSubLink: FC<{ sub: SubLink; isPopup?: boolean }> = ({ sub, isPopup = false }) => {
  const Icon = sub.icon;
  const navigate = useNavigate();
  const active = window.location.pathname === sub.path;

  return (
    <div className="group/sub relative flex items-center w-full pr-1.5">
      <NavLink
        to={sub.path}
        className={({ isActive }) =>
          `flex-1 flex items-center gap-2 py-1.5 px-3 text-[11.5px] rounded-lg no-underline tracking-tight leading-none transition-all duration-200 ${
            isActive
              ? (isPopup ? "bg-[#3B82F6] text-white font-semibold shadow-lg" : "bg-white/5 text-white")
              : (isPopup ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-white/60 hover:text-white/80")
          }`
        }
      >
        {({ isActive }) => (
          <>
            {Icon && (
              <Icon 
                size={12} 
                strokeWidth={2} 
                className={`shrink-0 ${isActive ? "opacity-100" : "opacity-50"}`} 
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
          className={`absolute right-2 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
            isPopup 
              ? `bg-transparent text-white/50 hover:text-white ${active ? "opacity-100" : "opacity-0"}`
              : "bg-white/10 text-white/50 hover:bg-white hover:text-blue-600 hover:scale-110 border border-white/10 opacity-0"
          } group-hover/sub:opacity-100 active:scale-95`}
          title={`Add New ${sub.name.replace(/s\sInfos|Infos|List/g, '')}`}
        >
          <Plus size={12} strokeWidth={active ? 3.5 : 2} />
        </button>
      )}
    </div>
  );
};

// ─── Tooltip (collapsed state) ────────────────────────────────────────────────

const Tooltip: FC<{ label: string }> = ({ label }) => (
  <div className="absolute left-[66px] bg-slate-800 text-white/90 text-[11.5px] font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap z-[9999] border border-white/10 shadow-lg tracking-tight opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
    {label}
  </div>
);

export default Sidebar;