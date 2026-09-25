import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IndianRupee,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Package,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { useToast } from "@/context/ToastContext";
import { useNotifications } from "@/context/NotificationContext";
import { apiClient } from "@/services/api/apiClient";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { CustomTooltip } from "../components/CustomTooltip";
import { SectionCard } from "../components/SectionCard";
import { ReusableSelect } from "@/components/ui/ReusableSelect";

// ── TYPES ────────────────────────────────────────────────────────────────────

export interface UnifiedDashboardResponse {
  overview?: {
    supplier?: {
      shop_id?: string;
      total_cleared_amounts?: number;
      total_outstandings?: number;
      total_suppliers?: number;
    };
    customer?: {
      shop_id?: string;
      total_cleared_amounts?: number;
      total_credit_limits?: number;
      total_customers?: number;
      total_outstandings?: number;
      total_settlements?: number;
    };
    purchase?: {
      shop_id?: string;
      total_outstanding_amounts?: number;
      total_purchase?: number;
      total_purchase_amounts?: number;
      total_purchase_stocks?: number;
    };
    inventory?: {
      shop_id?: string;
      total_active_products?: number;
      total_inactive_product?: number;
      total_low_stocks?: number;
      total_no_stocks?: number;
      total_non_tracking_products?: number;
      total_stocks?: number;
    };
    stock_adjustment?: {
      shop_id?: string;
      total_stockmovadj?: number;
      total_stockmovadj_decrements?: number;
      total_stockmovadj_increments?: number;
    };
    sales?: {
      shop_id?: string;
      total_cost?: number;
      total_offline_sales?: number;
      total_offline_sales_amount?: number;
      total_online_sales?: number;
      total_online_sales_amount?: number;
      total_profit?: number;
      total_sales?: number;
      total_sales_amounts?: number;
      total_sales_stocks?: number;
    };
  };
  dashboard?: {
    supplier?: any;
    customer?: any;
    purchase?: any;
    inventory?: any;
    stock_adjustment?: any;
    sales?: any;
  };
  trends?: {
    suppliers?: any[];
    customers?: any[];
    purchases?: any[];
    stock_adjustments?: any[];
    sales?: any[];
  };
  inventory?: {
    overall?: any;
    low_stock?: any[];
    out_of_stock?: any[];
  };
  top?: {
    top_suppliers?: any[];
    top_customers?: any[];
    top_products?: any[];
  };
}

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

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AnalyticsDashboard = () => {
  const { analytics } = useBusinessApi();

  const [activeRange, setActiveRange] = useState<RangeKey>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState<UnifiedDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();

  const { latestNotification } = useNotifications();

  const handleSync = async () => {
    setIsSyncing(true);
    const userId = localStorage.getItem("user_id") || "";
    try {
      await apiClient.post(`${ENDPOINTS.ANALYTICS_DASHBOARD}sync?shop_id=${SHOP_ID}&user_id=${userId}`, {});
      showToast("Sync started in background. You will receive a notification when finished.", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to start sync", "error");
    } finally {
      setIsSyncing(false);
    }
  };



  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  // Fetch product list for names mapping
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}?limit=100`);
        if (res?.data) {
          const arr = Array.isArray(res.data) ? res.data : (res.data.datas || []);
          setProductsList(arr);
        }
      } catch (e) { }
    };
    fetchProducts();
  }, []);

  // ── Fetch Suppliers and Categories for Filter ──
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await apiClient.get(`${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}?limit=100`);
        if (res?.data) {
          const arr = Array.isArray(res.data) ? res.data : (res.data.datas || []);
          setSuppliers(arr);
        }
      } catch (e) { }
    };

    fetchSuppliers();
    const fetchCustomCategories = async () => {
      try {
        const res = await apiClient.get(`${ENDPOINTS.SHOP_CATEGORIES}`, { shop_id: SHOP_ID });
        if (res?.data) {
          const arr = Array.isArray(res.data) ? res.data : (res.data.datas || []);
          const names = arr.map((c: any) => c.name).filter(Boolean);
          setCustomCategories(names);
        }
      } catch (e) { }
    };
    fetchCustomCategories();
  }, []);

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

      const res = await analytics.getUnifiedDashboard(queryParams);
      if (res) {
        setStats(res.data || res);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [analytics, dateRange, selectedSupplier]);

  useEffect(() => {
    if (activeRange !== "custom" || (customStart && customEnd)) {
      fetchStats();
    }
  }, [fetchStats, activeRange, customStart, customEnd, selectedSupplier]);

  // Automatically refresh dashboard data when sync notification is received
  useEffect(() => {
    if (
      latestNotification &&
      (latestNotification.additional_metadata?.type === "analytics_sync" ||
       latestNotification.title?.toLowerCase().includes("sync"))
    ) {
      fetchStats();
    }
  }, [latestNotification, fetchStats]);

  // ── Derived metrics ──
  const salesOverall = stats?.overview?.sales ?? {};
  const purchaseOverall = stats?.overview?.purchase ?? {};
  const customerOverall = stats?.overview?.customer ?? {};

  const totalOrders = salesOverall.total_sales ?? 0;
  const netRevenue = salesOverall.total_sales_amounts ?? 0;
  const totalCost = salesOverall.total_cost ?? 0;

  const totalPurchaseAmount = purchaseOverall.total_purchase_amounts ?? 0;
  const totalPurchaseCount = purchaseOverall.total_purchase ?? 0;
  const totalPurchaseStocks = purchaseOverall.total_purchase_stocks ?? 0;
  const totalPurchaseOutstanding = purchaseOverall.total_outstanding_amounts ?? 0;

  const totalProfit = salesOverall.total_profit ?? Math.max(0, netRevenue - totalCost);
  const aov = totalOrders > 0 ? netRevenue / totalOrders : 0;
  const grossMargin = netRevenue > 0 ? (totalProfit / netRevenue) * 100 : 0;
  
  const customerOutstanding = customerOverall.total_outstandings ?? 0;
  const receivedAmount = Math.max(0, netRevenue - customerOutstanding);

  const totalReturnsCount = 0;

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
    const salesTrend = (stats?.trends?.sales && stats.trends.sales.length > 0)
      ? stats.trends.sales
      : (stats?.dashboard?.sales?.trend || []);

    const purchaseTrend = (stats?.trends?.purchases && stats.trends.purchases.length > 0)
      ? stats.trends.purchases
      : (stats?.dashboard?.purchase?.trend || []);

    const map: Record<string, any> = {};

    salesTrend.forEach((s: any) => {
      const date = s._id || s.date || "";
      if (!date) return;
      map[date] = {
        date,
        revenue: s.total_sales_amounts || 0,
        orders: s.total_sales || 0,
        profit: s.total_profit || ((s.total_sales_amounts || 0) - (s.total_cost || 0)),
        purchases: 0,
      };
    });

    purchaseTrend.forEach((p: any) => {
      const date = p._id || p.date || "";
      if (!date) return;
      if (!map[date]) {
        map[date] = {
          date,
          revenue: 0,
          orders: 0,
          profit: 0,
          purchases: p.total_purchase_amounts || 0,
        };
      } else {
        map[date].purchases = p.total_purchase_amounts || 0;
      }
    });

    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [stats]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const offlineAmt = salesOverall.total_offline_sales_amount ?? 0;
    const onlineAmt = salesOverall.total_online_sales_amount ?? 0;
    const offlineCount = salesOverall.total_offline_sales ?? 0;
    const onlineCount = salesOverall.total_online_sales ?? 0;

    const data = [];
    if (offlineAmt > 0 || offlineCount > 0) {
      data.push({ name: "Offline", value: offlineAmt, count: offlineCount, color: "#10b981" });
    }
    if (onlineAmt > 0 || onlineCount > 0) {
      data.push({ name: "Online", value: onlineAmt, count: onlineCount, color: "#3b82f6" });
    }
    if (data.length === 0) {
      data.push({ name: "Offline", value: 0, count: 0, color: "#10b981" });
    }
    return data;
  }, [salesOverall]);

  // Top Products
  const topProducts = useMemo(() => {
    const raw = stats?.top?.top_products || stats?.dashboard?.inventory?.top_products || [];
    return raw.map((p: any) => {
      const pName = productNameMap[p.product_id] || p.product_name || p.name || p.product_id || "Product";
      const totalQty = p.total_sales_stocks ?? p.stocks ?? 0;
      const totalRev = p.total_sales_amounts ?? p.total_revenue ?? 0;
      const totalCostVal = p.total_purchase_amounts ?? 0;
      const totalProfitVal = totalRev > 0 ? Math.max(0, totalRev - totalCostVal) : 0;
      return {
        ...p,
        name: pName,
        total_qty: totalQty,
        total_revenue: totalRev,
        total_profit: totalProfitVal,
      };
    });
  }, [stats, productNameMap]);

  // Sales by Category
  const salesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    topProducts.forEach((p: any) => {
      const prodInfo = productsList.find((prod) => prod.id === p.product_id);
      const catName = prodInfo?.categories?.[0] || prodInfo?.category || p.category || "General";
      map[catName] = (map[catName] || 0) + (p.total_revenue || 0);
    });

    if (customCategories.length > 0) {
      customCategories.forEach((cat) => {
        if (map[cat] === undefined) {
          map[cat] = 0;
        }
      });
    }

    return Object.entries(map)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [topProducts, productsList, customCategories]);

  // Top Suppliers
  const topSuppliers = useMemo(() => {
    const raw = stats?.top?.top_suppliers || stats?.dashboard?.supplier?.top_suppliers || [];
    return raw.map((s: any) => {
      const sName = supplierNameMap[s.supplier_id] || s.supplier_name || s.name || s.supplier_id || "Supplier";
      return {
        ...s,
        name: sName,
        total_revenue: s.total_purchase_amounts ?? 0,
        total_qty: s.total_purchases ?? 0,
        total_profit: s.total_outstandings ?? 0,
      };
    });
  }, [stats, supplierNameMap]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-slate-700 tracking-tight">Dashboard</h1>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                {dateRange.start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} —{" "}
                {dateRange.end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>

            {/* Time filters & Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                {(["today", "month", "year", "custom"] as RangeKey[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveRange(r)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeRange === r
                        ? "bg-white text-slate-600 shadow-xs"
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
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-slate-600" : ""}`} />
              </button>
              
              {/* Sync */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="h-9 px-4 rounded-xl bg-slate-500 flex items-center justify-center text-white font-medium text-xs hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sync Data"
              >
                <Zap className={`w-4 h-4 mr-1.5 ${isSyncing ? "animate-pulse" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync"}
              </button>
            </div>
          </div>

          {/* Custom date inputs */}
          {activeRange === "custom" && (
            <div className="px-6 pb-4 flex items-center gap-3 animate-in fade-in">
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

          {/* Filters Bar */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-4 bg-slate-50/50 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Supplier:</span>
              <div className="w-48">
                <ReusableSelect
                  value={selectedSupplier}
                  onValueChange={setSelectedSupplier}
                  options={[
                    { label: "All Suppliers", value: "" },
                    ...suppliers.map((s) => ({ label: String(s.name || s.business_name || s.id), value: s.id })),
                  ]}
                  placeholder="All Suppliers"
                  className="h-8.5 py-0 px-3 min-h-0 text-xs font-medium bg-white"
                />
              </div>
            </div>


          </div>
        </div>

        {/* ── ERROR STATE ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold">
            {error}
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Net Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Net Revenue</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Total excl. GST</p>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-slate-600 shrink-0">
                  <IndianRupee className="w-5 h-5" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-[26px] font-semibold text-slate-700 tracking-tight leading-none">
                  {loading ? "—" : fmt(netRevenue)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs font-medium text-slate-600">Received</span>
                </div>
                <span className="text-xs font-medium text-emerald-500">{fmt(receivedAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-xs font-medium text-slate-600">Outstanding</span>
                </div>
                <span className="text-xs font-medium text-amber-500">{fmt(customerOutstanding)}</span>
              </div>
            </div>
          </div>

          {/* Total Profit */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Profit</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Net earnings</p>
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${totalProfit >= 0 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"}`}>
                  <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className={`text-[26px] font-semibold tracking-tight leading-none ${totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {loading ? "—" : fmt(totalProfit)}
                </span>
                {totalProfit >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 mb-0.5" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-rose-500 mb-0.5" />
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total Cost: <span className="text-slate-700">{fmt(totalCost)}</span>
              </p>
            </div>
          </div>

          {/* Total Purchase */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Purchase</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Procurement spend</p>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0">
                  <ShoppingBag className="w-5 h-5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-[26px] font-semibold text-slate-700 tracking-tight leading-none">
                  {loading ? "—" : fmt(totalPurchaseAmount)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-400 uppercase tracking-wider">Purchases:</span>
                <span className="font-medium text-slate-700">{loading ? "—" : `${totalPurchaseCount} (${totalPurchaseStocks} stocks)`}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-400 uppercase tracking-wider">Outstanding:</span>
                <span className="font-medium text-amber-500">{loading ? "—" : fmt(totalPurchaseOutstanding)}</span>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Orders</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{RANGE_LABELS[activeRange]}</p>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-500 shrink-0">
                  <ShoppingCart className="w-5 h-5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-[26px] font-semibold text-slate-700 tracking-tight leading-none">
                  {loading ? "—" : totalOrders.toLocaleString()}
                </span>
              </div>
            </div>


          </div>

          {/* AOV */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Avg. Order Value</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Revenue / Orders</p>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-50 text-purple-500 shrink-0">
                  <Zap className="w-5 h-5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-[26px] font-semibold text-slate-700 tracking-tight leading-none">
                  {loading ? "—" : fmt(aov)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Gross Margin: <span className="text-slate-700">{loading ? "—" : `${grossMargin.toFixed(1)}%`}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── ROW 2: Sales Performance ── */}
        <div className="space-y-4">
          <h2 className="text-base font-medium text-slate-700">Sales Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart Area */}
            <div className="lg:col-span-2">
              <SectionCard title="Revenue & Profit Trend">
                <div className="p-5">
                  <div className="h-[280px] w-full">
                    {dailyTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            tickFormatter={(val) => {
                              try {
                                const parts = val.split("-");
                                return `${parts[1]}/${parts[2]}`;
                              } catch {
                                return val;
                              }
                            }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#revenueGrad)"
                          />
                          <Area
                            type="monotone"
                            dataKey="profit"
                            name="Profit"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#profitGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-400">
                        No trend data available for this range
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-5 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="font-semibold text-slate-600">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-slate-600">Profit</span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Profitability & Quick Stats */}
            <div className="space-y-4">
              {/* Profitability */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-700">Profitability</h3>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-medium">Gross Margin</p>
                <div className="flex items-baseline gap-2 mt-1 mb-3">
                  <span className="text-2xl font-semibold text-slate-700">{grossMargin.toFixed(2)}%</span>
                  <span className="text-xs font-medium text-emerald-500">Profitable</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, grossMargin))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-medium text-slate-400">
                  <span>0%</span>
                  <span>Margin: {grossMargin.toFixed(2)}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-slate-700">{totalOrders}</p>
                    <p className="text-[11px] font-semibold text-slate-500">Orders</p>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-emerald-500">{fmt(totalProfit)}</p>
                    <p className="text-[11px] font-semibold text-slate-500">Profit</p>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-amber-600">{fmtShort(aov)}</p>
                    <p className="text-[11px] font-semibold text-slate-500">AOV</p>
                  </div>
                  <div className="bg-purple-50/50 border border-purple-100/60 rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-purple-500">{totalReturnsCount}</p>
                    <p className="text-[11px] font-semibold text-slate-500">Returns</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 3: Sales by Payment & Top Selling Products ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Sales by Payment */}
          <div className="xl:col-span-1">
            <SectionCard title="Sales by Payment">
              <div className="p-5 flex flex-col justify-between h-[340px]">
                <div className="h-[180px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paymentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => fmt(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  {paymentBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-slate-700 font-medium">
                        {fmt(item.value)} <span className="text-slate-400 font-normal">({item.count})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Top Selling Products */}
          <div className="xl:col-span-2">
            <SectionCard title="Top Selling Products">
              <div className="p-5 flex flex-col justify-between min-h-[340px]">
                {topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {topProducts.slice(0, 5).map((p: any, i: number) => {
                      const maxQty = topProducts[0]?.total_qty || 1;
                      return (
                        <div key={p.product_id || i} className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50/80 transition-colors group">
                          {/* Rank */}
                          <span className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-medium text-slate-500 shrink-0">
                            #{i + 1}
                          </span>
                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{p.name}</p>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-slate-400 group-hover:bg-slate-500 transition-all"
                                style={{ width: `${Math.max(5, (p.total_qty / maxQty) * 100)}%` }}
                              />
                            </div>
                          </div>
                          {/* Stats */}
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-slate-700">{fmt(p.total_revenue)}</p>
                            <div className="flex items-center gap-1 justify-end text-[11px]">
                              <Package className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-500">{p.total_qty} sold</span>
                              <span className="text-slate-300">·</span>
                              <span className="font-semibold text-emerald-500">
                                +{fmt(p.total_profit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[160px] text-xs font-semibold text-slate-400">
                    No product data for this period
                  </div>
                )}

                {/* Bottom quick stats */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="mb-1 flex justify-center">
                      <BarChart2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-700">{grossMargin.toFixed(1)}%</p>
                    <p className="text-[10px] font-semibold text-slate-400">Gross Margin</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="mb-1 flex justify-center">
                      <ShoppingCart className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-700">{totalOrders}</p>
                    <p className="text-[10px] font-semibold text-slate-400">Total Orders</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="mb-1 flex justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-700">{fmtShort(aov)}</p>
                    <p className="text-[10px] font-semibold text-slate-400">AOV</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── ROW 4: Vendor & Category Analytics ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Sales by Category */}
          <SectionCard title="Sales by Category">
            <div className="p-5">
              {salesByCategory.length > 0 ? (
                <div className="space-y-4">
                  {salesByCategory.slice(0, 5).map((c: any) => {
                    const maxRev = salesByCategory[0]?.revenue || 1;
                    return (
                      <div key={c.category} className="group">
                        <div className="flex justify-between items-end mb-1">
                          <p className="text-xs font-medium text-slate-700">{c.category}</p>
                          <p className="text-xs font-medium text-slate-700">{fmt(c.revenue)}</p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-400 group-hover:bg-purple-500 transition-all"
                            style={{ width: `${Math.max(2, (c.revenue / maxRev) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-xs font-semibold text-slate-400">
                  No category data for this period
                </div>
              )}
            </div>
          </SectionCard>

          {/* Top Suppliers */}
          <SectionCard title="Top Suppliers by Performance">
            <div className="p-5">
              {topSuppliers.length > 0 ? (
                <div className="space-y-3">
                  {topSuppliers.map((s: any, i: number) => {
                    const maxRev = topSuppliers[0]?.total_revenue || 1;
                    return (
                      <div key={s.supplier_id || i} className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50/80 transition-colors group">
                        {/* Rank */}
                        <span className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-medium text-slate-500 shrink-0">
                          #{i + 1}
                        </span>
                        {/* Supplier info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{s.name}</p>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-slate-400 group-hover:bg-slate-500 transition-all"
                              style={{ width: `${Math.max(5, (s.total_revenue / maxRev) * 100)}%` }}
                            />
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-slate-700">{fmt(s.total_revenue)}</p>
                          <div className="flex items-center gap-1 justify-end text-[11px]">
                            <Package className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500">{s.total_qty} items</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-semibold text-amber-500">
                              +{fmt(s.total_profit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-xs font-semibold text-slate-400">
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
