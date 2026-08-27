import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, X,
  RotateCcw, Receipt,
  ChevronRight, Filter, Eye
} from "lucide-react";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import {
  TrendingUp,
  ExternalLink, Globe, Store
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { useHeader } from "@/context/HeaderContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { OrderResponse } from "@/features/order/types";
import { ReturnModal } from "../components/ReturnOrderFlow";
import { StatCard } from "@/components/common/StatsCard";
import { AntBadge } from "@/components/ui/AntBadge";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type OriginType = "Offline" | "Offline Return" | "Online";
type SaleStatus = "Completed" | "Pending" | "Cancelled";
type SaleRecord = OrderResponse;

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ═══════════════════════════════════════════════════════════════
   BADGE CONFIGS
═══════════════════════════════════════════════════════════════ */
type BadgeConfig = { cls: string; dot: string };
const ORIGIN_CFG: Record<OriginType, BadgeConfig> = {
  "Offline": { cls: "bg-[var(--mv-sales-bg)] text-[var(--mv-sales-tx)] border border-[var(--mv-sales-bd)]", dot: "bg-[var(--mv-sales-dot)]" },
  "Offline Return": { cls: "bg-[var(--mv-sreturn-bg)] text-[var(--mv-sreturn-tx)] border border-[var(--mv-sreturn-bd)]", dot: "bg-[var(--mv-sreturn-dot)]" },
  "Online": { cls: "bg-[var(--mv-sales-bg)] text-[var(--mv-sales-tx)] border border-[var(--mv-sales-bd)]", dot: "bg-[var(--mv-sales-dot)]" },
};
const PAYMENT_CFG: Record<string, BadgeConfig> = {
  Cash: { cls: "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]", dot: "bg-[var(--pay-paid-dot)]" },
  Card: { cls: "bg-[var(--mv-sreturn-bg)] text-[var(--mv-sreturn-tx)] border border-[var(--mv-sreturn-bd)]", dot: "bg-[var(--mv-sreturn-dot)]" },
  UPI: { cls: "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]", dot: "bg-[var(--pay-paid-dot)]" },
  "G-Pay": { cls: "bg-[var(--mv-sales-bg)] text-[var(--mv-sales-tx)] border border-[var(--mv-sales-bd)]", dot: "bg-[var(--mv-sales-dot)]" },
  PhonePe: { cls: "bg-[var(--mv-sreturn-bg)] text-[var(--mv-sreturn-tx)] border border-[var(--mv-sreturn-bd)]", dot: "bg-[var(--mv-sreturn-dot)]" },
  Credit: { cls: "bg-[var(--ps-draft-bg)] text-[var(--ps-draft-tx)] border border-[var(--ps-draft-bd)]", dot: "bg-[var(--ps-draft-dot)]" },
  Other: { cls: "bg-[var(--pay-pending-bg)] text-[var(--pay-pending-tx)] border border-[var(--pay-pending-bd)]", dot: "bg-[var(--pay-pending-dot)]" },
};
const STATUS_CFG: Record<SaleStatus, BadgeConfig> = {
  Completed: { cls: "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]", dot: "bg-[var(--ps-completed-dot)]" },
  Pending: { cls: "bg-[var(--ps-draft-bg)] text-[var(--ps-draft-tx)] border border-[var(--ps-draft-bd)]", dot: "bg-[var(--ps-draft-dot)]" },
  Cancelled: { cls: "bg-[var(--ps-cancel-bg)] text-[var(--ps-cancel-tx)] border border-[var(--ps-cancel-bd)]", dot: "bg-[var(--ps-cancel-dot)]" },
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


  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [isReturnSearchOpen, setIsReturnSearchOpen] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [returnSale, setReturnSale] = useState<SaleRecord | null>(null);

  const searchSalesForReturn = useMemo(() => {
    if (!returnSearchQuery) return [];
    const q = returnSearchQuery.toLowerCase();
    return orders.filter(s =>
      s.ui_id?.toString().toLowerCase().includes(q) ||
      (s.customer_id && s.customer_id.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [returnSearchQuery, orders]);

  const openDetail = React.useCallback((sale: SaleRecord) => navigate(`/sales/${sale.id}`), [navigate]);
  const openReturn = React.useCallback((sale: SaleRecord) => { setTimeout(() => setReturnSale(sale), 50); }, []);

  useEffect(() => {
    if (selectedSale) {
      const returnable = selectedSale.status === "Completed" && selectedSale.origin !== "Sales Return";
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              <Receipt size={14} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">#{selectedSale.ui_id}</p>
              <p className="text-[10px] font-semibold text-slate-400 font-mono">
                {selectedSale.customer?.customer_name || (selectedSale.customer_id ? (customerMap[selectedSale.customer_id] || selectedSale.customer_id) : "Walk in Customer")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSale(null)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-semibold text-[11px] transition-colors"
            >
              Deselect
            </button>
            <button
              onClick={() => returnable && openReturn(selectedSale)}
              disabled={!returnable}
              className={`h-8 px-3 rounded-md border border-slate-200 font-semibold text-[11px] transition-colors flex items-center gap-1.5 ${returnable ? "bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700" : "bg-slate-50 text-slate-300 cursor-not-allowed"}`}
              title={!returnable ? (selectedSale.origin === "Sales Return" ? "Already returned" : `Status: ${selectedSale.status}`) : "Process return"}
            >
              <RotateCcw size={13} />
              Process Return
            </button>
            <button
              onClick={() => openDetail(selectedSale)}
              className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <ChevronRight size={13} />
              View Details
            </button>
          </div>
        </div>
      );
    } else {
      setBottomActions(null);
    }
  }, [selectedSale, setBottomActions, openDetail, openReturn, customerMap]);

  /* Handle return trigger coming back from SaleDetailPage */
  useEffect(() => {
    if (location.state?.openReturn) {
      setReturnSale(location.state.openReturn);
      window.history.replaceState({}, "");
    }
  }, [location.state]);
  const closeReturn = () => setReturnSale(null);

  const fetchPage = React.useCallback(async (limit: number, offset: number, filters: any) => {
    const params: any = { limit: limit.toString(), offset: offset.toString() };
    if (filters.search) params.q = filters.search;
    if (filters.origin === "Offline") params.origin = "OFFLINE";
    else if (filters.origin === "Offline Return") params.origin = "OFFLINE_SALES_RETURN";
    else if (filters.origin === "Online") params.origin = "ONLINE";
    if (filters.payment) params.payment_method = filters.payment;
    if (filters.status) params.status = filters.status;
    if (filters.fromDate) params.from_date = filters.fromDate;
    if (filters.toDate) params.to_date = filters.toDate;

    const res = await api.getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`, params);

    let fetchedStats = null;
    if (res?.data?.overall_datas) {
      fetchedStats = res.data.overall_datas;
    }

    const dataList = Array.isArray(res?.data) ? res.data : (res?.data?.datas ?? []);
    const normalized = dataList.map((s: any) => {
      // Support new Order Service format: payment_infos can be a dict (Record<string, number>) or an array
      let pm = "Other";
      if (s.payment_infos && typeof s.payment_infos === 'object' && !Array.isArray(s.payment_infos) && Object.keys(s.payment_infos).length > 0) {
        pm = Object.keys(s.payment_infos).map(k => {
          const u = k.toUpperCase();
          if (u === "CASH") return "Cash";
          if (u === "CARD") return "Card";
          if (u === "UPI" || u === "GPAY" || u === "G-PAY") return "UPI";
          if (u === "PHONEPE") return "PhonePe";
          if (u === "CREDIT" || u === "ON_CREDIT") return "Credit";
          return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
        }).join(", ");
      } else if (Array.isArray(s.payment_infos) && s.payment_infos.length > 0) {
        pm = s.payment_infos.map((p: any) => {
          const methodStr = typeof p === 'string' ? p : (p.method || "");
          const u = methodStr.toUpperCase();
          if (u === "CASH") return "Cash";
          if (u === "CARD") return "Card";
          if (u === "UPI" || u === "GPAY" || u === "G-PAY") return "UPI";
          if (u === "PHONEPE") return "PhonePe";
          if (u === "CREDIT" || u === "ON_CREDIT") return "Credit";
          return methodStr || "Other";
        }).join(", ");
      } else if (s.payments && Object.keys(s.payments).length > 0) {
        pm = Object.keys(s.payments).map(k => { const u = k.toUpperCase(); if (u === "CASH") return "Cash"; if (u === "CARD") return "Card"; if (u === "UPI" || u === "G-PAY" || u === "GPAY") return "UPI"; if (u === "PHONEPE") return "PhonePe"; if (u === "CREDIT" || u === "ON_CREDIT") return "Credit"; return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase(); }).join(", ");
      } else if (s.payment_method) {
        const r = (s.payment_method || "Other").toUpperCase();
        pm = r === "CASH" ? "Cash" : r === "CARD" ? "Card" : r === "UPI" || r === "G-PAY" || r === "GPAY" ? "UPI" : r === "PHONEPE" ? "PhonePe" : r === "CREDIT" || r === "ON_CREDIT" ? "Credit" : s.payment_method;
      }

      // Derive total from calculation_infos if present (new Order Service format)
      const total = s.total_sellprice ?? s.calculation_infos?.total ?? s.total ?? 0;

      // Derive total quantity
      let totalQty = s.total_quantity || s.item_infos?.total_order_qty || s.item_infos?.total_order_quantity || 0;
      if (s.calculation_infos?.items && Array.isArray(s.calculation_infos.items)) {
        totalQty = s.calculation_infos.items.reduce((sum: number, item: any) => sum + (item.qty || 0), 0);
      }

      return {
        ...s,
        total_sellprice: total,
        total_quantity: totalQty,
        status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase() : "Unknown",
        payment_method: pm,
        origin: s.origin === "ONLINE" || s.origin === "Online Sales" ? "Online" : (s.origin === "OFFLINE_SALES_RETURN" || s.origin === "Sales Return" ? "Offline Return" : "Offline"),
      };
    });

    return {
      items: normalized,
      hasMore: dataList.length === limit,
      stats: fetchedStats,
      total: res?.data?.total_count || normalized.length
    };
  }, [api]);


  const fetchDetails = async () => {
    try {
      const custRes = await api.getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`);
      if (custRes?.data) {
        const m: Record<string, string> = {};
        const custList = Array.isArray(custRes.data) ? custRes.data : (custRes.data.datas ?? []);
        custList.forEach((c: any) => { m[c.id] = c.name; });
        setCustomerMap(m);
      }
      const invRes = await api.getData(ENDPOINTS.INVENTORIES);
      if (invRes?.data) {
        const m: Record<string, string> = {};
        const invList = Array.isArray(invRes.data) ? invRes.data : (invRes.data.inventories ?? invRes.data.datas ?? []);
        invList.forEach((p: any) => { m[p.id] = p.name; });
        setProductMap(m);
      }
    } catch (err) { console.error("Failed to fetch details:", err); }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  /* ── Filters ── */
  const [analyticsStats, setAnalyticsStats] = useState<any>(null);

  useEffect(() => {
    api.getData(ENDPOINTS.ANALYTICS_SALES_OVERALL, { shop_id: SHOP_ID })
      .then((res) => {
        const data = res?.data ?? res;
        if (data) {
          setAnalyticsStats({ overview: { sales: data } });
        }
      })
      .catch(() => { });
  }, [api]);

  const filters = useMemo(() => ({
    search: debouncedSearch,
    origin: filterOrigin,
    payment: filterPayment,
    status: filterStatus,
    fromDate,
    toDate,
  }), [debouncedSearch, filterOrigin, filterPayment, filterStatus, fromDate, toDate]);

  const { items, loading, loadingMore, stats, totalCount, lastElementRef } = useInfiniteScroll({
    fetchPage,
    filters,
    limit: 50
  });

  const filtered = useMemo<any[]>(() => {
    let result = [...(items as any[])];

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((s: any) =>
        (s.ui_id && s.ui_id.toString().toLowerCase().includes(q)) ||
        (s.customer?.customer_name && s.customer.customer_name.toLowerCase().includes(q)) ||
        (s.customer_id && s.customer_id.toLowerCase().includes(q)) ||
        (s.customer_id && customerMap[s.customer_id] && customerMap[s.customer_id].toLowerCase().includes(q))
      );
    }

    if (filterOrigin) {
      result = result.filter((s: any) => s.origin === filterOrigin);
    }

    if (filterPayment) {
      result = result.filter((s: any) => {
        const pm = s.payment_method || "";
        return pm === filterPayment || pm.includes(filterPayment);
      });
    }

    if (filterStatus) {
      result = result.filter((s: any) => s.status.toUpperCase() === filterStatus.toUpperCase());
    }

    if (fromDate) {
      const f = new Date(fromDate).setHours(0, 0, 0, 0);
      result = result.filter((s: any) => new Date(s.created_at).getTime() >= f);
    }

    if (toDate) {
      const t = new Date(toDate).setHours(23, 59, 59, 999);
      result = result.filter((s: any) => new Date(s.created_at).getTime() <= t);
    }

    return result;
  }, [items, debouncedSearch, filterOrigin, filterPayment, filterStatus, fromDate, toDate, customerMap]);

  const activeFilters = [filterOrigin, filterPayment, filterStatus, fromDate, toDate].filter(Boolean).length;
  const clearAll = () => {
    setFilterOrigin("");
    setFilterPayment("");
    setFilterStatus("");
    setFromDate("");
    setToDate("");
    setSearch("");
  };

  const filteredRevenue = useMemo(() => filtered.filter(s => s.status === "Completed").reduce((a, b) => a + b.total_sellprice, 0), [filtered]);

  // Keep orders updated for Return Search (it relies on orders)
  useEffect(() => {
    setOrders(filtered);
  }, [filtered]);

  if (loading && filtered.length === 0 && !search && !debouncedSearch) {
    return (
      <div className="flex-1 p-6">
        <SkeletonLoader variant="list" rows={8} showStats={true} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full overflow-hidden relative">

      {/* ── KPI Row ── */}
      {!isCleanMode && (
        <div className="flex gap-3 pb-1 overflow-x-auto scrollbar-none">
          <StatCard
            label="Total Orders"
            value={analyticsStats?.overview?.sales?.total_sales ?? stats?.total_orders ?? 0}
            icon={<TrendingUp size={18} />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            subValue="All Time"
          />
          <StatCard
            label="Online Sales"
            value={(analyticsStats?.overview?.sales?.total_online_sales_amount ?? 0).toLocaleString()}
            prefix="₹"
            icon={<Globe size={18} />}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            subValue={`${analyticsStats?.overview?.sales?.total_online_sales ?? 0} Orders`}
          />
          <StatCard
            label="Offline Sales"
            value={(analyticsStats?.overview?.sales?.total_offline_sales_amount ?? 0).toLocaleString()}
            prefix="₹"
            icon={<Store size={18} />}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
            subValue={`${analyticsStats?.overview?.sales?.total_offline_sales ?? 0} Orders`}
          />
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white border border-slate-100 rounded-lg p-1.5 px-2.5 flex flex-nowrap items-center gap-1.5 shadow-sm overflow-x-auto scrollbar-none mt-2">
        <div className="relative w-80 shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
            placeholder="Search order or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${activeFilters > 0
            ? "border-blue-200 text-blue-600 bg-blue-50/50"
            : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
            }`}
          title="Filters"
        >
          <Filter size={13} />
          {activeFilters > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          )}
          <p>Filters</p>
        </button>

        <div className="flex-1" />

        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-bold bg-blue-600 text-white border-none rounded-md cursor-pointer transition-all hover:bg-blue-700 hover:shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap shrink-0" onClick={() => setIsReturnSearchOpen(true)}>
          <RotateCcw size={13} />Process Return
        </button>

      </div>

      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => { }}
        onClear={clearAll}
        title="Sales Filters"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Origin</label>
            <ReusableSelect
              options={[
                { label: "All Origins", value: "" },
                { label: "Offline", value: "Offline" },
                { label: "Online", value: "Online" },
                { label: "Offline Return", value: "Offline Return" }
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

      {/* ── Table Card ── */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-100 ">
          <table className="w-full border-collapse table-fixed relative">
            <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="w-[110px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Order ID</th>
                <th className="w-[140px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Customer</th>
                <th className="w-[90px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Origin</th>
                <th className="w-[100px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Payment</th>
                <th className="w-[96px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Date</th>
                <th className="w-[50px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-center">Qty</th>
                <th className="w-[90px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-right">Amount</th>
                <th className="w-[90px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Status</th>
                <th className="w-[90px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <Receipt size={32} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600 mb-1">No sales found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : filtered.map((sale, index) => {
                const oCfg = ORIGIN_CFG[sale.origin as OriginType] || ORIGIN_CFG["Offline"];

                const dateStr = sale.created_at.split("T")[0];
                const refundedCount = (sale.items || []).filter((i: any) => i.status === "REFUNDED").length;
                const exchangedCount = (sale.items || []).filter((i: any) => i.status === "EXCHANGED").length;
                const hasReturns = (sale.returns && sale.returns.length > 0) || (sale.items || []).some((i: any) => (i.returned_quantity && i.returned_quantity > 0) || i.status === "REFUNDED" || i.status === "EXCHANGED") || sale.status === "Returned" || sale.status === "RETURNED";

                const isSelected = selectedSale?.id === sale.id;

                return (
                  <tr
                    ref={index === filtered.length - 1 ? lastElementRef : null}
                    key={sale.id}
                    className={`group transition-colors cursor-pointer ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-slate-50/60"}`}
                    onClick={() => setSelectedSale(prev => prev?.id === sale.id ? null : sale)}
                  >
                    <td className="px-4 py-4 border-b border-slate-50">
                      <div>
                        <span className="font-mono text-[11px] font-semibold text-slate-800 block">#{sale.ui_id}</span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {sale.origin === "Offline Return" && <AntBadge variant="tx-sales-return" type="tag">Return</AntBadge>}
                          {hasReturns && <AntBadge variant="tx-sales-return" type="tag">Returned</AntBadge>}
                          {refundedCount > 0 && <AntBadge variant="pay-partial" type="tag">{refundedCount} Refunded</AntBadge>}
                          {exchangedCount > 0 && <AntBadge variant="tx-sales" type="tag">{exchangedCount} Exchanged</AntBadge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-b border-slate-50">
                      <span className="truncate text-xs font-medium text-slate-800 block" title={sale.customer?.customer_name || (sale.customer_id ? (customerMap[sale.customer_id] || sale.customer_id) : "Walk in Customer")}>
                        {sale.customer?.customer_name || (sale.customer_id ? (customerMap[sale.customer_id] || sale.customer_id) : "Walk in Customer")}
                      </span>
                      {sale.customer?.customer_mobile_number && (
                        <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{sale.customer.customer_mobile_number}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 border-b border-slate-50"><Badge cls={oCfg.cls} dot={oCfg.dot} label={sale.origin} /></td>
                    <td className="px-4 py-4 border-b border-slate-50">
                      <div className="flex flex-wrap gap-1">
                        {sale.payments && Object.keys(sale.payments).length > 0 ? (
                          Object.keys(sale.payments).map(k => {
                            const u = k.toUpperCase();
                            const label = u === "CASH" ? "Cash" : u === "CARD" ? "Card" : u === "UPI" || u === "G-PAY" || u === "GPAY" ? "UPI" : u === "PHONEPE" ? "PhonePe" : u === "CREDIT" || u === "ON_CREDIT" ? "Credit" : k;
                            const cfg = PAYMENT_CFG[label] || PAYMENT_CFG["Other"];
                            return <Badge key={k} cls={cfg.cls} dot={cfg.dot} label={label} />;
                          })
                        ) : (
                          <Badge cls={(PAYMENT_CFG[sale.payment_method || ""] || PAYMENT_CFG["Other"]).cls} dot={(PAYMENT_CFG[sale.payment_method || ""] || PAYMENT_CFG["Other"]).dot} label={sale.payment_method || "Other"} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 border-b border-slate-50"><span className="font-mono text-[11px] text-slate-500">{dateStr}</span></td>
                    <td className="px-4 py-4 border-b border-slate-50 text-center"><span className="text-[11px] font-semibold text-slate-600">{Number((sale.total_quantity || 0).toFixed(2))}</span></td>
                    <td className="px-4 py-4 border-b border-slate-50 text-right"><span className="font-mono text-xs font-bold text-slate-900">{fmt(sale.total_sellprice)}</span></td>
                    <td className="px-4 py-4 border-b border-slate-50">{(() => { const cfg = STATUS_CFG[sale.status as SaleStatus] || STATUS_CFG["Pending"]; return <Badge cls={cfg.cls} dot={cfg.dot} label={sale.status} />; })()}</td>
                    <td className="px-4 py-4 border-b border-slate-50 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {sale.status === "Completed" && sale.origin !== "Offline Return" && sale.origin !== "Sales Return" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openReturn(sale); }}
                            className="text-rose-500 hover:text-rose-600 transition-colors p-1"
                            title="Process Return"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetail(sale); }}
                          className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loadingMore && <div className="py-4 text-center text-xs text-slate-500">Loading more...</div>}
        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="p-3 px-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-600">{filtered.length}</span>
              {totalCount > 0 && (
                <>
                  {' '}of{' '}
                  <span className="font-semibold text-slate-600">{totalCount}</span>
                </>
              )}
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
      {returnSale && <ReturnModal sale={returnSale} onClose={closeReturn} onRefresh={() => { }} productMap={productMap} />}

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
                placeholder="Order ID or customer name…"
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
                      <p className="text-[14px] font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">Order #{sale.ui_id}</p>
                      <span className="font-mono text-[13px] font-black text-slate-900 group-hover:text-blue-700">{fmt(sale.total_sellprice)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate font-bold uppercase tracking-tight opacity-70 group-hover:opacity-100">{sale.customer?.customer_name || customerMap[sale.customer_id] || sale.customer_id} {sale.customer?.customer_mobile_number ? `· ${sale.customer.customer_mobile_number}` : ''} · {sale.created_at.split('T')[0]}</p>
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
                  <p className="text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Search by Order ID or Name</p>
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
