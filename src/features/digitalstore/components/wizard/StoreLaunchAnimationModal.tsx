import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Store,
  Wifi,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Truck,
  Zap,
  ArrowRight,
  Radio,
  Loader2,
} from "lucide-react";

interface StoreLaunchModalProps {
  isOpen: boolean;
  storeName: string;
  category?: string;
  isComplete: boolean;
  error?: string | null;
  onFinished: () => void;
  onRetry?: () => void;
}

const LAUNCH_PHASES = [
  {
    step: 1,
    title: "Rolling Up Storefront Shutter",
    subtitle: "Turning on counter lights & activating digital registers...",
    icon: Store,
    progress: 30,
  },
  {
    step: 2,
    title: "Syncing Catalog & Pricing to Cloud",
    subtitle: "Configuring online prices, barcodes & thermal billing...",
    icon: ShoppingBag,
    progress: 60,
  },
  {
    step: 3,
    title: "Configuring Hyperlocal Delivery Zones",
    subtitle: "Enabling instant 12h delivery, pickup & live radius routing...",
    icon: Truck,
    progress: 88,
  },
  {
    step: 4,
    title: "Storefront is NOW LIVE Online!",
    subtitle: "Broadcasting your digital store to customers across the region 🚀",
    icon: Wifi,
    progress: 100,
  },
];

export const StoreLaunchAnimationModal: React.FC<StoreLaunchModalProps> = ({
  isOpen,
  storeName,
  category = "Retail Store",
  isComplete,
  error,
  onFinished,
  onRetry,
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(20);
  const [shutterOpen, setShutterOpen] = useState(false);
  const [lightsOn, setLightsOn] = useState(false);
  const [signalsActive, setSignalsActive] = useState(false);

  // Lock body scroll while modal is active
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

  // Phase transition sequence
  useEffect(() => {
    if (!isOpen) {
      setPhaseIndex(0);
      setProgress(20);
      setShutterOpen(false);
      setLightsOn(false);
      setSignalsActive(false);
      return;
    }

    // Step 1: Lights switch ON
    const t1 = setTimeout(() => {
      setLightsOn(true);
      setProgress(40);
      setPhaseIndex(1);
    }, 600);

    // Step 2: Shutter rolls up
    const t2 = setTimeout(() => {
      setShutterOpen(true);
      setProgress(70);
      setPhaseIndex(2);
    }, 1400);

    // Step 3: Broadcast signals activate
    const t3 = setTimeout(() => {
      setSignalsActive(true);
      setProgress(90);
      setPhaseIndex(3);
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  // When backend completion occurs
  useEffect(() => {
    if (isOpen && isComplete && !error) {
      const t = setTimeout(() => {
        setProgress(100);
        setPhaseIndex(3);
        setShutterOpen(true);
        setLightsOn(true);
        setSignalsActive(true);
      }, 2500);

      return () => clearTimeout(t);
    }
  }, [isOpen, isComplete, error]);

  if (!isOpen) return null;

  const currentPhase = LAUNCH_PHASES[phaseIndex];
  const isReady = isComplete && progress >= 90;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* ─── MODAL CARD (LIGHT ROYAL BLUE THEME) ─── */}
      <div className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-blue-950/20 overflow-hidden text-slate-900 flex flex-col items-center animate-in zoom-in-95 duration-200">
        
        {/* Soft Ambient Brand Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ─── PHYSICAL TO DIGITAL STORE ANIMATION ─── */}
        <div className="relative w-full flex flex-col items-center justify-center pt-1 pb-4">
          
          {/* Signal / Radar Waves */}
          <div className="relative mb-2 flex items-center justify-center">
            {signalsActive && (
              <>
                <div className="absolute -top-7 w-20 h-20 rounded-full border border-blue-400/40 animate-ping pointer-events-none" />
                <div className="absolute -top-11 w-32 h-32 rounded-full border border-emerald-400/30 animate-pulse pointer-events-none" />
              </>
            )}

            {/* Live Online Signal Badge */}
            <div className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 transition-all duration-300 shadow-2xs ${
              signalsActive 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300/80" 
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              {signalsActive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>TRANSMITTING LIVE ONLINE</span>
                  <Radio size={12} className="text-emerald-600 animate-pulse" />
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>SYNCHRONIZING STOREFRONT</span>
                </>
              )}
            </div>
          </div>

          {/* ─── PHYSICAL STOREFRONT BUILDING ─── */}
          <div className="relative w-64 sm:w-72 bg-white border-2 border-slate-200 rounded-2xl shadow-md overflow-hidden mt-2">
            
            {/* Storefront Striped Awning */}
            <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-4 py-2.5 text-center text-white overflow-hidden">
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none" 
                style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff, #fff 10px, transparent 10px, transparent 20px)" }}
              />
              <span className="relative z-10 font-black text-xs sm:text-sm tracking-wide uppercase drop-shadow-xs block truncate">
                {storeName || "Your Retail Store"}
              </span>
              <p className="relative z-10 text-[9px] text-blue-100 font-bold tracking-widest uppercase truncate">
                {category}
              </p>

              {/* Scalloped Awning Valance */}
              <svg className="absolute -bottom-0.5 left-0 right-0 w-full h-2 text-white fill-current" preserveAspectRatio="none" viewBox="0 0 120 6">
                <path d="M0,0 Q10,6 20,0 Q30,6 40,0 Q50,6 60,0 Q70,6 80,0 Q90,6 100,0 Q110,6 120,0 L120,6 L0,6 Z"/>
              </svg>
            </div>

            {/* Store Interior Showcase */}
            <div className={`relative h-28 w-full transition-colors duration-500 flex items-center justify-center p-3 overflow-hidden ${
              lightsOn ? "bg-amber-50/60" : "bg-slate-900"
            }`}>
              
              {/* Inside Store Shelves & Cashier Counter */}
              <div className={`w-full h-full flex flex-col justify-between transition-opacity duration-500 ${
                lightsOn ? "opacity-100" : "opacity-0"
              }`}>
                {/* Product Shelves */}
                <div className="flex justify-around items-end pt-1">
                  <span className="w-5 h-6 rounded bg-blue-600 shadow-2xs border border-blue-400" />
                  <span className="w-6 h-5 rounded bg-emerald-600 shadow-2xs border border-emerald-400" />
                  <span className="w-4 h-7 rounded bg-amber-500 shadow-2xs border border-amber-300" />
                  <span className="w-5 h-6 rounded bg-purple-600 shadow-2xs border border-purple-400" />
                  <span className="w-6 h-6 rounded bg-rose-600 shadow-2xs border border-rose-400" />
                </div>
                
                {/* Shelf Plank */}
                <div className="h-1 bg-amber-700/30 rounded-full w-full" />

                {/* Counter & POS Register */}
                <div className="flex items-center justify-between px-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[8px] font-bold font-mono">POS</span>
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[9px] shadow-2xs flex items-center gap-1">
                    <Sparkles size={9} />
                    <span>ONLINE</span>
                  </div>
                </div>
              </div>

              {/* ─── ANIMATED ROLLING METAL SHUTTER ─── */}
              <div 
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 border-b-2 border-slate-400 shadow-md transition-all duration-700 ease-in-out flex flex-col justify-around px-2 z-20"
                style={{
                  height: shutterOpen ? "0%" : "100%",
                  opacity: shutterOpen ? 0 : 1,
                }}
              >
                <div className="w-full h-0.5 bg-slate-400/40" />
                <div className="w-full h-0.5 bg-slate-400/40" />
                <div className="w-full h-0.5 bg-slate-400/40" />
                <div className="w-full h-0.5 bg-slate-400/40" />
                <div className="w-full h-0.5 bg-slate-400/40" />
                
                <div className="mx-auto px-2 py-0.5 bg-white border border-slate-300 rounded text-[9px] font-bold text-slate-700 uppercase tracking-wider shadow-2xs">
                  Opening Store...
                </div>
              </div>

            </div>

            {/* Storefront Ground */}
            <div className="h-2.5 bg-slate-100 border-t border-slate-200" />
          </div>
        </div>

        {/* ─── PROGRESS & STEP HIGHLIGHTS ─── */}
        <div className="w-full space-y-4">
          
          {/* Active Phase Heading */}
          <div className="text-center space-y-1">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
              <currentPhase.icon size={18} className={isReady ? "text-emerald-600" : "text-blue-600 animate-bounce"} />
              <span>{currentPhase.title}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              {currentPhase.subtitle}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <Zap size={12} className="text-blue-600" />
                <span>Hyperlocal Digital Sync</span>
              </span>
              <span className="text-blue-700 font-mono">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Checklist Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2 border transition-all ${
              lightsOn 
                ? "bg-blue-50/60 border-blue-200 text-blue-900" 
                : "bg-slate-50 border-slate-200/70 text-slate-400"
            }`}>
              <CheckCircle2 size={14} className={lightsOn ? "text-blue-600" : "text-slate-300"} />
              <span className="truncate">Digital Catalog Synced</span>
            </div>

            <div className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2 border transition-all ${
              shutterOpen 
                ? "bg-blue-50/60 border-blue-200 text-blue-900" 
                : "bg-slate-50 border-slate-200/70 text-slate-400"
            }`}>
              <CheckCircle2 size={14} className={shutterOpen ? "text-blue-600" : "text-slate-300"} />
              <span className="truncate">12h Delivery Zones</span>
            </div>

            <div className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2 border transition-all ${
              signalsActive 
                ? "bg-blue-50/60 border-blue-200 text-blue-900" 
                : "bg-slate-50 border-slate-200/70 text-slate-400"
            }`}>
              <CheckCircle2 size={14} className={signalsActive ? "text-blue-600" : "text-slate-300"} />
              <span className="truncate">Live Storefront URL</span>
            </div>

            <div className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2 border transition-all ${
              isReady 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" 
                : "bg-slate-50 border-slate-200/70 text-slate-400"
            }`}>
              <CheckCircle2 size={14} className={isReady ? "text-emerald-600" : "text-slate-300"} />
              <span className="truncate">Counter POS Synced</span>
            </div>
          </div>

          {/* Error Message & Retry */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center space-y-2">
              <p className="text-xs text-rose-700 font-semibold">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  Retry Launching Store
                </button>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 w-full">
            <button
              type="button"
              onClick={onFinished}
              disabled={!isReady && !error}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer ${
                isReady
                  ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 text-white shadow-blue-600/25 active:scale-98"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              {isReady ? (
                <>
                  <span>Enter Your Live Store Dashboard</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span>Launching Digital Storefront…</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default StoreLaunchAnimationModal;
