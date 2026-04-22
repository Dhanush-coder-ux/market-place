import React from "react";
import { LucideIcon } from "lucide-react";

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
      className={`bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all cursor-pointer ${className}`}
    >
      {Icon && (
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} group-hover:scale-110 transition-transform ${iconColor}`}>
          {React.isValidElement(Icon) ? Icon : (
            typeof Icon === 'string' ? Icon : (
              Icon && <Icon size={22} className="text-current" />
            )
          )}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5 truncate">
          {label}
        </div>
        <div className={`text-xl font-bold tracking-tight truncate ${valueColor}`}>
          {prefix}{value ?? 0}
        </div>
      </div>
    </div>
  );
};

export const StatsCard = StatCard;