import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info";
}

import { useScrollLock } from "@/hooks/useScrollLock";

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger"
}) => {
  useScrollLock(isOpen);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={isDesktop ? { opacity: 0, scale: 0.95, y: 20 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.95, y: 20 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-white rounded-xl sm:rounded-lg shadow-2xl border border-slate-200 w-full max-w-[420px] max-h-[90dvh] overflow-y-auto"
          >
            <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center ${variant === "danger" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                  <AlertTriangle size={24} className="sm:w-7 sm:h-7" />
                </div>
                <button onClick={onClose} className="p-1.5 -mr-1.5 text-slate-400 md:hover:text-slate-600 transition-colors">
                  <X size={22} />
                </button>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h3>
                <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">{message}</p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="w-full sm:flex-1 h-11 sm:h-12 rounded-lg border border-slate-200 text-slate-600 font-bold md:hover:bg-slate-50 md:transition-all md:active:scale-95"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`w-full sm:flex-1 h-11 sm:h-12 rounded-lg text-white font-bold md:transition-all shadow-lg md:active:scale-95 ${
                    variant === "danger" 
                      ? "bg-rose-600 shadow-rose-100 md:hover:bg-rose-700" 
                      : "bg-blue-600 shadow-blue-100 md:hover:bg-blue-700"
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

