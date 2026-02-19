import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: "blue" | "green" | "red" | "orange" | "yellow";
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  orange: "bg-orange-50 text-orange-600",
  yellow: "bg-yellow-50 text-yellow-600",
};

const StatsCard: React.FC<StatsCardProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  description, 
  color = "blue" 
}) => {
  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm transition-all hover:border-blue-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-tight">
            {label}
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {value}
          </h3>
        </div>
        
        {Icon && (
          <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${colorMap[color]}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>

      {(trend || description) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
          {trend && (
            <span className={`font-bold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'}{trend.value}%
            </span>
          )}
          {description && (
            <span className="text-gray-400 line-clamp-1">{description}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsCard;