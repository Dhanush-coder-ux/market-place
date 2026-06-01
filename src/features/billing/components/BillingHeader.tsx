import React, { useState, useMemo } from "react";
import {
  Banknote, Clock, CreditCard, User, X, Search
} from "lucide-react";
import { BillingItem, CustomerData } from "../types";
import InvoicePreviewModal from "./InvoicePreviewModal";

type PaymentMode = "cash" | "upi" | "credit";
type BillStatus = "COMPLETED" | "PENDING" | "CANCELLED";

interface BillingHeaderProps {
  items: BillingItem[];
  customerData: CustomerData | null;
  customerName: string;
  phone: string;
  onConfirmOrder: (payments: { mode: string, amount: number }[], includeGst: boolean, status: string) => void;
  isSubmitting: boolean;
  // Lifted state from parent
  includeGst: boolean;
  totalAmount: number;
  gstAmount: number;
  finalAmount: number;
  payments: { mode: PaymentMode; amount: number }[];
  onPaymentsChange: (payments: { mode: PaymentMode; amount: number }[]) => void;
  onAddCustomerClick: () => void;
  onDetachCustomer: () => void;
}

const formatINR = (amount: number, decimals = 2) => 
  amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const round2 = (n: number) => Math.round(n * 100) / 100;



/* ── Main Component ────────────────────────────────────────────────────────── */
const BillingHeader: React.FC<BillingHeaderProps> = ({
  items, customerData, customerName, phone,
  onConfirmOrder, isSubmitting,
  includeGst, totalAmount, gstAmount, finalAmount,
  payments, onPaymentsChange,
  onAddCustomerClick,
  onDetachCustomer
}) => {
  const [showInvoice, setShowInvoice] = useState(false);

  const totalQty = useMemo(() => items.reduce((s, i) => s + (i.qty || 0), 0), [items]);
  const filledItems = useMemo(() => items.filter(i => !!i.name).length, [items]);
  const isCreditAllowed = customerData ? customerData.outstanding < customerData.creditLimit : false;

  const addPayment = (mode: PaymentMode) => {
    if (payments.some(p => p.mode === mode)) return;
    const currentPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const balance = Math.max(0, finalAmount - currentPaid);
    onPaymentsChange([...payments, { mode, amount: round2(balance) }]);
  };

  const removePayment = (index: number) => {
    if (payments.length <= 1) return;
    onPaymentsChange(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, updates: Partial<{ mode: PaymentMode; amount: number }>) => {
    onPaymentsChange(payments.map((p, i) => {
      if (i !== index) return p;
      const next = { ...p, ...updates };

      if (typeof next.amount === "number") {
        next.amount = round2(next.amount);
      }

      if (updates.mode === "credit" && customerData) {
        const available = customerData.creditLimit - customerData.outstanding;
        const currentBalance = finalAmount - payments.reduce((s, pay, j) => s + (j === index ? 0 : pay.amount), 0);
        next.amount = round2(Math.min(currentBalance, available));
      }

      if (next.mode === "credit" && customerData) {
        const available = customerData.creditLimit - customerData.outstanding;
        if (next.amount > available) next.amount = round2(available);
      }
      return next;
    }));
  };

  const paidAmount = useMemo(() => round2(payments.reduce((s, p) => s + (p.amount || 0), 0)), [payments]);
  const balanceAmount = useMemo(() => round2(finalAmount - paidAmount), [finalAmount, paidAmount]);

  const handleGenerateInvoice = () => {
    if (totalQty === 0) return alert("Cart is empty");
    setShowInvoice(true);
  };

  const handleQuickCheckout = () => {
    if (totalQty === 0) return alert("Cart is empty");
    if (balanceAmount > 0.01) return alert("Please pay the full balance amount first.");
    onConfirmOrder(payments, includeGst, "COMPLETED");
  };

  const handleConfirm = (status: BillStatus) => {
    onConfirmOrder(payments, includeGst, status);
    setShowInvoice(false);
    onPaymentsChange([{ mode: "cash", amount: 0 }]);
  };

  // Credit-related derived values

  return (
    <>
      <div className="w-full h-full flex flex-col font-sans bg-white p-3 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* ── Customer Selection Panel (Top of Right Panel) ────────────────── */}
        <div className="shrink-0">
          {!customerData ? (
            /* Walk-in Customer View - Mild Blue Theme (Enforced Selection) */
            <div className="p-3.5 bg-blue-50/40 border border-blue-200/70 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-blue-150 flex items-center justify-center text-blue-500 shrink-0">
                  <User size={15} />
                </div>
                <div>
                  <h4 className="text-[12px] font-bold text-slate-800">Walk-in Customer</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 tracking-tight">Standard Billing</p>
                </div>
              </div>
              <div>
              <button 
                onClick={onAddCustomerClick}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm transition-all duration-150 active:scale-95 cursor-pointer animate-none"
              >
                <Search size={10} strokeWidth={3} /> Select
                <kbd className="ml-1 text-[8px] text-slate-400 font-mono font-bold leading-none bg-slate-50 border border-slate-200 px-1 py-0.2 rounded shadow-sm">F4</kbd>
              </button>
              </div>
            </div>
          ) : (
            /* Linked Customer Details View - Mild Blue Theme */
            <div className="space-y-2.5">
              <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-3 z-10">
                  <div className="w-8 h-8 rounded-full bg-white border border-blue-150 flex items-center justify-center text-blue-600 shrink-0">
                    <User size={15} />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-bold text-blue-900">{customerData.name}</h4>
                    <p className="text-[10px] text-blue-600/70 font-mono mt-0.5 tracking-wide">{customerData.phone}</p>
                  </div>
                </div>
                <button 
                  onClick={onDetachCustomer}
                  className="w-6 h-6 rounded-full bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 flex items-center justify-center transition-all z-10 shadow-sm cursor-pointer animate-in fade-in duration-200"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>

              {/* Blue Outline Credit Stats Box */}
              <div className="p-3.5 border-2 border-blue-500/80 bg-blue-50/20 rounded-xl shadow-sm space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                  <span>Credit limit</span>
                  <span className="font-bold text-blue-600">₹{formatINR(customerData.creditLimit, 0)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                  <span>Already owed</span>
                  <span className="font-bold text-slate-550">₹{formatINR(customerData.outstanding, 0)}</span>
                </div>
                <div className="w-full h-px bg-blue-100 my-1.5" />
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span>Available to use</span>
                  <span className="font-extrabold text-emerald-600">₹{formatINR(Math.max(0, customerData.creditLimit - customerData.outstanding), 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Billing Summary ────────────────────────────────────────── */}
        <div className="border border-slate-150 rounded-xl p-3.5 space-y-3 shadow-sm bg-slate-50/20">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">BILLING SUMMARY</p>
          
          <div className="space-y-1.5 text-[11px] font-semibold text-slate-600">
            <div className="flex justify-between">
              <span>Items count</span>
              <span className="font-bold text-slate-800 tabular-nums">{filledItems} items ({totalQty} units)</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800 tabular-nums">₹{formatINR(totalAmount, 0)}</span>
            </div>
            {includeGst && (
              <div className="flex justify-between text-indigo-650">
                <span>Tax / GST</span>
                <span className="font-bold tabular-nums">+₹{formatINR(gstAmount, 0)}</span>
              </div>
            )}
          </div>
          
          <div className="h-px bg-slate-100 border-dashed my-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Grand Total</span>
            <span className="text-base font-black text-blue-600 tabular-nums">₹{formatINR(finalAmount, 0)}</span>
          </div>
        </div>

        {/* ── Split Payments Section ─────────────────────────────────── */}
        <div className="border border-slate-150 rounded-xl p-3.5 space-y-3 shadow-sm flex flex-col shrink-0 bg-white">
          <div className="flex items-center justify-between shrink-0 border-b border-slate-100 pb-1.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PAYMENT RECEIVED</p>
          </div>

          {/* Payment list */}
          <div className="space-y-2 pr-0.5">
            {payments.map((p, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <div className="flex-1 flex items-center bg-blue-50/40 rounded-lg border border-blue-100/80 h-[38px] overflow-hidden">
                  <div className="flex items-center gap-2 px-2.5 w-[85px] bg-blue-50/40 text-blue-900 text-[12px] font-bold shrink-0">
                    {p.mode === 'cash' && <Banknote size={14} className="opacity-60" />}
                    {p.mode === 'upi' && <CreditCard size={14} className="opacity-60" />}
                    {p.mode === 'credit' && <Clock size={14} className="opacity-60" />}
                    <span className="capitalize">{p.mode === 'upi' ? 'UPI' : p.mode}</span>
                  </div>
                  <div className="h-full w-px bg-blue-100/80" />
                  <div className="flex items-center justify-center px-3 bg-blue-50/80 text-blue-600 text-[12px] font-bold shrink-0">
                    ₹
                  </div>
                  <div className="h-full w-px bg-blue-100/80" />
                  <input
                    type="number"
                    autoFocus={idx === payments.length - 1}
                    value={p.amount || ""}
                    onChange={(e) => updatePayment(idx, { amount: Number(e.target.value) })}
                    placeholder="0"
                    className="flex-1 w-full bg-white h-full px-3 text-right text-[14px] font-bold text-slate-800 outline-none tabular-nums"
                  />
                </div>
                {payments.length > 1 ? (
                  <button
                    onClick={() => removePayment(idx)}
                    className="w-[38px] h-[38px] rounded-lg bg-blue-50/40 hover:bg-rose-50 text-blue-400 hover:text-rose-500 flex items-center justify-center transition-all border border-blue-100/80 shrink-0"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                ) : (
                  <div className="w-[38px] h-[38px] rounded-lg bg-slate-50/50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                    <X size={14} strokeWidth={2.5} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="shrink-0 space-y-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-2 p-2 border border-dashed border-slate-200 rounded-lg">
              <button 
                onClick={() => addPayment('cash')}
                disabled={payments.some(p => p.mode === 'cash')}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-white border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Banknote size={12} className="opacity-60" /> Cash
              </button>
              <button 
                onClick={() => addPayment('upi')}
                disabled={payments.some(p => p.mode === 'upi')}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-white border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CreditCard size={12} className="opacity-60" /> UPI
              </button>
              <button 
                onClick={() => addPayment('credit')}
                disabled={!isCreditAllowed || payments.some(p => p.mode === 'credit')}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-white border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Clock size={12} className="opacity-60" /> Credit
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onPaymentsChange([{mode: 'cash', amount: finalAmount}])}
                className="px-2.5 py-1.5 bg-blue-50/80 text-blue-700 rounded-md text-[11px] font-bold border border-blue-100/80 hover:bg-blue-100/80 transition-colors"
              >
                Full ₹{formatINR(finalAmount)} in Cash
              </button>
              <button 
                onClick={() => onPaymentsChange([{mode: 'upi', amount: finalAmount}])}
                className="px-2.5 py-1.5 bg-blue-50/80 text-blue-700 rounded-md text-[11px] font-bold border border-blue-100/80 hover:bg-blue-100/80 transition-colors"
              >
                Full ₹{formatINR(finalAmount)} in UPI
              </button>
            </div>
          </div>

          {/* Settle Status Indicator */}
          <div className={`p-2.5 rounded-lg border transition-all shrink-0 ${Math.abs(balanceAmount) < 0.01
              ? "bg-emerald-50/50 border-emerald-100"
              : balanceAmount > 0
                ? "bg-amber-50/50 border-amber-100"
                : "bg-blue-50/50 border-blue-100"
            }`}>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <div>
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Received</span>
                <span className="text-[12px] text-slate-800 tabular-nums">₹{formatINR(paidAmount, 0)}</span>
              </div>
              {Math.abs(balanceAmount) >= 0.01 && (
                <div className="text-right">
                  <span className={`text-[7.5px] font-black uppercase tracking-widest block mb-0.5 ${balanceAmount > 0 ? "text-amber-550" : "text-blue-550"}`}>
                    {balanceAmount > 0 ? "Remaining" : "Change"}
                  </span>
                  <span className={`text-[12px] tabular-nums ${balanceAmount > 0 ? "text-amber-600" : "text-blue-600"}`}>
                    ₹{formatINR(Math.abs(balanceAmount), 0)}
                  </span>
                </div>
              )}
              {Math.abs(balanceAmount) < 0.01 && finalAmount > 0 && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 6.5L5 9L10 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold">Settled</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom Confirm Buttons (Generate Bill & Generate Invoice) ────── */}
        <div className="shrink-0 flex gap-2.5 pt-1">
          <button 
            onClick={handleQuickCheckout} 
            disabled={totalQty === 0 || balanceAmount > 0.01 || isSubmitting}
            className={`flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
              totalQty === 0 || balanceAmount > 0.01 || isSubmitting
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                : "text-blue-500 border-blue-400 border-2 hover:bg-blue-500 hover:text-white shadow-md shadow-slate-900/10 active:scale-97"
            }`}
          >
            {isSubmitting ? "..." : "Generate Bill"}
          </button>
          
          <button 
            onClick={handleGenerateInvoice} 
            disabled={totalQty === 0 || isSubmitting}
            className={`flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
              totalQty === 0 || isSubmitting
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                : "text-blue-500 border-blue-400 border-2 hover:bg-blue-500 hover:text-white shadow-lg shadow-blue-500/20 active:scale-97"
            }`}
          >
            Generate Invoice
          </button>
        </div>

      </div>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        items={items}
        customerName={customerName}
        phone={phone}
        payments={payments}
        includeGst={includeGst}
        totalAmount={totalAmount}
        gstAmount={gstAmount}
        finalAmount={finalAmount}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default BillingHeader;
