import React from 'react';

export const StatCard = ({
  title, value, change, positive, subtitle, icon, accent,
}: {
  title: string; value: string; change: string; positive: boolean;
  subtitle: string; icon: React.ReactNode; accent: string;
}) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group min-w-[160px] flex-shrink-0 sm:min-w-0 sm:flex-1">
    <div className="flex items-start justify-between mb-3">
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${accent}`}>
        {icon}
      </div>
    </div>
    <div className="flex items-end gap-2 mb-1">
      <span className="text-2xl font-semibold text-slate-800 tracking-tight">{value}</span>
      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md mb-0.5 ${positive ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
        {positive ? "▲" : "▼"} {change}
      </span>
    </div>
    <p className="text-xs text-slate-400">{subtitle}</p>
  </div>
);