import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft, Package, User,
  RotateCcw, Calendar,
  AlertCircle, Smartphone,
  Database,
  Search,
  Layers,
  CreditCard
} from "lucide-react";

import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { ReturnModal } from "../components/ReturnOrderFlow";
import { DetailItem, InfoRow, ProfileHeaderCard, SectionCard } from "@/components/common/SuperUI";
import { AntBadge } from "@/components/ui/AntBadge";
import { OrderResponse } from "@/features/order/types";
import SkeletonLoader from "@/components/common/SkeletonLoader";

/* ── helpers ── */
const fmt = (n?: number) => {
  if (n === undefined || n === null || isNaN(Number(n))) return "₹0";
  const num = Number(n);
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
};

export interface ParsedPaymentItem {
  method: string;
  amount?: number;
}

export function formatPaymentMethodName(method: string): string {
  if (!method) return "Other";
  const u = String(method).trim().toUpperCase();
  if (u === "CASH") return "Cash";
  if (u === "CARD") return "Card";
  if (u === "UPI" || u === "G-PAY" || u === "GPAY") return "UPI";
  if (u === "PHONEPE") return "PhonePe";
  if (u === "PAYTM") return "Paytm";
  if (u === "CREDIT" || u === "ON_CREDIT" || u === "ON CREDIT") return "On Credit";
  if (u === "NETBANKING" || u === "NET_BANKING") return "Net Banking";
  if (u === "CHEQUE") return "Cheque";
  return method.charAt(0).toUpperCase() + method.slice(1);
}

export function extractPaymentList(paymentInfos: any, fallback?: any): ParsedPaymentItem[] {
  const result: ParsedPaymentItem[] = [];

  const add = (method: string, amount?: any) => {
    if (!method) return;
    const cleanMethod = formatPaymentMethodName(method);
    const parsedAmount = typeof amount === "number" ? amount : (amount !== undefined && amount !== null && amount !== "" ? Number(amount) : undefined);
    result.push({ method: cleanMethod, amount: isNaN(parsedAmount as number) ? undefined : parsedAmount });
  };

  const inspect = (source: any): boolean => {
    if (!source) return false;

    // Array of objects or strings
    if (Array.isArray(source) && source.length > 0) {
      source.forEach((p: any) => {
        if (typeof p === "string") add(p);
        else if (p && typeof p === "object") {
          add(p.method || p.mode || p.type || p.payment_method || p.payment_mode || "Other", p.amount ?? p.value);
        }
      });
      return result.length > 0;
    }

    // Object with .payments array: e.g. { payments: [ { method: 'Cash', amount: 77 } ] }
    if (source.payments && Array.isArray(source.payments) && source.payments.length > 0) {
      source.payments.forEach((p: any) => {
        if (typeof p === "string") add(p);
        else if (p && typeof p === "object") {
          add(p.method || p.mode || p.type || p.payment_method || p.payment_mode || "Other", p.amount ?? p.value);
        }
      });
      return result.length > 0;
    }

    // Key-value map: e.g. { "CASH": 177 } or { "Cash": { amount: 177 } }
    if (typeof source === "object" && Object.keys(source).length > 0) {
      Object.entries(source).forEach(([k, v]) => {
        if (k === "payments" && Array.isArray(v)) {
          v.forEach((p: any) => {
            if (typeof p === "string") add(p);
            else if (p && typeof p === "object") {
              add(p.method || p.mode || p.type || "Other", p.amount ?? p.value);
            }
          });
        } else if (v && typeof v === "object" && ("amount" in (v as any) || "value" in (v as any))) {
          add(k, (v as any).amount ?? (v as any).value);
        } else if (typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)))) {
          add(k, Number(v));
        } else if (typeof v === "string") {
          add(v);
        }
      });
      return result.length > 0;
    }

    if (typeof source === "string" && source.trim()) {
      add(source.trim());
      return true;
    }

    return false;
  };

  const found = inspect(paymentInfos);
  if (!found && fallback) {
    inspect(fallback);
  }

  return result;
}

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

function fmtShortDate(dateVal?: any) {
  if (!dateVal) return "—";
  const d = parseSaleDateTime(dateVal);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDate(dateVal?: any) {
  if (!dateVal) return "N/A";
  const d = parseSaleDateTime(dateVal);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function fmtTime(dateVal?: any) {
  if (!dateVal) return "";
  const d = parseSaleDateTime(dateVal);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

const formatBatchDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = parseSaleDateTime(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStockValue = (val: number | null | undefined) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  const n = Number(val);
  if (Math.abs(n % 1) < 0.0001) return Math.round(n).toString();
  return Number(n.toFixed(2)).toString();
};

const getItemDisplayQty = (item: any) => {
  if (item.entered_qty !== undefined && item.entered_qty !== null && !isNaN(Number(item.entered_qty))) {
    return formatStockValue(item.entered_qty);
  }
  const u = String(item.entered_unit || item.unit || "").toLowerCase();
  if ((u === 'gm' || u === 'g' || u === 'ml' || u === 'm') && item.quantity > 0 && item.quantity < 10) {
    return formatStockValue(item.quantity * 1000);
  }
  return formatStockValue(item.quantity || 0);
};

type SaleItem = {
  id: string; name: string; sku: string; quantity: number; returnedQty?: number; reason?: string;
  unitPrice: number; buyPrice: number; basePrice: number;
  gstRate: number; gstAmount: number; totalAmount: number;
  status?: string; serial_numbers?: string[];
  unit: string;
  variantName?: string;
  batchName?: string;
  mfgDate?: string;
  expDate?: string;
  gst?: string | number;
  categoryName?: string;
  stockBefore?: number;
  stockAfter?: number;
  image?: string;
  entered_qty?: number;
  entered_unit?: string;
};

const generateItems = (sale: OrderResponse, productMap: Record<string, string> = {}): SaleItem[] => {
  const calcInfos = (sale as any)?.calculation_infos || (sale as any)?.calculations || {};
  const calcItems = calcInfos.items || [];
  const includeGst = calcInfos.include_gst === true || calcInfos.gst_type === "INCLUSIVE" || sale.gst_infos?.type === "INCLUSIVE";

  return (sale?.items || []).map((i: any) => {
    // Attempt to find matching calc item for subunit pricing/qty details
    const calc = calcItems.find((ci: any) => ci.product_id === i.product_id || ci.product_id === i.inventory_id);
    let basePrice = calc?.price ?? i.sell_price ?? (i.total_amount && i.quantity ? i.total_amount / i.quantity : 0);
    const qty = calc?.qty ?? i.quantity ?? 1;

    const rawGst = i.gst || i.datas?.gst || calc?.gst || 0;
    const gstRate = typeof rawGst === "number" ? rawGst : (parseFloat(String(rawGst).replace("%", "")) || 0);

    const isActuallyExclusive = calcInfos.total && calcInfos.subtotal && calcInfos.gst_amount 
      ? Math.abs(Number(calcInfos.total) - (Number(calcInfos.subtotal) + Number(calcInfos.gst_amount))) < 1
      : false;
    
    const treatAsInclusive = includeGst && !isActuallyExclusive;

    let gstAmount = 0;
    if (calc?.gst_amount !== undefined && calc?.gst_amount !== null && !isNaN(Number(calc.gst_amount))) {
      gstAmount = Number(calc.gst_amount);
    } else if (i.gst_amount !== undefined && i.gst_amount !== null && !isNaN(Number(i.gst_amount))) {
      gstAmount = Number(i.gst_amount);
    } else if (gstRate > 0) {
      if (treatAsInclusive) {
        const baseWithoutGst = basePrice / (1 + gstRate / 100);
        gstAmount = (basePrice - baseWithoutGst) * qty;
      } else {
        gstAmount = (basePrice * (gstRate / 100)) * qty;
      }
    }

    let unitPrice = basePrice;
    if (gstRate > 0 && !treatAsInclusive) {
      unitPrice = basePrice + (basePrice * (gstRate / 100));
    }

    let totalAmount = 0;
    if (i.total_amount !== undefined && i.total_amount !== null && !isNaN(Number(i.total_amount)) && Number(i.total_amount) > 0) {
      totalAmount = Number(i.total_amount);
    } else if (calc?.total !== undefined && calc?.total !== null && !isNaN(Number(calc.total)) && Number(calc.total) > 0) {
      totalAmount = Number(calc.total);
    } else {
      totalAmount = (basePrice * qty);
    }

    // Safely ensure totalAmount includes GST.
    // If the provided totalAmount is roughly equal to just basePrice * qty, it implies it doesn't have GST added.
    if (Math.abs(totalAmount - (basePrice * qty)) < 1) {
      totalAmount += gstAmount;
    }

    return {
      id: i.id,
      name: i.name || i.product_name || i.datas?.product_name || i.datas?.name || productMap[i.inventory_id] || "Unknown Item",
      sku: i.barcode?.trim() || i.inventory_id?.slice(-6) || "N/A",
      quantity: qty,
      returnedQty: i.returned_quantity || 0,
      unitPrice,
      buyPrice: i.buy_price || 0,
      basePrice,
      gstRate,
      gstAmount,
      totalAmount,
      status: i.status || "COMPLETED",
      reason: i.reason,
      serial_numbers: Array.isArray(i.serialno_infos) ? i.serialno_infos.map((sn: any) => sn.name || sn) : (i.serialno_info?.serial_numbers || i.serial_info?.serial_numbers || i.serial_numbers || []),
      unit: i.unit_infos?.name || i.unit_info?.name || i.product?.unit || i.unit || i.datas?.unit || "UNIT",
      variantName: i.variant_infos?.variant_name || i.variant_info?.variant_name || i.variant?.variant_name,
      batchName: i.batch_infos?.batch_name || i.batch_infos?.name || i.batch_info?.batch_name || i.batch?.batch_name,
      mfgDate: i.batch_infos?.mfg_date || i.batch_infos?.manufacturing_date || i.batch_info?.mfg_date || i.batch?.mfg_date,
      expDate: i.batch_infos?.exp_date || i.batch_infos?.expiry_date || i.batch_info?.exp_date || i.batch?.exp_date,
      gst: i.gst || i.datas?.gst,
      categoryName: i.category_infos?.name || i.category_info?.name || i.category || i.datas?.category_name,
      stockBefore: i.stock_before,
      stockAfter: i.stock_after,
      image: i.image_url || i.image || i.product?.image_url || i.product?.image || i.datas?.image_url || i.datas?.image || i.inventory_infos?.image_url || i.inventory_infos?.image || i.inventory_info?.image_url || i.inventory_info?.image || "",
      entered_qty: i.entered_qty,
      entered_unit: i.entered_unit,
    };
  });
};



/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
const SaleDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const { setBottomActions } = useHeader();

  const [sale, setSale] = useState<OrderResponse | null>(location.state?.sale || null);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>(location.state?.customerMap || {});
  const [productMap, setProductMap] = useState<Record<string, string>>(location.state?.productMap || {});
  const [loading, setLoading] = useState(!sale);
  const [activeTab, setActiveTab] = useState(0);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [clearingHistories, setClearingHistories] = useState<any[]>([]);

  const fetchSaleDetail = async () => {
    setLoading(true);
    try {
      // Fetch the specific order directly by ID
      const ordRes = await api.getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}/${id}`);
      if (ordRes?.data) {
        const found = Array.isArray(ordRes.data) ? ordRes.data[0] : ordRes.data;
        if (found) {
          setSale({
            ...found,
            total_sellprice: Number(found.total_sellprice ?? found.calculation_infos?.total ?? found.calculation_infos?.grand_total ?? found.item_infos?.total_order_amount ?? found.total_amount ?? (Array.isArray(found.items) ? found.items.reduce((s: number, item: any) => s + (Number(item.total_amount) || ((Number(item.sell_price) || 0) * (Number(item.quantity) || 1))), 0) : 0) ?? found.total ?? 0),
            status: found.status ? found.status.charAt(0).toUpperCase() + found.status.slice(1).toLowerCase() : "Completed",
            origin: found.origin === "OFFLINE" ? "Sales" : found.origin || "Sales",
          });

          if (found.customer_id) {
            try {
              const clrRes = await api.getData(`${ENDPOINTS.CUSTOMERS}/cleared-histories/by/id/${SHOP_ID}/${found.customer_id}`);
              if (clrRes?.data) {
                let actualClr = clrRes.data;
                if (typeof actualClr === 'object' && !Array.isArray(actualClr) && 'datas' in actualClr) {
                  actualClr = actualClr.datas;
                }
                setClearingHistories(Array.isArray(actualClr) ? actualClr : [actualClr]);
              }
            } catch (err) {
              console.warn("Could not load clearing history:", err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }

    // Fetch supporting data independently — failures here won't break the order view
    try {
      const custRes = await api.getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`);
      if (custRes?.data) {
        const m: Record<string, string> = {};
        custRes.data.forEach((c: any) => { m[c.id] = c.name; });
        setCustomerMap(m);
      }
    } catch (err) {
      console.warn("Could not load customer map:", err);
    }

    try {
      const invRes = await api.getData(ENDPOINTS.INVENTORIES);
      if (invRes?.data) {
        const m: Record<string, string> = {};
        invRes.data.forEach((p: any) => { m[p.id] = p.name; });
        setProductMap(m);
      }
    } catch (err) {
      console.warn("Could not load product map:", err);
    }
  };

  useEffect(() => {
    setBottomActions(null);
    return () => setBottomActions(null);
  }, [setBottomActions, navigate, id, api]);

  useEffect(() => {
    if (!sale || !sale.items) fetchSaleDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-slate-50/50">
        <SkeletonLoader variant="detail" />
      </div>
    );
  }

  if (!sale) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 font-sans">
      <AlertCircle size={48} className="text-slate-300" />
      <p className="text-lg font-bold text-slate-800">Sale not found</p>
      <button
        onClick={() => navigate("/sales")}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
      >
        <ArrowLeft size={16} /> Back to Sales
      </button>
    </div>
  );

  const items = generateItems(sale, productMap);
  const subtotal = items.reduce((s, i) => s + i.basePrice * i.quantity, 0);
  const canReturn = sale.status === "Completed" && sale.origin !== "Sales Return";
  const customerName = (sale as any).additional_infos?.customer_name || (sale as any).datas?.customer_name || sale.customer?.customer_name || customerMap[sale.customer_id] || "Walk-in Customer";
  const customerMobile = (sale as any).additional_infos?.customer_phone || sale.customer?.customer_mobile_number || "";
  const saleDateVal = sale.created_at || (sale as any).date || (sale as any).order_date;
  const dateStr = saleDateVal ? fmtDate(saleDateVal) : "N/A";
  const timeStr = saleDateVal ? fmtTime(saleDateVal) : "";
  const refunded = items.filter(i => i.status === "REFUNDED").length;
  const exchanged = items.filter(i => i.status === "EXCHANGED").length;

  const isCreditPayment = (method?: string) => {
    if (!method) return false;
    const m = String(method).trim().toLowerCase();
    return m.includes('credit');
  };

  const rawPayments = (sale as any).payment_infos || (sale as any).payment_info || sale.payments || {};
  const extractedList = extractPaymentList(rawPayments, sale.payment_method);
  const paymentsDetail = extractedList.length > 0
    ? extractedList.map(p => ({ label: p.method, amount: p.amount ?? (sale.total_sellprice || 0) }))
    : [{ label: sale.payment_method || "Other", amount: sale.total_sellprice }];

  // ── Exchange and Return Financial Adjustments ──
  const exchangesList = (sale as any)?.exchanges || [];
  const returnsList = (sale as any)?.returns || [];

  // Exchange replacement items total value
  let totalReplacementsValue = 0;
  let exchangeNonCreditPaid = 0;
  let exchangeCreditAdded = 0;

  exchangesList.forEach((exch: any) => {
    let repVal = Number(exch.total_replacement_amount || 0);
    const repItems = exch.replaced_items || exch.replacement_items || [];
    if (repVal === 0 && repItems.length > 0) {
      repItems.forEach((r: any) => {
        const rQty = Number(r.entered_qty ?? r.quantity ?? 1);
        const rPrice = Number(r.total_amount ?? ((r.sell_price || 0) * rQty));
        repVal += rPrice;
      });
    }
    totalReplacementsValue += repVal;

    const exchPayments = extractPaymentList(exch.payment_infos, exch.payment_method);
    exchPayments.forEach(p => {
      const pAmt = Number(p.amount || 0);
      if (isCreditPayment(p.method)) {
        exchangeCreditAdded += pAmt;
      } else {
        exchangeNonCreditPaid += pAmt;
      }
    });
  });

  // Calculate returned items value in exchanges
  let totalExchangedReturnedValue = 0;
  exchangesList.forEach((exch: any) => {
    let retVal = Number(exch.total_exchanged_amount || 0);
    const retItems = exch.items || exch.exchange_items || exch.returned_items || [];
    if (retVal === 0 && retItems.length > 0) {
      retItems.forEach((r: any) => {
        const rQty = Number(r.quantity || 1);
        const rPrice = Number(r.exchange_amount ?? r.total_amount ?? ((r.sell_price || 0) * rQty));
        retVal += rPrice;
      });
    }
    totalExchangedReturnedValue += retVal;
  });

  // Calculate refunded items in standalone returns
  let totalRefundsValue = 0;
  returnsList.forEach((ret: any) => {
    const retCost = Number(ret.total_return_cost ?? ret.total_cost ?? 0);
    totalRefundsValue += retCost;
  });

  // Net Grand Total / Sales Value of the order
  const baseOrderTotal = Number(sale.total_sellprice || 0);
  const adjustedGrandTotal = Math.max(
    0,
    (totalReplacementsValue > 0 || totalExchangedReturnedValue > 0)
      ? (baseOrderTotal - totalExchangedReturnedValue - totalRefundsValue + totalReplacementsValue)
      : (baseOrderTotal - totalRefundsValue)
  );

  // Initial payment amounts at the time of sale (excluding on-credit debt)
  const initialNonCreditPaid = paymentsDetail
    .filter(p => !isCreditPayment(p.label))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const initialCreditAmount = paymentsDetail
    .filter(p => isCreditPayment(p.label))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const isBilledCredit = initialCreditAmount > 0 || isCreditPayment(sale.payment_method) || paymentsDetail.some(p => isCreditPayment(p.label));

  const baseDue = isBilledCredit
    ? (initialCreditAmount > 0 ? initialCreditAmount : Math.max(0, baseOrderTotal - initialNonCreditPaid))
    : Math.max(0, baseOrderTotal - initialNonCreditPaid);

  const totalDueForOrder = baseDue + exchangeCreditAdded;

  const orderUiId = String(sale.ui_id || '').trim().toUpperCase();
  const orderId = String(sale.id || '').trim().toUpperCase();

  const clearedPaymentsForThisOrder = clearingHistories.reduce((sum: number, h: any) => {
    const noteStr = String(h.additional_infos?.notes || h.notes || '').toLowerCase();
    const isInitialBilled = noteStr.includes('billed (on credit)') || noteStr.includes('billed on credit');
    const isCreditAdd = noteStr.includes('added to credit') || h.type === 'INCREMENT';
    
    // Credit additions (e.g. initial order on credit, exchange added to credit) are debt additions, NOT payments
    if (isInitialBilled || isCreditAdd) return sum;

    const inv = String(h.invoice_no || h.additional_infos?.invoice_no || '').trim().toUpperCase();
    const entityId = String(h.entity_id || h.additional_infos?.entity_id || '').trim().toUpperCase();

    const matches = (orderUiId && (inv === orderUiId || entityId === orderUiId)) ||
                    (orderId && (inv === orderId || entityId === orderId));
    if (!matches) return sum;

    let amt = Number(h.additional_infos?.cleared_amount ?? 0);
    if (!amt && h.payment_infos && Array.isArray(h.payment_infos)) {
      amt = h.payment_infos.filter((p: any) => !isCreditPayment(p.method || p.mode)).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    }
    if (!amt && h.cleared_infos) {
      const before = Number(h.cleared_infos.outstanding_before || 0);
      const after = Number(h.cleared_infos.outstanding_after || 0);
      if (before > after) amt = before - after;
    }
    return sum + (amt || 0);
  }, 0);

  const totalPaid = initialNonCreditPaid + exchangeNonCreditPaid + clearedPaymentsForThisOrder;
  const outstanding = Math.max(0, totalDueForOrder - clearedPaymentsForThisOrder);

  const returnsCount = Array.isArray((sale as any)?.returns) ? (sale as any).returns.length : 0;
  const exchangesCount = Array.isArray((sale as any)?.exchanges) ? (sale as any).exchanges.length : 0;
  const reCount = returnsCount + exchangesCount;
  const hasReturns = returnsCount > 0 || exchangesCount > 0 || (sale.items || []).some((i: any) => (i.returned_quantity && i.returned_quantity > 0) || i.status === "REFUNDED" || i.status === "EXCHANGED") || sale.status === "Returned" || sale.status === "RETURNED";

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans text-slate-900 overflow-hidden relative">

      {/* Profile Header Card */}
      <div className="flex-none p-1 pb-0">
        <ProfileHeaderCard
          name={
            <div className="flex items-center gap-2">
              <span>Order #{sale.ui_id}</span>
              {hasReturns && <AntBadge variant="tx-sales-return" type="tag">Returned</AntBadge>}
            </div>
          }
          initials="ORD"
          subText={`Order ID: ${sale.ui_id || sale.id?.slice(0, 8).toUpperCase()}`}
          badges={[
            { text: sale.status, variant: sale.status === "Completed" ? "success" : sale.status === "Cancelled" ? "danger" : "warning", showPulse: sale.status === "Pending" },
            { text: sale.origin, variant: "primary" }
          ]}
          infoItems={[
            { icon: Calendar, text: timeStr ? `${dateStr} at ${timeStr}` : dateStr },
            { icon: User, text: customerName }
          ]}
          actions={
            <div className="flex items-center gap-2">
              {canReturn && (
                <button
                  onClick={() => setIsReturnOpen(true)}
                  className="h-8 px-3 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm shrink-0 flex items-center gap-1.5 active:scale-95"
                  title="Process Return"
                >
                  <RotateCcw size={13} />
                  <span>Return</span>
                </button>
              )}
              <button
                onClick={() => navigate("/sales")}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-650 rounded-lg hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
                title="Back to Sales"
              >
                <ArrowLeft size={14} />
              </button>
            </div>
          }
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex-none px-1 py-2">
        <div className="flex gap-2 p-1 bg-slate-100/50 w-fit rounded-lg border border-slate-200/50">
          {["Overview", "Items"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeTab === i
                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              {tab}
            </button>
          ))}
          <button
            key="Returns & Exchanges"
            onClick={() => setActiveTab(2)}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 2
                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
          >
            Returns & Exchanges
            {reCount > 0 && (
              <span className={`flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-black ${activeTab === 2 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {reCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1 pb-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* TAB 0 — Overview */}
          {activeTab === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-4">
                  <SectionCard title="Customer Information">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                      <DetailItem icon={User} label="Customer Name" value={customerName} />
                      <DetailItem icon={Database} label="Order ID" value={String(sale.ui_id || "")} />
                      {customerMobile && <DetailItem icon={Smartphone} label="Customer Mobile" value={customerMobile} />}
                      <DetailItem icon={Calendar} label="Date & Time" value={timeStr ? `${dateStr} at ${timeStr}` : dateStr} />
                      <DetailItem icon={Search} label="Origin" value={sale.origin} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Financial Summary">
                    <div className="space-y-1">
                      {(() => {
                        const calcGst = (sale as any)?.calculation_infos?.gst_amount ?? (sale as any)?.calculation_infos?.total_gst_amount;
                        const totalItemGst = items.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
                        const gstAmount = calcGst !== undefined && calcGst !== null && !isNaN(Number(calcGst)) && Number(calcGst) > 0 ? Number(calcGst) : totalItemGst;
                        const finalGrand = adjustedGrandTotal > 0 ? adjustedGrandTotal : Math.max(sale.total_sellprice || 0, subtotal + gstAmount);
                        const displaySubtotal = (totalReplacementsValue > 0 || totalExchangedReturnedValue > 0 || totalRefundsValue > 0)
                          ? Math.max(0, finalGrand - gstAmount)
                          : subtotal;

                        return (
                          <>
                            <InfoRow label="Subtotal" value={fmt(displaySubtotal)} />
                            {gstAmount > 0 && (
                              <InfoRow label="GST Amount" value={<span className="text-indigo-600 font-semibold">+{fmt(gstAmount)}</span>} />
                            )}
                            <div className="mt-4 pt-4 border-t-2 border-slate-800 flex justify-between">
                              <span className="font-black">Grand Total</span>
                              <span className="text-xl font-black text-slate-900">
                                {fmt(finalGrand)}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </SectionCard>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-4">
                  <SectionCard title="Sale Info">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Order No</span>
                        <span className="text-xs font-bold text-slate-700">{sale.ui_id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Total Items</span>
                        <span className="text-xs font-bold text-slate-700">{items.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Origin</span>
                        <span className="text-xs font-bold text-slate-700">{sale.origin}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Payment</span>
                        <span className="text-xs font-bold text-slate-700">{paymentsDetail.map(p => p.label).join(', ') || "—"}</span>
                      </div>
                      {(refunded > 0 || exchanged > 0 || exchangesCount > 0 || returnsCount > 0) && (
                        <div className="pt-2.5 border-t border-slate-100/50 space-y-2">
                          {returnsCount > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Return Refund Mode</span>
                              <span className="text-xs font-bold text-rose-600">
                                {(() => {
                                  const allModes = (sale.returns || []).flatMap((r: any) => extractPaymentList(r.payment_infos, r.payment_method).map(p => p.method));
                                  return Array.from(new Set(allModes)).join(", ") || "Cash";
                                })()}
                              </span>
                            </div>
                          )}
                          {exchangesCount > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Exchange Payment Mode</span>
                              <span className="text-xs font-bold text-indigo-600">
                                {(() => {
                                  const allModes = ((sale as any).exchanges || []).flatMap((e: any) => extractPaymentList(e.payment_infos, e.payment_method).map(p => p.method));
                                  return Array.from(new Set(allModes)).join(", ") || "Cash";
                                })()}
                              </span>
                            </div>
                          )}
                          {refunded > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Refunded Items</span>
                              <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md">{refunded}</span>
                            </div>
                          )}
                          {exchanged > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Exchanged Items</span>
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{exchanged}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard title="Payment Summary">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100/50">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Status</span>
                        {outstanding > 0 ? (
                          totalPaid === 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--pay-pending-bg)] text-[var(--pay-pending-tx)] border border-[var(--pay-pending-bd)]">Pending</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--pay-partial-bg)] text-[var(--pay-partial-tx)] border border-[var(--pay-partial-bd)]">Partially Paid</span>
                          )
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]">Paid</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold text-slate-600 pt-1">
                        <span>Paid Amount</span>
                        <span className="tabular-nums text-slate-800">{fmt(totalPaid)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-100">
                        <span className="text-slate-600">Outstanding</span>
                        <span className={`tabular-nums ${outstanding > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                          {fmt(outstanding)}
                        </span>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1 — Items */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <SectionCard title="Order Items" className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Product Details</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Qty</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Unit</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Unit Price</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">GST Amount</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">With GST</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-slate-700 bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={16} className="text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold text-slate-400">{item.sku}</span>
                                  {item.categoryName && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-purple-50 text-purple-650 border border-purple-100 font-sans">
                                      {item.categoryName}
                                    </span>
                                  )}
                                  {item.gst !== undefined && item.gst !== null && (
                                    <AntBadge variant="lb-gst" type="tag">GST {typeof item.gst === "number" ? `${item.gst}%` : item.gst}</AntBadge>
                                  )}
                                  {item.status && (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${item.status === "REFUNDED" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                      {item.status} {item.returnedQty ? `(${item.returnedQty})` : ""}
                                    </span>
                                  )}
                                  {item.reason && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-slate-100 text-slate-500">
                                      Reason: {item.reason}
                                    </span>
                                  )}
                                </div>
                                {item.variantName && (
                                  <div className="mt-2">
                                    <AntBadge variant="at-variant" type="tag" icon={<Layers size={9} />}>{item.variantName}</AntBadge>
                                  </div>
                                )}
                                {item.batchName && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md text-[10px] text-slate-650 shadow-sm">
                                      <div className="flex justify-between items-center font-bold">
                                        <span className="text-slate-800">Batch: {item.batchName || "Default"}</span>
                                        <span className="text-indigo-600">Qty: {item.quantity}</span>
                                      </div>
                                      {(item.mfgDate || item.expDate) && (
                                        <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                                          {item.mfgDate && <span>MFG: {formatBatchDate(item.mfgDate)}</span>}
                                          {item.expDate && <span>EXP: {formatBatchDate(item.expDate)}</span>}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {item.serial_numbers && item.serial_numbers.length > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
                                      <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serial Numbers:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {item.serial_numbers.map((sn: any, idx: number) => (
                                          <span key={idx} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{typeof sn === 'object' ? ((sn as any).name || (sn as any).id) : sn}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-black text-slate-600">{getItemDisplayQty(item)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100">{(item as any).entered_unit || item.unit}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs font-bold text-slate-700 tabular-nums">{fmt(item.basePrice)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(item.gstAmount)}</span>
                            {item.gstRate > 0 && (
                              <span className="text-[10px] font-medium text-slate-400 block tabular-nums">@{item.gstRate}%</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs font-bold text-slate-700 tabular-nums">{fmt(item.basePrice + (item.gstAmount / (item.quantity || 1)))}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-black text-slate-900 tabular-nums">{fmt(item.totalAmount)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              {(sale as any)?.exchanges?.map((exch: any, idx: number) => {
                const repItems = exch.replaced_items || [];
                if (repItems.length === 0) return null;
                return (
                  <SectionCard key={exch.id || idx} title={`Exchange Replacement #${exch.ui_id || exch.id?.slice(0, 8).toUpperCase()}`} className="p-0 overflow-hidden border-blue-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-blue-50/30 border-b border-blue-100/50">
                            <th className="px-6 py-3 text-[10px] font-black text-blue-500 uppercase tracking-[0.15em]">Replacement Product</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-500 uppercase tracking-[0.15em] text-center">Qty</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-500 uppercase tracking-[0.15em] text-center">Unit</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-500 uppercase tracking-[0.15em] text-right">Unit Price</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-500 uppercase tracking-[0.15em] text-right">GST Amount</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-500 uppercase tracking-[0.15em] text-right">With GST</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-500 uppercase tracking-[0.15em] text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {repItems.map((item: any, rIdx: number) => {
                            const variantN = item.variant_infos?.variant_name || item.variant_name;
                            const batchN = item.batch_infos?.batch_name || item.batch_name;
                            const serialsList = Array.isArray(item.serialno_infos) ? item.serialno_infos.map((sn: any) => sn.name || sn) : [];
                            const displayQty = item.entered_qty ?? item.quantity ?? 1;
                            let basePrice = item.sell_price || 0;
                            if (item.total_amount && item.quantity && basePrice === 0) {
                                basePrice = item.total_amount / item.quantity;
                            }
                            const rawGst = item.gst || item.datas?.gst || 0;
                            const gstRate = typeof rawGst === "number" ? rawGst : (parseFloat(String(rawGst).replace("%", "")) || 0);
                            const calcInfos = (sale as any)?.calculation_infos || (sale as any)?.calculations || {};
                            const includeGst = calcInfos.include_gst === true || calcInfos.gst_type === "INCLUSIVE" || sale.gst_infos?.type === "INCLUSIVE";
                            
                            let repGst = item.gst_amount || item.total_gst_amount || 0;
                            if (!item.gst_amount && !item.total_gst_amount && gstRate > 0) {
                                if (includeGst) {
                                    const baseWithoutGst = basePrice / (1 + gstRate / 100);
                                    repGst = (basePrice - baseWithoutGst) * displayQty;
                                } else {
                                    repGst = (basePrice * (gstRate / 100)) * displayQty;
                                }
                            }
                            let unitPriceIncGst = basePrice;
                            if (gstRate > 0 && !includeGst) {
                                unitPriceIncGst = basePrice + (basePrice * (gstRate / 100));
                            }
                            const repTotal = item.total_amount || (unitPriceIncGst * displayQty);
                            const unitPriceExclGst = unitPriceIncGst - (repGst / displayQty);

                            return (
                              <tr key={item.id || rIdx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-blue-50 border-blue-100 overflow-hidden">
                                      <Package size={16} className="text-blue-500" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-800 truncate">{item.name || item.product_name}</p>
                                      {item.ui_id && <span className="text-[10px] font-mono font-bold text-slate-400 block mt-0.5">{item.ui_id}</span>}
                                      {variantN && <div className="mt-1"><AntBadge variant="at-variant" type="tag" icon={<Layers size={9} />}>{variantN}</AntBadge></div>}
                                      {batchN && <p className="text-[10px] font-extrabold text-amber-700 bg-amber-50/50 px-1.5 py-0.5 rounded w-fit mt-1">Batch: {batchN}</p>}
                                      {serialsList.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {serialsList.map((sn: any, sIdx: number) => (
                                            <span key={sIdx} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-blue-600 border border-blue-200">
                                              SN: {typeof sn === 'object' ? (sn.name || sn.id) : sn}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-xs font-black text-blue-650">{item.entered_qty ?? item.quantity}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-[10px] font-black text-blue-500 uppercase px-2 py-0.5 rounded bg-blue-50 border border-blue-100">{item.entered_unit || item.unit_infos?.name || item.unit || ""}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(unitPriceExclGst)}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(repGst)}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-xs font-bold text-slate-700 tabular-nums">{fmt(unitPriceExclGst + (repGst / displayQty))}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-sm font-black text-slate-800 tabular-nums">{fmt(repTotal)}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </SectionCard>
                );
              })}
              {sale.exchanged_items?.map((exch, idx) => {
                const replacementItems = generateItems(exch.replacement_order, productMap);
                return (
                  <SectionCard key={idx} title={`Replacement Order #${exch.replacement_order.ui_id}`} className="p-0 overflow-hidden border-blue-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-blue-50/30 border-b border-blue-100/50">
                            <th className="px-6 py-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.15em]">Replacement Product</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] text-center">Qty</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] text-center">Unit</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] text-right">Unit Price</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] text-right">GST Amount</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] text-right">With GST</th>
                            <th className="px-6 py-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {replacementItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-blue-50 border-blue-100 overflow-hidden">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package size={16} className="text-blue-500" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <span className="text-[10px] font-mono font-bold text-slate-400">{item.sku}</span>
                                      {item.categoryName && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-purple-50 text-purple-650 border border-purple-100 font-sans">
                                          {item.categoryName}
                                        </span>
                                      )}
                                      {item.gst !== undefined && item.gst !== null && (
                                        <AntBadge variant="lb-gst" type="tag">GST {typeof item.gst === "number" ? `${item.gst}%` : item.gst}</AntBadge>
                                      )}
                                      {item.status && (
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${item.status === "REFUNDED" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                          {item.status} {item.returnedQty ? `(${item.returnedQty})` : ""}
                                        </span>
                                      )}
                                      {item.reason && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-slate-100 text-slate-500">
                                          Reason: {item.reason}
                                        </span>
                                      )}
                                    </div>
                                    {item.variantName && (
                                      <div className="mt-2">
                                        <AntBadge variant="at-variant" type="tag" icon={<Layers size={9} />}>{item.variantName}</AntBadge>
                                      </div>
                                    )}
                                    {item.batchName && (
                                      <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md text-[10px] text-slate-650 shadow-sm">
                                          <div className="flex justify-between items-center font-bold">
                                            <span className="text-slate-800">Batch: {item.batchName || "Default"}</span>
                                            <span className="text-indigo-600">Qty: {item.quantity}</span>
                                          </div>
                                          {(item.mfgDate || item.expDate) && (
                                            <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                                              {item.mfgDate && <span>MFG: {formatBatchDate(item.mfgDate)}</span>}
                                              {item.expDate && <span>EXP: {formatBatchDate(item.expDate)}</span>}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {item.serial_numbers && item.serial_numbers.length > 0 && (
                                      <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
                                          <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serial Numbers:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {item.serial_numbers.map((sn: any, idx: number) => (
                                              <span key={idx} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{typeof sn === 'object' ? ((sn as any).name || (sn as any).id) : sn}</span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-xs font-black text-slate-600">{getItemDisplayQty(item)}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-[10px] font-black text-blue-500 uppercase px-2 py-0.5 rounded bg-blue-50 border border-blue-100">{(item as any).entered_unit || item.unit}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xs font-bold text-slate-700 tabular-nums">{fmt(item.basePrice)}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(item.gstAmount)}</span>
                                {item.gstRate > 0 && (
                                  <span className="text-[10px] font-medium text-slate-400 block tabular-nums">@{item.gstRate}%</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xs font-bold text-slate-700 tabular-nums">{fmt(item.basePrice + (item.gstAmount / (item.quantity || 1)))}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-black text-slate-900 tabular-nums">{fmt(item.totalAmount)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Replacement Value</span>
                      <div className="flex items-center gap-6 text-right">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Payment Collected / Refunded</span>
                          {(() => {
                            const pList = extractPaymentList((exch as any).payment_infos, (exch as any).payments || exch.replacement_order?.payments);
                            const pModes = pList.map(p => p.method).join(", ");
                            const paymentSum = pList.reduce((sum, p) => sum + (p.amount || 0), 0) ||
                              (exch.replacement_order?.payments ? Object.values(exch.replacement_order.payments).reduce((sum: number, val: any) => sum + Number(val), 0) : 0);
                            const diffVal = (Number((exch as any).total_replacement_amount) || 0) - (Number((exch as any).total_exchanged_amount) || 0);
                            const isRefund = diffVal < 0 || paymentSum < 0;
                            const amountToShow = Math.abs(diffVal) || Math.abs(paymentSum);
                            if (isRefund && amountToShow > 0) {
                              return <span className="text-sm font-black tabular-nums text-red-600">Refund: {fmt(amountToShow)} {pModes ? `(${pModes})` : ""}</span>;
                            } else if (diffVal > 0 || paymentSum > 0) {
                              return <span className="text-sm font-black tabular-nums text-emerald-600">Collected: {fmt(amountToShow)} {pModes ? `(${pModes})` : ""}</span>;
                            } else {
                              return <span className="text-sm font-black tabular-nums text-slate-500">₹0</span>;
                            }
                          })()}
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Value</span>
                          <span className="text-sm font-black text-blue-600 tabular-nums">{fmt((exch as any).total_replacement_amount || exch.replacement_order?.total_sellprice || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          )}

          {/* TAB 2 — Returns & Exchanges */}
          {activeTab === 2 && (
            <div className="space-y-6">
              {/* 1. Exchanges */}
              {Array.isArray((sale as any)?.exchanges) && (sale as any).exchanges.length > 0 && (
                <div className="space-y-4">
                  {(sale as any).exchanges.map((exch: any, eIdx: number) => {
                    const diff = (Number(exch.total_replacement_amount) || 0) - (Number(exch.total_exchanged_amount) || 0);
                    const returnedItems = exch.items || [];
                    const replacementItems = exch.replaced_items || [];
                    const parsedExchPayments = extractPaymentList(exch.payment_infos, exch.payments || exch.payment_method || exch.replacement_order?.payments);
                    const exchPaymentModesText = parsedExchPayments.map(p => p.amount !== undefined ? `${p.method} (${fmt(p.amount)})` : p.method).join(", ") || (exch.payment_method ? formatPaymentMethodName(exch.payment_method) : "");

                    return (
                      <SectionCard key={exch.id || eIdx} title="Exchange Details" className="p-0 overflow-hidden border-blue-200 shadow-sm">
                        {/* Header Banner */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 flex flex-wrap justify-between items-center text-xs gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-blue-800">Status: {exch.status || "COMPLETED"}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${diff > 0 ? "bg-amber-50 text-amber-800 border-amber-200" : diff < 0 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-blue-50 text-blue-800 border-blue-200"}`}>
                              {diff > 0 ? `Collected Extra: ${fmt(diff)}` : diff < 0 ? `Refunded: ${fmt(Math.abs(diff))}` : "Even Value Exchange"}
                            </span>
                            {exchPaymentModesText && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                                <CreditCard size={11} className="text-indigo-500" />
                                <span>{diff < 0 ? "Refund Mode: " : "Payment Mode: "}<strong>{exchPaymentModesText}</strong></span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-slate-600 font-bold flex-wrap">
                            <span>Returned Value: <strong className="text-slate-900">{fmt(exch.total_exchanged_amount || 0)}</strong></span>
                            <span className="text-slate-300">|</span>
                            <span>Replacement Value: <strong className="text-emerald-700">{fmt(exch.total_replacement_amount || 0)}</strong></span>
                            {parsedExchPayments.length > 0 && (
                              <>
                                <span className="text-slate-300">|</span>
                                <span>
                                  {diff < 0 ? "Refund Mode: " : "Payment Mode: "}
                                  <strong className="text-indigo-700">
                                    {parsedExchPayments.map(p => p.method).join(", ")}
                                  </strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Returned Items Subtable */}
                        <div className="p-4 border-b border-slate-100 bg-rose-50/10">
                          <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Returned by Customer
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-rose-100/80 bg-white">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-rose-50/40 border-b border-rose-100 text-rose-900">
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em]">Product</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-center">Returned Qty</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-center">Date & Time</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-right">Unit Price</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-right">GST Amount</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-right">Total</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-right">Reason</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-rose-50">
                                {returnedItems.map((rItem: any, idx: number) => {
                                  const variantN = rItem.variant_infos?.variant_name || rItem.variant_name;
                                  const batchN = rItem.batch_infos?.batch_name || rItem.batch_name;
                                  const matchingItem = items.find((i: any) => i.id === rItem.order_item_id || i.id === rItem.id || i.id === (rItem as any).return_order_item_id);
                                  const displayQty = rItem.entered_qty ?? rItem.quantity ?? 1;
                                  const itemGst = matchingItem ? (matchingItem.gstAmount / (matchingItem.quantity || 1)) * displayQty : (rItem.gst_amount || rItem.total_gst_amount || 0);
                                  const itemTotal = rItem.exchange_amount || (matchingItem ? matchingItem.unitPrice * displayQty : 0);
                                  return (
                                    <tr key={rItem.id || idx} className="hover:bg-rose-50/20 transition-colors">
                                      <td className="px-4 py-3">
                                        <p className="text-sm font-bold text-slate-800">{rItem.name}</p>
                                        {rItem.ui_id && <span className="text-[10px] font-mono font-bold text-slate-400">{rItem.ui_id}</span>}
                                        {variantN && <div className="mt-1"><AntBadge variant="at-variant" type="tag">{variantN}</AntBadge></div>}
                                        {batchN && <p className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit mt-1">Batch: {batchN}</p>}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="text-xs font-black text-rose-600">{rItem.entered_qty ?? rItem.quantity}</span>
                                        <span className="text-[9px] font-black text-rose-400 uppercase block">{rItem.entered_unit || rItem.unit_infos?.name || ""}</span>
                                      </td>
                                      <td className="px-4 py-3 text-center whitespace-nowrap">
                                        {(() => {
                                          const exchItemDateVal = rItem.created_at || exch.created_at || exch.date || (exch as any).createdAt || sale.updated_at || sale.created_at;
                                          const exchItemDate = fmtShortDate(exchItemDateVal);
                                          const exchItemTime = fmtTime(exchItemDateVal);
                                          return (
                                            <div>
                                              <span className="text-xs font-bold text-slate-700 block">{exchItemDate}</span>
                                              {exchItemTime && <span className="text-[10px] font-semibold text-slate-400 block">{exchItemTime}</span>}
                                            </div>
                                          );
                                        })()}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt((itemTotal - itemGst) / displayQty)}</span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(itemGst)}</span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className="text-sm font-black text-slate-850 tabular-nums">{fmt(itemTotal)}</span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className="text-xs font-semibold text-slate-600">{rItem.reason || exch.reason || "Exchange"}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Replacement Items Subtable */}
                        <div className="p-4 bg-emerald-50/15">
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Replacement Products Provided
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-emerald-100 bg-white">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-emerald-50/50 border-b border-emerald-100 text-emerald-900">
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em]">Replacement Item</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-center">Qty Given</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-center">Date & Time</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-right">Unit Price</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-right">GST Amount</th>
                                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-50">
                                {replacementItems.map((repItem: any, idx: number) => {
                                  const variantN = repItem.variant_infos?.variant_name || repItem.variant_name;
                                  const batchN = repItem.batch_infos?.batch_name || repItem.batch_name;
                                  const serialsList = Array.isArray(repItem.serialno_infos) ? repItem.serialno_infos.map((sn: any) => sn.name || sn) : [];
                                  
                                  const displayQty = repItem.entered_qty ?? repItem.quantity ?? 1;
                                  let basePrice = repItem.sell_price || 0;
                                  if (repItem.total_amount && repItem.quantity && basePrice === 0) {
                                      basePrice = repItem.total_amount / repItem.quantity;
                                  }
                                  const rawGst = repItem.gst || repItem.datas?.gst || 0;
                                  const gstRate = typeof rawGst === "number" ? rawGst : (parseFloat(String(rawGst).replace("%", "")) || 0);
                                  const calcInfos = (sale as any)?.calculation_infos || (sale as any)?.calculations || {};
                                  const includeGst = calcInfos.include_gst === true || calcInfos.gst_type === "INCLUSIVE" || sale.gst_infos?.type === "INCLUSIVE";
                                  
                                  let repGst = repItem.gst_amount || repItem.total_gst_amount || 0;
                                  if (!repItem.gst_amount && !repItem.total_gst_amount && gstRate > 0) {
                                      if (includeGst) {
                                          const baseWithoutGst = basePrice / (1 + gstRate / 100);
                                          repGst = (basePrice - baseWithoutGst) * displayQty;
                                      } else {
                                          repGst = (basePrice * (gstRate / 100)) * displayQty;
                                      }
                                  }
                                  let unitPriceIncGst = basePrice;
                                  if (gstRate > 0 && !includeGst) {
                                      unitPriceIncGst = basePrice + (basePrice * (gstRate / 100));
                                  }
                                  const repTotal = repItem.total_amount || (unitPriceIncGst * displayQty);
                                  const unitPriceExclGst = unitPriceIncGst - (repGst / displayQty);
                                  return (
                                    <tr key={repItem.id || idx} className="hover:bg-emerald-50/30 transition-colors">
                                      <td className="px-4 py-3">
                                        <p className="text-sm font-bold text-slate-800">{repItem.name || repItem.product_name}</p>
                                        {repItem.ui_id && <span className="text-[10px] font-mono font-bold text-slate-400">{repItem.ui_id}</span>}
                                        {variantN && <div className="mt-1"><AntBadge variant="at-variant" type="tag">{variantN}</AntBadge></div>}
                                        {batchN && <p className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit mt-1">Batch: {batchN}</p>}
                                        {serialsList.length > 0 && (
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {serialsList.map((sn: any, sIdx: number) => (
                                              <span key={sIdx} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                SN: {typeof sn === 'object' ? (sn.name || sn.id) : sn}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="text-xs font-black text-emerald-700">{repItem.entered_qty ?? repItem.quantity}</span>
                                        {(() => {
                                          const repUnit = repItem.entered_unit || repItem.unit_infos?.name || repItem.unit || repItem.unit_name || (() => {
                                            const matched = (sale.items || []).find((si: any) => si.product_id === repItem.product_id);
                                            return (matched as any)?.unit_infos?.name || (matched as any)?.entered_unit || matched?.unit || "";
                                          })();
                                          return repUnit ? <span className="text-[9px] font-black text-emerald-500 uppercase block">{repUnit}</span> : null;
                                        })()}
                                      </td>
                                      <td className="px-4 py-3 text-center whitespace-nowrap">
                                        {(() => {
                                          const repItemDateVal = repItem.created_at || exch.created_at || exch.date || (exch as any).createdAt || sale.updated_at || sale.created_at;
                                          const repItemDate = fmtShortDate(repItemDateVal);
                                          const repItemTime = fmtTime(repItemDateVal);
                                          return (
                                            <div>
                                              <span className="text-xs font-bold text-slate-700 block">{repItemDate}</span>
                                              {repItemTime && <span className="text-[10px] font-semibold text-slate-400 block">{repItemTime}</span>}
                                            </div>
                                          );
                                        })()}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(unitPriceExclGst)}</span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(repGst)}</span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className="text-sm font-black text-emerald-800 tabular-nums">{fmt(repTotal)}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Exchange Settlement Footer */}
                        <div className="p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/30 border-t border-blue-100 flex flex-wrap justify-between items-center text-xs gap-3">
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Settlement:</span>
                            <span className="font-semibold text-slate-700">
                              {diff > 0
                                ? `Extra balance of ${fmt(diff)} paid by customer`
                                : diff < 0
                                ? `Refund of ${fmt(Math.abs(diff))} issued to customer`
                                : "Direct even-value exchange (no balance due)"}
                            </span>
                          </div>
                          {parsedExchPayments.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{diff < 0 ? "Refund Mode:" : "Payment Mode:"}</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {parsedExchPayments.map((p, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                                    <CreditCard size={12} className="text-indigo-500" />
                                    {p.method}{p.amount !== undefined ? `: ${fmt(p.amount)}` : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            exch.payment_method && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{diff < 0 ? "Refund Mode:" : "Payment Mode:"}</span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                                  <CreditCard size={12} className="text-indigo-500" />
                                  {formatPaymentMethodName(exch.payment_method)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </SectionCard>
                    );
                  })}
                </div>
              )}

              {/* 2. Refund Requests */}
              {Array.isArray(sale.returns) && sale.returns.length > 0 && (
                <div className="space-y-4">
                  {sale.returns.map((ret: any, rIdx: number) => {
                    const parsedRetPayments = extractPaymentList(ret.payment_infos, ret.payments || ret.payment_method || (sale as any)?.payment_infos);
                    const retPaymentModesText = parsedRetPayments.map(p => p.amount !== undefined ? `${p.method} (${fmt(p.amount)})` : p.method).join(", ") || (ret.payment_method ? formatPaymentMethodName(ret.payment_method) : "");

                    return (
                    <SectionCard key={ret.id || rIdx} title="Return Details" className="p-0 overflow-hidden border-rose-100 shadow-sm">
                      <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50/30 border-b border-rose-100 flex flex-wrap justify-between items-center text-xs gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-rose-700">Refund Status: {ret.status || "COMPLETED"}</span>
                          {retPaymentModesText && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-white text-rose-700 border border-rose-200 shadow-2xs">
                              <CreditCard size={11} className="text-rose-500" />
                              <span>Refund Mode: <strong>{retPaymentModesText}</strong></span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-slate-650 font-bold flex-wrap">
                          {parsedRetPayments.length > 0 && (
                            <>
                              <span>Refund Mode: <strong className="text-rose-700">{parsedRetPayments.map(p => p.method).join(", ")}</strong></span>
                              <span className="text-slate-300">|</span>
                            </>
                          )}
                          <span>GST Amount: <strong className="text-slate-800">{fmt(ret.total_gst_amount)}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span>Total Refund: <strong className="text-rose-600">{fmt(ret.total_refund_amount)}</strong> (Qty: {ret.total_refund_qty})</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Returned Product</th>
                              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Returned Qty</th>
                              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Date & Time</th>
                              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Unit Price</th>
                              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">GST Amount</th>
                              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Total Refund</th>
                              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Payment Mode</th>
                              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {(ret.items || []).map((retItem: any) => {
                              const variantN = retItem.variant_infos?.variant_name || retItem.variant_name;
                              const batchN = retItem.batch_infos?.batch_name || retItem.batch_name;
                              const serialsList = Array.isArray(retItem.serialno_infos) ? retItem.serialno_infos.map((sn: any) => sn.name || sn) : [];

                              const origItem = sale.items?.find((i: any) => i.id === retItem.order_item_id || i.id === retItem.return_order_item_id);
                              let displayQty = retItem.quantity;
                              let displayUnit = retItem.unit || origItem?.unit || "";

                              if (origItem && (origItem as any).entered_qty !== undefined && origItem.quantity > 0) {
                                const factor = (origItem as any).entered_qty / origItem.quantity;
                                displayQty = Number((retItem.quantity * factor).toFixed(2));
                                displayUnit = (origItem as any).entered_unit || displayUnit;
                              }
                              
                              const matchingItem = items.find((i: any) => i.id === retItem.order_item_id || i.id === retItem.return_order_item_id || i.id === retItem.id);
                              const retGst = matchingItem ? (matchingItem.gstAmount / (matchingItem.quantity || 1)) * (retItem.quantity || 1) : (retItem.gst_amount || retItem.total_gst_amount || 0);
                              const retTotal = retItem.refund_amount || (matchingItem ? matchingItem.unitPrice * (retItem.quantity || 1) : 0);
                              const retUnitPriceExclGst = (retTotal - retGst) / (displayQty || 1);

                              return (
                                <tr key={retItem.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-slate-700 bg-rose-50 border border-rose-100 shrink-0 overflow-hidden">
                                        {retItem.image_url || retItem.image || retItem.product?.image_url || retItem.product?.image || retItem.datas?.image_url || retItem.datas?.image ? (
                                          <img src={retItem.image_url || retItem.image || retItem.product?.image_url || retItem.product?.image || retItem.datas?.image_url || retItem.datas?.image} alt={retItem.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <Package size={16} className="text-rose-500" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{retItem.name}</p>
                                        <span className="text-[10px] font-mono font-bold text-slate-400 block mt-0.5">{retItem.ui_id}</span>
                                        {variantN && (
                                          <div className="mt-1">
                                            <AntBadge variant="at-variant" type="tag" icon={<Layers size={9} />}>{variantN}</AntBadge>
                                          </div>
                                        )}
                                        {batchN && (
                                          <p className="text-[10px] font-extrabold text-amber-700 bg-amber-50/50 px-1.5 py-0.5 rounded w-fit mt-1">Batch: {batchN}</p>
                                        )}
                                        {serialsList.length > 0 && (
                                          <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
                                            <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Returned Serials:</p>
                                            <div className="flex flex-wrap gap-1">
                                              {serialsList.map((sn: any, idx: number) => (
                                                <span key={idx} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-rose-600 border border-slate-200 shadow-sm">{typeof sn === 'object' ? ((sn as any).name || (sn as any).id) : sn}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                      <span className="text-xs font-black text-rose-600">{displayQty}</span>
                                      {displayUnit && <span className="text-[9px] font-black text-rose-400 uppercase mt-0.5">{displayUnit}</span>}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center whitespace-nowrap">
                                    {(() => {
                                      const retItemDateVal = retItem.created_at || ret.created_at || ret.date || (ret as any).createdAt || sale.updated_at || sale.created_at;
                                      const retItemDate = fmtShortDate(retItemDateVal);
                                      const retItemTime = fmtTime(retItemDateVal);
                                      return (
                                        <div>
                                          <span className="text-xs font-bold text-slate-700 block">{retItemDate}</span>
                                          {retItemTime && <span className="text-[10px] font-semibold text-slate-400 block">{retItemTime}</span>}
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(retUnitPriceExclGst)}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(retGst)}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="text-sm font-black text-slate-850 tabular-nums">{fmt(retTotal)}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs">
                                      <CreditCard size={12} className="text-rose-500" />
                                      {parsedRetPayments.map(p => p.method).join(", ") || (sale.payment_method || "Cash")}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="text-xs font-semibold text-slate-500">{retItem.reason}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Return Settlement Footer */}
                      <div className="p-3.5 bg-gradient-to-r from-slate-50 to-rose-50/20 border-t border-rose-100 flex flex-wrap justify-between items-center text-xs gap-3">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Settlement:</span>
                          <span className="font-semibold text-slate-700">
                            Total refund of {fmt(ret.total_refund_amount)} issued for {ret.total_refund_qty || ret.items?.length || 1} returned item(s)
                          </span>
                        </div>
                        {parsedRetPayments.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Refund Mode:</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {parsedRetPayments.map((p, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-white text-rose-700 border border-rose-200 shadow-2xs">
                                  <CreditCard size={12} className="text-rose-500" />
                                  {p.method}{p.amount !== undefined ? `: ${fmt(p.amount)}` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          ret.payment_method && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Refund Mode:</span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-white text-rose-700 border border-rose-200 shadow-2xs">
                                <CreditCard size={12} className="text-rose-500" />
                                {formatPaymentMethodName(ret.payment_method)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </SectionCard>
                    );
                  })}
                </div>
              )}

              {/* Empty state when neither returns nor exchanges exist */}
              {(!Array.isArray((sale as any)?.exchanges) || (sale as any).exchanges.length === 0) &&
                (!Array.isArray(sale.returns) || sale.returns.length === 0) && (
                  <SectionCard title="Processed Returns / Exchanges">
                    <div className="p-8 text-center text-slate-400 font-medium text-xs">
                      No returns or exchanges have been processed for this order.
                    </div>
                  </SectionCard>
                )}
            </div>
          )}

        </div>
      </div>



      {isReturnOpen && sale && (
        <ReturnModal
          sale={sale}
          onClose={() => setIsReturnOpen(false)}
          onRefresh={fetchSaleDetail}
          productMap={productMap}
        />
      )}
    </div>
  );
};

export default SaleDetailPage;
