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
  // Prevent background/body scrolling while sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* ================= BACKDROP ================= */}
      <div
        className="
          fixed
          inset-0
          z-[9998]
          bg-slate-900/40
          backdrop-blur-sm
          animate-fade-in
        "
        onClick={onClose}
      />

      {/* ================= SIDEBAR ================= */}
      <aside
        className="
          fixed
          top-0
          right-0
          z-[9999]
          h-dvh
          w-full
          max-w-[360px]
          sm:max-w-[400px]
          bg-white
          border-l
          border-slate-200
          shadow-2xl
          flex
          flex-col
          overflow-hidden
          animate-[slideLeft_0.25s_ease-out]
        "
      >
        {/* ================= HEADER ================= */}
        <header
          className="
            flex
            items-center
            justify-between
            px-5
            py-4
            shrink-0
            border-b
            border-slate-100
            bg-white
          "
        >
          <div className="flex items-center gap-2.5">
            {/* Filter Icon */}
            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-blue-50
                text-blue-600
              "
            >
              <Filter size={14} strokeWidth={2} />
            </div>

            {/* Title */}
            <h3
              className="
                text-sm
                font-semibold
                tracking-tight
                text-slate-800
              "
            >
              {title}
            </h3>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            title="Close Filters"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-slate-200
              bg-white
              text-slate-500
              shadow-sm
              transition-all
              hover:bg-slate-50
              hover:text-slate-700
              active:scale-95
            "
          >
            <X size={15} strokeWidth={2} />
          </button>
        </header>

        {/* ================= SCROLLABLE CONTENT ================= */}
        <main
          className="
            flex-1
            min-h-0
            overflow-y-auto
            overflow-x-hidden
            overscroll-contain
            px-5
            py-5
            space-y-5

            scrollbar-thin
            scrollbar-thumb-slate-300
            scrollbar-track-transparent

            hover:scrollbar-thumb-slate-400
          "
        >
          {children}

          {/* Extra bottom spacing so last field isn't hidden */}
          <div className="h-2 shrink-0" />
        </main>

        {/* ================= FOOTER ================= */}
        <footer
          className="
            shrink-0
            border-t
            border-slate-100
            bg-slate-50
            p-4
          "
        >
          <div className="flex items-center gap-3">
            {/* Reset Button */}
            <button
              type="button"
              onClick={onClear}
              className="
                flex
                h-10
                flex-1
                items-center
                justify-center
                gap-1.5
                rounded-lg
                border
                border-slate-200
                bg-white
                px-4
                text-[11px]
                font-semibold
                uppercase
                tracking-wider
                text-slate-500
                shadow-sm
                transition-all
                hover:bg-slate-50
                hover:text-slate-700
                active:scale-[0.98]
              "
            >
              <RotateCcw size={13} />
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
                flex
                h-10
                flex-1
                items-center
                justify-center
                rounded-lg
                bg-blue-600
                px-4
                text-[11px]
                font-semibold
                uppercase
                tracking-wider
                text-white
                shadow-md
                shadow-blue-100
                transition-all
                hover:bg-blue-700
                active:scale-[0.98]
              "
            >
              {applyLabel || "Apply Filters"}
            </button>
          </div>
        </footer>
      </aside>
    </>,
    document.body
  );
};