import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  Save, 
  AlertTriangle, 
  Package, 
  Plus, 
  Trash2, 
  X,
  PackageOpen,
  Check,
  Bookmark,
  Calendar,
  History,
} from 'lucide-react';

// Adjust these imports to match your project structure
import { GradientButton } from '@/components/ui/GradientButton'; 
import Input from '@/components/ui/Input';
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { inventoryApi } from "@/services/api/inventory";
import { SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { FloatingFormCard } from '@/components/common/FloatingFormCard';
import { InlineSerialManager } from '@/components/common/InlineSerialManager';
import { useScrollLock } from '@/hooks/useScrollLock';

// --- Type definitions ---
interface AdjustmentItem {
  id: string; // Internal local ID
  inventory_id: string; // Product UUID
  variant_id?: string; // Variant UUID
  batch_id?: string; // Batch UUID
  serialno_id?: string; // Serial record UUID (from serial_numbers.id)
  product: string; // Display name
  barcode: string;
  currentStock: number;
  type: 'INCREMENT' | 'DECREMENT';
  stocks: number | ''; // Quantity to adjust
  reason: string;
  notes: string;
  internalNote: string;
  variant_name?: string;
  batch_name?: string;
  serial_numbers: string[];
  sku?: string;
  has_serialno_tracking?: boolean;
  existing_serial_numbers?: string[];
  has_batch_tracking?: boolean;
}

const typeOptions = [
  { value: 'INCREMENT', label: 'Increase (+)' },
  { value: 'DECREMENT', label: 'Decrease (−)' }
];

const reasonOptions = [
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Lost / Stolen', label: 'Lost / Stolen' },
  { value: 'Stock Correction', label: 'Stock Correction' },
  { value: 'Returned (Defective)', label: 'Returned (Defective)' },
];

const LOW_STOCK_THRESHOLD = 5;
const parseBatches = (batches: any) => {
  if (Array.isArray(batches)) return batches;
  if (typeof batches === 'string') {
    try {
      const parsed = JSON.parse(batches);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const extractSerials = (obj: any) => {
  if (!obj) return { id: null, list: [] };
  if (Array.isArray(obj)) return { id: null, list: obj };
  if (obj.serial_numbers && Array.isArray(obj.serial_numbers)) {
    return { id: obj.id || null, list: obj.serial_numbers };
  }
  return { id: null, list: [] };
};

export default function StockAdjustmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();

  const [items, setItems] = useState<AdjustmentItem[]>([]);
  const [adjustmentDate, setAdjustmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_submitError, setSubmitError] = useState<string | null>(null);
  
  // --- Dynamic Modal State ---
  const [variantModal, setVariantModal] = useState<{ 
    isOpen: boolean; 
    baseProduct: string; 
    targetRowIndex: number;
    variants: any[];
    baseData: any;
  }>({
    isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null
  });
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const [batchModal, setBatchModal] = useState<{
    isOpen: boolean;
    variantName: string;
    targetRowIndex: number;
    batches: any[];
    variantData: any;
  }>({
    isOpen: false, variantName: "", targetRowIndex: -1, batches: [], variantData: null
  });

  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);

  useScrollLock(variantModal.isOpen || batchModal.isOpen || isImpactModalOpen);

  // --- Load Draft ---
  useEffect(() => {
    const draftId = searchParams.get("draftId");
    if (draftId) {
      const drafts = JSON.parse(localStorage.getItem("stock_adjustment_drafts") || "[]");
      const draft = drafts.find((d: any) => d.id === draftId);
      if (draft) {
        setItems(draft.data.items || []);
        setAdjustmentDate(draft.data.adjustmentDate || new Date().toISOString().split('T')[0]);
        setNotes(draft.data.notes || '');
      }
    } else if (items.length === 0) {
      handleAddItem();
    }
  }, [searchParams]);

  // --- Header Actions ---
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <button 
            type="button"
            onClick={handleSaveDraft}
            className="px-4 h-8 rounded-lg border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2 whitespace-nowrap overflow-hidden"
          >
            <Bookmark size={14} className="shrink-0" />
            <span className="truncate">Save Draft</span>
          </button>
        <GradientButton 
          icon={isSubmitting ? <Loader className="h-4 w-4" /> : <Save size={16} />} 
          onClick={handleSubmit} 
          disabled={isSubmitting || items.length === 0}
          className="rounded-lg shadow-md text-xs px-8 h-8 flex items-center"
        >
          {isSubmitting ? "Saving..." : "Confirm Adjustment"}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, items, isSubmitting]);


  const handleAddItem = () => {
    const newItem: AdjustmentItem = {
      id: `item-${Date.now()}`,
      inventory_id: '',
      product: '',
      barcode: '',
      currentStock: 0,
      type: 'DECREMENT',
      stocks: 1,
      reason: 'Stock Correction',
      notes: '',
      internalNote: '',
      variant_name: '',
      variant_id: '',
      batch_id: '',
      batch_name: '',
      serial_numbers: [],
      sku: '',
      has_serialno_tracking: false,
      existing_serial_numbers: [],
      has_batch_tracking: false
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof AdjustmentItem, value: any) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    }));
  };

  const updateMultiple = (id: string, updates: Partial<AdjustmentItem>) => {
    setItems(prevItems => prevItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const confirmVariant = () => {
    if (!selectedVariant) return;

    const variantData = variantModal.variants.find(v => v.id === selectedVariant);
    if (!variantData) return;

    const batches = parseBatches(variantData.batches);
    
    if (batches.length > 0) {
      setBatchModal({
        isOpen: true,
        variantName: variantData.name,
        targetRowIndex: variantModal.targetRowIndex,
        batches: batches,
        variantData: variantData
      });
      setVariantModal(prev => ({ ...prev, isOpen: false }));
    } else {
      const updatedItems = [...items];
      const serialInfo = extractSerials(variantData.serial_numbers);
      
      updatedItems[variantModal.targetRowIndex] = {
        ...updatedItems[variantModal.targetRowIndex],
        inventory_id: variantModal.baseData.id,
        product: variantModal.baseProduct,
        barcode: variantData.sku || variantModal.baseData.barcode || '',
        currentStock: variantData.stocks ?? variantData.stock ?? 0,
        variant_name: variantData.name,
        variant_id: variantData.id,
        serialno_id: serialInfo.id,
        sku: variantData.sku || variantData.barcode,
        has_serialno_tracking: variantModal.baseData.has_serialno || variantModal.baseData.datas?.has_serialno || false,
        existing_serial_numbers: serialInfo.list,
        serial_numbers: [],
        type: (variantModal.baseData.has_serialno || variantModal.baseData.datas?.has_serialno) && serialInfo.list.length === 0
          ? 'INCREMENT'
          : updatedItems[variantModal.targetRowIndex].type
      };
      setItems(updatedItems);
      setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
      setSelectedVariant(null);
    }
  };

  const confirmBatch = (batch: any) => {
    const updatedItems = [...items];
    const vData = batchModal.variantData;
    const serialInfo = extractSerials(batch.serial_numbers || vData.serial_numbers);
    
    updatedItems[batchModal.targetRowIndex] = {
      ...updatedItems[batchModal.targetRowIndex],
      inventory_id: variantModal.baseData.id,
      product: variantModal.baseProduct,
      barcode: batch.barcode || vData.sku || variantModal.baseData.barcode || '',
      currentStock: batch.stocks || batch.quantity || 0,
      variant_name: vData.name,
      variant_id: vData.id,
      batch_id: batch.id,
      batch_name: batch.name || batch.batch,
      serialno_id: serialInfo.id,
      sku: vData.sku || vData.barcode,
      has_serialno_tracking: variantModal.baseData.has_serialno || variantModal.baseData.datas?.has_serialno || false,
      existing_serial_numbers: serialInfo.list,
      serial_numbers: [],
      type: (variantModal.baseData.has_serialno || variantModal.baseData.datas?.has_serialno) && serialInfo.list.length === 0
        ? 'INCREMENT'
        : updatedItems[batchModal.targetRowIndex].type
    };
    
    setItems(updatedItems);
    setBatchModal({ isOpen: false, variantName: "", targetRowIndex: -1, batches: [], variantData: null });
    setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
    setSelectedVariant(null);
  };

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("stock_adjustment_drafts") || "[]");
    const draftId = searchParams.get("draftId") || Date.now().toString();
    
    const newDraft = {
      id: draftId,
      data: { items, adjustmentDate, notes },
      timestamp: new Date().toISOString(),
      displayName: `Adjustment (${items.length} items) - ${new Date(adjustmentDate).toLocaleDateString()}`
    };

    const existingIndex = drafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.push(newDraft);
    }

    localStorage.setItem("stock_adjustment_drafts", JSON.stringify(drafts));
    showToast("Adjustment saved as draft", "info");
  };

  const handleSubmit = async () => {
    if (items.length === 0 || items.some(item => !item.product || item.stocks === '')) {
      showToast("Please ensure all items have a product and quantity.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const products = items.map(item => ({
        inventory_id: item.inventory_id,
        variant_id: item.variant_id || null,
        batch_id: item.batch_id || null,
        serialno_id: item.serialno_id || null,
        serial_numbers: item.serial_numbers.length > 0 ? item.serial_numbers : null,
        stocks: Number(item.stocks) || 0,
        type: item.type, // INCREMENT or DECREMENT
        datas: {
          reason: item.reason,
          notes: item.internalNote || item.notes,
          barcode: item.barcode,
          product_name: item.product,
          variant_name: item.variant_name,
          batch_name: item.batch_name
        }
      }));

      const payload = {
        shop_id: SHOP_ID,
        adjusted_date: adjustmentDate,
        description: notes || `Stock Adjustment - ${new Date().toLocaleDateString()}`,
        products: products,
        datas: {}
      };

      await inventoryApi.createStockAdjustment(payload);
      
      showToast("Stock Adjustment saved successfully!", "success");
      
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("stock_adjustment_drafts") || "[]");
        const filtered = drafts.filter((d: any) => d.id !== draftId);
        localStorage.setItem("stock_adjustment_drafts", JSON.stringify(filtered));
      }

      setItems([]);
      setNotes('');
      navigate("/stock-movement");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save adjustment.");
      showToast(err.message || "Failed to save adjustment.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    let netChange = 0;
    const impactList: { name: string; change: number; type: string }[] = [];
    const reasons: Record<string, number> = {};
    let validProductCount = 0;

    items.forEach(item => {
      if (!item.product) return;
      validProductCount++;

      const qty = Number(item.stocks) || 0;
      const changeAmt = item.type === 'INCREMENT' ? qty : -qty;
      netChange += changeAmt;
      
      const displayName = item.variant_name ? `${item.product} (${item.variant_name})` : item.product;

      impactList.push({
        name: displayName,
        change: changeAmt,
        type: item.type
      });

      if (item.reason) {
        reasons[item.reason] = (reasons[item.reason] || 0) + 1;
      }
    });

    return { netChange, impactList, reasons, validProductCount };
  }, [items]);


  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 md:pb-4 font-sans">
      
      {/* --- IMPACT DETAILS POPUP --- */}
      <FloatingFormCard
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        title="Stock Impact Details"
        maxWidth="max-w-md"
      >
        <div className="space-y-2">
          {summary.impactList.map((stat, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 border border-slate-150/60 hover:border-blue-200 hover:bg-white transition-all shadow-sm">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-700">{stat.name}</span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">{stat.type === 'INCREMENT' ? 'Inbound' : 'Outbound'}</span>
              </div>
              <span className={`text-sm font-black tabular-nums ${stat.type === 'INCREMENT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.change > 0 ? '+' : ''}{stat.change}
              </span>
            </div>
          ))}
        </div>
      </FloatingFormCard>

      {/* --- DYNAMIC VARIANT SELECTION MODAL --- */}
      {variantModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-200/60 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0 shadow-sm">
                  <PackageOpen size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm tracking-tight">Select Variants</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">{variantModal.baseProduct}</p>
                </div>
              </div>
              <button onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/30 modal-content">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variantModal.variants.map((variant) => {
                  const stockNum = Number(variant.stock) || 0;
                  const isLowStock = stockNum <= LOW_STOCK_THRESHOLD && stockNum > 0;
                  const isSelected = selectedVariant === variant.id;
                  const batchCount = parseBatches(variant.batches).length;

                  return (
                    <div
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between h-32
                        ${isSelected
                            ? 'border-blue-500 bg-blue-50/40 shadow-md shadow-blue-100/30'
                            : 'border-slate-200/80 hover:border-blue-300 hover:shadow-md bg-white'
                        }
                      `}
                    >
                      <div className={`absolute top-3 right-3 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-350 bg-white'}`}>
                        {isSelected && <Check size={11} strokeWidth={3.5} />}
                      </div>

                      <div className="pr-6">
                        <h4 className="font-bold text-slate-800 text-[13px] leading-tight line-clamp-2">{variant.name}</h4>
                        <p className="text-[9px] text-slate-400 mt-1 font-mono">SKU: {variant.sku}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border leading-none ${
                            stockNum <= 0 ? 'bg-slate-100 text-slate-550 border-slate-200' : 
                            isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            'bg-emerald-50 text-emerald-700 border-emerald-250'
                          }`}>
                          Stock: {stockNum}
                        </span>
                        {batchCount > 0 && (
                          <span className="inline-flex px-2 py-0.5 rounded bg-violet-50 text-violet-700 text-[9px] font-extrabold border border-violet-100 leading-none">
                            {batchCount} {batchCount === 1 ? 'Batch' : 'Batches'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
              <span className="text-[11px] font-bold text-slate-500">
                {selectedVariant ? <span className="text-blue-600">1 variant selected</span> : "Please pick a variant"}
              </span>
              <div className="flex gap-2.5">
                <button 
                  onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })}
                  className="px-4 h-9 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <GradientButton variant="primary" onClick={confirmVariant} disabled={!selectedVariant} className="rounded-lg px-5 h-9 text-xs shadow-md">
                  Continue
                </GradientButton>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- BATCH SELECTION MODAL --- */}
      {batchModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-600 border border-amber-100">
                  <PackageOpen size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm tracking-tight">Select Batch</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">{batchModal.variantName}</p>
                </div>
              </div>
              <button onClick={() => setBatchModal({ ...batchModal, isOpen: false })} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh] bg-slate-50/30 modal-content">
              <div className="grid grid-cols-1 gap-3">
                {parseBatches(batchModal.batches).map((batch: any) => (
                  <div
                    key={batch.id}
                    onClick={() => confirmBatch(batch)}
                    className="group relative p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-extrabold text-slate-800 text-[13px]">{batch.name || batch.batch}</h4>
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Check size={12} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 mt-3 pt-2.5 border-t border-slate-100/80">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Available Stock</span>
                        <span className="text-xs font-extrabold text-emerald-600 mt-0.5">{batch.stocks || batch.quantity || 0} Units</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expiry</span>
                        <span className="text-xs font-bold text-slate-600 mt-0.5">{batch.expiry_date || batch.expiry || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setBatchModal({ ...batchModal, isOpen: false })}
                className="px-5 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
              >
                Back to Variants
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="w-full px-4 md:px-6 lg:px-8 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[2000px] mx-auto pb-12 pt-2">
        
        {/* Header Info Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-amber-50/30 p-4 text-[12px] text-amber-900 shadow-sm leading-relaxed">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <span className="font-black uppercase tracking-wider text-[10px] mr-2 bg-amber-100/80 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Physical Check</span>
            <span className="font-medium">Stock adjustments immediately update inventory counts but do not overwrite previous ledger histories. Use strictly for loss, physical correction, damage, or item expiry.</span>
          </div>
        </div>


        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8 items-start">
          
          {/* Items List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-100/50 overflow-hidden">
              
              {/* Header */}
              <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-50/30 to-transparent border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Package size={15} />
                  </div>
                  <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">Inventory Items</h2>
                </div>
                <button 
                  onClick={handleAddItem}
                  className="flex items-center gap-1 px-3 h-8 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/10 active:scale-95"
                >
                  <Plus size={14} />
                  Add Product
                </button>
              </div>

              {/* Items Content */}
              <div className="p-4">
                {items.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-250 bg-slate-50/50 py-16 flex flex-col items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-slate-300 border border-slate-100">
                      <Package size={24} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-slate-800">No Products Added</h3>
                      <p className="text-xs text-slate-450 mt-1">Select and add a product below to begin stock adjustment.</p>
                    </div>
                    <button 
                      onClick={handleAddItem}
                      className="px-5 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95"
                    >
                      Start Adding
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const qtyNum = Number(item.stocks) || 0;
                      const newStock = item.product 
                        ? (item.type === 'INCREMENT' ? item.currentStock + qtyNum : Math.max(0, item.currentStock - qtyNum))
                        : 0;

                      return (
                        <div key={item.id} className="group relative rounded-2xl border border-slate-200/90 bg-white p-4 md:p-5 transition-all hover:shadow-lg hover:shadow-slate-100/50 pf-combo-appear">
                          
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[11px] font-black shadow-md shadow-blue-100">
                                {index + 1}
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Specification</span>
                                {item.sku && <span className="ml-2 text-[10px] font-mono font-bold text-slate-505 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">#{item.sku}</span>}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={items.length === 1}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border
                                ${items.length === 1 
                                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                                  : 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-500 hover:text-white hover:shadow-sm'}
                              `}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                            {/* Product Selector */}
                            <div className="xl:col-span-5 space-y-3">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider">Product Details</label>
                                  <SearchSelect 
                                    fetchOptions={async (q) => await inventoryApi.searchInventories(q)}
                                    value={item.product}
                                    labelKey="name"
                                    valueKey="id"
                                    onChange={(val, opt: any) => {
                                      if (opt) {
                                        const hasVariants = opt.has_variant || (opt.datas && opt.datas.has_variant);
                                        const combinations = opt.variants || (opt.datas && opt.datas.variants) || [];
                                        
                                        if (hasVariants && combinations.length > 0) {
                                          const mappedVariants = combinations.map((c: any) => {
                                            const d = c.datas || {};
                                            return {
                                              id: c.id,
                                              name: d.name || c.name || "Variant",
                                              sku: c.barcode || d.barcode || opt.barcode,
                                              stock: c.stocks ?? c.stock ?? d.stocks ?? 0,
                                              batches: parseBatches(c.batches || d.batches),
                                              serial_numbers: d.serial_numbers || c.serial_numbers || null,
                                            };
                                          });
                                          
                                          setVariantModal({
                                            isOpen: true,
                                            baseProduct: opt.name || String(val),
                                            targetRowIndex: index,
                                            variants: mappedVariants,
                                            baseData: opt
                                          });
                                          setSelectedVariant(null);
                                        } else {
                                          // Handle Root level Batches/Serials
                                          const rootBatches = parseBatches(opt.batches || (opt.datas && opt.datas.batches));
                                          
                                          if (rootBatches.length > 0) {
                                            setBatchModal({
                                              isOpen: true,
                                              variantName: opt.name || String(val),
                                              targetRowIndex: index,
                                              batches: rootBatches,
                                              variantData: opt // Using opt as variant data for standard products
                                            });
                                            setVariantModal(prev => ({ ...prev, baseData: opt }));
                                          } else {
                                            const serialInfo = extractSerials(opt.serial_number || (opt.datas && opt.datas.serial_number));
                                            updateMultiple(item.id, { 
                                              inventory_id: opt.id,
                                              product: opt.name || String(val),
                                              barcode: opt.barcode || '',
                                              currentStock: opt.stocks || 0,
                                              variant_name: '',
                                              variant_id: '',
                                              batch_id: '',
                                              batch_name: '',
                                              serialno_id: serialInfo.id,
                                              sku: opt.barcode || '',
                                              has_serialno_tracking: opt.has_serialno || (opt.datas && opt.datas.has_serialno) || false,
                                              existing_serial_numbers: serialInfo.list,
                                              serial_numbers: [],
                                              type: (opt.has_serialno || (opt.datas && opt.datas.has_serialno)) && serialInfo.list.length === 0
                                                ? 'INCREMENT'
                                                : item.type
                                            });
                                          }
                                        }
                                      } else {
                                        updateItem(item.id, 'product', String(val));
                                      }
                                    }}
                                    placeholder="Search or scan product..."
                                  />
                              </div>

                              {item.product && (
                                <div className="flex flex-wrap gap-2 animate-in zoom-in-95 mt-[-4px]">
                                  {item.variant_name && (
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-0.5">Variation</span>
                                      <div className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-100 shadow-sm leading-none">
                                        {item.variant_name}
                                      </div>
                                    </div>
                                  )}
                                  {item.batch_name && (
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-0.5">Batch</span>
                                      <div className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-100 shadow-sm leading-none">
                                        {item.batch_name}
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-0.5">Stock Impact</span>
                                    <div className="flex gap-2">
                                      <div className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-550 text-[10px] font-bold border border-slate-150 leading-none">
                                        Prev: {item.currentStock}
                                      </div>
                                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black border shadow-sm leading-none ${item.type === 'INCREMENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                        New: {newStock}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Config Fields */}
                            <div className="xl:col-span-7 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ReusableSelect 
                                  label="Action Type" 
                                  options={
                                    item.has_serialno_tracking && (!item.existing_serial_numbers || item.existing_serial_numbers.length === 0)
                                    ? typeOptions.filter(o => o.value === 'INCREMENT')
                                    : typeOptions
                                  } 
                                  value={item.type}
                                  onValueChange={(val) => updateItem(item.id, 'type', val)}
                                  className={`text-xs font-semibold ${item.type === 'INCREMENT' ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'}`}
                                />
                                <Input 
                                  label="Quantity" 
                                  type="number" 
                                  value={item.stocks}
                                  onChange={(e) => updateItem(item.id, 'stocks', e.target.value)}
                                  placeholder="0"
                                  className="text-xs font-semibold"
                                />
                                <ReusableSelect 
                                  label="Correction Reason" 
                                  options={reasonOptions} 
                                  value={item.reason}
                                  onValueChange={(val) => updateItem(item.id, 'reason', val)}
                                  className="text-xs font-semibold"
                                />
                                <Input 
                                  label="Internal Note" 
                                  type="text" 
                                  placeholder="Reason for adjustment..."
                                  value={item.internalNote}
                                  onChange={(e) => updateItem(item.id, 'internalNote', e.target.value)}
                                  className="text-xs font-semibold"
                                />
                              </div>
                            </div>
                            {item.has_serialno_tracking && (
                              <div className="xl:col-span-12 mt-4">
                                <InlineSerialManager
                                  serials={item.serial_numbers}
                                  serialLabel="Serial Number"
                                  onUpdate={(next) => updateItem(item.id, 'serial_numbers', next)}
                                  limit={Number(item.stocks || 0)}
                                  existingSerials={item.existing_serial_numbers}
                                  validationType={item.type === 'INCREMENT' ? 'increase' : 'decrease'}
                                  onValidationError={(msg) => showToast(msg, "error")}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-4 flex justify-center w-full">
                      <button 
                        onClick={handleAddItem}
                        className="w-full group flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-extrabold text-xs hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all active:scale-95 shadow-sm"
                      >
                        <Plus size={16} className="group-hover:rotate-90 transition-transform duration-350" />
                        Add Next Product
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Panel - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-100/50 overflow-hidden sticky top-4">
              <div className="px-5 py-4 bg-gradient-to-r from-emerald-50/40 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <History size={16} />
                </div>
                <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-wider">Summary</h2>
              </div>
              
              <div className="p-4 space-y-3.5">
                <div className="space-y-3">
                  <Input 
                    label="Date" 
                    type="date" 
                    value={adjustmentDate} 
                    required 
                    onChange={(e) => setAdjustmentDate(e.target.value)} 
                    leftIcon={<Calendar size={13} className="text-slate-400" />}
                    className="text-xs font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-150/60 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Items</span>
                    <span className="text-lg font-black text-slate-850">{summary.validProductCount}</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-center transition-colors ${summary.netChange > 0 ? 'bg-emerald-50 border-emerald-100/80' : summary.netChange < 0 ? 'bg-rose-50 border-rose-100/80' : 'bg-slate-50 border-slate-150/60'}`}>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Net</span>
                    <span className={`text-lg font-black ${summary.netChange > 0 ? 'text-emerald-600' : summary.netChange < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {summary.netChange > 0 ? '+' : ''}{summary.netChange}
                    </span>
                  </div>
                </div>

                {summary.impactList.length > 0 && (
                  <button 
                    onClick={() => setIsImpactModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100/80 hover:bg-blue-100/50 transition-all text-left shadow-sm"
                  >
                    <div className="flex flex-col overflow-hidden gap-0.5">
                      <span className="text-[10px] font-extrabold text-blue-700 truncate pr-2">
                        {summary.impactList[0].name}
                      </span>
                      {summary.impactList.length > 1 && (
                        <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-wider leading-none">
                          +{summary.impactList.length - 1} more items
                        </span>
                      )}
                    </div>
                    <ChevronDown size={14} className="text-blue-600 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

