import {
  Plus,
  Trash2,
  Settings,
  ChevronUp,
  ChevronRight,
  Info,
  Check,
  PackageOpen,
  Banknote,
  Percent,
  TrendingUp,
  Package,
  X
} from "lucide-react";
import React, { useState, useCallback, memo } from "react";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { inventoryApi } from "@/services/api/inventory";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";

export interface ProductItem {
  id: string;
  name: string;
  quantity: number | "";
  costPrice: number | "";
  sellingPrice: number | "";
  marginPercent: number | "";
  marginAmount: number | "";
  marginType: "percent" | "amount" | "sellingPrice";
  unit: string;
  taxGst: number | "";
  storageLoc: string;
  reorderPoint: number | "";
  expiryDate: string;
  manufacturingDate: string;
  batchTracking: boolean;
  serialTracking: boolean;
  serialNumbers: string;
  batchNum: string;
  sku: string;
  variant: string;
  size: string;
  category?: string;
}

interface InventoryItemsCardProps {
  products: ProductItem[];
  stats: any;
  costMethod: string;
  setCostMethod: (method: string) => void;
  type?: "PURCHASE" | "PRODUCTION";
  handleProductChange: (index: number, field: string, value: any) => void;
  updateProductFields: (index: number, updates: any) => void;
  setProducts: React.Dispatch<React.SetStateAction<ProductItem[]>>;
  addProduct: () => void;
  removeProduct: (index: number) => void;
}

// ─── Memoized Sub-components ───────────────────────────────────────────────────

const ProductRow = memo(({ 
  product, index, themeColor, type, stats, 
  expandedBreakdown, expandedSettings, collapsedProducts,
  handleProductChange, updateProductFields, removeProduct,
  toggleBreakdown, toggleSettings, toggleCollapse,
  setVariantModal, setSelectedVariants
}: {
  product: ProductItem;
  index: number;
  themeColor: string;
  type: "PURCHASE" | "PRODUCTION";
  stats: { allocation: any; totalCharges: number };
  expandedBreakdown: Set<number>;
  expandedSettings: Set<number>;
  collapsedProducts: Set<number>;
  handleProductChange: (index: number, field: string, value: any) => void;
  updateProductFields: (index: number, updates: Partial<ProductItem>) => void;
  removeProduct: (index: number) => void;
  toggleBreakdown: (index: number) => void;
  toggleSettings: (index: number) => void;
  toggleCollapse: (index: number) => void;
  setVariantModal: any;
  setSelectedVariants: any;
}) => {
  const q = Number(product.quantity) || 0;
  const baseCost = Number(product.costPrice) || 0;
  const rowTotal = q * baseCost;
  const hasProduct = !!product.name;

  const allocation = stats.allocation || {};
  const allocTotal = allocation.alloc || 0;
  const allocPerUnit = q > 0 ? allocTotal / q : 0;
  const netCostPerUnit = allocation.netCostPerUnit || baseCost;

  let computedSellPrice = Number(product.sellingPrice) || 0;
  if (product.marginType === "percent" && Number(product.marginPercent) > 0) {
    computedSellPrice = netCostPerUnit * (1 + Number(product.marginPercent) / 100);
  } else if (product.marginType === "amount" && Number(product.marginAmount) > 0) {
    computedSellPrice = netCostPerUnit + Number(product.marginAmount);
  }

  const effectiveMarginPct = netCostPerUnit > 0 && computedSellPrice > 0
    ? (((computedSellPrice - netCostPerUnit) / netCostPerUnit) * 100).toFixed(1)
    : null;

  const DEFAULT_MARGIN_PCT = 10;
  const suggestedSellPrice = netCostPerUnit > 0
    ? (computedSellPrice > 0 ? computedSellPrice : netCostPerUnit * (1 + DEFAULT_MARGIN_PCT / 100))
    : 0;
  const suggestedMarginPct = netCostPerUnit > 0 && suggestedSellPrice > 0
    ? (((suggestedSellPrice - netCostPerUnit) / netCostPerUnit) * 100).toFixed(1)
    : null;
  const isMarginUserSet = computedSellPrice > 0;

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden ${
        hasProduct
          ? 'border-slate-200 bg-white shadow-sm'
          : 'border-dashed border-slate-200 bg-slate-50/40'
      }`}
    >
      {/* Row Header */}
      <div className={`px-4 py-3 flex items-center gap-3 ${hasProduct ? 'border-b border-slate-100' : ''}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0 ${
          hasProduct ? `bg-${themeColor}-600 text-white` : 'bg-slate-200 text-slate-50'
        }`}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <SearchSelect
            labelKey="name"
            valueKey="id"
            fetchOptions={async (q) => await inventoryApi.searchInventories(q)}
            value={product.name}
            onChange={(val, opt: any) => {
              if (opt) {
                const hasVariants = opt.has_variants || (opt.datas && opt.datas.has_variants);
                const combinations = opt.combinations || (opt.datas && opt.datas.combinations) || [];
                if (hasVariants && combinations.length > 0) {
                  const mappedVariants = combinations.map((c: any) => ({
                    id: c.id, name: Object.values(c.attributes || {}).join(" - "),
                    sku: c.barcode || opt.barcode, stock: c.stock || opt.stocks || 0,
                  }));
                  setVariantModal({ isOpen: true, baseProduct: opt.name || String(val), targetRowIndex: index, variants: mappedVariants, baseData: opt.datas || opt });
                  setSelectedVariants(new Set());
                } else {
                  const d = opt.datas || opt;
                  updateProductFields(index, {
                    name: d.name || String(val),
                    costPrice: d.buy_price ?? d.costPrice ?? "",
                    sellingPrice: d.sell_price ?? d.sellingPrice ?? "",
                    sku: d.barcode ?? d.sku ?? "",
                    unit: d.unit ?? "pc",
                    category: d.category ?? "",
                    batchTracking: !!(d.batch_tracking || (d.datas && d.datas.batch_tracking)),
                    serialTracking: !!(d.serial_tracking || (d.datas && d.datas.serial_tracking))
                  });
                }
              } else {
                handleProductChange(index, "name", String(val));
              }
            }}
            placeholder={`Search product ${index + 1}...`}
          />
        </div>

        {hasProduct && (
          <div className="shrink-0 text-right hidden sm:block min-w-[80px]">
            <span className="text-[10px] text-slate-400 block">Total</span>
            <span className="text-sm font-semibold text-slate-800 tabular-nums">₹{rowTotal.toLocaleString()}</span>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => toggleBreakdown(index)}
            className={`p-1.5 rounded-lg transition-all text-[11px] ${
              expandedBreakdown.has(index)
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
          >
            <Info size={14} />
          </button>
          <button
            onClick={() => toggleSettings(index)}
            className={`p-1.5 rounded-lg transition-all ${
              expandedSettings.has(index)
                ? `bg-${themeColor}-600 text-white`
                : `text-slate-400 hover:bg-slate-100 hover:text-slate-600`
            }`}
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => toggleCollapse(index)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            {collapsedProducts.has(index) ? <ChevronRight size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={() => removeProduct(index)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-rose-500 transition-all opacity-0 group-hover:opacity-100 ml-0.5"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {hasProduct && !collapsedProducts.has(index) && (
        <div className="px-4 py-2 flex flex-wrap items-center gap-1.5 border-b border-slate-100">
          {product.variant && (
            <span className={`inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-md bg-${themeColor}-50 border border-${themeColor}-100 text-[10px]`}>
              <span className={`text-${themeColor}-400 font-medium`}>Variant</span>
              <span className={`text-${themeColor}-700 font-semibold`}>{product.variant}</span>
            </span>
          )}
          {product.sku && (
            <span className="inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px]">
              <span className="text-slate-400 font-medium">SKU</span>
              <span className="text-slate-600 font-semibold font-mono">{product.sku}</span>
            </span>
          )}
          {stats.totalCharges > 0 && (
            <span className="inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[10px]">
              <span className="text-blue-400 font-medium">Alloc</span>
              <span className="text-blue-700 font-semibold tabular-nums">₹{allocPerUnit.toFixed(2)}</span>
            </span>
          )}
          {stats.totalCharges > 0 && (
            <span className="inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-[10px]">
              <span className="text-emerald-500 font-medium">Net {type === "PURCHASE" ? "Buy" : "Cost"}</span>
              <span className="text-emerald-700 font-semibold tabular-nums">₹{netCostPerUnit.toFixed(2)}</span>
            </span>
          )}
          {suggestedMarginPct && (
            <span className={`inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-md text-[10px] border ${
              isMarginUserSet ? 'bg-violet-50 border-violet-100' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`font-medium ${isMarginUserSet ? 'text-violet-400' : 'text-slate-400'}`}>Margin</span>
              <span className={`font-semibold ${isMarginUserSet ? 'text-violet-700' : 'text-slate-500'}`}>+{suggestedMarginPct}%</span>
            </span>
          )}
        </div>
      )}

      {hasProduct && !collapsedProducts.has(index) && (
        <div className="px-4 pb-4 pt-4 space-y-4">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3">
              <Input
                label="Quantity"
                required
                type="number"
                value={product.quantity as any}
                onChange={(e) => handleProductChange(index, "quantity", e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div className="col-span-2">
              <Input label="Unit" disabled value={product.unit} onChange={() => {}} />
            </div>
            <div className="col-span-3">
              <Input
                label={type === "PURCHASE" ? "Buy Price" : "Material Cost"}
                required
                type="number"
                value={product.costPrice as any}
                onChange={(e) => handleProductChange(index, "costPrice", e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div className="col-span-4">
              <label className="text-[11px] font-medium text-slate-500 block mb-1.5 ml-0.5">
                {type === "PURCHASE" ? "Total Buy Value" : "Total Base Cost"}
              </label>
              <div className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{q} × ₹{baseCost}</span>
                <span className="text-sm font-semibold text-slate-800 tabular-nums">₹{rowTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Per Unit Pricing</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <div className="px-4 py-3 flex flex-col gap-1">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Net Buy Cost</span>
                <span className="text-base font-semibold text-slate-800 tabular-nums">₹{netCostPerUnit.toFixed(2)}</span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Margin</span>
                  <div className="flex items-center bg-slate-100 rounded p-0.5 gap-0.5">
                    <button
                      onClick={() => handleProductChange(index, "marginType", "percent")}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${product.marginType === "percent" ? "bg-white shadow-sm" : "text-slate-400"}`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => handleProductChange(index, "marginType", "amount")}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${product.marginType === "amount" ? "bg-white shadow-sm" : "text-slate-400"}`}
                    >
                      ₹
                    </button>
                  </div>
                </div>
                {product.marginType === "percent" ? (
                  <Input
                    type="number"
                    value={product.marginPercent as any}
                    onChange={(e) => handleProductChange(index, "marginPercent", e.target.value ? Number(e.target.value) : "")}
                    leftIcon={<Percent size={12} />}
                  />
                ) : (
                  <Input
                    type="number"
                    value={product.marginAmount as any}
                    onChange={(e) => handleProductChange(index, "marginAmount", e.target.value ? Number(e.target.value) : "")}
                    leftIcon={<Banknote size={12} />}
                  />
                )}
              </div>
              <div className={`px-4 py-3 flex flex-col gap-1 ${computedSellPrice > 0 ? 'bg-emerald-50/50' : ''}`}>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Sell Price / unit</span>
                <span className={`text-base font-semibold tabular-nums ${computedSellPrice > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {computedSellPrice > 0 ? `₹${computedSellPrice.toFixed(2)}` : '—'}
                </span>
                {effectiveMarginPct && <span className="text-[10px] font-semibold text-emerald-600">+{effectiveMarginPct}% margin</span>}
              </div>
            </div>
          </div>

          {product.batchTracking && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/30 overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-amber-100/50 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <Package size={13} className="text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Batch Tracking</span>
                </div>
              </div>
              <div className="px-3.5 pb-3.5 pt-3 grid grid-cols-2 gap-3">
                <Input type="date" label="Mfg. Date" value={product.manufacturingDate} onChange={(e) => handleProductChange(index, "manufacturingDate", e.target.value)} />
                <Input type="date" label="Expiry Date" value={product.expiryDate} onChange={(e) => handleProductChange(index, "expiryDate", e.target.value)} />
              </div>
            </div>
          )}

          {product.serialTracking && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/30 overflow-hidden mt-3">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-violet-100/50 border-b border-violet-200">
                <span className="text-[11px] font-bold text-violet-900 uppercase tracking-wider">Serial Tracking</span>
                <span className="text-[9px] font-black uppercase bg-violet-100 px-1.5 py-0.5 rounded-md">
                  {(product.serialNumbers?.split(',').filter(Boolean).length || 0)} / {q}
                </span>
              </div>
              <div className="p-3.5">
                <div className="flex flex-wrap gap-1.5 p-2.5 border border-slate-200 rounded-xl bg-white min-h-[45px]">
                    {(product.serialNumbers || "").split(',').filter(Boolean).map((s: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        {s}
                        <button onClick={() => {
                          const current = (product.serialNumbers || "").split(',').filter(Boolean);
                          handleProductChange(index, "serialNumbers", current.filter((_: string, idx: number) => idx !== i).join(','));
                        }}><X size={10}/></button>
                      </span>
                    ))}
                  <input
                    type="text"
                    className="flex-1 outline-none text-[11px] bg-transparent"
                    placeholder="Enter serial..."
                    onKeyDown={(e) => {
                      if (e.key === ',' || e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        const current = (product.serialNumbers || "").split(',').filter(Boolean);
                        if (val && current.length < q && !current.includes(val)) {
                          handleProductChange(index, "serialNumbers", [...current, val].join(','));
                        }
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {expandedSettings.has(index) && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
               <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-medium text-slate-500">Settings</div>
               <div className="p-3.5 grid grid-cols-3 gap-3">
                  <ReusableSelect
                    options={[{ value: '0', label: '0%' }, { value: '18', label: '18%' }]}
                    value={String(product.taxGst)}
                    onValueChange={(val) => handleProductChange(index, "taxGst", Number(val))}
                  />
                  <Input value={product.storageLoc} onChange={(e) => handleProductChange(index, "storageLoc", e.target.value)} placeholder="Location" />
                  <Input type="number" value={product.reorderPoint as any} onChange={(e) => handleProductChange(index, "reorderPoint", e.target.value)} placeholder="Threshold" />
               </div>
            </div>
          )}

          {expandedBreakdown.has(index) && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden p-4 bg-slate-50/30">
               <div className="flex justify-between text-xs mb-1">
                 <span className="text-slate-500">Net Cost</span>
                 <span className="font-semibold text-emerald-600">₹{netCostPerUnit.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-slate-500">Total Value</span>
                 <span className="font-semibold text-slate-800">₹{rowTotal.toLocaleString()}</span>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export const InventoryItemsCard = memo(function InventoryItemsCard({
  products,
  stats,
  costMethod,
  setCostMethod,
  type = "PURCHASE",
  handleProductChange,
  updateProductFields,
  setProducts,
  addProduct,
  removeProduct
}: InventoryItemsCardProps) {
  const [expandedBreakdown, setExpandedBreakdown] = useState<Set<number>>(new Set());
  const [expandedSettings, setExpandedSettings] = useState<Set<number>>(new Set());
  const [collapsedProducts, setCollapsedProducts] = useState<Set<number>>(new Set());

  const [variantModal, setVariantModal] = useState<{
    isOpen: boolean;
    baseProduct: string;
    targetRowIndex: number;
    variants: any[];
    baseData: any;
  }>({
    isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null
  });
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  const toggleBreakdown = useCallback((index: number) => {
    setExpandedBreakdown(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleSettings = useCallback((index: number) => {
    setExpandedSettings(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleCollapse = useCallback((index: number) => {
    setCollapsedProducts(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const confirmVariants = () => {
    if (selectedVariants.size === 0) {
      setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
      return;
    }

    setProducts(prev => {
      const next = [...prev];
      const baseOpt = variantModal.baseData;
      const variantsToAdd = variantModal.variants.filter(v => selectedVariants.has(v.id));
      const targetIdx = variantModal.targetRowIndex;

      const first = variantsToAdd[0];
      next[targetIdx] = {
        ...next[targetIdx],
        name: variantModal.baseProduct,
        costPrice: baseOpt.buy_price ?? baseOpt.costPrice ?? "",
        sellingPrice: baseOpt.sell_price ?? baseOpt.sellingPrice ?? "",
        unit: baseOpt.unit ?? "pc",
        category: baseOpt.category ?? "",
        variant: first.name,
        sku: first.sku,
        batchTracking: !!(baseOpt.batch_tracking || (baseOpt.datas && baseOpt.datas.batch_tracking)),
        serialTracking: !!(baseOpt.serial_tracking || (baseOpt.datas && baseOpt.datas.serial_tracking))
      };

      const otherVariants = variantsToAdd.slice(1).map(v => ({
        ...next[targetIdx],
        id: Math.random().toString(),
        variant: v.name,
        sku: v.sku,
        batchTracking: !!(baseOpt.batch_tracking || (baseOpt.datas && baseOpt.datas.batch_tracking)),
        serialTracking: !!(baseOpt.serial_tracking || (baseOpt.datas && baseOpt.datas.serial_tracking))
      }));

      next.splice(targetIdx + 1, 0, ...otherVariants);
      return next;
    });

    setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
    setSelectedVariants(new Set());
  };

  const themeColor = type === "PURCHASE" ? "indigo" : "emerald";
  const typeText = type === "PURCHASE" ? "Purchase" : "Production";

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Variant Modal */}
      {variantModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-${themeColor}-50 flex items-center justify-center text-${themeColor}-600 border border-${themeColor}-100`}>
                  <PackageOpen size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Select Variants</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Variations for <span className="text-slate-600 font-medium">{variantModal.baseProduct}</span></p>
                </div>
              </div>
              <button
                onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variantModal.variants.map((variant) => {
                  const isSelected = selectedVariants.has(variant.id);
                  return (
                    <div
                      key={variant.id}
                      onClick={() => {
                        const next = new Set(selectedVariants);
                        if (next.has(variant.id)) next.delete(variant.id);
                        else next.add(variant.id);
                        setSelectedVariants(next);
                      }}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                    >
                      <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm pr-6">{variant.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-medium">SKU: {variant.sku}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500"><span className="text-indigo-600 font-semibold">{selectedVariants.size}</span> selected</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })}
                  className="px-5 h-9 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <GradientButton onClick={confirmVariants} disabled={selectedVariants.size === 0} className="rounded-xl px-6 h-9 text-xs">
                  Add Items
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-${themeColor}-50 flex items-center justify-center text-${themeColor}-600 border border-${themeColor}-100`}>
            <Package size={17} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Inventory Items</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Add products to this {typeText.toLowerCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Cost Method Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5">
            {["None", "By Unit", "By Value"].map((method) => (
              <button
                key={method}
                onClick={() => setCostMethod(method)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                  costMethod === method
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
          <button
            onClick={addProduct}
            className={`flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-${themeColor}-600 text-white text-[11px] font-medium shadow-sm hover:bg-${themeColor}-700 transition-all active:scale-95`}
          >
            <Plus size={14} />
            Add Item
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="p-4 space-y-3">
        {products.map((product, index) => (
          <ProductRow
            key={product.id}
            product={product}
            index={index}
            themeColor={themeColor}
            type={type}
            stats={{ 
              allocation: stats.allocations[index], 
              totalCharges: stats.totalCharges 
            }}
            expandedBreakdown={expandedBreakdown}
            expandedSettings={expandedSettings}
            collapsedProducts={collapsedProducts}
            handleProductChange={handleProductChange}
            updateProductFields={updateProductFields}
            removeProduct={removeProduct}
            toggleBreakdown={toggleBreakdown}
            toggleSettings={toggleSettings}
            toggleCollapse={toggleCollapse}
            setVariantModal={setVariantModal}
            setSelectedVariants={setSelectedVariants}
          />
        ))}

        {/* Add another row */}
        <button
          onClick={addProduct}
          className="w-full group flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50/50 transition-all duration-200"
        >
          <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
          <span className="text-xs font-medium">Add Another Item</span>
        </button>
      </div>
    </div>
  );
});