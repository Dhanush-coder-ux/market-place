import { cleanVariantLabel } from "../types";
import React, { useMemo } from "react";
import { INVOICE_TEMPLATES } from "./invoice-templates";
import { Banknote, Smartphone, Wallet, Check, BadgePercent } from "lucide-react";
import type { BillingItem } from "../types";
import { calculateBillTotals, formatINR, type BillTotals } from "@/utils/pricing";
import { getPrinterConfig, getInvoiceSettings } from "../utils/printerService";
import { QRCodeSVG } from "qrcode.react";
import { numberToWords } from "../../Setting/pages/InvoiceTemplateSettings";
import { extractItemAttributeValue, extractProductMrp, inferItemAttr } from "../utils/customFieldsHelper";

const payMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  cash:   { label: "Cash",       icon: <Banknote   size={12} strokeWidth={1.5} /> },
  upi:    { label: "UPI / Card", icon: <Smartphone size={12} strokeWidth={1.5} /> },
  credit: { label: "On Credit", icon: <Wallet      size={12} strokeWidth={1.5} /> },
};

export interface InvoiceRendererCustomField {
  id: string;
  label: string;
  placement: "customer" | "item" | "below";
  type?: string;
  mode?: "fixed" | "ask";
  value?: string;
  displayValue?: React.ReactNode;
  show: boolean;
  itemShow?: "column" | "under";
  itemSource?: "product" | "ask";
  attr?: string;
}

export interface InvoiceRendererProps {
  templateId: string;
  shopData: any;
  orderId?: string;
  dateStr: string;
  timeStr: string;
  payments: { mode: string; amount: number }[];
  customerName: string;
  phone: string;
  items: BillingItem[];
  includeGst: boolean;
  totalAmount?: number;
  gstAmount?: number;
  finalAmount: number;
  billDiscount?: { mode: '%' | '₹'; value: number };
  billTotals?: BillTotals;
  invoiceRef?: React.RefObject<HTMLDivElement | null>;
  scale?: number;
  paperSize?: "a4" | "a5";
  orientation?: "portrait" | "landscape";
  customFields?: InvoiceRendererCustomField[];
  signature?: {
    show: boolean;
    mode: "upload" | "draw" | "type";
    image: string;
    drawn: string;
    name: string;
    desig: string;
    label: string;
  };
  qrSettings?: {
    store: boolean;
    storeUrl: string;
    storeCap: string;
    upi: boolean;
    upiId: string;
    upiCap: string;
  };
  footerSettings?: {
    thanks: string;
    termsShow: boolean;
    terms: string;
    words: boolean;
    showComputerGenerated?: boolean;
  };
  getItemCustomValue?: (field: any, item: any, index: number) => React.ReactNode;
}

export const InvoiceRenderer: React.FC<InvoiceRendererProps> = ({
  templateId,
  shopData,
  orderId,
  dateStr,
  timeStr,
  payments,
  customerName,
  phone,
  items,
  includeGst,
  totalAmount: _totalAmount,
  gstAmount: _gstAmount,
  finalAmount,
  billDiscount,
  billTotals: billTotalsProp,
  invoiceRef,
  scale = 1,
  paperSize,
  orientation,
  customFields,
  signature,
  qrSettings,
  footerSettings,
  getItemCustomValue,
}) => {
  const config = INVOICE_TEMPLATES[templateId] || INVOICE_TEMPLATES.minimal || INVOICE_TEMPLATES.modern;
  const primaryPayment = payments[0] || { mode: "cash", amount: finalAmount };
  const modeInfo = payMeta[primaryPayment.mode] || payMeta.cash;
  const filledItems = items.filter((i) => !!i.name && i.qty > 0);

  // Fallback to saved invoice settings from localStorage if not explicitly supplied
  const resolvedSettings = useMemo(() => {
    let baseFields: InvoiceRendererCustomField[] = [];
    let baseSig: any = undefined;
    let baseQr: any = undefined;
    let baseFooter: any = undefined;
    let basePaperSize: "a4" | "a5" = "a4";
    let baseOrientation: "portrait" | "landscape" = "portrait";

    try {
      const parsed = getInvoiceSettings(shopData?.id);
      if (parsed) {
        baseFields = (parsed.fields || []) as InvoiceRendererCustomField[];
        baseSig = parsed.sig;
        baseQr = parsed.qr;
        baseFooter = parsed.footer;
        if (parsed.paperSize) basePaperSize = parsed.paperSize;
        if (parsed.orientation) baseOrientation = parsed.orientation;
      }
    } catch (_) {}

    const sourceFields = customFields !== undefined && customFields.length > 0 ? customFields : baseFields;
    const finalFields = sourceFields.map((f: any) => {
      const match = baseFields.find((b: any) => b.id === f.id || b.label?.trim().toLowerCase() === f.label?.trim().toLowerCase());
      return {
        ...f,
        show: f.show !== false,
        itemShow: f.itemShow || match?.itemShow || (f.placement === "item" ? "column" : undefined),
        itemSource: f.itemSource || match?.itemSource || (f.placement === "item" ? "product" : undefined),
        attr: (() => {
          if (f.placement !== "item") return undefined;
          return inferItemAttr(f.label, f.attr || match?.attr);
        })(),
        value: f.value ?? (f.mode === "fixed" ? f.value : ""),
        displayValue: f.displayValue ?? f.value,
      };
    });

    return {
      customFields: finalFields,
      signature: signature !== undefined ? signature : baseSig,
      qrSettings: qrSettings !== undefined ? qrSettings : baseQr,
      footerSettings: footerSettings !== undefined ? footerSettings : baseFooter,
      paperSize: paperSize || basePaperSize || "a4",
      orientation: orientation || baseOrientation || "portrait",
    };
  }, [shopData?.id, customFields, signature, qrSettings, footerSettings, paperSize, orientation]);

  const isA5 = resolvedSettings.paperSize === "a5";
  const isLandscape = resolvedSettings.orientation === "landscape";

  // Split custom fields for item placement into separate columns vs subline items under the name
  const { itemCols, itemUnder } = useMemo(() => {
    const activeItemFields = (resolvedSettings.customFields || []).filter(
      (f) => f.show !== false && f.placement === "item" && f.label?.trim()
    );

    const cols: InvoiceRendererCustomField[] = [];
    const under: InvoiceRendererCustomField[] = [];

    activeItemFields.forEach((f) => {
      if (f.itemShow === "column") {
        if (cols.length < 3) {
          cols.push(f);
        } else {
          under.push(f);
        }
      } else {
        under.push(f);
      }
    });

    return { itemCols: cols, itemUnder: under };
  }, [resolvedSettings.customFields]);

  const billTotals = useMemo(() => {
    if (billTotalsProp) return billTotalsProp;
    return calculateBillTotals(
      filledItems.map(i => ({
        id: i.id,
        name: i.name,
        code: i.code,
        qty: i.qty,
        sellingPrice: i.price,
        mrp: i.mrp,
        gstRate: typeof i.gst === 'number' ? i.gst : (parseFloat(String(i.gst || '18').replace(/[^0-9.]/g, '')) || 0),
        productDiscountPercent: i.productDiscountPercent || 0,
        lineDiscountMode: i.lineDiscountMode || '₹',
        lineDiscountValue: i.lineDiscountValue || 0,
      })),
      billDiscount || { mode: '₹', value: 0 }
    );
  }, [filledItems, billDiscount, billTotalsProp]);

  const logoUrl =
    shopData?.logo_url ||
    shopData?.logo ||
    shopData?.business_infos?.logo_url ||
    (typeof shopData?.image_url === "string" ? shopData.image_url : null);

  const totalDiscount = billTotals.totalDiscountGiven;
  const hasSavings = billTotals.totalSavings > 0;

  const resolveItemFieldValue = (f: InvoiceRendererCustomField, line: any, i: number) => {
    const rawVal = getItemCustomValue ? getItemCustomValue(f, line, i) : undefined;
    if (rawVal !== undefined && rawVal !== null && rawVal !== "" && rawVal !== "—") {
      return rawVal;
    }
    const baseItem: any = filledItems[i] || items[i] || {};
    const mergedProd = (line as any)?._product || baseItem?._product;
    const batchCand =
      (line as any)?.batch_no ||
      (line as any)?.batch_name ||
      (line as any)?.batchName ||
      (line as any)?.batchNumber ||
      baseItem?.batch_no ||
      baseItem?.batch_name ||
      baseItem?.batchName ||
      baseItem?.batchNumber ||
      (line as any)?.batchId ||
      baseItem?.batchId;
    const effectiveMrp =
      (line as any)?.mrp ??
      baseItem?.mrp ??
      (mergedProd ? extractProductMrp(mergedProd, batchCand) : undefined);
    const mergedItem = {
      ...baseItem,
      ...(line || {}),
      hsn: line?.hsn || line?.hsn_code || line?.hsnCode || baseItem?.hsn || baseItem?.hsn_code || baseItem?.hsnCode || "",
      hsn_code: line?.hsn_code || line?.hsn || line?.hsnCode || baseItem?.hsn_code || baseItem?.hsn || baseItem?.hsnCode || "",
      hsnCode: line?.hsnCode || line?.hsn_code || line?.hsn || baseItem?.hsnCode || baseItem?.hsn_code || baseItem?.hsn || "",
      mrp: effectiveMrp,
      _product: mergedProd,
    };
    return extractItemAttributeValue(f, line, i, mergedItem);
  };

  return (
    <div 
      className={`${config.typography.fontFamily} origin-top w-full flex justify-center`}
    >
      <div 
         ref={invoiceRef} 
         className={`${config.container} w-full ${
           isLandscape
             ? (isA5 ? "max-w-[620px] text-[11px]" : "max-w-[820px]")
             : (isA5 ? "max-w-[460px] text-[11px]" : "max-w-[580px]")
         } shrink-0`}
         style={scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'top center', marginBottom: `-${(1 - scale) * 100}%` } : undefined}
      >
        {/* Header */}
        <div className={`${config.header.wrapper} ${isA5 ? "!px-4 !pt-4 !pb-3" : ""}`}>
          <div className="flex gap-3.5 items-start">
             {logoUrl ? (
               <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1">
                 <img
                   src={logoUrl}
                   alt={shopData?.name || "Shop Logo"}
                   className="w-full h-full object-contain rounded-lg"
                   crossOrigin="anonymous"
                 />
               </div>
             ) : (
               <div className={config.header.logoBg}>
                 <span className={config.header.logoText}>{shopData?.name?.substring(0, 2)?.toUpperCase() || "MP"}</span>
               </div>
             )}
             <div>
                <h2 className={config.header.businessName}>{shopData?.name || shopData?.shop_name || "inventQ"}</h2>
                <p className={config.header.businessCategory}>{shopData?.category_infos?.name || "Retail & Distribution"}</p>
                <p className={config.header.address}>
                  {(shopData?.business_infos?.gst_infos?.number || shopData?.gst_infos?.number || shopData?.gst_number || shopData?.gst) &&
                    (shopData?.business_infos?.gst_infos?.number || shopData?.gst_infos?.number || shopData?.gst_number || shopData?.gst) !== "N/A" && (
                      <>GSTIN: {shopData?.business_infos?.gst_infos?.number || shopData?.gst_infos?.number || shopData?.gst_number || shopData?.gst}<br /></>
                    )}
                  {shopData?.address?.full_address || shopData?.address_infos?.address_line_1 || (typeof shopData?.address === 'string' ? shopData.address : null) || "Address N/A"}
                </p>
             </div>
          </div>
          <div className={config.header.metaWrapper}>
            <p className={config.header.metaTitle}>Tax Invoice</p>
            {orderId && <p className={config.header.metaId}>{orderId}</p>}
            <p className={config.header.metaDate}>{dateStr} · {timeStr}</p>
            <div className={config.header.badge}>
              {modeInfo.icon} {payments.length > 1 ? "Split Payment" : modeInfo.label}
            </div>
          </div>
        </div>
        
        {/* Customer Info & Top Custom Fields */}
        {((Boolean(customerName) && !["walk-in", "walk-in customer", "walk in", "walk in customer", "walkin", "walkin customer"].includes(customerName.trim().toLowerCase())) ||
          (resolvedSettings.customFields && resolvedSettings.customFields.some((f) => f.show !== false && f.placement === "customer" && f.label?.trim()))) && (
          <div className={`${config.customer.wrapper} ${isA5 ? "!px-4 !py-2.5" : ""}`}>
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className={config.customer.title}>Invoiced To</p>
                <p className={config.customer.name}>{customerName || "Customer"}</p>
                {phone && <p className={config.customer.phone}>{phone}</p>}
              </div>
              {resolvedSettings.customFields && resolvedSettings.customFields.filter((f) => f.show !== false && f.placement === "customer" && f.label?.trim()).length > 0 && (
                <div className="text-right space-y-1">
                  {resolvedSettings.customFields
                    .filter((f) => f.show !== false && f.placement === "customer" && f.label?.trim())
                    .map((f) => (
                      <div key={f.id} className="text-[11px] leading-tight">
                        <span className="text-slate-400 font-medium mr-1.5">{f.label}:</span>
                        <span className="font-semibold text-slate-800">
                          {f.displayValue ?? f.value ?? "Asked on invoice"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer Savings Highlight Banner (Section 8.3) */}
        {hasSavings && (
          <div className={`${isA5 ? "mx-4 my-2 p-2 text-[10px]" : "mx-6 my-3 p-2.5 text-[11px]"} bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-emerald-800`}>
            <div className="flex items-center gap-2">
              <BadgePercent size={14} className="text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold">You saved ₹{formatINR(billTotals.totalSavings)} on this invoice!</span>
            </div>
            {billTotals.productDiscountTotal + billTotals.lineDiscountTotal > 0 && (
              <span className="text-[10px] text-emerald-700 font-medium">
                (₹{formatINR(billTotals.productDiscountTotal + billTotals.lineDiscountTotal)} discounts applied)
              </span>
            )}
          </div>
        )}

        {/* Table (Section 8.1) */}
        <div className={`${config.table.wrapper} w-full overflow-hidden`}>
          <table className="w-full table-fixed border-collapse">
             <thead>
               <tr className={config.table.head}>
                 <th className="text-left py-2.5 pl-3 sm:pl-4 pr-1 w-7 sm:w-8 text-[9px] uppercase tracking-wider shrink-0 truncate">S.No</th>
                 <th className="text-left py-2.5 px-1.5 sm:px-2 text-[9px] uppercase tracking-wider truncate">Item Description</th>
                 {itemCols.map((col) => (
                   <th
                     key={col.id}
                     className={`text-left py-2.5 px-1 sm:px-1.5 font-bold text-[9px] uppercase tracking-wider truncate ${
                       itemCols.length === 1 ? "w-[64px] sm:w-[74px]" : itemCols.length === 2 ? "w-[52px] sm:w-[62px]" : "w-[46px] sm:w-[54px]"
                     }`}
                     title={col.label}
                   >
                     {col.label}
                   </th>
                 ))}
                 <th className="text-right py-2.5 px-1 sm:px-1.5 text-[9px] uppercase tracking-wider truncate w-[50px] sm:w-[58px]">Rate</th>
                 <th className="text-center py-2.5 px-0.5 sm:px-1 text-[9px] uppercase tracking-wider truncate w-[28px] sm:w-[34px]">Qty</th>
                 <th className="text-right py-2.5 px-1 sm:px-1.5 text-[9px] uppercase tracking-wider truncate w-[42px] sm:w-[48px]">Disc</th>
                 <th className="text-right py-2.5 px-1 sm:px-1.5 text-[9px] uppercase tracking-wider truncate w-[50px] sm:w-[58px]">Taxable</th>
                 {includeGst && <th className="text-right py-2.5 px-1 text-[9px] uppercase tracking-wider truncate w-[34px] sm:w-[40px]">GST</th>}
                 <th className="text-right py-2.5 pl-1 pr-3 sm:pr-4 text-[9px] uppercase tracking-wider truncate w-[58px] sm:w-[68px]">Amount</th>
               </tr>
             </thead>
             <tbody>
               {billTotals.lines.map((line, i) => {
                 const [baseName, variantName] = line.name.split(' - ');
                 const lineDiscTotal = line.productDiscountAmount + line.lineDiscountAmount + line.billDiscountShare;
                 const hasLineDisc = lineDiscTotal > 0;
                 return (
                   <tr key={i} className={config.table.row}>
                     <td className="py-2.5 pl-3 sm:pl-4 pr-1 text-[10px] text-slate-400 tabular-nums truncate">{i + 1}</td>
                     <td className="py-2.5 px-1.5 sm:px-2 overflow-hidden">
                       <p className={`${config.table.cellStrong} truncate`} title={baseName}>{baseName}</p>
                       {variantName && <p className={`${config.table.cellMuted} truncate`} title={cleanVariantLabel(variantName)}>{cleanVariantLabel(variantName)}</p>}
                       {/* Custom Item Attributes (only under item name) */}
                       {itemUnder.length > 0 && (
                         <div className="mt-0.5 space-y-0.5 overflow-hidden">
                           {itemUnder.map((f) => {
                             const val = resolveItemFieldValue(f, line, i);
                             if (!val || val === "—") return null;
                             return (
                               <p key={f.id} className="text-[9.5px] text-slate-500 truncate" title={`${f.label}: ${val}`}>
                                 <span className="font-medium text-slate-600">{f.label}:</span> {val}
                               </p>
                             );
                           })}
                         </div>
                       )}
                       {/* Subline discount breakdown per Section 8.1 */}
                       {line.productDiscountAmount > 0 && (
                         <p className="text-[9px] text-blue-600 font-medium mt-0.5 truncate" title={`Product offer: -₹${formatINR(line.productDiscountAmount)}`}>
                           • Product offer: -₹{formatINR(line.productDiscountAmount)}
                         </p>
                       )}
                       {line.lineDiscountAmount > 0 && (
                         <p className="text-[9px] text-emerald-600 font-medium mt-0.5 truncate" title={`Cashier discount: -₹${formatINR(line.lineDiscountAmount)}`}>
                           • Cashier discount: -₹{formatINR(line.lineDiscountAmount)}
                         </p>
                       )}
                       {line.billDiscountShare > 0 && (
                         <p className="text-[9px] text-purple-600 font-medium mt-0.5 truncate" title={`Bill discount share: -₹${formatINR(line.billDiscountShare)}`}>
                           • Bill discount share: -₹{formatINR(line.billDiscountShare)}
                         </p>
                       )}
                     </td>
                     {/* Custom Item Columns */}
                     {itemCols.map((col) => {
                       const val = resolveItemFieldValue(col, line, i);
                       return (
                         <td key={col.id} className={`py-2.5 px-1 sm:px-1.5 text-left text-[10px] sm:text-[11px] tabular-nums ${config.table.cellMuted} truncate`} title={String(val || "")}>
                           {val || "—"}
                         </td>
                       );
                     })}
                     <td className={`py-2.5 px-1 sm:px-1.5 text-right text-[10px] sm:text-[11px] tabular-nums ${config.table.cellMuted} truncate`}>
                       {(() => {
                         const baseItem: any = filledItems[i] || items[i] || {};
                         const mergedProd = (line as any)?._product || baseItem?._product;
                         const batchCand =
                           (line as any)?.batch_no ||
                           (line as any)?.batch_name ||
                           (line as any)?.batchName ||
                           (line as any)?.batchNumber ||
                           baseItem?.batch_no ||
                           baseItem?.batch_name ||
                           baseItem?.batchName ||
                           baseItem?.batchNumber;
                         const lineMrp =
                           (line as any)?.mrp ??
                           baseItem?.mrp ??
                           (mergedProd ? extractProductMrp(mergedProd, batchCand) : undefined);
                         if (lineMrp && lineMrp > line.sellingPrice) {
                           return (
                             <div className="truncate">
                               <span className="line-through text-[9px] text-slate-400 block truncate">₹{formatINR(lineMrp)}</span>
                               <span className="font-semibold text-slate-800 truncate">₹{formatINR(line.sellingPrice)}</span>
                             </div>
                           );
                         }
                         return <span className="truncate">₹{formatINR(line.sellingPrice)}</span>;
                       })()}
                     </td>
                     <td className={`py-2.5 px-0.5 sm:px-1 text-center text-[10px] sm:text-[11px] tabular-nums ${config.table.cellStrong} truncate`}>{line.qty}</td>
                     <td className="py-2.5 px-1 sm:px-1.5 text-right text-[10px] sm:text-[11px] tabular-nums text-emerald-600 font-medium truncate">
                       {hasLineDisc ? `-₹${formatINR(lineDiscTotal)}` : '—'}
                     </td>
                     <td className={`py-2.5 px-1 sm:px-1.5 text-right text-[10px] sm:text-[11px] tabular-nums ${config.table.cellMuted} truncate`}>
                       ₹{formatINR(line.taxableValue)}
                     </td>
                     {includeGst && (
                       <td className={`py-2.5 px-1 text-right text-[10px] tabular-nums ${config.table.cellMuted} truncate`}>
                         {line.gstRate}%
                       </td>
                     )}
                     <td className={`py-2.5 pl-1 pr-3 sm:pr-4 text-right tabular-nums text-[10px] sm:text-[11px] ${config.table.cellStrong} truncate`}>
                       ₹{formatINR(line.finalInclusive)}
                     </td>
                   </tr>
                 );
               })}
             </tbody>
          </table>
        </div>

        {/* GST Tax Summary Table (Section 8.2) */}
        {includeGst && billTotals.taxGroups.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tax Summary</p>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left pb-1 font-semibold">Rate</th>
                  <th className="text-right pb-1 font-semibold">Taxable</th>
                  <th className="text-right pb-1 font-semibold">CGST</th>
                  <th className="text-right pb-1 font-semibold">SGST</th>
                  <th className="text-right pb-1 font-semibold">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billTotals.taxGroups.map((tg, idx) => (
                  <tr key={idx} className="text-slate-700">
                    <td className="py-1 font-bold">{tg.gstRate}%</td>
                    <td className="py-1 text-right tabular-nums">₹{formatINR(tg.taxableValue)}</td>
                    <td className="py-1 text-right tabular-nums">₹{formatINR(tg.cgst)}</td>
                    <td className="py-1 text-right tabular-nums">₹{formatINR(tg.sgst)}</td>
                    <td className="py-1 text-right tabular-nums font-bold text-slate-900">₹{formatINR(tg.totalTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Custom fields below items */}
        {resolvedSettings.customFields && resolvedSettings.customFields.filter((f) => f.show !== false && f.placement === "below" && f.label?.trim()).length > 0 && (
          <div className="px-6 py-2.5 bg-slate-50/70 border-t border-slate-200/60 divide-y divide-slate-100">
            {resolvedSettings.customFields.filter((f) => f.show !== false && f.placement === "below" && f.label?.trim()).map((f) => (
              <div key={f.id} className="flex justify-between items-center text-[11px] py-1">
                <span className="font-medium text-slate-600">{f.label}</span>
                <span className="font-semibold text-slate-800">{f.displayValue ?? f.value ?? "Asked while billing"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Summary (Section 8.1 & 8.3) */}
        <div className={`${config.summary.wrapper} ${isA5 ? "!px-4 !py-3" : ""}`}>
          <div className={`w-full ${isA5 ? "sm:w-[240px]" : "sm:w-[280px]"} space-y-1.5`}>
             <div className={config.summary.row}>
                <span>Base Subtotal (Gross SP)</span>
                <span className={config.summary.value}>₹{formatINR(billTotals.baseSubtotal)}</span>
             </div>
             {billTotals.billDiscountTotal > 0 && (
               <div className={`${config.summary.row} text-purple-600 font-medium`}>
                  <span>Bill Discount {billDiscount?.value ? `(${billDiscount.mode === '%' ? `${billDiscount.value}%` : `₹${billDiscount.value}`})` : ''}</span>
                  <span className="tabular-nums">-₹{formatINR(billTotals.billDiscountTotal)}</span>
               </div>
             )}
             {totalDiscount > 0 && (
               <div className={`${config.summary.row} text-emerald-600 font-semibold`}>
                  <span>Total Discount</span>
                  <span className="tabular-nums">-₹{formatINR(totalDiscount)}</span>
               </div>
             )}
             <div className={config.summary.row}>
                <span>Taxable Amount</span>
                <span className={config.summary.value}>₹{formatINR(billTotals.totalTaxable)}</span>
             </div>
             {includeGst && (
               <div className={config.summary.row}>
                  <span>Total GST</span>
                  <span className={config.summary.value}>₹{formatINR(billTotals.totalGst)}</span>
               </div>
             )}
             {Number(billTotals.deliveryFee || 0) > 0 && (
               <div className={config.summary.row}>
                  <span>Delivery Fee</span>
                  <span className={config.summary.value}>+₹{formatINR(Number(billTotals.deliveryFee))}</span>
               </div>
             )}
             {billTotals.roundOff !== 0 && (
               <div className={config.summary.row}>
                  <span>Round Off</span>
                  <span className={config.summary.value}>
                    {billTotals.roundOff > 0 ? `+₹${formatINR(billTotals.roundOff)}` : `-₹${formatINR(Math.abs(billTotals.roundOff))}`}
                  </span>
               </div>
             )}
             
             <div className={`${config.summary.totalWrapper} ${isA5 ? "!pt-1.5 !mt-1.5" : ""}`}>
               <span className={`${config.summary.totalText} ${isA5 ? "!text-[12px]" : ""}`}>Grand Total</span>
               <span className={`${config.summary.totalValue} ${isA5 ? "!text-[16px]" : ""}`}>₹{formatINR(billTotals.payable)}</span>
             </div>
              {resolvedSettings.footerSettings?.words && (
                <div className="pt-2 text-[10px] text-slate-500 italic">
                  {numberToWords(billTotals.payable)}
                </div>
              )}

             <div className={`${isA5 ? "pt-2 mt-2" : "pt-3 mt-3"} border-t border-slate-200/60 border-dashed`}>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment</p>
                {payments.map((p, idx) => {
                  const pInfo = payMeta[p.mode] || payMeta.cash;
                  return (
                    <div key={idx} className="flex justify-between items-center text-[11px] mb-1.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Check size={8} strokeWidth={3} /></span>
                        <span>{pInfo.label}</span>
                      </div>
                      <span className="tabular-nums font-medium text-slate-700">₹{formatINR(p.amount)}</span>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Digital Store / Payment QR */}
        {((resolvedSettings.qrSettings?.store && resolvedSettings.qrSettings?.storeUrl) ||
          (resolvedSettings.qrSettings?.upi && resolvedSettings.qrSettings?.upiId) ||
          Boolean(shopData?.visible_online && getPrinterConfig().includeDigitalStoreQr)) && (
          <div className={`${isA5 ? "mx-4 mb-2 p-2" : "mx-6 mb-3 p-3"} bg-gradient-to-r from-slate-50 to-emerald-50/30 border border-slate-200/80 rounded-xl flex items-center justify-between gap-4`}>
            <div className="space-y-1">
              {resolvedSettings.qrSettings?.upi && resolvedSettings.qrSettings?.upiId ? (
                <>
                  <p className={`${isA5 ? "text-[10px]" : "text-[11px]"} font-bold text-slate-800`}>
                    {resolvedSettings.qrSettings.upiCap || "Scan & Pay via UPI"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    UPI: {resolvedSettings.qrSettings.upiId} · ₹{formatINR(billTotals.payable)}
                  </p>
                </>
              ) : (
                <>
                  <p className={`${isA5 ? "text-[10px]" : "text-[11px]"} font-bold text-slate-800`}>
                    {resolvedSettings.qrSettings?.storeCap || "Scan to visit our online store"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Browse menu, catalog & order online
                  </p>
                </>
              )}
            </div>
            <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0 flex items-center justify-center">
              {resolvedSettings.qrSettings?.upi && resolvedSettings.qrSettings?.upiId ? (
                <QRCodeSVG
                  value={`upi://pay?pa=${encodeURIComponent(resolvedSettings.qrSettings.upiId)}&pn=${encodeURIComponent(shopData?.name || "Merchant")}&am=${billTotals.payable}&cu=INR`}
                  size={isA5 ? 50 : 64}
                  level="M"
                />
              ) : (
                <QRCodeSVG
                  value={
                    resolvedSettings.qrSettings?.storeUrl ||
                    shopData?.additional_infos?.website ||
                    `${window.location.origin}/store/${shopData?.id || ""}`
                  }
                  size={isA5 ? 50 : 64}
                  level="M"
                />
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`${config.footer.wrapper} ${isA5 ? "!px-4 !py-3" : ""}`}>
           <div className="max-w-[60%]">
              <p className={config.footer.title}>
                {resolvedSettings.footerSettings?.thanks ?? "Thank you for your business."}
              </p>
              {resolvedSettings.footerSettings?.termsShow !== false && (
                <p className={`${config.footer.text} ${isA5 ? "!text-[9px] !leading-snug" : ""}`}>
                  {resolvedSettings.footerSettings?.terms || "Goods once sold will not be taken back. All disputes subject to local jurisdiction."}
                </p>
              )}
           </div>
           <div>
              {resolvedSettings.signature?.show ? (
                <div className="text-center flex flex-col items-center min-w-[150px] ml-auto">
                  {resolvedSettings.signature.mode === "type" ? (
                    <div
                      className={`${isA5 ? "text-lg" : "text-xl"} text-[#1b2a6b] leading-none mb-1 text-center`}
                      style={{ fontFamily: "'Dancing Script', cursive" }}
                    >
                      {resolvedSettings.signature.name || "Signatory"}
                    </div>
                  ) : (resolvedSettings.signature.mode === "draw" ? resolvedSettings.signature.drawn : resolvedSettings.signature.image) ? (
                    <img
                      src={resolvedSettings.signature.mode === "draw" ? resolvedSettings.signature.drawn : resolvedSettings.signature.image}
                      alt="Signature"
                      className={`${isA5 ? "max-h-7 max-w-[100px]" : "max-h-11 max-w-[140px]"} object-contain mb-1 mx-auto block`}
                    />
                  ) : (
                    <div className="h-8 text-[11px] text-slate-300 italic flex items-center justify-center">Add a signature</div>
                  )}
                  {resolvedSettings.signature.name && (
                    <div className={`${isA5 ? "text-[10px]" : "text-[11px]"} font-semibold text-slate-800 leading-tight text-center`}>
                      {resolvedSettings.signature.name}
                      {resolvedSettings.signature.desig ? `, ${resolvedSettings.signature.desig}` : ""}
                    </div>
                  )}
                  <div className="w-full border-t border-slate-300 my-1" />
                  <p className={`${config.footer.signature} text-center`}>{resolvedSettings.signature.label || "Authorized Signatory"}</p>
                </div>
              ) : (
                <p className={config.footer.signature}>Authorized Signatory</p>
              )}
           </div>
        </div>
         {(resolvedSettings.footerSettings?.showComputerGenerated !== false) && (
           <div className={`bg-transparent ${isA5 ? "py-1.5" : "py-2"} text-center print:bg-white border-t border-transparent`}>
              <p className={`${isA5 ? "text-[7.5px]" : "text-[8px]"} text-slate-400 uppercase tracking-widest opacity-60`}>This is a computer-generated invoice and does not require a physical signature.</p>
           </div>
         )}

      </div>
    </div>
  );
};
