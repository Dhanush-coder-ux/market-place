import React from "react";
import { LucideIcon } from "lucide-react";

// ─── Utility ──────────────────────────────────────────────────────────────────
export const fmt = (n: number | string) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    "In Stock": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Low Stock": "bg-amber-50 text-amber-600 border-amber-100",
    "Out of Stock": "bg-rose-50 text-rose-600 border-rose-100",
    "Active": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Inactive": "bg-rose-50 text-rose-600 border-rose-100",
    "Draft": "bg-slate-50 text-slate-500 border-slate-100",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
        colorMap[status] ?? "bg-slate-50 text-slate-500 border-slate-100"
      }`}
    >
      {status}
    </span>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
export interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: LucideIcon;
}

export function SectionCard({ children, className = "", title, icon: Icon }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-6">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Icon size={16} />
            </div>
          )}
          <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">{title}</h2>
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// ─── DetailItem ───────────────────────────────────────────────────────────────
export const DetailItem = ({ icon: Icon, label, value, onClick }: { icon: any, label: string, value: string, onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`flex items-start gap-3 p-1 -m-1 rounded-lg transition-colors ${onClick ? "cursor-pointer hover:bg-slate-50 active:scale-[0.98]" : ""}`}
  >
    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
      <Icon size={12} strokeWidth={2.5} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.05em] mb-0.5">{label}</p>
      <p className="text-[13px] font-bold text-slate-700 truncate tracking-tight">{value}</p>
    </div>
  </div>
);
