import React from "react";
import { INVOICE_TEMPLATES } from "./invoice-templates";
import { Banknote, Smartphone, Wallet, Check } from "lucide-react";
import type { BillingItem } from "../types";

const payMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  cash:   { label: "Cash",       icon: <Banknote   size={12} strokeWidth={1.5} /> },
  upi:    { label: "UPI / Card", icon: <Smartphone size={12} strokeWidth={1.5} /> },
  credit: { label: "Credit",     icon: <Wallet      size={12} strokeWidth={1.5} /> },
};

const formatINR = (v: number, d = 2) =>
  v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

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
  totalAmount: number;
  gstAmount: number;
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
  totalAmount,
  gstAmount,
  finalAmount,
  invoiceRef,
  scale = 1
}) => {
  const config = INVOICE_TEMPLATES[templateId] || INVOICE_TEMPLATES.minimal || INVOICE_TEMPLATES.modern;
  const primaryPayment = payments[0] || { mode: "cash", amount: finalAmount };
  const modeInfo = payMeta[primaryPayment.mode] || payMeta.cash;
  const filledItems = items.filter((i) => !!i.name);

  const logoUrl =
    shopData?.logo_url ||
    shopData?.logo ||
    shopData?.business_infos?.logo_url ||
    (typeof shopData?.image_url === "string" ? shopData.image_url : null);

  return (
    <div 
      className={`${config.typography.fontFamily} origin-top w-full flex justify-center`}
    >
      <div 
         ref={invoiceRef} 
         className={`${config.container} w-full max-w-[560px] shrink-0`}
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
            <p className={config.header.metaTitle}>Invoice</p>
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

        {/* Table */}
        <div className={config.table.wrapper}>
          <table className="w-full">
             <thead>
               <tr className={config.table.head}>
                 <th className="text-left py-3 pl-8 pr-2 w-10">#</th>
                 <th className="text-left py-3 px-2">Item Description</th>
                 <th className="text-center py-3 px-2 w-12">Qty</th>
                 <th className="text-right py-3 px-2 w-20">Price</th>
                 {includeGst && <th className="text-right py-3 px-2 w-14">GST</th>}
                 <th className="text-right py-3 pl-2 pr-8 w-24">Total</th>
               </tr>
             </thead>
             <tbody>
               {filledItems.map((item, i) => {
                 const [baseName, variantName] = item.name.split(' - ');
                 return (
                   <tr key={i} className={config.table.row}>
                     <td className="py-4 pl-8 pr-2 text-[11px] text-slate-400 tabular-nums">{i + 1}</td>
                     <td className="py-4 px-2">
                       <p className={config.table.cellStrong}>{baseName}</p>
                       {variantName && <p className={config.table.cellMuted}>{variantName}</p>}
                       {item.code && <p className={`text-[10px] font-mono ${config.table.cellMuted}`}>{item.code}</p>}
                     </td>
                     <td className={`py-4 px-2 text-center text-[12px] tabular-nums ${config.table.cellStrong}`}>{item.qty}</td>
                     <td className={`py-4 px-2 text-right text-[12px] tabular-nums ${config.table.cellMuted}`}>₹{formatINR(item.price)}</td>
                     {includeGst && <td className={`py-4 px-2 text-right text-[11px] tabular-nums ${config.table.cellMuted}`}>{item.gst ?? 18}%</td>}
                     <td className={`py-4 pl-2 pr-8 text-right tabular-nums ${config.table.cellStrong}`}>₹{formatINR(item.tprice)}</td>
                   </tr>
                 )
               })}
             </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className={config.summary.wrapper}>
          <div className="w-[260px] space-y-1.5">
             <div className={config.summary.row}>
                <span>Subtotal</span>
                <span className={config.summary.value}>₹{formatINR(totalAmount)}</span>
             </div>
             {includeGst && (
               <div className={config.summary.row}>
                  <span>Total GST</span>
                  <span className={config.summary.value}>₹{formatINR(gstAmount)}</span>
               </div>
             )}
             <div className={config.summary.row}>
                <span>Discount</span>
                <span className={config.summary.value}>₹0.00</span>
             </div>
             
             <div className={config.summary.totalWrapper}>
               <span className={config.summary.totalText}>Grand Total</span>
               <span className={config.summary.totalValue}>₹{formatINR(finalAmount)}</span>
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
                  )
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
  )
}
