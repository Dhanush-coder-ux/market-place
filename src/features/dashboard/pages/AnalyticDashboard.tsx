import { useState, useEffect, useMemo, useCallback, useRef, FC, ReactNode } from "react";
import {
  IndianRupee,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Package,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Zap,
  Calculator,
  Info,
  Receipt,
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
import { isShopGstRegistered } from "@/utils/pricing";
import { ProfitBreakdownModal } from "../components/ProfitBreakdownModal";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

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

// ── REUSABLE CARD INFO POPOVER ───────────────────────────────────────────────

interface CardInfoPopoverProps {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  align?: "start" | "end" | "center";
}

const CardInfoPopover: FC<CardInfoPopoverProps> = ({ title, badge, children, align = "start" }) => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="w-4 h-4 rounded-full flex items-center justify-center text-[#74839A] hover:text-[#286038] hover:bg-slate-100 transition-colors cursor-pointer"
          title={`Click or hover for ${title} details`}
          aria-label={`${title} Details`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="bg-white border border-[#E5EAF0] text-[#27364B] rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] w-80 sm:w-92 z-50 text-xs"
      >
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5EAF0]">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>{title}</span>
          </div>
          {badge}
        </div>
        <div className="space-y-2.5">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
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
  const [globalViewMode, setGlobalViewMode] = useState<"gross" | "net">("net");
  void setGlobalViewMode;
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
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
  const [purchasesList, setPurchasesList] = useState<any[]>([]);

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

  const fetchPurchases = useCallback(async () => {
    const shopId = getActiveShopId();
    if (!shopId) return;
    try {
      const res = await apiClient.get(`${ENDPOINTS.PURCHASES}/by/shop/${shopId}?limit=100`, { exclude_cancel: "true", exclude_draft: "true" });
      if (res) {
        const raw = res.data ?? res.datas ?? res.purchases ?? res;
        const arr = Array.isArray(raw) ? raw : (raw?.datas || raw?.purchases || raw?.items || []);
        setPurchasesList(arr);
      }
    } catch (e) { }
  }, [getActiveShopId]);

  useEffect(() => {
    fetchOrders();
    fetchPurchases();
  }, [fetchOrders, fetchPurchases]);

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
      fetchPurchases();
      const res = await analytics.getUnifiedDashboard(queryParams);
      if (res) {
        setStats(res.data || res.datas || res);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [analytics, dateRange, selectedSupplier, getActiveShopId, fetchOrders, fetchPurchases]);

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

  // ── Profit & Tax Breakdown Calculations (GST, Transport, ITC)
  const isGstReg = isShopGstRegistered();

  // ── Compute allocated procurement charges (transport & other charges per unit) & unit purchase costs ──
  const { productAllocatedChargesMap, batchAllocatedChargesMap, productPurchaseUnitCostMap } = useMemo(() => {
    const prodChargesMap: Record<string, { totalCharges: number; totalQty: number }> = {};
    const batchChargesMap: Record<string, number> = {};
    const prodCostMap: Record<string, { totalSpend: number; totalQty: number }> = {};

    purchasesList.forEach((p: any) => {
      const st = String(p?.status || "").toUpperCase();
      if (st === "CANCELLED" || st === "CANCELED" || st === "DRAFT") return;

      const pCharges = Number(
        p.charges_infos?.transport_charge ??
        p.charges?.transport ??
        p.transport_charge ??
        p.charges_infos?.delivery_charge ??
        p.delivery_charge ??
        0
      ) + Number(
        p.charges_infos?.other_charge ??
        p.charges?.other ??
        p.other_charge ??
        0
      ) + Number(
        p.charges_infos?.shipping_charge ??
        p.charges?.shipping ??
        p.shipping_charge ??
        0
      ) + (
        !p.charges_infos && !p.charges && p.calculation_infos?.total_charges
          ? Number(p.calculation_infos.total_charges)
          : 0
      );

      const items: any[] = Array.isArray(p.items) ? p.items : (Array.isArray(p.products) ? p.products : []);
      let pStocks = 0;
      items.forEach((it: any) => {
        pStocks += Number(it.stocks_infos?.stocks ?? it.stocks ?? it.quantity ?? it.entered_qty ?? 0);
      });
      if (pStocks <= 0) {
        pStocks = Number(p.item_infos?.total_stocks ?? p.total_stocks ?? 0);
      }

      const perUnitInPurchase = (pCharges > 0 && pStocks > 0) ? (pCharges / pStocks) : 0;

      items.forEach((it: any) => {
        const pid = it.product_id || it.inventory_id || it.id;
        const q = Number(it.stocks_infos?.stocks ?? it.stocks ?? it.quantity ?? it.entered_qty ?? 0);
        if (pid && q > 0) {
          if (!prodChargesMap[pid]) {
            prodChargesMap[pid] = { totalCharges: 0, totalQty: 0 };
          }
          prodChargesMap[pid].totalCharges += perUnitInPurchase * q;
          prodChargesMap[pid].totalQty += q;
        }

        // Record specific batch charge if batch identifier is present
        const bId = it.batch_infos?.name || it.batch_infos?.id || it.batch_number || it.batches?.batch_number || it.batch_id || it.id;
        if (bId) {
          batchChargesMap[String(bId)] = perUnitInPurchase;
        }
      });

      // Compute actual unit purchase price paid to supplier (inclusive of GST paid)
      items.forEach((it: any) => {
        const pid = it.product_id || it.inventory_id || it.id;
        if (!pid) return;
        const q = Number(it.stocks_infos?.stocks ?? it.stocks ?? it.quantity ?? it.entered_qty ?? 0);
        if (q <= 0) return;
        const itTotal = Number(it.total_amount ?? it.total ?? 0);
        const itGst = Number(String(it.gst ?? it.gst_rate ?? "0").replace(/[^0-9.]/g, "")) || 0;
        let unitCostInclGst = 0;
        if (itTotal > 0 && q > 0) {
          unitCostInclGst = itTotal / q;
        } else {
          const bp = Number(it.buy_price ?? it.cost_price ?? it.pricing_infos?.buy_price ?? 0);
          unitCostInclGst = bp > 0 ? (itGst > 0 ? bp * (1 + itGst / 100) : bp) : 0;
        }
        if (unitCostInclGst > 0) {
          if (!prodCostMap[pid]) {
            prodCostMap[pid] = { totalSpend: 0, totalQty: 0 };
          }
          prodCostMap[pid].totalSpend += unitCostInclGst * q;
          prodCostMap[pid].totalQty += q;
        }
      });
    });

    const unitMap: Record<string, number> = {};
    Object.entries(prodChargesMap).forEach(([pid, val]) => {
      if (val.totalQty > 0) {
        unitMap[pid] = Math.round((val.totalCharges / val.totalQty) * 100) / 100;
      }
    });

    const unitCostMap: Record<string, number> = {};
    Object.entries(prodCostMap).forEach(([pid, val]) => {
      if (val.totalQty > 0) {
        unitCostMap[pid] = Math.round((val.totalSpend / val.totalQty) * 100) / 100;
      }
    });

    return {
      productAllocatedChargesMap: unitMap,
      batchAllocatedChargesMap: batchChargesMap,
      productPurchaseUnitCostMap: unitCostMap,
    };
  }, [purchasesList]);

  // ── Filtered Orders & Purchases (with GST & Returns breakdown) ──
  const filteredOrders = useMemo(() => {
    if (!ordersList.length) return [];
    return ordersList.filter((o: any) => {
      const st = String(o?.status || "").toUpperCase();
      if (st === "CANCELLED" || st === "CANCELED") return false;
      if (!dateRange?.start || !dateRange?.end) return true;
      const oDate = new Date(o.created_at || o.date || 0);
      return oDate >= dateRange.start && oDate <= dateRange.end;
    });
  }, [ordersList, dateRange]);

  const {
    salesGrossRevenue,
    salesReturnsRefunds,
    salesRevenueWithGst,
    salesTaxableRevenue,
    salesCostWithGst,
    salesReturnedCost,
    salesGstAmount,
    salesTransportCharges,
    allocatedSalesTransport,
    soldItemsInputGst,
    ordersCountFromList,
    totalOrdersPlacedCount,
    completedOrdersCount,
    fullyReturnedOrdersCount,
    partiallyReturnedOrdersCount,
    exchangedOrdersCount,
    salesReturnedProfit,
  } = useMemo(() => {
    let list = filteredOrders;
    if (list.length === 0 && ordersList.length > 0 && activeRange === "all") {
      list = ordersList.filter((o: any) => {
        const st = String(o?.status || "").toUpperCase();
        return st !== "CANCELLED" && st !== "CANCELED";
      });
    }

    let grossRev = 0;
    let totalRefunds = 0;
    let activeCost = 0;
    let returnedCost = 0;
    let activeTax = 0;
    let returnedTax = 0;
    let activeTransport = 0;
    let activeAllocatedTransport = 0;
    let activeInputGst = 0;
    let returnedProfit = 0;

    let totalPlaced = 0;
    let totalCompleted = 0;
    let fullyReturned = 0;
    let partiallyReturned = 0;
    let exchanged = 0;

    list.forEach((o: any) => {
      totalPlaced += 1;
      const orderStatus = String(o?.status || "").toUpperCase();
      totalCompleted += 1;

      const calcInfo = o.calculation_infos || {};
      const orderTotal = Number(
        calcInfo.grand_total ??
        calcInfo.total ??
        o.total_amount ??
        o.item_infos?.total_order_amount ??
        o.total_sellprice ??
        o.total ??
        0
      );
      grossRev += orderTotal;

      const transport = Number(
        o.charges_infos?.transport_charge ??
        o.charges_infos?.shipping_charge ??
        o.charges_infos?.delivery_charge ??
        o.charges?.transport ??
        o.charges?.shipping ??
        o.delivery_fee ??
        o.shipping_charge ??
        calcInfo.delivery_fee ??
        calcInfo.shipping_charge ??
        0
      );

      // ── Returns & Exchanges Extraction ──
      const rawReturns: any[] = Array.isArray(o.returns) ? o.returns : [];
      const rawReturnRequests: any[] = Array.isArray(o.return_requests) ? o.return_requests : [];
      const rawExchanges: any[] = Array.isArray(o.exchanges) ? o.exchanges : [];

      if (o.origin === "EXCHANGE" || o.billing_type === "EXCHANGE" || rawExchanges.length > 0) {
        exchanged += 1;
      }

      const returnedQtyMap: Record<string, number> = {};
      let orderRefundSum = 0;

      rawReturns.forEach((ret: any) => {
        orderRefundSum += Number(ret.total_refund_amount ?? ret.refund_amount ?? ret.amount ?? 0);
        const rItems = Array.isArray(ret.items) ? ret.items : (Array.isArray(ret.returned_items) ? ret.returned_items : []);
        rItems.forEach((ri: any) => {
          const q = Number(ri.quantity ?? ri.qty ?? ri.entered_qty ?? 0);
          if (ri.order_item_id) returnedQtyMap[String(ri.order_item_id)] = (returnedQtyMap[String(ri.order_item_id)] || 0) + q;
          if (ri.product_id) returnedQtyMap[String(ri.product_id)] = (returnedQtyMap[String(ri.product_id)] || 0) + q;
          if (ri.id) returnedQtyMap[String(ri.id)] = (returnedQtyMap[String(ri.id)] || 0) + q;
        });
      });

      const acceptedStatuses = ["ACCEPTED", "APPROVED", "COMPLETED", "RETURNED"];
      rawReturnRequests.forEach((rr: any) => {
        if (!acceptedStatuses.includes(String(rr.status || "").toUpperCase())) return;
        const rrItems = Array.isArray(rr.items) ? rr.items : [];
        rrItems.forEach((ri: any) => {
          const q = Number(ri.quantity ?? ri.qty ?? 0);
          if (ri.order_item_id) returnedQtyMap[String(ri.order_item_id)] = (returnedQtyMap[String(ri.order_item_id)] || 0) + q;
          if (ri.product_id) returnedQtyMap[String(ri.product_id)] = (returnedQtyMap[String(ri.product_id)] || 0) + q;
        });
      });

      const directRefund = Number(o.refund_amount ?? o.total_refund ?? 0);
      if (directRefund > orderRefundSum) orderRefundSum = directRefund;

      const calcItems = calcInfo.items || [];
      const orderItems = o.items || [];
      const itemsToIterate = calcItems.length > 0 ? calcItems : orderItems;

      let orderItemReturnedAmount = 0;
      let orderActiveItemsCost = 0;
      let orderReturnedItemsCost = 0;
      let orderActiveItemsGst = 0;
      let orderReturnedItemsGst = 0;
      let orderActiveItemsItc = 0;
      let orderReturnedItemsItc = 0;
      let orderActiveTransportAlloc = 0;
      let orderTotalItemQty = 0;
      let orderTotalReturnedQty = 0;

      itemsToIterate.forEach((ci: any) => {
        const pid = ci.product_id || ci.inventory_id || ci.id;
        const itId = String(ci.order_item_id || ci.id || pid || "");
        const it = orderItems.find((oi: any) => (oi.id && oi.id === itId) || (oi.product_id && oi.product_id === pid));

        const origQty = Number(ci.qty ?? ci.entered_qty ?? ci.quantity ?? it?.quantity ?? 1);
        orderTotalItemQty += origQty;

        let retQty = Number(ci.returned_quantity ?? it?.returned_quantity ?? 0);
        const mappedRet = (itId && returnedQtyMap[itId]) || (pid && returnedQtyMap[String(pid)]) || 0;
        if (mappedRet > retQty) retQty = mappedRet;
        const itStatus = String(ci.status || it?.status || "").toUpperCase();
        if (itStatus === "RETURNED" || itStatus === "REFUNDED" || orderStatus === "RETURNED" || orderStatus === "REFUNDED") {
          retQty = origQty;
        }
        retQty = Math.min(origQty, Math.max(0, retQty));
        orderTotalReturnedQty += retQty;
        const actQty = Math.max(0, origQty - retQty);

        // Unit selling price
        let unitSp = 0;
        if (ci.final_inclusive !== undefined && origQty > 0) {
          unitSp = Number(ci.final_inclusive) / origQty;
        } else if (ci.total_amount !== undefined && origQty > 0) {
          unitSp = Number(ci.total_amount) / origQty;
        } else {
          unitSp = Number(ci.price ?? ci.selling_price ?? ci.sell_price ?? it?.sell_price ?? 0);
        }

        // Supplier / Product Purchase GST rate
        const prodGstRate = Number(String(it?.gst ?? it?.gst_rate ?? ci.prod_gst ?? "0").replace(/[^0-9.]/g, "")) || 0;
        // Sales GST rate (0 for non-GST registered shops)
        const salesItemGstRate = isGstReg
          ? (Number(String(ci.gst_rate ?? ci.gst ?? it?.gst ?? it?.gst_rate ?? "0").replace(/[^0-9.]/g, "")) || 0)
          : 0;

        // True Unit cost with GST (what was paid to the supplier)
        const costAtSale = Number(ci.cost_at_sale ?? ci.cost_price ?? it?.cost_at_sale ?? 0);
        const rawBp = Number(it?.raw_buy_price ?? it?.buy_price ?? ci.buy_price ?? ci.raw_buy_price ?? 0);
        const isCostInclusive = Boolean(
          ci.buy_price_tax_inclusive ??
          ci.cost_price_tax_inclusive ??
          it?.buy_price_tax_inclusive ??
          it?.cost_price_tax_inclusive ??
          it?.custom_fields?.buy_price_tax_inclusive ??
          it?.custom_fields?.cost_price_tax_inclusive ??
          it?.custom_fields?.cost_tax_type === 'inclusive'
        );
        let unitCostWithGst = 0;

        if (pid && productPurchaseUnitCostMap[pid] && productPurchaseUnitCostMap[pid] > 0) {
          unitCostWithGst = productPurchaseUnitCostMap[pid];
        } else if (costAtSale > 0) {
          // If costAtSale is approximately rawBp (base price excluding GST) and item has GST and is not inclusive, add GST
          if (!isCostInclusive && prodGstRate > 0 && rawBp > 0 && Math.abs(costAtSale - rawBp) < 1) {
            unitCostWithGst = Math.round(costAtSale * (1 + prodGstRate / 100) * 100) / 100;
          } else {
            unitCostWithGst = costAtSale;
          }
        } else if (rawBp > 0) {
          unitCostWithGst = (!isCostInclusive && prodGstRate > 0)
            ? Math.round(rawBp * (1 + prodGstRate / 100) * 100) / 100
            : rawBp;
        }

        // Unit GST (only collected and remitted for GST registered shops)
        let unitGst = 0;
        if (isGstReg) {
          const lineTax = Number(ci.gst_amount ?? ci.tax_amount ?? it?.gst_amount ?? 0);
          if (lineTax > 0 && origQty > 0) {
            unitGst = lineTax / origQty;
          } else if (salesItemGstRate > 0 && unitSp > 0) {
            unitGst = unitSp - (unitSp / (1 + salesItemGstRate / 100));
          }
        }

        // Unit ITC (only claimable by GST registered shops)
        let unitItc = 0;
        if (isGstReg && unitCostWithGst > 0 && prodGstRate > 0) {
          unitItc = unitCostWithGst - (unitCostWithGst / (1 + prodGstRate / 100));
        }

        // Unit allocated charges - ONLY apply if the sold product/batch actually incurred charges!
        const batchKey = String(ci.batch_id || it?.batch_id || ci.batch_number || it?.batch_number || it?.batch_name || ci.batch || "");
        let unitCharge = 0;
        if (batchKey && batchAllocatedChargesMap[batchKey] !== undefined) {
          unitCharge = batchAllocatedChargesMap[batchKey];
        } else if (pid && productAllocatedChargesMap[pid] !== undefined && productAllocatedChargesMap[pid] > 0) {
          unitCharge = productAllocatedChargesMap[pid];
        } else {
          unitCharge = 0;
        }

        orderItemReturnedAmount += retQty * unitSp;
        orderActiveItemsCost += actQty * unitCostWithGst;
        orderReturnedItemsCost += retQty * unitCostWithGst;
        orderActiveItemsGst += actQty * unitGst;
        orderReturnedItemsGst += retQty * unitGst;
        orderActiveItemsItc += actQty * unitItc;
        orderReturnedItemsItc += retQty * unitItc;
        orderActiveTransportAlloc += actQty * unitCharge;
      });

      let finalOrderRefund = Math.max(orderRefundSum, orderItemReturnedAmount);
      if ((orderStatus === "RETURNED" || orderStatus === "REFUNDED") && finalOrderRefund <= 0) {
        finalOrderRefund = orderTotal;
      }
      finalOrderRefund = Math.min(orderTotal, Math.max(0, finalOrderRefund));
      totalRefunds += finalOrderRefund;

      const isFullyReturned = (orderTotal > 0 && finalOrderRefund >= orderTotal - 0.01) ||
        (orderTotalItemQty > 0 && orderTotalReturnedQty >= orderTotalItemQty) ||
        orderStatus === "RETURNED" ||
        orderStatus === "REFUNDED";

      const isPartiallyReturned = !isFullyReturned && (finalOrderRefund > 0 || orderTotalReturnedQty > 0);

      if (isFullyReturned) {
        fullyReturned += 1;
        returnedCost += (orderActiveItemsCost + orderReturnedItemsCost);
        returnedTax += (orderActiveItemsGst + orderReturnedItemsGst);
        returnedProfit += Math.max(0, finalOrderRefund - (orderActiveItemsCost + orderReturnedItemsCost));
      } else {
        if (isPartiallyReturned) partiallyReturned += 1;
        activeCost += orderActiveItemsCost;
        returnedCost += orderReturnedItemsCost;
        activeTax += orderActiveItemsGst;
        returnedTax += orderReturnedItemsGst;
        activeInputGst += orderActiveItemsItc;
        activeAllocatedTransport += orderActiveTransportAlloc;
        activeTransport += transport;
        returnedProfit += Math.max(0, finalOrderRefund - orderReturnedItemsCost);
      }
    });

    const netRealizedRev = Math.max(0, grossRev - totalRefunds);
    const netTaxableRev = Math.max(0, netRealizedRev - activeTax);
    const netActiveOrders = Math.max(0, totalCompleted - fullyReturned);

    return {
      salesGrossRevenue: Number(salesOverall.gross_revenue ?? (salesOverall.total_sales_amounts ?? grossRev)),
      salesReturnsRefunds: Number(salesOverall.refund_amount ?? totalRefunds),
      salesRevenueWithGst: Number(salesOverall.total_sales_amounts ?? netRealizedRev),
      salesTaxableRevenue: Number(salesOverall.taxable_revenue ?? netTaxableRev),
      salesCostWithGst: Number(salesOverall.total_cost ?? activeCost),
      salesReturnedCost: Number(salesOverall.returned_cost ?? returnedCost),
      salesGstAmount: isGstReg ? Number(salesOverall.sales_gst_amount ?? activeTax) : 0,
      salesReturnedGst: isGstReg ? Number(salesOverall.returned_gst ?? returnedTax) : 0,
      salesTransportCharges: Number(salesOverall.transport_charges ?? activeTransport),
      allocatedSalesTransport: activeAllocatedTransport,
      soldItemsInputGst: isGstReg ? Number(salesOverall.itc_amount ?? activeInputGst) : 0,
      ordersCountFromList: Number(salesOverall.total_sales ?? netActiveOrders),
      totalOrdersPlacedCount: totalPlaced,
      completedOrdersCount: Number(salesOverall.total_sales ?? totalCompleted),
      fullyReturnedOrdersCount: fullyReturned,
      partiallyReturnedOrdersCount: partiallyReturned,
      exchangedOrdersCount: exchanged,
      salesReturnedProfit: returnedProfit,
    };
  }, [filteredOrders, ordersList, activeRange, productAllocatedChargesMap, batchAllocatedChargesMap, productPurchaseUnitCostMap, isGstReg, salesOverall]);

  const filteredPurchases = useMemo(() => {
    if (!purchasesList.length) return [];
    return purchasesList.filter((p: any) => {
      const st = String(p?.status || "").toUpperCase();
      if (st === "CANCELLED" || st === "CANCELED" || st === "DRAFT") return false;
      if (selectedSupplier && p.supplier_id !== selectedSupplier && p.supplier !== selectedSupplier) return false;
      if (!dateRange?.start || !dateRange?.end) return true;
      const pDate = new Date(p.purchase_date || p.created_at || p.date || 0);
      return pDate >= dateRange.start && pDate <= dateRange.end;
    });
  }, [purchasesList, dateRange, selectedSupplier]);

  const {
    purchaseGrossSpend,
    totalPurchaseReturns,
    purchaseWithGst,
    purchaseTaxableSpend,
    purchaseGstAmount,
    purchasesCountFromList,
    purchasesStocksFromList,
    totalPurchaseReturnsCount,
  } = useMemo(() => {
    // When date filtering is active (activeRange !== "all" or dateRange is set),
    // strictly respect filteredPurchases so a period with 0 purchases correctly yields 0 spend and 0 GST.
    const isDateFiltered = activeRange !== "all" || Boolean(dateRange?.start && dateRange?.end);
    let list = filteredPurchases;
    if (!isDateFiltered && list.length === 0 && purchasesList.length > 0) {
      list = selectedSupplier
        ? purchasesList.filter((p: any) => (p.supplier_id === selectedSupplier || p.supplier === selectedSupplier) && String(p?.status || "").toUpperCase() !== "CANCELLED" && String(p?.status || "").toUpperCase() !== "DRAFT")
        : purchasesList.filter((p: any) => String(p?.status || "").toUpperCase() !== "CANCELLED" && String(p?.status || "").toUpperCase() !== "DRAFT");
    }

    let grossSpend = 0;
    let totalReturns = 0;
    let totalGst = 0;
    let returnGst = 0;
    let totalStocks = 0;
    let returnStocks = 0;
    let returnsCount = 0;

    list.forEach((p: any) => {
      const gst = Number(
        p.item_infos?.total_gst_amount ??
        p.gst_amount ??
        p.tax_amount ??
        p.charges_infos?.gst_amount ??
        p.calculation_infos?.total_tax ??
        0
      );
      const itemsTotal = Array.isArray(p.items) ? p.items.reduce((s: number, it: any) => s + Number(it.total_amount || 0), 0) : 0;
      const calcTotal = Number(p.calculation_infos?.grand_total ?? p.calculation_infos?.total ?? 0);
      const withGst = Number(
        p.total_amount ??
        p.grand_total ??
        (calcTotal > 0 ? calcTotal : undefined) ??
        (itemsTotal > 0 ? itemsTotal : undefined) ??
        (Number(p.item_infos?.total_pur_cost || 0) + Number(p.item_infos?.total_gst_amount || 0))
      );
      const stocks = Number(
        p.item_infos?.total_stocks ??
        (Array.isArray(p.items) ? p.items.reduce((s: number, it: any) => s + Number(it.quantity ?? it.stocks ?? 1), 0) : 0)
      );

      grossSpend += withGst;
      totalGst += gst;
      totalStocks += stocks;

      // ── Purchase Returns & Debit Notes ──
      let pReturnAmt = 0;
      let pReturnGst = 0;
      let pReturnQty = 0;

      const pReturns = Array.isArray(p.returns) ? p.returns : [];
      if (pReturns.length > 0) {
        returnsCount += pReturns.length;
        pReturns.forEach((ret: any) => {
          const rVal = Number(ret.return_value ?? ret.total_return_amount ?? ret.refund_amount ?? ret.amount ?? 0);
          pReturnAmt += rVal;
          const rGst = Number(ret.gst_amount ?? ret.total_gst_amount ?? 0);
          pReturnGst += rGst;
          const rItems = Array.isArray(ret.items) ? ret.items : [];
          rItems.forEach((ri: any) => {
            pReturnQty += Number(ri.quantity ?? ri.returnQty ?? 0);
          });
        });
      }

      const debitNotes = Array.isArray(p.debit_notes) ? p.debit_notes : [];
      if (debitNotes.length > 0) {
        returnsCount += debitNotes.length;
        debitNotes.forEach((dn: any) => {
          pReturnAmt += Number(dn.amount ?? dn.total_amount ?? dn.value ?? 0);
        });
      }

      if (pReturnAmt === 0 && Array.isArray(p.items)) {
        p.items.forEach((it: any) => {
          const rq = Number(it.returned_quantity ?? 0);
          if (rq > 0) {
            returnsCount += 1;
            pReturnQty += rq;
            const bp = Number(it.buy_price ?? (it.pricing_infos?.buy_price) ?? 0);
            const igst = Number(String(it.gst ?? "0").replace(/[^0-9.]/g, "")) || 0;
            const retLine = rq * bp * (igst > 0 ? (1 + igst / 100) : 1);
            pReturnAmt += retLine;
            if (igst > 0) pReturnGst += retLine - (retLine / (1 + igst / 100));
          }
        });
      }

      totalReturns += pReturnAmt;
      returnGst += pReturnGst;
      returnStocks += pReturnQty;
    });

    const netSpend = Math.max(0, grossSpend - totalReturns);
    const netGst = Math.max(0, totalGst - returnGst);
    const netStocks = Math.max(0, totalStocks - returnStocks);
    const taxableSpend = Math.max(0, netSpend - netGst);

    return {
      purchaseGrossSpend: Number(purchaseOverall.gross_spend ?? (purchaseOverall.total_purchase_amounts ?? grossSpend)),
      totalPurchaseReturns: Number(purchaseOverall.total_returns ?? totalReturns),
      purchaseWithGst: Number(purchaseOverall.total_purchase_amounts ?? netSpend),
      purchaseTaxableSpend: Number(purchaseOverall.taxable_spend ?? taxableSpend),
      purchaseGstAmount: isGstReg ? Number(purchaseOverall.gst_amount ?? netGst) : 0,
      purchasesCountFromList: Number(purchaseOverall.total_purchase ?? list.length),
      purchasesStocksFromList: Number(purchaseOverall.total_purchase_stocks ?? netStocks),
      totalPurchaseReturnsCount: Number(purchaseOverall.returns_count ?? returnsCount),
    };
  }, [filteredPurchases, purchasesList, selectedSupplier, activeRange, dateRange, purchaseOverall, isGstReg]);

  const isFiltered = activeRange !== "all";

  const totalOrders = ordersCountFromList > 0
    ? ordersCountFromList
    : (isFiltered
        ? (Number(salesOverall.total_sales ?? 0) || ordersCountFromList)
        : ((salesOverall.total_sales && salesOverall.total_sales > 0) ? salesOverall.total_sales : (ordersCountFromList || topProductsTotalOrders)));

  const fallbackRevenue = isFiltered
    ? Number(salesOverall.total_sales_amounts ?? 0)
    : ((salesOverall.total_sales_amounts && salesOverall.total_sales_amounts > 0) ? salesOverall.total_sales_amounts : topProductsTotalSales);

  const netRevenue = salesRevenueWithGst > 0 ? salesRevenueWithGst : fallbackRevenue;

  const totalCost = Number(salesOverall.total_cost ?? 0);

  const fallbackPurchaseAmount = isFiltered
    ? Number(purchaseOverall.total_purchase_amounts ?? 0)
    : ((purchaseOverall.total_purchase_amounts && purchaseOverall.total_purchase_amounts > 0) ? purchaseOverall.total_purchase_amounts : topSuppliersTotalPurchase);

  const totalPurchaseAmount = (purchaseWithGst > 0)
    ? purchaseWithGst
    : fallbackPurchaseAmount;

  const totalPurchaseCount = isFiltered
    ? (Number(purchaseOverall.total_purchase ?? 0) || purchasesCountFromList)
    : ((purchaseOverall.total_purchase && purchaseOverall.total_purchase > 0) ? purchaseOverall.total_purchase : (purchasesCountFromList || topSuppliersTotalPurchasesCount));
  const totalPurchaseStocks = purchaseOverall.total_purchase_stocks ?? purchasesStocksFromList ?? 0;
  const totalPurchaseOutstanding = purchaseOverall.total_outstanding_amounts || supplierOverall.total_outstandings || 0;
  const purchasePaidAmount = Math.max(0, totalPurchaseAmount - totalPurchaseOutstanding);

  // ── Profit & Tax Breakdown Calculations (GST, Transport, ITC)
  // Profit with GST included (Revenue with GST - Cost of goods sold with GST)
  const effectiveCost = (salesCostWithGst > 0)
    ? salesCostWithGst
    : (totalCost > 0 ? totalCost : Math.max(0, netRevenue - (salesOverall.total_profit !== undefined ? Number(salesOverall.total_profit) : 0)));

  // Gross Profit = Selling Price (with GST) − Purchase Cost (with GST) of delivered items
  const grossProfit = salesOverall.gross_profit !== undefined
    ? Number(salesOverall.gross_profit)
    : ((salesRevenueWithGst > 0 && effectiveCost > 0)
        ? (salesRevenueWithGst - effectiveCost)
        : (salesOverall.total_profit !== undefined ? Number(salesOverall.total_profit) : (netRevenue - totalCost)));

  // Transport charges: allocated per sale / per sold unit
  // ONLY applied if the sold items or sales order actually incurred transport/delivery charges
  const transportCharges = salesOverall.transport_charges !== undefined
    ? Number(salesOverall.transport_charges)
    : Math.max(0, (allocatedSalesTransport || 0) + (salesTransportCharges || 0));

  // Input GST Claimed (ITC):
  // ITC claimed against sales only applies to goods actually sold in this period.
  // If no sales were made (totalOrders === 0, netRevenue === 0, or filteredOrders is empty),
  // purchaseGstClaimed against sales MUST BE 0.
  const hasNoSales = totalOrders === 0 || netRevenue === 0 || (ordersList.length > 0 && filteredOrders.length === 0);
  const purchaseGstClaimed = hasNoSales
    ? 0
    : (salesOverall.itc_amount !== undefined
        ? Number(salesOverall.itc_amount)
        : (soldItemsInputGst > 0
            ? soldItemsInputGst
            : (totalPurchaseStocks > 0 && purchaseGstAmount > 0
                ? Math.min(purchaseGstAmount, (purchaseGstAmount / totalPurchaseStocks) * totalOrders)
                : (purchaseGstAmount > 0 ? purchaseGstAmount : 0))));

  const canClaimItc = isGstReg;
  const itcAmount = canClaimItc ? purchaseGstClaimed : 0;
  const outputGstDeduction = isGstReg ? salesGstAmount : 0;

  // Net Realized Profit = Gross Profit − Output GST (if reg) − Transport + Input GST ITC (if reg)
  // For Non-GST shops: Output GST is 0, ITC is 0, so:
  // Net Profit = Gross Profit − Transport = Selling Price − Purchase Cost − Transport = 130 - 100 - 20 = 10.00!
  const netRealizedProfit = salesOverall.total_profit !== undefined
    ? Number(salesOverall.total_profit)
    : (grossProfit - outputGstDeduction - transportCharges + itcAmount);

  // Current sales-based Input GST (ITC on sold units)
  const salesBasedPurchaseGst = isGstReg ? itcAmount : 0;
  // When no sales occurred and salesGstAmount === 0:
  // Net GST payable is 0.
  // itcSurplus accurately reflects whether there was actual purchase GST in that period or 0.
  const netGstPayable = isGstReg
    ? (salesOverall.net_gst_payable !== undefined
        ? Number(salesOverall.net_gst_payable)
        : (hasNoSales && salesGstAmount === 0
            ? 0
            : Math.max(0, salesGstAmount - salesBasedPurchaseGst)))
    : 0;
  const itcSurplus = isGstReg
    ? (salesOverall.itc_surplus !== undefined
        ? Number(salesOverall.itc_surplus)
        : (hasNoSales && salesGstAmount === 0
            ? (purchaseGstAmount > 0 ? purchaseGstAmount : 0)
            : Math.max(0, salesBasedPurchaseGst - salesGstAmount)))
    : 0;

  // For non-GST registered sellers, Gross and Net are identical (Selling - Cost - Charges = ₹10.00).
  const totalProfit = !isGstReg
    ? netRealizedProfit
    : (globalViewMode === "gross" ? grossProfit : netRealizedProfit);

  const displayedProfit = !isGstReg
    ? netRealizedProfit
    : (globalViewMode === "gross" ? grossProfit : netRealizedProfit);

  const sellingPrice = salesRevenueWithGst > 0 ? salesRevenueWithGst : netRevenue;
  const purchaseCost = effectiveCost > 0 ? effectiveCost : totalCost;

  // Initial gross figures (before deducting reversed returns)
  const initialGrossProfit = grossProfit + salesReturnedProfit;
  const initialSalesRevenue = salesGrossRevenue > 0 ? salesGrossRevenue : (sellingPrice + salesReturnsRefunds);
  const initialPurchaseCost = purchaseCost + (salesReturnedCost || 0);

  // Values depending on globalViewMode ('gross' vs 'net')
  const displayedRevenue = !isGstReg
    ? netRevenue
    : (globalViewMode === "gross" ? netRevenue : Math.max(0, netRevenue - salesGstAmount));

  const displayedPurchase = !isGstReg
    ? totalPurchaseAmount
    : (globalViewMode === "gross" ? totalPurchaseAmount : Math.max(0, totalPurchaseAmount - purchaseGstAmount));

  const displayedAov = totalOrders > 0 ? displayedRevenue / totalOrders : 0;

  // Net Profit Margin: relative to taxable net revenue (exclusive of GST for registered shops)
  const effectiveTaxableRevenue = salesRevenueWithGst > 0
    ? (isGstReg ? Math.max(1, salesRevenueWithGst - salesGstAmount) : salesRevenueWithGst)
    : (netRevenue > 0 ? netRevenue : 1);
  const netProfitMargin = (netRealizedProfit / effectiveTaxableRevenue) * 100;

  // For non-GST registered seller, Gross margin and Net margin are identical = netProfitMargin (~ 7.7%)
  const grossMargin = !isGstReg
    ? netProfitMargin
    : (netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0);

  const displayedMargin = !isGstReg
    ? netProfitMargin
    : (globalViewMode === "gross" ? grossMargin : netProfitMargin);
  
  const customerOutstanding = Number(customerOverall?.total_outstandings ?? 0);
  const receivedAmount = useMemo(() => {
    if (salesOverall.total_received_amount !== undefined && Number(salesOverall.total_received_amount) > 0) {
      return Number(salesOverall.total_received_amount);
    }
    if (salesOverall.total_bill_amount !== undefined && Number(salesOverall.total_bill_amount) > 0) {
      return Number(salesOverall.total_bill_amount);
    }

    if (ordersList.length > 0) {
      let sumReceived = 0;
      let hasCompletedOrders = false;
      filteredOrders.forEach((o: any) => {
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

        // Deduct refund from received amount
        const rawReturns: any[] = Array.isArray(o.returns) ? o.returns : [];
        let orderRefund = 0;
        rawReturns.forEach((ret: any) => {
          orderRefund += Number(ret.total_refund_amount ?? ret.refund_amount ?? ret.amount ?? 0);
        });
        const directRefund = Number(o.refund_amount ?? o.total_refund ?? 0);
        if (directRefund > orderRefund) orderRefund = directRefund;
        if (["RETURNED", "REFUNDED"].includes(String(o.status || "").toUpperCase()) && orderRefund <= 0) {
          orderRefund = total;
        }

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

        // Net received for this order
        const netOrderReceived = Math.max(0, orderReceived - orderRefund);
        sumReceived += netOrderReceived;
        hasCompletedOrders = true;
      });

      if (hasCompletedOrders) return sumReceived;
    }

    return Number(customerOverall?.total_cleared_amounts ?? Math.max(0, netRevenue - customerOutstanding));
  }, [ordersList, filteredOrders, salesOverall, customerOverall, customerOutstanding, netRevenue]);

  const totalReturnsCount = fullyReturnedOrdersCount + partiallyReturnedOrdersCount;

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
      salesTrend = [{
        _id: todayStr,
        date: todayStr,
        total_sales_amounts: globalViewMode === "net" ? Math.max(0, netRevenue - salesGstAmount) : netRevenue,
        total_sales: totalOrders,
        total_profit: globalViewMode === "net" ? netRealizedProfit : totalProfit,
      }];
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
        purchaseTrend = [{
          _id: todayStr,
          date: todayStr,
          total_purchase_amounts: globalViewMode === "net" ? Math.max(0, totalPurchaseAmount - purchaseGstAmount) : totalPurchaseAmount,
        }];
      }
    }

    const map: Record<string, any> = {};

    salesTrend.forEach((s: any) => {
      const date = s._id || s.date || "";
      if (!date) return;
      const rawRev = s.total_sales_amounts || 0;
      const rawProfit = s.total_profit || ((s.total_sales_amounts || 0) - (s.total_cost || 0));
      const effectiveRev = isGstReg && globalViewMode === "net" && netRevenue > 0
        ? Math.max(0, rawRev - (rawRev / netRevenue) * salesGstAmount)
        : rawRev;
      const effectiveProf = (!isGstReg || globalViewMode === "net") && grossProfit > 0
        ? (rawProfit / grossProfit) * netRealizedProfit
        : (!isGstReg ? netRealizedProfit : rawProfit);

      map[date] = {
        date,
        revenue: effectiveRev,
        orders: s.total_sales || 0,
        profit: effectiveProf,
        purchases: 0,
      };
    });

    purchaseTrend.forEach((p: any) => {
      const date = p._id || p.date || "";
      if (!date) return;
      const rawPur = p.total_purchase_amounts || 0;
      const effectivePur = globalViewMode === "net" && totalPurchaseAmount > 0
        ? Math.max(0, rawPur - (rawPur / totalPurchaseAmount) * purchaseGstAmount)
        : rawPur;

      if (!map[date]) {
        map[date] = {
          date,
          revenue: 0,
          orders: 0,
          profit: 0,
          purchases: effectivePur,
        };
      } else {
        map[date].purchases = effectivePur;
      }
    });

    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [stats, netRevenue, salesGstAmount, totalOrders, totalProfit, netRealizedProfit, grossProfit, totalPurchaseAmount, purchaseGstAmount, globalViewMode]);

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
      filteredOrders.forEach((o: any) => {
        const orderStatus = String(o?.status || "").toUpperCase();
        if (orderStatus === "RETURNED" || orderStatus === "REFUNDED") return;

        const rawReturns: any[] = Array.isArray(o.returns) ? o.returns : [];
        let orderRefund = 0;
        rawReturns.forEach((ret: any) => {
          orderRefund += Number(ret.total_refund_amount ?? ret.refund_amount ?? ret.amount ?? 0);
        });
        const directRefund = Number(o.refund_amount ?? o.total_refund ?? 0);
        if (directRefund > orderRefund) orderRefund = directRefund;

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

        if (total > 0 && orderRefund >= total - 0.01) return;

        const netOrderAmt = Math.max(0, total - orderRefund);
        const pInfos = o.payment_infos || o.payments || {};
        if (typeof pInfos === "object" && !Array.isArray(pInfos) && Object.keys(pInfos).length > 0) {
          Object.entries(pInfos).forEach(([k, v]) => {
            const amt = Number(typeof v === "object" ? (v as any)?.amount : v) || 0;
            const norm = normalizePaymentMethod(k);
            if (counts[norm]) {
              const effectiveAmt = orderRefund > 0 ? Math.max(0, amt - orderRefund) : amt;
              counts[norm].value += effectiveAmt;
              counts[norm].count += 1;
            }
          });
        } else if (Array.isArray(pInfos) && pInfos.length > 0) {
          pInfos.forEach((p: any) => {
            const m = typeof p === "string" ? p : (p.method || p.payment_method || p.mode || "");
            const amt = Number(p.amount) || total;
            const norm = normalizePaymentMethod(m);
            if (counts[norm]) {
              const effectiveAmt = orderRefund > 0 ? Math.max(0, amt - orderRefund) : amt;
              counts[norm].value += effectiveAmt;
              counts[norm].count += 1;
            }
          });
        } else if (o.payment_method || o.payment_mode) {
          const norm = normalizePaymentMethod(o.payment_method || o.payment_mode);
          if (counts[norm]) {
            counts[norm].value += netOrderAmt;
            counts[norm].count += 1;
          }
        } else {
          counts["Cash"].value += netOrderAmt;
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
  }, [ordersList, filteredOrders, salesOverall, stats]);

  // Top Products
  const topProducts = useMemo(() => {
    if (ordersList.length > 0) {
      const prodMap: Record<string, { product_id: string; name: string; total_qty: number; total_revenue: number; total_profit: number }> = {};
      filteredOrders.forEach((o: any) => {
        const orderStatus = String(o?.status || "").toUpperCase();
        if (orderStatus === "RETURNED" || orderStatus === "REFUNDED") return;

        const rawReturns: any[] = Array.isArray(o.returns) ? o.returns : [];
        const returnedQtyMap: Record<string, number> = {};
        rawReturns.forEach((ret: any) => {
          const rItems = Array.isArray(ret.items) ? ret.items : [];
          rItems.forEach((ri: any) => {
            const q = Number(ri.quantity ?? ri.qty ?? 0);
            if (ri.order_item_id) returnedQtyMap[String(ri.order_item_id)] = (returnedQtyMap[String(ri.order_item_id)] || 0) + q;
            if (ri.product_id) returnedQtyMap[String(ri.product_id)] = (returnedQtyMap[String(ri.product_id)] || 0) + q;
            if (ri.id) returnedQtyMap[String(ri.id)] = (returnedQtyMap[String(ri.id)] || 0) + q;
          });
        });

        const items = o.items || [];
        items.forEach((item: any) => {
          const pid = item.product_id || item.inventory_id || item.id;
          if (!pid) return;
          const name = productNameMap[pid] || item.name || "Product";
          const qty = Number(item.quantity ?? item.stocks ?? 1);
          const itId = String(item.id || pid);
          let retQty = Number(item.returned_quantity ?? 0);
          if ((returnedQtyMap[itId] || 0) > retQty) retQty = returnedQtyMap[itId];
          if ((returnedQtyMap[String(pid)] || 0) > retQty) retQty = returnedQtyMap[String(pid)];
          retQty = Math.min(qty, Math.max(0, retQty));
          const netQty = Math.max(0, qty - retQty);
          if (netQty <= 0) return;

          const unitSp = Number(item.sell_price ?? (qty > 0 ? (Number(item.total_amount || 0) / qty) : 0));
          const rev = unitSp * netQty;
          const itemGst = Number(String(item.gst ?? item.gst_rate ?? "0").replace(/[^0-9.]/g, "")) || 0;
          const rawBuyPrice = Number(item.raw_buy_price ?? item.buy_price ?? 0);
          const costAtSale = Number(item.cost_at_sale ?? 0);
          let unitCostWithGst = 0;
          if (pid && productPurchaseUnitCostMap[pid] && productPurchaseUnitCostMap[pid] > 0) {
            unitCostWithGst = productPurchaseUnitCostMap[pid];
          } else if (costAtSale > 0) {
            if (itemGst > 0 && rawBuyPrice > 0 && Math.abs(costAtSale - rawBuyPrice) < 1) {
              unitCostWithGst = Math.round(costAtSale * (1 + itemGst / 100) * 100) / 100;
            } else {
              unitCostWithGst = costAtSale;
            }
          } else if (rawBuyPrice > 0) {
            unitCostWithGst = itemGst > 0 ? Math.round(rawBuyPrice * (1 + itemGst / 100) * 100) / 100 : rawBuyPrice;
          }

          const unitTransport = (!isGstReg && pid && productAllocatedChargesMap[pid] !== undefined && productAllocatedChargesMap[pid] > 0)
            ? productAllocatedChargesMap[pid]
            : 0;

          const cost = (unitCostWithGst + unitTransport) * netQty;
          const profit = rev - cost;

          if (!prodMap[pid]) {
            prodMap[pid] = { product_id: pid, name, total_qty: 0, total_revenue: 0, total_profit: 0 };
          }
          prodMap[pid].total_qty += netQty;
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
        const unitCost = Number(p.buy_price ?? p.cost_price ?? 0);
        const totalCostVal = Number(p.total_cost ?? (unitCost * totalQty));
        const totalProfitVal = Number(p.total_profit ?? (totalRev > 0 ? (totalRev - totalCostVal) : 0));
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
  }, [ordersList, filteredOrders, stats, productNameMap, productPurchaseUnitCostMap, productAllocatedChargesMap, isGstReg]);

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
    const raw = stats?.top?.top_suppliers || stats?.dashboard?.supplier?.top_suppliers || (stats as any)?.supplier?.top_suppliers || [];
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
    <div className="min-h-full w-full bg-[#F7F9FA] text-[#27364B] p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ── HEADER / FILTER CONTROL BAR ── */}
        <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-5 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-[#27364B] tracking-tight">Dashboard</h1>

              {/* Top-Level GST Registered / Tax Status Badge */}
              <div
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                  isGstReg
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
                title={
                  isGstReg
                    ? "Shop is registered for GST. Input Tax Credit (ITC) is active and claimable against sales tax."
                    : "Shop is not GST-registered. Output GST is not collected and purchase ITC cannot be claimed."
                }
              >
                <span>{isGstReg ? "GST Registered" : "Non-GST Registered"}</span>
              </div>
            </div>

            {/* Time filters & Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Segmented Range Control */}
              <div className="bg-[#F1F4F7] p-1 rounded-lg border border-[#E5EAF0] flex items-center gap-0.5 overflow-x-auto max-w-full">
                {(["today", "month", "year", "all", "custom"] as RangeKey[]).map((r) => {
                  const isActive = activeRange === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setActiveRange(r)}
                      className={`px-3 py-1.5 rounded-md text-xs transition-all duration-150 cursor-pointer shrink-0 ${
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
              <div className="flex items-center gap-2 flex-wrap">
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

        {/* ── STAT CARDS ── */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${isGstReg ? "xl:grid-cols-5" : "xl:grid-cols-4"} gap-4`}>
          
          {/* 1. Purchase */}
          <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1D9E2] transition-all duration-200 group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A]">
                      {globalViewMode === "gross" ? "Total Purchase" : "Net Purchase"}
                    </h3>
                    <CardInfoPopover
                      title="Procurement Breakdown"
                      badge={
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isGstReg
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {isGstReg ? "GST Registered" : "Non-GST Shop"}
                        </span>
                      }
                    >
                      {/* Step 1: Gross Procurement */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800">Total Procurement (incl. GST)</div>
                          <div className="text-[11px] text-[#74839A]">Gross purchases before returns</div>
                        </div>
                        <span className="font-semibold text-slate-800 tabular-nums">+{fmt(purchaseGrossSpend)}</span>
                      </div>

                      {/* Step 2: Less Purchase Returns */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800">− Purchase Returns & Debit Notes</div>
                          <div className="text-[11px] text-[#74839A]">
                            {totalPurchaseReturnsCount > 0 ? `${totalPurchaseReturnsCount} return(s) recorded` : "Goods returned to suppliers"}
                          </div>
                        </div>
                        <span className={`font-semibold tabular-nums ${totalPurchaseReturns > 0 ? "text-rose-600" : "text-slate-400"}`}>
                          {totalPurchaseReturns > 0 ? `−${fmt(totalPurchaseReturns)}` : "₹0.00"}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="pt-2 border-t border-dashed border-[#E5EAF0]" />

                      {/* Step 3: Net Realized Procurement */}
                      <div className="flex items-start justify-between gap-3 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                        <div>
                          <div className="font-bold text-emerald-950 text-xs">= Net Realized Purchase</div>
                          <div className="text-[10px] text-emerald-800 font-medium">Realized procurement spend</div>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 tabular-nums">
                          {fmt(totalPurchaseAmount)}
                        </span>
                      </div>

                      {/* Step 4: Taxable Base vs GST */}
                      <div className="space-y-1.5 pt-1 text-[11px]">
                        <div className="flex items-center justify-between text-[#74839A]">
                          <span>Taxable Spend (excl. GST):</span>
                          <span className="font-semibold text-slate-800 tabular-nums">{fmt(purchaseTaxableSpend)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#74839A]">
                          <span>Purchase Input GST:</span>
                          <span className="font-semibold text-amber-700 tabular-nums">{fmt(purchaseGstAmount)}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="pt-2 border-t border-dashed border-[#E5EAF0]" />

                      {/* Step 5: Payables Status */}
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#0D9F6E] font-medium">Paid to Suppliers:</span>
                          <span className="font-semibold text-[#0D9F6E] tabular-nums">{fmt(purchasePaidAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#D69A35] font-medium">Outstanding Payables:</span>
                          <span className="font-semibold text-[#D69A35] tabular-nums">{fmt(totalPurchaseOutstanding)}</span>
                        </div>
                      </div>
                    </CardInfoPopover>
                  </div>
                  <p className="text-xs text-[#74839A] font-medium mt-0.5">
                    {globalViewMode === "gross" ? "Procurement spend incl. GST" : "Procurement spend excl. GST"}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F1F4F7] text-[#27364B] shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <ShoppingBag className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-[26px] font-semibold text-[#27364B] tracking-tight leading-none tabular-nums truncate" title={fmt(displayedPurchase)}>
                  {loading ? "—" : fmt(displayedPurchase)}
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
              {totalPurchaseReturns > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">Returns</span>
                  </div>
                  <span className="font-semibold text-rose-600 tabular-nums">
                    -{loading ? "—" : fmt(totalPurchaseReturns)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Revenue */}
          <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1D9E2] transition-all duration-200 group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A]">
                      {globalViewMode === "gross" ? "Gross Revenue" : "Net Revenue"}
                    </h3>
                    <CardInfoPopover
                      title="Revenue Breakdown"
                      badge={
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          globalViewMode === "gross"
                            ? "bg-slate-50 text-slate-700 border-slate-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {globalViewMode === "gross" ? "Gross (incl. GST)" : "Net (excl. GST)"}
                        </span>
                      }
                    >
                      {/* Step 1: Gross Sales */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800">Gross Sales (incl. GST)</div>
                          <div className="text-[11px] text-[#74839A]">Total orders before returns</div>
                        </div>
                        <span className="font-semibold text-slate-800 tabular-nums">+{fmt(salesGrossRevenue)}</span>
                      </div>

                      {/* Step 2: Less Returns */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-800">− Sales Returns & Refunds</div>
                          <div className="text-[11px] text-[#74839A]">
                            {fullyReturnedOrdersCount > 0 || partiallyReturnedOrdersCount > 0
                              ? `${fullyReturnedOrdersCount + partiallyReturnedOrdersCount} return(s) reversed`
                              : "No returns in this period"}
                          </div>
                        </div>
                        <span className={`font-semibold tabular-nums ${salesReturnsRefunds > 0 ? "text-rose-600" : "text-slate-400"}`}>
                          {salesReturnsRefunds > 0 ? `−${fmt(salesReturnsRefunds)}` : "₹0.00"}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="pt-2 border-t border-dashed border-[#E5EAF0]" />

                      {/* Step 3: Net Realized Revenue */}
                      <div className="flex items-start justify-between gap-3 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                        <div>
                          <div className="font-bold text-emerald-950 text-xs">= Net Realized Revenue</div>
                          <div className="text-[10px] text-emerald-800 font-medium">Realized sales cash inflow</div>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 tabular-nums">
                          {fmt(salesRevenueWithGst)}
                        </span>
                      </div>

                      {/* Step 4: Taxable Base vs GST */}
                      <div className="space-y-1.5 pt-1 text-[11px]">
                        <div className="flex items-center justify-between text-[#74839A]">
                          <span>Taxable Revenue (excl. GST):</span>
                          <span className="font-semibold text-slate-800 tabular-nums">{fmt(salesTaxableRevenue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#74839A]">
                          <span>Output GST on Sales:</span>
                          <span className="font-semibold text-amber-700 tabular-nums">{fmt(salesGstAmount)}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="pt-2 border-t border-dashed border-[#E5EAF0]" />

                      {/* Step 5: Collections */}
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#0D9F6E] font-medium">Net Received:</span>
                          <span className="font-semibold text-[#0D9F6E] tabular-nums">{fmt(receivedAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#D69A35] font-medium">Outstanding:</span>
                          <span className="font-semibold text-[#D69A35] tabular-nums">{fmt(customerOutstanding)}</span>
                        </div>
                      </div>
                    </CardInfoPopover>
                  </div>
                  <p className="text-xs text-[#74839A] font-medium mt-0.5">
                    {globalViewMode === "gross" ? "Total incl. GST" : "Taxable excl. GST"}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#EAF2E8] text-[#286038] shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <IndianRupee className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-[26px] font-semibold text-[#27364B] tracking-tight leading-none tabular-nums truncate" title={fmt(displayedRevenue)}>
                  {loading ? "—" : fmt(displayedRevenue)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#E5EAF0] space-y-1.5">
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
              {salesReturnsRefunds > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="font-medium text-[#74839A]">Returns</span>
                  </div>
                  <span className="font-semibold text-rose-600 tabular-nums">-{loading ? "—" : fmt(salesReturnsRefunds)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Total Profit */}
          <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1D9E2] transition-all duration-200 group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A]">
                      {!isGstReg ? "Total Profit" : (globalViewMode === "gross" ? "Total Profit" : "Net Profit")}
                    </h3>
                    <CardInfoPopover
                      title={!isGstReg ? "Net Profit Breakdown" : "Profit Calculation Breakdown"}
                      badge={
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isGstReg
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {isGstReg ? "GST Registered" : "Non-GST Shop"}
                        </span>
                      }
                    >
                      {!isGstReg ? (
                        <>
                          {/* Non-GST Shop Profit Calculation Breakdown */}
                          {salesReturnedProfit > 0 ? (
                            <>
                              {/* Line 1: Gross Sales Margin */}
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-slate-800">Gross Sales Margin</div>
                                  <div className="text-[11px] text-[#74839A]">
                                    Total Sales {fmt(initialSalesRevenue)} − Buy Cost {fmt(initialPurchaseCost)}
                                  </div>
                                </div>
                                <span className="font-semibold text-slate-800 tabular-nums">+{fmt(initialGrossProfit)}</span>
                              </div>

                              {/* Line 2: Reversed Return Profit */}
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-slate-800">− Reversed Return Profit</div>
                                  <div className="text-[11px] text-[#74839A]">Reversed on returned orders</div>
                                </div>
                                <span className="font-semibold text-rose-600 tabular-nums">−{fmt(salesReturnedProfit)}</span>
                              </div>

                              {/* Line 3: Retained Profit */}
                              <div className="flex items-start justify-between gap-3 py-1 border-t border-slate-100">
                                <div>
                                  <div className="font-semibold text-slate-700 text-xs">
                                    {transportCharges > 0 ? "= Retained Profit before freight" : "= Retained Profit"}
                                  </div>
                                  <div className="text-[10px] text-[#74839A]">
                                    Delivered Sell {fmt(sellingPrice)} − Buy Cost {fmt(purchaseCost)}
                                  </div>
                                </div>
                                <span className="font-semibold text-slate-700 tabular-nums">+{fmt(grossProfit)}</span>
                              </div>
                            </>
                          ) : (
                            /* Line 1: Gross Margin (No returns) */
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-800">Gross Margin</div>
                                <div className="text-[11px] text-[#74839A]">
                                  Sell {fmt(sellingPrice)} − Buy Cost {fmt(purchaseCost)}
                                </div>
                              </div>
                              <span className="font-semibold text-slate-800 tabular-nums">+{fmt(grossProfit)}</span>
                            </div>
                          )}

                          {/* Line 4: Transport & Other Charges (only shown if incurred) */}
                          {transportCharges > 0 && (
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-800">− Transport & Other Charges</div>
                                <div className="text-[11px] text-[#74839A]">Allocated freight & procurement charges</div>
                              </div>
                              <span className="font-semibold text-purple-700 tabular-nums">−{fmt(transportCharges)}</span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-dashed border-[#E5EAF0]" />

                          <div className="flex items-start justify-between gap-3 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                            <div>
                              <div className="font-bold text-emerald-950 text-xs">= Net Profit</div>
                              <div className="text-[10px] text-emerald-800 font-medium">
                                True cash profit in hand ({netProfitMargin.toFixed(1)}% margin)
                              </div>
                            </div>
                            <span className="text-sm font-bold text-emerald-700 tabular-nums">
                              {fmt(netRealizedProfit)}
                            </span>
                          </div>

                          <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                            Non-GST seller does not charge GST and cannot claim Input Tax Credit (ITC). Total procurement cost includes taxes.
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Step 1 to 3: Gross Profit & Returns */}
                          {salesReturnedProfit > 0 ? (
                            <>
                              {/* Line 1: Gross Sales Profit */}
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-slate-800">Gross Sales Profit: {fmt(initialGrossProfit)}</div>
                                  <div className="text-[11px] text-[#74839A]">
                                    Delivered Sell {fmt(initialSalesRevenue)} − Buy Cost {fmt(initialPurchaseCost)}
                                  </div>
                                </div>
                                <span className="font-semibold text-slate-800 tabular-nums">+{fmt(initialGrossProfit)}</span>
                              </div>

                              {/* Line 2: Returned Sales Profit */}
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-slate-800">− Returned Sales Profit</div>
                                  <div className="text-[11px] text-[#74839A]">Reversed on returned orders</div>
                                </div>
                                <span className="font-semibold text-rose-600 tabular-nums">−{fmt(salesReturnedProfit)}</span>
                              </div>

                              {/* Line 3: Retained Gross Profit */}
                              <div className="flex items-start justify-between gap-3 py-1 border-t border-slate-100">
                                <div>
                                  <div className="font-semibold text-slate-700 text-xs">= Retained Gross Profit</div>
                                  <div className="text-[10px] text-[#74839A]">
                                    Delivered Sell {fmt(sellingPrice)} − Buy Cost {fmt(purchaseCost)}
                                  </div>
                                </div>
                                <span className="font-semibold text-slate-700 tabular-nums">+{fmt(grossProfit)}</span>
                              </div>
                            </>
                          ) : (
                            /* Line 1: Gross Profit (No returns) */
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-800">Gross Profit: {fmt(grossProfit)}</div>
                                <div className="text-[11px] text-[#74839A]">
                                  Delivered Sell {fmt(sellingPrice)} − Buy Cost {fmt(purchaseCost)}
                                </div>
                              </div>
                              <span className="font-semibold text-slate-800 tabular-nums">+{fmt(grossProfit)}</span>
                            </div>
                          )}

                          {/* Step 4: Output GST */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-800">
                                − Output GST <span className="font-normal text-[#74839A]">(Active Sales GST)</span>
                              </div>
                              <div className="text-[11px] text-[#74839A]">
                                Collected for government on sales
                              </div>
                            </div>
                            <span className="font-semibold tabular-nums text-amber-700">
                              −{fmt(salesGstAmount)}
                            </span>
                          </div>

                          {/* Step 5: Input Tax Credit */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-800">
                                + Input Tax Credit <span className="font-normal text-[#74839A]">(ITC)</span>
                              </div>
                              <div className="text-[11px] text-[#74839A]">
                                ITC claimed back on purchased stock
                              </div>
                            </div>
                            <span className="font-semibold tabular-nums text-emerald-600">
                              +{fmt(itcAmount)}
                            </span>
                          </div>

                          {/* Step 6: Transport & Other Charges (only shown if incurred) */}
                          {transportCharges > 0 && (
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-800">− Transport & Other Charges</div>
                                <div className="text-[11px] text-[#74839A]">Allocated freight per sale</div>
                              </div>
                              <span className="font-semibold text-purple-700 tabular-nums">−{fmt(transportCharges)}</span>
                            </div>
                          )}

                          {/* Divider */}
                          <div className="pt-2 border-t border-dashed border-[#E5EAF0]" />

                          {/* Step 7: Net Realized Profit */}
                          <div className="flex items-start justify-between gap-3 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                            <div>
                              <div className="font-bold text-emerald-950 text-xs">= Net Realized Profit</div>
                              <div className="text-[10px] text-emerald-800 font-medium">
                                True cash profit in hand ({netProfitMargin.toFixed(1)}% margin)
                              </div>
                            </div>
                            <span className="text-sm font-bold text-emerald-700 tabular-nums">
                              {fmt(netRealizedProfit)}
                            </span>
                          </div>
                        </>
                      )}
                    </CardInfoPopover>
                  </div>
                  <p className="text-xs text-[#74839A] font-medium mt-0.5">
                    {!isGstReg
                      ? "Earnings (Sell − Cost − Charges)"
                      : (globalViewMode === "gross" ? "Gross Profit (Sell − Cost)" : "Net Realized Profit")}
                  </p>
                </div>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    displayedProfit >= 0
                      ? "bg-[#EBF8F2] text-[#0D9F6E]"
                      : "bg-[#FDF2F2] text-[#DC6464]"
                  }`}
                >
                  <TrendingUp className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>

              {/* Profit Value Display */}
              <div className="flex items-end gap-2 mt-3">
                <span
                  className={`text-[26px] font-semibold tracking-tight leading-none tabular-nums truncate ${
                    displayedProfit >= 0 ? "text-[#0D9F6E]" : "text-[#DC6464]"
                  }`}
                  title={fmt(displayedProfit)}
                >
                  {loading ? "—" : fmt(displayedProfit)}
                </span>
                {!loading && (
                  displayedProfit >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-[#0D9F6E] shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-[#DC6464] shrink-0" />
                  )
                )}
              </div>
            </div>

            {/* Bottom Card Summary */}
            <div className="mt-5 pt-3.5 border-t border-[#E5EAF0] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">Status:</span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  displayedProfit >= 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${displayedProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {displayedProfit >= 0 ? "Profitable" : "Loss"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">
                  {!isGstReg ? "Profit Margin:" : (globalViewMode === "gross" ? "Gross Margin:" : "Net Margin:")}
                </span>
                <span className={`font-semibold tabular-nums ${displayedProfit >= 0 ? "text-[#0D9F6E]" : "text-rose-600"}`}>
                  {loading ? "—" : `${displayedMargin.toFixed(1)}%`}
                </span>
              </div>
              {salesReturnedProfit > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">Returns</span>
                  </div>
                  <span className="font-semibold text-rose-600 tabular-nums">
                    -{loading ? "—" : fmt(salesReturnedProfit)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 4. GST Payable (Only shown for GST Registered shops) */}
          {isGstReg && (
          <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1D9E2] transition-all duration-200 group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A]">
                      GST Payable
                    </h3>
                    <CardInfoPopover
                      title="GST Payable Breakdown"
                      badge={
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isGstReg
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {isGstReg ? "GST Registered (ITC Active)" : "Non-GST Shop"}
                        </span>
                      }
                    >
                      {!isGstReg ? (
                        <>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-[#74839A]">
                              <span>Output Sales GST:</span>
                              <span className="font-semibold text-slate-800 tabular-nums">₹0.00</span>
                            </div>
                            <div className="flex items-center justify-between text-[#74839A]">
                              <span>Input Purchase GST:</span>
                              <span className="font-semibold text-slate-800 tabular-nums">₹0.00</span>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-dashed border-[#E5EAF0]" />
                          <div className="flex items-start justify-between gap-3 bg-amber-50/70 p-2.5 rounded-lg border border-amber-100">
                            <div>
                              <div className="font-bold text-amber-950 text-xs">= Net GST Payable</div>
                              <div className="text-[10px] text-amber-800 font-medium">Non-GST registered shop</div>
                            </div>
                            <span className="text-sm font-bold text-amber-700 tabular-nums">
                              ₹0.00
                            </span>
                          </div>
                          <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                            Non-GST registered sellers do not collect GST on sales and cannot claim input tax credit. No GST is payable to the government.
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Output GST (Sales GST) */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-800">+ Output GST (Sales GST)</div>
                              <div className="text-[11px] text-[#74839A]">Collected on taxable sales</div>
                            </div>
                            <span className="font-semibold text-amber-700 tabular-nums">+{fmt(salesGstAmount)}</span>
                          </div>

                          {/* Input Tax Credit (Purchase GST on sales) */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-800">− Input Tax Credit (Purchase GST on sales)</div>
                              <div className="text-[11px] text-[#74839A]">ITC credit on sold stock</div>
                            </div>
                            <span className="font-semibold text-emerald-600 tabular-nums">−{fmt(salesBasedPurchaseGst)}</span>
                          </div>

                          {/* Divider */}
                          <div className="pt-2 border-t border-dashed border-[#E5EAF0]" />

                          {/* Net GST Payable Result */}
                          <div className={`flex items-start justify-between gap-3 p-2.5 rounded-lg border ${
                            netGstPayable > 0
                              ? "bg-amber-50/70 border-amber-200 text-amber-950"
                              : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          }`}>
                            <div>
                              <div className="font-bold text-xs">
                                {netGstPayable > 0 ? "= Net GST Payable" : "= Net GST Payable (Nil)"}
                              </div>
                              <div className={`text-[10px] font-medium ${netGstPayable > 0 ? "text-amber-800" : "text-emerald-800"}`}>
                                {netGstPayable > 0 ? "Payable to government" : "Surplus ITC available"}
                              </div>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${netGstPayable > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                              {fmt(netGstPayable)}
                            </span>
                          </div>

                          {/* Explanation Banner */}
                          <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                            netGstPayable > 0
                              ? "bg-amber-50/70 border-amber-200/80 text-amber-900"
                              : "bg-emerald-50/70 border-emerald-200/80 text-emerald-900"
                          }`}>
                            {netGstPayable > 0 ? (
                              "Sales GST exceeds purchase ITC on sold goods. Net balance is payable to the government on monthly return filing."
                            ) : itcSurplus > 0 ? (
                              `Purchase ITC exceeds sales tax. No tax is payable this period; surplus ITC of ${fmt(itcSurplus)} is carried forward to offset future sales tax.`
                            ) : (
                              "Sales GST and purchase ITC are balanced. No GST is payable to the government for this period."
                            )}
                          </div>

                          {purchaseGstAmount > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-[#74839A] pt-1 px-0.5 border-t border-dashed border-[#E5EAF0]">
                              <span>Total Procurement ITC:</span>
                              <span className="font-semibold text-slate-700 tabular-nums">
                                {fmt(purchaseGstAmount)} <span className="text-[10px] font-normal text-[#74839A]">(across total batch purchases)</span>
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </CardInfoPopover>
                  </div>
                  <p className="text-xs text-[#74839A] font-medium mt-0.5">
                    {isGstReg ? "Output GST − Input Tax Credit" : "Exempt / Non-GST Registered"}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-700 shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <Receipt className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>

              {/* Main Amount */}
              <div className="flex items-end gap-2 mt-3">
                <span
                  className={`text-[26px] font-semibold tracking-tight leading-none tabular-nums truncate ${
                    !isGstReg
                      ? "text-slate-400"
                      : netGstPayable > 0
                      ? "text-amber-600"
                      : "text-[#0D9F6E]"
                  }`}
                  title={!isGstReg ? "Exempt (₹0.00)" : fmt(netGstPayable)}
                >
                  {loading ? "—" : (!isGstReg ? "₹0.00" : fmt(netGstPayable))}
                </span>
                {!loading && isGstReg && itcSurplus > 0 && (
                  <span className="text-[11px] font-semibold text-[#0D9F6E] mb-0.5 truncate" title={`ITC Surplus: ${fmt(itcSurplus)}`}>
                    (Surplus)
                  </span>
                )}
                {!loading && !isGstReg && (
                  <span className="text-[11px] font-semibold text-slate-400 mb-0.5">
                    (Exempt)
                  </span>
                )}
              </div>
              <div className="text-[11px] font-medium text-[#74839A] mt-1">
                {!isGstReg ? (
                  <span className="text-slate-400">Non-GST Shop (Tax Exempt)</span>
                ) : netGstPayable > 0 ? (
                  <>
                    Liability: <span className="font-semibold text-amber-600">Net Tax Payable</span>
                  </>
                ) : itcSurplus > 0 ? (
                  <>
                    ITC Surplus: <span className="font-semibold text-[#0D9F6E]">{loading ? "—" : fmt(itcSurplus)}</span>
                  </>
                ) : (
                  <>
                    Balance: <span className="font-semibold text-[#27364B]">₹0.00</span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#E5EAF0]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">Period</span>
                <span className="font-medium text-[#27364B]">{RANGE_LABELS[activeRange]}</span>
              </div>
            </div>
          </div>
          )}

          {/* 5. Total Orders */}
          <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1D9E2] transition-all duration-200 group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A]">Total Orders</h3>
                    <CardInfoPopover
                      title="Orders Breakdown"
                      badge={
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                          {RANGE_LABELS[activeRange]}
                        </span>
                      }
                    >
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[#74839A]">
                          <span>Total Orders Placed:</span>
                          <span className="font-semibold text-slate-800 tabular-nums">{totalOrdersPlacedCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#74839A]">
                          <span>Completed Orders:</span>
                          <span className="font-semibold text-emerald-700 tabular-nums">{completedOrdersCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#74839A]">
                          <span>Fully Returned Orders:</span>
                          <span className={`font-semibold tabular-nums ${fullyReturnedOrdersCount > 0 ? "text-rose-600" : "text-slate-600"}`}>
                            {fullyReturnedOrdersCount}
                          </span>
                        </div>
                        {partiallyReturnedOrdersCount > 0 && (
                          <div className="flex items-center justify-between text-[#74839A]">
                            <span>Partially Returned Orders:</span>
                            <span className="font-semibold text-amber-700 tabular-nums">{partiallyReturnedOrdersCount}</span>
                          </div>
                        )}
                        {exchangedOrdersCount > 0 && (
                          <div className="flex items-center justify-between text-[#74839A]">
                            <span>Exchange Orders:</span>
                            <span className="font-semibold text-blue-700 tabular-nums">{exchangedOrdersCount}</span>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="pt-2 border-t border-dashed border-[#E5EAF0]" />

                      {/* Net Active Orders */}
                      <div className="flex items-start justify-between gap-3 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                        <div>
                          <div className="font-bold text-emerald-950 text-xs">= Net Active Delivered Orders</div>
                          <div className="text-[10px] text-emerald-800 font-medium">Completed minus fully returned</div>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 tabular-nums">
                          {totalOrders}
                        </span>
                      </div>
                    </CardInfoPopover>
                  </div>
                  <p className="text-xs text-[#74839A] font-medium mt-0.5">
                    {fullyReturnedOrdersCount > 0
                      ? `${totalOrders} active (${fullyReturnedOrdersCount} returned)`
                      : RANGE_LABELS[activeRange]}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#FEF8EC] text-[#D69A35] shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <ShoppingCart className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-[26px] font-semibold text-[#27364B] tracking-tight leading-none tabular-nums">
                  {loading ? "—" : totalOrders.toLocaleString()}
                </span>
                {fullyReturnedOrdersCount > 0 && (
                  <span className="text-xs font-semibold text-rose-600 mb-1">
                    ({fullyReturnedOrdersCount} returned)
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#E5EAF0]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[#74839A] uppercase tracking-wider">Period</span>
                <span className="font-medium text-[#27364B]">{RANGE_LABELS[activeRange]}</span>
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
                <p className="text-xs text-[#74839A] font-medium">
                  {!isGstReg ? "Profit Margin" : (globalViewMode === "gross" ? "Gross Margin" : "Net Margin")}
                </p>
                <div className="flex items-baseline gap-2.5 mt-1 mb-3">
                  <span className={`text-2xl font-semibold tabular-nums ${displayedMargin >= 0 ? "text-[#27364B]" : "text-[#DC6464]"}`}>
                    {displayedMargin.toFixed(2)}%
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${displayedMargin >= 0 ? "bg-[#EBF8F2] text-[#0D9F6E]" : "bg-[#FDF2F2] text-[#DC6464]"}`}>
                    {displayedMargin >= 0 ? "Profitable" : "Loss"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#EAF2E8] rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`${displayedMargin >= 0 ? "bg-[#0D9F6E]" : "bg-[#DC6464]"} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, Math.abs(displayedMargin)))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-[#74839A]">
                  <span>0%</span>
                  <span>Margin: {displayedMargin.toFixed(2)}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="bg-white rounded-xl p-5 border border-[#E5EAF0] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#74839A] mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* 1. Orders */}
                  <div className="bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl p-3 hover:bg-white hover:border-[#D1D9E2] transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-[#74839A]">Orders</span>
                      <CardInfoPopover
                        title="Orders Breakdown"
                        align="end"
                        badge={
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                            {RANGE_LABELS[activeRange]}
                          </span>
                        }
                      >
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[#74839A]">
                            <span>Completed Orders:</span>
                            <span className="font-semibold text-slate-800 tabular-nums">{completedOrdersCount || totalOrders}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#74839A]">
                            <span>Active Orders:</span>
                            <span className="font-semibold text-emerald-700 tabular-nums">{totalOrders}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#74839A]">
                            <span>Returned Orders:</span>
                            <span className={`font-semibold tabular-nums ${totalReturnsCount > 0 ? "text-rose-600" : "text-slate-600"}`}>
                              {totalReturnsCount}
                            </span>
                          </div>
                        </div>
                      </CardInfoPopover>
                    </div>
                    <p className="text-lg font-semibold text-[#27364B] tabular-nums">{totalOrders}</p>
                  </div>

                  {/* 2. Profit */}
                  <div className="bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl p-3 hover:bg-white hover:border-[#D1D9E2] transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-[#74839A]">{totalProfit >= 0 ? "Profit" : "Loss"}</span>
                      <CardInfoPopover
                        title="Profit Summary"
                        align="end"
                        badge={
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            totalProfit >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {displayedMargin.toFixed(1)}% Margin
                          </span>
                        }
                      >
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[#74839A]">
                            <span>Gross Margin:</span>
                            <span className="font-semibold text-slate-800 tabular-nums">{fmt(grossProfit)}</span>
                          </div>
                          {transportCharges > 0 && (
                            <div className="flex items-center justify-between text-[#74839A]">
                              <span>Transport Charges:</span>
                              <span className="font-semibold text-rose-600 tabular-nums">-{fmt(transportCharges)}</span>
                            </div>
                          )}
                          {isGstReg && (
                            <>
                              <div className="flex items-center justify-between text-[#74839A]">
                                <span>Output GST:</span>
                                <span className="font-semibold text-rose-600 tabular-nums">-{fmt(outputGstDeduction)}</span>
                              </div>
                              <div className="flex items-center justify-between text-[#74839A]">
                                <span>Input GST (ITC):</span>
                                <span className="font-semibold text-emerald-700 tabular-nums">+{fmt(itcAmount)}</span>
                              </div>
                            </>
                          )}
                          <div className="pt-2 border-t border-dashed border-[#E5EAF0] flex items-center justify-between font-bold text-slate-800">
                            <span>Net Realized Profit:</span>
                            <span className={`tabular-nums ${totalProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                              {fmt(totalProfit)}
                            </span>
                          </div>
                        </div>
                      </CardInfoPopover>
                    </div>
                    <p className={`text-lg font-semibold tabular-nums truncate ${totalProfit >= 0 ? "text-[#0D9F6E]" : "text-[#DC6464]"}`} title={fmt(totalProfit)}>
                      {fmt(totalProfit)}
                    </p>
                  </div>

                  {/* 3. AOV */}
                  <div className="bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl p-3 hover:bg-white hover:border-[#D1D9E2] transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-[#74839A]">AOV</span>
                      <CardInfoPopover
                        title="Avg. Order Value (AOV)"
                        align="end"
                        badge={
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                            Revenue ÷ Orders
                          </span>
                        }
                      >
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[#74839A]">
                            <span>Delivered Net Revenue:</span>
                            <span className="font-semibold text-slate-800 tabular-nums">{fmt(displayedRevenue)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#74839A]">
                            <span>Active Orders:</span>
                            <span className="font-semibold text-slate-800 tabular-nums">{totalOrders}</span>
                          </div>
                          <div className="pt-2 border-t border-dashed border-[#E5EAF0] flex items-center justify-between font-bold text-slate-800">
                            <span>Avg. Order Value:</span>
                            <span className="text-emerald-700 tabular-nums">{fmt(displayedAov)}</span>
                          </div>
                        </div>
                      </CardInfoPopover>
                    </div>
                    <p className="text-lg font-semibold text-[#27364B] tabular-nums truncate" title={fmt(displayedAov)}>
                      {fmt(displayedAov)}
                    </p>
                  </div>

                  {/* 4. Returns */}
                  <div className="bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl p-3 hover:bg-white hover:border-[#D1D9E2] transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-[#74839A]">Returns</span>
                      <CardInfoPopover
                        title="Returns Breakdown"
                        align="end"
                        badge={
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                            {totalReturnsCount} Returned
                          </span>
                        }
                      >
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[#74839A]">
                            <span>Fully Returned Orders:</span>
                            <span className="font-semibold text-rose-600 tabular-nums">{fullyReturnedOrdersCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#74839A]">
                            <span>Partially Returned:</span>
                            <span className="font-semibold text-slate-800 tabular-nums">{partiallyReturnedOrdersCount}</span>
                          </div>
                          {salesReturnsRefunds > 0 && (
                            <div className="flex items-center justify-between text-[#74839A]">
                              <span>Refund Amount:</span>
                              <span className="font-semibold text-rose-600 tabular-nums">-{fmt(salesReturnsRefunds)}</span>
                            </div>
                          )}
                          {salesReturnedProfit > 0 && (
                            <div className="flex items-center justify-between text-[#74839A]">
                              <span>Reversed Profit:</span>
                              <span className="font-semibold text-rose-600 tabular-nums">-{fmt(salesReturnedProfit)}</span>
                            </div>
                          )}
                        </div>
                      </CardInfoPopover>
                    </div>
                    <p className={`text-lg font-semibold tabular-nums ${totalReturnsCount > 0 ? "text-rose-600" : "text-[#27364B]"}`}>
                      {totalReturnsCount}
                    </p>
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
              <div className="p-5 flex flex-col justify-between min-h-[340px]">
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
                  <div className="text-center p-2.5 bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl hover:bg-white transition-colors min-w-0">
                    <div className="mb-1 flex justify-center">
                      <BarChart2 className="w-3.5 h-3.5 text-[#286038]" />
                    </div>
                    <p className="text-xs font-semibold text-[#27364B] tabular-nums">{displayedMargin.toFixed(1)}%</p>
                    <p className="text-[10px] font-medium text-[#74839A] uppercase tracking-wider mt-0.5">
                      {!isGstReg ? "Net Margin" : (globalViewMode === "gross" ? "Gross Margin" : "Net Margin")}
                    </p>
                  </div>
                  <div className="text-center p-2.5 bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl hover:bg-white transition-colors min-w-0">
                    <div className="mb-1 flex justify-center">
                      <ShoppingCart className="w-3.5 h-3.5 text-[#74839A]" />
                    </div>
                    <p className="text-xs font-semibold text-[#27364B] tabular-nums">{totalOrders}</p>
                    <p className="text-[10px] font-medium text-[#74839A] uppercase tracking-wider mt-0.5">Total Orders</p>
                  </div>
                  <div className="text-center p-2.5 bg-[#F7F9FA] border border-[#E5EAF0] rounded-xl hover:bg-white transition-colors min-w-0">
                    <div className="mb-1 flex justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0D9F6E]" />
                    </div>
                    <p className="text-xs font-semibold text-[#27364B] tabular-nums truncate" title={fmt(displayedAov)}>{fmtShort(displayedAov)}</p>
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
                            <span className="text-[#74839A]">{s.total_qty} {s.total_qty === 1 ? "item" : "items"}</span>
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

      {/* Profit & Tax Calculation Breakdown Modal */}
      <ProfitBreakdownModal
        isOpen={isBreakdownOpen}
        onClose={() => setIsBreakdownOpen(false)}
        isGstReg={isGstReg}
        sellingPrice={salesRevenueWithGst > 0 ? salesRevenueWithGst : netRevenue}
        purchaseCost={effectiveCost}
        grossProfit={grossProfit}
        salesGstAmount={salesGstAmount}
        transportCharges={transportCharges}
        purchaseGstClaimed={purchaseGstClaimed}
        netRealizedProfit={netRealizedProfit}
        netProfitMargin={netProfitMargin}
        grossMargin={grossMargin}
        fmt={fmt}
        salesReturnedProfit={salesReturnedProfit}
        initialGrossProfit={initialGrossProfit}
        initialSellingPrice={initialSalesRevenue}
        initialPurchaseCost={initialPurchaseCost}
      />
    </div>
  );
};

export default AnalyticsDashboard;
