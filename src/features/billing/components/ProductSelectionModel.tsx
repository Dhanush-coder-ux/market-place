import React, { useState, useEffect, useMemo } from "react";
import { X, CheckCircle2, AlertCircle, Barcode, CalendarDays, ChevronRight, ArrowLeft, Package, Check, Search } from "lucide-react";
import { InventoryItem, ProductVariant } from "../types";

interface ProductSelectionModalProps {
  isOpen: boolean;
  product: InventoryItem | null;
  onClose: () => void;
  onSuccess: (variant: ProductVariant, quantity: number, serials?: string[]) => void;
  initialQuantity?: number;
  initialSerials?: string[];
  initialVariantId?: string;
  excludedSerials?: string[];
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ 
  isOpen, product, onClose, onSuccess,
  initialQuantity, initialSerials, initialVariantId,
  excludedSerials = []
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [stepIndex, setStepIndex] = useState(0);
  const [variantSearch, setVariantSearch] = useState("");
  const [serialSearch, setSerialSearch] = useState("");

  // Derived properties
  const hasVariants = product?.variants && product.variants.length > 0;
  const isElectronics = product?.category === "Electronics" || product?.requireSerial;

  // Determine logical steps
  const steps = useMemo(() => {
    const s = [];
    if (hasVariants) s.push("variant");
    if (isElectronics) s.push("serial");
    s.push("summary");
    return s;
  }, [hasVariants, isElectronics]);

  const currentStep = steps[stepIndex];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && product) {
      const isEdit = !!initialVariantId || !!initialQuantity;

      if (product.variants && product.variants.length > 0) {
        if (initialVariantId) {
          const v = product.variants.find(x => x.id === initialVariantId);
          setSelectedVariant(v || null);
        } else {
          setSelectedVariant(null);
        }
      } else {
        setSelectedVariant({
          id: "default",
          name: "Standard",
          price: product.price || 0,
          stock: product.stocks || 0,
          serialnoId: product.serialnoId,
          batchId: product.batchId,
          availableSerials: product.availableSerials
        });
      }
      setSelectedSerials(initialSerials || []);
      setQuantity(initialQuantity || 1);
      
      // If editing, skip to the relevant step
      if (isEdit) {
        if (isElectronics) setStepIndex(steps.indexOf("serial"));
        else setStepIndex(steps.indexOf("summary"));
      } else {
        setStepIndex(0);
      }

      setVariantSearch("");
      setSerialSearch("");
    }
  }, [isOpen, product, initialQuantity, initialSerials, initialVariantId, isElectronics, steps]);

  const availableSerials = useMemo(() => {
    if (!product) return [];
    const raw = selectedVariant?.availableSerials || product.availableSerials || [];
    // Filter out serials that are already used elsewhere, BUT keep those that were initially selected for THIS item (in case of editing)
    return raw.filter(s => !excludedSerials.includes(s) || initialSerials?.includes(s));
  }, [selectedVariant, product?.availableSerials, excludedSerials, initialSerials]);

  if (!isOpen || !product) return null;
  
  const canGoNext = (() => {
    if (currentStep === "variant") return !!selectedVariant;
    if (currentStep === "serial") return selectedSerials.length === quantity && quantity > 0;
    return true;
  })();

  const toggleSerial = (s: string) => {
    const isInitial = initialSerials?.includes(s);
    
    // If increasing: lock initial ones
    if (initialSerials && quantity > initialSerials.length && isInitial) return;
    
    // If decreasing: only allow toggling initial ones
    if (initialSerials && quantity < initialSerials.length && !isInitial) return;

    setSelectedSerials(prev => {
      if (prev.includes(s)) return prev.filter(x => x !== s);
      if (prev.length < quantity) return [...prev, s];
      return prev;
    });
  };

  const handleNext = () => {
    if (stepIndex < steps.length - 1) setStepIndex(prev => prev + 1);
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(prev => prev - 1);
  };

  const fmt = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform scale-100 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">{product.product_name}</h3>
              <p className="text-xs text-slate-400 font-medium">{product.product_barcode} • {product.category}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-1.5">
            {steps.map((s, idx) => (
              <React.Fragment key={s}>
                <div className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === stepIndex ? "w-8 bg-blue-500" : idx < stepIndex ? "w-4 bg-emerald-400" : "w-4 bg-slate-100"
                }`} />
                {idx < steps.length - 1 && <div className="w-1 h-1 rounded-full bg-slate-200" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto pf-scroll" style={{ minHeight: '320px', maxHeight: '60vh' }}>
          
          {/* STEP: VARIANT */}
          {currentStep === "variant" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Choose Variant</p>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Required</span>
              </div>

              {/* Variant Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search variants..."
                  value={variantSearch}
                  onChange={(e) => setVariantSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 focus:bg-white focus:border-blue-300 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {product.variants
                  .filter(v => v.name.toLowerCase().includes(variantSearch.toLowerCase()))
                  .map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isOutOfStock = variant.stock === 0;

                  return (
                    <button
                      key={variant.id}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedVariant(variant)}
                      className={`group flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                        isOutOfStock ? "opacity-40 cursor-not-allowed border-slate-50 bg-slate-50/50" :
                        isSelected ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                      }`}>
                        <Package size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${isSelected ? "text-blue-900" : "text-slate-700"}`}>
                          {variant.name}
                        </p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">Stock: {variant.stock} units</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-slate-900"}`}>{fmt(variant.price)}</p>
                        {isSelected && <CheckCircle2 size={16} className="text-blue-500 ml-auto mt-1" />}
                      </div>
                    </button>
                  );
                })}
                {product.variants.filter(v => v.name.toLowerCase().includes(variantSearch.toLowerCase())).length === 0 && (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">No variants match "{variantSearch}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP: SERIALS */}
          {currentStep === "serial" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quantity & Serials</p>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enter Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={availableSerials.length || 1}
                      value={quantity}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        setQuantity(val);
                        if (selectedSerials.length > val) {
                          setSelectedSerials(prev => prev.slice(0, val));
                        }
                      }}
                      className="w-full bg-transparent text-xl font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="flex-1 text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">In Stock</span>
                    <span className="text-lg font-bold text-emerald-500">{availableSerials.length}</span>
                  </div>
                </div>

                {selectedSerials.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                    {selectedSerials.map(s => {
                      const isInitial = initialSerials?.includes(s);
                      const isLocked = initialSerials && quantity > initialSerials.length && isInitial;

                      return (
                        <span key={s} 
                          onClick={() => !isLocked && toggleSerial(s)}
                          className={`group px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                            isLocked 
                              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                              : "cursor-pointer bg-white border-blue-200 text-blue-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                          }`}
                        >
                          {s}
                          {!isLocked && <X size={10} className="text-blue-400 group-hover:text-red-400" />}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Barcode size={14} /> Select {quantity} Serial{quantity !== 1 ? 's' : ''}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                    selectedSerials.length === quantity ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {selectedSerials.length} / {quantity}
                  </span>
                </div>

                {/* Serial Search */}
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search serial numbers..."
                    value={serialSearch}
                    onChange={(e) => setSerialSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 focus:bg-white focus:border-blue-300 transition-all outline-none"
                  />
                </div>
                
                {availableSerials.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSerials
                      .filter(s => s.toLowerCase().includes(serialSearch.toLowerCase()))
                      .map((s) => {
                      const isSelected = selectedSerials.includes(s);
                      const isInitial = initialSerials?.includes(s);
                      
                      const isDisabled = (() => {
                        // Basic: reached quantity limit
                        if (!isSelected && selectedSerials.length >= quantity) return true;
                        
                        // Increasing: lock initial ones
                        if (initialSerials && quantity > initialSerials.length && isInitial) return true;
                        
                        // Decreasing: disable non-initial ones
                        if (initialSerials && quantity < initialSerials.length && !isInitial) return true;
                        
                        return false;
                      })();

                      return (
                        <button
                          key={s}
                          disabled={isDisabled}
                          onClick={() => toggleSerial(s)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all duration-150 text-left relative overflow-hidden ${
                            isSelected 
                              ? isDisabled && isInitial && quantity > (initialSerials?.length || 0)
                                ? "border-slate-200 bg-slate-50 text-slate-400" // Locked style
                                : "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" 
                              : isDisabled
                                ? "border-slate-50 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50"
                                : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                          }`}
                        >
                          <span className="truncate block pr-4">{s}</span>
                          {isSelected && <Check size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                            isDisabled && isInitial && quantity > (initialSerials?.length || 0) ? "text-slate-300" : "text-blue-500"
                          }`} />}
                        </button>
                      );
                    })}
                    {availableSerials.filter(s => s.toLowerCase().includes(serialSearch.toLowerCase())).length === 0 && (
                      <div className="col-span-2 py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">No serials match "{serialSearch}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 px-6 rounded-3xl border-2 border-dashed border-slate-100 text-center">
                    <AlertCircle size={32} className="text-amber-300" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">No Serials Found</p>
                      <p className="text-xs text-slate-400 mt-1">This product requires serial numbers but none are available in stock.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP: SUMMARY */}
          {currentStep === "summary" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Review Selection</p>
              
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Selected Variant</p>
                    <p className="text-sm font-bold text-slate-800">{selectedVariant?.name}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{fmt(selectedVariant?.price || 0)}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Quantity</p>
                    <p className="text-sm font-bold text-slate-800">{quantity} Units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total</p>
                    <p className="text-sm font-bold text-blue-600">{fmt((selectedVariant?.price || 0) * quantity)}</p>
                  </div>
                </div>

                {product.batchTracking && (selectedVariant?.batchId || product.batchId) && (
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                    <CalendarDays size={18} className="text-indigo-400" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase mb-0.5">Batch Tracking</p>
                      <p className="text-xs font-bold text-indigo-900">ID: {selectedVariant?.batchId || product.batchId}</p>
                    </div>
                  </div>
                )}

                {selectedSerials.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Serial Numbers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSerials.map(s => (
                        <span key={s} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600 font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
          {stepIndex > 0 ? (
            <button 
              onClick={handleBack} 
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          ) : (
            <button 
              onClick={onClose} 
              className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all border border-slate-100"
            >
              Cancel
            </button>
          )}

          {stepIndex < steps.length - 1 ? (
            <button
              disabled={!canGoNext}
              onClick={handleNext}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-300 ${
                canGoNext ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" : "bg-slate-200 cursor-not-allowed"
              }`}
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={() => selectedVariant && onSuccess(selectedVariant, quantity, selectedSerials)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all duration-300"
            >
              Add to Bill
              <Check size={18} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProductSelectionModal;