import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, Download, Eye,  
  X, RotateCcw, AlertTriangle, ArrowUp, ArrowDown, 
  User, FileText, ArrowRight, TrendingUp, TrendingDown, Activity, Plus 
} from "lucide-react";

import { GradientButton } from "@/components/ui/GradientButton";
import { StatCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { PurchaseRecord } from "@/types/api";

// ─── Types & Interfaces ──────────────────────────────────────────────────────

export type MovementType = "OPENING" | "PURCHASE" | "SALES" | "TRANSFER" | "STOCK_ADJUSTMENT" | "PO_PURCHASE" | "PRODUCTION" | "SALE_RETURN";
export type StatusType = "Completed" | "Pending";

export interface Movement {
  id: string;
  product: string;
  sku: string;
  type: MovementType;
  qty: number;
  source: string;
  destination: string;
  ref: string;
  date: string;
  status: StatusType;
  user: string;
  notes: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const WAREHOUSES = ["All Locations", "Warehouse A", "Warehouse B", "Store Front", "Cold Storage", "Returns Depot"];
const MOVEMENT_TYPES = ["All", "PURCHASE", "PO_PURCHASE", "SALES", "TRANSFER", "SALE_RETURN", "STOCK_ADJUSTMENT"];
const STATUSES = ["All", "Completed", "Pending"];

function purchaseToMovements(records: PurchaseRecord[], movType: MovementType): Movement[] {
  return records.map(p => {
    const products = (p.datas?.purchase_products ?? p.datas?.grn_products ?? p.datas?.finished_products) as any[] | undefined;
    const first = products?.[0];
    const dateStr = String(p.datas?.purchase_date ?? p.datas?.production_date ?? p.datas?.receipt_date ?? new Date().toISOString());
    return {
      id: p.id.slice(0, 8).toUpperCase(),
      product: String(first?.product_name ?? first?.name ?? "—"),
      sku: String(first?.barcode ?? p.id.slice(0, 8)),
      type: movType,
      qty: Number(first?.quantity ?? first?.qty ?? 1),
      source: "Supplier",
      destination: "Warehouse",
      ref: p.id.slice(0, 8).toUpperCase(),
      date: dateStr.includes("T") ? dateStr : dateStr + "T00:00:00",
      status: "Completed" as StatusType,
      user: "Admin",
      notes: "",
    };
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDate(dateStr: string) {
  return dateStr.slice(0, 10);
}

// Fixed styling helper to accommodate all MovementTypes
function getTypeStyle(type: MovementType) {
  const positive = ["PURCHASE", "PO_PURCHASE", "OPENING"];
  const negative = ["SALES", "PRODUCTION"];
  const salesReturn = "SALE_RETURN"
  
  if (positive.includes(type)) {
    return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
  }
  if (negative.includes(type)) {
    return { bg: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" };
  }
  if (type === salesReturn) {
    return { bg: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" };
  }
  if (type === "STOCK_ADJUSTMENT") {
    return { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
  }
  // Default for TRANSFER or anything else
  return { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" };
}

const STATUS_STYLES: Record<StatusType, string> = {
  Completed: "text-emerald-600",
  Pending:   "text-amber-600",
};

function TypeBadge({ type }: { type: MovementType }) {
  const s = getTypeStyle(type);
  const formattedType = type.replace('_', ' ');
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {formattedType}
    </span>
  );
}

interface DetailDrawerProps {
  movement: Movement;
  onClose: () => void;
}

function DetailDrawer({ movement, onClose }: DetailDrawerProps) {
  if (!movement) return null;
  const s = getTypeStyle(movement.type);
  
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white border-l border-slate-200 h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ animation: "slideIn .22s cubic-bezier(.4,0,.2,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Product */}
          <div className={`rounded-xl border ${s.bg} p-4`}>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">Product</p>
            <p className="text-slate-900 font-semibold">{movement.product}</p>
            <p className="text-slate-500 text-sm font-mono">{movement.sku}</p>
          </div>

          {/* Movement Info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Type",        <TypeBadge key="type" type={movement.type} />],
              ["Quantity",    <span key="qty" className={`font-semibold font-mono text-base ${movement.qty > 0 ? "text-emerald-600" : movement.qty < 0 ? "text-rose-600" : "text-blue-600"}`}>{movement.qty > 0 ? `+${movement.qty}` : movement.qty}</span>],
              ["Status",      <span key="status" className={`font-semibold text-sm ${STATUS_STYLES[movement.status]}`}>{movement.status}</span>],
              ["Reference",   <span key="ref" className="text-slate-700 font-mono text-sm">{movement.ref}</span>],
              ["Source",      <span key="src" className="text-slate-700 text-sm font-medium">{movement.source}</span>],
              ["Destination", <span key="dest" className="text-slate-700 text-sm font-medium">{movement.destination}</span>],
            ].map(([label, val]) => (
              <div key={label as string} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">{label as string}</p>
                {val as React.ReactNode}
              </div>
            ))}
          </div>

          {/* Date & User */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <span className="text-slate-400">🕐</span>
              <span className="font-medium">{fmt(movement.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <User className="w-4 h-4 text-slate-400" />
              <span>Performed by <strong className="text-slate-900">{movement.user}</strong></span>
            </div>
          </div>

          {/* Notes */}
          {movement.notes && (
            <div className="bg-blue-50/50 rounded-xl px-4 py-3 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-2"><FileText className="w-4 h-4" /> Notes</div>
              <p className="text-slate-700 text-sm leading-relaxed">{movement.notes}</p>
            </div>
          )}

          {/* Movement history stub */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4">Movement Timeline</p>
            <div className="relative pl-4">
              {[
                { label: "Record Created",   time: movement.date, color: "bg-slate-300" },
                { label: "In Review",        time: movement.date, color: "bg-amber-400" },
                { label: movement.status === "Completed" ? "Completed" : "Awaiting Approval", time: movement.date, color: movement.status === "Completed" ? "bg-emerald-500" : "bg-amber-400" },
              ].map((ev, i) => (
                <div key={i} className="flex items-start gap-3 mb-4 last:mb-0 relative">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${ev.color} ring-4 ring-white relative z-10`} style={{ marginLeft: "-5px" }} />
                  <div>
                    <p className="text-slate-900 text-sm font-medium">{ev.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{fmt(ev.time)}</p>
                  </div>
                </div>
              ))}
              <div className="absolute left-[3px] top-2 bottom-4 w-px bg-slate-200 z-0" />
            </div>
          </div>
        </div>

        {/* Footer actions */}
       
      </div>
    </div>
  );
}

function AddMovementModal({ onClose }: { onClose: () => void }) {
  // Use real types for the form dropdown
  const formTypes = ["PURCHASE", "PO_PURCHASE", "SALES", "TRANSFER", "STOCK_ADJUSTMENT", "SALE_RETURN"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Add Stock Movement</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {[
            ["Product Name / SKU","text","e.g. Wireless Headphones"],
            ["Movement Type","select", formTypes],
            ["Quantity","number","e.g. 50"],
            ["Source Location","select",WAREHOUSES.slice(1)],
            ["Destination","select",WAREHOUSES.slice(1)],
            ["Reference","text","Order ID / Invoice ID"],
            ["Notes","textarea","Optional remarks"]
          ].map(([label, type, placeholder]) => (
            <div key={label as string}>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1.5">{label as string}</label>
              {type === "select" ? (
                <select className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all">
                  {(placeholder as string[]).map(o => <option value={o} key={o}>{o.replace('_', ' ')}</option>)}
                </select>
              ) : type === "textarea" ? (
                <textarea rows={2} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none shadow-sm transition-all" placeholder={placeholder as string} />
              ) : (
                <input type={type as string} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all" placeholder={placeholder as string} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors shadow-sm">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-md shadow-blue-500/20">Save Movement</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StockMovementPage() {
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatus]   = useState("All");
  const [warehouseFilter, setWH]    = useState("All Locations");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [selectedMvt, setSelected]  = useState<Movement | null>(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [sortField, setSort]        = useState<"date" | "qty">("date");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [page, setPage]             = useState(1);
  const [movements, setMovements]   = useState<Movement[]>([]);
  const PAGE_SIZE = 8;

  const { getData } = useApi();

  useEffect(() => {
    const load = async () => {
      const fetchType = async (type: string, movType: MovementType) => {
        const res = await getData(ENDPOINTS.PURCHASES, { type, shop_id: SHOP_ID, limit: "50", offset: "1" });
        if (!res) return [];
        const records: PurchaseRecord[] = Array.isArray(res.data) ? res.data : [res.data];
        return purchaseToMovements(records, movType);
      };

      const [direct, grn, production] = await Promise.all([
        fetchType("DIRECT", "PURCHASE"),
        fetchType("PO_CREATE", "PO_PURCHASE"),
        fetchType("PRODUCTION", "PRODUCTION"),
      ]);

      const adjRes = await getData(ENDPOINTS.S_ADJUSTMENTS, { shop_id: SHOP_ID, limit: "50", offset: "1" });
      const adjMovements: Movement[] = adjRes
        ? (Array.isArray(adjRes.data) ? adjRes.data : [adjRes.data]).map((a: any) => {
            const products = (a.datas?.products ?? a.datas?.adjustment_products) as any[] | undefined;
            const first = products?.[0];
            const dateStr = String(a.datas?.adjustment_date ?? new Date().toISOString());
            return {
              id: a.id.slice(0, 8).toUpperCase(),
              product: String(first?.product_name ?? first?.name ?? "—"),
              sku: String(first?.barcode ?? a.id.slice(0, 8)),
              type: "STOCK_ADJUSTMENT" as MovementType,
              qty: Number(first?.quantity ?? 0),
              source: "Stock",
              destination: "Adjusted",
              ref: a.id.slice(0, 8).toUpperCase(),
              date: dateStr.includes("T") ? dateStr : dateStr + "T00:00:00",
              status: "Completed" as StatusType,
              user: "Admin",
              notes: "",
            };
          })
        : [];

      setMovements([...direct, ...grn, ...production, ...adjMovements]);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let data = [...movements];
    
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(m => m.product.toLowerCase().includes(q) || m.sku.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
    }
    if (typeFilter !== "All") data = data.filter(m => m.type === typeFilter);
    if (statusFilter !== "All") data = data.filter(m => m.status === statusFilter);
    if (warehouseFilter !== "All Locations") data = data.filter(m => m.source === warehouseFilter || m.destination === warehouseFilter);
    if (dateFrom) data = data.filter(m => fmtDate(m.date) >= dateFrom);
    if (dateTo)   data = data.filter(m => fmtDate(m.date) <= dateTo);
    
    data.sort((a, b) => {
      if (sortField === "date") {
        return sortDir === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      } else {
        const aQty = Math.abs(a.qty);
        const bQty = Math.abs(b.qty);
        return sortDir === "asc" ? aQty - bQty : bQty - aQty;
      }
    });
    
    return data;
  }, [search, typeFilter, statusFilter, warehouseFilter, dateFrom, dateTo, sortField, sortDir]);

  const today = new Date().toISOString().slice(0, 10);
  const todayMvts = movements.filter(m => fmtDate(m.date) === today);
  const totalIn  = todayMvts.filter(m => ["PURCHASE", "PO_PURCHASE"].includes(m.type)).reduce((s, m) => s + m.qty, 0);
  const totalOut = todayMvts.filter(m => m.type === "SALES").reduce((s, m) => s + Math.abs(m.qty), 0);
  const netMov   = totalIn - totalOut;
  const lowStockAlerts = 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(field: "date" | "qty") {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(field); setSortDir("desc"); }
  }

  function resetFilters() {
    setSearch(""); setTypeFilter("All"); setStatus("All"); setWH("All Locations"); setDateFrom(""); setDateTo(""); setPage(1);
  }

  function exportCSV() {
    const header = "Movement ID,Product,SKU,Type,Qty,Source,Destination,Reference,Date,Status\n";
    const rows = filtered.map(m => `${m.id},${m.product},${m.sku},${m.type},${m.qty},${m.source},${m.destination},${m.ref},${m.date},${m.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); 
    a.href = URL.createObjectURL(blob); 
    a.download = "stock_movements.csv"; 
    a.click();
  }

  const SortBtn = ({ field, label }: { field: "date" | "qty", label: string }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors font-semibold group">
      {label}
      <span className={`transition-opacity ${sortField === field ? "opacity-100 text-blue-600" : "opacity-0 group-hover:opacity-40"}`}>
        {sortDir === "asc" && sortField === field ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen text-slate-900" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        .font-mono { font-family: 'DM Mono', monospace !important; }
        @keyframes slideIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }
        ::-webkit-scrollbar { width:6px; height:6px; } 
        ::-webkit-scrollbar-track { background:#f4f7fb } 
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px }
        ::-webkit-scrollbar-thumb:hover { background:#94a3b8; }
      `}</style>

      {/* Added a container class here to provide padding and max-width */}
      <div className=" mx-auto">
  
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-8">

          
          <div className="flex gap-2.5 flex-wrap">
            <GradientButton
              variant="outline"
              onClick={exportCSV}
              icon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </GradientButton>

            {/* Added the missing trigger button for your Add Movement Modal */}
            {/* <GradientButton
              onClick={() => setShowAdd(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              New Movement
            </GradientButton> */}
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard  label="Total Stock In"  value={`+${totalIn}`}     icon={TrendingUp} iconBg="bg-green-50" iconColor="text-green-600" />
          <StatCard  label="Total Stock Out" value={`-${totalOut}`}   icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-600" />
          <StatCard  label="Net Movement"    value={netMov >= 0 ? `+${netMov}` : `${netMov}`}  icon={Activity} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard  label="Low Stock Alerts" value={lowStockAlerts} icon={AlertTriangle} iconBg="bg-amber-50" iconColor="text-amber-600" />
        </div>

        {/* ── Filters ── */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by product, SKU, or movement ID…"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <button onClick={resetFilters} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-sm transition-colors whitespace-nowrap">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Type */}
            <div className="flex gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200">
              {MOVEMENT_TYPES.map(t => (
                <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === t ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 border border-transparent"}`}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
            {/* Warehouse */}
            <select value={warehouseFilter} onChange={e => { setWH(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
              {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
            </select>
            {/* Status */}
            <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            {/* Date range */}
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  {[
                    ["Product", null],
                    ["Type", null],
                    ["Quantity", "qty"],
                    ["Source → Destination", null],
                    ["Reference", null],
                    ["Date & Time", "date"],
                    ["Actions", null],
                  ].map(([col, field]) => (
                    <th key={col as string} className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      {field ? <SortBtn field={field as "date" | "qty"} label={col as string} /> : col as string}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📦</span>
                      <span className="text-sm font-medium text-slate-700">No movements found</span>
                      <span className="text-xs">Try adjusting your search or filters</span>
                    </div>
                  </td></tr>
                ) : pageData.map((m, i) => (
                  <tr key={m.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-blue-50/40 cursor-default ${m.qty < 0 && Math.abs(m.qty) > 50 ? "bg-rose-50/40" : ""}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-slate-900 font-semibold leading-tight">{m.product}</div>
                      <div className="text-slate-500 text-xs font-mono mt-0.5">{m.sku}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><TypeBadge type={m.type} /></td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-base whitespace-nowrap">
                      {/* Fixed classname evaluation to rely on actual m.qty rather than just checking if type === "IN" */}
                      <span className={m.qty > 0 ? "text-emerald-600" : m.qty < 0 ? "text-rose-600" : "text-blue-600"}>
                        {m.qty > 0 ? `+${m.qty}` : m.qty}
                      </span>
                    </td>
                    {m.type === "TRANSFER" ?<td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span className="text-slate-700">{m.source}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700">{m.destination}</span>
                      </div>
                    </td> : <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span className="text-slate-700">-</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700">-</span>
                      </div>
                    </td>}
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 font-medium whitespace-nowrap">{m.ref}</td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs font-medium whitespace-nowrap">{fmt(m.date)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(m)} className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50/50">
            <span className="text-xs font-medium text-slate-500">
              Showing <strong className="text-slate-900">{filtered.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong className="text-slate-900">{filtered.length}</strong> records
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm">← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all shadow-sm ${p === page ? "bg-blue-600 text-white border border-blue-600 shadow-blue-500/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm">Next →</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 font-medium mt-6">
          Inventory Management System · Stock Movement Module · Role: <span className="text-slate-800 font-semibold">Admin</span>
        </p>
      </div>

      {/* Overlays */}
      {selectedMvt && <DetailDrawer movement={selectedMvt} onClose={() => setSelected(null)} />}
      {showAdd && <AddMovementModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}