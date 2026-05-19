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
}

export const RightSidebarFilter: React.FC<RightSidebarFilterProps> = ({
  isOpen,
  onClose,
  onApply,
  onClear,
  title = "Filters",
  children,
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
      {/* Backdrop with fade-in animation */}
      <div
        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar with slide-in-from-right animation */}
      <div
        className="fixed top-0 right-0 h-full z-[101] bg-white shadow-2xl w-full max-w-[360px] sm:max-w-[400px] flex flex-col animate-[slideLeft_0.25s_ease-out] border-l border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Filter size={13} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors shadow-sm active:scale-95"
            title="Close Filters"
          >
            <X size={14} />
          </button>
        </div>

        {/* Filters Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
          {children}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClear();
            }}
            className="h-9 px-4 flex-1 text-slate-500 font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-95 transition-all text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              onApply();
              onClose();
            }}
            className="h-9 px-4 flex-1 text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-[11px] uppercase tracking-wider shadow-md shadow-blue-100"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};
