import React, { useState, useMemo, useCallback, useEffect } from "react";
import { 
  Trash2, IndianRupee, Package, Keyboard, Barcode, 
  Clock, ShieldCheck, AlertTriangle, XCircle, 
  Plus, RotateCcw, Tag
} from "lucide-react";
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
    batchTracking: true, manufacturingDate: "2026-01-15", expiryDate: "2028-01-15",
    variants: [
      { id: "v1", name: "Blue 128GB", price: 79900, stock: 5 },
      { id: "v2", name: "Black 256GB", price: 89900, stock: 2 }
    ] 
  },
  { 
    product_barcode: "PRD002", product_name: "Basic T-Shirt", category: "Clothing", requireSerial: false,
    batchTracking: true, manufacturingDate: "2026-02-01", expiryDate: "2026-05-10",
    variants: [
      { id: "v3", name: "Medium / Navy", price: 499, stock: 20 },
      { id: "v4", name: "Large / Navy", price: 499, stock: 0 }
    ] 
  },
];

const toOptions = (type: "code" | "name"): SelectOption[] =>
  inventoryItems.map((item) => ({
    value:   type === "code" ? item.product_barcode : item.product_name,
    // Enhance Combobox display if it supports rendering raw strings:
    label:   type === "code" ? item.product_barcode : `${item.product_name} • ${item.category}`,
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

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
};

// ─── Reusable UI Subcomponents ────────────────────────────────────────────────

const StatusBadge = ({ icon: Icon, text, className = "" }: { icon?: any, text: string, className?: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase border ${className}`}>
    {Icon && <Icon size={10} />}
    {text}
  </span>
);

const BatchDetails = ({ mfg, exp }: { mfg?: string, exp?: string }) => {
  if (!exp) return null;
  const now = new Date();
  const expiry = new Date(exp);
  const diffMs = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  let status = { label: `${daysLeft}d left`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', Icon: ShieldCheck };
  if (daysLeft < 0) status = { label: `Expired`, color: 'text-red-700 bg-red-50 border-red-200', Icon: XCircle };
  else if (daysLeft <= 30) status = { label: `${daysLeft}d left`, color: 'text-red-700 bg-red-50 border-red-200', Icon: AlertTriangle };
  else if (daysLeft <= 90) status = { label: `${daysLeft}d left`, color: 'text-amber-700 bg-amber-50 border-amber-200', Icon: Clock };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {mfg && <StatusBadge text={`MFG: ${formatDate(mfg)}`} className="text-slate-500 bg-white border-slate-200 shadow-sm" />}
      <StatusBadge text={`EXP: ${formatDate(exp)}`} className="text-slate-500 bg-white border-slate-200 shadow-sm" />
      <StatusBadge icon={status.Icon} text={status.label} className={status.color} />
    </div>
  );
};

const ShortcutKbd = ({ keys, label }: { keys: string[], label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex gap-0.5">
      {keys.map((k, i) => (
        <kbd key={i} className="px-1.5 py-0.5 rounded-md bg-white text-slate-500 border border-slate-200 shadow-sm font-sans text-[10px] font-medium">
          {k}
        </kbd>
      ))}
    </div>
    <span className="text-[11px] text-slate-400 font-medium ml-0.5">{label}</span>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const BillingTable: React.FC<BillingTableProps> = ({ items, onItemsChange }) => {
  const nameOptions = useMemo(() => toOptions("name"), []);
  const codeOptions = useMemo(() => toOptions("code"), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<InventoryItem | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

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

  const handleProductSelectClick = (selectedValue: string, rowId: string, searchBy: 'name' | 'code' = 'name') => {
    let opt;
    if (searchBy === 'name') {
      // Strip out the category if appended in label formatting
      const rawLabel = selectedValue.split(' • ')[0];
      opt = nameOptions.find((o) => o.value === rawLabel);
    } else {
      opt = codeOptions.find((o) => o.value === selectedValue);
    }
    if (!opt) return;
    
    setPendingProduct(opt.payload);
    setActiveRowId(rowId);
    setModalOpen(true);
  };

  const handleModalSuccess = (variant: ProductVariant, serial?: string) => {
    if (!activeRowId || !pendingProduct) return;

    if (serial && items.some(item => item.serialNumber === serial)) {
       alert("This serial number has already been added to the bill.");
       return;
    }

    const updatedItems = items.map((item) => {
      if (item.id !== activeRowId) return item;
      const merged = { 
        ...item, 
        code: pendingProduct.product_barcode,
        name: `${pendingProduct.product_name} - ${variant.name}`,
        price: variant.price,
        qty: 1, 
        serialNumber: serial,
        variantId: variant.id,
        batchTracking: pendingProduct.batchTracking,
        manufacturingDate: pendingProduct.manufacturingDate,
        expiryDate: pendingProduct.expiryDate,
      };
      return { ...merged, tprice: (merged.qty || 0) * (merged.price || 0) };
    });

    if (activeRowId === items[items.length - 1].id) {
        updatedItems.push(createEmptyRow());
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

  const grandTotal  = items.reduce((sum, item) => sum + item.tprice, 0);
  const totalQty    = items.reduce((sum, item) => sum + item.qty,    0);
  const filledRows  = items.filter((i) => i.name).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full font-sans">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Package size={18} strokeWidth={2} className="text-slate-700" />
            </div>
            <div>
              <h2 className="text-base text-slate-900 font-semibold leading-tight">Billing Items</h2>
              <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                {filledRows} item{filledRows !== 1 ? "s" : ""} • {totalQty} qty total
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <button 
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-150 active:scale-95"
            >
              <RotateCcw size={14} />
              Clear All
            </button>
            <button 
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-150 active:scale-95"
            >
              <Plus size={16} />
              Add Row
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {["#", "Product Details", "Qty", "Unit Price", "Total", ""].map((h, i) => (
                  <th
                    key={h + i}
                    className={`px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50 
                      ${i === 2 || i === 3 || i === 4 ? "text-right" : ""} 
                      ${i === 5 ? "w-14" : ""}`
                    }
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
                
                // Parse variant out for cleaner display
                const [baseName, variantName] = item.name.split(' - ');

                return (
                  <tr
                    key={item.id}
                    className={`group/row transition-colors duration-150 ${isFilled ? "hover:bg-slate-50/50" : "hover:bg-slate-50/30"}`}
                  >
                    {/* Row Number */}
                    <td className={`px-5 py-4 align-top ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <div className="w-6 h-6 mt-1 rounded flex items-center justify-center text-[11px] font-semibold text-slate-400">
                        {index + 1}
                      </div>
                    </td>

                    {/* Product Cell */}
                    <td className={`px-3 py-4 min-w-[300px] align-top ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <div className="w-full max-w-lg">
                        <div className="flex gap-2">
                          <div className="w-2/5">
                            <ReusableCombobox
                              options={codeOptions}
                              value={item.code || ""} 
                              placeholder="Barcode search..."
                              onChange={(selected) => handleProductSelectClick(selected, item.id, 'code')}
                            />
                          </div>
                          <div className="w-3/5">
                            <ReusableCombobox
                              options={nameOptions}
                              value={baseName} 
                              placeholder="Select product..."
                              onChange={(selected) => handleProductSelectClick(selected, item.id, 'name')}
                            />
                          </div>
                        </div>
                        
                        {/* Variant & Serial Tags */}
                        {isFilled && (variantName || hasSerial) && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {variantName && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Tag size={10} className="text-slate-400"/>
                                {variantName}
                              </span>
                            )}
                            {hasSerial && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                <Barcode size={12} className="text-blue-500" />
                                SN: {item.serialNumber}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Batch details rendered as structured badges */}
                        {isFilled && item.batchTracking && (
                          <BatchDetails mfg={item.manufacturingDate} exp={item.expiryDate} />
                        )}
                      </div>
                    </td>

                    {/* Quantity Cell */}
                    <td className={`px-3 py-4 align-top text-right ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <input
                        type="number"
                        min="0"
                        value={item.qty || ""}
                        placeholder="0"
                        disabled={hasSerial}
                        onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddRow(); }}
                        className={`w-20 px-3 py-1.5 mt-0.5 rounded-lg border text-sm font-semibold text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            hasSerial ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-sm"
                        }`}
                      />
                    </td>

                    {/* Unit Price */}
                    <td className={`px-3 py-4 align-top text-right ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <div className="inline-flex items-center justify-end gap-1 px-3 py-1.5 mt-0.5 rounded-lg bg-transparent">
                        <IndianRupee size={12} strokeWidth={2.5} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-600 tabular-nums min-w-[48px]">
                          {item.price > 0 ? item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                        </span>
                      </div>
                    </td>

                    {/* Total Price */}
                    <td className={`px-5 py-4 align-top text-right ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <div className={`inline-flex items-center justify-end gap-1 mt-1 font-bold text-base tabular-nums tracking-tight ${item.tprice > 0 ? "text-slate-900" : "text-slate-300"}`}>
                        <IndianRupee size={14} strokeWidth={2.5} className={item.tprice > 0 ? "text-slate-900" : "text-slate-300"} />
                        {item.tprice > 0
                          ? item.tprice.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                          : "0.00"}
                      </div>
                    </td>

                    {/* Delete Action */}
                    <td className={`px-3 py-4 align-top text-center ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <button
                        onClick={() => handleDeleteRow(item.id)}
                        title="Remove row"
                        className="w-8 h-8 mt-0.5 rounded-lg flex items-center justify-center mx-auto text-slate-400  hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Area */}
        <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/50 flex items-center justify-between flex-wrap gap-4">
          
          {/* Shortcuts Panel */}
          <div className="hidden sm:flex flex-col gap-2">
            <div className="flex items-center gap-1.5 mb-1 text-slate-400">
              <Keyboard size={14} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Shortcuts</span>
            </div>
            <div className="flex items-center gap-4">
              <ShortcutKbd keys={["Alt", "A"]} label="Add Row" />
              <ShortcutKbd keys={["Alt", "⌫"]} label="Delete Last" />
            </div>
          </div>

          {/* Grand Total Panel */}
          <div className="flex items-center gap-4 ml-auto bg-white border border-slate-200 shadow-sm rounded-xl py-3 px-5">
            <span className="text-xs font-stretch-90% text-slate-400 uppercase tracking-widest mt-0.5">Grand Total</span>
            <div className="flex items-center gap-1 text-blue-500">
              <IndianRupee size={20} strokeWidth={3} />
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
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