import React, { useState, Fragment } from "react";
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
import { AntBadge } from "@/components/ui/AntBadge";


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
  if (stockNum <= 0) return { label: '0 In Stock', variant: 'stk-out-of-stock' };
  if (stockNum <= rp) return { label: `${stockNum} Low Stock`, variant: 'stk-low-stock' };
  return { label: `${stockNum} In Stock`, variant: 'stk-in-stock' };
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
      <AntBadge variant="mv-sales" type="tag">
        Depleted
      </AntBadge>
    );
  }
  if (days === null) return null;
  if (days < 0) {
    return (
      <AntBadge variant="ps-cancelled" type="tag">
        Expired
      </AntBadge>
    );
  }
  if (days <= 90) {
    return (
      <AntBadge variant="at-batch" type="tag" icon={<Clock size={10} />}>
        {days} {days === 1 ? 'day' : 'days'} left
      </AntBadge>
    );
  }
  return (
    <AntBadge variant="ps-completed" type="tag" dot>
      {days} {days === 1 ? 'day' : 'days'} left
    </AntBadge>
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
        <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-[var(--mv-sales-bg)] text-badge-rose-text border border-badge-rose-text/20">
          <Hash size={8} /> {s}
        </span>
      ))}
      {!showAll && remaining > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xl text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          + Show {remaining} more
        </button>
      )}
      {isExpanded && serials.length > limit && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xl text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          Show Less
        </button>
      )}
    </div>
  );
};
const parseBatches = (b: any) => {
  if (!b) return [];
  if (Array.isArray(b)) return b;
  if (typeof b === 'string') {
    try {
      const parsed = JSON.parse(b);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return Object.values(parsed);
      return [];
    } catch (e) { return []; }
  }
  if (typeof b === 'object') {
    return Object.values(b);
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

const extractReorderPoint = (comb: any, parentReorderPoint?: number | null): number | null => {
  if (!comb) return parentReorderPoint ?? null;
  const combDatas = comb.datas || {};
  const addInfos = comb.additional_infos || combDatas.additional_infos || {};
  const nestedDatas = combDatas.datas || {};
  const batches = comb.batch_infos || comb.batches || combDatas.batch_infos || combDatas.batches || [];

  const parseVal = (val: any): number | null => {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === 'object') {
      const numVal = val.reorder_point ?? val.point ?? val.value;
      if (numVal !== undefined && numVal !== null && numVal !== "") {
        const n = Number(numVal);
        return isNaN(n) ? null : n;
      }
      return null;
    }
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  const getFromBatches = (arr: any[]): number | null => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    for (const b of arr) {
      const v = parseVal(b.reorder_point_infos) ?? parseVal(b.reorder_point) ?? parseVal(b.additional_infos?.reorder_point);
      if (v !== null) return v;
    }
    return null;
  };

  const val =
    parseVal(comb.reorder_point_infos) ??
    parseVal(comb.reorder_point) ??
    parseVal(addInfos.reorder_point_infos) ??
    parseVal(addInfos.reorder_point) ??
    getFromBatches(batches) ??
    parseVal(combDatas.reorder_point_infos) ??
    parseVal(combDatas.reorder_point) ??
    parseVal(nestedDatas.reorder_point_infos) ??
    parseVal(nestedDatas.reorder_point);

  if (val !== null) return val;
  return parentReorderPoint ?? null;
};

const extractStorageLocation = (comb: any, parentStorageLocation?: string | null): string | null => {
  if (!comb) return parentStorageLocation || null;
  const combDatas = comb.datas || {};
  const addInfos = comb.additional_infos || combDatas.additional_infos || {};
  const nestedDatas = combDatas.datas || {};
  const batches = comb.batch_infos || comb.batches || combDatas.batch_infos || combDatas.batches || [];

  const getFromObj = (obj: any): string | null => {
    if (!obj) return null;
    if (typeof obj === 'string' && obj.trim() !== '' && obj.trim() !== '{}') return obj.trim();
    if (typeof obj === 'number') return String(obj);
    if (typeof obj === 'object') {
      const name = obj.storage_location || obj.name || obj.location || obj.storage_location_name;
      if (name && typeof name === 'string' && name.trim() !== '' && name.trim() !== '{}') return name.trim();
      if (typeof name === 'number') return String(name);
    }
    return null;
  };

  const getFromArray = (arr: any): string | null => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    for (const item of arr) {
      const res = getFromObj(item) || getFromObj(item?.storage_location_infos) || getFromObj(item?.additional_infos?.storage_location_infos);
      if (res) return res;
    }
    return null;
  };

  const candidate =
    getFromObj(comb.storage_location_infos) ||
    getFromObj(comb.storage_location) ||
    getFromObj(comb.location) ||
    getFromArray(comb.storage_locations) ||
    getFromObj(addInfos.storage_location_infos) ||
    getFromObj(addInfos.storage_location) ||
    getFromObj(addInfos.location) ||
    getFromArray(addInfos.storage_locations) ||
    getFromArray(batches) ||
    getFromObj(combDatas.storage_location_infos) ||
    getFromObj(combDatas.storage_location) ||
    getFromObj(combDatas.location) ||
    getFromArray(combDatas.storage_locations) ||
    getFromObj(nestedDatas.storage_location_infos) ||
    getFromObj(nestedDatas.storage_location) ||
    getFromObj(nestedDatas.location) ||
    getFromArray(nestedDatas.storage_locations);

  if (candidate && candidate !== '—' && candidate !== 'null' && candidate !== 'undefined') {
    return candidate;
  }

  return parentStorageLocation || null;
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {visible.map((batch: any, idx: number) => {
          const physicalQty = Number(batch.stock_infos?.physical_stocks ?? batch.stocks ?? batch.stock ?? batch.quantity ?? batch.qty ?? batch.available_stocks ?? 0);
          const availableQty = Number(batch.stock_infos?.available_stocks ?? batch.available_stocks ?? physicalQty);
          const reservedQty = Number(batch.stock_infos?.reserved_stocks ?? 0);
          const serials = extractSerials(batch.serialno_infos ?? batch.serial_numbers ?? batch.datas?.serial_numbers);
          const daysToExpiry = getDaysDiff(batch.expiry_date || batch.expiry);
          const bSell = batch.pricing_infos?.sell_price ?? batch.sell_price;
          const storageLoc = batch.storage_location_infos?.storage_location ?? batch.storage_location ?? null;
          const reorderPt = batch.reorder_point_infos?.reorder_point ?? batch.reorder_point ?? null;

          const stockStatus = availableQty <= 0
            ? { label: 'Out of Stock', variant: 'stk-out-of-stock' }
            : reorderPt !== null && availableQty <= reorderPt
              ? { label: 'Low Stock', variant: 'stk-low-stock' }
              : { label: 'In Stock', variant: 'stk-in-stock' };

          return (
            <div key={batch.id || idx} className="flex flex-col border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-3.5 relative gap-3">
              {/* Header: Name and Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/50 border border-blue-100/50 flex items-center justify-center text-blue-500 shrink-0">
                    <Package size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate" title={batch.name || batch.batch || `BAT-${String(idx + 1).padStart(3, '0')}`}>
                      {batch.name || batch.batch || `BAT-${String(idx + 1).padStart(3, '0')}`}
                    </p>
                    {batch.id && (
                      <p className="text-[9px] font-mono text-slate-400 font-medium">#{batch.id.slice(0, 8)}</p>
                    )}
                  </div>
                </div>
                <AntBadge variant={stockStatus.variant} type="pill" dot>
                  {stockStatus.label}
                </AntBadge>
              </div>

              {/* Tags (Loc, Reorder, Exp) */}
              <div className="flex flex-wrap gap-1.5">
                {storageLoc && (
                  <AntBadge variant="at-variant" type="tag">LOC: {storageLoc}</AntBadge>
                )}
                {reorderPt !== null && (
                  <AntBadge variant="at-batch" type="tag">REORDER: {reorderPt}</AntBadge>
                )}
                {daysToExpiry !== null && (
                  <AntBadge variant={daysToExpiry <= 0 ? 'ps-cancelled' : daysToExpiry <= 7 ? 'at-batch' : 'ps-completed'} type="tag">
                    {daysToExpiry < 0 ? `EXP ${Math.abs(daysToExpiry)} DAYS AGO` : daysToExpiry === 0 ? 'EXPIRES TODAY' : `EXP IN ${daysToExpiry} DAYS`}
                  </AntBadge>
                )}
              </div>

              {/* Grid for Stock and Prices */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Avail. Stock</span>
                  <span className="text-sm font-black text-blue-600 tabular-nums">{availableQty}</span>
                </div>
                {(physicalQty !== availableQty || reservedQty > 0) && (
                  <div className="flex flex-col border-l border-slate-200 pl-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Physical / Res.</span>
                    <span className="text-xs font-bold text-slate-600 tabular-nums">{physicalQty} <span className="text-amber-500">({reservedQty})</span></span>
                  </div>
                )}
                {(bSell !== undefined) && (
                  <>
                    <div className="flex flex-col pt-2 border-t border-slate-200/60 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sell Price</span>
                      <span className="text-xs font-bold text-slate-700">{formatCurrency(bSell)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Dates */}
              {(batch.manufacturing_date || batch.expiry_date || batch.expiry) && (
                <div className="flex items-center justify-between text-[10px] bg-white border border-slate-100 rounded-md p-1.5 px-2">
                  {batch.manufacturing_date && <div><span className="text-slate-400">MFG:</span> <span className="font-bold text-slate-700">{formatDate(batch.manufacturing_date)}</span></div>}
                  {(batch.expiry_date || batch.expiry) && <div><span className="text-slate-400">EXP:</span> <span className="font-bold text-slate-700">{formatDate(batch.expiry_date || batch.expiry)}</span></div>}
                </div>
              )}

              {/* Serials */}
              {serials.length > 0 && (
                <div className="pt-1.5 border-t border-slate-100/60">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                      <Hash size={9} /> Serials ({serials.length})
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
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
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
      className={`inline-flex items-center justify-center p-0.5 rounded transition-all duration-200 ${copied ? "text-emerald-500 bg-emerald-50" : "text-slate-350 hover:text-blue-600 hover:bg-slate-100/80"
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

export const VariantRows = ({
  combinations,
  baseSellPrice,
  parentStorageLocation,
  parentReorderPoint
}: {
  combinations: any[];
  baseSellPrice: any;
  parentStorageLocation?: string | null;
  parentReorderPoint?: number | null;
}) => {
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-1 pb-2">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
          <Layers size={14} className="fill-blue-600/10" />
        </div>
        <p className="text-[13px] font-bold text-slate-800 tracking-tight">Product Variants</p>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Variant</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">SKU / Barcode</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Stock</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Sell Price</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Batch Count</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Location</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {combinations.map((comb: any, idx: number) => {
              const combDatas = comb.datas || {};
              const attributes = comb.attributes || combDatas.attributes || combDatas.datas?.attributes || {};

              let variantLabel = "";
              if (attributes && Object.keys(attributes).length > 0) {
                const entries = Object.entries(attributes);
                if (entries.length === 1) {
                  variantLabel = String(entries[0][1]);
                } else {
                  variantLabel = entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
                }
              } else {
                const rawName = comb.variant_name || comb.name || combDatas.variant_name || combDatas.name;
                if (rawName && typeof rawName === 'string' && rawName.trim() !== '' && rawName !== comb.barcode && rawName !== comb.sku) {
                  variantLabel = rawName;
                } else {
                  variantLabel = `Variant ${idx + 1}`;
                }
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
              const reorderPoint = extractReorderPoint(comb, parentReorderPoint);
              const storageLoc = extractStorageLocation(comb, parentStorageLocation);
              const stockStatus = getStockStatus(stockNum, reorderPoint ?? 0);
              const statusLabel = stockNum <= 0 ? "Out of Stock" : (reorderPoint !== null && stockNum <= reorderPoint) ? "Low Stock" : "In Stock";
              const sellPrice = comb.pricing_infos?.sell_price ?? comb.sell_price ?? comb.price ?? combDatas.sell_price ?? combDatas.datas?.sell_price ?? baseSellPrice;

              return (
                <Fragment key={variantId}>
                  <tr
                    className={`group transition-colors h-[56px] ${isVarExpanded ? 'bg-slate-50/80 shadow-inner' : 'bg-white hover:bg-slate-50/50'}`}
                  >
                    {/* Variant */}
                    <td className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-2.5">
                        {hasBatches ? (
                          <button
                            onClick={() => setExpandedVariant(isVarExpanded ? null : variantId)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0 ${isVarExpanded ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                          >
                            {isVarExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>
                        ) : (
                          <div className="w-5 h-5 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                            <Layers size={11} />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-800 tracking-tight">{variantLabel}</span>
                          {(storageLoc || reorderPoint !== null) && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {storageLoc && (
                                <AntBadge variant="at-variant" type="tag">LOC: {storageLoc}</AntBadge>
                              )}
                              {reorderPoint !== null && (
                                <AntBadge variant="at-batch" type="tag">REORDER: {reorderPoint}</AntBadge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU / Barcode */}
                    <td className="px-4 py-2 align-middle">
                      {(() => {
                        const rawSku = comb.sku || comb.additional_infos?.sku || combDatas.sku || combDatas.datas?.sku || "";
                        const rawBarcode = comb.barcode || comb.additional_infos?.barcode || combDatas.barcode || combDatas.datas?.barcode || "";

                        if (!rawSku && !rawBarcode) {
                          return <span className="text-[12px] font-mono text-slate-400 font-medium">—</span>;
                        }

                        const primaryText = rawSku || rawBarcode;
                        const secondaryText = rawSku && rawBarcode && rawBarcode !== rawSku ? rawBarcode : null;
                        const trimmedPrimary = primaryText.length > 16 ? `${primaryText.slice(0, 14)}...` : primaryText;

                        return (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-mono font-medium text-slate-700 tracking-tight" title={primaryText}>
                                {trimmedPrimary}
                              </span>
                              <CopySKUButton val={primaryText} />
                            </div>
                            {secondaryText && (
                              <span className="text-[10px] font-mono text-slate-400" title={`Barcode: ${secondaryText}`}>
                                BC: {secondaryText.length > 14 ? `${secondaryText.slice(0, 12)}...` : secondaryText}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-2 align-middle text-right">
                      <span className={`text-[14px] font-bold tabular-nums ${stockNum > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {stockNum}
                      </span>
                    </td>

                    {/* Sell Price */}
                    <td className="px-4 py-2 align-middle text-right">
                      <span className="text-[13px] font-bold text-slate-800 tabular-nums">
                        {formatCurrency(sellPrice)}
                      </span>
                    </td>

                    {/* Batch Count */}
                    <td className="px-4 py-2 align-middle">
                      {hasBatches ? (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-xl whitespace-nowrap">
                          {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-2 align-middle">
                      {storageLoc ? (
                        <span className="text-[12px] font-medium text-slate-700">{storageLoc}</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2 align-middle text-center">
                      <AntBadge variant={stockStatus.variant} type="pill" dot>
                        {statusLabel}
                      </AntBadge>
                    </td>

                  </tr>

                  {/* Serials Area */}
                  {hasSerials && (
                    <tr className="bg-indigo-50/10">
                      <td colSpan={7} className="p-0 border-t border-slate-50/50">
                        <div className="px-4 pb-2 pt-1.5 flex flex-col">
                          <p className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1 uppercase">
                            <Hash size={10} className="text-indigo-400" /> Serial Numbers ({serials.length})
                          </p>
                          <SerialBadgeList serials={serials} />
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Nested Batches Area */}
                  {isVarExpanded && hasBatches && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={7} className="p-0 border-t border-slate-100">
                        <div className="p-3 md:pl-10 pl-6 border-l-2 border-slate-200 ml-4 my-2">
                          <BatchCards batches={batches} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

