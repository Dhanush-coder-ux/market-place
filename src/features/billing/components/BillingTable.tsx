import React, { useMemo, useCallback, useEffect } from "react";
import { Trash2,  IndianRupee, Package, Keyboard } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { BillingItem, SelectOption } from "../types";
import { ReusableCombobox } from "@/components/ui/ReusableCombobox";

const inventoryItems = [
  { product_barcode: "PRD001", product_name: "Blue T-Shirt", product_price: 499 },
  { product_barcode: "PRD002", product_name: "Jeans Pant", product_price: 999 },
  { product_barcode: "PRD003", product_name: "Formal Shoes", product_price: 1999 },
];

const createEmptyRow = (): BillingItem => ({
  id: uuidv4(),
  code: "",
  name: "",
  qty: 0,
  price: 0,
  tprice: 0,
});

const BillingTable: React.FC = () => {
  const [items, setItems] = React.useState<BillingItem[]>([createEmptyRow()]);

  // 1. Memoized Add Row
  const handleAddRow = useCallback(() => {
    setItems((prev) => [...prev, createEmptyRow()]);
  }, []);

  // 2. Memoized Delete Last Row (for the shortcut)
  const handleDeleteLastRow = useCallback(() => {
    setItems((prev) => (prev.length === 1 ? [createEmptyRow()] : prev.slice(0, -1)));
  }, []);

  // 3. Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Add Row: Alt + A
      if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleAddRow();
      }
      
      // Delete Last Row: Alt + Backspace OR Alt + Delete
      if (e.altKey && (e.key === "Backspace" || e.key === "Delete")) {
        e.preventDefault();
        handleDeleteLastRow();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleAddRow, handleDeleteLastRow]);

  // Specific row deletion (for the trash can button)
  const handleDeleteRow = (id: string) => {
    setItems((prev) => (prev.length === 1 ? [createEmptyRow()] : prev.filter((item) => item.id !== id)));
  };

  const updateItem = useCallback((id: string, updates: Partial<BillingItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates };
        return { ...merged, tprice: (merged.qty || 0) * (merged.price || 0) };
      })
    );
  }, []);

  const toOptions = (type: "code" | "name"): SelectOption[] =>
    inventoryItems.map((item) => ({
      value: type === "code" ? item.product_barcode : item.product_name,
      label: type === "code" ? item.product_barcode : item.product_name,
      payload: item,
    }));

  const nameOptions = useMemo(() => toOptions("name"), []);

  const grandTotal = items.reduce((sum, item) => sum + item.tprice, 0);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const filledRows = items.filter((i) => i.name).length;

  return (
    <div className="w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Table header strip */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
              <Package size={15} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 tracking-tight leading-none">Line Items</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none">
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
                    className={`
                      px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest
                      border-b border-slate-100 bg-slate-50/40
                      ${i === 5 ? "w-12 text-center" : ""}
                      ${i === 2 ? "w-24" : ""}
                    `}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const isFilled = !!item.name;

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
                        value={item.name}
                        placeholder="Select product…"
                        onChange={(selected) => {
                          const opt = nameOptions.find((o) => o.value === selected);
                          if (!opt) return;
                          const prod = opt.payload;
                          updateItem(item.id, {
                            code: prod.product_barcode,
                            name: prod.product_name,
                            price: prod.product_price,
                            qty: item.qty === 0 ? 1 : item.qty,
                          });
                        }}
                      />
                    </td>

                    {/* Quantity */}
                    <td className={`px-3 py-2.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <input
                        type="number"
                        min="0"
                        value={item.qty || ""}
                        placeholder="0"
                        onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddRow(); }}
                        className="
                          w-20 px-3 py-2 rounded-xl border border-slate-200 bg-white
                          text-sm font-semibold text-slate-800 text-center
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                          hover:border-indigo-300 transition-colors
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        "
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

                    {/* Total price */}
                    <td className={`px-4 py-2.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <div className={`inline-flex items-center gap-1 font-black text-[15px] tracking-tight ${item.tprice > 0 ? "text-slate-800" : "text-slate-300"}`}>
                        <IndianRupee size={13} strokeWidth={2.5} />
                        {item.tprice > 0 ? item.tprice.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                      </div>
                    </td>

                    {/* Delete */}
                    <td className={`px-3 py-2.5 text-center ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <button
                        onClick={() => handleDeleteRow(item.id)}
                        className="
                          w-8 h-8 rounded-xl flex items-center justify-center mx-auto
                          text-slate-300 hover:text-rose-500 hover:bg-rose-50
                        "
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

        {/* Footer totals & Shortcuts */}
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/40 flex items-center justify-between flex-wrap gap-3">
          
          {/* Keyboard Shortcuts Legend */}
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
              <span className="ml-1">Delete Last Row</span>
            </div>
          </div>

          {/* Grand total */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Grand Total</span>
            <div className="flex items-center gap-1 px-4 py-2">
              <IndianRupee size={14} strokeWidth={2.5} />
              <span className="text-base font-black tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
                {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BillingTable;