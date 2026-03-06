import { useState, useEffect, FC } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, ChevronLeft, ChevronDown } from "lucide-react";

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
}

interface SidebarItemProps {
  link: SidebarLink;
  sidebarOpen: boolean;
}

// --- Main Component ---
const Sidebar: FC<{ links: SidebarLink[] }> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.div
      animate={{ width: isOpen ? 200 : 48 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full bg-gradient-to-b from-blue-600 to-blue-700 text-white flex-shrink-0 overflow-hidden border-r border-white/[0.06]"
      style={{ minHeight: "100vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-white/[0.06] flex-shrink-0">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5 min-w-0"
            >

              <span className="text-[13px] font-semibold tracking-tight text-white/90 truncate">
                MarketPlace
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 rounded-md hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors flex-shrink-0 ${!isOpen ? "mx-auto" : ""}`}
        >
          <motion.div animate={{ rotate: isOpen ? 0 : 180 }} transition={{ duration: 0.25 }}>
            <ChevronLeft size={15} strokeWidth={2} />
          </motion.div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {links.map((link) => (
          <SidebarItem key={link.name} link={link} sidebarOpen={isOpen} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-white/[0.06] flex-shrink-0">
        <div className={`flex items-center gap-2.5 px-2 py-2 rounded-md ${isOpen ? "" : "justify-center"}`}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0 text-[10px] font-bold flex items-center justify-center text-white">
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
                <p className="text-[11px] font-medium text-white/80 truncate leading-none mb-0.5">Admin User</p>
                <p className="text-[10px] text-white/30 truncate leading-none">admin@marketplace.io</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// --- Item Component ---
const SidebarItem: FC<SidebarItemProps> = ({ link, sidebarOpen }) => {
  const { pathname } = useLocation();
  const Icon = link.icon;
  const hasSub = !!link.subLinks?.length;
  const isChildActive = hasSub && link.subLinks!.some((s) => pathname === s.path);
  const [isDrop, setIsDrop] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setIsDrop(true);
  }, [isChildActive]);

  const baseItem = `
    group relative flex items-center justify-between w-full px-2 py-2 rounded-md
    transition-all duration-150 text-[12px] font-medium outline-none 
  `;

  const activeItem = "bg-white/[0.08] text-white";
  const inactiveItem = "text-gray-300 hover:bg-white/[0.04] hover:text-white/75";

  return (
    <div className="flex flex-col ">
      {hasSub ? (
        <button
          onClick={() => sidebarOpen && setIsDrop(!isDrop)}
          className={`${baseItem} ${isChildActive ? activeItem : inactiveItem}`}
          title={!sidebarOpen ? link.name : undefined}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon size={15} strokeWidth={1.75} className="flex-shrink-0" />
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
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 text-white/25"
            >
              <ChevronDown size={12} strokeWidth={2} />
            </motion.div>
          )}
        </button>
      ) : (
        <NavLink
          to={link.path!}
          title={!sidebarOpen ? link.name : undefined}
          className={({ isActive }) =>
            `${baseItem} ${isActive ? activeItem : inactiveItem} ${!sidebarOpen ? "justify-center" : ""}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-400 rounded-full"
                />
              )}
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon size={15} strokeWidth={1.75} className="flex-shrink-0" />
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
            </>
          )}
        </NavLink>
      )}

      {/* CSS-only Tooltip for collapsed state */}
      {!sidebarOpen && (
        <style>{`
          [title]:hover::after {
            content: attr(title);
            position: absolute;
            left: 60px;
            background: #1e2030;
            color: rgba(255,255,255,0.85);
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 5px;
            white-space: nowrap;
            z-index: 99;
            border: 1px solid rgba(255,255,255,0.08);
            pointer-events: none;
          }
        `}</style>
      )}

      {/* Submenu */}
      <AnimatePresence>
        {hasSub && isDrop && sidebarOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden ml-3 mt-0.5"
          >
            <div className="border-l border-white/[0.07] ml-[7px] py-1 space-y-0.5">
              {link.subLinks!.map((sub) => (
                <NavLink
                  key={sub.name}
                  to={sub.path}
                  className={({ isActive }) =>
                    `block pl-3.5 pr-2 py-1.5 text-[11px] rounded-r-md transition-colors leading-none ${
                      isActive
                        ? "text-white font-medium"
                        : "text-gray-300 hover:text-white/65"
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
    </div>
  );
};

export default Sidebar;