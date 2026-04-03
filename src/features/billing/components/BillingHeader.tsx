import React, { useState, useMemo, useEffect } from "react";
import { 
  IndianRupee, ShoppingBag, Percent, Sparkles, 
  Wallet, Banknote, Smartphone, ScanBarcode,
  Clock, Trash2 // Added new icons
} from "lucide-react";
import { BillingItem, InvoicePayload } from "../types";
import { CustomerData } from "../pages/Billing"; 

type PaymentMode = "cash" | "upi" | "credit";

interface BillingHeaderProps {
  items: BillingItem[];
  customerData: CustomerData | null;
  customerName: string;
  phone: string;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onInvoiceReady?: (payload: InvoicePayload) => void;
  // Added new props for Hold and Clear logic
  onHoldBill: () => void;
  onClearBill: () => void;
}

const GST_PERCENT = 18;
const formatINR = (amount: number, decimals = 2) => amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const round2 = (n: number) => Math.round(n * 100) / 100;

// Reusable Payment Button
const PaymentButton: React.FC<{ mode: PaymentMode; active: boolean; disabled?: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ mode, active, disabled, icon, label, onClick }) => {
  const activeStyles = {
    cash: "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm shadow-emerald-100",
    upi: "bg-violet-50 border-violet-300 text-violet-700 shadow-sm shadow-violet-100",
    credit: "bg-blue-50 border-blue-300 text-blue-700 shadow-sm shadow-blue-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all text-[11px] font-bold ${
        disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : 
        active ? activeStyles[mode] : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

const BillingHeader: React.FC<BillingHeaderProps> = ({ 
  items, customerData, customerName, phone, setIsOpen, 
  onInvoiceReady, onHoldBill, onClearBill 
}) => {
  const [includeGst, setIncludeGst] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");

  const totalQty = useMemo(() => items.reduce((s, i) => s + (i.qty || 0), 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + (i.tprice || 0), 0), [items]);
  const gstAmount = useMemo(() => round2((totalAmount * GST_PERCENT) / 100), [totalAmount]);
  const finalAmount = useMemo(() => includeGst ? round2(totalAmount + gstAmount) : totalAmount, [includeGst, totalAmount, gstAmount]);

  const isCreditAllowed = customerData ? customerData.outstanding < customerData.creditLimit : false;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  // Auto-switch away from credit if customer is cleared or limit exceeded
  useEffect(() => {
    if (paymentMode === "credit" && !isCreditAllowed) setPaymentMode("cash");
  }, [isCreditAllowed, paymentMode]);

  const handleGenerateInvoice = () => {
    if (totalQty === 0) return alert("Cart is empty");
    if (!customerName.trim() && !phone.trim()) return alert("Please select a customer first.");
    
    onInvoiceReady?.({
      customer: customerData,
      customerName: customerName.trim(),
      phone: phone.trim(),
      items,
      totalQty,
      totalAmount,
      gstAmount,
      finalAmount,
      includeGst,
      paymentMode,
      date: new Date().toISOString(),
    });
    setIsOpen(true);
  };

  // --- New Handlers for Hold and Clear ---
  const handleHoldBill = () => {
    if (totalQty === 0) return alert("Cart is empty. Nothing to hold.");
    
    onHoldBill(); // Let parent handle saving state
    
    // Reset local toggle states
    setIncludeGst(false);
    setPaymentMode("cash");
  };

  const handleClearBill = () => {
    if (totalQty === 0) return;
    
    if (window.confirm("Are you sure you want to clear the current cart?")) {
      onClearBill(); // Let parent handle clearing state
      
      // Reset local toggle states
      setIncludeGst(false);
      setPaymentMode("cash");
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
          {today}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 border border-blue-200 px-4 py-3 flex flex-col gap-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <ShoppingBag size={9} strokeWidth={3} /> Items
            </p>
            <p className="text-2xl font-semibold text-slate-800 tabular-nums">{totalQty}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-blue-200 px-4 py-3 flex flex-col gap-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <IndianRupee size={9} strokeWidth={3} /> Base
            </p>
            <p className="text-2xl font-semibold text-slate-800 tabular-nums">{formatINR(totalAmount, 0)}</p>
          </div>
        </div>

        {/* Total Payable Hero */}
        <div className="rounded-2xl bg-white px-5 py-5 flex flex-col items-center relative overflow-hidden border border-blue-300">
          <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-2">Total Payable</p>
          <div className="flex items-start">
            <span className="text-xl font-bold text-black mt-1.5 mr-0.5">₹</span>
            <span className="text-3xl font-semibold text-black tracking-tight tabular-nums">
              {Math.floor(finalAmount).toLocaleString("en-IN")}
            </span>
            <span className="text-xl font-bold text-black mt-auto mb-1 ml-0.5">
              .{String(Math.round((finalAmount % 1) * 100)).padStart(2, "0")}
            </span>
          </div>
          
          <div className="mt-4 flex items-center gap-2.5">
            <button onClick={() => setIncludeGst(v => !v)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${includeGst ? "bg-indigo-500" : "bg-slate-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${includeGst ? "translate-x-4" : "translate-x-0"}`} />
            </button>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Percent size={10} strokeWidth={3} /> {includeGst ? `GST ${GST_PERCENT}% included` : "Exclude GST"}
            </span>
          </div>
        </div>

        {/* Payment Mode */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment Mode</p>
          <div className="flex gap-2">
            <PaymentButton mode="cash" active={paymentMode === "cash"} icon={<Banknote size={16} />} label="Cash" onClick={() => setPaymentMode("cash")} />
            <PaymentButton mode="upi" active={paymentMode === "upi"} icon={<Smartphone size={16} />} label="UPI / Card" onClick={() => setPaymentMode("upi")} />
            <PaymentButton mode="credit" active={paymentMode === "credit"} disabled={!isCreditAllowed} icon={<Wallet size={16} />} label="Credit" onClick={() => isCreditAllowed && setPaymentMode("credit")} />
          </div>
        </div>

      </div>

      {/* Action Buttons Section */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40 shrink-0 flex flex-col gap-2.5">
        
        {/* Hold & Clear Buttons Grid */}
        <div className="flex gap-2.5">
          <button 
            onClick={handleHoldBill}
            disabled={totalQty === 0}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${
              totalQty === 0 
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <Clock size={14} /> Hold Bill
          </button>
          
          <button 
            onClick={handleClearBill}
            disabled={totalQty === 0}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${
              totalQty === 0 
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            }`}
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 hover:bg-indigo-50 transition-all">
          <ScanBarcode size={16} /> Scan Product
        </button>
        <button
          onClick={handleGenerateInvoice}
          disabled={totalQty === 0}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-bold text-white transition-all ${totalQty === 0 ? "bg-slate-300 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-md"}`}
        >
          <Sparkles size={15} /> Generate Invoice
        </button>
      </div>
    </div>
  );
};

export default BillingHeader;