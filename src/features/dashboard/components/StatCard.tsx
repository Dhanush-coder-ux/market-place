import React from 'react';

export const StatCard = ({
  title, value, change, positive, subtitle, icon, accent,
}: {
  title: string; value: string; change: string; positive: boolean;
  subtitle: string; icon: React.ReactNode; accent: string;
}) => (
  <div className="relative bg-white rounded-lg p-4 sm:p-5 border border-slate-200 hover:border-slate-300 transition-all duration-200 group min-w-[150px] flex-shrink-0 sm:min-w-0 sm:flex-1 overflow-hidden ring-inset">
    <div className="flex items-start justify-between mb-2.5 sm:mb-3 gap-2">
      <p className="text-slate-500 text-xs sm:text-sm font-medium">{title}</p>
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-base sm:text-lg shrink-0 ${accent}`}>
        {icon}
      </div>
    </div>
    <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-1">
      <span className="text-xl sm:text-2xl font-semibold text-slate-800 tracking-tight break-all">{value}</span>
      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md mb-0.5 ${positive ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
        {positive ? "▲" : "▼"} {change}
      </span>
    </div>
    <p className="text-xs text-slate-400">{subtitle}</p>
  </div>
);

