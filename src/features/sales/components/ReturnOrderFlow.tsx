import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  X, Package, AlertCircle, CheckCircle2, 
  ChevronRight, Minus, Plus, ArrowRight, RefreshCw, Banknote, 
  Gift, ArrowLeft, Check, Loader2, Hash, Search
} from "lucide-react";
import { SHOP_ID } from "@/services/endpoints";
import { OrderResponse } from "@/features/order/types";
import { inventoryApi } from "@/services/api/inventory";
import { useToast } from "@/context/ToastContext";
import ProductSelectionModal from "../../billing/components/ProductSelectionModel";
import { InventoryItem, ProductVariant } from "../../billing/types";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type PaymentMethod = "Cash" | "Card" | "UPI" | "G-Pay" | "PhonePe" | "Other";
type ReturnMode = "refund" | "exchange";
type ReturnReason = "Damaged" | "Wrong Item" | "Customer Request" | "Size Issue" | "Other" | "";
type SaleRecord = OrderResponse;

interface SaleItem {
  id: string; inventory_id: string; name: string; sku: string; category: string;
  quantity: number; unitPrice: number; buyPrice: number;
  imageColor: string; status?: string; stocks_before?: number; serial_numbers?: string[];
}
interface SelectedReturnItem extends SaleItem { returnQty: number; exchangeItemId?: string; selectedSerials?: string[]; }
interface ReturnErrors { reason?: string; items?: string; settlement?: string; serials?: string; }
type ReturnStep = 1 | 2 | 3 | 4 | 5;
interface ReturnState {
  step: ReturnStep; mode: ReturnMode;
  returnItems: Record<string, number>; exchangeMap: Record<string, any>;
  serialReturnMap: Record<string, string[]>;
  itemReasons: Record<string, ReturnReason>;
  notes: string;
  payments: { mode: string; amount: number }[];
  errors: ReturnErrors; isSubmitting: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const RETURN_REASONS: Exclude<ReturnReason, "">[] = ["Damaged", "Wrong Item", "Customer Request", "Size Issue", "Other"];
const ITEM_COLORS = ["#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3", "#ede9fe", "#ffedd5", "#f0fdf4", "#ecfeff"];

/* ═══════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════ */
const generateItems = (sale: SaleRecord, productMap: Record<string, string> = {}): SaleItem[] =>
  (sale.items || []).map((item, i) => {
    const productName = productMap[item.inventory_id] || item.barcode || `Item ${i + 1}`;
    return {
      id: item.id,
      inventory_id: item.inventory_id,
      name: item.status === "REFUNDED" ? `(Refunded) ${productName}` : item.status === "EXCHANGED" ? `(Exchanged) ${productName}` : productName,
      sku: item.barcode?.trim() || item.inventory_id.slice(-6),
      category: "General", quantity: item.quantity,
      unitPrice: item.sell_price, buyPrice: item.buy_price,
      imageColor: ITEM_COLORS[i % ITEM_COLORS.length],
      status: item.status, variant_id: item.variant_id,
      batch_id: item.batch_id, serialno_id: item.serialno_id,
      serial_numbers: item.serial_numbers || [],
      stocks_before: (item as any).stocks_before,
    } as any;
  });

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
═══════════════════════════════════════════════════════════════ */
const QuantityStepper: React.FC<{ value: number; min?: number; max: number; onChange: (v: number) => void; onClick?: (e: React.MouseEvent) => void; }> = ({ value, min = 1, max, onChange, onClick }) => (
  <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white" onClick={onClick}>
    <button 
      className="w-[26px] h-[26px] flex items-center justify-center border-none bg-transparent cursor-pointer text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
      disabled={value <= min} 
      onClick={e => { e.stopPropagation(); onChange(Math.max(min, value - 1)); }}
    >
      <Minus size={9} />
    </button>
    <span className="font-mono w-[28px] text-center text-[11px] font-semibold text-slate-800">{value}</span>
    <button 
      className="w-[26px] h-[26px] flex items-center justify-center border-none bg-transparent cursor-pointer text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
      disabled={value >= max} 
      onClick={e => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}
    >
      <Plus size={9} />
    </button>
  </div>
);

const STEP_LABELS: Record<ReturnStep, string> = { 1: "Mode", 2: "Items", 3: "Reason", 4: "Review", 5: "Done" };
const StepHeader: React.FC<{ step: ReturnStep; mode: ReturnMode; invoice: string; }> = ({ step, mode, invoice }) => {
  const progress = ((step - 1) / 3) * 100;
  return (
    <div className="p-[18px_22px_14px] border-b border-slate-100 flex-shrink-0">
      <div className="flex items-start justify-between mb-[10px]">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-[3px]">
            {step < 5 ? `Step ${step} of 4` : 'Complete'}
          </p>
          <p className="text-[13px] font-bold text-slate-900">
            {step === 1 ? "Choose Return Mode"
              : step === 2 ? (mode === "refund" ? "Select Items for Refund" : "Select Items to Exchange")
                : step === 3 ? "Reason & Settlement"
                  : step === 4 ? "Review & Confirm"
                    : "Return Processed"}
          </p>
        </div>
        <span className="font-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">{invoice}</span>
      </div>
      {step < 5 && (
        <>
          <div className="h-[3px] bg-slate-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-in-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between">
            {([1, 2, 3, 4] as ReturnStep[]).map(s => (
              <div key={s} className="flex flex-col items-center gap-[3px]">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
                <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors duration-300 ${s <= step ? 'text-blue-600' : 'text-slate-300'}`}>{STEP_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const RefundSummary: React.FC<{ mode: ReturnMode; selectedItems: SelectedReturnItem[]; totals: { returnValue: number; exchangeValue: number; diff: number }; payments: { mode: string; amount: number }[]; originalPayment: PaymentMethod; }> = ({ mode, selectedItems, totals, payments, originalPayment }) => {
  const { returnValue, exchangeValue, diff } = totals;
  const isStoreCredit = payments.length === 1 && payments[0].mode === "Store Credit";
  const paymentModes = payments.map(p => p.mode).join(", ");
  if (mode === "refund") {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-lg p-3.5 px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">
              {isStoreCredit ? "Store Credit" : "Refund Amount"}
            </p>
            <p className="font-mono text-[26px] font-light text-blue-700">{fmt(returnValue)}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-slate-500">{selectedItems.reduce((s, i) => s + i.returnQty, 0)} item(s)</span>
            <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
              {isStoreCredit ? <Gift size={10} /> : <Banknote size={10} />}
              {isStoreCredit ? "Store Credit" : `Via ${paymentModes || originalPayment}`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`border rounded-lg p-3.5 px-4 ${diff > 0 ? 'border-amber-200 bg-amber-50/50' : diff < 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/50'}`}>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Return Value', val: fmt(returnValue), color: 'text-slate-600' },
          { label: 'Exchange Value', val: fmt(exchangeValue), color: 'text-slate-600' },
          { label: diff > 0 ? 'Customer Pays' : diff < 0 ? 'Shop Refunds' : 'Settled', val: diff === 0 ? '–' : fmt(Math.abs(diff)), color: diff > 0 ? 'text-amber-700' : diff < 0 ? 'text-emerald-700' : 'text-slate-400' },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-mono text-[13px] font-bold ${color}`}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SerialReturnPicker: React.FC<{ allSerials: string[]; selected: string[]; required: number; onChange: (serials: string[]) => void; }> = ({ allSerials, selected, required, onChange }) => {
  const toggle = (sn: string) => {
    if (selected.includes(sn)) onChange(selected.filter(s => s !== sn));
    else if (selected.length < required) onChange([...selected, sn]);
  };
  const ok = selected.length === required;
  return (
    <div className="mt-2.5 rounded-lg border border-violet-200 bg-violet-50/50 p-2.5" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-violet-600 flex items-center gap-1"><Hash size={10} />Select Serial Numbers</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{selected.length}/{required}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {allSerials.map(sn => {
          const isSel = selected.includes(sn);
          const isDisabled = !isSel && selected.length >= required;
          return (
            <button 
              key={sn} 
              onClick={() => toggle(sn)} 
              disabled={isDisabled}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold border transition-all duration-100 cursor-pointer ${
                isSel ? 'bg-violet-600 text-white border-violet-600' : 
                isDisabled ? 'bg-white text-slate-300 border-slate-100 cursor-not-allowed' : 
                'bg-white text-violet-600 border-violet-200 hover:border-violet-300'
              }`}
            >
              {isSel && <Check size={8} />}{sn}
            </button>
          );
        })}
      </div>
      {!ok && <p className="mt-1.5 text-[10px] text-amber-600 flex items-center gap-1"><AlertCircle size={10} />Select {required - selected.length} more to proceed</p>}
    </div>
  );
};

const ItemSelector: React.FC<{ items: SaleItem[]; returnItems: Record<string, number>; serialReturnMap: Record<string, string[]>; itemReasons: Record<string, ReturnReason>; onToggle: (id: string) => void; onQtyChange: (id: string, v: number) => void; onSerialChange: (id: string, serials: string[]) => void; onReasonChange: (id: string, reason: ReturnReason) => void; onSelectAll: (all: boolean) => void; error?: string; }> = ({ items, returnItems, serialReturnMap, itemReasons, onToggle, onQtyChange, onSerialChange, onReasonChange, onSelectAll, error }) => {
  const [q, setQ] = useState("");
  const filtered = items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase()));
  const selectableItems = filtered.filter(i => i.status !== "REFUNDED" && i.status !== "EXCHANGED");
  const allSelected = selectableItems.length > 0 && selectableItems.every(i => returnItems[i.id] !== undefined);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search items..." 
            value={q} 
            onChange={e => setQ(e.target.value)}
            className="w-full h-[34px] px-3 pl-8 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
          />
        </div>
        <button 
          onClick={() => onSelectAll(!allSelected)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer ${
            allSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          {allSelected ? <Check size={11} /> : <div className="w-[11px] h-[11px] rounded-[3px] border-[1.5px] border-slate-300" />}
          All
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {filtered.map(item => {
          const checked = returnItems[item.id] !== undefined;
          const qty = returnItems[item.id] ?? 1;
          const isProcessed = item.status === "REFUNDED" || item.status === "EXCHANGED";
          const hasSerials = item.serial_numbers && item.serial_numbers.length > 0;
          const selectedSerials = serialReturnMap[item.id] ?? [];
          const reason = itemReasons[item.id] ?? "";
          return (
            <div 
              key={item.id} 
              className={`flex flex-col border p-2.5 px-3 rounded-lg transition-all duration-100 ${
                isProcessed ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 
                checked ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100 hover:bg-slate-50/80 cursor-pointer'
              }`}
              onClick={() => !isProcessed && onToggle(item.id)}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center relative">
                  <input type="checkbox" className="peer w-4 h-4 appearance-none rounded border border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer disabled:cursor-not-allowed" checked={checked} disabled={isProcessed} readOnly onClick={e => e.stopPropagation()} />
                  <Check size={10} className="absolute text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                </div>
                <div className="w-8.5 h-8.5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.imageColor }}>
                  <Package size={13} className="text-slate-500/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                        {item.status && <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${item.status === "REFUNDED" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>{item.status}</span>}
                        {hasSerials && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 flex items-center gap-1"><Hash size={8} />SN</span>}
                      </div>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">{item.sku} · {item.category}</p>
                    </div>
                    <p className="font-mono text-[11px] font-bold text-slate-800 flex-shrink-0">{fmt(item.unitPrice)}</p>
                  </div>
                  {checked && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] text-slate-400">Qty</span>
                        <QuantityStepper value={qty} max={item.quantity} onChange={v => onQtyChange(item.id, v)} />
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">of {item.quantity}</span>
                        <span className="font-mono ml-auto text-[10px] font-bold text-blue-600">{fmt(item.unitPrice * qty)}</span>
                      </div>
                      {hasSerials && <SerialReturnPicker allSerials={item.serial_numbers as string[]} selected={selectedSerials} required={qty} onChange={s => onSerialChange(item.id, s)} />}
                      <div className="mt-2" onClick={e => e.stopPropagation()}>
                        <select
                          value={reason}
                          onChange={e => onReasonChange(item.id, e.target.value as ReturnReason)}
                          className="w-full h-8 px-2 text-[11px] border border-slate-200 rounded-md bg-white text-slate-700 outline-none focus:border-blue-500 font-semibold"
                        >
                          <option value="">Select Return Reason</option>
                          {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-xs text-slate-400 font-medium">No items match your search.</p>
          </div>
        )}
      </div>
      {error && <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium"><AlertCircle size={11} />{error}</p>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   USE RETURN HOOK
═══════════════════════════════════════════════════════════════ */
const initialState = (): ReturnState => ({
  step: 1, mode: "refund", returnItems: {}, exchangeMap: {}, serialReturnMap: {}, itemReasons: {},
  notes: "", payments: [{ mode: "Cash", amount: 0 }], errors: {}, isSubmitting: false,
});

const useReturnModalLogic = (sale: SaleRecord | null, productMap: Record<string, string> = {}) => {
  const [state, setState] = useState<ReturnState>(initialState());
  const saleItems = useMemo<SaleItem[]>(() => (sale ? generateItems(sale, productMap) : []), [sale?.id, productMap]);
  const reset = useCallback(() => setState(initialState()), []);
  const setStep = (step: ReturnStep) => setState(s => ({ ...s, step }));
  const setMode = (mode: ReturnMode) => setState(s => ({ ...s, mode, payments: [{ mode: "Cash", amount: 0 }] }));
  const setReason = (id: string, reason: ReturnReason) => setState(s => ({ ...s, itemReasons: { ...s.itemReasons, [id]: reason }, errors: { ...s.errors, items: undefined } }));
  const setNotes = (notes: string) => setState(s => ({ ...s, notes }));
  
  const updatePayment = (index: number, updates: Partial<{ mode: string; amount: number }>) => {
    setState(s => ({
      ...s,
      payments: s.payments.map((p, i) => i === index ? { ...p, ...updates } : p),
      errors: { ...s.errors, settlement: undefined }
    }));
  };
  
  const addPayment = () => setState(s => ({ ...s, payments: [...s.payments, { mode: "UPI", amount: 0 }] }));
  const removePayment = (index: number) => setState(s => ({ ...s, payments: s.payments.filter((_, i) => i !== index) }));
  const { showToast } = useToast();

  const toggleItem = useCallback((itemId: string) => {
    setState(s => {
      const next = { ...s.returnItems }, nextEx = { ...s.exchangeMap }, nextSer = { ...s.serialReturnMap };
      if (next[itemId] !== undefined) { delete next[itemId]; delete nextEx[itemId]; delete nextSer[itemId]; }
      else {
        const item = saleItems.find(i => i.id === itemId);
        next[itemId] = item?.quantity ?? 1;
        if (item?.serial_numbers?.length) nextSer[itemId] = [...item.serial_numbers];
      }
      return { ...s, returnItems: next, exchangeMap: nextEx, serialReturnMap: nextSer, errors: { ...s.errors, items: undefined } };
    });
  }, [saleItems]);

  const setSerialReturns = useCallback((itemId: string, serials: string[]) => setState(s => ({ ...s, serialReturnMap: { ...s.serialReturnMap, [itemId]: serials } })), []);
  const selectAll = useCallback((all: boolean) => {
    setState(s => {
      if (!all) return { ...s, returnItems: {}, exchangeMap: {} };
      const next: Record<string, number> = {};
      saleItems.forEach(i => { if (i.status !== "REFUNDED" && i.status !== "EXCHANGED") next[i.id] = i.quantity; });
      return { ...s, returnItems: next, errors: { ...s.errors, items: undefined } };
    });
  }, [saleItems]);

  const updateQty = useCallback((itemId: string, v: number) => {
    const item = saleItems.find(i => i.id === itemId);
    if (!item) return;
    setState(s => ({ ...s, returnItems: { ...s.returnItems, [itemId]: Math.min(Math.max(1, v), item.quantity) } }));
  }, [saleItems]);

  const setExchangeProduct = useCallback((itemId: string, product: any) => setState(s => ({ ...s, exchangeMap: { ...s.exchangeMap, [itemId]: product } })), []);

  const selectedItems = useMemo<SelectedReturnItem[]>(() =>
    saleItems.filter(i => state.returnItems[i.id] !== undefined)
      .map(i => ({ ...i, returnQty: state.returnItems[i.id], exchangeItemId: state.exchangeMap[i.id], selectedSerials: state.serialReturnMap[i.id] })),
    [saleItems, state.returnItems, state.exchangeMap, state.serialReturnMap]);

  const totals = useMemo(() => {
    const returnValue = selectedItems.reduce((s, i) => s + i.unitPrice * i.returnQty, 0);
    const exchangeValue = state.mode === "exchange" ? selectedItems.reduce((s, i) => { if (!i.exchangeItemId) return s; const ep = i.exchangeItemId as any; return s + ((ep?.sell_price ?? 0) * (ep?.quantity ?? i.returnQty)); }, 0) : 0;
    return { returnValue, exchangeValue, diff: exchangeValue - returnValue };
  }, [selectedItems, state.mode]);

  const validate = useCallback((): boolean => {
    const errs: ReturnErrors = {};
    if (selectedItems.length === 0) errs.items = "Select at least one item.";
    if (selectedItems.some(i => !state.itemReasons[i.id])) errs.items = "Please select a return reason for all selected items.";
    
    const requiresSettlement = state.mode === "refund" || totals.diff !== 0;
    if (requiresSettlement) {
      if (state.payments.length === 0) errs.settlement = "Please add at least one payment method.";
      else if (state.mode === "exchange") {
        const sum = state.payments.reduce((acc, p) => acc + p.amount, 0);
        if (Math.abs(sum - Math.abs(totals.diff)) > 0.01) {
          errs.settlement = `Total payment must equal ${fmt(Math.abs(totals.diff))}`;
        }
      }
    }
    setState(s => ({ ...s, errors: errs }));
    return Object.keys(errs).length === 0;
  }, [state.itemReasons, state.mode, state.payments, selectedItems, totals]);

  const goNext = useCallback(() => { if (state.step === 3 && !validate()) return; setStep((state.step + 1) as ReturnStep); }, [state.step, validate]);
  const goBack = useCallback(() => { if (state.step > 1) setStep((state.step - 1) as ReturnStep); }, [state.step]);

  const confirm = useCallback(async (onSuccess?: () => void) => {
    setState(s => ({ ...s, isSubmitting: true }));
    try {
      const itemsPayload = selectedItems.map(i => ({
        item_id: i.id,
        inventory_id: i.inventory_id,
        quantity: i.returnQty,
        reason: state.itemReasons[i.id] || "Customer Request",
        serial_numbers: i.selectedSerials?.length ? i.selectedSerials : undefined
      }));

      if (state.mode === "refund") {
        await inventoryApi.bulkReturnOrder({ 
          order_id: sale?.id || "", 
          shop_id: SHOP_ID,
          items: itemsPayload 
        });
        showToast("Refund(s) processed successfully", "success");
      } else {
        const productsMap = new Map<string, any>();
        selectedItems.forEach(item => {
          const replacement = state.exchangeMap[item.id]; if (!replacement) return;
          const key = `${replacement.id}-${replacement.variant_id || "none"}-${replacement.batch_id || "none"}-${replacement.serialno_id || "none"}`;
          if (productsMap.has(key)) { const ex = productsMap.get(key); ex.quantity += replacement.quantity || item.returnQty; if (replacement.serial_numbers) ex.serial_numbers = [...ex.serial_numbers, ...replacement.serial_numbers]; }
          else productsMap.set(key, { id: replacement.id, variant_id: replacement.variant_id || null, batch_id: replacement.batch_id || null, serialno_id: replacement.serialno_id || null, serial_numbers: replacement.serial_numbers || [], quantity: replacement.quantity || item.returnQty });
        });
        
        const paymentsDict: Record<string, number> = {};
        if (totals.diff !== 0) {
          state.payments.forEach(p => {
            if (p.amount > 0) paymentsDict[p.mode] = p.amount;
          });
        }
        if (Object.keys(paymentsDict).length === 0 && totals.diff !== 0) {
          paymentsDict[sale?.payment_method || "Cash"] = Math.abs(totals.diff);
        }

        await inventoryApi.bulkExchangeOrder({ 
          shop_id: SHOP_ID, 
          customer_id: sale?.customer_id || "", 
          order_id: sale?.id || "", 
          items: itemsPayload, 
          payments: paymentsDict, 
          products: Array.from(productsMap.values()) 
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
  }, [state, selectedItems, sale, showToast, totals.diff]);

  const canProceed = useMemo(() => {
    if (state.step === 2) {
      if (selectedItems.length === 0) return false;
      const serialsOk = selectedItems.every(i => !i.serial_numbers?.length || (i.selectedSerials?.length ?? 0) === i.returnQty);
      if (!serialsOk) return false;
      if (selectedItems.some(i => !state.itemReasons[i.id])) return false;
      return state.mode === "refund" || selectedItems.every(i => !!i.exchangeItemId);
    }
    if (state.step === 3) {
      if (totals.diff !== 0 && state.mode === "exchange") {
        const sum = state.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        if (Math.abs(sum - Math.abs(totals.diff)) > 0.01) return false;
      }
      return true;
    }
    return true;
  }, [state.step, state.mode, selectedItems, state.itemReasons, totals.diff, state.payments]);

  return { state, saleItems, selectedItems, totals, reset, setMode, setReason, setNotes, updatePayment, addPayment, removePayment, toggleItem, selectAll, updateQty, setExchangeProduct, setSerialReturns, goNext, goBack, confirm, canProceed };
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
interface ReturnFlowProps { sale: SaleRecord; onClose: () => void; onRefresh: () => void; productMap: Record<string, string>; isInline?: boolean; }

export const ReturnFlow: React.FC<ReturnFlowProps> = ({ sale, onClose, onRefresh, productMap, isInline }) => {
  const m = useReturnModalLogic(sale, productMap);
  const { state, saleItems, selectedItems, totals } = m;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [exchSearch, setExchSearch] = useState("");
  const [activeReplaceId, setActiveReplaceId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<InventoryItem | null>(null);
  const [exchProducts, setExchProducts] = useState<any[]>([]);
  const [loadingExch, setLoadingExch] = useState(false);

  // Body scroll lock (only for modal)
  useEffect(() => {
    if (isInline) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, [isInline]);

  const mapToInventoryItem = (p: any): InventoryItem => ({
    id: p.id, product_barcode: p.barcode || "N/A", product_name: p.name || "Unknown", category: p.category || "Other",
    variants: (p.variants || []).map((v: any) => ({ ...v, price: v.sell_price || 0, stock: v.stocks || 0, serialnoId: v.serial_numbers?.id || v.serial_number?.id || v.batches?.[0]?.serial_numbers?.id, availableSerials: v.serial_numbers?.serial_numbers || v.serial_number?.serial_numbers || v.batches?.[0]?.serial_numbers?.serial_numbers || [], batchId: v.batches?.[0]?.id })),
    requireSerial: p.has_serialno || false, batchTracking: p.has_batch || false,
    manufacturingDate: p.batches?.[0]?.manufacturing_date, expiryDate: p.batches?.[0]?.expiry_date,
    price: p.sell_price || 0, stocks: p.stocks || 0,
    serialnoId: p.serial_number?.id || p.batches?.[0]?.serial_numbers?.id,
    availableSerials: p.serial_number?.serial_numbers || p.batches?.[0]?.serial_numbers?.serial_numbers || [],
    batchId: p.batches?.[0]?.id,
  });

  const handleExchangeClick = (ep: any) => { setPendingProduct(mapToInventoryItem(ep)); setIsProductModalOpen(true); };
  const handleProductSelectSuccess = (variant: ProductVariant, quantity: number, serials?: string[]) => {
    if (!activeReplaceId || !pendingProduct) return;
    m.setExchangeProduct(activeReplaceId, { id: pendingProduct.id, name: variant.id === "default" ? pendingProduct.product_name : `${pendingProduct.product_name} - ${variant.name}`, sell_price: variant.price, variant_id: variant.id === "default" ? null : variant.id, batch_id: variant.batchId || pendingProduct.batchId, serialno_id: variant.serialnoId || pendingProduct.serialnoId, serial_numbers: serials || [], quantity });
    setIsProductModalOpen(false); setPendingProduct(null);
  };

  useEffect(() => {
    const t = setTimeout(async () => { setLoadingExch(true); const res = await inventoryApi.searchInventories(exchSearch); setExchProducts(res); setLoadingExch(false); }, 300);
    return () => clearTimeout(t);
  }, [exchSearch]);

  useEffect(() => {
    if (selectedItems.length > 0 && (!activeReplaceId || !selectedItems.some(i => i.id === activeReplaceId))) setActiveReplaceId(selectedItems[0].id);
  }, [selectedItems, activeReplaceId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [state.step]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);

  const canReturn = sale.status === "Completed" && sale.origin !== "Sales Return";

  const content = (
    <div className={isInline ? "bg-white rounded-lg w-full flex flex-col relative overflow-hidden" : "bg-white rounded-lg w-full max-h-[85vh] flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.25)] pointer-events-auto relative overflow-hidden"} onClick={e => e.stopPropagation()}>
      {!isInline && (
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border-none cursor-pointer text-slate-500 hover:bg-slate-200 transition-all hover:rotate-90">
          <X size={16} />
        </button>
      )}
      <StepHeader step={state.step} mode={state.mode} invoice={`INV-${sale.ui_id}`} />

      {!canReturn ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 px-8 text-center">
          <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center"><AlertCircle size={24} className="text-orange-500" /></div>
          <div>
            <p className="text-[15px] font-bold text-slate-800 mb-1.5">{sale.origin === "Sales Return" ? "Already Returned" : "Not Eligible"}</p>
            <p className="text-[13px] text-slate-500 leading-relaxed max-w-[300px]">{sale.origin === "Sales Return" ? "This order is already a Sales Return." : `Only Completed orders can be returned. This order is currently ${sale.status}.`}</p>
          </div>
          <button onClick={onClose} className="mt-2 px-6 py-2.5 text-[13px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">Close</button>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-[20px_24px] scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
            <div key={state.step} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-3 duration-300">
              {state.step === 1 && (
                <>
                  <p className="text-[13px] text-slate-500 font-medium">How would you like to handle this return?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "refund" as ReturnMode, icon: <Banknote size={24} />, label: "Refund", desc: "Return money to customer" },
                      { id: "exchange" as ReturnMode, icon: <RefreshCw size={24} />, label: "Exchange", desc: "Swap for other products" },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => m.setMode(opt.id)}
                        className={`text-left p-4 border-2 rounded-lg transition-all duration-200 cursor-pointer ${
                          state.mode === opt.id ? "bg-white border-blue-500 text-blue-700 shadow-xl shadow-blue-500/10 scale-[1.02]" : "bg-slate-50/50 border-slate-50 hover:border-slate-200"
                        }`}
                      >
                        <div className={`mb-3 ${state.mode === opt.id ? "text-blue-600" : "text-slate-400"}`}>{opt.icon}</div>
                        <p className="text-[14px] font-bold text-slate-800 mb-1">{opt.label}</p>
                        <p className="text-[11px] text-slate-500 leading-normal font-medium">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {state.step === 2 && (
                <>
                  <ItemSelector items={saleItems} returnItems={state.returnItems} serialReturnMap={state.serialReturnMap} itemReasons={state.itemReasons} onToggle={m.toggleItem} onQtyChange={m.updateQty} onSerialChange={m.setSerialReturns} onReasonChange={m.setReason} onSelectAll={m.selectAll} error={state.errors.items} />
                  {state.mode === "exchange" && selectedItems.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Replacement Items</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedItems.map(si => {
                          const hasRep = !!state.exchangeMap[si.id];
                          const isAct = activeReplaceId === si.id;
                          return (
                            <button key={si.id} onClick={() => setActiveReplaceId(si.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold border transition-all duration-200 cursor-pointer ${
                                isAct ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                              }`}
                            >
                              {si.name}
                              {hasRep && <CheckCircle2 size={12} className={isAct ? "text-white" : "text-emerald-500"} />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="relative mb-4">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search replacement catalog..." 
                          value={exchSearch} 
                          onChange={e => setExchSearch(e.target.value)}
                          className="w-full h-11 px-4 pl-10 text-[13px] text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-sans shadow-sm"
                        />
                      </div>
                      {activeReplaceId && (() => {
                        const ai = selectedItems.find(i => i.id === activeReplaceId);
                        if (!ai) return null;
                        return (
                          <>
                            <p className="text-[12px] font-bold text-slate-600 mb-3 flex items-center gap-2">
                              <ArrowRight size={12} className="text-blue-500" />
                              Replacing: <span className="text-slate-900">{ai.name}</span>
                              <span className="font-mono ml-auto text-slate-400 text-[11px] font-medium">{fmt(ai.unitPrice * ai.returnQty)}</span>
                            </p>
                            {loadingExch ? (
                              <div className="text-center py-10">
                                <Loader2 size={28} className="text-blue-500 mx-auto animate-spin" />
                                <p className="text-[11px] text-slate-400 mt-3 font-bold tracking-wide uppercase">Searching Catalog...</p>
                              </div>
                            ) : exchProducts.length === 0 ? (
                              <div className="py-8 text-center bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                <p className="text-[12px] text-slate-400 font-bold">No matching products found</p>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                {exchProducts.map(ep => {
                                  const sel = state.exchangeMap[activeReplaceId]?.id === ep.id;
                                  const inStock = (ep.stocks || 0) > 0;
                                  return (
                                    <div 
                                      key={ep.id} 
                                      onClick={() => inStock && handleExchangeClick(ep)}
                                      className={`flex items-center gap-3 p-3 px-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                                        sel ? "bg-blue-50 border-blue-500 shadow-md scale-[0.99]" : 
                                        !inStock ? "opacity-50 grayscale cursor-not-allowed border-slate-100" : 
                                        "bg-white border-slate-100 hover:border-blue-400 hover:shadow-lg"
                                      }`}
                                    >
                                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                                        <Package size={16} className="text-slate-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-slate-800 truncate">{ep.name}</p>
                                        <div className="flex items-center gap-2.5 mt-0.5">
                                          <span className="font-mono text-[10px] text-slate-400 font-medium">{ep.barcode || ep.id.slice(-6)}</span>
                                          <span className={`text-[10px] font-black uppercase tracking-tight ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>{inStock ? `${ep.stocks} IN STOCK` : 'OUT OF STOCK'}</span>
                                        </div>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <p className="font-mono text-[13px] font-black text-slate-900">{fmt(ep.sell_price)}</p>
                                        {sel && <div className="mt-1 flex justify-end"><div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30"><Check size={11} className="text-white" /></div></div>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
              {state.step === 3 && (
                <>
                  {(state.mode === "refund" || totals.diff !== 0) && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {state.mode === "refund" || totals.diff < 0 ? "Refund Via" : "Collect Via" } <span className="text-red-500">*</span>
                        </label>
                        {totals.diff !== 0 && state.mode === "exchange" && (
                          <span className={`text-[11px] font-black px-3 py-1 rounded-full border-2 ${totals.diff > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>Balance: {fmt(Math.abs(totals.diff))}</span>
                        )}
                      </div>
                      
                      {/* Split Payment UI */}
                      <div className="space-y-2">
                        {state.payments.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <select
                              value={p.mode}
                              onChange={e => m.updatePayment(idx, { mode: e.target.value })}
                              className="h-10 px-3 text-[12px] border-2 border-slate-100 rounded-lg bg-white text-slate-800 outline-none focus:border-blue-500 font-semibold"
                            >
                              {["Cash", "UPI", "Card", "Bank Transfer", ...(state.mode === "refund" || totals.diff < 0 ? ["Store Credit"] : [])].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={p.amount === 0 ? "" : p.amount}
                              onChange={e => m.updatePayment(idx, { amount: Number(e.target.value) })}
                              placeholder="Amount"
                              className="flex-1 h-10 px-3 text-[13px] border-2 border-slate-100 rounded-lg bg-white text-slate-800 outline-none focus:border-blue-500 font-semibold text-right placeholder:text-slate-300"
                            />
                            {state.payments.length > 1 && (
                              <button
                                onClick={() => m.removePayment(idx)}
                                className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all border border-rose-100"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={m.addPayment}
                          className="w-full py-2.5 mt-2 border-2 border-dashed border-slate-200 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus size={12} /> Add Split Payment
                        </button>
                      </div>

                      {state.errors.settlement && <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-red-500 font-bold"><AlertCircle size={12} />{state.errors.settlement}</p>}
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes <span className="text-[10px] text-slate-300 font-normal lowercase tracking-normal">(optional)</span></label>
                    <textarea 
                      value={state.notes} 
                      onChange={e => m.setNotes(e.target.value)} 
                      rows={3} 
                      placeholder="Any additional context…"
                      className="w-full p-4 text-[13px] border-2 border-slate-100 rounded-lg bg-white text-slate-800 outline-none focus:border-blue-400 transition-all resize-none placeholder:text-slate-300 font-semibold shadow-sm"
                    />
                  </div>
                </>
              )}
              {state.step === 4 && (
                <>
                  <RefundSummary mode={state.mode} selectedItems={selectedItems} totals={totals} payments={state.payments} originalPayment={sale.payment_method as PaymentMethod} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Items Summary</p>
                    <div className="border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                      {selectedItems.map((item, idx) => (
                        <div key={item.id} className={`flex items-center gap-3.5 p-3.5 px-4.5 bg-white ${idx > 0 ? 'border-t border-slate-50' : ''}`}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: item.imageColor }}><Package size={14} className="text-slate-600/60" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-slate-800">{item.name}</p>
                            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{item.sku} · qty {item.returnQty}</p>
                            {item.exchangeItemId && <p className="text-[11px] text-blue-600 font-black mt-1 flex items-center gap-1.5"><ArrowRight size={10} /> {(item.exchangeItemId as any).name}</p>}
                          </div>
                          <span className="font-mono text-[13px] font-black text-slate-900">{fmt(item.unitPrice * item.returnQty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: "Return Mode", value: state.mode === "refund" ? "Refund" : "Exchange" }, ...((state.mode === "refund" || totals.diff !== 0) && state.payments.length > 0 ? [{ label: totals.diff > 0 ? "Collect Via" : "Refund Via", value: state.payments.map(p => p.mode).join(", ") }] : [])].map(row => (
                      <div key={row.label} className="bg-slate-50 border border-slate-100 rounded-lg p-3 px-4 shadow-sm">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{row.label}</p>
                        <p className="text-[13px] font-bold text-slate-800">{row.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200/50 rounded-lg p-4 shadow-sm">
                    <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-900 leading-relaxed font-bold">This operation is permanent. Confirming will update the inventory stocks and process the {state.mode === "refund" ? "financial refund" : "exchange order"}.</p>
                  </div>
                </>
              )}
              {state.step === 5 && (
                <div className="flex flex-col items-center text-center gap-5 py-8">
                  <div className="w-[72px] h-[72px] rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center animate-in zoom-in-50 duration-500 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[18px] font-black text-slate-900 mb-2">{state.mode === "refund" ? "Refund Successful" : "Exchange Completed"}</p>
                    <p className="text-[13px] text-slate-500 leading-relaxed max-w-[320px] mx-auto font-medium">
                      {state.mode === "refund" ? `A refund of ${fmt(totals.returnValue)} has been processed via ${state.payments.map(p => p.mode).join(", ")}.` : totals.diff > 0 ? `Exchange order created. Balance of ${fmt(totals.diff)} collected via ${state.payments.map(p => p.mode).join(", ")}.` : totals.diff < 0 ? `Exchange order created. Balance of ${fmt(Math.abs(totals.diff))} refunded via ${state.payments.map(p => p.mode).join(", ")}.` : "The exchange order has been finalized successfully."}
                    </p>
                  </div>
                  <div className="w-full border-2 border-slate-100 rounded-lg overflow-hidden shadow-xl shadow-slate-100/50">
                    {[{ label: "Invoice Number", value: `INV-${sale.ui_id}` }, { label: "Return Mode", value: state.mode === "refund" ? "Refund" : "Exchange" }, ...(state.mode === "refund" ? [{ label: "Amount Refunded", value: fmt(totals.returnValue) }] : totals.diff !== 0 ? [{ label: totals.diff > 0 ? "Balance Collected" : "Balance Refunded", value: fmt(Math.abs(totals.diff)) }] : [])].map((row, i) => (
                      <div key={row.label} className={`flex justify-between p-3.5 px-5 bg-white ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                        <span className="text-[12px] text-slate-400 font-bold uppercase tracking-tight">{row.label}</span>
                        <span className="font-mono text-[13px] font-black text-slate-900">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white border-none rounded-lg text-[15px] font-black cursor-pointer hover:bg-black transition-all active:scale-[0.98] shadow-2xl shadow-slate-900/30">Close & Return to List</button>
                </div>
              )}
            </div>
          </div>
          {(() => {
            const usedSerials = Object.entries(state.exchangeMap).reduce((acc: string[], [itemId, data]) => { if (itemId === activeReplaceId) return acc; return [...acc, ...(data.serial_numbers || [])]; }, []);
            return <ProductSelectionModal isOpen={isProductModalOpen} product={pendingProduct} onClose={() => setIsProductModalOpen(false)} onSuccess={handleProductSelectSuccess} excludedSerials={usedSerials} initialQuantity={selectedItems.find(i => i.id === activeReplaceId)?.returnQty} />;
          })()}
          {state.step < 5 && (
            <div className="flex-shrink-0 p-4 px-6 border-t border-slate-100 bg-white flex items-center gap-3">
              {state.step > 1 && (
                <button onClick={m.goBack} className="inline-flex items-center gap-2 p-[10px_18px] text-[13px] font-bold text-slate-600 bg-white border-2 border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                  <ArrowLeft size={15} />Back
                </button>
              )}
              {state.step < 4 ? (
                <button 
                  onClick={m.goNext} 
                  disabled={!m.canProceed} 
                  className="flex-1 h-12 bg-blue-600 text-white border-none rounded-lg text-[14px] font-black cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed hover:bg-blue-700 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
                >
                  Continue to {STEP_LABELS[(state.step + 1) as ReturnStep]} <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={() => m.confirm(onRefresh)} 
                  disabled={state.isSubmitting} 
                  className="flex-1 h-12 bg-blue-600 text-white border-none rounded-lg text-[14px] font-black cursor-pointer transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-700 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
                >
                  {state.isSubmitting ? <><Loader2 size={16} className="animate-spin" />Processing Return…</> : <>{state.mode === "refund" ? "Confirm & Refund" : "Confirm & Exchange"}<CheckCircle2 size={16} /></>}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  return content;
};

export const ReturnModal: React.FC<ReturnFlowProps> = (props) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[1000] overflow-y-auto overflow-x-hidden scrollbar-none flex flex-col items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={props.onClose} 
      />
      
      {/* Centering Wrapper */}
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="relative w-full max-w-[540px] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out pointer-events-auto">
          <ReturnFlow {...props} isInline={false} />
        </div>
      </div>
    </div>,
    document.body
  );
};
