import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Trash2, IndianRupee, Package, Keyboard, Barcode,
  Clock, ShieldCheck, AlertTriangle, XCircle,
  Plus, RotateCcw, Tag
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

const StatusBadge = ({ icon: Icon, text, className = "" }: { icon?: any, text: string, className?: string }) => (
  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wide uppercase border ${className}`}>
    {Icon && <Icon size={9} />}
    {text}
  </span>
);

const BatchDetails = ({ mfg, exp }: { mfg?: string, exp?: string }) => {
  if (!exp) return null;
  const now = new Date();
  const expiry = new Date(exp);
  const diffMs = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status = { label: `${daysLeft}d left`, color: 'text-emerald-600 bg-emerald-50/80 border-emerald-200/60', Icon: ShieldCheck };
  if (daysLeft < 0) status = { label: `Expired`, color: 'text-red-600 bg-red-50/80 border-red-200/60', Icon: XCircle };
  else if (daysLeft <= 30) status = { label: `${daysLeft}d left`, color: 'text-red-600 bg-red-50/80 border-red-200/60', Icon: AlertTriangle };
  else if (daysLeft <= 90) status = { label: `${daysLeft}d left`, color: 'text-amber-600 bg-amber-50/80 border-amber-200/60', Icon: Clock };

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1.5">
      {mfg && <StatusBadge text={`MFG: ${formatDate(mfg)}`} className="text-slate-500 bg-white border-slate-200/60" />}
      <StatusBadge text={`EXP: ${formatDate(exp)}`} className="text-slate-500 bg-white border-slate-200/60" />
      <StatusBadge icon={status.Icon} text={status.label} className={status.color} />
    </div>
  );
};

const ShortcutKbd = ({ keys, label }: { keys: string[]; label: string; }) => (
  <div className="flex items-center gap-1">
    <div className="flex gap-0.5">
      {keys.map((k, i) => (
        <kbd key={i} className="px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200/80 font-sans text-[9px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {k}
        </kbd>
      ))}
    </div>
    <span className="text-[10px] text-slate-400 font-normal ml-0.5">{label}</span>
  </div>
);

const BillingRow = React.memo(({
  item, index, isLast, hasSerial,
  handleProductSelectClick, updateItem, handleDeleteRow, handleAddRow, fetchInventory
}: {
  item: BillingItem;
  index: number;
  isLast: boolean;
  hasSerial: boolean;
  handleProductSelectClick: any;
  updateItem: (id: string, updates: Partial<BillingItem>) => void;
  handleDeleteRow: (id: string) => void;
  handleAddRow: () => void;
  fetchInventory: (q: string, signal: AbortSignal) => Promise<any[]>;
}) => {
  const isFilled = !!item.name;
  const [baseName, variantName] = item.name ? item.name.split(' - ') : ["", ""];

  return (
    <tr className={`group/row transition-colors duration-150 ${
      isFilled ? "hover:bg-blue-50/30" : "hover:bg-slate-50/30"
    } ${index % 2 === 0 ? "" : "bg-slate-50/30"}`}>
      {/* Row Index */}
      <td className={`hidden sm:table-cell pl-4 pr-2 py-3 align-top ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <div className="w-5 h-5 mt-1 rounded flex items-center justify-center text-[10px] font-medium text-slate-400">
          {index + 1}
        </div>
      </td>

      {/* Product Details */}
      <td className={`px-3 py-3 min-w-[280px] align-top ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-[22%]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider ml-0.5">Barcode</span>
                <div className="h-[38px] px-2.5 flex items-center rounded-lg border border-slate-200/60 bg-slate-50/40 text-[12px] font-normal text-slate-600 truncate">
                  {item.code || "—"}
                </div>
              </div>
            </div>
            <div className="w-[78%]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider ml-0.5">Product</span>
                <SearchSelect
                  fetchOptions={fetchInventory}
                  value={baseName}
                  placeholder="Search products..."
                  labelKey="displayName"
                  valueKey="displayName"
                  onChange={(_, opt: any) => handleProductSelectClick(opt, item.id)}
                  className="h-[38px] shadow-none border-slate-200/60 focus:border-blue-300 rounded-lg text-[13px]"
                />
              </div>
            </div>
          </div>

          {isFilled && (variantName || hasSerial) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {variantName && (
                <span className="inline-flex items-center gap-1 text-[10px] font-normal text-slate-600 bg-slate-100/60 px-1.5 py-0.5 rounded">
                  <Tag size={9} className="text-slate-400" />
                  {variantName}
                </span>
              )}
              {hasSerial && item.serialNumbers && item.serialNumbers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.serialNumbers.map((s, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-[9px] font-medium text-blue-600 bg-blue-50/80 border border-blue-100/60 px-1.5 py-0.5 rounded">
                      <Barcode size={9} className="text-blue-400" />
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {isFilled && item.batchTracking && (
            <BatchDetails mfg={item.manufacturingDate} exp={item.expiryDate} />
          )}
        </div>
      </td>

      {/* Quantity */}
      <td className={`px-2 py-3 align-top text-right ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <div 
          onClick={() => isFilled && handleProductSelectClick((item as any)._product, item.id)}
          className={`w-16 h-[38px] px-2 rounded-lg border border-slate-200/60 bg-white flex items-center justify-end cursor-pointer hover:border-blue-300/60 transition-colors duration-150 ${!isFilled ? "opacity-40 pointer-events-none" : ""}`}
        >
          <input
            type="number"
            readOnly
            value={item.qty || ""}
            placeholder="0"
            className="w-full bg-transparent text-right outline-none cursor-pointer text-[13px] font-medium text-slate-700 tabular-nums"
            onKeyDown={(e) => { 
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                isFilled && handleProductSelectClick((item as any)._product, item.id);
              }
            }}
          />
        </div>
      </td>

      {/* Unit Price */}
      <td className={`px-2 py-3 align-top text-right ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <div className="h-[38px] flex items-center justify-end gap-0.5 px-1">
          <IndianRupee size={11} strokeWidth={2} className="text-slate-400" />
          <span className="text-[13px] font-normal text-slate-600 tabular-nums">
            {item.price > 0 ? item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
          </span>
        </div>
      </td>

      {/* Total */}
      <td className={`px-3 py-3 align-top text-right ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <div className="flex flex-col items-end">
          <div className={`h-[38px] flex items-center justify-end gap-0.5 font-medium text-[14px] tabular-nums tracking-tight ${item.tprice > 0 ? "text-slate-800" : "text-slate-300"}`}>
            <IndianRupee size={12} strokeWidth={2} className={item.tprice > 0 ? "text-slate-600" : "text-slate-300"} />
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
      <td className={`px-2 py-3 align-top text-center ${!isLast ? "border-b border-slate-100/60" : ""}`}>
        <button
          onClick={() => handleDeleteRow(item.id)}
          className="w-7 h-7 mt-1 rounded-md flex items-center justify-center mx-auto text-slate-300 hover:text-red-500 hover:bg-red-50/60 transition-all duration-150"
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
    if (!q) return [];
    try {
      const res = await getData(ENDPOINTS.INVENTORIES, { limit: "10", offset: "1", q, shop_id: SHOP_ID }, { signal });
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

  const updateItem = useCallback((id: string, updates: Partial<BillingItem>) => {
    onItemsChange(
      itemsRef.current.map((item: BillingItem) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates };
        return { ...merged, tprice: (merged.qty || 0) * (merged.price || 0) };
      })
    );
  }, [onItemsChange]);

  // ── Modal Handlers ────────────────────────────────────────────────────────

  const handleProductSelectClick = (selectedProduct: any, rowId: string) => {
    if (!selectedProduct) return;

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

  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + item.tprice, 0), [items]);
  const totalQty = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  const filledRows = useMemo(() => items.filter((i) => i.name).length, [items]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full font-sans">
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">

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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {["#", "Product Details", "Qty", "Price", "Total", ""].map((h, i) => (
                  <th
                    key={h + i}
                    className={`px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider border-b border-slate-100/60 bg-slate-50/40
                      ${i === 0 ? "hidden sm:table-cell pl-4 w-10" : ""}
                      ${i === 2 || i === 3 || i === 4 ? "text-right" : ""} 
                      ${i === 5 ? "w-10" : ""}`
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
                  updateItem={updateItem}
                  handleDeleteRow={handleDeleteRow}
                  handleAddRow={handleAddRow}
                  fetchInventory={fetchInventory}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100/60 px-4 py-3 bg-slate-50/30 flex items-center justify-between flex-wrap gap-3">

          {/* Shortcuts */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-400 mr-1">
              <Keyboard size={12} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Shortcuts</span>
            </div>
            <ShortcutKbd keys={["Alt", "A"]} label="Add" />
            <ShortcutKbd keys={["Alt", "⌫"]} label="Delete" />
          </div>

          {/* Grand Total */}
          <div className="flex items-center gap-3 ml-auto bg-white border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-lg py-2 px-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Total</span>
            <div className="flex items-center gap-0.5 text-blue-500">
              <IndianRupee size={16} strokeWidth={2} />
              <span className="text-xl font-semibold tracking-tight tabular-nums">
                {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

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