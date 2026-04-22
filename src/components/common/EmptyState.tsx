import React from "react";
import { LucideIcon, Clock } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Clock,
  title,
  description,
  actionText,
  onAction,
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center space-y-4 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shadow-inner">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <div className="max-w-xs">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
        <p className="text-slate-400 text-xs font-bold mt-1 uppercase leading-relaxed tracking-wider">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="mt-6 px-8 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
