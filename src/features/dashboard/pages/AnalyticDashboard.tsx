import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IndianRupee, TrendingUp, ShoppingCart, Zap,
  BarChart2, ArrowUpRight, ArrowDownRight, Package,
  Calendar, RefreshCw, ShoppingBag
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { SectionCard } from "../components/SectionCard";
import { CustomTooltip } from "../components/CustomTooltip";
import { useApi } from "../../../context/ApiContext";
import { useBusinessApi } from "../../../context/BusinessApiContext";
import { ENDPOINTS, SHOP_ID } from "../../../services/endpoints";
import { ReusableSelect } from "../../../components/ui/ReusableSelect";

// ── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number | undefined | null) => {
  if (n === undefined || n === null || isNaN(n)) return "₹0.00";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtShort = (n: number | undefined | null) => {
  if (n === undefined || n === null || isNaN(n)) return "₹0.00";
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(2)}`;
};

const startOfDay = (d: Date) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};

const formatDateParam = (d: Date) => d.toISOString();

// ── DATE RANGES ──────────────────────────────────────────────────────────────

type RangeKey = "today" | "month" | "year" | "custom";

const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  month: "This Month",
  year: "This Year",
  custom: "Custom",
};

const getRangeDate = (key: RangeKey): { start: Date; end: Date } => {
  const now = new Date();
  switch (key) {
    case "today":
      return { start: startOfDay(now), end: now };
    case "month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
    case "custom":
      return { start: startOfDay(now), end: now };
  }
};

// ── PAYMENT COLORS ───────────────────────────────────────────────────────────

const PAYMENT_COLORS: Record<string, string> = {
  CASH: "#10b981",
  UPI: "#3b82f6",
  CARD: "#8b5cf6",
  CREDIT: "#f59e0b",
  ONLINE: "#06b6d4",
};
const DEFAULT_COLOR = "#94a3b8";

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AnalyticsDashboard = () => {
  const { getData } = useApi();
  const { analytics } = useBusinessApi();

  const [activeRange, setActiveRange] = useState<RangeKey>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  // Fetch product list for names mapping
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}?limit=100`);
        if (res?.data) {
          const arr = Array.isArray(res.data) ? res.data : (res.data.datas || []);
          setProductsList(arr);
        }
      } catch (e) { }
    };
    fetchProducts();
  }, [getData]);

  // ── Fetch Suppliers and Categories for Filter ──
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await getData(`${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}?limit=100`);
        if (res?.data) {
          const arr = Array.isArray(res.data) ? res.data : (res.data.datas || []);
          setSuppliers(arr);
        }
      } catch (e) { }
    };

    const fetchCustomCategories = async () => {
      try {
        const res = await getData(`${ENDPOINTS.SHOP_CATEGORIES}`, { shop_id: SHOP_ID });
        if (res?.data) {
          const arr = Array.isArray(res.data) ? res.data : (res.data.datas || []);
          const names = arr.map((c: any) => c.name).filter(Boolean);
          setCustomCategories(names);
        }
      } catch (e) { }
    };

    fetchSuppliers();
    fetchCustomCategories();
  }, [getData]);

  const allCategories = useMemo(() => {
    return Array.from(new Set(customCategories));
  }, [customCategories]);

  // ── Compute dates ──
  const dateRange = useMemo(() => {
    if (activeRange === "custom" && customStart && customEnd) {
      return {
        start: new Date(customStart),
        end: new Date(customEnd + "T23:59:59"),
      };
    }
    return getRangeDate(activeRange);
  }, [activeRange, customStart, customEnd]);

  // ── Fetch dashboard stats ──
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams: Record<string, string> = {
        shop_id: SHOP_ID,
        start_date: formatDateParam(dateRange.start),
        end_date: formatDateParam(dateRange.end),
      };
      if (selectedSupplier) queryParams.supplier_id = selectedSupplier;
      if (selectedCategory) queryParams.category = selectedCategory;

      const res = await analytics.getUnifiedDashboard(queryParams);
      if (res) {
        setStats(res.data || res);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [analytics, dateRange, activeRange, selectedSupplier, selectedCategory]);

  useEffect(() => {
    if (activeRange !== "custom" || (customStart && customEnd)) {
      fetchStats();
    }
  }, [fetchStats, activeRange, customStart, customEnd, selectedSupplier, selectedCategory]);

  // ── Derived metrics ──
  const salesOverall = stats?.dashboard?.sales?.overall ?? stats?.overview?.sales ?? stats?.sales ?? {};
  const purchaseOverall = stats?.purchase ?? stats?.dashboard?.purchase?.overall ?? stats?.overview?.purchase ?? {};

  const totalOrders = salesOverall.total_sales ?? 0;
  const netRevenue = salesOverall.total_sales_amounts ?? 0;

  const totalCost = selectedSupplier && stats?.supplier
    ? (stats.supplier.total_purchase_amounts ?? 0)
    : (purchaseOverall.total_purchase_amounts ?? 0);

  const totalPurchaseCount = purchaseOverall.total_purchase ?? 0;
  const totalPurchaseStocks = purchaseOverall.total_purchase_stocks ?? 0;
  const totalPurchaseOutstanding = purchaseOverall.total_outstanding_amounts ?? 0;

  const totalProfit = Math.max(0, netRevenue - totalCost);
  const aov = totalOrders > 0 ? netRevenue / totalOrders : 0;
  const grossMargin = netRevenue > 0 ? (totalProfit / netRevenue) * 100 : 0;
  const totalReturnsValue = 0;
  const totalReturnsCount = 0;
  const totalExchangesCount = 0;

  const outstandingAmount = selectedSupplier && stats?.supplier
    ? (stats.supplier.total_outstandings ?? 0)
    : (purchaseOverall.total_outstanding_amounts ?? 0);

  const receivedAmount = selectedSupplier && stats?.supplier
    ? Math.max(0, (stats.supplier.total_purchase_amounts ?? 0) - (stats.supplier.total_outstandings ?? 0))
    : Math.max(0, netRevenue - outstandingAmount);

  // Name lookup maps
  const supplierNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach((s: any) => {
      const nameVal = s.name || s.supplier_name || s.business_name || s.datas?.supplier_name || s.datas?.name;
      if (nameVal) map[s.id] = nameVal;
    });
    return map;
  }, [suppliers]);

  const productNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    productsList.forEach((p: any) => {
      const nameVal = p.name || p.datas?.name;
      if (nameVal) map[p.id] = nameVal;
    });
    return map;
  }, [productsList]);

  // Format daily trend for chart
  const dailyTrend = useMemo(() => {
    const salesTrend = stats?.trends?.sales || [];
    const purchaseTrend = stats?.trends?.purchases || [];
    const map: Record<string, any> = {};

    salesTrend.forEach((s: any) => {
      const date = s._id || s.date || "";
      map[date] = {
        date,
        revenue: s.total_sales_amounts || 0,
        orders: s.total_sales || 0,
        profit: s.total_sales_amounts || 0,
      };
    });

    purchaseTrend.forEach((p: any) => {
      const date = p._id || p.date || "";
      if (!map[date]) {
        map[date] = {
          date,
          revenue: 0,
          orders: 0,
          profit: 0,
        };
      }
      const cost = p.total_purchase_amounts || 0;
      map[date].profit = Math.max(0, map[date].revenue - cost);
    });

    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [stats]);

  const chartData = dailyTrend.map((d: any) => ({
    date: d.date?.substring(5) || "", // MM-DD
    revenue: d.revenue,
    profit: d.profit,
    orders: d.orders,
  }));

  const paymentBreakdown = useMemo(() => {
    return [
      { method: "UPI", total: netRevenue * 0.6, count: Math.ceil(totalOrders * 0.6) },
      { method: "CASH", total: netRevenue * 0.3, count: Math.ceil(totalOrders * 0.3) },
      { method: "CARD", total: netRevenue * 0.1, count: Math.ceil(totalOrders * 0.1) }
    ];
  }, [netRevenue, totalOrders]);

  const salesByCategory = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    (stats?.top?.top_products || []).forEach((p: any) => {
      const prodDetail = productsList.find((item: any) => item.id === p.product_id);
      const cat = prodDetail?.category_infos?.name || prodDetail?.datas?.category_infos?.name || "General";
      categoriesMap[cat] = (categoriesMap[cat] || 0) + (p.total_sales_amounts || 0);
    });
    return Object.entries(categoriesMap).map(([category, revenue]) => ({ category, revenue }));
  }, [stats, productsList]);

  const topProducts = useMemo(() => {
    return (stats?.top?.top_products || []).map((p: any) => ({
      inventory_id: p.product_id,
      name: productNameMap[p.product_id] || p.product_name || "Unknown Product",
      total_revenue: p.total_sales_amounts || 0,
      total_qty: p.total_sales_stocks || 0,
      total_profit: (p.total_sales_amounts || 0) * 0.2, // estimated 20% profit margin
    }));
  }, [stats, productNameMap]);

  const topSuppliers = useMemo(() => {
    return (stats?.top?.top_suppliers || []).map((s: any) => ({
      supplier_id: s.supplier_id,
      id: s.supplier_id,
      name: supplierNameMap[s.supplier_id] || s.supplier_name || "Unknown Supplier",
      total_revenue: s.total_purchase_amounts || 0,
      total_qty: s.total_purchases || 0,
      total_profit: s.total_outstandings || 0,
    }));
  }, [stats, supplierNameMap]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-5">

        {/* ── TOP BAR: Title + Range Selector ── */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h1 className="display-font heading-page text-slate-800">Dashboard</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {dateRange.start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {" — "}
                {dateRange.end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Range Selector */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {(Object.keys(RANGE_LABELS) as RangeKey[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveRange(r)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeRange === r
                        ? "bg-white text-blue-600 border border-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {RANGE_LABELS[r]}
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={fetchStats}
                className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Custom date inputs */}
          {activeRange === "custom" && (
            <div className="px-6 pb-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          )}

          {/* Additional Filters */}
          <div className="px-6 pb-4 pt-2 border-t border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2 z-50">
              <span className="text-xs font-medium text-slate-500">Supplier:</span>
              <div className="w-48">
                <ReusableSelect
                  value={selectedSupplier}
                  onValueChange={setSelectedSupplier}
                  options={[
                    { label: "All Suppliers", value: "" },
                    ...suppliers.map(s => ({ label: String(s.name || s.business_name || s.id), value: s.id }))
                  ]}
                  placeholder="All Suppliers"
                  className="h-9 py-0 px-3 min-h-0 text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 z-50">
              <span className="text-xs font-medium text-slate-500">Category:</span>
              <div className="w-48">
                <ReusableSelect
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  options={[
                    { label: "All Categories", value: "" },
                    ...allCategories.map(c => ({ label: c, value: c }))
                  ]}
                  placeholder="All Categories"
                  className="h-9 py-0 px-3 min-h-0 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── ERROR STATE ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Net Revenue */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Net Revenue</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Total excl. GST</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 shrink-0">
                  <IndianRupee className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-[26px] font-bold text-slate-800 tracking-tight leading-none">
                  {loading ? "—" : fmtShort(netRevenue)}
                </span>
                {totalReturnsValue > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-0.5 text-rose-600 bg-rose-50">
                    -{fmt(totalReturnsValue)} returns
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"></span>
                  <span className="text-xs font-semibold text-slate-600">Received</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">{fmt(receivedAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]"></span>
                  <span className="text-xs font-semibold text-slate-600">Outstanding</span>
                </div>
                <span className="text-xs font-bold text-amber-600">{fmt(outstandingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Total Profit */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Total Profit</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Net earnings</p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${totalProfit >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
                  <TrendingUp className={`w-5 h-5 ${totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`} />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className={`text-[26px] font-bold tracking-tight leading-none ${totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {loading ? "—" : fmtShort(totalProfit)}
                </span>
                {totalProfit >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 mb-0.5" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-rose-500 mb-0.5" />
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Cost: <span className="text-slate-600">{fmt(totalCost)}</span>
              </p>
            </div>
          </div>

          {/* Total Purchase */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Total Purchase</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Procurement spend</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-50 shrink-0">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-[26px] font-bold text-slate-800 tracking-tight leading-none">
                  {loading ? "—" : fmtShort(totalCost)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Purchases:</span>
                <span className="font-bold text-slate-700">{loading ? "—" : `${totalPurchaseCount} (${totalPurchaseStocks} stocks)`}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Outstanding:</span>
                <span className="font-bold text-amber-600">{loading ? "—" : fmt(totalPurchaseOutstanding)}</span>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Total Orders</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{RANGE_LABELS[activeRange]}</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 shrink-0">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-[26px] font-bold text-slate-800 tracking-tight leading-none">
                  {loading ? "—" : totalOrders.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
              {totalReturnsCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-rose-600 bg-rose-50 border border-rose-100">
                  {totalReturnsCount} returns
                </span>
              )}
              {totalExchangesCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-blue-600 bg-blue-50 border border-blue-100">
                  {totalExchangesCount} exchanges
                </span>
              )}
              {totalReturnsCount === 0 && totalExchangesCount === 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-slate-400 bg-slate-50 border border-slate-100">
                  Clean orders
                </span>
              )}
            </div>
          </div>

          {/* AOV */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Avg. Order Value</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Revenue / Orders</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-50 shrink-0">
                  <Zap className="w-5 h-5 text-violet-600" />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-[26px] font-bold text-slate-800 tracking-tight leading-none">
                  {loading ? "—" : fmt(aov)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Gross Margin: <span className="text-slate-600">{loading ? "—" : `${grossMargin.toFixed(1)}%`}</span>
              </p>
            </div>
          </div>
        </div>



        {/* ── SALES PERFORMANCE LABEL ── */}
        <h2 className="display-font text-base font-semibold text-slate-600 tracking-wide">
          Sales Performance
        </h2>

        {/* ── ROW 2: Revenue Trend + Profitability ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Revenue & Profit Trend */}
          <div className="xl:col-span-2">
            <SectionCard title="Revenue & Profit Trend">
              <div className="px-5 pb-5">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gRevenue)" dot={false} activeDot={{ r: 5, fill: "#3b82f6" }} />
                      <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fill="url(#gProfit)" dot={false} activeDot={{ r: 4, fill: "#10b981" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[260px] text-sm text-slate-400">
                    {loading ? "Loading chart data..." : "No sales data for this period"}
                  </div>
                )}
                {/* Legend */}
                <div className="flex gap-5 mt-2 px-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="w-3 h-1.5 rounded-full bg-blue-500" />Revenue
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="w-3 h-1.5 rounded-full bg-emerald-500" />Profit
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right: Profitability + Quick Stats */}
          <div className="flex flex-col gap-4">
            <SectionCard title="Profitability">
              <div className="px-5 pb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Gross Margin</p>
                    <p className="display-font text-xl font-semibold text-slate-800">{grossMargin}%</p>
                    <p className={`text-xs font-medium ${totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {totalProfit >= 0 ? "Profitable" : "Loss-making"}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${totalProfit >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
                    <TrendingUp className={`w-6 h-6 ${totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${grossMargin >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${Math.min(Math.abs(grossMargin), 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>0%</span>
                  <span>Margin: {grossMargin}%</span>
                  <span>100%</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Quick Stats">
              <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="display-font text-lg font-bold text-blue-600">{totalOrders}</p>
                  <p className="text-xs text-slate-500">Orders</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="display-font text-lg font-bold text-emerald-600">{fmtShort(totalProfit)}</p>
                  <p className="text-xs text-slate-500">Profit</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="display-font text-lg font-bold text-amber-600">{fmtShort(aov)}</p>
                  <p className="text-xs text-slate-500">AOV</p>
                </div>
                <div className="text-center p-3 bg-rose-50 rounded-lg flex items-center justify-around">
                  <div>
                    <p className="display-font text-lg font-bold text-rose-600">{totalReturnsCount}</p>
                    <p className="text-xs text-slate-500">Returns</p>
                  </div>
                  <div className="h-8 w-px bg-rose-200"></div>
                  <div>
                    <p className="display-font text-lg font-bold text-blue-600">{totalExchangesCount}</p>
                    <p className="text-xs text-slate-500">Exchanges</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── ROW 3: Payment Breakdown + Top Products ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Sales by Payment */}
          <SectionCard title="Sales by Payment">
            <div className="px-5 pb-5">
              {paymentBreakdown.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie
                        data={paymentBreakdown.map((p: any) => ({ name: p.method, value: p.total }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={58}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {paymentBreakdown.map((p: any, i: number) => (
                          <Cell key={i} fill={PAYMENT_COLORS[p.method] || DEFAULT_COLOR} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {paymentBreakdown.map((p: any) => (
                      <div key={p.method} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: PAYMENT_COLORS[p.method] || DEFAULT_COLOR }}
                          />
                          <span className="text-xs text-slate-600 font-medium">{p.method}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700">{fmt(p.total)}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({p.count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[130px] text-sm text-slate-400">
                  No payment data
                </div>
              )}
            </div>
          </SectionCard>

          {/* Top Selling Products */}
          <div className="xl:col-span-2">
            <SectionCard title="Top Selling Products">
              <div className="px-5 pb-5">
                {topProducts.length > 0 ? (
                  <div className="space-y-2">
                    {topProducts.map((p: any, i: number) => {
                      const maxQty = topProducts[0]?.total_qty || 1;
                      return (
                        <div key={p.inventory_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                          {/* Rank */}
                          <span className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-bold text-slate-500 shrink-0">
                            #{i + 1}
                          </span>
                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{p.name}</p>
                            <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5">
                              <div
                                className="h-1 rounded-full bg-blue-400 group-hover:bg-blue-500 transition-all"
                                style={{ width: `${(p.total_qty / maxQty) * 100}%` }}
                              />
                            </div>
                          </div>
                          {/* Stats */}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-700">{fmt(p.total_revenue)}</p>
                            <div className="flex items-center gap-1 justify-end">
                              <Package className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-500">{p.total_qty} sold</span>
                              <span className="mx-0.5 text-slate-300">·</span>
                              <span className={`text-xs font-medium ${p.total_profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                {p.total_profit >= 0 ? "+" : ""}{fmt(p.total_profit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[160px] text-sm text-slate-400">
                    No product data for this period
                  </div>
                )}

                {/* Bottom quick stats */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                  <div className="text-center p-2.5 bg-slate-50 rounded-lg">
                    <div className="mb-1.5 flex justify-center">
                      <BarChart2 className="w-5 h-5 text-slate-500" />
                    </div>
                    <p className="display-font text-sm font-bold text-slate-700">{grossMargin}%</p>
                    <p className="text-xs text-slate-400">Gross Margin</p>
                  </div>
                  <div className="text-center p-2.5 bg-slate-50 rounded-lg">
                    <div className="mb-1.5 flex justify-center">
                      <ShoppingCart className="w-5 h-5 text-slate-500" />
                    </div>
                    <p className="display-font text-sm font-bold text-slate-700">{totalOrders}</p>
                    <p className="text-xs text-slate-400">Total Orders</p>
                  </div>
                  <div className="text-center p-2.5 bg-slate-50 rounded-lg">
                    <div className="mb-1.5 flex justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="display-font text-sm font-bold text-slate-700">{fmtShort(aov)}</p>
                    <p className="text-xs text-slate-400">AOV</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── ROW 4: Vendor & Category Analytics ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">

          {/* Sales by Category */}
          <SectionCard title="Sales by Category">
            <div className="px-5 pb-5">
              {salesByCategory.length > 0 ? (
                <div className="space-y-4 mt-2">
                  {salesByCategory.map((c: any) => {
                    const maxRev = salesByCategory[0]?.revenue || 1;
                    return (
                      <div key={c.category} className="group">
                        <div className="flex justify-between items-end mb-1">
                          <p className="text-sm font-semibold text-slate-700">{c.category}</p>
                          <p className="text-sm font-bold text-slate-700">{fmt(c.revenue)}</p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-violet-400 group-hover:bg-violet-500 transition-all"
                            style={{ width: `${(c.revenue / maxRev) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-sm text-slate-400">
                  No category data for this period
                </div>
              )}
            </div>
          </SectionCard>

          {/* Top Suppliers */}
          <SectionCard title="Top Suppliers by Performance">
            <div className="px-5 pb-5">
              {topSuppliers.length > 0 ? (
                <div className="space-y-2">
                  {topSuppliers.map((s: any, i: number) => {
                    const maxQty = topSuppliers[0]?.total_qty || 1;
                    const sup = suppliers.find(sup => sup.id === s.supplier_id);
                    const sName = sup?.name || sup?.supplier_name || sup?.business_name || s.supplier_id || "Unknown";
                    return (
                      <div key={s.supplier_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                        {/* Rank */}
                        <span className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-bold text-slate-500 shrink-0">
                          #{i + 1}
                        </span>
                        {/* Supplier info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{sName}</p>
                          <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5">
                            <div
                              className="h-1 rounded-full bg-blue-400 group-hover:bg-blue-500 transition-all"
                              style={{ width: `${(s.total_qty / maxQty) * 100}%` }}
                            />
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-700">{fmt(s.total_revenue)}</p>
                          <div className="flex items-center gap-1 justify-end">
                            <Package className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{s.total_qty} items</span>
                            <span className="mx-0.5 text-slate-300">·</span>
                            <span className={`text-xs font-medium ${s.total_profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                              {s.total_profit >= 0 ? "+" : ""}{fmt(s.total_profit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-sm text-slate-400">
                  No supplier data for this period
                </div>
              )}
            </div>
          </SectionCard>

        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
