import React, { useState, useMemo } from "react";
import {
  IndianRupee, ShoppingBag,
  Wallet, Banknote,
  Clock, Trash2, ArrowRight,
  Plus, ChevronDown, CreditCard,
  AlertCircle
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
}


const formatINR = (amount: number, decimals = 2) => amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const round2 = (n: number) => Math.round(n * 100) / 100;

/* ── Compact Payment Mode Selector ─────────────────────────────────────────── */

const PaymentModeDropdown: React.FC<{
  value: PaymentMode;
  onChange: (val: PaymentMode) => void;
  isCreditAllowed: boolean;
}> = ({ value, onChange, isCreditAllowed }) => {
  const [isOpen, setIsOpen] = useState(false);

  const options: { value: PaymentMode; label: string; icon: any; color: string; bgColor: string; borderColor: string; disabled?: boolean }[] = [
    { value: "cash", label: "Cash", icon: <Banknote size={11} />, color: "text-emerald-600", bgColor: "bg-emerald-50/80", borderColor: "border-emerald-200/60" },
    { value: "upi", label: "UPI/Card", icon: <CreditCard size={11} />, color: "text-violet-600", bgColor: "bg-violet-50/80", borderColor: "border-violet-200/60" },
    { value: "credit", label: "Credit", icon: <Clock size={11} />, color: "text-blue-600", bgColor: "bg-blue-50/80", borderColor: "border-blue-200/60", disabled: !isCreditAllowed },
  ];

  const current = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 ${current.bgColor} border ${current.borderColor} text-[9px] font-bold ${current.color} pl-1.5 pr-5 py-1.5 rounded-md w-[80px] transition-all relative hover:brightness-95 active:scale-95`}
      >
        <span className="shrink-0 opacity-80">{current.icon}</span>
        <span className="truncate">{current.label}</span>
        <ChevronDown size={8} className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-[120px] bg-white border border-slate-200/60 rounded-md shadow-xl z-[101] py-1 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-bold transition-all ${opt.disabled ? "opacity-30 cursor-not-allowed" :
                  value === opt.value ? "bg-blue-50/80 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <span className={`shrink-0 ${value === opt.value ? "text-blue-600" : opt.color}`}>
                  {opt.icon}
                </span>
                {opt.label}
                {value === opt.value && (
                  <div className="ml-auto">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Main Component ────────────────────────────────────────────────────────── */

const BillingHeader: React.FC<BillingHeaderProps> = ({
  items, customerData, customerName, phone,
  onConfirmOrder, isSubmitting,
  includeGst, totalAmount, gstAmount, finalAmount,
  payments, onPaymentsChange,
}) => {
  const [showInvoice, setShowInvoice] = useState(false);

  const totalQty = useMemo(() => items.reduce((s, i) => s + (i.qty || 0), 0), [items]);
  const filledItems = useMemo(() => items.filter(i => !!i.name).length, [items]);
  const isCreditAllowed = customerData ? customerData.outstanding < customerData.creditLimit : false;

  const addPayment = () => {
    if (payments.length >= 3) return;
    onPaymentsChange([...payments, { mode: "upi", amount: 0 }]);
  };

  const removePayment = (index: number) => {
    if (payments.length <= 1) return;
    onPaymentsChange(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, updates: Partial<{ mode: PaymentMode; amount: number }>) => {
    onPaymentsChange(payments.map((p, i) => {
      if (i !== index) return p;
      const next = { ...p, ...updates };

      if (updates.mode === "credit" && customerData) {
        const available = customerData.creditLimit - customerData.outstanding;
        const currentBalance = finalAmount - payments.reduce((s, pay, j) => s + (j === index ? 0 : pay.amount), 0);
        next.amount = Math.min(currentBalance, available);
      }

      if (next.mode === "credit" && customerData) {
        const available = customerData.creditLimit - customerData.outstanding;
        if (next.amount > available) next.amount = available;
      }
      return next;
    }));
  };

  const paidAmount = useMemo(() => payments.reduce((s, p) => s + (p.amount || 0), 0), [payments]);
  const balanceAmount = useMemo(() => finalAmount - paidAmount, [finalAmount, paidAmount]);

  const handleGenerateInvoice = () => {
    if (totalQty === 0) return alert("Cart is empty");
    if (!customerName.trim() && !phone.trim()) return alert("Please select a customer first.");
    setShowInvoice(true);
  };

  const handleConfirm = (status: BillStatus) => {
    onConfirmOrder(payments, includeGst, status);
    setShowInvoice(false);
    onPaymentsChange([{ mode: "cash", amount: 0 }]);
  };

  // Credit-related derived values
  const creditPaymentAmount = payments
    .filter(p => p.mode === "credit")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const projectedOutstanding = (customerData?.outstanding || 0) + creditPaymentAmount;
  const isCreditExceeded = customerData ? projectedOutstanding > customerData.creditLimit : false;

  return (
    <>
      <div className="w-full h-full flex flex-col font-sans">

        <style>{`
          input[type=number]::-webkit-inner-spin-button, 
          input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* ── Order Summary ─────────────────────────────────────── */}
        <div className="px-3 pt-3 pb-2 border-b border-slate-100/60 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Order Summary</p>
            <span className="text-[9px] font-medium text-slate-400 tabular-nums">
              {filledItems} item{filledItems !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-md bg-slate-50/80 border border-slate-100/60 px-2.5 py-2 flex flex-col">
              <p className="text-[8px] font-medium text-slate-400 flex items-center gap-1 mb-0.5">
                <ShoppingBag size={8} className="text-slate-400" /> Qty
              </p>
              <p className="text-base font-bold text-slate-800 tabular-nums leading-none">{totalQty}</p>
            </div>
            <div className="rounded-md bg-slate-50/80 border border-slate-100/60 px-2.5 py-2 flex flex-col">
              <p className="text-[8px] font-medium text-slate-400 flex items-center gap-1 mb-0.5">
                <IndianRupee size={8} className="text-slate-400" /> Subtotal
              </p>
              <p className="text-base font-bold text-slate-800 tabular-nums leading-none">₹{formatINR(totalAmount, 0)}</p>
            </div>
          </div>
        </div>

        {/* ── Payment Modes (Scrollable) ────────────────────────── */}
        <div className="flex-1 px-3 py-2.5 flex flex-col gap-2 min-h-0 overflow-y-auto hide-scrollbar">

          <div className="flex items-center justify-between shrink-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment</p>
            <button
              onClick={addPayment}
              disabled={payments.length >= 3}
              className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold hover:bg-blue-100 disabled:opacity-30 transition-all border border-blue-100/60"
            >
              <Plus size={9} /> Split
            </button>
          </div>

          {/* Payment Rows */}
          <div className="space-y-1.5 shrink-0">
            {payments.map((p, idx) => (
              <div key={idx} className="flex gap-1.5 items-center">
                <PaymentModeDropdown
                  value={p.mode}
                  onChange={(mode) => updatePayment(idx, { mode })}
                  isCreditAllowed={isCreditAllowed}
                />
                <div className="flex-1 min-w-0 flex items-center gap-1 bg-slate-50/60 rounded-md px-2 py-1.5 border border-slate-200/60 focus-within:border-blue-300 focus-within:bg-white transition-all">
                  <span className="text-slate-400 font-bold text-[10px]">₹</span>
                  <input
                    type="number"
                    autoFocus={idx === payments.length - 1}
                    value={p.amount || ""}
                    onChange={(e) => updatePayment(idx, { amount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full bg-transparent text-[12px] font-bold text-slate-800 outline-none tabular-nums"
                  />
                  {balanceAmount > 0 && (
                    <button
                      onClick={() => updatePayment(idx, { amount: round2(p.amount + balanceAmount) })}
                      className="shrink-0 px-1 py-0.5 rounded bg-blue-600 text-white text-[7px] font-bold hover:bg-blue-700 transition-colors"
                    >
                      MAX
                    </button>
                  )}
                </div>
                {payments.length > 1 && (
                  <button
                    onClick={() => removePayment(idx)}
                    className="w-6 h-6 rounded bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all border border-rose-100/60 shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Payment Balance Summary */}
          <div className={`p-2.5 rounded-md border transition-all shrink-0 ${Math.abs(balanceAmount) < 0.01
              ? "bg-emerald-50/50 border-emerald-100/80"
              : balanceAmount > 0
                ? "bg-amber-50/50 border-amber-100/80"
                : "bg-blue-50/50 border-blue-100/80"
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Received</span>
                <span className="text-sm font-bold text-slate-800 tabular-nums leading-tight">₹{formatINR(paidAmount, 0)}</span>
              </div>
              {Math.abs(balanceAmount) >= 0.01 && (
                <div className="text-right">
                  <span className={`text-[8px] font-bold uppercase tracking-wider block ${balanceAmount > 0 ? "text-amber-500" : "text-blue-500"}`}>
                    {balanceAmount > 0 ? "Remaining" : "Change"}
                  </span>
                  <span className={`text-sm font-bold tabular-nums leading-tight ${balanceAmount > 0 ? "text-amber-600" : "text-blue-600"}`}>
                    ₹{formatINR(Math.abs(balanceAmount), 0)}
                  </span>
                </div>
              )}
              {Math.abs(balanceAmount) < 0.01 && finalAmount > 0 && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 6.5L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold">Settled</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Credit Account Card (compact) ──────────────────── */}
          {customerData && (() => {
            const currentOutstanding = customerData.outstanding;
            const creditLimit = customerData.creditLimit;
            const afterBillOutstanding = currentOutstanding + creditPaymentAmount;
            const creditAvailable = Math.max(0, creditLimit - afterBillOutstanding);
            const usagePercent = creditLimit > 0 ? Math.min(100, (afterBillOutstanding / creditLimit) * 100) : 0;
            const isUsingCreditNow = creditPaymentAmount > 0;

            return (
              <div className={`rounded-lg border overflow-hidden transition-all shrink-0 ${isCreditExceeded
                  ? "border-red-200/80 bg-gradient-to-b from-red-50/60 to-red-50/20"
                  : isUsingCreditNow
                    ? "border-blue-200/60 bg-gradient-to-b from-blue-50/30 to-slate-50/30"
                    : "border-slate-200/60 bg-gradient-to-b from-slate-50/50 to-white/50"
                }`}>
                {/* Header */}
                <div className={`px-2.5 py-1.5 flex items-center justify-between border-b ${isCreditExceeded 
                    ? "border-red-100/80" 
                    : isUsingCreditNow 
                      ? "border-blue-100/60"
                      : "border-slate-100/80"
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${isCreditExceeded 
                        ? "bg-red-100 text-red-500" 
                        : isUsingCreditNow 
                          ? "bg-blue-100 text-blue-500"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                      <Wallet size={10} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700">Credit Account</span>
                  </div>
                  {isCreditExceeded ? (
                    <span className="flex items-center gap-0.5 text-[8px] font-bold text-red-600 bg-red-100/80 px-1.5 py-0.5 rounded-full">
                      <AlertCircle size={8} /> EXCEEDED
                    </span>
                  ) : isUsingCreditNow ? (
                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100/50">
                      USING CREDIT
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200/50">
                      AVAILABLE
                    </span>
                  )}
                </div>

                {/* Credit Gauge */}
                <div className="px-2.5 pt-2 pb-1.5">
                  <div className="h-1.5 rounded-full bg-slate-200/60 overflow-hidden relative">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${isCreditExceeded ? "bg-red-400" : usagePercent > 75 ? "bg-amber-400" : "bg-blue-500"
                        }`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[8px] text-slate-400 tabular-nums">₹{formatINR(afterBillOutstanding, 0)}</span>
                    <span className="text-[8px] text-slate-400 tabular-nums">Limit: ₹{formatINR(creditLimit, 0)}</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="px-2.5 pb-2">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="bg-white/80 rounded px-1.5 py-1.5 border border-slate-100/60 text-center">
                      <p className="text-[7px] font-medium text-slate-400">Outstanding</p>
                      <p className="text-[10px] font-bold text-slate-600 tabular-nums">₹{formatINR(currentOutstanding, 0)}</p>
                    </div>
                    <div className={`rounded px-1.5 py-1.5 border text-center ${isCreditExceeded ? "bg-red-50/80 border-red-100/60" : "bg-blue-50/80 border-blue-100/60"
                      }`}>
                      <p className={`text-[7px] font-medium ${isCreditExceeded ? "text-red-400" : "text-blue-400"}`}>This Bill</p>
                      <p className={`text-[10px] font-bold tabular-nums ${isCreditExceeded ? "text-red-600" : "text-blue-600"}`}>
                        +₹{formatINR(creditPaymentAmount, 0)}
                      </p>
                    </div>
                    <div className="bg-white/80 rounded px-1.5 py-1.5 border border-slate-100/60 text-center">
                      <p className="text-[7px] font-medium text-slate-400">After</p>
                      <p className={`text-[10px] font-bold tabular-nums ${isCreditExceeded ? "text-red-600" : "text-slate-700"}`}>
                        ₹{formatINR(afterBillOutstanding, 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className={`px-2.5 py-1.5 border-t ${isCreditExceeded ? "border-red-100/80 bg-red-50/30" : "border-blue-100/40 bg-white/50"
                  }`}>
                  {isCreditExceeded ? (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle size={10} className="text-red-500 shrink-0" />
                      <p className="text-[9px] font-medium text-red-600 leading-tight">
                        Exceeds by <span className="font-bold">₹{formatINR(afterBillOutstanding - creditLimit, 0)}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-medium text-slate-500">Available</span>
                      <span className="text-[10px] font-bold text-emerald-600 tabular-nums">₹{formatINR(creditAvailable, 0)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Subtle credit badge when customer is linked but not using credit */}
          {customerData && creditPaymentAmount === 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50/60 border border-slate-100/60 rounded-md shrink-0">
              <Wallet size={10} className="text-slate-400" />
              <span className="text-[9px] font-medium text-slate-500">
                Credit: <span className="font-bold text-slate-600 tabular-nums">₹{formatINR(Math.max(0, customerData.creditLimit - customerData.outstanding), 0)}</span>
              </span>
            </div>
          )}
        </div>

        {/* ── Confirm Button ─────────────────────────────────────── */}
        <div className="px-3 py-3 border-t border-slate-100/60 bg-slate-50/30 shrink-0">
          {/* Grand Total */}
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[10px] font-medium text-slate-500">Total</span>
            <div className="flex items-center gap-0.5 text-blue-600">
              <IndianRupee size={13} strokeWidth={2} />
              <span className="text-lg font-bold tabular-nums">{formatINR(finalAmount, 0)}</span>
            </div>
          </div>

          <button onClick={handleGenerateInvoice} disabled={totalQty === 0 || balanceAmount > 0.01 || isSubmitting}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-bold text-white transition-all duration-200 ${totalQty === 0 || balanceAmount > 0.01 || isSubmitting
                ? "bg-slate-200 cursor-not-allowed text-slate-400"
                : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
              }`}
          >
            {isSubmitting ? "Processing..." : balanceAmount > 0.01 ? "PAY BALANCE" : <>GENERATE INVOICE <ArrowRight size={13} strokeWidth={2.5} /></>}
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
