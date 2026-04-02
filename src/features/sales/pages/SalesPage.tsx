import { useState, useMemo, useCallback } from "react";
import {
  Search, Eye, 
  ShoppingCart, Wifi, WifiOff, ChevronDown, X, User, Calendar,
  CreditCard, Package, RotateCcw, Receipt, AlertCircle, CheckCircle2,
  ArrowLeft, ChevronRight, Minus, Plus, Info,
} from "lucide-react";
import { StatsCard} from "@/components/common/StatsCard";

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
type OriginType    = "Sales" | "Sales Return";
type SalesType     = "Online" | "Offline";
type PaymentMethod = "Cash" | "Card" | "UPI";
type SaleStatus    = "Completed" | "Pending" | "Cancelled";
type ReturnType    = "Full" | "Partial";
type ReturnReason  = "Damaged" | "Wrong Item" | "Customer Request" | "Other" | "";

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
  quantity: number;
  unitPrice: number;
}

interface SelectedItem extends SaleItem {
  returnQty: number;
}

interface ReturnErrors {
  reason?: string;
  items?: string;
}

interface ReturnPayload {
  sale_id: string;
  return_items: { product_id: string; name: string; quantity: number; unit_price: number }[];
  reason: ReturnReason;
  notes: string;
  refund_amount: number;
  return_type: ReturnType;
}

interface UseReturnOrderReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  back: () => void;
  step: number;
  returnType: ReturnType;
  setReturnType: (t: ReturnType) => void;
  returnItems: Record<string, number>;
  toggleItem: (itemId: string) => void;
  updateQty: (itemId: string, delta: number) => void;
  returnReason: ReturnReason;
  setReturnReason: (r: ReturnReason) => void;
  notes: string;
  setNotes: (n: string) => void;
  errors: ReturnErrors;
  saleItems: SaleItem[];
  selectedItems: SelectedItem[];
  refundAmount: number;
  review: () => void;
  confirm: () => void;
}

interface BadgeConfig {
  cls: string;
  dot: string;
}

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const RETURN_REASONS: Exclude<ReturnReason, "">[] = [
  "Damaged", "Wrong Item", "Customer Request", "Other",
];

const TODAY = "2024-04-22";

/* ═══════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   BADGE CONFIGS
═══════════════════════════════════════════════ */
const ORIGIN_CFG: Record<OriginType, BadgeConfig> = {
  "Sales":        { cls: "bg-blue-50 text-blue-700 border-blue-100",       dot: "bg-blue-400"   },
  "Sales Return": { cls: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-400" },
};

const SALES_TYPE_CFG: Record<SalesType, BadgeConfig> = {
  Online:  { cls: "bg-blue-50 text-blue-700 border-blue-100",     dot: "bg-blue-400"  },
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

/* ═══════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════ */
const ITEM_NAMES = [
  "Classic White Tee", "Denim Jacket", "Canvas Sneakers", "Running Shorts",
  "Wool Sweater", "Cargo Pants", "Leather Belt", "Cotton Socks",
];

const generateItems = (sale: SaleRecord): SaleItem[] =>
  Array.from({ length: sale.itemsCount }, (_, i) => ({
    id: `item-${sale.id}-${i}`,
    name: ITEM_NAMES[i % ITEM_NAMES.length],
    sku: `SKU-${String(1000 + i * 13 + parseInt(sale.id, 10) * 7).slice(-4)}`,
    quantity: 1 + (i % 2),
    unitPrice: Math.round(sale.totalAmount / sale.itemsCount / (1 + (i % 2))),
  }));

const totalUnits = (items: SelectedItem[]): number =>
  items.reduce((s, i) => s + i.returnQty, 0);

/* ═══════════════════════════════════════════════
   SCOPED STYLES
═══════════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .sales-root { font-family: 'DM Sans', sans-serif; }
  .sales-mono { font-family: 'DM Mono', monospace; }

  .sales-row { transition: background-color 0.1s ease; }
  .sales-row:hover { background-color: #f8fafc; }
  .sales-row:hover .sales-row-actions { opacity: 1; }
  .sales-row-actions { opacity: 0; transition: opacity 0.15s ease; }

  .sales-filter-btn { transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease; }

  .sales-dropdown {
    animation: salesDrop 0.12s ease forwards;
    transform-origin: top left;
  }
  @keyframes salesDrop {
    from { opacity: 0; transform: scale(0.96) translateY(-4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .return-modal-enter {
    animation: returnSlideUp 0.22s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
  }
  @keyframes returnSlideUp {
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .return-step-fade {
    animation: stepFade 0.18s ease forwards;
  }
  @keyframes stepFade {
    from { opacity: 0; transform: translateX(6px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .return-done-pop {
    animation: donePop 0.3s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
  }
  @keyframes donePop {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1); }
  }

  .return-item-row { transition: background-color 0.12s ease, border-color 0.12s ease; }
  .return-item-row.selected { background-color: #eff6ff; border-color: #bfdbfe; }
  .return-item-row:not(.selected):hover { background-color: #f8fafc; }

  .return-checkbox {
    appearance: none;
    width: 16px; height: 16px;
    border: 1.5px solid #d1d5db;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    transition: all 0.12s ease;
    position: relative;
    flex-shrink: 0;
  }
  .return-checkbox:checked { background: #2563eb; border-color: #2563eb; }
  .return-checkbox:checked::after {
    content: '';
    position: absolute;
    left: 4px; top: 1.5px;
    width: 5px; height: 8px;
    border: 1.5px solid white;
    border-top: none; border-left: none;
    transform: rotate(42deg);
  }

  .step-dot { transition: all 0.2s ease; }

  .type-pill { transition: all 0.15s ease; }
  .type-pill.active { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }

  select.return-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }

  .qty-btn { transition: background-color 0.1s ease; }
  .qty-btn:hover:not(:disabled) { background-color: #e0e7ff; }
  .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
`;

/* ═══════════════════════════════════════════════
   USE RETURN HOOK
═══════════════════════════════════════════════ */
const useReturnOrder = (sale: SaleRecord | null): UseReturnOrderReturn => {
  const [isOpen,       setIsOpen]       = useState(false);
  const [step,         setStep]         = useState(1);
  const [returnType,   setReturnType]   = useState<ReturnType>("Partial");
  const [returnItems,  setReturnItems]  = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState<ReturnReason>("");
  const [notes,        setNotes]        = useState("");
  const [errors,       setErrors]       = useState<ReturnErrors>({});

  const saleItems = useMemo<SaleItem[]>(
    () => (sale ? generateItems(sale) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sale?.id],
  );

  const open = useCallback(() => {
    setIsOpen(true);
    setStep(1);
    setReturnType("Partial");
    setReturnItems({});
    setReturnReason("");
    setNotes("");
    setErrors({});
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const back  = useCallback(() => setStep(s => s - 1), []);

  const toggleItem = useCallback((itemId: string) => {
    setReturnItems(prev => {
      const next = { ...prev };
      if (next[itemId] !== undefined) {
        delete next[itemId];
      } else {
        const item = saleItems.find(i => i.id === itemId);
        next[itemId] = item?.quantity ?? 1;
      }
      return next;
    });
    setErrors(e => ({ ...e, items: undefined }));
  }, [saleItems]);

  const updateQty = useCallback((itemId: string, delta: number) => {
    const item = saleItems.find(i => i.id === itemId);
    if (!item) return;
    setReturnItems(prev => {
      const current = prev[itemId] ?? 1;
      const next = Math.min(Math.max(1, current + delta), item.quantity);
      return { ...prev, [itemId]: next };
    });
  }, [saleItems]);

  const selectedItems = useMemo<SelectedItem[]>(() => {
    if (returnType === "Full") return saleItems.map(i => ({ ...i, returnQty: i.quantity }));
    return saleItems
      .filter(i => returnItems[i.id] !== undefined)
      .map(i => ({ ...i, returnQty: returnItems[i.id] }));
  }, [returnType, saleItems, returnItems]);

  const refundAmount = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.unitPrice * i.returnQty, 0),
    [selectedItems],
  );

  const validate = useCallback((): boolean => {
    const errs: ReturnErrors = {};
    if (!returnReason) errs.reason = "Please select a return reason.";
    if (returnType === "Partial" && selectedItems.length === 0)
      errs.items = "Select at least one item to return.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [returnReason, returnType, selectedItems]);

  const review = useCallback(() => {
    if (validate()) setStep(2);
  }, [validate]);

  const confirm = useCallback(() => {
    const payload: ReturnPayload = {
      sale_id: sale?.id ?? "",
      return_items: selectedItems.map(i => ({
        product_id: i.id,
        name: i.name,
        quantity: i.returnQty,
        unit_price: i.unitPrice,
      })),
      reason: returnReason,
      notes,
      refund_amount: refundAmount,
      return_type: returnType,
    };
    console.log("Return payload:", payload);
    setStep(3);
  }, [sale, selectedItems, returnReason, notes, refundAmount, returnType]);

  return {
    isOpen, open, close, back,
    step, returnType, setReturnType,
    returnItems, toggleItem, updateQty,
    returnReason, setReturnReason,
    notes, setNotes,
    errors,
    saleItems, selectedItems,
    refundAmount, review, confirm,
  };
};

/* ═══════════════════════════════════════════════
   SMALL SHARED COMPONENTS
═══════════════════════════════════════════════ */
const Badge: React.FC<{ cls: string; dot: string; label: string }> = ({ cls, dot, label }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
    {label}
  </span>
);

const StepDots: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex items-center gap-2 justify-center">
    {[1, 2].map(n => (
      <div key={n} className={`step-dot rounded-full ${
        n === step      ? "w-5 h-1.5 bg-blue-500"
        : n < step      ? "w-2 h-1.5 bg-blue-300"
        :                 "w-2 h-1.5 bg-zinc-200"
      }`} />
    ))}
  </div>
);

/* ═══════════════════════════════════════════════
   FILTER DROPDOWN
═══════════════════════════════════════════════ */
interface FilterDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const active = value !== "";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={`sales-filter-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all ${
          active ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
        }`}
      >
        {active ? value : label}
        {active ? (
          <X size={11} className="text-blue-500"
            onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }} />
        ) : (
          <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="sales-dropdown absolute top-full left-0 mt-1.5 min-w-[130px] bg-white border border-zinc-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
          {options.map(opt => (
            <button key={opt}
              onClick={() => { onChange(opt === value ? "" : opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-zinc-50 ${
                opt === value ? "text-blue-600 bg-blue-50" : "text-zinc-700"
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

/* ═══════════════════════════════════════════════
   RETURN ORDER MODAL
═══════════════════════════════════════════════ */
interface ReturnOrderModalProps {
  sale: SaleRecord;
  r: UseReturnOrderReturn;
  onClose: () => void;
}

const ReturnOrderModal: React.FC<ReturnOrderModalProps> = ({ sale, r, onClose }) => {
  const canReturn  = sale.status === "Completed" && sale.origin !== "Sales Return";
  const alreadyRet = sale.origin === "Sales Return";

  /* ── Ineligible state ── */
  if (!canReturn) {
    return (
      <div className="return-modal-enter absolute inset-0 bg-white z-10 flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-medium text-zinc-700">Return Order</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <AlertCircle size={22} className={alreadyRet ? "text-orange-400" : "text-red-400"} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800 mb-1">
              {alreadyRet ? "Already Returned" : "Return Unavailable"}
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {alreadyRet
                ? "This order was already processed as a return and cannot be returned again."
                : `Orders with status "${sale.status}" cannot be returned. Only Completed orders are eligible.`}
            </p>
          </div>
          <button onClick={onClose}
            className="mt-2 px-4 py-2 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const units = totalUnits(r.selectedItems);

  return (
    <div className="return-modal-enter absolute inset-0 bg-white z-10 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={r.step > 1 ? r.back : onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-sm font-medium text-zinc-800">
              {r.step === 1 ? "Return Details" : r.step === 2 ? "Review Return" : "Return Confirmed"}
            </p>
            <p className="text-[11px] text-zinc-400 sales-mono mt-0.5">{sale.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {r.step < 3 && <StepDots step={r.step} />}
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── STEP 1: Form ── */}
      {r.step === 1 && (
        <div className="return-step-fade flex-1 overflow-y-auto p-5 space-y-5">

          {/* Return Type */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2.5">
              Return Type
            </label>
            <div className="flex gap-2">
              {(["Full", "Partial"] as ReturnType[]).map(t => (
                <button key={t} onClick={() => r.setReturnType(t)}
                  className={`type-pill flex-1 py-2.5 text-xs font-medium border rounded-lg ${
                    r.returnType === t ? "active" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  }`}>
                  {t === "Full" ? "Full Return" : "Partial Return"}
                </button>
              ))}
            </div>
            {r.returnType === "Full" && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-500">
                <Info size={11} />
                All {sale.itemsCount} item{sale.itemsCount > 1 ? "s" : ""} will be returned
              </p>
            )}
          </div>

          {/* Item Selection */}
          {r.returnType === "Partial" && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2.5">
                Select Items
              </label>
              <div className="space-y-2">
                {r.saleItems.map(item => {
                  const checked = r.returnItems[item.id] !== undefined;
                  const retQty  = r.returnItems[item.id] ?? 1;
                  return (
                    <div key={item.id}
                      className={`return-item-row border rounded-xl p-3.5 cursor-pointer ${checked ? "selected" : ""}`}
                      onClick={() => r.toggleItem(item.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input type="checkbox" className="return-checkbox mt-0.5" checked={checked} readOnly />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-medium text-zinc-800 leading-snug">{item.name}</p>
                              <p className="text-[10px] text-zinc-400 sales-mono mt-0.5">{item.sku}</p>
                            </div>
                            <p className="text-xs font-semibold text-zinc-700 sales-mono shrink-0">
                              ₹{item.unitPrice.toLocaleString()}
                            </p>
                          </div>
                          {checked && (
                            <div className="mt-2.5 flex items-center gap-3"
                              onClick={e => e.stopPropagation()}>
                              <span className="text-[11px] text-zinc-500">Return qty:</span>
                              <div className="flex items-center gap-1 bg-white border border-indigo-100 rounded-lg overflow-hidden">
                                <button className="qty-btn w-7 h-7 flex items-center justify-center text-indigo-400"
                                  disabled={retQty <= 1}
                                  onClick={() => r.updateQty(item.id, -1)}>
                                  <Minus size={11} />
                                </button>
                                <span className="w-6 text-center text-xs font-semibold text-zinc-800 tabular-nums sales-mono">
                                  {retQty}
                                </span>
                                <button className="qty-btn w-7 h-7 flex items-center justify-center text-indigo-400"
                                  disabled={retQty >= item.quantity}
                                  onClick={() => r.updateQty(item.id, 1)}>
                                  <Plus size={11} />
                                </button>
                              </div>
                              <span className="text-[11px] text-zinc-400">of {item.quantity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {r.errors.items && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-red-500">
                  <AlertCircle size={11} /> {r.errors.items}
                </p>
              )}
            </div>
          )}

          {/* Return Reason */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2.5">
              Return Reason <span className="text-red-400 normal-case">*</span>
            </label>
            <select
              value={r.returnReason}
              onChange={e => r.setReturnReason(e.target.value as ReturnReason)}
              className={`return-select w-full px-3.5 py-2.5 text-xs border rounded-xl bg-white text-zinc-700 outline-none transition-all pr-9 ${
                r.errors.reason
                  ? "border-red-200 bg-red-50/30"
                  : "border-zinc-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10"
              }`}
            >
              <option value="">Select a reason…</option>
              {RETURN_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            {r.errors.reason && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-500">
                <AlertCircle size={11} /> {r.errors.reason}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2.5">
              Notes <span className="text-zinc-300 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={r.notes}
              onChange={e => r.setNotes(e.target.value)}
              rows={2}
              placeholder="Add any additional context…"
              className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl bg-white text-zinc-700 outline-none resize-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-zinc-300"
            />
          </div>

          {/* Live refund preview */}
          {r.selectedItems.length > 0 && (
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-blue-500 font-medium uppercase tracking-wide mb-0.5">Estimated Refund</p>
                  <p className="text-xl font-semibold text-blue-700 sales-mono">
                    ₹{r.refundAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-zinc-400 mb-0.5">Items selected</p>
                  <p className="text-sm font-semibold text-zinc-600">
                    {units} unit{units !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Review ── */}
      {r.step === 2 && (
        <div className="return-step-fade flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-1">Refund Amount</p>
            <p className="text-4xl font-light text-blue-700 sales-mono">₹{r.refundAmount.toLocaleString()}</p>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Package size={11} className="text-zinc-400" />
                {units} item{units !== 1 ? "s" : ""} returned
              </span>
              <span className="text-zinc-200">|</span>
              <span>
                Updated total:{" "}
                <span className="font-semibold text-zinc-700 sales-mono">
                  ₹{(sale.totalAmount - r.refundAmount).toLocaleString()}
                </span>
              </span>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2.5">
              Items Being Returned
            </p>
            <div className="border border-zinc-100 rounded-xl divide-y divide-zinc-100 overflow-hidden">
              {r.selectedItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                  <div className="w-7 h-7 bg-zinc-50 rounded-lg flex items-center justify-center shrink-0">
                    <Package size={13} className="text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-800">{item.name}</p>
                    <p className="text-[10px] text-zinc-400 sales-mono">{item.sku} · qty {item.returnQty}</p>
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 sales-mono">
                    ₹{(item.unitPrice * item.returnQty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-zinc-100 rounded-xl p-3.5">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Reason</p>
              <p className="text-xs font-medium text-zinc-700">{r.returnReason}</p>
            </div>
            <div className="bg-white border border-zinc-100 rounded-xl p-3.5">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Type</p>
              <p className="text-xs font-medium text-zinc-700">{r.returnType} Return</p>
            </div>
          </div>

          {r.notes && (
            <div className="bg-white border border-zinc-100 rounded-xl p-3.5">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-xs text-zinc-600 leading-relaxed">{r.notes}</p>
            </div>
          )}

          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              This action will mark the order as a Sales Return and initiate a refund of{" "}
              <span className="font-semibold">₹{r.refundAmount.toLocaleString()}</span>. This cannot be undone.
            </p>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {r.step === 3 && (
        <div className="return-step-fade flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
          <div className="return-done-pop w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-800 mb-1.5">Return Processed</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              A refund of{" "}
              <span className="font-semibold text-zinc-700 sales-mono">₹{r.refundAmount.toLocaleString()}</span>{" "}
              has been initiated for {units} item{units !== 1 ? "s" : ""}.
            </p>
          </div>
          <div className="w-full bg-zinc-50 border border-zinc-100 rounded-xl divide-y divide-zinc-100 text-left overflow-hidden">
            {[
              { label: "Invoice", value: sale.invoiceNumber, cls: "sales-mono text-zinc-700" },
              { label: "Refund",  value: `₹${r.refundAmount.toLocaleString()}`, cls: "sales-mono text-emerald-600 font-semibold" },
              { label: "Reason",  value: r.returnReason,    cls: "text-zinc-700" },
            ].map(row => (
              <div key={row.label} className="px-4 py-3 flex justify-between">
                <span className="text-[11px] text-zinc-400">{row.label}</span>
                <span className={`text-[11px] ${row.cls}`}>{row.value}</span>
              </div>
            ))}
          </div>
          <button onClick={onClose}
            className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors">
            Done
          </button>
        </div>
      )}

      {/* Footer actions */}
      {r.step < 3 && (
        <div className="shrink-0 px-5 py-4 border-t border-zinc-100 bg-white">
          {r.step === 1 && (
            <button onClick={r.review}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200">
              Review Return
              <ChevronRight size={14} />
            </button>
          )}
          {r.step === 2 && (
            <div className="flex gap-2.5">
              <button onClick={r.back}
                className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-xs font-semibold hover:bg-zinc-50 transition-colors">
                Edit
              </button>
              <button onClick={r.confirm}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                Confirm Return
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
interface SidebarProps {
  sale: SaleRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const SaleDetailSidebar: React.FC<SidebarProps> = ({ sale, isOpen, onClose }) => {
  const r = useReturnOrder(sale);
  const [showReturn, setShowReturn] = useState(false);

  const canReturn  = sale?.status === "Completed" && sale?.origin !== "Sales Return";
  const alreadyRet = sale?.origin === "Sales Return";

  const openReturn  = () => { r.open(); setShowReturn(true); };
  const closeReturn = () => setShowReturn(false);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" onClick={onClose} />
      )}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out border-l border-zinc-200 flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        {sale && (
          <div className="relative flex-1 overflow-hidden flex flex-col">

            {showReturn && <ReturnOrderModal sale={sale} r={r} onClose={closeReturn} />}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Sale Details</h2>
                <p className="text-xs text-zinc-500 sales-mono mt-0.5">{sale.invoiceNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                {alreadyRet && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                    <RotateCcw size={9} /> Already Returned
                  </span>
                )}
                <button onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100 flex flex-col items-center text-center">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Total Amount</span>
                <span className="text-4xl font-semibold text-zinc-900 sales-mono tracking-tight">
                  ₹{sale.totalAmount.toLocaleString()}
                </span>
                <div className="mt-3">
                  <Badge cls={STATUS_CFG[sale.status].cls} dot={STATUS_CFG[sale.status].dot} label={sale.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {([
                  { icon: <User size={14} />,      label: "Customer", value: sale.customerName },
                  { icon: <Calendar size={14} />,  label: "Date",     value: sale.date },
                  { icon: <CreditCard size={14} />,label: "Payment",  value: sale.paymentMethod },
                  {
                    icon: sale.origin === "Sales" ? <ShoppingCart size={14} /> : <RotateCcw size={14} />,
                    label: "Origin", value: sale.origin,
                  },
                  {
                    icon: sale.salesType === "Online" ? <Wifi size={14} /> : <WifiOff size={14} />,
                    label: "Type", value: sale.salesType,
                  },
                ] as { icon: React.ReactNode; label: string; value: string }[]).map(({ icon, label, value }) => (
                  <div key={label} className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                      {icon}
                      <span className="text-[11px] font-semibold uppercase tracking-widest">{label}</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 truncate">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                  Order Summary
                </h3>
                <div className="border border-zinc-100 rounded-xl divide-y divide-zinc-100 overflow-hidden">
                  {generateItems(sale).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-400">
                          <Package size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-800">{item.name}</p>
                          <p className="text-xs text-zinc-500">
                            Qty: {item.quantity} · <span className="sales-mono">{item.sku}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 tabular-nums sales-mono">
                        ₹{(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex gap-3 shrink-0">
              <button className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition-colors shadow-sm">
                Download PDF
              </button>
              <button className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                Print Receipt
              </button>
              <button
                onClick={openReturn}
                disabled={!canReturn}
                title={
                  alreadyRet ? "Already returned"
                  : !canReturn ? `Cannot return: ${sale.status}`
                  : "Return items"
                }
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-colors shadow-sm border ${
                  canReturn
                    ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-100"
                    : "bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed"
                }`}
              >
                Return
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
const SalesListPage: React.FC = () => {
  const [search,        setSearch]        = useState("");
  const [filterOrigin,  setFilterOrigin]  = useState("");
  const [filterType,    setFilterType]    = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");
  const [filterDate,    setFilterDate]    = useState("");
  const [selectedSale,  setSelectedSale]  = useState<SaleRecord | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      <div className="sales-root min-h-screen bg-zinc-50/50 space-y-6 p-6">

        
        <div className="flex gap-3 flex-wrap">
          <StatsCard 
          label="Total Revenue"
          value={totalRevenue}
          icon={ShoppingCart}
          />
          <StatsCard 
          label="Total Sales"
          value={salesCount}
          icon={ShoppingCart}
          />
          <StatsCard 
          label="Total Sales Return"
          value={salesReturnCount}
          icon={ShoppingCart}
          />
          <StatsCard 
          label="Today's Revenue"
          value={todayRevenue}
          icon={ShoppingCart}
          />
          
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm px-4 py-3.5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
              placeholder="Search invoice or customer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className={`sales-filter-btn px-3 py-2 text-xs font-medium border rounded-lg outline-none cursor-pointer transition-all ${
              filterDate ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
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
          <span className="text-xs font-medium text-zinc-400">{filtered.length} of {MOCK_SALES.length}</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  {["Invoice", "Customer", "Origin", "Type", "Payment", "Date", "Items", "Amount", "Status", ""].map((label, i) => (
                    <th key={i}
                      className="py-3 px-4 first:pl-5 last:pr-5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap text-left last:text-right">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-zinc-400">
                        <Receipt size={28} className="opacity-25 mb-1" />
                        <p className="text-sm font-medium text-zinc-600">No sales found</p>
                        <p className="text-xs">Try adjusting filters</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(sale => {
                  const oCfg = ORIGIN_CFG[sale.origin];
                  const tCfg = SALES_TYPE_CFG[sale.salesType];
                  const pCfg = PAYMENT_CFG[sale.paymentMethod];
                  const sCfg = STATUS_CFG[sale.status];
                  return (
                    <tr key={sale.id} className="sales-row">
                      <td className="py-3.5 pl-5 pr-4">
                        <span className="sales-mono text-xs font-medium text-zinc-700">{sale.invoiceNumber}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-sm font-medium text-zinc-800 whitespace-nowrap">{sale.customerName}</p>
                      </td>
                      <td className="py-3.5 px-4"><Badge cls={oCfg.cls} dot={oCfg.dot} label={sale.origin} /></td>
                      <td className="py-3.5 px-4"><Badge cls={tCfg.cls} dot={tCfg.dot} label={sale.salesType} /></td>
                      <td className="py-3.5 px-4"><Badge cls={pCfg.cls} dot={pCfg.dot} label={sale.paymentMethod} /></td>
                      <td className="py-3.5 px-4 text-sm text-zinc-500 whitespace-nowrap tabular-nums">{sale.date}</td>
                      <td className="py-3.5 px-4 text-center text-sm font-medium text-zinc-600 tabular-nums">
                        {sale.itemsCount}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="sales-mono text-sm font-semibold text-zinc-900 tabular-nums">
                          ₹{sale.totalAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4"><Badge cls={sCfg.cls} dot={sCfg.dot} label={sale.status} /></td>
                      <td className="py-3.5 pl-4 pr-5">
                        <div className=" flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedSale(sale); setIsSidebarOpen(true); }}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <Eye size={15} />
                          </button>
                          <button  onClick={() => { setSelectedSale(sale); setIsSidebarOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-100 transition-all">
                            <RotateCcw size={15} />
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
            <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Showing <span className="font-medium text-zinc-600">{filtered.length}</span> of{" "}
                <span className="font-medium text-zinc-600">{MOCK_SALES.length}</span> records
              </p>
              <span className="text-xs text-zinc-500">
                Filtered revenue:{" "}
                <span className="font-semibold text-zinc-800 sales-mono">
                  ₹{filtered.filter(s => s.status === "Completed").reduce((a, b) => a + b.totalAmount, 0).toLocaleString()}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      <SaleDetailSidebar
        sale={selectedSale}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
};

export default SalesListPage;