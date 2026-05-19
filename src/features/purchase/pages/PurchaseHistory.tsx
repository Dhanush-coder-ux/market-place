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
  TrendingUp,
  ExternalLink,
  Filter
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import DirectHeader from "../components/DirectHeader";
import { FloatingFormCard } from "@/components/common/FloatingFormCard";
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
  }[];
  batches?: {
    name: string;
    stocks: number;
    expiry_date?: string;
    manufacturing_date?: string;
    serial_numbers?: string[];
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
}

type ViewMode = "grid" | "horizontal" | "vertical";

function toDisplayData(p: PurchaseRecord): DirectPurchaseData {
  const d2 = p.datas as any;
  const products = ((p as any).products ?? d2?.products ?? d2?.purchase_products ?? d2?.grn_products ?? d2?.finished_products) as any[] | undefined;
  const dateRaw = String(d2?.purchaseDetails?.date ?? d2?.purchase_date ?? d2?.production_date ?? d2?.receipt_date ?? (p as any).date ?? new Date().toISOString());
  const d = new Date(dateRaw.includes("T") ? dateRaw : dateRaw + "T00:00:00");
  const typeMap: Record<string, PurchaseType> = {
    DIRECT: "Purchase",
    PO_CREATE: "PO Purchase",
    PO_UPDATE: "PO Purchase",
    PRODUCTION: "Production",
  };

  // Try to find the vendor name from various possible fields
  const vendorName = d2?.supplier_name ?? d2?.supplier ?? d2?.purchaseDetails?.supplier_name ?? "—";

  let totalCost = Number(d2?.payment?.amountPaid ?? d2?.total_cost ?? d2?.grand_total ?? 0);

  const otherCharge = Number(p.additional_charges?.other_charge ?? d2?.charges?.other ?? 0);
  const transportCharge = Number(p.additional_charges?.delivery_charge ?? d2?.charges?.transport ?? 0);

  if (totalCost === 0 && Array.isArray((p as any).products ?? d2?.products ?? d2?.purchase_products ?? d2?.grn_products ?? d2?.finished_products)) {
    const prods = ((p as any).products ?? d2?.products ?? d2?.purchase_products ?? d2?.grn_products ?? d2?.finished_products);
    totalCost = prods.reduce((sum: number, pr: any) => sum + (Number(pr.quantity ?? pr.qty ?? pr.stocks ?? 1) * Number(pr.buy_price ?? 0)), 0);
    // Include charges in the manually calculated total cost
    totalCost += otherCharge + transportCharge;
  }

  return {
    id: p.id,
    poNumber: d2?.purchaseDetails?.invoiceNo ?? p.id.slice(0, 8).toUpperCase(),
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
      variants: Array.isArray(pr.variants) ? pr.variants.map((v: any) => ({
        id: v.id,
        name: v.name,
        buy_price: v.buy_price,
        sell_price: v.sell_price,
        stocks: v.stocks,
        stocks_before: v.stocks_before,
        batches: Array.isArray(v.batches) ? v.batches.map((b: any) => ({
          name: b.name,
          stocks: b.stocks ?? b.quantity ?? 1,
          expiry_date: b.expiry_date,
          manufacturing_date: b.manufacturing_date,
          serial_numbers: b.serial_numbers?.serial_numbers || b.serial_number?.serial_numbers || null,
        })) : []
      })) : undefined,
      batches: Array.isArray(pr.batches) ? pr.batches.map((b: any) => ({
        name: b.name,
        stocks: b.stocks ?? b.quantity ?? 1,
        expiry_date: b.expiry_date,
        manufacturing_date: b.manufacturing_date,
        serial_numbers: b.serial_numbers?.serial_numbers || b.serial_number?.serial_numbers || null,
      })) : undefined,
    })),
    total_cost: totalCost,
    purchaseType: typeMap[p.type] ?? "Purchase",
    paymentMethod: String(d2?.payment?.method ?? d2?.payment_method ?? "—"),
    charges: {
      other: otherCharge,
      transport: transportCharge,
    },
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

const ProductPill = ({ name, qty, stocks }: { name: string; qty: number; stocks?: number }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
    <span className="truncate max-w-[150px]">{name}</span>
    <span className="text-zinc-400 font-semibold tabular-nums shrink-0">
      Received Stock: {qty} {stocks !== undefined && <span className="ml-1 text-blue-500 font-bold">Ordered Stock: {stocks}</span>}
    </span>
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
      </div>

      {/* Products */}
      <div className="px-5 py-4 flex-grow flex flex-col">
        <div className="flex items-center gap-1.5 mb-3">
          <Package size={13} className="text-zinc-400" />
          <span className="text-[10px] font-semibold   text-zinc-400">Products Ordered</span>
        </div>
        <div className="po-scrollbar max-h-[7.5rem] overflow-y-auto space-y-1.5 pr-1">
          {po.products.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 text-sm border-b border-zinc-50 last:border-0">
              <span className="text-zinc-600 truncate pr-3 group-hover:text-zinc-800 transition-colors">{p.name}</span>
              <div className="shrink-0 flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded">
                  Received Stock: {p.quantity}
                </span>
                {p.stocks !== undefined && (
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                    Ordered Stock: {p.stocks}
                  </span>
                )}
              </div>
            </div>
          ))}
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
              <th className="px-3 py-2.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">PO Details</th>
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
                        <div className="w-fit"><PurchaseTypeBadge type={po.purchaseType} /></div>
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
                  <td className="p-2.5 px-3 hidden md:table-cell max-w-[320px]">
                    <div className="flex flex-wrap gap-1.5">
                      {po.products.slice(0, 2).map((p, idx) => (
                        <ProductPill key={idx} name={p.name} qty={p.quantity} stocks={p.stocks} />
                      ))}
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
  const [selectedPO, setSelectedPO] = useState<DirectPurchaseData | null>(null);

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
    setSelectedPO(po);
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
            className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${
              activeFiltersCount > 0
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
          onApply={() => {}}
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
      <FloatingFormCard
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        title={selectedPO ? `Purchase Details: ${selectedPO.poNumber}` : "Details"}
        maxWidth="max-w-2xl"
      >
        {selectedPO && (
          <div className="space-y-6">

            {/* Meta Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              <div>
                <p className="text-[10px] font-bold   text-zinc-400 mb-1">Vendor</p>
                <p className="text-sm font-semibold text-zinc-800">{selectedPO.vendor}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold   text-zinc-400 mb-1">Date</p>
                <p className="text-sm font-semibold text-zinc-800">{selectedPO.date}</p>
                <p className="text-[10px] text-zinc-500">{selectedPO.time}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold   text-zinc-400 mb-1">Payment</p>
                <p className="text-sm font-semibold text-zinc-800">{selectedPO.paymentMethod}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold   text-zinc-400 mb-1">Total Cost</p>
                <p className="text-lg font-bold text-blue-600">₹{selectedPO.total_cost.toLocaleString()}</p>
              </div>
            </div>

            {/* Charges Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <p className="text-[10px] font-bold   text-zinc-400 mb-1">Transport Charges</p>
                <p className="text-sm font-semibold text-zinc-800">₹{selectedPO.charges?.transport.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <p className="text-[10px] font-bold   text-zinc-400 mb-1">Other Charges</p>
                <p className="text-sm font-semibold text-zinc-800">₹{selectedPO.charges?.other.toLocaleString()}</p>
              </div>
            </div>

            {/* Products List */}
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-100 pb-2">
                <Package size={16} className="text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-800">Products Ordered</h3>
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full ml-auto">
                  {selectedPO.products.reduce((s, i) => s + i.quantity, 0)} Total Units
                </span>
              </div>

              <div className="space-y-2">
                {selectedPO.products.map((product, idx) => (
                  <div key={idx} className="flex flex-col p-3 rounded-lg border border-zinc-200 bg-white shadow-sm hover:border-blue-200 transition-colors">

                    <div className="flex items-start justify-between mb-3 border-b border-zinc-50 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-zinc-800">{product.name}</span>
                          {product.barcode && <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">{product.barcode}</span>}
                        </div>
                        {product.category && <p className="text-[11px] font-medium text-zinc-500 mt-0.5">{product.category}</p>}
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 shadow-sm mb-1.5">
                          × {product.quantity}
                        </span>
                        {(product.buy_price !== undefined || product.sell_price !== undefined) && (
                          <div className="text-[10px] font-medium text-zinc-500 flex flex-col items-end gap-0.5">
                            {product.buy_price !== undefined && <span>Buy: ₹{product.buy_price}</span>}
                            {product.sell_price !== undefined && <span className="text-emerald-600">Sell: ₹{product.sell_price}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock Movement Tracking */}
                    {product.stocks_before !== undefined && (
                      <div className="mb-3 p-2.5 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-zinc-400  ">Opening Stock</span>
                            <span className="text-xs font-bold text-zinc-600">{product.stocks_before}</span>
                          </div>
                          <div className="w-px h-6 bg-zinc-200" />
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-blue-400  ">Received Stock</span>
                            <span className="text-xs font-bold text-blue-600">+{product.quantity}</span>
                          </div>
                          <div className="w-px h-6 bg-zinc-200" />
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-emerald-400  ">Closing Stock</span>
                            <span className="text-xs font-bold text-emerald-600">{(product.stocks_before ?? 0) + product.quantity}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100/50 rounded-lg border border-emerald-100">
                          <TrendingUp size={12} className="text-emerald-600" />
                          <span className="text-[9px] font-black text-emerald-700 ">Stock Updated</span>
                        </div>
                      </div>
                    )}

                    {/* Render Variants */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="mt-2 space-y-3 pl-3 border-l-2 border-zinc-100">
                        {product.variants.map((variant, vIdx) => (
                          <div key={vIdx} className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                <span className="text-xs font-bold text-zinc-600">{variant.name}</span>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                {(variant.buy_price !== undefined || variant.sell_price !== undefined) && (
                                  <div className="text-[9px] font-medium text-zinc-500 flex flex-col items-end gap-0.5">
                                    {variant.buy_price !== undefined && <span>Buy: ₹{variant.buy_price}</span>}
                                    {variant.sell_price !== undefined && <span className="text-emerald-600">Sell: ₹{variant.sell_price}</span>}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Variant Batches */}
                            {variant.batches && variant.batches.length > 0 && (
                              <div className="grid grid-cols-1 gap-2 pl-4">
                                {variant.batches.map((batch, bIdx) => (
                                  <div key={bIdx} className="p-2 bg-zinc-50 rounded border border-zinc-100">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-semibold text-zinc-700">{batch.name}</span>
                                      <span className="text-[10px] font-bold text-zinc-500">Qty: {batch.stocks}</span>
                                    </div>
                                    {(batch.expiry_date || batch.manufacturing_date) && (
                                      <div className="flex items-center gap-3 text-[9px] text-zinc-400 mt-0.5">
                                        {batch.manufacturing_date && <span>MFG: {new Date(batch.manufacturing_date).toLocaleDateString()}</span>}
                                        {batch.expiry_date && <span>EXP: {new Date(batch.expiry_date).toLocaleDateString()}</span>}
                                      </div>
                                    )}
                                    {batch.serial_numbers && batch.serial_numbers.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {batch.serial_numbers.map((sn: string, snIdx: number) => (
                                          <span key={snIdx} className="text-[9px] font-mono bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-500">
                                            {sn}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render Product Level Batches (if no variants) */}
                    {(!product.variants || product.variants.length === 0) && product.batches && product.batches.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 gap-2 pl-3 border-l-2 border-zinc-100">
                        {product.batches.map((batch, bIdx) => (
                          <div key={bIdx} className="p-2 bg-zinc-50 rounded border border-zinc-100">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-zinc-700">{batch.name}</span>
                              <span className="text-[10px] font-bold text-zinc-500">Qty: {batch.stocks}</span>
                            </div>
                            {(batch.expiry_date || batch.manufacturing_date) && (
                              <div className="flex items-center gap-3 text-[9px] text-zinc-400 mt-0.5">
                                {batch.manufacturing_date && <span>MFG: {new Date(batch.manufacturing_date).toLocaleDateString()}</span>}
                                {batch.expiry_date && <span>EXP: {new Date(batch.expiry_date).toLocaleDateString()}</span>}
                              </div>
                            )}
                            {batch.serial_numbers && batch.serial_numbers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {batch.serial_numbers.map((sn: string, snIdx: number) => (
                                  <span key={snIdx} className="text-[9px] font-mono bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-500">
                                    {sn}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons (Optional) */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg transition-colors">
                Print Invoice
              </button>
            </div>

          </div>
        )}
      </FloatingFormCard>
    </>
  );
};

export default PurchaseHistory;

