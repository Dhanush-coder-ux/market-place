import React from "react";

interface StatsCardProps {
  label: string;
  value?: string | number;
  prefix?: string;
  icon?: any; 
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatsCardProps> = React.memo(({
  label,
  value,
  prefix = "",
  icon: Icon,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  valueColor = "text-slate-800",
  className = "",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-2.5 pr-4 shadow-sm border border-slate-100 flex items-center gap-3 group hover:shadow-md hover:border-slate-200 transition-all cursor-pointer min-w-[160px] sm:min-w-0 sm:flex-1 shrink-0 ${className}`}
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
      <div className="flex flex-col justify-center py-0.5 min-w-0">
        <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-widest leading-none mb-1.5 truncate">
          {label}
        </span>
        <span className={`text-base font-semibold tracking-tight leading-none truncate ${valueColor}`}>
          {prefix}{value ?? 0}
        </span>
      </div>
    </div>
  );
});

export const StatsCard = StatCard;