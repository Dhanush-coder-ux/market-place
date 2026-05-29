import React, { useState, useMemo } from "react";
import {
  Banknote, Clock, Trash2, Plus, ChevronDown, CreditCard, User, X
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
        className={`flex items-center gap-1.5 ${current.bgColor} border ${current.borderColor} text-[10px] font-bold ${current.color} pl-2 pr-5 py-1.5 rounded-lg w-[85px] transition-all relative hover:brightness-95 active:scale-95`}
      >
        <span className="shrink-0 opacity-80">{current.icon}</span>
        <span className="truncate">{current.label}</span>
        <ChevronDown size={9} className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-transform duration-350 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-[120px] bg-white border border-slate-200/65 rounded-lg shadow-xl z-[101] py-1 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
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
                  value === opt.value ? "bg-blue-55 text-blue-700" : "text-slate-650 hover:bg-slate-50"
                  }`}
              >
                <span className={`shrink-0 ${value === opt.value ? "text-blue-600" : opt.color}`}>
                  {opt.icon}
                </span>
                {opt.label}
                {value === opt.value && (
                  <div className="ml-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
  onAddCustomerClick,
  onDetachCustomer
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
            <div className="p-3.5 bg-blue-50/40 border border-blue-200/70 rounded-xl flex items-center justify-evenly shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-blue-150 flex items-center justify-center text-blue-500 shrink-0">
                  <User size={15} />
                </div>
                <div>
                  <h4 className="text-[12px] font-bold text-slate-800">No Customer Selected</h4>
                  <p className="text-[9px] text-blue-600/80 font-bold uppercase mt-0.5 tracking-tight">Selection Required to proceed</p>
                </div>
              </div>
              <div>
              <button 
                onClick={onAddCustomerClick}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-lg text-[10px] font-bold text-white shadow-sm transition-all duration-150 active:scale-95 cursor-pointer animate-none"
              >
                <Plus size={10} strokeWidth={3} /> Select / Create
                <kbd className="ml-1 text-[8px] text-blue-200 font-mono font-bold leading-none bg-blue-500 border border-blue-400 px-1 py-0.2 rounded shadow-sm">F4</kbd>
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
        <div className="border border-slate-150 rounded-xl p-3.5 space-y-3 shadow-sm flex-1 flex flex-col min-h-0 bg-slate-50/20">
          <div className="flex items-center justify-between shrink-0 border-b border-slate-100 pb-1.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SPILIT PAYMENTS</p>
            <button
              onClick={addPayment}
              disabled={payments.length >= 3}
              className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold hover:bg-blue-100 disabled:opacity-30 transition-all border border-blue-100/60"
            >
              <Plus size={9} /> Split
            </button>
          </div>

          {/* Payment list scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar min-h-[100px]">
            {payments.map((p, idx) => (
              <div key={idx} className="flex gap-1.5 items-center">
                <PaymentModeDropdown
                  value={p.mode}
                  onChange={(mode) => updatePayment(idx, { mode })}
                  isCreditAllowed={isCreditAllowed}
                />
                <div className="flex-1 min-w-0 flex items-center gap-1 bg-white rounded-lg px-2 py-1.5 border border-slate-200 focus-within:border-blue-300 transition-all shadow-sm">
                  <span className="text-slate-400 font-bold text-[10px]">₹</span>
                  <input
                    type="number"
                    autoFocus={idx === payments.length - 1}
                    value={p.amount || ""}
                    onChange={(e) => updatePayment(idx, { amount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full bg-transparent text-[11px] font-bold text-slate-700 outline-none tabular-nums"
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
                    className="w-6 h-6 rounded bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all border border-rose-100 shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
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
            disabled={totalQty === 0 || balanceAmount > 0.01 || isSubmitting || !customerData}
            className={`flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
              totalQty === 0 || balanceAmount > 0.01 || isSubmitting || !customerData
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                : "text-blue-500 border-blue-400 border-2 hover:bg-blue-500 hover:text-white shadow-md shadow-slate-900/10 active:scale-97"
            }`}
          >
            {isSubmitting ? "..." : "Generate Bill"}
          </button>
          
          <button 
            onClick={handleGenerateInvoice} 
            disabled={totalQty === 0 || isSubmitting || !customerData}
            className={`flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
              totalQty === 0 || isSubmitting || !customerData
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
