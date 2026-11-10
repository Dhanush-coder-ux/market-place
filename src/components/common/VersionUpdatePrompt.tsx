import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowUpCircle, X, ArrowRight } from 'lucide-react';
import { useVersionManager } from '@/hooks/useVersionManager';

export const VersionUpdatePrompt: React.FC = () => {
  const {
    currentVersion,
    remoteVersion,
    releaseNotes,
    isUpdateAvailable,
    isRefreshing,
    applyUpdate,
    dismissUpdate,
  } = useVersionManager();

  if (!isUpdateAvailable) return null;
  if (!remoteVersion || remoteVersion === currentVersion) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-6 right-6 z-[9999] max-w-md w-[calc(100vw-3rem)] pointer-events-auto"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-emerald-950/20 p-5">
          {/* Subtle accent backdrop */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#286038] via-emerald-500 to-[#103020]" />
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-emerald-50 blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={dismissUpdate}
            disabled={isRefreshing}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
            title="Dismiss"
          >
            <X size={15} />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F4F8F4] text-[#286038] border border-[#A8C898] flex items-center justify-center shrink-0 shadow-xs">
              <ArrowUpCircle size={20} />
            </div>

            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#286038] bg-[#F4F8F4] px-2 py-0.5 rounded-md border border-[#A8C898]/60">
                  New Update
                </span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  v{currentVersion}
                  <ArrowRight size={11} className="text-slate-400" />
                  <span className="text-[#286038]">v{remoteVersion}</span>
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                A new version of inventQ is available!
              </h4>

              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {releaseNotes ||
                  'Updates include retail calculations, POS improvements, and faster offline caching.'}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={applyUpdate}
                  disabled={isRefreshing}
                  style={{
                    background: `linear-gradient(135deg, var(--t-primary, #286038), var(--t-sidebar-via, #103020))`,
                    boxShadow: `0 3px 10px var(--t-btn-shadow, rgba(40, 96, 56, 0.3))`,
                  }}
                  className="flex-1 flex items-center justify-center gap-2 text-white font-semibold text-xs h-9 px-4 rounded-xl transition-all hover:opacity-95 active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw
                    size={13}
                    className={isRefreshing ? 'animate-spin' : ''}
                  />
                  <span>{isRefreshing ? 'Refreshing…' : 'Refresh & Update Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={dismissUpdate}
                  disabled={isRefreshing}
                  className="px-3 h-9 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

