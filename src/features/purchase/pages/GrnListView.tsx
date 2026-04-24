import { useState, useEffect } from "react";
import {
  Eye, Search, SlidersHorizontal, Package,
  Calendar, Building2, FileText, LayoutGrid, List, ArrowRight, X,
  Copy, Check
} from "lucide-react";

import { FloatingFormCard } from "@/components/common/FloatingFormCard";
import GrnHeader from "../components/GrnHeader";
import Input from "@/components/ui/Input";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { PurchaseRecord } from "@/types/api";

type ViewMode = "grid" | "vertical";

/* ================= STATUS CONFIG ================= */
const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
  Completed: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Pending:   { dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Partial:   { dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
};
const defaultStyle = { dot: "bg-slate-400", badge: "bg-slate-50 text-slate-700 border-slate-200" };

const StatusBadge = ({ value }: { value: string }) => {
  const cfg = STATUS_STYLES[value] ?? defaultStyle;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border select-none ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {value || "Pending"}
    </div>
  );
};

const ProductPill = ({ name, qty }: { name: string; qty: number }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full whitespace-nowrap">
    {name}<span className="text-zinc-400 font-semibold tabular-nums">×{qty}</span>
  </span>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`p-1 rounded-md transition-all ${copied ? "text-emerald-600 bg-emerald-50" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"}`}
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
};

// Map a PurchaseRecord to a display-friendly shape
const toGrnShape = (p: PurchaseRecord) => {
  const d = p.datas;
  const rawProds = (d?.grn_products ?? d?.purchase_products ?? []) as any[];
  const products = rawProds.map((r: any) => ({
    name: String(r.product_name ?? r.name ?? "Item"),
    quantity: Number(r.quantity ?? r.qty ?? 0),
  }));
  return {
    id: p.id,
    poReference: String(d?.po_reference ?? d?.reference ?? p.id.slice(0, 8)),
    supplier: String(d?.supplier ?? d?.supplier_name ?? "—"),
    date: String(d?.receipt_date ?? d?.purchase_date ?? p.date ?? "—"),
    status: String(d?.status ?? "Pending"),
    itemsCount: products.reduce((s: number, i: any) => s + i.quantity, 0),
    totalValue: Number(d?.total_value ?? d?.grand_total ?? d?.total_cost ?? 0),
    products,
  };
};

/* ================= GRID CARD ================= */
const GridCard = ({ row, onClick }: { row: ReturnType<typeof toGrnShape>; onClick: () => void }) => (
  <div onClick={onClick} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all">
    <div className="px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
          <FileText size={13} className="text-blue-600" />
        </div>
        <span className="text-sm font-semibold text-zinc-800 truncate">{row.poReference}</span>
        <CopyButton text={row.poReference} />
      </div>
      <StatusBadge value={row.status} />
    </div>
    <div className="px-4 py-3.5 grid grid-cols-2 gap-3 border-b border-zinc-100">
      <div className="flex items-start gap-2">
        <Building2 size={13} className="text-zinc-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Supplier</p>
          <p className="text-sm font-medium text-zinc-700 truncate">{row.supplier}</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Calendar size={13} className="text-zinc-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Date</p>
          <p className="text-sm font-medium text-zinc-700">{row.date}</p>
        </div>
      </div>
    </div>
    <div className="px-4 py-3.5 flex-1 bg-zinc-50/30">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Package size={13} className="text-zinc-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Products</span>
        </div>
        <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
          {row.products.length} types
        </span>
      </div>
      <div className="max-h-[90px] overflow-y-auto pr-1 space-y-2">
        {row.products.map((p, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 truncate pr-2">{p.name}</span>
            <span className="shrink-0 text-xs font-semibold text-zinc-500 tabular-nums bg-white border border-zinc-100 px-2 py-0.5 rounded-md shadow-sm">×{p.quantity}</span>
          </div>
        ))}
        {row.products.length === 0 && <p className="text-xs text-zinc-400">No items</p>}
      </div>
    </div>
    <div className="px-4 py-3.5 border-t border-zinc-100 flex items-center justify-between bg-white">
      <div className="flex gap-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Total Value</p>
          <p className="text-base font-semibold text-zinc-900 tabular-nums">₹{row.totalValue.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Total Qty</p>
          <p className="text-base font-semibold text-zinc-700 tabular-nums">{row.itemsCount}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
          <Eye size={15} />
        </button>
      </div>
    </div>
  </div>
);

/* ================= VERTICAL TABLE ================= */
const VerticalTable = ({ data, onClick }: { data: ReturnType<typeof toGrnShape>[]; onClick: (row: any) => void }) => (
  <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="bg-zinc-50/80 border-b border-zinc-200">
            {["PO Ref", "Supplier", "Date", "Products", "Status", "Total Qty", "Total Value", ""].map((h) => (
              <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.map((row) => (
            <tr key={row.id} onClick={() => onClick(row)} className="cursor-pointer hover:bg-zinc-50/60 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0"><FileText size={14} className="text-blue-600" /></div>
                  <span className="text-sm font-semibold text-zinc-800">{row.poReference}</span>
                  <CopyButton text={row.poReference} />
                </div>
              </td>
              <td className="px-5 py-4 text-sm font-medium text-zinc-700">{row.supplier}</td>
              <td className="px-5 py-4 text-sm text-zinc-600">{row.date}</td>
              <td className="px-5 py-4 max-w-[280px]">
                <div className="flex flex-wrap gap-1.5">
                  {row.products.slice(0, 2).map((p, i) => <ProductPill key={i} name={p.name} qty={p.quantity} />)}
                  {row.products.length > 2 && <span className="text-xs font-medium text-zinc-500 bg-zinc-100/80 px-2.5 py-1 rounded-full">+{row.products.length - 2} more</span>}
                </div>
              </td>
              <td className="px-5 py-4"><StatusBadge value={row.status} /></td>
              <td className="px-5 py-4 text-right text-sm font-semibold text-zinc-700 tabular-nums">{row.itemsCount}</td>
              <td className="px-5 py-4 text-right text-sm font-bold text-zinc-900 tabular-nums">₹{row.totalValue.toLocaleString()}</td>
              <td className="px-5 py-4 text-right">
                <button onClick={(e) => { e.stopPropagation(); onClick(row); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><ArrowRight size={15} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ================= MAIN COMPONENT ================= */
const GRNCardView = () => {
  const { getData, loading, error, clearError } = useApi();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedGRN, setSelectedGRN] = useState<ReturnType<typeof toGrnShape> | null>(null);
  const [refreshKey] = useState(0);

  useEffect(() => {
    getData(ENDPOINTS.PURCHASES, { type: "PO_CREATE", shop_id: SHOP_ID, limit: "50", offset: "1" }).then((res) => {
      if (res) setPurchases(Array.isArray(res.data) ? res.data : [res.data]);
    });
  }, [refreshKey]);

  const records = purchases.map(toGrnShape);

  const filtered = records.filter((r) =>
    r.poReference.toLowerCase().includes(search.toLowerCase()) ||
    r.supplier.toLowerCase().includes(search.toLowerCase()) ||
    r.products.some((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="space-y-5 pb-12">
        <GrnHeader />

        {error && (
          <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <span>{error}</span>
            <button onClick={clearError}><X size={14} /></button>
          </div>
        )}

        <div className="bg-white px-4 py-3.5 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Input leftIcon={<Search size={14} className="text-zinc-400" />} placeholder="Search PO, supplier, product…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all shadow-sm whitespace-nowrap">
            <SlidersHorizontal size={14} className="text-zinc-400" /> Filters
          </button>
          {search && <span className="self-center text-xs font-medium text-zinc-400 px-3 py-1 bg-zinc-100 rounded-full whitespace-nowrap">{filtered.length} {filtered.length === 1 ? "result" : "results"}</span>}
          <div className="flex-1" />
          <div className="inline-flex items-center bg-zinc-100 rounded-lg p-0.5 gap-0.5">
            {([["grid", LayoutGrid], ["vertical", List]] as const).map(([mode, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode as ViewMode)} className={`flex items-center justify-center w-8 h-8 rounded-md transition-all ${viewMode === mode ? "bg-white shadow-sm text-blue-600 border border-zinc-200" : "text-zinc-400 hover:text-zinc-600"}`}>
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12"><Loader /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white border border-dashed border-zinc-200 rounded-xl">
            <Search size={28} className="mx-auto mb-3 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-600">No GRN records found</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((row) => <GridCard key={row.id} row={row} onClick={() => setSelectedGRN(row)} />)}
          </div>
        ) : (
          <VerticalTable data={filtered} onClick={(row) => setSelectedGRN(row)} />
        )}
      </div>

      <FloatingFormCard isOpen={!!selectedGRN} onClose={() => setSelectedGRN(null)} title={selectedGRN ? `GRN Details: ${selectedGRN.poReference}` : "Details"} maxWidth="max-w-2xl">
        {selectedGRN && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              {[["Supplier", selectedGRN.supplier], ["Date", selectedGRN.date], ["Status", selectedGRN.status], ["Total Value", `₹${selectedGRN.totalValue.toLocaleString()}`]].map(([label, value]) => (
                <div key={label}><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p><p className="text-sm font-semibold text-zinc-800">{value}</p></div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-100 pb-2">
                <Package size={16} className="text-zinc-400" />
                <h3 className="heading-label text-zinc-800">Received Products</h3>
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full ml-auto">{selectedGRN.itemsCount} Total Units</span>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {selectedGRN.products.length === 0
                  ? <p className="text-sm text-zinc-400 text-center py-4">No items recorded</p>
                  : selectedGRN.products.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                      <span className="text-sm font-medium text-zinc-700">{p.name}</span>
                      <span className="text-sm font-bold text-zinc-600 bg-white px-3 py-1 rounded-md border border-zinc-200 shadow-sm">×{p.quantity}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button onClick={() => setSelectedGRN(null)} className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors">Close</button>
            </div>
          </div>
        )}
      </FloatingFormCard>
    </>
  );
};

export default GRNCardView;
