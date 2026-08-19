import React from "react";

interface StatsCardProps {
  label: string;
  value?: string | number;
  prefix?: string;
  subValue?: string; // Added
  icon?: any; 
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
  valueClassName?: string;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatsCardProps> = React.memo(({
  label,
  value,
  prefix = "",
  subValue, // Added
  icon: Icon,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  valueColor = "text-slate-800",
  valueClassName = "",
  className = "",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-lg p-2.5 pr-4 shadow-sm border border-slate-100 flex items-center gap-3 group hover:shadow-md hover:border-slate-200 transition-all cursor-pointer min-w-[160px] sm:min-w-0 sm:flex-1 shrink-0 overflow-hidden ring-inset ${className}`}
    >
      {Icon && (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg} group-hover:scale-105 transition-transform ${iconColor}`}>
          {React.isValidElement(Icon) ? Icon : (
            typeof Icon === 'string' ? Icon : (
              Icon && <Icon size={16} className="text-current" />
            )
          )}
        </div>
      )}
      <div className="flex flex-col justify-center py-0.5 min-w-0 flex-1">
        <span className="text-[9px] text-slate-400  font-semibold  leading-none mb-1.5 truncate">
          {label}
        </span>
        <div className="flex items-center justify-between gap-2">
          <span className={`text-base font-semibold tracking-tight leading-none truncate ${valueColor} ${valueClassName}`}>
            {prefix}{value ?? 0}
          </span>
          {subValue && (
            <span className="text-[10px] text-slate-400 font-bold  truncate">{subValue}</span>
          )}
        </div>
      </div>
    </div>
  );
});

export const StatsCard = StatCard;

