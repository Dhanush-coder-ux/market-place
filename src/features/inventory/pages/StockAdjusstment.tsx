import { useState, useMemo, useEffect } from 'react';
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
  internalNote: string;
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
  const { setBottomActions } = useHeader();
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
          className="px-6 h-8 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={14} />
          Save Draft
        </button>
        <GradientButton 
          icon={isSubmitting ? <Loader className="h-4 w-4" /> : <Save size={16} />} 
          onClick={handleSubmit} 
          disabled={isSubmitting || items.length === 0}
          className="rounded-xl shadow-md text-xs px-8 h-8 flex items-center"
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
      product: '',
      barcode: '',
      currentStock: 0,
      type: 'decrease',
      quantity: 1,
      reason: 'Stock Correction',
      notes: '',
      internalNote: '',
      variant: '',
      sku: ''
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

    const firstVariant = variantsToAdd[0];
    updatedItems[variantModal.targetRowIndex] = {
      ...updatedItems[variantModal.targetRowIndex],
      product: variantModal.baseProduct,
      barcode: firstVariant.sku || baseOpt.barcode || '',
      currentStock: firstVariant.stock || baseOpt.stocks || baseOpt.stock || 0,
      variant: firstVariant.name,
      sku: firstVariant.sku || firstVariant.barcode
    };

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
        internalNote: '',
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
        notes: item.internalNote || item.notes,
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
    <div className="min-h-screen bg-slate-50/50 pb-24 md:pb-4 font-[Inter,sans-serif]">
      
      {/* --- IMPACT DETAILS POPUP --- */}
      <FloatingFormCard
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        title="Stock Impact Details"
        maxWidth="max-w-md"
      >
        <div className="space-y-2">
          {summary.impactList.map((stat, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-700">{stat.name}</span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{stat.type === 'increase' ? 'Inbound' : 'Outbound'}</span>
              </div>
              <span className={`text-sm font-bold tabular-nums ${stat.type === 'increase' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.change > 0 ? '+' : ''}{stat.change}
              </span>
            </div>
          ))}
        </div>
      </FloatingFormCard>

      {/* --- DYNAMIC VARIANT SELECTION MODAL --- */}
      {variantModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-200/60 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                  <PackageOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Select Variants</h3>
                  <p className="text-xs text-slate-500 font-medium">{variantModal.baseProduct}</p>
                </div>
              </div>
              <button onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variantModal.variants.map((variant) => {
                  const stockNum = Number(variant.stock) || 0;
                  const isLowStock = stockNum <= LOW_STOCK_THRESHOLD && stockNum > 0;
                  const isSelected = selectedVariants.has(variant.id);

                  return (
                    <div
                      key={variant.id}
                      onClick={() => toggleVariantSelection(variant.id)}
                      className={`relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                        ${isSelected
                            ? 'border-blue-500 bg-blue-50/40 shadow-lg'
                            : 'border-slate-200 hover:border-blue-300 hover:shadow-md bg-white'
                        }
                      `}
                    >
                      <div className={`absolute top-3 right-3 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm pr-6">{variant.name}</h4>
                        <p className="text-[9px] text-slate-400 mt-1 font-medium uppercase tracking-wider">SKU: {variant.sku}</p>
                      </div>
                      
                      <div className="mt-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider ${
                            stockNum <= 0 ? 'bg-slate-200 text-slate-600' : 
                            isLowStock ? 'bg-orange-100 text-orange-700' : 
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                          Stock: {stockNum}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
              <span className="text-xs font-semibold text-slate-500">
                <span className="text-blue-600">{selectedVariants.size}</span> selected
              </span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })}
                  className="px-5 h-10 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <GradientButton variant="primary" onClick={confirmVariants} disabled={selectedVariants.size === 0} className="rounded-xl px-6 h-10 text-xs">
                  Add to List
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-3 md:p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Info Banner */}
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <strong className="font-semibold">Physical Check:</strong> Stock adjustments update counts but not history. Use for damage, loss, or expiry.
          </div>
        </div>


        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          
          {/* Items List */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Package size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Inventory Items</h2>
                </div>
                <button 
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 px-4 h-8 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              {/* Items Content */}
              <div className="p-4">
                {items.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-slate-300">
                      <Package size={32} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-base font-bold text-slate-800">No Products Added</h3>
                      <p className="text-xs text-slate-400 mt-1">Add products to begin stock adjustment.</p>
                    </div>
                    <button 
                      onClick={handleAddItem}
                      className="px-6 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                    >
                      Start Adding
                    </button>
                  </div>
                                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const qtyNum = Number(item.quantity) || 0;
                      const newStock = item.product 
                        ? (item.type === 'increase' ? item.currentStock + qtyNum : Math.max(0, item.currentStock - qtyNum))
                        : 0;

                      return (
                        <div key={item.id} className="group relative rounded-2xl border border-slate-200 bg-white p-4 md:p-6 transition-all hover:shadow-xl hover:shadow-slate-200/40 pf-combo-appear">
                          
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {index + 1}
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Specification</span>
                                {item.sku && <span className="ml-2 text-[9px] font-mono text-slate-400">#{item.sku}</span>}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={items.length === 1}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border
                                ${items.length === 1 
                                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                                  : 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-500 hover:text-white'}
                              `}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                            {/* Product Selector */}
                            <div className="xl:col-span-5 space-y-3">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Product Details</label>
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
                                  placeholder="Search or scan product..."
                                />
                              </div>

                              {item.product && (
                                <div className="flex flex-wrap gap-2 animate-in zoom-in-95 mt-[-4px]">
                                  {item.variant && (
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-0.5">Variation</span>
                                      <div className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase tracking-widest shadow-sm">
                                        {item.variant}
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-0.5">Stock Impact</span>
                                    <div className="flex gap-2">
                                      <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                        Prev: {item.currentStock}
                                      </div>
                                      <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border shadow-sm ${item.type === 'increase' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
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
                                  options={typeOptions} 
                                  value={item.type}
                                  onValueChange={(val) => updateItem(item.id, 'type', val)}
                                  className={item.type === 'increase' ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}
                                />
                                <Input 
                                  label="Quantity" 
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
                                  label="Internal Note" 
                                  type="text" 
                                  placeholder="Reason for adjustment..."
                                  value={item.internalNote}
                                  onChange={(e) => updateItem(item.id, 'internalNote', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-4 flex justify-center w-full">
                      <button 
                        onClick={handleAddItem}
                        className="w-full group flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all active:scale-95"
                      >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <History size={14} />
                </div>
                <h2 className="text-xs font-bold text-slate-800">Summary</h2>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="pt-2 space-y-3 border-t border-slate-100">
                  <Input 
                    label="Date" 
                    type="date" 
                    value={adjustmentDate} 
                    required 
                    onChange={(e) => setAdjustmentDate(e.target.value)} 
                    leftIcon={<Calendar size={14} className="text-slate-400" />}
                    className="text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Items</span>
                    <span className="text-xl font-bold text-slate-800">{summary.validProductCount}</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-center transition-colors ${summary.netChange > 0 ? 'bg-emerald-50 border-emerald-100' : summary.netChange < 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Net</span>
                    <span className={`text-xl font-bold ${summary.netChange > 0 ? 'text-emerald-600' : summary.netChange < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {summary.netChange > 0 ? '+' : ''}{summary.netChange}
                    </span>
                  </div>
                </div>

                {summary.impactList.length > 0 && (
                  <button 
                    onClick={() => setIsImpactModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100 hover:bg-blue-100/50 transition-all text-left"
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] font-semibold text-blue-700 truncate">
                        {summary.impactList[0].name}
                      </span>
                      {summary.impactList.length > 1 && (
                        <span className="text-[9px] font-semibold text-blue-400">
                          +{summary.impactList.length - 1} more
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