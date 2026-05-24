import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Trash2, IndianRupee, Package, Barcode,
  Plus, RotateCcw, Minus, ScanBarcode
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { BillingItem, InventoryItem, ProductVariant } from "../types";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import ProductSelectionModal from "../components/ProductSelectionModel";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingTableProps {
  items: BillingItem[];
  onItemsChange: (items: BillingItem[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const createEmptyRow = (): BillingItem => ({
  id: uuidv4(),
  code: "",
  name: "",
  qty: 0,
  price: 0,
  tprice: 0,
});

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
};

// ─── Reusable UI Subcomponents ────────────────────────────────────────────────






const QtyAdjuster = ({
  value,
  onChange,
  disabled,
  isEditable
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  isEditable: boolean;
}) => {
  if (!isEditable) {
    return (
      <span className="text-[12px] font-bold text-slate-500 tabular-nums px-2.5 py-1 bg-slate-100/70 border border-slate-200/40 rounded-md">
        {value}
      </span>
    );
  }
  return (
    <div className={`inline-flex items-center border border-slate-250 rounded-lg overflow-hidden bg-white h-[32px] w-24 shrink-0 shadow-sm ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <button
        type="button"
        className="w-7 h-full flex items-center justify-center border-none bg-transparent cursor-pointer text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors active:scale-90"
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
        className="w-7 h-full flex items-center justify-center border-none bg-transparent cursor-pointer text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors active:scale-90"
        onClick={() => onChange(value + 1)}
      >
        <Plus size={10} />
      </button>
    </div>
  );
};

const BillingRow = React.memo(({
  item, index, isLast, hasSerial,
  handleProductSelectClick, handleDeleteRow, fetchInventory, onQtyChange
}: {
  item: BillingItem;
  index: number;
  isLast: boolean;
  hasSerial: boolean;
  handleProductSelectClick: any;
  handleDeleteRow: (id: string) => void;
  fetchInventory: (q: string, signal: AbortSignal) => Promise<any[]>;
  onQtyChange: (id: string, qty: number) => void;
}) => {
  const isFilled = !!item.name;
  const [baseName, variantName] = item.name ? item.name.split(' - ') : ["", ""];

  // A "Simple" product has no serial tracking, no batch tracking, and no variant.
  const isQtyEditable = !item.requireSerial && isFilled;

  return (
    <tr className={`group/row transition-colors duration-150 ${isFilled ? "hover:bg-blue-50/10" : "hover:bg-slate-50/30"
      } ${index % 2 === 0 ? "" : "bg-slate-50/15"}`}>
      {/* Row Index */}
      <td className={`hidden sm:table-cell pl-4 pr-2 py-3 align-middle ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-slate-400">
          {index + 1}
        </div>
      </td>

      {/* Product Details */}
      <td className={`px-3 py-3 min-w-[320px] align-middle ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <div className="w-full max-w-lg">
          {isFilled ? (
            <div className="flex items-center gap-3 py-1">
              <div className="w-9 h-9 rounded-lg bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                <Package size={15} className="text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-bold text-slate-800 truncate">{baseName}</p>
                  {variantName && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50/60 border border-indigo-100/60 px-1.5 py-0.5 rounded">
                      {variantName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {item.code && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                      {item.code}
                    </span>
                  )}
                  {item.batchTracking && item.expiryDate && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                      EXP: {formatDate(item.expiryDate)}
                    </span>
                  )}
                </div>
                {hasSerial && item.serialNumbers && item.serialNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.serialNumbers.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[9px] font-medium text-blue-650 bg-blue-50/80 border border-blue-100/60 px-1.5 py-0.5 rounded">
                        <Barcode size={8} className="text-blue-400" />
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Options Button visible on hover */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleProductSelectClick((item as any)._product, item.id); }}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-100 px-2.5 py-1 rounded-md transition-all opacity-0 group-hover/row:opacity-100 active:scale-95 shadow-sm"
              >
                Options
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-[20%] shrink-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-semibold text-slate-400 ml-0.5">Barcode</span>
                  <div className="h-[38px] px-2.5 flex items-center rounded-lg border border-slate-200/60 bg-slate-50/40 text-[12px] font-normal text-slate-400 truncate">
                    —
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-semibold text-slate-400 ml-0.5">Search Product</span>
                  <SearchSelect
                    fetchOptions={fetchInventory}
                    value=""
                    placeholder="Search product..."
                    labelKey="displayName"
                    valueKey="displayName"
                    onChange={(_, opt: any) => handleProductSelectClick(opt, item.id)}
                    className="h-[38px] shadow-none border-slate-200/60 focus:border-blue-300 rounded-lg text-[13px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </td>

      {/* Quantity */}
      <td className={`px-2 py-3 align-middle text-right ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <div className="flex items-center justify-end">
          <QtyAdjuster
            value={item.qty}
            onChange={(qty) => onQtyChange(item.id, qty)}
            disabled={!isQtyEditable}
            isEditable={isQtyEditable}
          />
        </div>
      </td>

      {/* Unit Price */}
      <td className={`px-2 py-3 align-middle text-right ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <div className="h-[38px] flex items-center justify-end gap-0.5 px-1">
          <IndianRupee size={11} strokeWidth={2} className="text-slate-400" />
          <span className="text-[13px] font-normal text-slate-600 tabular-nums">
            {item.price > 0 ? item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
          </span>
        </div>
      </td>

      {/* Total */}
      <td className={`px-3 py-3 align-middle text-right ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <div className="flex flex-col items-end">
          <div className={`h-[38px] flex items-center justify-end gap-0.5 font-medium text-[14px] tabular-nums tracking-tight ${item.tprice > 0 ? "text-slate-800" : "text-slate-300"}`}>
            <IndianRupee size={12} strokeWidth={2} className={item.tprice > 0 ? "text-slate-650" : "text-slate-300"} />
            {item.tprice > 0 ? item.tprice.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
          </div>
          {item.qty > 1 && item.price > 0 && (
            <span className="text-[9px] text-slate-400 font-normal mt-0.5 tabular-nums">
              {item.price.toLocaleString("en-IN")} × {item.qty}
            </span>
          )}
        </div>
      </td>

      {/* Delete */}
      <td className={`px-2 py-3 align-middle text-center ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <button
          onClick={() => handleDeleteRow(item.id)}
          className="w-7 h-7 rounded-md flex items-center justify-center mx-auto text-slate-350 hover:text-red-500 hover:bg-red-50/60 transition-all duration-150 active:scale-95"
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      </td>
    </tr>
  );
});

// ─── Component ────────────────────────────────────────────────────────────────

const BillingTable: React.FC<BillingTableProps> = ({ items, onItemsChange }) => {
  const { getData } = useApi();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<InventoryItem | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const fetchInventory = useCallback(async (q: string, signal: AbortSignal) => {

    try {
      const res = await getData(ENDPOINTS.INVENTORIES, { limit: "10", offset: "1", q, shop_id: SHOP_ID, is_active: "true" }, { signal });
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      return data.map((p: any) => ({
        ...p,
        // Map backend fields based on provided JSON structure
        product_name: p.name || "Unknown Product",
        product_barcode: p.barcode || "N/A",
        category: p.category || "Other",
        displayName: `${p.name || "Unknown"} • ${p.category || 'Other'}`,
        barcodeDisplay: p.barcode || 'N/A',
        variants: (p.variants || []).map((v: any) => ({
          ...v,
          price: v.sell_price || 0,
          stock: v.stocks || 0,
          serialnoId: v.serial_numbers?.id || v.serial_number?.id || v.batches?.[0]?.serial_numbers?.id,
          availableSerials: v.serial_numbers?.serial_numbers || v.serial_number?.serial_numbers || v.batches?.[0]?.serial_numbers?.serial_numbers || [],
          batchId: v.batches?.[0]?.id,
        })),
        requireSerial: p.has_serialno || false,
        batchTracking: p.has_batch || false,
        manufacturingDate: p.batches?.[0]?.manufacturing_date,
        expiryDate: p.batches?.[0]?.expiry_date,
        price: p.sell_price || 0,
        stocks: p.stocks || 0,
        serialnoId: p.serial_number?.id || p.batches?.[0]?.serial_numbers?.id,
        availableSerials: p.serial_number?.serial_numbers || p.batches?.[0]?.serial_numbers?.serial_numbers || [],
        batchId: p.batches?.[0]?.id,
      }));
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      return [];
    }
  }, [getData]);

  // ── Row mutations ───────────────────────────────────────────────────────────

  const handleQtyChange = useCallback((id: string, qty: number) => {
    onItemsChange(items.map(item => {
      if (item.id !== id) return item;
      const newQty = Math.max(0, Number(qty.toFixed(2)));
      return {
        ...item,
        qty: newQty,
        tprice: newQty * item.price
      };
    }));
  }, [items, onItemsChange]);

  const handleAddRow = useCallback(() => {
    onItemsChange([...items, createEmptyRow()]);
  }, [items, onItemsChange]);

  const handleClearAll = useCallback(() => {
    if (confirm("Are you sure you want to clear all items?")) {
      onItemsChange([createEmptyRow()]);
    }
  }, [onItemsChange]);

  const handleDeleteLastRow = useCallback(() => {
    onItemsChange(items.length === 1 ? [createEmptyRow()] : items.slice(0, -1));
  }, [items, onItemsChange]);

  const handleDeleteRow = useCallback((id: string) => {
    onItemsChange(items.length === 1 ? [createEmptyRow()] : items.filter((item) => item.id !== id));
  }, [items, onItemsChange]);

  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // ── Modal Handlers ────────────────────────────────────────────────────────

  const handleProductSelectClick = (selectedProduct: any, rowId: string) => {
    if (!selectedProduct) return;

    const hasVariants = selectedProduct.variants && selectedProduct.variants.length > 0;
    const requiresSerial = selectedProduct.requireSerial;

    // Simple product: no serial tracking, no variants → add directly without modal
    if (!requiresSerial && !hasVariants) {
      const defaultVariant: ProductVariant = {
        id: "default",
        name: "Standard",
        price: selectedProduct.price || 0,
        stock: selectedProduct.stocks || 0,
        serialnoId: selectedProduct.serialnoId,
        batchId: selectedProduct.batchId,
        availableSerials: selectedProduct.availableSerials,
      };

      // Check if this product is already in the bill (for merging)
      const existingItemIndex = items.findIndex((item) =>
        item.id !== rowId &&
        item.inventoryId === selectedProduct.id &&
        !item.variantId &&
        item.batchId === (selectedProduct.batchId)
      );

      let updatedItems: BillingItem[];

      if (existingItemIndex !== -1) {
        // Merge: increment qty on existing row
        updatedItems = items.map((item, idx) => {
          if (idx === existingItemIndex) {
            const newQty = item.qty + 1;
            return { ...item, qty: newQty, tprice: newQty * item.price };
          }
          return item;
        });
        // Remove the empty row that triggered the search
        updatedItems = updatedItems.filter(item => item.id !== rowId);
        if (!updatedItems.some(item => !item.name)) {
          updatedItems.push(createEmptyRow());
        }
      } else {
        // Fill the current row directly
        updatedItems = items.map((item) => {
          if (item.id !== rowId) return item;
          return {
            ...item,
            inventoryId: selectedProduct.id,
            code: selectedProduct.product_barcode,
            name: selectedProduct.product_name,
            price: defaultVariant.price,
            qty: 1,
            tprice: defaultVariant.price,
            variantId: null,
            batchId: selectedProduct.batchId,
            serialnoId: selectedProduct.serialnoId,
            requireSerial: false,
            batchTracking: selectedProduct.batchTracking,
            manufacturingDate: selectedProduct.manufacturingDate,
            expiryDate: selectedProduct.expiryDate,
            _product: selectedProduct,
          };
        });
        // Add a new empty row at the bottom
        if (rowId === items[items.length - 1].id) {
          updatedItems.push(createEmptyRow());
        }
      }

      onItemsChange(updatedItems);
      return; // Done — no modal needed
    }

    // Has variants or serial tracking → open the modal
    setPendingProduct(selectedProduct);
    setActiveRowId(rowId);
    setModalOpen(true);
  };

  const handleModalSuccess = (variant: ProductVariant, quantity: number, serials?: string[]) => {
    if (!activeRowId || !pendingProduct) return;

    if (serials && serials.length > 0) {
      const alreadyAdded = serials.find(s => items.some(item => item.id !== activeRowId && item.serialNumbers?.includes(s)));
      if (alreadyAdded) {
        alert(`Serial number ${alreadyAdded} has already been added to the bill.`);
        return;
      }
    }

    const existingItemIndex = items.findIndex((item) =>
      item.id !== activeRowId &&
      item.inventoryId === pendingProduct.id &&
      item.variantId === (variant.id === "default" ? null : variant.id) &&
      item.batchId === (variant.batchId || pendingProduct.batchId)
    );

    let updatedItems: BillingItem[];

    if (existingItemIndex !== -1) {
      // Merge logic
      updatedItems = items.map((item, idx) => {
        if (idx === existingItemIndex) {
          const newQty = item.qty + quantity;
          const newSerials = serials ? [...(item.serialNumbers || []), ...serials] : item.serialNumbers;
          const merged = {
            ...item,
            qty: newQty,
            serialNumbers: newSerials,
          };
          return { ...merged, tprice: (merged.qty || 0) * (merged.price || 0) };
        }
        return item;
      });

      // Remove the active row if it was just a temporary/empty row or if it's being merged away
      updatedItems = updatedItems.filter(item => item.id !== activeRowId);

      // Ensure there's always one empty row at the bottom if we removed one
      if (!updatedItems.some(item => !item.name)) {
        updatedItems.push(createEmptyRow());
      }
    } else {
      // Standard update logic
      updatedItems = items.map((item) => {
        if (item.id !== activeRowId) return item;
        const merged = {
          ...item,
          inventoryId: pendingProduct.id,
          code: pendingProduct.product_barcode,
          name: variant.id === "default" ? pendingProduct.product_name : `${pendingProduct.product_name} - ${variant.name}`,
          price: variant.price,
          qty: quantity,
          serialNumbers: serials,
          variantId: variant.id === "default" ? null : variant.id,
          batchId: variant.batchId || pendingProduct.batchId,
          serialnoId: variant.serialnoId || pendingProduct.serialnoId,
          requireSerial: pendingProduct.requireSerial,
          batchTracking: pendingProduct.batchTracking,
          manufacturingDate: pendingProduct.manufacturingDate,
          expiryDate: pendingProduct.expiryDate,
          _product: pendingProduct, // Store source for later edits
        };
        return { ...merged, tprice: (merged.qty || 0) * (merged.price || 0) };
      });

      if (activeRowId === items[items.length - 1].id) {
        updatedItems.push(createEmptyRow());
      }
    }

    onItemsChange(updatedItems);

    setModalOpen(false);
    setPendingProduct(null);
    setActiveRowId(null);
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleAddRow();
      }
      if (e.altKey && (e.key === "Backspace" || e.key === "Delete")) {
        e.preventDefault();
        handleDeleteLastRow();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleAddRow, handleDeleteLastRow]);

  // ── Derived values ────────────────────────────────────────────────────────

  const totalQty = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  const filledRows = useMemo(() => items.filter((i) => i.name).length, [items]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full flex flex-col min-h-0 font-sans">
      <div className="bg-white rounded-lg border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col flex-1 min-h-0">

        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-slate-100/60 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100/60 flex items-center justify-center">
              <Package size={15} strokeWidth={1.5} className="text-slate-500" />
            </div>
            <div>
              <h2 className="text-[14px] text-slate-700 font-medium leading-tight">Line Items</h2>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                {filledRows} item{filledRows !== 1 ? "s" : ""} · {totalQty} units
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3 sm:mt-0">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all duration-150 shadow-sm mr-2">
              <ScanBarcode size={14} strokeWidth={2} /> 
              <span>Scan Product</span>
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] font-normal text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all duration-150"
            >
              <RotateCcw size={12} />
              Clear
            </button>
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-blue-600 bg-blue-50/60 hover:bg-blue-50 transition-all duration-150"
            >
              <Plus size={13} />
              Add Row
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 pf-scroll">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm shadow-sm">
              <tr>
                {["#", "Product Details", "Qty", "Price", "Total", ""].map((h, i) => (
                  <th
                    key={h + i}
                    className={`px-4 py-3.5 text-left text-[11px] font-black text-slate-500 tracking-tight border-b border-slate-200
                      ${i === 0 ? "hidden sm:table-cell pl-6 w-14" : ""}
                      ${i === 2 || i === 3 || i === 4 ? "text-right" : ""} 
                      ${i === 5 ? "w-12" : ""}`
                    }
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <BillingRow
                  key={item.id}
                  item={item}
                  index={index}
                  isLast={index === items.length - 1}
                  hasSerial={item.requireSerial || !!(item.serialNumbers && item.serialNumbers.length > 0)}
                  handleProductSelectClick={handleProductSelectClick}
                  handleDeleteRow={handleDeleteRow}
                  fetchInventory={fetchInventory}
                  onQtyChange={handleQtyChange}
                />
              ))}
            </tbody>
          </table>
        </div>

      </div>


      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={modalOpen}
        product={pendingProduct}
        onClose={() => {
          setModalOpen(false);
          setPendingProduct(null);
          setActiveRowId(null);
        }}
        onSuccess={handleModalSuccess}
        initialQuantity={activeRowId ? items.find(i => i.id === activeRowId)?.qty : undefined}
        initialSerials={activeRowId ? items.find(i => i.id === activeRowId)?.serialNumbers : undefined}
        initialVariantId={activeRowId ? (items.find(i => i.id === activeRowId)?.variantId ?? undefined) : undefined}
      />
    </div>
  );
};

export default BillingTable;

