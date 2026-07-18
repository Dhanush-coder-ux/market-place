import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  X, ArrowUp, ArrowDown,
  User, TrendingUp, TrendingDown, Activity,
  Bookmark, Filter,
  FileText, Layers, Hash, Zap, Copy, ExternalLink,
  ChevronRight, Eye, Trash2
} from "lucide-react";

import { GradientButton } from "@/components/ui/GradientButton";
import { StatCard } from "@/components/common/StatsCard";
import { TypeBadge } from "@/components/common/SuperUI";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { useNavigate, useLocation } from "react-router-dom";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { useToast } from "@/context/ToastContext";
import { createPortal } from "react-dom";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { stockMovAdjApi } from "@/services/api/stockMovAdj";
import SkeletonLoader from "@/components/common/SkeletonLoader";

// ─── Types & Interfaces ──────────────────────────────────────────────────────

export type MovementType = "OPENING" | "PURCHASE" | "SALES" | "TRANSFER" | "STOCK_ADJUSTMENT" | "PO_PURCHASE" | "PRODUCTION" | "SALE_RETURN";
export type StatusType = "Completed" | "Pending";

export interface Movement {
  id: string;
  fullId?: string;
  product: string;
  sku: string;
  type: MovementType;
  qty: number;
  stocks_before?: number;
  source: string;
  destination: string;
  ref: string;
  date: string;
  status: StatusType;
  user: string;
  notes: string;
  variant?: string;
  batch?: string;
  expiry_date?: string;
  manufacturing_date?: string;
  serial_numbers?: string[];
  current_stock?: number;
  productsList?: any[];
  skuLabel?: string;
  skuValue?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const WAREHOUSES = ["All Locations", "Warehouse A", "Warehouse B", "Store Front", "Cold Storage", "Returns Depot"];
const MOVEMENT_TYPES = ["All", "PURCHASE", "SALES", "ONLINE_SALES", "OFFLINE_SALES", "ADJUSTMENT", "SALES_RETURN"];


// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDate(dateStr: string) {
  return dateStr.slice(0, 10);
}

// Fixed styling helper to accommodate all MovementTypes

interface DetailDrawerProps {
  movement: Movement;
  onClose: () => void;
}

function DetailDrawer({ movement, onClose }: DetailDrawerProps) {
  const { showToast } = useToast();
  if (!movement) return null;

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!", "success");
  };

  const isPositive = movement.qty > 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
      <div
        className="relative w-full max-w-md bg-white border-l border-slate-200 h-full overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg ${isPositive ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'}`}>
              {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800  tracking-tight">Movement Detail</h3>
              <p className="text-[10px] text-slate-400 font-bold  ">REF: {movement.ref}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all border border-transparent hover:border-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-8">

          {/* Main Impact Hero */}
          <div className={`rounded-lg border-2 p-6 text-center space-y-4 shadow-sm transition-all ${isPositive ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-rose-50/50 border-rose-100/50'}`}>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400  tracking-[0.2em]">Net Stock Impact</p>
              <div className="flex items-center justify-center gap-3">
                <span className={`text-4xl font-black tabular-nums ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPositive ? `+${movement.qty}` : movement.qty}
                </span>
                <span className="text-slate-400 font-bold text-sm">Units</span>
              </div>
              {movement.current_stock !== undefined && (
                <p className="text-xs font-bold text-slate-500 mt-2">
                  Current Available Stock: <span className="text-slate-700">{movement.current_stock} units</span>
                </p>
              )}
            </div>

            {movement.stocks_before !== undefined && (
              <div className="grid grid-cols-3 gap-2 bg-white/80 p-3 rounded-lg border border-white shadow-sm">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-slate-400  tracking-tighter">Opening Stock</span>
                  <span className="text-xs font-bold text-slate-700">{movement.stocks_before}</span>
                </div>
                <div className="flex flex-col items-center border-x border-slate-100">
                  <span className={`text-[8px] font-black  tracking-tighter ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? "Stock In" : "Stock Out"}
                  </span>
                  <span className={`text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? `+${movement.qty}` : movement.qty}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-blue-400  tracking-tighter">Closing Stock</span>
                  <span className="text-xs font-bold text-blue-600">{(movement.stocks_before ?? 0) + movement.qty}</span>
                </div>
              </div>
            )}

            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-slate-100 shadow-sm">
              <TypeBadge type={movement.type} />
            </div>
          </div>

          {/* Structured Inventory Path */}
          <div className="space-y-4">
            {movement.productsList && movement.productsList.length > 1 ? (
              <>
                <h4 className="text-[10px] font-black text-slate-400 tracking-[0.2em] px-1">Grouped Items Specification ({movement.productsList.length})</h4>
                <div className="space-y-3">
                  {movement.productsList.map((p, idx) => {
                    const hasSpec = p.variant || p.batch || (p.serial_numbers && p.serial_numbers.length > 0);
                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-slate-100/55 hover:shadow-sm transition-all">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <div>
                            <p className="text-slate-800 font-bold text-xs leading-tight">{p.name}</p>
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">{p.skuLabel}: {p.skuValue}</span>
                          </div>
                          <span className={`text-xs font-black tabular-nums ${p.qty > 0 ? 'text-emerald-650' : 'text-rose-655'}`}>
                            {p.qty > 0 ? `+${p.qty}` : p.qty}
                          </span>
                        </div>
                        {hasSpec && (
                          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-200/50">
                            {p.variant && (
                              <div className="pl-2.5 border-l-2 border-violet-200">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100 text-[9px] font-black">
                                  Variant: {p.variant}
                                </span>
                              </div>
                            )}
                            {p.batch && (
                              <div className="pl-2.5 border-l-2 border-amber-200">
                                <div className="bg-white border border-slate-100 rounded p-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-800">Batch: {p.batch}</span>
                                    <span className={`text-[10px] font-black ${p.qty > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Qty: {p.qty}</span>
                                  </div>
                                  {(p.expiry_date || p.manufacturing_date) && (
                                    <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                                      {p.manufacturing_date && <span>MFG: {fmtDate(p.manufacturing_date)}</span>}
                                      {p.expiry_date && <span>EXP: {fmtDate(p.expiry_date)}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {p.serial_numbers && p.serial_numbers.length > 0 && (
                              <div className="pl-2.5 border-l-2 border-blue-200">
                                <div className="bg-white border border-slate-100 rounded p-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                  <p className="text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                    Serial Numbers
                                    <span className="bg-slate-100 text-slate-500 px-1 rounded-full text-[8px]">{p.serial_numbers.length}</span>
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {p.serial_numbers.map((sn: string, sIdx: number) => (
                                      <span key={sIdx} className="text-[9px] font-mono text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-bold">{sn}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <h4 className="text-[10px] font-black text-slate-400  tracking-[0.2em] px-1">Inventory Specification Path</h4>

                {/* Product Level */}
                <div className="relative pl-6 before:absolute before:left-[11px] before:top-8 before:bottom-0 before:w-0.5 before:bg-slate-100">
                  <div className="relative group mb-4">
                    <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 border-blue-500 bg-white z-10" />
                    <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-4 transition-all hover:bg-blue-50 hover:shadow-md hover:shadow-blue-500/5">
                      <div className="flex items-center gap-2 text-blue-600 font-black text-[10px]   mb-1">
                        <Layers size={12} /> Product Root
                      </div>
                      <p className="text-slate-800 font-bold text-base leading-tight">{movement.product}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">{movement.skuLabel}: {movement.skuValue}</span>
                        <button onClick={(e) => copyToClipboard(e, movement.id)} className="text-[9px] font-bold text-blue-500 hover:underline">Copy ID</button>
                      </div>
                    </div>
                  </div>

                  {/* Variant Level */}
                  {movement.variant && (
                    <div className="relative group mb-4">
                      <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 border-violet-500 bg-white z-10" />
                      <div className="bg-violet-50/40 border border-violet-100 rounded-lg p-4 ml-2 transition-all hover:bg-violet-50 hover:shadow-md hover:shadow-violet-500/5">
                        <div className="flex items-center gap-2 text-violet-600 font-black text-[10px]   mb-1">
                          <Activity size={12} /> Variant Configuration
                        </div>
                        <p className="text-slate-800 font-bold text-sm">{movement.variant}</p>
                      </div>
                    </div>
                  )}

                  {/* Batch Level */}
                  {movement.batch && (
                    <div className="relative group mb-4">
                      <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 border-amber-500 bg-white z-10" />
                      <div className="bg-amber-50/40 border border-amber-100 rounded-lg p-4 ml-4 transition-all hover:bg-amber-50 hover:shadow-md hover:shadow-amber-500/5">
                        <div className="flex items-center gap-2 text-amber-600 font-black text-[10px]   mb-1">
                          <Hash size={12} /> Batch Identifier
                        </div>
                        <p className="text-slate-800 font-bold text-sm mb-2">{movement.batch}</p>

                        {(movement.expiry_date || movement.manufacturing_date) && (
                          <div className="space-y-1.5 border-t border-amber-100 pt-2 mt-2">
                            {movement.manufacturing_date && (
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-amber-600/70 font-bold  tracking-tight">MFG Date</span>
                                <span className="text-slate-700 font-bold">{fmtDate(movement.manufacturing_date)}</span>
                              </div>
                            )}
                            {movement.expiry_date && (
                              <>
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-amber-600/70 font-bold  tracking-tight">EXP Date</span>
                                  <span className="text-slate-700 font-bold">{fmtDate(movement.expiry_date)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/50 rounded-lg px-2 py-1 mt-1">
                                  <span className="text-[9px] font-black text-rose-500  ">Remaining</span>
                                  <span className="text-[10px] font-black text-rose-600 tabular-nums">
                                    {(() => {
                                      const diff = new Date(movement.expiry_date).getTime() - new Date().getTime();
                                      const days = Math.ceil(diff / (1000 * 3600 * 24));
                                      return days > 0 ? `${days} Days` : "Expired";
                                    })()}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Serial Numbers Level */}
                  {movement.serial_numbers && movement.serial_numbers.length > 0 && (
                    <div className="relative group">
                      <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 border-emerald-500 bg-white z-10" />
                      <div className="bg-emerald-50/30 border border-emerald-100 rounded-lg p-4 ml-6 transition-all hover:bg-emerald-50/50 hover:shadow-md hover:shadow-emerald-500/5">
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px]   mb-3">
                          <Zap size={12} fill="currentColor" /> Unique Serials ({movement.serial_numbers.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                          {movement.serial_numbers.map((sn, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg bg-white border border-emerald-100 text-emerald-700 font-mono text-[10px] font-bold shadow-sm">
                              {sn}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Context Details */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400   mb-1.5">Source</p>
              <p className="text-slate-900 font-bold text-xs">{movement.source}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400   mb-1.5">Destination</p>
              <p className="text-slate-900 font-bold text-xs">{movement.destination}</p>
            </div>
          </div>

          {/* Timeline & Metadata */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-slate-400 border border-slate-200">🕐</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400  tracking-tight">Processed At</p>
                <span className="font-bold text-slate-700">{fmt(movement.date)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-slate-400 border border-slate-200">
                <User size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400  tracking-tight">Executed By</p>
                <span className="font-bold text-slate-700">{movement.user}</span>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {movement.notes && (
            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100/50">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px]   mb-2">
                <FileText size={14} /> Description / Reason
              </div>
              <p className="text-slate-700 text-xs leading-relaxed font-medium">{movement.notes}</p>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            Close View
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

function AddMovementModal({ onClose }: { onClose: () => void }) {
  // Use real types for the form dropdown
  const formTypes = ["PURCHASE", "PO_PURCHASE", "SALES", "TRANSFER", "STOCK_ADJUSTMENT", "SALE_RETURN"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Add Stock Movement</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {[
            ["Product Name / SKU", "text", "e.g. Wireless Headphones"],
            ["Movement Type", "select", formTypes],
            ["Quantity", "number", "e.g. 50"],
            ["Source Location", "select", WAREHOUSES.slice(1)],
            ["Destination", "select", WAREHOUSES.slice(1)],
            ["Reference", "text", "Order ID / Invoice ID"],
            ["Notes", "textarea", "Optional remarks"]
          ].map(([label, type, placeholder]) => (
            <div key={label as string}>
              <label className="block text-xs text-slate-500 font-semibold   mb-1.5">{label as string}</label>
              {type === "select" ? (
                <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all">
                  {(placeholder as string[]).map(o => <option value={o} key={o}>{o.replace('_', ' ')}</option>)}
                </select>
              ) : type === "textarea" ? (
                <textarea rows={2} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none shadow-sm transition-all" placeholder={placeholder as string} />
              ) : (
                <input type={type as string} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all" placeholder={placeholder as string} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors shadow-sm">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-md shadow-blue-500/20">Save Movement</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StockMovementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  const { setActions } = useHeader();
  const [search, setSearch] = useState(() => {
    return location.state?.product?.name || location.state?.product?.ui_id || "";
  });
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatus] = useState("All");
  const [warehouseFilter, setWH] = useState("All Locations");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedMvt, setSelected] = useState<Movement | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sortField, setSort] = useState<"date" | "qty">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { showToast } = useToast();

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!", "success");
  };



  // Dynamic Column State
  const [availableKeys] = useState<string[]>(["source", "destination", "user", "notes"]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('stock_movement_columns');
    const parsed = saved ? JSON.parse(saved) : ["user", "notes"];
    return parsed.filter((k: string) => k !== "sku" && k !== "ref");
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { getData } = useApi();

  // --- Header Actions ---
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}
        <button
          onClick={() => navigate("/stock-adjustment/drafts")}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-650 font-medium text-[12px] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Bookmark size={13} />
          Drafts
        </button>
        <GradientButton
          onClick={() => navigate("/stock-adjustment")}
          className="h-8 flex items-center px-4 text-[12px] rounded-md"
        >
          + Add Adjustment
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate, isCleanMode]);

  const { setBottomActions } = useHeader();
  const [selectedMovements, setSelectedMovements] = useState<Set<string>>(new Set());

  const toggleSelectMovement = (id: string) => {
    setSelectedMovements(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const [analyticsStats, setAnalyticsStats] = useState<any>(null);

  useEffect(() => {
    getData(ENDPOINTS.ANALYTICS_STOCKMOVADJ_OVERALL, { shop_id: SHOP_ID })
      .then((res) => {
        const data = res?.data ?? res;
        if (data) {
          setAnalyticsStats({ overview: { stock_adjustment: data } });
        }
      })
      .catch(() => {});
  }, [getData]);

  const handleBulkDelete = () => {
    if (selectedMovements.size === 0) return;
    if (window.confirm(`Are you sure you want to delete these ${selectedMovements.size} stock movements?`)) {
      alert("Delete stock movements requires admin privileges.");
    }
  };

  useEffect(() => {
    if (selectedMovements.size > 1) {
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              <Activity size={14} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">Selected {selectedMovements.size} Stock Movements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="h-8 px-3 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete All
            </button>
          </div>
        </div>
      );
    } else {
      setBottomActions(null);
    }
  }, [selectedMovements, setBottomActions]);

  const fetchPage = useCallback(async (limit: number, offset: number, filters: any) => {
    const params: any = { limit: limit.toString(), offset: offset.toString() };

    if (filters.search) params.q = filters.search;
    if (filters.type && filters.type !== "All") params.type = filters.type;
    if (filters.dateFrom) params.from_date = filters.dateFrom;
    if (filters.dateTo) params.to_date = filters.dateTo;

    // Use the new StockAdjMov service endpoint
    const adjRes = await stockMovAdjApi.getStockMovementsByShop(SHOP_ID, params);
    const aData: any[] = Array.isArray(adjRes?.data) ? adjRes.data : [];

    // Map type string to MovementType
    const mapType = (t: string): string => {
      return t ? t.toUpperCase() : "ADJUSTMENT";
    };

    const adjMovements: Movement[] = aData.map((a: any) => {
      const finalType = mapType(a.movement_type || a.type || "");
      const dateStr = String(a.created_at || new Date().toISOString());

      // Determine source/destination based on type
      let source = "System";
      let destination = "Warehouse";
      if (finalType.includes("SALES")) {
        source = finalType.includes("RETURN") ? "Customer" : "Warehouse";
        destination = finalType.includes("RETURN") ? "Warehouse" : "Customer";
      } else if (finalType.includes("PURCHASE") || finalType.includes("PO_")) {
        source = "Supplier";
        destination = "Warehouse";
      } else if (finalType.includes("ADJUSTMENT")) {
        source = "Stock";
        destination = "Adjusted";
      }

      const items: any[] = Array.isArray(a.products) ? a.products : (Array.isArray(a.items) ? a.items : []);
      const productsList = items.map((item: any) => {
        const isDecrement = item.type === "DECREMENT";
        const stocksAdj = item.stock_infos?.stocks || item.stocks_adjusted || item.stocks || 0;
        const stocksBefore = item.stock_infos?.stocks_before ?? item.stocks_before ?? 0;
        const stocksAfter = item.stock_infos?.stocks_after ?? item.stocks_after ?? 0;
        
        const qty = isDecrement ? -Math.abs(Number(stocksAdj)) : Math.abs(Number(stocksAdj));
        const rawSku = item.sku || item.datas?.sku || item.custom_fields?.sku || "";
        const uiId = item.ui_id || item.id || "";
        const hasSku = !!rawSku;
        const skuLabel = hasSku ? "SKU" : "ID";
        const skuValue = hasSku ? rawSku : uiId;

        return {
          name: item.name || item.product_id || item.inventory_id || "—",
          sku: item.ui_id || item.id?.slice(0, 8) || "",
          rawSku,
          uiId,
          skuLabel,
          skuValue,
          qty,
          stocks_before: Number(stocksBefore),
          current_stock: Number(stocksAfter),
          variant: item.variant_infos?.variant_name || item.variant || item.variant_id || "",
          batch: item.batch_infos?.batch_name || item.batch_infos?.name || item.batch || item.batch_id || "",
          serial_numbers: Array.isArray(item.serial_numbers) ? item.serial_numbers : (Array.isArray(item.serial_info) ? item.serial_info : []),
        };
      });

      const firstItem = productsList[0] ?? { name: "—", sku: "", skuLabel: "ID", skuValue: "", qty: 0, stocks_before: 0, current_stock: 0, variant: "", batch: "", serial_numbers: [] };
      const smId = a.stock_movement_id || a.id;

      return {
        id: a.ui_id || smId?.slice(0, 8).toUpperCase() || "—",
        fullId: smId,
        product: firstItem.name,
        sku: firstItem.sku,
        skuLabel: firstItem.skuLabel,
        skuValue: firstItem.skuValue,
        type: finalType as MovementType,
        qty: firstItem.qty,
        stocks_before: firstItem.stocks_before,
        source,
        destination,
        ref: a.ui_id ? `REF-${a.ui_id}` : (smId?.slice(0, 8).toUpperCase() || "—"),
        date: dateStr.includes("T") ? dateStr : dateStr + "T00:00:00",
        status: "Completed" as StatusType,
        user: String(a.added_by || "System"),
        notes: a.description || "",
        variant: firstItem.variant,
        batch: firstItem.batch,
        serial_numbers: firstItem.serial_numbers,
        current_stock: firstItem.current_stock,
        productsList,
      };
    });

    return {
      items: adjMovements,
      hasMore: aData.length === limit,
      stats: null,
      total: adjMovements.length
    };
  }, [getData]);


  const filters = useMemo(() => ({
    search: debouncedSearch,
    type: typeFilter,
    status: statusFilter,
    warehouse: warehouseFilter,
    dateFrom,
    dateTo,
    sortField,
    sortDir
  }), [debouncedSearch, typeFilter, statusFilter, warehouseFilter, dateFrom, dateTo, sortField, sortDir]);

  const { items: filtered, loading, loadingMore, hasMore, totalCount, lastElementRef } = useInfiniteScroll({
    fetchPage,
    filters,
    limit: 20
  });

  const pageData = filtered;

  const today = new Date().toISOString().slice(0, 10);
  const todayMvts = filtered.filter(m => fmtDate(m.date) === today);
  const totalIn = todayMvts.filter(m => ["PURCHASE", "PO_PURCHASE"].includes(m.type)).reduce((s, m) => s + m.qty, 0);
  const totalOut = todayMvts.filter(m => m.type === "SALES").reduce((s, m) => s + Math.abs(m.qty), 0);

  function toggleSort(field: "date" | "qty") {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(field); setSortDir("desc"); }
  }

  function resetFilters() {
    setSearch(""); setTypeFilter("All"); setStatus("All"); setWH("All Locations"); setDateFrom(""); setDateTo("");
  }



  const SortBtn = ({ field, label, align = "left" }: { field: "date" | "qty", label: string, align?: "left" | "right" }) => (
    <button onClick={() => toggleSort(field)} className={`flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors font-semibold group w-full ${align === "right" ? "justify-end" : "justify-start"}`}>
      <span>{label}</span>
      <span className={`transition-opacity ${sortField === field ? "opacity-100 text-blue-600" : "opacity-0 group-hover:opacity-40"}`}>
        {sortDir === "asc" && sortField === field ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
      </span>
    </button>
  );

  if (loading && pageData.length === 0) {
    return (
      <div className="flex-1 p-6">
        <SkeletonLoader variant="list" rows={8} showStats={true} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full overflow-hidden relative">
      <style>{`
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; }
        @keyframes slideIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }
        ::-webkit-scrollbar { width:6px; height:6px; } 
        ::-webkit-scrollbar-track { background:#f4f7fb } 
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px }
        ::-webkit-scrollbar-thumb:hover { background:#94a3b8; }
      `}</style>

      {/* ── Summary Cards ── */}
      {!isCleanMode && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          <StatCard
            label="Total Stock In"
            value={`+${analyticsStats?.overview?.stock_adjustment?.total_stockmovadj_increments ?? totalIn}`}
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            label="Total Stock Out"
            value={`-${analyticsStats?.overview?.stock_adjustment?.total_stockmovadj_decrements ?? totalOut}`}
            icon={TrendingDown}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
          <StatCard
            label="Total Adjustments"
            value={(analyticsStats?.overview?.stock_adjustment?.total_stockmovadj ?? filtered.length).toString()}
            icon={Activity}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
        </div>
      )}

      {/* ── Filter & Search Section ── */}
      <div className="bg-white border border-slate-100 rounded-lg p-2.5 px-3.5 flex flex-nowrap items-center gap-2 shadow-sm overflow-x-auto scrollbar-none mt-2">
        <div className="relative w-80 shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search product, SKU, movement ID…"
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
          />
        </div>



        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${warehouseFilter !== "All" || typeFilter !== "All" || dateFrom || dateTo
              ? "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
              : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
              }`}
            title="Filters"
          >
            <Filter size={13} />

          </button>

          <ColumnPicker
            availableKeys={availableKeys}
            selectedKeys={selectedKeys}
            onApply={setSelectedKeys}
            storageKey="stock_movement_columns"
            className="h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 "
          />
        </div>
      </div>

      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => { }}
        onClear={resetFilters}
        title="Stock Movement Filters"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Movement Type</label>
            <ReusableSelect
              options={MOVEMENT_TYPES.map(t => ({ label: t.replace('_', ' '), value: t }))}
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val)}
              placeholder="Type"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full h-9 pl-11 pr-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full h-9 pl-9 pr-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </RightSidebarFilter>

      {/* ── Table Section ── */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">
        <div
          className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200"
        >
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-400 text-[10px] font-bold tracking-[0.15em]">
                <th className="px-4 py-3 w-10 text-center border-r border-slate-100">
                  <input
                    type="checkbox"
                    checked={pageData.length > 0 && pageData.every(m => selectedMovements.has(m.id))}
                    onChange={() => {
                      const allSelected = pageData.length > 0 && pageData.every(m => selectedMovements.has(m.id));
                      if (allSelected) {
                        setSelectedMovements(new Set());
                      } else {
                        setSelectedMovements(new Set(pageData.map(m => m.id)));
                      }
                    }}
                    className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-800 border-r border-slate-100 last:border-r-0 w-[25%] min-w-[260px]">Product Information</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-800 border-r border-slate-100 last:border-r-0 w-[12%] min-w-[125px]">Movement Type</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-800 border-r border-slate-100 last:border-r-0 w-[10%] min-w-[90px]">Stock In / Out</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-800 border-r border-slate-100 last:border-r-0 w-[10%] min-w-[90px]">Stock After</th>
                {selectedKeys.map(key => {
                  let width = "w-[12%] min-w-[120px]";
                  if (key === "notes") width = "w-[20%] min-w-[180px]";
                  if (key === "user") width = "w-[10%] min-w-[100px]";
                  return (
                    <th key={key} className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-800 border-r border-slate-100 last:border-r-0 ${width}`}>{key.replace(/_/g, ' ')}</th>
                  );
                })}
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-800 border-r border-slate-100 last:border-r-0 w-[15%] min-w-[150px]">
                  <SortBtn field="date" label="Date & Time" />
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-800 w-14 sticky right-0 bg-slate-50 border-l border-slate-200 z-30 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm bg-white">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={selectedKeys.length + 7} className="py-20 text-center text-slate-400 font-medium italic bg-white">
                    No movements found matching your filters.
                  </td>
                </tr>
              ) : pageData.map((m, idx) => {
                const hasList = m.productsList && m.productsList.length > 1;
                const rowKey = `${m.id}-${idx}`;
                const totalQty = hasList
                  ? m.productsList!.reduce((sum, p) => sum + p.qty, 0)
                  : m.qty;

                const firstProd = m.productsList?.[0] || {};
                const currentStockVal = (() => {
                  const prods = m.productsList;
                  if (!prods || prods.length === 0) {
                    const sb = m.stocks_before;
                    if (sb === undefined || sb === null) return null;
                    return sb + (firstProd.qty ?? m.qty);
                  }
                  let total = 0;
                  for (const p of prods) {
                    const sb = p.stocks_before;
                    if (sb === undefined || sb === null) return null;
                    total += sb + p.qty;
                  }
                  return total;
                })();

                const truncateId = (id?: string) => {
                  if (!id) return "—";
                  return id.length > 10 ? `${id.slice(0, 6)}...` : id;
                };

                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      ref={idx === pageData.length - 1 ? lastElementRef : null}
                      className={`group transition-all cursor-default border-b border-slate-100 last:border-b-0 ${selectedMovements.has(m.id) ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-blue-50/30 even:bg-slate-50/20"}`}
                    >
                      <td className="px-4 py-3 align-middle border-r border-slate-100 text-center">
                        <input
                          type="checkbox"
                          checked={selectedMovements.has(m.id)}
                          onChange={() => toggleSelectMovement(m.id)}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 align-middle border-r border-slate-100 last:border-r-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-md bg-gradient-to-br flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm ${totalQty > 0 ? "from-emerald-500 to-emerald-400 shadow-emerald-50" : "from-rose-500 to-rose-400 shadow-rose-50"}`}>
                            {(hasList ? firstProd.name : m.product)?.[0]?.toUpperCase() || "—"}
                          </div>
                          <div className="flex flex-col min-w-0 gap-0.5">
                            <span className="text-[13px] font-semibold text-slate-800 truncate leading-tight">
                              {hasList ? firstProd.name : m.product}
                            </span>
                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                              <button
                                onClick={(e) => copyToClipboard(e, m.id)}
                                className="group flex items-center gap-1 text-[9px] font-extrabold text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-100 hover:bg-slate-100 hover:text-slate-600 transition-all leading-none"
                              >
                                ID: {m.id}
                                <Copy size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                              <span className="text-[9px] font-medium text-slate-400 font-mono">{hasList ? firstProd.skuLabel : m.skuLabel}: {hasList ? firstProd.skuValue : m.skuValue}</span>
                              {(hasList ? firstProd.variant : m.variant) && (
                                <button
                                  onClick={(e) => copyToClipboard(e, (hasList ? firstProd.variant : m.variant) || "")}
                                  className="group flex items-center gap-0.5 text-[9px] font-extrabold text-violet-600 bg-violet-50/50 px-1 py-0.2 rounded border border-violet-100 hover:bg-violet-100 transition-all leading-none"
                                >
                                  <Layers size={8} /> {truncateId(hasList ? firstProd.variant : m.variant)}
                                  <Copy size={7} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              )}
                              {(hasList ? firstProd.batch : m.batch) && (
                                <button
                                  onClick={(e) => copyToClipboard(e, (hasList ? firstProd.batch : m.batch) || "")}
                                  className="group flex items-center gap-0.5 text-[9px] font-extrabold text-amber-600 bg-amber-50/50 px-1 py-0.2 rounded border border-amber-100 hover:bg-amber-100 transition-all leading-none"
                                >
                                  <Hash size={8} /> {truncateId(hasList ? firstProd.batch : m.batch)}
                                  <Copy size={7} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              )}
                              {hasList ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelected(m);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors shrink-0 shadow-sm"
                                  title="View Items"
                                >
                                  <ChevronRight size={10} strokeWidth={3} />
                                  <span>+ {m.productsList!.length - 1} more</span>
                                </button>
                              ) : (
                                <>
                                  {m.serial_numbers && m.serial_numbers.length > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-600 bg-emerald-50/50 px-1 py-0.2 rounded border border-emerald-100 leading-none">
                                      <Zap size={8} fill="currentColor" /> {m.serial_numbers.length} Serials
                                    </span>
                                  )}
                                  {m.current_stock !== undefined && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-blue-650 bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100 leading-none" title="Current Available Stock">
                                      Stock: {m.current_stock}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle border-r border-slate-100 last:border-r-0">
                        <TypeBadge type={m.type} />
                      </td>
                      <td className="px-4 py-3 text-center align-middle border-r border-slate-100 last:border-r-0 bg-slate-50/30">
                        <span className={`text-[13px] font-black tabular-nums ${totalQty > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {totalQty > 0 ? `+${totalQty}` : totalQty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center align-middle border-r border-slate-100 last:border-r-0">
                        <span className="text-[12px] font-bold text-blue-600 tabular-nums">
                          {currentStockVal !== null ? currentStockVal : '—'}
                        </span>
                      </td>
                      {selectedKeys.map(key => {
                        const value = m[key as keyof Movement];
                        const displayValue = value === undefined || value === null ? "—" :
                          typeof value === 'object' ? (Array.isArray(value) ? value.join(", ") : JSON.stringify(value)) :
                            String(value);
                        return (
                          <td key={key} className="px-4 py-3 align-middle border-r border-slate-100 last:border-r-0 truncate">
                            <p className="text-[12px] font-bold text-slate-600 tracking-tight">
                              {displayValue}
                            </p>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 align-middle border-r border-slate-100 last:border-r-0">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-semibold text-slate-700">
                            {new Date(m.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold">
                            {new Date(m.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle w-14 whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-200 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] transition-colors" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelected(m)}
                          className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>


                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {loadingMore && <div className="py-4 text-center text-xs text-slate-500">Loading more...</div>}
        {/* Infinite Scroll Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50">
          <span className="text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-900">{pageData.length}</strong> {totalCount > 0 ? <>of <strong className="text-slate-900">{totalCount}</strong></> : ''} records
          </span>
          {hasMore && (
            <span className="text-[10px] font-bold text-slate-400 animate-pulse">Scroll down to load more ↓</span>
          )}
        </div>
      </div>

      {/* Overlays */}
      {selectedMvt && <DetailDrawer movement={selectedMvt} onClose={() => setSelected(null)} />}
      {showAdd && <AddMovementModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

