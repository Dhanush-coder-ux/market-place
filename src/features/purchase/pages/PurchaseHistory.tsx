import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Calendar,
  Building2,
  Package,
  ChevronRight,
  ReceiptText,
  LayoutGrid,
  List,

  ExternalLink,
  Filter
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import DirectHeader from "../components/DirectHeader";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import type { PurchaseRecord } from "@/types/api";


/* ================= TYPES ================= */
export interface ProductItem {
  name: string;
  quantity: number;
  stocks?: number;
  stocks_before?: number;
  buy_price?: number;
  sell_price?: number;
  barcode?: string;
  category?: string;
  gst?: number;
  storage_location?: string;
  has_batch?: boolean;
  has_serialno?: boolean;
  has_variant?: boolean;
  variants?: {
    id: string;
    name: string;
    buy_price?: number;
    sell_price?: number;
    stocks?: number;
    stocks_before?: number;
    batches: {
      name: string;
      stocks: number;
      expiry_date?: string;
      manufacturing_date?: string;
      serial_numbers?: string[];
    }[];
    serials?: {
      id: string;
      serial_numbers: string[];
    }[];
  }[];
  batches?: {
    name: string;
    stocks: number;
    expiry_date?: string;
    manufacturing_date?: string;
    serial_numbers?: string[];
  }[];
  serials?: {
    id: string;
    serial_numbers: string[];
  }[];
}

export type PurchaseType = "Purchase" | "PO Purchase" | "Production";

export interface DirectPurchaseData {
  id: string;
  poNumber: string;
  date: string;
  time: string;
  vendor: string;
  products: ProductItem[];
  total_cost: number;
  purchaseType: PurchaseType;
  paymentMethod?: string;
  charges?: {
    other: number;
    transport: number;
  };
  storage_location?: string;
  paid_amount?: number;
  outstanding?: number;
  grand_total?: number;
  additional_charges_total?: number;
}

type ViewMode = "grid" | "horizontal" | "vertical";

export function parseGst(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  const str = String(val).replace("%", "").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function toDisplayData(p: PurchaseRecord): DirectPurchaseData {
  const d2 = (p.datas ? (typeof p.datas === "string" ? JSON.parse(p.datas) : p.datas) : p) as any;
  const products = ((p as any).products ?? d2?.products ?? d2?.purchase_products ?? d2?.grn_products ?? d2?.finished_products) as any[] | undefined;
  const dateRaw = String(d2?.purchaseDetails?.date ?? d2?.purchase_date ?? d2?.production_date ?? d2?.receipt_date ?? d2?.adjusted_date ?? (p as any).date ?? new Date().toISOString());

  let d = new Date();
  if (dateRaw && dateRaw !== "undefined" && dateRaw !== "null" && dateRaw !== "—") {
    const parsedDate = new Date(dateRaw.includes("T") ? dateRaw : dateRaw + "T00:00:00");
    if (!isNaN(parsedDate.getTime())) {
      d = parsedDate;
    }
  }

  const typeMap: Record<string, PurchaseType> = {
    DIRECT: "Purchase",
    PO_CREATE: "PO Purchase",
    PO_UPDATE: "PO Purchase",
    PRODUCTION: "Production",
  };

  // Try to find the vendor name from various possible fields
  const vendorName = d2?.supplier_name ?? d2?.supplier ?? d2?.purchaseDetails?.supplier_name ?? "—";

  const otherCharge = Number(p.additional_charges?.other_charge ?? d2?.charges?.other ?? 0);
  const transportCharge = Number(p.additional_charges?.delivery_charge ?? d2?.charges?.transport ?? 0);

  const prods = (products ?? []);
  const subtotal = prods.reduce((sum: number, pr: any) => {
    const qty = Number(pr.received_stocks ?? pr.received_qty ?? pr.quantity ?? pr.qty ?? 1);
    const price = Number(pr.buy_price ?? 0);
    return sum + (qty * price);
  }, 0);

  const totalGst = prods.reduce((sum: number, pr: any) => {
    const qty = Number(pr.received_stocks ?? pr.received_qty ?? pr.quantity ?? pr.qty ?? 1);
    const price = Number(pr.buy_price ?? 0);
    const gstPercent = parseGst(pr.gst || pr.datas?.gst || pr.taxGst || pr.tax_gst || 0);
    return sum + (qty * price * (gstPercent / 100));
  }, 0);

  const totalCost = subtotal + totalGst;
  const additionalChargesTotal = otherCharge + transportCharge;
  const grandTotal = totalCost + additionalChargesTotal;

  const paidAmount = Number((p as any).paid_amount ?? d2?.payment?.amountPaid ?? d2?.paid_amount ?? 0);
  const outstanding = Math.max(0, totalCost - paidAmount);

  return {
    id: p.id || "",
    poNumber: d2?.purchaseDetails?.invoiceNo ?? p.id?.slice(0, 8).toUpperCase() ?? "PO",
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    vendor: String(vendorName),
    products: (products ?? []).map((pr: any) => ({
      name: String(pr.name ?? pr.product_name ?? "Item"),
      quantity: Number(pr.received_stocks ?? pr.received_qty ?? pr.quantity ?? pr.qty ?? 1),
      stocks: Number(pr.stocks ?? 0),
      stocks_before: pr.stocks_before,
      buy_price: pr.buy_price,
      sell_price: pr.sell_price,
      barcode: pr.barcode,
      category: pr.category,
      gst: parseGst(pr.gst || pr.datas?.gst || pr.taxGst || pr.tax_gst || 0),
      storage_location: pr.storage_location || pr.datas?.storage_location,
      has_batch: pr.has_batch,
      has_serialno: pr.has_serialno,
      has_variant: pr.has_variant,
      variants: Array.isArray(pr.variants) ? pr.variants.map((v: any) => ({
        id: v.id,
        name: v.name,
        buy_price: v.buy_price,
        sell_price: v.sell_price,
        stocks: v.stocks,
        stocks_before: v.stocks_before,
        batches: Array.isArray(v.batches) ? v.batches.map((b: any) => {
          const serialsArr = Array.isArray(b.serials)
            ? b.serials.flatMap((s: any) => s.serial_numbers || [])
            : (b.serial_numbers?.serial_numbers || b.serial_number?.serial_numbers || (Array.isArray(b.serial_numbers) ? b.serial_numbers : null));
          return {
            name: b.name,
            stocks: b.stocks ?? b.quantity ?? 1,
            expiry_date: b.expiry_date,
            manufacturing_date: b.manufacturing_date,
            serial_numbers: serialsArr && serialsArr.length > 0 ? serialsArr : null,
          };
        }) : [],
        serials: Array.isArray(v.serials) ? v.serials.map((s: any) => ({
          id: s.id,
          serial_numbers: s.serial_numbers || []
        })) : undefined
      })) : undefined,
      batches: Array.isArray(pr.batches) ? pr.batches.map((b: any) => {
        const serialsArr = Array.isArray(b.serials)
          ? b.serials.flatMap((s: any) => s.serial_numbers || [])
          : (b.serial_numbers?.serial_numbers || b.serial_number?.serial_numbers || (Array.isArray(b.serial_numbers) ? b.serial_numbers : null));
        return {
          name: b.name,
          stocks: b.stocks ?? b.quantity ?? 1,
          expiry_date: b.expiry_date,
          manufacturing_date: b.manufacturing_date,
          serial_numbers: serialsArr && serialsArr.length > 0 ? serialsArr : null,
        };
      }) : undefined,
      serials: Array.isArray(pr.serials) ? pr.serials.map((s: any) => ({
        id: s.id,
        serial_numbers: s.serial_numbers || []
      })) : undefined
    })),
    total_cost: totalCost,
    paid_amount: paidAmount,
    outstanding: outstanding,
    purchaseType: typeMap[p.type] ?? "Purchase",
    paymentMethod: String(d2?.payment?.method ?? d2?.payment_method ?? "—"),
    charges: {
      other: otherCharge,
      transport: transportCharge,
    },
    grand_total: grandTotal,
    additional_charges_total: additionalChargesTotal,
    storage_location: d2?.storage_location || (p as any).storage_location || "",
  };
}

/* ================= SCOPED STYLES ================= */
const STYLES = `
  .po-scrollbar::-webkit-scrollbar { width: 3px; }
  .po-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .po-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
  .po-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }

  .po-scrollbar-h::-webkit-scrollbar { height: 3px; }
  .po-scrollbar-h::-webkit-scrollbar-track { background: transparent; }
  .po-scrollbar-h::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
  .po-scrollbar-h::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }

  .po-card {
    transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  }
  .po-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -4px rgba(0,0,0,0.08), 0 2px 8px -2px rgba(0,0,0,0.04);
    border-color: #bfdbfe;
  }
  .po-card-flat {
    transition: box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
  }
  .po-card-flat:hover {
    box-shadow: 0 2px 8px -2px rgba(0,0,0,0.06);
    border-color: #bfdbfe;
    background-color: #fafbff;
  }
  .po-row:hover { background-color: #fafbff; }
  .po-arrow { transition: transform 0.2s ease, color 0.2s ease; }
  .po-card:hover .po-arrow,
  .po-card-flat:hover .po-arrow,
  .po-row:hover .po-arrow { transform: translateX(2px); color: #2563eb; }
  .po-footer { transition: background-color 0.2s ease; }
  .po-card:hover .po-footer { background-color: #f8faff; }
`;

/* ================= SHARED HELPERS ================= */
const fmt = (n: number) => `₹${n.toLocaleString()}`;

const ProductPill = ({ name, qty, stocksBefore, variant, batch }: { name: string; qty: number; stocksBefore?: number; variant?: string | null; batch?: string | null }) => (
  <span className="inline-flex flex-col gap-0.5 text-xs font-medium text-zinc-650 bg-zinc-50 border border-zinc-100 px-2.5 py-1.5 rounded-lg">
    <span className="truncate max-w-[150px] font-bold text-zinc-750">{name}</span>
    {(variant || batch) && (
      <div className="flex flex-wrap gap-1 mt-0.5">
        {variant && (
          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-violet-50 text-violet-700 border border-violet-100 truncate max-w-[110px]">
            V: {variant}
          </span>
        )}
        {batch && (
          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 truncate max-w-[110px]">
            B: {batch}
          </span>
        )}
      </div>
    )}
    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-zinc-400 font-semibold tabular-nums shrink-0 mt-0.5">
      <span>Received: {qty}</span>
      {stocksBefore !== undefined && stocksBefore !== null && (
        <span className="text-blue-500 font-bold whitespace-nowrap bg-zinc-100/80 px-1 py-0.2 rounded border border-zinc-200/50">
          Op: {stocksBefore} → Cur: {stocksBefore + qty}
        </span>
      )}
    </div>
  </span>
);



const PurchaseTypeBadge = ({ type }: { type: PurchaseType }) => {
  let colors = "bg-zinc-100 text-zinc-600 border-zinc-200"; // Fallback

  if (type === "Purchase") colors = "bg-blue-50 text-blue-700 border-blue-100";
  if (type === "PO Purchase") colors = "bg-purple-50 text-purple-700 border-purple-100";
  if (type === "Production") colors = "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold   border whitespace-nowrap ${colors}`}>
      {type}
    </span>
  );
};

/* ================= GRID CARD ================= */
const GridCard = ({ po, onClick }: { po: DirectPurchaseData; onClick: () => void }) => {
  const totalQty = po.products.reduce((s, i) => s + i.quantity, 0);
  return (
    <div
      onClick={onClick}
      className="po-card group bg-white rounded-lg border border-zinc-200 shadow-sm cursor-pointer flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
            <ReceiptText size={14} className="text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-zinc-800 tracking-tight">{po.poNumber}</span>
          <PurchaseTypeBadge type={po.purchaseType} />
        </div>
        <span className="shrink-0 text-xs font-medium text-zinc-400 bg-white border border-zinc-200 px-2.5 py-0.5 rounded-full">
          {po.products.length} item{po.products.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 px-5 py-4 border-b border-zinc-100">
        <div className="flex items-start gap-2.5">
          <Building2 size={14} className="text-zinc-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold   text-zinc-400 mb-0.5">Vendor</p>
            <p className="text-sm font-medium text-zinc-700 truncate">{po.vendor}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Calendar size={14} className="text-zinc-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold   text-zinc-400 mb-0.5">Date</p>
            <p className="text-sm font-medium text-zinc-700">{po.date}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{po.time}</p>
          </div>
        </div>
        {po.storage_location && (
          <div className="col-span-2 flex items-start gap-2.5 pt-3 border-t border-zinc-100">
            <Building2 size={14} className="text-zinc-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 mb-0.5">Storage Location</p>
              <p className="text-xs font-semibold text-zinc-650 uppercase tracking-wide bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded w-fit">
                {po.storage_location}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Products */}
      <div className="px-5 py-4 flex-grow flex flex-col">
        <div className="flex items-center gap-1.5 mb-3">
          <Package size={13} className="text-zinc-400" />
          <span className="text-[10px] font-semibold   text-zinc-400">Products Ordered</span>
        </div>
        <div className="po-scrollbar max-h-[9rem] overflow-y-auto space-y-1.5 pr-1">
          {po.products.map((p, idx) => {
            // Flatten variants/batches for display
            const variantRows: { variant?: string; batch?: string }[] = [];
            if (p.variants && p.variants.length > 0) {
              p.variants.forEach((v) => {
                if (v.batches && v.batches.length > 0) {
                  v.batches.forEach((b) => variantRows.push({ variant: v.name, batch: b.name }));
                } else {
                  variantRows.push({ variant: v.name });
                }
              });
            } else if (p.batches && p.batches.length > 0) {
              p.batches.forEach((b) => variantRows.push({ batch: b.name }));
            }
            const firstRow = variantRows[0];
            return (
              <div key={idx} className="flex items-start justify-between py-2 text-sm border-b border-zinc-50 last:border-0 gap-2">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-zinc-600 truncate group-hover:text-zinc-800 transition-colors text-xs font-semibold">{p.name}</span>
                  {(firstRow?.variant || firstRow?.batch) && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {firstRow.variant && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-violet-50 text-violet-700 border border-violet-100 truncate max-w-[100px]">
                          V: {firstRow.variant}
                        </span>
                      )}
                      {firstRow.batch && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 truncate max-w-[100px]">
                          B: {firstRow.batch}
                        </span>
                      )}
                      {variantRows.length > 1 && (
                        <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          +{variantRows.length - 1} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded">
                    Recv: {p.quantity}
                  </span>
                  {p.stocks_before !== undefined && p.stocks_before !== null && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase">
                      <span>Op: {p.stocks_before}</span>
                      <span>•</span>
                      <span className="text-blue-500 font-extrabold">Cur: {p.stocks_before + p.quantity}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="po-footer px-5 py-4 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between gap-4 mt-auto">
        <div>
          <p className="text-[10px] font-semibold   text-zinc-400 mb-0.5">Total Amount</p>
          <p className="text-xl font-semibold text-zinc-900 tracking-tight tabular-nums">{fmt(po.total_cost)}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-semibold   text-zinc-400 mb-0.5">Qty</p>
            <p className="text-sm font-semibold text-zinc-700 tabular-nums">{totalQty}</p>
          </div>
          <div className="w-8 h-8 rounded-full border border-zinc-200 bg-white flex items-center justify-center shadow-sm group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
            <ChevronRight size={15} className="po-arrow text-zinc-400" />
          </div>
        </div>
      </div>
    </div>
  );
};


const VerticalTable = ({ data, onClick, totalCount }: { data: DirectPurchaseData[]; onClick: (po: DirectPurchaseData) => void; totalCount: number }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
          <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">Purchase Invoice</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">Vendor</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">Date</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left hidden md:table-cell">Products</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-right">Qty</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-right">Total</th>
              <th className="px-3 py-2.5 w-16 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((po) => {
              const totalQty = po.products.reduce((s, i) => s + i.quantity, 0);
              return (
                <tr
                  key={po.id}
                  onClick={() => onClick(po)}
                  className="group cursor-pointer transition-colors border-b border-slate-50 hover:bg-slate-50/60"
                >
                  {/* PO Details */}
                  <td className="p-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                        <ReceiptText size={13} className="text-blue-600" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[11px] font-semibold text-slate-800">{po.poNumber}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <PurchaseTypeBadge type={po.purchaseType} />
                          {po.storage_location && (
                            <span className="text-[9px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                              {po.storage_location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Vendor */}
                  <td className="p-2.5 px-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      {po.vendor}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="p-2.5 px-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        {po.date}
                      </div>
                      <span className="text-[10px] text-slate-400 pl-5 font-medium">{po.time}</span>
                    </div>
                  </td>

                  {/* Products */}
                  <td className="p-2.5 px-3 hidden md:table-cell max-w-[360px]">
                    <div className="flex flex-wrap gap-1.5">
                      {po.products.slice(0, 2).map((p, idx) => {
                        // Get first variant/batch for the pill
                        const firstVariant = p.variants?.[0]?.name || null;
                        const firstBatch = p.variants?.[0]?.batches?.[0]?.name || p.batches?.[0]?.name || null;
                        return (
                          <ProductPill
                            key={idx}
                            name={p.name}
                            qty={p.quantity}
                            stocksBefore={p.stocks_before}
                            variant={firstVariant}
                            batch={firstBatch}
                          />
                        );
                      })}
                      {po.products.length > 2 && (
                        <span className="inline-flex items-center text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          +{po.products.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="p-2.5 px-3 text-right">
                    <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                      {totalQty}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="p-2.5 px-3 text-right">
                    <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                      {fmt(po.total_cost)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-2.5 px-3 text-right">
                    <div className="flex items-center justify-end">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-50 px-4 py-2 flex items-center justify-between bg-white shrink-0">
        <span className="text-[11px] text-slate-400 font-medium">
          {data.length} of {totalCount} purchase{totalCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
};


/* ================= VIEW TOGGLE ================= */
const ViewToggle = ({
  current,
  onChange,
}: {
  current: ViewMode;
  onChange: (v: ViewMode) => void;
}) => {
  const options: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "grid", icon: <LayoutGrid size={14} />, label: "Grid view" },
    { mode: "vertical", icon: <List size={14} />, label: "Vertical view" },
  ];

  return (
    <div className="inline-flex items-center bg-zinc-100 rounded-lg p-0.5 gap-0.5">
      {options.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          title={label}
          className={`flex items-center justify-center w-8 h-8 rounded-md transition-all ${current === mode
            ? "bg-white shadow-sm text-blue-600 border border-zinc-200"
            : "text-zinc-400 hover:text-zinc-600"
            }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
const PurchaseHistory = () => {
  const { getData } = useApi();
  const location = useLocation();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";
  const { setActions } = useHeader();

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}
      </div>
    );
    return () => setActions(null);
  }, [setActions, isCleanMode]);

  const [allPurchases, setAllPurchases] = useState<DirectPurchaseData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("vertical");
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const vendorsList = useMemo(() => Array.from(new Set(allPurchases.map(p => p.vendor))), [allPurchases]);
  const activeFiltersCount = [filterType, filterVendor].filter(Boolean).length;

  const resetFilters = () => {
    setFilterType("");
    setFilterVendor("");
  };

  useEffect(() => {
    const load = async () => {
      const [direct] = await Promise.all([
        getData(ENDPOINTS.PURCHASES, { view: "PURCHASE_VIEW", shop_id: SHOP_ID, limit: "50", offset: "1" }),
      ]);
      const toList = (res: any): PurchaseRecord[] =>
        res ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      setAllPurchases([...toList(direct)].map(toDisplayData));
    };
    load();
  }, []);

  const handleCardClick = (po: DirectPurchaseData) => {
    navigate(`/purchase/detail/${po.id}`, { state: { po } });
  };

  const filtered = allPurchases.filter((po) => {
    const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || po.purchaseType === filterType;
    const matchesVendor = !filterVendor || po.vendor === filterVendor;
    return matchesSearch && matchesType && matchesVendor;
  });

  return (
    <>
      <style>{STYLES}</style>

      <div className="flex-1 flex flex-col min-h-0 gap-2.5 font-sans w-full overflow-hidden relative">
        {!isCleanMode && <div className="flex-none"><DirectHeader /></div>}

        {/* ── Toolbar ── */}
        <div className="bg-white border border-slate-100 rounded-lg p-1.5 px-2.5 flex flex-nowrap items-center gap-1.5 shadow-sm overflow-x-auto scrollbar-none">
          <div className="relative w-80 shrink-0">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
              placeholder="Search PO number or vendor…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${activeFiltersCount > 0
                ? "border-blue-200 text-blue-600 bg-blue-50/50"
                : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
              }`}
            title="Filters"
          >
            <Filter size={13} />
            {activeFiltersCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>

          {searchTerm && (
            <span className="text-[11px] text-slate-400 font-medium ml-1 shrink-0">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </span>
          )}

          <div className="flex-1" />

          <ViewToggle current={viewMode} onChange={setViewMode} />
        </div>

        <RightSidebarFilter
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onApply={() => { }}
          onClear={resetFilters}
          title="Purchase Order Filters"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Purchase Type</label>
              <ReusableSelect
                options={[
                  { label: "All Types", value: "" },
                  { label: "Direct Purchase", value: "Direct" },
                  { label: "LPO (Local PO)", value: "LPO" }
                ]}
                value={filterType}
                onValueChange={setFilterType}
                placeholder="Type"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vendor</label>
              <ReusableSelect
                options={[
                  { label: "All Vendors", value: "" },
                  ...vendorsList.map(vendor => ({ label: vendor, value: vendor }))
                ]}
                value={filterVendor}
                onValueChange={setFilterVendor}
                placeholder="Vendor"
              />
            </div>
          </div>
        </RightSidebarFilter>

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <ReceiptText size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No purchase orders found</p>
            <p className="text-xs mt-1">Try adjusting your search term</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="overflow-x-auto overflow-y-auto bg-white border border-slate-100 rounded-lg shadow-sm p-4 flex-1 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((po) => (
                <GridCard key={po.id} po={po} onClick={() => handleCardClick(po)} />
              ))}
            </div>
          </div>
        ) : (
          <VerticalTable data={filtered} onClick={handleCardClick} totalCount={allPurchases.length} />
        )}
      </div>
    </>
  );
};

export default PurchaseHistory;

