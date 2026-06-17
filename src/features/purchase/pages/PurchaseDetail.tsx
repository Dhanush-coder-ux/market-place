import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Printer, Building2, Calendar, Package, TrendingUp,
  ReceiptText, ArrowLeft, User, FileText, CheckCircle2, Clock, Banknote, AlertCircle
} from "lucide-react";
import { toDisplayData } from "./PurchaseHistory";
import type { DirectPurchaseData } from "./PurchaseHistory";
import { ProfileHeaderCard, SectionCard, DetailItem, InfoRow } from "@/components/common/SuperUI";
import { StatCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const formatBatchDate = (dateStr?: string) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const PurchaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getData } = useApi();
  const { setBottomActions } = useHeader();

  // Retrieve po from state or use state fetched from API
  const [po, setPo] = useState<DirectPurchaseData | undefined>(location.state?.po);
  const [loading, setLoading] = useState(!po);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center justify-end w-full animate-in fade-in slide-in-from-right-4 duration-300 gap-2">
        {po && po.purchaseType === 'Purchase' && po.status !== 'cancelled' && (
          <button 
            type="button"
            onClick={() => navigate(`/purchase/edit/${po.id}`)}
            className="px-6 h-8 rounded-lg border border-blue-600 bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all flex items-center shadow-sm"
          >
            Edit Purchase
          </button>
        )}
        <button 
          type="button"
          onClick={() => navigate("/purchase/detail")}
          className="px-6 h-8 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center shadow-sm"
        >
          Clear
        </button>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, navigate, po]);

  useEffect(() => {
    if (!po && id) {
      const fetchPo = async () => {
        setLoading(true);
        try {
          // First try the purchases endpoint (direct purchase ID with shop scope)
          const res = await getData(`${ENDPOINTS.PURCHASES}/by/${SHOP_ID}/${id}`);
          let data = res?.data ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
          if (!data && res && res.id) {
            data = res;
          }
          if (data) {
            setPo(toDisplayData(data));
            return;
          }
          // Fallback: try the stock adjustments endpoint by shop list (used when navigating from Stock Movements tab)
          // Since GET /inventories/s-adjustments/:id throws 405 Method Not Allowed, we fetch by shop list and find the record
          const adjRes = await getData(`${ENDPOINTS.S_ADJUSTMENTS}/by/shop/${SHOP_ID}`, { view: "STOCKADJUSTMENT_VIEW", shop_id: SHOP_ID, limit: "100" });
          let adjList: any[] = [];
          if (Array.isArray(adjRes)) adjList = adjRes;
          else if (Array.isArray(adjRes?.data)) adjList = adjRes.data;
          else if (Array.isArray(adjRes?.data?.datas)) adjList = adjRes.data.datas;
          else if (Array.isArray(adjRes?.datas)) adjList = adjRes.datas;
          const adjData = adjList.find((a: any) => a.id === id);
          if (adjData) {
            setPo(toDisplayData(adjData));
          }
        } catch (err: any) {
          console.error("Failed to fetch purchase:", err);
          setErrorMsg(err.message || String(err));
        } finally {
          setLoading(false);
        }
      };
      fetchPo();
    }
  }, [id, po, getData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <ReceiptText size={48} className="mb-4 text-slate-300 animate-pulse" />
        <p className="text-sm font-semibold text-slate-500">Loading purchase details...</p>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-6 text-center">
        <ReceiptText size={48} className="mb-4 text-slate-300" />
        <p className="text-lg font-bold text-slate-800">Purchase details not found</p>
        {errorMsg && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-md p-3 max-w-md my-3 font-mono break-all">
            Error: {errorMsg}
          </p>
        )}
        <button
          onClick={() => navigate("/purchase-history")}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} /> Back to History
        </button>
      </div>
    );
  }

  const totalQty = po.products.reduce((s, i) => s + i.quantity, 0);
  const subtotal = po.products.reduce(
  (sum, item) => sum + (item.buy_price || 0) * (item.quantity || 0),
  0
);

const totalGst = po.products.reduce((sum, item) => {
  let gst = 0;

  if (typeof item.gst === "string") {
    gst = parseFloat(item.gst.replace("%", ""));
  } else {
    gst = Number(item.gst ?? 0);
  }

  return sum + ((item.buy_price || 0) * (item.quantity || 0) * gst) / 100;
}, 0);

const transportCharge = po.charges?.transport || 0;
const otherCharge = po.charges?.other || 0;

const grandTotal =
  subtotal +
  totalGst +
  transportCharge +
  otherCharge;

const outstanding =
  grandTotal - (po.paid_amount || 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans text-slate-900 overflow-hidden relative">

      {/* Profile Header Card */}
      <div className="flex-none p-1 pb-0">
        <ProfileHeaderCard
          name={`Purchase · ${po.systemId}`}
          initials="PO"
          subText={po.systemId && po.systemId !== po.poNumber ? `Invoice No: ${po.poNumber} • ID: ${po.id}` : `ID: ${po.id}`}
          badges={[
            { text: po.purchaseType, variant: "primary" },
            po.outstanding && po.outstanding > 0
              ? (po.paid_amount === 0
                ? { text: "Unpaid", variant: "danger" }
                : { text: "Partially Paid", variant: "warning" })
              : { text: "Paid", variant: "success" }
          ]}
          infoItems={[
            { icon: Calendar, text: `${po.date} at ${po.time}` },
            { icon: Building2, text: typeof po.vendor === 'object' ? (po.vendor as any).supplier_name || (po.vendor as any).name || "—" : po.vendor },
            { icon: Banknote, text: `Paid: ${fmt(po.paid_amount || 0)}` },
            { icon: AlertCircle, text: `Due: ${fmt(po.outstanding || 0)}` }
          ]}
          actions={
            <div className="flex items-center gap-2">
              <button
                className="h-8 px-3 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                title="Print"
              >
                <Printer size={13} /> Print
              </button>
              <button
                onClick={() => navigate("/purchase-history")}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-650 rounded-lg hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
                title="Back to History"
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
          {["Overview", "Items", "Vendor & Payments"].map((tab, i) => (
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
                  label="Total Cost"
                  value={fmt(grandTotal)}
                  iconBg="bg-blue-50 text-blue-600"
                  className="flex-1 min-w-[140px]"
                />
                <StatCard
                  icon={Package}
                  label="Total Items"
                  value={`${totalQty} Units`}
                  iconBg="bg-indigo-50 text-indigo-600"
                  className="flex-1 min-w-[140px]"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Status"
                  value="Completed"
                  iconBg="bg-emerald-50 text-emerald-600"
                  className="flex-1 min-w-[140px]"
                />
                <StatCard
                  icon={AlertCircle}
                  label="Outstanding"
                  value={fmt(outstanding)}
                  iconBg={po.outstanding && po.outstanding > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}
                  className="flex-1 min-w-[140px]"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Financial Summary */}
                <div className="lg:col-span-8">
                  <SectionCard title="Financial Summary">
                    <div className="space-y-1">
                      <InfoRow
                        label="Subtotal"
                        value={fmt(subtotal)}
                      />

                      <InfoRow
                        label="GST"
                        value={
                          <span className="text-indigo-600 font-semibold">
                            +{fmt(totalGst)}
                          </span>
                        }
                      />

                      <InfoRow
                        label="Transport Charges"
                        value={
                          <span className="text-slate-600">
                            +{fmt(transportCharge)}
                          </span>
                        }
                      />

                      <InfoRow
                        label="Other Charges"
                        value={
                          <span className="text-slate-600">
                            +{fmt(otherCharge)}
                          </span>
                        }
                      />

                      <div className="mt-4 pt-4 border-t-2 border-slate-800 flex justify-between">
                        <span className="font-black">
                          Grand Total
                        </span>

                        <span className="text-xl font-black text-slate-900">
                          {fmt(grandTotal)}
                        </span>
                      </div>

                      {(transportCharge > 0 || otherCharge > 0) && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Additional Charges</p>
                          {transportCharge > 0 && <InfoRow label="Transport Charges" value={<span className="text-slate-600">+{fmt(transportCharge)}</span>} />}
                          {otherCharge > 0 && <InfoRow label="Other Charges" value={<span className="text-slate-600">+{fmt(otherCharge)}</span>} />}
                          <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Additional</span>
                            <span className="text-sm font-black text-slate-700 tabular-nums">+{fmt(po.additional_charges_total || 0)}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  </SectionCard>
                </div>

                {/* Status & Actions */}
                <div className="lg:col-span-4 space-y-4">
                  <SectionCard title="Purchase Info">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Invoice No</span>
                        <span className="text-xs font-bold text-slate-700">{po.poNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Total Items</span>
                        <span className="text-xs font-bold text-slate-700">{po.totoalItems}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Origin</span>
                        <span className="text-xs font-bold text-slate-700">{po.purchaseType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Payment</span>
                        <span className="text-xs font-bold text-slate-700">{po.paymentMethod || "—"}</span>
                      </div>
                      {po.storage_location && (
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-100/50">
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Storage Location</span>
                          <span className="text-xs font-bold text-slate-700 uppercase">{po.storage_location}</span>
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard title="Payment Summary">
                    <div className="space-y-3">
                      {po.paid_amount !== undefined && (
                        <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                          <span>Paid Amount</span>
                          <span className="tabular-nums text-slate-800">{fmt(po.paid_amount)}</span>
                        </div>
                      )}
                      {po.outstanding !== undefined && (
                        <div className="flex justify-between items-center text-sm font-bold pt-3 border-t border-slate-100">
                          <span className="text-slate-600">Outstanding</span>
                          <span className={`tabular-nums ${po.outstanding > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                            {fmt(outstanding)}
                          </span>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1 — Items */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <SectionCard title="Products Received" className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Product Details</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Qty</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Stock In/Out</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Stock After</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Unit Price</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {po.products.map((product, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-indigo-50 border-indigo-100">
                                <Package size={16} className="text-indigo-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{product.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {product.barcode && (
                                    <span className="text-[10px] font-mono font-bold text-slate-400">{product.barcode}</span>
                                  )}
                                  {product.gst !== undefined && product.gst > 0 && (
                                    <span className="text-[9px] font-extrabold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wider font-sans">
                                      GST {product.gst}%
                                    </span>
                                  )}
                                  {product.category && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-slate-100 text-slate-500">
                                      {product.category}
                                    </span>
                                  )}
                                </div>

                                {/* Flat Format (PurchaseReadModel) Batches & Serials */}
                                {product.variant && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-100 space-y-2.5">
                                    <p className="text-[10px] font-extrabold text-indigo-750 bg-indigo-50/50 px-1.5 py-0.5 rounded w-fit">• {product.variant.variant_name}</p>
                                  </div>
                                )}
                                
                                {product.batch && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md text-[10px] text-slate-650 shadow-sm">
                                      <div className="flex justify-between items-center font-bold">
                                        <span className="text-slate-800">Batch: {product.batch.batch_name || "Default"}</span>
                                        <span className="text-indigo-600">Qty: {product.stocks_added ?? product.received_stocks ?? 0}</span>
                                      </div>
                                      {(product.batch.mfg_date || product.batch.exp_date) && (
                                        <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                                          {product.batch.mfg_date && <span>MFG: {formatBatchDate(product.batch.mfg_date)}</span>}
                                          {product.batch.exp_date && <span>EXP: {formatBatchDate(product.batch.exp_date)}</span>}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {product.serial_info && product.serial_info.serial_numbers && product.serial_info.serial_numbers.length > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
                                      <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serial Numbers:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {product.serial_info.serial_numbers.map((sn: string) => (
                                          <span key={sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{sn}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Old Nested Format Variant-Level Batches & Serials */}
                                {(product.variants?.length ?? 0) > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-100 space-y-2.5">
                                    {product.variants?.map((v, vIdx) => (
                                      <div key={vIdx} className="space-y-1">
                                        <p className="text-[10px] font-extrabold text-indigo-750 bg-indigo-50/50 px-1.5 py-0.5 rounded w-fit">• {v.name} {v.buy_price !== undefined ? `(Buy: ${fmt(v.buy_price)})` : ""}</p>

                                        {/* Variant Batches */}
                                        {v.batches && v.batches.length > 0 && (
                                          <div className="space-y-1 pl-2">
                                            {v.batches.map((b, bIdx) => (
                                              <div key={bIdx} className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md text-[10px] text-slate-600 shadow-sm">
                                                <div className="flex justify-between items-center font-bold">
                                                  <span className="text-slate-800">Batch: {b.name || "Default"}</span>
                                                  <span className="text-indigo-600">Qty: {b.stocks}</span>
                                                </div>
                                                {(b.manufacturing_date || b.expiry_date) && (
                                                  <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                                                    {b.manufacturing_date && <span>MFG: {formatBatchDate(b.manufacturing_date)}</span>}
                                                    {b.expiry_date && <span>EXP: {formatBatchDate(b.expiry_date)}</span>}
                                                  </div>
                                                )}
                                                {b.serial_numbers && b.serial_numbers.length > 0 && (
                                                  <div className="mt-1.5">
                                                    <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serials:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                      {b.serial_numbers.map(sn => (
                                                        <span key={sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{sn}</span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Variant-level Serials (if no batches) */}
                                        {(!v.batches || v.batches.length === 0) && v.serials && v.serials.length > 0 && (
                                          <div className="pl-2 space-y-1">
                                            {v.serials.map((sObj, sIdx) => (
                                              <div key={sIdx} className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
                                                <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serial Numbers:</p>
                                                <div className="flex flex-wrap gap-1">
                                                  {sObj.serial_numbers?.map(sn => (
                                                    <span key={sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{sn}</span>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Top-Level (No Variant) Batches */}
                                {(!product.variants || product.variants.length === 0) && product.batches && product.batches.length > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                    {product.batches.map((b, bIdx) => (
                                      <div key={bIdx} className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md text-[10px] text-slate-650 shadow-sm">
                                        <div className="flex justify-between items-center font-bold">
                                          <span className="text-slate-800">Batch: {b.name || "Default"}</span>
                                          <span className="text-indigo-600">Qty: {b.stocks}</span>
                                        </div>
                                        {(b.manufacturing_date || b.expiry_date) && (
                                          <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                                            {b.manufacturing_date && <span>MFG: {formatBatchDate(b.manufacturing_date)}</span>}
                                            {b.expiry_date && <span>EXP: {formatBatchDate(b.expiry_date)}</span>}
                                          </div>
                                        )}
                                        {b.serial_numbers && b.serial_numbers.length > 0 && (
                                          <div className="mt-1.5">
                                            <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serials:</p>
                                            <div className="flex flex-wrap gap-1">
                                              {b.serial_numbers.map(sn => (
                                                <span key={sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{sn}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Top-Level (No Variant) Serials */}
                                {(!product.variants || product.variants.length === 0) && product.serials && product.serials.length > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                    {product.serials.map((sObj, sIdx) => (
                                      <div key={sIdx} className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
                                        <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serial Numbers:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {sObj.serial_numbers?.map(sn => (
                                            <span key={sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{sn}</span>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-black text-slate-600">{product.quantity}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-xs font-bold text-green-600">
                              +{product.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-xs font-black text-blue-600">
                              {product.stocks_before !== undefined && product.stocks_before !== null ? (product.stocks_before + product.quantity) : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {product.buy_price !== undefined ? (
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-slate-800 tabular-nums">{fmt(product.buy_price)}</span>
                                {product.gst !== undefined && product.gst > 0 && (
                                  <span className="text-[9px] text-indigo-600 font-semibold mt-0.5 whitespace-nowrap">
                                    ₹{(product.buy_price * (1 + product.gst / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} incl. {product.gst}% GST
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {product.buy_price !== undefined ? (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-slate-800 tabular-nums">{fmt(product.buy_price * product.quantity)}</span>
                                {product.gst !== undefined && product.gst > 0 && (
                                  <span className="text-[9px] text-indigo-600 font-semibold mt-0.5 whitespace-nowrap">
                                    ₹{((product.buy_price * product.quantity) * (1 + product.gst / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} incl. GST
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {/* TAB 2 — Vendor & Payments */}
          {activeTab === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Vendor Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <DetailItem icon={Building2} label="Vendor Name" value={po.vendor} />
                  <DetailItem icon={FileText} label="Purchase Invoice" value={po.poNumber} />
                  {po.systemId && po.systemId !== po.poNumber && (
                    <DetailItem icon={FileText} label="System ID" value={po.systemId} />
                  )}
                  <DetailItem icon={Calendar} label="Date" value={po.date} />
                  <DetailItem icon={Clock} label="Time" value={po.time} />
                  <DetailItem icon={User} label="Purchase Type" value={po.purchaseType} />
                  {po.storage_location && (
                    <DetailItem icon={Building2} label="Storage Location" value={po.storage_location} />
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Payment Status">
                {outstanding && outstanding > 0 ? (
                  po.paid_amount === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-rose-50/50 border border-rose-100 rounded-xl h-full min-h-[160px]">
                      <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center mb-4 shadow-sm shadow-rose-200 ring-2 ring-white">
                        <Clock size={28} />
                      </div>
                      <span className="text-xl font-black tracking-tight text-rose-700">Unpaid</span>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{po.paymentMethod || "Pending"}</p>
                      <p className="text-xs font-bold text-rose-600 mt-1">Outstanding: {fmt(outstanding)}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-amber-50/50 border border-amber-100 rounded-xl h-full min-h-[160px]">
                      <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center mb-4 shadow-sm shadow-amber-200 ring-2 ring-white">
                        <TrendingUp size={28} />
                      </div>
                      <span className="text-xl font-black tracking-tight text-amber-700">Partially Paid</span>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{po.paymentMethod || "Partial"}</p>
                      <div className="text-center mt-2 space-y-0.5">
                        <p className="text-[10px] font-semibold text-slate-500">Paid: {fmt(po.paid_amount || 0)}</p>
                        <p className="text-xs font-bold text-amber-600">Outstanding: {fmt(outstanding)}</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl h-full min-h-[160px]">
                    <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-sm shadow-emerald-200 ring-2 ring-white">
                      <CheckCircle2 size={28} />
                    </div>
                    <span className="text-xl font-black tracking-tight text-emerald-700">Paid</span>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{po.paymentMethod || "Completed"}</p>
                  </div>
                )}
              </SectionCard>
            </div>
          )}

        </div>
      </div>


    </div>
  );
};

export default PurchaseDetail;

