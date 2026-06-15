import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Trash2, Package, Plus, RotateCcw, Minus, Search, Barcode } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { BillingItem, InventoryItem, ProductVariant } from "../types";
import ProductSelectionModal from "./ProductSelectionModel";
import { useToast } from "@/context/ToastContext";
import { inventoryApi } from "@/services/api/inventory";

interface BillingTableProps {
  items: BillingItem[];
  onItemsChange: (items: BillingItem[]) => void;
}

const getInitials = (name: string) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarBg = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 45%)`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
};

const formatINR = (amount: number, decimals = 2) =>
  amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// ─── Quantity Adjuster Component ──────────────────────────────────────────────
const QtyAdjuster = ({
  value,
  onChange,
  disabled,
  isEditable,
  max
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  isEditable: boolean;
  max?: number;
}) => {
  if (!isEditable) {
    return (
      <span className="text-[12px] font-bold text-slate-500 tabular-nums px-2.5 py-1 bg-slate-100/70 border border-slate-200/40 rounded-md">
        {value}
      </span>
    );
  }
  return (
    <div className={`inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white h-[32px] w-24 shrink-0 shadow-sm ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <button
        type="button"
        className="w-7 h-full flex items-center justify-center border-none bg-transparent cursor-pointer text-slate-400 hover:bg-slate-50 hover:text-slate-650 transition-colors active:scale-90"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus size={10} />
      </button>
      <input
        type="number"
        min="1"
        value={value || ""}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value)))}
        className="w-10 bg-transparent text-center outline-none text-[12px] font-bold text-slate-700 tabular-nums border-x border-slate-100 h-full p-0 flex items-center justify-center"
      />
      <button
        type="button"
        className="w-7 h-full flex items-center justify-center border-none bg-transparent cursor-pointer text-slate-400 hover:bg-slate-50 hover:text-slate-650 transition-colors active:scale-90"
        onClick={() => onChange(value + 1)}
        disabled={typeof max === 'number' && value >= max}
      >
        <Plus size={10} />
      </button>
    </div>
  );
};

// ─── Main BillingTable Component ──────────────────────────────────────────────
const BillingTable: React.FC<BillingTableProps> = ({ items, onItemsChange }) => {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<InventoryItem | null>(null);

  // Global search bar state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch inventory callback
  // Fetch inventory callback via the search route
  const fetchInventory = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const data = await inventoryApi.searchInventories(q, true);
      const mapped = data.map((p: any) => ({
        ...p,
        product_name: p.name || "Unknown Product",
        product_barcode: p.barcode || "N/A",
        category: p.category || "Other",
        displayName: `${p.name || "Unknown"} • ${p.category || 'Other'}`,
        barcodeDisplay: p.barcode || 'N/A',
        price: p.sell_price || 0,
        stocks: p.stocks || 0,
        gst: parseInt(String(p.gst || p.datas?.gst || "18").replace("%", ""))
      }));
      setSearchResults(mapped);
      setActiveIndex(0);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Product Selection handler
  const handleProductSelect = useCallback(async (selectedProduct: any) => {
    if (!selectedProduct) return;

    setLoading(true);
    try {
      // Fetch full product details
      const response = await inventoryApi.getInventoryById(selectedProduct.id);
      const fullProduct = response?.data || response;
      
      if (!fullProduct || !fullProduct.id) {
        showToast("Failed to fetch full product details", "error");
        return;
      }

      // Map variants the same way ProductSelectionModal expects
      let rawVariants: any[] = [];
      const candidateSources = [
        fullProduct.variants,
        fullProduct.varients,
        fullProduct.combinations,
        fullProduct.datas?.variants,
        fullProduct.datas?.varients,
        fullProduct.datas?.combinations
      ].filter(arr => Array.isArray(arr) && arr.length > 0);

      if (candidateSources.length > 0) {
        rawVariants = candidateSources.reduce((max, current) => current.length > max.length ? current : max, candidateSources[0]);
      }

      let mappedVariants = rawVariants.map((v: any) => {
        const combDatas = v.datas || {};
        const attributes = v.attributes || combDatas.attributes || combDatas.datas?.attributes || {};
        let variantLabel = v.name || combDatas.name;
        if (attributes && Object.keys(attributes).length > 0) {
          variantLabel = Object.values(attributes).join(' / ');
        } else if (v.barcode && v.barcode !== combDatas.barcode) {
          variantLabel = v.barcode;
        }
        if (!variantLabel) {
          variantLabel = "Standard Variant";
        }
        return {
          ...v,
          id: v.id || String(Math.random()),
          name: variantLabel,
          price: v.sell_price || v.price || combDatas.sell_price || combDatas.price || fullProduct.sell_price || 0,
          stock: v.stocks !== undefined ? v.stocks : (v.stock !== undefined ? v.stock : (combDatas.stocks !== undefined ? combDatas.stocks : 0)),
          serialnoId: v.serial_numbers?.id || v.serial_number?.id || v.batches?.[0]?.serial_numbers?.id || combDatas.serial_numbers?.id || fullProduct.serial_number?.id || fullProduct.serials?.id,
          availableSerials: v.serial_numbers?.serial_numbers || v.serial_number?.serial_numbers || v.batches?.[0]?.serial_numbers?.serial_numbers || combDatas.serial_numbers?.serial_numbers || fullProduct.serial_number?.serial_numbers || fullProduct.serials?.serial_numbers || [],
          batchId: v.batches?.[0]?.id || v.batchId || combDatas.batches?.[0]?.id,
        };
      });

      if (mappedVariants.length === 0 && fullProduct.has_batch && Array.isArray(fullProduct.batches) && fullProduct.batches.length > 0) {
        mappedVariants = fullProduct.batches.map((b: any) => ({
          id: b.id,
          name: `Batch: ${b.batch_no || b.id.slice(0, 8)}`,
          price: b.sell_price || fullProduct.sell_price || 0,
          stock: b.stocks || 0,
          serialnoId: b.serial_numbers?.id || fullProduct.serial_number?.id || fullProduct.serials?.id,
          availableSerials: b.serial_numbers?.serial_numbers || fullProduct.serial_number?.serial_numbers || fullProduct.serials?.serial_numbers || [],
          batchId: b.id,
          expiryDate: b.expiry_date,
          manufacturingDate: b.manufacturing_date,
        }));
      }

      const pMapped = {
        ...fullProduct,
        product_name: fullProduct.name || "Unknown Product",
        product_barcode: fullProduct.barcode || "N/A",
        category: fullProduct.category || "Other",
        variants: mappedVariants,
        requireSerial: fullProduct.has_serialno || false,
        batchTracking: fullProduct.has_batch || false,
        manufacturingDate: fullProduct.batches?.[0]?.manufacturing_date,
        expiryDate: fullProduct.batches?.[0]?.expiry_date,
        price: fullProduct.sell_price || 0,
        stocks: fullProduct.stocks || 0,
        serialnoId: fullProduct.serial_number?.id || fullProduct.serials?.id || fullProduct.batches?.[0]?.serial_numbers?.id,
        availableSerials: fullProduct.serial_number?.serial_numbers || fullProduct.serials?.serial_numbers || fullProduct.batches?.[0]?.serial_numbers?.serial_numbers || [],
        batchId: fullProduct.batches?.[0]?.id,
        gst: parseInt(String(fullProduct.gst || fullProduct.datas?.gst || "18").replace("%", ""))
      };

      const hasVariants = pMapped.variants && pMapped.variants.length > 0;
      const requiresSerial = pMapped.requireSerial;
      const hasBatches = pMapped.batchTracking;

      // Simple product: add directly
      if (!requiresSerial && !hasVariants && !hasBatches) {
        const defaultVariant: ProductVariant = {
          id: "default",
          name: "Standard",
          price: pMapped.price || 0,
          stock: pMapped.stocks || 0,
          serialnoId: pMapped.serialnoId,
          batchId: pMapped.batchId,
          availableSerials: pMapped.availableSerials,
        };

        const existingIndex = items.findIndex((item) =>
          item.inventoryId === pMapped.id &&
          !item.variantId &&
          item.batchId === pMapped.batchId
        );

        let updatedItems: BillingItem[];

        if (existingIndex !== -1) {
          updatedItems = items.map((item, idx) => {
            if (idx === existingIndex) {
              let newQty = item.qty + 1;
              if (typeof item.maxStock === 'number') {
                newQty = Math.min(newQty, item.maxStock);
              }
              return { ...item, qty: newQty, tprice: newQty * item.price };
            }
            return item;
          });
        } else {
          updatedItems = [
            ...items,
            {
              id: uuidv4(),
              inventoryId: pMapped.id,
              code: pMapped.product_barcode,
              name: pMapped.product_name,
              price: defaultVariant.price,
              qty: 1,
              tprice: defaultVariant.price,
              variantId: null,
              batchId: pMapped.batchId,
              serialnoId: pMapped.serialnoId,
              requireSerial: false,
              batchTracking: pMapped.batchTracking,
              manufacturingDate: pMapped.manufacturingDate,
              expiryDate: pMapped.expiryDate,
              maxStock: defaultVariant.stock,
              gst: pMapped.gst,
              _product: pMapped,
            }
          ];
        }
        onItemsChange(updatedItems);
        setSearchQuery("");
        setDropdownOpen(false);
      } else {
        // Has variants / batch / serials -> open modal
        setPendingProduct(pMapped);
        setModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch full product details:", err);
      showToast("Failed to fetch product details", "error");
    } finally {
      setLoading(false);
    }
  }, [items, onItemsChange, showToast]);

  // Instant scanner lookup trigger
  const triggerInstantLookup = useCallback(async (query: string) => {
    if (!query) return;
    setLoading(true);
    try {
      const data = await inventoryApi.searchInventories(query, true);
      if (data && data.length > 0) {
        // Find exact barcode match or default to first result
        const matchedProduct = data.find(
          (p: any) => p.barcode === query || p.name === query
        ) || data[0];

        handleProductSelect(matchedProduct);
      } else {
        showToast("Product not found for scanned barcode", "error");
      }
    } catch (err) {
      console.error("Scanner lookup failed:", err);
    } finally {
      setLoading(false);
    }
  }, [handleProductSelect, showToast]);

  // Debounced query trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchInventory(searchQuery);
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, fetchInventory]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hotkey support: '/' focuses the search bar & Global Barcode Scanner Listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Hotkey support: '/' focuses the search bar
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setDropdownOpen(true);
        return;
      }

      // 2. Barcode scanner detection
      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Scanners type extremely fast (less than 35ms between characters)
      if (diff < 35) {
        if (e.key !== "Enter") {
          if (e.key.length === 1) {
            buffer += e.key;
          }
        } else {
          // Scanner finished typing and sent Enter!
          if (buffer.length > 2) {
            e.preventDefault();
            const scannedBarcode = buffer.trim();
            buffer = ""; // Clear buffer
            
            setSearchQuery(scannedBarcode);
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
            triggerInstantLookup(scannedBarcode);
          }
        }
      } else {
        // Normal typing, reset buffer
        if (e.key.length === 1) {
          buffer = e.key;
        } else {
          buffer = "";
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [triggerInstantLookup]);

  // Keyboard navigation for dropdown results & Instant Barcode Scan Enter handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      // Check if current searchResults has an exact match for the barcode
      const exactMatch = searchResults.find(
        (p) => p.product_barcode === query || p.barcodeDisplay === query || p.barcode === query
      );

      if (exactMatch) {
        handleProductSelect(exactMatch);
        return;
      }

      // Perform immediate scanner lookup
      triggerInstantLookup(query);
      return;
    }

    if (!dropdownOpen || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };



  const handleModalSuccess = (variant: ProductVariant, quantity: number, serials?: string[]) => {
    if (!pendingProduct) return;

    if (serials && serials.length > 0) {
      const alreadyAdded = serials.find(s => items.some(item => item.serialNumbers?.includes(s)));
      if (alreadyAdded) {
        alert(`Serial number ${alreadyAdded} has already been added to the bill.`);
        return;
      }
    }

    const existingIndex = items.findIndex((item) =>
      item.inventoryId === pendingProduct.id &&
      item.variantId === (variant.id === "default" ? null : variant.id) &&
      item.batchId === (variant.batchId || pendingProduct.batchId)
    );

    let updatedItems: BillingItem[];

    if (existingIndex !== -1) {
      updatedItems = items.map((item, idx) => {
        if (idx === existingIndex) {
          let newQty = item.qty + quantity;
          if (typeof item.maxStock === 'number') {
            newQty = Math.min(newQty, item.maxStock);
          }
          const newSerials = serials ? [...(item.serialNumbers || []), ...serials] : item.serialNumbers;
          return {
            ...item,
            qty: newQty,
            serialNumbers: newSerials,
            tprice: newQty * item.price
          };
        }
        return item;
      });
    } else {
      updatedItems = [
        ...items,
        {
          id: uuidv4(),
          inventoryId: pendingProduct.id,
          code: pendingProduct.product_barcode,
          name: variant.id === "default" ? pendingProduct.product_name : `${pendingProduct.product_name} - ${variant.name}`,
          price: variant.price,
          qty: quantity,
          tprice: quantity * variant.price,
          serialNumbers: serials,
          variantId: variant.id === "default" ? null : variant.id,
          batchId: variant.batchId || pendingProduct.batchId,
          serialnoId: variant.serialnoId || pendingProduct.serialnoId,
          requireSerial: pendingProduct.requireSerial,
          batchTracking: pendingProduct.batchTracking,
          manufacturingDate: variant.manufacturingDate || pendingProduct.manufacturingDate,
          expiryDate: variant.expiryDate || pendingProduct.expiryDate,
          maxStock: variant.stock,
          gst: pendingProduct.gst,
          _product: pendingProduct,
        }
      ];
    }

    onItemsChange(updatedItems);
    setModalOpen(false);
    setPendingProduct(null);
    setSearchQuery("");
    setDropdownOpen(false);
  };

  const handleQtyChange = useCallback((id: string, qty: number) => {
    onItemsChange(items.map(item => {
      if (item.id !== id) return item;
      let newQty = Math.max(0, Number(qty.toFixed(2)));
      if (typeof item.maxStock === 'number') {
        newQty = Math.min(newQty, item.maxStock);
      }
      return {
        ...item,
        qty: newQty,
        tprice: newQty * item.price
      };
    }));
  }, [items, onItemsChange]);

  const handleClearAll = useCallback(() => {
    if (confirm("Are you sure you want to clear all items?")) {
      onItemsChange([]);
    }
  }, [onItemsChange]);

  const handleDeleteRow = useCallback((id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
  }, [items, onItemsChange]);

  const totalQty = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  const filledRows = useMemo(() => items.filter((i) => i.name).length, [items]);

  return (
    <div className="w-full h-full flex flex-col min-h-0 font-sans gap-4 relative">
      
      {/* Global Product Search Section */}
      <div ref={dropdownRef} className="relative w-full shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => {
                setDropdownOpen(true);
                fetchInventory(searchQuery);
              }}
              onChange={e => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Scan a barcode, or type a product name..."
              className="w-full h-[46px] pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
            />
          </div>
          
          {/* Barcode Scanner Symbol */}
          <button 
            type="button"
            onClick={() => {
              searchInputRef.current?.focus();
              setDropdownOpen(true);
            }}
            title="Focus Barcode Scanner (Press / to focus)"
            className="flex items-center justify-center w-12 h-[46px] bg-blue-50/50 text-blue-500 border border-blue-150 rounded-xl shrink-0 shadow-sm hover:bg-blue-100/50 active:scale-95 transition-all cursor-pointer"
          >
            <Barcode size={20} className="stroke-[1.8]" />
          </button>
        </div>

        {/* Custom floating search results dropdown */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
            {loading && searchResults.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                Searching inventory...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic font-semibold">
                No matching products found.
              </div>
            ) : (
              searchResults.map((product, idx) => {
                const isHighlighted = idx === activeIndex;
                const initials = getInitials(product.product_name);
                const avatarBg = getAvatarBg(product.product_name);
                const isOutOfStock = product.stocks === 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center justify-between p-3.5 cursor-pointer transition-all duration-100 ${
                      isHighlighted ? "bg-blue-50/50" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div 
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-sm overflow-hidden"
                        style={{ backgroundColor: avatarBg }}
                      >
                        {(product.images && product.images.length > 0) || (product.datas?.images && product.datas.images.length > 0) ? (
                          <img src={product.images?.[0] || product.datas?.images?.[0]} alt={product.product_name} className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-slate-800 truncate leading-none">{product.product_name}</p>
                          {product.gst && (
                            <span className="text-[8px] font-extrabold text-blue-500 bg-blue-50 px-1 py-0.2 rounded border border-blue-100">
                              GST {product.gst}%
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">
                          Barcode: {product.product_barcode} · {product.category}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold text-slate-800">₹{product.price}</p>
                      <p className={`text-[9px] font-extrabold mt-1 leading-none ${isOutOfStock ? "text-red-500" : "text-emerald-500"}`}>
                        {isOutOfStock ? "Out of Stock" : `Stock: ${product.stocks} units`}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bill Items List Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        
        {/* Header section of the bill list */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            THIS BILL · {filledRows} ITEM{filledRows !== 1 ? 'S' : ''} · {totalQty} UNIT{totalQty !== 1 ? 'S' : ''}
          </p>
          {items.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all text-[11px] font-bold uppercase tracking-wider"
            >
              <RotateCcw size={12} strokeWidth={2.5} /> Clear all
            </button>
          )}
        </div>

        {/* Vertical Stack of Item Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar min-h-[220px]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4 animate-pulse shadow-inner">
                <Package size={28} />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Empty Bill List</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-[280px] leading-relaxed">
                Scan a barcode, or use the product search bar at the top to start adding items to this bill.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const [baseName, variantName] = item.name.split(' - ');
              const isQtyEditable = !item.requireSerial;

              return (
                <div 
                  key={item.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-150 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/2 shadow-sm transition-all duration-200 gap-4"
                >
                  {/* Left Side: Avatar & Details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[12px] font-black shrink-0 shadow-sm overflow-hidden"
                      style={{ backgroundColor: getAvatarBg(item.name) }}
                    >
                      {(item._product?.images && item._product.images.length > 0) || (item._product?.datas?.images && item._product.datas.images.length > 0) ? (
                        <img src={item._product?.images?.[0] || item._product?.datas?.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(item.name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-bold text-slate-800 truncate leading-snug">{baseName}</p>
                        {variantName && (
                          <span className="text-[8px] font-extrabold text-indigo-650 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 uppercase tracking-wide leading-none">
                            {variantName}
                          </span>
                        )}
                        {item.gst !== undefined && (
                          <span className="text-[8px] font-extrabold text-blue-650 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 uppercase tracking-wide leading-none">
                            GST {item.gst}%
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {item.code && (
                          <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded leading-none">
                            {item.code}
                          </span>
                        )}
                        {item.batchTracking && item.expiryDate && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded leading-none">
                            EXP: {formatDate(item.expiryDate)}
                          </span>
                        )}
                      </div>

                      {/* Serial list display */}
                      {item.serialNumbers && item.serialNumbers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.serialNumbers.map((s, idx) => (
                            <span key={idx} className="text-[9px] font-bold text-blue-650 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                              SN: {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Quantity Adjuster, Price, Total, Trash Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                    
                    {/* Quantity Adjustment Controls */}
                    <QtyAdjuster
                      value={item.qty}
                      onChange={(qty) => handleQtyChange(item.id, qty)}
                      disabled={!isQtyEditable}
                      isEditable={isQtyEditable}
                      max={item.maxStock}
                    />

                    {/* Unit Price Display */}
                    <div className="text-right w-16">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Price</span>
                      <span className="text-[12px] font-bold text-slate-650 tabular-nums">
                        ₹{item.price}
                      </span>
                    </div>

                    {/* Total Price Display */}
                    <div className="text-right w-24">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Total</span>
                      <span className="text-[13px] font-black text-slate-800 tabular-nums">
                        ₹{formatINR(item.tprice)}
                      </span>
                    </div>

                    {/* Trash / Delete Item Button */}
                    <button
                      onClick={() => handleDeleteRow(item.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-350 hover:text-red-500 hover:bg-red-50/65 transition-all duration-150 active:scale-90 shrink-0"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={modalOpen}
        product={pendingProduct}
        onClose={() => {
          setModalOpen(false);
          setPendingProduct(null);
        }}
        onSuccess={handleModalSuccess}
        excludedSerials={items.flatMap(i => i.serialNumbers || [])}
      />
    </div>
  );
};

export default BillingTable;
