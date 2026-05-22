import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Printer, Building2, Calendar, Package, TrendingUp,
  ReceiptText, ArrowLeft, User, FileText, CheckCircle2, Clock, Banknote
} from "lucide-react";
import type { DirectPurchaseData } from "./PurchaseHistory";
import { ProfileHeaderCard, SectionCard, DetailItem, InfoRow } from "@/components/common/SuperUI";
import { StatCard } from "@/components/common/StatsCard";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const PurchaseDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve po from state (passed from PurchaseHistory)
  const po = location.state?.po as DirectPurchaseData | undefined;

  const [activeTab, setActiveTab] = useState(0);

  if (!po) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <ReceiptText size={48} className="mb-4 text-slate-300" />
        <p className="text-lg font-bold text-slate-800">Purchase details not found</p>
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
  const subtotal = po.products.reduce((sum, item) => sum + (item.quantity * (item.buy_price || 0)), 0);
  const totalGst = po.products.reduce((sum, item) => sum + (item.quantity * (item.buy_price || 0) * ((item.gst || 0) / 100)), 0);
  const hasSubtotal = subtotal > 0;
  const transportCharge = po.charges?.transport || 0;
  const otherCharge = po.charges?.other || 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* Profile Header Card */}
      <div className="flex-none p-1 pb-0">
        <ProfileHeaderCard
          name={`Purchase PO · ${po.poNumber}`}
          initials="PO"
          subText={`ID: ${po.id}`}
          badges={[
            { text: po.purchaseType, variant: "primary" },
            { text: "Paid", variant: "success" } // Assuming paid for simplicity unless status exists
          ]}
          infoItems={[
            { icon: Calendar, text: `${po.date} at ${po.time}` },
            { icon: Building2, text: po.vendor }
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
                  value={fmt(po.total_cost)}
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
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Financial Summary */}
                <div className="lg:col-span-8">
                  <SectionCard title="Financial Summary">
                    <div className="space-y-1">
                      {hasSubtotal && <InfoRow label="Subtotal (Excl. GST)" value={fmt(subtotal)} />}
                      {totalGst > 0 && <InfoRow label="Total GST" value={<span className="text-indigo-600 font-semibold">+{fmt(totalGst)}</span>} />}
                      {transportCharge > 0 && <InfoRow label="Transport Charges" value={<span className="text-slate-700">+{fmt(transportCharge)}</span>} />}
                      {otherCharge > 0 && <InfoRow label="Other Charges" value={<span className="text-slate-700">+{fmt(otherCharge)}</span>} />}
                      
                      <div className="mt-4 pt-4 border-t-2 border-slate-100 border-dashed flex justify-between items-center">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Total Cost</span>
                        <span className="text-xl font-black text-blue-600 tabular-nums">{fmt(po.total_cost)}</span>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* Status & Actions */}
                <div className="lg:col-span-4 space-y-4">
                  <SectionCard title="Purchase Info">
                    <div className="space-y-3">
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
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Stock Overview</th>
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
                                <div className="flex items-center gap-2 mt-0.5">
                                  {product.barcode && (
                                    <span className="text-[10px] font-mono font-bold text-slate-400">{product.barcode}</span>
                                  )}
                                  {product.category && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-slate-100 text-slate-500">
                                      {product.category}
                                    </span>
                                  )}
                                </div>

                                {/* Render nested variants/batches cleanly */}
                                {(product.variants?.length ?? 0) > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-100 space-y-2">
                                    {product.variants?.map((v, vIdx) => (
                                      <div key={vIdx}>
                                        <p className="text-[10px] font-bold text-slate-600 mb-1">• {v.name}</p>
                                        {v.batches?.map((b, bIdx) => (
                                          <div key={bIdx} className="bg-slate-50 p-1.5 rounded border border-slate-100 mb-1">
                                            <div className="flex justify-between items-center">
                                              <span className="text-[9px] font-bold text-slate-500">{b.name}</span>
                                              <span className="text-[9px] font-bold text-indigo-600">Qty: {b.stocks}</span>
                                            </div>
                                            {b.serial_numbers && b.serial_numbers.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {b.serial_numbers.map(sn => (
                                                  <span key={sn} className="text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-white text-slate-500 border border-slate-200">{sn}</span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Opening</span>
                                <span className="text-xs font-bold text-slate-600">{product.stocks_before !== undefined && product.stocks_before !== null ? product.stocks_before : '—'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-blue-400 tracking-wider uppercase">Current</span>
                                <span className="text-xs font-black text-blue-600">
                                  {product.stocks_before !== undefined && product.stocks_before !== null ? (product.stocks_before + product.quantity) : '—'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {product.buy_price !== undefined ? (
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-slate-500 tabular-nums">{fmt(product.buy_price)}</span>
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
                  <DetailItem icon={FileText} label="PO Number" value={po.poNumber} />
                  <DetailItem icon={Calendar} label="Date" value={po.date} />
                  <DetailItem icon={Clock} label="Time" value={po.time} />
                  <DetailItem icon={User} label="Purchase Type" value={po.purchaseType} />
                  {po.storage_location && (
                    <DetailItem icon={Building2} label="Storage Location" value={po.storage_location} />
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Payment Status">
                <div className="flex flex-col items-center justify-center p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl h-full min-h-[160px]">
                  <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-sm shadow-emerald-200">
                    <CheckCircle2 size={28} />
                  </div>
                  <span className="text-xl font-black tracking-tight text-emerald-700">Paid</span>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{po.paymentMethod || "Completed"}</p>
                </div>
              </SectionCard>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PurchaseDetail;

