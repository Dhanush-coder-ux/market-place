import React from "react";
import { LucideIcon } from "lucide-react";

/* =========================
   Types
========================= */

interface StatsCardProps {
  label: string;
  value?: string | number;
  prefix?: string;
  icon?: LucideIcon | string;
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
  onClick?: () => void;
}

/* =========================
   Stat Card Component
========================= */

export const StatCard: React.FC<StatsCardProps> = ({
  label,
  value,
  prefix = "",
  icon: Icon,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-600",
  valueColor = "text-slate-800",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 min-w-[150px] flex-shrink-0 shadow-sm cursor-pointer hover:shadow-md transition"
    >
      {Icon && (
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          {typeof Icon === "string" ? (
            <span className="text-sm leading-none">{Icon}</span>
          ) : (
            <Icon size={15} className={iconColor} />
          )}
        </div>
      )}

      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate leading-none">
          {label}
        </p>

        <p className={`text-sm font-bold mt-1 truncate ${valueColor}`}>
          {prefix}
          {typeof value === "number"
            ? value.toLocaleString("en-IN")
            : value ?? 0}
        </p>
      </div>
    </div>
  );
};