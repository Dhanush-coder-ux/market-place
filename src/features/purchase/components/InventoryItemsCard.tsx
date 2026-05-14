import {
  Plus,
  Trash2,
  Settings,
  Info,
  Check,
  PackageOpen,
  CalendarDays,
  Clock,
  X,
  Package
} from "lucide-react";
import { useState, useEffect, Fragment } from "react";
import { createPortal } from "react-dom";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { inventoryApi } from "@/services/api/inventory";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { useToast } from "@/context/ToastContext";
import { InlineSerialManager } from "@/components/common/InlineSerialManager";

interface InventoryItemsCardProps {
  products: any[];
  stats: any;
  costMethod: string;
  setCostMethod: (method: string) => void;
  type?: "PURCHASE" | "PRODUCTION";
  handleProductChange: (index: number, field: string, value: any) => void;
  updateProductFields: (index: number, updates: any) => void;
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  addProduct: () => void;
  removeProduct: (index: number) => void;
  // 💡 NEW: Added this prop to receive the modal trigger from GrnForm
  onAddNewProduct?: (query: string) => void;
  purchaseType?: string;
}

export const InventoryItemsCard = ({
  products,
  stats,
  costMethod,
  setCostMethod,
  type = "PURCHASE",
  handleProductChange,
  updateProductFields,
  setProducts,
  addProduct,
  removeProduct,
  onAddNewProduct,
  purchaseType
}: InventoryItemsCardProps) => {
  const [expandedBreakdown, setExpandedBreakdown] = useState<Set<number>>(new Set());
  const [expandedSettings, setExpandedSettings] = useState<Set<number>>(new Set());

  const { showToast } = useToast();

  const [variantModal, setVariantModal] = useState<{
    isOpen: boolean;
    baseProduct: string;
    targetRowIndex: number;
    variants: any[];
    baseData: any;
  }>({
    isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null
  });
  const [selectedVariants, setSelectedVariants] = useState<string | null>(null);
  const [batchModal, setBatchModal] = useState<{
    isOpen: boolean;
    rowIndex: number;
    batches: any[];
    productName: string;
    variantName: string;
    existingSerials: string[];
    allowNewBatch: boolean;
  }>({ isOpen: false, rowIndex: -1, batches: [], productName: "", variantName: "", existingSerials: [], allowNewBatch: true });

  useEffect(() => {
    if (variantModal.isOpen || batchModal.isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [variantModal.isOpen, batchModal.isOpen]);

  const toggleBreakdown = (index: number) => {
    const next = new Set(expandedBreakdown);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedBreakdown(next);
  };

  const toggleSettings = (index: number) => {
    const next = new Set(expandedSettings);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedSettings(next);
  };



  const confirmVariants = () => {
    if (!selectedVariants) {
      setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
      return;
    }

    setProducts(prev => {
      const next = [...prev];
      const baseOpt = variantModal.baseData;
      const selectedId = selectedVariants;
      const variantItem = variantModal.variants.find(v => v.id === selectedId);
      const targetIdx = variantModal.targetRowIndex;

      if (!variantItem) return prev;

      // 💡 Prevent selecting same variant already in another row
      const isDuplicate = prev.some((p, i) => i !== targetIdx && p.inventory_id === (baseOpt.id || baseOpt.inventory_id) && p.variant_id === variantItem.id);
      if (isDuplicate) {
        showToast(`${variantItem.name} is already added to the list.`, "error");
        return prev;
      }

      const hasBatchTracking = !!(baseOpt.batch_tracking || baseOpt.has_batch_tracking || baseOpt.has_batch || (baseOpt.datas && (baseOpt.datas.batch_tracking || baseOpt.datas.has_batch_tracking || baseOpt.datas.has_batch)));
      const hasSerialTracking = !!(baseOpt.serial_tracking || baseOpt.has_serialno_tracking || baseOpt.has_serialno || (baseOpt.datas && (baseOpt.datas.serial_tracking || baseOpt.datas.has_serialno_tracking || baseOpt.datas.has_serialno)));

      const d = baseOpt.datas || baseOpt;
      const allVariants = baseOpt.variants || baseOpt.varients || d.combinations || d.varients || d.variants || [];
      const variantData = allVariants.find((v: any) => v.id === selectedId);

      const rawSerials = variantData?.serial_numbers || variantData?.serial_number || variantData?.datas?.serial_numbers || variantData?.datas?.serial_number || baseOpt.serial_numbers || baseOpt.serial_number || baseOpt.datas?.serial_numbers || baseOpt.datas?.serial_number;
      const parsedSerials = Array.isArray(rawSerials)
        ? rawSerials
        : (rawSerials?.serial_numbers || rawSerials?.serial_number || []);
      const serialnoId = rawSerials?.id || variantData?.serialno_id || variantData?.serial_number?.id || variantData?.datas?.serial_number?.id || baseOpt.serialno_id || d.serialno_id;

      // Extract prices and tax from variant or base
      const getVal = (key: string, fallback: any = "") => variantData?.[key] ?? variantData?.datas?.[key] ?? baseOpt[key] ?? baseOpt.datas?.[key] ?? fallback;

      next[targetIdx] = {
        ...next[targetIdx],
        inventory_id: baseOpt.id || baseOpt.inventory_id,
        variant_id: variantItem.id,
        name: variantModal.baseProduct,
        costPrice: getVal("buy_price", getVal("costPrice")),
        sellingPrice: getVal("sell_price", getVal("sellingPrice")),
        taxGst: parseInt(getVal("gst", "18")) || 18,
        unit: getVal("unit", "pc"),
        category: getVal("category"),
        variant: variantItem.name,
        sku: variantItem.sku || getVal("barcode", getVal("sku")),
        batchTracking: hasBatchTracking,
        serialTracking: hasSerialTracking,
        existingSerials: parsedSerials,
        serialno_id: serialnoId,
        batch_id: variantData?.batch_id || variantData?.datas?.batch_id || baseOpt.batch_id || d.batch_id
      };

      // If it has batches, show batch modal (Suppressed for PURCHASE type)
      if (hasBatchTracking && (type !== "PURCHASE" || purchaseType === "DIRECT")) {
        const batches = variantData?.batches || variantData?.datas?.batches || baseOpt.batches || d.batches || [];
        const isPoCreate = purchaseType === 'PO_CREATE';

        setBatchModal({
          isOpen: true,
          rowIndex: targetIdx,
          batches: Array.isArray(batches) ? batches : (typeof batches === 'string' ? JSON.parse(batches || "[]") : []),
          productName: variantModal.baseProduct,
          variantName: variantItem.name,
          existingSerials: parsedSerials,
          allowNewBatch: !isPoCreate,
        });
      }

      return next;
    });

    setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
    setSelectedVariants(null);
  };

  const selectBatch = (rowIndex: number, batch: any) => {
    const batchSerials = Array.isArray(batch.serial_numbers)
      ? batch.serial_numbers
      : Array.isArray(batch.serial_number)
        ? batch.serial_number
        : (batch.serial_numbers?.serial_numbers || batch.serial_number?.serial_numbers || []);

    updateProductFields(rowIndex, {
      batchNum: batch.name || batch.batch_number,
      batch_id: batch.id,
      serialno_id: batch.serial_numbers?.id || batch.serial_number?.id || products[rowIndex]?.serialno_id,
      existingSerials: batchSerials.length > 0 ? batchSerials : batchModal.existingSerials,
      manufacturingDate: (batch.manufacturing_date || batch.mfg_date) ? new Date(batch.manufacturing_date || batch.mfg_date).toISOString().split('T')[0] : "",
      expiryDate: batch.expiry_date ? new Date(batch.expiry_date).toISOString().split('T')[0] : "",
      batchNumReadOnly: true
    });
    setBatchModal({ isOpen: false, rowIndex: -1, batches: [], productName: "", variantName: "", existingSerials: [], allowNewBatch: true });
  };

  const themeColor = type === "PURCHASE" ? "indigo" : "emerald";
  const typeText = type === "PURCHASE" ? "Purchase" : "Production";

  return (
    <>
      {/* Variant Modal — rendered outside the card to avoid overflow clipping */}
      {variantModal.isOpen && createPortal(
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

            <div className="p-6 max-h-[50vh] overflow-y-auto modal-content bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variantModal.variants.map((variant) => {
                  const isSelected = selectedVariants === variant.id;
                  return (
                    <div
                      key={variant.id}
                      onClick={() => setSelectedVariants(variant.id)}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                    >
                      <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm pr-6">{variant.name}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[10px] text-slate-400   font-medium">Barcode: {variant.sku}</p>
                        {variant.batchCount > 0 && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                            <Package size={8} /> {variant.batchCount} Batches
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500">Pick a variation to continue</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })}
                  className="px-5 h-9 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <GradientButton onClick={confirmVariants} disabled={!selectedVariants} className="rounded-xl px-6 h-9 text-xs">
                  Continue
                </GradientButton>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Batch Modal — rendered outside the card to avoid overflow clipping */}
      {batchModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-amber-50/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Select Batch</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {batchModal.productName} {batchModal.variantName ? `(${batchModal.variantName})` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBatchModal({ isOpen: false, rowIndex: -1, batches: [], productName: "", variantName: "", existingSerials: [], allowNewBatch: true })}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto modal-content space-y-3">
              {batchModal.allowNewBatch && (
                <button
                  onClick={() => {
                    updateProductFields(batchModal.rowIndex, { batch_id: undefined, batchNum: "", batchNumReadOnly: false });
                    setBatchModal({ isOpen: false, rowIndex: -1, batches: [], productName: "", variantName: "", existingSerials: [], allowNewBatch: true });
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex flex-col items-center gap-1 group"
                >
                  <Plus size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold  ">Create New Batch</span>
                </button>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px]  font-bold text-slate-300">
                  <span className="bg-white px-2">Existing Batches</span>
                </div>
              </div>

              {batchModal.batches.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {batchModal.batches.map((batch: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => selectBatch(batchModal.rowIndex, batch)}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-md transition-all text-left group"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                          {batch.name || batch.batch_number}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1"><CalendarDays size={10} /> Mfg: {(batch.manufacturing_date || batch.mfg_date) ? new Date(batch.manufacturing_date || batch.mfg_date).toLocaleDateString() : 'N/A'}</span>
                          <span className="flex items-center gap-1"><Clock size={10} className="text-rose-400" /> Exp: {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400  font-bold ">In Stock</p>
                        <p className="text-xs font-black text-slate-700">{batch.stocks || 0} pcs</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 font-medium italic">No existing batches found</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
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
              {["None", "By Unit", "By Value", "Equally"].map((method) => (
                <button
                  key={method}
                  onClick={() => setCostMethod(method)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${costMethod === method
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

        {/* Product Table */}
        <div className="overflow-x-auto pf-scroll">
          <table className="w-full border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-14">#</th>
                <th className="py-4 px-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider min-w-[320px]">Item Description</th>
                <th className="py-4 px-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider w-28">Qty / Unit</th>
                <th className="py-4 px-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-36">{type === "PURCHASE" ? "Buy Price" : "Material Cost"}</th>
                <th className="py-4 px-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-32">Subtotal</th>
                <th className="py-4 px-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">Tax (GST)</th>
                <th className="py-4 px-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-48">Pricing & Margin</th>
                <th className="py-4 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {products.map((product, index) => {
                const q = Number(product.quantity) || 0;
                const baseCost = Number(product.costPrice) || 0;
                const rowTotal = q * baseCost;
                const hasProduct = !!product.name;

                const allocTotal = stats.allocations[index]?.alloc || 0;
                const allocPerUnit = q > 0 ? allocTotal / q : 0;
                const netCostPerUnit = stats.allocations[index]?.netCostPerUnit || baseCost;

                let computedSellPrice = Number(product.sellingPrice) || 0;
                if (product.marginType === "percent" && Number(product.marginPercent) > 0) {
                  computedSellPrice = netCostPerUnit * (1 + Number(product.marginPercent) / 100);
                } else if (product.marginType === "amount" && Number(product.marginAmount) > 0) {
                  computedSellPrice = netCostPerUnit + Number(product.marginAmount);
                }

                const effectiveMarginPct = netCostPerUnit > 0 && computedSellPrice > 0
                  ? (((computedSellPrice - netCostPerUnit) / netCostPerUnit) * 100).toFixed(1)
                  : null;

                const isExpanded = expandedSettings.has(index) || expandedBreakdown.has(index) || product.batchTracking || product.serialTracking;

                return (
                  <Fragment key={product.id}>
                    <tr
                      className={`group transition-all hover:bg-slate-50/50 ${!hasProduct ? 'bg-slate-50/10' : ''}`}
                    >
                      {/* Index */}
                      <td className="py-3 px-6 align-middle">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${hasProduct ? `bg-${themeColor}-600 text-white shadow-sm shadow-${themeColor}-200` : 'bg-slate-100 text-slate-400'}`}>
                          {index + 1}
                        </div>
                      </td>

                      {/* Product search */}
                      <td className="py-3 px-2 align-middle">
                        <div className="flex flex-col gap-1.5">
                          <SearchSelect
                            labelKey="name"
                            valueKey="id"
                            fetchOptions={async (q) => await inventoryApi.searchInventories(q)}
                            options={product.inventory_id ? [{ id: product.inventory_id, name: product.name }] as any[] : []}
                            value={product.inventory_id}
                            onCreateNew={onAddNewProduct}
                            onChange={(val, opt: any) => {
                              if (opt) {
                                // 💡 Prevent selecting same product already in another row
                                const isDuplicate = products.some((p, i) => i !== index && p.inventory_id === opt.id && !opt.is_variant);
                                if (isDuplicate && !opt.is_variant) {
                                  showToast(`${opt.name} is already added to the list.`, "error");
                                  return;
                                }

                                const d = opt.datas || {};
                                const get = (key: string, fallback: any = "") => opt[key] ?? d[key] ?? fallback;

                                const hasBatchTracking = !!(get("batch_tracking") || get("has_batch_tracking") || get("has_batch"));
                                const hasSerialTracking = !!(get("serial_tracking") || get("has_serialno_tracking") || get("has_serialno"));

                                const rawSerials = opt.serial_numbers || opt.serial_number || d.serial_numbers || d.serial_number;
                                const existingSerials = Array.isArray(rawSerials) ? rawSerials : (rawSerials?.serial_numbers || rawSerials?.serial_number || []);
                                const serialnoId = opt.serialno_id || d.serialno_id || rawSerials?.id || opt.serial_number?.id || d.serial_number?.id || opt.serial_numbers?.id || d.serial_numbers?.id;
                                const combinations = opt.variants || opt.varients || d.combinations || d.varients || d.variants || [];

                                if (opt.is_variant) {
                                  updateProductFields(index, {
                                    inventory_id: opt.id,
                                    variant_id: opt.variant_id,
                                    name: (opt.name || "").split(" (")[0],
                                    variant: opt.variant_name,
                                    costPrice: get("buy_price"),
                                    sellingPrice: get("sell_price"),
                                    taxGst: parseInt(get("gst", "18")) || 18,
                                    sku: get("barcode", get("sku")),
                                    unit: get("unit", "pc"),
                                    category: get("category"),
                                    batchTracking: hasBatchTracking,
                                    serialTracking: hasSerialTracking,
                                    existingSerials: existingSerials,
                                    serialno_id: serialnoId,
                                    batch_id: opt.batch_id || d.batch_id || opt.id,
                                    baseVariants: combinations
                                  });

                                  if (hasBatchTracking && (type !== "PURCHASE" || purchaseType === "DIRECT")) {
                                    const batches = opt.batches || d.batches || [];
                                    setBatchModal({
                                      isOpen: true,
                                      rowIndex: index,
                                      batches: Array.isArray(batches) ? batches : (typeof batches === 'string' ? JSON.parse(batches || "[]") : []),
                                      productName: opt.name.split(" (")[0],
                                      variantName: opt.variant_name,
                                      existingSerials: existingSerials,
                                      allowNewBatch: purchaseType !== 'PO_CREATE'
                                    });
                                  }
                                  return;
                                }

                                const hasVariants = get("has_variants", get("has_variant"));

                                if (purchaseType === 'PO_CREATE') {
                                  if (hasVariants && combinations.length > 0) {
                                    const mappedVariants = combinations.map((c: any) => ({
                                      id: c.id,
                                      name: c.name || Object.values(c.attributes || c.datas?.attributes || {}).join(" - ") || c.barcode || "Variant",
                                      sku: c.barcode || opt.barcode,
                                      stock: c.stocks || c.stock || opt.stocks || 0,
                                      batchCount: Array.isArray(c.batches) ? c.batches.length : 0,
                                    }));
                                    setVariantModal({ isOpen: true, baseProduct: opt.name || String(val), targetRowIndex: index, variants: mappedVariants, baseData: opt });
                                    setSelectedVariants(null);
                                  } else {
                                    updateProductFields(index, {
                                      inventory_id: opt.id,
                                      name: opt.name || d.name || String(val),
                                      costPrice: get("buy_price", get("costPrice")),
                                      sellingPrice: get("sell_price", get("sellingPrice")),
                                      taxGst: parseInt(get("gst", "18")) || 18,
                                      sku: get("barcode", get("sku")),
                                      unit: get("unit", "pc"),
                                      category: get("category"),
                                      batchTracking: hasBatchTracking,
                                      serialTracking: false,
                                      serialno_id: serialnoId,
                                      batch_id: opt.batch_id || d.batch_id || opt.id
                                    });
                                  }
                                  return;
                                }

                                if (hasVariants && combinations.length > 0) {
                                  const mappedVariants = combinations.map((c: any) => ({
                                    id: c.id,
                                    name: c.name || Object.values(c.attributes || c.datas?.attributes || {}).join(" - ") || c.barcode || "Variant",
                                    sku: c.barcode || opt.barcode,
                                    stock: c.stocks || c.stock || opt.stocks || 0,
                                    batchCount: Array.isArray(c.batches) ? c.batches.length : (c.batches ? (typeof c.batches === 'string' ? JSON.parse(c.batches).length : 0) : 0),
                                  }));
                                  setVariantModal({ isOpen: true, baseProduct: opt.name || String(val), targetRowIndex: index, variants: mappedVariants, baseData: opt });
                                  setSelectedVariants(null);
                                } else {
                                  updateProductFields(index, {
                                    inventory_id: opt.id,
                                    variant_id: undefined,
                                    name: opt.name || d.name || String(val),
                                    costPrice: get("buy_price", get("costPrice")),
                                    sellingPrice: get("sell_price", get("sellingPrice")),
                                    taxGst: parseInt(get("gst", "18")) || 18,
                                    sku: get("barcode", get("sku")),
                                    unit: get("unit", "pc"),
                                    category: get("category"),
                                    batchTracking: hasBatchTracking,
                                    serialTracking: hasSerialTracking,
                                    existingSerials: existingSerials,
                                    serialno_id: serialnoId,
                                    hasVariants: false,
                                    baseVariants: combinations
                                  });

                                  if (hasBatchTracking && (type !== "PURCHASE" || purchaseType === "DIRECT")) {
                                    const batches = opt.batches || d.batches || [];
                                    setBatchModal({
                                      isOpen: true,
                                      rowIndex: index,
                                      batches: Array.isArray(batches) ? batches : (typeof batches === 'string' ? JSON.parse(batches || "[]") : []),
                                      productName: (opt.name || d.name || String(val || "")).split(" (")[0],
                                      variantName: "",
                                      existingSerials: existingSerials,
                                      allowNewBatch: purchaseType !== 'PO_CREATE'
                                    });
                                  }
                                }
                              } else {
                                handleProductChange(index, "name", String(val));
                              }
                            }}
                            placeholder="Find or add product..."
                            className="!h-10 text-sm"
                          />
                          {hasProduct && (
                            <div className="flex flex-wrap items-center gap-1.5 px-1">
                              {product.variant && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded bg-${themeColor}-50 text-${themeColor}-600 text-[9px] font-black border border-${themeColor}-100`}>
                                  {product.variant}
                                </span>
                              )}
                              {product.sku && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-mono border border-slate-200">
                                  {product.sku}
                                </span>
                              )}
                              {product.serialTracking && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-black border border-blue-100">
                                  <Check size={9} /> Serials
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Qty / Unit */}
                      <td className="py-3 px-2 align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <Input
                            type="number"
                            value={product.quantity as any}
                            onChange={(e) => handleProductChange(index, "quantity", e.target.value ? Number(e.target.value) : "")}
                            className="!h-9 !w-20 !text-xs text-center font-black rounded-lg border-slate-200 shadow-sm"
                          />
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{product.unit || 'pc'}</span>
                        </div>
                      </td>

                      {/* Buy Price */}
                      <td className="py-3 px-2 align-middle">
                        <Input
                          type="number"
                          value={product.costPrice as any}
                          onChange={(e) => handleProductChange(index, "costPrice", e.target.value ? Number(e.target.value) : "")}
                          className="!h-9 !text-xs font-black rounded-lg border-slate-200 shadow-sm"
                          leftIcon={<span className="text-[10px] text-slate-400 font-black">₹</span>}
                        />
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-2 align-middle">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800 tabular-nums">₹{rowTotal.toLocaleString()}</span>
                          {allocPerUnit > 0 && (
                            <span className="text-[9px] text-blue-500 font-bold mt-0.5">+₹{allocTotal.toLocaleString()}</span>
                          )}
                        </div>
                      </td>

                      {/* Tax */}
                      <td className="py-3 px-2 align-middle">
                        <div className="w-20">
                          <ReusableSelect
                            options={[
                              { value: '0', label: '0%' },
                              { value: '5', label: '5%' },
                              { value: '12', label: '12%' },
                              { value: '18', label: '18%' },
                              { value: '28', label: '28%' }
                            ]}
                            value={String(product.taxGst)}
                            onValueChange={(val) => handleProductChange(index, "taxGst", Number(val))}
                            placeholder="GST"
                            className="!h-8 !text-[11px]"
                          />
                        </div>
                      </td>

                      {/* Pricing & Margin */}
                      <td className="py-3 px-2 align-middle">
                        <div className="w-44 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1">
                            <div className="flex bg-slate-100 rounded-lg p-0.5 shrink-0">
                              <button
                                onClick={() => handleProductChange(index, "marginType", "percent")}
                                className={`w-6 h-6 flex items-center justify-center rounded-md text-[9px] font-bold transition-all ${product.marginType === "percent" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
                              >
                                %
                              </button>
                              <button
                                onClick={() => handleProductChange(index, "marginType", "amount")}
                                className={`w-6 h-6 flex items-center justify-center rounded-md text-[9px] font-bold transition-all ${product.marginType === "amount" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
                              >
                                ₹
                              </button>
                              <button
                                onClick={() => handleProductChange(index, "marginType", "sellingPrice")}
                                className={`w-6 h-6 flex items-center justify-center rounded-md text-[9px] font-bold transition-all ${product.marginType === "sellingPrice" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
                              >
                                SP
                              </button>
                            </div>
                            <div className="flex-1">
                              <Input
                                type="number"
                                value={(product.marginType === "percent" ? product.marginPercent : product.marginType === "amount" ? product.marginAmount : product.sellingPrice) as any}
                                onChange={(e) => handleProductChange(index, product.marginType === "percent" ? "marginPercent" : product.marginType === "amount" ? "marginAmount" : "sellingPrice", e.target.value ? Number(e.target.value) : "")}
                                className="!h-7 !text-[11px] !font-bold"
                                placeholder={product.marginType === "sellingPrice" ? "Price" : "Margin"}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between px-2 py-0.5 bg-emerald-50/50 border border-emerald-100 rounded-md">
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Final SP</span>
                            <span className="text-[11px] font-black text-emerald-700 tabular-nums">
                              ₹{computedSellPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleBreakdown(index)}
                            className={`p-1.5 rounded-lg transition-all ${expandedBreakdown.has(index) ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                            title="Cost breakdown"
                          >
                            <Info size={14} />
                          </button>
                          <button
                            onClick={() => toggleSettings(index)}
                            className={`p-1.5 rounded-lg transition-all ${expandedSettings.has(index) ? `bg-${themeColor}-600 text-white` : `text-slate-400 hover:bg-slate-100`}`}
                            title="Settings"
                          >
                            <Settings size={14} />
                          </button>
                          <button
                            onClick={() => removeProduct(index)}
                            disabled={products.length === 1}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-20 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Sub-row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="p-0 border-b border-slate-100">
                          <div className="px-12 py-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            
                            {/* Row 1: Batch & Serial Tracking */}
                            <div className="flex gap-4">
                              {/* Batch Section */}
                              {(type !== "PURCHASE" || purchaseType === "DIRECT") && product.batchTracking && (
                                <div className="flex-1 bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Package size={14} className="text-amber-500" />
                                    <span className="text-xs font-bold text-amber-900">Batch Details</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3">
                                    <Input
                                      label="Batch #"
                                      value={product.batchNum}
                                      onChange={(e) => handleProductChange(index, "batchNum", e.target.value)}
                                      disabled={product.batchNumReadOnly}
                                      className="!h-9 !text-xs"
                                    />
                                    <Input
                                      label="Mfg Date"
                                      type="date"
                                      value={product.manufacturingDate}
                                      onChange={(e) => handleProductChange(index, "manufacturingDate", e.target.value)}
                                      disabled={product.batchNumReadOnly}
                                      className="!h-9 !text-xs"
                                    />
                                    <Input
                                      label="Expiry Date"
                                      type="date"
                                      value={product.expiryDate}
                                      onChange={(e) => handleProductChange(index, "expiryDate", e.target.value)}
                                      disabled={product.batchNumReadOnly}
                                      className="!h-9 !text-xs"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Serial Section */}
                              {(type !== "PURCHASE" || purchaseType === "DIRECT") && product.serialTracking && (
                                <div className="flex-1 bg-white p-4 rounded-2xl border border-blue-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Check size={14} className="text-blue-500" />
                                    <span className="text-xs font-bold text-blue-900">Serial Numbers</span>
                                  </div>
                                  <InlineSerialManager
                                    serials={(product.serialNumbers || "").split(',').filter(Boolean)}
                                    serialLabel="Serial"
                                    onUpdate={(next) => handleProductChange(index, "serialNumbers", next.join(','))}
                                    limit={q}
                                    existingSerials={product.existingSerials}
                                    validationType="increase"
                                    onValidationError={(msg) => showToast(msg, "error")}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Row 2: Settings & Breakdown */}
                            <div className="flex gap-4">
                              {expandedSettings.has(index) && (
                                <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Settings size={14} className="text-slate-500" />
                                    <span className="text-xs font-bold text-slate-800">Additional Settings</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-400 ml-1 mb-1 block">Storage Location</label>
                                      <ReusableSelect
                                        options={[
                                          { value: 'Warehouse A', label: 'Warehouse A' },
                                          { value: 'Cold Storage', label: 'Cold Storage' },
                                          { value: 'Main Rack', label: 'Main Rack' }
                                        ]}
                                        value={product.storageLoc}
                                        onValueChange={(val) => handleProductChange(index, "storageLoc", val)}
                                        className="!h-9"
                                      />
                                    </div>
                                    <Input
                                      label="Reorder Threshold"
                                      type="number"
                                      value={product.reorderPoint as any}
                                      onChange={(e) => handleProductChange(index, "reorderPoint", e.target.value ? Number(e.target.value) : "")}
                                      className="!h-9 !text-xs"
                                    />
                                  </div>
                                </div>
                              )}

                              {expandedBreakdown.has(index) && (
                                <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Info size={14} className="text-slate-500" />
                                    <span className="text-xs font-bold text-slate-800">Cost Breakdown</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">Unit Cost (Base)</span>
                                        <span className="font-bold text-slate-700">₹{baseCost.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-blue-500">Allocated Cost</span>
                                        <span className="font-bold text-blue-600">₹{allocPerUnit.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                                        <span className="font-bold text-slate-800">Net Cost / Unit</span>
                                        <span className="font-black text-emerald-600">₹{netCostPerUnit.toFixed(2)}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">Row Subtotal</span>
                                        <span className="font-bold text-slate-700">₹{rowTotal.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-emerald-500">Expected Margin</span>
                                        <span className="font-bold text-emerald-600">{effectiveMarginPct || '0'}%</span>
                                      </div>
                                      <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                                        <span className="font-bold text-slate-800">Profit / Unit</span>
                                        <span className="font-black text-emerald-600">₹{(computedSellPrice - netCostPerUnit).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add another row */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
          <button
            onClick={addProduct}
            className="w-full group flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-white transition-all duration-200"
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
            <span className="text-xs font-bold">Add Another Item</span>
          </button>
        </div>
      </div>
    </>
  );
};
