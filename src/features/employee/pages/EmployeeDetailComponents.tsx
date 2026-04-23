import React from "react";
import { X } from "lucide-react";

// ─── Utility ──────────────────────────────────────────────────────────────────
export const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Accepted: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Pending: "bg-amber-50 text-amber-600 border-amber-100",
    Inactive: "bg-rose-50 text-rose-600 border-rose-100",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
        colorMap[status] ?? "bg-slate-50 text-slate-500 border-slate-100"
      }`}
    >
      {status}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ show, onClose, title, children, className = "max-w-lg" }: ModalProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div
        className={`relative bg-white w-full ${className} rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200`}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Form Elements ─────────────────────────────────────────────────────────────
export const FormInput = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      {...props}
      className="w-full h-11 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
    />
  </div>
);

export const SectionCard = ({ children, title, className = "" }: { children: React.ReactNode, title?: string, className?: string }) => (
  <div className={`bg-white rounded-[1.5rem] border border-slate-100 p-5 space-y-4 ${className}`}>
    {title && (
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-3">
        {title}
      </h3>
    )}
    {children}
  </div>
);

export const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
    <span className="text-[12px] font-bold text-slate-700 tracking-tight">{value}</span>
  </div>
);
