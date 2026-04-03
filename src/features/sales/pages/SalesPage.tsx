import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Search, Eye, Wifi, WifiOff, ChevronDown, X, User, Calendar,
  CreditCard, Package, RotateCcw, Receipt, AlertCircle, CheckCircle2,
  ChevronRight, Minus, Plus, Info, ArrowRight, RefreshCw, Banknote,
  Gift, ArrowLeft, Check, Loader2,
  DollarSign,
  BarChart2,
  Smartphone,
  Landmark,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   MOCK STATS CARD COMPONENT (added to make standalone code work)
═══════════════════════════════════════════════════════════════ */
const StatsCard: React.FC<{ label: string; icon: any; iconBg: string; value: string | number }> = ({ label, icon: Icon, iconBg, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 min-w-[200px] shadow-sm sr-stat">
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon size={16} className="opacity-80" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
    </div>
    <p className="text-2xl font-light sr-mono text-slate-800">{value}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type OriginType      = "Sales" | "Sales Return";
type SalesType       = "Online" | "Offline";
type PaymentMethod   = "Cash" | "Card" | "UPI";
type SaleStatus      = "Completed" | "Pending" | "Cancelled";
type ReturnMode      = "refund" | "exchange";
type ReturnType      = "Full" | "Partial";
type ReturnReason    = "Damaged" | "Wrong Item" | "Customer Request" | "Size Issue" | "Other" | "";
type SettlementMethod = "Cash" | "UPI" | "Card" | "Bank" | "Store Credit" | "";

interface SaleRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  origin: OriginType;
  salesType: SalesType;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  itemsCount: number;
  date: string;
  status: SaleStatus;
}

interface SaleItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  imageColor: string;
}

interface SelectedReturnItem extends SaleItem {
  returnQty: number;
  exchangeItemId?: string;
}

interface ExchangeProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  imageColor: string;
  inStock: boolean;
}

interface ReturnErrors {
  reason?: string;
  items?: string;
  settlement?: string;
}

// 6-step flow
type ReturnStep = 1 | 2 | 3 | 4 | 5 | 6;

interface ReturnState {
  step: ReturnStep;
  mode: ReturnMode;
  returnType: ReturnType;
  returnItems: Record<string, number>;       // itemId → returnQty
  exchangeMap: Record<string, string>;       // itemId → exchangeProductId
  reason: ReturnReason;
  notes: string;
  settlementMethod: SettlementMethod;
  errors: ReturnErrors;
  isSubmitting: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & MOCK DATA
═══════════════════════════════════════════════════════════════ */
const TODAY = "2024-04-22";

const RETURN_REASONS: Exclude<ReturnReason, "">[] = [
  "Damaged", "Wrong Item", "Customer Request", "Size Issue", "Other",
];

const ITEM_COLORS = ["#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3", "#ede9fe", "#ffedd5", "#f0fdf4", "#ecfeff"];
const ITEM_NAMES  = ["Classic White Tee", "Denim Jacket", "Canvas Sneakers", "Running Shorts", "Wool Sweater", "Cargo Pants", "Leather Belt", "Cotton Socks"];
const ITEM_CATS   = ["Tops", "Outerwear", "Footwear", "Bottoms", "Knitwear", "Bottoms", "Accessories", "Accessories"];

const MOCK_SALES: SaleRecord[] = [
  { id: "1",  invoiceNumber: "INV-2024-0041", customerName: "Arjun Mehta",      origin: "Sales",        salesType: "Online",  paymentMethod: "UPI",  totalAmount: 4850,  itemsCount: 3, date: "2024-04-22", status: "Completed" },
  { id: "2",  invoiceNumber: "INV-2024-0042", customerName: "Walk-in Customer", origin: "Sales",        salesType: "Offline", paymentMethod: "Cash", totalAmount: 1200,  itemsCount: 1, date: "2024-04-22", status: "Completed" },
  { id: "3",  invoiceNumber: "INV-2024-0043", customerName: "Priya Nair",       origin: "Sales Return", salesType: "Online",  paymentMethod: "Card", totalAmount: 9300,  itemsCount: 5, date: "2024-04-21", status: "Pending"   },
  { id: "4",  invoiceNumber: "INV-2024-0044", customerName: "Walk-in Customer", origin: "Sales",        salesType: "Offline", paymentMethod: "Cash", totalAmount: 650,   itemsCount: 2, date: "2024-04-21", status: "Completed" },
  { id: "5",  invoiceNumber: "INV-2024-0045", customerName: "Rohan Sharma",     origin: "Sales Return", salesType: "Online",  paymentMethod: "UPI",  totalAmount: 2200,  itemsCount: 2, date: "2024-04-20", status: "Cancelled" },
  { id: "6",  invoiceNumber: "INV-2024-0046", customerName: "Sneha Pillai",     origin: "Sales",        salesType: "Online",  paymentMethod: "Card", totalAmount: 15400, itemsCount: 8, date: "2024-04-20", status: "Completed" },
  { id: "7",  invoiceNumber: "INV-2024-0047", customerName: "Walk-in Customer", origin: "Sales",        salesType: "Offline", paymentMethod: "Cash", totalAmount: 480,   itemsCount: 1, date: "2024-04-20", status: "Completed" },
  { id: "8",  invoiceNumber: "INV-2024-0048", customerName: "Vikram Iyer",      origin: "Sales Return", salesType: "Online",  paymentMethod: "UPI",  totalAmount: 7700,  itemsCount: 4, date: "2024-04-19", status: "Pending"   },
  { id: "9",  invoiceNumber: "INV-2024-0049", customerName: "Meera Joshi",      origin: "Sales",        salesType: "Offline", paymentMethod: "Card", totalAmount: 3100,  itemsCount: 3, date: "2024-04-19", status: "Completed" },
  { id: "10", invoiceNumber: "INV-2024-0050", customerName: "Rahul Gupta",      origin: "Sales Return", salesType: "Online",  paymentMethod: "Card", totalAmount: 6200,  itemsCount: 4, date: "2024-04-18", status: "Cancelled" },
  { id: "11", invoiceNumber: "INV-2024-0051", customerName: "Walk-in Customer", origin: "Sales",        salesType: "Offline", paymentMethod: "Cash", totalAmount: 950,   itemsCount: 2, date: "2024-04-18", status: "Completed" },
  { id: "12", invoiceNumber: "INV-2024-0052", customerName: "Divya Krishnan",   origin: "Sales",        salesType: "Online",  paymentMethod: "UPI",  totalAmount: 11200, itemsCount: 6, date: "2024-04-17", status: "Completed" },
];

const EXCHANGE_PRODUCTS: ExchangeProduct[] = [
  { id: "ep-1", name: "Striped Linen Tee",    sku: "SKU-2201", price: 850,  imageColor: "#dbeafe", inStock: true  },
  { id: "ep-2", name: "Slim Chino Pants",     sku: "SKU-2202", price: 1400, imageColor: "#dcfce7", inStock: true  },
  { id: "ep-3", name: "Leather Sneakers",     sku: "SKU-2203", price: 2200, imageColor: "#fce7f3", inStock: false },
  { id: "ep-4", name: "Oversized Hoodie",     sku: "SKU-2204", price: 1800, imageColor: "#ede9fe", inStock: true  },
  { id: "ep-5", name: "Merino Crewneck",      sku: "SKU-2205", price: 2600, imageColor: "#fef3c7", inStock: true  },
  { id: "ep-6", name: "Cargo Shorts",         sku: "SKU-2206", price: 1100, imageColor: "#ffedd5", inStock: true  },
];

/* ═══════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════ */
const generateItems = (sale: SaleRecord): SaleItem[] =>
  Array.from({ length: sale.itemsCount }, (_, i) => ({
    id: `item-${sale.id}-${i}`,
    name: ITEM_NAMES[i % ITEM_NAMES.length],
    sku: `SKU-${String(1000 + i * 13 + parseInt(sale.id, 10) * 7).slice(-4)}`,
    category: ITEM_CATS[i % ITEM_CATS.length],
    quantity: 1 + (i % 2),
    unitPrice: Math.round(sale.totalAmount / sale.itemsCount / (1 + (i % 2))),
    imageColor: ITEM_COLORS[i % ITEM_COLORS.length],
  }));

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ═══════════════════════════════════════════════════════════════
   BADGE CONFIGS
═══════════════════════════════════════════════════════════════ */
type BadgeConfig = { cls: string; dot: string };

const ORIGIN_CFG: Record<OriginType, BadgeConfig> = {
  "Sales":        { cls: "bg-blue-50 text-blue-700 border-blue-100",        dot: "bg-blue-400"   },
  "Sales Return": { cls: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-400" },
};
const SALES_TYPE_CFG: Record<SalesType, BadgeConfig> = {
  Online:  { cls: "bg-blue-50 text-blue-700 border-blue-100",      dot: "bg-blue-400"  },
  Offline: { cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};
const PAYMENT_CFG: Record<PaymentMethod, BadgeConfig> = {
  Cash: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-400" },
  Card: { cls: "bg-purple-50 text-purple-700 border-purple-100",    dot: "bg-purple-400"  },
  UPI:  { cls: "bg-indigo-50 text-indigo-700 border-indigo-100",    dot: "bg-indigo-400"  },
};
const STATUS_CFG: Record<SaleStatus, BadgeConfig> = {
  Completed: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  Pending:   { cls: "bg-amber-50 text-amber-700 border-amber-100",       dot: "bg-amber-400"   },
  Cancelled: { cls: "bg-red-50 text-red-600 border-red-100",             dot: "bg-red-400"     },
};

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .sr-root { font-family: 'DM Sans', sans-serif; }
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
  .sr-sidebar { transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1); }

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
  2: "Type",
  3: "Items",
  4: "Reason",
  5: "Review",
  6: "Done",
};

interface StepHeaderProps {
  step: ReturnStep;
  mode: ReturnMode;
  invoice: string;
}
const StepHeader: React.FC<StepHeaderProps> = ({ step, mode, invoice }) => {
  const totalSteps = 6;
  const progress   = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="px-6 pt-5 pb-4 border-b border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
            {step < 6 ? `Step ${step} of 5` : "Complete"}
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {step === 1 ? "Choose Return Mode"
             : step === 2 ? "Return Type"
             : step === 3 ? (mode === "refund" ? "Select Items for Refund" : "Select Items to Exchange")
             : step === 4 ? "Reason & Payment"
             : step === 5 ? "Review Summary"
             : "Return Processed"}
          </p>
        </div>
        <span className="sr-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
          {invoice}
        </span>
      </div>
      {step < 6 && (
        <div className="relative">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="sr-progress h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {([1, 2, 3, 4, 5] as ReturnStep[]).map(s => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  s < step ? "bg-blue-500" : s === step ? "bg-blue-500" : "bg-slate-200"
                }`} />
                <span className={`text-[9px] font-medium tracking-wide transition-colors duration-300 ${
                  s <= step ? "text-blue-500" : "text-slate-300"
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
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5 text-[10px]" style={{color: diff > 0 ? '#92400e' : diff < 0 ? '#065f46' : '#64748b'}}>
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
  error?: string;
}
const ItemSelector: React.FC<ItemSelectorProps> = ({ items, returnItems, onToggle, onQtyChange, error }) => (
  <div>
    <div className="space-y-2">
      {items.map(item => {
        const checked = returnItems[item.id] !== undefined;
        const qty     = returnItems[item.id] ?? 1;
        return (
          <div key={item.id}
            className={`sr-item-row border rounded-xl p-3.5 ${checked ? "sel" : ""}`}
            onClick={() => onToggle(item.id)}
          >
            <div className="flex items-center gap-3">
              <input type="checkbox" className="sr-cb" checked={checked} readOnly onClick={e => e.stopPropagation()} />
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: item.imageColor }}
              >
                <Package size={14} className="text-slate-500 opacity-60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-800">{item.name}</p>
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
    </div>
    {error && (
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-red-500">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   USE RETURN ORDER HOOK
═══════════════════════════════════════════════════════════════ */
const initialState = (): ReturnState => ({
  step: 1,
  mode: "refund",
  returnType: "Partial",
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

  const setStep    = (step: ReturnStep) => setState(s => ({ ...s, step }));
  const setMode    = (mode: ReturnMode) => setState(s => ({ ...s, mode, settlementMethod: mode === "refund" ? "Cash" : "" }));
  const setReturnType = (returnType: ReturnType) => setState(s => ({ ...s, returnType, returnItems: {} }));
  const setReason  = (reason: ReturnReason) => setState(s => ({ ...s, reason, errors: { ...s.errors, reason: undefined } }));
  const setNotes   = (notes: string) => setState(s => ({ ...s, notes }));
  const setSettlementMethod = (settlementMethod: SettlementMethod) => setState(s => ({ ...s, settlementMethod, errors: { ...s.errors, settlement: undefined } }));

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

  const updateQty = useCallback((itemId: string, v: number) => {
    const item = saleItems.find(i => i.id === itemId);
    if (!item) return;
    setState(s => ({ ...s, returnItems: { ...s.returnItems, [itemId]: Math.min(Math.max(1, v), item.quantity) } }));
  }, [saleItems]);

  const setExchangeProduct = useCallback((itemId: string, productId: string) => {
    setState(s => ({ ...s, exchangeMap: { ...s.exchangeMap, [itemId]: productId } }));
  }, []);

  const selectedItems = useMemo<SelectedReturnItem[]>(() => {
    if (state.returnType === "Full") {
      return saleItems.map(i => ({
        ...i, returnQty: i.quantity, exchangeItemId: state.exchangeMap[i.id],
      }));
    }
    return saleItems
      .filter(i => state.returnItems[i.id] !== undefined)
      .map(i => ({ ...i, returnQty: state.returnItems[i.id], exchangeItemId: state.exchangeMap[i.id] }));
  }, [state.returnType, saleItems, state.returnItems, state.exchangeMap]);

  // Calculate values for exchanges and refunds
  const totals = useMemo(() => {
    const returnValue = selectedItems.reduce((s, i) => s + i.unitPrice * i.returnQty, 0);
    const exchangeValue = state.mode === "exchange"
      ? selectedItems.reduce((s, i) => {
          if (!i.exchangeItemId) return s;
          const ep = EXCHANGE_PRODUCTS.find(e => e.id === i.exchangeItemId);
          return s + (ep?.price ?? 0);
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
    if (state.returnType === "Partial" && selectedItems.length === 0) {
      errs.items = "Select at least one item.";
    }
    
    // Settlement Method is required if it's a direct refund or an exchange with a price difference
    const requiresSettlement = state.mode === "refund" || totals.diff !== 0;
    if (requiresSettlement && !state.settlementMethod) {
      errs.settlement = "Please select a payment/refund method.";
    }

    setState(s => ({ ...s, errors: errs }));
    return Object.keys(errs).length === 0;
  }, [state.reason, state.returnType, state.mode, state.settlementMethod, selectedItems, totals]);

  const goNext = useCallback(() => {
    if (state.step === 4 && !validate()) return;
    setStep((state.step + 1) as ReturnStep);
  }, [state.step, validate]);

  const goBack = useCallback(() => {
    if (state.step > 1) setStep((state.step - 1) as ReturnStep);
  }, [state.step]);

  const confirm = useCallback(async () => {
    setState(s => ({ ...s, isSubmitting: true }));
    await new Promise(r => setTimeout(r, 1400));
    setState(s => ({ ...s, isSubmitting: false, step: 6 }));
  }, []);

  const canProceed = useMemo(() => {
    if (state.step === 3) {
      return state.returnType === "Full" || selectedItems.length > 0;
    }
    return true;
  }, [state.step, state.returnType, selectedItems.length]);

  return {
    state, saleItems, selectedItems, totals,
    reset, setMode, setReturnType, setReason, setNotes, setSettlementMethod,
    toggleItem, updateQty, setExchangeProduct,
    goNext, goBack, confirm, canProceed,
  };
};

/* ═══════════════════════════════════════════════════════════════
   RETURN MODAL
═══════════════════════════════════════════════════════════════ */
interface ReturnModalProps {
  sale: SaleRecord;
  onClose: () => void;
}

const ReturnModal: React.FC<ReturnModalProps> = ({ sale, onClose }) => {
  const m = useReturnModal(sale);
  const { state, saleItems, selectedItems, totals } = m;
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // State for the exchange products search bar
  const [exchSearch, setExchSearch] = useState("");

  const filteredExchProducts = useMemo(() => {
    if (!exchSearch) return EXCHANGE_PRODUCTS;
    const lowerQ = exchSearch.toLowerCase();
    return EXCHANGE_PRODUCTS.filter(ep => 
      ep.name.toLowerCase().includes(lowerQ) || ep.sku.toLowerCase().includes(lowerQ)
    );
  }, [exchSearch]);

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
        <StepHeader step={state.step} mode={state.mode} invoice={sale.invoiceNumber} />

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
                      <span className="font-medium text-slate-700">{sale.customerName}</span>?
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

                {/* STEP 2: Return Type */}
                {state.step === 2 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Choose whether all items or specific items from this order are being returned.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { id: "Full" as ReturnType,    label: "Full Return",    desc: `All ${sale.itemsCount} items`, icon: <RotateCcw size={16} /> },
                        { id: "Partial" as ReturnType, label: "Partial Return", desc: "Select specific items",         icon: <Package size={16} /> },
                      ]).map(opt => (
                        <button key={opt.id}
                          onClick={() => m.setReturnType(opt.id)}
                          className={`sr-mode-pill text-left p-4 border-2 rounded-xl transition-all ${state.returnType === opt.id ? "active" : "border-slate-100 text-slate-500 hover:border-slate-200"}`}
                        >
                          <div className={`mb-2 ${state.returnType === opt.id ? "text-blue-500" : "text-slate-400"}`}>{opt.icon}</div>
                          <p className="text-sm font-semibold text-slate-800 mb-0.5">{opt.label}</p>
                          <p className="text-[11px] text-slate-400">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                    {state.returnType === "Full" && (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                        <Info size={12} className="text-blue-400 shrink-0" />
                        <p className="text-[11px] text-blue-600">All {sale.itemsCount} items from this order will be returned.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: Items */}
                {state.step === 3 && (
                  <div className="space-y-4">
                    {state.returnType === "Partial" ? (
                      <ItemSelector
                        items={saleItems}
                        returnItems={state.returnItems}
                        onToggle={m.toggleItem}
                        onQtyChange={m.updateQty}
                        error={state.errors.items}
                      />
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 mb-1">All items will be returned:</p>
                        {saleItems.map(item => (
                          <div key={item.id} className="flex items-center gap-3 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.imageColor }}>
                              <Package size={13} className="text-slate-400 opacity-60" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700">{item.name}</p>
                              <p className="text-[10px] text-slate-400 sr-mono">{item.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold sr-mono text-slate-700">{fmt(item.unitPrice * item.quantity)}</p>
                              <p className="text-[10px] text-slate-400">qty {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Exchange product picker with Search Bar */}
                    {state.mode === "exchange" && selectedItems.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3 mt-2">
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                            Select Replacement Items
                          </p>
                        </div>
                        
                        {/* Search Bar for Exchange Products */}
                        <div className="relative mb-5">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search exchange products by name or SKU..."
                            value={exchSearch}
                            onChange={(e) => setExchSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all placeholder-slate-400"
                          />
                        </div>

                        {selectedItems.map(selItem => (
                          <div key={selItem.id} className="mb-6">
                            <p className="text-[11px] font-medium text-slate-500 mb-2.5 flex items-center gap-1.5">
                              <ArrowRight size={10} className="text-slate-400" />
                              Replacing: <span className="text-slate-800 font-semibold">{selItem.name}</span>
                              <span className="text-slate-400 sr-mono ml-auto">Value: {fmt(selItem.unitPrice * selItem.returnQty)}</span>
                            </p>
                            
                            {filteredExchProducts.length === 0 ? (
                              <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-400">No products found matching "{exchSearch}"</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {filteredExchProducts.map(ep => {
                                  const selected = state.exchangeMap[selItem.id] === ep.id;
                                  return (
                                    <div key={ep.id}
                                      onClick={() => ep.inStock && m.setExchangeProduct(selItem.id, ep.id)}
                                      className={`sr-exch-card border rounded-xl p-3 ${selected ? "selected" : ""} ${!ep.inStock ? "disabled" : ""}`}
                                    >
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: ep.imageColor }}>
                                          <Package size={12} className="text-slate-400 opacity-60" />
                                        </div>
                                        {selected && (
                                          <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                            <Check size={9} className="text-white" />
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-[11px] font-medium text-slate-800 leading-snug">{ep.name}</p>
                                      <div className="flex items-center justify-between mt-1">
                                        <p className="text-[10px] sr-mono font-semibold text-slate-600">{fmt(ep.price)}</p>
                                        {!ep.inStock && <span className="text-[9px] text-red-400 font-medium">Out of stock</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: Reason & Payment/Refund Selection */}
                {state.step === 4 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                        Return Reason <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={state.reason}
                        onChange={e => m.setReason(e.target.value as ReturnReason)}
                        className={`sr-select w-full px-3.5 py-2.5 text-xs border rounded-xl bg-white text-slate-700 outline-none transition-all pr-9 ${
                          state.errors.reason
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
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                totals.diff > 0 ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
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

                {/* STEP 5: Review */}
                {state.step === 5 && (
                  <div className="space-y-4">
                    <RefundSummary
                      mode={state.mode}
                      selectedItems={selectedItems}
                      totals={totals}
                      settlementMethod={state.settlementMethod}
                      originalPayment={sale.paymentMethod}
                    />

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                        Items
                      </p>
                      <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                        {selectedItems.map(item => {
                          const exchProd = item.exchangeItemId ? EXCHANGE_PRODUCTS.find(e => e.id === item.exchangeItemId) : null;
                          return (
                            <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.imageColor }}>
                                <Package size={12} className="text-slate-400 opacity-60" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-800">{item.name}</p>
                                <p className="text-[10px] text-slate-400 sr-mono">
                                  {item.sku} · qty {item.returnQty}
                                  {exchProd && <span className="text-blue-500"> → {exchProd.name}</span>}
                                </p>
                              </div>
                              <span className="text-xs font-semibold sr-mono text-slate-700">{fmt(item.unitPrice * item.returnQty)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: "Mode",   value: state.mode === "refund" ? "Refund" : "Exchange" },
                        { label: "Type",   value: `${state.returnType} Return` },
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

                {/* STEP 6: Done */}
                {state.step === 6 && (
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
                        { label: "Invoice", value: sale.invoiceNumber },
                        { label: "Mode",    value: state.mode === "refund" ? "Refund" : "Exchange" },
                        { label: "Reason",  value: state.reason },
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

            {/* Footer */}
            {state.step < 6 && (
              <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-2.5">
                {state.step > 1 && (
                  <button onClick={m.goBack}
                    className="sr-btn-ghost flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl">
                    <ArrowLeft size={13} />
                    Back
                  </button>
                )}
                {state.step < 5 ? (
                  <button onClick={m.goNext}
                    disabled={!m.canProceed}
                    className="sr-btn-primary flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                    Continue
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button onClick={m.confirm}
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
}

const SaleDetailSidebar: React.FC<SidebarProps> = ({ sale, isOpen, onClose, onReturn }) => {
  const canReturn  = sale?.status === "Completed" && sale?.origin !== "Sales Return";
  const alreadyRet = sale?.origin === "Sales Return";

  return (
    <>
      {isOpen && (
        <div className="sr-backdrop-enter fixed inset-0 bg-black/10 z-[100]" onClick={onClose} />
      )}
      <div className={`sr-sidebar fixed top-0 right-0 h-full w-full max-w-[400px] bg-white shadow-2xl z-[110] border-l border-slate-200 flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        {sale && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Sale Details</h2>
                <p className="text-[11px] text-slate-400 sr-mono mt-0.5">{sale.invoiceNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                {alreadyRet && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                    <RotateCcw size={8} /> Returned
                  </span>
                )}
                <button onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="sr-scroll flex-1 overflow-y-auto p-5 space-y-5">
              {/* Amount */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Total Amount</p>
                <p className="text-3xl font-light sr-mono text-slate-900">{fmt(sale.totalAmount)}</p>
                <div className="mt-2.5">
                  <Badge cls={STATUS_CFG[sale.status].cls} dot={STATUS_CFG[sale.status].dot} label={sale.status} />
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: <User size={13} />,        label: "Customer",  value: sale.customerName },
                  { icon: <Calendar size={13} />,    label: "Date",      value: sale.date },
                  { icon: <CreditCard size={13} />,  label: "Payment",   value: sale.paymentMethod },
                  { icon: <RotateCcw size={13} />,   label: "Origin",    value: sale.origin },
                  { icon: sale.salesType === "Online" ? <Wifi size={13} /> : <WifiOff size={13} />, label: "Channel", value: sale.salesType },
                  { icon: <Package size={13} />,     label: "Items",     value: `${sale.itemsCount} item${sale.itemsCount !== 1 ? "s" : ""}` },
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
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Order Items</p>
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {generateItems(sale).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 bg-white">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.imageColor }}>
                        <Package size={14} className="text-slate-400 opacity-60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400">qty {item.quantity} · <span className="sr-mono">{item.sku}</span></p>
                      </div>
                      <span className="text-xs font-semibold sr-mono text-slate-900">{fmt(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/50 grid grid-cols-3 gap-2">
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
                className={`py-2.5 rounded-lg text-[11px] font-semibold transition-colors border ${
                  canReturn
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
        className={`sr-drop-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all ${
          active ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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
              className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors hover:bg-slate-50 ${
                opt === value ? "text-blue-600 bg-blue-50/60" : "text-slate-700"
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
  const [search,        setSearch]        = useState("");
  const [filterOrigin,  setFilterOrigin]  = useState("");
  const [filterType,    setFilterType]    = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");
  const [filterDate,    setFilterDate]    = useState("");

  const [selectedSale,  setSelectedSale]  = useState<SaleRecord | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [returnSale,    setReturnSale]    = useState<SaleRecord | null>(null);

  const openSidebar = (sale: SaleRecord) => { setSelectedSale(sale); setIsSidebarOpen(true); };
  const closeSidebar = () => setIsSidebarOpen(false);

  const openReturn = (sale: SaleRecord) => {
    setIsSidebarOpen(false);
    setTimeout(() => setReturnSale(sale), 50);
  };

  const closeReturn = () => setReturnSale(null);

  // Stats
  const totalRevenue     = MOCK_SALES.filter(s => s.status === "Completed").reduce((a, b) => a + b.totalAmount, 0);
  const salesCount       = MOCK_SALES.filter(s => s.origin === "Sales").length;
  const salesReturnCount = MOCK_SALES.filter(s => s.origin === "Sales Return").length;
  const todayRevenue     = MOCK_SALES.filter(s => s.date === TODAY && s.status === "Completed").reduce((a, b) => a + b.totalAmount, 0);

  const filtered = useMemo(() => MOCK_SALES.filter(s => {
    const q = search.toLowerCase();
    return (
      (!q            || s.invoiceNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q)) &&
      (!filterOrigin  || s.origin        === filterOrigin)  &&
      (!filterType    || s.salesType     === filterType)    &&
      (!filterPayment || s.paymentMethod === filterPayment) &&
      (!filterStatus  || s.status        === filterStatus)  &&
      (!filterDate    || s.date          === filterDate)
    );
  }), [search, filterOrigin, filterType, filterPayment, filterStatus, filterDate]);

  const activeFilters = [filterOrigin, filterType, filterPayment, filterStatus, filterDate].filter(Boolean).length;
  const clearAll = () => {
    setFilterOrigin(""); setFilterType(""); setFilterPayment("");
    setFilterStatus(""); setFilterDate(""); setSearch("");
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="sr-root min-h-screen bg-slate-50/50 p-6 space-y-5">

        {/* Stats */}
        <div className="flex gap-3 flex-wrap">
          <StatsCard label="Total Revenue" icon={DollarSign} iconBg="bg-green-50"      value={fmt(totalRevenue)} />
          <StatsCard label="Total Sales" icon={BarChart2} iconBg="bg-blue-50"        value={salesCount} />
          <StatsCard label="Sales Returns" icon={RefreshCw} iconBg="bg-red-50"      value={salesReturnCount} />
          <StatsCard label="Today's Revenue" icon={DollarSign} iconBg="bg-yellow-50"    value={fmt(todayRevenue)} />
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2.5">
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
            className={`sr-drop-btn px-3 py-2 text-xs font-medium border rounded-lg outline-none cursor-pointer transition-all ${
              filterDate ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`} />
          <FilterDropdown label="Origin"  options={["Sales", "Sales Return"]}             value={filterOrigin}  onChange={setFilterOrigin}  />
          <FilterDropdown label="Type"    options={["Online", "Offline"]}                 value={filterType}    onChange={setFilterType}    />
          <FilterDropdown label="Payment" options={["Cash", "Card", "UPI"]}               value={filterPayment} onChange={setFilterPayment} />
          <FilterDropdown label="Status"  options={["Completed", "Pending", "Cancelled"]} value={filterStatus}  onChange={setFilterStatus}  />
          {activeFilters > 0 && (
            <button onClick={clearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors">
              <X size={11} /> Clear ({activeFilters})
            </button>
          )}
          <div className="flex-1" />
          <span className="text-xs font-medium text-slate-400 tabular-nums">{filtered.length} / {MOCK_SALES.length}</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Invoice", "Customer", "Type", "Origin", "Payment", "Date", "Items", "Amount", "Status", "Actions"].map((h, i) => (
                    <th key={i} className="py-3 px-4 first:pl-5 last:pr-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap text-left last:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
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
                  const oCfg = ORIGIN_CFG[sale.origin];
                  const tCfg = SALES_TYPE_CFG[sale.salesType];
                  const pCfg = PAYMENT_CFG[sale.paymentMethod];
                  const sCfg = STATUS_CFG[sale.status];
                  const returnable = sale.status === "Completed" && sale.origin !== "Sales Return";
                  return (
                    <tr key={sale.id} className="sr-row">
                      <td className="py-3.5 pl-5 pr-4">
                        <span className="sr-mono text-xs font-medium text-slate-700">{sale.invoiceNumber}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-xs font-medium text-slate-800 whitespace-nowrap">{sale.customerName}</p>
                      </td>
                      <td className="py-3.5 px-4"><Badge cls={oCfg.cls} dot={oCfg.dot} label={sale.origin} /></td>
                      <td className="py-3.5 px-4"><Badge cls={tCfg.cls} dot={tCfg.dot} label={sale.salesType} /></td>
                      <td className="py-3.5 px-4"><Badge cls={pCfg.cls} dot={pCfg.dot} label={sale.paymentMethod} /></td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap tabular-nums">{sale.date}</td>
                      <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-600 tabular-nums">{sale.itemsCount}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="sr-mono text-xs font-semibold text-slate-900">{fmt(sale.totalAmount)}</span>
                      </td>
                      <td className="py-3.5 px-4"><Badge cls={sCfg.cls} dot={sCfg.dot} label={sale.status} /></td>
                      <td className="py-3.5 pl-4 pr-5">
                        <div className=" flex items-center justify-end gap-1">
                          <button onClick={() => openSidebar(sale)}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => returnable && openReturn(sale)}
                            disabled={!returnable}
                            title={!returnable ? (sale.origin === "Sales Return" ? "Already returned" : `Status: ${sale.status}`) : "Process return"}
                            className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${
                              returnable
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
                <span className="font-medium text-slate-600">{MOCK_SALES.length}</span> records
              </p>
              <span className="text-xs text-slate-500">
                Filtered revenue:{" "}
                <span className="font-semibold text-slate-700 sr-mono">
                  {fmt(filtered.filter(s => s.status === "Completed").reduce((a, b) => a + b.totalAmount, 0))}
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
      />

      {/* Global Return Modal */}
      {returnSale && <ReturnModal sale={returnSale} onClose={closeReturn} />}
    </>
  );
};

export default SalesListPage;