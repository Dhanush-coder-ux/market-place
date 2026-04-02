import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Trash2, IndianRupee, Package, Keyboard, Barcode } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { BillingItem, InventoryItem, ProductVariant, SelectOption } from "../types";
import { ReusableCombobox } from "@/components/ui/ReusableCombobox";
import ProductSelectionModal from "../components/ProductSelectionModel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingTableProps {
  items: BillingItem[];
  onItemsChange: (items: BillingItem[]) => void;
}

// ─── Mock Inventory Data ──────────────────────────────────────────────────────

const inventoryItems: InventoryItem[] = [
  { 
    product_barcode: "PRD001", product_name: "iPhone 15", category: "Electronics", requireSerial: true,
    variants: [
      { id: "v1", name: "Blue 128GB", price: 79900, stock: 5 },
      { id: "v2", name: "Black 256GB", price: 89900, stock: 2 }
    ] 
  },
  { 
    product_barcode: "PRD002", product_name: "Basic T-Shirt", category: "Clothing", requireSerial: false,
    variants: [
      { id: "v3", name: "Medium / Navy", price: 499, stock: 20 },
      { id: "v4", name: "Large / Navy", price: 499, stock: 0 } // Out of stock example
    ] 
  },
];

const toOptions = (type: "code" | "name"): SelectOption[] =>
  inventoryItems.map((item) => ({
    value:   type === "code" ? item.product_barcode : item.product_name,
    label:   type === "code" ? item.product_barcode : item.product_name,
    payload: item,
  }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const createEmptyRow = (): BillingItem => ({
  id:     uuidv4(),
  code:   "",
  name:   "",
  qty:    0,
  price:  0,
  tprice: 0,
});

// ─── Component ────────────────────────────────────────────────────────────────

const BillingTable: React.FC<BillingTableProps> = ({ items, onItemsChange }) => {
  const nameOptions = useMemo(() => toOptions("name"), []);

  // ── Modal State ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<InventoryItem | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  // ── Row mutations (all go through onItemsChange) ──────────────────────────

  const handleAddRow = useCallback(() => {
    onItemsChange([...items, createEmptyRow()]);
  }, [items, onItemsChange]);

  const handleDeleteLastRow = useCallback(() => {
    onItemsChange(items.length === 1 ? [createEmptyRow()] : items.slice(0, -1));
  }, [items, onItemsChange]);

  const handleDeleteRow = useCallback((id: string) => {
    onItemsChange(items.length === 1 ? [createEmptyRow()] : items.filter((item) => item.id !== id));
  }, [items, onItemsChange]);

  const updateItem = useCallback((id: string, updates: Partial<BillingItem>) => {
    onItemsChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates };
        return { ...merged, tprice: (merged.qty || 0) * (merged.price || 0) };
      })
    );
  }, [items, onItemsChange]);

  // ── Modal Handlers ────────────────────────────────────────────────────────

  const handleProductSelectClick = (selectedLabel: string, rowId: string) => {
    const opt = nameOptions.find((o) => o.value === selectedLabel);
    if (!opt) return;
    
    setPendingProduct(opt.payload);
    setActiveRowId(rowId);
    setModalOpen(true);
  };

  const handleModalSuccess = (variant: ProductVariant, serial?: string) => {
    if (!activeRowId || !pendingProduct) return;

    // Check for duplicate serials in the table
    if (serial && items.some(item => item.serialNumber === serial)) {
       alert("This serial number has already been added to the bill.");
       return;
    }

    updateItem(activeRowId, {
      code: pendingProduct.product_barcode,
      name: `${pendingProduct.product_name} - ${variant.name}`,
      price: variant.price,
      qty: 1, // Default to 1, especially for serial items
      serialNumber: serial,
      variantId: variant.id
    });

    setModalOpen(false);
    setPendingProduct(null);
    setActiveRowId(null);
    
    // Auto-add new row if we just filled the last one
    if (activeRowId === items[items.length - 1].id) {
        handleAddRow();
    }
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

  const grandTotal  = items.reduce((sum, item) => sum + item.tprice, 0);
  const totalQty    = items.reduce((sum, item) => sum + item.qty,    0);
  const filledRows  = items.filter((i) => i.name).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Header strip */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-blue-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm shadow-indigo-200">
              <Package size={15} strokeWidth={2.5} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-black font-semibold">Line Items</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {filledRows} product{filledRows !== 1 ? "s" : ""} · {totalQty} unit{totalQty !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {["#", "Product Name", "Qty", "Unit Price", "Total", ""].map((h, i) => (
                  <th
                    key={h + i}
                    className={`px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/40 ${i === 5 ? "w-12 text-center" : ""} ${i === 2 ? "w-24" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => {
                const isLast   = index === items.length - 1;
                const isFilled = !!item.name;
                const hasSerial = !!item.serialNumber;

                return (
                  <tr
                    key={item.id}
                    className={`group transition-colors duration-100 ${isFilled ? "hover:bg-slate-50/70" : "hover:bg-slate-50/40"}`}
                  >
                    {/* Row number */}
                    <td className={`px-4 py-3 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                    </td>

                    {/* Product name */}
                    <td className={`px-3 py-2.5 min-w-[220px] ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <ReusableCombobox
                        options={nameOptions}
                        value={item.name.split(' - ')[0]} // Show just base name in combobox visually if desired, or leave full
                        placeholder="Select product or scan..."
                        onChange={(selected) => handleProductSelectClick(selected, item.id)}
                      />
                      {/* Display Serial Number below Combobox if it exists */}
                      {hasSerial && (
                        <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium flex items-center gap-1">
                           <Barcode size={10} /> SN: {item.serialNumber}
                        </p>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className={`px-3 py-2.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <input
                        type="number"
                        min="0"
                        value={item.qty || ""}
                        placeholder="0"
                        disabled={hasSerial} // Lock quantity to 1 if it has a serial number
                        onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddRow(); }}
                        className={`w-20 px-3 py-2 rounded-xl border text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            hasSerial ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 hover:border-blue-300"
                        }`}
                      />
                    </td>

                    {/* Unit price */}
                    <td className={`px-3 py-2.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 w-fit">
                        <IndianRupee size={12} strokeWidth={2.5} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-500 min-w-[48px]">
                          {item.price > 0 ? item.price.toLocaleString("en-IN") : "—"}
                        </span>
                      </div>
                    </td>

                    {/* Row total */}
                    <td className={`px-4 py-2.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <div className={`inline-flex items-center gap-1 font-black text-[15px] tracking-tight ${item.tprice > 0 ? "text-slate-800" : "text-slate-300"}`}>
                        <IndianRupee size={13} strokeWidth={2.5} />
                        {item.tprice > 0
                          ? item.tprice.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                          : "0.00"}
                      </div>
                    </td>

                    {/* Delete */}
                    <td className={`px-3 py-2.5 text-center ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <button
                        onClick={() => handleDeleteRow(item.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer: shortcuts + grand total */}
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/40 flex items-center justify-between flex-wrap gap-3">

          {/* Keyboard shortcuts legend */}
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
            <div className="flex items-center gap-1.5">
              <Keyboard size={14} className="text-slate-300" />
              <span>Shortcuts:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 shadow-sm">Alt</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 shadow-sm">A</kbd>
              <span className="ml-1">Add Row</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 shadow-sm">Alt</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 shadow-sm">⌫</kbd>
              <span className="ml-1">Delete Last</span>
            </div>
          </div>

          {/* Grand total */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Grand Total</span>
            <div className="flex items-center gap-1 px-4 py-2">
              <IndianRupee size={14} strokeWidth={2.5} />
              <span className="text-base font-black tracking-tight tabular-nums">
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
         onClose={() => setModalOpen(false)}
         onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default BillingTable;