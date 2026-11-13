import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import lottie, { AnimationItem } from "lottie-web";
import baseAnimationData from "@/assets/lottie/billing_animation.json";

export interface BillingLoadingModalProps {
  isOpen: boolean;
  type: "BILL" | "INVOICE";
}

export const BillingLoadingModal: React.FC<BillingLoadingModalProps> = ({
  isOpen,
  type,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  const heading = type === "INVOICE" ? "INVOICE" : "BILL";
  const loadingText =
    type === "INVOICE" ? "Generating your invoice..." : "Generating your bill...";

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Clean up any existing instance first
    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }
    containerRef.current.innerHTML = "";

    // 1. Re-use the same base Lottie animation asset and dynamically update receipt heading
    const clonedData = JSON.parse(JSON.stringify(baseAnimationData));
    const headerLayer = clonedData.layers?.find((l: any) => l.nm === "header");
    if (headerLayer?.t?.d?.k?.[0]?.s) {
      headerLayer.t.d.k[0].s.t = heading;
    }

    // 2. Initialize and loop animation immediately
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: clonedData,
    });

    animRef.current = anim;

    return () => {
      anim.destroy();
      animRef.current = null;
    };
  }, [isOpen, heading]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={loadingText}
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-[340px] sm:max-w-[360px] p-6 sm:p-7 flex flex-col items-center text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle decorative background glow matching brand */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Lottie Animation Canvas Container */}
        <div className="w-[240px] h-[240px] sm:w-[260px] sm:h-[260px] flex items-center justify-center -my-2 relative z-10">
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {/* Dynamic Loading Message */}
        <div className="space-y-1.5 relative z-10 mt-1">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {loadingText}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Please wait while we record and verify the transaction.
          </p>
        </div>

        {/* Live Processing Indicator */}
        <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider relative z-10">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Processing {heading}</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BillingLoadingModal;

