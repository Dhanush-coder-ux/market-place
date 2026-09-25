import React from "react";
import { ShieldAlert, ArrowRight, Store, Lock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionExpiredLockScreenProps {
  planName?: string;
  shopName?: string;
}

export const SubscriptionExpiredLockScreen: React.FC<SubscriptionExpiredLockScreenProps> = ({
  planName = "Basic Plan",
  shopName
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 w-full h-full min-h-[500px] flex items-center justify-center p-4 md:p-8 bg-slate-100/60 overflow-y-auto">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-10 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-red-500/25 animate-bounce-subtle">
            <Lock size={36} strokeWidth={2.2} />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 bg-amber-400 text-slate-950 p-1.5 rounded-full border-2 border-white shadow-sm">
            <ShieldAlert size={14} />
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-black uppercase tracking-wider">
            Subscription Expired
          </span>
          {shopName && (
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
              {shopName}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Your Workspace is Locked
        </h2>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
          Your <strong className="text-slate-700">{planName}</strong> has ended. All CRUD operations, POS billing, data views, and digital store online listings are paused.
        </p>

        {/* Status Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">POS &amp; Billing</div>
            <div className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Locked
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock &amp; Catalogue</div>
            <div className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Locked
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Digital Store</div>
            <div className="text-xs font-bold text-amber-600 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Offline
            </div>
          </div>
        </div>

        {/* Safe Data Note */}
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100/80 text-emerald-800 text-[11.5px] mb-8 flex items-center justify-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600 flex-none" />
          <span>All your catalogues, sales, customers, and invoice records are safely preserved.</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>View Plans &amp; Renew</span>
            <ArrowRight size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => navigate("/shop-select")}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Store size={16} />
            <span>Switch Workspace</span>
          </button>
        </div>

      </div>
    </div>
  );
};
