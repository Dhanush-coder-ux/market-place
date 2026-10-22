import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Download, Printer, Loader2, FileText } from "lucide-react";
import { BiLogoWhatsapp } from "react-icons/bi";
import { shopApi } from "@/services/api/shop";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID, getShopId } from "@/services/endpoints";
import { InvoiceRenderer } from "@/features/billing/components/InvoiceRenderer";
import { extractSaleCustomerInfo } from "../type";
import type { BillingItem } from "@/features/billing/types";
import type { BillTotals } from "@/utils/pricing";

interface SaleInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any | null;
  customerMap?: Record<string, any>;
  productMap?: Record<string, string>;
}

export const SaleInvoiceModal: React.FC<SaleInvoiceModalProps> = ({
  isOpen,
  onClose,
  sale,
  customerMap = {},
  productMap = {},
}) => {
  const api = useApi();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [fullSale, setFullSale] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [template, setTemplate] = useState("minimal");

  // Load template & shop data
  useEffect(() => {
    if (!isOpen) return;
    const shopId = getShopId() || SHOP_ID;
    const savedTmpl = localStorage.getItem("invoice_template");
    if (savedTmpl) setTemplate(savedTmpl);

    if (shopId && shopId !== "string") {
      shopApi
        .getShopById(shopId)
        .then((res) => {
          const data = res?.data ?? res;
          setShopData(data);
        })
        .catch((err) => console.warn("Failed to fetch shop details for invoice:", err));
    }
  }, [isOpen]);

  // Fetch full sale detail if items are shallow or missing
  useEffect(() => {
    if (!isOpen || !sale) {
      setFullSale(null);
      return;
    }

    setFullSale(sale);

    const hasDetailedItems =
      Array.isArray(sale.items) &&
      sale.items.length > 0 &&
      (sale.items[0].name || sale.items[0].product_name || sale.calculation_infos);

    if (!hasDetailedItems && sale.id) {
      setLoadingDetails(true);
      const activeShopId = getShopId() || SHOP_ID;
      api
        .getData(`${ENDPOINTS.ORDERS}/${activeShopId}/${sale.id}`)
        .then((res: any) => {
          const ord = Array.isArray(res?.data) ? res.data[0] : res?.data;
          if (ord) {
            setFullSale(ord);
          }
        })
        .catch((err: any) => {
          console.warn("Could not fetch extended order details, using summary:", err);
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [isOpen, sale, api]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  const activeSale = fullSale || sale || {};
  const customerInfo = useMemo(() => {
    return extractSaleCustomerInfo(activeSale, customerMap);
  }, [activeSale, customerMap]);

  // Parse items into BillingItem[] format
  const parsedItems: BillingItem[] = useMemo(() => {
    const rawItems = Array.isArray(activeSale.items)
      ? activeSale.items
      : Array.isArray(activeSale.calculation_infos?.items)
      ? activeSale.calculation_infos.items
      : [];

    return rawItems.map((it: any, idx: number) => {
      const name =
        it.name ||
        it.product_name ||
        it.datas?.product_name ||
        it.datas?.name ||
        productMap[it.inventory_id] ||
        `Item ${idx + 1}`;

      const qty = Number(it.quantity ?? it.qty ?? 1);
      const price = Number(it.sell_price ?? it.price ?? it.unit_price ?? 0);
      const mrp = Number(it.mrp ?? it.datas?.mrp ?? price);
      const gstRate = Number(it.gst_rate ?? it.gst ?? it.tax_rate ?? 0);

      return {
        id: it.id || it.product_id || it.inventory_id || String(idx),
        name,
        code: it.code || it.barcode || "",
        qty,
        price,
        mrp: mrp > 0 ? mrp : undefined,
        gst: gstRate,
        productDiscountPercent: Number(it.product_discount_percent || 0),
        lineDiscountMode: (it.line_discount_mode === "₹" ? "₹" : "%") as "%" | "₹",
        lineDiscountValue: Number(it.line_discount_value || 0),
        taxable_rate: Number(it.taxable_value || 0),
        gst_amount: Number(it.gst_amount || 0),
        unit: it.unit || it.unit_infos?.name || "Units",
      };
    });
  }, [activeSale, productMap]);

  // Payment breakdown
  const paymentsList = useMemo(() => {
    const s = activeSale;
    if (s.payment_infos && typeof s.payment_infos === "object" && !Array.isArray(s.payment_infos)) {
      const entries = Object.entries(s.payment_infos);
      if (entries.length > 0) {
        return entries.map(([m, val]) => ({
          mode: m.toLowerCase().replace("_", " "),
          amount: Number(val) || 0,
        }));
      }
    }
    if (s.payments && typeof s.payments === "object") {
      const entries = Object.entries(s.payments);
      if (entries.length > 0) {
        return entries.map(([m, val]) => ({
          mode: m.toLowerCase().replace("_", " "),
          amount: Number(val) || 0,
        }));
      }
    }
    const finalAmt = Number(
      s.total_sellprice ??
      s.calculation_infos?.total ??
      s.total_amount ??
      0
    );
    const pm = (s.payment_method || "cash").toLowerCase();
    return [{ mode: pm, amount: finalAmt }];
  }, [activeSale]);

  // Reconstruct billTotals if available from calculation_infos
  const reconstructedBillTotals: BillTotals | undefined = useMemo(() => {
    const calc = activeSale.calculation_infos;
    if (!calc) return undefined;

    return {
      baseSubtotal: Number(calc.base_subtotal ?? calc.subtotal ?? 0),
      subtotal: Number(calc.subtotal ?? 0),
      productDiscountTotal: Number(calc.product_discount_total ?? 0),
      lineDiscountTotal: Number(calc.line_discount_total ?? 0),
      billDiscountTotal: Number(calc.bill_discount_total ?? 0),
      totalDiscountGiven: Number(calc.total_discount_given ?? 0),
      totalTaxable: Number(calc.taxable_amount ?? 0),
      totalGst: Number(calc.gst_amount ?? 0),
      gross: Number(calc.gross ?? calc.total ?? 0),
      roundOff: Number(calc.round_off ?? 0),
      payable: Number(calc.total ?? calc.grand_total ?? activeSale.total_sellprice ?? 0),
      totalQty: Number(calc.total_quantity ?? calc.total_qty ?? (Array.isArray(calc.items) ? calc.items.reduce((sum: number, it: any) => sum + Number(it.qty || 1), 0) : 0)),
      hasMrpSavings: Number(calc.customer_savings ?? 0) > 0,
      totalMrp: Number(calc.total_mrp ?? 0),
      totalSavings: Number(calc.customer_savings ?? 0),
      taxGroups: calc.tax_groups || [],
      lines: Array.isArray(calc.items)
        ? calc.items.map((l: any) => ({
            inventoryId: l.product_id || "",
            name: l.name || "",
            qty: Number(l.qty || 1),
            mrp: Number(l.mrp || 0),
            sellingPrice: Number(l.price || 0),
            productDiscountAmount: Number(l.product_discount_amount || 0),
            lineDiscountMode: l.line_discount_mode || "%",
            lineDiscountValue: Number(l.line_discount_value || 0),
            lineDiscountAmount: Number(l.line_discount_amount || 0),
            billDiscountShare: Number(l.bill_discount_share || 0),
            finalInclusive: Number(l.final_inclusive || 0),
            taxableValue: Number(l.taxable_value || 0),
            gstRate: Number(l.gst_rate || 0),
            gstAmount: Number(l.gst_amount || 0),
            cgst: Number(l.cgst || 0),
            sgst: Number(l.sgst || 0),
            costPrice: Number(l.cost_at_sale || 0),
          }))
        : [],
    };
  }, [activeSale]);

  // Date and Time formatting
  const { dateStr, timeStr } = useMemo(() => {
    const rawDate = activeSale.created_at || activeSale.date;
    if (!rawDate) {
      const today = new Date();
      return {
        dateStr: today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        timeStr: today.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
    }
    const d = new Date(rawDate);
    return {
      dateStr: isNaN(d.getTime()) ? String(rawDate) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      timeStr: isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  }, [activeSale]);

  const totalAmount = Number(
    activeSale.total_amount ??
    activeSale.total_sellprice ??
    reconstructedBillTotals?.payable ??
    0
  );
  const gstAmount = Number(
    activeSale.calculation_infos?.gst_amount ??
    reconstructedBillTotals?.totalGst ??
    0
  );
  const finalAmount = Number(
    activeSale.total_sellprice ??
    activeSale.calculation_infos?.total ??
    totalAmount
  );
  const orderId = activeSale.ui_id || activeSale.order_id || activeSale.id;

  // ── PDF Download ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!invoiceRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const [dtimMod, jspdfMod] = await Promise.all([
        import("dom-to-image-more"),
        import("jspdf"),
      ]);

      const domtoimage = (dtimMod.default ?? dtimMod) as any;
      const jspdfAny = jspdfMod as any;
      const JsPDFCtor =
        jspdfAny.jsPDF ??
        jspdfAny.default?.jsPDF ??
        jspdfAny.default;

      if (typeof JsPDFCtor !== "function") {
        throw new Error("jsPDF constructor not found.");
      }

      const el = invoiceRef.current;

      const dataUrl: string = await domtoimage.toJpeg(el, {
        quality: 0.95,
        bgcolor: "#ffffff",
        width: el.scrollWidth,
        height: el.scrollHeight,
        scale: 2,
        style: {
          overflow: "visible",
          transform: "scale(1)",
          transformOrigin: "top left",
        },
        filter: (node: Node) =>
          !(node instanceof Element && node.classList.contains("no-print")),
      });

      if (!dataUrl || dataUrl === "data:,") {
        throw new Error("dom-to-image-more returned an empty image.");
      }

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load captured invoice image."));
      });

      const src = document.createElement("canvas");
      src.width = img.naturalWidth;
      src.height = img.naturalHeight;
      src.getContext("2d")!.drawImage(img, 0, 0);

      const pdf = new JsPDFCtor({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const printW = pageW - margin * 2;
      const printH = pageH - margin * 2;

      const pxPerMm = (src.width / 2) / printW;
      const pagePixels = printH * pxPerMm * 2;

      let top = 0;
      let firstPage = true;

      while (top < src.height) {
        const slicePx = Math.min(pagePixels, src.height - top);
        const sliceMm = slicePx / (pxPerMm * 2);

        const strip = document.createElement("canvas");
        strip.width = src.width;
        strip.height = slicePx;
        strip.getContext("2d")!.drawImage(
          src,
          0, top, src.width, slicePx,
          0, 0, src.width, slicePx
        );

        if (!firstPage) {
          pdf.addPage();
        }
        firstPage = false;

        const stripData = strip.toDataURL("image/jpeg", 0.95);
        pdf.addImage(stripData, "JPEG", margin, margin, printW, sliceMm);

        top += slicePx;
      }

      const safeId = (orderId || "invoice").replace(/[^a-zA-Z0-9-_]/g, "_");
      pdf.save(`Invoice_${safeId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ── WhatsApp Share ───────────────────────────────────────────────────────────
  const handleWhatsAppShare = () => {
    let phoneNum = (customerInfo.phone || "").replace(/[^0-9]/g, "");
    if (!phoneNum) {
      const input = window.prompt("Enter customer WhatsApp phone number (10 digits):", "");
      if (!input) return;
      phoneNum = input.replace(/[^0-9]/g, "");
    }
    if (phoneNum.length === 10) {
      phoneNum = "91" + phoneNum;
    }

    const shopName = shopData?.name || localStorage.getItem("shop_name") || "Our Store";
    const itemsText = parsedItems
      .slice(0, 5)
      .map((it) => `• ${it.name} x ${it.qty} - ₹${Number(it.price * it.qty).toFixed(2)}`)
      .join("\n");
    const moreCount = parsedItems.length > 5 ? `
...and ${parsedItems.length - 5} more items` : "";

    const text = `*${shopName}* - Tax Invoice
--------------------------------
*Invoice / Order ID:* ${orderId}
*Date:* ${dateStr} ${timeStr}
*Customer:* ${customerInfo.name || "Valued Customer"}
*Total Amount:* ₹${finalAmount.toFixed(2)}
*Status:* ${activeSale.status || "Completed"}
--------------------------------
*Items:*
${itemsText}${moreCount}
--------------------------------
Thank you for your business!`;

    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm no-print" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-slate-100 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] w-full max-w-[640px] max-h-[90vh] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:max-h-none print:h-auto print:bg-white print:rounded-none print:shadow-none print:w-full print:max-w-none">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200/80 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileText size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-slate-800 leading-none">Tax Invoice</h3>
                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Invoice
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5 leading-none">{orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Invoice Scrollable Content */}
        <div
          className="modal-content flex-1 min-h-0 overflow-y-auto overflow-x-auto py-4 px-2 sm:px-6 print:p-0 print:overflow-visible custom-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-500">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading invoice details...</span>
            </div>
          ) : (
            <div className="print-area">
              <InvoiceRenderer
                templateId={template}
                shopData={shopData}
                orderId={orderId}
                dateStr={dateStr}
                timeStr={timeStr}
                payments={paymentsList}
                customerName={customerInfo.name || "Walk-in Customer"}
                phone={customerInfo.phone || ""}
                items={parsedItems}
                includeGst={true}
                totalAmount={totalAmount}
                gstAmount={gstAmount}
                finalAmount={finalAmount}
                billTotals={reconstructedBillTotals}
                invoiceRef={invoiceRef}
              />
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 bg-white border-t border-slate-200/80 shrink-0 gap-2 no-print overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Print A4 Invoice"
            >
              <Printer size={14} className="text-slate-600" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isGeneratingPdf}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all shadow-xs cursor-pointer ${
                isGeneratingPdf
                  ? "border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                  : "border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
              }`}
              title="Download A4 PDF Invoice"
            >
              {isGeneratingPdf ? (
                <><Loader2 size={14} className="animate-spin" /> Generating PDF…</>
              ) : (
                <><Download size={14} /> Download PDF</>
              )}
            </button>
            {Boolean(customerInfo.phone) && !customerInfo.isWalkIn && (
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-200 text-[12px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                title="Share via WhatsApp"
              >
                <BiLogoWhatsapp size={16} className="text-[#25D366]" />
                <span>WhatsApp</span>
              </button>
            )}
          </div>
          <div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
