import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { User, Clock, Check, Printer, Plus, Power } from "lucide-react";
import { shopApi } from "../../../services/api/shop";

/* ─── Types ─────────────────────────────────────────────────────────────── */

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
    orderId?: string;
  } | null;
  onClose: () => void;
  onNextBill: () => void;
  onPrint?: () => void;
}

type AnimPhase = "feeding" | "revealing" | "cutting" | "done" | "tearaway";
type ModalView = "summary" | "printing";

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

const receiptPayLabelMap: Record<string, string> = {
  cash: "CASH",
  upi: "UPI/CARD",
  credit: "STORE CREDIT",
};

/* ─── Component ─────────────────────────────────────────────────────────── */

export const BillingSuccessModal: React.FC<BillingSuccessModalProps> = ({
  isOpen,
  details,
  onClose,
  onNextBill,
  onPrint,
}) => {
  const [view, setView] = useState<ModalView>("summary");
  const [phase, setPhase] = useState<AnimPhase | null>(null);
  const [closing, setClosing] = useState(false);
  const [shopData, setShopData] = useState<any>(null);
  const timerRefs = useRef<number[]>([]);

  /* Clear all pending timers */
  const clearTimers = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timerRefs.current.push(id);
    return id;
  }, []);

  /* Reset state when modal opens/closes */
  useEffect(() => {
    if (isOpen) {
      setView("summary");
      setPhase(null);
      setClosing(false);
    } else {
      clearTimers();
      setView("summary");
      setPhase(null);
      setClosing(false);
    }
    return clearTimers;
  }, [isOpen, clearTimers]);

  /* Body scroll lock */
  useEffect(() => {
    if (isOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  /* Fetch shop data for receipt header */
  useEffect(() => {
    const shopId = localStorage.getItem("shop_id");
    if (isOpen && shopId) {
      shopApi.getShopById(shopId).then(res => {
        const data = res?.data ?? res;
        setShopData(data);
      }).catch(console.error);
    }
  }, [isOpen]);

  /* ── Animation helpers ─────────────────────────────────────────────── */
  const isAnimating = phase === "feeding" || phase === "revealing" || phase === "cutting" || phase === "tearaway";

  const startPrint = useCallback(() => {
    if (view === "printing" && isAnimating) return;
    if (view === "printing" && phase === "done") return;

    // Fire the external print callback if provided
    if (onPrint) onPrint();

    // Switch to printing view and begin animation
    setView("printing");
    setPhase("feeding");
    addTimer(() => setPhase("revealing"), 1800);
    addTimer(() => setPhase("cutting"), 3400);
    addTimer(() => {
      setPhase("done");
      const content = document.getElementById("printable-receipt")?.innerHTML;
      if (content) {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (doc) {
          const links = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
            .map(el => el.outerHTML)
            .join("\n");
          doc.open();
          doc.write(`
            <html>
              <head>
                <title>Receipt</title>
                ${links}
                <style>
                  body { margin: 0; padding: 20px; font-family: sans-serif; background: white; color: black; }
                  hr { border-color: #000; }
                </style>
              </head>
              <body>
                ${content}
              </body>
            </html>
          `);
          doc.close();
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
          }, 250);
        }
      }
    }, 4100);
  }, [view, isAnimating, phase, onPrint, addTimer]);

  const handleClose = useCallback(() => {
    if (isAnimating) return;
    if (view === "printing" && phase === "done") {
      setClosing(true);
      setPhase("tearaway");
      addTimer(() => {
        setClosing(false);
        setPhase(null);
        setView("summary");
        onClose();
      }, 600);
    } else {
      onClose();
    }
  }, [isAnimating, view, phase, onClose, addTimer]);

  const handleNextBill = useCallback(() => {
    if (isAnimating) return;
    if (view === "printing" && phase === "done") {
      setClosing(true);
      setPhase("tearaway");
      addTimer(() => {
        setClosing(false);
        setPhase(null);
        setView("summary");
        onNextBill();
      }, 600);
    } else {
      onNextBill();
    }
  }, [isAnimating, view, phase, onNextBill, addTimer]);

  /* ── Keyboard shortcuts ────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return; // block during animation
      if (e.key === "Enter") {
        e.preventDefault();
        handleNextBill();
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        startPrint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isAnimating, handleNextBill, startPrint]);

  if (!isOpen || !details) return null;

  /* ── Derived data ──────────────────────────────────────────────────── */
  const totalQty = details.items.reduce((s, i) => s + (i.qty || 0), 0);
  const itemsCount = details.items.length;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

  const isCash = details.payments.length === 1 && details.payments[0].mode === "cash";
  const cashPayment = isCash ? details.payments[0] : null;

  /* ── Printing view helpers ─────────────────────────────────────────── */
  const showReceipt = phase !== null;
  const receiptRevealed = phase === "revealing" || phase === "cutting" || phase === "done" || phase === "tearaway";
  const isCut = phase === "cutting" || phase === "done" || phase === "tearaway";

  /* ═══════════════════════════════════════════════════════════════════════
     SUMMARY VIEW — Original "Bill saved" modal
     ═══════════════════════════════════════════════════════════════════════ */
  if (view === "summary") {
    return createPortal(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 no-print font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-[#12151A]/60 backdrop-blur-sm transition-all animate-in fade-in" />

        {/* Modal Container */}
        <div className="relative bg-white rounded-[16px] shadow-[0_20px_50px_-12px_rgba(19,24,34,0.35)] w-[380px] overflow-hidden transform animate-in fade-in zoom-in-95 duration-200 flex flex-col">
          
          {/* Top Section */}
          <div className="p-[20px_20px_16px] text-center border-b border-[#E6EAF1]">
            <div className="w-12 h-12 rounded-full bg-[#12995A] grid place-items-center mx-auto mb-[12px] shadow-[0_0_0_6px_#E3F7EC]">
              <Check size={24} color="white" strokeWidth={3.4} />
            </div>
            <h2 className="text-[17px] font-bold text-[#12161F] mb-1 tracking-tight">Bill saved</h2>
            <div className="font-mono text-[13px] font-semibold text-[#2C3E7A] bg-[#EDEFF7] inline-block px-3 py-1 rounded-full mt-1">
              {details.orderId || "N/A"}
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
              onClick={startPrint}
              className="w-full h-10 mb-2 rounded-[8px] font-bold text-[12.5px] inline-flex items-center justify-center gap-2 border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm cursor-pointer"
            >
              <Printer size={15} /> Print
            </button>
            <button 
              onClick={onNextBill}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white rounded-[8px] font-bold text-[13.5px] inline-flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
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
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PRINTING VIEW — Thermal receipt printer animation
     ═══════════════════════════════════════════════════════════════════════ */
  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 no-print"
      style={{
        animation: closing
          ? "receiptModalFadeOut 0.5s ease forwards"
          : "receiptModalFadeIn 0.3s ease forwards",
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0A0C10]/70"
      />

      {/* ── Printer Machine ─────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center max-h-[90vh] overflow-y-auto"
        style={{
          animation: "printerSlideIn 0.35s ease-out forwards",
          scrollbarWidth: "none",
        }}
      >
        {/* Printer Body */}
        <div
          className="relative w-[340px] sm:w-[360px] rounded-t-[18px] rounded-b-[6px] overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #2A2F36 0%, #1E2328 100%)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Printer top panel */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            {/* Brand / label */}
            <div className="flex items-center gap-2">
              <div
                className="w-[7px] h-[7px] rounded-full bg-green-400"
                style={{
                  animation:
                    isAnimating
                      ? "printerLedBlink 0.6s ease-in-out infinite"
                      : phase === "done"
                        ? "printerLedSteady 2s ease-in-out infinite"
                        : "none",
                  boxShadow: phase !== null
                    ? "0 0 6px 2px rgba(34,197,94,0.5)"
                    : "0 0 3px 1px rgba(34,197,94,0.3)",
                }}
              />
              <span
                className="text-[10px] font-semibold tracking-[0.15em] uppercase"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                POS Thermal
              </span>
            </div>

            {/* Power icon */}
            <Power size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
          </div>

          {/* Printer slot — the slit where paper comes out */}
          <div className="relative">
            <div
              className="mx-3 h-[6px] rounded-full"
              style={{
                background: "linear-gradient(180deg, #0D0F12 0%, #181B20 100%)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)",
              }}
            />
            {/* Slot edge detail lines */}
            <div className="mx-4 mt-[2px] flex justify-between">
              <div className="w-3 h-[1px] bg-white/[0.05] rounded-full" />
              <div className="w-3 h-[1px] bg-white/[0.05] rounded-full" />
            </div>
          </div>

          {/* Bottom edge of printer body */}
          <div className="h-3" />
        </div>

        {/* ── Receipt Paper ───────────────────────────────────────────── */}
        {showReceipt && (
          <div
            className="relative w-[310px] sm:w-[330px]"
            style={{
              animation:
                phase === "tearaway"
                  ? "receiptTearAway 0.55s ease-in forwards"
                  : "none",
            }}
          >
            {/* Paper container — animates height for feed */}
            <div
              className={`thermal-paper receipt-font overflow-hidden ${isCut ? "receipt-cut-edge" : ""}`}
              style={{
                animation: "receiptPaperFeed 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
                boxShadow: "2px 4px 16px rgba(0,0,0,0.18), -1px 0 4px rgba(0,0,0,0.06)",
                ...(isAnimating && phase === "feeding"
                  ? { animationName: "receiptPaperFeed, paperJitter", animationDuration: "1.8s, 0.08s", animationTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94), linear", animationIterationCount: "1, infinite", animationFillMode: "forwards, none" }
                  : {}),
              }}
            >
              {/* Receipt content — reveals with clip-path */}
              <div
                id="printable-receipt"
                className="px-5 py-4 text-[11px] leading-[1.6] text-[#2A2520]"
                style={{
                  animation: receiptRevealed
                    ? "receiptContentReveal 1.5s ease-out forwards"
                    : "none",
                  clipPath: receiptRevealed ? undefined : "inset(0 0 100% 0)",
                  opacity: receiptRevealed ? undefined : 0.4,
                  minHeight: 120,
                }}
              >
                {/* ── Shop Header ─────────────────────────────── */}
                <div className="text-center mb-2">
                  <div className="text-[13px] font-bold tracking-[0.08em] text-[#1A1714] uppercase">
                    {shopData?.name || shopData?.shop_name || "MarketPlace"}
                  </div>
                  {(shopData?.address?.full_address || shopData?.address_infos?.address_line_1 || shopData?.address) && (
                    <div className="text-[8.5px] text-[#8A857C] mt-0.5 leading-[1.4] max-w-[90%] mx-auto">
                      {shopData?.address?.full_address || shopData?.address_infos?.address_line_1 || shopData?.address}
                    </div>
                  )}
                  {(shopData?.business_infos?.gst_infos?.number || shopData?.gst_infos?.number || shopData?.gst_number || shopData?.gst) &&
                   (shopData?.business_infos?.gst_infos?.number || shopData?.gst_infos?.number || shopData?.gst_number || shopData?.gst) !== "N/A" && (
                    <div className="text-[8.5px] text-[#8A857C] mt-0.5 tracking-[0.03em]">
                      GSTIN: {shopData?.business_infos?.gst_infos?.number || shopData?.gst_infos?.number || shopData?.gst_number || shopData?.gst}
                    </div>
                  )}
                  <div className="text-[8px] tracking-[0.06em] text-[#B0AAA2] mt-1">
                    {shopData?.phone && <>Ph: {shopData.phone} · </>}TAX INVOICE
                  </div>
                </div>

                <hr className="receipt-separator" />

                {/* Invoice + Date */}
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#8A857C]">Order ID</span>
                  <span className="font-semibold">{details.orderId || "N/A"}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#8A857C]">Date</span>
                  <span>{dateStr}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#8A857C]">Time</span>
                  <span>{timeStr}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#8A857C]">Customer</span>
                  <span>{details.customerName || "Walk-in"}</span>
                </div>
                {details.phone && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#8A857C]">Phone</span>
                    <span>{details.phone}</span>
                  </div>
                )}

                <hr className="receipt-separator" />

                {/* ── Items Header ───────────────────────────── */}
                <div className="flex justify-between text-[9px] font-bold tracking-[0.05em] uppercase text-[#8A857C] mb-1">
                  <span>Item</span>
                  <span>Amount</span>
                </div>

                <hr className="receipt-separator" style={{ marginTop: 2, marginBottom: 4 }} />

                {/* ── Items List ─────────────────────────────── */}
                {details.items.map((item, idx) => {
                  const itemGst = typeof item.gst === "number" ? item.gst : 0;
                  return (
                    <div key={idx} className="mb-1.5">
                      <div className="flex justify-between">
                        <span className="font-semibold text-[11px] text-[#1A1714] max-w-[65%] truncate">
                          {item.name}
                        </span>
                        <span className="font-semibold text-[11px] text-[#1A1714]">
                          {item.tprice?.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#8A857C] pl-0.5">
                        {item.qty} {item.selectedUnit || "pc"} x {item.price?.toFixed(2)}
                        {itemGst > 0 && <span className="ml-1">GST@{itemGst}%</span>}
                      </div>
                    </div>
                  );
                })}

                <hr className="receipt-separator" />

                {/* ── Summary ────────────────────────────────── */}
                <div className="flex justify-between text-[10px] text-[#8A857C]">
                  <span>Items: {details.items.length}</span>
                  <span>Qty: {totalQty}</span>
                </div>

                <hr className="receipt-separator" />

                {/* Subtotal */}
                <div className="flex justify-between text-[10.5px]">
                  <span className="text-[#5A554E]">Subtotal</span>
                  <span>{details.totalAmount.toFixed(2)}</span>
                </div>

                {/* GST breakdown */}
                {details.gstAmount > 0 && (
                  <>
                    <div className="flex justify-between text-[10.5px]">
                      <span className="text-[#5A554E]">CGST</span>
                      <span>{(details.gstAmount / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10.5px]">
                      <span className="text-[#5A554E]">SGST</span>
                      <span>{(details.gstAmount / 2).toFixed(2)}</span>
                    </div>
                  </>
                )}

                {/* ── Grand Total ────────────────────────────── */}
                <div className="receipt-separator-double" />
                <div className="flex justify-between items-baseline text-[13px] font-bold py-1 text-[#1A1714]">
                  <span>TOTAL</span>
                  <span className="text-[15px]">Rs.{details.finalAmount.toFixed(2)}</span>
                </div>
                <div className="receipt-separator-double" />

                <div className="h-1.5" />

                {/* ── Payment ────────────────────────────────── */}
                {details.payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between text-[10.5px]">
                    <span className="text-[#5A554E]">
                      Paid ({receiptPayLabelMap[p.mode] || p.mode.toUpperCase()})
                    </span>
                    <span>{p.amount.toFixed(2)}</span>
                  </div>
                ))}

                {/* Cash tendered + change */}
                {cashPayment && (cashPayment.tendered || 0) > details.finalAmount && (
                  <>
                    <div className="flex justify-between text-[10.5px]">
                      <span className="text-[#5A554E]">Tendered</span>
                      <span>{(cashPayment.tendered || 0).toFixed(2)}</span>
                    </div>
                    <hr className="receipt-separator" />
                    <div className="flex justify-between text-[12px] font-bold text-[#1A1714]">
                      <span>CHANGE</span>
                      <span>Rs.{((cashPayment.tendered || 0) - details.finalAmount).toFixed(2)}</span>
                    </div>
                  </>
                )}

                <hr className="receipt-separator" />

                {/* ── Footer ─────────────────────────────────── */}
                <div className="text-center text-[9px] text-[#8A857C] mt-1 space-y-0.5">
                  <div>Thank you for your purchase!</div>
                  <div>Goods once sold will not be returned</div>
                  <div className="text-[8px] mt-1 text-[#B0AAA2]">
                    ★ ★ ★
                  </div>
                </div>

                <div className="h-3" />
              </div>
            </div>

            {/* ── Paper Cut Line ───────────────────────────────────────── */}
            {isCut && (
              <div className="relative h-[3px] mt-[-1px]">
                <div
                  className="absolute top-0 left-0 h-[2px] bg-red-400/60"
                  style={{
                    animation: "receiptPaperCut 0.5s ease-out forwards",
                    boxShadow: "0 0 4px rgba(239,68,68,0.3)",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Action Buttons (below printer) ───────────────────────────── */}
        <div
          className="w-[340px] sm:w-[360px] mt-4 flex flex-col gap-2"
          style={{ animation: "printerSlideIn 0.4s ease-out 0.1s both" }}
        >
          {isAnimating && phase !== "tearaway" && (
            <div className="w-full h-11 rounded-[10px] font-semibold text-[12px] inline-flex items-center justify-center gap-2 bg-[#1E2328] text-white/50 select-none">
              <span
                className="inline-block w-2 h-2 rounded-full bg-green-400"
                style={{ animation: "printerLedBlink 0.5s ease-in-out infinite" }}
              />
              {phase === "feeding" && "Feeding paper..."}
              {phase === "revealing" && "Printing..."}
              {phase === "cutting" && "Cutting..."}
            </div>
          )}

          {phase === "done" && (
            <>
              <button
                onClick={handleNextBill}
                className="w-full h-11 rounded-[10px] font-bold text-[13px] inline-flex items-center justify-center gap-2 transition-all duration-200 shadow-lg cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                }}
              >
                <Plus size={16} strokeWidth={2.5} /> New Bill
              </button>
              <button
                onClick={handleClose}
                className="w-full h-9 rounded-[8px] font-semibold text-[12px] inline-flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Close
              </button>
            </>
          )}

          {/* Keyboard hints */}
          <div className="text-center text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
            {phase === "done" && (
              <>
                Press{" "}
                <kbd className="font-mono bg-white/[0.08] border border-white/[0.12] rounded px-1.5 py-0.5 text-white/40 text-[9px]">
                  Enter
                </kbd>{" "}
                for new bill ·{" "}
                <kbd className="font-mono bg-white/[0.08] border border-white/[0.12] rounded px-1.5 py-0.5 text-white/40 text-[9px]">
                  P
                </kbd>{" "}
                to reprint
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
