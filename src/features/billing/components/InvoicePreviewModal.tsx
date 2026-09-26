import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X, Loader2, CheckCircle2, Plus, Printer } from "lucide-react";
import type { BillingItem } from "../types";
import { shopApi } from "../../../services/api/shop";
import { InvoiceRenderer } from "./InvoiceRenderer";

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

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen, onClose, items, customerName, phone,
  payments, includeGst, totalAmount, gstAmount, finalAmount,
  isSubmitting, onConfirm, orderId, onNewBill
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const today   = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = today.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const [shopData, setShopData] = useState<any>(null);
  const [template, setTemplate] = useState("minimal");

  useEffect(() => {
    const shopId = localStorage.getItem("shop_id");
    const savedTmpl = localStorage.getItem("invoice_template");
    if (savedTmpl) setTemplate(savedTmpl);
    
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
      const [dtimMod, jspdfMod] = await Promise.all([
        import('dom-to-image-more'),
        import('jspdf'),
      ]);

      const domtoimage = (dtimMod.default ?? dtimMod) as any;
      const jspdfAny  = jspdfMod as any;
      const JsPDFCtor =
        jspdfAny.jsPDF ??
        jspdfAny.default?.jsPDF ??
        jspdfAny.default;

      if (typeof JsPDFCtor !== 'function') {
        throw new Error(`jsPDF constructor not found. Module keys: ${Object.keys(jspdfAny).join(', ')}`);
      }

      const el = invoiceRef.current;

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

      const pdf    = new JsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      const pageW  = pdf.internal.pageSize.getWidth();   // 210 mm
      const pageH  = pdf.internal.pageSize.getHeight();  // 297 mm
      const margin = 10;
      const printW = pageW - margin * 2;   // 190 mm
      const printH = pageH - margin * 2;   // 277 mm

      const pxPerMm    = (src.width / 2) / printW;
      const pagePixels = printH * pxPerMm * 2;

      let top       = 0;
      let firstPage = true;

      while (top < src.height) {
        const slicePx = Math.min(pagePixels, src.height - top);
        const sliceMm = slicePx / (pxPerMm * 2);

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
      alert(`PDF download failed:
${(err as Error)?.message ?? String(err)}`);
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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-3 sm:p-6 print:p-0">
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
      <div className="relative bg-slate-100 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] w-full max-w-[620px] max-h-[88vh] h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:max-h-none print:h-auto print:bg-white print:rounded-none print:shadow-none print:w-full print:max-w-none print:animate-none print:transform-none">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200/80 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-slate-800">Order Preview</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Receipt Paper (modal-content ensures no-scroll doesn't block scrolling) */}
        <div 
          className="modal-content flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-4 px-3 sm:px-6 print:p-0 print:overflow-visible custom-scrollbar" 
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          <div className="print-area">
            <InvoiceRenderer
              templateId={template}
              shopData={shopData}
              orderId={orderId}
              dateStr={dateStr}
              timeStr={timeStr}
              payments={payments}
              customerName={customerName}
              phone={phone}
              items={items}
              includeGst={includeGst}
              totalAmount={totalAmount}
              gstAmount={gstAmount}
              finalAmount={finalAmount}
              invoiceRef={invoiceRef}
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className={`flex items-center ${orderId ? 'justify-between' : 'justify-end'} px-5 py-3.5 bg-white border-t border-slate-200/80 shrink-0 gap-2 no-print`}>
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
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm("COMPLETED")}
                  disabled={isSubmitting}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12px] font-semibold text-white transition-all duration-200 ${isSubmitting ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-sm"}`}
                >
                  {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={14} /> Confirm Order</>}
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
