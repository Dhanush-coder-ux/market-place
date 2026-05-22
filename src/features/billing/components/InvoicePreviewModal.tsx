import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, CheckCircle2, Banknote, Smartphone, Wallet } from "lucide-react";
import { BillingItem } from "../types";

type BillStatus = "COMPLETED" | "PENDING" | "CANCELLED";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BillingItem[];
  customerName: string;
  phone: string;
  payments: { mode: string; amount: number }[];
  includeGst: boolean;
  totalAmount: number;
  gstAmount: number;
  finalAmount: number;
  isSubmitting: boolean;
  onConfirm: (status: BillStatus) => void;
}

const GST_PERCENT = 18;
const formatINR = (v: number, d = 2) =>
  v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

const payMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  cash: { label: "Cash", icon: <Banknote size={12} strokeWidth={1.5} /> },
  upi: { label: "UPI / Card", icon: <Smartphone size={12} strokeWidth={1.5} /> },
  credit: { label: "Credit", icon: <Wallet size={12} strokeWidth={1.5} /> },
};

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen, onClose, items, customerName, phone,
  payments, includeGst, totalAmount, gstAmount, finalAmount,
  isSubmitting, onConfirm,
}) => {
  const [status, setStatus] = useState<BillStatus>("COMPLETED");
  const invoiceRef = useRef<HTMLDivElement>(null);
  const filledItems = items.filter(i => !!i.name);
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = today.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const invoiceNo = `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const primaryPayment = payments[0] || { mode: "cash" };
  const modeInfo = payMeta[primaryPayment.mode] || payMeta.cash;

  // Body Scroll Lock
  useEffect(() => {
    if (isOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 print:p-0 pointer-events-none">
      {/* Styles for Printing */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}} />

      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm no-print pointer-events-auto" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-slate-100 rounded-lg shadow-[0_24px_80px_rgba(0,0,0,0.3)] w-full max-w-[640px] max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 print:max-h-none print:bg-white print:rounded-none print:shadow-none print:w-full print:max-w-none pointer-events-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200/60 shrink-0 no-print">
          <h3 className="text-[14px] font-semibold text-slate-700">Invoice Preview</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable Invoice Paper */}
        <div className="flex-1 overflow-y-auto p-5 print:p-0 print:overflow-visible custom-scrollbar">
          <div ref={invoiceRef} className="print-area bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200/40 mx-auto max-w-[560px] print:max-w-none print:border-none print:shadow-none print:rounded-none">

            {/* ── Invoice Header ─────────────────────────── */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex justify-between items-start">
                {/* Company Info */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center print:bg-blue-600">
                      <span className="text-white text-[11px] font-semibold">MP</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-800 leading-tight">MarketPlace</p>
                      <p className="text-[10px] text-slate-400 font-normal">Retail & Distribution</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    GSTIN: 29ABCDE1234F1Z5<br />
                    123 Commerce Street, Bengaluru
                  </p>
                </div>

                {/* Invoice Meta */}
                <div className="text-right">
                  <p className="text-[9px] font-medium text-blue-500 mb-0.5 print:text-blue-600">Tax Invoice</p>
                  <p className="text-[13px] font-semibold text-slate-800">{invoiceNo}</p>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[10px] text-slate-400">{dateStr} · {timeStr}</p>
                    <div className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 mt-1 print:bg-white print:border-slate-200">
                      {modeInfo.icon} {payments.length > 1 ? "Split Payment" : modeInfo.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Customer & Status ──────────────────────── */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-medium text-slate-400 mb-0.5">Bill To</p>
                <p className="text-[13px] font-medium text-slate-700">{customerName || "Walk-in Customer"}</p>
                <p className="text-[10px] text-slate-400 font-mono">{phone || "—"}</p>
              </div>
              {/* Status Selector */}
              <div className="flex gap-1 no-print">
                {(["COMPLETED", "PENDING", "CANCELLED"] as BillStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-2 py-1 rounded text-[9px] font-medium border transition-all ${status === s
                      ? s === "COMPLETED" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : s === "PENDING" ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-red-50 border-red-200 text-red-600"
                      : "bg-white border-slate-200/60 text-slate-400 hover:border-slate-300"
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {/* Print-only Status */}
              <div className="hidden print:block">
                <span className={`text-[10px] font-bold ${status === "COMPLETED" ? "text-emerald-600" : status === "PENDING" ? "text-amber-600" : "text-red-600"
                  }`}>
                  • {status}
                </span>
              </div>
            </div>

            {/* ── Items Table ────────────────────────────── */}
            <div className="px-0">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 print:bg-slate-50">
                    <th className="text-left text-[9px] font-medium text-slate-400 pl-6 pr-2 py-2 w-8">#</th>
                    <th className="text-left text-[9px] font-medium text-slate-400 px-2 py-2">Product</th>
                    <th className="text-center text-[9px] font-medium text-slate-400 px-2 py-2 w-12">Qty</th>
                    <th className="text-right text-[9px] font-medium text-slate-400 px-2 py-2 w-20">Price</th>
                    {includeGst && <th className="text-right text-[9px] font-medium text-slate-400 px-2 py-2 w-14">GST</th>}
                    <th className="text-right text-[9px] font-medium text-slate-400 pl-2 pr-6 py-2 w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filledItems.map((item, i) => {
                    const [baseName, variantName] = item.name.split(' - ');
                    return (
                      <tr key={i} className={`border-b border-slate-50 ${i % 2 === 1 ? "bg-slate-50/30" : ""} hover:bg-blue-50/20 transition-colors print:hover:bg-transparent`}>
                        <td className="pl-6 pr-2 py-2.5 text-[10px] text-slate-400 tabular-nums">{i + 1}</td>
                        <td className="px-2 py-2.5">
                          <p className="text-[12px] font-medium text-slate-700 leading-tight">{baseName}</p>
                          {variantName && <p className="text-[10px] text-slate-400 mt-0.5">{variantName}</p>}
                          {item.code && <p className="text-[9px] text-slate-400 font-mono mt-0.5">{item.code}</p>}
                        </td>
                        <td className="px-2 py-2.5 text-center text-[11px] text-slate-600 tabular-nums">{item.qty}</td>
                        <td className="px-2 py-2.5 text-right text-[11px] text-slate-500 tabular-nums">₹{formatINR(item.price)}</td>
                        {includeGst && <td className="px-2 py-2.5 text-right text-[10px] text-slate-400 tabular-nums">{GST_PERCENT}%</td>}
                        <td className="pl-2 pr-6 py-2.5 text-right text-[12px] font-medium text-slate-800 tabular-nums">₹{formatINR(item.tprice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Summary ────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-slate-100">
              <div className="flex justify-end">
                <div className="w-[220px] space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Subtotal</span>
                    <span className="tabular-nums">₹{formatINR(totalAmount)}</span>
                  </div>
                  {includeGst && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>GST ({GST_PERCENT}%)</span>
                      <span className="tabular-nums">₹{formatINR(gstAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Discount</span>
                    <span className="tabular-nums">₹0.00</span>
                  </div>
                  <div className="border-t border-slate-200/60 pt-1.5 mt-1">
                    <div className="flex justify-between text-[14px] font-semibold text-slate-800">
                      <span>Grand Total</span>
                      <span className="tabular-nums text-blue-600 print:text-blue-700">₹{formatINR(finalAmount)}</span>
                    </div>
                  </div>
                  {payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-500">
                      <span>Paid ({payMeta[p.mode]?.label || p.mode})</span>
                      <span className="tabular-nums">₹{formatINR(p.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[11px] font-medium text-emerald-600">
                    <span>Balance</span>
                    <span className="tabular-nums">₹0.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer ─────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 rounded-b-xl print:bg-white">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-medium text-slate-600 mb-0.5">Thank you for your purchase!</p>
                  <p className="text-[9px] text-slate-400 leading-relaxed max-w-[260px]">
                    Goods once sold will not be taken back. All disputes subject to local jurisdiction.
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-24 border-b border-slate-300 mb-1" />
                  <p className="text-[9px] text-slate-400">Authorized Signatory</p>
                </div>
              </div>
              <p className="text-center text-[8px] text-slate-400 mt-3">This is a computer-generated invoice and does not require a physical signature.</p>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex items-center justify-end px-5 py-3 bg-white border-t border-slate-200/60 shrink-0 gap-2 no-print">
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200/60 text-[12px] font-medium text-slate-500 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onConfirm(status)}
              disabled={isSubmitting}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12px] font-medium text-white transition-all duration-200 ${isSubmitting ? "bg-slate-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 shadow-[0_1px_3px_rgba(59,130,246,0.3)]"
                }`}
            >
              {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={13} /> Confirm Order</>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InvoicePreviewModal;

