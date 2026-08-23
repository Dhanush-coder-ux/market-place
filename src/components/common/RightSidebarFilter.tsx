import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, RotateCcw, Filter } from "lucide-react";

export interface RightSidebarFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  title?: string;
  children: React.ReactNode;
  applyLabel?: string;
}

export const RightSidebarFilter: React.FC<RightSidebarFilterProps> = ({
  isOpen,
  onClose,
  onApply,
  onClear,
  title = "Filters",
  children,
  applyLabel,
}) => {
  // Prevent body scroll when filter sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className="
          fixed
          top-0
          right-0
          z-[10000]
          h-full
          w-full
          max-w-[360px]
          sm:max-w-[400px]
          bg-white
          shadow-xl
          border-l
          border-slate-100
          flex
          flex-col
          min-h-0
          animate-[slideLeft_0.25s_ease-out]
        "
      >
        {/* ================= HEADER ================= */}
        <div
          className="
            flex
            items-center
            justify-between
            px-5
            py-4
            border-b
            border-slate-100
            shrink-0
            bg-slate-50/50
          "
        >
          <div className="flex items-center gap-2">
            {/* Filter Icon */}
            <div
              className="
                w-7
                h-7
                rounded-lg
                bg-blue-50
                flex
                items-center
                justify-center
                text-blue-600
              "
            >
              <Filter size={13} />
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              {title}
            </h3>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="
              w-7
              h-7
              flex
              items-center
              justify-center
              bg-white
              border
              border-slate-200
              hover:bg-slate-50
              rounded-lg
              text-slate-500
              hover:text-slate-700
              transition-colors
              shadow-sm
              active:scale-95
            "
            title="Close Filters"
          >
            <X size={14} />
          </button>
        </div>

        {/* ================= SCROLLABLE CONTENT ================= */}
        <div className="flex-1 relative min-h-0">
          <div
            className="
              absolute
              inset-0
              overflow-y-auto
              overflow-x-hidden
              p-5
              space-y-5
  
              /* Firefox */
              scrollbar-thin
              scrollbar-thumb-slate-300
              scrollbar-track-transparent
            "
          >
            {children}
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div
          className="
            p-4
            border-t
            border-slate-100
            flex
            items-center
            gap-3
            bg-slate-50
            shrink-0
          "
        >
          {/* Reset Button */}
          <button
            type="button"
            onClick={onClear}
            className="
              h-9
              px-4
              flex-1
              text-slate-500
              font-semibold
              bg-white
              border
              border-slate-200
              rounded-lg
              hover:bg-slate-50
              active:scale-95
              transition-all
              text-[11px]
              uppercase
              tracking-wider
              flex
              items-center
              justify-center
              gap-1.5
              shadow-sm
            "
          >
            <RotateCcw size={12} />
            Reset
          </button>

          {/* Apply Button */}
          <button
            type="button"
            onClick={() => {
              onApply();
              onClose();
            }}
            className="
              h-9
              px-4
              flex-1
              text-white
              font-semibold
              bg-blue-600
              rounded-lg
              hover:bg-blue-700
              active:scale-95
              transition-all
              text-[11px]
              uppercase
              tracking-wider
              shadow-md
              shadow-blue-100
            "
          >
            {applyLabel || "Apply Filters"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};