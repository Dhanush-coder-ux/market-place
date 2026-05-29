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
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { useToast } from "@/context/ToastContext";
import { InlineSerialManager } from "@/components/common/InlineSerialManager";

interface InventoryItemsCardProps {
  products: any[];
  stats: any;
  type?: "PURCHASE" | "PRODUCTION";
  handleProductChange: (index: number, field: string, value: any) => void;
  updateProductFields: (index: number, updates: any) => void;
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  addProduct: () => void;
  removeProduct: (index: number) => void;
  // 💡 NEW: Added this prop to receive the modal trigger from GrnForm
  onAddNewProduct?: (query: string) => void;
  purchaseType?: string;
  costMethod?: string;
  setCostMethod?: (val: string) => void;
  gstMode?: "inclusive" | "exclusive";
  setGstMode?: (val: "inclusive" | "exclusive") => void;
}

export const InventoryItemsCard = ({
  products,
  stats,
  type = "PURCHASE",
  handleProductChange,
  updateProductFields,
  setProducts,
  addProduct,
  removeProduct,
  onAddNewProduct,
  purchaseType,
  gstMode = "inclusive",
  setGstMode,
}: InventoryItemsCardProps) => {
  const [expandedBreakdown, setExpandedBreakdown] = useState<Set<number>>(new Set());
  const [expandedSettings, setExpandedSettings] = useState<Set<number>>(new Set());
  const [autoExpanded, setAutoExpanded] = useState<Set<string>>(new Set());

  const { showToast } = useToast();

  useEffect(() => {
    products.forEach((p, idx) => {
      if (!p.id) return;
      const needsDetails = p.batchTracking || p.serialTracking;
      if (needsDetails && !autoExpanded.has(p.id)) {
        setExpandedSettings(prev => {
          const next = new Set(prev);
          next.add(idx);
          return next;
        });
        setAutoExpanded(prev => {
          const next = new Set(prev);
          next.add(p.id);
          return next;
        });
      }
    });
  }, [products, autoExpanded]);

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

      const hasBatchTracking = !!(baseOpt.batch_tracking || baseOpt.has_batch_tracking || baseOpt.has_batch || (baseOpt.datas && (baseOpt.datas.batch_tracking || baseOpt.datas.has_batch_tracking || baseOpt.datas.has_batch)));
      const hasSerialTracking = !!(baseOpt.serial_tracking || baseOpt.has_serialno_tracking || baseOpt.has_serialno || (baseOpt.datas && (baseOpt.datas.serial_tracking || baseOpt.datas.has_serialno_tracking || baseOpt.datas.has_serialno)));

      // 💡 Prevent selecting same variant already in another row, UNLESS it has batch or serial tracking
      if (!hasBatchTracking && !hasSerialTracking) {
        const isDuplicate = prev.some((p, i) => i !== targetIdx && p.inventory_id === (baseOpt.id || baseOpt.inventory_id) && p.variant_id === variantItem.id);
        if (isDuplicate) {
          showToast(`${variantItem.name} is already added to the list.`, "error");
          return prev;
        }
      }

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
        batch_id: variantData?.batch_id || variantData?.datas?.batch_id || baseOpt.batch_id || d.batch_id,
        reorderPoint: getVal("reorder_point") !== "" ? getVal("reorder_point") : undefined,
        storageLoc: getVal("storage_location") || getVal("location") || "",
        brand: getVal("brand"),
        gstInfo: getVal("gst") || (parseInt(getVal("gst", "18")) || 18) + "%"
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
    const p = products[rowIndex];
    const isDuplicate = products.some((existing, i) =>
      i !== rowIndex &&
      existing.inventory_id === p.inventory_id &&
      (p.variant_id ? existing.variant_id === p.variant_id : true) &&
      (existing.batch_id === batch.id || existing.batchNum === (batch.name || batch.batch_number))
    );

    if (isDuplicate) {
      showToast(`${batch.name || batch.batch_number} is already added. Please select a different batch.`, "error");
      return;
    }

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
        <div className="fixed inset-0 z-[100] flex flex-col items-center p-4 md:p-12 overflow-y-auto bg-slate-900/40 backdrop-blur-sm custom-scrollbar animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 my-auto shadow-indigo-200/20">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${themeColor}-50 flex items-center justify-center text-${themeColor}-600 border border-${themeColor}-100`}>
                  <PackageOpen size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Select Variants</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Variations for <span className="text-slate-600 font-medium">{variantModal.baseProduct}</span></p>
                </div>
              </div>
              <button
                onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 max-h-[50vh] overflow-y-auto modal-content bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {variantModal.variants.map((variant) => {
                  const isSelected = selectedVariants === variant.id;
                  return (
                    <div
                      key={variant.id}
                      onClick={() => setSelectedVariants(variant.id)}
                      className={`relative p-5 rounded-lg border-2 transition-all cursor-pointer group ${isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100' : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50/30'}`}
                    >
                      <div className={`absolute top-5 right-5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                        {isSelected && <Check size={12} strokeWidth={4} />}
                      </div>
                      <h4 className="font-black text-slate-800 text-sm pr-8 tracking-tight">{variant.name}</h4>
                      {variant.batchCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            <Package size={8} /> {variant.batchCount} Batches
                          </span>
                        </div>
                      )}
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
                  className="px-5 h-9 rounded-lg border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <GradientButton onClick={confirmVariants} disabled={!selectedVariants} className="rounded-lg px-6 h-9 text-xs">
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
        <div className="fixed inset-0 z-[110] flex flex-col items-center p-4 md:p-12 overflow-y-auto bg-slate-900/40 backdrop-blur-sm custom-scrollbar animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 my-auto animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-amber-50/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200">
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
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
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
                  className="w-full p-4 rounded-lg border-2 border-dashed border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex flex-col items-center gap-1 group"
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
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white hover:border-amber-300 hover:shadow-md transition-all text-left group"
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

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-${themeColor}-50 flex items-center justify-center text-${themeColor}-600 border border-${themeColor}-100`}>
              <Package size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Inventory Items</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Add products to this {typeText.toLowerCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {type === "PURCHASE" && gstMode && setGstMode && (
              <div className="flex bg-slate-100 rounded-lg p-0.5 shrink-0 border border-slate-200/55 shadow-inner h-9 items-center select-none">
                <button
                  type="button"
                  onClick={() => setGstMode("inclusive")}
                  className={`px-3 py-1 flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer h-7 ${
                    gstMode === "inclusive" 
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200/40" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Inclusive GST
                </button>
                <button
                  type="button"
                  onClick={() => setGstMode("exclusive")}
                  className={`px-3 py-1 flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer h-7 ${
                    gstMode === "exclusive" 
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200/40" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Exclusive GST
                </button>
              </div>
            )}

            <button
              onClick={addProduct}
              className={`flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-${themeColor}-600 text-white text-[11px] font-medium shadow-sm hover:bg-${themeColor}-700 transition-all active:scale-95`}
            >
              <Plus size={14} />
              Add Item
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto custom-scrollbar w-full" style={{ position: 'relative', minHeight: '300px' }}>
          <table className="min-w-[1110px] w-full border-collapse whitespace-nowrap" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
                <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ width: '60px' }}>#</th>
                <th className="py-4 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ width: '300px' }}>Item Description</th>
                <th className="py-4 px-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ width: '100px' }}>Qty / Unit</th>
                <th className="py-4 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ width: '140px' }}>{type === "PURCHASE" ? "Buy Price / Unit" : "Material Cost"}</th>
                <th className="py-4 px-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ width: '120px' }}>Subtotal</th>
                <th className="py-4 px-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ width: '110px' }}>Allocated</th>
                <th className="py-4 px-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ width: '100px' }}>Tax (GST)</th>
                <th className="py-4 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ width: '220px' }}>Pricing & Margin / Unit</th>
                <th className="py-4 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider" style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {products.map((product, index) => {
                const q = Number(product.quantity) || 0;
                const baseCost = Number(product.costPrice) || 0;
                const gstRate = Number(product.taxGst) || 0;
                const hasProduct = !!product.name;

                const rowBaseCost = gstMode === "inclusive"
                  ? baseCost / (1 + gstRate / 100)
                  : baseCost;
                const rowGstPerUnit = gstMode === "inclusive"
                  ? baseCost - rowBaseCost
                  : baseCost * (gstRate / 100);

                const rowTotal = q * rowBaseCost;
                const rowGstTotal = q * rowGstPerUnit;
                const rowGrandTotal = q * (rowBaseCost + rowGstPerUnit);

                const allocTotal = stats.allocations[index]?.alloc || 0;
                const allocPerUnit = q > 0 ? allocTotal / q : 0;
                const netCostPerUnit = stats.allocations[index]?.netCostPerUnit || rowBaseCost;
                const costForSp = rowBaseCost + rowGstPerUnit;
                const netCostForSp = costForSp + allocPerUnit;

                let computedSellPrice = Number(product.sellingPrice) || 0;
                if (product.marginType === "percent" && Number(product.marginPercent) > 0) {
                  computedSellPrice = netCostForSp * (1 + Number(product.marginPercent) / 100);
                } else if (product.marginType === "amount" && Number(product.marginAmount) > 0) {
                  computedSellPrice = netCostForSp + Number(product.marginAmount);
                }

                const effectiveMarginPct = netCostForSp > 0 && computedSellPrice > 0
                  ? (((computedSellPrice - netCostForSp) / netCostForSp) * 100).toFixed(1)
                  : null;

                const isExpanded = expandedSettings.has(index) || expandedBreakdown.has(index) || product.batchTracking || product.serialTracking;

                return (
                  <Fragment key={product.id}>
                    <tr
                      className={`group transition-all hover:bg-slate-50/50 ${!hasProduct ? 'bg-slate-50/10' : ''}`}
                    >
                      {/* Index */}
                      <td className="py-3 px-6 align-top">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${hasProduct ? `bg-${themeColor}-600 text-white shadow-sm shadow-${themeColor}-200` : 'bg-slate-100 text-slate-400'}`}>
                          {index + 1}
                        </div>
                      </td>

                      {/* Product search */}
                      <td className="py-3 px-2 align-top">
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
                                const d = opt.datas || {};
                                const get = (key: string, fallback: any = "") => opt[key] ?? d[key] ?? fallback;

                                const hasBatchTracking = !!(get("batch_tracking") || get("has_batch_tracking") || get("has_batch"));
                                const hasSerialTracking = !!(get("serial_tracking") || get("has_serialno_tracking") || get("has_serialno"));
                                const combinations = opt.variants || opt.varients || d.combinations || d.varients || d.variants || [];
                                const hasVariants = !!(get("has_variants", get("has_variant")) || combinations.length > 0 || opt.is_variant);

                                // 💡 Prevent selecting same product already in another row, UNLESS it has variant, batch or serial tracking
                                if (!hasVariants && !hasBatchTracking && !hasSerialTracking) {
                                  const isDuplicate = products.some((p, i) => i !== index && p.inventory_id === opt.id);
                                  if (isDuplicate) {
                                    showToast(`${opt.name} is already added to the list.`, "error");
                                    return;
                                  }
                                }

                                const rawSerials = opt.serial_numbers || opt.serial_number || d.serial_numbers || d.serial_number;
                                const existingSerials = Array.isArray(rawSerials) ? rawSerials : (rawSerials?.serial_numbers || rawSerials?.serial_number || []);
                                const serialnoId = opt.serialno_id || d.serialno_id || rawSerials?.id || opt.serial_number?.id || d.serial_number?.id || opt.serial_numbers?.id || d.serial_numbers?.id;


                                if (opt.is_variant) {
                                  if (!hasBatchTracking && !hasSerialTracking) {
                                    const isDuplicate = products.some((p, i) => i !== index && p.inventory_id === opt.id && p.variant_id === opt.variant_id);
                                    if (isDuplicate) {
                                      showToast(`${opt.name} is already added to the list.`, "error");
                                      return;
                                    }
                                  }

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
                                    baseVariants: combinations,
                                    reorderPoint: get("reorder_point") !== "" ? get("reorder_point") : undefined,
                                    storageLoc: get("storage_location") || get("location") || "",
                                    brand: get("brand"),
                                    gstInfo: get("gst") || (parseInt(get("gst", "18")) || 18) + "%"
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



                                if (purchaseType === 'PO_CREATE') {
                                  if (hasVariants && combinations.length === 0) {
                                    showToast("This product is marked as having variants, but no variants have been generated yet. Please generate variants in the Inventory module before purchasing.", "error");
                                    return;
                                  }

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
                                      batch_id: opt.batch_id || d.batch_id || opt.id,
                                      reorderPoint: get("reorder_point") !== "" ? get("reorder_point") : undefined,
                                      storageLoc: get("storage_location") || get("location") || "",
                                      brand: get("brand"),
                                      gstInfo: get("gst") || (parseInt(get("gst", "18")) || 18) + "%"
                                    });
                                  }
                                  return;
                                }

                                if (hasVariants && combinations.length === 0) {
                                  showToast("This product is marked as having variants, but no variants have been generated yet. Please generate variants in the Inventory module before purchasing.", "error");
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
                                    baseVariants: combinations,
                                    reorderPoint: get("reorder_point") !== "" ? get("reorder_point") : undefined,
                                    brand: get("brand"),
                                    gstInfo: get("gst") || (parseInt(get("gst", "18")) || 18) + "%"
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
                              {product.batchTracking && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border transition-all ${product.batchNum
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-rose-50/50 text-rose-600 border-rose-100/60 animate-pulse"
                                  }`}>
                                  <Package size={9} /> {product.batchNum ? `Batch: ${product.batchNum}` : "Batch Details Required"}
                                </span>
                              )}
                              {product.serialTracking && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border transition-all ${(product.serialNumbers?.split(",").filter(Boolean).length || 0) >= (Number(product.quantity) || 0)
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-rose-50/50 text-rose-600 border-rose-100/60 animate-pulse"
                                  }`}>
                                  <Check size={9} /> {
                                    (product.serialNumbers?.split(",").filter(Boolean).length || 0) >= (Number(product.quantity) || 0)
                                      ? `${product.serialNumbers?.split(",").filter(Boolean).length} Serials Set`
                                      : "Serials Required"
                                  }
                                </span>
                              )}
                              {product.taxGst !== undefined && product.taxGst !== null && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-pink-50 text-pink-700 text-[9px] font-black border border-pink-100">
                                  GST: {product.taxGst}%
                                </span>
                              )}
                              {(product.reorderPoint !== undefined && product.reorderPoint !== null && product.reorderPoint !== "") && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-[9px] font-black border border-orange-100">
                                  Reorder: {product.reorderPoint}
                                </span>
                              )}
                              {product.brand && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[9px] font-black border border-teal-100">
                                  Brand: {product.brand}
                                </span>
                              )}
                              {product.category && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[9px] font-black border border-sky-100">
                                  Category: {product.category}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Qty / Unit */}
                      <td className="py-3 px-2 align-top">
                        <div className="flex items-center justify-center">
                          <Input
                            type="number"
                            value={product.quantity as any}
                            onChange={(e) => handleProductChange(index, "quantity", e.target.value ? Number(e.target.value) : "")}
                            className="!h-9 !w-24 !text-xs font-black rounded-lg border-slate-200 shadow-sm"
                            rightIcon={<span className="text-[9px] text-slate-400 font-bold uppercase">{product.unit || 'pc'}</span>}
                          />
                        </div>
                      </td>

                      {/* Buy Price */}
                      <td className="py-3 px-2 align-top">
                        <div className="flex flex-col">
                          <Input
                            type="number"
                            value={product.costPrice as any}
                            onChange={(e) => handleProductChange(index, "costPrice", e.target.value ? Number(e.target.value) : "")}
                            className="!h-9 !text-xs font-black rounded-lg border-slate-200 shadow-sm min-w-[110px]"
                            leftIcon={<span className="text-[10px] text-slate-400 font-black">₹</span>}
                            rightIcon={<span className="text-[9px] text-slate-400 font-bold">/{product.unit || 'pc'}</span>}
                          />
                          {baseCost > 0 && (
                            <div className="text-[9px] text-slate-400 font-bold mt-1.5 leading-normal bg-blue-50/40 border border-blue-100/50 rounded-md px-2 py-1 select-none animate-in fade-in duration-200 flex flex-wrap gap-x-1 items-center">
                              <span>Base:</span>
                              <span className="text-slate-700 font-black">₹{rowBaseCost.toFixed(2)}</span>
                              <span className="mx-0.5 text-slate-350">|</span>
                              <span>GST:</span>
                              <span className="text-blue-600 font-black">+₹{rowGstPerUnit.toFixed(2)}</span>
                              <span className="mx-0.5 text-slate-350">|</span>
                              <span>Tot:</span>
                              <span className="text-emerald-600 font-black">₹{(rowBaseCost + rowGstPerUnit).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-2 align-top">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800 tabular-nums">₹{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          {q > 0 && (
                            <span className="text-[9.5px] text-slate-400 font-semibold mt-1">
                              Total: <span className="text-slate-600 font-bold">₹{rowGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Allocated */}
                      <td className="py-3 px-2 align-top">
                        <div className="h-9 flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-800 tabular-nums">
                            ₹{allocTotal > 0 ? allocTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                          </span>
                          {allocPerUnit > 0 && (
                            <span className="text-[9px] text-blue-500 font-bold whitespace-nowrap">
                              (+₹{allocPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/u)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tax */}
                      <td className="py-3 px-2 align-top">
                        <div className="flex flex-col">
                          <div className="relative flex items-center w-full w-20">
                            <input
                              type="number"
                              value={product.taxGst ?? ""}
                              onChange={(e) => handleProductChange(index, "taxGst", e.target.value ? Number(e.target.value) : 0)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none pr-6 bg-white"
                              min="0"
                              max="100"
                              placeholder="GST"
                            />
                            <span className="absolute right-2.5 text-[10px] text-slate-400 font-black pointer-events-none">%</span>
                          </div>
                          {rowGstTotal > 0 && (
                            <span className="text-[9px] font-bold text-slate-400 block mt-1.5">
                              GST: <span className="text-slate-600 font-black">₹{rowGstTotal.toFixed(2)}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pricing & Margin */}
                      <td className="py-3 px-2 align-top">
                        <div className="flex items-center gap-2">
                          <div className="flex bg-slate-100 rounded-lg p-0.5 shrink-0">
                            {["percent", "amount", "sellingPrice"].map((m) => (
                              <button
                                key={m}
                                onClick={() => handleProductChange(index, "marginType", m)}
                                className={`w-6 h-6 flex items-center justify-center rounded-md text-[9px] font-black transition-all ${product.marginType === m ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                {m === "percent" ? "%" : m === "amount" ? "₹" : "SP"}
                              </button>
                            ))}
                          </div>
                          <div className="flex-1 min-w-[70px]">
                            <Input
                              type="number"
                              value={(product.marginType === "percent" ? product.marginPercent : product.marginType === "amount" ? product.marginAmount : product.sellingPrice) as any}
                              onChange={(e) => handleProductChange(index, product.marginType === "percent" ? "marginPercent" : product.marginType === "amount" ? "marginAmount" : "sellingPrice", e.target.value ? Number(e.target.value) : "")}
                              className="!h-7 !text-[11px] !font-bold !w-full"
                              placeholder={product.marginType === "sellingPrice" ? "Price" : "Margin"}
                            />
                          </div>
                          <div className="flex items-center gap-1 px-1.5 py-1 bg-emerald-50/50 border border-emerald-100 rounded-md shrink-0">
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">SP</span>
                            <span className="text-[11px] font-black text-emerald-700 tabular-nums">
                              ₹{computedSellPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 align-top text-right">
                        <div className="h-9 w-full flex items-center justify-end gap-1">
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
                        <td colSpan={9} className="p-0 border-b border-slate-100">
                          <div className="px-12 py-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">

                            {/* Row 1: Batch & Serial Tracking */}
                            <div className="flex gap-4">
                              {/* Batch Section */}
                              {(type !== "PURCHASE" || purchaseType === "DIRECT") && product.batchTracking && (
                                <div className="flex-1 bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
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
                                <div className="flex-1 bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
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
                                <div className="flex-1 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Settings size={14} className="text-slate-500" />
                                    <span className="text-xs font-bold text-slate-800">Additional Settings</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <Input
                                      label="Storage Location"
                                      value={product.storageLoc}
                                      onChange={(e) => handleProductChange(index, "storageLoc", e.target.value)}
                                      className="!h-9 !text-xs"
                                    />
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
                                <div className="flex-1 bg-white p-4 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
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
                                      {product.taxGst !== undefined && Number(product.taxGst) > 0 && (
                                        <>
                                          <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">GST Cost ({product.taxGst}%)</span>
                                            <span className="font-bold text-indigo-650">+₹{(baseCost * Number(product.taxGst) / 100).toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between text-[11px] font-semibold text-slate-750">
                                            <span className="text-slate-600">Unit Cost (incl. GST)</span>
                                            <span className="text-slate-800">₹{(baseCost * (1 + Number(product.taxGst) / 100)).toFixed(2)}</span>
                                          </div>
                                        </>
                                      )}
                                      <div className="flex justify-between text-[11px] pt-1.5 border-t border-slate-100/60">
                                        <span className="text-blue-500">Allocated Cost</span>
                                        <span className="font-bold text-blue-600">₹{allocPerUnit.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                                        <span className="font-bold text-slate-800">Net Cost / Unit</span>
                                        <span className="font-black text-emerald-600">₹{netCostPerUnit.toFixed(2)}</span>
                                      </div>
                                      {product.taxGst !== undefined && Number(product.taxGst) > 0 && (
                                        <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100/30">
                                          <span className="font-semibold text-slate-700">Net Cost / Unit (incl. GST)</span>
                                          <span className="font-bold text-emerald-700">₹{(netCostPerUnit + (baseCost * Number(product.taxGst) / 100)).toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">Row Subtotal (Base)</span>
                                        <span className="font-bold text-slate-700">₹{rowTotal.toLocaleString()}</span>
                                      </div>
                                      {product.taxGst !== undefined && Number(product.taxGst) > 0 && (
                                        <>
                                          <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">Row GST ({product.taxGst}%)</span>
                                            <span className="font-bold text-indigo-650">+₹{(rowTotal * Number(product.taxGst) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                          </div>
                                          <div className="flex justify-between text-[11px] font-semibold text-slate-750">
                                            <span className="text-slate-600">Row Subtotal (incl. GST)</span>
                                            <span className="text-slate-800">₹{(rowTotal * (1 + Number(product.taxGst) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                          </div>
                                        </>
                                      )}
                                      <div className="flex justify-between text-[11px] pt-1.5 border-t border-slate-100/60">
                                        <span className="text-emerald-500">Expected Margin</span>
                                        <span className="font-bold text-emerald-600">{effectiveMarginPct || '0'}%</span>
                                      </div>
                                      <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                                        <span className="font-bold text-slate-800">Profit / Unit</span>
                                        <span className="font-black text-emerald-600">₹{(computedSellPrice - netCostPerUnit).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {product.taxGst !== undefined && Number(product.taxGst) > 0 && (
                                    <div className="mt-4 p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
                                      <span className="font-black text-slate-400 uppercase tracking-wider text-[9px]">Tax Formula:</span>
                                      <span className="font-medium tabular-nums">
                                        Base Cost <span className="font-semibold text-slate-700">₹{baseCost.toFixed(2)}</span> + GST Cost ({product.taxGst}%) <span className="font-semibold text-indigo-600">₹{(baseCost * Number(product.taxGst) / 100).toFixed(2)}</span> = Total <span className="font-bold text-slate-800">₹{(baseCost * (1 + Number(product.taxGst) / 100)).toFixed(2)}</span>
                                      </span>
                                    </div>
                                  )}
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
            className="w-full group flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-white transition-all duration-200"
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
            <span className="text-xs font-bold">Add Another Item</span>
          </button>
        </div>
      </div>
    </>
  );
};

