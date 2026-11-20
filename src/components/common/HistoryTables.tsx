import { ArrowUp, ArrowDown, ShoppingCart, TrendingUp, RefreshCcw, FileText, ArrowRight, Banknote, Eye, ChevronRight, X, Layers, Hash, Zap, RotateCw, Printer, RotateCcw, Receipt } from "lucide-react";
import { TypeBadge } from "@/components/common/SuperUI";
import { useState, Fragment, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { BiLogoWhatsapp } from "react-icons/bi";
import { AntBadge, PaymentStatusBadge } from "@/components/ui/AntBadge";
import { getSaleQuantityDisplay, extractSaleCustomerInfo } from "@/features/sales/type";
import { ReprintReceiptModal } from "@/features/sales/components/ReprintReceiptModal";
import { SaleInvoiceModal } from "@/features/sales/components/SaleInvoiceModal";
import { ReturnModal } from "@/features/sales/components/ReturnOrderFlow";

const formatStockValue = (val: number | null | undefined) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  const n = Number(val);
  if (Math.abs(n % 1) < 0.0001) return Math.round(n).toString();
  return Number(n.toFixed(2)).toString();
};

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
              {isAdjustment ? 'Stock Movement' : (record.uiId ? `Purchase ${record.uiId}` : 'Purchase Details')}
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
                        {isDec ? '-' : '+'}{formatStockValue(p.receivedStocks)}
                      </span>
                      {stockVal !== null && (
                        <span className="text-[10px] font-bold text-blue-600 mt-0.5 tabular-nums">Stock: {formatStockValue(stockVal)}</span>
                      )}
                    </div>
                  </div>
                  
                  {(p.variant || p.batch || (p.serials && p.serials.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                      {p.variant && (
                        <AntBadge variant="at-variant" type="tag" icon={<Layers size={10} />}>
                          {getVariantName(p.variant)}
                        </AntBadge>
                      )}
                      {p.batch && (
                        <AntBadge variant="at-batch" type="tag" icon={<Hash size={10} />}>
                          {getBatchName(p.batch)}
                        </AntBadge>
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
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
                      {p.buyPrice !== undefined && (() => {
                        const bpNum = Number(p.buyPrice);
                        const gstRate = record.gst || 0;
                        const gstAmt = bpNum * (gstRate / 100);
                        const total = bpNum + gstAmt;
                        return (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Buy Price</span>
                            {gstRate > 0 ? (
                              <>
                                <span className="text-xs font-bold text-slate-700 flex items-baseline gap-1">
                                  ₹{total.toFixed(2).replace(/\.00$/, '')}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none">
                                  ₹{bpNum.toFixed(2).replace(/\.00$/, '')} + ₹{gstAmt.toFixed(2).replace(/\.00$/, '')} GST
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-slate-700">₹{bpNum.toFixed(2).replace(/\.00$/, '')}</span>
                            )}
                          </div>
                        );
                      })()}
                      {p.sellPrice !== undefined && (() => {
                        const spNum = Number(p.sellPrice);
                        const gstRate = record.gst || 0;
                        const gstAmt = spNum * (gstRate / 100);
                        const total = spNum + gstAmt;
                        return (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sell Price</span>
                            {gstRate > 0 ? (
                              <>
                                <span className="text-xs font-bold text-emerald-700 flex items-baseline gap-1">
                                  ₹{total.toFixed(2).replace(/\.00$/, '')}
                                </span>
                                <span className="text-[10px] text-emerald-600/70 font-medium mt-0.5 leading-none">
                                  ₹{spNum.toFixed(2).replace(/\.00$/, '')} + ₹{gstAmt.toFixed(2).replace(/\.00$/, '')} GST
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600">₹{spNum.toFixed(2).replace(/\.00$/, '')}</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-white pb-[max(16px,env(safe-area-inset-bottom))]">
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
        <div className="mt-1 space-y-2.5">
          <AntBadge variant="at-variant" type="tag">V: {getVariantName(p.variant_details?.variant_name || p.variant)}</AntBadge>
        </div>
      )}
      
      {p.batch_details && (
        <div className="mt-1 space-y-1.5">
          <div className="bg-slate-50 p-2 rounded border border-slate-100 w-full text-[10px] text-slate-650 shadow-sm">
            <div className="flex justify-between items-center font-bold">
              <AntBadge variant="at-batch" type="tag">B: {p.batch_details.batch_name || p.batch || "Default"}</AntBadge>
              <span className="text-indigo-600">Qty: {formatStockValue(p.receivedStocks)}</span>
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
          <>
            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {rows.map((r, i) => {
                const hasList = r.productsList && r.productsList.length > 1;
                const rowKey = `m-${r.id}-${i}`;
                const totalStocksIn = hasList
                  ? r.productsList!.reduce((sum, p) => sum + p.receivedStocks, 0)
                  : (r.productsList?.[0]?.receivedStocks ?? r.receivedStocks);
                const firstProd = r.productsList?.[0];
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
                  <div
                    key={rowKey}
                    onClick={() => onViewDetails?.(r.id)}
                    className={`p-3.5 space-y-2 border-l-[3px] ${r.source === 'purchase' ? 'border-l-indigo-400' : r.isInc ? 'border-l-emerald-400' : 'border-l-rose-400'} ${onViewDetails ? 'active:bg-slate-50 cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <TypeBadge type={r.displayType} icon={r.isInc ? ArrowUp : ArrowDown} />
                        <span className="text-[11px] text-slate-400 font-medium">
                          {r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-black tabular-nums ${r.isInc ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {r.isInc ? '+' : '-'}{formatStockValue(totalStocksIn)}
                        </div>
                        <div className="text-[10px] font-bold text-blue-600 tabular-nums">
                          After: {currentStockVal !== null ? formatStockValue(currentStockVal) : '—'}
                        </div>
                      </div>
                    </div>
                    {firstProd?.name && (
                      <p className="text-xs font-semibold text-slate-800 truncate">{firstProd.name}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(firstProd?.variant || r.variant) && <AntBadge variant="at-variant" type="tag">V: {getVariantName(firstProd?.variant || r.variant)}</AntBadge>}
                      {(firstProd?.batch || r.batch) && <AntBadge variant="at-batch" type="tag">B: {getBatchName(firstProd?.batch || r.batch)}</AntBadge>}
                      {hasList && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100"
                        >
                          <ChevronRight size={10} strokeWidth={3} />
                          + {r.productsList!.length - 1} more
                        </button>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">{r.description}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:inline-block min-w-full align-middle">
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
                              {(firstProd?.variant || r.variant) && <AntBadge variant="at-variant" type="tag">V: {getVariantName(firstProd?.variant || r.variant)}</AntBadge>}
                              {(firstProd?.batch || r.batch) && <AntBadge variant="at-batch" type="tag">B: {getBatchName(firstProd?.batch || r.batch)}</AntBadge>}
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
                            {r.isInc ? '+' : '-'}{formatStockValue(totalStocksIn)}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center font-bold text-blue-600 tabular-nums">
                          {currentStockVal !== null ? formatStockValue(currentStockVal) : '—'}
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
          </>
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
          <>
            {/* Mobile Cards View (ProductPurchasesTable) */}
            <div className="md:hidden divide-y divide-slate-100">
              {rows.map((r, i) => {
                const hasList = r.productsList && r.productsList.length > 1;
                const rowKey = `mp-${r.id}-${i}`;
                const totalStocksIn = hasList
                  ? r.productsList!.reduce((sum: number, p: any) => sum + p.receivedStocks, 0)
                  : (r.productsList?.[0]?.receivedStocks ?? r.receivedStocks);
                const firstProd = r.productsList?.[0] || {};
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
                const rawBuyPrice = firstProd.buyPrice ?? r.buyPrice;
                const rawSellPrice = firstProd.sellPrice ?? r.sellPrice;

                return (
                  <div
                    key={rowKey}
                    onClick={() => onNavigateToPurchase?.(r.id)}
                    className={`p-3.5 space-y-2 border-l-[3px] border-l-indigo-400 ${onNavigateToPurchase ? 'active:bg-indigo-50/30 cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-black text-indigo-600 font-mono">{r.uiId || r.id}</span>
                          {r.invoiceNo && r.invoiceNo !== '—' && <span className="text-[10px] font-mono text-slate-400">• {r.invoiceNo}</span>}
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{r.description.replace('Supplier: ', '')}</p>
                        <p className="text-[11px] text-slate-400">{r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-black tabular-nums ${r.type === 'RETURN' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {r.type === 'RETURN' ? '-' : '+'}{formatStockValue(totalStocksIn)}
                        </div>
                        <div className="text-[10px] font-bold text-blue-600 tabular-nums">
                          After: {totalStockAfterProd !== null ? formatStockValue(totalStockAfterProd) : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(firstProd.variant || r.variant) && <AntBadge variant="at-variant" type="tag">V: {getVariantName(firstProd.variant || r.variant)}</AntBadge>}
                        {(firstProd.batch || r.batch) && <AntBadge variant="at-batch" type="tag">B: {getBatchName(firstProd.batch || r.batch)}</AntBadge>}
                        {hasList && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100"
                          >
                            <ChevronRight size={10} strokeWidth={3} />
                            + {r.productsList!.length - 1} more
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{r.paymentMethod}</span>
                    </div>
                    {!hasList && (rawBuyPrice !== undefined || rawSellPrice !== undefined) && (
                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                        <div><span className="text-slate-400">Buy:</span> <span className="font-bold text-slate-700">{rawBuyPrice !== undefined ? `₹${Number(rawBuyPrice).toFixed(2).replace(/\.00$/, '')}` : '—'}</span></div>
                        <div><span className="text-slate-400">Sell:</span> <span className="font-bold text-emerald-700">{rawSellPrice !== undefined ? `₹${Number(rawSellPrice).toFixed(2).replace(/\.00$/, '')}` : '—'}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">Purchase ID</th>
                  <th className="px-5 py-3.5">Invoice No</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Variant / Batch</th>
                  <th className="px-5 py-3.5 text-center">Stock In/Out</th>
                  <th className="px-5 py-3.5 text-center">Stock After</th>
                  <th className="px-5 py-3.5">Buy Price</th>
                  <th className="px-5 py-3.5">Sell Price</th>
                  <th className="px-5 py-3.5">Payment</th>
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

                  // Buy Price calculations
                  const rawBuyPrice = firstProd.buyPrice ?? r.buyPrice;
                  let buyPriceContent = <span className="text-slate-300">—</span>;
                  if (!hasList && rawBuyPrice !== undefined) {
                    const bpNum = Number(rawBuyPrice);
                    const gstRate = r.gst || 0;
                    if (gstRate > 0) {
                      const gstAmt = bpNum * (gstRate / 100);
                      const total = bpNum + gstAmt;
                      buyPriceContent = (
                        <div className="flex flex-col">
                          <span className="flex items-baseline gap-1">
                            ₹{total.toFixed(2).replace(/\.00$/, '')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none">
                            ₹{bpNum.toFixed(2).replace(/\.00$/, '')} + ₹{gstAmt.toFixed(2).replace(/\.00$/, '')} GST
                          </span>
                        </div>
                      );
                    } else {
                      buyPriceContent = <span>₹{bpNum.toFixed(2).replace(/\.00$/, '')}</span>;
                    }
                  }

                  // Sell Price calculations
                  const rawSellPrice = firstProd.sellPrice ?? r.sellPrice;
                  let sellPriceContent = <span className="text-slate-300">—</span>;
                  if (!hasList && rawSellPrice !== undefined) {
                    const spNum = Number(rawSellPrice);
                    const gstRate = r.gst || 0;
                    if (gstRate > 0) {
                      const taxable = spNum / (1 + gstRate / 100);
                      const gstAmt = spNum - taxable;
                      sellPriceContent = (
                        <div className="flex flex-col">
                          <span className="flex items-baseline gap-1">
                            ₹{spNum.toFixed(2).replace(/\.00$/, '')}
                          </span>
                          <span className="text-[10px] text-emerald-600/70 font-medium mt-0.5 leading-none">
                            ₹{taxable.toFixed(2).replace(/\.00$/, '')} + ₹{gstAmt.toFixed(2).replace(/\.00$/, '')} GST
                          </span>
                        </div>
                      );
                    } else {
                      sellPriceContent = <span>₹{spNum.toFixed(2).replace(/\.00$/, '')}</span>;
                    }
                  }

                  return (
                    <Fragment key={rowKey}>
                      <tr className="hover:bg-indigo-50/20 transition-colors border-l-[3px] border-l-indigo-400">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black text-indigo-600 font-mono">{r.uiId || r.id}</span>
                            {(r.version || (r.datas && r.datas.version)) && (
                              <AntBadge variant="meta-version" type="tag">
                                {r.version || r.datas?.version}
                              </AntBadge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-mono font-semibold text-slate-600">
                          {r.invoiceNo && r.invoiceNo !== '—' ? r.invoiceNo : '—'}
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-slate-700 max-w-[150px] truncate" title={r.description}>
                          {r.description.replace('Supplier: ', '')}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                          {r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-4">
                          {hasList ? (
                            <div className="flex flex-col gap-1 max-w-[200px]">
                              {firstProd.variant_details || firstProd.batch_details || firstProd.serial_info ? (
                                <RichProductDetails p={firstProd} />
                              ) : (
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  {(firstProd.variant || r.variant) && <AntBadge variant="at-variant" type="tag">V: {getVariantName(firstProd.variant || r.variant)}</AntBadge>}
                                  {(firstProd.batch || r.batch) && <AntBadge variant="at-batch" type="tag">B: {getBatchName(firstProd.batch || r.batch)}</AntBadge>}
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
                                  {(firstProd.variant || r.variant) && <AntBadge variant="at-variant" type="tag">V: {getVariantName(firstProd.variant || r.variant)}</AntBadge>}
                                  {(firstProd.batch || r.batch) && <AntBadge variant="at-batch" type="tag">B: {getBatchName(firstProd.batch || r.batch)}</AntBadge>}
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
                            {r.type === 'RETURN' ? '-' : '+'}{formatStockValue(totalStocksIn)}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center font-bold text-blue-600 tabular-nums">
                          {totalStockAfterProd !== null ? formatStockValue(totalStockAfterProd) : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-slate-700 align-top">
                          {buyPriceContent}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-emerald-700 align-top">
                          {sellPriceContent}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md w-fit ${
                                r.paymentMethod?.toLowerCase() === 'outstanding' ? 'bg-rose-50 text-rose-700' :
                                r.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-700' :
                                r.paymentMethod === 'UPI' ? 'bg-violet-50 text-violet-700' :
                                'bg-slate-50 text-slate-600'
                              }`}>{r.paymentMethod}</span>
                          </div>
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
          </>
        )}
      </div>
      <GroupedItemsDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} type="purchase" />
    </div>
  );
}


const AmountWithReturnHover = ({
  total,
  returns,
  refundAmount,
}: {
  total: number;
  returns?: any[];
  refundAmount?: number;
}) => {
  const totalReturn =
    ((returns || []).reduce((sum: number, ret: any) => {
      let rGst = Number(ret.total_gst_amount || ret.gst_amount || ret.payment_infos?.gst_amount || 0);
      let rVal = Number(
        ret.payment_infos?.return_value ||
        ret.total_refund_amount ||
        ret.refund_amount ||
        ret.return_value ||
        ret.totalAmount ||
        ret.amount ||
        ret.total_cost ||
        ret.return_cost ||
        0
      );
      if (rGst === 0 && Array.isArray(ret.items)) {
        rGst = ret.items.reduce((s: number, itm: any) => {
          const q = Number(itm.entered_qty || itm.quantity || 0);
          const p = Number(itm.buy_price || itm.price || 0);
          const g = parseFloat(String(itm.gst || itm.gst_rate || 0).replace(/[^0-9.]/g, "")) || 0;
          return s + (q * p * (g / 100));
        }, 0);
      }
      const itemsBase = Array.isArray(ret.items)
        ? ret.items.reduce(
            (s: number, itm: any) =>
              s +
              Number(itm.entered_qty || itm.quantity || 0) *
                Number(itm.buy_price || itm.price || 0),
            0
          )
        : 0;
      if (rGst > 0 && (rVal <= itemsBase || rVal === 0)) {
        rVal = (itemsBase || rVal) + rGst;
      }
      return sum + rVal;
    }, 0) || 0) + Number(refundAmount || 0);

  const formatAmount = (val: number) => {
    return Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (totalReturn === 0) {
    return (
      <span className="font-mono text-xs font-bold text-slate-700 tabular-nums">
        ₹{formatAmount(total)}
      </span>
    );
  }

  const netAmount = Math.max(0, total - totalReturn);

  return (
    <div className="relative group inline-flex items-center gap-1.5 cursor-help">
      <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
        ₹{formatAmount(netAmount)}
      </span>

      <div className="w-3.5 h-3.5 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center shrink-0">
        <RotateCw size={8} />
      </div>

      {/* Dark Tooltip */}
      <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 rounded-lg shadow-xl border border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] text-left flex flex-col p-3 pointer-events-none">
        <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-1">
          <span>Original</span>
          <span className="tabular-nums font-mono">₹{formatAmount(total)}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-rose-400 mb-1.5">
          <span>Returned</span>
          <span className="tabular-nums font-mono">- ₹{formatAmount(totalReturn)}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-bold text-white border-t border-slate-700 pt-2 mt-0.5">
          <span>Net</span>
          <span className="tabular-nums font-mono">₹{formatAmount(netAmount)}</span>
        </div>
      </div>
    </div>
  );
};

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
          <>
            {/* Mobile Cards View (SupplierPurchasesTable) */}
            <div className="md:hidden divide-y divide-slate-100">
              {rows.map((r, i) => {
                const hasList = r.productsList && r.productsList.length > 1;
                const rowKey = `ms-${r.purchaseId}-${i}`;
                const totalStocksIn = hasList
                  ? r.productsList!.reduce((sum: number, p: any) => sum + p.receivedStocks, 0)
                  : (r.productsList?.[0]?.receivedStocks ?? r.receivedStocks);
                const firstProd = r.productsList?.[0] || {};
                const fullTotal = Number(r.totalAmount ?? r.grandTotal ?? r.totalCost ?? 0);
                const currentOutstanding = r.outstandingAmount ?? Math.max(0, fullTotal - (r.amountPaid || 0));

                return (
                  <div
                    key={rowKey}
                    onClick={() => onNavigateToPurchase?.(r.purchaseId)}
                    className={`p-3.5 space-y-2 border-l-[3px] border-l-indigo-400 ${onNavigateToPurchase ? 'active:bg-indigo-50/30 cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-black text-indigo-600 font-mono">{r.uiId}</span>
                          {(r.type === 'RETURN' || r.type === 'PURCHASE_RETURN') && <AntBadge variant="tx-sales-return" type="tag">Return</AntBadge>}
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{firstProd.productName || r.productName}</p>
                        <p className="text-[11px] text-slate-400">
                          {r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          {r.invoiceNo && r.invoiceNo !== '—' ? ` • Inv: ${r.invoiceNo}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-800 tabular-nums">
                          <AmountWithReturnHover total={fullTotal} returns={r.returns} refundAmount={r.refundAmount} />
                        </div>
                        <div className={`text-[10px] font-bold tabular-nums ${r.type === 'RETURN' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {r.type === 'RETURN' ? '-' : '+'}{totalStocksIn} units
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">Paid: ₹{Number(r.amountPaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        {currentOutstanding > 0 && <span className="text-rose-600 font-bold">Due: ₹{Number(currentOutstanding).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasList && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100"
                          >
                            +{r.productsList!.length - 1} more
                          </button>
                        )}
                        <PaymentStatusBadge
                          status={r.paymentStatus || r.payment_status}
                          outstanding={currentOutstanding}
                          grandTotal={fullTotal}
                          amountPaid={r.amountPaid}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:inline-block min-w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 text-[9px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <th className="px-5 py-3.5">Purchase ID</th>
                  <th className="px-5 py-3.5">Invoice</th>
                  <th className="px-5 py-3.5">Ref/Transaction Number</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5 text-center">Stock In/Out</th>
                  <th className="px-5 py-3.5 text-center">Stock After</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Paid</th>
                  <th className="px-5 py-3.5">Outstanding</th>
                  <th className="px-5 py-3.5">Payment</th>
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

                  const fullTotal = Number(r.totalAmount ?? r.grandTotal ?? r.totalCost ?? 0);
                  const currentOutstanding = r.outstandingAmount ?? Math.max(0, fullTotal - (r.amountPaid || 0));

                  return (
                    <Fragment key={rowKey}>
                      <tr className="hover:bg-indigo-50/20 transition-colors border-l-[3px] border-l-indigo-400">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black text-indigo-600 font-mono">{r.uiId}</span>
                            {(r.version || (r.datas && r.datas.version)) && (
                              <AntBadge variant="meta-version" type="tag">
                                {r.version || r.datas?.version}
                              </AntBadge>
                            )}
                            {(r.type === 'RETURN' || r.type === 'PURCHASE_RETURN') && (
                              <AntBadge variant="tx-sales-return" type="tag">
                                Return
                              </AntBadge>
                            )}
                            {((r.returns?.length || 0) > 0) && (
                              <AntBadge variant="tx-sales-return" type="tag">
                                Returned
                              </AntBadge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {r.invoiceNo}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {r.referenceNo}
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
                                  {(firstProd.variant || r.variant) && <AntBadge variant="at-variant" type="tag">V: {getVariantName(firstProd.variant || r.variant)}</AntBadge>}
                                  {(firstProd.batch || r.batch) && <AntBadge variant="at-batch" type="tag">B: {getBatchName(firstProd.batch || r.batch)}</AntBadge>}
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
                                  {(firstProd.variant || r.variant) && <AntBadge variant="at-variant" type="tag">V: {getVariantName(firstProd.variant || r.variant)}</AntBadge>}
                                  {(firstProd.batch || r.batch) && <AntBadge variant="at-batch" type="tag">B: {getBatchName(firstProd.batch || r.batch)}</AntBadge>}
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
                          <AmountWithReturnHover total={fullTotal} returns={r.returns} refundAmount={r.refundAmount} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-emerald-600">
                          ₹{Number(r.amountPaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-rose-600">
                          ₹{Number(currentOutstanding).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <PaymentStatusBadge
                            status={r.paymentStatus || r.payment_status}
                            outstanding={currentOutstanding}
                            grandTotal={fullTotal}
                            amountPaid={r.amountPaid}
                          />
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
          </>
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
  customer?: any;
  onRefresh?: () => void;
}

type BadgeConfig = { cls: string; dot: string };

const ORIGIN_CFG: Record<string, BadgeConfig> = {
  "Offline": { cls: "bg-[var(--mv-sales-bg)] text-[var(--mv-sales-tx)] border border-[var(--mv-sales-bd)]", dot: "bg-[var(--mv-sales-dot)]" },
  "Offline Return": { cls: "bg-[var(--mv-sreturn-bg)] text-[var(--mv-sreturn-tx)] border border-[var(--mv-sreturn-bd)]", dot: "bg-[var(--mv-sreturn-dot)]" },
  "Online": { cls: "bg-[var(--mv-sales-bg)] text-[var(--mv-sales-tx)] border border-[var(--mv-sales-bd)]", dot: "bg-[var(--mv-sales-dot)]" },
};

const PAYMENT_CFG: Record<string, BadgeConfig> = {
  Cash: { cls: "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]", dot: "bg-[var(--pay-paid-dot)]" },
  Card: { cls: "bg-[var(--mv-sreturn-bg)] text-[var(--mv-sreturn-tx)] border border-[var(--mv-sreturn-bd)]", dot: "bg-[var(--mv-sreturn-dot)]" },
  UPI: { cls: "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]", dot: "bg-[var(--pay-paid-dot)]" },
  "G-Pay": { cls: "bg-[var(--mv-sales-bg)] text-[var(--mv-sales-tx)] border border-[var(--mv-sales-bd)]", dot: "bg-[var(--mv-sales-dot)]" },
  PhonePe: { cls: "bg-[var(--mv-sreturn-bg)] text-[var(--mv-sreturn-tx)] border border-[var(--mv-sreturn-bd)]", dot: "bg-[var(--mv-sreturn-dot)]" },
  Credit: { cls: "bg-[var(--ps-draft-bg)] text-[var(--ps-draft-tx)] border border-[var(--ps-draft-bd)]", dot: "bg-[var(--ps-draft-dot)]" },
  "On Credit": { cls: "bg-[var(--ps-draft-bg)] text-[var(--ps-draft-tx)] border border-[var(--ps-draft-bd)]", dot: "bg-[var(--ps-draft-dot)]" },
  Other: { cls: "bg-[var(--pay-pending-bg)] text-[var(--pay-pending-tx)] border border-[var(--pay-pending-bd)]", dot: "bg-[var(--pay-pending-dot)]" },
};

const STATUS_CFG: Record<string, BadgeConfig> = {
  Completed: { cls: "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]", dot: "bg-[var(--ps-completed-dot)]" },
  Delivered: { cls: "bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]", dot: "bg-[var(--ps-completed-dot)]" },
  Pending: { cls: "bg-[var(--ps-draft-bg)] text-[var(--ps-draft-tx)] border border-[var(--ps-draft-bd)]", dot: "bg-[var(--ps-draft-dot)]" },
  Cancelled: { cls: "bg-[var(--ps-cancel-bg)] text-[var(--ps-cancel-tx)] border border-[var(--ps-cancel-bd)]", dot: "bg-[var(--ps-cancel-dot)]" },
  Returned: { cls: "bg-[var(--ps-cancel-bg)] text-[var(--ps-cancel-tx)] border border-[var(--ps-cancel-bd)]", dot: "bg-[var(--ps-cancel-dot)]" },
};

const PillBadge: React.FC<{ cls: string; dot: string; label: string }> = ({ cls, dot, label }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cls}`}>
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
    {label}
  </span>
);

const fmtCurrency = (n?: number) => {
  if (n === undefined || n === null || isNaN(Number(n))) return "₹0";
  const num = Number(n);
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
};

function parseSaleDateTime(dateVal?: any): Date {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  let str = String(dateVal).trim().replace(" ", "T");
  if (str.includes("T") && !str.endsWith("Z") && !str.includes("+") && !/[0-9]-[0-9]{2}:[0-9]{2}$/.test(str)) {
    const utcDate = new Date(str + "Z");
    if (!isNaN(utcDate.getTime())) return utcDate;
  }
  const parsed = new Date(str.includes("T") ? str : str + "T00:00:00");
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function fmtDate(dateVal?: any) {
  if (!dateVal) return "—";
  const d = parseSaleDateTime(dateVal);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(dateVal?: any) {
  if (!dateVal) return "";
  const d = parseSaleDateTime(dateVal);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function checkSaleDiscount(s: any): { hasDiscount: boolean; discountAmount: number } {
  if (!s) return { hasDiscount: false, discountAmount: 0 };
  const calc = s.calculation_infos || s.calculations || s.calc_infos;
  
  let discAmt = 0;
  if (calc) {
    discAmt = Number(calc.total_discount_given ?? calc.discount_total ?? calc.total_discount ?? 0);
    if (discAmt <= 0) {
      const pDisc = Number(calc.product_discount_total || 0);
      const lDisc = Number(calc.line_discount_total || 0);
      const bDisc = Number(calc.bill_discount_total || 0);
      discAmt = pDisc + lDisc + bDisc;
    }
  }

  if (discAmt <= 0) {
    discAmt = Number(s.discount_amount ?? s.total_discount ?? s.discount ?? s.charges_infos?.discount ?? 0);
  }

  let hasDiscFromItems = false;
  const items = Array.isArray(calc?.items) ? calc.items : (Array.isArray(s.items) ? s.items : []);
  if (items.length > 0) {
    for (const it of items) {
      const itDiscAmt = Number(it.product_discount_amount || 0) +
        Number(it.line_discount_amount || 0) +
        Number(it.bill_discount_share || 0) +
        Number(it.discount_amount || 0);
      const itDiscPct = Number(it.discount_percent || 0) +
        Number(it.line_discount_value || 0) +
        Number(it.product_discount_percent || 0);
      if (itDiscAmt > 0 || itDiscPct > 0) {
        hasDiscFromItems = true;
        if (discAmt <= 0 && itDiscAmt > 0) {
          discAmt += itDiscAmt;
        }
      }
    }
  }

  const hasDiscount = discAmt > 0 || hasDiscFromItems;
  return { hasDiscount, discountAmount: discAmt };
}

const parsePaymentMethods = (order: any): string[] => {
  let pm = order.payment_method;
  if (!pm && Array.isArray(order.payment_infos) && order.payment_infos.length > 0) {
    pm = order.payment_infos.map((p: any) => p.method || p.mode).filter(Boolean).join(", ");
  }
  if (!pm && order.additional_infos?.payment_method) {
    pm = order.additional_infos.payment_method;
  }
  if (!pm) pm = "Cash";

  const rawList = String(pm).split(",").map((s) => s.trim()).filter(Boolean);
  if (rawList.length === 0) return ["Cash"];

  return rawList.map((m) => {
    const upper = m.toUpperCase();
    if (upper === "CASH") return "Cash";
    if (upper.includes("CREDIT") || upper.includes("ON_CREDIT")) return "On Credit";
    if (upper === "CARD") return "Card";
    if (upper === "UPI") return "UPI";
    if (upper === "GPAY" || upper === "G-PAY") return "G-Pay";
    if (upper === "PHONEPE") return "PhonePe";
    return m;
  });
};

export function CustomerPurchasesTable({ rows, loading, onNavigateToSale, customer, onRefresh }: CustomerPurchasesTableProps) {
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [reprintSale, setReprintSale] = useState<any | null>(null);
  const [invoiceModalSale, setInvoiceModalSale] = useState<any | null>(null);
  const [returnSale, setReturnSale] = useState<any | null>(null);

  const customerMap = useMemo(() => {
    if (!customer) return {};
    const cData = (customer as any).datas || customer;
    const cId = (customer as any).id || cData.id;
    const map: Record<string, any> = {};
    if (cId) map[cId] = cData;
    return map;
  }, [customer]);

  const handleSendWhatsApp = useCallback((sale: any) => {
    const c = extractSaleCustomerInfo(sale, customerMap);
    const fallbackPhone = (customer as any)?.mobile_number || (customer as any)?.datas?.mobile_number || (customer as any)?.phone;
    const phoneToUse = c.phone || fallbackPhone || "";
    let phoneNum = phoneToUse.replace(/[^0-9]/g, "");
    if (!phoneNum) {
      alert("No phone number found for this customer.");
      return;
    }
    if (phoneNum.length === 10) {
      phoneNum = "91" + phoneNum;
    }

    const orderId = sale.ui_id || sale.id;
    const total = Number(sale.total_sellprice || 0).toLocaleString("en-IN");
    const items = Array.isArray(sale.items) ? sale.items : [];
    const itemsText = items.slice(0, 3).map((it: any) => `• ${it.name || "Item"} x ${it.quantity || 1}`).join("\n");
    const moreCount = items.length > 3 ? `\n...and ${items.length - 3} more item(s)` : "";
    const shopName = localStorage.getItem("shop_name") || "Our Store";

    const isInvoice = Boolean(
      (sale as any).billing_type === "INVOICE" ||
      sale.additional_infos?.billing_type === "INVOICE" ||
      sale.calculation_infos?.billing_type === "INVOICE" ||
      sale.additional_infos?.is_invoice === true ||
      sale.calculation_infos?.is_invoice === true ||
      sale.is_invoice === true ||
      sale.invoice_no
    );

    const title = isInvoice ? "Tax Invoice" : "Bill Receipt";
    const customerName = c.name || (customer as any)?.name || (customer as any)?.datas?.name || "Customer";
    const text = `*${shopName}* - ${title}\n--------------------------------\n*Order ID:* ${orderId}\n*Customer:* ${customerName}\n*Total Amount:* ₹${total}\n*Status:* ${sale.status || "Completed"}\n--------------------------------\n*Items:*\n${itemsText}${moreCount}\n--------------------------------\nThank you for shopping with us!`;

    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, [customerMap, customer]);

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
            <Receipt size={36} className="mx-auto text-slate-200 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Orders Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">When this customer makes a purchase, it will appear here.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {rows.map((order, i) => {
                const dateStr = fmtDate(order.created_at || order.date);
                const timeStr = fmtTime(order.created_at || order.date);
                let total = Number(order.calculation_infos?.total ?? order.total_sellprice ?? order.item_infos?.total_order_amount ?? order.grand_total ?? order.total_amount ?? order.total ?? 0);
                if (Array.isArray(order.exchanges) && order.exchanges.length > 0) {
                  let totalReplacements = 0;
                  let totalExchangedReturns = 0;
                  order.exchanges.forEach((exch: any) => {
                    let repVal = Number(exch.total_replacement_amount || 0);
                    const repItems = exch.replaced_items || exch.replacement_items || [];
                    if (repVal === 0 && repItems.length > 0) {
                      repItems.forEach((r: any) => {
                        const rQty = Number(r.entered_qty ?? r.quantity ?? 1);
                        repVal += Number(r.total_amount ?? ((r.sell_price || 0) * rQty));
                      });
                    }
                    totalReplacements += repVal;

                    let exchVal = Number(exch.total_exchanged_amount || 0);
                    const retItems = exch.items || exch.exchange_items || exch.returned_items || [];
                    if (exchVal === 0 && retItems.length > 0) {
                      retItems.forEach((r: any) => {
                        const rQty = Number(r.quantity || 1);
                        exchVal += Number(r.exchange_amount ?? r.total_amount ?? ((r.sell_price || 0) * rQty));
                      });
                    }
                    totalExchangedReturns += exchVal;
                  });
                  if (totalReplacements > 0 || totalExchangedReturns > 0) {
                    total = Math.max(0, total - totalExchangedReturns + totalReplacements);
                  }
                }
                if (Array.isArray(order.returns) && order.returns.length > 0) {
                  let totalRefunds = 0;
                  order.returns.forEach((ret: any) => { totalRefunds += Number(ret.total_return_cost ?? ret.total_cost ?? 0); });
                  total = Math.max(0, total - totalRefunds);
                }

                const products = order.items || order.products || order.datas?.items || order.datas?.products || [];
                const orderId = order.ui_id || (order.id ? order.id.slice(0, 8).toUpperCase() : "—");
                const qtyInfo = getSaleQuantityDisplay(order);

                const itemExchangedCount = (order.items || []).filter((it: any) => it.status === "EXCHANGED").length;
                const topLevelExchangeCount = Array.isArray((order as any).exchanges) ? (order as any).exchanges.length : 0;
                const exchangedCount = itemExchangedCount + topLevelExchangeCount;

                const isExchangeOrder =
                  (typeof (order as any).origin === 'string' && (order as any).origin.toLowerCase().includes('exchange')) ||
                  !!(order as any).is_exchange ||
                  !!(order as any).exchange_type ||
                  (order as any).order_type === 'EXCHANGE' ||
                  (order as any).type === 'exchange';

                const hasReturns =
                  (order.returns && order.returns.length > 0) ||
                  (order.items || []).some((it: any) => (it.returned_quantity && it.returned_quantity > 0) || it.status === "REFUNDED" || it.status === "EXCHANGED") ||
                  order.status === "Returned" ||
                  order.status === "RETURNED" ||
                  order.origin === "Offline Return" ||
                  order.origin === "Sales Return" ||
                  (order as any).type === "RETURN" ||
                  (order as any).order_type === "RETURN";
                const hasDiscount = checkSaleDiscount(order).hasDiscount;
                const refundedCount = (order.items || []).filter((it: any) => it.status === "REFUNDED").length;

                const isInvoiceOrder = Boolean(
                  (order as any).billing_type === "INVOICE" ||
                  (order as any).additional_infos?.billing_type === "INVOICE" ||
                  (order as any).calculation_infos?.billing_type === "INVOICE" ||
                  (order as any).additional_infos?.is_invoice === true ||
                  (order as any).calculation_infos?.is_invoice === true ||
                  (order as any).is_invoice === true ||
                  Boolean((order as any).invoice_no)
                );

                const rowCustomer = extractSaleCustomerInfo(order, customerMap);
                const phoneAvailable = Boolean(rowCustomer.phone || (customer as any)?.mobile_number || (customer as any)?.datas?.mobile_number);
                const canDownloadInvoice = isInvoiceOrder;
                const canSendWhatsApp = isInvoiceOrder && phoneAvailable;

                const origin = order.origin || "Offline";
                const oCfg = ORIGIN_CFG[origin] || ORIGIN_CFG["Offline"];
                const pMethods = parsePaymentMethods(order);
                const sStatus = order.status || "Completed";
                const statusCfg = STATUS_CFG[sStatus] || STATUS_CFG["Pending"];

                return (
                  <div
                    key={`mc-${order.id}-${i}`}
                    onClick={() => onNavigateToSale ? onNavigateToSale(order.id) : navigate(`/sales/${order.id}`)}
                    className="p-3.5 space-y-2.5 border-l-[3px] border-l-indigo-400 hover:bg-slate-50/50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-800 font-mono">{orderId}</span>
                          {isInvoiceOrder && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                              Invoice
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {dateStr}{timeStr ? ` • ${timeStr}` : ''}
                        </p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {isExchangeOrder && <AntBadge variant="tx-sales" type="tag">Exchanged</AntBadge>}
                          {hasReturns && !isExchangeOrder && <AntBadge variant="tx-sales-return" type="tag">Returned</AntBadge>}
                          {refundedCount > 0 && <AntBadge variant="pay-partial" type="tag">{refundedCount} Refunded</AntBadge>}
                          {exchangedCount > 0 && <AntBadge variant="tx-sales" type="tag">{exchangedCount} Exchanged</AntBadge>}
                          {hasDiscount && <AntBadge variant="tx-purchase" type="tag">Discounted</AntBadge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 tabular-nums block font-mono">
                          {fmtCurrency(total)}
                        </span>
                        <PillBadge cls={statusCfg.cls} dot={statusCfg.dot} label={sStatus} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <PillBadge cls={oCfg.cls} dot={oCfg.dot} label={origin} />
                        {pMethods.map((m: string) => {
                          const pCfg = PAYMENT_CFG[m] || PAYMENT_CFG["Other"];
                          return <PillBadge key={m} cls={pCfg.cls} dot={pCfg.dot} label={m} />;
                        })}
                        <span
                          onClick={(e) => {
                            if (products.length > 0) {
                              e.stopPropagation();
                              setSelectedRecord({
                                uiId: orderId,
                                type: order.type === 'Return' ? 'RETURN' : order.type,
                                productsList: products.map((p: any) => {
                                  const calcItem = order.calculation_infos?.items?.find((ci: any) => ci.product_id === p.product_id || ci.product_id === p.inventory_id);
                                  return {
                                    name: p.product?.name || p.name || p.product_name || p.datas?.product_name || p.datas?.name || calcItem?.name || "Unknown Item",
                                    receivedStocks: p.quantity || p.qty || calcItem?.qty || 0,
                                    sellPrice: p.sellprice || p.sell_price || p.price || calcItem?.price || 0,
                                    variant: p.variant || p.variant_details || p.variant_infos?.variant_name,
                                    batch: p.batch || p.batch_details || p.batch_infos?.batch_name,
                                    serials: p.serials || p.serial_info?.serial_numbers || (p.serialno_infos ? p.serialno_infos.map((x: any) => x.name) : undefined),
                                  };
                                })
                              });
                            }
                          }}
                          className={`px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 ${products.length > 0 ? "cursor-pointer hover:bg-slate-200" : ""}`}
                        >
                          {qtyInfo.primaryText}
                        </span>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setReprintSale(order)}
                          className="p-1.5 text-sky-500 hover:bg-sky-50 rounded-md transition-colors"
                          title="Reprint Bill"
                        >
                          <Printer size={14} />
                        </button>
                        {canDownloadInvoice && (
                          <button
                            onClick={() => setInvoiceModalSale(order)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Download Tax Invoice"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                        {canSendWhatsApp && (
                          <button
                            onClick={() => handleSendWhatsApp(order)}
                            className="p-1.5 text-[#25D366] hover:bg-emerald-50 rounded-md transition-colors"
                            title="Direct WhatsApp Invoice"
                          >
                            <BiLogoWhatsapp size={15} />
                          </button>
                        )}
                        {order.status === "Completed" && order.origin !== "Offline Return" && order.origin !== "Sales Return" && (
                          <button
                            onClick={() => setReturnSale(order)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                            title="Process Return"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => onNavigateToSale ? onNavigateToSale(order.id) : navigate(`/sales/${order.id}`)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <table className="w-full border-collapse table-fixed relative min-w-[850px] hidden md:table">
              <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e2e8f0]">
                <tr>
                  <th className="w-[130px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Order ID</th>
                  <th className="w-[90px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Origin</th>
                  <th className="w-[100px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Payment</th>
                  <th className="w-[110px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Date</th>
                  <th className="w-[85px] px-3 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-center">Qty</th>
                  <th className="w-[100px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-right">Amount</th>
                  <th className="w-[100px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-left">Status</th>
                  <th className="w-[140px] px-4 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((order, index) => {
                  const dateStr = fmtDate(order.created_at || order.date);
                  const timeStr = fmtTime(order.created_at || order.date);
                  let total = Number(order.calculation_infos?.total ?? order.total_sellprice ?? order.item_infos?.total_order_amount ?? order.grand_total ?? order.total_amount ?? order.total ?? 0);
                  if (Array.isArray(order.exchanges) && order.exchanges.length > 0) {
                    let totalReplacements = 0;
                    let totalExchangedReturns = 0;
                    order.exchanges.forEach((exch: any) => {
                      let repVal = Number(exch.total_replacement_amount || 0);
                      const repItems = exch.replaced_items || exch.replacement_items || [];
                      if (repVal === 0 && repItems.length > 0) {
                        repItems.forEach((r: any) => {
                          const rQty = Number(r.entered_qty ?? r.quantity ?? 1);
                          repVal += Number(r.total_amount ?? ((r.sell_price || 0) * rQty));
                        });
                      }
                      totalReplacements += repVal;

                      let exchVal = Number(exch.total_exchanged_amount || 0);
                      const retItems = exch.items || exch.exchange_items || exch.returned_items || [];
                      if (exchVal === 0 && retItems.length > 0) {
                        retItems.forEach((r: any) => {
                          const rQty = Number(r.quantity || 1);
                          exchVal += Number(r.exchange_amount ?? r.total_amount ?? ((r.sell_price || 0) * rQty));
                        });
                      }
                      totalExchangedReturns += exchVal;
                    });
                    if (totalReplacements > 0 || totalExchangedReturns > 0) {
                      total = Math.max(0, total - totalExchangedReturns + totalReplacements);
                    }
                  }
                  if (Array.isArray(order.returns) && order.returns.length > 0) {
                    let totalRefunds = 0;
                    order.returns.forEach((ret: any) => {
                      totalRefunds += Number(ret.total_return_cost ?? ret.total_cost ?? 0);
                    });
                    total = Math.max(0, total - totalRefunds);
                  }

                  const products = order.items || order.products || order.datas?.items || order.datas?.products || [];
                  const orderId = order.ui_id || (order.id ? order.id.slice(0, 8).toUpperCase() : "—");
                  const qtyInfo = getSaleQuantityDisplay(order);

                  const itemExchangedCount = (order.items || []).filter((it: any) => it.status === "EXCHANGED").length;
                  const topLevelExchangeCount = Array.isArray((order as any).exchanges) ? (order as any).exchanges.length : 0;
                  const exchangedCount = itemExchangedCount + topLevelExchangeCount;

                  const isExchangeOrder =
                    (typeof (order as any).origin === 'string' && (order as any).origin.toLowerCase().includes('exchange')) ||
                    !!(order as any).is_exchange ||
                    !!(order as any).exchange_type ||
                    (order as any).order_type === 'EXCHANGE' ||
                    (order as any).type === 'exchange';

                  const hasReturns =
                    (order.returns && order.returns.length > 0) ||
                    (order.items || []).some((it: any) => (it.returned_quantity && it.returned_quantity > 0) || it.status === "REFUNDED" || it.status === "EXCHANGED") ||
                    order.status === "Returned" ||
                    order.status === "RETURNED" ||
                    order.origin === "Offline Return" ||
                    order.origin === "Sales Return" ||
                    (order as any).type === "RETURN" ||
                    (order as any).order_type === "RETURN";
                  const hasDiscount = checkSaleDiscount(order).hasDiscount;
                  const refundedCount = (order.items || []).filter((it: any) => it.status === "REFUNDED").length;

                  const isInvoiceOrder = Boolean(
                    (order as any).billing_type === "INVOICE" ||
                    (order as any).additional_infos?.billing_type === "INVOICE" ||
                    (order as any).calculation_infos?.billing_type === "INVOICE" ||
                    (order as any).additional_infos?.is_invoice === true ||
                    (order as any).calculation_infos?.is_invoice === true ||
                    (order as any).is_invoice === true ||
                    Boolean((order as any).invoice_no)
                  );

                  const rowCustomer = extractSaleCustomerInfo(order, customerMap);
                  const phoneAvailable = Boolean(rowCustomer.phone || (customer as any)?.mobile_number || (customer as any)?.datas?.mobile_number);
                  const canDownloadInvoice = isInvoiceOrder;
                  const canSendWhatsApp = isInvoiceOrder && phoneAvailable;

                  const origin = order.origin || "Offline";
                  const oCfg = ORIGIN_CFG[origin] || ORIGIN_CFG["Offline"];
                  const pMethods = parsePaymentMethods(order);
                  const sStatus = order.status || "Completed";
                  const statusCfg = STATUS_CFG[sStatus] || STATUS_CFG["Pending"];

                  return (
                    <tr
                      key={order.id || index}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                      onClick={() => onNavigateToSale ? onNavigateToSale(order.id) : navigate(`/sales/${order.id}`)}
                    >
                      {/* ORDER ID */}
                      <td className="px-4 py-4 border-b border-slate-50">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] font-semibold text-slate-800">{orderId}</span>
                            {isInvoiceOrder && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                                Invoice
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {isExchangeOrder && <AntBadge variant="tx-sales" type="tag">Exchanged</AntBadge>}
                            {hasReturns && !isExchangeOrder && <AntBadge variant="tx-sales-return" type="tag">Returned</AntBadge>}
                            {refundedCount > 0 && <AntBadge variant="pay-partial" type="tag">{refundedCount} Refunded</AntBadge>}
                            {exchangedCount > 0 && <AntBadge variant="tx-sales" type="tag">{exchangedCount} Exchanged</AntBadge>}
                            {hasDiscount && <AntBadge variant="tx-purchase" type="tag">Discounted</AntBadge>}
                          </div>
                        </div>
                      </td>

                      {/* ORIGIN */}
                      <td className="px-4 py-4 border-b border-slate-50">
                        <PillBadge cls={oCfg.cls} dot={oCfg.dot} label={origin} />
                      </td>

                      {/* PAYMENT */}
                      <td className="px-4 py-4 border-b border-slate-50">
                        <div className="flex flex-wrap gap-1">
                          {pMethods.map((m: string) => {
                            const pCfg = PAYMENT_CFG[m] || PAYMENT_CFG["Other"];
                            return <PillBadge key={m} cls={pCfg.cls} dot={pCfg.dot} label={m} />;
                          })}
                        </div>
                      </td>

                      {/* DATE */}
                      <td className="px-4 py-4 border-b border-slate-50">
                        <div>
                          <span className="font-mono text-[11px] text-slate-700 block font-medium">{dateStr}</span>
                          {timeStr && <span className="text-[10px] text-slate-400 block">{timeStr}</span>}
                        </div>
                      </td>

                      {/* QTY */}
                      <td className="px-3 py-4 border-b border-slate-50 text-center">
                        <div
                          className={`flex flex-col items-center justify-center ${products.length > 0 ? "cursor-pointer group/qty" : "cursor-default"}`}
                          title={qtyInfo.tooltipText}
                          onClick={(e) => {
                            if (products.length > 0) {
                              e.stopPropagation();
                              setSelectedRecord({
                                uiId: order.ui_id || (order.id ? order.id.slice(0, 8).toUpperCase() : ""),
                                type: order.type === 'Return' ? 'RETURN' : order.type,
                                productsList: products.map((p: any) => {
                                  const calcItem = order.calculation_infos?.items?.find((ci: any) => ci.product_id === p.product_id || ci.product_id === p.inventory_id);
                                  return {
                                    name: p.product?.name || p.name || p.product_name || p.datas?.product_name || p.datas?.name || calcItem?.name || "Unknown Item",
                                    receivedStocks: p.quantity || p.qty || calcItem?.qty || 0,
                                    sellPrice: p.sellprice || p.sell_price || p.price || calcItem?.price || 0,
                                    variant: p.variant || p.variant_details || p.variant_infos?.variant_name,
                                    batch: p.batch || p.batch_details || p.batch_infos?.batch_name,
                                    serials: p.serials || p.serial_info?.serial_numbers || (p.serialno_infos ? p.serialno_infos.map((x: any) => x.name) : undefined),
                                  };
                                })
                              });
                            }
                          }}
                        >
                          <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap group-hover/qty:text-indigo-600 transition-colors">
                            {qtyInfo.primaryText}
                          </span>
                          {qtyInfo.subText && (
                            <span className="text-[9.5px] font-medium text-slate-500 truncate max-w-[110px] block leading-tight mt-0.5">
                              {qtyInfo.subText}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AMOUNT */}
                      <td className="px-4 py-4 border-b border-slate-50 text-right">
                        <span className="font-mono text-xs font-bold text-slate-900">{fmtCurrency(total)}</span>
                        {Number((order as any).delivery_fee || 0) > 0 && (
                          <span className="text-[10px] text-slate-400 block font-normal leading-tight mt-0.5">
                            +₹{Number((order as any).delivery_fee).toFixed(0)} delivery
                          </span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-4 border-b border-slate-50">
                        <PillBadge cls={statusCfg.cls} dot={statusCfg.dot} label={sStatus} />
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-4 border-b border-slate-50 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setReprintSale(order)}
                            className="text-sky-500 hover:text-sky-600 hover:bg-sky-50 rounded-md p-1.5 transition-colors cursor-pointer"
                            title="Reprint Bill"
                          >
                            <Printer size={15} />
                          </button>
                          {canDownloadInvoice && (
                            <button
                              onClick={() => setInvoiceModalSale(order)}
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md p-1.5 transition-colors cursor-pointer"
                              title="Download Tax Invoice"
                            >
                              <FileText size={15} />
                            </button>
                          )}
                          {canSendWhatsApp && (
                            <button
                              onClick={() => handleSendWhatsApp(order)}
                              className="text-[#25D366] hover:text-[#1ebd5a] hover:bg-emerald-50 rounded-md p-1.5 transition-colors cursor-pointer"
                              title="Direct WhatsApp Invoice"
                            >
                              <BiLogoWhatsapp size={16} />
                            </button>
                          )}
                          {order.status === "Completed" && order.origin !== "Offline Return" && order.origin !== "Sales Return" && (
                            <button
                              onClick={() => setReturnSale(order)}
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-md p-1.5 transition-colors cursor-pointer"
                              title="Process Return"
                            >
                              <RotateCcw size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => onNavigateToSale ? onNavigateToSale(order.id) : navigate(`/sales/${order.id}`)}
                            className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md p-1.5 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Grouped Items Drawer */}
      <GroupedItemsDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} type="purchase" />

      {/* Reprint Receipt Modal */}
      {reprintSale && (
        <ReprintReceiptModal
          isOpen={Boolean(reprintSale)}
          onClose={() => setReprintSale(null)}
          sale={reprintSale}
          customerMap={customerMap}
        />
      )}

      {/* Tax Invoice Modal */}
      {invoiceModalSale && (
        <SaleInvoiceModal
          isOpen={Boolean(invoiceModalSale)}
          onClose={() => setInvoiceModalSale(null)}
          sale={invoiceModalSale}
          customerMap={customerMap}
        />
      )}

      {/* Return Modal */}
      {returnSale && (
        <ReturnModal
          sale={returnSale}
          onClose={() => setReturnSale(null)}
          onRefresh={() => {
            setReturnSale(null);
            onRefresh?.();
          }}
          productMap={{}}
        />
      )}
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
          <>
            {/* Mobile Cards View (CustomerCollectionsTable) */}
            <div className="md:hidden divide-y divide-slate-100">
              {rows.map((h, i) => {
                const date = h.created_at
                  ? new Date(h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—';
                const paymentInfosArray = Array.isArray(h.payment_infos) ? h.payment_infos : [];
                const calculatedCleared = paymentInfosArray.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
                const rawCleared = h.cleared_amount ?? h.additional_infos?.paid_amount ?? (calculatedCleared > 0 ? calculatedCleared : (h.cleared_infos ? (Number(h.cleared_infos.outstanding_before || 0) - Number(h.cleared_infos.outstanding_after || 0)) : 0));
                const clearedAmount = Math.max(0, Number(rawCleared || 0));
                const refIdRaw = h.invoice_no || h.ref_no || h.entity_id || h.id;
                const refId = refIdRaw ? String(refIdRaw).replace(/^#+/, '') : String(h.id).padStart(3, '0');
                const outstandingBefore = Number(h.cleared_infos?.outstanding_before ?? h.outstanding_before ?? 0);
                const outstandingAfter = Number(h.cleared_infos?.outstanding_after ?? h.outstanding_after ?? 0);

                return (
                  <div key={`mcol-${h.id}-${i}`} className="p-3.5 space-y-2 border-l-[3px] border-l-emerald-500">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-slate-800 font-mono">{refId}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{date}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 tabular-nums block">₹{clearedAmount.toLocaleString('en-IN')}</span>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100">Cleared</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500 line-through">₹{outstandingBefore.toLocaleString('en-IN')}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-bold text-emerald-700">₹{outstandingAfter.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:inline-block min-w-full align-middle">
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
                  const refId = refIdRaw ? String(refIdRaw).replace(/^#+/, '') : String(h.id).padStart(3, '0');
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
          </>
        )}
      </div>
    </div>
  );
}
