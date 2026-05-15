import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft, Package, User, Hash,
  RotateCcw, Calendar, CreditCard, CheckCircle2, Clock,
  XCircle, AlertCircle, Banknote, Smartphone,
  TrendingUp, FileText,
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { OrderResponse } from "@/features/order/types";

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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold text-xs ${c.bg} ${c.color}`}>
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

  useEffect(() => {
    if (sale) return;
    const load = async () => {
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
    load();
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Sticky Header */}
    

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ══════ LEFT COLUMN (8 cols) ══════ */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Hero Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Invoice</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono mb-2">INV-{sale.ui_id}</p>
                  <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} /> {dateStr} {timeStr && `at ${timeStr}`}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{sale.origin}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={sale.status} />
                  {sale.origin === "Sales Return" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold shadow-sm">
                      <RotateCcw size={12} /> Return Order
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between pt-6 border-t border-slate-100 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Grand Total</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 tracking-tight">{fmt(sale.total_sellprice)}</p>
                </div>
                <div className="sm:text-right w-full sm:w-auto bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 mb-2">Payment Details</p>
                  <div className="flex flex-col gap-1.5 sm:items-end">
                    {paymentsDetail.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CreditCard size={14} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-800">{p.label}: {fmt(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-400 mt-2">{sale.total_quantity} item(s)</p>
                </div>
              </div>

              {(refunded > 0 || exchanged > 0) && (
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100">
                  {refunded > 0 && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-100">{refunded} Refunded</span>}
                  {exchanged > 0 && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">{exchanged} Exchanged</span>}
                </div>
              )}
            </div>

            {/* Items Table Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Order Items</h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">{items.length} product(s)</span>
              </div>
              
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_80px_110px_110px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
                    {["Product", "Qty", "Unit Price", "Total"].map((h, i) => (
                      <span key={h} className={`text-xs font-bold text-slate-400 uppercase tracking-wider ${i > 1 ? "text-right" : "text-left"}`}>{h}</span>
                    ))}
                  </div>
                  {/* Table Body */}
                  <div className="divide-y divide-slate-50">
                    {items.map((item) => (
                      <div key={item.id} className="grid grid-cols-[1fr_80px_110px_110px] gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors items-center">
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{ backgroundColor: item.imageColor + "33", borderColor: item.imageColor + "66" }}
                          >
                            <Package size={16} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-slate-400">{item.sku}</span>
                              {item.status && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${item.status === "REFUNDED" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                  {item.status}
                                </span>
                              )}
                            </div>
                            {item.serial_numbers && item.serial_numbers.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                <Hash size={10} className="text-indigo-400" />
                                {item.serial_numbers.map(sn => (
                                  <span key={sn} className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">{sn}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-600">{item.quantity}</span>
                        <span className="text-sm font-medium text-slate-500 font-mono text-right">{fmt(item.unitPrice)}</span>
                        <span className="text-sm font-bold text-slate-800 font-mono text-right">{fmt(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Order Info Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <User size={18} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Customer & Order Info</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Customer</p>
                  <p className="text-sm font-bold text-slate-800">{customerName}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">{sale.customer_id}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Order Date</p>
                  <p className="text-sm font-bold text-slate-800">{dateStr}</p>
                  {timeStr && <p className="text-xs font-medium text-slate-500 mt-0.5">at {timeStr}</p>}
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Origin</p>
                  <p className="text-sm font-bold text-slate-800">{sale.origin}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Payment Methods</p>
                  <div className="flex flex-col gap-1.5">
                    {paymentsDetail.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {p.label.includes("UPI") || p.label.includes("PhonePe") ? <Smartphone size={14} className="text-indigo-500" /> : p.label.includes("Card") ? <CreditCard size={14} className="text-purple-500" /> : <Banknote size={14} className="text-emerald-500" />}
                        <p className="text-sm font-bold text-slate-800">{p.label}: <span className="font-mono">{fmt(p.amount)}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════ RIGHT COLUMN (4 cols) ══════ */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Financial Breakdown */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <TrendingUp size={18} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Financial Summary</h3>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-500">Subtotal ({sale.total_quantity} items)</span>
                  <span className="text-sm font-semibold text-slate-800 font-mono">{fmt(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-500">Discount</span>
                    <span className="text-sm font-semibold text-red-500 font-mono">-{fmt(totalDiscount)}</span>
                  </div>
                )}
                {totalTax > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-500">Tax</span>
                    <span className="text-sm font-semibold text-slate-800 font-mono">+{fmt(totalTax)}</span>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t-2 border-slate-100 border-dashed flex justify-between items-center">
                  <span className="text-base font-extrabold text-slate-900">Grand Total</span>
                  <span className="text-xl font-extrabold text-blue-600 font-mono">{fmt(sale.total_sellprice)}</span>
                </div>
              </div>
            </div>

            {/* Order Status Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <FileText size={18} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Status Overview</h3>
              </div>
              <div className="p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Current Status</span>
                  <StatusBadge status={sale.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Total Items Qty</span>
                  <span className="text-sm font-bold text-slate-800">{sale.total_quantity}</span>
                </div>
                {refunded > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Refunded Items</span>
                    <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{refunded}</span>
                  </div>
                )}
                {exchanged > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Exchanged Items</span>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{exchanged}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Actions</h3>
              </div>
              <div className="p-6 flex flex-col gap-3">
                <button
                  disabled={!canReturn}
                  onClick={() => navigate("/sales", { state: { openReturn: sale } })}
                  title={!canReturn ? (sale.origin === "Sales Return" ? "Already a return order" : `Cannot return: ${sale.status}`) : "Process a return for this order"}
                  className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                    canReturn 
                      ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 hover:border-red-200 shadow-sm" 
                      : "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-70"
                  }`}
                >
                  <RotateCcw size={16} />
                  {sale.origin === "Sales Return" ? "Return Order" : canReturn ? "Process Return" : `Return Unavailable (${sale.status})`}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailPage;