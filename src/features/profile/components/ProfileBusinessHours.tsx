// ─── ProfileBusinessHours — Opening / closing time display ──────────────────

import React from "react";
import { Clock, CheckCircle2, Moon } from "lucide-react";
import SectionCard from "./ui/SectionCard";
import type { NormalisedShop } from "../types";

interface ProfileBusinessHoursProps {
  shop: NormalisedShop;
}

const ProfileBusinessHours: React.FC<ProfileBusinessHoursProps> = ({ shop }) => {
  const { openTime, closeTime } = shop;

  // Compute a simple "open now" state
  const isOpenNow = (() => {
    try {
      const now = new Date();
      const [oh, om] = openTime.split(":").map(Number);
      const [ch, cm] = closeTime.split(":").map(Number);
      const current = now.getHours() * 60 + now.getMinutes();
      const open   = oh * 60 + om;
      const close  = ch * 60 + cm;
      return current >= open && current < close;
    } catch {
      return false;
    }
  })();

  return (
    <SectionCard
      title="Business Hours"
      subtitle="Operating schedule"
      icon={<Clock size={16} className="text-orange-500" />}
      iconBg="bg-orange-50"
      headerAction={
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            isOpenNow
              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
              : "bg-slate-50 border-slate-200 text-slate-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOpenNow ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          {isOpenNow ? "Open Now" : "Closed"}
        </span>
      }
    >
      <div className="space-y-3">
        {/* Opening */}
        <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-600">Opens</span>
          </div>
          <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums">
            {openTime}
          </span>
        </div>

        {/* Closing */}
        <div className="flex items-center justify-between p-3.5 bg-red-50/60 rounded-xl border border-red-100">
          <div className="flex items-center gap-2">
            <Moon size={15} className="text-red-400" />
            <span className="text-xs font-bold text-slate-600">Closes</span>
          </div>
          <span className="text-sm font-bold text-red-600 font-mono tabular-nums">
            {closeTime}
          </span>
        </div>
      </div>
    </SectionCard>
  );
};

export default ProfileBusinessHours;
