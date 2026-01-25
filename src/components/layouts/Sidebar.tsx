import React from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { sidebarLinks } from "../../utils/constants";
import { IoChevronBack } from "react-icons/io5";

const Sidebar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <motion.div
        animate={{ width: isOpen ? 200 : 60 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative flex flex-col h-screen bg-gradient-to-r from-blue-600 to-blue-500 text-white z-0 flex-shrink-0 overflow-hidden shadow-xl"
      >
        <div className="flex items-center justify-between p-3 h-14 border-b border-blue-400/30">
          <AnimatePresence>
            {isOpen && (
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                // 4. Reduced font size (text-2xl -> text-lg) and added whitespace-nowrap
                className="text-lg font-bold whitespace-nowrap ml-2"
              >
                Market Place
              </motion.h1>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-full hover:bg-blue-700/50 transition-colors ml-auto"
          >
            <motion.div
              animate={{ rotate: isOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {/* 5. Reduced toggle icon size (24 -> 20) */}
              <IoChevronBack size={20} />
            </motion.div>
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                // 6. Reduced padding (p-3 -> p-2), gap (gap-4 -> gap-3), and font size (text-sm)
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2 rounded-md transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-white/20 text-white font-medium"
                      : "text-blue-100 hover:bg-white/10"
                  }`
                }
              >
                {/* 7. Reduced Nav icon size (24 -> 20) */}
                <div className="min-w-[20px]">
                   <Icon size={20} />
                </div>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap text-sm"
                    >
                      {link.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>
      </motion.div>
    </>
  );
};

export default Sidebar;