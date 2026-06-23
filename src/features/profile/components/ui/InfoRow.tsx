// ─── InfoRow — Labelled icon + value row with accent variants ────────────────

import React from "react";

type Accent = "blue" | "emerald" | "purple" | "orange" | "rose";

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: Accent;
  /** Optional right-side slot (e.g. a copy button) */
  suffix?: React.ReactNode;
}

const accentMap: Record<Accent, string> = {
  blue:    "bg-blue-50    text-blue-600    border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  purple:  "bg-purple-50  text-purple-600  border-purple-100",
  orange:  "bg-orange-50  text-orange-500  border-orange-100",
  rose:    "bg-rose-50    text-rose-500    border-rose-100",
};

const InfoRow: React.FC<InfoRowProps> = ({
  icon,
  label,
  value,
  accent = "blue",
  suffix,
}) => (
  <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${accentMap[accent]}`}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
    </div>
    {suffix && <div className="shrink-0">{suffix}</div>}
  </div>
);

export default InfoRow;
