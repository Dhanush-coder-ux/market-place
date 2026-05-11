import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, Barcode, CalendarDays } from "lucide-react";
import { InventoryItem, ProductVariant } from "../types";

interface ProductSelectionModalProps {
  isOpen: boolean;
  product: InventoryItem | null;
  onClose: () => void;
  onSuccess: (variant: ProductVariant, serials?: string[]) => void;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, product, onClose, onSuccess }) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && product) {
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(null);
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
      setSelectedSerials([]);
      setQuantity(1);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const isElectronics = product.category === "Electronics" || product.requireSerial;
  const availableSerials = selectedVariant?.availableSerials || product.availableSerials || [];
  
  const canProceed = selectedVariant && (!isElectronics || (selectedSerials.length === quantity && quantity > 0));

  const toggleSerial = (s: string) => {
    setSelectedSerials(prev => {
      if (prev.includes(s)) return prev.filter(x => x !== s);
      if (prev.length < quantity) return [...prev, s];
      return prev;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform scale-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{product.product_name}</h3>
            <p className="text-[11px] text-slate-400 font-medium">{product.product_barcode} • {product.category}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto pf-scroll">
          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Select Variant</p>
              <div className="grid grid-cols-2 gap-3">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isOutOfStock = variant.stock === 0;

                  return (
                    <button
                      key={variant.id}
                      disabled={isOutOfStock}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setSelectedSerials([]); // Reset serials when variant changes
                      }}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200 ${
                        isOutOfStock ? "opacity-50 cursor-not-allowed border-slate-100 bg-slate-50" :
                        isSelected ? "border-blue-300 bg-blue-50 ring-1 ring-blue-100" : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                        {variant.name}
                      </span>
                      <div className="flex items-center justify-between w-full mt-1">
                        <span className="text-xs font-medium text-slate-500">₹{variant.price}</span>
                        <span className={`text-[10px] font-bold ${isOutOfStock ? "text-red-400" : "text-emerald-500"}`}>
                          {isOutOfStock ? "Out of Stock" : `${variant.stock} in stock`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Serial Selection */}
          {isElectronics && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quantity to Bill</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={availableSerials.length || 1}
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value));
                      setQuantity(val);
                      setSelectedSerials([]); // Reset selection when quantity changes to avoid mismatch
                    }}
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition-all"
                  />
                  <span className="text-[11px] font-medium text-slate-400">
                    Max available: {availableSerials.length}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Barcode size={14} /> Select {quantity} Serial{quantity !== 1 ? 's' : ''}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                    selectedSerials.length === quantity ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {selectedSerials.length} / {quantity} Selected
                  </span>
                </div>
                
                {availableSerials.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSerials.map((s) => {
                      const isSelected = selectedSerials.includes(s);
                      const isDisabled = !isSelected && selectedSerials.length >= quantity;

                      return (
                        <button
                          key={s}
                          disabled={isDisabled}
                          onClick={() => toggleSerial(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                            isSelected 
                              ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm" 
                              : isDisabled
                                ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                          }`}
                        >
                          {isSelected && <CheckCircle2 size={10} className="inline mr-1 mb-0.5" />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
                    <AlertCircle size={16} />
                    <span className="text-xs font-medium">No serial numbers available.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Batch Tracking Info (Optional Display) */}
          {product.batchTracking && (selectedVariant || product).batchId && (
            <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <CalendarDays size={12} className="text-indigo-400" /> Batch Info
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Tracking Enabled</span>
                <span className="text-[10px] font-medium text-slate-400">ID: {(selectedVariant as any)?.batchId || product.batchId}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button
            disabled={!canProceed}
            onClick={() => selectedVariant && onSuccess(selectedVariant, selectedSerials)}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 ${
              canProceed ? "bg-blue-500 hover:bg-blue-600 shadow-sm shadow-blue-200" : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            Add to Bill
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductSelectionModal;