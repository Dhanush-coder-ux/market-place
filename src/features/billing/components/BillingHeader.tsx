import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  IndianRupee, ShoppingBag, Percent,
  Wallet, Banknote, ScanBarcode,
  Clock, Trash2, CheckCircle2, ArrowRight,
  Plus, ChevronDown, CreditCard,
  X
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
  onHoldBill: () => void;
  onClearBill: () => void;
}

const GST_PERCENT = 18;
const formatINR = (amount: number, decimals = 2) => amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const round2 = (n: number) => Math.round(n * 100) / 100;

const PaymentModeDropdown: React.FC<{
  value: PaymentMode;
  onChange: (val: PaymentMode) => void;
  isCreditAllowed: boolean;
}> = ({ value, onChange, isCreditAllowed }) => {
  const [isOpen, setIsOpen] = useState(false);

  const options: { value: PaymentMode; label: string; icon: any; color: string; bgColor: string; borderColor: string; disabled?: boolean }[] = [
    { value: "cash", label: "Cash", icon: <Banknote size={13} />, color: "text-emerald-600", bgColor: "bg-emerald-50/80", borderColor: "border-emerald-200/60" },
    { value: "upi", label: "UPI/Card", icon: <CreditCard size={13} />, color: "text-violet-600", bgColor: "bg-violet-50/80", borderColor: "border-violet-200/60" },
    { value: "credit", label: "Credit", icon: <Clock size={13} />, color: "text-blue-600", bgColor: "bg-blue-50/80", borderColor: "border-blue-200/60", disabled: !isCreditAllowed },
  ];

  const current = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 ${current.bgColor} border ${current.borderColor} text-[10px] font-black ${current.color} pl-2 pr-6 py-2 rounded-lg w-[95px] transition-all relative hover:brightness-95 active:scale-95 shadow-sm`}
      >
        <span className="shrink-0 opacity-80">{current.icon}</span>
        <span className="truncate">{current.label}</span>
        <ChevronDown size={10} className={`absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-[140px] bg-white border border-slate-200/60 rounded-lg shadow-2xl z-[101] py-2 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden backdrop-blur-xl bg-white/95">
            <div className="px-3 pb-2 mb-2 border-b border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select Mode</p>
            </div>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold transition-all relative ${opt.disabled ? "opacity-30 cursor-not-allowed" :
                    value === opt.value ? "bg-blue-50/80 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <span className={`shrink-0 ${value === opt.value ? "text-blue-600" : opt.color}`}>
                  {opt.icon}
                </span>
                {opt.label}
                {value === opt.value && (
                  <div className="ml-auto flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
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



const BillingHeader: React.FC<BillingHeaderProps> = ({
  items, customerData, customerName, phone,
  onConfirmOrder, isSubmitting, onHoldBill, onClearBill
}) => {
  const [includeGst, setIncludeGst] = useState(false);
  const [payments, setPayments] = useState<{ mode: PaymentMode; amount: number }[]>([
    { mode: "cash", amount: 0 }
  ]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  const totalQty = useMemo(() => items.reduce((s, i) => s + (i.qty || 0), 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + (i.tprice || 0), 0), [items]);
  const gstAmount = useMemo(() => round2((totalAmount * GST_PERCENT) / 100), [totalAmount]);
  const finalAmount = useMemo(() => includeGst ? round2(totalAmount + gstAmount) : totalAmount, [includeGst, totalAmount, gstAmount]);

  const isCreditAllowed = customerData ? customerData.outstanding < customerData.creditLimit : false;

  // Body Scroll Lock for Split Modal
  useEffect(() => {
    if (isSplitModalOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isSplitModalOpen]);

  useEffect(() => {
    // Set initial payment amount when total changes
    setPayments(prev => {
      if (prev.length === 1) {
        return [{ ...prev[0], amount: finalAmount }];
      }
      return prev;
    });
  }, [finalAmount]);

  const addPayment = () => {
    if (payments.length >= 3) return;
    setPayments([...payments, { mode: "upi", amount: 0 }]);
  };

  const removePayment = (index: number) => {
    if (payments.length <= 1) return;
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, updates: Partial<{ mode: PaymentMode; amount: number }>) => {
    setPayments(payments.map((p, i) => {
      if (i !== index) return p;
      const next = { ...p, ...updates };

      // Auto-fill logic when switching to credit
      if (updates.mode === "credit" && customerData) {
        const available = customerData.creditLimit - customerData.outstanding;
        const currentBalance = finalAmount - payments.reduce((s, pay, j) => s + (j === index ? 0 : pay.amount), 0);
        next.amount = Math.min(currentBalance, available);
      }

      // Validation for credit limit
      if (next.mode === "credit" && customerData) {
        const available = customerData.creditLimit - customerData.outstanding;
        if (next.amount > available) {
          next.amount = available;
        }
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
    setIncludeGst(false);
    setPayments([{ mode: "cash", amount: 0 }]);
  };

  const handleHoldBill = () => {
    if (totalQty === 0) return alert("Cart is empty. Nothing to hold.");
    onHoldBill();
    setIncludeGst(false);
    setPayments([{ mode: "cash", amount: 0 }]);
  };

  const handleClearBill = () => {
    if (totalQty === 0) return;
    if (window.confirm("Are you sure you want to clear the current cart?")) {
      onClearBill();
      setIncludeGst(false);
      setPayments([{ mode: "cash", amount: 0 }]);
    }
  };

  return (
    <>
      <div className="w-full h-full flex flex-col font-sans">

        {/* Summary Stats */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100/60">
          <p className="text-[10px] font-medium text-slate-400   mb-2.5">Summary</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg bg-slate-50/60 border border-slate-100/60 p-2.5 flex flex-col gap-0.5">
              <p className="text-[9px] font-medium text-slate-400   flex items-center gap-1">
                <ShoppingBag size={9} className="text-blue-400" /> Items
              </p>
              <p className="text-lg font-semibold text-slate-700 tabular-nums">{totalQty}</p>
            </div>
            <div className="rounded-lg bg-slate-50/60 border border-slate-100/60 p-2.5 flex flex-col gap-0.5">
              <p className="text-[9px] font-medium text-slate-400   flex items-center gap-1">
                <IndianRupee size={9} className="text-blue-400" /> Subtotal
              </p>
              <p className="text-lg font-semibold text-slate-700 tabular-nums">{formatINR(totalAmount, 0)}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Middle */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">

          {/* GST Toggle */}
          <div
            onClick={() => setIncludeGst(v => !v)}
            className={`rounded-lg border p-2.5 flex items-center justify-between transition-all duration-200 cursor-pointer ${includeGst ? "bg-blue-50/40 border-blue-200/60" : "bg-white border-slate-200/60 hover:border-slate-300/60"
              }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-200 ${includeGst ? "bg-blue-500/90 text-white" : "bg-slate-100 text-slate-400"}`}>
                <Percent size={12} strokeWidth={2.5} />
              </div>
              <div>
                <p className={`text-[11px] font-medium ${includeGst ? "text-blue-700" : "text-slate-600"}`}>GST {GST_PERCENT}%</p>
                <p className="text-[9px] font-normal text-slate-400">{includeGst ? "Included in total" : "Tap to include"}</p>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 ${includeGst ? "bg-blue-500/90 border-blue-500" : "border-slate-300"}`}>
              {includeGst && <CheckCircle2 size={10} className="text-white" />}
            </div>
          </div>

          {/* Total Payable */}
          <div className="rounded-lg bg-white p-4 flex flex-col gap-2 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className="text-[10px] font-medium text-slate-400  ">Total Payable</p>
                <div className="flex items-baseline mt-1">
                  <span className="text-[15px] font-medium text-slate-800 mr-0.5">₹</span>
                  <span className="text-[22px] font-semibold text-slate-800 tracking-tight tabular-nums">
                    {Math.floor(finalAmount).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[13px] font-normal text-slate-400 tabular-nums">
                    .{String(Math.round((finalAmount % 1) * 100)).padStart(2, "0")}
                  </span>
                </div>
              </div>
              <div className="bg-slate-100 text-slate-500 p-1.5 rounded-lg">
                <IndianRupee size={16} strokeWidth={1.5} />
              </div>
            </div>
            {includeGst && (
              <div className="pt-2 border-t border-slate-100/60 flex justify-between items-center">
                <span className="text-[10px] font-medium   text-slate-400">GST Amount</span>
                <span className="text-[12px] font-medium text-blue-600 tabular-nums">₹{formatINR(gstAmount)}</span>
              </div>
            )}
          </div>

          {/* Payment Overview Card */}
          <div className="mt-1">
            <div
              onClick={() => setIsSplitModalOpen(true)}
              className={`group cursor-pointer rounded-lg border p-3.5 transition-all duration-300 relative overflow-hidden ${Math.abs(balanceAmount) < 0.01
                  ? "bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/60"
                  : balanceAmount > 0
                    ? "bg-amber-50/40 border-amber-100 hover:bg-amber-50/60"
                    : "bg-blue-50/40 border-blue-100 hover:bg-blue-50/60"
                }`}
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${Math.abs(balanceAmount) < 0.01 ? "bg-emerald-500" : balanceAmount > 0 ? "bg-amber-500" : "bg-blue-500"
                    }`} />
                  <p className="text-[10px] font-black text-slate-500 tracking-wider">PAYMENT STATUS</p>
                </div>
                <button className="text-[9px] font-black text-blue-600 bg-white border border-blue-100 px-2 py-0.5 rounded-lg shadow-sm hover:bg-blue-50 transition-all">
                  MANAGE
                </button>
              </div>

              <div className="flex items-baseline justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Paid</span>
                  <span className="text-[18px] font-black text-slate-800 tabular-nums">₹{formatINR(paidAmount, 0)}</span>
                </div>
                <div className="flex flex-col items-end text-right">
                  <span className={`text-[8px] font-black uppercase tracking-wider ${balanceAmount > 0 ? "text-amber-500" : balanceAmount < 0 ? "text-blue-500" : "text-emerald-500"
                    }`}>
                    {balanceAmount > 0 ? "Remaining" : balanceAmount < 0 ? "Change" : "Settled"}
                  </span>
                  <span className={`text-[18px] font-black tabular-nums ${balanceAmount > 0 ? "text-amber-600" : balanceAmount < 0 ? "text-blue-600" : "text-emerald-600"
                    }`}>
                    ₹{formatINR(Math.abs(balanceAmount), 0)}
                  </span>
                </div>
              </div>

              <div className="mt-3 w-full h-1 bg-slate-200/40 rounded-full overflow-hidden flex gap-0.5 shadow-inner">
                {payments.map((p, i) => {
                  const width = finalAmount > 0 ? (p.amount / finalAmount) * 100 : 0;
                  if (width <= 0) return null;
                  return (
                    <div key={i} style={{ width: `${width}%` }} className={`h-full transition-all duration-700 ${p.mode === 'cash' ? 'bg-emerald-400' : p.mode === 'upi' ? 'bg-violet-400' : 'bg-blue-400'}`} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-4 border-t border-slate-100/60 bg-slate-50/30 shrink-0 flex flex-col gap-2.5">
          <div className="flex gap-2">
            <button onClick={handleHoldBill} disabled={totalQty === 0}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-[11px] font-bold transition-all duration-200 ${totalQty === 0 ? "bg-slate-50 border-slate-200/60 text-slate-300 cursor-not-allowed" : "bg-amber-50/40 border-amber-200/60 text-amber-600 hover:bg-amber-50/80 shadow-sm"
                }`}
            >
              <Clock size={14} strokeWidth={2} /> HOLD BILL
            </button>
            <button onClick={handleClearBill} disabled={totalQty === 0}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-[11px] font-bold transition-all duration-200 ${totalQty === 0 ? "bg-slate-50 border-slate-200/60 text-slate-300 cursor-not-allowed" : "bg-red-50/40 border-red-200/60 text-red-500 hover:bg-red-50/80 shadow-sm"
                }`}
            >
              <Trash2 size={14} strokeWidth={2} /> CLEAR
            </button>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200/60 bg-white text-[12px] font-bold text-slate-500 hover:bg-slate-50 transition-all duration-200 shadow-sm">
            <ScanBarcode size={16} strokeWidth={2} /> SCAN PRODUCT
          </button>
          <button onClick={handleGenerateInvoice} disabled={totalQty === 0 || balanceAmount > 0.01}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[14px] font-black text-white transition-all duration-300 ${totalQty === 0 || balanceAmount > 0.01 ? "bg-slate-200 cursor-not-allowed text-slate-400" : "bg-blue-600 hover:bg-blue-700 shadow-[0_4px_12px_rgba(59,130,246,0.3)] active:scale-95"
              }`}
          >
            {balanceAmount > 0.01 ? "PAY BALANCE TO PROCEED" : <>GENERATE INVOICE <ArrowRight size={16} strokeWidth={2} /></>}
          </button>
        </div>
      </div>

      {/* Payment Split Modal */}
      {isSplitModalOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
            onClick={() => setIsSplitModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200/60 pointer-events-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-none">Payment Split</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Total: ₹{formatINR(finalAmount, 0)}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSplitModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:rotate-90 transition-all shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto min-h-[300px] flex flex-col gap-6">
              <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
              `}</style>

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Modes</p>
                <button
                  onClick={addPayment}
                  disabled={payments.length >= 3}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black hover:bg-indigo-100 disabled:opacity-30 transition-all shadow-sm border border-indigo-100"
                >
                  <Plus size={11} /> ADD MODE
                </button>
              </div>

              <div className="space-y-3.5">
                {payments.map((p, idx) => (
                  <div key={idx} className="group/row bg-white border border-slate-200/60 rounded-xl p-3 flex gap-3 items-center shadow-sm hover:border-indigo-200 transition-all duration-300">
                    <PaymentModeDropdown
                      value={p.mode}
                      onChange={(mode) => updatePayment(idx, { mode })}
                      isCreditAllowed={isCreditAllowed}
                    />
                    <div className="flex-1 min-w-0 flex items-center gap-2 bg-slate-50/50 rounded-lg px-3 py-2 border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all shadow-inner">
                      <span className="text-slate-400 font-bold text-[11px]">₹</span>
                      <input
                        type="number" autoFocus={idx === payments.length - 1}
                        value={p.amount || ""}
                        onChange={(e) => updatePayment(idx, { amount: Number(e.target.value) })}
                        placeholder="0.00"
                        className="w-full bg-transparent text-[15px] font-black text-slate-800 outline-none tabular-nums"
                      />
                      {balanceAmount > 0 && (
                        <button
                          onClick={() => updatePayment(idx, { amount: round2(p.amount + balanceAmount) })}
                          className="shrink-0 px-2 py-1 rounded-md bg-indigo-600 text-white text-[9px] font-black hover:bg-indigo-700 shadow-md"
                        >
                          MAX
                        </button>
                      )}
                    </div>
                    {payments.length > 1 && (
                      <button onClick={() => removePayment(idx)} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all border border-rose-100 shadow-sm">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className={`mt-auto p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${Math.abs(balanceAmount) < 0.01 ? "bg-emerald-50/40 border-emerald-100" : balanceAmount > 0 ? "bg-amber-50/40 border-amber-100" : "bg-indigo-50/40 border-indigo-100"
                }`}>
                <div className="flex items-center justify-between mb-3.5 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${Math.abs(balanceAmount) < 0.01 ? "bg-emerald-500" : balanceAmount > 0 ? "bg-amber-500" : "bg-indigo-500"}`} />
                    <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Progress</p>
                  </div>
                  <span className={`text-[12px] font-black tabular-nums ${Math.abs(balanceAmount) < 0.01 ? "text-emerald-600" : balanceAmount > 0 ? "text-amber-600" : "text-indigo-600"}`}>
                    {finalAmount > 0 ? Math.min(100, Math.round((paidAmount / finalAmount) * 100)) : 0}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/40 rounded-full overflow-hidden flex gap-0.5 shadow-inner mb-5">
                  {payments.map((p, i) => {
                    const width = finalAmount > 0 ? (p.amount / finalAmount) * 100 : 0;
                    if (width <= 0) return null;
                    return <div key={i} style={{ width: `${width}%` }} className={`h-full transition-all duration-700 ${p.mode === 'cash' ? 'bg-emerald-400' : p.mode === 'upi' ? 'bg-violet-400' : 'bg-indigo-400'}`} />;
                  })}
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Received</span>
                    <span className="text-[18px] font-black text-slate-800 tabular-nums">₹{formatINR(paidAmount, 0)}</span>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${balanceAmount > 0 ? "text-amber-500" : balanceAmount < 0 ? "text-indigo-500" : "text-emerald-500"}`}>
                      {balanceAmount > 0 ? "Remaining" : balanceAmount < 0 ? "Change" : "Settled"}
                    </span>
                    <span className={`text-[18px] font-black tabular-nums ${balanceAmount > 0 ? "text-amber-600" : balanceAmount < 0 ? "text-indigo-600" : "text-emerald-600"}`}>
                      ₹{formatINR(Math.abs(balanceAmount), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-medium">Split your bill into up to 3 modes</p>
              <button
                onClick={() => setIsSplitModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[12px] font-black hover:bg-slate-800 shadow-lg transition-all active:scale-95"
              >
                DONE
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
