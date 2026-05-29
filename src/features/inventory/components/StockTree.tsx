import { useState } from "react";
import {
  Layers,
  Tag,
  Clock,
  ChevronRight,
  ChevronDown,
  Hash,
  Package,
  AlertTriangle,
  Copy,
  Check
} from "lucide-react";
import { Modal } from "../../../components/common/SuperUI";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

const getStockStatus = (stock: number | string, reorderPoint?: number | string) => {
  const stockNum = Number(stock) || 0;
  const rp = Number(reorderPoint) || 10;
  if (stockNum <= 0) return { label: '0 In Stock', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  if (stockNum <= rp) return { label: `${stockNum} Low Stock`, color: 'text-amber-600 bg-amber-50 border-amber-200' };
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold   border bg-slate-50 text-slate-400 border-slate-200">
        Depleted
      </span>
    );
  }
  if (days === null) return null;
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold   border bg-rose-50 text-rose-600 border-rose-200">
        Expired
      </span>
    );
  }
  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold   border bg-amber-50 text-amber-600 border-amber-200">
        <Clock size={10} /> {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold   border bg-emerald-50 text-emerald-600 border-emerald-200">
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
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400   mb-1">Total Serials</p>
              <p className="text-xl font-bold text-slate-800">{serials.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
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
              className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px]   rounded-lg transition-all"
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

const extractSerials = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (val.serial_numbers && Array.isArray(val.serial_numbers)) return val.serial_numbers;
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {visible.map((batch: any, idx: number) => {
          const qty = Number(batch.stocks ?? batch.quantity ?? batch.qty ?? 0);
          const serials = extractSerials(batch.serial_numbers || batch.datas?.serial_numbers);
          const daysToExpiry = getDaysDiff(batch.expiry_date || batch.expiry);

          return (
            <div
              key={batch.id || idx}
              className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-800">
                  Batch: {batch.name || batch.batch || `BAT-${String(idx + 1).padStart(3, '0')}`}
                </span>
                <span className="text-[12px] font-bold text-indigo-600">
                  Qty: {qty}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span>MFG: {formatDate(batch.manufacturing_date)}</span>
                <span>EXP: {formatDate(batch.expiry_date || batch.expiry)}</span>
              </div>

              {daysToExpiry !== null && (
                <div className={`mt-1 p-1 rounded flex items-center gap-1.5 ${daysToExpiry <= 0 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                  <AlertTriangle size={10} className={`shrink-0 ${daysToExpiry <= 0 ? "text-rose-500" : "text-amber-500"}`} />
                  <span className="text-[9px] font-bold tracking-tight leading-none">
                    {daysToExpiry < 0 ? `Expired ${Math.abs(daysToExpiry)} days ago` : daysToExpiry === 0 ? "Expired today" : `Expires in ${daysToExpiry} days`}
                  </span>
                </div>
              )}

              {serials.length > 0 && (
                <div className="mt-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-bold text-slate-400">Serials</p>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded leading-none">{serials.length}</span>
                  </div>
                  <SerialBadgeList serials={serials} title={`Batch Serials: ${batch.name || batch.batch}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {remaining > 0 && !showAll && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-[11px]   rounded-lg hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
          >
            View All {batches.length} Batches
            <ChevronDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// --- Copy SKU Button with Micro-Animation ---
const CopySKUButton = ({ val }: { val: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center p-0.5 rounded transition-all duration-200 ${copied ? "text-emerald-500 bg-emerald-55" : "text-slate-350 hover:text-blue-600 hover:bg-slate-100/80"
        }`}
      title="Copy SKU"
    >
      {copied ? (
        <Check size={10} className="animate-in zoom-in duration-200" />
      ) : (
        <Copy size={10} className="transition-transform duration-200 active:scale-75" />
      )}
    </button>
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
          const attributes = comb.attributes || combDatas.attributes || combDatas.datas?.attributes || {};

          // Improved variant label extraction based on sample response
          let variantLabel = comb.name || combDatas.name || 'Standard Variant';
          if (Object.keys(attributes).length > 0) {
            variantLabel = Object.values(attributes).join(' / ');
          } else if (comb.barcode && comb.barcode !== combDatas.barcode) {
            variantLabel = comb.barcode; // Fallback if barcode is used as label
          }

          const variantId = comb.id || String(idx);
          const isVarExpanded = expandedVariant === variantId;
          const batches = (comb.batches || []);
          const serials = extractSerials(comb.serial_numbers || combDatas.serial_numbers || combDatas.datas?.serial_numbers);
          const hasBatches = batches.length > 0;
          const hasSerials = serials.length > 0;
          const stockNum = Number(comb.stocks ?? comb.stock ?? combDatas.stocks ?? combDatas.datas?.stocks ?? 0);
          const reorderPoint = Number(comb.reorder_point ?? combDatas.reorder_point ?? combDatas.datas?.reorder_point ?? 0);
          const stockStatus = getStockStatus(stockNum, reorderPoint);
          const sellPrice = comb.sell_price ?? comb.price ?? combDatas.sell_price ?? combDatas.datas?.sell_price ?? baseSellPrice;
          const buyPrice = comb.buy_price ?? combDatas.buy_price ?? combDatas.datas?.buy_price ?? baseBuyPrice ?? 0;

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
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
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
                        {(() => {
                          const rawSku = comb.barcode || combDatas.barcode || "";
                          if (!rawSku) {
                            return <span className="text-[10px] font-mono text-slate-400 font-medium">No SKU</span>;
                          }
                          const trimmedSku = rawSku.length > 12 ? `${rawSku.slice(0, 8)}...` : rawSku;
                          return (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 font-medium" onClick={(e) => e.stopPropagation()}>
                              <span title={rawSku}>{trimmedSku}</span>
                              <CopySKUButton val={rawSku} />
                            </span>
                          );
                        })()}
                        {hasBatches && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100  tracking-tighter shrink-0">
                            {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-end gap-6 sm:gap-8 md:gap-10 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                    <div className="text-right w-[90px] flex flex-col items-end mr-2">
                      <p className="text-[9px] font-bold text-slate-400 leading-none mb-1.5 text-right w-full">Stocks</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                    <div className="text-right w-[70px]">
                      <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">Buy Price</p>
                      <p className="text-xs font-bold text-rose-500 tabular-nums">{formatCurrency(buyPrice)}</p>
                    </div>
                    <div className="text-right w-[70px]">
                      <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">Sell Price</p>
                      <p className="text-xs font-bold text-emerald-600 tabular-nums">{formatCurrency(sellPrice)}</p>
                    </div>
                    <div className="text-center w-[70px]">
                      <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">Reorder Point</p>
                      <p className="text-xs font-bold text-slate-700 tabular-nums">{reorderPoint || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Serial Numbers - Always Visible */}
                {hasSerials && (
                  <div className="px-5 pb-3 pt-2 border-t border-slate-50/50 bg-indigo-50/10">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] font-bold text-slate-400   flex items-center gap-1">
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

