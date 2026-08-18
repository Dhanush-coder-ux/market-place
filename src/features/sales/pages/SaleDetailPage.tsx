import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft, Package, User,
  RotateCcw, Calendar, Clock,
  AlertCircle, Smartphone,
  Database,
  Search,
  Layers
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
const fmt = (n?: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

type SaleItem = {
  id: string; name: string; sku: string; quantity: number; returnedQty?: number; reason?: string;
  unitPrice: number; buyPrice: number;
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
  const calcItems = (sale as any)?.calculation_infos?.items || [];
  return (sale?.items || []).map((i: any) => {
    // Attempt to find matching calc item for subunit pricing/qty details
    const calc = calcItems.find((ci: any) => ci.product_id === i.product_id || ci.product_id === i.inventory_id);
    return {
      id: i.id,
      name: i.name || i.product_name || i.datas?.product_name || i.datas?.name || productMap[i.inventory_id] || "Unknown Item",
      sku: i.barcode?.trim() || i.inventory_id?.slice(-6) || "N/A",
      quantity: calc?.qty ?? i.quantity ?? 0,
      returnedQty: i.returned_quantity || 0,
      unitPrice: calc?.price ?? i.sell_price ?? 0,
      buyPrice: i.buy_price || 0,
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
            total_sellprice: found.total_sellprice ?? found.calculation_infos?.total ?? found.total ?? 0,
            status: found.status ? found.status.charAt(0).toUpperCase() + found.status.slice(1).toLowerCase() : "Completed",
            origin: found.origin === "OFFLINE" ? "Sales" : found.origin || "Sales",
          });
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
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const canReturn = sale.status === "Completed" && sale.origin !== "Sales Return";
  const customerName = (sale as any).additional_infos?.customer_name || (sale as any).datas?.customer_name || sale.customer?.customer_name || customerMap[sale.customer_id] || "Walk-in Customer";
  const customerMobile = (sale as any).additional_infos?.customer_phone || sale.customer?.customer_mobile_number || "";
  const dateStr = sale.created_at?.split("T")[0] || "N/A";
  const timeStr = sale.created_at?.includes("T") ? sale.created_at.split("T")[1]?.slice(0, 5) || "" : "";
  const refunded = items.filter(i => i.status === "REFUNDED").length;
  const exchanged = items.filter(i => i.status === "EXCHANGED").length;

  const rawPayments = (sale as any).payment_infos || (sale as any).payment_info || sale.payments || {};
  const paymentsDetail = rawPayments && Object.keys(rawPayments).length > 0
    ? Object.entries(rawPayments).map(([k, v]) => {
      const u = k.toUpperCase();
      const label = u === "CASH" ? "Cash" : u === "CARD" ? "Card" : (u === "UPI" || u === "G-PAY" || u === "GPAY") ? "UPI" : u === "PHONEPE" ? "PhonePe" : (u === "CREDIT" || u === "ON_CREDIT") ? "Credit" : k;
      return { label, amount: v as number };
    })
    : [{ label: sale.payment_method || "Other", amount: sale.total_sellprice }];

  const totalPaid = paymentsDetail.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(0, (sale.total_sellprice || 0) - totalPaid);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans text-slate-900 overflow-hidden relative">

      {/* Profile Header Card */}
      <div className="flex-none p-1 pb-0">
        <ProfileHeaderCard
          name={`Order #${sale.ui_id}`}
          initials="ORD"
          subText={`Order ID: ${sale.ui_id || sale.id?.slice(0, 8).toUpperCase()}`}
          badges={[
            { text: sale.status, variant: sale.status === "Completed" ? "success" : sale.status === "Cancelled" ? "danger" : "warning", showPulse: sale.status === "Pending" },
            { text: sale.origin, variant: "primary" }
          ]}
          infoItems={[
            { icon: Calendar, text: `${dateStr} ${timeStr && `at ${timeStr}`}` },
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
          {["Overview", "Items", "Returns & Refunds"].map((tab, i) => (
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
                      <DetailItem icon={Calendar} label="Order Date" value={dateStr} />
                      <DetailItem icon={Clock} label="Order Time" value={timeStr || "—"} />
                      <DetailItem icon={Search} label="Origin" value={sale.origin} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Financial Summary">
                    <div className="space-y-1">
                      <InfoRow label="Subtotal" value={fmt(subtotal)} />
                      {(() => {
                        const gstAmount = (sale as any)?.calculation_infos?.gst_amount;
                        if (gstAmount !== undefined && gstAmount > 0) {
                          return <InfoRow label="GST" value={<span className="text-indigo-600 font-semibold">+{fmt(gstAmount)}</span>} />;
                        }
                        return null;
                      })()}
                      <div className="mt-4 pt-4 border-t-2 border-slate-800 flex justify-between">
                        <span className="font-black">Grand Total</span>
                        <span className="text-xl font-black text-slate-900">{fmt(sale.total_sellprice)}</span>
                      </div>
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
                      {(refunded > 0 || exchanged > 0) && (
                        <div className="pt-2.5 border-t border-slate-100/50 space-y-2">
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
                                          {item.mfgDate && <span>MFG: {item.mfgDate}</span>}
                                          {item.expDate && <span>EXP: {item.expDate}</span>}
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
                            <span className="text-xs font-black text-slate-600">{Number(((item as any).entered_qty !== undefined ? (item as any).entered_qty : (item.quantity || 0)).toFixed(2))}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100">{(item as any).entered_unit || item.unit}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(item.unitPrice)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-black text-slate-800 tabular-nums">{fmt(item.unitPrice * item.quantity)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

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
                                              {item.mfgDate && <span>MFG: {item.mfgDate}</span>}
                                              {item.expDate && <span>EXP: {item.expDate}</span>}
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
                                <span className="text-xs font-black text-slate-600">{Number(((item as any).entered_qty !== undefined ? (item as any).entered_qty : (item.quantity || 0)).toFixed(2))}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-[10px] font-black text-blue-500 uppercase px-2 py-0.5 rounded bg-blue-50 border border-blue-100">{(item as any).entered_unit || item.unit}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(item.unitPrice)}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-black text-slate-800 tabular-nums">{fmt(item.unitPrice * item.quantity)}</span>
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
                            const paymentSum = Object.values(exch.replacement_order.payments || {}).reduce((sum: number, val: any) => sum + Number(val), 0);
                            if (paymentSum < 0) {
                              return <span className="text-sm font-black tabular-nums text-red-600">Refund: {fmt(Math.abs(paymentSum))}</span>;
                            } else if (paymentSum > 0) {
                              return <span className="text-sm font-black tabular-nums text-emerald-600">Collected: {fmt(paymentSum)}</span>;
                            } else {
                              return <span className="text-sm font-black tabular-nums text-slate-500">₹0</span>;
                            }
                          })()}
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Value</span>
                          <span className="text-sm font-black text-blue-600 tabular-nums">{fmt(exch.replacement_order.total_sellprice)}</span>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          )}

          {/* TAB 2 — Returns & Refunds */}
          {activeTab === 2 && (
            <div className="space-y-4">
              {Array.isArray(sale.returns) && sale.returns.length > 0 ? (
                sale.returns.map((ret: any, rIdx: number) => (
                  <SectionCard key={ret.id || rIdx} title={`Return Request #${ret.id?.slice(0, 8).toUpperCase()}`} className="p-0 overflow-hidden border-rose-100">
                    <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex justify-between items-center text-xs">
                      <span className="font-bold text-rose-700">Refund Status: {ret.status}</span>
                      <div className="flex gap-4">
                        <span className="font-bold text-slate-650">GST Amount: {fmt(ret.total_gst_amount)}</span>
                        <span className="font-bold text-slate-650">Total Refund: {fmt(ret.total_refund_amount)} (Qty: {ret.total_refund_qty})</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Returned Product</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Returned Qty</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Refund Amount</th>
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
                                <td className="px-6 py-4 text-right">
                                  <span className="text-sm font-black text-slate-850 tabular-nums">{fmt(retItem.refund_amount)}</span>
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
                  </SectionCard>
                ))
              ) : (
                <SectionCard title="Processed Returns / Refunds">
                  <div className="p-8 text-center text-slate-400 font-medium text-xs">
                    No returns or refunds have been processed for this order.
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
