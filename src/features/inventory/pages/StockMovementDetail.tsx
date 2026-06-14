import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Package, Calendar, FileText,
  TrendingUp, TrendingDown, Layers, Zap,
  RefreshCcw, Tag
} from "lucide-react";
import { ProfileHeaderCard, SectionCard, TypeBadge } from "@/components/common/SuperUI";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";


function fmtDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: '2-digit', minute: '2-digit' });
}

function fmtShortDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function ProductDetailsList({ prod }: { prod: any }) {
  const hasOldVariants = prod.variants && prod.variants.length > 0;
  const hasOldBatches = prod.batches && prod.batches.length > 0;
  const hasOldSerials = prod.serials && prod.serials.length > 0;
  
  const hasNewVariant = !!prod.variant;
  const hasNewBatch = !!prod.batch;
  const hasNewSerials = prod.serial_info && prod.serial_info.serial_numbers && prod.serial_info.serial_numbers.length > 0;

  if (!hasOldVariants && !hasOldBatches && !hasOldSerials && !hasNewVariant && !hasNewBatch && !hasNewSerials) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* --- NEW FORMAT --- */}
      {hasNewVariant && (
        <div className="pl-3 border-l-2 border-blue-100">
          <p className="text-[10px] font-extrabold text-blue-750 bg-blue-50/50 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
            <Layers size={10} /> {prod.variant.variant_name}
          </p>
        </div>
      )}
      
      {hasNewBatch && (
        <div className="pl-3 border-l-2 border-blue-100">
          <div className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md text-[10px] text-slate-650 shadow-sm">
            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-800 flex items-center gap-1"><Tag size={10} /> Batch: {prod.batch.batch_name || "Default"}</span>
              <span className="text-blue-600">Qty: {Math.abs(Number(prod.stocks_adjusted || 0))}</span>
            </div>
            {(prod.batch.mfg_date || prod.batch.exp_date) && (
              <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                {prod.batch.mfg_date && <span>MFG: {fmtShortDate(prod.batch.mfg_date)}</span>}
                {prod.batch.exp_date && <span>EXP: {fmtShortDate(prod.batch.exp_date)}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {hasNewSerials && (
        <div className="pl-3 border-l-2 border-blue-100">
          <div className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
            <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1"><Zap size={8} /> Serial Numbers:</p>
            <div className="flex flex-wrap gap-1">
              {prod.serial_info.serial_numbers.map((sn: string) => (
                <span key={sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-blue-600 border border-slate-200 shadow-sm">{sn}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- OLD FORMAT (Fallback) --- */}
      {hasOldVariants && prod.variants.map((v: any, i: number) => (
        <div key={`v-${i}`} className="flex flex-col gap-1 bg-slate-50 border border-slate-100 rounded p-2 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Layers size={12} className="text-violet-500" /> Variant: {v.name}</span>
            <span className="text-[10px] font-black text-slate-500 tabular-nums">Qty: {v.stocks}</span>
          </div>
          {v.batches && v.batches.length > 0 && (
            <div className="pl-3 ml-1 border-l-2 border-slate-200 mt-1 space-y-1">
              {v.batches.map((b: any, j: number) => (
                <div key={`b-${j}`} className="flex flex-col gap-1 text-[10px] bg-white border border-slate-100 p-1.5 rounded shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-600 flex items-center gap-1"><Tag size={10} /> Batch: {b.name}</span>
                    <span className="font-bold text-slate-500 tabular-nums">Qty: {b.stocks}</span>
                  </div>
                  {(b.manufacturing_date || b.expiry_date) && (
                    <div className="flex gap-2 text-[9px] mt-0.5 pt-1 border-t border-slate-100">
                       {b.manufacturing_date && <span className="text-slate-500 font-medium">MFG: <span className="font-bold text-slate-700">{fmtShortDate(b.manufacturing_date)}</span></span>}
                       {b.expiry_date && <span className="text-slate-500 font-medium">EXP: <span className="font-bold text-rose-600">{fmtShortDate(b.expiry_date)}</span></span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {v.serials && v.serials.length > 0 && (
            <div className="text-[9px] text-slate-400 mt-1 flex flex-wrap gap-1">
              <span className="font-bold flex items-center gap-1"><Zap size={10} /> Serials:</span> 
              {v.serials.map((s: string, k: number) => (
                <span key={k} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-medium">{s}</span>
              ))}
            </div>
          )}
        </div>
      ))}
      {hasOldBatches && !hasOldVariants && prod.batches.map((b: any, j: number) => (
        <div key={`ob-${j}`} className="flex flex-col gap-1.5 text-xs bg-slate-50 border border-slate-100 rounded p-2 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="font-bold text-amber-600 flex items-center gap-1.5"><Tag size={12} /> Batch: {b.name}</span>
            <span className="font-bold text-slate-500 tabular-nums">Qty: {b.stocks}</span>
          </div>
          {(b.manufacturing_date || b.expiry_date) && (
             <div className="flex gap-3 text-[10px] mt-0.5 pt-1.5 border-t border-slate-200/60">
               {b.manufacturing_date && <span className="text-slate-500 font-medium">MFG: <span className="font-bold text-slate-700">{fmtShortDate(b.manufacturing_date)}</span></span>}
               {b.expiry_date && <span className="text-slate-500 font-medium">EXP: <span className="font-bold text-rose-600">{fmtShortDate(b.expiry_date)}</span></span>}
             </div>
          )}
        </div>
      ))}
      {hasOldSerials && !hasOldVariants && !hasOldBatches && (
        <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded p-2 flex flex-wrap gap-1 shadow-sm">
          <span className="font-bold flex items-center gap-1 text-slate-700 mr-1"><Zap size={10} /> Serials:</span>
          {prod.serials.map((s: string, k: number) => (
            <span key={`os-${k}`} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-medium text-[9px]">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

const StockMovementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData } = useApi();

  const [loading, setLoading] = useState(true);
  const [adjustment, setAdjustment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);



  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getData(`${ENDPOINTS.S_ADJUSTMENTS}/by/${SHOP_ID}/${id}`)
      .then(res => {
        const raw = res?.data || res?.datas;
        const adj = Array.isArray(raw) ? (raw.find((a: any) => a.id === id) || raw[0]) : raw;
        setAdjustment(adj);
      })
      .catch(err => console.error("Failed to load adjustment", err))
      .finally(() => setLoading(false));
  }, [id, getData]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 bg-slate-50/50">
        <RefreshCcw className="animate-spin text-blue-500 mb-4" size={32} />
        <p className="text-slate-500 font-medium text-sm">Loading Movement Details...</p>
      </div>
    );
  }

  if (!adjustment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 bg-slate-50/50">
        <Package size={48} className="text-slate-300 mb-4" />
        <p className="text-lg font-bold text-slate-800">Movement not found</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">We couldn't find the details for this stock movement. It may have been deleted or the ID is incorrect.</p>
        <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
          <ArrowLeft size={16} className="inline mr-2" /> Go Back
        </button>
      </div>
    );
  }

  const getMovementLabel = (t: string) => {
    const mt = t?.toUpperCase() || "";
    if (mt.includes("PURCHASE") || mt === "DIRECT") return "Purchase";
    if (mt === "SALES") return "Sales";
    if (mt.includes("RETURN")) return "Return";
    if (mt === "TRANSFER") return "Transfer";
    return "Adjustment";
  };
  const movementLabel = getMovementLabel(adjustment.movement_type);

  const products = Array.isArray(adjustment.products) ? adjustment.products : [];
  const realId = adjustment.stock_movement_id || adjustment.id || adjustment._id || adjustment.movement_id || "ADJ";
  const refId = adjustment.ui_id ? `ADJ-${adjustment.ui_id}` : realId.slice(0, 8).toUpperCase();
  const dateStr = adjustment.adjusted_date || adjustment.created_at;

  const TABS = ["Overview", "Items"];

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans text-slate-900 overflow-hidden relative">
      <div className="flex-none p-1 pb-0">
        <ProfileHeaderCard
          name={`Stock Movement · ${refId}`}
          initials="MV"
          subText={`ID: ${realId}`}
          badges={[
            { text: movementLabel, variant: "primary" }
          ]}
          infoItems={[
            { icon: Calendar, text: fmtDate(dateStr) }
          ]}
          actions={
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-650 rounded-lg hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
              title="Go Back"
            >
              <ArrowLeft size={14} />
            </button>
          }
        />
      </div>

      <div className="flex-none px-1 py-2">
        <div className="flex gap-0.5 bg-white p-1 rounded-lg border border-slate-200 w-fit overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all whitespace-nowrap ${
                activeTab === i
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab} {tab === "Items" && `(${products.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 py-4">
        <div className="w-full space-y-4">
          
          {activeTab === 0 && (
            <SectionCard title="Movement Context">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description / Reason</p>
                   <div className="flex items-start gap-2 bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                     <FileText size={16} className="text-blue-400 mt-0.5 shrink-0" />
                     <p className="text-sm font-medium text-slate-700 leading-relaxed">{adjustment.description || "No description provided"}</p>
                   </div>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Metadata</p>
                   <div className="space-y-2">
                     <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                       <span className="text-[11px] font-medium text-slate-500">Movement Type</span>
                       <TypeBadge type={adjustment.movement_type} />
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                       <span className="text-[11px] font-medium text-slate-500">Processed At</span>
                       <span className="text-[11px] font-bold text-slate-700">{fmtDate(dateStr)}</span>
                     </div>
                   </div>
                 </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 1 && (
            <SectionCard title="Affected Products & Stock Overview">
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 tracking-wider uppercase">
                      <th className="px-4 py-3 w-[45%]">Product Information</th>
                      <th className="px-4 py-3 w-[20%]">Type</th>
                      <th className="px-4 py-3 text-center w-[20%]">Quantity Changed</th>
                      <th className="px-4 py-3 text-center w-[15%]">Stock After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {products.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium bg-slate-50/30">No products found in this movement.</td></tr>
                    )}
                    {products.map((prod: any, idx: number) => {
                      const isDec = prod.type === "DECREMENT" || adjustment.movement_type === "SALES";
                      
                      const qty = prod.stocks_adjusted !== undefined ? Math.abs(Number(prod.stocks_adjusted)) : Number(prod.stocks || 0);
                      const sBefore = prod.stocks_before !== undefined && prod.stocks_before !== null ? Number(prod.stocks_before) : null;
                      const sAfter = prod.stocks_after !== undefined && prod.stocks_after !== null ? Number(prod.stocks_after) : (sBefore !== null ? (isDec ? sBefore - qty : sBefore + qty) : null);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-4 py-4 align-top border-r border-slate-50">
                            <p className="font-bold text-slate-800 text-[13px]">{prod.name || "Unknown Product"}</p>
                            {prod.description && <p className="text-[10px] text-slate-500 mt-1 font-medium">{prod.description}</p>}
                            <ProductDetailsList prod={prod} />
                          </td>
                          <td className="px-4 py-4 align-top pt-4">
                             <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border shadow-sm ${isDec ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                               {isDec ? <TrendingDown size={12} className="stroke-[3]" /> : <TrendingUp size={12} className="stroke-[3]" />}
                               {movementLabel.toUpperCase()}
                             </span>
                          </td>
                          <td className="px-4 py-4 font-black text-xl tabular-nums text-center align-top pt-3 border-x border-slate-50 bg-slate-50/20">
                            <span className={isDec ? "text-rose-600" : "text-emerald-600"}>
                              {isDec ? "-" : "+"}{qty}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-bold text-blue-600 text-center align-top pt-4 tabular-nums">
                            {sAfter !== null ? sAfter : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockMovementDetail;
