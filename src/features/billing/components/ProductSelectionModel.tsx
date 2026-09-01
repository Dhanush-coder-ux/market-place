import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertCircle, Barcode, CalendarDays, ChevronRight, ArrowLeft, Package, Check, Search } from "lucide-react";
import { InventoryItem, ProductVariant } from "../types";
import { AntBadge } from "@/components/ui/AntBadge";

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
  maxAllowedQuantity?: number;
  excludedSerials?: string[];
  isExchange?: boolean;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  isOpen, product, onClose, onSuccess,
  initialQuantity, initialSerials, initialVariantId, initialBatchId,
  maxAllowedQuantity,
  excludedSerials = [],
  isExchange = false
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [stepIndex, setStepIndex] = useState(0);
  const [variantSearch, setVariantSearch] = useState("");
  const [serialSearch, setSerialSearch] = useState("");

  const normalizedVariants = useMemo<ProductVariant[]>(() => {
    if (!product?.variants) return [];
    const raw = Array.isArray(product.variants)
      ? product.variants
      : (typeof product.variants === 'object' ? Object.values(product.variants) : []);

    return raw.map((v: any) => {
      const combDatas = v.datas || {};
      const attributes = v.attributes || combDatas.attributes || combDatas.datas?.attributes || {};
      let variantLabel = v.name || combDatas.name;
      if (variantLabel) {
        // Keep the defined name
      } else if (attributes && Object.keys(attributes).length > 0) {
        variantLabel = Object.values(attributes).join(' / ');
      } else if (v.barcode && combDatas.barcode && v.barcode !== combDatas.barcode) {
        variantLabel = v.barcode;
      } else {
        variantLabel = v.barcode || "Standard Variant";
      }

      let price = v.price || v.pricing_infos?.sell_price || v.sell_price || combDatas.sell_price || combDatas.price || product.price || 0;
      if (!price && Array.isArray(v.batch_infos) && v.batch_infos.length > 0) {
        price = v.batch_infos[0].pricing_infos?.sell_price || v.batch_infos[0].sell_price;
      }

      let stock = v.stock;
      if (stock === undefined) {
        stock = v.stock_infos?.available_stocks !== undefined
          ? v.stock_infos?.available_stocks
          : (v.stocks !== undefined ? v.stocks : (v.stock !== undefined ? v.stock : (combDatas.stocks !== undefined ? combDatas.stocks : undefined)));
      }
      if (stock === undefined && Array.isArray(v.batch_infos) && v.batch_infos.length > 0) {
        stock = v.batch_infos.reduce((sum: number, b: any) => sum + (b.stock_infos?.available_stocks || b.stocks || b.stock_infos?.physical_stocks || 0), 0);
      }
      if (stock === undefined) stock = 0;

      const batches = (v.batches || v.batch_infos || []).map((b: any) => ({
        ...b,
        batchId: b.id,
        price: b.pricing_infos?.sell_price || b.sell_price || price,
        stock: b.stock_infos?.available_stocks !== undefined ? b.stock_infos?.available_stocks : (b.stocks !== undefined ? b.stocks : (b.stock !== undefined ? b.stock : 0)),
      }));

      return {
        ...v,
        id: v.id || String(Math.random()),
        name: variantLabel,
        price,
        stock,
        batches,
      };
    });
  }, [product?.variants, product?.price]);

  const executeSubmit = (v: ProductVariant | null, b: any | null, s: string[], qty: number) => {
    const activeV = v || selectedVariant;
    if (!activeV) return;

    const finalVariant = { ...activeV };
    const activeB = b !== undefined ? b : selectedBatch;

    if (product?.batchTracking && activeB) {
      finalVariant.batchId = activeB.id || activeB.batchId;
      finalVariant.expiryDate = activeB.expiry_date || activeB.expiryDate;
      finalVariant.manufacturingDate = activeB.manufacturing_date || activeB.manufacturingDate;
      if (activeB.sell_price || activeB.price) {
        finalVariant.price = activeB.sell_price || activeB.price;
      }
      if (activeB.stocks !== undefined || activeB.stock !== undefined) {
        finalVariant.stock = activeB.stocks !== undefined ? activeB.stocks : activeB.stock;
      }
      if (activeB.serial_numbers || activeB.serialno_infos || activeB.availableSerials) {
        finalVariant.serialnoId = activeB.serial_numbers?.id || activeB.serialno_infos?.[0]?.id || activeB.serialnoId;
        const getNames = (arr: any[]): string[] => {
          return arr.map((x: any) => typeof x === 'object' && x !== null ? x.name || x.serial || "" : String(x)).filter(Boolean);
        };
        finalVariant.availableSerials = Array.isArray(activeB.serialno_infos)
          ? getNames(activeB.serialno_infos)
          : Array.isArray(activeB.serial_numbers)
            ? getNames(activeB.serial_numbers)
            : getNames(activeB.serial_numbers?.serial_numbers || activeB.availableSerials || []);
      }
    }

    onSuccess(finalVariant, qty, s);
  };

  // Body Scroll Lock
  useEffect(() => {
    if (isOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  // Derived properties
  const hasVariants = (isExchange && product?.type_infos) ? product.type_infos.has_variant : (normalizedVariants.length > 0 && !(normalizedVariants[0] as any).isBatchOnly && !normalizedVariants[0].name.startsWith("Batch: "));
  const hasBatches = (isExchange && product?.type_infos) ? product.type_infos.has_batch : product?.batchTracking;
  const isElectronics = (isExchange && product?.type_infos) ? product.type_infos.has_serialno : product?.requireSerial;

  // Determine logical steps
  const steps = useMemo(() => {
    const s = [];
    if (hasVariants) s.push("variant");
    if (hasBatches) s.push("batch");
    if (isElectronics) s.push("serial");
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
    if (normalizedVariants.length > 0 && ((normalizedVariants[0] as any).isBatchOnly || normalizedVariants[0].name.startsWith("Batch: "))) {
      return normalizedVariants;
    }
    return product.batches || [];
  }, [product, hasVariants, selectedVariant, normalizedVariants]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && product) {
      const isEdit = (() => {
        const hasV = normalizedVariants.length > 0 && !normalizedVariants[0].name.startsWith("Batch: ");
        if (hasV && !initialVariantId) return false;
        if (product.batchTracking && !initialBatchId) return false;
        return !!initialVariantId || !!initialBatchId || !!initialSerials?.length || !!initialQuantity;
      })();

      if (normalizedVariants.length > 0 && !((normalizedVariants[0] as any).isBatchOnly || normalizedVariants[0].name.startsWith("Batch: "))) {
        if (initialVariantId) {
          const v = normalizedVariants.find(x => x.id === initialVariantId);
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

    // Helper: extract serial name strings from any shape
    const toNames = (arr: any[]): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((x: any) => (typeof x === 'string' ? x : (x?.name || x?.serial || x?.serial_number || '')))
        .filter(Boolean);
    };

    let raw: string[] = [];

    if (product.batchTracking && selectedBatch) {
      // Batch selected – pull serials from that batch
      raw = toNames(
        selectedBatch.serialno_infos ||
        selectedBatch.serial_numbers ||
        selectedBatch.availableSerials ||
        []
      );
    } else if (selectedVariant) {
      // Variant selected – collect serials from variant's batches OR directly from variant
      const variantBatches: any[] = (selectedVariant as any).batches || (selectedVariant as any).batch_infos || [];
      if (variantBatches.length > 0) {
        // Aggregate serials across all batches of this variant
        raw = variantBatches.flatMap((b: any) =>
          toNames(b.serialno_infos || b.serial_numbers || b.availableSerials || [])
        );
      } else {
        raw = toNames(
          (selectedVariant as any).serialno_infos ||
          (selectedVariant as any).serial_numbers ||
          selectedVariant.availableSerials ||
          []
        );
      }
    } else {
      // No variant/batch – use product-level serials
      raw = toNames(
        (product as any).serialno_infos ||
        product.availableSerials ||
        []
      );
    }

    // Filter out serials already used elsewhere (but keep initially-selected ones when editing)
    const initialS = Array.isArray(initialSerials) ? initialSerials : [];
    const excludedS = Array.isArray(excludedSerials) ? excludedSerials : [];
    return raw.filter((s: string) => !excludedS.includes(s) || initialS.includes(s));
  }, [selectedVariant, selectedBatch, product, excludedSerials, initialSerials]);

  // Constrain quantity when variant, batch, or maxAllowedQuantity changes
  useEffect(() => {
    if (!isOpen || !product) return;
    let maxAllowed = 9999;
    if (isElectronics) {
      maxAllowed = availableSerials.length || 1;
    } else {
      if (selectedBatch) {
        maxAllowed = selectedBatch.stock ?? selectedBatch.stocks ?? 9999;
      } else if (selectedVariant && selectedVariant.id !== "default") {
        maxAllowed = selectedVariant.stock ?? 9999;
      } else {
        maxAllowed = product.stocks ?? 9999;
      }
    }
    if (maxAllowedQuantity !== undefined) {
      maxAllowed = Math.min(maxAllowed, maxAllowedQuantity);
    }
    setQuantity(prev => {
      let next = prev;
      if (next > maxAllowed) next = Math.max(1, maxAllowed);
      return next;
    });
  }, [selectedVariant, selectedBatch, availableSerials.length, isElectronics, product, maxAllowedQuantity, isOpen]);

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
        <div
          className="relative bg-white w-full max-w-md rounded-lg shadow-[0_24px_80px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden transform scale-100 animate-in fade-in zoom-in-95 duration-300 pointer-events-auto flex flex-col"
          style={{ display: "flex", flexDirection: "column", maxHeight: "80vh" }}
        >

          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-white relative shrink-0">
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
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${idx === stepIndex ? "w-8 bg-blue-500" : idx < stepIndex ? "w-4 bg-emerald-400" : "w-4 bg-slate-100"
                    }`} />
                  {idx < steps.length - 1 && <div className="w-1 h-1 rounded-full bg-slate-200" />}
                </React.Fragment>
              ))}
            </div>
          </div>          <div
            className="p-6 flex flex-col flex-1 min-h-0 overflow-hidden"
            style={{ maxHeight: "calc(80vh - 200px)" }}
          >

            {/* STEP: VARIANT */}
            {currentStep === "variant" && (
              <div className="flex flex-col flex-1 min-h-0 space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between shrink-0">
                  <p className="text-[11px] font-bold text-slate-400">Choose Variant</p>
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Required</span>
                </div>

                {/* Variant Search */}
                <div className="relative shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search variants..."
                    value={variantSearch}
                    onChange={(e) => setVariantSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 focus:bg-white focus:border-blue-300 transition-all outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar modal-content pr-0.5">
                  <div className="grid grid-cols-1 gap-2.5 pb-2">
                    {normalizedVariants
                      .filter(v => v.name.toLowerCase().includes(variantSearch.toLowerCase()))
                      .map((variant) => {
                        const isSelected = selectedVariant?.id === variant.id;
                        const isOutOfStock = (product as any).isStockTracked !== false && variant.stock === 0;

                        return (
                          <button
                            key={variant.id}
                            disabled={isOutOfStock}
                            onClick={() => {
                              setSelectedVariant(variant);
                              if (steps.length === 1) {
                                executeSubmit(variant, selectedBatch, selectedSerials, quantity);
                              } else {
                                setStepIndex(1);
                              }
                            }}
                            className={`group flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all duration-200 ${isOutOfStock ? "opacity-40 cursor-not-allowed border-slate-50 bg-slate-50/50" :
                                isSelected ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                              }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
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
                    {normalizedVariants.filter(v => v.name.toLowerCase().includes(variantSearch.toLowerCase())).length === 0 && (
                      <div className="py-8 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">No variants match "{variantSearch}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP: BATCH */}
            {currentStep === "batch" && (
              <div className="flex flex-col flex-1 min-h-0 space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between shrink-0">
                  <p className="text-[11px] font-bold text-slate-400">Choose Batch</p>
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Required</span>
                </div>

                {/* Batch Search */}
                <div className="relative shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search batches..."
                    value={variantSearch}
                    onChange={(e) => setVariantSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 focus:bg-white focus:border-blue-300 transition-all outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar modal-content pr-0.5">
                  <div className="grid grid-cols-1 gap-2.5 pb-2">
                    {batchesToSelect
                      .filter((b: any) => {
                        const name = b.name || b.batch_no || b.id;
                        return name.toLowerCase().includes(variantSearch.toLowerCase());
                      })
                      .map((batch: any) => {
                        const isSelected = selectedBatch?.id === batch.id;
                        const isOutOfStock = (product as any).isStockTracked !== false && (batch.stocks !== undefined ? batch.stocks : batch.stock) === 0;
                        const batchName = batch.batch_name || batch.name || batch.batch || (batch.batch_no ? `Batch: ${batch.batch_no}` : `Batch: ${batch.id.slice(0, 8)}`);
                        const batchStock = batch.stocks !== undefined ? batch.stocks : batch.stock;
                        const batchPrice = batch.sell_price || batch.price || product.price || 0;

                        return (
                          <button
                            key={batch.id}
                            disabled={isOutOfStock}
                            onClick={() => {
                              setSelectedBatch(batch);
                              if (currentStep === steps[steps.length - 1]) {
                                executeSubmit(selectedVariant, batch, selectedSerials, quantity);
                              } else {
                                const batchIdx = steps.indexOf("batch");
                                if (batchIdx < steps.length - 1) {
                                  setStepIndex(batchIdx + 1);
                                }
                              }
                            }}
                            className={`group flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all duration-200 ${isOutOfStock ? "opacity-40 cursor-not-allowed border-slate-50 bg-slate-50/50" :
                                isSelected ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                              }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
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
                                  <div className="flex items-center">
                                    <AntBadge variant="ps-completed" type="tag">
                                      Exp: {formatDate(batch.expiry_date || batch.expiryDate)}
                                    </AntBadge>
                                  </div>
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
              </div>
            )}

            {/* STEP: SERIALS */}
            {currentStep === "serial" && (
              <div className="flex flex-col flex-1 min-h-0 space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400">Quantity & Serials</p>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Enter Quantity</label>
                      <input
                        type="number"
                        min="1"
                        max={(() => {
                          const m = availableSerials.length || 1;
                          return maxAllowedQuantity !== undefined ? Math.min(maxAllowedQuantity, m) : m;
                        })()}
                        value={quantity}
                        onChange={(e) => {
                          let val = Math.max(1, Number(e.target.value));
                          const limit = maxAllowedQuantity !== undefined ? Math.min(maxAllowedQuantity, availableSerials.length || 1) : (availableSerials.length || 1);
                          val = Math.min(val, limit);
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
                            className={`group px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${isLocked
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

                <div className="flex flex-col flex-1 min-h-0 space-y-3">
                  <div className="flex items-center justify-between shrink-0">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Barcode size={14} /> Select {quantity} Serial{quantity !== 1 ? 's' : ''}
                    </p>
                    <AntBadge variant={selectedSerials.length === quantity ? "ps-completed" : "lb-brand"} type="pill">
                      {selectedSerials.length} / {quantity}
                    </AntBadge>
                  </div>

                  {/* Serial Search */}
                  <div className="relative shrink-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search serial numbers..."
                      value={serialSearch}
                      onChange={(e) => setSerialSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 focus:bg-white focus:border-blue-300 transition-all outline-none"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar modal-content pr-0.5">
                    {availableSerials.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 pb-2">
                        {availableSerials
                          .filter((s: string) => s.toLowerCase().includes(serialSearch.toLowerCase()))
                          .map((s: any) => {
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
                                key={typeof s === 'object' ? ((s as any).id || (s as any).name) : s}
                                disabled={isDisabled}
                                onClick={() => toggleSerial(s)}
                                className={`px-3 py-2.5 rounded-lg text-xs font-semibold border-2 transition-all duration-150 text-left relative overflow-hidden ${isSelected
                                    ? isDisabled && isInitial && quantity > (initialSerials?.length || 0)
                                      ? "border-slate-200 bg-slate-50 text-slate-400" // Locked style
                                      : "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                    : isDisabled
                                      ? "border-slate-50 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50"
                                      : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                                  }`}
                              >
                                <span className="truncate block pr-4">{typeof s === 'object' ? ((s as any).name || (s as any).id) : s}</span>
                                {isSelected && <Check size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDisabled && isInitial && quantity > (initialSerials?.length || 0) ? "text-slate-300" : "text-blue-500"
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
              </div>
            )}

            {/* STEP: SUMMARY */}
            {currentStep === "summary" && (
              <div className="flex flex-col flex-1 min-h-0 space-y-3 animate-in slide-in-from-right-4 duration-300">
                <p className="text-[11px] font-bold text-slate-400 shrink-0">Review Selection</p>

                <div className="flex-1 overflow-y-auto custom-scrollbar modal-content pr-0.5 space-y-3">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-0.5">Selected Variant</p>
                      <p className="text-sm font-bold text-slate-800">{selectedVariant?.name}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{fmt(selectedVariant?.price || 0)}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1">Quantity</p>
                      {isElectronics ? (
                        <p className="text-sm font-bold text-slate-800">{quantity} Units</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={(() => {
                              const m = selectedBatch?.stock ?? selectedBatch?.stocks ?? selectedVariant?.stock ?? product.stocks ?? 9999;
                              return maxAllowedQuantity !== undefined ? Math.min(maxAllowedQuantity, m) : m;
                            })()}
                            value={quantity}
                            onChange={(e) => {
                              let val = Math.max(1, Number(e.target.value));
                              const m = selectedBatch?.stock ?? selectedBatch?.stocks ?? selectedVariant?.stock ?? product.stocks ?? 9999;
                              const limit = maxAllowedQuantity !== undefined ? Math.min(maxAllowedQuantity, m) : m;
                              val = Math.min(val, limit);
                              setQuantity(val);
                            }}
                            className="w-16 px-2 py-1 text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-center"
                          />
                          <span className="text-xs font-bold text-slate-600">Units</span>
                        </div>
                      )}
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
                          {selectedBatch.batch_name || selectedBatch.name || selectedBatch.batch || (selectedBatch.batch_no ? `Batch: ${selectedBatch.batch_no}` : `Batch: ${selectedBatch.id.slice(0, 8)}`)}
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
                            <div className="flex items-center">
                              <AntBadge variant="ps-completed" type="tag">
                                Exp: {formatDate(selectedBatch.expiry_date || selectedBatch.expiryDate)}
                              </AntBadge>
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
          <div className="p-6 border-t border-slate-100 bg-white flex gap-3 shrink-0">
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
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white transition-all duration-300 ${canGoNext ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" : "bg-slate-200 cursor-not-allowed"
                  }`}
              >
                Continue
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                disabled={!canGoNext}
                onClick={() => {
                  executeSubmit(selectedVariant, selectedBatch, selectedSerials, quantity);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white transition-all duration-300 ${canGoNext
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  }`}
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

