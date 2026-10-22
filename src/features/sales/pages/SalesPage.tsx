import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, X,
  RotateCcw, Receipt,
  ChevronRight, Filter, Eye, Printer, FileText
} from "lucide-react";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import {
  TrendingUp,
  ExternalLink, Globe, Store, RotateCw, Percent
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
import { extractSaleCustomerInfo } from "../type";
import { ReprintReceiptModal } from "../components/ReprintReceiptModal";
import { SaleInvoiceModal } from "../components/SaleInvoiceModal";
import { BiLogoWhatsapp } from "react-icons/bi";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type OriginType = "Offline" | "Offline Return" | "Online";
type SaleStatus = "Completed" | "Pending" | "Cancelled";
type SaleRecord = OrderResponse;

const fmt = (n?: number) => {
  if (n === undefined || n === null || isNaN(Number(n))) return "₹0";
  const num = Number(n);
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
};

function parseSaleDateTime(dateVal?: any): Date {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  let str = String(dateVal).trim().replace(" ", "T");
  if (str.includes("T") && !str.endsWith("Z") && !str.includes("+") && !/[0-9]-[0-9]{2}:[0-9]{2}$/.test(str)) {
    const utcDate = new Date(str + "Z");
    if (!isNaN(utcDate.getTime())) return utcDate;
  }
  const parsed = new Date(str.includes("T") ? str : str + "T00:00:00");
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function fmtDate(dateVal?: any) {
  if (!dateVal) return "—";
  const d = parseSaleDateTime(dateVal);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(dateVal?: any) {
  if (!dateVal) return "";
  const d = parseSaleDateTime(dateVal);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function checkSaleDiscount(s: any): { hasDiscount: boolean; discountAmount: number } {
  if (!s) return { hasDiscount: false, discountAmount: 0 };
  const calc = s.calculation_infos || s.calculations || s.calc_infos;
  
  let discAmt = 0;
  if (calc) {
    discAmt = Number(calc.total_discount_given ?? calc.discount_total ?? calc.total_discount ?? 0);
    if (discAmt <= 0) {
      const pDisc = Number(calc.product_discount_total || 0);
      const lDisc = Number(calc.line_discount_total || 0);
      const bDisc = Number(calc.bill_discount_total || 0);
      discAmt = pDisc + lDisc + bDisc;
    }
  }

  if (discAmt <= 0) {
    discAmt = Number(s.discount_amount ?? s.total_discount ?? s.discount ?? s.charges_infos?.discount ?? 0);
  }

  let hasDiscFromItems = false;
  const items = Array.isArray(calc?.items) ? calc.items : (Array.isArray(s.items) ? s.items : []);
  if (items.length > 0) {
    for (const it of items) {
      const itDiscAmt = Number(it.product_discount_amount || 0) +
        Number(it.line_discount_amount || 0) +
        Number(it.bill_discount_share || 0) +
        Number(it.discount_amount || 0);
      const itDiscPct = Number(it.discount_percent || 0) +
        Number(it.line_discount_value || 0) +
        Number(it.product_discount_percent || 0);
      if (itDiscAmt > 0 || itDiscPct > 0) {
        hasDiscFromItems = true;
        if (discAmt <= 0 && itDiscAmt > 0) {
          discAmt += itDiscAmt;
        }
      }
    }
  }

  const hasDiscount = discAmt > 0 || hasDiscFromItems;
  return { hasDiscount, discountAmount: discAmt };
}

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
  "On Credit": { cls: "bg-[var(--ps-draft-bg)] text-[var(--ps-draft-tx)] border border-[var(--ps-draft-bd)]", dot: "bg-[var(--ps-draft-dot)]" },
  Other: { cls: "bg-[var(--pay-pending-bg)] text-[var(--pay-pending-tx)] border border-[var(--pay-pending-bd)]", dot: "bg-[var(--pay-pending-dot)]" },
};
const STATUS_CFG: Record<string, BadgeConfig> = {
  Completed: { cls: "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]", dot: "bg-[var(--ps-completed-dot)]" },
  Delivered: { cls: "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]", dot: "bg-[var(--ps-completed-dot)]" },
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
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('clear-api-cache'));
            window.dispatchEvent(new CustomEvent('refresh-sales'));
          }}
          className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
          title="Refresh"
        >
          <RotateCw size={13} />
        </button>
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

  // Hook to handle the global refresh event
  useEffect(() => {
    const handleRefresh = () => {
      // the actual reload function is returned from useInfiniteScroll below
      const event = new CustomEvent('do-refresh-sales');
      document.dispatchEvent(event);
    };
    window.addEventListener('refresh-sales', handleRefresh);
    return () => window.removeEventListener('refresh-sales', handleRefresh);
  }, []);


  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeKpi, setActiveKpi] = useState("Total Orders");
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
  const [customerMap, setCustomerMap] = useState<Record<string, any>>({});
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [isReturnSearchOpen, setIsReturnSearchOpen] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [returnSale, setReturnSale] = useState<SaleRecord | null>(null);
  const [reprintSale, setReprintSale] = useState<SaleRecord | null>(null);
  const [invoiceModalSale, setInvoiceModalSale] = useState<SaleRecord | null>(null);

  const handleSendWhatsApp = useCallback((sale: any) => {
    const c = extractSaleCustomerInfo(sale, customerMap);
    if (c.isWalkIn) {
      alert("WhatsApp invoice is not available for walk-in customers.");
      return;
    }
    let phoneNum = (c.phone || "").replace(/[^0-9]/g, "");
    if (!phoneNum) {
      alert("No phone number found for this customer.");
      return;
    }
    if (phoneNum.length === 10) {
      phoneNum = "91" + phoneNum;
    }

    const rawItems = Array.isArray(sale.items) ? sale.items : (Array.isArray(sale.calculation_infos?.items) ? sale.calculation_infos.items : []);
    const itemsText = rawItems
      .slice(0, 5)
      .map((it: any) => `• ${(it.name || it.product_name || "Item")} x ${(it.quantity || it.qty || 1)} - ₹${Number(it.final_inclusive || it.sell_price || it.total_amount || 0).toFixed(2)}`)
      .join("\n");
    const moreCount = rawItems.length > 5 ? `\n...and ${rawItems.length - 5} more items` : "";

    const orderId = sale.ui_id || sale.order_id || sale.id;
    const total = Number(sale.total_sellprice || sale.total_amount || 0).toFixed(2);
    const shopName = localStorage.getItem("shop_name") || "Our Store";

    const isInvoice = Boolean(
      (sale as any).billing_type === "INVOICE" ||
      sale.additional_infos?.billing_type === "INVOICE" ||
      sale.calculation_infos?.billing_type === "INVOICE" ||
      sale.additional_infos?.is_invoice === true ||
      sale.calculation_infos?.is_invoice === true
    );

    const title = isInvoice ? "Tax Invoice" : "Bill Receipt";
    const text = `*${shopName}* - ${title}\n--------------------------------\n*Order ID:* ${orderId}\n*Customer:* ${c.name || "Customer"}\n*Total Amount:* ₹${total}\n*Status:* ${sale.status || "Completed"}\n--------------------------------\n*Items:*\n${itemsText}${moreCount}\n--------------------------------\nThank you for shopping with us!`;

    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, [customerMap]);

  const searchSalesForReturn = useMemo(() => {
    if (!returnSearchQuery) return [];
    const q = returnSearchQuery.toLowerCase();
    return orders.filter(s => {
      const c = extractSaleCustomerInfo(s, customerMap);
      return (
        s.ui_id?.toString().toLowerCase().includes(q) ||
        (s.customer_id && s.customer_id.toLowerCase().includes(q)) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    }).slice(0, 5);
  }, [returnSearchQuery, orders, customerMap]);

  const openDetail = React.useCallback((sale: SaleRecord) => navigate(`/sales/${sale.id}`, { state: { sale, customerMap, productMap } }), [navigate, customerMap, productMap]);
  const openReturn = React.useCallback((sale: SaleRecord) => { setTimeout(() => setReturnSale(sale), 50); }, []);

  useEffect(() => {
    if (selectedSale) {
      const returnable = (selectedSale.status === "Completed" || selectedSale.status === "Delivered") && selectedSale.origin !== "Sales Return" && selectedSale.origin !== "Offline Return";
      const selCust = extractSaleCustomerInfo(selectedSale, customerMap);
      const isSelectedInvoice = Boolean(
        (selectedSale as any).billing_type === "INVOICE" ||
        (selectedSale as any).additional_infos?.billing_type === "INVOICE" ||
        (selectedSale as any).calculation_infos?.billing_type === "INVOICE" ||
        (selectedSale as any).additional_infos?.is_invoice === true ||
        (selectedSale as any).calculation_infos?.is_invoice === true
      );
      const canDownloadInvoice = isSelectedInvoice && !selCust.isWalkIn;
      const canSendWhatsApp = isSelectedInvoice && !selCust.isWalkIn && Boolean(selCust.phone);
      setBottomActions(
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2 sm:gap-3 py-1 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              <Receipt size={14} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">{selectedSale.ui_id}</p>
              {(() => {
                const c = extractSaleCustomerInfo(selectedSale, customerMap);
                return (
                  <p className="text-[10px] font-semibold text-slate-500 font-mono">
                    {c.name}{c.phone ? ` • ${c.phone}` : ''}{c.city ? ` (${c.city})` : ''}
                  </p>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-0.5 sm:pb-0">
            <button
              onClick={() => setSelectedSale(null)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-semibold text-[11px] transition-colors"
            >
              Deselect
            </button>
            <button
              onClick={() => setReprintSale(selectedSale)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 text-slate-700 font-semibold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reprint Bill"
            >
              <Printer size={13} className="text-sky-500" />
              Reprint Bill
            </button>
            {canDownloadInvoice && (
              <button
                onClick={() => setInvoiceModalSale(selectedSale)}
                className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 font-semibold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download Tax Invoice"
              >
                <FileText size={13} className="text-indigo-600" />
                Invoice
              </button>
            )}
            {canSendWhatsApp && (
              <button
                onClick={() => handleSendWhatsApp(selectedSale)}
                className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-slate-700 font-semibold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Send on WhatsApp"
              >
                <BiLogoWhatsapp size={15} className="text-[#25D366]" />
                WhatsApp
              </button>
            )}
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
  }, [selectedSale, setBottomActions, openDetail, openReturn, customerMap, handleSendWhatsApp]);

  /* Handle return trigger coming back from SaleDetailPage */
  useEffect(() => {
    if (location.state?.openReturn) {
      setReturnSale(location.state.openReturn);
      window.history.replaceState({}, "");
    }
  }, [location.state]);
  const closeReturn = () => setReturnSale(null);

  const fetchPage = React.useCallback(async (limit: number, offset: number, filters: any) => {
    const params: any = { limit: limit.toString(), offset: offset.toString(), online_delivered_only: true };
    if (filters.search) params.q = filters.search;

    if (filters.activeKpi === "Online Sales") params.exclude_offline = true;
    if (filters.activeKpi === "Offline Sales") params.exclude_online = true;

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
    // Only show online orders if their status is DELIVERED / COMPLETED on the sales list
    const validDataList = dataList.filter((s: any) => {
      const isOnline = s.origin === "ONLINE" || s.origin === "Online Sales" || Boolean(s.online_details);
      if (isOnline) {
        const st = String(s.status || "").toUpperCase();
        return st === "DELIVERED" || st === "COMPLETED";
      }
      return true;
    });

    const normalized = validDataList.map((s: any) => {
      // Support new Order Service format: payment_infos can be a dict (Record<string, number>) or an array
      let pm = "Other";
      if (s.payment_infos && typeof s.payment_infos === 'object' && !Array.isArray(s.payment_infos) && Object.keys(s.payment_infos).length > 0) {
        pm = Object.keys(s.payment_infos).map(k => {
          const u = k.toUpperCase();
          if (u === "CASH") return "Cash";
          if (u === "CARD") return "Card";
          if (u === "UPI" || u === "GPAY" || u === "G-PAY") return "UPI";
          if (u === "PHONEPE") return "PhonePe";
          if (u === "CREDIT" || u === "ON_CREDIT" || u === "ON CREDIT") return "On Credit";
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
          if (u === "CREDIT" || u === "ON_CREDIT" || u === "ON CREDIT") return "On Credit";
          return methodStr || "Other";
        }).join(", ");
      } else if (s.payments && Object.keys(s.payments).length > 0) {
        pm = Object.keys(s.payments).map(k => { const u = k.toUpperCase(); if (u === "CASH") return "Cash"; if (u === "CARD") return "Card"; if (u === "UPI" || u === "G-PAY" || u === "GPAY") return "UPI"; if (u === "PHONEPE") return "PhonePe"; if (u === "CREDIT" || u === "ON_CREDIT" || u === "ON CREDIT") return "On Credit"; return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase(); }).join(", ");
      } else if (s.payment_method) {
        const r = (s.payment_method || "Other").toUpperCase();
        pm = r === "CASH" ? "Cash" : r === "CARD" ? "Card" : r === "UPI" || r === "G-PAY" || r === "GPAY" ? "UPI" : r === "PHONEPE" ? "PhonePe" : r === "CREDIT" || r === "ON_CREDIT" || r === "ON CREDIT" ? "On Credit" : s.payment_method;
      }

      // Derive total from calculation_infos if present (new Order Service format)
      let total = Number(s.total_sellprice ?? s.calculation_infos?.total ?? s.calculation_infos?.grand_total ?? s.item_infos?.total_order_amount ?? s.total_amount ?? (Array.isArray(s.items) ? s.items.reduce((acc: number, item: any) => acc + (Number(item.total_amount) || ((Number(item.sell_price) || 0) * (Number(item.quantity) || 1))), 0) : 0) ?? s.total ?? 0);

      // Account for exchange replacements and returns in sales list
      if (Array.isArray(s.exchanges) && s.exchanges.length > 0) {
        let totalReplacements = 0;
        let totalExchangedReturns = 0;
        s.exchanges.forEach((exch: any) => {
          let repVal = Number(exch.total_replacement_amount || 0);
          const repItems = exch.replaced_items || exch.replacement_items || [];
          if (repVal === 0 && repItems.length > 0) {
            repItems.forEach((r: any) => {
              const rQty = Number(r.entered_qty ?? r.quantity ?? 1);
              repVal += Number(r.total_amount ?? ((r.sell_price || 0) * rQty));
            });
          }
          totalReplacements += repVal;

          let exchVal = Number(exch.total_exchanged_amount || 0);
          const retItems = exch.items || exch.exchange_items || exch.returned_items || [];
          if (exchVal === 0 && retItems.length > 0) {
            retItems.forEach((r: any) => {
              const rQty = Number(r.quantity || 1);
              exchVal += Number(r.exchange_amount ?? r.total_amount ?? ((r.sell_price || 0) * rQty));
            });
          }
          totalExchangedReturns += exchVal;
        });
        if (totalReplacements > 0 || totalExchangedReturns > 0) {
          total = Math.max(0, total - totalExchangedReturns + totalReplacements);
        }
      }
      if (Array.isArray(s.returns) && s.returns.length > 0) {
        let totalRefunds = 0;
        s.returns.forEach((ret: any) => {
          totalRefunds += Number(ret.total_return_cost ?? ret.total_cost ?? 0);
        });
        total = Math.max(0, total - totalRefunds);
      }

      // Derive total quantity
      let totalQty = s.total_quantity || s.item_infos?.total_order_qty || s.item_infos?.total_order_quantity || 0;
      if (s.calculation_infos?.items && Array.isArray(s.calculation_infos.items)) {
        totalQty = s.calculation_infos.items.reduce((sum: number, item: any) => sum + (item.qty || 0), 0);
      }

      const isOnline = s.origin === "ONLINE" || s.origin === "Online Sales" || Boolean(s.online_details);
      let rawStatus = s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase() : "Unknown";
      // For online orders, show Delivered as Completed
      if (isOnline && (rawStatus.toLowerCase() === "delivered" || rawStatus.toLowerCase() === "completed")) {
        rawStatus = "Completed";
      }

      return {
        ...s,
        total_sellprice: total,
        total_quantity: totalQty,
        status: rawStatus,
        payment_method: pm,
        origin: isOnline ? "Online" : (s.origin === "OFFLINE_SALES_RETURN" || s.origin === "Sales Return" ? "Offline Return" : "Offline"),
      };
    });

    return {
      items: normalized,
      hasMore: dataList.length === limit,
      stats: fetchedStats,
      total: res?.data?.total_count || normalized.length
    };
  }, [api.getData]);


  const fetchDetails = async () => {
    try {
      const custRes = await api.getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`);
      if (custRes?.data) {
        const m: Record<string, any> = {};
        const custList = Array.isArray(custRes.data) ? custRes.data : (custRes.data.datas ?? []);
        custList.forEach((c: any) => { m[c.id] = c; });
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
  const [summaryStats, setSummaryStats] = useState<{
    total: number;
    onlineAmount: number;
    onlineCount: number;
    offlineAmount: number;
    offlineCount: number;
    discountedCount: number;
    discountedAmount: number;
  }>({
    total: 0,
    onlineAmount: 0,
    onlineCount: 0,
    offlineAmount: 0,
    offlineCount: 0,
    discountedCount: 0,
    discountedAmount: 0,
  });

  useEffect(() => {
    api.getData(ENDPOINTS.ANALYTICS_SALES_OVERALL, { shop_id: SHOP_ID })
      .then((res) => {
        const data = res?.data ?? res;
        if (data) {
          setAnalyticsStats({ overview: { sales: data } });
        }
      })
      .catch(() => { });

    api.getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`, { limit: "100", offset: "1", online_delivered_only: "true" }).then((res) => {
      const dataList = Array.isArray(res?.data) ? res.data : (res?.data?.datas ?? []);
      let onlineAmt = 0;
      let onlineCnt = 0;
      let offlineAmt = 0;
      let offlineCnt = 0;
      let discAmt = 0;
      let discCnt = 0;
      dataList.forEach((s: any) => {
        const isOnline = s.origin === "ONLINE" || s.origin === "Online Sales" || Boolean(s.online_details);
        const st = String(s.status || "").toUpperCase();
        // Skip non-delivered online orders from sales summary metrics
        if (isOnline && st !== "DELIVERED" && st !== "COMPLETED") {
          return;
        }
        const total = Number(s.total_sellprice ?? s.calculation_infos?.total ?? s.calculation_infos?.grand_total ?? s.item_infos?.total_order_amount ?? s.total_amount ?? (Array.isArray(s.items) ? s.items.reduce((acc: number, item: any) => acc + (Number(item.total_amount) || ((Number(item.sell_price) || 0) * (Number(item.quantity) || 1))), 0) : 0) ?? s.total ?? 0);
        if (isOnline) {
          onlineAmt += total;
          onlineCnt++;
        } else {
          offlineAmt += total;
          offlineCnt++;
        }

        const discInfo = checkSaleDiscount(s);
        if (discInfo.hasDiscount) {
          discCnt++;
          discAmt += total;
        }
      });
      setSummaryStats({
        total: onlineCnt + offlineCnt,
        onlineAmount: onlineAmt,
        onlineCount: onlineCnt,
        offlineAmount: offlineAmt,
        offlineCount: offlineCnt,
        discountedCount: discCnt,
        discountedAmount: discAmt,
      });
    }).catch(() => { });
  }, [api.getData]);

  const filters = useMemo(() => ({
    search: debouncedSearch,
    origin: filterOrigin,
    payment: filterPayment,
    status: filterStatus,
    fromDate,
    toDate,
    activeKpi,
  }), [debouncedSearch, filterOrigin, filterPayment, filterStatus, fromDate, toDate, activeKpi]);

  const { items, loading, loadingMore, totalCount, lastElementRef, reload } = useInfiniteScroll({
    fetchPage,
    filters,
    limit: 50
  });

  useEffect(() => {
    const handleDoRefresh = () => {
      reload();
    };
    document.addEventListener('do-refresh-sales', handleDoRefresh);
    return () => document.removeEventListener('do-refresh-sales', handleDoRefresh);
  }, [reload]);

  const filtered = useMemo<any[]>(() => {
    if (activeKpi === "Discounted Sales") {
      return (items as any[]).filter(s => checkSaleDiscount(s).hasDiscount);
    }
    return items as any[];
  }, [items, activeKpi]);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (fromDate) count++;
    if (toDate) count++;
    if (filterOrigin) count++;
    if (filterPayment) count++;
    if (filterStatus) count++;
    return count;
  }, [fromDate, toDate, filterOrigin, filterPayment, filterStatus]);
  const clearAll = () => {
    setFilterOrigin("");
    setFilterPayment("");
    setFilterStatus("");
    setFromDate("");
    setToDate("");
    setSearch("");
  };

  const filteredRevenue = useMemo(() => filtered.filter(s => s.status === "Completed" || s.status === "Delivered").reduce((a, b) => a + (b.total_sellprice || 0), 0), [filtered]);

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
            value={analyticsStats?.overview?.sales?.total_sales ?? summaryStats.total}
            icon={<TrendingUp size={18} />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            subValue="All Time"
            onClick={() => setActiveKpi("Total Orders")}
            className={activeKpi === "Total Orders" ? "ring-2 ring-blue-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            label="Online Sales"
            value={analyticsStats?.overview?.sales?.total_online_sales ?? summaryStats.onlineCount}
            icon={<Globe size={18} />}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            subValue={`₹${(analyticsStats?.overview?.sales?.total_online_sales_amount ?? summaryStats.onlineAmount).toLocaleString()}`}
            onClick={() => setActiveKpi(prev => prev === "Online Sales" ? "Total Orders" : "Online Sales")}
            className={activeKpi === "Online Sales" ? "ring-2 ring-rose-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            label="Offline Sales"
            value={analyticsStats?.overview?.sales?.total_offline_sales ?? summaryStats.offlineCount}
            icon={<Store size={18} />}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
            subValue={`₹${(analyticsStats?.overview?.sales?.total_offline_sales_amount ?? summaryStats.offlineAmount).toLocaleString()}`}
            onClick={() => setActiveKpi(prev => prev === "Offline Sales" ? "Total Orders" : "Offline Sales")}
            className={activeKpi === "Offline Sales" ? "ring-2 ring-indigo-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            label="Discounted Sales"
            value={summaryStats.discountedCount}
            icon={<Percent size={18} />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            subValue={`₹${summaryStats.discountedAmount.toLocaleString()}`}
            onClick={() => setActiveKpi(prev => prev === "Discounted Sales" ? "Total Orders" : "Discounted Sales")}
            className={activeKpi === "Discounted Sales" ? "ring-2 ring-emerald-400 border-transparent shadow-sm" : ""}
          />
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white border border-slate-100 rounded-lg p-1.5 px-2.5 flex flex-wrap sm:flex-nowrap items-center gap-2 shadow-sm mt-2">
        <div className="relative flex-1 min-w-[180px] sm:w-80 sm:flex-none">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
            placeholder="Search order or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm ${activeFilters > 0
              ? "border-blue-200 text-blue-600 bg-blue-50/50"
              : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
              }`}
            title="Filters"
          >
            <Filter size={13} />
            Filters
            {activeFilters > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black">{activeFilters}</span>
            )}
          </button>

          <button className="inline-flex items-center gap-1.5 h-8 px-3 sm:px-3.5 text-xs font-bold bg-blue-600 text-white border-none rounded-md cursor-pointer transition-all hover:bg-blue-700 hover:shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap" onClick={() => setIsReturnSearchOpen(true)}>
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Process Return</span>
            <span className="sm:hidden">Return</span>
          </button>
        </div>
      </div>

      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => setIsFilterOpen(false)}
        onClear={clearAll}
        title="Sales Filters"
      >
        <div className="space-y-4">
          {/* Date Range */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Range</label>
            <div className="flex items-center gap-2">
              <div className="space-y-1 flex-1">
                <span className="text-[10px] text-slate-400 font-medium">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[10px] text-slate-400 font-medium">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Sales Channel */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Channel / Origin</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "All Channels", value: "" },
                { label: "Offline POS", value: "Offline" },
                { label: "Online Store", value: "Online" },
                { label: "Returns", value: "Offline Return" }
              ].map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setFilterOrigin(opt.value)}
                  className={`h-9 rounded-md text-xs font-semibold border transition-all ${filterOrigin === opt.value ? "border-blue-600 bg-blue-50 text-blue-700 font-bold" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
            <ReusableSelect
              value={filterPayment}
              onValueChange={setFilterPayment}
              options={[
                { label: "All Payment Methods", value: "" },
                { label: "Cash", value: "Cash" },
                { label: "Card", value: "Card" },
                { label: "UPI", value: "UPI" },
                { label: "On Credit", value: "On Credit" }
              ]}
              placeholder="All Payment Methods"
              className="h-9 py-2 px-3 text-xs bg-slate-50 border-slate-200 rounded-lg font-semibold text-slate-750 hover:bg-white focus:bg-white shadow-none transition-colors"
            />
          </div>

          {/* Order Status */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Order Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "All Statuses", value: "" },
                { label: "Completed", value: "Completed" },
                { label: "Delivered", value: "Delivered" },
                { label: "Cancelled", value: "Cancelled" }
              ].map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setFilterStatus(opt.value)}
                  className={`h-9 rounded-md text-xs font-semibold border transition-all ${filterStatus === opt.value ? "border-blue-600 bg-blue-50 text-blue-700 font-bold" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </RightSidebarFilter>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-100">

          {/* ── Mobile Order Cards (< md) ── */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt size={32} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600 mb-1">No sales found</p>
                <p className="text-xs text-slate-400">Try adjusting your filters</p>
              </div>
            ) : (
              filtered.map((sale, index) => {
                const dateStr = fmtDate(sale.created_at || (sale as any).date);
                const timeStr = fmtTime(sale.created_at || (sale as any).date);
                const rowCustomer = extractSaleCustomerInfo(sale, customerMap);
                const isInvoiceOrder = Boolean(
                  (sale as any).billing_type === "INVOICE" ||
                  (sale as any).additional_infos?.billing_type === "INVOICE" ||
                  (sale as any).calculation_infos?.billing_type === "INVOICE" ||
                  (sale as any).additional_infos?.is_invoice === true ||
                  (sale as any).calculation_infos?.is_invoice === true
                );
                const canDownloadInvoice = isInvoiceOrder && !rowCustomer.isWalkIn;
                const canSendWhatsApp = isInvoiceOrder && !rowCustomer.isWalkIn && Boolean(rowCustomer.phone);
                const isSelected = selectedSale?.id === sale.id;
                const returnable = (sale.status === "Completed" || sale.status === "Delivered") && sale.origin !== "Offline Return" && sale.origin !== "Sales Return";

                return (
                  <div
                    key={sale.id}
                    ref={index === filtered.length - 1 ? lastElementRef : null}
                    onClick={() => setSelectedSale(prev => prev?.id === sale.id ? null : sale)}
                    className={`p-3.5 transition-colors cursor-pointer ${isSelected ? "bg-blue-50/80 border-l-3 border-l-blue-600" : "hover:bg-slate-50/80"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-800">{sale.ui_id}</span>
                          {isInvoiceOrder && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Invoice
                            </span>
                          )}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                            sale.origin === "Online" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {sale.origin}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 truncate ${rowCustomer.isWalkIn ? "text-slate-400 italic" : "text-slate-800 font-semibold"}`}>
                          {rowCustomer.name}
                          {rowCustomer.phone && (
                            <span className="font-mono text-slate-500 font-normal ml-1.5">({rowCustomer.phone})</span>
                          )}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-bold text-slate-900 block">{fmt(sale.total_sellprice)}</span>
                        <div className="mt-0.5">
                          {(() => {
                            const cfg = STATUS_CFG[sale.status as SaleStatus] || STATUS_CFG["Pending"];
                            return <Badge cls={cfg.cls} dot={cfg.dot} label={sale.status} />;
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100/90 gap-2">
                      <div className="flex items-center gap-1.5 text-[10.5px] truncate">
                        <span className="font-mono">{dateStr}{timeStr ? ` ${timeStr}` : ''}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{Number((sale.total_quantity || 0).toFixed(2))} items</span>
                        <span>•</span>
                        <span className="font-medium text-slate-600 truncate">{sale.payment_method || "Other"}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setReprintSale(sale)}
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                          title="Reprint Bill"
                        >
                          <Printer size={15} />
                        </button>
                        {canDownloadInvoice && (
                          <button
                            onClick={() => setInvoiceModalSale(sale)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                            title="Download Tax Invoice"
                          >
                            <FileText size={15} />
                          </button>
                        )}
                        {canSendWhatsApp && (
                          <button
                            onClick={() => handleSendWhatsApp(sale)}
                            className="p-1.5 text-[#25D366] hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                            title="Direct WhatsApp Invoice"
                          >
                            <BiLogoWhatsapp size={16} />
                          </button>
                        )}
                        {returnable && (
                          <button
                            onClick={() => openReturn(sale)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Process Return"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => openDetail(sale)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <table className="w-full border-collapse table-fixed relative min-w-[880px] hidden md:table">
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
                <th className="w-[130px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-right">Actions</th>
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

                const dateStr = fmtDate(sale.created_at || (sale as any).date);
                const timeStr = fmtTime(sale.created_at || (sale as any).date);
                const refundedCount = (sale.items || []).filter((i: any) => i.status === "REFUNDED").length;

                // ── Exchange detection ─────────────────────────────────────────────
                // Count items individually marked EXCHANGED
                const itemExchangedCount = (sale.items || []).filter((i: any) => i.status === "EXCHANGED").length;
                // Count entries in the top-level exchanges array (set by the Order Service)
                const topLevelExchangeCount = Array.isArray((sale as any).exchanges) ? (sale as any).exchanges.length : 0;
                const exchangedCount = itemExchangedCount + topLevelExchangeCount;

                // True when this sale IS an exchange-replacement order itself
                // (origin contains "exchange" in any casing, or the is_exchange / exchange_type flag is set)
                const isExchangeOrder =
                  (typeof (sale as any).origin === 'string' && (sale as any).origin.toLowerCase().includes('exchange')) ||
                  !!(sale as any).is_exchange ||
                  !!(sale as any).exchange_type ||
                  (sale as any).order_type === 'EXCHANGE' ||
                  (sale as any).type === 'exchange';

                const hasReturns = (sale.returns && sale.returns.length > 0) || (sale.items || []).some((i: any) => (i.returned_quantity && i.returned_quantity > 0) || i.status === "REFUNDED" || i.status === "EXCHANGED") || sale.status === "Returned" || sale.status === "RETURNED";
                const hasDiscount = checkSaleDiscount(sale).hasDiscount;

                const rowCustomer = extractSaleCustomerInfo(sale, customerMap);
                const isInvoiceOrder = Boolean(
                  (sale as any).billing_type === "INVOICE" ||
                  (sale as any).additional_infos?.billing_type === "INVOICE" ||
                  (sale as any).calculation_infos?.billing_type === "INVOICE" ||
                  (sale as any).additional_infos?.is_invoice === true ||
                  (sale as any).calculation_infos?.is_invoice === true
                );
                const canDownloadInvoice = isInvoiceOrder && !rowCustomer.isWalkIn;
                const canSendWhatsApp = isInvoiceOrder && !rowCustomer.isWalkIn && Boolean(rowCustomer.phone);

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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] font-semibold text-slate-800">{sale.ui_id}</span>
                          {isInvoiceOrder && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                              Invoice
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {sale.origin === "Offline Return" && <AntBadge variant="tx-sales-return" type="tag">Return</AntBadge>}
                          {/* Exchange-replacement sale — this order itself is an exchange */}
                          {isExchangeOrder && <AntBadge variant="tx-sales" type="tag">Exchanged</AntBadge>}
                          {hasReturns && !isExchangeOrder && <AntBadge variant="tx-sales-return" type="tag">Returned</AntBadge>}
                          {refundedCount > 0 && <AntBadge variant="pay-partial" type="tag">{refundedCount} Refunded</AntBadge>}
                          {/* Items on this order that were later exchanged */}
                          {exchangedCount > 0 && <AntBadge variant="tx-sales" type="tag">{exchangedCount} Exchanged</AntBadge>}
                          {hasDiscount && <AntBadge variant="tx-purchase" type="tag">Discounted</AntBadge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-b border-slate-50">
                      {(() => {
                        const c = extractSaleCustomerInfo(sale, customerMap);
                        return (
                          <div className="max-w-[220px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`truncate text-xs block ${c.isWalkIn ? "text-slate-400 italic" : "text-slate-800 font-semibold"}`}
                                title={c.name}
                              >
                                {c.name}
                              </span>
                              {c.isOnline && !c.isWalkIn && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                                  Online
                                </span>
                              )}
                            </div>
                            {c.phone && (
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate">
                                {c.phone}
                              </span>
                            )}
                            {(c.city || c.pincode) && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                                {[c.city, c.pincode].filter(Boolean).join(", ")}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 border-b border-slate-50"><Badge cls={oCfg.cls} dot={oCfg.dot} label={sale.origin} /></td>
                    <td className="px-4 py-4 border-b border-slate-50">
                      <div className="flex flex-wrap gap-1">
                        {sale.payments && Object.keys(sale.payments).length > 0 ? (
                          Object.keys(sale.payments).map(k => {
                            const u = k.toUpperCase();
                            const label = u === "CASH" ? "Cash" : u === "CARD" ? "Card" : u === "UPI" || u === "G-PAY" || u === "GPAY" ? "UPI" : u === "PHONEPE" ? "PhonePe" : u === "CREDIT" || u === "ON_CREDIT" || u === "ON CREDIT" ? "On Credit" : k;
                            const cfg = PAYMENT_CFG[label] || PAYMENT_CFG["Other"];
                            return <Badge key={k} cls={cfg.cls} dot={cfg.dot} label={label} />;
                          })
                        ) : (
                          <Badge cls={(PAYMENT_CFG[sale.payment_method || ""] || PAYMENT_CFG["Other"]).cls} dot={(PAYMENT_CFG[sale.payment_method || ""] || PAYMENT_CFG["Other"]).dot} label={sale.payment_method || "Other"} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 border-b border-slate-50">
                      <div>
                        <span className="font-mono text-[11px] text-slate-700 block font-medium">{dateStr}</span>
                        {timeStr && <span className="text-[10px] text-slate-400 block">{timeStr}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 border-b border-slate-50 text-center"><span className="text-[11px] font-semibold text-slate-600">{Number((sale.total_quantity || 0).toFixed(2))}</span></td>
                    <td className="px-4 py-4 border-b border-slate-50 text-right"><span className="font-mono text-xs font-bold text-slate-900">{fmt(sale.total_sellprice)}</span></td>
                    <td className="px-4 py-4 border-b border-slate-50">{(() => { const cfg = STATUS_CFG[sale.status as SaleStatus] || STATUS_CFG["Pending"]; return <Badge cls={cfg.cls} dot={cfg.dot} label={sale.status} />; })()}</td>
                    <td className="px-4 py-4 border-b border-slate-50 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setReprintSale(sale); }}
                          className="text-sky-500 hover:text-sky-600 hover:bg-sky-50 rounded-md p-1.5 transition-colors cursor-pointer"
                          title="Reprint Bill"
                        >
                          <Printer size={15} />
                        </button>
                        {canDownloadInvoice && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setInvoiceModalSale(sale); }}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md p-1.5 transition-colors cursor-pointer"
                            title="Download Tax Invoice"
                          >
                            <FileText size={15} />
                          </button>
                        )}
                        {canSendWhatsApp && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(sale); }}
                            className="text-[#25D366] hover:text-[#1ebd5a] hover:bg-emerald-50 rounded-md p-1.5 transition-colors cursor-pointer"
                            title="Direct WhatsApp Invoice"
                          >
                            <BiLogoWhatsapp size={16} />
                          </button>
                        )}
                        {sale.status === "Completed" && sale.origin !== "Offline Return" && sale.origin !== "Sales Return" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openReturn(sale); }}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-md p-1.5 transition-colors cursor-pointer"
                            title="Process Return"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetail(sale); }}
                          className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md p-1.5 transition-colors cursor-pointer"
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

      {/* ── Reprint Bill Modal ── */}
      {reprintSale && (
        <ReprintReceiptModal
          isOpen={Boolean(reprintSale)}
          onClose={() => setReprintSale(null)}
          sale={reprintSale}
          customerMap={customerMap}
          productMap={productMap}
        />
      )}

      {/* ── Tax Invoice Modal ── */}
      {invoiceModalSale && (
        <SaleInvoiceModal
          isOpen={Boolean(invoiceModalSale)}
          onClose={() => setInvoiceModalSale(null)}
          sale={invoiceModalSale}
          customerMap={customerMap}
          productMap={productMap}
        />
      )}

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
  customerMap: Record<string, any>;
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
                      <p className="text-[14px] font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">Order {sale.ui_id}</p>
                      <span className="font-mono text-[13px] font-black text-slate-900 group-hover:text-blue-700">{fmt(sale.total_sellprice)}</span>
                    </div>
                    {(() => {
                      const c = extractSaleCustomerInfo(sale, customerMap);
                      return (
                        <p className="text-[11px] text-slate-500 truncate font-bold uppercase tracking-tight opacity-70 group-hover:opacity-100">
                          {c.name} {c.phone ? `· ${c.phone}` : ''} · {fmtDate(sale.created_at || (sale as any).date)}
                        </p>
                      );
                    })()}
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
