import { LucideIcon } from "lucide-react";

type LowStockCardProps = {
  value: number | string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  theme?: "red" | "yellow" | "green" | "blue";
};

const THEMES = {
  red: {
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    valueColor: "text-red-600",
    gradient: "from-blue-500 to-cyan-400",
  },
  yellow: {
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    valueColor: "text-yellow-600",
    gradient: "from-yellow-500 to-orange-400",
  },
  green: {
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    valueColor: "text-green-600",
    gradient: "from-green-500 to-emerald-400",
  },
  blue: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    valueColor: "text-blue-600",
    gradient: "from-blue-500 to-cyan-400",
  },
};

const HeaderCard: React.FC<LowStockCardProps> = ({
  value,
  title = "Lowest Stock",
  subtitle = "Items in critical level",
  icon: Icon,
  theme = "red",
}) => {
  const style = THEMES[theme];

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-[2px] 
        bg-gradient-to-r ${style.gradient}
        shadow-md hover:shadow-xl transition-all duration-300
      `}
    >
      <div className="bg-white rounded-[1rem] p-5 flex items-center gap-4">

        {/* Icon */}
        <div className={`w-12 h-12 ${style.iconBg} rounded-xl flex items-center justify-center`}>
          {Icon && <Icon className={style.iconColor} size={26} />}
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <span className={`text-3xl font-bold ${style.valueColor}`}>{value}</span>
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <span className="text-xs text-slate-400">{subtitle}</span>
        </div>

      </div>
    </div>
  );
};

export default HeaderCard;
