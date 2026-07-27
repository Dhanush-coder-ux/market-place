import { useState, useEffect, useMemo, useCallback } from "react";
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
  Filter,
  Eye,
  Pencil,
  MoreVertical,
  Printer,
  Share2,
  Trash2
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { GroupedItemsDrawer } from "@/components/common/HistoryTables";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { StatCard } from "@/components/common/StatsCard";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { PurchaseRecord } from "@/types/api";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import SkeletonLoader from "@/components/common/SkeletonLoader";


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
  variant?: any;
  batch?: any;
  serial_info?: any;
  stocks_added?: number;
  received_stocks?: number;
}

export type PurchaseType = "Purchase" | "PO Purchase" | "Production" | "Purchase Return";

export interface DirectPurchaseData {
  id: string;
  poNumber: string;
  systemId?: string;
  totoalItems:number;
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
  status?: string;
  payment_status?: string;
  version?: string;
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
  const products = ((p as any).items ?? (p as any).products ?? d2?.products ?? d2?.purchase_products ?? d2?.grn_products ?? d2?.finished_products) as any[] | undefined;
  const dateRaw = String(d2?.purchaseDetails?.date ?? d2?.purchase_date ?? d2?.production_date ?? d2?.receipt_date ?? d2?.adjusted_date ?? (p as any).date ?? (p as any).purchase_date ?? new Date().toISOString());

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
    PURCHASE_RETURN: "Purchase Return",
  };

  // Try to find the vendor name from various possible fields
  const vendorObj = (p as any).supplier;
  let vendorName = d2?.supplier_name ?? d2?.purchaseDetails?.supplier_name ?? vendorObj?.supplier_name ?? vendorObj?.name ?? d2?.supplier ?? "—";
  if (typeof vendorName === 'object') {
    vendorName = (vendorName as any).supplier_name || (vendorName as any).name || "—";
  }

  const otherCharge = Number(
    (p as any).charges_infos?.other_charge ??
    (p as any).other_charges ??
    p.additional_charges?.other_charge ??
    d2?.other_charges ??
    d2?.charges?.other ??
    0
  );

  const transportCharge = Number(
    (p as any).charges_infos?.transport_charge ??
    (p as any).transport_charge ??
    p.additional_charges?.delivery_charge ??
    d2?.transport_charge ??
    d2?.charges?.transport ??
    0
  );

  const prods = (products ?? []);
  const subtotal = (p as any).item_infos?.total_pur_cost ?? prods.reduce((sum: number, pr: any) => {
    const qty = Number(pr.stocks_infos?.stocks ?? pr.stocks ?? pr.received_stocks ?? pr.received_qty ?? pr.quantity ?? pr.qty ?? pr.stocks_added ?? 1);
    const price = Number(pr.pricing_infos?.[0]?.buy_price ?? pr.buy_price ?? 0);
    return sum + (qty * price);
  }, 0);

  const totalGst = (p as any).item_infos?.total_gst_amount ?? prods.reduce((sum: number, pr: any) => {
    const qty = Number(pr.stocks_infos?.stocks ?? pr.stocks ?? pr.received_stocks ?? pr.received_qty ?? pr.quantity ?? pr.qty ?? pr.stocks_added ?? 1);
    const price = Number(pr.pricing_infos?.[0]?.buy_price ?? pr.buy_price ?? 0);
    const gstPercent = parseGst(pr.gst || pr.datas?.gst || pr.taxGst || pr.tax_gst || 0);
    return sum + (qty * price * (gstPercent / 100));
  }, 0);

  const totalCost = (p as any).total_cost ?? (subtotal + totalGst);
  const additionalChargesTotal = otherCharge + transportCharge;
  const grandTotal = totalCost + additionalChargesTotal;

  const totoalItems= (p as any).item_infos?.total_pur_items ?? (p as any).total_items;

  const paymentInfoObj = Array.isArray((p as any).payment_infos) ? (p as any).payment_infos[0] : null;
  const paidAmount = Number(paymentInfoObj?.amount ?? (p as any).paid_amount ?? d2?.payment?.amountPaid ?? d2?.payment_info?.amountPaid ?? d2?.paid_amount ?? 0);
  const outstanding = (p as any).outstanding_amount !== undefined ? Number((p as any).outstanding_amount) : Math.max(
    0,
    grandTotal - paidAmount
  );

  return {
    id: p.id || (p as any).purchase_id || "",
    poNumber: d2?.purchaseDetails?.invoiceNo || (p as any).invoice_no || ((p as any).ui_id ? String((p as any).ui_id) : p.id?.slice(0, 8).toUpperCase() ?? "PO"),
    systemId: (p as any).ui_id ? String((p as any).ui_id) : "",
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    vendor: String(vendorName),
    totoalItems:totoalItems,
    version: (p as any).version || d2?.version || "v1",
    products: (products ?? []).map((pr: any) => {
      const pBuyPrice = pr.pricing_infos?.[0]?.buy_price ?? pr.buy_price;
      const pSellPrice = pr.pricing_infos?.[0]?.sell_price ?? pr.sell_price;
      const pStorage = pr.storage_location_infos?.name ?? pr.storage_locations?.[0]?.name ?? pr.storage_location ?? pr.datas?.storage_location;
      
      return {
      name: String(pr.name ?? pr.product_name ?? pr.product_id ?? "Item"),
      quantity: Number(pr.stocks_infos?.stocks ?? pr.stocks ?? pr.received_stocks ?? pr.received_qty ?? pr.quantity ?? pr.qty ?? pr.stocks_added ?? 1),
      stocks: Number(pr.stocks_infos?.stocks ?? pr.stocks ?? 0),
      stocks_before: pr.stocks_infos?.stocks_before ?? pr.stocks_before,
      buy_price: pBuyPrice,
      sell_price: pSellPrice,
      barcode: pr.barcode,
      category: pr.category,
      gst: parseGst(pr.gst || pr.datas?.gst || pr.taxGst || pr.tax_gst || 0),
      storage_location: pStorage,
      has_batch: pr.has_batch,
      has_serialno: pr.has_serialno,
      has_variant: pr.has_variant,
      variant: pr.variant || (pr.variant_infos ? { variant_name: pr.variant_infos.name, id: pr.variant_infos.id } : null),
      batch: pr.batch || (pr.batch_infos ? { batch_name: pr.batch_infos.name || pr.batch_infos.batch_name, mfg_date: pr.batch_infos.mfg_date, exp_date: pr.batch_infos.exp_date } : null),
      serial_info: pr.serial_info || (pr.serial_numbers ? { serial_numbers: pr.serial_numbers } : null),
      stocks_added: pr.stocks_added ?? pr.stocks_infos?.stocks ?? pr.stocks ?? 0,
      received_stocks: pr.received_stocks ?? pr.stocks_infos?.stocks ?? pr.stocks ?? 0,
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
    }; }),
    total_cost: totalCost,
    paid_amount: paidAmount,
    outstanding: outstanding,
    purchaseType: typeMap[p.type] ?? "Purchase",
    paymentMethod: String(paymentInfoObj?.method ?? d2?.payment?.method ?? d2?.payment_method ?? "—"),
    charges: {
      other: otherCharge,
      transport: transportCharge,
    },
    grand_total: grandTotal,
    additional_charges_total: additionalChargesTotal,
    storage_location: d2?.storage_location || (p as any).storage_location || "",
    status: d2?.status ?? (p as any).status ?? "completed",
    payment_status: (p as any).payment_status ?? "PENDING",
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
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const PurchaseTypeBadge = ({ type }: { type: PurchaseType }) => {
  let colors = "bg-zinc-100 text-zinc-600 border-zinc-200"; // Fallback

  if (type === "Purchase") colors = "bg-badge-success-bg text-badge-\-text\-badge-\-border";
  if (type === "PO Purchase") colors = "bg-badge-teal-bg text-badge-\-text\-badge-\-border";
  if (type === "Production") colors = "bg-badge-amber-bg text-badge-\-text\-badge-\-border";
  if (type === "Purchase Return" || type === "Return" as any) colors = "bg-badge-purple-bg text-badge-\-text\-badge-\-border";

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold   border whitespace-nowrap ${colors}`}>
      {type}
    </span>
  );
};

/* ================= GRID CARD ================= */
const GridCard = ({ po, selected, onClick }: { po: DirectPurchaseData; selected?: boolean; onClick: () => void }) => {
  const totalQty = po.products.reduce((s, i) => s + i.quantity, 0);
  return (
    <div
      onClick={onClick}
      className={`po-card group rounded-lg border shadow-sm cursor-pointer flex flex-col overflow-hidden transition-all ${selected ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20" : "bg-white border-zinc-200"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
            <ReceiptText size={14} className="text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-800 tracking-tight">{po.poNumber}</span>
            {po.systemId && po.systemId !== po.poNumber && (
              <span className="text-[10px] font-medium text-zinc-500">System ID: {po.systemId}</span>
            )}
          </div>
          <PurchaseTypeBadge type={po.purchaseType} />
                          {po.purchaseType === "Purchase Return" && (
                            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded border border-red-100/50">Returned</span>
                          )}
                          {po.storage_location && (
                            <span className="text-[9px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                              {po.storage_location}
                            </span>
                          )}
                          {po.version && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                              {po.version}
                            </span>
                          )}
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
                const vName = typeof v.name === 'object' && v.name !== null ? ((v.name as any).variant_name || (v.name as any).name) : v.name;
                if (v.batches && v.batches.length > 0) {
                  v.batches.forEach((b) => {
                    const bName = typeof b.name === 'object' && b.name !== null ? ((b.name as any).batch_name || (b.name as any).name) : b.name;
                    variantRows.push({ variant: vName, batch: bName });
                  });
                } else {
                  variantRows.push({ variant: vName });
                }
              });
            } else if (p.batches && p.batches.length > 0) {
              p.batches.forEach((b) => {
                const bName = typeof b.name === 'object' && b.name !== null ? ((b.name as any).batch_name || (b.name as any).name) : b.name;
                variantRows.push({ batch: bName });
              });
            }
            const firstRow = variantRows[0];
            return (
              <div key={idx} className="flex items-start justify-between py-2 text-sm border-b border-zinc-50 last:border-0 gap-2">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-zinc-600 truncate group-hover:text-zinc-800 transition-colors text-xs font-semibold">{p.name}</span>
                  {(firstRow?.variant || firstRow?.batch) && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {firstRow.variant && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-badge-purple-bg text-badge-\-text\-badge-\-border truncate max-w-[100px]">
                          V: {firstRow.variant}
                        </span>
                      )}
                      {firstRow.batch && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-badge-coral-bg text-badge-\-text\-badge-\-border truncate max-w-[100px]">
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
          <div className={`w-8 h-8 rounded-full border border-zinc-200 bg-white flex items-center justify-center shadow-sm transition-all ${selected ? "bg-blue-500 text-white border-blue-500" : "group-hover:border-blue-200 group-hover:bg-blue-50"}`}>
            <ChevronRight size={15} className={`po-arrow ${selected ? "text-white rotate-90" : "text-zinc-400"}`} />
          </div>
        </div>
      </div>
    </div>
  );
};


const VerticalTable = ({ data, selectedIds, onSelect, totalCount, lastElementRef, loadingMore }: { data: DirectPurchaseData[]; selectedIds: Set<string>; onSelect: (po: DirectPurchaseData) => void; totalCount: number; lastElementRef?: any; loadingMore?: boolean }) => {
  const navigate = useNavigate();
  const [drawerRecord, setDrawerRecord] = useState<any | null>(null);
  
  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
          <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-3 py-2.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={data.length > 0 && data.every(po => selectedIds.has(po.id))}
                  onChange={() => {
                    const allSelected = data.length > 0 && data.every(po => selectedIds.has(po.id));
                    if (allSelected) {
                      data.forEach(po => {
                        if (selectedIds.has(po.id)) onSelect(po);
                      });
                    } else {
                      data.forEach(po => {
                        if (!selectedIds.has(po.id)) onSelect(po);
                      });
                    }
                  }}
                  className="rounded border-slate-355 text-blue-605 focus:ring-blue-500/20 cursor-pointer"
                />
              </th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-800 uppercase text-left">Invoice No</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-800 uppercase text-left">Purchase ID</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-800 uppercase text-left">Supplier</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-800 uppercase text-left">Date</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-800 uppercase text-left hidden md:table-cell">Products</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-800 uppercase text-right">Qty</th>
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-800 uppercase text-right">Total</th>
              <th className="px-3 py-2.5 w-24 text-right text-[10px] font-bold tracking-wider text-slate-800 uppercase sticky right-0 bg-slate-50 border-l border-slate-200 z-30 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((po, index) => {
              const totalQty = po.products.reduce((s, i) => s + i.quantity, 0);
              const isSelected = selectedIds.has(po.id);
              return (
                <tr
                  key={po.id}
                  ref={index === data.length - 1 ? lastElementRef : null}
                  className={`group cursor-default transition-colors border-b border-slate-50 ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-slate-50/60"}`}
                >
                  {/* Checkbox */}
                  <td className="p-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelect(po)}
                      className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                    />
                  </td>
                  {/* Invoice No */}
                  <td className="p-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                        <ReceiptText size={13} className="text-blue-600" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[11px] font-semibold text-slate-800">{po.poNumber || "—"}</span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <PurchaseTypeBadge type={po.purchaseType} />
                          {po.storage_location && (
                            <span className="text-[9px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                              {po.storage_location}
                            </span>
                          )}
                          {po.version && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                              {po.version}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Purchase ID */}
                  <td className="p-2.5 px-3">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">{po.systemId || "—"}</span>
                  </td>

                  {/* Supplier */}
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
                  <td className="p-2.5 px-3 border-b border-slate-50 max-w-[200px]">
                    <span className="truncate text-xs font-semibold text-slate-700 block" title={po.products.map(p => p.name).join(", ")}>
                      {po.products.length > 1 ? `${po.products[0]?.name || "—"} +${po.products.length - 1} more` : (po.products[0]?.name || "—")}
                    </span>
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

                  {/* Actions */}
                  <td className="p-2.5 px-3 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-200 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] transition-colors">
                    <div className="flex items-center justify-end gap-2 relative">
                      <button
                        onClick={() => navigate(`/purchase/detail/${po.id}`, { state: { po } })}
                        className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                        title="View Purchase"
                      >
                        <Eye size={15} />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="text-slate-800 hover:text-slate-900 transition-colors p-1 outline-none"
                            title="More actions"
                          >
                            <MoreVertical size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-left font-sans">
                          {po.purchaseType === 'Purchase' && (
                            <DropdownMenuItem
                              onClick={() => navigate(`/purchase/edit/${po.id}`)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                            >
                              <Pencil size={13} />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => alert("Invoice generated and ready to print/share!")}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                          >
                            <Printer size={13} />
                            Print / Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => alert("Record payment initiated!")}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                          >
                            <Share2 size={13} />
                            Record Payment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="border-t border-slate-100 my-1 h-0 bg-transparent" />
                          <DropdownMenuItem
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this purchase? This will reverse stock and cost changes.")) {
                                alert("Purchase deletion requires admin privileges.");
                              }
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 cursor-pointer outline-none"
                          >
                            <Trash2 size={13} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loadingMore && <div className="py-4 text-center text-xs text-slate-500">Loading more...</div>}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-50 px-4 py-2 flex items-center justify-between bg-white shrink-0">
        <span className="text-[11px] text-slate-400 font-medium">
          {data.length} {totalCount > 0 ? `of ${totalCount}` : ''} purchase{data.length !== 1 ? "s" : ""}
        </span>
      </div>
      <GroupedItemsDrawer record={drawerRecord} onClose={() => setDrawerRecord(null)} type="purchase" />
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
  const { purchase } = useBusinessApi();
  const location = useLocation();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";
  const { setActions, setBottomActions } = useHeader();

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

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { getData, deleteData } = useApi();
  const [refreshKey, setRefreshKey] = useState(0);
  const [analyticsStats, setAnalyticsStats] = useState<any>(null);

  useEffect(() => {
    getData(ENDPOINTS.ANALYTICS_PURCHASE_OVERALL, { shop_id: SHOP_ID })
      .then((res) => {
        const data = res?.data ?? res;
        if (data) {
          setAnalyticsStats({ overview: { purchase: data } });
        }
      })
      .catch(() => {});
  }, [getData]);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [viewMode, setViewMode] = useState<ViewMode>("vertical");

  const [filterVendor, setFilterVendor] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPurchases, setSelectedPurchases] = useState<Set<string>>(new Set());

  const toggleSelectPurchase = (id: string) => {
    setSelectedPurchases(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedPurchases.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete these ${selectedPurchases.size} purchases?`)) return;
    try {
      for (const id of Array.from(selectedPurchases)) {
        await deleteData(`${ENDPOINTS.PURCHASES}/${SHOP_ID}/${id}`);
      }
      alert("Selected purchases deleted successfully");
      setSelectedPurchases(new Set());
      setRefreshKey(prev => prev + 1);
    } catch {
      alert("Failed to delete some purchases");
    }
  };

  useEffect(() => {
    if (selectedPurchases.size > 1) {
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              <ReceiptText size={14} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">Selected {selectedPurchases.size} Purchases</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="h-8 px-3 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-655 font-bold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete All
            </button>
          </div>
        </div>
      );
    } else {
      setBottomActions(null);
    }
  }, [selectedPurchases, setBottomActions]);

  const activeFiltersCount = [filterVendor, fromDate, toDate, filterStatus, filterPaymentMethod].filter(Boolean).length;

  const resetFilters = () => {
    setFilterVendor("");
    setFromDate("");
    setToDate("");
    setSearchTerm("");
    setFilterStatus("");
    setFilterPaymentMethod("");
  };

  const fetchPage = useCallback(async (limit: number, offset: number, filters: any) => {
    const params: any = {
      view: "PURCHASE_VIEW",
      limit: limit.toString(),
      offset: offset.toString()
    };
    if (filters.search) params.q = filters.search;
    if (filters.supplier_id) params.supplier_id = filters.supplier_id;
    if (filters.fromDate) params.from_date = filters.fromDate;
    if (filters.toDate) params.to_date = filters.toDate;
    if (filters.payment_status) params.payment_status = filters.payment_status;
    if (filters.payment_method) params.payment_method = filters.payment_method;

    const res = await purchase.getPurchasesByShop(SHOP_ID, params);
    
    const itemsRaw = res ? (Array.isArray(res?.data) ? res.data : (res?.data?.purchases ?? res?.data?.datas ?? [])) : [];
    const parsedItems = itemsRaw.map(toDisplayData);

    return {
      items: parsedItems,
      hasMore: itemsRaw.length === limit,
      stats: res?.data?.overall_stats,
      total: res?.data?.total_count || 0
    };
  }, [purchase]);

  const filters = useMemo(() => ({
    search: debouncedSearch,
    supplier_id: filterVendor,
    fromDate,
    toDate,
    payment_status: filterStatus,
    payment_method: filterPaymentMethod,
    refreshKey
  }), [debouncedSearch, filterVendor, fromDate, toDate, filterStatus, filterPaymentMethod, refreshKey]);

  const { items, loading, loadingMore, totalCount, lastElementRef } = useInfiniteScroll<DirectPurchaseData, any>({
    fetchPage,
    filters,
    limit: 50
  });

  const filtered = useMemo(() => {
    let result = items as DirectPurchaseData[];
    
    if (filterStatus) {
      result = result.filter(po => po.payment_status?.toUpperCase() === filterStatus.toUpperCase());
    }
    
    if (filterPaymentMethod) {
      result = result.filter(po => po.paymentMethod?.toUpperCase() === filterPaymentMethod.toUpperCase());
    }
    
    return result;
  }, [items, filterStatus, filterPaymentMethod]);



  const handleCardClick = (po: DirectPurchaseData) => {
    toggleSelectPurchase(po.id);
  };

  return (
    <>
      <style>{STYLES}</style>

      <div className="flex-1 flex flex-col min-h-0 gap-2.5 font-sans w-full overflow-hidden relative">
        {/* ── KPI Row ── */}
        {!isCleanMode && (
          <div className="flex gap-3 pb-1 overflow-x-auto scrollbar-none">
            <StatCard
              label="Total Purchase"
              value={(analyticsStats?.overview?.purchase?.total_purchase_amounts || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              prefix="₹"
              icon={<ReceiptText size={18} />}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              subValue={`${analyticsStats?.overview?.purchase?.total_purchase || 0} Purchases`}
            />
            <StatCard
              label="Pending Payment"
              value={(analyticsStats?.overview?.purchase?.total_outstanding_amounts || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              prefix="₹"
              icon={<Calendar size={18} />}
              iconBg="bg-amber-50"
              iconColor="text-amber-500"
              subValue="Pending to clear"
            />
            <StatCard
              label="Total Items Bought"
              value={(analyticsStats?.overview?.purchase?.total_purchase_stocks || 0).toString()}
              icon={<Package size={18} />}
              iconBg="bg-rose-50"
              iconColor="text-rose-550"
              subValue="Stocks added"
            />
          </div>
        )}

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
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilterStatus("")}
                  className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${!filterStatus ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterStatus("COMPLETED")}
                  className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${filterStatus === "COMPLETED" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
                >
                  Completed
                </button>
                <button 
                  onClick={() => setFilterStatus("PARTIALY-PAID")}
                  className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${filterStatus === "PARTIALY-PAID" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
                >
                  Partial
                </button>
                <button 
                  onClick={() => setFilterStatus("PENDING")}
                  className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${filterStatus === "PENDING" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
                >
                  Pending
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
              <ReusableSelect
                options={[
                  { label: "All Methods", value: "" },
                  { label: "Cash", value: "CASH" },
                  { label: "UPI", value: "UPI" },
                  { label: "Bank Transfer", value: "BANK" }
                ]}
                value={filterPaymentMethod}
                onValueChange={setFilterPaymentMethod}
                placeholder="Method"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vendor</label>
              <SearchSelect
                labelKey="name"
                valueKey="id"
                fetchOptions={async (q) => {
                  const { supplierApi } = await import("@/services/api/supplier");
                  return await supplierApi.searchSuppliers(q);
                }}
                options={filterVendor ? [{ id: filterVendor, name: "Selected Vendor" }] : []}
                value={filterVendor}
                onChange={(val) => setFilterVendor(val ? String(val) : "")}
                placeholder="Search Supplier..."
                className="w-full h-9 bg-slate-50 border border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="space-y-1.5 flex-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        </RightSidebarFilter>

        {/* ── Content ── */}
        {loading && filtered.length === 0 && !searchTerm && !debouncedSearch ? (
          <div className="p-3">
            <SkeletonLoader variant="table" rows={8} cols={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <ReceiptText size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No purchase orders found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="overflow-x-auto overflow-y-auto bg-white border border-slate-100 rounded-lg shadow-sm p-4 flex-1 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((po, index) => (
                <div key={po.id} ref={index === filtered.length - 1 ? lastElementRef : null}>
                  <GridCard po={po} selected={selectedPurchases.has(po.id)} onClick={() => handleCardClick(po)} />
                </div>
              ))}
            </div>
            {loadingMore && <div className="py-4 text-center text-xs text-slate-500">Loading more...</div>}
          </div>
        ) : (
          <VerticalTable data={filtered} selectedIds={selectedPurchases} onSelect={(po) => toggleSelectPurchase(po.id)} totalCount={totalCount || filtered.length} lastElementRef={lastElementRef} loadingMore={loadingMore} />
        )}
      </div>
    </>
  );
};

export default PurchaseHistory;

