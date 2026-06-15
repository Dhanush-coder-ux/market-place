import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IndianRupee, TrendingUp, ShoppingCart, Zap,
  BarChart2, ArrowUpRight, ArrowDownRight, Package,
  Calendar, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { SectionCard } from "../components/SectionCard";
import { CustomTooltip } from "../components/CustomTooltip";
import { useApi } from "../../../context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "../../../services/endpoints";
import { CATEGORIES } from "../../../utils/constants";
import { ReusableSelect } from "../../../components/ui/ReusableSelect";

// ── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtShort = (n: number) => {
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

  // ── Fetch Suppliers and Categories for Filter ──
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await getData(`${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}?limit=100`);
        if (res?.data) {
          const arr = Array.isArray(res.data) ? res.data : (res.data.datas || []);
          setSuppliers(arr);
        }
      } catch (e) {}
    };

    const fetchCustomCategories = async () => {
      try {
        const res = await getData(`${ENDPOINTS.UTILITIES}/dropdowns/custom/by/name/${SHOP_ID}/categories`);
        if (res?.data?.values) {
          // Parse values if it's a stringified JSON array
          const parsedValues = typeof res.data.values === 'string' 
            ? JSON.parse(res.data.values) 
            : res.data.values;
          setCustomCategories(Array.isArray(parsedValues) ? parsedValues : []);
        }
      } catch (e) {}
    };

    fetchSuppliers();
    fetchCustomCategories();
  }, [getData]);

  const allCategories = useMemo(() => {
    const combined = [...CATEGORIES, ...customCategories];
    return Array.from(new Set(combined));
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
        start_date: formatDateParam(dateRange.start),
        end_date: formatDateParam(dateRange.end),
      };
      if (selectedSupplier) queryParams.supplier_id = selectedSupplier;
      if (selectedCategory) queryParams.category = selectedCategory;

      const res = await getData(
        `${ENDPOINTS.ORDERS}/stats/dashboard/${SHOP_ID}`,
        queryParams,
        { cacheKey: `dashboard-${activeRange}-${dateRange.start.getTime()}-${selectedSupplier}-${selectedCategory}` }
      );
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [getData, dateRange, activeRange, selectedSupplier, selectedCategory]);

  useEffect(() => {
    if (activeRange !== "custom" || (customStart && customEnd)) {
      fetchStats();
    }
  }, [fetchStats, activeRange, customStart, customEnd, selectedSupplier, selectedCategory]);

  // ── Derived metrics ──
  const totalOrders = stats?.total_orders ?? 0;
  const grossRevenue = stats?.gross_revenue ?? 0;
  const netRevenue = stats?.net_revenue ?? 0;
  const totalProfit = stats?.total_profit ?? 0;
  const totalCost = stats?.total_cost ?? 0;
  const aov = stats?.avg_order_value ?? 0;
  const grossMargin = stats?.gross_margin_pct ?? 0;
  const totalReturnsValue = stats?.total_returns_value ?? 0;
  const totalReturnsCount = stats?.total_returns_count ?? 0;
  const totalExchangesCount = stats?.total_exchanges_count ?? 0;
  const paymentBreakdown = stats?.payment_breakdown ?? [];
  const topProducts = stats?.top_products ?? [];
  const dailyTrend = stats?.daily_trend ?? [];

  // Format daily trend for chart
  const chartData = dailyTrend.map((d: any) => ({
    date: d.date?.substring(5) || "", // MM-DD
    revenue: d.revenue,
    profit: d.profit,
    orders: d.orders,
  }));

  const salesByCategory = stats?.sales_by_category ?? [];
  const topSuppliers = stats?.top_suppliers ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-5">

        {/* ── TOP BAR: Title + Range Selector ── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
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
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeRange === r
                        ? "bg-white text-blue-600 shadow-sm"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Net Revenue */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-start justify-between mb-3">
              <p className="text-slate-500 text-sm font-medium">Net Revenue</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50">
                <IndianRupee className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-2xl font-semibold text-slate-800 tracking-tight">
                {loading ? "—" : fmtShort(netRevenue)}
              </span>
              {totalReturnsValue > 0 && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-md mb-0.5 text-rose-500 bg-rose-50">
                  -{fmt(totalReturnsValue)} returns
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Gross: {fmt(grossRevenue)}
            </p>
          </div>

          {/* Total Profit */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-start justify-between mb-3">
              <p className="text-slate-500 text-sm font-medium">Total Profit</p>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${totalProfit >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
                <TrendingUp className={`w-5 h-5 ${totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`} />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className={`text-2xl font-semibold tracking-tight ${totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {loading ? "—" : fmtShort(totalProfit)}
              </span>
              {totalProfit >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-500 mb-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-500 mb-1" />
              )}
            </div>
            <p className="text-xs text-slate-400">
              Cost: {fmt(totalCost)}
            </p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-start justify-between mb-3">
              <p className="text-slate-500 text-sm font-medium">Total Orders</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-2xl font-semibold text-slate-800 tracking-tight">
                {loading ? "—" : totalOrders.toLocaleString()}
              </span>
              <div className="flex gap-1 flex-wrap">
                {totalReturnsCount > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-md mb-0.5 text-rose-500 bg-rose-50">
                    {totalReturnsCount} returns
                  </span>
                )}
                {totalExchangesCount > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-md mb-0.5 text-blue-500 bg-blue-50">
                    {totalExchangesCount} exchanges
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {RANGE_LABELS[activeRange]}
            </p>
          </div>

          {/* AOV */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-start justify-between mb-3">
              <p className="text-slate-500 text-sm font-medium">Avg. Order Value</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-50">
                <Zap className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-2xl font-semibold text-slate-800 tracking-tight">
                {loading ? "—" : fmt(aov)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Revenue / Orders
            </p>
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
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${totalProfit >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
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
