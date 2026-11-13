import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import lottie, { AnimationItem } from "lottie-web";
import {
  Store,
  Wifi,
  CheckCircle2,
  ShoppingBag,
  Truck,
  Zap,
  ArrowRight,
  Radio,
  Loader2,
} from "lucide-react";
import shopAnimationData from "@/assets/lottie/Shop-animation.json";

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
    title: "Initializing Digital Storefront",
    subtitle: "Activating online store profile & cloud registers...",
    icon: Store,
    progress: 30,
  },
  {
    step: 2,
    title: "Syncing Catalog & Pricing to Cloud",
    subtitle: "Configuring online prices, barcodes & digital catalog...",
    icon: ShoppingBag,
    progress: 60,
  },
  {
    step: 3,
    title: "Configuring Hyperlocal Delivery Zones",
    subtitle: "Enabling delivery radius, pickup & store routing...",
    icon: Truck,
    progress: 88,
  },
  {
    step: 4,
    title: "Your Store Is Now Live Online!",
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
  const [progress, setProgress] = useState(25);
  const [signalsActive, setSignalsActive] = useState(false);

  const animContainerRef = useRef<HTMLDivElement>(null);
  const animInstanceRef = useRef<AnimationItem | null>(null);
  const hasPlayedRef = useRef(false);

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

  // Phase transition sequence while publishing
  useEffect(() => {
    if (!isOpen) {
      setPhaseIndex(0);
      setProgress(25);
      setSignalsActive(false);
      hasPlayedRef.current = false;
      if (animInstanceRef.current) {
        animInstanceRef.current.destroy();
        animInstanceRef.current = null;
      }
      return;
    }

    if (isComplete) {
      setProgress(100);
      setPhaseIndex(3);
      setSignalsActive(true);
      return;
    }

    // Step 1 -> Step 2
    const t1 = setTimeout(() => {
      setProgress(55);
      setPhaseIndex(1);
    }, 600);

    // Step 2 -> Step 3
    const t2 = setTimeout(() => {
      setProgress(85);
      setPhaseIndex(2);
      setSignalsActive(true);
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen, isComplete]);

  // When backend confirms publication is complete
  useEffect(() => {
    if (isOpen && isComplete && !error) {
      setProgress(100);
      setPhaseIndex(3);
      setSignalsActive(true);
    }
  }, [isOpen, isComplete, error]);

  // Lottie Animation Lifecycle:
  // ONLY render & play after backend confirms success (isComplete === true)
  useEffect(() => {
    if (!isOpen || !isComplete || error) {
      return;
    }

    // Prevent duplicate re-initialization on re-renders
    if (hasPlayedRef.current && animInstanceRef.current) {
      return;
    }

    if (animContainerRef.current) {
      if (animInstanceRef.current) {
        animInstanceRef.current.destroy();
        animInstanceRef.current = null;
      }
      animContainerRef.current.innerHTML = "";

      const anim = lottie.loadAnimation({
        container: animContainerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: shopAnimationData,
      });

      animInstanceRef.current = anim;
      hasPlayedRef.current = true;
    }
  }, [isOpen, isComplete, error]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (animInstanceRef.current) {
        animInstanceRef.current.destroy();
        animInstanceRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const isReady = isComplete && !error;
  const currentPhase = isReady ? LAUNCH_PHASES[3] : LAUNCH_PHASES[phaseIndex];

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      
      {/* ─── MODAL CARD (INVENTQ FOREST GREEN IDENTITY) ─── */}
      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto overflow-x-hidden bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl shadow-emerald-950/20 text-slate-900 flex flex-col items-center animate-in zoom-in-95 duration-200">
        
        {/* Soft Ambient Brand Glow matching InventQ Forest Green */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ─── HEADER BADGE: STORE PUBLICATION STATUS ─── */}
        <div className="relative mb-2 flex flex-col items-center justify-center">
          <div
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 transition-all duration-300 shadow-2xs ${
              isReady
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300/80"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {isReady ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>TRANSMITTING LIVE ONLINE</span>
                <Radio size={12} className="text-emerald-600 animate-pulse" />
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>SYNCHRONIZING STOREFRONT</span>
              </>
            )}
          </div>

          {/* Store Name & Category Sub-label */}
          <div className="text-center mt-2">
            <h4 className="font-black text-sm text-slate-900 tracking-tight block truncate max-w-[280px]">
              {storeName || "Your Retail Store"}
            </h4>
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
              {category}
            </span>
          </div>
        </div>

        {/* ─── DIGITAL STORE LAUNCH LOTTIE ANIMATION CONTAINER ─── */}
        {/* Replaces ONLY the old custom CSS storefront illustration */}
        <div className="w-[190px] h-[190px] sm:w-[220px] sm:h-[220px] flex items-center justify-center my-1 relative z-10 shrink-0">
          <div
            ref={animContainerRef}
            className={`w-full h-full transition-opacity duration-300 ${isReady ? "block" : "hidden"}`}
          />
          {!isReady && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-emerald-100 border-t-emerald-600 animate-spin" />
                <Store size={22} className="absolute inset-0 m-auto text-emerald-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider animate-pulse">
                Publishing Store Online...
              </p>
            </div>
          )}
        </div>

        {/* ─── PROGRESS & STEP HIGHLIGHTS ─── */}
        <div className="w-full space-y-3.5 mt-1">
          
          {/* Active Phase Heading */}
          <div className="text-center space-y-1">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
              <currentPhase.icon size={18} className={isReady ? "text-emerald-600" : "text-emerald-600 animate-bounce"} />
              <span>{isReady ? "Your Store Is Now Live Online!" : currentPhase.title}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              {currentPhase.subtitle}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <Zap size={12} className="text-emerald-600" />
                <span>Hyperlocal Digital Sync</span>
              </span>
              <span className="text-emerald-700 font-mono">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Synchronization Status Checklist Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div className={`p-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 border transition-all ${
              isReady || phaseIndex >= 1 
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" 
                : "bg-slate-50 border-slate-200/70 text-slate-400"
            }`}>
              <CheckCircle2 size={14} className={isReady || phaseIndex >= 1 ? "text-emerald-600" : "text-slate-300"} />
              <span className="truncate">Digital Catalog Synced</span>
            </div>

            <div className={`p-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 border transition-all ${
              isReady || phaseIndex >= 2 
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" 
                : "bg-slate-50 border-slate-200/70 text-slate-400"
            }`}>
              <CheckCircle2 size={14} className={isReady || phaseIndex >= 2 ? "text-emerald-600" : "text-slate-300"} />
              <span className="truncate">Delivery Zones Synced</span>
            </div>

            <div className={`p-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 border transition-all ${
              isReady || signalsActive 
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" 
                : "bg-slate-50 border-slate-200/70 text-slate-400"
            }`}>
              <CheckCircle2 size={14} className={isReady || signalsActive ? "text-emerald-600" : "text-slate-300"} />
              <span className="truncate">Live Storefront URL</span>
            </div>

            <div className={`p-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 border transition-all ${
              isReady 
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 font-bold" 
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

          {/* Action Button: Enter Your Live Store Dashboard */}
          <div className="pt-1 w-full">
            <button
              type="button"
              onClick={onFinished}
              disabled={!isReady}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer ${
                isReady
                  ? "bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white shadow-emerald-600/25 active:scale-98"
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
                  <Loader2 size={16} className="animate-spin text-emerald-600" />
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
