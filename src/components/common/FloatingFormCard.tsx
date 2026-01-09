import React, { useEffect } from "react";
import { X } from "lucide-react";


interface FloatingFormCardProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export const FloatingFormCard: React.FC<FloatingFormCardProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  maxWidth = "max-w-lg", // Default width, can be overridden
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // 1. Backdrop Overlay (Added p-4 to ensure card never touches screen edges on mobile)
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 transition-all animate-in fade-in duration-200"
      onClick={onClose} 
    >
      {/* 2. The Card Container */}
      <div 
        className={`
          bg-white w-full ${maxWidth} rounded-xl sm:rounded-2xl shadow-2xl relative flex flex-col 
          max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-2 duration-200
          ${className}
        `}
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Header Section (Fixed height, never scrolls) */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight line-clamp-1">
            {title || "Form Action"}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content Area (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>

      </div>
    </div>
  );
};