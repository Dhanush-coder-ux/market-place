import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft, Package, User,
  RotateCcw, Calendar, CreditCard, CheckCircle2, Clock,
  XCircle, AlertCircle, Banknote, Smartphone,
  TrendingUp,
  Database,
  Search
} from "lucide-react";
import { StatCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { ReturnModal } from "../components/ReturnOrderFlow";
import { DetailItem, InfoRow, ProfileHeaderCard, SectionCard } from "@/components/common/SuperUI";
import { OrderResponse } from "@/features/order/types";

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
};

const generateItems = (sale: OrderResponse, productMap: Record<string, string> = {}): SaleItem[] =>
  (sale?.items || []).map((i: any) => ({
    id: i.id,
    name: i.name || i.product_name || i.datas?.product_name || i.datas?.name || productMap[i.inventory_id] || "Unknown Item",
    sku: i.barcode?.trim() || i.inventory_id?.slice(-6) || "N/A",
    quantity: i.quantity || 0,
    returnedQty: i.returned_quantity || 0,
    unitPrice: i.sell_price || 0,
    buyPrice: i.buy_price || 0,
    status: i.status || "COMPLETED",
    reason: i.reason,
    serial_numbers: Array.isArray(i.serialno_infos) ? i.serialno_infos.map((sn: any) => sn.name || sn) : (i.serialno_info?.serial_numbers || i.serial_info?.serial_numbers || i.serial_numbers || []),
    unit: i.product?.unit || i.unit || i.datas?.unit || "UNIT",
    variantName: i.variant_infos?.variant_name || i.variant_info?.variant_name || i.variant?.variant_name,
    batchName: i.batch_infos?.batch_name || i.batch_infos?.name || i.batch_info?.batch_name || i.batch?.batch_name,
    mfgDate: i.batch_infos?.mfg_date || i.batch_infos?.manufacturing_date || i.batch_info?.mfg_date || i.batch?.mfg_date,
    expDate: i.batch_infos?.exp_date || i.batch_infos?.expiry_date || i.batch_info?.exp_date || i.batch?.exp_date,
    gst: i.gst || i.datas?.gst,
  }));

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    Completed: { bg: "bg-emerald-50 border-emerald-100", color: "text-emerald-700", icon: <CheckCircle2 size={14} /> },
    Pending: { bg: "bg-amber-50 border-amber-100", color: "text-amber-700", icon: <Clock size={14} /> },
    Cancelled: { bg: "bg-red-50 border-red-100", color: "text-red-700", icon: <XCircle size={14} /> },
  };
  const c = cfg[status] || cfg["Pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold text-[10px] uppercase tracking-wider ${c.bg} ${c.color}`}>
      {c.icon}{status}
    </span>
  );
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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    try {
      const res = await api.deleteData(`${ENDPOINTS.ORDERS}/${SHOP_ID}/${id}`);
      if (res) {
        navigate("/sales");
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center justify-end w-full animate-in fade-in slide-in-from-right-4 duration-300 gap-2">
        <button 
          type="button"
          onClick={handleDelete}
          className="px-6 h-8 rounded-lg border border-red-200 bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 hover:border-red-300 transition-all flex items-center shadow-sm"
        >
          Delete Order
        </button>
        <button 
          type="button"
          onClick={() => navigate("/sales/detail")}
          className="px-6 h-8 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center shadow-sm"
        >
          Clear
        </button>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, navigate, id, api]);

  useEffect(() => {
    if (!sale || !sale.items) fetchSaleDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="text-center flex flex-col items-center">
        <div className="w-11 h-11 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium">Loading sale details…</p>
      </div>
    </div>
  );

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
  const customerName = sale.customer?.customer_name || customerMap[sale.customer_id] || "Walk-in Customer";
  const customerMobile = sale.customer?.customer_mobile_number || "";
  const dateStr = sale.created_at?.split("T")[0] || "N/A";
  const timeStr = sale.created_at?.includes("T") ? sale.created_at.split("T")[1]?.slice(0, 5) || "" : "";
  const refunded = items.filter(i => i.status === "REFUNDED").length;
  const exchanged = items.filter(i => i.status === "EXCHANGED").length;

  const paymentsDetail = sale.payments && Object.keys(sale.payments).length > 0
    ? Object.entries(sale.payments).map(([k, v]) => {
      const u = k.toUpperCase();
      const label = u === "CASH" ? "Cash" : u === "CARD" ? "Card" : (u === "UPI" || u === "G-PAY" || u === "GPAY") ? "UPI" : u === "PHONEPE" ? "PhonePe" : u === "CREDIT" || u === "ON_CREDIT" ? "Credit" : k;
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
          subText={`ID: ${sale.id}`}
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
          {["Overview", "Items", "Customer & Payments"].map((tab, i) => (
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
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-2">
                <StatCard
                  icon={Banknote}
                  label="Grand Total"
                  value={fmt(sale.total_sellprice)}
                  iconBg="bg-blue-50 text-blue-600"
                  className="flex-1 min-w-[140px]"
                />
                <StatCard
                  icon={Package}
                  label="Total Items"
                  value={String(Number((sale.total_quantity || 0).toFixed(2)))}
                  iconBg="bg-indigo-50 text-indigo-600"
                  className="flex-1 min-w-[140px]"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Status"
                  value={sale.status}
                  iconBg="bg-emerald-50 text-emerald-600"
                  className="flex-1 min-w-[140px]"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Financial Summary */}
                <div className="lg:col-span-8">
                  <SectionCard title="Financial Summary">
                    <div className="space-y-1">
                      <InfoRow label="Subtotal" value={fmt(subtotal)} />
                      <div className="mt-4 pt-4 border-t-2 border-slate-100 border-dashed flex justify-between items-center">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Grand Total</span>
                        <span className="text-xl font-black text-blue-600 tabular-nums">{fmt(sale.total_sellprice)}</span>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* Status & Actions */}
                <div className="lg:col-span-4 space-y-4">
                  <SectionCard title="Status Overview">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Status</span>
                        <StatusBadge status={sale.status} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Origin</span>
                        <span className="text-xs font-bold text-slate-700">{sale.origin}</span>
                      </div>
                      {refunded > 0 && <InfoRow label="Refunded Items" value={<span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md text-[10px] font-black">{refunded}</span>} />}
                      {exchanged > 0 && <InfoRow label="Exchanged Items" value={<span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[10px] font-black">{exchanged}</span>} />}
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
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-slate-700 bg-slate-100 border border-slate-200">
                              <Package size={16} className="text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] font-mono font-bold text-slate-400">{item.sku}</span>
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
                                <div className="mt-2 pl-3 border-l-2 border-indigo-100 space-y-2.5">
                                  <p className="text-[10px] font-extrabold text-indigo-750 bg-indigo-50/50 px-1.5 py-0.5 rounded w-fit">• {item.variantName}</p>
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
                                      {item.serial_numbers.map((sn: string, idx: number) => (
                                        <span key={idx} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{sn}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-black text-slate-600">{Number((item.quantity || 0).toFixed(2))}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100">{item.unit}</span>
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
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-blue-50 border-blue-100">
                                  <Package size={16} className="text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-[10px] font-mono font-bold text-slate-400">{item.sku}</span>
                                    {item.gst && (
                                      <span className="text-[9px] font-extrabold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wider font-sans">
                                        GST {item.gst}
                                      </span>
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
                                    <div className="mt-2 pl-3 border-l-2 border-indigo-100 space-y-2.5">
                                      <p className="text-[10px] font-extrabold text-indigo-750 bg-indigo-50/50 px-1.5 py-0.5 rounded w-fit">• {item.variantName}</p>
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
                                          {item.serial_numbers.map((sn: string, idx: number) => (
                                            <span key={idx} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{sn}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xs font-black text-slate-600">{Number((item.quantity || 0).toFixed(2))}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-[10px] font-black text-blue-500 uppercase px-2 py-0.5 rounded bg-blue-50 border border-blue-100">{item.unit}</span>
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
            {Array.isArray(sale.returns) && sale.returns.length > 0 && (
              <div className="space-y-4 mt-4">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Processed Returns / Refunds</h3>
                {sale.returns.map((ret: any, rIdx: number) => (
                  <SectionCard key={ret.id || rIdx} title={`Return Request #${ret.id?.slice(0, 8).toUpperCase()}`} className="p-0 overflow-hidden border-rose-100">
                    <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex justify-between items-center text-xs">
                      <span className="font-bold text-rose-700">Refund Status: {ret.status}</span>
                      <span className="font-bold text-slate-650">Total Refund: {fmt(ret.total_refund_amount)} (Qty: {ret.total_refund_qty})</span>
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
                            return (
                              <tr key={retItem.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-slate-700 bg-rose-50 border border-rose-100 shrink-0">
                                      <Package size={16} className="text-rose-500" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-800 truncate">{retItem.name}</p>
                                      <span className="text-[10px] font-mono font-bold text-slate-400 block mt-0.5">{retItem.ui_id}</span>
                                      {variantN && (
                                        <p className="text-[10px] font-extrabold text-indigo-750 bg-indigo-50/50 px-1.5 py-0.5 rounded w-fit mt-1">{variantN}</p>
                                      )}
                                      {batchN && (
                                        <p className="text-[10px] font-extrabold text-amber-700 bg-amber-50/50 px-1.5 py-0.5 rounded w-fit mt-1">Batch: {batchN}</p>
                                      )}
                                      {serialsList.length > 0 && (
                                        <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
                                          <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Returned Serials:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {serialsList.map((sn: string, idx: number) => (
                                              <span key={idx} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-rose-600 border border-slate-200 shadow-sm">{sn}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-xs font-black text-rose-600">{retItem.quantity}</span>
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
                ))}
              </div>
            )}
          </div>
          )}

          {/* TAB 2 — Customer & Payments */}
          {activeTab === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Customer Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <DetailItem icon={User} label="Customer Name" value={customerName} />
                  {customerMobile && <DetailItem icon={Smartphone} label="Customer Mobile" value={customerMobile} />}
                  <DetailItem icon={Database} label="Customer ID" value={sale.customer_id} />
                  <DetailItem icon={Calendar} label="Order Date" value={dateStr} />
                  <DetailItem icon={Clock} label="Order Time" value={timeStr || "—"} />
                  <DetailItem icon={Search} label="Origin" value={sale.origin} />
                </div>
              </SectionCard>

              <div className="space-y-4">
                <SectionCard title="Payment Status">
                  {outstanding > 0 ? (
                    totalPaid === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 bg-rose-50/50 border border-rose-100 rounded-xl">
                        <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center mb-4 shadow-sm shadow-rose-200 ring-2 ring-white">
                          <Clock size={28} />
                        </div>
                        <span className="text-xl font-black tracking-tight text-rose-700">Unpaid</span>
                        <p className="text-xs font-bold text-rose-600 mt-2">Outstanding: {fmt(outstanding)}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-amber-50/50 border border-amber-100 rounded-xl">
                        <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center mb-4 shadow-sm shadow-amber-200 ring-2 ring-white">
                          <TrendingUp size={28} />
                        </div>
                        <span className="text-xl font-black tracking-tight text-amber-700">Partially Paid</span>
                        <div className="text-center mt-3 space-y-1">
                          <p className="text-[11px] font-semibold text-slate-500">Paid: {fmt(totalPaid)}</p>
                          <p className="text-xs font-bold text-amber-600">Outstanding: {fmt(outstanding)}</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                      <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-sm shadow-emerald-200 ring-2 ring-white">
                        <CheckCircle2 size={28} />
                      </div>
                      <span className="text-xl font-black tracking-tight text-emerald-700">Paid</span>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Completed</p>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Payment Breakdown">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentsDetail.map((p, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {p.label.includes("UPI") || p.label.includes("PhonePe") ? <Smartphone size={16} className="text-indigo-500" /> : p.label.includes("Card") ? <CreditCard size={16} className="text-purple-500" /> : <Banknote size={16} className="text-emerald-500" />}
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{p.label}</p>
                        </div>
                        <p className="text-lg font-black text-slate-800 tabular-nums">{fmt(p.amount)}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
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