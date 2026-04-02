import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, Barcode } from "lucide-react";
import { InventoryItem, ProductVariant } from "../types";

interface ProductSelectionModalProps {
  isOpen: boolean;
  product: InventoryItem | null;
  onClose: () => void;
  onSuccess: (variant: ProductVariant, serial?: string) => void;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, product, onClose, onSuccess }) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [serial, setSerial] = useState("");
  const [serialStatus, setSerialStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedVariant(null);
      setSerial("");
      setSerialStatus("idle");
    }
  }, [isOpen]);

  // Simulate API fetch for serial number
  useEffect(() => {
    if (serial.length < 5) {
      setSerialStatus("idle");
      return;
    }
    
    setSerialStatus("loading");
    const timer = setTimeout(() => {
      // Mock API logic: Serial ends in '0' = invalid, otherwise valid
      if (serial.endsWith("0")) {
        setSerialStatus("error");
      } else {
        setSerialStatus("success");
        // Auto-select first variant if valid and none selected
        if (!selectedVariant && product?.variants.length) {
          setSelectedVariant(product.variants[0]);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [serial, product, selectedVariant]);

  if (!isOpen || !product) return null;

  const isElectronics = product.category === "Electronics" || product.requireSerial;
  const canProceed = selectedVariant && (!isElectronics || serialStatus === "success");

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

        <div className="p-5 space-y-6">
          {/* Variant Selection */}
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
                    onClick={() => setSelectedVariant(variant)}
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

          {/* Conditional Serial Input */}
          {isElectronics && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Barcode size={14} /> Serial Number (Required)
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Scan or enter serial number..."
                  value={serial}
                  onChange={(e) => setSerial(e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    serialStatus === "error" ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100" :
                    serialStatus === "success" ? "border-emerald-300 bg-emerald-50" :
                    "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  }`}
                />
                <div className="absolute right-3 top-2.5">
                  {serialStatus === "loading" && <Loader2 size={18} className="text-blue-400 animate-spin" />}
                  {serialStatus === "success" && <CheckCircle2 size={18} className="text-emerald-500" />}
                  {serialStatus === "error" && <AlertCircle size={18} className="text-red-500" />}
                </div>
              </div>
              {serialStatus === "error" && (
                <p className="text-[10px] text-red-500 mt-1.5 font-medium ml-1">Serial number not found or invalid.</p>
              )}
              {serialStatus === "success" && (
                <p className="text-[10px] text-emerald-600 mt-1.5 font-medium ml-1">Serial verified.</p>
              )}
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
            onClick={() => selectedVariant && onSuccess(selectedVariant, serial)}
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