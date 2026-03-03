import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  label: string;
  value?: string | number;
  onClick?: () => void;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: "blue" | "green" | "red" | "orange" | "yellow";
}

const colorMap = {
  blue:   { icon: "bg-indigo-600 shadow-indigo-200",   bar: "bg-indigo-500" },
  green:  { icon: "bg-emerald-600 shadow-emerald-200", bar: "bg-emerald-500" },
  red:    { icon: "bg-rose-600 shadow-rose-200",       bar: "bg-rose-500" },
  orange: { icon: "bg-orange-500 shadow-orange-200",   bar: "bg-orange-400" },
  yellow: { icon: "bg-amber-500 shadow-amber-200",     bar: "bg-amber-400" },
};

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  description,
  color = "blue",
  onClick,
}) => {
  const c = colorMap[color];

  return (
    <div
      onClick={onClick}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      className={`
        relative bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        w-40 flex-shrink-0 
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      {/* Thinner Left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 ${c.bar}`} />

      <div className="pl-3 pr-3 py-3">
        {/* Top row - Compact spacing */}
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            {label}
          </p>
          {Icon && (
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${c.icon}`}>
              <Icon size={14} strokeWidth={2.5} className="text-white" />
            </div>
          )}
        </div>

        {/* Scaled down Value */}
        <p className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2"
           style={{ fontVariantNumeric: "tabular-nums" }}>
          {value ?? "—"}
        </p>

        {/* Footer info - Single line constraint */}
        {(trend || description) && (
          <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
            {trend && (
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                trend.isPositive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}>
                {trend.isPositive
                  ? <TrendingUp size={10} strokeWidth={3} />
                  : <TrendingDown size={10} strokeWidth={3} />
                }
                {trend.value}%
              </span>
            )}
        
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;