import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X, Loader2, CheckCircle2, Banknote, Smartphone, Wallet, Plus, Printer } from "lucide-react";
import type { BillingItem } from "../types";
import { shopApi } from "../../../services/api/shop";

type BillStatus = "COMPLETED" | "PENDING" | "CANCELLED";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BillingItem[];
  customerName: string;
  phone: string;
  payments: { mode: string; amount: number }[];
  includeGst: boolean;
  totalAmount: number;
  gstAmount: number;
  finalAmount: number;
  isSubmitting: boolean;
  onConfirm: (status: BillStatus) => void;
  orderId?: string;
  onNewBill?: () => void;
}

const formatINR = (v: number, d = 2) =>
  v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

const payMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  cash:   { label: "Cash",       icon: <Banknote   size={12} strokeWidth={1.5} /> },
  upi:    { label: "UPI / Card", icon: <Smartphone size={12} strokeWidth={1.5} /> },
  credit: { label: "Credit",     icon: <Wallet      size={12} strokeWidth={1.5} /> },
};

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen, onClose, items, customerName, phone,
  payments, includeGst, totalAmount, gstAmount, finalAmount,
  isSubmitting, onConfirm, orderId, onNewBill
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const filledItems = items.filter(i => !!i.name);
  const today   = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = today.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const primaryPayment = payments[0] || { mode: "cash" };
  const modeInfo       = payMeta[primaryPayment.mode] || payMeta.cash;

  const [shopData, setShopData] = useState<any>(null);

  useEffect(() => {
    const shopId = localStorage.getItem("shop_id");
    if (isOpen && shopId) {
      shopApi.getShopById(shopId).then(res => {
        const data = res?.data ?? res;
        setShopData(data);
      }).catch(console.error);
    }
  }, [isOpen]);

  // ── PDF Download ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!invoiceRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      // ── Import dom-to-image-more + jsPDF ─────────────────────────────────────
      // dom-to-image-more renders via the browser's native SVG foreignObject
      // pipeline — it never parses CSS itself, so Tailwind v4's oklch() / oklab()
      // colors work perfectly (html2canvas crashed on them).
      const [dtimMod, jspdfMod] = await Promise.all([
        import('dom-to-image-more'),
        import('jspdf'),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const domtoimage = (dtimMod.default ?? dtimMod) as any;

      // jsPDF ships as { jsPDF } | { default: { jsPDF } } | { default: fn }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jspdfAny  = jspdfMod as any;
      const JsPDFCtor =
        jspdfAny.jsPDF ??
        jspdfAny.default?.jsPDF ??
        jspdfAny.default;

      if (typeof JsPDFCtor !== 'function') {
        throw new Error(`jsPDF constructor not found. Module keys: ${Object.keys(jspdfAny).join(', ')}`);
      }

      const el = invoiceRef.current;

      // ── Capture invoice as a high-res JPEG ───────────────────────────────────
      // scale:2 for retina sharpness; filter removes .no-print elements.
      const dataUrl: string = await domtoimage.toJpeg(el, {
        quality: 0.95,
        bgcolor: '#ffffff',
        width:   el.scrollWidth,
        height:  el.scrollHeight,
        scale:   2,
        style: {
          overflow:        'visible',
          transform:       'scale(1)',
          transformOrigin: 'top left',
        },
        filter: (node: Node) =>
          !(node instanceof Element && node.classList.contains('no-print')),
      });

      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('dom-to-image-more returned an empty image.');
      }

      // ── Load the data URL into a canvas for slicing ───────────────────────────
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((res, rej) => {
        img.onload  = () => res();
        img.onerror = () => rej(new Error('Failed to load captured invoice image.'));
      });

      const src = document.createElement('canvas');
      src.width  = img.naturalWidth;
      src.height = img.naturalHeight;
      src.getContext('2d')!.drawImage(img, 0, 0);

      // ── Tile across A4 pages in jsPDF ────────────────────────────────────────
      const pdf    = new JsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      const pageW  = pdf.internal.pageSize.getWidth();   // 210 mm
      const pageH  = pdf.internal.pageSize.getHeight();  // 297 mm
      const margin = 10;
      const printW = pageW - margin * 2;   // 190 mm
      const printH = pageH - margin * 2;   // 277 mm

      // At 2× scale: logical pixel width = naturalWidth / 2
      const pxPerMm    = (src.width / 2) / printW;
      const pagePixels = printH * pxPerMm * 2;  // canvas-px per A4 page height

      let top       = 0;
      let firstPage = true;

      while (top < src.height) {
        const slicePx = Math.min(pagePixels, src.height - top);
        const sliceMm = slicePx / (pxPerMm * 2);

        // Draw only this vertical strip into a temp canvas
        const strip  = document.createElement('canvas');
        strip.width  = src.width;
        strip.height = Math.ceil(slicePx);
        strip.getContext('2d')!.drawImage(
          src,
          0, top, src.width, Math.ceil(slicePx),
          0, 0,   src.width, Math.ceil(slicePx),
        );

        if (!firstPage) pdf.addPage();
        pdf.addImage(strip.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, printW, sliceMm);

        top      += Math.ceil(slicePx);
        firstPage = false;
      }

      pdf.save(`Invoice_${orderId || 'preview'}.pdf`);

    } catch (err) {
      console.error('[InvoicePreviewModal] PDF generation failed:', err);
      alert(`PDF download failed:\n${(err as Error)?.message ?? String(err)}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Body Scroll Lock
  useEffect(() => {
    if (isOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-2 sm:p-6 print:p-0">
      {/* Styles for Printing */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: fixed; left: 0; top: 0;
            width: 100%; margin: 0; padding: 0;
            box-shadow: none !important; border: none !important;
          }
          .no-print { display: none !important; }
          @page { size: A4; margin: 15mm; }
        }
      `}} />

      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm no-print" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-slate-100 rounded-lg shadow-[0_24px_80px_rgba(0,0,0,0.3)] w-full max-w-[640px] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 print:max-h-none print:bg-white print:rounded-none print:shadow-none print:w-full print:max-w-none print:animate-none print:transform-none">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200/60 shrink-0 no-print">
          <h3 className="text-[14px] font-semibold text-slate-700">Order Preview</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable Receipt Paper */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 sm:p-5 print:p-0 print:overflow-visible custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div ref={invoiceRef} className="print-area bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200/40 mx-auto max-w-[560px] print:max-w-none print:border-none print:shadow-none print:rounded-none">

            {/* ── Receipt Header ─────────────────────────── */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex justify-between items-start">
                {/* Company Info */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center print:bg-blue-600">
                      <span className="text-white text-[11px] font-semibold">{shopData?.name?.substring(0, 2)?.toUpperCase() || "MP"}</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-800 leading-tight">{shopData?.name || shopData?.shop_name || "MarketPlace"}</p>
                      <p className="text-[10px] text-slate-600 font-normal">{shopData?.category_infos?.name || "Retail & Distribution"}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
                    {(shopData?.business_infos?.gst_infos?.number || shopData?.gst_infos?.number || shopData?.gst_number || shopData?.gst) &&
                      (shopData?.business_infos?.gst_infos?.number || shopData?.gst_infos?.number || shopData?.gst_number || shopData?.gst) !== "N/A" && (
                        <>GSTIN: {shopData?.business_infos?.gst_infos?.number || shopData?.gst_infos?.number || shopData?.gst_number || shopData?.gst}<br /></>
                      )}
                    {shopData?.address?.full_address || shopData?.address_infos?.address_line_1 || (typeof shopData?.address === 'string' ? shopData.address : null) || "Address N/A"}
                  </p>
                </div>

                {/* Invoice Meta */}
                <div className="text-right">
                  <p className="text-[9px] font-medium text-blue-500 mb-0.5 print:text-blue-600">Order Receipt</p>
                  {orderId && <p className="text-[12px] font-bold text-slate-700 mb-1">#{orderId}</p>}
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[10px] text-slate-600">{dateStr} · {timeStr}</p>
                    <div className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 mt-1 print:bg-white print:border-slate-200">
                      {modeInfo.icon} {payments.length > 1 ? "Split Payment" : modeInfo.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Customer & Status ──────────────────────── */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-medium text-slate-600 mb-0.5">Bill To</p>
                <p className="text-[13px] font-medium text-slate-800">{customerName || "Walk-in Customer"}</p>
                <p className="text-[10px] text-slate-600 font-mono">{phone || "—"}</p>
              </div>
            </div>

            {/* ── Items Table ────────────────────────────── */}
            <div className="px-0">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 print:bg-slate-50">
                    <th className="text-left text-[9px] font-medium text-slate-600 pl-6 pr-2 py-2 w-8">#</th>
                    <th className="text-left text-[9px] font-medium text-slate-600 px-2 py-2">Product</th>
                    <th className="text-center text-[9px] font-medium text-slate-600 px-2 py-2 w-12">Qty</th>
                    <th className="text-right text-[9px] font-medium text-slate-600 px-2 py-2 w-20">Price</th>
                    {includeGst && <th className="text-right text-[9px] font-medium text-slate-600 px-2 py-2 w-14">GST</th>}
                    <th className="text-right text-[9px] font-medium text-slate-600 pl-2 pr-6 py-2 w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filledItems.map((item, i) => {
                    const [baseName, variantName] = item.name.split(' - ');
                    return (
                      <tr key={i} className={`border-b border-slate-50 ${i % 2 === 1 ? "bg-slate-50/30" : ""} hover:bg-blue-50/20 transition-colors print:hover:bg-transparent`}>
                        <td className="pl-6 pr-2 py-2.5 text-[10px] text-slate-600 tabular-nums">{i + 1}</td>
                        <td className="px-2 py-2.5">
                          <p className="text-[12px] font-medium text-slate-800 leading-tight">{baseName}</p>
                          {variantName && <p className="text-[10px] text-slate-600 mt-0.5">{variantName}</p>}
                          {item.code && <p className="text-[9px] text-slate-600 font-mono mt-0.5">{item.code}</p>}
                        </td>
                        <td className="px-2 py-2.5 text-center text-[11px] text-slate-700 tabular-nums">{item.qty}</td>
                        <td className="px-2 py-2.5 text-right text-[11px] text-slate-600 tabular-nums">₹{formatINR(item.price)}</td>
                        {includeGst && <td className="px-2 py-2.5 text-right text-[10px] text-slate-600 tabular-nums">{item.gst ?? 18}%</td>}
                        <td className="pl-2 pr-6 py-2.5 text-right text-[12px] font-medium text-slate-800 tabular-nums">₹{formatINR(item.tprice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Summary ────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-slate-100">
              <div className="flex justify-end">
                <div className="w-[220px] space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Subtotal</span>
                    <span className="tabular-nums">₹{formatINR(totalAmount)}</span>
                  </div>
                  {includeGst && (
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Total GST</span>
                      <span className="tabular-nums">₹{formatINR(gstAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Discount</span>
                    <span className="tabular-nums">₹0.00</span>
                  </div>
                  <div className="border-t border-slate-200/60 pt-1.5 mt-1">
                    <div className="flex justify-between text-[14px] font-semibold text-slate-800">
                      <span>Grand Total</span>
                      <span className="tabular-nums text-blue-600 print:text-blue-700">₹{formatINR(finalAmount)}</span>
                    </div>
                  </div>
                  {payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                      <span>Paid ({payMeta[p.mode]?.label || p.mode})</span>
                      <span className="tabular-nums">₹{formatINR(p.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[11px] font-medium text-emerald-600">
                    <span>Balance</span>
                    <span className="tabular-nums">₹0.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer ─────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 rounded-b-xl print:bg-white">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-medium text-slate-800 mb-0.5">Thank you for your purchase!</p>
                  <p className="text-[9px] text-slate-600 leading-relaxed max-w-[260px]">
                    Goods once sold will not be taken back. All disputes subject to local jurisdiction.
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-24 border-b border-slate-300 mb-1" />
                  <p className="text-[9px] text-slate-600">Authorized Signatory</p>
                </div>
              </div>
              <p className="text-center text-[8px] text-slate-500 mt-3">This is a computer-generated receipt and does not require a physical signature.</p>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className={`flex items-center ${orderId ? 'justify-between' : 'justify-end'} px-5 py-3 bg-white border-t border-slate-200/60 shrink-0 gap-2 no-print`}>
          {orderId && (
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
              >
                <Printer size={13} /> Print
              </button>
              <button
                onClick={handleDownload}
                disabled={isGeneratingPdf}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-[12px] font-medium transition-colors ${
                  isGeneratingPdf
                    ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                    : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                }`}
              >
                {isGeneratingPdf ? (
                  <><Loader2 size={13} className="animate-spin" /> Generating…</>
                ) : (
                  <><Download size={13} /> Download</>
                )}
              </button>
            </div>
          )}
          <div className="flex gap-2">
            {!orderId ? (
              <>
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200/60 text-[12px] font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm("COMPLETED")}
                  disabled={isSubmitting}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12px] font-medium text-white transition-all duration-200 ${isSubmitting ? "bg-slate-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 shadow-[0_1px_3px_rgba(59,130,246,0.3)]"}`}
                >
                  {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={13} /> Confirm Order</>}
                </button>
              </>
            ) : (
              <button
                onClick={() => { if (onNewBill) onNewBill(); else onClose(); }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg border border-emerald-200 text-[12px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <Plus size={14} strokeWidth={2.5} /> New Bill
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InvoicePreviewModal;
