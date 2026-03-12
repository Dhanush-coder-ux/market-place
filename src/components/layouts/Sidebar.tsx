import { useState, useEffect, FC } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, ChevronLeft, ChevronDown } from "lucide-react";
import { usePurchaseSettings } from "@/context/PurchaseContext";


// --- Types ---
interface SubLink {
  name: string;
  path: string;
}

interface SidebarLink {
  name: string;
  icon: LucideIcon | any;
  path?: string;
  subLinks?: SubLink[];
  badge?: string | number;
}

interface SidebarItemProps {
  link: SidebarLink;
  sidebarOpen: boolean;
  index: number;
}

// --- Main Component ---
const Sidebar: FC<{ links: SidebarLink[] }> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { settings } = usePurchaseSettings();

  const filteredSidebarLinks = links.map(link => {
    // We only want to filter the subLinks inside the "Purchase" section
    if (link.name === "Purchase" && link.subLinks) {
      const activeSubLinks = link.subLinks.filter(sub => {
        if (sub.name === "Direct") return settings.directPurchase;
        if (sub.name === "PO-GRN") return settings.poGrn;
        if (sub.name === "Production Entry") return settings.productionEntry;
        return true; // Keep everything else (like "Purchase order") visible
      });
      return { ...link, subLinks: activeSubLinks };
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
              {/* Logo mark */}
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
          className={`p-1.5 rounded-md text-white/35 bg-transparent hover:bg-white/10 hover:text-white/70 transition-colors flex items-center justify-center shrink-0 ${
            !isOpen ? "mx-auto" : ""
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
            className="px-4 pt-4 pb-1.5 text-[9.5px] font-bold tracking-[0.09em] uppercase text-white/30"
          >
            Navigation
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav with Hiding Scrollbar utility classes */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-0.5 px-2 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filteredSidebarLinks.map((link, i) => (
          <SidebarItem key={link.name} link={link} sidebarOpen={isOpen} index={i} />
        ))}
      </nav>

      {/* Divider */}
      <div className="h-px bg-white/5 mx-3" />

      {/* Footer */}
      <div className="p-2.5 px-2">
        <div
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/5 border border-white/5 ${
            isOpen ? "justify-start" : "justify-center"
          }`}
        >
          {/* Avatar */}
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

// --- Item Component ---
const SidebarItem: FC<SidebarItemProps> = ({ link, sidebarOpen, index }) => {
  const { pathname } = useLocation();
  const Icon = link.icon;
  const hasSub = !!link.subLinks?.length;
  const isChildActive = hasSub && link.subLinks!.some((s) => pathname === s.path);
  const [isDrop, setIsDrop] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setIsDrop(true);
  }, [isChildActive]);

  // Base classes for both NavLink and Dropdown Button
  const baseItemClasses =
    "group relative flex items-center w-full px-2.5 h-9 rounded-[9px] text-[12.5px] font-medium transition-colors outline-none cursor-pointer tracking-tight";

  // Active vs Inactive class logic
  const getActiveClass = (isActive: boolean) =>
    isActive
      ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
      : "bg-transparent text-white/55 hover:bg-white/10 hover:text-white/80";

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="flex flex-col"
    >
      {hasSub ? (
        <button
          onClick={() => sidebarOpen && setIsDrop(!isDrop)}
          className={`${baseItemClasses} ${getActiveClass(isChildActive)} ${
            sidebarOpen ? "justify-between" : "justify-center"
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
            <div className="flex items-center gap-1.5 shrink-0">
              {link.badge && (
                <span className="text-[9px] font-bold bg-white/15 text-white/70 px-1.5 py-[1px] rounded-full tracking-[0.02em]">
                  {link.badge}
                </span>
              )}
              <motion.div
                animate={{ rotate: isDrop ? 180 : 0 }}
                transition={{ duration: 0.22 }}
                className="text-white/20 flex"
              >
                <ChevronDown size={12} strokeWidth={2.5} />
              </motion.div>
            </div>
          )}

          {/* Collapsed Tooltip (replaces the <style> block injection) */}
          {!sidebarOpen && (
            <div className="absolute left-[66px] bg-slate-800 text-white/90 text-[11.5px] font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap z-[9999] border border-white/10 shadow-lg tracking-tight opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
              {link.name}
            </div>
          )}
        </button>
      ) : (
        <NavLink
          to={link.path!}
          className={({ isActive }) =>
            `${baseItemClasses} ${getActiveClass(isActive)} ${
              sidebarOpen ? "justify-between" : "justify-center"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {/* Active pill indicator */}
              {isActive && (
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

              {sidebarOpen && link.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-[2px] rounded-full tracking-[0.03em] shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/55"
                  }`}
                >
                  {link.badge}
                </span>
              )}

              {/* Collapsed Tooltip */}
              {!sidebarOpen && (
                <div className="absolute left-[66px] bg-slate-800 text-white/90 text-[11.5px] font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap z-[9999] border border-white/10 shadow-lg tracking-tight opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                  {link.name}
                </div>
              )}
            </>
          )}
        </NavLink>
      )}

      {/* Submenu */}
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
              {link.subLinks!.map((sub) => (
                <NavLink
                  key={sub.name}
                  to={sub.path}
                  className={({ isActive }) =>
                    `block pl-3.5 pr-2.5 py-1.5 text-[11.5px] rounded-r-[7px] no-underline tracking-tight leading-none transition-colors ${
                      isActive
                        ? "font-semibold text-white bg-white/5"
                        : "font-normal text-white/80 bg-transparent hover:text-white/70"
                    }`
                  }
                >
                  {sub.name}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Sidebar;