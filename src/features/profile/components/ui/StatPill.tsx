// ─── StatPill — Compact stat widget for the hero section ────────────────────

import React from "react";

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  /** Full tailwind class string for the pill surface (bg + border + text) */
  color: string;
}

const StatPill: React.FC<StatPillProps> = ({ icon, label, value, color }) => (
  <div
    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${color} flex-1 min-w-[110px]`}
  >
    <div className="shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 leading-none mb-0.5">
        {label}
      </p>
      <p className="text-sm font-bold truncate">{value}</p>
    </div>
  </div>
);

export default StatPill;
