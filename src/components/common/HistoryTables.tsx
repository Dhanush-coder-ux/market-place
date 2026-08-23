import { ArrowUp, ArrowDown, ShoppingCart, TrendingUp, RefreshCcw, FileText, ArrowRight, Banknote, Eye, ChevronRight, X, Layers, Hash, Zap } from "lucide-react";
import { TypeBadge } from "@/components/common/SuperUI";
import { useState, Fragment } from "react";
import { createPortal } from "react-dom";

export function GroupedItemsDrawer({
  record,
  onClose,
  type = 'purchase'
}: {
  record: any;
  onClose: () => void;
  type?: 'purchase' | 'supplier_purchase' | 'adjustment';
}) {
  if (!record || !record.productsList) return null;
  const isAdjustment = type === 'adjustment';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
      <div
        className="relative w-full max-w-md bg-white border-l border-slate-200 h-full overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 sticky top-0 z-20 backdrop-blur-md">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Grouped Items Details</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {isAdjustment ? 'Stock Movement' : (record.uiId ? `Purchase #${record.uiId}` : 'Purchase Details')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all border border-transparent hover:border-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-4 bg-slate-50/30">
          <div className="space-y-3">
            {record.productsList.map((p: any, idx: number) => {
              const isReturn = record.type === 'RETURN';
              const isDec = isAdjustment ? !record.isInc : isReturn;
              let stockVal: number | null = null;
              
              if (p.stocksBefore !== null && p.stocksBefore !== undefined) {
                if (isAdjustment) {
                  stockVal = p.stocksBefore + (record.isInc ? p.receivedStocks : -p.receivedStocks);
                } else {
                  stockVal = p.stocksBefore + (isReturn ? -p.receivedStocks : p.receivedStocks);
                }
              }

              const title = p.name || p.productName || record.productName || record.description || (p.variant ? `Variant: ${getVariantName(p.variant)}` : 'Standard Product');

              return (
                <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <p className="text-slate-800 font-bold text-[13px] leading-tight">{title}</p>
                      {p.sku && <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">SKU: {p.sku}</span>}
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-[13px] font-black tabular-nums ${isDec ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isDec ? '-' : '+'}{p.receivedStocks}
                      </span>
                      {stockVal !== null && (
                        <span className="text-[10px] font-bold text-blue-600 mt-0.5 tabular-nums">Stock: {stockVal}</span>
                      )}
                    </div>
                  </div>
                  
                  {(p.variant || p.batch || (p.serials && p.serials.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                      {p.variant && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-100">
                          <Layers size={10} />
                          <span className="text-[9px] font-bold">{getVariantName(p.variant)}</span>
                        </div>
                      )}
                      {p.batch && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-100">
                          <Hash size={10} />
                          <span className="text-[9px] font-bold">{getBatchName(p.batch)}</span>
                        </div>
                      )}
                      {p.serials && p.serials.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-100">
                          <Zap size={10} />
                          <span className="text-[9px] font-bold">{p.serials.length} Serials</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!isAdjustment && (p.buyPrice !== undefined || p.sellPrice !== undefined) && (
                    <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-100">
                      {p.buyPrice !== undefined && (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Buy Price</span>
                          <span className="text-xs font-bold text-slate-700">₹{p.buyPrice}</span>
                        </div>
                      )}
                      {p.sellPrice !== undefined && (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sell Price</span>
                          <span className="text-xs font-bold text-emerald-600">₹{p.sellPrice}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-white">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

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

const getVariantName = (v: any) => {
  if (!v) return null;
  return typeof v === 'object' ? (v.variant_name || v.name) : v;
};

const getBatchName = (b: any) => {
  if (!b) return null;
  return typeof b === 'object' ? (b.batch_name || b.name) : b;
};

const RichProductDetails = ({ p }: { p: any }) => {
  return (
    <div className="flex flex-col mt-1 w-full max-w-sm">
      {p.variant_details && (
        <div className="mt-1 pl-3 border-l-2 border-indigo-100 space-y-2.5">
          <p className="text-[10px] font-extrabold text-indigo-750 bg-indigo-50/50 px-1.5 py-0.5 rounded w-fit">• {getVariantName(p.variant_details?.variant_name || p.variant)}</p>
        </div>
      )}
      
      {p.batch_details && (
        <div className="mt-1 pl-3 border-l-2 border-indigo-150 space-y-1.5">
          <div className="bg-slate-50 p-2 rounded border border-slate-100 w-full text-[10px] text-slate-650 shadow-sm">
            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-800">Batch: {p.batch_details.batch_name || p.batch || "Default"}</span>
              <span className="text-indigo-600">Qty: {p.receivedStocks ?? 0}</span>
            </div>
            {(p.batch_details.mfg_date || p.batch_details.exp_date) && (
              <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                {p.batch_details.mfg_date && <span>MFG: {formatBatchDate(p.batch_details.mfg_date)}</span>}
                {p.batch_details.exp_date && <span>EXP: {formatBatchDate(p.batch_details.exp_date)}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {p.serial_info && p.serial_info.serial_numbers && p.serial_info.serial_numbers.length > 0 && (
        <div className="mt-1 pl-3 border-l-2 border-indigo-150 space-y-1.5">
          <div className="bg-slate-50 p-2 rounded border border-slate-100 w-full shadow-sm">
            <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serial Numbers:</p>
            <div className="flex flex-wrap gap-1">
              {p.serial_info.serial_numbers.map((sn: any, idx: number) => (
                <span key={typeof sn === 'object' ? (sn.id || sn.name || idx) : sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{typeof sn === 'object' ? ((sn as any).name || (sn as any).id) : sn}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STOCK MOVEMENTS TABLE ────────────────────────────────────────────────────
export interface StockMovementRow {
  id: string;
  date: string;
  displayType: string;
  source?: string;
  isInc: boolean;
  variant: string | null;
  batch: string | null;
  stocks: number;
  receivedStocks: number;
  stocksBefore: number | null;
  description: string;
  serials?: string[];
  uiId?: string;
  productsList?: {
    name?: string;
    variant: string | null;
    batch: string | null;
    stocks: number;
    receivedStocks: number;
    stocksBefore: number | null;
    serials?: string[];
  }[];
}

interface StockMovementsTableProps {
  rows: StockMovementRow[];
  loading: boolean;
  onViewDetails?: (id: string) => void;
}

export function StockMovementsTable({ rows, loading, onViewDetails }: StockMovementsTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      
      {/* Table Body Container with internal scroll only */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="text-blue-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading stock ledger...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center">
            <TrendingUp size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Movements Recorded</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">This product does not have any inventory logs recorded yet.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Movement Type</th>
                  <th className="px-5 py-3.5">Product / Variant / Batch</th>
                  <th className="px-5 py-3.5 text-center">Stock In/Out</th>
                  <th className="px-5 py-3.5 text-center">Stock After</th>
                  <th className="px-5 py-3.5">Details</th>
                  <th className="px-5 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => {
                  const hasList = r.productsList && r.productsList.length > 1;
                  const rowKey = `${r.id}-${i}`;
                  const totalStocksIn = hasList
                    ? r.productsList!.reduce((sum, p) => sum + p.receivedStocks, 0)
                    : (r.productsList?.[0]?.receivedStocks ?? r.receivedStocks);

                  const firstProd = r.productsList?.[0];
                  // Compute stock after for single or multi-product rows
                  const currentStockVal = (() => {
                    const prods = r.productsList;
                    if (!prods || prods.length === 0) {
                      const sb = r.stocksBefore;
                      if (sb === null || sb === undefined) return null;
                      return sb + (r.isInc ? r.receivedStocks : -r.receivedStocks);
                    }
                    let total = 0;
                    for (const p of prods) {
                      const sb = p.stocksBefore;
                      if (sb === null || sb === undefined) return null;
                      total += sb + (r.isInc ? p.receivedStocks : -p.receivedStocks);
                    }
                    return total;
                  })();

                  return (
                    <Fragment key={rowKey}>
                      <tr
                        className={`hover:bg-slate-50/80 transition-colors border-l-[3px] ${r.source === 'purchase' ? 'border-l-indigo-400' : r.isInc ? 'border-l-emerald-400' : 'border-l-rose-400'
                          }`}
                      >
                        <td className="px-5 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                          {r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <TypeBadge 
                            type={r.displayType} 
                            icon={r.isInc ? ArrowUp : ArrowDown} 
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            {firstProd?.name && (
                              <span className="text-[12px] font-semibold text-slate-850 truncate max-w-[180px] inline-block">
                                {firstProd.name}
                              </span>
                            )}
                            <div className="flex flex-wrap gap-1 mt-0.5 items-center">
                              {(firstProd?.variant || r.variant) && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100 truncate">V: {getVariantName(firstProd?.variant || r.variant)}</span>}
                              {(firstProd?.batch || r.batch) && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 truncate">B: {getBatchName(firstProd?.batch || r.batch)}</span>}
                              {((firstProd?.serials || r.serials) && (firstProd?.serials || r.serials)!.length > 0) && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-[9px] text-slate-400 font-bold">SN: </span>
                                  {(firstProd?.serials || r.serials)!.slice(0, 2).map((s: any, si: number) => (
                                    <span key={si} className="text-[9px] font-mono font-bold text-slate-500">{typeof s === 'object' ? ((s as any).name || (s as any).id) : s}{si === 0 && (firstProd?.serials || r.serials)!.length > 1 ? ',' : ''}</span>
                                  ))}
                                  {(firstProd?.serials || r.serials)!.length > 2 && <span className="text-[9px] font-bold text-slate-400">+{(firstProd?.serials || r.serials)!.length - 2}</span>}
                                </div>
                              )}
                              {hasList && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRecord(r);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors shrink-0 shadow-sm"
                                  title="View Items"
                                >
                                  <ChevronRight size={10} strokeWidth={3} />
                                  <span>+ {r.productsList!.length - 1} more</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-black text-sm tabular-nums text-center bg-slate-50/40">
                          <span className={r.isInc ? 'text-emerald-600' : 'text-rose-600'}>
                            {r.isInc ? '+' : '-'}{totalStocksIn}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center font-bold text-blue-600 tabular-nums">
                          {currentStockVal !== null ? currentStockVal : '—'}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 max-w-[220px] truncate" title={r.description}>
                          {r.description}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {onViewDetails && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(r.id);
                              }}
                              title="View Adjustment Detail"
                              className="w-7 h-7 mx-auto flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 border border-blue-100 transition-all active:scale-95 shadow-sm"
                            >
                              <Eye size={13} strokeWidth={2.5} />
                            </button>
                          )}
                        </td>
                      </tr>

                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <GroupedItemsDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} type="adjustment" />
    </div>
  );
}

// ─── PRODUCT PURCHASES TABLE ──────────────────────────────────────────────────
interface ProductPurchasesTableProps {
  rows: any[];
  loading: boolean;
  onNavigateToPurchase?: (id: string) => void;
}

export function ProductPurchasesTable({ rows, loading, onNavigateToPurchase }: ProductPurchasesTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading purchase records...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center">
            <ShoppingCart size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Purchase History</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">There are no registered supplier purchases for this product.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Variant / Batch</th>
                  <th className="px-5 py-3.5 text-center">Stock In/Out</th>
                  <th className="px-5 py-3.5 text-center">Stock After</th>
                  <th className="px-5 py-3.5">Buy Price</th>
                  <th className="px-5 py-3.5">Sell Price</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => {
                  const hasList = r.productsList && r.productsList.length > 1;
                  const rowKey = `${r.id}-${i}`;

                  const totalStocksIn = hasList
                    ? r.productsList!.reduce((sum: number, p: any) => sum + p.receivedStocks, 0)
                    : (r.productsList?.[0]?.receivedStocks ?? r.receivedStocks);

                  const firstProd = r.productsList?.[0] || {};
                  // Compute total stock after across all items (purchases are always increments)
                  const totalStockAfterProd = (() => {
                    const prods = r.productsList;
                    if (!prods || prods.length === 0) {
                      const sb = r.stocksBefore;
                      return sb !== null && sb !== undefined ? (sb + totalStocksIn) : null;
                    }
                    let total = 0;
                    for (const p of prods) {
                      if (p.stocksBefore === null || p.stocksBefore === undefined) return null;
                      total += p.stocksBefore + p.receivedStocks;
                    }
                    return total;
                  })();


                  return (
                    <Fragment key={rowKey}>
                      <tr className="hover:bg-indigo-50/20 transition-colors border-l-[3px] border-l-indigo-400">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black text-slate-400 font-mono">#{r.uiId}</span>
                            {(r.version || (r.datas && r.datas.version)) && (
                              <span className="text-[9px] font-bold text-[var(--at-version-tx)] bg-[var(--at-version-bg)] border border-[var(--at-version-bd)] px-1.5 py-0.5 rounded-xl uppercase tracking-wider shrink-0">
                                {r.version || r.datas?.version}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                          {r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <TypeBadge 
                            type={r.displayType} 
                            icon={ArrowUp} 
                          />
                        </td>
                        <td className="px-5 py-4">
                          {hasList ? (
                            <div className="flex flex-col gap-1 max-w-[200px]">
                              {firstProd.variant_details || firstProd.batch_details || firstProd.serial_info ? (
                                <RichProductDetails p={firstProd} />
                              ) : (
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  {(firstProd.variant || r.variant) && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100 truncate">V: {getVariantName(firstProd.variant || r.variant)}</span>}
                                  {(firstProd.batch || r.batch) && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 truncate">B: {getBatchName(firstProd.batch || r.batch)}</span>}
                                </div>
                              )}
                              <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRecord(r);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors shrink-0 shadow-sm"
                                  title="View Items"
                                >
                                  <ChevronRight size={10} strokeWidth={3} />
                                  <span>+ {r.productsList!.length - 1} more</span>
                                </button>
                              </div>
                          ) : (
                            <div className="flex flex-col gap-1 max-w-[350px]">
                              {firstProd.variant_details || firstProd.batch_details || firstProd.serial_info ? (
                                <RichProductDetails p={firstProd} />
                              ) : (
                                <>
                                  {(firstProd.variant || r.variant) && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100 truncate">V: {getVariantName(firstProd.variant || r.variant)}</span>}
                                  {(firstProd.batch || r.batch) && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 truncate">B: {getBatchName(firstProd.batch || r.batch)}</span>}
                                  {!firstProd.variant && !r.variant && !firstProd.batch && !r.batch && <span className="text-slate-300">—</span>}
                                  {((firstProd.serials || r.serials) && (firstProd.serials || r.serials)!.length > 0) && (
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                      <span className="text-[9px] text-slate-400 font-bold">SN: </span>
                                      {(firstProd.serials || r.serials)!.slice(0, 2).map((s: any, si: number) => (
                                        <span key={si} className="text-[9px] font-mono font-bold text-slate-500">{typeof s === 'object' ? ((s as any).name || (s as any).id) : s}{si === 0 && (firstProd.serials || r.serials)!.length > 1 ? ',' : ''}</span>
                                      ))}
                                      {(firstProd.serials || r.serials)!.length > 2 && <span className="text-[9px] font-bold text-slate-400">+{(firstProd.serials || r.serials)!.length - 2}</span>}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-black text-sm tabular-nums text-center bg-slate-50/40">
                          <span className={r.type === 'RETURN' ? 'text-rose-600' : 'text-emerald-600'}>
                            {r.type === 'RETURN' ? '-' : '+'}{totalStocksIn}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center font-bold text-blue-600 tabular-nums">
                          {totalStockAfterProd !== null ? totalStockAfterProd : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                          {hasList ? '—' : `₹${firstProd.buyPrice ?? r.buyPrice ?? '—'}`}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-emerald-700">
                          {hasList ? '—' : `₹${firstProd.sellPrice ?? r.sellPrice ?? '—'}`}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md w-fit ${
                                r.paymentMethod?.toLowerCase() === 'outstanding' ? 'bg-rose-50 text-rose-700' :
                                r.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-700' :
                                r.paymentMethod === 'UPI' ? 'bg-violet-50 text-violet-700' :
                                'bg-slate-50 text-slate-600'
                              }`}>{r.paymentMethod}</span>
                            {r.paymentMethod?.toLowerCase() === 'outstanding' ? (
                              <span className="text-[9px] text-rose-500 font-bold">Left: ₹{r.totalCost - r.amountPaid}</span>
                            ) : r.amountPaid > 0 ? (
                              <span className="text-[9px] text-slate-400 font-bold">Paid: ₹{r.amountPaid}</span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs font-bold text-slate-700 max-w-[150px] truncate" title={r.description}>
                          {r.description.replace('Supplier: ', '')}
                        </td>
                        <td className="px-5 py-4">
                          {onNavigateToPurchase && (
                            <button
                              onClick={() => onNavigateToPurchase(r.id)}
                              title="View Purchase Detail"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-100 transition-all active:scale-95 shadow-sm"
                            >
                              <Eye size={13} strokeWidth={2.5} />
                            </button>
                          )}
                        </td>
                      </tr>

                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <GroupedItemsDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} type="purchase" />
    </div>
  );
}


// ─── SUPPLIER PURCHASES TABLE ──────────────────────────────────────────────────
interface SupplierPurchasesTableProps {
  rows: any[];
  loading: boolean;
  onNavigateToPurchase?: (id: string) => void;
}

export function SupplierPurchasesTable({ rows, loading, onNavigateToPurchase }: SupplierPurchasesTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading vendor purchases...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center">
            <ShoppingCart size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Purchases Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">There are no logged purchase acquisitions for this vendor.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5 text-center">Stock In/Out</th>
                  <th className="px-5 py-3.5 text-center">Stock After</th>
                  <th className="px-5 py-3.5">Total Cost</th>
                  <th className="px-5 py-3.5">Paid</th>
                  <th className="px-5 py-3.5">Outstanding</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Invoice</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => {
                  const hasList = r.productsList && r.productsList.length > 1;
                  const rowKey = `${r.purchaseId}-${i}`;

                  const totalStocksIn = hasList
                    ? r.productsList!.reduce((sum: number, p: any) => sum + p.receivedStocks, 0)
                    : (r.productsList?.[0]?.receivedStocks ?? r.receivedStocks);

                  const firstProd = r.productsList?.[0] || {};
                  // Compute total stock after across all items (purchases are always increments, returns are decrements)
                  const totalStockAfterSupp = (() => {
                    const prods = r.productsList;
                    if (!prods || prods.length === 0) {
                      const sb = r.stocksBefore;
                      if (sb === null || sb === undefined) return null;
                      return r.type === 'RETURN' ? (sb - totalStocksIn) : (sb + totalStocksIn);
                    }
                    let total = 0;
                    for (const p of prods) {
                      if (p.stocksBefore === null || p.stocksBefore === undefined) return null;
                      total += r.type === 'RETURN' ? (p.stocksBefore - p.receivedStocks) : (p.stocksBefore + p.receivedStocks);
                    }
                    return total;
                  })();

                  return (
                    <Fragment key={rowKey}>
                      <tr className="hover:bg-indigo-50/20 transition-colors border-l-[3px] border-l-indigo-400">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black text-slate-400 font-mono">#{r.uiId}</span>
                            {(r.version || (r.datas && r.datas.version)) && (
                              <span className="text-[9px] font-bold text-[var(--at-version-tx)] bg-[var(--at-version-bg)] border border-[var(--at-version-bd)] px-1.5 py-0.5 rounded-xl uppercase tracking-wider shrink-0">
                                {r.version || r.datas?.version}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <TypeBadge type={r.type || "PURCHASE"} labelOverride={r.type === 'DIRECT' ? 'Purchase' : (r.type || '').replace(/_/g, ' ')} />
                        </td>
                        <td className="px-5 py-4">
                          {hasList ? (
                            <div className="flex flex-col gap-1 max-w-[240px]">
                              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap truncate" title={firstProd.productName || r.productName}>
                                {firstProd.productName || r.productName}
                              </span>
                              {firstProd.variant_details || firstProd.batch_details || firstProd.serial_info ? (
                                <RichProductDetails p={firstProd} />
                              ) : (
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  {(firstProd.variant || r.variant) && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100 truncate">V: {getVariantName(firstProd.variant || r.variant)}</span>}
                                  {(firstProd.batch || r.batch) && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 truncate">B: {getBatchName(firstProd.batch || r.batch)}</span>}
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecord(r);
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors shrink-0 shadow-sm"
                                title="View Items"
                              >
                                <ChevronRight size={10} strokeWidth={3} />
                                <span>+ {r.productsList!.length - 1} more</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 max-w-[350px]">
                              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap truncate" title={firstProd.productName || r.productName}>
                                {firstProd.productName || r.productName}
                              </span>
                              {firstProd.variant_details || firstProd.batch_details || firstProd.serial_info ? (
                                <RichProductDetails p={firstProd} />
                              ) : (
                                <>
                                  {(firstProd.variant || r.variant) && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100 truncate">V: {getVariantName(firstProd.variant || r.variant)}</span>}
                                  {(firstProd.batch || r.batch) && <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 truncate">B: {getBatchName(firstProd.batch || r.batch)}</span>}
                                  {((firstProd.serials || r.serials) && (firstProd.serials || r.serials)!.length > 0) && (
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                      <span className="text-[9px] text-slate-400 font-bold">SN: </span>
                                      {(firstProd.serials || r.serials)!.slice(0, 2).map((s: any, si: number) => (
                                        <span key={si} className="text-[9px] font-mono font-bold text-slate-500">{typeof s === 'object' ? ((s as any).name || (s as any).id) : s}{si === 0 && (firstProd.serials || r.serials)!.length > 1 ? ',' : ''}</span>
                                      ))}
                                      {(firstProd.serials || r.serials)!.length > 2 && <span className="text-[9px] font-bold text-slate-400">+{(firstProd.serials || r.serials)!.length - 2}</span>}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-black text-sm tabular-nums text-center bg-slate-50/40">
                          <span className={r.type === 'RETURN' ? 'text-rose-600' : 'text-emerald-600'}>
                            {r.type === 'RETURN' ? '-' : '+'}{totalStocksIn}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center font-bold text-blue-600 tabular-nums">
                          {totalStockAfterSupp !== null ? totalStockAfterSupp : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                          ₹{r.totalCost || 0}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-emerald-600">
                          ₹{r.amountPaid || 0}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-rose-600">
                          ₹{r.outstandingAmount || 0}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md w-fit ${
                                r.paymentMethod?.toLowerCase() === 'outstanding' ? 'bg-rose-50 text-rose-700' :
                                r.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-700' :
                                r.paymentMethod === 'UPI' ? 'bg-violet-50 text-violet-700' :
                                'bg-slate-50 text-slate-600'
                              }`}>{r.paymentMethod}</span>
                            {(r.totalCost || 0) - (r.amountPaid || 0) > 0 ? (
                              <span className="text-[9px] text-rose-500 font-bold">Left: ₹{(r.totalCost || 0) - (r.amountPaid || 0)}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {r.invoiceNo}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                          {r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-4">
                          {onNavigateToPurchase && (
                            <button
                              onClick={() => onNavigateToPurchase(r.purchaseId)}
                              title="View Purchase Detail"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-100 transition-all active:scale-95 shadow-sm"
                            >
                              <Eye size={13} strokeWidth={2.5} />
                            </button>
                          )}
                        </td>
                      </tr>

                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <GroupedItemsDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} type="supplier_purchase" />
    </div>
  );
}

// ─── Fragment Import ──────────────────────────────────────────────────────────

interface CustomerPurchasesTableProps {
  rows: any[];
  loading: boolean;
  onNavigateToSale?: (id: string) => void;
}

function LocalStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Partial: "bg-blue-50 text-blue-600 border-blue-100",
    Pending: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorMap[status] ?? "bg-slate-50 text-slate-500 border-slate-100"
        }`}
    >
      {status}
    </span>
  );
}

export function CustomerPurchasesTable({ rows, loading, onNavigateToSale }: CustomerPurchasesTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading order records...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center">
            <ShoppingCart size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Orders Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">When this customer makes a purchase, it will appear here.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">Invoice Identity</th>
                  <th className="px-5 py-3.5">Order Date</th>
                  <th className="px-5 py-3.5">Qty</th>
                  <th className="px-5 py-3.5">Financials</th>
                  <th className="px-5 py-3.5">Payment Summary</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                  <th className="px-5 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((order, i) => {
                  const date = order.created_at || order.date
                    ? new Date(order.created_at || order.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                    : '—';
                  const total = Number(order.calculation_infos?.total ?? order.total_sellprice ?? order.grand_total ?? order.total_amount ?? 0);
                  const products = order.items || order.products || [];
                  const itemCount = order.item_infos?.total_order_qty ?? order.total_quantity ?? products.length;
                  const unit = products[0]?.product?.unit || products[0]?.unit || products[0]?.datas?.unit || (itemCount === 1 ? "Item" : "Units");
                  const invoiceId = order.ui_id ? `Order #${order.ui_id}` : `#${order.id.slice(0, 8).toUpperCase()}`;

                  return (
                    <tr key={`${order.id}-${i}`} className="hover:bg-indigo-50/20 transition-colors border-l-[3px] border-l-indigo-400">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <FileText size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 font-mono tracking-tight">{invoiceId}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{order.type || "NORMAL"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {date}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-black text-slate-500">
                            {itemCount} {unit}
                          </span>
                          {products.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecord({
                                  uiId: order.ui_id || order.id.slice(0, 8).toUpperCase(),
                                  type: order.type === 'Return' ? 'RETURN' : order.type,
                                  productsList: products.map((p: any) => ({
                                    name: p.product?.name || p.name || p.product_name,
                                    receivedStocks: p.quantity || 0,
                                    sellPrice: p.sellprice || p.price,
                                    variant: p.variant || p.variant_details || p.variant_infos?.variant_name,
                                    batch: p.batch || p.batch_details || p.batch_infos?.batch_name,
                                    serials: p.serials || p.serial_info?.serial_numbers || (p.serialno_infos ? p.serialno_infos.map((x: any) => x.name) : undefined),
                                  }))
                                });
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm"
                              title="View Items"
                            >
                              <ChevronRight size={10} strokeWidth={3} />
                              <span>View Items</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-black text-sm text-slate-800 tabular-nums">
                        ₹{total.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1.5">
                          {order.payments && Object.entries(order.payments).map(([mode, amount]) => {
                            const uMode = mode.toUpperCase();
                            const isCredit = uMode === 'CREDIT' || uMode === 'ON_CREDIT';
                            const isCash = uMode === 'CASH';
                            return (
                              <div key={mode} className={`px-2 py-0.5 rounded text-[9px] font-black border flex items-center gap-1.5 ${isCredit ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  isCash ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-violet-50 text-violet-600 border-violet-100'
                                }`}>
                                <div className={`w-1 h-1 rounded-full ${isCredit ? 'bg-blue-400' :
                                    isCash ? 'bg-emerald-400' :
                                      'bg-violet-400'
                                  }`} />
                                {uMode === 'ON_CREDIT' ? 'CREDIT' : uMode}
                                <span className="ml-0.5">₹{Number(amount).toLocaleString('en-IN')}</span>
                              </div>
                            );
                          })}
                          {!order.payments && <span className="text-[9px] font-bold text-slate-300 italic">No payment record</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <LocalStatusBadge status={order.status || "Pending"} />
                      </td>
                      <td className="px-5 py-4">
                        {onNavigateToSale && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onNavigateToSale(order.id); }}
                            title="View Sale Detail"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 border border-blue-100 transition-all active:scale-95 shadow-sm"
                          >
                            <Eye size={13} strokeWidth={2.5} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <GroupedItemsDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} type="purchase" />
    </div>
  );
}

// ─── CUSTOMER COLLECTIONS TABLE ──────────────────────────────────────────────
interface CustomerCollectionsTableProps {
  rows: any[];
  loading: boolean;
}

export function CustomerCollectionsTable({ rows, loading }: CustomerCollectionsTableProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading collection history...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-24 text-center">
            <Banknote size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Collections Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">When you record a payment for this customer, it will appear here.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">Invoice / Ref No</th>
                  <th className="px-5 py-3.5">Payment Date</th>
                  <th className="px-5 py-3.5">Cleared Amount</th>
                  <th className="px-5 py-3.5">Balance Transition</th>
                  <th className="px-5 py-3.5">Payment Breakdown</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((h, i) => {
                  const date = h.created_at
                    ? new Date(h.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                    : '—';
                  const paymentInfosArray = Array.isArray(h.payment_infos) ? h.payment_infos : [];
                  const calculatedCleared = paymentInfosArray.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
                  const rawCleared = h.cleared_amount ?? h.additional_infos?.paid_amount ?? (calculatedCleared > 0 ? calculatedCleared : (h.cleared_infos ? (Number(h.cleared_infos.outstanding_before || 0) - Number(h.cleared_infos.outstanding_after || 0)) : 0));
                  const clearedAmount = Math.max(0, Number(rawCleared || 0));
                  const refIdRaw = h.invoice_no || h.ref_no || h.entity_id || h.id;
                  const refId = refIdRaw ? (String(refIdRaw).startsWith('#') ? refIdRaw : `#${String(refIdRaw).padStart(3, '0')}`) : `#${String(h.id).padStart(3, '0')}`;
                  const outstandingBefore = Number(h.cleared_infos?.outstanding_before ?? h.outstanding_before ?? 0);
                  const outstandingAfter = Number(h.cleared_infos?.outstanding_after ?? h.outstanding_after ?? 0);

                  const paymentsObj: Record<string, number> = {};
                  if (Array.isArray(h.payment_infos)) {
                    h.payment_infos.forEach((p: any) => {
                      if (p && p.method) {
                        paymentsObj[p.method] = (paymentsObj[p.method] || 0) + Number(p.amount || 0);
                      }
                    });
                  } else if (h.payments) {
                    Object.entries(h.payments).forEach(([k, v]) => {
                      paymentsObj[k] = Number(v);
                    });
                  }

                  return (
                    <tr key={`${h.id}-${i}`} className="hover:bg-indigo-50/20 transition-colors border-l-[3px] border-l-emerald-500">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700 font-mono tracking-tight">{refId}</span>
                          {h.notes && <span className="text-[9px] font-bold text-slate-400 mt-0.5 truncate max-w-[120px]" title={h.notes}>{h.notes}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {date}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-black text-sm text-slate-800 tabular-nums">
                        ₹{clearedAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5 text-sm">
                          <span className="font-black text-slate-800 line-through decoration-slate-500 decoration-2">₹{outstandingBefore.toLocaleString('en-IN')}</span>
                          <ArrowRight className="w-4 h-4 text-slate-600 stroke-[4px]" />
                          <span className="font-black text-emerald-700">₹{outstandingAfter.toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.keys(paymentsObj).length > 0 && Object.entries(paymentsObj).map(([method, amount]) => (
                            <div key={method} className="px-2 py-0.5 rounded text-[9px] font-black border border-slate-100 bg-slate-50 text-slate-600 flex items-center gap-1">
                              <span className="opacity-60 uppercase">{method}</span>
                              <span>₹{Number(amount).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100">
                          Cleared
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
