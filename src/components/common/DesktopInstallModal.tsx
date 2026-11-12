import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Download, Laptop, X, ShieldCheck, Zap, Printer, AppWindow, Smartphone, Check, ArrowUpRight } from 'lucide-react';
import { downloadDesktopShortcut } from '@/hooks/usePWAInstall';

interface DesktopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall?: () => void;
  isPromptReady?: boolean;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isPromptReady = false,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!isOpen) return null;

  const handleDownloadShortcut = () => {
    downloadDesktopShortcut();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 4000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-100 z-10"
        >
          {/* Header Banner */}
          <div
            style={{
              background: `linear-gradient(135deg, var(--t-sidebar-from, #286038) 0%, var(--t-sidebar-via, #174B2E) 50%, var(--t-sidebar-to, #0D3522) 100%)`,
            }}
            className="relative p-4 sm:p-6 text-white overflow-hidden"
          >
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute top-2 right-16 w-20 h-20 rounded-full bg-white/5 blur-lg pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/25">
                  <Laptop size={28} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/95 bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                      Desktop Web App
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-200">
                      <AppWindow size={11} /> Standalone
                    </span>
                  </div>
                  <h3 className="text-xl font-black mt-1 text-white tracking-tight">Install inventQ App</h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-white/90 mt-3.5 leading-relaxed">
              Run inventQ as a standalone desktop or home screen app for lightning-fast POS billing, hardware printer access, and distraction-free fullscreen window.
            </p>
          </div>

          {/* App Advantages Grid */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className="p-3 rounded-xl border"
                style={{
                  backgroundColor: 'var(--t-primary-lighter, #EAF4E6)',
                  borderColor: 'var(--t-primary-light, #D5E8D0)',
                }}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1" style={{ color: 'var(--t-primary, #286038)' }}>
                  <Zap size={14} />
                  <span>Instant Launch</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Launches immediately from your Windows Taskbar, macOS Dock, or Desktop.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                  <Printer size={14} className="text-emerald-600" />
                  <span>Direct POS Printing</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Hardware access for WebBluetooth, WebUSB, and WebSerial thermal printers.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-100/80">
                <div className="flex items-center gap-2 text-violet-700 font-bold text-xs mb-1">
                  <Monitor size={14} className="text-violet-600" />
                  <span>Dedicated Window</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  No browser tabs or address bar clutter. Fullscreen high-speed ERP experience.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100/80">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1">
                  <ShieldCheck size={14} className="text-amber-600" />
                  <span>Automatic Sync</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Always stays up-to-date with automatic background updates & cache sync.
                </p>
              </div>
            </div>

            {/* Address bar install hint for Chrome / Edge / Brave */}
            {!isMobile && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#286038] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowUpRight size={16} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">
                    Direct Browser Install Available:
                  </p>
                  <p className="text-slate-600 text-[11.5px] mt-0.5">
                    Click the <strong>Install icon (⊕ / ⤓)</strong> in your browser address bar (top-right next to the URL) to add inventQ directly to your PC.
                  </p>
                </div>
              </div>
            )}

            {/* Platform instructions */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-slate-800">
                {isMobile ? (
                  <>
                    <Smartphone size={14} style={{ color: 'var(--t-primary, #286038)' }} className="shrink-0" />
                    <span>Mobile Browser Installation:</span>
                  </>
                ) : isMac ? (
                  <>
                    <Monitor size={14} style={{ color: 'var(--t-primary, #286038)' }} className="shrink-0" />
                    <span>macOS (Safari / Chrome / Edge):</span>
                  </>
                ) : (
                  <>
                    <Monitor size={14} style={{ color: 'var(--t-primary, #286038)' }} className="shrink-0" />
                    <span>Windows / Linux (Chrome / Brave / Edge):</span>
                  </>
                )}
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-slate-600 pl-0.5">
                {isMobile ? (
                  <>
                    <li>Tap the browser menu <strong>(⋮ or Share)</strong>.</li>
                    <li>Select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.</li>
                    <li>Open inventQ directly from your phone's home screen.</li>
                  </>
                ) : isMac ? (
                  <>
                    <li>In Chrome/Edge, click the <strong>Install icon (⊕ / ⤓)</strong> in the URL bar.</li>
                    <li>In Safari, click <strong>File</strong> &rarr; <strong>Add to Dock...</strong></li>
                    <li>Launch inventQ directly from your macOS Dock.</li>
                  </>
                ) : (
                  <>
                    <li>Click the <strong>Install icon (⊕ / ⤓)</strong> on the right side of your Chrome/Brave/Edge address bar.</li>
                    <li>Or click <strong>⋮ (Menu)</strong> &rarr; <strong>Save and share</strong> &rarr; <strong>Install inventQ</strong>.</li>
                    <li>A desktop shortcut and Start Menu entry will be created automatically.</li>
                  </>
                )}
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                {isPromptReady && onInstall ? (
                  <button
                    type="button"
                    onClick={() => {
                      onInstall();
                      onClose();
                    }}
                    style={{
                      background: `linear-gradient(135deg, var(--t-primary, #286038), var(--t-sidebar-via, #103020))`,
                      boxShadow: `0 4px 14px var(--t-btn-shadow, rgba(40, 96, 56, 0.35))`,
                    }}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 text-white font-bold h-11 px-5 rounded-xl transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer text-sm"
                  >
                    <Download size={16} />
                    <span>Trigger Browser Install</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleDownloadShortcut}
                  style={{
                    background: !(isPromptReady && onInstall)
                      ? `linear-gradient(135deg, var(--t-primary, #286038), var(--t-sidebar-via, #103020))`
                      : undefined,
                    boxShadow: !(isPromptReady && onInstall)
                      ? `0 4px 14px var(--t-btn-shadow, rgba(40, 96, 56, 0.35))`
                      : undefined,
                  }}
                  className={`w-full sm:flex-1 flex items-center justify-center gap-2 font-bold h-11 px-5 rounded-xl transition-all active:scale-[0.98] cursor-pointer text-sm ${
                    !(isPromptReady && onInstall)
                      ? 'text-white hover:opacity-95'
                      : 'bg-[#F4F8F4] text-[#286038] border border-[#A8C898] hover:bg-[#EAF4E6]'
                  }`}
                >
                  {downloaded ? (
                    <>
                      <Check size={16} className="text-emerald-500" />
                      <span>Downloaded Successfully!</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Direct Download Desktop App (.url)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 h-11 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors text-sm cursor-pointer"
                >
                  Close
                </button>
              </div>

              {downloaded && (
                <p className="text-[11.5px] text-center text-emerald-700 font-medium animate-in fade-in">
                  Shortcut downloaded! Drag it to your Desktop or pin to Taskbar to open inventQ anytime.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
