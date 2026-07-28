import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Format a number as Indian Rupee string, e.g. 15300 → "₹15,300" */
export const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

// ─── StatusBadge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Paid: "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border-[var(--pay-paid-bd)]",
    Partial: "bg-[var(--pay-partial-bg)] text-[var(--pay-partial-tx)] border-[var(--pay-partial-bd)]",
    "Partially Paid": "bg-[var(--pay-partial-bg)] text-[var(--pay-partial-tx)] border-[var(--pay-partial-bd)]",
    Pending: "bg-[var(--pay-pending-bg)] text-[var(--pay-pending-tx)] border-[var(--pay-pending-bd)]",
    Accepted: "bg-[var(--ps-completed-bg)] text-[var(--ps-completed-tx)] border-[var(--ps-completed-bd)]",
    Inactive: "bg-[var(--ps-cancel-bg)] text-[var(--ps-cancel-tx)] border-[var(--ps-cancel-bd)]",
    Active: "bg-[var(--ps-completed-bg)] text-[var(--ps-completed-tx)] border-[var(--ps-completed-bd)]",
    Completed: "bg-[var(--ps-completed-bg)] text-[var(--ps-completed-tx)] border-[var(--ps-completed-bd)]",
    Draft: "bg-[var(--ps-draft-bg)] text-[var(--ps-draft-tx)] border-[var(--ps-draft-bd)]",
    Cancelled: "bg-[var(--ps-cancel-bg)] text-[var(--ps-cancel-tx)] border-[var(--ps-cancel-bd)]",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold   border ${colorMap[status] ?? "bg-slate-50 text-slate-500 border-slate-100"
        }`}
    >
      {status}
    </span>
  );
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────

export function TypeBadge({ type, labelOverride, icon: Icon }: { type: string, labelOverride?: string, icon?: any }) {
  const t = type?.toUpperCase() || "ADJUSTMENT";
  let bg = "bg-[var(--mv-adjust-bg)]", text = "text-[var(--mv-adjust-tx)]", border = "border-[var(--mv-adjust-bd)]", dot = "bg-[var(--mv-adjust-dot)]", label = "Adjustment";
  
  if (t.includes("PURCHASE_RETURN")) { bg = "bg-[var(--mv-preturn-bg)]"; text = "text-[var(--mv-preturn-tx)]"; border = "border-[var(--mv-preturn-bd)]"; dot = "bg-[var(--mv-preturn-dot)]"; label = "Purchase Return"; }
  else if (t.includes("SALES_RETURN") || t.includes("SALE_RETURN")) { bg = "bg-[var(--mv-sreturn-bg)]"; text = "text-[var(--mv-sreturn-tx)]"; border = "border-[var(--mv-sreturn-bd)]"; dot = "bg-[var(--mv-sreturn-dot)]"; label = "Sales Return"; }
  else if (t.includes("PURCHASE") || t === "DIRECT" || t.includes("PO_")) { bg = "bg-[var(--mv-purchase-bg)]"; text = "text-[var(--mv-purchase-tx)]"; border = "border-[var(--mv-purchase-bd)]"; dot = "bg-[var(--mv-purchase-dot)]"; label = "Purchase"; }
  else if (t.includes("SALES")) { bg = "bg-[var(--mv-sales-bg)]"; text = "text-[var(--mv-sales-tx)]"; border = "border-[var(--mv-sales-bd)]"; dot = "bg-[var(--mv-sales-dot)]"; label = "Sales"; }
  else if (t === "TRANSFER") { bg = "bg-slate-100"; text = "text-slate-700"; border = "border-slate-200"; dot = "bg-slate-400"; label = "Transfer"; }
  else if (t.includes("OPENING")) { bg = "bg-[var(--mv-opening-bg)]"; text = "text-[var(--mv-opening-tx)]"; border = "border-[var(--mv-opening-bd)]"; dot = "bg-[var(--mv-opening-dot)]"; label = "Opening"; }
  else if (t.includes("ADJUSTMENT")) { bg = "bg-[var(--mv-adjust-bg)]"; text = "text-[var(--mv-adjust-tx)]"; border = "border-[var(--mv-adjust-bd)]"; dot = "bg-[var(--mv-adjust-dot)]"; label = "Adjustment"; }

  const displayLabel = labelOverride || label;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${bg} ${text} ${border}`}>
      {Icon ? <Icon size={10} className="stroke-[3]" /> : <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {displayLabel}
    </span>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

export interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function SectionCard({ children, title, className = "" }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-3 sm:p-5 shadow-sm overflow-hidden relative ${className}`}>
      {title && (
        <div className="flex items-center gap-2.5 mb-4 sm:mb-5 border-b border-slate-100 pb-2 sm:pb-3">
          <h2 className="text-[10px] font-semibold text-slate-500  tracking-[0.12em]">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── DetailItem ───────────────────────────────────────────────────────────────

export interface DetailItemProps {
  icon: any;
  label: string;
  value: string;
  onClick?: () => void;
}

export function DetailItem({ icon: Icon, label, value, onClick }: DetailItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-1 -m-1 rounded-lg transition-colors ${onClick ? "cursor-pointer hover:bg-slate-50 active:scale-[0.98]" : ""}`}
    >
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
        <Icon size={12} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-400  tracking-[0.05em] mb-0.5">{label}</p>
        <p className="text-[13px] font-semibold text-slate-700 truncate tracking-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

export function InfoRow({ label, value }: { label: string, value: string | React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-[11px] font-medium text-slate-400  tracking-tight">{label}</span>
      <span className="text-[12px] font-semibold text-slate-700 tracking-tight">{value}</span>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ show, onClose, title, children, footer, className }: ModalProps) {
  React.useEffect(() => {
    if (show) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [show]);

  if (!show) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-lg w-[90%] max-h-[90vh] overflow-y-auto modal-content shadow-2xl animate-[slideUp_0.3s_ease] ${className || "max-w-xl"}`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-700">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-md text-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AlertBanner ──────────────────────────────────────────────────────────────

export interface AlertBannerProps {
  icon: any;
  title: string;
  message: string;
  variant?: "danger" | "warning";
}

export function AlertBanner({
  icon: Icon,
  title,
  message,
  variant = "danger",
}: AlertBannerProps) {
  const styles =
    variant === "warning"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-red-50 border-red-200 text-red-700";
  const titleColor = variant === "warning" ? "text-amber-900" : "text-red-800";

  return (
    <div className={`border rounded-lg p-3 flex items-center gap-4 ${styles}`}>
      <div className="text-3xl shrink-0 flex items-center justify-center">
        {typeof Icon === "string" ? Icon : <Icon size={30} />}
      </div>
      <div>
        <div className={`font-semibold text-base mb-1 ${titleColor}`}>{title}</div>
        <div className="text-sm">{message}</div>
      </div>
    </div>
  );
}

// ─── BottomActionBar ──────────────────────────────────────────────────────────

export interface ActionButton {
  label: string;
  icon: any;
  onClick: () => void;
  variant?: "primary" | "success" | "secondary";
}

export interface BottomActionBarProps {
  label: string;
  actions: ActionButton[];
}

export function BottomActionBar({ label, actions }: BottomActionBarProps) {
  const variantClass: Record<string, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
    secondary: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
  };

  return (
    <div className="sticky -bottom-4 md:-bottom-6 lg:-bottom-8 -mx-4 md:-mx-6 lg:-mx-8 -mb-4 md:-mb-6 lg:-mb-8 mt-auto bg-white border-t-2 border-slate-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-[100]">
      <span className="text-sm font-bold text-slate-400  ">{label}</span>
      <div className="flex gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold   flex items-center gap-2 transition-all active:scale-95 shadow-sm ${variantClass[action.variant ?? "secondary"]
              }`}
          >
            {typeof action.icon === 'function' ? <action.icon size={14} /> : action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}




// ─── ImageCarousel ──────────────────────────────────────────────────────────────

export function ImageCarousel({ images, alt, className = "" }: { images: string[], alt: string, className?: string }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  if (!images || images.length === 0) return null;
  if (images.length === 1) return <img src={images[0]} alt={alt} className={`w-full h-full object-cover ${className}`} />;
  
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-full group">
      <img src={images[currentIndex]} alt={`${alt} ${currentIndex + 1}`} className={`w-full h-full object-cover transition-all ${className}`} />
      <div className="absolute inset-0 flex items-center justify-between p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <button onClick={prev} className="pointer-events-auto w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors">
          <ChevronLeft size={14} />
        </button>
        <button onClick={next} className="pointer-events-auto w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
        {images.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}

// ─── ProfileHeaderCard ────────────────────────────────────────────────────────

export interface ProfileHeaderCardProps {
  name: string;
  initials: string;
  imageUrl?: string | string[];
  subText?: string;
  badges?: Array<{
    text: string;
    variant?: "primary" | "success" | "danger" | "warning" | "pay-paid" | "pay-partial" | "pay-pending" | "pay-overdue" | "vendor";
    showPulse?: boolean;
    icon?: any;
    dotColor?: string;
  }>;
  actions?: React.ReactNode;
  infoItems?: Array<{
    icon: any;
    text: string;
  }>;
  className?: string;
}

export function ProfileHeaderCard({
  name,
  initials,
  imageUrl,
  subText,
  badges = [],
  actions,
  infoItems = [],
  className = ""
}: ProfileHeaderCardProps) {
  return (
    <div className={`bg-white rounded-lg p-4 border border-slate-200 shadow-sm relative overflow-hidden group ${className}`}>
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-200 ring-2 ring-white overflow-hidden shrink-0">
          {imageUrl && (Array.isArray(imageUrl) ? imageUrl.length > 0 : true) ? (
            <ImageCarousel images={Array.isArray(imageUrl) ? imageUrl : [imageUrl]} alt={name} />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex flex-col mb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-800 tracking-tight">{name}</h1>
              <div className="flex items-center gap-2">
                {badges.map((badge, i) => {
                  let styles = "bg-blue-50 text-blue-600 border-blue-100";
                  if (badge.variant === "success") styles = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  else if (badge.variant === "danger") styles = "bg-rose-50 text-rose-600 border-rose-100";
                  else if (badge.variant === "warning") styles = "bg-amber-50 text-amber-600 border-amber-100";
                  else if (badge.variant === "pay-paid") styles = "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border-[var(--pay-paid-bd)]";
                  else if (badge.variant === "pay-partial") styles = "bg-[var(--pay-partial-bg)] text-[var(--pay-partial-tx)] border-[var(--pay-partial-bd)]";
                  else if (badge.variant === "pay-pending") styles = "bg-[var(--pay-pending-bg)] text-[var(--pay-pending-tx)] border-[var(--pay-pending-bd)]";
                  else if (badge.variant === "pay-overdue") styles = "bg-white text-[var(--pay-overdue-tx)] border-[var(--pay-overdue-bd)]";
                  else if (badge.variant === "vendor") styles = "bg-[var(--mv-purchase-bg)] text-[var(--mv-purchase-tx)] border-[var(--mv-purchase-bd)]";

                  return (
                    <span key={i} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold   border ${styles}`}>
                      {badge.icon && <badge.icon size={10} className="stroke-[2.5]" />}
                      {badge.dotColor && !badge.showPulse && !badge.icon && (
                        <div className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                      )}
                      {badge.showPulse && !badge.icon && (
                        <div className={`w-1.5 h-1.5 rounded-full ${badge.dotColor || (badge.variant === "success" ? "bg-[var(--ps-completed-dot)]" :
                          badge.variant === "danger" ? "bg-rose-500" :
                            "bg-blue-500")
                          } animate-pulse`} />
                      )}
                      {badge.text}
                    </span>
                  );
                })}
              </div>
            </div>
            {subText && (
              <div className="text-[11px] font-medium text-slate-400 font-mono tracking-tight">
                {subText}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[12px] font-semibold text-slate-500">
            {infoItems.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <item.icon size={12} className="text-blue-400" />
                {item.text}
              </div>
            ))}
          </div>

        </div>

        {actions && (
          <div className="flex items-center gap-1.5">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}





