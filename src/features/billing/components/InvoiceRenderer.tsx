import React, { useMemo } from "react";
import { INVOICE_TEMPLATES } from "./invoice-templates";
import { Banknote, Smartphone, Wallet, Check, Sparkles } from "lucide-react";
import type { BillingItem } from "../types";
import { calculateBillTotals, formatINR } from "@/utils/pricing";

const payMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  cash:   { label: "Cash",       icon: <Banknote   size={12} strokeWidth={1.5} /> },
  upi:    { label: "UPI / Card", icon: <Smartphone size={12} strokeWidth={1.5} /> },
  credit: { label: "Credit",     icon: <Wallet      size={12} strokeWidth={1.5} /> },
};

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
  invoiceRef?: React.RefObject<HTMLDivElement | null>;
  scale?: number;
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
  invoiceRef,
  scale = 1
}) => {
  const config = INVOICE_TEMPLATES[templateId] || INVOICE_TEMPLATES.minimal || INVOICE_TEMPLATES.modern;
  const primaryPayment = payments[0] || { mode: "cash", amount: finalAmount };
  const modeInfo = payMeta[primaryPayment.mode] || payMeta.cash;
  const filledItems = items.filter((i) => !!i.name && i.qty > 0);

  const billTotals = useMemo(() => {
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
        lineDiscountMode: i.lineDiscountMode || '%',
        lineDiscountValue: i.lineDiscountValue || 0,
      })),
      { mode: '%', value: 0 }
    );
  }, [filledItems]);

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
            {orderId && <p className={config.header.metaId}>#{orderId}</p>}
            <p className={config.header.metaDate}>{dateStr} · {timeStr}</p>
            <div className={config.header.badge}>
              {modeInfo.icon} {payments.length > 1 ? "Split Payment" : modeInfo.label}
            </div>
          </div>
        </div>
        
        {/* Customer Info */}
        <div className={config.customer.wrapper}>
           <p className={config.customer.title}>Billed To</p>
           <p className={config.customer.name}>{customerName || "Walk-in Customer"}</p>
           {phone && <p className={config.customer.phone}>{phone}</p>}
        </div>

        {/* Customer Savings Highlight Banner (Section 8.3) */}
        {hasSavings && (
          <div className="mx-6 my-3 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-emerald-800">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-600 shrink-0" />
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
                 <th className="text-left py-2.5 pl-6 pr-2 w-8">#</th>
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
                       {variantName && <p className={config.table.cellMuted}>{variantName}</p>}
                       {line.code && <p className={`text-[9px] font-mono ${config.table.cellMuted}`}>{line.code}</p>}
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

        {/* Summary (Section 8.1 & 8.3) */}
        <div className={config.summary.wrapper}>
          <div className="w-[280px] space-y-1.5">
             <div className={config.summary.row}>
                <span>Base Subtotal (Gross SP)</span>
                <span className={config.summary.value}>₹{formatINR(billTotals.baseSubtotal)}</span>
             </div>
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

        {/* Footer */}
        <div className={config.footer.wrapper}>
           <div>
              <p className={config.footer.title}>Thank you for your business.</p>
              <p className={config.footer.text}>Goods once sold will not be taken back. All disputes subject to local jurisdiction.</p>
           </div>
           <div>
              <p className={config.footer.signature}>Authorized Signatory</p>
           </div>
        </div>
        <div className="bg-transparent py-3 text-center print:bg-white border-t border-transparent">
           <p className="text-[8px] text-slate-400 uppercase tracking-widest opacity-60">This is a computer-generated receipt and does not require a physical signature.</p>
        </div>

      </div>
    </div>
  );
};
