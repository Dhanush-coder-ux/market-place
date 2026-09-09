import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { User, Clock, Check, Printer, Plus } from "lucide-react";

interface BillingSuccessModalProps {
  isOpen: boolean;
  details: {
    items: any[];
    payments: { mode: string; amount: number; tendered?: number; change?: number }[];
    totalAmount: number;
    gstAmount: number;
    finalAmount: number;
    customerName: string;
    phone: string;
    invoiceId?: string; // e.g. INV-2026-0847
  } | null;
  onClose: () => void;
  onNextBill: () => void;
  onPrint?: () => void;
}

const payIconMap: Record<string, any> = {
  cash: <Check size={13} className="text-[#12995A]" />,
  upi: <Check size={13} className="text-[#12995A]" />,
  credit: <Check size={13} className="text-[#12995A]" />,
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
  onPrint
}) => {
  useEffect(() => {
    if (isOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onNextBill();
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        onPrint ? onPrint() : window.print();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onNextBill, onPrint]);

  if (!isOpen || !details) return null;

  const totalQty = details.items.reduce((s, i) => s + (i.qty || 0), 0);
  const itemsCount = details.items.length;
  
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).toLowerCase();

  const isCash = details.payments.length === 1 && details.payments[0].mode === "cash";
  const cashPayment = isCash ? details.payments[0] : null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 no-print font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#12151A]/60 backdrop-blur-sm transition-all animate-in fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-[16px] shadow-[0_20px_50px_-12px_rgba(19,24,34,0.35)] w-[380px] overflow-hidden transform animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Top Section */}
        <div className="p-[20px_20px_16px] text-center border-b border-[#E6EAF1]">
          <div className="w-12 h-12 rounded-full bg-[#12995A] grid place-items-center mx-auto mb-[12px] shadow-[0_0_0_6px_#E3F7EC]">
            <Check size={24} color="white" strokeWidth={3.4} />
          </div>
          <h2 className="text-[17px] font-bold text-[#12161F] mb-1 tracking-tight">Bill saved</h2>
          <div className="font-mono text-[13px] font-semibold text-[#2C3E7A] bg-[#EDEFF7] inline-block px-3 py-1 rounded-full mt-1">
            {details.invoiceId || "INV-LATEST"}
          </div>
          <div className="text-[12.5px] text-[#7A8497] mt-2">
            Stock updated · Receipt ready to print
          </div>
        </div>

        {/* Body Section */}
        <div className="p-[16px_20px_0] max-h-[50vh] overflow-y-auto custom-scrollbar">
          
          <div className="flex justify-between text-[12.5px] py-1.5">
            <span className="text-[#7A8497] flex items-center gap-1.5">
              <User size={13} className="text-[#A7B0C0]" /> Customer
            </span>
            <span className="font-semibold text-[#12161F]">{details.customerName || 'Walk-in'}</span>
          </div>
          <div className="flex justify-between text-[12.5px] py-1.5 border-t border-[#E6EAF1]">
            <span className="text-[#7A8497] flex items-center gap-1.5">
              <Clock size={13} className="text-[#A7B0C0]" /> Billed at
            </span>
            <span className="font-semibold text-[#12161F]">{dateStr}, {timeStr}</span>
          </div>

          <div className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-[#A7B0C0] flex justify-between mt-[18px] mb-2 pt-3.5 border-t border-[#E6EAF1]">
            <span>Items</span>
            <span>{itemsCount} items · {totalQty} units</span>
          </div>

          <div className="space-y-0.5">
            {details.items.map((item, idx) => {
              const itemGst = typeof item.gst === 'number' ? item.gst : 0;
              return (
                <div key={idx} className="flex justify-between gap-3 py-1.5 text-[13px]">
                  <div>
                    <div className="font-semibold text-[#12161F] leading-tight">{item.name}</div>
                    <div className="text-[11px] text-[#7A8497] mt-0.5 font-mono">
                      {item.qty} {item.selectedUnit || 'pc'} × ₹{item.price?.toFixed(2)} · GST {itemGst}%
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-[#12161F] whitespace-nowrap">
                    ₹{item.tprice?.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3.5 pt-3 border-t border-[#E6EAF1]">
            <div className="flex justify-between text-[12.5px] py-1">
              <span className="text-[#7A8497]">Subtotal (taxable)</span>
              <span className="font-mono font-medium text-[#3A414F]">₹{details.totalAmount.toFixed(2)}</span>
            </div>
            {details.gstAmount > 0 && (
              <>
                <div className="flex justify-between text-[12.5px] py-1">
                  <span className="text-[#7A8497]">CGST</span>
                  <span className="font-mono font-medium text-[#3A414F]">₹{(details.gstAmount / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[12.5px] py-1">
                  <span className="text-[#7A8497]">SGST</span>
                  <span className="font-mono font-medium text-[#3A414F]">₹{(details.gstAmount / 2).toFixed(2)}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between text-[12.5px] py-1 mt-2 pt-2.5 border-t-[1.5px] border-[#12161F]">
              <span className="text-[15px] font-bold text-[#12161F]">Total</span>
              <span className="text-[20px] font-extrabold text-[#12161F] font-mono">₹{details.finalAmount.toFixed(2)}</span>
            </div>
          </div>

          {cashPayment && (cashPayment.tendered || 0) > details.finalAmount && (
            <div className="mt-4 bg-[#E3F7EC] border-[1.5px] border-[#8CDCB4] rounded-xl p-[13px_16px]">
              <div className="flex justify-between text-[12.5px] py-0.5 text-[#0E6B41]">
                <span>Cash received</span>
                <span className="font-mono font-semibold">₹{(cashPayment.tendered || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[12.5px] py-0.5 text-[#0E6B41]">
                <span>Bill total</span>
                <span className="font-mono font-semibold">₹{details.finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-dashed border-[#8CDCB4]">
                <span className="text-[13px] font-bold text-[#0E6B41]">Change to return</span>
                <span className="font-mono text-[26px] font-extrabold text-[#0E6B41]">
                  ₹{((cashPayment.tendered || 0) - details.finalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4 pb-2">
            {details.payments.map((p, idx) => (
              <div key={idx} className="inline-flex items-center gap-1.5 bg-[#F5F7FA] border border-[#E6EAF1] rounded-full px-3 py-1 font-semibold text-[12px] text-[#3A414F]">
                {payIconMap[p.mode]} Paid in full · {payLabelMap[p.mode]}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-[16px_20px_20px] mt-2 bg-[#F5F7FA] border-t border-[#E6EAF1]">
          <button 
            onClick={() => onPrint ? onPrint() : window.print()}
            className="w-full h-10 mb-2 rounded-[8px] font-bold text-[12.5px] inline-flex items-center justify-center gap-2 border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
          >
            <Printer size={15} /> Print
          </button>
          <button 
            onClick={onNextBill}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white rounded-[8px] font-bold text-[13.5px] inline-flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} /> New bill
          </button>
          <div className="text-center text-[11px] text-[#A7B0C0] mt-3">
            Press <b className="font-mono bg-white border border-[#D5DBE5] rounded px-1.5 py-0.5 text-[#7A8497] font-medium mx-1">Enter</b> for a new bill · <b className="font-mono bg-white border border-[#D5DBE5] rounded px-1.5 py-0.5 text-[#7A8497] font-medium mx-1">P</b> to print
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
