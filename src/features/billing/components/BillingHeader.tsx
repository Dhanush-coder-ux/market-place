import React, { useState, useMemo, useEffect } from "react";
import {
  IndianRupee, ShoppingBag, Percent,
  Wallet, Banknote, Smartphone, ScanBarcode,
  Clock, Trash2, CheckCircle2, ArrowRight,
  Plus, ChevronDown, CreditCard,
  AlertCircle, X
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
    { value: "cash", label: "Cash", icon: <Banknote size={12} />, color: "text-emerald-600", bgColor: "bg-emerald-50/50", borderColor: "border-emerald-100" },
    { value: "upi", label: "UPI/Card", icon: <CreditCard size={12} />, color: "text-violet-600", bgColor: "bg-violet-50/50", borderColor: "border-violet-100" },
    { value: "credit", label: "Credit", icon: <Clock size={12} />, color: "text-blue-600", bgColor: "bg-blue-50/50", borderColor: "border-blue-100", disabled: !isCreditAllowed },
  ];

  const current = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${current.bgColor} border ${current.borderColor} text-[11px] font-bold ${current.color} pl-2 pr-6 py-1.5 rounded-lg w-[100px] transition-all relative hover:brightness-95 active:scale-95`}
      >
        <span>{current.icon}</span>
        {current.label}
        <ChevronDown size={10} className={`absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 w-[140px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[101] py-1.5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
            <div className="px-2 pb-1.5 mb-1.5 border-b border-slate-50">
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
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold transition-all ${
                  opt.disabled ? "opacity-30 cursor-not-allowed grayscale" : 
                  value === opt.value ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={value === opt.value ? "text-blue-600" : opt.color}>
                  {opt.icon}
                </span>
                {opt.label}
                {value === opt.value && <div className="ml-auto w-1 h-3 rounded-full bg-blue-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const PaymentButton: React.FC<{ mode: PaymentMode; active: boolean; disabled?: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ mode, active, disabled, icon, label, onClick }) => {
  const activeStyles = {
    cash: "bg-emerald-50/60 border-emerald-300/60 text-emerald-700",
    upi: "bg-violet-50/60 border-violet-300/60 text-violet-700",
    credit: "bg-blue-50/60 border-blue-300/60 text-blue-700",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg border transition-all duration-200 text-[11px] font-medium ${
        disabled ? "opacity-30 cursor-not-allowed pointer-events-none" :
        active ? activeStyles[mode] : "bg-white border-slate-200/60 text-slate-400 hover:border-slate-300/80 hover:text-slate-500"
      }`}
    >
      {icon}
      {label}
    </button>
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

  const totalQty = useMemo(() => items.reduce((s, i) => s + (i.qty || 0), 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + (i.tprice || 0), 0), [items]);
  const gstAmount = useMemo(() => round2((totalAmount * GST_PERCENT) / 100), [totalAmount]);
  const finalAmount = useMemo(() => includeGst ? round2(totalAmount + gstAmount) : totalAmount, [includeGst, totalAmount, gstAmount]);

  const isCreditAllowed = customerData ? customerData.outstanding < customerData.creditLimit : false;

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
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2.5">Summary</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg bg-slate-50/60 border border-slate-100/60 p-2.5 flex flex-col gap-0.5">
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ShoppingBag size={9} className="text-blue-400" /> Items
              </p>
              <p className="text-lg font-semibold text-slate-700 tabular-nums">{totalQty}</p>
            </div>
            <div className="rounded-lg bg-slate-50/60 border border-slate-100/60 p-2.5 flex flex-col gap-0.5">
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
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
            className={`rounded-lg border p-2.5 flex items-center justify-between transition-all duration-200 cursor-pointer ${
              includeGst ? "bg-blue-50/40 border-blue-200/60" : "bg-white border-slate-200/60 hover:border-slate-300/60"
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
          <div className="rounded-xl bg-white p-4 flex flex-col gap-2 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Payable</p>
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
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">GST Amount</span>
                <span className="text-[12px] font-medium text-blue-600 tabular-nums">₹{formatINR(gstAmount)}</span>
              </div>
            )}
          </div>

          {/* Payment Mode */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Split</p>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[8px] font-bold text-slate-500">
                  <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                  {payments.length} {payments.length === 1 ? 'MODE' : 'MODES'}
                </div>
              </div>
              <button 
                onClick={addPayment}
                disabled={payments.length >= 3}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-30 flex items-center gap-1 group transition-all"
              >
                <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Plus size={10} />
                </div>
                Split
              </button>
            </div>
            
            <div className="space-y-3">
              {payments.map((p, idx) => (
                <div key={idx} className="group/row flex flex-col gap-2 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 relative animate-in slide-in-from-top-4">
                  <div className="flex gap-2 items-center">
                    <PaymentModeDropdown
                      value={p.mode}
                      onChange={(mode) => updatePayment(idx, { mode })}
                      isCreditAllowed={isCreditAllowed}
                    />
                    
                    <div className="flex-1 flex items-center gap-2 bg-slate-50/50 rounded-lg px-2 py-1.5 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
                      <span className="text-slate-400 font-medium text-[11px]">₹</span>
                      <input 
                        type="number"
                        value={p.amount || ""}
                        onChange={(e) => updatePayment(idx, { amount: Number(e.target.value) })}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-[14px] font-bold text-slate-800 outline-none placeholder:text-slate-300 tabular-nums"
                      />
                      {balanceAmount > 0 && (
                        <button 
                          onClick={() => updatePayment(idx, { amount: p.amount + balanceAmount })}
                          className="text-[8px] font-bold uppercase tracking-tighter bg-blue-500 text-white px-1.5 py-0.5 rounded-md hover:bg-blue-600 active:scale-95 transition-all"
                        >
                          Max
                        </button>
                      )}
                    </div>

                    {payments.length > 1 && (
                      <button 
                        onClick={() => removePayment(idx)}
                        className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {p.mode === "credit" && customerData && (
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Credit Limit Balance</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 tabular-nums">
                        ₹{formatINR(customerData.creditLimit - customerData.outstanding)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Payment Summary Box */}
            <div className={`mt-2 p-3 rounded-2xl border transition-all duration-300 ${
              Math.abs(balanceAmount) < 0.01 
                ? "bg-emerald-50/50 border-emerald-100" 
                : balanceAmount > 0 
                  ? "bg-amber-50/50 border-amber-100" 
                  : "bg-blue-50/50 border-blue-100"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${Math.abs(balanceAmount) < 0.01 ? "bg-emerald-500" : balanceAmount > 0 ? "bg-amber-500" : "bg-blue-500"}`} />
                  Payment Progress
                </p>
                <span className={`text-[10px] font-black tabular-nums ${Math.abs(balanceAmount) < 0.01 ? "text-emerald-600" : balanceAmount > 0 ? "text-amber-600" : "text-blue-600"}`}>
                  {Math.min(100, Math.round((paidAmount / finalAmount) * 100))}%
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden flex gap-0.5">
                {payments.map((p, i) => (
                  <div 
                    key={i}
                    style={{ width: `${(p.amount / finalAmount) * 100}%` }}
                    className={`h-full transition-all duration-500 ${
                      p.mode === 'cash' ? 'bg-emerald-400' : p.mode === 'upi' ? 'bg-violet-400' : 'bg-blue-400'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-3 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total Paid</span>
                  <span className="text-[14px] font-black text-slate-700 tabular-nums">₹{formatINR(paidAmount)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    {balanceAmount > 0 ? "Remaining" : "Balance"}
                  </span>
                  <span className={`text-[14px] font-black tabular-nums ${balanceAmount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    ₹{formatINR(Math.abs(balanceAmount))}
                  </span>
                </div>
              </div>

              {balanceAmount > 0.01 && (
                <div className="mt-2.5 pt-2.5 border-t border-amber-100 flex items-center gap-2">
                  <AlertCircle size={12} className="text-amber-500" />
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tight">Invoice cannot be generated until fully paid</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-slate-100/60 bg-slate-50/30 shrink-0 flex flex-col gap-2">
          <div className="flex gap-2">
            <button onClick={handleHoldBill} disabled={totalQty === 0}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[11px] font-medium transition-all duration-200 ${
                totalQty === 0 ? "bg-slate-50 border-slate-200/60 text-slate-300 cursor-not-allowed" : "bg-amber-50/40 border-amber-200/60 text-amber-600 hover:bg-amber-50/80"
              }`}
            >
              <Clock size={13} strokeWidth={1.5} /> Hold
            </button>
            <button onClick={handleClearBill} disabled={totalQty === 0}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[11px] font-medium transition-all duration-200 ${
                totalQty === 0 ? "bg-slate-50 border-slate-200/60 text-slate-300 cursor-not-allowed" : "bg-red-50/40 border-red-200/60 text-red-500 hover:bg-red-50/80"
              }`}
            >
              <Trash2 size={13} strokeWidth={1.5} /> Clear
            </button>
          </div>
          <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200/60 bg-white text-[12px] font-normal text-slate-500 hover:bg-slate-50 transition-all duration-200">
            <ScanBarcode size={14} strokeWidth={1.5} /> Scan Product
          </button>
          <button onClick={handleGenerateInvoice} disabled={totalQty === 0}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 ${
              totalQty === 0 ? "bg-slate-200 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 shadow-[0_1px_3px_rgba(59,130,246,0.3)]"
            }`}
          >
            Generate Invoice <ArrowRight size={14} strokeWidth={1.5} />
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
