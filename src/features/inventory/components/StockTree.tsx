import { useState } from "react";
import { 
  Layers, 
  Tag, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Hash,
  Package,
  AlertTriangle
} from "lucide-react";
import { Modal } from "../../../components/common/SuperUI";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const getStockStatus = (stock: number | string) => {
  const stockNum = Number(stock) || 0;
  if (stockNum <= 0) return { label: '0 In Stock', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  if (stockNum <= 15) return { label: `${stockNum} Low Stock`, color: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { label: `${stockNum} In Stock`, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
};

const getDaysLeft = (expDate?: string) => {
  if (!expDate) return null;
  const now = new Date();
  const exp = new Date(expDate);
  const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

/* ─── Shared Components ──────────────────────────────────────────────────── */

export const BatchBadge = ({ expDate, qty }: { expDate?: string; qty: number }) => {
  const days = getDaysLeft(expDate);
  if (qty <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-400 border-slate-200">
        Depleted
      </span>
    );
  }
  if (days === null) return null;
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-rose-50 text-rose-600 border-rose-200">
        Expired
      </span>
    );
  }
  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-600 border-amber-200">
        <Clock size={10} /> {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-200">
      <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" /> {days}d left
    </span>
  );
};

export const SerialBadgeList = ({ serials, title = "Serial Numbers" }: { serials: string[], title?: string }) => {
  const [showModal, setShowModal] = useState(false);
  if (!serials || serials.length === 0) return null;
  
  const limit = 10;
  const visibleSerials = serials.slice(0, limit);
  const remaining = serials.length - limit;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 mt-2">
        {visibleSerials.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Hash size={8} /> {s}
          </span>
        ))}
        {remaining > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            + {remaining} more
          </button>
        )}
      </div>

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={title}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Serials</p>
              <p className="text-xl font-bold text-slate-800">{serials.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Hash size={20} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto p-1 custom-scrollbar">
            {serials.map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                <span className="text-[10px] font-bold text-slate-300 group-hover:text-blue-300">{i + 1}</span>
                <span className="text-[11px] font-mono font-bold text-slate-700">{s}</span>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => setShowModal(false)}
              className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
const parseBatches = (b: any) => {
  if (Array.isArray(b)) return b;
  if (typeof b === 'string') {
    try { return JSON.parse(b); } catch (e) { return []; }
  }
  return [];
};

export const BatchCards = ({ batches }: { batches: any | any[] }) => {
  const safeBatches = parseBatches(batches);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? safeBatches : safeBatches.slice(0, 4);
  const remaining = safeBatches.length - 4;

  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return null;
    const expDate = new Date(dateStr);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-1 duration-300 pt-2 pb-6">
      <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
          <Tag size={18} className="fill-amber-600/10" />
        </div>
        <p className="text-[15px] font-bold text-slate-800 tracking-tight">Product Batches</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4">
        {visible.map((batch: any, idx: number) => {
          const qty = Number(batch.stocks ?? batch.quantity ?? batch.qty ?? 0);
          const serials = batch.datas?.serial_numbers || batch.serial_numbers || [];
          const daysToExpiry = getDaysDiff(batch.expiry_date || batch.expiry);
          
          return (
            <div 
              key={batch.id || idx} 
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col"
            >
              {/* Card Header */}
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-b border-slate-50 flex items-center justify-between">
                <span className="text-[12px] sm:text-[13px] font-bold text-slate-800 tracking-tight truncate mr-2">
                  {batch.name || batch.batch || `BATCH-${String(idx + 1).padStart(3, '0')}`}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 ${daysToExpiry !== null && daysToExpiry <= 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {daysToExpiry !== null && daysToExpiry <= 0 ? "Expired" : "Active"}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 flex-1">
                {[
                  { label: "Lot Number:", value: batch.lot_number || `LOT-2024-${String(idx + 1).padStart(3, '0')}` },
                  { label: "Stock:", value: `${qty} units` },
                  { label: "Expiry:", value: batch.expiry_date || batch.expiry || "2025-01-10" },
                  { label: "Location:", value: batch.location || `Shelf A-${10 + idx}` }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                    <span className="text-[11px] sm:text-[12px] text-slate-400 font-medium">{item.label}</span>
                    <span className="text-[11px] sm:text-[12px] text-slate-700 font-bold">{item.value}</span>
                  </div>
                ))}

                {daysToExpiry !== null && (
                  <div className={`mt-2 sm:mt-4 p-2 sm:p-2.5 rounded-lg flex items-center gap-2 ${daysToExpiry <= 0 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                    <AlertTriangle size={14} className={`shrink-0 ${daysToExpiry <= 0 ? "text-rose-500" : "text-amber-500"}`} />
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-tight">
                      {daysToExpiry < 0 ? `Expired ${Math.abs(daysToExpiry)} days ago` : daysToExpiry === 0 ? "Expired today" : `Expires in ${daysToExpiry} days`}
                    </span>
                  </div>
                )}

                {serials.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Serial Numbers</p>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{serials.length}</span>
                    </div>
                    <SerialBadgeList serials={serials} title={`Batch Serials: ${batch.name || batch.batch}`} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {remaining > 0 && !showAll && (
        <div className="mt-4 flex justify-center">
          <button 
            onClick={() => setShowAll(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
          >
            View All {batches.length} Batches
            <ChevronDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export const VariantRows = ({ combinations, baseSellPrice, baseBuyPrice }: { combinations: any[]; baseSellPrice: any; baseBuyPrice?: any }) => {
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-400 pt-2 pb-4">
      <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          <Layers size={18} className="fill-blue-600/10" />
        </div>
        <p className="text-[15px] font-bold text-slate-800 tracking-tight">Product Variants</p>
      </div>
      <div className="flex flex-col relative gap-3">
        {combinations.map((comb: any, idx: number) => {
          const isLast = idx === combinations.length - 1;
          const combDatas = comb.datas || {};
          const attributes = comb.attributes || combDatas.attributes || {};
          
          // Improved variant label extraction based on sample response
          let variantLabel = comb.name || 'Standard Variant';
          if (Object.keys(attributes).length > 0) {
            variantLabel = Object.values(attributes).join(' / ');
          } else if (comb.name || combDatas.name) {
            variantLabel = comb.name || combDatas.name;
          } else if (comb.barcode && comb.barcode !== combDatas.barcode) {
            variantLabel = comb.barcode; // Fallback if barcode is used as label
          }

          const variantId = comb.id || String(idx);
          const isVarExpanded = expandedVariant === variantId;
          const batches = parseBatches(comb.batches);
          const serials = parseBatches(combDatas.serial_numbers || comb.serial_numbers);
          const hasBatches = batches.length > 0;
          const hasSerials = serials.length > 0;
          const stockNum = Number(comb.stocks ?? comb.stock ?? combDatas.stocks ?? 0);
          const stockStatus = getStockStatus(stockNum);
          const sellPrice = comb.sell_price ?? comb.price ?? combDatas.sell_price ?? baseSellPrice;
          const buyPrice = comb.buy_price ?? combDatas.buy_price ?? baseBuyPrice ?? 0;

          return (
            <div key={variantId} className="relative md:pl-6 pl-4">
              {/* --- Tree Branches --- */}
              <div className={`absolute left-[0px] w-[1.5px] bg-slate-200 ${isLast && !isVarExpanded ? 'top-0 h-[32px]' : 'top-0 bottom-[-12px]'}`}></div>
              <div className="absolute left-[0px] top-[32px] w-[12px] md:w-[16px] h-[1.5px] bg-slate-200"></div>

              {/* Variant Card */}
              <div className={`border border-slate-200 rounded-[1rem] overflow-hidden bg-white shadow-sm transition-all hover:border-blue-300 ${isVarExpanded ? 'ring-1 ring-blue-500/20 shadow-md' : ''}`}>
                <div
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 ${hasBatches ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                  onClick={() => hasBatches && setExpandedVariant(isVarExpanded ? null : variantId)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Expand Icon for Batches */}
                    {hasBatches ? (
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${isVarExpanded ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-500"}`}>
                        {isVarExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                        <Package size={14} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{variantLabel}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-400 font-medium">{comb.barcode || combDatas.barcode || "No SKU"}</span>
                        {hasBatches && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-tighter shrink-0">
                            {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-10 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                    <div className="flex items-center gap-6 sm:gap-8">
                      <div className="text-left sm:text-right min-w-[70px]">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Buy Price</p>
                        <p className="text-xs font-bold text-rose-500">{formatCurrency(buyPrice)}</p>
                      </div>
                      <div className="text-left sm:text-right min-w-[70px]">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Sell Price</p>
                        <p className="text-xs font-bold text-emerald-600">{formatCurrency(sellPrice)}</p>
                      </div>
                    </div>
                    <div className="text-right min-w-[90px]">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Status</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Serial Numbers - Always Visible */}
                {hasSerials && (
                  <div className="px-5 pb-3 pt-2 border-t border-slate-50/50 bg-indigo-50/10">
                     <div className="flex items-center justify-between mb-1">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                         <Hash size={10} className="text-indigo-400" /> Serial Numbers ({serials.length})
                       </p>
                     </div>
                     <SerialBadgeList serials={serials} title={`Variant Serials: ${variantLabel}`} />
                  </div>
                )}

                {/* Nested Batches Area */}
                {isVarExpanded && hasBatches && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4 md:pl-6 pl-4">
                    <BatchCards batches={batches} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
