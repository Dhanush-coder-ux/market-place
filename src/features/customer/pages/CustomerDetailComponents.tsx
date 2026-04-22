import React from "react";
import { LucideIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Invoice {
  id: string;
  date: string;
  products: string;
  amount: number;
  outstanding: number;
  status: "Paid" | "Partial" | "Pending";
}

export interface PaymentEntry {
  title: string;
  amount: number;
  date: string;
  invoice: string;
  method: string;
}

export interface ActivityEntry {
  icon: string | React.ReactNode;
  iconBg: string;
  text: string;
  time: string;
}

export interface PendingInvoice {
  id: string;
  date: string;
  amount: number;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Format a number as Indian Rupee string, e.g. 15300 → "₹15,300" */
export const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

// ─── StatusBadge ──────────────────────────────────────────────────────────────
/**
 * Displays a coloured pill badge for invoice/payment status.
 * Supports: "Paid" | "Partial" | "Pending"
 */
export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Partial: "bg-blue-50 text-blue-600 border-blue-100",
    Pending: "bg-amber-50 text-amber-600 border-amber-100",
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

// ─── StatCard ─────────────────────────────────────────────────────────────────
export interface StatCardProps {
  icon: any; // Allow Lucide components
  label: string;
  value: string;
  iconBg: string;
}

export function StatCard({ icon: Icon, label, value, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} group-hover:scale-110 transition-transform`}>
        {typeof Icon === 'function' ? <Icon size={22} className="text-current" /> : Icon}
      </div>
      <div>
        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">
          {label}
        </div>
        <div className="text-xl font-bold text-slate-800 tracking-tight">{value}</div>
      </div>
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

/**
 * A reusable modal dialog with header, scrollable body, and footer slot.
 * Closes when clicking the backdrop or the × button.
 *
 * @example
 * <Modal show={open} onClose={() => setOpen(false)} title="Record Payment" footer={<button>Save</button>}>
 *   <p>Modal body content</p>
 * </Modal>
 */
export function Modal({ show, onClose, title, children, footer, className }: ModalProps) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl w-[90%] max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease] ${className || "max-w-xl"}`}>
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

// ─── Notification ─────────────────────────────────────────────────────────────
export interface NotificationProps {
  text: string;
  show: boolean;
  variant?: "success" | "error" | "info";
}

/**
 * A slide-in toast notification fixed to the top-right corner.
 *
 * @example
 * <Notification show={notifShow} text="Payment saved!" variant="success" />
 */
export function Notification({ text, show, variant = "success" }: NotificationProps) {
  if (!show) return null;

  const borderColor =
    variant === "error"
      ? "border-red-500"
      : variant === "info"
      ? "border-blue-500"
      : "border-emerald-500";

  const iconColor =
    variant === "error"
      ? "text-red-500"
      : variant === "info"
      ? "text-blue-500"
      : "text-emerald-500";

  const icon = variant === "error" ? "✕" : variant === "info" ? "ℹ" : "✓";

  return (
    <div
      className={`fixed top-6 right-6 z-[2000] bg-white px-5 py-4 rounded-xl shadow-xl flex items-center gap-3 border-l-4 ${borderColor} animate-[slideIn_0.3s_ease]`}
    >
      <span className={`text-2xl font-semibold ${iconColor}`}>{icon}</span>
      <span className="text-sm font-semibold text-slate-700">{text}</span>
    </div>
  );
}

// ─── Form primitives ──────────────────────────────────────────────────────────
const inputBase =
  "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * Labelled text/number/date/tel/email input.
 *
 * @example
 * <FormInput label="Full Name" value={name} onChange={e => setName(e.target.value)} />
 */
export function FormInput({ label, ...props }: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <input className={inputBase} {...props} />
    </div>
  );
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

/**
 * Labelled select / dropdown.
 *
 * @example
 * <FormSelect label="Payment Method" options={["UPI","Cash","Card"]} value={method} onChange={...} />
 */
export function FormSelect({ label, options, ...props }: FormSelectProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <select className={`${inputBase} bg-white`} {...props}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

/**
 * Labelled resizable textarea.
 *
 * @example
 * <FormTextarea label="Notes" placeholder="Add notes..." value={notes} onChange={...} />
 */
export function FormTextarea({ label, ...props }: FormTextareaProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <textarea className={`${inputBase} resize-y min-h-[90px]`} {...props} />
    </div>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────
export interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

/**
 * A simple label + value display row used in detail sections.
 *
 * @example
 * <InfoRow label="Email" value="user@example.com" />
 */
export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <div className="text-[13px] text-slate-500 font-medium mb-1">{label}</div>
      <div className="text-[15px] font-semibold text-slate-700">{value}</div>
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
export interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A white card container used for each content section / tab panel.
 *
 * @example
 * <SectionCard>
 *   <h2>General Info</h2>
 * </SectionCard>
 */
export function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-xl p-8 shadow-sm border border-slate-100 ${className}`}>
      {children}
    </div>
  );
}

// ─── AlertBanner ──────────────────────────────────────────────────────────────
export interface AlertBannerProps {
  icon: string | LucideIcon;
  title: string;
  message: string;
  variant?: "danger" | "warning";
}

/**
 * Coloured alert banner for warnings / errors shown inside tab panels.
 *
 * @example
 * <AlertBanner icon="⚠️" title="Outstanding Due" message="Balance of ₹15,300 pending." variant="danger" />
 */
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
    <div className={`border rounded-xl p-3 flex items-center gap-4 ${styles}`}>
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
// ─── BottomActionBar ──────────────────────────────────────────────────────────
export interface ActionButton {
  label: string;
  icon: string | React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "success" | "secondary";
}

export interface BottomActionBarProps {
  customerName: string;
  actions: ActionButton[];
}

export function BottomActionBar({ customerName, actions }: BottomActionBarProps) {
  const variantClass: Record<string, string> = {
    primary:
      "bg-blue-500 hover:bg-blue-600 text-white",
    success:
      "bg-blue-500 hover:bg-blue-600 text-white",
    secondary:
      "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
  };

  return (
    // 1. Changed "fixed" to "sticky"
    // 2. Added negative margins/bottom offsets to bypass the MainLayout padding
    // 3. Added mt-auto to push it down on shorter pages
    <div className="sticky -bottom-4 md:-bottom-6 lg:-bottom-8 -mx-4 md:-mx-6 lg:-mx-8 -mb-4 md:-mb-6 lg:-mb-8 mt-auto bg-white border-t-2 border-slate-200 px-8 py-4 flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-[100]">
      <span className="text-sm text-slate-500">Quick actions for {customerName}</span>
      <div className="flex gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
              variantClass[action.variant ?? "secondary"]
            }`}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
