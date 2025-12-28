import React from "react";
import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {  IoMdSettings } from "react-icons/io";
import { LogOut } from "lucide-react";

import { sidebarLinks } from "../../utils/constants";
import { IoChevronBack } from "react-icons/io5";

const Sidebar = () => {
  // Sidebar collapse
  const [isOpen, setIsOpen] = React.useState(false);

  // Profile dropdown
  const [profileOpen, setProfileOpen] = React.useState(false);

  // MOCK DATA (replace later)
  const userName = "Dhanush";
  const avatarUrl = "https://i.pravatar.cc/150";

  const logout = () => {
    console.log("Logout clicked");
  };

  return (
    <>
      {/* Overlay for dropdown */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setProfileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <motion.div
        animate={{ width: isOpen ? 230 : 70 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative flex flex-col h-screen bg-gradient-to-r from-blue-600 to-blue-400 text-white z-[100] flex-shrink-0"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 h-20">
          <AnimatePresence>
            {isOpen && (
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-2xl font-bold"
              >
                Market Place
              </motion.h1>
            )}
          </AnimatePresence>

          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setProfileOpen(false);
            }}
            className="p-2 rounded-full hover:bg-blue-800 ml-auto"
          >
            <motion.div
              animate={{ rotate: isOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <IoChevronBack size={24} />
            </motion.div>
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-2 space-y-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                viewTransition
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? "bg-blue-700 text-white"
                      : "text-blue-200 hover:bg-blue-800"
                  }`
                }
              >
                <Icon size={24} />
                {isOpen && <span>{link.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* PROFILE */}
        <div className="p-3 border-t border-blue-800">
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <img
              src={avatarUrl}
              className="w-10 h-10 rounded-full ring-2 ring-blue-300"
            />
            {isOpen && <span className="font-semibold">{userName}</span>}
          </div>
        </div>
      </motion.div>

      {/* PROFILE DROPDOWN */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed left-[90px] bottom-6 w-56 bg-white text-black rounded-xl shadow-xl p-4 z-[999]"
          >
            <p className="font-semibold mb-3">Hi, {userName}</p>

            <Link
              to="/profile"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
            >
              <IoMdSettings />
              Settings
            </Link>

            <button
              onClick={logout}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-100 text-red-600 w-full mt-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
