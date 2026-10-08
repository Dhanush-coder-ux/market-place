import React, { useState, useMemo } from "react";
import {
  Banknote, Clock, CreditCard, User, X, Search
} from "lucide-react";
import { BillingItem, CustomerData } from "../types";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { BillTotals, formatINR } from "@/utils/pricing";

type PaymentMode = "cash" | "upi" | "credit" | "card";

interface BillingHeaderProps {
  items: BillingItem[];
  customerData: CustomerData | null;
  onConfirmOrder: (payments: { mode: string, amount: number }[], includeGst: boolean, status: string) => void;
  isSubmitting: boolean;
  // Lifted state from parent
  includeGst: boolean;
  totalAmount: number;
  gstAmount: number;
  finalAmount: number;
  billDiscount?: { mode: '%' | '₹'; value: number };
  onBillDiscountChange?: (discount: { mode: '%' | '₹'; value: number }) => void;
  billTotals?: BillTotals;
  payments: { mode: PaymentMode; amount: number }[];
  onPaymentsChange: (payments: { mode: PaymentMode; amount: number }[]) => void;
  onAddCustomerClick: () => void;
  onDetachCustomer: () => void;
  onGenerateInvoice: () => void;
}

const formatPrice = (amount: number) => {
  if (amount === 0) return "0.00";
  const abs = Math.abs(amount);
  let decimals = 2;
  if (abs < 0.01) {
    decimals = Math.max(2, Math.ceil(-Math.log10(abs)) + 2);
  }
  return amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ── Main Component ────────────────────────────────────────────────────────── */
const BillingHeader: React.FC<BillingHeaderProps> = ({
  items, customerData,
  onConfirmOrder, isSubmitting,
  includeGst, totalAmount, gstAmount, finalAmount,
  billDiscount, onBillDiscountChange, billTotals,
  payments, onPaymentsChange,
  onAddCustomerClick,
  onDetachCustomer,
  onGenerateInvoice
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
    onGenerateInvoice();
  };

  const handleQuickCheckout = () => {
    if (totalQty === 0) return alert("Cart is empty");
    if (balanceAmount > 0.01) return alert("Please pay the full balance amount first.");
    setShowConfirmDialog(true);
  };

  const handleConfirmCheckout = () => {
    onConfirmOrder(payments, includeGst, "COMPLETED");
    setShowConfirmDialog(false);
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
                  <span className="font-bold text-blue-600">₹{formatINR(customerData.creditLimit)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                  <span>Already owed</span>
                  <span className="font-bold text-slate-550">₹{formatINR(customerData.outstanding)}</span>
                </div>
                <div className="w-full h-px bg-blue-100 my-1.5" />
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span>Available to use</span>
                  <span className="font-extrabold text-emerald-600">₹{formatINR(Math.max(0, customerData.creditLimit - customerData.outstanding))}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Billing Summary & Discount Breakdown ───────────────────── */}
        <div className="border border-slate-150 rounded-xl p-3.5 space-y-3 shadow-sm bg-slate-50/20">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">BILLING SUMMARY</p>

          <div className="space-y-1.5 text-[11px] font-semibold text-slate-600">
            <div className="flex justify-between">
              <span>Items count</span>
              <span className="font-bold text-slate-800 tabular-nums">{filledItems} items ({totalQty} units)</span>
            </div>
            <div className="flex justify-between">
              <span>Base Subtotal</span>
              <span className="font-bold text-slate-800 tabular-nums">₹{formatPrice(billTotals?.baseSubtotal ?? totalAmount)}</span>
            </div>

            {/* Level 1: Product Offers Discount */}
            {billTotals && billTotals.productDiscountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Product Offers</span>
                <span className="font-bold tabular-nums">−₹{formatPrice(billTotals.productDiscountTotal)}</span>
              </div>
            )}

            {/* Level 2: Item / Line Discounts */}
            {billTotals && billTotals.lineDiscountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Item Discounts</span>
                <span className="font-bold tabular-nums">−₹{formatPrice(billTotals.lineDiscountTotal)}</span>
              </div>
            )}

            {/* Level 3: Bill Level Discount Input */}
            <div className="pt-1 pb-0.5">
              <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-700 shrink-0">Bill Discount</span>
                <div className="flex items-center gap-1">
                  <div className="flex bg-slate-100 rounded p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onBillDiscountChange && onBillDiscountChange({ mode: '%', value: billDiscount?.value ?? 0 })}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-all ${billDiscount?.mode === '%' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => onBillDiscountChange && onBillDiscountChange({ mode: '₹', value: billDiscount?.value ?? 0 })}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-all ${billDiscount?.mode === '₹' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      ₹
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={billDiscount?.value || ''}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      if (onBillDiscountChange) {
                        onBillDiscountChange({
                          mode: billDiscount?.mode ?? '%',
                          value: val,
                        });
                      }
                    }}
                    className="w-16 text-right px-1.5 py-0.5 text-xs font-bold border border-slate-200 rounded outline-none focus:border-blue-500 tabular-nums bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Bill Discount Applied Total */}
            {billTotals && billTotals.billDiscountTotal > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>Bill Discount Applied</span>
                <span className="font-bold tabular-nums">−₹{formatPrice(billTotals.billDiscountTotal)}</span>
              </div>
            )}

            {/* Taxable Value */}
            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
              <span>Taxable Value</span>
              <span className="font-semibold tabular-nums">₹{formatPrice(billTotals?.totalTaxable ?? totalAmount)}</span>
            </div>

            {/* GST Tax Summary Grouped by Rate */}
            {billTotals && billTotals.taxGroups.length > 0 ? (
              billTotals.taxGroups.map(g => (
                <div key={g.gstRate} className="flex justify-between text-[10px] text-slate-500 pl-2">
                  <span>GST {g.gstRate}% (CGST {formatPrice(g.cgst)} + SGST {formatPrice(g.sgst)})</span>
                  <span className="font-medium tabular-nums">+₹{formatPrice(g.totalTax)}</span>
                </div>
              ))
            ) : (
              includeGst && (
                <div className="flex justify-between text-indigo-650">
                  <span>Tax / GST</span>
                  <span className="font-bold tabular-nums">+₹{formatPrice(gstAmount)}</span>
                </div>
              )
            )}

            {/* Round Off */}
            {billTotals && Math.abs(billTotals.roundOff) > 0.001 && (
              <div className="flex justify-between text-slate-400 text-[10.5px]">
                <span>Round Off</span>
                <span className="font-mono tabular-nums">{billTotals.roundOff >= 0 ? `+₹${billTotals.roundOff.toFixed(2)}` : `−₹${Math.abs(billTotals.roundOff).toFixed(2)}`}</span>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100 border-dashed my-2" />

          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Grand Total</span>
            <span className="text-base font-black text-blue-600 tabular-nums">₹{formatPrice(finalAmount)}</span>
          </div>

          {/* Customer Savings Line */}
          {billTotals && billTotals.totalSavings > 0 && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-xs font-bold text-emerald-800 animate-in fade-in duration-200">
              🎉 You saved ₹{formatPrice(billTotals.totalSavings)} on this bill!
            </div>
          )}
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
                    {p.mode === 'card' && <CreditCard size={14} className="opacity-60" />}
                    <span className="capitalize">{p.mode === 'upi' ? 'UPI' : p.mode === 'credit' ? 'On Credit' : p.mode === 'card' ? 'Card' : p.mode}</span>
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
            <div className="grid grid-cols-2 gap-2 p-2 border border-dashed border-slate-200 rounded-lg">
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
                onClick={() => addPayment('card')}
                disabled={payments.some(p => p.mode === 'card')}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-white border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CreditCard size={12} className="opacity-60" /> Card
              </button>
              <button
                onClick={() => addPayment('credit')}
                disabled={!isCreditAllowed || payments.some(p => p.mode === 'credit')}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-white border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Clock size={12} className="opacity-60" /> On Credit
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onPaymentsChange([{ mode: 'cash', amount: finalAmount }])}
                className="px-2.5 py-1.5 bg-blue-50/80 text-blue-700 rounded-md text-[11px] font-bold border border-blue-100/80 hover:bg-blue-100/80 transition-colors"
              >
                Full ₹{formatINR(finalAmount)} in Cash
              </button>
              <button
                onClick={() => onPaymentsChange([{ mode: 'upi', amount: finalAmount }])}
                className="px-2.5 py-1.5 bg-blue-50/80 text-blue-700 rounded-md text-[11px] font-bold border border-blue-100/80 hover:bg-blue-100/80 transition-colors"
              >
                Full ₹{formatINR(finalAmount)} in UPI
              </button>
              <button
                onClick={() => onPaymentsChange([{ mode: 'card', amount: finalAmount }])}
                className="px-2.5 py-1.5 bg-blue-50/80 text-blue-700 rounded-md text-[11px] font-bold border border-blue-100/80 hover:bg-blue-100/80 transition-colors"
              >
                Full ₹{formatINR(finalAmount)} in Card
              </button>
              {customerData && (
                <button
                  onClick={() => onPaymentsChange([{ mode: 'credit', amount: finalAmount }])}
                  disabled={finalAmount > Math.max(0, customerData.creditLimit - customerData.outstanding)}
                  className="px-2.5 py-1.5 bg-blue-50/80 text-blue-700 rounded-md text-[11px] font-bold border border-blue-100/80 hover:bg-blue-100/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Full ₹{formatINR(finalAmount)} in On Credit
                </button>
              )}
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
            className={`flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${totalQty === 0 || balanceAmount > 0.01 || isSubmitting
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                : "text-blue-500 border-blue-400 border-2 hover:bg-blue-500 hover:text-white shadow-md shadow-slate-900/10 active:scale-97"
              }`}
          >
            {isSubmitting ? "..." : "Complete Bill"}
          </button>

          <button
            onClick={handleGenerateInvoice}
            disabled={totalQty === 0 || isSubmitting}
            className={`flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${totalQty === 0 || isSubmitting
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                : "text-blue-500 border-blue-400 border-2 hover:bg-blue-500 hover:text-white shadow-lg shadow-blue-500/20 active:scale-97"
              }`}
          >
            Complete Invoice
          </button>
        </div>

      </div>

      {/* Generate Bill Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmCheckout}
        title="Complete Bill"
        description={`Are you sure you want to complete a bill of ₹${formatPrice(finalAmount)}? This will complete and record the order.`}
        confirmText="Complete"
        cancelText="Cancel"
        loading={isSubmitting}
        type="info"
      />
    </>
  );
};

export default BillingHeader;
