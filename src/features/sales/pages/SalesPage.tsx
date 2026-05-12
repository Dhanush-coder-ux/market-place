import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Search, Eye, ChevronDown, X, User, Calendar,
  CreditCard, Package, RotateCcw, Receipt, AlertCircle, CheckCircle2,
  ChevronRight, Minus, Plus, ArrowRight, RefreshCw, Banknote,
  Gift, ArrowLeft, Check, Loader2,
  DollarSign,
  BarChart2,
  Smartphone,
} from "lucide-react";
import { StatsCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { OrderResponse } from "@/features/order/types";
import { inventoryApi } from "@/services/api/inventory";
import { useToast } from "@/context/ToastContext";
import ProductSelectionModal from "../../billing/components/ProductSelectionModel";
import { InventoryItem, ProductVariant } from "../../billing/types";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type OriginType = "Sales" | "Sales Return";
type PaymentMethod = "Cash" | "Card" | "UPI" | "G-Pay" | "PhonePe" | "Other";
type SaleStatus = "Completed" | "Pending" | "Cancelled";
type ReturnMode = "refund" | "exchange";
type ReturnReason = "Damaged" | "Wrong Item" | "Customer Request" | "Size Issue" | "Other" | "";
type SettlementMethod = "Cash" | "UPI" | "Card" | "Bank" | "Store Credit" | "";

// Use the backend response type directly
type SaleRecord = OrderResponse;

interface SaleItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  buyPrice: number;
  imageColor: string;
  status?: string;
}

interface SelectedReturnItem extends SaleItem {
  returnQty: number;
  exchangeItemId?: string;
}

interface ReturnErrors {
  reason?: string;
  items?: string;
  settlement?: string;
}

// 5-step flow
type ReturnStep = 1 | 2 | 3 | 4 | 5;

interface ReturnState {
  step: ReturnStep;
  mode: ReturnMode;
  returnItems: Record<string, number>;       // itemId → returnQty
  exchangeMap: Record<string, any>;          // itemId → full replacement product data
  reason: ReturnReason;
  notes: string;
  settlementMethod: SettlementMethod;
  errors: ReturnErrors;
  isSubmitting: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & MOCK DATA
═══════════════════════════════════════════════════════════════ */
const RETURN_REASONS: Exclude<ReturnReason, "">[] = [
  "Damaged", "Wrong Item", "Customer Request", "Size Issue", "Other",
];

const ITEM_COLORS = ["#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3", "#ede9fe", "#ffedd5", "#f0fdf4", "#ecfeff"];

/* ═══════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════ */
const generateItems = (sale: SaleRecord): SaleItem[] =>
  (sale.items || []).map((item, i) => ({
    id: item.id,
    name: item.status === "REFUNDED" 
      ? `(Refunded) ${item.barcode?.trim() || 'Item'}` 
      : item.status === "EXCHANGED" 
        ? `(Exchanged) ${item.barcode?.trim() || 'Item'}` 
        : (item.barcode?.trim() || `Item ${i + 1}`),
    sku: item.barcode?.trim() || item.inventory_id.slice(-6),
    category: "General",
    quantity: item.quantity,
    unitPrice: item.sell_price,
    buyPrice: item.buy_price,
    imageColor: ITEM_COLORS[i % ITEM_COLORS.length],
    status: item.status,
    variant_id: item.variant_id,
    batch_id: item.batch_id,
    serialno_id: item.serialno_id,
    serial_numbers: item.serial_numbers || [],
  }));

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ═══════════════════════════════════════════════════════════════
   BADGE CONFIGS
═══════════════════════════════════════════════════════════════ */
type BadgeConfig = { cls: string; dot: string };

const ORIGIN_CFG: Record<OriginType, BadgeConfig> = {
  "Sales": { cls: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-400" },
  "Sales Return": { cls: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-400" },
};
const PAYMENT_CFG: Record<string, BadgeConfig> = {
  Cash: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-400" },
  Card: { cls: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-400" },
  UPI: { cls: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-400" },
  "G-Pay": { cls: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-400" },
  PhonePe: { cls: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-400" },
  Other: { cls: "bg-slate-50 text-slate-700 border-slate-100", dot: "bg-slate-400" },
};
const STATUS_CFG: Record<SaleStatus, BadgeConfig> = {
  Completed: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  Pending: { cls: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400" },
  Cancelled: { cls: "bg-red-50 text-red-600 border-red-100", dot: "bg-red-400" },
};

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .sr-root { 
    font-family: 'DM Sans', sans-serif; 
    overflow-x: hidden;
    width: 100%;
    position: relative;
  }
  .sr-mono { font-family: 'DM Mono', monospace; }

  /* Table row hover */
  .sr-row { transition: background 0.1s; }
  .sr-row:hover { background: #f8fafc; }
  .sr-row:hover .sr-row-actions { opacity: 1; }
  .sr-row-actions { opacity: 0; transition: opacity 0.15s; }

  /* Dropdown */
  .sr-drop-btn { transition: all 0.12s; }
  .sr-dropdown { animation: srDrop 0.12s ease forwards; transform-origin: top left; }
  @keyframes srDrop {
    from { opacity: 0; transform: scale(0.96) translateY(-4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Modal backdrop */
  .sr-backdrop-enter { animation: srFadeIn 0.18s ease forwards; }
  @keyframes srFadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* Modal panel */
  .sr-modal-enter { animation: srModalIn 0.22s cubic-bezier(0.34, 1.15, 0.64, 1) forwards; }
  @keyframes srModalIn {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Step content */
  .sr-step-enter { animation: srStepIn 0.2s ease forwards; }
  @keyframes srStepIn {
    from { opacity: 0; transform: translateX(10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* Confirm done */
  .sr-done-pop { animation: srDonePop 0.35s cubic-bezier(0.34, 1.5, 0.64, 1) forwards; }
  @keyframes srDonePop {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* Checkbox */
  .sr-cb {
    appearance: none; width: 16px; height: 16px;
    border: 1.5px solid #d1d5db; border-radius: 4px;
    background: white; cursor: pointer;
    transition: all 0.12s; position: relative; flex-shrink: 0;
  }
  .sr-cb:checked { background: #2563eb; border-color: #2563eb; }
  .sr-cb:checked::after {
    content: ''; position: absolute;
    left: 4px; top: 1.5px; width: 5px; height: 8px;
    border: 1.5px solid white; border-top: none; border-left: none;
    transform: rotate(42deg);
  }

  /* Item rows */
  .sr-item-row { transition: background 0.12s, border-color 0.12s; cursor: pointer; }
  .sr-item-row.sel { background: #eff6ff; border-color: #bfdbfe; }
  .sr-item-row:not(.sel):hover { background: #f8fafc; }

  /* Exchange product cards */
  .sr-exch-card { transition: all 0.15s; cursor: pointer; }
  .sr-exch-card:hover:not(.disabled) { border-color: #93c5fd; background: #f0f7ff; }
  .sr-exch-card.selected { border-color: #3b82f6; background: #eff6ff; }
  .sr-exch-card.disabled { opacity: 0.45; cursor: not-allowed; }

  /* Qty btn */
  .sr-qty-btn { transition: background 0.1s; }
  .sr-qty-btn:hover:not(:disabled) { background: #e0e7ff; }
  .sr-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* Mode pills */
  .sr-mode-pill { transition: all 0.15s; }
  .sr-mode-pill.active { background: white; border-color: #93c5fd; color: #1d4ed8; box-shadow: 0 1px 3px rgba(59,130,246,0.15); }

  /* Refund method pill */
  .sr-rfm-pill { transition: all 0.15s; cursor: pointer; }
  .sr-rfm-pill.active { border-color: #3b82f6; background: #eff6ff; }
  .sr-rfm-pill:not(.active):hover { border-color: #93c5fd; }

  /* Progress bar */
  .sr-progress { transition: width 0.3s ease; }

  /* Select */
  select.sr-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }

  /* Sidebar */
  .sr-sidebar { 
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 100%;
    max-width: 400px;
    background: white;
    box-shadow: -10px 0 30px rgba(0,0,0,0.05);
    z-index: 110;
    transform: translateX(101%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    visibility: hidden;
  }
  .sr-sidebar.open { 
    transform: translateX(0);
    visibility: visible;
  }

  /* Scrollbar */
  .sr-scroll::-webkit-scrollbar { width: 4px; }
  .sr-scroll::-webkit-scrollbar-track { background: transparent; }
  .sr-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

  /* Stats card */
  .sr-stat { transition: box-shadow 0.15s, transform 0.15s; }
  .sr-stat:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); transform: translateY(-1px); }

  /* Btn */
  .sr-btn-primary { transition: all 0.15s; }
  .sr-btn-primary:hover:not(:disabled) { filter: brightness(1.05); box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
  .sr-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .sr-btn-ghost { transition: all 0.15s; }
  .sr-btn-ghost:hover { background: #f1f5f9; }
`;

/* ═══════════════════════════════════════════════════════════════
   SHARED SMALL COMPONENTS
═══════════════════════════════════════════════════════════════ */
const Badge: React.FC<{ cls: string; dot: string; label: string }> = ({ cls, dot, label }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
    {label}
  </span>
);

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  onClick?: (e: React.MouseEvent) => void;
}
const QuantityStepper: React.FC<QuantityStepperProps> = ({ value, min = 1, max, onChange, onClick }) => (
  <div className="inline-flex items-center gap-0 border border-slate-200 rounded-lg overflow-hidden bg-white" onClick={onClick}>
    <button className="sr-qty-btn w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-500"
      disabled={value <= min} onClick={e => { e.stopPropagation(); onChange(Math.max(min, value - 1)); }}>
      <Minus size={10} />
    </button>
    <span className="w-8 text-center text-xs font-semibold text-slate-800 sr-mono tabular-nums">{value}</span>
    <button className="sr-qty-btn w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-500"
      disabled={value >= max} onClick={e => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}>
      <Plus size={10} />
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   STEP HEADER (progress indicator)
═══════════════════════════════════════════════════════════════ */
const STEP_LABELS: Record<ReturnStep, string> = {
  1: "Mode",
  2: "Items",
  3: "Reason",
  4: "Review",
  5: "Done",
};

interface StepHeaderProps {
  step: ReturnStep;
  mode: ReturnMode;
  invoice: string;
}
const StepHeader: React.FC<StepHeaderProps> = ({ step, mode, invoice }) => {
  const totalSteps = 6;
  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="px-6 pt-5 pb-4 border-b border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
            {step < 5 ? `Step ${step} of 4` : "Complete"}
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {step === 1 ? "Choose Return Mode"
              : step === 2 ? (mode === "refund" ? "Select Items for Refund" : "Select Items to Exchange")
                : step === 3 ? "Reason & Payment"
                  : step === 4 ? "Review Summary"
                    : "Return Processed"}
          </p>
        </div>
        <span className="sr-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
          {invoice}
        </span>
      </div>
      {step < 5 && (
        <div className="relative">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="sr-progress h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {([1, 2, 3, 4] as ReturnStep[]).map(s => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${s < step ? "bg-blue-500" : s === step ? "bg-blue-500" : "bg-slate-200"
                  }`} />
                <span className={`text-[9px] font-medium tracking-wide transition-colors duration-300 ${s <= step ? "text-blue-500" : "text-slate-300"
                  }`}>{STEP_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   REFUND SUMMARY COMPONENT
═══════════════════════════════════════════════════════════════ */
interface RefundSummaryProps {
  mode: ReturnMode;
  selectedItems: SelectedReturnItem[];
  totals: { returnValue: number; exchangeValue: number; diff: number };
  settlementMethod: SettlementMethod;
  originalPayment: PaymentMethod;
}
const RefundSummary: React.FC<RefundSummaryProps> = ({
  mode, selectedItems, totals, settlementMethod, originalPayment,
}) => {
  const { returnValue, exchangeValue, diff } = totals;
  const isStoreCredit = settlementMethod === "Store Credit";

  if (mode === "refund") {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-0.5">
              {isStoreCredit ? "Store Credit" : "Refund Amount"}
            </p>
            <p className="text-2xl font-light sr-mono text-blue-700">{fmt(returnValue)}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-slate-400">
              {selectedItems.reduce((s, i) => s + i.returnQty, 0)} item(s)
            </span>
            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
              {isStoreCredit ? <Gift size={10} /> : <Banknote size={10} />}
              {isStoreCredit ? "Store Credit" : `Via ${settlementMethod || originalPayment}`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-4 ${diff > 0 ? "bg-amber-50 border-amber-100" : diff < 0 ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[10px] text-slate-400 mb-0.5">Return Value</p>
          <p className="text-sm font-semibold sr-mono text-slate-700">{fmt(returnValue)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 mb-0.5">Exchange Value</p>
          <p className="text-sm font-semibold sr-mono text-slate-700">{fmt(exchangeValue)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5 text-[10px]" style={{ color: diff > 0 ? '#92400e' : diff < 0 ? '#065f46' : '#64748b' }}>
            {diff > 0 ? "Customer Pays" : diff < 0 ? "Shop Refunds" : "Settled"}
          </p>
          <p className={`text-sm font-semibold sr-mono ${diff > 0 ? "text-amber-700" : diff < 0 ? "text-emerald-700" : "text-slate-500"}`}>
            {diff === 0 ? "–" : fmt(Math.abs(diff))}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ITEM SELECTOR
═══════════════════════════════════════════════════════════════ */
interface ItemSelectorProps {
  items: SaleItem[];
  returnItems: Record<string, number>;
  onToggle: (id: string) => void;
  onQtyChange: (id: string, v: number) => void;
  onSelectAll: (all: boolean) => void;
  error?: string;
}
const ItemSelector: React.FC<ItemSelectorProps> = ({ items, returnItems, onToggle, onQtyChange, onSelectAll, error }) => {
  const [q, setQ] = useState("");
  const filtered = items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase()));
  
  const selectableItems = filtered.filter(i => i.status !== "REFUNDED" && i.status !== "EXCHANGED");
  const allSelected = selectableItems.length > 0 && selectableItems.every(i => returnItems[i.id] !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items in this order..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-300 transition-all"
          />
        </div>
        <button
          onClick={() => onSelectAll(!allSelected)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${allSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}
        >
          {allSelected ? <Check size={12} /> : <div className="w-3 h-3 rounded-sm border border-slate-300 bg-white" />}
          Select All
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map(item => {
          const checked = returnItems[item.id] !== undefined;
          const qty = returnItems[item.id] ?? 1;
          const isProcessed = item.status === "REFUNDED" || item.status === "EXCHANGED";

          return (
            <div key={item.id}
              className={`sr-item-row border rounded-xl p-3.5 ${checked ? "sel" : ""} ${isProcessed ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
              onClick={() => !isProcessed && onToggle(item.id)}
            >
              <div className="flex items-center gap-3">
                <input type="checkbox" className="sr-cb" checked={checked} disabled={isProcessed} readOnly onClick={e => e.stopPropagation()} />
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: item.imageColor }}
                >
                  <Package size={14} className="text-slate-500 opacity-60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-slate-800">{item.name}</p>
                        {item.status && (
                          <span className={`text-[8px] font-bold px-1 rounded uppercase ${
                            item.status === "REFUNDED" ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 sr-mono mt-0.5">{item.sku} · {item.category}</p>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 sr-mono shrink-0">{fmt(item.unitPrice)}</p>
                  </div>
                  {checked && (
                    <div className="mt-2 flex items-center gap-2.5" onClick={e => e.stopPropagation()}>
                      <span className="text-[10px] text-slate-400">Return qty</span>
                      <QuantityStepper value={qty} max={item.quantity} onChange={v => onQtyChange(item.id, v)} />
                      <span className="text-[10px] text-slate-400">of {item.quantity}</span>
                      <span className="ml-auto text-[10px] font-semibold text-blue-600 sr-mono">
                        {fmt(item.unitPrice * qty)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400">No items match your search.</p>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-red-500">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   USE RETURN ORDER HOOK
═══════════════════════════════════════════════════════════════ */
const initialState = (): ReturnState => ({
  step: 1,
  mode: "refund",
  returnItems: {},
  exchangeMap: {},
  reason: "",
  notes: "",
  settlementMethod: "Cash",
  errors: {},
  isSubmitting: false,
});

const useReturnModal = (sale: SaleRecord | null) => {
  const [state, setState] = useState<ReturnState>(initialState());

  const saleItems = useMemo<SaleItem[]>(
    () => (sale ? generateItems(sale) : []),
    [sale?.id],
  );

  const reset = useCallback(() => setState(initialState()), []);

  const setStep = (step: ReturnStep) => setState(s => ({ ...s, step }));
  const setMode = (mode: ReturnMode) => setState(s => ({ ...s, mode, settlementMethod: mode === "refund" ? "Cash" : "" }));
  const setReason = (reason: ReturnReason) => setState(s => ({ ...s, reason, errors: { ...s.errors, reason: undefined } }));
  const setNotes = (notes: string) => setState(s => ({ ...s, notes }));
  const setSettlementMethod = (settlementMethod: SettlementMethod) => setState(s => ({ ...s, settlementMethod, errors: { ...s.errors, settlement: undefined } }));

  const { showToast } = useToast();

  const toggleItem = useCallback((itemId: string) => {
    setState(s => {
      const next = { ...s.returnItems };
      const nextEx = { ...s.exchangeMap };
      if (next[itemId] !== undefined) {
        delete next[itemId];
        delete nextEx[itemId];
      } else {
        const item = saleItems.find(i => i.id === itemId);
        next[itemId] = item?.quantity ?? 1;
      }
      return { ...s, returnItems: next, exchangeMap: nextEx, errors: { ...s.errors, items: undefined } };
    });
  }, [saleItems]);

  const selectAll = useCallback((all: boolean) => {
    setState(s => {
      if (!all) return { ...s, returnItems: {}, exchangeMap: {} };
      const next: Record<string, number> = {};
      saleItems.forEach(i => {
        if (i.status !== "REFUNDED" && i.status !== "EXCHANGED") {
          next[i.id] = i.quantity;
        }
      });
      return { ...s, returnItems: next, errors: { ...s.errors, items: undefined } };
    });
  }, [saleItems]);

  const updateQty = useCallback((itemId: string, v: number) => {
    const item = saleItems.find(i => i.id === itemId);
    if (!item) return;
    setState(s => ({ ...s, returnItems: { ...s.returnItems, [itemId]: Math.min(Math.max(1, v), item.quantity) } }));
  }, [saleItems]);

  const setExchangeProduct = useCallback((itemId: string, product: any) => {
    setState(s => ({ ...s, exchangeMap: { ...s.exchangeMap, [itemId]: product } }));
  }, []);

  const selectedItems = useMemo<SelectedReturnItem[]>(() => {
    return saleItems
      .filter(i => state.returnItems[i.id] !== undefined)
      .map(i => ({ ...i, returnQty: state.returnItems[i.id], exchangeItemId: state.exchangeMap[i.id] }));
  }, [saleItems, state.returnItems, state.exchangeMap]);

  // Calculate values for exchanges and refunds
  const totals = useMemo(() => {
    const returnValue = selectedItems.reduce((s, i) => s + i.unitPrice * i.returnQty, 0);
    const exchangeValue = state.mode === "exchange"
      ? selectedItems.reduce((s, i) => {
        if (!i.exchangeItemId) return s;
        const ep = i.exchangeItemId as any;
        return s + (ep?.sell_price ?? 0);
      }, 0)
      : 0;
    return {
      returnValue,
      exchangeValue,
      diff: exchangeValue - returnValue // Positive means customer pays extra. Negative means shop owes refund.
    };
  }, [selectedItems, state.mode]);

  const validate = useCallback((): boolean => {
    const errs: ReturnErrors = {};
    if (!state.reason) errs.reason = "Please select a reason.";
    if (selectedItems.length === 0) {
      errs.items = "Select at least one item.";
    }

    // Settlement Method is required if it's a direct refund or an exchange with a price difference
    const requiresSettlement = state.mode === "refund" || totals.diff !== 0;
    if (requiresSettlement && !state.settlementMethod) {
      errs.settlement = "Please select a payment/refund method.";
    }

    setState(s => ({ ...s, errors: errs }));
    return Object.keys(errs).length === 0;
  }, [state.reason, state.mode, state.settlementMethod, selectedItems, totals]);

  const goNext = useCallback(() => {
    if (state.step === 3 && !validate()) return;
    setStep((state.step + 1) as ReturnStep);
  }, [state.step, validate]);

  const goBack = useCallback(() => {
    if (state.step > 1) setStep((state.step - 1) as ReturnStep);
  }, [state.step]);

  const confirm = useCallback(async (onSuccess?: () => void) => {
    setState(s => ({ ...s, isSubmitting: true }));
    try {
      if (state.mode === "refund") {
        await inventoryApi.bulkReturnOrder({
          order_id: sale?.id || "",
          items_id: selectedItems.map(i => i.id)
        });
        showToast("Refund(s) processed successfully", "success");
      } else {
        // Bulk Exchange - Merge identical products into single entries with summed quantity
        const productsMap = new Map<string, any>();

        selectedItems.forEach(item => {
          const replacement = state.exchangeMap[item.id];
          if (!replacement) return;

          // Create a unique key for merging: ID + variant + batch + serialno_id
          const key = `${replacement.id}-${replacement.variant_id || "none"}-${replacement.batch_id || "none"}-${replacement.serialno_id || "none"}`;

          if (productsMap.has(key)) {
            const existing = productsMap.get(key);
            existing.quantity += replacement.quantity || item.returnQty;
            if (replacement.serial_numbers) {
              existing.serial_numbers = [...existing.serial_numbers, ...replacement.serial_numbers];
            }
          } else {
            productsMap.set(key, {
              id: replacement.id,
              variant_id: replacement.variant_id || null,
              batch_id: replacement.batch_id || null,
              serialno_id: replacement.serialno_id || null,
              serial_numbers: replacement.serial_numbers || [],
              quantity: replacement.quantity || item.returnQty,
            });
          }
        });

        const products = Array.from(productsMap.values());

        await inventoryApi.bulkExchangeOrder({
          shop_id: SHOP_ID,
          customer_id: sale?.customer_id || "",
          order_id: sale?.id || "",
          items_id: selectedItems.map(i => i.id),
          payment_method: state.settlementMethod || sale?.payment_method || "Cash",
          products
        });
        showToast("Exchange(s) processed successfully", "success");
      }
      onSuccess?.();
      setState(s => ({ ...s, isSubmitting: false, step: 5 }));
    } catch (err) {
      console.error("Return/Exchange failed:", err);
      showToast("Operation failed. Please try again.", "error");
      setState(s => ({ ...s, isSubmitting: false }));
    }
  }, [state, selectedItems, sale, showToast]);

  const canProceed = useMemo(() => {
    if (state.step === 2) return selectedItems.length > 0 && (state.mode === "refund" || selectedItems.every(i => !!i.exchangeItemId));
    if (state.step === 3) return !!state.reason && (state.mode === "refund" || totals.diff === 0 || !!state.settlementMethod);
    return true;
  }, [state.step, state.mode, selectedItems, state.reason, totals.diff, state.settlementMethod]);

  return {
    state, saleItems, selectedItems, totals,
    reset, setMode, setReason, setNotes, setSettlementMethod,
    toggleItem, selectAll, updateQty, setExchangeProduct,
    goNext, goBack, confirm, canProceed,
  };
};

/* ═══════════════════════════════════════════════════════════════
   RETURN MODAL
═══════════════════════════════════════════════════════════════ */
interface ReturnModalProps {
  sale: SaleRecord;
  onClose: () => void;
  onRefresh: () => void;
}

const ReturnModal: React.FC<ReturnModalProps> = ({ sale, onClose, onRefresh }) => {
  const m = useReturnModal(sale);
  const { state, saleItems, selectedItems, totals } = m;
  const scrollRef = useRef<HTMLDivElement>(null);

  // State for the exchange products search bar and the active tab
  const [exchSearch, setExchSearch] = useState("");
  const [activeReplaceId, setActiveReplaceId] = useState<string | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<InventoryItem | null>(null);

  const [exchProducts, setExchProducts] = useState<any[]>([]);
  const [loadingExch, setLoadingExch] = useState(false);

  const mapToInventoryItem = (p: any): InventoryItem => ({
    id: p.id,
    product_barcode: p.barcode || "N/A",
    product_name: p.name || "Unknown Product",
    category: p.category || "Other",
    variants: (p.variants || []).map((v: any) => ({
      ...v,
      price: v.sell_price || 0,
      stock: v.stocks || 0,
      serialnoId: v.serial_numbers?.id || v.serial_number?.id || v.batches?.[0]?.serial_numbers?.id,
      availableSerials: v.serial_numbers?.serial_numbers || v.serial_number?.serial_numbers || v.batches?.[0]?.serial_numbers?.serial_numbers || [],
      batchId: v.batches?.[0]?.id,
    })),
    requireSerial: p.has_serialno || false,
    batchTracking: p.has_batch || false,
    manufacturingDate: p.batches?.[0]?.manufacturing_date,
    expiryDate: p.batches?.[0]?.expiry_date,
    price: p.sell_price || 0,
    stocks: p.stocks || 0,
    serialnoId: p.serial_number?.id || p.batches?.[0]?.serial_numbers?.id,
    availableSerials: p.serial_number?.serial_numbers || p.batches?.[0]?.serial_numbers?.serial_numbers || [],
    batchId: p.batches?.[0]?.id,
  });

  const handleExchangeClick = (ep: any) => {
    setPendingProduct(mapToInventoryItem(ep));
    setIsProductModalOpen(true);
  };

  const handleProductSelectSuccess = (variant: ProductVariant, quantity: number, serials?: string[]) => {
    if (!activeReplaceId || !pendingProduct) return;

    const exchangeData = {
      id: pendingProduct.id,
      name: variant.id === "default" ? pendingProduct.product_name : `${pendingProduct.product_name} - ${variant.name}`,
      sell_price: variant.price,
      variant_id: variant.id === "default" ? null : variant.id,
      batch_id: variant.batchId || pendingProduct.batchId,
      serialno_id: variant.serialnoId || pendingProduct.serialnoId,
      serial_numbers: serials || [],
      quantity: quantity,
    };

    m.setExchangeProduct(activeReplaceId, exchangeData);
    setIsProductModalOpen(false);
    setPendingProduct(null);
  };

  useEffect(() => {
    const fetchExch = async () => {
      setLoadingExch(true);
      const res = await inventoryApi.searchInventories(exchSearch);
      setExchProducts(res);
      setLoadingExch(false);
    };

    const timer = setTimeout(fetchExch, 300);
    return () => clearTimeout(timer);
  }, [exchSearch]);

  // Keep the active replacement tab synced with selected items
  useEffect(() => {
    if (selectedItems.length > 0 && (!activeReplaceId || !selectedItems.some(i => i.id === activeReplaceId))) {
      setActiveReplaceId(selectedItems[0].id);
    }
  }, [selectedItems, activeReplaceId]);

  // Reset scroll on step change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.step]);

  const canReturn = sale.status === "Completed" && sale.origin !== "Sales Return";

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="sr-backdrop-enter fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div className="sr-modal-enter relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: "calc(100vh - 48px)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close btn */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
          <X size={14} />
        </button>

        {/* Step Header */}
        <StepHeader step={state.step} mode={state.mode} invoice={`INV-${sale.ui_id}`} />

        {/* Content */}
        {!canReturn ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
              <AlertCircle size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                {sale.origin === "Sales Return" ? "Already Returned" : "Not Eligible"}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {sale.origin === "Sales Return"
                  ? "This order is already a Sales Return and cannot be returned again."
                  : `Only Completed orders can be returned. This order is ${sale.status}.`}
              </p>
            </div>
            <button onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="sr-scroll flex-1 overflow-y-auto p-5">
              <div key={state.step} className="sr-step-enter space-y-5">

                {/* STEP 1: Mode */}
                {state.step === 1 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      How would you like to handle this return for{" "}
                      <span className="font-medium text-slate-700">{sale.customer_id}</span>?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { id: "refund" as ReturnMode, icon: <Banknote size={18} />, label: "Refund", desc: "Return money to customer via original payment or store credit" },
                        { id: "exchange" as ReturnMode, icon: <RefreshCw size={18} />, label: "Exchange", desc: "Swap returned items for other products in your catalog" },
                      ]).map(opt => (
                        <button key={opt.id}
                          onClick={() => m.setMode(opt.id)}
                          className={`sr-mode-pill text-left p-4 border-2 rounded-xl transition-all ${state.mode === opt.id ? "active" : "border-slate-100 text-slate-500 hover:border-slate-200"}`}
                        >
                          <div className={`mb-2 ${state.mode === opt.id ? "text-blue-500" : "text-slate-400"}`}>{opt.icon}</div>
                          <p className="text-sm font-semibold text-slate-800 mb-1">{opt.label}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 2: Items & Replacement Search */}
                {state.step === 2 && (
                  <div className="space-y-4">
                    <ItemSelector
                      items={saleItems}
                      returnItems={state.returnItems}
                      onToggle={m.toggleItem}
                      onQtyChange={m.updateQty}
                      onSelectAll={m.selectAll}
                      error={state.errors.items}
                    />

                    {/* Exchange product picker with Tabs and Search Bar */}
                    {state.mode === "exchange" && selectedItems.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 mt-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                          Select Replacement Items
                        </p>

                        {/* Interactive Tabs for each returned item */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedItems.map(selItem => {
                            const hasReplacement = !!state.exchangeMap[selItem.id];
                            const isActive = activeReplaceId === selItem.id;

                            return (
                              <button
                                key={selItem.id}
                                onClick={() => setActiveReplaceId(selItem.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${isActive
                                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                              >
                                {selItem.name}
                                {hasReplacement && <CheckCircle2 size={12} className={isActive ? "text-blue-500" : "text-emerald-500"} />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Search Bar for Exchange Products */}
                        <div className="relative mb-4">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search replacement catalog..."
                            value={exchSearch}
                            onChange={(e) => setExchSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all placeholder-slate-400"
                          />
                        </div>

                        {/* Rendering the catalog for the single ACTIVE tab */}
                        {activeReplaceId && (
                          <div className="mb-2">
                            {(() => {
                              // Get context details for the currently active item
                              const activeItem = selectedItems.find(i => i.id === activeReplaceId);
                              if (!activeItem) return null;

                              return (
                                <p className="text-[11px] font-medium text-slate-500 mb-2.5 flex items-center gap-1.5">
                                  <ArrowRight size={10} className="text-slate-400" />
                                  Replacing: <span className="text-slate-800 font-semibold">{activeItem.name}</span>
                                  <span className="text-slate-400 sr-mono ml-auto">Value: {fmt(activeItem.unitPrice * activeItem.returnQty)}</span>
                                </p>
                              );
                            })()}

                            {loadingExch ? (
                              <div className="text-center py-8">
                                <Loader2 size={24} className="animate-spin text-blue-500 mx-auto opacity-50" />
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">Searching inventory...</p>
                              </div>
                            ) : exchProducts.length === 0 ? (
                              <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-medium">No products found matching "{exchSearch}"</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto sr-scroll pr-1">
                                {exchProducts.map(ep => {
                                  const selected = state.exchangeMap[activeReplaceId]?.id === ep.id;
                                  const inStock = (ep.stocks || 0) > 0;

                                  return (
                                    <div key={ep.id}
                                      onClick={() => inStock && handleExchangeClick(ep)}
                                      className={`sr-exch-card border rounded-xl p-3 flex items-center gap-3 ${selected ? "selected" : ""} ${!inStock ? "disabled" : ""}`}
                                    >
                                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                        <Package size={14} className="text-slate-400 opacity-60" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-semibold text-slate-800 truncate">{ep.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[9px] text-slate-400 sr-mono uppercase tracking-wider">{ep.barcode || ep.id.slice(-6)}</span>
                                          {inStock ? (
                                            <span className="text-[9px] text-emerald-500 font-bold">{ep.stocks} IN STOCK</span>
                                          ) : (
                                            <span className="text-[9px] text-red-400 font-bold">OUT OF STOCK</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[11px] font-bold text-slate-900 sr-mono">{fmt(ep.sell_price)}</p>
                                        {selected && (
                                          <div className="mt-1 flex justify-end">
                                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-200">
                                              <Check size={9} className="text-white" />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: Reason & Payment/Refund Selection */}
                {state.step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                        Return Reason <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={state.reason}
                        onChange={e => m.setReason(e.target.value as ReturnReason)}
                        className={`sr-select w-full px-3.5 py-2.5 text-xs border rounded-xl bg-white text-slate-700 outline-none transition-all pr-9 ${state.errors.reason
                          ? "border-red-200 bg-red-50/30"
                          : "border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10"
                          }`}
                      >
                        <option value="">Select a reason…</option>
                        {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {state.errors.reason && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-500">
                          <AlertCircle size={11} /> {state.errors.reason}
                        </p>
                      )}
                    </div>

                    {/* Dynamic Settlement Selection: Show if refund OR if exchange requires settling a balance */}
                    {(state.mode === "refund" || totals.diff !== 0) && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                            {state.mode === "refund" || totals.diff < 0 ? "Refund Via" : "Collect Balance Via"} <span className="text-red-400">*</span>
                          </label>
                          {totals.diff !== 0 && state.mode === "exchange" && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${totals.diff > 0 ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              }`}>
                              Balance: {fmt(Math.abs(totals.diff))}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "Cash", icon: <Banknote size={20} strokeWidth={1.5} /> },
                            { id: "UPI", icon: <Smartphone size={20} strokeWidth={1.5} /> },
                            { id: "Card", icon: <CreditCard size={20} strokeWidth={1.5} /> },
                            // Only allow Store Credit for refunds, not for collecting payments
                            ...(state.mode === "refund" || totals.diff < 0 ? [{ id: "Store Credit", icon: <Gift size={20} strokeWidth={1.5} /> }] : []),
                          ].map(opt => (
                            <div key={opt.id}
                              onClick={() => m.setSettlementMethod(opt.id as SettlementMethod)}
                              className={`sr-rfm-pill border-2 rounded-xl p-3 ${state.settlementMethod === opt.id ? "active" : "border-slate-100"}`}
                            >
                              <div className={`mb-1.5 ${state.settlementMethod === opt.id ? "text-blue-500" : "text-slate-400"}`}>{opt.icon}</div>
                              <p className="text-xs font-semibold text-slate-800">{opt.id}</p>
                            </div>
                          ))}
                        </div>
                        {state.errors.settlement && (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-500">
                            <AlertCircle size={11} /> {state.errors.settlement}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                        Notes <span className="text-slate-300 normal-case font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={state.notes}
                        onChange={e => m.setNotes(e.target.value)}
                        rows={3}
                        placeholder="Any additional context…"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 outline-none resize-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-slate-300"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: Review */}
                {state.step === 4 && (
                  <div className="space-y-4">
                    <RefundSummary
                      mode={state.mode}
                      selectedItems={selectedItems}
                      totals={totals}
                      settlementMethod={state.settlementMethod}
                      originalPayment={sale.payment_method as PaymentMethod}
                    />

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                        Items
                      </p>
                      <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                        {selectedItems.map(item => {
                          return (
                            <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.imageColor }}>
                                <Package size={12} className="text-slate-400 opacity-60" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-800">{item.name}</p>
                                <div className="text-[10px] text-slate-400 sr-mono">
                                  {item.sku} · qty {item.returnQty}
                                  {item.exchangeItemId && (
                                    <div className="mt-1 flex flex-col gap-0.5">
                                      <span className="text-blue-500 font-medium">→ {(item.exchangeItemId as any).name}</span>
                                      {(item.exchangeItemId as any).serial_numbers?.length > 0 && (
                                        <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded self-start">
                                          SN: {(item.exchangeItemId as any).serial_numbers.join(", ")}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-semibold sr-mono text-slate-700">{fmt(item.unitPrice * item.returnQty)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: "Mode", value: state.mode === "refund" ? "Refund" : "Exchange" },
                        { label: "Reason", value: state.reason },
                        ...((state.mode === "refund" || totals.diff !== 0) && state.settlementMethod
                          ? [{ label: totals.diff > 0 ? "Payment Via" : "Refund Via", value: state.settlementMethod }]
                          : []),
                      ].map(row => (
                        <div key={row.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{row.label}</p>
                          <p className="text-xs font-medium text-slate-700">{row.value}</p>
                        </div>
                      ))}
                    </div>

                    {state.notes && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Notes</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{state.notes}</p>
                      </div>
                    )}

                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3">
                      <AlertCircle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        Confirming this will mark the order as a return and{" "}
                        {state.mode === "refund" ? "initiate a refund" : "process the exchange"}.
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 5: Done */}
                {state.step === 5 && (
                  <div className="flex flex-col items-center text-center gap-5 py-6">
                    <div className="sr-done-pop w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
                      <CheckCircle2 size={28} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-800 mb-1.5">
                        {state.mode === "refund" ? "Refund Processed" : "Exchange Initiated"}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                        {state.mode === "refund"
                          ? `A refund of ${fmt(totals.returnValue)} has been processed to ${state.settlementMethod}.`
                          : (totals.diff > 0
                            ? `Exchange order created. Balance of ${fmt(totals.diff)} collected via ${state.settlementMethod}.`
                            : totals.diff < 0
                              ? `Exchange order created. Balance of ${fmt(Math.abs(totals.diff))} refunded to ${state.settlementMethod}.`
                              : `Exchange order has been created. Replacement items will be dispatched shortly.`)}
                      </p>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                      {[
                        { label: "Invoice", value: `INV-${sale.ui_id}` },
                        { label: "Mode", value: state.mode === "refund" ? "Refund" : "Exchange" },
                        { label: "Reason", value: state.reason },
                        ...(state.mode === "refund" ? [{
                          label: "Refunded",
                          value: fmt(totals.returnValue),
                        }] : totals.diff !== 0 ? [{
                          label: totals.diff > 0 ? "Balance Paid" : "Balance Refunded",
                          value: fmt(Math.abs(totals.diff))
                        }] : []),
                      ].map((row, idx) => (
                        <div key={row.label} className={`flex justify-between px-4 py-3 ${idx > 0 ? "border-t border-slate-100" : ""}`}>
                          <span className="text-[11px] text-slate-400">{row.label}</span>
                          <span className="text-[11px] font-semibold text-slate-700 sr-mono">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={onClose}
                      className="sr-btn-primary w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-semibold">
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>

            {(() => {
              const usedSerials = Object.entries(state.exchangeMap).reduce((acc: string[], [itemId, data]) => {
                // Don't exclude serials belonging to the item we are CURRENTLY editing
                if (itemId === activeReplaceId) return acc;
                return [...acc, ...(data.serial_numbers || [])];
              }, []);

              return (
                <ProductSelectionModal
                  isOpen={isProductModalOpen}
                  product={pendingProduct}
                  onClose={() => setIsProductModalOpen(false)}
                  onSuccess={handleProductSelectSuccess}
                  excludedSerials={usedSerials}
                  initialQuantity={selectedItems.find(i => i.id === activeReplaceId)?.returnQty}
                />
              );
            })()}

            {/* Footer */}
            {state.step < 5 && (
              <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-2.5">
                {state.step > 1 && (
                  <button onClick={m.goBack}
                    className="sr-btn-ghost flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl">
                    <ArrowLeft size={13} />
                    Back
                  </button>
                )}
                {state.step < 4 ? (
                  <button onClick={m.goNext}
                    disabled={!m.canProceed}
                    className="sr-btn-primary flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                    Continue
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button onClick={() => m.confirm(onRefresh)}
                    disabled={state.isSubmitting}
                    className="sr-btn-primary flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                    {state.isSubmitting ? (
                      <><Loader2 size={14} className="animate-spin" /> Processing…</>
                    ) : (
                      <>{state.mode === "refund" ? "Confirm Refund" : "Confirm Exchange"} <ChevronRight size={14} /></>
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SALE DETAIL SIDEBAR (read-only)
═══════════════════════════════════════════════════════════════ */
interface SidebarProps {
  sale: SaleRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onReturn: (sale: SaleRecord) => void;
  openSidebar: (sale: SaleRecord) => void;
}

const SaleDetailSidebar: React.FC<SidebarProps> = ({ sale, isOpen, onClose, onReturn, openSidebar }) => {
  useEffect(() => {
    if (isOpen && sale) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen, sale]);

  const canReturn = sale?.status === "Completed" && sale?.origin !== "Sales Return";
  const alreadyRet = sale?.origin === "Sales Return";

  return (
    <>
      {isOpen && (
        <div className="sr-backdrop-enter fixed inset-0 bg-black/10 z-[100]" onClick={onClose} />
      )}
      <div className={`sr-sidebar flex flex-col ${isOpen && sale ? "open" : ""}`}>
        {sale && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Sale Details</h2>
                <p className="text-[11px] text-slate-400 sr-mono mt-0.5">INV-{sale.ui_id}</p>
              </div>
              <div className="flex items-center gap-2">
                {alreadyRet && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                    <RotateCcw size={8} /> Returned
                  </span>
                )}
                <button onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors pointer-events-auto">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="sr-scroll flex-1 overflow-y-auto p-5 space-y-5">
              {/* Amount */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Total Amount</p>
                <p className="text-3xl font-light sr-mono text-slate-900">{fmt(sale.total_sellprice)}</p>
                <div className="mt-2.5">
                  {(() => {
                    const cfg = STATUS_CFG[sale.status as SaleStatus] || STATUS_CFG["Pending"];
                    return <Badge cls={cfg.cls} dot={cfg.dot} label={sale.status} />;
                  })()}
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: <User size={13} />, label: "Customer", value: sale.customer_id },
                  { icon: <Calendar size={13} />, label: "Date", value: sale.created_at.split("T")[0] },
                  { icon: <CreditCard size={13} />, label: "Payment", value: sale.payment_method },
                  { icon: <RotateCcw size={13} />, label: "Origin", value: sale.origin },
                  { icon: <Package size={13} />, label: "Items", value: `${sale.total_quantity} item${sale.total_quantity !== 1 ? "s" : ""}` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="bg-white border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                      {icon}
                      <span className="text-[9px] font-semibold uppercase tracking-widest">{label}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Order Items</p>
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                  {generateItems(sale).map((item, i) => {
                    const exchangeInfo = sale.exchanged_items?.find(ex => ex.exchanged_items.includes(item.id));
                    return (
                      <div key={i} className="flex flex-col border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50/50 transition-colors">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm" style={{ background: item.imageColor + '10' }}>
                            <Package size={16} className="text-slate-500 opacity-60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">QTY {item.quantity}</span>
                              <span className="text-[10px] text-slate-400 sr-mono">{item.sku}</span>
                              {item.status && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${item.status === "REFUNDED" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                  }`}>
                                  {item.status}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold sr-mono text-slate-900">{fmt(item.unitPrice * item.quantity)}</p>
                            <div className="flex flex-col items-end gap-0.5 mt-1">
                              <span className="text-[9px] text-slate-400">Sell: {fmt(item.unitPrice)}</span>
                              <span className="text-[9px] text-slate-400">Buy: {fmt(item.buyPrice)}</span>
                            </div>
                          </div>
                        </div>
                        {exchangeInfo && (
                          <div className="px-4 pb-3 -mt-2">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2 flex items-center justify-between">
                              <p className="text-[10px] font-medium text-blue-700 flex items-center gap-1.5">
                                <ArrowRight size={10} /> Exchanged for INV-{exchangeInfo.replacement_order.ui_id}
                              </p>
                              <button
                                onClick={() => openSidebar(exchangeInfo.replacement_order)}
                                className="text-[9px] font-bold text-blue-600 hover:underline">View Order</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exchange History Section */}
              {sale.exchanged_items && sale.exchanged_items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Exchange History</p>
                  <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                    {sale.exchanged_items.map((ex, idx) => (
                      <div key={idx} className="p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <RefreshCw size={14} className="text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800">Exchange Processed</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Original item(s) replaced with items from <span className="font-bold text-slate-700">INV-{ex.replacement_order.ui_id}</span>.
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Success</span>
                            <span className="text-[9px] text-slate-400 sr-mono">{ex.replacement_order.created_at.split("T")[0]}</span>
                            <button
                              onClick={() => openSidebar(ex.replacement_order)}
                              className="text-[9px] font-bold text-blue-600 hover:underline ml-auto">View Order</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/50 grid grid-cols-3 gap-2 pointer-events-auto">
              <button className="sr-btn-ghost py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold shadow-sm">
                Download
              </button>
              <button className="sr-btn-ghost py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold shadow-sm">
                Print
              </button>
              <button
                onClick={() => canReturn && onReturn(sale)}
                disabled={!canReturn}
                title={alreadyRet ? "Already returned" : !canReturn ? `Cannot return: ${sale.status}` : "Process return"}
                className={`py-2.5 rounded-lg text-[11px] font-semibold transition-colors border ${canReturn
                  ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-100"
                  : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
              >
                Return
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FILTER DROPDOWN
═══════════════════════════════════════════════════════════════ */
interface FilterDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}
const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const active = value !== "";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className={`sr-drop-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all ${active ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
      >
        {active ? value : label}
        {active ? (
          <X size={11} className="text-blue-400" onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }} />
        ) : (
          <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {open && (
        <div className="sr-dropdown absolute top-full left-0 mt-1.5 min-w-[130px] bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
          {options.map(opt => (
            <button key={opt}
              onClick={() => { onChange(opt === value ? "" : opt); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors hover:bg-slate-50 ${opt === value ? "text-blue-600 bg-blue-50/60" : "text-slate-700"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const SalesListPage: React.FC = () => {
  const api = useApi();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [isReturnSearchOpen, setIsReturnSearchOpen] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");

  const searchSalesForReturn = useMemo(() => {
    if (!returnSearchQuery) return [];
    const q = returnSearchQuery.toLowerCase();
    return orders.filter(s =>
      s.ui_id.toString().includes(q) ||
      s.customer_id.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [returnSearchQuery, orders]);

  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [returnSale, setReturnSale] = useState<SaleRecord | null>(null);

  const openSidebar = (sale: SaleRecord) => { setSelectedSale(sale); setIsSidebarOpen(true); };
  const closeSidebar = () => setIsSidebarOpen(false);

  const openReturn = (sale: SaleRecord) => {
    setIsSidebarOpen(false);
    setTimeout(() => setReturnSale(sale), 50);
  };

  const closeReturn = () => setReturnSale(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`);
      if (res && res.data) {
        // Normalize data for UI consistency
        const normalized = (res.data as any[]).map(s => {
          const rawPm = (s.payment_method || "Other").toUpperCase();
          const pm = rawPm === "CASH" ? "Cash" 
                   : rawPm === "CARD" ? "Card" 
                   : rawPm === "UPI" || rawPm === "G-PAY" || rawPm === "GPAY" ? "UPI"
                   : rawPm === "PHONEPE" ? "PhonePe"
                   : s.payment_method;

          return {
            ...s,
            status: s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase(),
            payment_method: pm
          };
        });
        setOrders(normalized);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => orders.filter(s => {
    const q = search.toLowerCase();
    const dateStr = s.created_at.split("T")[0];
    return (
      (!q || s.ui_id.toString().includes(q) || s.customer_id.toLowerCase().includes(q)) &&
      (!filterOrigin || s.origin === filterOrigin) &&
      (!filterPayment || s.payment_method === filterPayment) &&
      (!filterStatus || s.status.toLowerCase() === filterStatus.toLowerCase()) &&
      (!filterDate || dateStr === filterDate)
    );
  }), [search, filterOrigin, filterPayment, filterStatus, filterDate, orders]);

  const totalRevenue = useMemo(() => orders.filter(s => s.status.toLowerCase() === "completed").reduce((a, b) => a + b.total_sellprice, 0), [orders]);
  const salesCount = useMemo(() => orders.filter(s => s.origin === "Sales").length, [orders]);
  const salesReturnCount = useMemo(() => orders.filter(s => s.origin === "Sales Return").length, [orders]);
  const todayRevenue = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return orders.filter(s => s.created_at.startsWith(today) && s.status.toLowerCase() === "completed").reduce((a, b) => a + b.total_sellprice, 0);
  }, [orders]);

  const activeFilters = [filterOrigin, filterPayment, filterStatus, filterDate].filter(Boolean).length;
  const clearAll = () => {
    setFilterOrigin(""); setFilterPayment("");
    setFilterStatus(""); setFilterDate(""); setSearch("");
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="sr-root w-full flex-1 min-h-screen bg-slate-50/50 p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-5">

        {/* Stats */}
        <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-2.5 pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 touch-pan-x">
          <StatsCard iconColor="text-green-500" iconBg="bg-green-50" label="Total Revenue" icon={DollarSign} value={fmt(totalRevenue)} />
          <StatsCard iconColor="text-blue-500" iconBg="bg-blue-50" label="Total Sales" icon={BarChart2} value={salesCount} />
          <StatsCard iconColor="text-red-500" iconBg="bg-red-50" label="Sales Returns" icon={RefreshCw} value={salesReturnCount} />
          <StatsCard iconColor="text-yellow-500" iconBg="bg-yellow-50" label="Today's Revenue" icon={DollarSign} value={fmt(todayRevenue)} />
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-3 py-2 sm:px-4 sm:py-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
              placeholder="Search invoice or customer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className={`sr-drop-btn px-3 py-2 text-xs font-medium border rounded-lg outline-none cursor-pointer transition-all ${filterDate ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`} />
          <FilterDropdown label="Origin" options={["Sales", "Sales Return"]} value={filterOrigin} onChange={setFilterOrigin} />
          <FilterDropdown label="Payment" options={["Cash", "Card", "UPI"]} value={filterPayment} onChange={setFilterPayment} />
          <FilterDropdown label="Status" options={["Completed", "Pending", "Cancelled"]} value={filterStatus} onChange={setFilterStatus} />
          {activeFilters > 0 && (
            <button onClick={clearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors">
              <X size={11} /> Clear ({activeFilters})
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={() => setIsReturnSearchOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm shadow-blue-200/50"
          >
            <RotateCcw size={14} /> Process Return
          </button>
          <span className="text-xs font-medium text-slate-400 tabular-nums">{filtered.length} / {orders.length}</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Invoice", "Customer", "Origin", "Payment", "Date", "Items", "Amount", "Status", "Actions"].map((h, i) => (
                    <th key={i} className="py-2 px-3 sm:py-3 sm:px-4 first:pl-3 sm:first:pl-5 last:pr-3 sm:last:pr-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap text-left last:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Loader2 size={26} className="animate-spin mb-1 text-blue-500" />
                        <p className="text-sm font-medium text-slate-500">Fetching sales records...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Receipt size={26} className="opacity-20 mb-1" />
                        <p className="text-sm font-medium text-slate-500">No sales found</p>
                        <p className="text-xs">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(sale => {
                  const oCfg = ORIGIN_CFG[sale.origin as OriginType] || ORIGIN_CFG["Sales"];
                  const pCfg = PAYMENT_CFG[sale.payment_method as PaymentMethod] || PAYMENT_CFG["Cash"];
                  const returnable = sale.status === "Completed" && sale.origin !== "Sales Return";
                  const dateStr = sale.created_at.split("T")[0];
                  return (
                    <tr key={sale.id} className="sr-row">
                      <td className="py-2.5 pl-3 sm:pl-5 pr-3 sm:pr-4">
                        <div className="flex flex-col gap-1">
                          <span className="sr-mono text-[11px] font-medium text-slate-700">INV-{sale.ui_id}</span>
                          {sale.origin === "Sales Return" && (
                            <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter bg-red-50 px-1 rounded w-fit">Return</span>
                          )}
                          <div className="flex gap-1 flex-wrap">
                            {(sale.items || []).filter(i => i.status === "REFUNDED").length > 0 && (
                              <span className="text-[8px] font-bold text-orange-600 bg-orange-50 px-1 rounded w-fit">
                                {sale.items?.filter(i => i.status === "REFUNDED").length} Refunded
                              </span>
                            )}
                            {(sale.items || []).filter(i => i.status === "EXCHANGED").length > 0 && (
                              <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 rounded w-fit">
                                {sale.items?.filter(i => i.status === "EXCHANGED").length} Exchanged
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4">
                        <p className="text-[11px] font-medium text-slate-800 whitespace-nowrap">{sale.customer_id}</p>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4"><Badge cls={oCfg.cls} dot={oCfg.dot} label={sale.origin} /></td>
                      <td className="py-2.5 px-3 sm:px-4"><Badge cls={pCfg.cls} dot={pCfg.dot} label={sale.payment_method} /></td>
                      <td className="py-2.5 px-3 sm:px-4 text-[11px] text-slate-500 whitespace-nowrap tabular-nums">{dateStr}</td>
                      <td className="py-2.5 px-3 sm:px-4 text-center text-[11px] font-medium text-slate-600 tabular-nums">{sale.total_quantity}</td>
                      <td className="py-2.5 px-3 sm:px-4 text-right">
                        <span className="sr-mono text-[11px] font-semibold text-slate-900">{fmt(sale.total_sellprice)}</span>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4">
                        {(() => {
                          const cfg = STATUS_CFG[sale.status as SaleStatus] || STATUS_CFG["Pending"];
                          return <Badge cls={cfg.cls} dot={cfg.dot} label={sale.status} />;
                        })()}
                      </td>
                      <td className="py-2.5 pl-3 sm:pl-4 pr-3 sm:pr-5">
                        <div className=" flex items-center justify-end gap-1">
                          <button onClick={() => openSidebar(sale)}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => returnable && openReturn(sale)}
                            disabled={!returnable}
                            title={!returnable ? (sale.origin === "Sales Return" ? "Already returned" : `Status: ${sale.status}`) : "Process return"}
                            className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${returnable
                              ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                              : "text-slate-200 cursor-not-allowed"
                              }`}
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                <span className="font-medium text-slate-600">{filtered.length}</span> of{" "}
                <span className="font-medium text-slate-600">{orders.length}</span> records
              </p>
              <span className="text-xs text-slate-500">
                Filtered revenue:{" "}
                <span className="font-semibold text-slate-700 sr-mono">
                  {fmt(filtered.filter(s => s.status === "Completed").reduce((a, b) => a + b.total_sellprice, 0))}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Read-only sidebar */}
      <SaleDetailSidebar
        sale={selectedSale}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onReturn={openReturn}
        openSidebar={openSidebar}
      />

      {/* Global Return Modal */}
      {returnSale && <ReturnModal sale={returnSale} onClose={closeReturn} onRefresh={fetchOrders} />}

      {/* Return Search Modal */}
      {isReturnSearchOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center pt-24 px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsReturnSearchOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Process Return</h3>
              <button onClick={() => setIsReturnSearchOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  placeholder="Enter Invoice ID or Customer Name..."
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={returnSearchQuery}
                  onChange={e => setReturnSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {searchSalesForReturn.length > 0 ? (
                  searchSalesForReturn.map(sale => (
                    <button
                      key={sale.id}
                      onClick={() => {
                        openReturn(sale);
                        setIsReturnSearchOpen(false);
                        setReturnSearchQuery("");
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:border-blue-100 group-hover:text-blue-500 transition-all">
                        <Receipt size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-bold text-slate-800">INV-{sale.ui_id}</p>
                          <span className="text-xs font-bold sr-mono text-slate-900">{fmt(sale.total_sellprice)}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{sale.customer_id} · {sale.created_at.split('T')[0]}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                    </button>
                  ))
                ) : returnSearchQuery ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No matching orders found</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching with a different invoice ID</p>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 text-blue-500">
                      <RotateCcw size={20} />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Find an order to return</p>
                    <p className="text-xs text-slate-400 mt-1">Search by Invoice Number or Customer Name</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesListPage;