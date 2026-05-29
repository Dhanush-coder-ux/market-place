import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertCircle, Barcode, CalendarDays, ChevronRight, ArrowLeft, Package, Check, Search } from "lucide-react";
import { InventoryItem, ProductVariant } from "../types";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface ProductSelectionModalProps {
  isOpen: boolean;
  product: InventoryItem | null;
  onClose: () => void;
  onSuccess: (variant: ProductVariant, quantity: number, serials?: string[]) => void;
  initialQuantity?: number;
  initialSerials?: string[];
  initialVariantId?: string;
  initialBatchId?: string;
  excludedSerials?: string[];
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ 
  isOpen, product, onClose, onSuccess,
  initialQuantity, initialSerials, initialVariantId, initialBatchId,
  excludedSerials = []
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [stepIndex, setStepIndex] = useState(0);
  const [variantSearch, setVariantSearch] = useState("");
  const [serialSearch, setSerialSearch] = useState("");

  // Body Scroll Lock
  useEffect(() => {
    if (isOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  // Derived properties
  const hasVariants = product?.variants && product.variants.length > 0 && !product.variants[0].name.startsWith("Batch: ");
  const hasBatches = product?.batchTracking;
  const isElectronics = product?.requireSerial;

  // Determine logical steps
  const steps = useMemo(() => {
    const s = [];
    if (hasVariants) s.push("variant");
    if (hasBatches) s.push("batch");
    if (isElectronics) s.push("serial");
    s.push("summary");
    return s;
  }, [hasVariants, hasBatches, isElectronics]);

  const currentStep = steps[stepIndex];

  // Batches to select helper
  const batchesToSelect = useMemo(() => {
    if (!product) return [];
    if (hasVariants && selectedVariant) {
      return selectedVariant.batches || [];
    }
    // If variants are actually batches:
    if (product.variants && product.variants.length > 0 && product.variants[0].name.startsWith("Batch: ")) {
      return product.variants;
    }
    return product.batches || [];
  }, [product, hasVariants, selectedVariant]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && product) {
      const isEdit = !!initialVariantId || !!initialQuantity;

      if (product.variants && product.variants.length > 0 && !product.variants[0].name.startsWith("Batch: ")) {
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
      setSelectedSerials(Array.isArray(initialSerials) ? initialSerials : []);
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

  // Pre-populate or reset selected batch on change
  useEffect(() => {
    if (isOpen && product?.batchTracking && batchesToSelect.length > 0) {
      if (initialBatchId) {
        const found = batchesToSelect.find((b: any) => (b.id === initialBatchId || b.batchId === initialBatchId));
        if (found) {
          setSelectedBatch(found);
          return;
        }
      }
      setSelectedBatch(null);
    } else {
      setSelectedBatch(null);
    }
  }, [isOpen, selectedVariant, batchesToSelect, initialBatchId, product?.batchTracking]);

  const availableSerials = useMemo(() => {
    if (!product) return [];
    let raw = [];
    if (product.batchTracking && selectedBatch) {
      raw = selectedBatch.serial_numbers?.serial_numbers || selectedBatch.availableSerials || [];
    } else {
      raw = selectedVariant?.availableSerials || product.availableSerials || [];
    }
    // Filter out serials that are already used elsewhere, BUT keep those that were initially selected for THIS item (in case of editing)
    const initialS = Array.isArray(initialSerials) ? initialSerials : [];
    const excludedS = Array.isArray(excludedSerials) ? excludedSerials : [];
    return raw.filter((s: string) => !excludedS.includes(s) || initialS.includes(s));
  }, [selectedVariant, selectedBatch, product, excludedSerials, initialSerials]);

  if (!isOpen || !product) return null;
  
  const canGoNext = (() => {
    if (currentStep === "variant") return !!selectedVariant;
    if (currentStep === "batch") return !!selectedBatch;
    if (currentStep === "serial") return selectedSerials.length === quantity && quantity > 0;
    return true;
  })();

  const toggleSerial = (s: string) => {
    const isInitial = Array.isArray(initialSerials) && initialSerials.includes(s);
    
    // If increasing: lock initial ones
    if (Array.isArray(initialSerials) && quantity > initialSerials.length && isInitial) return;
    
    // If decreasing: only allow toggling initial ones
    if (Array.isArray(initialSerials) && quantity < initialSerials.length && !isInitial) return;

    setSelectedSerials(prev => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.includes(s)) return current.filter(x => x !== s);
      if (current.length < quantity) return [...current, s];
      return current;
    });
  };

  const handleNext = () => {
    if (stepIndex < steps.length - 1) setStepIndex(prev => prev + 1);
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(prev => prev - 1);
  };

  const fmt = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  return createPortal(
    <div className="fixed inset-0 z-[1100] overflow-y-auto overflow-x-hidden scrollbar-none flex flex-col items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 pointer-events-auto" onClick={onClose} />
      
      {/* Centering Wrapper */}
      <div className="relative w-full h-full flex items-center justify-center p-4 pointer-events-none">
        <div className="relative bg-white w-full max-w-md rounded-lg shadow-[0_24px_80px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden transform scale-100 animate-in fade-in zoom-in-95 duration-300 pointer-events-auto">
          
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
                  <p className="text-[11px] font-bold text-slate-400">Choose Variant</p>
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
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 focus:bg-white focus:border-blue-300 transition-all outline-none"
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
                        className={`group flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                          isOutOfStock ? "opacity-40 cursor-not-allowed border-slate-50 bg-slate-50/50" :
                          isSelected ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
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
                    <div className="py-8 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">No variants match "{variantSearch}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP: BATCH */}
            {currentStep === "batch" && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400">Choose Batch</p>
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Required</span>
                </div>

                {/* Batch Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search batches..."
                    value={variantSearch}
                    onChange={(e) => setVariantSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 focus:bg-white focus:border-blue-300 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {batchesToSelect
                    .filter((b: any) => {
                      const name = b.name || b.batch_no || b.id;
                      return name.toLowerCase().includes(variantSearch.toLowerCase());
                    })
                    .map((batch: any) => {
                      const isSelected = selectedBatch?.id === batch.id;
                      const isOutOfStock = (batch.stocks !== undefined ? batch.stocks : batch.stock) === 0;
                      const batchName = batch.name || (batch.batch_no ? `Batch: ${batch.batch_no}` : `Batch: ${batch.id.slice(0, 8)}`);
                      const batchStock = batch.stocks !== undefined ? batch.stocks : batch.stock;
                      const batchPrice = batch.sell_price || batch.price || product.price || 0;

                      return (
                        <button
                          key={batch.id}
                          disabled={isOutOfStock}
                          onClick={() => setSelectedBatch(batch)}
                          className={`group flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                            isOutOfStock ? "opacity-40 cursor-not-allowed border-slate-50 bg-slate-50/50" :
                            isSelected ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                          }`}>
                            <CalendarDays size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${isSelected ? "text-blue-900" : "text-slate-700"}`}>
                              {batchName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs font-medium text-slate-400">Stock: {batchStock} units</span>
                              {(batch.expiry_date || batch.expiryDate) && (
                                <span className="inline-flex items-center text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  EXP: {formatDate(batch.expiry_date || batch.expiryDate)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-slate-900"}`}>{fmt(batchPrice)}</p>
                            {isSelected && <CheckCircle2 size={16} className="text-blue-500 ml-auto mt-1" />}
                          </div>
                        </button>
                      );
                    })}
                  {batchesToSelect.length > 0 && batchesToSelect.filter((b: any) => {
                    const name = b.name || b.batch_no || b.id;
                    return name.toLowerCase().includes(variantSearch.toLowerCase());
                  }).length === 0 && (
                    <div className="py-8 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">No batches match "{variantSearch}"</p>
                    </div>
                  )}
                  {batchesToSelect.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-10 px-6 rounded-lg border-2 border-dashed border-slate-100 text-center">
                      <AlertCircle size={32} className="text-amber-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-700">No Batches Found</p>
                        <p className="text-xs text-slate-400 mt-1">This product requires batch tracking but no active batches are available.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP: SERIALS */}
            {currentStep === "serial" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-3">Quantity & Serials</p>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Enter Quantity</label>
                      <input
                        type="number"
                        min="1"
                        max={availableSerials.length || 1}
                        value={quantity}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          setQuantity(val);
                          const currentSerials = Array.isArray(selectedSerials) ? selectedSerials : [];
                          if (currentSerials.length > val) {
                            setSelectedSerials(currentSerials.slice(0, val));
                          }
                        }}
                        className="w-full bg-transparent text-xl font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="flex-1 text-right">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">In Stock</span>
                      <span className="text-lg font-bold text-emerald-500">{availableSerials.length}</span>
                    </div>
                  </div>

                  {Array.isArray(selectedSerials) && selectedSerials.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-3 bg-blue-50/30 rounded-lg border border-blue-100/50">
                      {selectedSerials.map(s => {
                        const isInitial = Array.isArray(initialSerials) && initialSerials.includes(s);
                        const isLocked = Array.isArray(initialSerials) && quantity > initialSerials.length && isInitial;

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
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
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
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 focus:bg-white focus:border-blue-300 transition-all outline-none"
                    />
                  </div>
                  
                  {availableSerials.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSerials
                        .filter((s: string) => s.toLowerCase().includes(serialSearch.toLowerCase()))
                        .map((s: string) => {
                        const isSelected = Array.isArray(selectedSerials) && selectedSerials.includes(s);
                        const isInitial = Array.isArray(initialSerials) && initialSerials.includes(s);
                        
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
                            className={`px-3 py-2.5 rounded-lg text-xs font-semibold border-2 transition-all duration-150 text-left relative overflow-hidden ${
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
                      {availableSerials.filter((s: string) => s.toLowerCase().includes(serialSearch.toLowerCase())).length === 0 && (
                        <div className="col-span-2 py-8 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                          <p className="text-xs text-slate-400 font-medium">No serials match "{serialSearch}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10 px-6 rounded-lg border-2 border-dashed border-slate-100 text-center">
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
                <p className="text-[11px] font-bold text-slate-400">Review Selection</p>
                
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-0.5">Selected Variant</p>
                      <p className="text-sm font-bold text-slate-800">{selectedVariant?.name}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{fmt(selectedVariant?.price || 0)}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-0.5">Quantity</p>
                      <p className="text-sm font-bold text-slate-800">{quantity} Units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 mb-0.5">Total</p>
                      <p className="text-sm font-bold text-blue-600">{fmt((selectedVariant?.price || 0) * quantity)}</p>
                    </div>
                  </div>

                  {product.batchTracking && selectedBatch && (
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-3 shadow-[0_2px_8px_rgba(99,102,241,0.05)] transition-all">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-650 flex items-center justify-center shrink-0 mt-0.5">
                        <CalendarDays size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-indigo-400 mb-0.5 tracking-wider uppercase">Active Batch Selected</p>
                        <p className="text-xs font-black text-indigo-900 truncate">
                          {selectedBatch.name || (selectedBatch.batch_no ? `Batch: ${selectedBatch.batch_no}` : `Batch: ${selectedBatch.id.slice(0, 8)}`)}
                        </p>
                        <p className="text-[10px] font-mono font-medium text-indigo-500/80 mt-1 select-all">
                          ID: {selectedBatch.id || selectedBatch.batchId}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {(selectedBatch.manufacturing_date || selectedBatch.manufacturingDate) && (
                            <div className="text-[10px] font-semibold text-slate-500 flex flex-col gap-0.5 bg-white border border-slate-100 px-2 py-0.5 rounded shadow-sm">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Mfg Date</span>
                              {formatDate(selectedBatch.manufacturing_date || selectedBatch.manufacturingDate)}
                            </div>
                          )}
                          {(selectedBatch.expiry_date || selectedBatch.expiryDate) && (
                            <div className="text-[10px] font-semibold text-emerald-600 flex flex-col gap-0.5 bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded shadow-sm">
                              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tight">Exp Date</span>
                              {formatDate(selectedBatch.expiry_date || selectedBatch.expiryDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSerials.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 mb-2">Serial Numbers</p>
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
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            ) : (
              <button 
                onClick={onClose} 
                className="flex-1 px-6 py-3 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all border border-slate-100"
              >
                Cancel
              </button>
            )}

            {stepIndex < steps.length - 1 ? (
              <button
                disabled={!canGoNext}
                onClick={handleNext}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white transition-all duration-300 ${
                  canGoNext ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" : "bg-slate-200 cursor-not-allowed"
                }`}
              >
                Continue
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!selectedVariant) return;
                  
                  const finalVariant = { ...selectedVariant };
                  
                  if (product.batchTracking && selectedBatch) {
                    finalVariant.batchId = selectedBatch.id || selectedBatch.batchId;
                    finalVariant.expiryDate = selectedBatch.expiry_date || selectedBatch.expiryDate;
                    finalVariant.manufacturingDate = selectedBatch.manufacturing_date || selectedBatch.manufacturingDate;
                    // Update price if batch has its own price
                    if (selectedBatch.sell_price || selectedBatch.price) {
                      finalVariant.price = selectedBatch.sell_price || selectedBatch.price;
                    }
                    // Update stock if batch has its own stock
                    if (selectedBatch.stocks !== undefined || selectedBatch.stock !== undefined) {
                      finalVariant.stock = selectedBatch.stocks !== undefined ? selectedBatch.stocks : selectedBatch.stock;
                    }
                    // Update serial details from batch if any
                    if (selectedBatch.serial_numbers || selectedBatch.availableSerials) {
                      finalVariant.serialnoId = selectedBatch.serial_numbers?.id || selectedBatch.serialnoId;
                      finalVariant.availableSerials = selectedBatch.serial_numbers?.serial_numbers || selectedBatch.availableSerials || [];
                    }
                  }
                  
                  onSuccess(finalVariant, quantity, selectedSerials);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all duration-300"
              >
                Add to Bill
                <Check size={18} />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductSelectionModal;

