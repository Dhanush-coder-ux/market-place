import React from "react";
import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";

type LowStockCardProps = {
  value: number | string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  theme?: "red" | "yellow" | "green" | "blue" | "purple";
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  onClick?: () => void;
};

const THEMES = {
  red: {
    bg: "bg-red-50 hover:bg-red-100/80",
    border: "border-red-100",
    iconBg: "bg-white text-red-600 shadow-red-100",
    text: "text-red-900",
    subtext: "text-red-600/80",
    trend: "text-red-600 bg-red-100",
    ring: "focus:ring-red-500/20",
    accent: "bg-red-500",
  },
  yellow: {
    bg: "bg-amber-50 hover:bg-amber-100/80",
    border: "border-amber-100",
    iconBg: "bg-white text-amber-600 shadow-amber-100",
    text: "text-amber-900",
    subtext: "text-amber-600/80",
    trend: "text-amber-700 bg-amber-100",
    ring: "focus:ring-amber-500/20",
    accent: "bg-amber-500",
  },
  green: {
    bg: "bg-emerald-50 hover:bg-emerald-100/80",
    border: "border-emerald-100",
    iconBg: "bg-white text-emerald-600 shadow-emerald-100",
    text: "text-emerald-900",
    subtext: "text-emerald-600/80",
    trend: "text-emerald-600 bg-emerald-100",
    ring: "focus:ring-emerald-500/20",
    accent: "bg-emerald-500",
  },
  blue: {
    bg: "bg-blue-50 hover:bg-blue-100/80",
    border: "border-blue-100",
    iconBg: "bg-white text-blue-600 shadow-blue-100",
    text: "text-blue-900",
    subtext: "text-blue-600/80",
    trend: "text-blue-600 bg-blue-100",
    ring: "focus:ring-blue-500/20",
    accent: "bg-blue-500",
  },
  purple: {
    bg: "bg-violet-50 hover:bg-violet-100/80",
    border: "border-violet-100",
    iconBg: "bg-white text-violet-600 shadow-violet-100",
    text: "text-violet-900",
    subtext: "text-violet-600/80",
    trend: "text-violet-600 bg-violet-100",
    ring: "focus:ring-violet-500/20",
    accent: "bg-violet-500",
  },
};

const HeaderCard: React.FC<LowStockCardProps> = ({
  value,
  title = "Stat",
  subtitle,
  icon: Icon,
  theme = "red",
  trend,
  trendDirection = "neutral",
  onClick,
}) => {
  const t = THEMES[theme];

  return (
    <div
      onClick={onClick}
      // CHANGED: reduced padding (p-3), reduced rounded (rounded-xl)
      className={`
        group relative w-full overflow-hidden rounded-xl border ${t.border} ${t.bg}
        p-3 transition-all duration-300 ease-in-out
        hover:-translate-y-1 hover:shadow-lg hover:shadow-${theme}-500/10 cursor-pointer
        active:scale-[0.98] active:shadow-sm z-0
      `}
    >
      {/* Decorative Background Pattern */}
      <div className="absolute right-0 top-0 -mt-2 -mr-2 h-16 w-16 rounded-full bg-current opacity-[0.03] group-hover:scale-150 transition-transform duration-500" />
      
      <div className="relative flex justify-between items-start">
        {/* Left Side: Content */}
        <div className="flex flex-col gap-0.5 z-10">
          {/* CHANGED: text-xs instead of text-sm */}
          <span className={`text-xs font-bold tracking-wide uppercase ${t.subtext}`}>
            {title}
          </span>
          
          <div className="flex items-baseline gap-2 mt-0.5">
            {/* CHANGED: text-2xl instead of text-3xl */}
            <h2 className={`text-2xl font-black tracking-tight ${t.text}`}>
              {value}
            </h2>
          </div>

          {/* Subtitle / Trend Row */}
          <div className="flex items-center gap-2 mt-1.5">
            {trend && (
              <span className={`
                flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md
                ${t.trend}
              `}>
                {trendDirection === "up" && <TrendingUp size={10} />}
                {trendDirection === "down" && <TrendingDown size={10} />}
                {trendDirection === "neutral" && <Minus size={10} />}
                {trend}
              </span>
            )}
            {subtitle && (
              <p className={`text-[10px] font-medium ${t.subtext} opacity-80`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Icon & Action */}
        <div className="flex flex-col items-end justify-between h-full gap-2">
          
          {/* Main Icon - CHANGED: p-2 instead of p-3 */}
          <div className={`
            p-2 rounded-lg shadow-sm ${t.iconBg}
            transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
          `}>
             {/* CHANGED: size={18} instead of 22 */}
            {Icon && <Icon size={18} strokeWidth={2.5} />}
          </div>
        </div>
      </div>
      
      {/* Bottom Progress Bar / Accent Line */}
      <div className={`absolute bottom-0 left-0 h-0.5 w-full ${t.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </div>
  );
};

export default HeaderCard;