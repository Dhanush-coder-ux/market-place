import {
  ReceiptText,
  User,
  CreditCard,
  Printer,
  CheckCircle2,
  Banknote,
  Smartphone,
  Wallet,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import { InfoCard } from "./InfoCard";
import { InvoicePayload } from "../types";

interface BillingDetailViewProps {
  invoice?: InvoicePayload | null;
  isSubmitting?: boolean;
  onConfirm?: () => void;
}

const formatINR = (v: number, d = 2) =>
  v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

const PaymentModeLabel: Record<string, { label: string; icon: React.ReactNode }> = {
  cash:   { label: "Cash",     icon: <Banknote   size={14} /> },
  upi:    { label: "UPI/Card", icon: <Smartphone size={14} /> },
  credit: { label: "Credit",   icon: <Wallet     size={14} /> },
};

const BillingDetailView = ({ invoice, isSubmitting, onConfirm }: BillingDetailViewProps) => {
  const [status, setStatus] = useState<"COMPLETED" | "PENDING" | "CANCELLED">("COMPLETED");

  // ── Derived from live invoice or fall back to demo data ──────────────────
  const billDate = invoice
    ? new Date(invoice.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const customerName = invoice?.customerName || "Walk-in Customer";
  const phone        = invoice?.phone        || "—";

  const subTotal   = invoice?.totalAmount  ?? 0;
  const gstAmt     = invoice?.gstAmount    ?? 0;
  const totalAmt   = invoice?.finalAmount  ?? 0;
  const includeGst = invoice?.includeGst   ?? false;
  const payMode    = invoice?.paymentMode  ?? "cash";

  const items = invoice?.items.filter(i => !!i.name) ?? [
    { code: "PRD001", name: "Blue T-Shirt",  qty: 2, price: 499,  tprice: 998  },
    { code: "PRD003", name: "Formal Shoes",  qty: 1, price: 1999, tprice: 1999 },
  ];

  const modeInfo = PaymentModeLabel[payMode] ?? PaymentModeLabel.cash;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Invoice Header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-7 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Tax Invoice</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {invoice ? "New Invoice" : "BILL-10245"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Issued on {billDate}</p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <span className={`self-start px-3 py-1 rounded-full text-xs font-bold
              ${status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : ""}
              ${status === "PENDING"   ? "bg-amber-100   text-amber-700   border border-amber-200"   : ""}
              ${status === "CANCELLED" ? "bg-red-100     text-red-700     border border-red-200"     : ""}
            `}>
              ● {status}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white/80 border border-slate-200 rounded-full px-3 py-1">
              {modeInfo.icon}
              {modeInfo.label}
            </div>
          </div>
        </div>
      </div>

      {/* ── Amount Hero ──────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white shadow-sm border border-slate-200 p-7 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Payable</p>
          <div className="flex items-start gap-1">
            <span className="text-xl font-bold text-slate-700 mt-1.5">₹</span>
            <span className="text-4xl font-semibold text-slate-900 tabular-nums tracking-tight">
              {Math.floor(totalAmt).toLocaleString("en-IN")}
            </span>
            <span className="text-xl font-bold text-slate-700 mt-auto mb-1">
              .{String(Math.round((totalAmt % 1) * 100)).padStart(2, "0")}
            </span>
          </div>
          {includeGst && (
            <p className="text-xs text-slate-500 mt-1">
              Subtotal ₹{formatINR(subTotal)} + GST ₹{formatINR(gstAmt)}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <GradientButton icon={<Printer size={18} />} variant="outline">
            Print Invoice
          </GradientButton>
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-md disabled:opacity-50 transition-all"
            >
              {isSubmitting
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : <><CheckCircle2 size={16} /> Confirm Order</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Meta Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <InfoCard title="Customer" icon={<User size={20} />}>
          <p className="font-bold text-slate-800">{customerName}</p>
          <p className="text-xs text-slate-500 mt-0.5">{phone}</p>
        </InfoCard>

        <InfoCard title="Billing Status" icon={<ReceiptText size={20} />}>
          <ReusableSelect
            placeholder="Status"
            value={status}
            onValueChange={(v) => setStatus(v as any)}
            options={[
              { label: "COMPLETED", value: "COMPLETED" },
              { label: "PENDING",   value: "PENDING"   },
              { label: "CANCELLED", value: "CANCELLED" },
            ]}
          />
        </InfoCard>

        <InfoCard title="Origin" icon={<CreditCard size={20} />}>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            {modeInfo.icon}
            <span>{modeInfo.label} · In-Store</span>
          </div>
        </InfoCard>
      </div>

      {/* ── Items Table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["#", "Product", "Qty", "Unit Price", "Total"].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider
                    ${i === 0 ? "text-left w-10" : i === 1 ? "text-left" : "text-right"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 text-xs text-slate-400 font-mono">{i + 1}</td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                  {item.code && (
                    <p className="text-xs text-blue-500 font-mono mt-0.5">{item.code}</p>
                  )}
                </td>
                <td className="px-5 py-4 text-center text-sm text-slate-700 font-medium">{item.qty}</td>
                <td className="px-5 py-4 text-right text-sm text-slate-500">₹{formatINR(item.price)}</td>
                <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">₹{formatINR(item.tprice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Sticky Total */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4">
          <div className="flex justify-end">
            <div className="text-right space-y-1">
              {includeGst && (
                <>
                  <div className="flex justify-between gap-8 text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{formatINR(subTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-xs text-slate-500">
                    <span>GST (18%)</span>
                    <span>₹{formatINR(gstAmt)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between gap-8 text-base font-black text-blue-600 pt-1 border-t border-slate-100">
                <span>Grand Total</span>
                <span>₹{formatINR(totalAmt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDetailView;
