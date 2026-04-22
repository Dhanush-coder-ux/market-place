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
  CalendarDays
} from "lucide-react";

// Adjust these imports to match your folder structure
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
  // Advanced GRN fields (hidden behind settings toggle)
  storageLoc: string;
  batchNum: string;
  remarks: string;
  // Batch tracking fields
  manufacturingDate: string;
  expiryDate: string;
  batchTracking: boolean;
  // Variant additions
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

// --- Mock Variant Database ---
const productVariantDB: Record<string, { id: string; name: string; sku: string; stock: number }[]> = {
  "Wireless Headphones": [
    { id: "wh-1", name: "Matte Black", sku: "WH-BLK-01", stock: 45 },
    { id: "wh-2", name: "Pearl White", sku: "WH-WHT-01", stock: 2 }, // Low stock
  ],
  "Mechanical Keyboard": [
    { id: "mk-1", name: "Tactile Blue Switch", sku: "MK-BLU-01", stock: 8 },
    { id: "mk-2", name: "Linear Red Switch", sku: "MK-RED-01", stock: 0 }, // Out of stock
  ],
  "USB-C Hub": [
    { id: "hub-1", name: "4-Port Basic", sku: "HUB-4-BSC", stock: 150 },
    { id: "hub-2", name: "8-Port Pro", sku: "HUB-8-PRO", stock: 5 }, // Low stock
  ]
};

const LOW_STOCK_THRESHOLD = 5;

const supplierOptions = [
  { value: "sup-1", label: "Global Tech" },
  { value: "sup-2", label: "Mainstream Inc" },
  { value: "sup-3", label: "Apex Wholesale" },
];

const productOptions = [
  { value: "Wireless Headphones", label: "Wireless Headphones" },
  { value: "Mechanical Keyboard", label: "Mechanical Keyboard" },
  { value: "USB-C Hub", label: "USB-C Hub" }
];

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

  // --- Modal State ---
  const [variantModal, setVariantModal] = useState<{ isOpen: boolean; baseProduct: string; targetRowIndex: number }>({
    isOpen: false, baseProduct: "", targetRowIndex: -1
  });
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  // --- Calculations ---
  const stats = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;

    products.forEach(p => {
      const q = Number(p.quantity) || 0;
      const cp = Number(p.costPrice) || 0;
      const sp = Number(p.sellingPrice) || 0;
      totalQty += q;
      totalValue += (q * cp); // Using cost price for total value of GRN usually? Or user wants sell price? User said "sell price buy price on product section".
      // Let's keep it as is or show both. I'll use cp for total value if it's a GRN.
    });

    return { totalQty, totalValue, itemsCount: products.length };
  }, [products]);

  // --- Handlers ---
  const handleProductChange = (index: number, field: keyof ProductItem, value: any) => {
    if (field === "name") {
      // Intercept product selection to show variants
      setVariantModal({ isOpen: true, baseProduct: value, targetRowIndex: index });
      setSelectedVariants(new Set());
      return;
    }

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
      setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1 });
      return;
    }

    const variantsToAdd = productVariantDB[variantModal.baseProduct].filter(v => selectedVariants.has(v.id));
    const updatedProducts = [...products];

    // Update origin row
    const firstVariant = variantsToAdd[0];
    updatedProducts[variantModal.targetRowIndex] = {
      ...updatedProducts[variantModal.targetRowIndex],
      name: variantModal.baseProduct,
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
        sellingPrice: "",
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
    setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1 });
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
    <div className="min-h-screen font-sans text-slate-800 relative">
      
      {/* --- VARIANT SELECTION MODAL --- */}
      {variantModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <PackageOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Select Variants</h3>
                  <p className="text-xs text-slate-500 font-medium">Choose variants for <span className="font-bold text-slate-700">{variantModal.baseProduct}</span></p>
                </div>
              </div>
              <button onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1 })} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {productVariantDB[variantModal.baseProduct]?.map((variant) => {
                  const isLowStock = variant.stock <= LOW_STOCK_THRESHOLD;
                  const isSelected = selectedVariants.has(variant.id);

                  return (
                    <div
                      key={variant.id}
                      onClick={() => !isLowStock && toggleVariantSelection(variant.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col gap-2
                        ${isLowStock 
                          ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed' 
                          : isSelected 
                            ? 'border-blue-500 bg-blue-50/50 cursor-pointer shadow-sm' 
                            : 'border-slate-200 hover:border-blue-300 hover:shadow-sm cursor-pointer bg-white'
                        }
                      `}
                    >
                      {!isLowStock && (
                        <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'}`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      )}

                      <div>
                        <h4 className="font-bold text-slate-800 pr-6">{variant.name}</h4>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">SKU: {variant.sku}</p>
                      </div>
                      
                      <div className="mt-auto pt-2">
                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isLowStock ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isLowStock ? `Low Stock (${variant.stock})` : `In Stock (${variant.stock})`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500">
                {selectedVariants.size} variant(s) selected
              </span>
              <div className="flex gap-3">
                <GradientButton variant="outline" onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1 })}>
                  Cancel
                </GradientButton>
                <GradientButton variant="primary" onClick={confirmVariants} disabled={selectedVariants.size === 0}>
                  Add Selected to GRN
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- END MODAL --- */}

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* ================= LEFT COLUMN (MAIN FORM) ================= */}
        <div className="flex-1 space-y-6">
          
          {/* 1. General Information */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Supplier *</label>
                <SearchSelect
                  labelKey="name"
                  valueKey="id"
                  fetchOptions={async (q) => await supplierApi.searchSuppliers(q)}
                  value={grnDetails.supplier}
                  onChange={(val) => setGrnDetails({...grnDetails, supplier: String(val)})}
                  placeholder="Select Supplier..."
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-inner flex items-center gap-4">
            <button className="p-3 bg-white text-blue-600 rounded-lg shadow-sm border border-blue-200 hover:bg-blue-50 transition flex items-center gap-2 font-semibold whitespace-nowrap">
              <ScanLine size={18} /> <span className="hidden sm:inline">Scan Barcode</span>
            </button>
            <div className="flex-1">
              <Input 
                onChange={() => {}}
                value={""}
                type="text" 
                placeholder="Type product name to add quickly..." 
                leftIcon={<Search size={18} />}
                className="!border-transparent focus:!border-blue-400 focus:!ring-blue-100 text-blue-900 placeholder:text-blue-300"
              />
            </div>
          </div>

          {/* 3. Product Entry */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Received Products</h2>
              <button type="button" onClick={addProduct} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 flex items-center gap-1">
                <Plus size={14} /> Add Row
              </button>
            </div>
            
            <div className="p-0">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="col-span-4">Product Name</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Buy Price</div>
                <div className="col-span-2 text-right">Sell Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Product Rows */}
              {products.map((product, index) => {
                const rowTotal = (Number(product.quantity) || 0) * (Number(product.sellingPrice) || 0);
                const isExpanded = expandedProductIndex === index;

                return (
                  <div key={product.id} className="border-b border-slate-100 last:border-0">
                    <div className="grid grid-cols-12 gap-3 p-4 items-center hover:bg-slate-50/50 transition-colors">
                      <div className="col-span-4">
                        <SearchSelect
                          labelKey="name"
                          valueKey="id"
                          fetchOptions={async (q) => await inventoryApi.searchInventories(q)}
                          value={product.name}
                          onChange={(val, opt: any) => {
                            if (!opt) {
                              handleProductChange(index, "name", String(val));
                            } else {
                              const updated = [...products];
                              updated[index].name = opt.name || opt.label || String(val);
                              updated[index].costPrice = opt.buy_price ?? opt.costPrice ?? "";
                              updated[index].sellingPrice = opt.sell_price ?? opt.sellingPrice ?? "";
                              updated[index].sku = opt.barcode ?? opt.sku ?? "";
                              updated[index].variant = opt.variant ?? "";
                              setProducts(updated);
                            }
                          }}
                          placeholder="Select Product..."
                          className="w-full !bg-white !shadow-sm !border-slate-200"
                        />
                        {/* Variant Details Display */}
                        {product.variant && (
                          <div className="mt-1 text-[10px] font-bold text-slate-500 flex gap-2">
                            <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">{product.variant}</span>
                            <span className="text-slate-400 mt-0.5">SKU: {product.sku}</span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          placeholder="0" 
                          className="!text-center !px-1"
                          value={product.quantity as any} 
                          onChange={(e) => handleProductChange(index, "quantity", e.target.value)} 
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="!text-right !px-1"
                          value={product.costPrice as any} 
                          onChange={(e) => handleProductChange(index, "costPrice", e.target.value)} 
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="!text-right !px-1 font-semibold text-emerald-600"
                          value={product.sellingPrice as any} 
                          onChange={(e) => handleProductChange(index, "sellingPrice", e.target.value)} 
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-3 h-[42px]">
                        <span className="font-bold text-slate-700 text-sm">₹{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => toggleAdvanced(index)} className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                            <Settings size={14} />
                          </button>
                          <button type="button" onClick={() => removeProduct(index)} disabled={products.length === 1} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md disabled:opacity-30">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Batch Tracking Toggle & Date Fields */}
                    <div className="px-6 py-3 border-t border-slate-100/80 bg-white flex items-center gap-4 flex-wrap">
                      <button
                        type="button"
                        onClick={() => updateProductFields(index, { batchTracking: !product.batchTracking })}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border-2 ${
                          product.batchTracking
                            ? 'bg-gradient-to-r from-blue-500 to-blue-500 text-white border-transparent shadow-md shadow-blue-200'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <CalendarDays size={14} />
                        Batch Tracking
                        {/* Toggle indicator */}
                        <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${
                          product.batchTracking ? 'bg-white/30' : 'bg-slate-200'
                        }`}>
                          <span className={`inline-block h-3.5 w-3.5 rounded-full transition-all duration-300 ${
                            product.batchTracking
                              ? 'translate-x-[18px] bg-white shadow-sm'
                              : 'translate-x-[3px] bg-slate-400'
                          }`} />
                        </span>
                      </button>

                      {/* Manufacturing & Expiry Date Fields */}
                      <div
                        className={`flex items-center gap-4 overflow-hidden transition-all duration-400 ease-in-out ${
                          product.batchTracking
                            ? 'max-w-[600px] opacity-100 translate-x-0'
                            : 'max-w-0 opacity-0 -translate-x-4 pointer-events-none'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <Input
                            label="Manufacturing Date"
                            type="date"
                            value={product.manufacturingDate}
                            onChange={(e) => handleProductChange(index, "manufacturingDate", e.target.value)}
                            className="!bg-violet-50/50 !border-violet-200/60 focus:!ring-violet-100 focus:!border-violet-400"
                          />
                        </div>
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <Input
                            label="Expiry Date"
                            type="date"
                            value={product.expiryDate}
                            onChange={(e) => handleProductChange(index, "expiryDate", e.target.value)}
                            className="!bg-amber-50/50 !border-amber-200/60 focus:!ring-amber-100 focus:!border-amber-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advanced Settings Panel for GRN */}
                    {isExpanded && (
                      <div className="p-5 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-inner">
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

        {/* ================= RIGHT COLUMN (SIDEBAR) ================= */}
        <div className="w-full xl:w-96 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
              <div className="text-3xl font-semibold text-slate-700">{stats.itemsCount}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Unique Items</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
              <div className="text-3xl font-black text-slate-700">{stats.totalQty}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Total Qty Received</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Value Summary</h2>
            </div>
            
            <div className="p-5 text-black">
              <div className="flex justify-between items-end">
                <div>
                  <span className="block text-slate-400 text-xs font-semibold uppercase mb-1">Total GRN Value</span>
                  <span className="font-bold text-3xl text-slate-900">₹{stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 border-t border-slate-100">
               <p className="text-xs text-slate-500 leading-relaxed">
                 This value is calculated automatically based on the received product quantities multiplied by their assigned selling prices.
               </p>
            </div>
          </div>
          
        </div>
      </div>
      
      <div className="flex justify-end items-center mb-6 p-5">
        <div className="flex gap-3">
          <GradientButton icon={<X size={16} />} variant="outline" onClick={onCancel}>
            Cancel
          </GradientButton>
          
          <GradientButton icon={<Save size={16} />} onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Record"}
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default GRNForm;