import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X, Loader2, CheckCircle2, Plus, Printer } from "lucide-react";
import { BiLogoWhatsapp } from "react-icons/bi";
import type { BillingItem } from "../types";
import type { BillTotals } from "@/utils/pricing";
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
  billDiscount?: { mode: '%' | '₹'; value: number };
  billTotals?: BillTotals;
  isSubmitting: boolean;
  onConfirm: (status: BillStatus) => void;
  orderId?: string;
  onNewBill?: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen, onClose, items, customerName, phone,
  payments, includeGst, totalAmount, gstAmount, finalAmount,
  billDiscount, billTotals,
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

  // ── WhatsApp Share ───────────────────────────────────────────────────────────
  const handleWhatsAppShare = () => {
    let phoneNum = (phone || "").replace(/[^0-9]/g, "");
    if (!phoneNum) {
      const input = window.prompt("Enter customer WhatsApp phone number (10 digits):", "");
      if (!input) return;
      phoneNum = input.replace(/[^0-9]/g, "");
    }
    if (phoneNum.length === 10) {
      phoneNum = "91" + phoneNum;
    }

    const shopName = shopData?.name || localStorage.getItem("shop_name") || "Our Store";
    const itemsText = items
      .filter((i) => !!i.name && i.qty > 0)
      .slice(0, 5)
      .map((it) => `• ${it.name} x ${it.qty} - ₹${Number(it.price * it.qty).toFixed(2)}`)
      .join("\n");
    const moreCount = items.length > 5 ? `\n...and ${items.length - 5} more items` : "";

    const text = `*${shopName}* - Tax Invoice\n--------------------------------\n*Invoice / Order ID:* ${orderId || ""}\n*Date:* ${dateStr} ${timeStr}\n*Customer:* ${customerName || "Valued Customer"}\n*Total Amount:* ₹${finalAmount.toFixed(2)}\n--------------------------------\n*Items:*\n${itemsText}${moreCount}\n--------------------------------\nThank you for your business!`;

    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

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

  // ── Print Invoice (isolated iframe to prevent blank pages from modal/no-scroll) ──
  const handlePrint = () => {
    const el = invoiceRef.current;
    if (!el) {
      window.print();
      return;
    }

    const existingFrame = document.getElementById("inventq-invoice-print-frame");
    if (existingFrame) {
      try {
        existingFrame.remove();
      } catch {}
    }

    const iframe = document.createElement("iframe");
    iframe.id = "inventq-invoice-print-frame";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc || !iframe.contentWindow) {
      window.print();
      return;
    }

    // Include stylesheet links and non-conflicting style tags
    const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .filter((node) => {
        const text = node.textContent || "";
        return !text.includes("visibility: hidden !important");
      })
      .map((node) => node.outerHTML)
      .join("\n");

    const cloned = el.cloneNode(true) as HTMLElement;
    cloned.style.transform = "none";
    cloned.style.margin = "0 auto";
    cloned.style.maxWidth = "100%";
    cloned.style.width = "100%";

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Tax Invoice - ${orderId || "Order"}</title>
          ${headStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            *, *::before, *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              width: 100% !important;
              min-height: 100% !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            }
            body, body * {
              visibility: visible !important;
            }
            .print-area, .print-area * {
              visibility: visible !important;
            }
            .invoice-print-wrapper {
              width: 100% !important;
              max-width: 680px !important;
              margin: 0 auto !important;
              padding: 4mm 0 !important;
              background: #ffffff !important;
              visibility: visible !important;
            }
            .invoice-print-wrapper > div {
              box-shadow: none !important;
              max-width: 100% !important;
              width: 100% !important;
              border: 1px solid #e2e8f0 !important;
              border-radius: 8px !important;
              visibility: visible !important;
            }
            .no-print, .no-print * {
              display: none !important;
              visibility: hidden !important;
            }
          </style>
        </head>
        <body>
          <div class="print-area invoice-print-wrapper">
            ${cloned.outerHTML}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn("Iframe print error:", err);
        window.print();
      } finally {
        setTimeout(() => {
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          } catch {}
        }, 60000);
      }
    };

    const imgs = Array.from(iframeDoc.getElementsByTagName("img"));
    const links = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]'));
    let pending = imgs.length + links.length;
    let fired = false;

    const onDone = () => {
      if (fired) return;
      fired = true;
      setTimeout(triggerPrint, 250);
    };

    if (pending === 0) {
      setTimeout(onDone, 150);
    } else {
      const handleLoaded = () => {
        pending--;
        if (pending <= 0) onDone();
      };

      imgs.forEach((img) => {
        if (img.complete) {
          handleLoaded();
        } else {
          img.onload = handleLoaded;
          img.onerror = handleLoaded;
        }
      });

      links.forEach((link: any) => {
        link.onload = handleLoaded;
        link.onerror = handleLoaded;
      });

      setTimeout(onDone, 1000);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-3 sm:p-6 print:p-0">
      {/* Styles for Printing */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          html, body, .no-scroll {
            overflow: visible !important;
            height: auto !important;
            min-height: 100% !important;
            background: #ffffff !important;
          }
          #inventq-invoice-print-frame {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 999999 !important;
          }
          .no-print, .no-print * { display: none !important; }
          @page { size: A4 portrait; margin: 8mm; }
        }
      `}} />

      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm no-print" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-slate-100 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] w-full max-w-[620px] max-h-[92dvh] h-[92dvh] sm:h-[88vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:max-h-none print:h-auto print:bg-white print:rounded-none print:shadow-none print:w-full print:max-w-none print:animate-none print:transform-none">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-white border-b border-slate-200/80 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-slate-800">Order Preview</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Receipt Paper (modal-content ensures no-scroll doesn't block scrolling) */}
        <div 
          className="modal-content flex-1 min-h-0 overflow-y-auto overflow-x-auto py-4 px-2 sm:px-6 print:p-0 print:overflow-visible custom-scrollbar" 
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
              billDiscount={billDiscount}
              billTotals={billTotals}
              invoiceRef={invoiceRef}
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className={`flex flex-wrap items-center ${orderId ? 'justify-between' : 'justify-end'} px-3.5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5 sm:py-3.5 bg-white border-t border-slate-200/80 shrink-0 gap-2 no-print`}>
          {orderId && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrint}
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
              {Boolean(phone) && customerName !== "Walk-in Customer" && (
                <button
                  onClick={handleWhatsAppShare}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-200 text-[12px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Send Invoice on WhatsApp"
                >
                  <BiLogoWhatsapp size={15} className="text-[#25D366]" /> WhatsApp
                </button>
              )}
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
