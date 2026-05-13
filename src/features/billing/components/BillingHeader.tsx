import React, { useState, useMemo, useEffect } from "react";
import {
  IndianRupee, ShoppingBag, Percent,
  Wallet, Banknote, Smartphone, ScanBarcode,
  Clock, Trash2, CheckCircle2, ArrowRight
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
  onConfirmOrder: (paymentMode: string, includeGst: boolean, status: string) => void;
  isSubmitting: boolean;
  onHoldBill: () => void;
  onClearBill: () => void;
}

const GST_PERCENT = 18;
const formatINR = (amount: number, decimals = 2) => amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const round2 = (n: number) => Math.round(n * 100) / 100;

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
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [showInvoice, setShowInvoice] = useState(false);

  const totalQty = useMemo(() => items.reduce((s, i) => s + (i.qty || 0), 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + (i.tprice || 0), 0), [items]);
  const gstAmount = useMemo(() => round2((totalAmount * GST_PERCENT) / 100), [totalAmount]);
  const finalAmount = useMemo(() => includeGst ? round2(totalAmount + gstAmount) : totalAmount, [includeGst, totalAmount, gstAmount]);

  const isCreditAllowed = customerData ? customerData.outstanding < customerData.creditLimit : false;

  useEffect(() => {
    if (paymentMode === "credit" && !isCreditAllowed) setPaymentMode("cash");
  }, [isCreditAllowed, paymentMode]);

  const handleGenerateInvoice = () => {
    if (totalQty === 0) return alert("Cart is empty");
    if (!customerName.trim() && !phone.trim()) return alert("Please select a customer first.");
    setShowInvoice(true);
  };

  const handleConfirm = (status: BillStatus) => {
    onConfirmOrder(paymentMode, includeGst, status);
    setShowInvoice(false);
    setIncludeGst(false);
    setPaymentMode("cash");
  };

  const handleHoldBill = () => {
    if (totalQty === 0) return alert("Cart is empty. Nothing to hold.");
    onHoldBill();
    setIncludeGst(false);
    setPaymentMode("cash");
  };

  const handleClearBill = () => {
    if (totalQty === 0) return;
    if (window.confirm("Are you sure you want to clear the current cart?")) {
      onClearBill();
      setIncludeGst(false);
      setPaymentMode("cash");
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
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Payment Method</p>
            <div className="flex gap-2">
              <PaymentButton mode="cash" active={paymentMode === "cash"} icon={<Banknote size={15} strokeWidth={1.5} />} label="Cash" onClick={() => setPaymentMode("cash")} />
              <PaymentButton mode="upi" active={paymentMode === "upi"} icon={<Smartphone size={15} strokeWidth={1.5} />} label="UPI / Card" onClick={() => setPaymentMode("upi")} />
              <PaymentButton mode="credit" active={paymentMode === "credit"} disabled={!isCreditAllowed} icon={<Wallet size={15} strokeWidth={1.5} />} label="Credit" onClick={() => isCreditAllowed && setPaymentMode("credit")} />
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
        paymentMode={paymentMode}
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
