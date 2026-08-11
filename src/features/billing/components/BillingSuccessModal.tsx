import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Printer, Share2, PlusCircle, User, Calendar, Landmark, Coins, HeartHandshake } from "lucide-react";

interface BillingSuccessModalProps {
  isOpen: boolean;
  details: {
    items: any[];
    payments: { mode: string; amount: number }[];
    totalAmount: number;
    gstAmount: number;
    finalAmount: number;
    customerName: string;
    phone: string;
  } | null;
  onClose: () => void;
  onNextBill: () => void;
}

const payIconMap: Record<string, any> = {
  cash: <Coins size={14} className="text-emerald-500" />,
  upi: <Landmark size={14} className="text-violet-500" />,
  credit: <HeartHandshake size={14} className="text-blue-500" />,
};

const payLabelMap: Record<string, string> = {
  cash: "Cash",
  upi: "UPI / Card",
  credit: "Store Credit",
};

export const BillingSuccessModal: React.FC<BillingSuccessModalProps> = ({
  isOpen,
  details,
  onClose,
  onNextBill,
}) => {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  if (!isOpen || !details) return null;

  const totalQty = details.items.reduce((s, i) => s + (i.qty || 0), 0);
  const itemsCount = details.items.length;
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const cleanPhone = details.phone.replace(/[^0-9]/g, "");
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const itemsText = details.items
      .map((item, idx) => `${idx + 1}. ${item.name} x ${item.qty} = ₹${item.tprice}`)
      .join("\n");

    const message = `*MarketPlace - Invoice Receipt* 🧾\n\n*Customer*: ${details.customerName}\n*Date*: ${new Date().toLocaleDateString("en-IN")}\n\n*Items*:\n${itemsText}\n\n*Total Amount*: ₹${details.finalAmount}\n*Status*: Paid & Completed\n\nThank you for shopping with us! 😊`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 no-print">
      {/* Dynamic Keyframe Styles for Premium Animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .checkmark__circle {
          stroke-width: 2;
          stroke-miterlimit: 10;
          stroke: #10b981;
          fill: none;
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .checkmark {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: block;
          stroke-width: 4;
          stroke: #fff;
          stroke-miterlimit: 10;
          box-shadow: inset 0px 0px 0px #10b981;
          animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s forwards;
        }
        .checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes scale {
          0%, 100% {
            transform: none;
          }
          50% {
            transform: scale3d(1.1, 1.1, 1);
          }
        }
        @keyframes fill {
          100% {
            box-shadow: inset 0px 0px 0px 30px #10b981;
          }
        }
      `}} />

      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-all" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.22)] w-full max-w-[420px] overflow-hidden transform scale-100 animate-in fade-in zoom-in-95 duration-300 p-6 flex flex-col items-center">
        
        {/* Animated Checkmark Circle */}
        <div className="mb-4 mt-2">
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <h3 className="text-lg font-black text-slate-800 tracking-tight text-center">Bill Generated Successfully</h3>
        <p className="text-xs text-slate-400 font-medium mt-1 text-center">Invoice created and inventory adjusted.</p>

        {/* Invoice Summary Card */}
        <div className="w-full bg-slate-50/70 border border-slate-100 rounded-xl p-4 mt-5 space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><User size={13} /> Customer</span>
            <span className="font-bold text-slate-800">{details.customerName}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><Calendar size={13} /> Created At</span>
            <span className="font-bold text-slate-800">{dateStr}</span>
          </div>
          <div className="w-full h-px bg-slate-200/50 my-1" />
          
          {/* Items List */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Billed Items</span>
              <span className="text-[9px] font-bold text-slate-500">{itemsCount} items ({totalQty} units)</span>
            </div>
            <div className="max-h-[140px] overflow-y-auto custom-scrollbar pr-1.5 space-y-2.5">
              {details.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11.5px]">
                  <div className="flex flex-col flex-1 pr-3">
                    <span className="font-bold text-slate-700 leading-tight">{item.name}</span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {item.qty} {item.selectedUnit || 'units'} x ₹{item.price?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 whitespace-nowrap">₹{item.tprice?.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200">
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block">Grand Total</span>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-blue-650 mt-0.5 block">₹{details.finalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200/50 my-1" />
          
          {/* Payment breakdown */}
          <div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block mb-2">Paid Via</span>
            <div className="flex flex-wrap gap-1.5">
              {details.payments.map((p, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200/60 rounded-lg px-2.5 py-1 text-[10.5px] font-bold text-slate-650 shadow-sm">
                  {payIconMap[p.mode]}
                  <span>{payLabelMap[p.mode]}:</span>
                  <span className="text-slate-800 tabular-nums">₹{p.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <button 
            onClick={handlePrint}
            className="h-10 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-650 hover:text-slate-850 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Printer size={15} />
            Print Receipt
          </button>
          
          <button 
            onClick={handleWhatsApp}
            disabled={!details.phone}
            className={`h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
              details.phone 
                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200" 
                : "bg-slate-50 text-slate-350 border border-slate-100 cursor-not-allowed"
            }`}
            title={details.phone ? "Send to customer's WhatsApp" : "No phone number available"}
          >
            <Share2 size={15} />
            Send WhatsApp
          </button>
        </div>

        {/* Start Next Bill Action Button */}
        <button 
          onClick={onNextBill}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-slate-900/10 active:scale-97 mt-4 cursor-pointer"
        >
          <PlusCircle size={15} />
          Start Next Bill
        </button>

      </div>
    </div>,
    document.body
  );
};
