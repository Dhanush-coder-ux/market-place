import React, { useEffect } from "react";
import { CircleArrowRight } from "lucide-react";
import type { DrawerProps } from "../types";

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full z-50 bg-white shadow-2xl
          w-full sm:w-[500px] md:w-[600px] lg:w-[700px]
          transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b shrink-0">
          <button 
            onClick={onClose} 
            className="group p-1 transition-transform hover:scale-110 active:scale-95"
            aria-label="Close drawer"
          >
            <CircleArrowRight 
              size={32} 
              className="text-blue-600 transition-colors group-hover:text-blue-700"
            />
          </button>
          <h2 className="text-2xl md:text-2xl font-bold text-gray-800 tracking-tight">
            {title}
          </h2>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Drawer;