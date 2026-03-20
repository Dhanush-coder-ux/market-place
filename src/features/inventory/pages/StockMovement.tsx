import React, { useState, useMemo } from "react";
import { 
  Search, Download, Eye, Pencil, Trash2, 
  X, RotateCcw, AlertTriangle, ArrowUp, ArrowDown, 
  User, FileText, ArrowRight, TrendingUp, TrendingDown, Activity 
} from "lucide-react";
import Title from "@/components/common/Title";
import { GradientButton } from "@/components/ui/GradientButton";

// ─── Types & Interfaces ──────────────────────────────────────────────────────

export type MovementType = "IN" | "OUT" | "TRANSFER";
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
const MOVEMENT_TYPES = ["All", "IN", "OUT", "TRANSFER"];
const STATUSES = ["All", "Completed", "Pending"];

const mockMovements: Movement[] = [
  { id: "MVT-0081", product: "Wireless Headphones Pro", sku: "WHP-2024-BLK", type: "IN", qty: 150, source: "Supplier", destination: "Warehouse A", ref: "PO-4421", date: "2025-03-20T09:14:00", status: "Completed", user: "Aisha Menon", notes: "Bulk order Q1 restock." },
  { id: "MVT-0082", product: "USB-C Hub 7-Port", sku: "UCH-7P-SLV", type: "OUT", qty: -32, source: "Warehouse A", destination: "Store Front", ref: "INV-8813", date: "2025-03-20T10:30:00", status: "Completed", user: "Ravi Sharma", notes: "Store replenishment." },
  { id: "MVT-0083", product: "Mechanical Keyboard TKL", sku: "MKB-TKL-WHT", type: "TRANSFER", qty: 25, source: "Warehouse B", destination: "Warehouse A", ref: "TRF-209", date: "2025-03-20T11:00:00", status: "Pending", user: "Priya Nair", notes: "Balancing stock levels." },
  { id: "MVT-0084", product: "4K Webcam Ultra", sku: "WCM-4K-BLK", type: "OUT", qty: -5, source: "Warehouse A", destination: "Damages", ref: "DAM-0041", date: "2025-03-20T11:45:00", status: "Completed", user: "Aisha Menon", notes: "Damaged during handling." },
  { id: "MVT-0085", product: "Noise Cancelling Earbuds", sku: "NCE-X3-WHT", type: "IN", qty: 200, source: "Supplier", destination: "Warehouse B", ref: "PO-4422", date: "2025-03-20T12:20:00", status: "Completed", user: "Ravi Sharma", notes: "New product launch stock." },
  { id: "MVT-0086", product: "Ergonomic Mouse M500", sku: "MSE-ERG-GRY", type: "OUT", qty: -80, source: "Warehouse A", destination: "Store Front", ref: "INV-8814", date: "2025-03-20T13:05:00", status: "Pending", user: "Karan Patel", notes: "" },
  { id: "MVT-0087", product: "Laptop Stand Foldable", sku: "LST-FLD-ALU", type: "IN", qty: 60, source: "Returns Depot", destination: "Warehouse A", ref: "RET-0318", date: "2025-03-20T13:55:00", status: "Completed", user: "Priya Nair", notes: "Customer returns processed." },
  { id: "MVT-0088", product: "Wireless Charger Pad 15W", sku: "WCP-15W-BLK", type: "TRANSFER", qty: 40, source: "Cold Storage", destination: "Warehouse B", ref: "TRF-210", date: "2025-03-20T14:30:00", status: "Completed", user: "Aisha Menon", notes: "" },
  { id: "MVT-0089", product: "Smart LED Desk Lamp", sku: "DLP-SMT-WHT", type: "OUT", qty: -15, source: "Warehouse B", destination: "Store Front", ref: "INV-8815", date: "2025-03-20T15:10:00", status: "Completed", user: "Karan Patel", notes: "" },
  { id: "MVT-0090", product: "Portable SSD 1TB", sku: "SSD-1TB-SLV", type: "IN", qty: 75, source: "Supplier", destination: "Warehouse A", ref: "PO-4423", date: "2025-03-19T08:00:00", status: "Completed", user: "Ravi Sharma", notes: "" },
  { id: "MVT-0091", product: "Gaming Controller BT", sku: "GCT-BT-BLK", type: "OUT", qty: -22, source: "Warehouse A", destination: "Store Front", ref: "INV-8816", date: "2025-03-19T09:15:00", status: "Completed", user: "Aisha Menon", notes: "" },
  { id: "MVT-0092", product: "Mechanical Keyboard TKL", sku: "MKB-TKL-WHT", type: "IN", qty: 50, source: "Supplier", destination: "Warehouse B", ref: "PO-4424", date: "2025-03-18T10:00:00", status: "Pending", user: "Priya Nair", notes: "Awaiting quality check." },
];

const lowStockAlerts = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDate(dateStr: string) {
  return dateStr.slice(0, 10);
}

const TYPE_STYLES: Record<MovementType, { bg: string; dot: string }> = {
  IN:       { bg: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  OUT:      { bg: "bg-rose-50 text-rose-700 border border-rose-200",          dot: "bg-rose-500" },
  TRANSFER: { bg: "bg-blue-50 text-blue-700 border border-blue-200",          dot: "bg-blue-500" },
};

const STATUS_STYLES: Record<StatusType, string> = {
  Completed: "text-emerald-600",
  Pending:   "text-amber-600",
};

// ─── Components ───────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string | number;
  sub: string;
  color: "green" | "red" | "blue" | "amber";
  icon: React.ReactNode;
}

function SummaryCard({ label, value, sub, color, icon }: SummaryCardProps) {
  const colors = {
    green: { border: "border-emerald-100", glow: "shadow-emerald-900/5", icon: "text-emerald-600 bg-emerald-100", val: "text-emerald-700" },
    red:   { border: "border-rose-100",    glow: "shadow-rose-900/5",    icon: "text-rose-600 bg-rose-100",       val: "text-rose-700" },
    blue:  { border: "border-blue-100",    glow: "shadow-blue-900/5",    icon: "text-blue-600 bg-blue-100",       val: "text-blue-700" },
    amber: { border: "border-amber-100",   glow: "shadow-amber-900/5",   icon: "text-amber-600 bg-amber-100",     val: "text-amber-700" },
  }[color];
  
  return (
    <div className={`rounded-2xl border ${colors.border} bg-white shadow-sm ${colors.glow} p-5 flex items-center gap-4 transition-shadow hover:shadow-md`}>
      <div className={`p-3 rounded-xl ${colors.icon}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-2xl font-bold font-mono ${colors.val}`}>{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: MovementType }) {
  const s = TYPE_STYLES[type];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {type}
    </span>
  );
}

interface DetailDrawerProps {
  movement: Movement;
  onClose: () => void;
}

function DetailDrawer({ movement, onClose }: DetailDrawerProps) {
  if (!movement) return null;
  const s = TYPE_STYLES[movement.type];
  
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
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">Movement Details</p>
            <h2 className="text-lg font-bold text-slate-900 font-mono">{movement.id}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Product */}
          <div className={`rounded-xl border ${s.bg} p-4`}>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">Product</p>
            <p className="text-slate-900 font-bold">{movement.product}</p>
            <p className="text-slate-500 text-sm font-mono">{movement.sku}</p>
          </div>

          {/* Movement Info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Type",        <TypeBadge key="type" type={movement.type} />],
              ["Quantity",    <span key="qty" className={`font-bold font-mono text-base ${movement.qty > 0 ? "text-emerald-600" : movement.type === "TRANSFER" ? "text-blue-600" : "text-rose-600"}`}>{movement.qty > 0 ? `+${movement.qty}` : movement.qty}</span>],
              ["Status",      <span key="status" className={`font-semibold text-sm ${STATUS_STYLES[movement.status]}`}>{movement.status}</span>],
              ["Reference",   <span key="ref" className="text-slate-700 font-mono text-sm">{movement.ref}</span>],
              ["Source",      <span key="src" className="text-slate-700 text-sm font-medium">{movement.source}</span>],
              ["Destination", <span key="dest" className="text-slate-700 text-sm font-medium">{movement.destination}</span>],
            ].map(([label, val]) => (
              <div key={label as string} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">{label as string}</p>
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
                    <p className="text-slate-900 text-sm font-semibold">{ev.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{fmt(ev.time)}</p>
                  </div>
                </div>
              ))}
              <div className="absolute left-[3px] top-2 bottom-4 w-px bg-slate-200 z-0" />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50">
          <button className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-semibold transition-colors border border-rose-200 flex items-center justify-center gap-2 shadow-sm">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMovementModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Add Stock Movement</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {[
            ["Product Name / SKU","text","e.g. Wireless Headphones"],
            ["Movement Type","select",["IN","OUT","TRANSFER"]],
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
                  {(placeholder as string[]).map(o => <option key={o}>{o}</option>)}
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
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors shadow-sm">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-md shadow-blue-500/20">Save Movement</button>
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
  const PAGE_SIZE = 8;

  const filtered = useMemo(() => {
    let data = [...mockMovements];
    
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
  const todayMvts = mockMovements.filter(m => fmtDate(m.date) === today);
  const totalIn  = todayMvts.filter(m => m.type === "IN").reduce((s, m) => s + m.qty, 0);
  const totalOut = todayMvts.filter(m => m.type === "OUT").reduce((s, m) => s + Math.abs(m.qty), 0);
  const netMov   = totalIn - totalOut;

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
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        .font-mono { font-family: 'DM Mono', monospace !important; }
        @keyframes slideIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }
        ::-webkit-scrollbar { width:6px; height:6px; } 
        ::-webkit-scrollbar-track { background:#f4f7fb } 
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px }
        ::-webkit-scrollbar-thumb:hover { background:#94a3b8; }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

  
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
         <Title
         title="Stock Movement"
         subtitle="Track all inventory movements across locations"
         />
          <div className="flex gap-2.5 flex-wrap">
        
            <GradientButton
            variant="outline"
            onClick={exportCSV}
            icon={<Download  className="w-4 h-4" />}
             >
           Export CSV
            </GradientButton>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <SummaryCard label="Total Stock In"  value={`+${totalIn}`}  sub="Units added today"    color="green" icon={<TrendingUp className="w-5 h-5" />} />
          <SummaryCard label="Total Stock Out" value={`-${totalOut}`} sub="Units removed today"  color="red"   icon={<TrendingDown className="w-5 h-5" />} />
          <SummaryCard label="Net Movement"    value={netMov >= 0 ? `+${netMov}` : `${netMov}`} sub="Net change today" color={netMov >= 0 ? "blue" : "red"} icon={<Activity className="w-5 h-5" />} />
          <SummaryCard label="Low Stock Alerts" value={lowStockAlerts} sub="Items need attention" color="amber" icon={<AlertTriangle className="w-5 h-5" />} />
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === t ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 border border-transparent"}`}>{t}</button>
              ))}
            </div>
            {/* Warehouse */}
            <select value={warehouseFilter} onChange={e => { setWH(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
              {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
            </select>
            {/* Status */}
            <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            {/* Date range */}
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  {[
                    ["Movement ID", null],
                    ["Product", null],
                    ["Type", null],
                    ["Quantity", "qty"],
                    ["Source → Destination", null],
                    ["Reference", null],
                    ["Date & Time", "date"],
                    ["Status", null],
                    ["Actions", null],
                  ].map(([col, field]) => (
                    <th key={col as string} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
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
                      <span className="text-sm font-bold text-slate-700">No movements found</span>
                      <span className="text-xs">Try adjusting your search or filters</span>
                    </div>
                  </td></tr>
                ) : pageData.map((m, i) => (
                  <tr key={m.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-blue-50/40 cursor-default ${m.type === "OUT" && Math.abs(m.qty) > 50 ? "bg-rose-50/40" : ""}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-4 py-3.5 font-mono text-blue-600 text-xs font-bold whitespace-nowrap">{m.id}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-slate-900 font-bold leading-tight">{m.product}</div>
                      <div className="text-slate-500 text-xs font-mono mt-0.5">{m.sku}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><TypeBadge type={m.type} /></td>
                    <td className="px-4 py-3.5 font-mono font-bold text-base whitespace-nowrap">
                      <span className={m.type === "IN" ? "text-emerald-600" : m.type === "TRANSFER" ? "text-blue-600" : "text-rose-600"}>
                        {m.qty > 0 ? `+${m.qty}` : m.qty}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span className="text-slate-700">{m.source}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700">{m.destination}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 font-medium whitespace-nowrap">{m.ref}</td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs font-medium whitespace-nowrap">{fmt(m.date)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${m.status === "Completed" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <span className={`text-xs font-bold ${STATUS_STYLES[m.status]}`}>{m.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(m)} className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${p === page ? "bg-blue-600 text-white border border-blue-600 shadow-blue-500/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm">Next →</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 font-medium mt-6">
          Inventory Management System · Stock Movement Module · Role: <span className="text-slate-800 font-bold">Admin</span>
        </p>
      </div>

      {/* Overlays */}
      {selectedMvt && <DetailDrawer movement={selectedMvt} onClose={() => setSelected(null)} />}
      {showAdd && <AddMovementModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}