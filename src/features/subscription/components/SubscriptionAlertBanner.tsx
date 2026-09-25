import React, { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { subscriptionApi } from "@/services/api/subscription";
import { SubscriptionData } from "../types";

export const SubscriptionAlertBanner: React.FC = () => {
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const shopId = localStorage.getItem("shop_id") || "default_shop";

  useEffect(() => {
    let isMounted = true;
    const loadSub = async () => {
      try {
        const res = await subscriptionApi.getCurrentSubscription(shopId);
        if (isMounted && res) {
          setSub(res);
        }
      } catch (err) {
        // ignore
      }
    };
    loadSub();
    return () => {
      isMounted = false;
    };
  }, [shopId, location.pathname]);

  const isExpired = sub?.status === "expired";

  if (!isExpired || location.pathname === "/pricing") {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2.5 flex items-center justify-between shadow-lg z-[80] flex-none border-b border-red-700/60 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3">
        <div className="p-1 rounded-full bg-white/20 flex items-center justify-center flex-none">
          <AlertTriangle size={16} className="text-amber-200 animate-pulse" />
        </div>
        <div className="text-xs">
          <span className="font-black uppercase tracking-wider bg-red-900/50 px-2 py-0.5 rounded text-[10px] mr-2">
            Plan Expired
          </span>
          <span className="font-medium text-white/95">
            Your subscription has expired. POS billing, product creation, employee invites, and digital store online listings are paused.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-none">
        <button
          type="button"
          onClick={() => navigate("/pricing")}
          className="bg-white text-red-700 hover:bg-rose-50 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>Renew Subscription</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
