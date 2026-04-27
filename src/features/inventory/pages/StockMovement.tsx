import React, { useState, useMemo, useEffect } from "react";
import {
  Search, Eye,
  X, RotateCcw, AlertTriangle, ArrowUp, ArrowDown,
  User, TrendingUp, TrendingDown, Activity,
  Bookmark, Plus,
  FileText
} from "lucide-react";

import { GradientButton } from "@/components/ui/GradientButton";
import { StatCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { PurchaseRecord } from "@/types/api";
import { useHeader } from "@/context/HeaderContext";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { useNavigate } from "react-router-dom";
import { ReusableSelect } from "@/components/ui/ReusableSelect";

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

function purchaseToMovements(records: PurchaseRecord[], movType: MovementType): Movement[] {
  return records.flatMap(p => {
    const d2 = p.datas as any;
    const products = (d2?.purchase_products ?? d2?.grn_products ?? d2?.finished_products ?? d2?.products) as any[] | undefined;
    if (!products || products.length === 0) return [];

    return products.map(prod => {
      const dateStr = String(d2?.purchaseDetails?.date ?? d2?.purchase_date ?? d2?.production_date ?? d2?.receipt_date ?? (p as any).date ?? new Date().toISOString());
      return {
        id: p.id.slice(0, 8).toUpperCase(),
        product: String(prod?.product_name ?? prod?.name ?? "—"),
        sku: String(prod?.barcode ?? p.id.slice(0, 8)),
        type: movType,
        qty: Number(prod?.quantity ?? prod?.qty ?? 1),
        source: "Supplier",
        destination: "Warehouse",
        ref: String(d2?.purchaseDetails?.referenceNo ?? d2?.purchaseDetails?.invoiceNo ?? p.id.slice(0, 8).toUpperCase()),
        date: dateStr.includes("T") ? dateStr : dateStr + "T00:00:00",
        status: "Completed" as StatusType,
        user: String((p as any).added_by || "Admin"),
        notes: d2?.purchaseDetails?.invoiceNo ? `Invoice: ${d2.purchaseDetails.invoiceNo}` : "",
      };
    });
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
  Pending: "text-amber-600",
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
              ["Type", <TypeBadge key="type" type={movement.type} />],
              ["Quantity", <span key="qty" className={`font-semibold font-mono text-base ${movement.qty > 0 ? "text-emerald-600" : movement.qty < 0 ? "text-rose-600" : "text-blue-600"}`}>{movement.qty > 0 ? `+${movement.qty}` : movement.qty}</span>],
              ["Status", <span key="status" className={`font-semibold text-sm ${STATUS_STYLES[movement.status]}`}>{movement.status}</span>],
              ["Reference", <span key="ref" className="text-slate-700 font-mono text-sm">{movement.ref}</span>],
              ["Source", <span key="src" className="text-slate-700 text-sm font-medium">{movement.source}</span>],
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
                { label: "Record Created", time: movement.date, color: "bg-slate-300" },
                { label: "In Review", time: movement.date, color: "bg-amber-400" },
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
            ["Product Name / SKU", "text", "e.g. Wireless Headphones"],
            ["Movement Type", "select", formTypes],
            ["Quantity", "number", "e.g. 50"],
            ["Source Location", "select", WAREHOUSES.slice(1)],
            ["Destination", "select", WAREHOUSES.slice(1)],
            ["Reference", "text", "Order ID / Invoice ID"],
            ["Notes", "textarea", "Optional remarks"]
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
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatus] = useState("All");
  const [warehouseFilter, setWH] = useState("All Locations");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedMvt, setSelected] = useState<Movement | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sortField, setSort] = useState<"date" | "qty">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [movements, setMovements] = useState<Movement[]>([]);
  const PAGE_SIZE = 10;

  // Dynamic Column State
  const [availableKeys] = useState<string[]>(["sku", "source", "destination", "ref", "user", "notes"]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('stock_movement_columns');
    return saved ? JSON.parse(saved) : ["sku", "ref", "user"];
  });

  const { getData } = useApi();

  // --- Header Actions ---
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
        <button
          onClick={() => navigate("/stock-adjustment/drafts")}
          className="px-5 h-11 rounded-xl border border-blue-100 text-blue-600 font-semibold text-[14px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={18} />
          Saved Drafts
        </button>
        <GradientButton
          onClick={() => navigate("/stock-adjustment")}
          icon={<Plus size={18} />}
          className="h-11 flex items-center px-6 text-[14px] shadow-lg shadow-blue-200"
        >
          Add Adjustment
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const load = async () => {
      const fetchType = async (type: string, movType: MovementType) => {
        const res = await getData(ENDPOINTS.PURCHASES, { view: type, shop_id: SHOP_ID, limit: "50", offset: "1" });
        if (!res) return [];
        const records: PurchaseRecord[] = Array.isArray(res.data) ? res.data : [res.data];
        return purchaseToMovements(records, movType);
      };

      const [direct, grn, production] = await Promise.all([
        fetchType("PURCHASE_VIEW", "PURCHASE"),
        fetchType("PO_VIEW", "PO_PURCHASE"),
        fetchType("STOCKADJUSTMENT_VIEW", "PRODUCTION"),
      ]);

      const adjRes = await getData(ENDPOINTS.S_ADJUSTMENTS, { view: "STOCKADJUSTMENT_VIEW", shop_id: SHOP_ID, limit: "50", offset: "1" });
      const adjMovements: Movement[] = adjRes
        ? (Array.isArray(adjRes.data) ? adjRes.data : [adjRes.data]).flatMap((a: any) => {
          const products = (a.datas?.products ?? a.datas?.adjustment_products) as any[] | undefined;
          if (!products || products.length === 0) return [];

          return products.map(prod => {
            const dateStr = String(a.datas?.date ?? a.date ?? new Date().toISOString());
            const isDecrement = prod.type === 'DECREMENT' || prod.type === 'decrease';
            const qty = Number(prod?.quantity ?? 0);
            return {
              id: a.id.slice(0, 8).toUpperCase(),
              product: String(prod?.product_name ?? prod?.name ?? "—"),
              sku: String(prod?.barcode ?? a.id.slice(0, 8)),
              type: "STOCK_ADJUSTMENT" as MovementType,
              qty: isDecrement ? -qty : qty,
              source: "Stock",
              destination: "Adjusted",
              ref: String(a.datas?.referenceNumber ?? a.id.slice(0, 8).toUpperCase()),
              date: dateStr.includes("T") ? dateStr : dateStr + "T00:00:00",
              status: "Completed" as StatusType,
              user: String(a.added_by || "Admin"),
              notes: prod.reason ? `Reason: ${prod.reason}` : "",
            };
          });
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
    if (dateTo) data = data.filter(m => fmtDate(m.date) <= dateTo);

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
  }, [movements, search, typeFilter, statusFilter, warehouseFilter, dateFrom, dateTo, sortField, sortDir]);

  const today = new Date().toISOString().slice(0, 10);
  const todayMvts = movements.filter(m => fmtDate(m.date) === today);
  const totalIn = todayMvts.filter(m => ["PURCHASE", "PO_PURCHASE"].includes(m.type)).reduce((s, m) => s + m.qty, 0);
  const totalOut = todayMvts.filter(m => m.type === "SALES").reduce((s, m) => s + Math.abs(m.qty), 0);
  const netMov = totalIn - totalOut;
  const lowStockAlerts = 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(field: "date" | "qty") {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(field); setSortDir("desc"); }
  }

  function resetFilters() {
    setSearch(""); setTypeFilter("All"); setStatus("All"); setWH("All Locations"); setDateFrom(""); setDateTo(""); setPage(1);
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

      <div className="mx-auto">

        {/* ── Summary Cards ── */}
        <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-3 pb-2 -mx-2 px-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 touch-pan-x mb-6">
          <StatCard label="Total Stock In" value={`+${totalIn}`} icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" className="flex-1" />
          <StatCard label="Total Stock Out" value={`-${totalOut}`} icon={TrendingDown} iconBg="bg-rose-50" iconColor="text-rose-600" className="flex-1" />
          <StatCard label="Net Movement" value={netMov >= 0 ? `+${netMov}` : `${netMov}`} icon={Activity} iconBg="bg-blue-50" iconColor="text-blue-600" className="flex-1" />
          <StatCard label="Low Stock Alerts" value={lowStockAlerts} icon={AlertTriangle} iconBg="bg-amber-50" iconColor="text-amber-600" className="flex-1" />
        </div>

        {/* ── Filter & Search Section ── */}
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">

            {/* Left Side: Search & Primary Tools */}
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by product, SKU, or movement ID…"
                  className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
              <ColumnPicker
                availableKeys={availableKeys}
                selectedKeys={selectedKeys}
                onApply={setSelectedKeys}
                storageKey="stock_movement_columns"
              />
              <button
                onClick={resetFilters}
                className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>

            {/* Right Side: Specific Filters */}
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <div className="w-full sm:w-auto">
                <ReusableSelect
                  options={MOVEMENT_TYPES.map(t => ({ label: t.replace('_', ' '), value: t }))}
                  value={typeFilter}
                  onValueChange={(val) => { setTypeFilter(val); setPage(1); }}
                  placeholder="Type"
                  className="w-full sm:w-36 h-11"
                />
              </div>
              <div className="w-full sm:w-auto">
                <ReusableSelect
                  options={WAREHOUSES.map(w => ({ label: w, value: w }))}
                  value={warehouseFilter}
                  onValueChange={(val) => { setWH(val); setPage(1); }}
                  placeholder="Location"
                  className="w-full sm:w-44 h-11"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 h-11 w-full sm:w-auto">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                  className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 px-2 uppercase tracking-wider w-full"
                />
                <div className="w-px h-4 bg-slate-200 shrink-0" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setPage(1); }}
                  className="bg-transparent border-none text-[10px] font-black text-slate-600 focus:ring-0 px-2 uppercase tracking-wider w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Table Section ── */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-100">
                  <th className="px-6 py-5 whitespace-nowrap min-w-[200px]">Product Information</th>
                  <th className="px-6 py-5 whitespace-nowrap">Movement Type</th>
                  <th className="px-6 py-5 whitespace-nowrap text-center">
                    <SortBtn field="qty" label="Quantity" />
                  </th>
                  {selectedKeys.map(key => (
                    <th key={key} className="px-6 py-5 capitalize whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
                  ))}
                  <th className="px-6 py-5 whitespace-nowrap">
                    <SortBtn field="date" label="Date & Time" />
                  </th>
                  <th className="px-6 py-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={selectedKeys.length + 5} className="py-20 text-center text-slate-400 font-medium italic">
                      No movements found matching your filters.
                    </td>
                  </tr>
                ) : pageData.map((m) => (
                  <tr key={m.id}
                    className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                    onClick={() => setSelected(m)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-100 ${m.qty > 0 ? "from-emerald-600 to-emerald-400" : "from-rose-600 to-rose-400"}`}>
                          {m.product[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 tracking-tight">{m.product}</p>
                          <p className="text-[11px] font-semibold text-slate-400 font-mono italic">#{m.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><TypeBadge type={m.type} /></td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`text-base font-bold tabular-nums ${m.qty > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {m.qty > 0 ? `+${m.qty}` : m.qty}
                      </span>
                    </td>
                    {selectedKeys.map(key => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap">
                        <p className="text-[12px] font-bold text-slate-600 tracking-tight">
                          {String(m[key as keyof Movement] ?? "—")}
                        </p>
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-[12px] font-bold text-slate-600">{fmt(m.date)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelected(m)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95">
                        <Eye size={16} />
                      </button>
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
      </div>

      {/* Overlays */}
      {selectedMvt && <DetailDrawer movement={selectedMvt} onClose={() => setSelected(null)} />}
      {showAdd && <AddMovementModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}