import { useState } from "react";
import {
  Layers,
  Tag,
  Clock,
  ChevronRight,
  ChevronDown,
  Hash,
  Package,
  Copy,
  Check
} from "lucide-react";

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

export const SerialBadgeList = ({ serials }: { serials: string[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!serials || serials.length === 0) return null;

  const limit = 12;
  const showAll = isExpanded || serials.length <= limit;
  const visibleSerials = showAll ? serials : serials.slice(0, limit);
  const remaining = serials.length - limit;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {visibleSerials.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-badge-rose-bg text-badge-rose-text border border-badge-rose-text/20">
          <Hash size={8} /> {s}
        </span>
      ))}
      {!showAll && remaining > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          + Show {remaining} more
        </button>
      )}
      {isExpanded && serials.length > limit && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          Show Less
        </button>
      )}
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
  const getNames = (arr: any[]): string[] => {
    return arr.map((v: any) => typeof v === 'object' && v !== null ? v.name || v.serial || "" : String(v)).filter(Boolean);
  };
  if (Array.isArray(val)) return getNames(val);
  if (val.serial_numbers && Array.isArray(val.serial_numbers)) return getNames(val.serial_numbers);
  if (val.serialno_infos && Array.isArray(val.serialno_infos)) return getNames(val.serialno_infos);
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
    <div className="animate-in fade-in slide-in-from-top-1 duration-300 pt-1 pb-2">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center text-amber-600">
          <Tag size={14} className="fill-amber-600/10" />
        </div>
        <p className="text-[13px] font-bold text-slate-800 tracking-tight">Product Batches</p>
        <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {safeBatches.length} {safeBatches.length === 1 ? 'batch' : 'batches'}
        </span>
      </div>

      <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        {visible.map((batch: any, idx: number) => {
          const physicalQty   = Number(batch.stock_infos?.physical_stocks   ?? batch.stocks ?? batch.quantity ?? batch.qty ?? 0);
          const availableQty  = Number(batch.stock_infos?.available_stocks  ?? physicalQty);
          const reservedQty   = Number(batch.stock_infos?.reserved_stocks   ?? 0);
          const serials       = extractSerials(batch.serialno_infos ?? batch.serial_numbers ?? batch.datas?.serial_numbers);
          const daysToExpiry  = getDaysDiff(batch.expiry_date || batch.expiry);
          const bBuy          = batch.pricing_infos?.buy_price   ?? batch.buy_price;
          const bSell         = batch.pricing_infos?.sell_price  ?? batch.sell_price;
          const storageLoc    = batch.storage_location_infos?.storage_location ?? batch.storage_location ?? null;
          const reorderPt     = batch.reorder_point_infos?.reorder_point       ?? batch.reorder_point    ?? null;

          const stockStatus = availableQty <= 0
            ? { label: 'Out of Stock', cls: 'text-rose-600 bg-rose-50 border-rose-200' }
            : reorderPt !== null && availableQty <= reorderPt
              ? { label: 'Low Stock',    cls: 'text-amber-600 bg-amber-50 border-amber-200' }
              : { label: 'In Stock',     cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

          return (
            <div key={batch.id || idx} className="flex flex-col border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5">
                
                {/* Batch Info (Name, ID) */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Package size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate">
                      {batch.name || batch.batch || `BAT-${String(idx + 1).padStart(3, '0')}`}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {batch.id && (
                         <span className="text-[9px] font-mono text-slate-400 font-medium">{batch.id.slice(0, 8)}…</span>
                      )}
                      {storageLoc && (
                         <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100 tracking-wider">LOC: {storageLoc}</span>
                      )}
                      {reorderPt !== null && (
                         <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 tracking-wider">REORDER: {reorderPt}</span>
                      )}
                      {daysToExpiry !== null && (
                         <span className={`text-[8px] font-bold px-1 py-0.5 rounded tracking-wider border ${daysToExpiry <= 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : daysToExpiry <= 7 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                            {daysToExpiry < 0 ? `EXP ${Math.abs(daysToExpiry)}D AGO` : daysToExpiry === 0 ? 'EXPIRES TODAY' : `EXP IN ${daysToExpiry}D`}
                         </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details (Dates, Prices, Stock) */}
                <div className="flex items-center justify-end gap-4 sm:gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                  
                  {/* Dates */}
                  {(batch.manufacturing_date || batch.expiry_date || batch.expiry) && (
                    <div className="text-right flex flex-col items-end">
                      {batch.manufacturing_date && <p className="text-[9px] font-medium text-slate-500 mb-0.5">MFG: <span className="font-bold text-slate-700">{formatDate(batch.manufacturing_date)}</span></p>}
                      {(batch.expiry_date || batch.expiry) && <p className="text-[9px] font-medium text-slate-500">EXP: <span className="font-bold text-slate-700">{formatDate(batch.expiry_date || batch.expiry)}</span></p>}
                    </div>
                  )}

                  {/* Pricing */}
                  {(bBuy !== undefined || bSell !== undefined) && (
                    <div className="text-right flex flex-col items-end hidden md:flex">
                      {bBuy !== undefined && <p className="text-[9px] font-medium text-slate-500 mb-0.5">Buy: <span className="font-bold text-slate-700">{formatCurrency(bBuy)}</span></p>}
                      {bSell !== undefined && <p className="text-[9px] font-medium text-slate-500">Sell: <span className="font-bold text-slate-700">{formatCurrency(bSell)}</span></p>}
                    </div>
                  )}

                  {/* Stock Breakdown (Physical vs Available vs Reserved) */}
                  {(physicalQty !== availableQty || reservedQty > 0) && (
                     <div className="text-right flex flex-col items-end hidden lg:flex">
                        {physicalQty !== availableQty && <p className="text-[9px] font-medium text-slate-500 mb-0.5">Phy: <span className="font-bold text-slate-700">{physicalQty}</span></p>}
                        {reservedQty > 0 && <p className="text-[9px] font-medium text-slate-500">Res: <span className="font-bold text-amber-600">{reservedQty}</span></p>}
                     </div>
                  )}

                  {/* Stock */}
                  <div className="text-center w-[40px]">
                    <p className="text-[9px] font-bold text-slate-400 mb-0.5">Stock</p>
                    <p className="text-[12px] font-black text-slate-800 tabular-nums">{availableQty}</p>
                  </div>

                  {/* Status */}
                  <div className="text-center w-[75px] flex flex-col items-center">
                    <p className="text-[9px] font-bold text-slate-400 mb-1">Status</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${stockStatus.cls}`}>
                      {stockStatus.label}
                    </span>
                  </div>

                </div>
              </div>

              {/* Serials */}
              {serials.length > 0 && (
                <div className="px-4 pb-2 pt-1.5 border-t border-slate-50 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                      <Hash size={9} className="text-slate-400" /> Serial Numbers ({serials.length})
                    </p>
                  </div>
                  <SerialBadgeList serials={serials} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {remaining > 0 && !showAll && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] rounded-md hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
          >
            Show All {safeBatches.length} Batches
            <ChevronDown size={12} />
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
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-1 pb-2">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
          <Layers size={14} className="fill-blue-600/10" />
        </div>
        <p className="text-[13px] font-bold text-slate-800 tracking-tight">Product Variants</p>
      </div>
      <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        {combinations.map((comb: any, idx: number) => {
          const combDatas = comb.datas || {};
          const attributes = comb.attributes || combDatas.attributes || combDatas.datas?.attributes || {};

          // Improved variant label extraction based on sample response
          let variantLabel = comb.variant_name || comb.name || combDatas.name || 'Standard Variant';
          if (Object.keys(attributes).length > 0) {
            variantLabel = Object.values(attributes).join(' / ');
          } else if (comb.barcode && combDatas.barcode && comb.barcode !== combDatas.barcode) {
            variantLabel = comb.barcode; // Fallback if barcode is used as label
          }

          const variantId = comb.id || String(idx);
          const isVarExpanded = expandedVariant === variantId;
          const batches = comb.batch_infos ?? comb.batches ?? [];
          const serials = extractSerials(comb.serialno_infos ?? comb.serial_numbers ?? combDatas.serial_numbers ?? combDatas.datas?.serial_numbers);
          const hasBatches = batches.length > 0;
          const hasSerials = serials.length > 0;
          let stockNum = Number(comb.stock_infos?.available_stocks ?? comb.stock_infos?.physical_stocks ?? comb.stocks ?? comb.stock ?? combDatas.stocks ?? combDatas.datas?.stocks ?? 0);
          if (hasBatches && stockNum === 0) {
            stockNum = batches.reduce((acc: number, b: any) => acc + Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? 0), 0);
          }
          const reorderPoint = Number(comb.reorder_point_infos?.reorder_point ?? comb.reorder_point ?? combDatas.reorder_point ?? combDatas.datas?.reorder_point ?? 0);
          const stockStatus = getStockStatus(stockNum, reorderPoint);
          const statusLabel = stockNum <= 0 ? "Out of Stock" : stockNum <= reorderPoint ? "Low Stock" : "In Stock";
          const sellPrice = comb.pricing_infos?.sell_price ?? comb.sell_price ?? comb.price ?? combDatas.sell_price ?? combDatas.datas?.sell_price ?? baseSellPrice;
          const buyPrice = comb.pricing_infos?.buy_price ?? comb.buy_price ?? combDatas.buy_price ?? combDatas.datas?.buy_price ?? baseBuyPrice ?? 0;

          return (
            <div key={variantId} className={`border-b border-slate-100 last:border-b-0 transition-all hover:bg-slate-50/50 ${isVarExpanded ? 'bg-slate-50/80 shadow-inner' : 'bg-white'}`}>
                <div
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 ${hasBatches ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                  onClick={() => hasBatches && setExpandedVariant(isVarExpanded ? null : variantId)}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    {/* Expand Icon for Batches */}
                    {hasBatches ? (
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${isVarExpanded ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-500"}`}>
                        {isVarExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                        <Package size={12} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 truncate">{variantLabel}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {(() => {
                          const rawSku = comb.barcode || combDatas.barcode || "";
                          if (!rawSku) {
                            return <span className="text-[9px] font-mono text-slate-400 font-medium">No SKU</span>;
                          }
                          const trimmedSku = rawSku.length > 12 ? `${rawSku.slice(0, 8)}...` : rawSku;
                          return (
                            <span className="flex items-center gap-1 text-[9px] font-mono text-slate-400 font-medium" onClick={(e) => e.stopPropagation()}>
                              <span title={rawSku}>{trimmedSku}</span>
                              <CopySKUButton val={rawSku} />
                            </span>
                          );
                        })()}
                        {hasBatches && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-badge-coral-bg text-badge-coral-text border border-badge-coral-text/20 tracking-tighter shrink-0">
                            {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-end gap-3 sm:gap-4 md:gap-5 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                    <div className="text-right w-[40px]">
                      <p className="text-[9px] font-bold text-slate-400 leading-none mb-1 text-right w-full">Stock</p>
                      <p className="text-[11px] font-bold text-slate-800 tabular-nums">{stockNum}</p>
                    </div>
                    <div className="text-center w-[75px] flex flex-col items-center">
                      <p className="text-[9px] font-bold text-slate-400 leading-none mb-1 text-center w-full">Status</p>
                      <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-bold border leading-none ${stockStatus.color}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="text-right w-[60px]">
                      <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">Buy Price</p>
                      <p className="text-[11px] font-bold text-rose-500 tabular-nums">{formatCurrency(buyPrice)}</p>
                    </div>
                    <div className="text-right w-[60px]">
                      <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">Sell Price</p>
                      <p className="text-[11px] font-bold text-emerald-600 tabular-nums">{formatCurrency(sellPrice)}</p>
                    </div>
                    <div className="text-center w-[55px]">
                      <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">Reorder Pt</p>
                      <p className="text-[11px] font-bold text-slate-700 tabular-nums">{reorderPoint || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Serial Numbers - Always Visible */}
                {hasSerials && (
                  <div className="px-4 pb-2 pt-1.5 border-t border-slate-50/50 bg-indigo-50/10">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                        <Hash size={9} className="text-indigo-400" /> Serial Numbers ({serials.length})
                      </p>
                    </div>
                    <SerialBadgeList serials={serials} />
                  </div>
                )}

                {/* Nested Batches Area */}
                {isVarExpanded && hasBatches && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-2 sm:p-3 md:pl-4 pl-3">
                    <BatchCards batches={batches} />
                  </div>
                )}
              </div>
          );
        })}
      </div>
    </div>
  );
};

