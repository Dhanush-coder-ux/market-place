import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, Eye, X,
  RotateCcw, Receipt,
  ChevronRight, Filter,
  DollarSign, RefreshCw, TrendingUp, Loader2,
  ExternalLink,
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { useHeader } from "@/context/HeaderContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { OrderResponse } from "@/features/order/types";
import { ReturnModal } from "../components/ReturnOrderFlow";
import { StatCard } from "@/components/common/StatsCard";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { ReusableSelect } from "@/components/ui/ReusableSelect";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type OriginType = "Sales" | "Sales Return";
type SaleStatus = "Completed" | "Pending" | "Cancelled";
type SaleRecord = OrderResponse;

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ═══════════════════════════════════════════════════════════════
   BADGE CONFIGS
═══════════════════════════════════════════════════════════════ */
type BadgeConfig = { cls: string; dot: string };
const ORIGIN_CFG: Record<OriginType, BadgeConfig> = {
  "Sales": { cls: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-400" },
  "Sales Return": { cls: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-400" },
};
const PAYMENT_CFG: Record<string, BadgeConfig> = {
  Cash: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-400" },
  Card: { cls: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-400" },
  UPI: { cls: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-400" },
  "G-Pay": { cls: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-400" },
  PhonePe: { cls: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-400" },
  Credit: { cls: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400" },
  Other: { cls: "bg-slate-50 text-slate-700 border-slate-100", dot: "bg-slate-400" },
};
const STATUS_CFG: Record<SaleStatus, BadgeConfig> = {
  Completed: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  Pending: { cls: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400" },
  Cancelled: { cls: "bg-red-50 text-red-600 border-red-100", dot: "bg-red-400" },
};

/* ═══════════════════════════════════════════════════════════════
   BADGE
═══════════════════════════════════════════════════════════════ */
const Badge: React.FC<{ cls: string; dot: string; label: string }> = ({ cls, dot, label }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cls}`}>
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
    {label}
  </span>
);

/* ═══════════════════════════════════════════════════════════════
   KPI CARD
═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   FILTER DROPDOWN
═══════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const SalesListPage: React.FC = () => {
  const api = useApi();
  const navigate = useNavigate();
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

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [isReturnSearchOpen, setIsReturnSearchOpen] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [returnSale, setReturnSale] = useState<SaleRecord | null>(null);

  const searchSalesForReturn = useMemo(() => {
    if (!returnSearchQuery) return [];
    const q = returnSearchQuery.toLowerCase();
    return orders.filter(s => s.ui_id.toString().includes(q) || s.customer_id.toLowerCase().includes(q)).slice(0, 5);
  }, [returnSearchQuery, orders]);

  const openDetail = (sale: SaleRecord) => navigate(`/sales/${sale.id}`, { state: { sale, customerMap, productMap } });
  const openReturn = (sale: SaleRecord) => { setTimeout(() => setReturnSale(sale), 50); };

  /* Handle return trigger coming back from SaleDetailPage */
  useEffect(() => {
    if (location.state?.openReturn) {
      setReturnSale(location.state.openReturn);
      window.history.replaceState({}, "");
    }
  }, [location.state]);
  const closeReturn = () => setReturnSale(null);

  /* ── Data fetching ── */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`);
      if (res && res.data) {
        const normalized = (res.data as any[]).map(s => {
          let pm = "Other";
          if (s.payments && Object.keys(s.payments).length > 0) {
            pm = Object.keys(s.payments).map(k => { const u = k.toUpperCase(); if (u === "CASH") return "Cash"; if (u === "CARD") return "Card"; if (u === "UPI" || u === "G-PAY" || u === "GPAY") return "UPI"; if (u === "PHONEPE") return "PhonePe"; if (u === "CREDIT") return "Credit"; return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase(); }).join(", ");
          } else if (s.payment_method) {
            const r = (s.payment_method || "Other").toUpperCase();
            pm = r === "CASH" ? "Cash" : r === "CARD" ? "Card" : r === "UPI" || r === "G-PAY" || r === "GPAY" ? "UPI" : r === "PHONEPE" ? "PhonePe" : r === "CREDIT" ? "Credit" : s.payment_method;
          }
          return { ...s, status: s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase(), payment_method: pm, origin: s.origin === "OFFLINE" ? "Sales" : s.origin };
        });
        setOrders(normalized);
        fetchDetails();
      }
    } catch (err) { console.error("Failed to fetch orders:", err); }
    finally { setLoading(false); }
  };

  const fetchDetails = async () => {
    try {
      const custRes = await api.getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`);
      if (custRes?.data) { const m: Record<string, string> = {}; custRes.data.forEach((c: any) => { m[c.id] = c.name; }); setCustomerMap(m); }
      const invRes = await api.getData(ENDPOINTS.INVENTORIES);
      if (invRes?.data) { const m: Record<string, string> = {}; invRes.data.forEach((p: any) => { m[p.id] = p.name; }); setProductMap(m); }
    } catch (err) { console.error("Failed to fetch details:", err); }
  };

  useEffect(() => {
    fetchOrders();
    window.addEventListener("focus", fetchOrders);
    return () => window.removeEventListener("focus", fetchOrders);
  }, []);

  /* ── Filters ── */
  const filtered = useMemo(() => orders.filter(s => {
    const q = search.toLowerCase();
    const dateStr = s.created_at.split("T")[0];
    return (!q || s.ui_id.toString().includes(q) || s.customer_id.toLowerCase().includes(q) || (customerMap[s.customer_id] || "").toLowerCase().includes(q)) && (!filterOrigin || s.origin === filterOrigin) && (!filterPayment || s.payment_method === filterPayment) && (!filterStatus || s.status.toLowerCase() === filterStatus.toLowerCase()) && (!filterDate || dateStr === filterDate);
  }), [search, filterOrigin, filterPayment, filterStatus, filterDate, orders, customerMap]);

  /* ── Stats ── */
  const totalRevenue = useMemo(() => orders.filter(s => s.status.toLowerCase() === "completed").reduce((a, b) => a + b.total_sellprice, 0), [orders]);
  const salesReturnCount = useMemo(() => orders.filter(s => s.origin === "Sales Return").length, [orders]);
  const todayRevenue = useMemo(() => { const today = new Date().toISOString().split("T")[0]; return orders.filter(s => s.created_at.startsWith(today) && s.status.toLowerCase() === "completed").reduce((a, b) => a + b.total_sellprice, 0); }, [orders]);
  const pendingCount = useMemo(() => orders.filter(s => s.status.toLowerCase() === "pending").length, [orders]);

  const activeFilters = [filterOrigin, filterPayment, filterStatus, filterDate].filter(Boolean).length;
  const clearAll = () => { setFilterOrigin(""); setFilterPayment(""); setFilterStatus(""); setFilterDate(""); setSearch(""); };

  const filteredRevenue = useMemo(() => filtered.filter(s => s.status === "Completed").reduce((a, b) => a + b.total_sellprice, 0), [filtered]);

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full overflow-hidden relative">

      {/* ── KPI Row ── */}
      {!isCleanMode && (
        <div className="flex gap-3 pb-1 overflow-x-auto scrollbar-none">
          <StatCard
            label="Total Revenue"
            value={totalRevenue.toLocaleString()}
            prefix="₹"
            icon={<DollarSign size={18} />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            subValue="Completed"
          />
          <StatCard
            label="Today's Sales"
            value={todayRevenue.toLocaleString()}
            prefix="₹"
            icon={<TrendingUp size={18} />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            subValue="Today"
          />
          <StatCard
            label="Returns"
            value={salesReturnCount}
            icon={<RefreshCw size={18} />}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            subValue="Total"
          />
          <StatCard
            label="Pending Orders"
            value={pendingCount}
            icon={<Loader2 size={18} className="animate-spin-slow" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            subValue="In Queue"
          />
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white border border-slate-100 rounded-lg p-1.5 px-2.5 flex flex-nowrap items-center gap-1.5 shadow-sm overflow-x-auto scrollbar-none mt-2">
        <div className="relative w-80 shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
            placeholder="Search invoice or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${
            activeFilters > 0
              ? "border-blue-200 text-blue-600 bg-blue-50/50"
              : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
          }`}
          title="Filters"
        >
          <Filter size={13} />
          {activeFilters > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          )}
        </button>

        <div className="flex-1" />
        
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-bold bg-blue-600 text-white border-none rounded-md cursor-pointer transition-all hover:bg-blue-700 hover:shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap shrink-0" onClick={() => setIsReturnSearchOpen(true)}>
          <RotateCcw size={13} />Process Return
        </button>
        <span className="font-mono text-[11px] font-medium text-slate-400 shrink-0">{filtered.length}/{orders.length}</span>
      </div>

      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onClear={clearAll}
        title="Sales Filters"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Origin</label>
            <ReusableSelect
              options={[
                { label: "All Origins", value: "" },
                { label: "Sales", value: "Sales" },
                { label: "Sales Return", value: "Sales Return" }
              ]}
              value={filterOrigin}
              onValueChange={setFilterOrigin}
              placeholder="Origin"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
            <ReusableSelect
              options={[
                { label: "All Payment Methods", value: "" },
                { label: "Cash", value: "Cash" },
                { label: "Card", value: "Card" },
                { label: "UPI", value: "UPI" }
              ]}
              value={filterPayment}
              onValueChange={setFilterPayment}
              placeholder="Payment Method"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <ReusableSelect
              options={[
                { label: "All Statuses", value: "" },
                { label: "Completed", value: "Completed" },
                { label: "Pending", value: "Pending" },
                { label: "Cancelled", value: "Cancelled" }
              ]}
              value={filterStatus}
              onValueChange={setFilterStatus}
              placeholder="Status"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </RightSidebarFilter>

      {/* ── Table Card ── */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-100 ">
          <table className="w-full border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="w-[110px] p-2.5 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">Invoice</th>
                <th className="w-[160px] p-2.5 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">Customer</th>
                <th className="w-[100px] p-2.5 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">Origin</th>
                <th className="w-[110px] p-2.5 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">Payment</th>
                <th className="w-[96px] p-2.5 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">Date</th>
                <th className="w-[62px] p-2.5 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-center">Qty</th>
                <th className="w-[110px] p-2.5 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-right">Amount</th>
                <th className="w-[100px] p-2.5 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">Status</th>
                <th className="w-[76px] p-2.5 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <Loader2 size={28} className="text-blue-500 mx-auto animate-spin mb-2" />
                    <p className="text-sm font-medium text-slate-500">Fetching sales records…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <Receipt size={32} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600 mb-1">No sales found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : filtered.map(sale => {
                const oCfg = ORIGIN_CFG[sale.origin as OriginType] || ORIGIN_CFG["Sales"];
                const returnable = sale.status === "Completed" && sale.origin !== "Sales Return";
                const dateStr = sale.created_at.split("T")[0];
                const refundedCount = (sale.items || []).filter(i => i.status === "REFUNDED").length;
                const exchangedCount = (sale.items || []).filter(i => i.status === "EXCHANGED").length;

                return (
                  <tr key={sale.id} className="group hover:bg-slate-50/60 transition-colors">
                    <td className="p-2.5 px-3 border-b border-slate-50">
                      <div>
                        <span className="font-mono text-[11px] font-semibold text-slate-800 block">INV-{sale.ui_id}</span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {sale.origin === "Sales Return" && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">Return</span>}
                          {refundedCount > 0 && <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1 py-0.5 rounded">{refundedCount} Refunded</span>}
                          {exchangedCount > 0 && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">{exchangedCount} Exchanged</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5 px-3 border-b border-slate-50">
                      <span className="truncate text-xs font-medium text-slate-800 block" title={customerMap[sale.customer_id] || sale.customer_id}>
                        {customerMap[sale.customer_id] || sale.customer_id}
                      </span>
                    </td>
                    <td className="p-2.5 px-3 border-b border-slate-50"><Badge cls={oCfg.cls} dot={oCfg.dot} label={sale.origin} /></td>
                    <td className="p-2.5 px-3 border-b border-slate-50">
                      <div className="flex flex-wrap gap-1">
                        {sale.payments && Object.keys(sale.payments).length > 0 ? (
                          Object.keys(sale.payments).map(k => {
                            const u = k.toUpperCase();
                            const label = u === "CASH" ? "Cash" : u === "CARD" ? "Card" : u === "UPI" || u === "G-PAY" || u === "GPAY" ? "UPI" : u === "PHONEPE" ? "PhonePe" : u === "CREDIT" ? "Credit" : k;
                            const cfg = PAYMENT_CFG[label] || PAYMENT_CFG["Other"];
                            return <Badge key={k} cls={cfg.cls} dot={cfg.dot} label={label} />;
                          })
                        ) : (
                          <Badge cls={(PAYMENT_CFG[sale.payment_method || ""] || PAYMENT_CFG["Other"]).cls} dot={(PAYMENT_CFG[sale.payment_method || ""] || PAYMENT_CFG["Other"]).dot} label={sale.payment_method || "Other"} />
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 px-3 border-b border-slate-50"><span className="font-mono text-[11px] text-slate-500">{dateStr}</span></td>
                    <td className="p-2.5 px-3 border-b border-slate-50 text-center"><span className="text-[11px] font-semibold text-slate-600">{sale.total_quantity}</span></td>
                    <td className="p-2.5 px-3 border-b border-slate-50 text-right"><span className="font-mono text-xs font-bold text-slate-900">{fmt(sale.total_sellprice)}</span></td>
                    <td className="p-2.5 px-3 border-b border-slate-50">{(() => { const cfg = STATUS_CFG[sale.status as SaleStatus] || STATUS_CFG["Pending"]; return <Badge cls={cfg.cls} dot={cfg.dot} label={sale.status} />; })()}</td>
                    <td className="p-2.5 px-3 border-b border-slate-50 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => openDetail(sale)} title="View details"><Eye size={14} /></button>
                        <button className={`w-7 h-7 flex items-center justify-center rounded-lg bg-transparent transition-colors cursor-pointer ${returnable ? "text-red-400 hover:bg-red-50 hover:text-red-600" : "text-slate-200 cursor-not-allowed"}`} onClick={() => returnable && openReturn(sale)} disabled={!returnable} title={!returnable ? (sale.origin === "Sales Return" ? "Already returned" : `Status: ${sale.status}`) : "Process return"}>
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="p-3 px-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-600">{filtered.length}</span>
              {' '}of{' '}
              <span className="font-semibold text-slate-600">{orders.length}</span>
              {' '}records
            </p>
            <span className="text-xs text-slate-500 font-medium">
              Filtered revenue:{' '}
              <span className="font-mono font-bold text-slate-900">{fmt(filteredRevenue)}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Return Modal ── */}
      {returnSale && <ReturnModal sale={returnSale} onClose={closeReturn} onRefresh={fetchOrders} productMap={productMap} />}

      {/* ── Return Search Modal ── */}
      <ReturnSearchPortal
        isOpen={isReturnSearchOpen}
        onClose={() => setIsReturnSearchOpen(false)}
        searchQuery={returnSearchQuery}
        setSearchQuery={setReturnSearchQuery}
        results={searchSalesForReturn}
        onSelect={(sale) => { openReturn(sale); setIsReturnSearchOpen(false); setReturnSearchQuery(""); }}
        customerMap={customerMap}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   RETURN SEARCH PORTAL
═══════════════════════════════════════════════════════════════ */
interface ReturnSearchPortalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  results: any[];
  onSelect: (sale: any) => void;
  customerMap: Record<string, string>;
}

const ReturnSearchPortal: React.FC<ReturnSearchPortalProps> = ({ isOpen, onClose, searchQuery, setSearchQuery, results, onSelect, customerMap }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1001] overflow-y-auto overflow-x-hidden scrollbar-none flex flex-col items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Centering Wrapper */}
      <div className="relative w-full h-full flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-[500px] bg-white rounded-lg shadow-[0_24px_80px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out pointer-events-auto">
          <div className="p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-[15px] font-black text-slate-900">Process Return</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-bold tracking-tight uppercase">Find an order to begin</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all"><X size={16} /></button>
          </div>
          <div className="p-5 px-6 flex flex-col gap-4">
            <div className="relative group">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                autoFocus
                placeholder="Invoice ID or customer name…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-4 text-[13px] border-2 border-slate-100 rounded-lg outline-none bg-slate-50/50 text-slate-800 transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-400 font-bold"
              />
            </div>
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {results.length > 0 ? results.map(sale => (
                <button key={sale.id} onClick={() => onSelect(sale)}
                  className="flex items-center gap-3.5 p-3.5 px-4 bg-white border-2 border-slate-50 rounded-lg cursor-pointer text-left transition-all hover:border-blue-500 hover:shadow-lg hover:scale-[0.99] active:scale-[0.97] group w-full"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors"><Receipt size={18} className="text-slate-400 group-hover:text-blue-500" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[14px] font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">INV-{sale.ui_id}</p>
                      <span className="font-mono text-[13px] font-black text-slate-900 group-hover:text-blue-700">{fmt(sale.total_sellprice)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate font-bold uppercase tracking-tight opacity-70 group-hover:opacity-100">{customerMap[sale.customer_id] || sale.customer_id} · {sale.created_at.split('T')[0]}</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-white" />
                  </div>
                </button>
              )) : searchQuery ? (
                <div className="py-12 text-center animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border-2 border-slate-100 border-dashed"><Search size={28} className="text-slate-200" /></div>
                  <p className="text-[14px] font-black text-slate-600">No matching orders</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-wide">Try a different ID or name</p>
                </div>
              ) : (
                <div className="py-12 text-center animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 border-2 border-blue-100/50 shadow-lg shadow-blue-500/10"><RotateCcw size={28} className="text-blue-500" /></div>
                  <p className="text-[14px] font-black text-slate-800">Find an order to return</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Search by Invoice or Name</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SalesListPage;