import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Layers,
  ChevronDown,
  Search,
  X,
  Package,
  Calendar,
} from "lucide-react";
import { cleanVariantLabel } from "../types";

export interface BillingDropdownOption {
  id: string;
  name: string;
  price: number;
  stock: number;
  isBatchOnly?: boolean;
  batchId?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  batch_no?: string;
}

interface BillingItemSelectDropdownProps {
  type: "variant" | "batch";
  items: BillingDropdownOption[];
  isStockTracked: boolean;
  onSelect: (id: string) => void;
  onOpenModal: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateString;
  }
};

export const BillingItemSelectDropdown: React.FC<BillingItemSelectDropdownProps> = ({
  type,
  items,
  isStockTracked,
  onSelect,
  onOpenModal,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((it) => {
      const cleanName = cleanVariantLabel(it.name).toLowerCase();
      const batchNo = String(it.batch_no || "").toLowerCase();
      const exp = String(it.expiryDate || "").toLowerCase();
      const priceStr = String(it.price || "");
      return cleanName.includes(q) || batchNo.includes(q) || exp.includes(q) || priceStr.includes(q);
    });
  }, [items, searchQuery]);

  const isBatch = type === "batch";

  // Trigger button content
  const triggerButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (items.length === 0) {
          onOpenModal();
        } else {
          setOpen((prev) => !prev);
        }
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all border shadow-2xs ${
        isBatch
          ? "bg-purple-50/80 hover:bg-purple-100 border-purple-200 text-purple-700 hover:text-purple-800"
          : "bg-blue-50/80 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800"
      }`}
    >
      {isBatch ? (
        <Package size={12} className="text-purple-600 shrink-0" />
      ) : (
        <Layers size={12} className="text-blue-600 shrink-0" />
      )}
      <span className="truncate max-w-[140px]">
        {isBatch ? `Select Batch` : `Select Variant`} {items.length > 0 ? `(${items.length})` : ""}
      </span>
      <ChevronDown
        size={12}
        className={`shrink-0 transition-transform duration-150 ${
          isBatch ? "text-purple-500" : "text-blue-500"
        } ${open ? "rotate-180" : ""}`}
      />
    </button>
  );

  if (items.length === 0) {
    return triggerButton;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="p-0 w-80 max-w-[92vw] shadow-2xl rounded-xl border border-slate-200 bg-white z-[99999] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dropdown Header */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {isBatch ? (
              <Package size={13} className="text-purple-600 shrink-0" />
            ) : (
              <Layers size={13} className="text-blue-600 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-800 truncate">
              {isBatch ? "Available Batches" : "Available Variants"}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
            {items.length} {isBatch ? (items.length === 1 ? "batch" : "batches") : (items.length === 1 ? "variant" : "variants")}
          </span>
        </div>

        {/* Integrated Search Bar */}
        <div className="p-2 border-b border-slate-100 bg-white">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={isBatch ? "Search batch name, no. or expiry..." : "Search variant name or price..."}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 text-slate-800 placeholder:text-slate-400 font-medium transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Options List */}
        <div className="max-h-56 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-7 text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center gap-1">
              <Search size={16} className="text-slate-300 stroke-[1.5]" />
              <span>No matching {isBatch ? "batches" : "variants"} found</span>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isOOS = isStockTracked && item.stock <= 0;
              const cleanName = cleanVariantLabel(item.name) || (isBatch ? item.batch_no || item.id.slice(0, 8) : "Variant");

              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOOS) return;
                    setOpen(false);
                    onSelect(item.id);
                  }}
                  className={`p-2 rounded-lg flex items-center justify-between text-left transition-all ${
                    isOOS
                      ? "opacity-50 cursor-not-allowed bg-slate-50/70"
                      : isBatch
                        ? "hover:bg-purple-50/70 hover:border-purple-200 border border-transparent cursor-pointer"
                        : "hover:bg-blue-50/70 hover:border-blue-200 border border-transparent cursor-pointer"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {cleanName}
                      </span>
                      {isBatch && item.expiryDate && (
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-1 py-0.2 rounded inline-flex items-center gap-0.5 leading-tight">
                          <Calendar size={9} />
                          Exp: {formatDate(item.expiryDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      {isStockTracked ? (
                        isOOS ? (
                          <span className="text-rose-500 font-bold">Out of stock</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">{item.stock} in stock</span>
                        )
                      ) : (
                        <span className="text-slate-400 font-medium">Stock not tracked</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 tabular-nums">
                      ₹{Number(item.price || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Fallback Footer */}
        <div className="p-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Need more options?</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onOpenModal();
            }}
            className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
          >
            Open Selection Dialog →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
