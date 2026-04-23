import React, { useState, useMemo } from "react";
import {
  Save,
  Plus,
  Trash2,
  Settings,
  ScanLine,
  Search,
  X,
  PackageOpen,
  Check,
  CalendarDays,
  ChevronUp
} from "lucide-react";

import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { supplierApi } from "@/services/api/supplier";
import { inventoryApi } from "@/services/api/inventory";

// --- Types ---
type GRNStatus = "Completed" | "Pending" | "Partial";

export interface ProductItem {
  id: string;
  name: string;
  quantity: number | "";
  costPrice: number | "";
  sellingPrice: number | "";
  storageLoc: string;
  batchNum: string;
  remarks: string;
  manufacturingDate: string;
  expiryDate: string;
  batchTracking: boolean;
  variant?: string;
  sku?: string;
}

interface GRNFormData {
  poReference: string;
  supplier: string;
  date: string;
  status: GRNStatus;
}

interface GRNFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

const LOW_STOCK_THRESHOLD = 5;

const GRNForm: React.FC<GRNFormProps> = ({ onSubmit, onCancel }) => {
  const { postData, loading } = useApi();
  
  // --- State Management ---
  const [grnDetails, setGrnDetails] = useState<GRNFormData>({
    poReference: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    status: "Pending",
  });

  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: Date.now().toString(),
      name: "",
      quantity: "",
      costPrice: "",
      sellingPrice: "",
      storageLoc: "",
      batchNum: "",
      remarks: "",
      manufacturingDate: "",
      expiryDate: "",
      batchTracking: false,
      variant: "",
      sku: ""
    }
  ]);

  const [expandedProductIndex, setExpandedProductIndex] = useState<number | null>(null);

  // --- Dynamic Modal State ---
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

  // --- Calculations ---
  const stats = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;

    products.forEach(p => {
      const q = Number(p.quantity) || 0;
      const cp = Number(p.costPrice) || 0;
      totalQty += q;
      totalValue += (q * cp); 
    });

    return { totalQty, totalValue, itemsCount: products.length };
  }, [products]);

  // --- Handlers ---
  const handleProductChange = (index: number, field: keyof ProductItem, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const updateProductFields = (index: number, updates: Partial<ProductItem>) => {
    const updated = [...products];
    updated[index] = { ...updated[index], ...updates };
    setProducts(updated);
  };

  const addProduct = () => {
    setProducts([...products, {
      id: Math.random().toString(),
      name: "",
      quantity: "",
      costPrice: "",
      sellingPrice: "",
      storageLoc: "",
      batchNum: "",
      remarks: "",
      manufacturingDate: "",
      expiryDate: "",
      batchTracking: false,
      variant: "",
      sku: ""
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const toggleAdvanced = (index: number) => {
    setExpandedProductIndex(expandedProductIndex === index ? null : index);
  };

  // --- Modal Handlers ---
  const toggleVariantSelection = (variantId: string) => {
    const newSelection = new Set(selectedVariants);
    if (newSelection.has(variantId)) {
      newSelection.delete(variantId);
    } else {
      newSelection.add(variantId);
    }
    setSelectedVariants(newSelection);
  };

  const confirmVariants = () => {
    if (selectedVariants.size === 0) {
      setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
      return;
    }

    const variantsToAdd = variantModal.variants.filter(v => selectedVariants.has(v.id));
    const updatedProducts = [...products];
    const baseOpt = variantModal.baseData;

    // Update origin row
    const firstVariant = variantsToAdd[0];
    updatedProducts[variantModal.targetRowIndex] = {
      ...updatedProducts[variantModal.targetRowIndex],
      name: variantModal.baseProduct,
      costPrice: baseOpt.buy_price ?? baseOpt.costPrice ?? "",
      sellingPrice: baseOpt.sell_price ?? baseOpt.sellingPrice ?? "",
      variant: firstVariant.name,
      sku: firstVariant.sku
    };

    // Append new rows for multiple selections
    for (let i = 1; i < variantsToAdd.length; i++) {
      const v = variantsToAdd[i];
      updatedProducts.push({
        id: Math.random().toString(),
        name: variantModal.baseProduct,
        quantity: "",
        costPrice: baseOpt.buy_price ?? baseOpt.costPrice ?? "",
        sellingPrice: baseOpt.sell_price ?? baseOpt.sellingPrice ?? "",
        storageLoc: "",
        batchNum: "",
        remarks: "",
        manufacturingDate: "",
        expiryDate: "",
        batchTracking: false,
        sku: v.sku,
        variant: v.name
      });
    }

    setProducts(updatedProducts);
    setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
    setSelectedVariants(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...grnDetails,
      itemsCount: stats.itemsCount,
      totalValue: stats.totalValue,
      products
    };
    const payload = {
      shop_id: SHOP_ID,
      type: "GRN CREATE",
      datas: finalData,
    };
    const res = await postData(ENDPOINTS.PURCHASES, payload);
    if (res && onSubmit) onSubmit(finalData);
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-[#FAFAFC] relative selection:bg-blue-100 p-6">
      
      {/* --- DYNAMIC VARIANT SELECTION MODAL --- */}
      {variantModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200/60 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg shadow-sm">
                  <PackageOpen size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">Select Variants</h3>
                  <p className="text-sm text-slate-500">Available variations for <span className="font-medium text-slate-700">{variantModal.baseProduct}</span></p>
                </div>
              </div>
              <button onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {variantModal.variants.map((variant) => {
                  const stockNum = Number(variant.stock) || 0;
                  const isLowStock = stockNum <= LOW_STOCK_THRESHOLD && stockNum > 0;
                  const isOutOfStock = stockNum <= 0;
                  const isSelected = selectedVariants.has(variant.id);

                  return (
                    <div
                      key={variant.id}
                      onClick={() => !isOutOfStock && toggleVariantSelection(variant.id)}
                      className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2
                        ${isOutOfStock
                          ? 'border-slate-200 bg-slate-100/50 opacity-60 cursor-not-allowed'
                          : isSelected
                            ? 'border-blue-500 bg-blue-50/30 cursor-pointer shadow-[0_2px_8px_rgba(59,130,246,0.12)]'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer bg-white'
                        }
                      `}
                    >
                      {!isOutOfStock && (
                        <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'}`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold text-slate-800 pr-6">{variant.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 font-mono">SKU: {variant.sku}</p>
                      </div>
                      
                      <div className="mt-auto pt-3">
                        <span className={`inline-flex px-2 py-1 rounded-md text-[11px] font-medium tracking-wide ${
                            isOutOfStock ? 'bg-slate-200 text-slate-600' : 
                            isLowStock ? 'bg-orange-100 text-orange-700' : 
                            'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${stockNum})` : `In Stock (${stockNum})`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
              <span className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{selectedVariants.size}</span> variant(s) selected
              </span>
              <div className="flex gap-3">
                <GradientButton variant="outline" onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })}>
                  Cancel
                </GradientButton>
                <GradientButton variant="primary" onClick={confirmVariants} disabled={selectedVariants.size === 0}>
                  Confirm Selection
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- END MODAL --- */}

      <div className="flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto pb-20">
        
        {/* ================= LEFT COLUMN (MAIN FORM) ================= */}
        <div className="flex-1 space-y-6">
          
          {/* 1. General Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
            <h2 className="text-base font-semibold text-slate-800 mb-6">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Supplier <span className="text-red-500">*</span></label>
                <SearchSelect
                  labelKey="name"
                  valueKey="id"
                  fetchOptions={async (q) => await supplierApi.searchSuppliers(q)}
                  value={grnDetails.supplier}
                  onChange={(val) => setGrnDetails({...grnDetails, supplier: String(val)})}
                  placeholder="Select Supplier..."
                  className="w-full !border-slate-200 focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500/20"
                />
              </div>
              <Input 
                label="Receipt Date"
                required
                type="date"
                value={grnDetails.date}
                onChange={(e) => setGrnDetails({...grnDetails, date: e.target.value})}
              />
            </div>
          </div>

          {/* 2. Quick Add Bar */}
          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 pointer-events-none"></div>
            <button className="relative z-10 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all duration-200 flex items-center gap-2 font-semibold whitespace-nowrap">
              <ScanLine size={18} /> <span className="hidden sm:inline">Scan Barcode</span>
            </button>
            <div className="flex-1 relative z-10">
              <Input 
                onChange={() => {}}
                value={""}
                type="text" 
                placeholder="Type product name or scan to add quickly..." 
                leftIcon={<Search size={18} className="text-blue-400" />}
                className="!bg-white/80 backdrop-blur-sm !border-slate-200 focus:!border-blue-400 focus:!ring-blue-100 text-slate-800 placeholder:text-slate-400 !shadow-inner"
              />
            </div>
          </div>

          {/* 3. Product Entry */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-sm font-semibold text-slate-800">Received Products</h2>
              <button type="button" onClick={addProduct} className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-sm">
                <Plus size={16} /> Add Row
              </button>
            </div>
            
            <div className="p-0 overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider items-center">
                  <div className="col-span-4">Product Name</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Buy Price</div>
                  <div className="col-span-2 text-right">Sell Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Product Rows */}
                <div className="divide-y divide-slate-100 bg-white">
                  {products.map((product, index) => {
                    const rowTotal = (Number(product.quantity) || 0) * (Number(product.costPrice) || 0); // Using cost price for GRN typical row totals
                    const isExpanded = expandedProductIndex === index;

                    return (
                      <div key={product.id} className="group transition-colors">
                        <div className="grid grid-cols-12 gap-3 px-6 py-4 items-center">
                          <div className="col-span-4">
                            <SearchSelect
                              labelKey="name"
                              valueKey="id"
                              fetchOptions={async (q) => await inventoryApi.searchInventories(q)}
                              value={product.name}
                              onChange={(val, opt: any) => {
                                if (opt) {
                                  // Check for dynamic variants from the API payload
                                  const hasVariants = opt.has_variants || (opt.datas && opt.datas.has_variants);
                                  const combinations = opt.combinations || (opt.datas && opt.datas.combinations) || [];
                                  
                                  if (hasVariants && combinations.length > 0) {
                                    const mappedVariants = combinations.map((c: any) => ({
                                      id: c.id,
                                      name: Object.values(c.attributes || {}).join(" - "),
                                      sku: c.barcode || opt.barcode,
                                      stock: c.stock || opt.stocks || 0,
                                    }));
                                    
                                    setVariantModal({
                                      isOpen: true,
                                      baseProduct: opt.name || String(val),
                                      targetRowIndex: index,
                                      variants: mappedVariants,
                                      baseData: opt.datas || opt
                                    });
                                    setSelectedVariants(new Set());
                                  } else {
                                    // Handle non-variant directly
                                    const dataNode = opt.datas || opt;
                                    const updated = [...products];
                                    updated[index].name = dataNode.name || String(val);
                                    updated[index].costPrice = dataNode.buy_price ?? dataNode.costPrice ?? "";
                                    updated[index].sellingPrice = dataNode.sell_price ?? dataNode.sellingPrice ?? "";
                                    updated[index].sku = dataNode.barcode ?? dataNode.sku ?? "";
                                    updated[index].variant = dataNode.variant ?? "";
                                    setProducts(updated);
                                  }
                                } else {
                                  handleProductChange(index, "name", String(val));
                                }
                              }}
                              placeholder="Select Product..."
                              className="w-full !border-slate-200"
                            />
                            {/* Variant Details Display */}
                            {product.variant && (
                              <div className="mt-2 text-[11px] font-medium text-slate-500 flex gap-2 items-center">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">{product.variant}</span>
                                <span className="text-slate-400">SKU: {product.sku}</span>
                              </div>
                            )}
                          </div>
                          <div className="col-span-2">
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="!text-center !px-1 !border-slate-200"
                              value={product.quantity as any} 
                              onChange={(e) => handleProductChange(index, "quantity", e.target.value)} 
                            />
                          </div>
                          <div className="col-span-2">
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              className="!text-right !px-2 !border-slate-200"
                              value={product.costPrice as any} 
                              onChange={(e) => handleProductChange(index, "costPrice", e.target.value)} 
                            />
                          </div>
                          <div className="col-span-2">
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              className="!text-right !px-2 !font-medium !text-emerald-700 !border-slate-200"
                              value={product.sellingPrice as any} 
                              onChange={(e) => handleProductChange(index, "sellingPrice", e.target.value)} 
                            />
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-3 h-[42px]">
                            <span className="font-semibold text-slate-800 text-sm pr-1">₹{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                              <button type="button" onClick={() => toggleAdvanced(index)} className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
                                {isExpanded ? <ChevronUp size={16} /> : <Settings size={16} />}
                              </button>
                              <button type="button" onClick={() => removeProduct(index)} disabled={products.length === 1} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md disabled:opacity-30 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Batch Tracking Toggle & Date Fields */}
                        <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 flex items-center gap-4 flex-wrap">
                          <button
                            type="button"
                            onClick={() => updateProductFields(index, { batchTracking: !product.batchTracking })}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                              product.batchTracking
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <CalendarDays size={14} />
                            Batch Tracking
                          </button>

                          {/* Manufacturing & Expiry Date Fields */}
                          <div
                            className={`flex items-center gap-4 overflow-hidden transition-all duration-300 ${
                              product.batchTracking
                                ? 'opacity-100 max-w-[600px]'
                                : 'opacity-0 max-w-0 pointer-events-none'
                            }`}
                          >
                            <Input
                              label="Mfg Date"
                              type="date"
                              value={product.manufacturingDate}
                              onChange={(e) => handleProductChange(index, "manufacturingDate", e.target.value)}
                              className="!h-8 !text-xs !border-slate-200"
                            />
                            <Input
                              label="Exp Date"
                              type="date"
                              value={product.expiryDate}
                              onChange={(e) => handleProductChange(index, "expiryDate", e.target.value)}
                              className="!h-8 !text-xs !border-slate-200"
                            />
                          </div>
                        </div>

                        {/* Advanced Settings Panel for GRN */}
                        {isExpanded && (
                          <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-5">
                            <Input label="Storage Location" placeholder="e.g. Warehouse A, Shelf 3" value={product.storageLoc} onChange={(e) => handleProductChange(index, "storageLoc", e.target.value)} />
                            <Input label="Batch Number" placeholder="BATCH-001" value={product.batchNum} onChange={(e) => handleProductChange(index, "batchNum", e.target.value)} />
                            <Input label="Remarks" placeholder="Any damage or notes?" value={product.remarks} onChange={(e) => handleProductChange(index, "remarks", e.target.value)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN (SIDEBAR) ================= */}
        <div className="w-full xl:w-96 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/60 text-center flex flex-col justify-center">
              <div className="text-3xl font-semibold text-slate-800">{stats.itemsCount}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-2">Unique Items</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/60 text-center flex flex-col justify-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalQty}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-2">Total Received</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden sticky top-6">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">Value Summary</h2>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total GRN Value</span>
                <span className="font-semibold text-3xl tracking-tight text-slate-900">₹{stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 border-t border-slate-100">
               <p className="text-xs text-slate-500 leading-relaxed">
                 This value is calculated automatically based on the received product quantities multiplied by their assigned cost prices.
               </p>
            </div>
          </div>
          
        </div>
      </div>
      
  
                 <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-200 mt-6">
              <button className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="px-8 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200/60 disabled:opacity-50"
              >
                {loading ? "Saving..." : <><Save size={18} /> Save Purchase Order</>}
              </button>
            </div>
    </div>
  );
};

export default GRNForm;