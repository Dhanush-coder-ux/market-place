import React from "react";
import { Clock, Edit3, Trash2 } from "lucide-react";

interface DraftCardProps {
  title: string;
  timestamp: string | number;
  icon: any;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  badgeText?: string;
  actionText?: string;
}

/**
 * Global DraftCard component for consistent UI across Product, Supplier, Employee, and Customer modules.
 * Designed with high information density and a premium "Super UI" aesthetic.
 */
export const DraftCard: React.FC<DraftCardProps> = ({
  title,
  timestamp,
  icon: Icon,
  onEdit,
  onDelete,
  onComplete,
  badgeText = "Local Draft",
  actionText = "Complete Now",
}) => {
  const date = new Date(timestamp);
  const formattedTime = date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }) + " AT " + date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase();

  return (
    <div className="group bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50/80 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm shadow-blue-100/50">
          <Icon size={24} strokeWidth={2} />
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"
            title="Edit Draft"
          >
            <Edit3 size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100 shadow-sm"
            title="Delete Draft"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight line-clamp-1">
          {title || "Untitled Draft"}
        </h4>
        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
          <Clock size={12} strokeWidth={3} />
          {formattedTime}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
        <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
          {badgeText}
        </span>
        <button 
          onClick={onComplete}
          className="text-[11px] font-black text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5 uppercase tracking-widest group/btn"
        >
          {actionText} <span className="transition-transform group-hover/btn:translate-x-1">→</span>
        </button>
      </div>
    </div>
  );
};

export default DraftCard;
