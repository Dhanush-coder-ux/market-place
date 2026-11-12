import { useState, useEffect, useMemo, useCallback, FC, ReactNode } from "react";
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
  CartesianGrid,
} from "recharts";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { useToast } from "@/context/ToastContext";
import { useNotifications } from "@/context/NotificationContext";
import { apiClient } from "@/services/api/apiClient";
import { ENDPOINTS, SHOP_ID, getShopId } from "@/services/endpoints";
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

const normalizePaymentMethod = (val: string): "Cash" | "UPI" | "Card" | "Bank Transfer" | "On Credit" => {
  if (!val) return "Cash";
  const u = String(val).trim().toUpperCase();
  if (u === "CASH") return "Cash";
  if (u === "CARD" || u.includes("DEBIT") || u.includes("CREDIT_CARD") || u.includes("POS")) return "Card";
  if (u === "UPI" || u === "GPAY" || u === "G-PAY" || u === "PHONEPE" || u === "PAYTM" || u === "QR") return "UPI";
  if (u.includes("BANK") || u === "NEFT" || u === "RTGS" || u === "IMPS" || u.includes("NETBANKING")) return "Bank Transfer";
  if (u === "CREDIT" || u === "ON_CREDIT" || u === "ON CREDIT" || u.includes("CREDIT")) return "On Credit";
  return "Cash";
};

const formatDateParam = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ── DATE RANGES ──────────────────────────────────────────────────────────────

type RangeKey = "today" | "month" | "year" | "all" | "custom";

const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  month: "This Month",
  year: "This Year",
  all: "All Time",
  custom: "Custom",
};

const getRangeDate = (key: RangeKey): { start: Date; end: Date } | null => {
  const now = new Date();
  switch (key) {
    case "today":
      return { start: startOfDay(now), end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59) };
    case "month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1, 0, 0, 0), end: new Date(now.getFullYear(), 11, 31, 23, 59, 59) };
    case "all":
      return null;
    case "custom":
      return { start: startOfDay(now), end: now };
  }
};

// ── ENHANCED SUB-COMPONENTS ──────────────────────────────────────────────────

const SectionCard: FC<{ title: string; children: ReactNode; action?: ReactNode }> = ({
  title,
  children,
  action,
}) => (
  <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-200">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EAF0] bg-white">
      <h3 className="font-semibold text-[#27364B] text-sm tracking-tight">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const TrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E5EAF0] text-xs rounded-lg px-3.5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <p className="font-semibold text-[#27364B] mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke || p.color }} />
                <span className="text-[#74839A] font-medium">{p.name}</span>
              </div>
              <span className="font-semibold text-[#27364B] tabular-nums">
                ₹{Number(p.value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const PaymentTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-[#E5EAF0] text-xs rounded-lg px-3.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload?.color }} />
          <span className="font-semibold text-[#27364B]">{data.name}</span>
        </div>
        <div className="space-y-0.5 text-[11px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#74839A]">Amount:</span>
            <span className="font-semibold text-[#27364B] tabular-nums">{fmt(data.value)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#74839A]">Orders:</span>
            <span className="font-semibold text-[#27364B] tabular-nums">{data.payload?.count ?? 0}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
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

  const getActiveShopId = useCallback(() => {
    return localStorage.getItem("shop_id") || getShopId() || SHOP_ID || "";
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    const userId = localStorage.getItem("user_id") || "";
    const shopId = getActiveShopId();
    try {
      await apiClient.post(`${ENDPOINTS.ANALYTICS_DASHBOARD}sync?shop_id=${shopId}&user_id=${userId}`, {});
      showToast("Sync started in background. You will receive a notification when finished.", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to start sync", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  const [ordersList, setOrdersList] = useState<any[]>([]);

  const fetchOrders = useCallback(async () => {
    const shopId = getActiveShopId();
    if (!shopId) return;
    try {
      const res = await apiClient.get(`${ENDPOINTS.ORDERS}/${shopId}?limit=100`);
      if (res?.data) {
        const arr = Array.isArray(res.data) ? res.data : (res.data.datas || res.data.orders || []);
        setOrdersList(arr);
      }
    } catch (e) { }
  }, [getActiveShopId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch product list for names mapping
  useEffect(() => {
    const fetchProducts = async () => {
      const shopId = getActiveShopId();
      if (!shopId) return;
      try {
        const res = await apiClient.get(`${ENDPOINTS.INVENTORIES}/by/shop/${shopId}?limit=100`);
        if (res?.data) {
          const arr = Array.isArray(res.data) ? res.data : (res.data.datas || []);
          setProductsList(arr);
        }
      } catch (e) { }
    };
    fetchProducts();
  }, [getActiveShopId]);

  // ── Fetch Suppliers for Filter ──
  useEffect(() => {
    const shopId = getActiveShopId();
    if (!shopId) return;
    const fetchSuppliers = async () => {
      try {
        const res = await apiClient.get(`${ENDPOINTS.SUPPLIERS}/by/shop/${shopId}?limit=100`);
        if (res?.data) {
          const arr = Array.isArray(res.data) ? res.data : (res.data.datas || []);
          setSuppliers(arr);
        }
      } catch (e) { }
    };

    fetchSuppliers();
  }, [getActiveShopId]);

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
      const shopId = getActiveShopId();
      const queryParams: Record<string, string> = {
        shop_id: shopId,
      };
      if (dateRange?.start && dateRange?.end) {
        queryParams.start_date = formatDateParam(dateRange.start);
        queryParams.end_date = formatDateParam(dateRange.end);
      }
      if (selectedSupplier) queryParams.supplier_id = selectedSupplier;

      fetchOrders();
      const res = await analytics.getUnifiedDashboard(queryParams);
      if (res) {
        setStats(res.data || res.datas || res);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [analytics, dateRange, selectedSupplier, getActiveShopId, fetchOrders]);

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
  const salesOverall = stats?.overview?.sales ?? stats?.dashboard?.sales?.overall ?? stats?.dashboard?.sales ?? (stats as any)?.sales?.overall ?? (stats as any)?.sales ?? {};
  const purchaseOverall = stats?.overview?.purchase ?? stats?.dashboard?.purchase?.overall ?? stats?.dashboard?.purchase ?? (stats as any)?.purchase?.overall ?? (stats as any)?.purchase ?? {};
  const customerOverall = stats?.overview?.customer ?? stats?.dashboard?.customer?.overall ?? stats?.dashboard?.customer ?? (stats as any)?.customer?.overall ?? (stats as any)?.customer ?? {};
  const supplierOverall = stats?.overview?.supplier ?? stats?.dashboard?.supplier?.overall ?? stats?.dashboard?.supplier ?? (stats as any)?.supplier?.overall ?? (stats as any)?.supplier ?? {};

  const topProductsRaw = (stats?.top?.top_products || stats?.dashboard?.inventory?.top_products || (stats as any)?.inventory?.top_products || (stats as any)?.top_products || [])
    .filter((p: any) => Number(p.total_sales_amounts || p.total_revenue || 0) > 0 || Number(p.total_sales_stocks || 0) > 0);
  const topSuppliersRaw = (stats?.top?.top_suppliers || stats?.dashboard?.supplier?.top_suppliers || (stats as any)?.supplier?.top_suppliers || (stats as any)?.top_suppliers || [])
    .filter((s: any) => Number(s.total_purchase_amounts || s.total_purchases || 0) > 0);

  const topProductsTotalSales = topProductsRaw.reduce((sum: number, p: any) => sum + Number(p.total_sales_amounts || p.total_offline_sales_amount || p.total_revenue || 0), 0);
  const topProductsTotalOrders = topProductsRaw.reduce((sum: number, p: any) => sum + Number(p.total_offline_sales || 0) + Number(p.total_online_sales || 0) || (Number(p.total_sales_stocks || 0) > 0 ? 1 : 0), 0);

  const topSuppliersTotalPurchase = topSuppliersRaw.reduce((sum: number, s: any) => sum + Number(s.total_purchase_amounts || s.total_cleared_amounts || 0), 0) || Number(supplierOverall.total_cleared_amounts || 0);
  const topSuppliersTotalPurchasesCount = topSuppliersRaw.reduce((sum: number, s: any) => sum + Number(s.total_purchases || 0), 0) || (topSuppliersTotalPurchase > 0 ? 1 : 0);

  const isFiltered = activeRange !== "all";

  const totalOrders = isFiltered
    ? Number(salesOverall.total_sales ?? 0)
    : ((salesOverall.total_sales && salesOverall.total_sales > 0) ? salesOverall.total_sales : topProductsTotalOrders);

  const netRevenue = isFiltered
    ? Number(salesOverall.total_sales_amounts ?? 0)
    : ((salesOverall.total_sales_amounts && salesOverall.total_sales_amounts > 0) ? salesOverall.total_sales_amounts : topProductsTotalSales);

  const totalCost = Number(salesOverall.total_cost ?? 0);

  const totalPurchaseAmount = isFiltered
    ? Number(purchaseOverall.total_purchase_amounts ?? 0)
    : ((purchaseOverall.total_purchase_amounts && purchaseOverall.total_purchase_amounts > 0) ? purchaseOverall.total_purchase_amounts : topSuppliersTotalPurchase);

  const totalPurchaseCount = isFiltered
    ? Number(purchaseOverall.total_purchase ?? 0)
    : ((purchaseOverall.total_purchase && purchaseOverall.total_purchase > 0) ? purchaseOverall.total_purchase : topSuppliersTotalPurchasesCount);
  const totalPurchaseStocks = purchaseOverall.total_purchase_stocks ?? 0;
  const totalPurchaseOutstanding = purchaseOverall.total_outstanding_amounts || supplierOverall.total_outstandings || 0;

  const totalProfit = salesOverall.total_profit !== undefined ? Number(salesOverall.total_profit) : (netRevenue - totalCost);
  const aov = totalOrders > 0 ? netRevenue / totalOrders : 0;
  const grossMargin = netRevenue > 0 ? (totalProfit / netRevenue) * 100 : 0;
  
  const customerOutstanding = Number(customerOverall?.total_outstandings ?? 0);
  const receivedAmount = useMemo(() => {
    if (ordersList.length > 0) {
      const filtered = ordersList.filter((o: any) => {
        const st = String(o?.status || "").toUpperCase();
        if (st === "CANCELLED" || st === "CANCELED") return false;
        if (!dateRange?.start || !dateRange?.end) return true;
        const oDate = new Date(o.created_at || o.date || 0);
        return oDate >= dateRange.start && oDate <= dateRange.end;
      });

      let sumReceived = 0;
      let hasCompletedOrders = false;
      filtered.forEach((o: any) => {
        const calcInfo = o.calculation_infos || {};
        const total = Number(
          calcInfo.grand_total ??
          calcInfo.total ??
          o.item_infos?.total_order_amount ??
          o.total_sellprice ??
          o.total_amount ??
          o.total ??
          0
        );

        const pInfos = o.payment_infos || o.payments || {};
        let orderReceived = 0;
        let isCredit = false;

        if (typeof pInfos === "object" && !Array.isArray(pInfos) && Object.keys(pInfos).length > 0) {
          Object.entries(pInfos).forEach(([k, v]) => {
            const amt = Number(typeof v === "object" ? (v as any)?.amount : v) || 0;
            if (normalizePaymentMethod(k) !== "On Credit") {
              orderReceived += amt;
            } else {
              isCredit = true;
            }
          });
        } else if (Array.isArray(pInfos) && pInfos.length > 0) {
          pInfos.forEach((p: any) => {
            const m = typeof p === "string" ? p : (p.method || p.payment_method || p.mode || "");
            const amt = Number(p.amount) || total;
            if (normalizePaymentMethod(m) !== "On Credit") {
              orderReceived += amt;
            } else {
              isCredit = true;
            }
          });
        } else if (o.payment_method || o.payment_mode) {
          if (normalizePaymentMethod(o.payment_method || o.payment_mode) !== "On Credit") {
            orderReceived = total;
          } else {
            isCredit = true;
          }
        } else {
          orderReceived = total;
        }

        if (orderReceived <= 0 && !isCredit && total > 0) {
          orderReceived = total;
        }
        sumReceived += orderReceived;
        hasCompletedOrders = true;
      });

      if (hasCompletedOrders && sumReceived > 0) return sumReceived;
    }

    if (salesOverall.total_received_amount && salesOverall.total_received_amount > 0) {
      return Number(salesOverall.total_received_amount);
    }
    if (salesOverall.total_bill_amount && salesOverall.total_bill_amount > 0) {
      return Number(salesOverall.total_bill_amount);
    }

    return Number(customerOverall?.total_cleared_amounts ?? Math.max(0, netRevenue - customerOutstanding));
  }, [ordersList, dateRange, salesOverall, customerOverall, customerOutstanding, netRevenue]);

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
    let salesTrend = (stats?.trends?.sales && stats.trends.sales.length > 0)
      ? stats.trends.sales
      : (stats?.dashboard?.sales?.trend || []);

    let purchaseTrend = (stats?.trends?.purchases && stats.trends.purchases.length > 0)
      ? stats.trends.purchases
      : (stats?.dashboard?.purchase?.trend || []);

    // Fallback if sales/purchase trends are empty but data exists
    if (salesTrend.length === 0 && netRevenue > 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      salesTrend = [{ _id: todayStr, date: todayStr, total_sales_amounts: netRevenue, total_sales: totalOrders, total_profit: totalProfit }];
    }

    if (purchaseTrend.length === 0) {
      const supTrend = stats?.trends?.suppliers || stats?.dashboard?.supplier?.trend || [];
      if (supTrend.length > 0) {
        purchaseTrend = supTrend.map((st: any) => ({
          _id: st._id || st.date,
          date: st._id || st.date,
          total_purchase_amounts: st.total_cleared_amounts || st.total_purchase_amounts || 0,
        }));
      } else if (totalPurchaseAmount > 0) {
        const todayStr = new Date().toISOString().split("T")[0];
        purchaseTrend = [{ _id: todayStr, date: todayStr, total_purchase_amounts: totalPurchaseAmount }];
      }
    }

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
  }, [stats, netRevenue, totalOrders, totalProfit, totalPurchaseAmount]);

  // Payment Breakdown with Brand Palette
  const paymentBreakdown = useMemo(() => {
    const backendBreakdown = salesOverall.payment_breakdown || (stats?.dashboard?.sales as any)?.payment_breakdown;

    const counts: Record<string, { name: string; value: number; count: number; color: string }> = {
      Cash: { name: "Cash", value: 0, count: 0, color: "#286038" },
      UPI: { name: "UPI", value: 0, count: 0, color: "#0D9F6E" },
      Card: { name: "Card", value: 0, count: 0, color: "#27364B" },
      "Bank Transfer": { name: "Bank Transfer", value: 0, count: 0, color: "#88B878" },
      "On Credit": { name: "On Credit", value: 0, count: 0, color: "#D69A35" },
    };

    if (ordersList.length > 0) {
      const filtered = ordersList.filter((o: any) => {
        const st = String(o?.status || "").toUpperCase();
        if (st === "CANCELLED" || st === "CANCELED") return false;
        if (!dateRange?.start || !dateRange?.end) return true;
        const oDate = new Date(o.created_at || o.date || 0);
        return oDate >= dateRange.start && oDate <= dateRange.end;
      });

      filtered.forEach((o: any) => {
        const calcInfo = o.calculation_infos || {};
        const total = Number(
          calcInfo.grand_total ??
          calcInfo.total ??
          o.item_infos?.total_order_amount ??
          o.total_sellprice ??
          o.total_amount ??
          o.total ??
          0
        );

        const pInfos = o.payment_infos || o.payments || {};
        if (typeof pInfos === "object" && !Array.isArray(pInfos) && Object.keys(pInfos).length > 0) {
          Object.entries(pInfos).forEach(([k, v]) => {
            const amt = Number(typeof v === "object" ? (v as any)?.amount : v) || 0;
            const norm = normalizePaymentMethod(k);
            if (counts[norm]) {
              counts[norm].value += amt;
              counts[norm].count += 1;
            }
          });
        } else if (Array.isArray(pInfos) && pInfos.length > 0) {
          pInfos.forEach((p: any) => {
            const m = typeof p === "string" ? p : (p.method || p.payment_method || p.mode || "");
            const amt = Number(p.amount) || total;
            const norm = normalizePaymentMethod(m);
            if (counts[norm]) {
              counts[norm].value += amt;
              counts[norm].count += 1;
            }
          });
        } else if (o.payment_method || o.payment_mode) {
          const norm = normalizePaymentMethod(o.payment_method || o.payment_mode);
          if (counts[norm]) {
            counts[norm].value += total;
            counts[norm].count += 1;
          }
        } else {
          counts["Cash"].value += total;
          counts["Cash"].count += 1;
        }
      });
    } else if (Array.isArray(backendBreakdown) && backendBreakdown.length > 0) {
      backendBreakdown.forEach((item: any) => {
        const norm = normalizePaymentMethod(item.name || item._id);
        if (counts[norm]) {
          counts[norm].value += Number(item.amount ?? item.value ?? 0);
          counts[norm].count += Number(item.count ?? 0);
        }
      });
    }

    const active = Object.values(counts).filter((c) => c.value > 0 || c.count > 0);
    if (active.length === 0) {
      return [{ name: "Cash", value: 0, count: 0, color: "#286038" }];
    }
    return active;
  }, [ordersList, dateRange, salesOverall, stats]);

  // Top Products
  const topProducts = useMemo(() => {
    if (ordersList.length > 0) {
      const filtered = ordersList.filter((o: any) => {
        const st = String(o?.status || "").toUpperCase();
        if (st === "CANCELLED" || st === "CANCELED") return false;
        if (!dateRange?.start || !dateRange?.end) return true;
        const oDate = new Date(o.created_at || o.date || 0);
        return oDate >= dateRange.start && oDate <= dateRange.end;
      });

      const prodMap: Record<string, { product_id: string; name: string; total_qty: number; total_revenue: number; total_profit: number }> = {};
      filtered.forEach((o: any) => {
        const items = o.items || [];
        items.forEach((item: any) => {
          const pid = item.product_id || item.inventory_id || item.id;
          if (!pid) return;
          const name = productNameMap[pid] || item.name || "Product";
          const qty = Number(item.quantity ?? item.stocks ?? 1);
          const rev = Number(item.total_amount ?? (Number(item.sell_price || 0) * qty));
          const rawBuyPrice = Number(item.cost_at_sale ?? item.costPrice ?? item.buy_price ?? 0);
          const rawGst = Number(String(item.gst ?? item.gst_rate ?? "0").replace(/[^0-9.]/g, "")) || 0;
          const buyPriceWithGst = rawGst > 0 && rawBuyPrice > 0 ? (rawBuyPrice + Math.round((rawBuyPrice * (rawGst / 100)) * 100) / 100) : rawBuyPrice;
          const cost = item.cost_amounts !== undefined ? Number(item.cost_amounts) : (buyPriceWithGst * qty);
          const profit = item.profit_amounts !== undefined ? Number(item.profit_amounts) : (rev - cost);

          if (!prodMap[pid]) {
            prodMap[pid] = { product_id: pid, name, total_qty: 0, total_revenue: 0, total_profit: 0 };
          }
          prodMap[pid].total_qty += qty;
          prodMap[pid].total_revenue += rev;
          prodMap[pid].total_profit += profit;
        });
      });

      const list = Object.values(prodMap)
        .filter((p) => p.total_qty > 0 || p.total_revenue > 0)
        .sort((a, b) => {
          if (b.total_qty !== a.total_qty) {
            return b.total_qty - a.total_qty;
          }
          return b.total_revenue - a.total_revenue;
        });
      if (list.length > 0) return list;
    }

    const raw = stats?.top?.top_products || stats?.dashboard?.inventory?.top_products || [];
    return raw
      .map((p: any) => {
        const pName = productNameMap[p.product_id] || p.product_name || p.name || p.product_id || "Product";
        const totalQty = Number(p.total_sales_stocks ?? (p.total_sales_amounts ? 1 : 0));
        const totalRev = Number(p.total_sales_amounts ?? p.total_revenue ?? 0);
        const totalCostVal = Number(p.total_purchase_amounts ?? 0);
        const totalProfitVal = totalRev > 0 ? (totalRev - totalCostVal) : 0;
        return {
          ...p,
          name: pName,
          total_qty: totalQty,
          total_revenue: totalRev,
          total_profit: totalProfitVal,
        };
      })
      .filter((p: any) => p.total_qty > 0 || p.total_revenue > 0)
      .sort((a: any, b: any) => {
        if (b.total_qty !== a.total_qty) {
          return b.total_qty - a.total_qty;
        }
        return b.total_revenue - a.total_revenue;
      });
  }, [ordersList, dateRange, stats, productNameMap]);

  // Sales by Category
  const salesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    topProducts.forEach((p: any) => {
      const prodInfo = productsList.find((prod) => prod.id === p.product_id);
      const catName = prodInfo?.categories?.[0] || prodInfo?.category || p.category || "General";
      map[catName] = (map[catName] || 0) + (p.total_revenue || 0);
    });

    return Object.entries(map)
      .filter(([_, revenue]) => revenue > 0)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [topProducts, productsList]);

  // Top Suppliers
  const topSuppliers = useMemo(() => {
    const raw = stats?.top?.top_suppliers || stats?.dashboard?.supplier?.top_suppliers || [];
    return raw
      .map((s: any) => {
        const sName = supplierNameMap[s.supplier_id] || s.supplier_name || s.name || s.supplier_id || "Supplier";
        return {
          ...s,
          name: sName,
          total_revenue: s.total_purchase_amounts ?? 0,
          total_qty: s.total_purchases ?? 0,
          total_profit: s.total_outstandings ?? 0,
        };
      })
      .filter((s: any) => (s.total_revenue > 0 || s.total_qty > 0));
  }, [stats, supplierNameMap]);

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#27364B] p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ── HEADER / FILTER CONTROL BAR ── */}
        <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-5 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#27364B] tracking-tight">Dashboard</h1>
              <p className="text-xs font-medium text-[#74839A] mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#74839A] shrink-0" />
                <span>
                  {activeRange === "all"
                    ? "All Time Overview"
                    : dateRange?.start && dateRange?.end
                    ? `${dateRange.start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — ${dateRange.end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                    : "All Time Overview"}
                </span>
              </p>
            </div>

            {/* Time filters & Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Segmented Range Control */}
              <div className="bg-[#F1F4F7] p-1 rounded-lg border border-[#E5EAF0] flex items-center gap-0.5">
                {(["today", "month", "year", "all", "custom"] as RangeKey[]).map((r) => {
                  const isActive = activeRange === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setActiveRange(r)}
                      className={`px-3 py-1.5 rounded-md text-xs transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-white text-[#103020] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                          : "text-[#74839A] hover:text-[#27364B] hover:bg-white/50 font-medium"
                      }`}
                    >
                      {RANGE_LABELS[r]}
                    </button>
                  );
                })}
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchStats}
                className="w-9 h-9 rounded-lg border border-[#E5EAF0] bg-white text-[#74839A] hover:text-[#27364B] hover:bg-[#F7F9FA] hover:border-[#D1D9E2] flex items-center justify-center transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95 cursor-pointer"
                title="Refresh dashboard data"
                aria-label="Refresh dashboard data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#286038]" : ""}`} />
              </button>
              
              {/* Sync Button */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="h-9 px-3.5 rounded-lg bg-[#286038] hover:bg-[#103020] text-white font-medium text-xs flex items-center justify-center transition-all duration-150 shadow-[0_1px_2px_rgba(40,96,56,0.2)] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sync Data"
              >
                <Zap className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? "animate-pulse" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync"}</span>
              </button>
            </div>
          </div>

          {/* Custom date inputs when Custom is active */}
          {activeRange === "custom" && (
            <div className="px-5 md:px-6 pb-4 pt-1 flex items-center gap-3 border-t border-[#E5EAF0] bg-[#FDFEFE] flex-wrap animate-in fade-in duration-150">
              <span className="text-xs font-medium text-[#74839A]">Custom Range:</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-xs font-medium text-[#27364B] bg-white focus:outline-none focus:ring-2 focus:ring-[#88B878]/30 focus:border-[#286038] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                />
                <span className="text-xs text-[#74839A] font-medium">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-xs font-medium text-[#27364B] bg-white focus:outline-none focus:ring-2 focus:ring-[#88B878]/30 focus:border-[#286038] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                />
              </div>
            </div>
          )}

          {/* Supplier Filter Bar */}
          <div className="px-5 md:px-6 py-3 border-t border-[#E5EAF0] flex items-center justify-between gap-4 bg-[#FDFEFE] flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-[#74839A]">Filter by Supplier:</span>
              <div className="w-52">
                <ReusableSelect
                  value={selectedSupplier}
                  onValueChange={setSelectedSupplier}
                  options={[
                    { label: "All Suppliers", value: "" },
                    ...suppliers.map((s) => ({ label: String(s.name || s.business_name || s.id), value: s.id })),
                  ]}
                  placeholder="All Suppliers"
                  className="h-8.5 py-0 px-3 min-h-0 text-xs font-medium bg-white border-[#E5EAF0] text-[#27364B] focus:ring-[#88B878]/20 focus:border-[#286038] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                />
              </div>
            </div>

            {selectedSupplier && (
              <button
                onClick={() => setSelectedSupplier("")}
                className="text-xs text-[#286038] hover:text-[#103020] font-medium hover:underline transition-colors cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* ── ERROR STATE ── */}
        {error && (
          <div className="bg-[#FDF2F2] border border-[#DC6464]/30 rounded-xl px-4 py-3 text-sm text-[#DC6464] font-medium flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchStats}
              className="text-xs font-semibold text-[#DC6464] hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── STAT CARDS (5 KPIs) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          
          {/* 1. Net Revenue */}
          <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1D9E2] transition-all duration-200 group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A]">Net Revenue</h3>
                  <p className="text-xs text-[#74839A] font-medium mt-0.5">Total excl. GST</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#EAF2E8] text-[#286038] shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <IndianRupee className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-[26px] font-semibold text-[#27364B] tracking-tight leading-none tabular-nums truncate" title={fmt(netRevenue)}>
                  {loading ? "—" : fmt(netRevenue)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#E5EAF0] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0D9F6E]"></span>
                  <span className="font-medium text-[#74839A]">Received</span>
                </div>
                <span className="font-semibold text-[#0D9F6E] tabular-nums">{loading ? "—" : fmt(receivedAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D69A35]"></span>
                  <span className="font-medium text-[#74839A]">Outstanding</span>
                </div>
                <span className="font-semibold text-[#D69A35] tabular-nums">{loading ? "—" : fmt(customerOutstanding)}</span>
              </div>
            </div>
          </div>

          {/* 2. Total Profit */}
          <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1D9E2] transition-all duration-200 group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A]">Total Profit</h3>
                  <p className="text-xs text-[#74839A] font-medium mt-0.5">Net earnings</p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${totalProfit >= 0 ? "bg-[#EBF8F2] text-[#0D9F6E]" : "bg-[#FDF2F2] text-[#DC6464]"}`}>
                  <TrendingUp className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className={`text-[26px] font-semibold tracking-tight leading-none tabular-nums truncate ${totalProfit >= 0 ? "text-[#0D9F6E]" : "text-[#DC6464]"}`} title={fmt(totalProfit)}>
                  {loading ? "—" : fmt(totalProfit)}
                </span>
                {!loading && (
                  totalProfit >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-[#0D9F6E] shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-[#DC6464] shrink-0" />
                  )
                )}
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#E5EAF0]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">Status</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${totalProfit >= 0 ? "bg-[#EBF8F2] text-[#0D9F6E]" : "bg-[#FDF2F2] text-[#DC6464]"}`}>
                  {totalProfit >= 0 ? "Profitable" : "Loss"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Total Purchase */}
          <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1D9E2] transition-all duration-200 group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A]">Total Purchase</h3>
                  <p className="text-xs text-[#74839A] font-medium mt-0.5">Procurement spend</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F1F4F7] text-[#27364B] shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <ShoppingBag className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-[26px] font-semibold text-[#27364B] tracking-tight leading-none tabular-nums truncate" title={fmt(totalPurchaseAmount)}>
                  {loading ? "—" : fmt(totalPurchaseAmount)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#E5EAF0] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">Purchases:</span>
                <span className="font-medium text-[#27364B] tabular-nums">{loading ? "—" : `${totalPurchaseCount} (${totalPurchaseStocks} stocks)`}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">Outstanding:</span>
                <span className="font-semibold text-[#D69A35] tabular-nums">{loading ? "—" : fmt(totalPurchaseOutstanding)}</span>
              </div>
            </div>
          </div>

          {/* 4. Total Orders */}
          <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1D9E2] transition-all duration-200 group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A]">Total Orders</h3>
                  <p className="text-xs text-[#74839A] font-medium mt-0.5">{RANGE_LABELS[activeRange]}</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#FEF8EC] text-[#D69A35] shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <ShoppingCart className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-[26px] font-semibold text-[#27364B] tracking-tight leading-none tabular-nums">
                  {loading ? "—" : totalOrders.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#E5EAF0]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">Period</span>
                <span className="font-medium text-[#27364B]">{RANGE_LABELS[activeRange]}</span>
              </div>
            </div>
          </div>

          {/* 5. Avg. Order Value */}
          <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1D9E2] transition-all duration-200 group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A]">Avg. Order Value</h3>
                  <p className="text-xs text-[#74839A] font-medium mt-0.5">Revenue / Orders</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#EAF2E8] text-[#103020] shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <Zap className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-[26px] font-semibold text-[#27364B] tracking-tight leading-none tabular-nums truncate" title={fmt(aov)}>
                  {loading ? "—" : fmt(aov)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#E5EAF0]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">Gross Margin</span>
                <span className="font-semibold text-[#27364B] tabular-nums">{loading ? "—" : `${grossMargin.toFixed(1)}%`}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── ROW 2: Sales Performance ── */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[#27364B] tracking-tight">Sales Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Chart Area */}
            <div className="lg:col-span-2">
              <SectionCard title="Revenue & Profit Trend">
                <div className="p-5">
                  <div className="h-[290px] w-full min-w-0">
                    {dailyTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={290}>
                        <AreaChart data={dailyTrend} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#286038" stopOpacity={0.16} />
                              <stop offset="95%" stopColor="#286038" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0D9F6E" stopOpacity={0.18} />
                              <stop offset="95%" stopColor="#0D9F6E" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAF0" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#74839A", fontSize: 11, fontWeight: 500 }}
                            dy={6}
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
                            tick={{ fill: "#74839A", fontSize: 11, fontWeight: 500 }}
                            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                          />
                          <Tooltip content={<TrendTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#286038"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#revenueGrad)"
                          />
                          <Area
                            type="monotone"
                            dataKey="profit"
                            name="Profit"
                            stroke="#0D9F6E"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#profitGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs font-medium text-[#74839A]">
                        No trend data available for this range
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-5 mt-4 pt-3.5 border-t border-[#E5EAF0] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#286038]" />
                      <span className="font-medium text-[#27364B]">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0D9F6E]" />
                      <span className="font-medium text-[#27364B]">Profit</span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Profitability & Quick Stats */}
            <div className="space-y-4">
              {/* Profitability Card */}
              <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#27364B]">Profitability</h3>
                  <div className="w-7 h-7 rounded-lg bg-[#EAF2E8] text-[#286038] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-[#74839A] font-medium">Gross Margin</p>
                <div className="flex items-baseline gap-2.5 mt-1 mb-3">
                  <span className={`text-2xl font-semibold tabular-nums ${grossMargin >= 0 ? "text-[#27364B]" : "text-[#DC6464]"}`}>
                    {grossMargin.toFixed(2)}%
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${grossMargin >= 0 ? "bg-[#EBF8F2] text-[#0D9F6E]" : "bg-[#FDF2F2] text-[#DC6464]"}`}>
                    {grossMargin >= 0 ? "Profitable" : "Loss"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#EAF2E8] rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`${grossMargin >= 0 ? "bg-[#0D9F6E]" : "bg-[#DC6464]"} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, Math.abs(grossMargin)))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-[#74839A]">
                  <span>0%</span>
                  <span>Margin: {grossMargin.toFixed(2)}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A] mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl p-3 text-center hover:bg-white hover:border-[#D1D9E2] transition-colors">
                    <p className="text-lg font-semibold text-[#27364B] tabular-nums">{totalOrders}</p>
                    <p className="text-[11px] font-medium text-[#74839A] mt-0.5">Orders</p>
                  </div>
                  <div className="bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl p-3 text-center hover:bg-white hover:border-[#D1D9E2] transition-colors">
                    <p className={`text-lg font-semibold tabular-nums truncate ${totalProfit >= 0 ? "text-[#0D9F6E]" : "text-[#DC6464]"}`} title={fmt(totalProfit)}>
                      {fmt(totalProfit)}
                    </p>
                    <p className="text-[11px] font-medium text-[#74839A] mt-0.5">{totalProfit >= 0 ? "Profit" : "Loss"}</p>
                  </div>
                  <div className="bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl p-3 text-center hover:bg-white hover:border-[#D1D9E2] transition-colors">
                    <p className="text-lg font-semibold text-[#27364B] tabular-nums truncate" title={fmt(aov)}>
                      {fmtShort(aov)}
                    </p>
                    <p className="text-[11px] font-medium text-[#74839A] mt-0.5">AOV</p>
                  </div>
                  <div className="bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl p-3 text-center hover:bg-white hover:border-[#D1D9E2] transition-colors">
                    <p className="text-lg font-semibold text-[#27364B] tabular-nums">{totalReturnsCount}</p>
                    <p className="text-[11px] font-medium text-[#74839A] mt-0.5">Returns</p>
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
              <div className="p-5 flex flex-col justify-between h-[350px]">
                <div className="h-[180px] w-full min-w-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                    <PieChart>
                      <Pie
                        data={paymentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={76}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={1.5} />
                        ))}
                      </Pie>
                      <Tooltip content={<PaymentTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 pt-3.5 border-t border-[#E5EAF0] max-h-[125px] overflow-y-auto">
                  {paymentBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs py-1 px-1 rounded-md hover:bg-[#F7F9FA] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[#27364B] font-medium">{item.name}</span>
                      </div>
                      <span className="text-[#27364B] font-semibold tabular-nums">
                        {fmt(item.value)} <span className="text-[#74839A] font-normal text-[11px]">({item.count})</span>
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
              <div className="p-5 flex flex-col justify-between min-h-[350px]">
                {topProducts.length > 0 ? (
                  <div className="space-y-2.5">
                    {topProducts.slice(0, 5).map((p: any, i: number) => {
                      const maxQty = topProducts[0]?.total_qty || 1;
                      return (
                        <div key={p.product_id || i} className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-[#F7F9FA] transition-colors group">
                          {/* Rank */}
                          <span className="w-6 h-6 flex items-center justify-center bg-[#F1F4F7] rounded-md text-xs font-semibold text-[#74839A] shrink-0">
                            #{i + 1}
                          </span>
                          
                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#27364B] truncate" title={p.name}>{p.name}</p>
                            <div className="w-full bg-[#EAF2E8] rounded-full h-1.5 mt-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#286038] group-hover:bg-[#103020] transition-all"
                                style={{ width: `${Math.max(5, (p.total_qty / maxQty) * 100)}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold text-[#27364B] tabular-nums">{fmt(p.total_revenue)}</p>
                            <div className="flex items-center gap-1.5 justify-end text-[11px] mt-0.5">
                              <Package className="w-3 h-3 text-[#74839A]" />
                              <span className="text-[#74839A]">{p.total_qty} sold</span>
                              <span className="text-[#E5EAF0]">·</span>
                              <span className="font-medium text-[#0D9F6E] tabular-nums">
                                +{fmt(p.total_profit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[170px] text-xs font-medium text-[#74839A] gap-1.5">
                    <Package className="w-6 h-6 text-[#74839A]/60 mb-0.5" />
                    <span className="font-semibold text-[#27364B]">No sales recorded yet</span>
                    <span className="text-[11px] text-[#74839A]">Products will appear here once they are sold</span>
                  </div>
                )}

                {/* Bottom quick stats */}
                <div className="mt-4 pt-4 border-t border-[#E5EAF0] grid grid-cols-3 gap-3">
                  <div className="text-center p-2.5 bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl hover:bg-white transition-colors">
                    <div className="mb-1 flex justify-center">
                      <BarChart2 className="w-3.5 h-3.5 text-[#286038]" />
                    </div>
                    <p className="text-xs font-semibold text-[#27364B] tabular-nums">{grossMargin.toFixed(1)}%</p>
                    <p className="text-[10px] font-medium text-[#74839A] uppercase tracking-wider mt-0.5">Gross Margin</p>
                  </div>
                  <div className="text-center p-2.5 bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl hover:bg-white transition-colors">
                    <div className="mb-1 flex justify-center">
                      <ShoppingCart className="w-3.5 h-3.5 text-[#74839A]" />
                    </div>
                    <p className="text-xs font-semibold text-[#27364B] tabular-nums">{totalOrders}</p>
                    <p className="text-[10px] font-medium text-[#74839A] uppercase tracking-wider mt-0.5">Total Orders</p>
                  </div>
                  <div className="text-center p-2.5 bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl hover:bg-white transition-colors">
                    <div className="mb-1 flex justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0D9F6E]" />
                    </div>
                    <p className="text-xs font-semibold text-[#27364B] tabular-nums truncate" title={fmt(aov)}>{fmtShort(aov)}</p>
                    <p className="text-[10px] font-medium text-[#74839A] uppercase tracking-wider mt-0.5">AOV</p>
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
                <div className="space-y-3.5">
                  {salesByCategory.slice(0, 5).map((c: any) => {
                    const maxRev = salesByCategory[0]?.revenue || 1;
                    return (
                      <div key={c.category} className="group">
                        <div className="flex justify-between items-end mb-1.5">
                          <p className="text-xs font-semibold text-[#27364B]">{c.category}</p>
                          <p className="text-xs font-semibold text-[#27364B] tabular-nums">{fmt(c.revenue)}</p>
                        </div>
                        <div className="w-full bg-[#EAF2E8] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#88B878] group-hover:bg-[#286038] transition-all duration-300"
                            style={{ width: `${Math.max(2, (c.revenue / maxRev) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-xs font-medium text-[#74839A]">
                  No category data for this period
                </div>
              )}
            </div>
          </SectionCard>

          {/* Top Suppliers */}
          <SectionCard title="Top Suppliers by Performance">
            <div className="p-5">
              {topSuppliers.length > 0 ? (
                <div className="space-y-2.5">
                  {topSuppliers.map((s: any, i: number) => {
                    const maxRev = topSuppliers[0]?.total_revenue || 1;
                    return (
                      <div key={s.supplier_id || i} className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-[#F7F9FA] transition-colors group">
                        {/* Rank */}
                        <span className="w-6 h-6 flex items-center justify-center bg-[#F1F4F7] rounded-md text-xs font-semibold text-[#74839A] shrink-0">
                          #{i + 1}
                        </span>

                        {/* Supplier info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#27364B] truncate" title={s.name}>{s.name}</p>
                          <div className="w-full bg-[#EAF2E8] rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#286038] group-hover:bg-[#103020] transition-all"
                              style={{ width: `${Math.max(5, (s.total_revenue / maxRev) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-[#27364B] tabular-nums">{fmt(s.total_revenue)}</p>
                          <div className="flex items-center gap-1.5 justify-end text-[11px] mt-0.5">
                            <Package className="w-3 h-3 text-[#74839A]" />
                            <span className="text-[#74839A]">{s.total_qty} items</span>
                            <span className="text-[#E5EAF0]">·</span>
                            <span className="font-medium text-[#D69A35] tabular-nums">
                              +{fmt(s.total_profit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-xs font-medium text-[#74839A]">
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
