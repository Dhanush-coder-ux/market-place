import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft, Package, User, Hash,
  RotateCcw, Calendar, CreditCard, CheckCircle2, Clock,
  XCircle, AlertCircle, Banknote, Smartphone,
  TrendingUp, Tag, 
  Database,
  Search
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { OrderResponse } from "@/features/order/types";
import { ProfileHeaderCard, SectionCard, DetailItem, InfoRow } from "@/components/common/SuperUI";
import { StatCard } from "@/components/common/StatsCard";
import { ReturnFlow } from "../components/ReturnOrderFlow";

/* ── helpers ── */
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const ITEM_COLORS = ["#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3", "#ede9fe", "#ffedd5", "#f0fdf4", "#ecfeff"];

type SaleItem = {
  id: string; name: string; sku: string; quantity: number;
  unitPrice: number; buyPrice: number; imageColor: string;
  status?: string; serial_numbers?: string[];
};

const generateItems = (sale: OrderResponse, productMap: Record<string, string> = {}): SaleItem[] =>
  (sale.items || []).map((item, i) => {
    const base = productMap[item.inventory_id] || item.barcode || `Item ${i + 1}`;
    return {
      id: item.id,
      name: item.status === "REFUNDED" ? `(Refunded) ${base}` : item.status === "EXCHANGED" ? `(Exchanged) ${base}` : base,
      sku: item.barcode?.trim() || item.inventory_id.slice(-6),
      quantity: item.quantity, unitPrice: item.sell_price, buyPrice: item.buy_price,
      imageColor: ITEM_COLORS[i % ITEM_COLORS.length],
      status: item.status, serial_numbers: item.serial_numbers || [],
    } as any;
  });

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

  const [sale, setSale] = useState<OrderResponse | null>(location.state?.sale || null);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>(location.state?.customerMap || {});
  const [productMap, setProductMap] = useState<Record<string, string>>(location.state?.productMap || {});
  const [loading, setLoading] = useState(!sale);
  const [activeTab, setActiveTab] = useState(0);

  const fetchSaleDetail = async () => {
    try {
      setLoading(true);
      const [ordRes, custRes, invRes] = await Promise.all([
        api.getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`),
        api.getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`),
        api.getData(ENDPOINTS.INVENTORIES),
      ]);
      if (ordRes?.data) {
        const found = (ordRes.data as any[]).find(o => o.id === id);
        if (found) setSale({ ...found, status: found.status.charAt(0).toUpperCase() + found.status.slice(1).toLowerCase(), origin: found.origin === "OFFLINE" ? "Sales" : found.origin });
      }
      if (custRes?.data) { const m: Record<string, string> = {}; custRes.data.forEach((c: any) => m[c.id] = c.name); setCustomerMap(m); }
      if (invRes?.data) { const m: Record<string, string> = {}; invRes.data.forEach((p: any) => m[p.id] = p.name); setProductMap(m); }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!sale) fetchSaleDetail();
  }, [id, api, sale]);

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
  const totalTax = (sale as any).total_tax || 0;
  const totalDiscount = (sale as any).total_discount || 0;
  const canReturn = sale.status === "Completed" && sale.origin !== "Sales Return";
  const customerName = customerMap[sale.customer_id] || "Walk-in Customer";
  const dateStr = sale.created_at.split("T")[0];
  const timeStr = sale.created_at.split("T")[1]?.slice(0, 5) || "";
  const refunded = items.filter(i => i.status === "REFUNDED").length;
  const exchanged = items.filter(i => i.status === "EXCHANGED").length;

  const paymentsDetail = sale.payments && Object.keys(sale.payments).length > 0
    ? Object.entries(sale.payments).map(([k, v]) => {
      const u = k.toUpperCase();
      const label = u === "CASH" ? "Cash" : u === "CARD" ? "Card" : (u === "UPI" || u === "G-PAY" || u === "GPAY") ? "UPI" : u === "PHONEPE" ? "PhonePe" : u === "CREDIT" ? "Credit" : k;
      return { label, amount: v as number };
    })
    : [{ label: sale.payment_method || "Other", amount: sale.total_sellprice }];

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 pb-12">
      <div className="max-w-full mx-auto px-4 md:px-10 py-3 space-y-4">
        
        {/* Profile Header Card */}
        <ProfileHeaderCard
          name={`Invoice INV-${sale.ui_id}`}
          initials="INV"
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
            <button
              onClick={() => navigate("/sales")}
              className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
              title="Back to Sales"
            >
              <ArrowLeft size={14} />
            </button>
          }
        />

        {/* Tabs Navigation */}
        <div className="flex gap-2 p-1 bg-slate-100/50 w-fit rounded-lg border border-slate-200/50">
          {["Overview", "Items", "Customer & Payments", "Return"].map((tab, i) => (
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

        {/* Tab Panels */}
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
                  value={String(sale.total_quantity)}
                  iconBg="bg-indigo-50 text-indigo-600"
                  className="flex-1 min-w-[140px]"
                />
                <StatCard
                  icon={Tag}
                  label="Discount"
                  value={fmt(totalDiscount)}
                  iconBg="bg-rose-50 text-rose-600"
                  valueClassName="text-rose-600"
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
                      {totalDiscount > 0 && <InfoRow label="Discount" value={<span className="text-red-500">-{fmt(totalDiscount)}</span>} />}
                      {totalTax > 0 && <InfoRow label="Tax" value={<span className="text-slate-700">+{fmt(totalTax)}</span>} />}
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

                  <SectionCard title="Actions">
                    <button
                      disabled={!canReturn}
                      onClick={() => setActiveTab(3)}
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[11px] font-black transition-all shadow-sm ${canReturn
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 hover:border-red-200 shadow-red-50 active:scale-[0.98]"
                          : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed opacity-70"
                        }`}
                    >
                      <RotateCcw size={14} />
                      {sale.origin === "Sales Return" ? "RETURN ORDER" : canReturn ? "PROCESS RETURN" : `RETURN UNAVAILABLE`}
                    </button>
                  </SectionCard>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1 — Items */}
          {activeTab === 1 && (
            <SectionCard title="Order Items" className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Product Details</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Qty</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Unit Price</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                              style={{ backgroundColor: item.imageColor + "33", borderColor: item.imageColor + "66" }}
                            >
                              <Package size={16} className="text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono font-bold text-slate-400">{item.sku}</span>
                                {item.status && (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${item.status === "REFUNDED" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                    {item.status}
                                  </span>
                                )}
                              </div>
                              {item.serial_numbers && item.serial_numbers.length > 0 && (
                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                  <Hash size={10} className="text-indigo-400" />
                                  {item.serial_numbers.map(sn => (
                                    <span key={sn} className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">{sn}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-black text-slate-600">{item.quantity}</span>
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
          )}

          {/* TAB 2 — Customer & Payments */}
          {activeTab === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Customer Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <DetailItem icon={User} label="Customer Name" value={customerName} />
                  <DetailItem icon={Database} label="Customer ID" value={sale.customer_id} />
                  <DetailItem icon={Calendar} label="Order Date" value={dateStr} />
                  <DetailItem icon={Clock} label="Order Time" value={timeStr || "—"} />
                  <DetailItem icon={Search} label="Origin" value={sale.origin} />
                </div>
              </SectionCard>

              <SectionCard title="Payment Breakdown">
                <div className="space-y-4">
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
                </div>
              </SectionCard>
            </div>
          )}

          {/* TAB 3 — Return */}
          {activeTab === 3 && sale && (
            <div className="mx-auto bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
              <ReturnFlow 
                sale={sale} 
                onClose={() => setActiveTab(0)} 
                onRefresh={fetchSaleDetail} 
                productMap={productMap} 
                isInline={true}
              />
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default SaleDetailPage;