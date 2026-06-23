// ─── ProfileAbout — Store description + GST & Business Type tiles ───────────

import React from "react";
import { Store, FileText, ShieldCheck } from "lucide-react";
import SectionCard from "./ui/SectionCard";
import type { NormalisedShop } from "../types";

interface ProfileAboutProps {
  shop: NormalisedShop;
}

const ProfileAbout: React.FC<ProfileAboutProps> = ({ shop }) => {
  const { description, gstNumber, businessType, currency } = shop;

  return (
    <SectionCard
      title="About Store"
      subtitle="Store description & overview"
      icon={<Store size={16} className="text-blue-600" />}
      iconBg="bg-blue-50"
    >
      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>

      {/* Info Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {/* GST */}
        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <FileText size={15} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
              GST Number
            </p>
            <p className="text-sm font-bold text-slate-800 font-mono truncate">
              {gstNumber}
            </p>
          </div>
        </div>

        {/* Business Type */}
        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={15} className="text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
              Business Type
            </p>
            <p className="text-sm font-bold text-slate-800 truncate">
              {businessType}
            </p>
          </div>
        </div>

        {/* Currency */}
        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-emerald-700 font-black text-sm">₹</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
              Currency
            </p>
            <p className="text-sm font-bold text-slate-800 truncate">
              {currency}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default ProfileAbout;
