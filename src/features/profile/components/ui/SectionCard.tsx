// ─── SectionCard — Titled card shell with icon header ────────────────────────

import React from "react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  /** Tailwind classes for the icon wrapper background (e.g. "bg-blue-50") */
  iconBg: string;
  children: React.ReactNode;
  className?: string;
  /** Optional header right slot */
  headerAction?: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  iconBg,
  children,
  className = "",
  headerAction,
}) => (
  <div
    className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}
  >
    {/* Header */}
    <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-slate-800 leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
        )}
      </div>
      {headerAction && <div className="shrink-0">{headerAction}</div>}
    </div>

    {/* Body */}
    <div className="p-5">{children}</div>
  </div>
);

export default SectionCard;
