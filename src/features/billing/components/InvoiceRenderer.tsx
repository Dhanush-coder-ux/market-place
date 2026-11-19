import { cleanVariantLabel } from "../types";
import React, { useMemo } from "react";
import { INVOICE_TEMPLATES } from "./invoice-templates";
import { Banknote, Smartphone, Wallet, Check, BadgePercent } from "lucide-react";
import type { BillingItem } from "../types";
import { calculateBillTotals, formatINR, type BillTotals } from "@/utils/pricing";
import { getPrinterConfig } from "../utils/printerService";
import { QRCodeSVG } from "qrcode.react";
import { numberToWords } from "../../Setting/pages/InvoiceTemplateSettings";

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

    try {
      const raw = localStorage.getItem("inventq.invoiceSettings.v2");
      if (raw) {
        const parsed = JSON.parse(raw);
        baseFields = (parsed.fields || []) as InvoiceRendererCustomField[];
        baseSig = parsed.sig;
        baseQr = parsed.qr;
        baseFooter = parsed.footer;
      }
    } catch (_) {}

    const sourceFields = customFields !== undefined && customFields.length > 0 ? customFields : baseFields;
    const finalFields = sourceFields.map((f: any) => ({
      ...f,
      show: f.show !== false,
      value: f.value ?? (f.mode === "fixed" ? f.value : ""),
      displayValue: f.displayValue ?? f.value,
    }));

    return {
      customFields: finalFields,
      signature: signature !== undefined ? signature : baseSig,
      qrSettings: qrSettings !== undefined ? qrSettings : baseQr,
      footerSettings: footerSettings !== undefined ? footerSettings : baseFooter,
    };
  }, [customFields, signature, qrSettings, footerSettings]);

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

  return (
    <div 
      className={`${config.typography.fontFamily} origin-top w-full flex justify-center`}
    >
      <div 
         ref={invoiceRef} 
         className={`${config.container} w-full max-w-[580px] shrink-0`}
         style={scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'top center', marginBottom: `-${(1 - scale) * 100}%` } : undefined}
      >
        {/* Header */}
        <div className={config.header.wrapper}>
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
          <div className={config.customer.wrapper}>
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className={config.customer.title}>Billed To</p>
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
                          {f.displayValue ?? f.value ?? "Asked while billing"}
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
          <div className="mx-6 my-3 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-emerald-800">
            <div className="flex items-center gap-2">
              <BadgePercent size={14} className="text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold">You saved ₹{formatINR(billTotals.totalSavings)} on this bill!</span>
            </div>
            {billTotals.productDiscountTotal + billTotals.lineDiscountTotal > 0 && (
              <span className="text-[10px] text-emerald-700 font-medium">
                (₹{formatINR(billTotals.productDiscountTotal + billTotals.lineDiscountTotal)} discounts applied)
              </span>
            )}
          </div>
        )}

        {/* Table (Section 8.1) */}
        <div className={config.table.wrapper}>
          <table className="w-full">
             <thead>
               <tr className={config.table.head}>
                 <th className="text-left py-2.5 pl-6 pr-2 w-8">S.No</th>
                 <th className="text-left py-2.5 px-2">Item Description</th>
                 <th className="text-right py-2.5 px-2 w-16">Rate</th>
                 <th className="text-center py-2.5 px-1 w-10">Qty</th>
                 <th className="text-right py-2.5 px-2 w-14">Disc</th>
                 <th className="text-right py-2.5 px-2 w-16">Taxable</th>
                 {includeGst && <th className="text-right py-2.5 px-2 w-12">GST</th>}
                 <th className="text-right py-2.5 pl-2 pr-6 w-20">Amount</th>
               </tr>
             </thead>
             <tbody>
               {billTotals.lines.map((line, i) => {
                 const [baseName, variantName] = line.name.split(' - ');
                 const lineDiscTotal = line.productDiscountAmount + line.lineDiscountAmount + line.billDiscountShare;
                 const hasLineDisc = lineDiscTotal > 0;
                 return (
                   <tr key={i} className={config.table.row}>
                     <td className="py-3 pl-6 pr-2 text-[10px] text-slate-400 tabular-nums">{i + 1}</td>
                     <td className="py-3 px-2">
                       <p className={config.table.cellStrong}>{baseName}</p>
                       {variantName && <p className={config.table.cellMuted}>{cleanVariantLabel(variantName)}</p>}
                       {line.code && <p className={`text-[9px] font-mono ${config.table.cellMuted}`}>{line.code}</p>}
                        {/* Custom Item Attributes */}
                        {resolvedSettings.customFields && resolvedSettings.customFields.filter((f) => f.show !== false && f.placement === "item" && f.label?.trim()).map((f) => {
                          const val = getItemCustomValue ? getItemCustomValue(f, line, i) : (f.displayValue ?? f.value ?? (f.mode === "fixed" ? f.value : "Asked while billing"));
                          return (
                            <p key={f.id} className="text-[9.5px] text-slate-500 mt-0.5">
                              <span className="font-medium text-slate-600">{f.label}:</span> {val}
                            </p>
                          );
                        })}
                       {/* Subline discount breakdown per Section 8.1 */}
                       {line.productDiscountAmount > 0 && (
                         <p className="text-[9px] text-blue-600 font-medium mt-0.5">
                           • Product offer: -₹{formatINR(line.productDiscountAmount)}
                         </p>
                       )}
                       {line.lineDiscountAmount > 0 && (
                         <p className="text-[9px] text-emerald-600 font-medium mt-0.5">
                           • Cashier discount: -₹{formatINR(line.lineDiscountAmount)}
                         </p>
                       )}
                       {line.billDiscountShare > 0 && (
                         <p className="text-[9px] text-purple-600 font-medium mt-0.5">
                           • Bill discount share: -₹{formatINR(line.billDiscountShare)}
                         </p>
                       )}
                     </td>
                     <td className={`py-3 px-2 text-right text-[11px] tabular-nums ${config.table.cellMuted}`}>
                       {line.mrp && line.mrp > line.sellingPrice ? (
                         <div>
                           <span className="line-through text-[9px] text-slate-400 block">₹{formatINR(line.mrp)}</span>
                           <span className="font-semibold text-slate-800">₹{formatINR(line.sellingPrice)}</span>
                         </div>
                       ) : (
                         <span>₹{formatINR(line.sellingPrice)}</span>
                       )}
                     </td>
                     <td className={`py-3 px-1 text-center text-[11px] tabular-nums ${config.table.cellStrong}`}>{line.qty}</td>
                     <td className="py-3 px-2 text-right text-[11px] tabular-nums text-emerald-600 font-medium">
                       {hasLineDisc ? `-₹${formatINR(lineDiscTotal)}` : '—'}
                     </td>
                     <td className={`py-3 px-2 text-right text-[11px] tabular-nums ${config.table.cellMuted}`}>
                       ₹{formatINR(line.taxableValue)}
                     </td>
                     {includeGst && (
                       <td className={`py-3 px-2 text-right text-[10px] tabular-nums ${config.table.cellMuted}`}>
                         {line.gstRate}%
                       </td>
                     )}
                     <td className={`py-3 pl-2 pr-6 text-right tabular-nums ${config.table.cellStrong}`}>
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
        <div className={config.summary.wrapper}>
          <div className="w-full sm:w-[280px] space-y-1.5">
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
             
             <div className={config.summary.totalWrapper}>
               <span className={config.summary.totalText}>Grand Total</span>
               <span className={config.summary.totalValue}>₹{formatINR(billTotals.payable)}</span>
             </div>
              {resolvedSettings.footerSettings?.words && (
                <div className="pt-2 text-[10px] text-slate-500 italic">
                  {numberToWords(billTotals.payable)}
                </div>
              )}

             <div className="pt-3 mt-3 border-t border-slate-200/60 border-dashed">
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
          <div className="mx-6 mb-3 p-3 bg-gradient-to-r from-slate-50 to-emerald-50/30 border border-slate-200/80 rounded-xl flex items-center justify-between gap-4">
            <div className="space-y-1">
              {resolvedSettings.qrSettings?.upi && resolvedSettings.qrSettings?.upiId ? (
                <>
                  <p className="text-[11px] font-bold text-slate-800">
                    {resolvedSettings.qrSettings.upiCap || "Scan & Pay via UPI"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    UPI: {resolvedSettings.qrSettings.upiId} · ₹{formatINR(billTotals.payable)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-bold text-slate-800">
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
                  size={64}
                  level="M"
                />
              ) : (
                <QRCodeSVG
                  value={
                    resolvedSettings.qrSettings?.storeUrl ||
                    shopData?.additional_infos?.website ||
                    `${window.location.origin}/store/${shopData?.id || ""}`
                  }
                  size={64}
                  level="M"
                />
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={config.footer.wrapper}>
           <div className="max-w-[60%]">
              <p className={config.footer.title}>
                {resolvedSettings.footerSettings?.thanks ?? "Thank you for your business."}
              </p>
              {resolvedSettings.footerSettings?.termsShow !== false && (
                <p className={config.footer.text}>
                  {resolvedSettings.footerSettings?.terms || "Goods once sold will not be taken back. All disputes subject to local jurisdiction."}
                </p>
              )}
           </div>
           <div>
              {resolvedSettings.signature?.show ? (
                <div className="text-right flex flex-col items-end">
                  {resolvedSettings.signature.mode === "type" ? (
                    <div
                      className="text-xl text-[#1b2a6b] leading-none mb-1"
                      style={{ fontFamily: "'Dancing Script', cursive" }}
                    >
                      {resolvedSettings.signature.name || "Signatory"}
                    </div>
                  ) : (resolvedSettings.signature.mode === "draw" ? resolvedSettings.signature.drawn : resolvedSettings.signature.image) ? (
                    <img
                      src={resolvedSettings.signature.mode === "draw" ? resolvedSettings.signature.drawn : resolvedSettings.signature.image}
                      alt="Signature"
                      className="max-h-11 max-w-[140px] object-contain mb-1"
                    />
                  ) : (
                    <div className="h-8 text-[11px] text-slate-300 italic flex items-center justify-end">Add a signature</div>
                  )}
                  {resolvedSettings.signature.name && (
                    <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                      {resolvedSettings.signature.name}
                      {resolvedSettings.signature.desig ? `, ${resolvedSettings.signature.desig}` : ""}
                    </div>
                  )}
                  <p className={config.footer.signature}>{resolvedSettings.signature.label || "Authorized Signatory"}</p>
                </div>
              ) : (
                <p className={config.footer.signature}>Authorized Signatory</p>
              )}
           </div>
        </div>
        <div className="bg-transparent py-3 text-center print:bg-white border-t border-transparent">
           <p className="text-[8px] text-slate-400 uppercase tracking-widest opacity-60">This is a computer-generated receipt and does not require a physical signature.</p>
        </div>

      </div>
    </div>
  );
};
