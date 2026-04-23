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

export const StatCard: React.FC<StatsCardProps> = ({
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
      className={`bg-white rounded-lg p-1.5 pr-4 shadow-sm border border-slate-200 inline-flex items-center gap-3 group hover:shadow-md hover:border-slate-300 transition-all cursor-pointer w-fit ${className}`}
    >
      {Icon && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg} group-hover:scale-110 transition-transform ${iconColor}`}>
          {React.isValidElement(Icon) ? Icon : (
            typeof Icon === 'string' ? Icon : (
              Icon && <Icon size={14} className="text-current" />
            )
          )}
        </div>
      )}
      <div className="flex flex-col justify-center py-0.5">
        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1 truncate">
          {label}
        </span>
        <span className={`text-sm font-bold tracking-tight leading-none truncate ${valueColor}`}>
          {prefix}{value ?? 0}
        </span>
      </div>
    </div>
  );
};

export const StatsCard = StatCard;