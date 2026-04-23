import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
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
  History
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

// --- Type definitions ---
interface AdjustmentItem {
  id: string;
  product: string;
  barcode: string;
  currentStock: number;
  type: 'increase' | 'decrease';
  quantity: number | ''; 
  reason: string;
  notes: string;
  variant?: string;
  sku?: string;
}

const typeOptions = [
  { value: 'increase', label: 'Increase (+)' },
  { value: 'decrease', label: 'Decrease (−)' }
];

const reasonOptions = [
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Lost / Stolen', label: 'Lost / Stolen' },
  { value: 'Stock Correction', label: 'Stock Correction' },
  { value: 'Returned (Defective)', label: 'Returned (Defective)' },
];

const LOW_STOCK_THRESHOLD = 5;

export default function StockAdjustmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setActions } = useHeader();
  const { showToast } = useToast();

  const [items, setItems] = useState<AdjustmentItem[]>([]);
  const [adjustmentDate, setAdjustmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [referenceNumber] = useState(`ADJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`);
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
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  // --- Load Draft ---
  useEffect(() => {
    const draftId = searchParams.get("draftId");
    if (draftId) {
      const drafts = JSON.parse(localStorage.getItem("stock_adjustment_drafts") || "[]");
      const draft = drafts.find((d: any) => d.id === draftId);
      if (draft) {
        setItems(draft.data.items || []);
        setAdjustmentDate(draft.data.adjustmentDate);
        setNotes(draft.data.notes);
      }
    } else if (items.length === 0) {
      // Add one empty row if not loading draft
      handleAddItem();
    }
  }, [searchParams]);

  // --- Header Actions ---
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="hidden md:flex items-center gap-2">
          <button 
            type="button"
            onClick={handleSaveDraft}
            className="px-4 h-11 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
          >
            <Bookmark size={14} />
            Save Draft
          </button>
          <GradientButton 
            icon={isSubmitting ? <Loader className="h-4 w-4" /> : <Save size={16} />} 
            onClick={handleSubmit} 
            disabled={isSubmitting || items.length === 0}
            className="rounded-xl shadow-md text-xs px-6 h-11 h-auto flex items-center py-3"
          >
            {isSubmitting ? "Saving..." : "Save Adjustment"}
          </GradientButton>
        </div>
      </div>
    );
    return () => setActions(null);
  }, [setActions, items, isSubmitting, adjustmentDate, notes]);

  const handleAddItem = () => {
    const newItem: AdjustmentItem = {
      id: `item-${Date.now()}`,
      product: '',
      barcode: '',
      currentStock: 0,
      type: 'decrease',
      quantity: 1,
      reason: 'Stock Correction',
      notes: '',
      variant: '',
      sku: ''
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
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

  const toggleVariantSelection = (variantId: string) => {
    const newSelection = new Set(selectedVariants);
    if (newSelection.has(variantId)) {
      newSelection.delete(variantId);
    } else {
      newSelection.add(variantId);
    }
    setSelectedVariants(newSelection);
  };

  const confirmVariants = () => {
    if (selectedVariants.size === 0) {
      setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
      return;
    }

    const variantsToAdd = variantModal.variants.filter(v => selectedVariants.has(v.id));
    const updatedItems = [...items];
    const baseOpt = variantModal.baseData;

    // Update origin row
    const firstVariant = variantsToAdd[0];
    updatedItems[variantModal.targetRowIndex] = {
      ...updatedItems[variantModal.targetRowIndex],
      product: variantModal.baseProduct,
      barcode: firstVariant.sku || baseOpt.barcode || '',
      currentStock: firstVariant.stock || baseOpt.stocks || baseOpt.stock || 0,
      variant: firstVariant.name,
      sku: firstVariant.sku || firstVariant.barcode
    };

    // Append new rows for multiple selections
    for (let i = 1; i < variantsToAdd.length; i++) {
      const v = variantsToAdd[i];
      updatedItems.push({
        id: `item-${Date.now()}-${i}`,
        product: variantModal.baseProduct,
        barcode: v.sku || baseOpt.barcode || '',
        currentStock: v.stock || baseOpt.stocks || baseOpt.stock || 0,
        type: 'decrease',
        quantity: 1,
        reason: 'Stock Correction',
        notes: '',
        variant: v.name,
        sku: v.sku || v.barcode
      });
    }

    setItems(updatedItems);
    setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
    setSelectedVariants(new Set());
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
    if (items.length === 0 || items.some(item => !item.product || item.quantity === '')) {
      showToast("Please ensure all items have a product and quantity.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const products = items.map(item => ({
        id: item.id, 
        name: item.product,
        barcode: item.barcode,
        currentStock: item.currentStock,
        type: item.type === 'increase' ? 'INCREMENT' : 'DECREMENT',
        quantity: item.quantity,
        reason: item.reason,
        notes: item.notes,
        variant: item.variant,
        sku: item.sku
      }));

      const payload = {
        shop_id: SHOP_ID,
        type: "STOCK_ADJUSTMENT",
        date: adjustmentDate,
        referenceNumber,
        notes,
        products
      };

      await inventoryApi.createStockAdjustment(payload);
      
      showToast("Stock Adjustment saved successfully!", "success");
      
      // Clear draft if exists
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("stock_adjustment_drafts") || "[]");
        const filtered = drafts.filter((d: any) => d.id !== draftId);
        localStorage.setItem("stock_adjustment_drafts", JSON.stringify(filtered));
      }

      // Reset form or navigate
      setItems([]);
      setNotes('');
      navigate("/inventory");
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

      const qty = Number(item.quantity) || 0;
      const changeAmt = item.type === 'increase' ? qty : -qty;
      netChange += changeAmt;
      
      const displayName = item.variant ? `${item.product} (${item.variant})` : item.product;

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

  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/50 p-3 md:p-4 lg:p-4 font-[Inter,sans-serif]">
      
      {/* --- IMPACT DETAILS POPUP --- */}
      <FloatingFormCard
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        title="Stock Impact Details"
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          {summary.impactList.map((stat, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:border-blue-200 group">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">{stat.name}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stat.type === 'increase' ? 'Inbound' : 'Outbound'}</span>
              </div>
              <span className={`text-sm font-black tabular-nums ${stat.type === 'increase' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.change > 0 ? '+' : ''}{stat.change}
              </span>
            </div>
          ))}
        </div>
      </FloatingFormCard>

      {/* --- DYNAMIC VARIANT SELECTION MODAL --- */}
      {variantModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200/60 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                  <PackageOpen size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Select Variants</h3>
                  <p className="text-xs text-slate-500 font-medium tracking-tight">Available variations for <span className="text-slate-800 font-bold">{variantModal.baseProduct}</span></p>
                </div>
              </div>
              <button onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[50vh] overflow-y-auto bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {variantModal.variants.map((variant) => {
                  const stockNum = Number(variant.stock) || 0;
                  const isLowStock = stockNum <= LOW_STOCK_THRESHOLD && stockNum > 0;
                  const isSelected = selectedVariants.has(variant.id);

                  return (
                    <div
                      key={variant.id}
                      onClick={() => toggleVariantSelection(variant.id)}
                      className={`relative p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col gap-3 group
                        ${isSelected
                            ? 'border-blue-500 bg-blue-50/40 cursor-pointer shadow-xl shadow-blue-500/10'
                            : 'border-slate-100 hover:border-blue-200 hover:shadow-md cursor-pointer bg-white'
                        }
                      `}
                    >
                      <div className={`absolute top-6 right-6 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white scale-110' : 'border-slate-200 group-hover:border-blue-300'}`}>
                        {isSelected && <Check size={14} strokeWidth={4} />}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 pr-8">{variant.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">SKU: {variant.sku}</p>
                      </div>
                      
                      <div className="mt-2">
                        <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
                            stockNum <= 0 ? 'bg-slate-200 text-slate-600' : 
                            isLowStock ? 'bg-orange-100 text-orange-700' : 
                            'bg-emerald-100 text-emerald-700 border border-emerald-200/50'
                          }`}>
                          Stock: {stockNum}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 px-8 border-t border-slate-100 bg-white flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span className="text-blue-600 mr-1">{selectedVariants.size}</span> selected
              </span>
              <div className="flex gap-4">
                <button 
                  onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })}
                  className="px-6 h-12 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <GradientButton variant="primary" onClick={confirmVariants} disabled={selectedVariants.size === 0} className="rounded-2xl px-8 h-12 text-xs">
                  Add to List
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Alert */}
        <div className="flex items-start gap-x-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-[12px] leading-relaxed text-amber-800 shadow-sm">
          <div className="scale-150 rounded-xl flex items-center justify-center text-amber-600 shrink-0 border border-amber-200">
            <AlertTriangle size={16} />
          </div>
          <div className='flex items-center justify-center'>
            <strong className="font-bold uppercase text-[9px] bg-amber-100 px-1.5 rounded tracking-widest mr-2">Physical Check:</strong>
            Stock adjustments update counts but not history. Use for damage, loss, or expiry.
          </div>
        </div>        {/* --- FORM LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-start">
          
          {/* Left Column: Inventory Items */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-5 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm">
                    <Package size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.15em]">Inventory Items</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">List of products for correction</p>
                  </div>
                </div>
                <button 
                  onClick={handleAddItem}
                  className="flex items-center gap-2 px-5 h-10 rounded-xl bg-blue-600 text-white text-[11px] font-bold uppercase tracking-[0.1em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="p-8 space-y-6">
                {items.map((item, index) => {
                  const qtyNum = Number(item.quantity) || 0;
                  const newStock = item.product 
                    ? (item.type === 'increase' ? item.currentStock + qtyNum : Math.max(0, item.currentStock - qtyNum))
                    : 0;

                  return (
                    <div key={item.id} className="group relative rounded-[2rem] border border-slate-200 bg-slate-50/20 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40">
                      
                      {/* Item Row Header */}
                      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-500/20">
                            {index + 1}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Item Specification</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center transition-all hover:bg-rose-500 hover:text-white border border-rose-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                        {/* Product Selector */}
                        <div className="xl:col-span-5 space-y-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Product Identity</label>
                            <SearchSelect 
                              fetchOptions={async (q) => await inventoryApi.searchInventories(q)}
                              value={item.product}
                              labelKey="name"
                              valueKey="id"
                              onChange={(val, opt: any) => {
                                 if (opt) {
                                   const hasVariants = opt.has_variants || (opt.datas && opt.datas.has_variants);
                                   const combinations = opt.combinations || (opt.datas && opt.datas.combinations) || [];
                                   
                                   if (hasVariants && combinations.length > 0) {
                                     const mappedVariants = combinations.map((c: any) => ({
                                       id: c.id,
                                       name: Object.values(c.attributes || {}).join(" - "),
                                       sku: c.barcode || opt.barcode,
                                       stock: c.stock || opt.stocks || 0,
                                     }));
                                     
                                     setVariantModal({
                                       isOpen: true,
                                       baseProduct: opt.name || opt.label || String(val),
                                       targetRowIndex: index,
                                       variants: mappedVariants,
                                       baseData: opt.datas || opt
                                     });
                                     setSelectedVariants(new Set());
                                   } else {
                                     const dataNode = opt.datas || opt;
                                     updateMultiple(item.id, { 
                                       product: dataNode.name || opt.label || String(val),
                                       barcode: dataNode.barcode || '',
                                       currentStock: dataNode.stocks || dataNode.stock || 0,
                                       variant: dataNode.variant || '',
                                       sku: dataNode.barcode || dataNode.sku || ''
                                     });
                                   }
                                 } else {
                                    updateItem(item.id, 'product', String(val));
                                 }
                              }}
                              placeholder="Find inventory item..."
                            />
                          </div>

                          {item.product && (
                            <div className="flex flex-wrap gap-2 animate-in zoom-in-95">
                              {item.variant && (
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Variation</span>
                                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase tracking-widest shadow-sm">
                                    {item.variant}
                                  </div>
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Stock Impact</span>
                                <div className="flex gap-2">
                                  <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 uppercase tracking-widest">
                                    Prev: {item.currentStock}
                                  </div>
                                  <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border uppercase tracking-widest shadow-sm ${item.type === 'increase' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    New: {newStock}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Config Fields */}
                        <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ReusableSelect 
                            label="Action Type" 
                            options={typeOptions} 
                            value={item.type}
                            onValueChange={(val) => updateItem(item.id, 'type', val)}
                            className={item.type === 'increase' ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}
                          />
                          <Input 
                            label="Count Change" 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            placeholder="0"
                          />
                          <ReusableSelect 
                            label="Correction Reason" 
                            options={reasonOptions} 
                            value={item.reason}
                            onValueChange={(val) => updateItem(item.id, 'reason', val)}
                          />
                          <Input 
                            label="Internal Reference" 
                            type="text" 
                            placeholder="Optional notes..."
                            value={item.notes}
                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                      
                    </div>
                  );
                })}

                {items.length > 0 && (
                  <div className="pt-4 flex justify-center w-full">
                    <button 
                      onClick={handleAddItem}
                      className="w-full group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all active:scale-95"
                    >
                      <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                      Insert New Item Specification
                    </button>
                  </div>
                )}

                {items.length === 0 && (
                  <div className="rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/50 py-20 flex flex-col items-center justify-center gap-6 group hover:border-blue-300 transition-all">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors">
                      <Package size={40} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">No Products Drafted</h3>
                      <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Add products to begin physical inventory correction.</p>
                    </div>
                    <button 
                      onClick={handleAddItem}
                      className="px-10 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-widest shadow-sm hover:shadow-lg transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95"
                    >
                      Start Adding
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-2 space-y-6 sticky top-4">
            
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm">
                  <History size={18} />
                </div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-[0.2em]">Summary</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Configuration Fields */}
                <div className="space-y-4">
                  <Input 
                    label="Adjustment Date" 
                    type="date" 
                    value={adjustmentDate} 
                    required 
                    onChange={(e) => setAdjustmentDate(e.target.value)} 
                    leftIcon={<Calendar size={18} className="text-slate-400" />}
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Adjustment Notes</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Reason for correction..." 
                      className="min-h-[80px] w-full resize-none rounded-[1.5rem] border border-slate-200 bg-slate-50/30 px-5 py-4 text-sm text-slate-800 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400" 
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Items</span>
                      <span className="text-2xl font-black text-slate-800">{summary.validProductCount}</span>
                    </div>
                    <div className={`p-4 rounded-2xl border text-center transition-colors duration-300 ${summary.netChange > 0 ? 'bg-emerald-50 border-emerald-100' : summary.netChange < 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Net Variance</span>
                      <span className={`text-2xl font-black ${summary.netChange > 0 ? 'text-emerald-600' : summary.netChange < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {summary.netChange > 0 ? '+' : ''}{summary.netChange}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {summary.impactList.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="mx-auto h-8 w-8 text-slate-200 mb-2" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No Items Added</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsImpactModalOpen(true)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-50/50 border border-blue-100 hover:bg-blue-100/50 transition-all group"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-[11px] font-bold text-blue-700 truncate max-w-[120px]">
                            {summary.impactList[0].name}
                          </span>
                          {summary.impactList.length > 1 && (
                            <span className="text-[10px] font-black text-blue-400 uppercase shrink-0">
                              + {summary.impactList.length - 1} more
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-blue-600 bg-blue-100/50 px-2 py-1 rounded-lg uppercase tracking-wider group-hover:bg-blue-600 group-hover:text-white transition-all">
                             View Detail
                           </span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Submit Actions */}
        <div className="md:hidden flex flex-col gap-4 pb-20">
          <button 
            type="button"
            onClick={handleSaveDraft}
            className="w-full h-14 rounded-3xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <Bookmark size={18} />
            Save Draft
          </button>
          <GradientButton 
            icon={<Save size={20} />} 
            onClick={handleSubmit} 
            disabled={isSubmitting || items.length === 0}
            className="w-full h-14 rounded-3xl"
          >
            {isSubmitting ? "Processing..." : "Save Adjustment"}
          </GradientButton>
        </div>

      </div>
    </div>
  );
}