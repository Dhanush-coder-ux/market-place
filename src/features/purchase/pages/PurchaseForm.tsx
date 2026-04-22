import { useState, useMemo } from "react";
import {
  Save, Plus, Trash2, Settings, ScanLine, Search,
  Banknote, Smartphone, CreditCard, Landmark, ChevronUp, X, PackageOpen, Check, CalendarDays
} from "lucide-react";

import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";

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
  batchNum: string;
  sku: string;
  variant: string;
  size: string;
}

// --- Mock Variant Database ---
const productVariantDB: Record<string, { id: string; name: string; sku: string; stock: number }[]> = {
  "Headphones": [
    { id: "hp-1", name: "Black Edition", sku: "HP-BLK-01", stock: 45 },
    { id: "hp-2", name: "White Edition", sku: "HP-WHT-01", stock: 2 }, // Low stock
    { id: "hp-3", name: "Crimson Red", sku: "HP-RED-01", stock: 12 },
  ],
  "Mouse": [
    { id: "ms-1", name: "Wireless Pro", sku: "MS-WL-PRO", stock: 8 },
    { id: "ms-2", name: "Wired Basic", sku: "MS-WR-BSC", stock: 0 }, // Out of stock
  ],
  "USB Cable": [
    { id: "usb-1", name: "Type-C 1m", sku: "USB-C-1M", stock: 150 },
    { id: "usb-2", name: "Type-C 2m", sku: "USB-C-2M", stock: 5 }, // Low stock
  ]
};

const LOW_STOCK_THRESHOLD = 5;

const PurchaseForm = () => {
  const { postData, loading } = useApi();
  // --- State Management ---
  const [purchaseDetails, setPurchaseDetails] = useState({
    supplier: "",
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    referenceNo: "PUR-2025-0156",
  });

  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: "1", name: "", quantity: "", costPrice: "", sellingPrice: "",
      marginPercent: "", marginAmount: "", marginType: "percent",
      unit: "Piece",
      taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", manufacturingDate: "", batchTracking: false, batchNum: "", sku: "", variant: "", size: ""
    }
  ]);

  const [charges, setCharges] = useState({ transport: "" as number | "", other: "" as number | "" });
  const [payment, setPayment] = useState({ method: "Cash" as PaymentMethod, amountPaid: "" as number | "" });
  const [costMethod, setCostMethod] = useState("By Value");
  const [expandedProductIndex, setExpandedProductIndex] = useState<number | null>(null);

  // --- Modal State ---
  const [variantModal, setVariantModal] = useState<{ isOpen: boolean; baseProduct: string; targetRowIndex: number }>({
    isOpen: false, baseProduct: "", targetRowIndex: -1
  });
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  // --- Mock Options for Dropdowns ---
  const supplierOptions = [
    { value: "TechDistro Global", label: "TechDistro Global" },
    { value: "Apex Electronics", label: "Apex Electronics" }
  ];

  const productOptions = [
    { value: "Headphones", label: "Headphones" },
    { value: "Mouse", label: "Mouse" },
    { value: "USB Cable", label: "USB Cable" }
  ];

  // --- Calculations ---
  const stats = useMemo(() => {
    let totalQty = 0;
    let subtotal = 0;

    products.forEach(p => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      totalQty += q;
      subtotal += (q * c);
    });

    const transportCost = Number(charges.transport) || 0;
    const otherCost = Number(charges.other) || 0;
    const totalCharges = transportCost + otherCost;

    const baseAmountForGst = subtotal + totalCharges;
    const gstAmount = baseAmountForGst * 0.18;

    const grandTotal = Math.round(baseAmountForGst + gstAmount);
    const paid = Number(payment.amountPaid) || 0;
    const outstanding = grandTotal - paid;

    return { totalQty, subtotal, totalCharges, gstAmount, grandTotal, outstanding };
  }, [products, charges, payment.amountPaid]);

  // --- Handlers ---
  const handleProductChange = (index: number, field: keyof ProductItem, value: any) => {
    if (field === "name") {
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
      id: Math.random().toString(), name: "", quantity: "", costPrice: "", sellingPrice: "",
      marginPercent: "", marginAmount: "", marginType: "percent",
      unit: "Piece",
      taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", manufacturingDate: "", batchTracking: false, batchNum: "", sku: "", variant: "", size: ""
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

    const firstVariant = variantsToAdd[0];
    updatedProducts[variantModal.targetRowIndex] = {
      ...updatedProducts[variantModal.targetRowIndex],
      name: variantModal.baseProduct,
      variant: firstVariant.name,
      sku: firstVariant.sku
    };

    for (let i = 1; i < variantsToAdd.length; i++) {
      const v = variantsToAdd[i];
      updatedProducts.push({
        id: Math.random().toString(),
        name: variantModal.baseProduct,
        quantity: "", costPrice: "", sellingPrice: "",
        marginPercent: "", marginAmount: "", marginType: "percent",
        unit: "Piece", taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", manufacturingDate: "", batchTracking: false, batchNum: "",
        sku: v.sku, variant: v.name, size: ""
      });
    }

    setProducts(updatedProducts);
    setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1 });
    setSelectedVariants(new Set());
  };

  return (
    <div className="h-full font-sans text-slate-800 bg-slate-50/50 min-h-screen relative">

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
                  <p className="text-xs text-slate-500 font-medium">Choose available variants for <span className="font-bold text-slate-700">{variantModal.baseProduct}</span></p>
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
                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
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
                  Add Selected to Order
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- END MODAL --- */}

      <div className="p-5 max-w-[1600px] mx-auto">
        <div className="flex flex-col xl:flex-row gap-6 items-start relative">

          <div className="flex-1 space-y-6 w-full pb-10">

            {/* 1. Purchase Details */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                <h2 className="text-base font-bold text-slate-800">Purchase Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReusableSelect
                  label="Supplier"
                  required={true as any}
                  options={supplierOptions}
                  value={purchaseDetails.supplier}
                  onValueChange={(val) => setPurchaseDetails({ ...purchaseDetails, supplier: val })}
                  placeholder="Select Supplier..."
                />
                <Input
                  label="Supplier Invoice #"
                  placeholder="e.g. INV-2025-456"
                  value={purchaseDetails.invoiceNo}
                  onChange={(e) => setPurchaseDetails({ ...purchaseDetails, invoiceNo: e.target.value })}
                />
                <Input
                  label="Purchase Date"
                  required
                  type="date"
                  value={purchaseDetails.date}
                  onChange={(e) => setPurchaseDetails({ ...purchaseDetails, date: e.target.value })}
                />
              </div>
            </div>

            {/* Middle Section: Summary & Payment */}
            <div className="bg-white shadow-xs p-3 rounded-2xl ">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                <h2 className="text-base font-bold text-slate-800">Order Summary</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* LEFT SIDE: Order Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden flex flex-col h-full">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Other Charges</h2>
                  </div>

                  <div className="p-6 space-y-5 flex-1">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-sm font-medium">Subtotal (Product Cost)</span>
                      <span className="font-semibold text-slate-800">
                        ₹{stats.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <Input
                        label="Transport Charges"
                        type="number"
                        placeholder="0.00"
                        leftIcon={<span className="text-slate-400 text-sm font-medium">₹</span>}
                        value={charges.transport as any}
                        onChange={(e) => setCharges({ ...charges, transport: e.target.value ? Number(e.target.value) : "" })}
                      />

                      <Input
                        label="Other Charges (Loading etc.)"
                        type="number"
                        placeholder="0.00"
                        leftIcon={<span className="text-slate-400 text-sm font-medium">₹</span>}
                        value={charges.other as any}
                        onChange={(e) => setCharges({ ...charges, other: e.target.value ? Number(e.target.value) : "" })}
                      />
                    </div>


                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 text-black mt-auto">
                    <span className="block text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Purchase Cost</span>
                    <span className="text-4xl font-bold tracking-tight text-slate-900">
                      ₹{stats.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* RIGHT SIDE: Payment Details */}
                <div className="space-y-6 h-full flex flex-col">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden flex-1">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Payment Details</h2>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-6">
                      {[
                        { id: "Cash", icon: <Banknote size={20} strokeWidth={1.5} /> },
                        { id: "UPI", icon: <Smartphone size={20} strokeWidth={1.5} /> },
                        { id: "Card", icon: <CreditCard size={20} strokeWidth={1.5} /> },
                        { id: "Bank", icon: <Landmark size={20} strokeWidth={1.5} /> }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setPayment({ ...payment, method: m.id as PaymentMethod })}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${payment.method === m.id
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                              : "border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                          <div className="mb-1.5">{m.icon}</div>
                          <span className="text-xs font-bold">{m.id}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 bg-slate-50/80 p-5 rounded-xl border border-slate-100 items-center">
                      <div className="flex-1 w-full">
                        <Input
                          label="Amount Paid Now (₹)"
                          type="number"
                          className="!text-lg !font-bold !text-blue-700 placeholder:!text-blue-300"
                          value={payment.amountPaid as any}
                          onChange={(e) => setPayment({ ...payment, amountPaid: e.target.value ? Number(e.target.value) : "" })}
                          placeholder={stats.grandTotal.toString()}
                        />
                      </div>
                      <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>
                      <div className="flex-1 w-full flex flex-col justify-center sm:items-end sm:text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Outstanding
                        </span>
                        <span className={`text-2xl font-bold ${stats.outstanding > 0 ? "text-orange-500" : "text-emerald-500"}`}>
                          ₹{stats.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. Quick Add Bar */}
            <div className="bg-white p-3 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 pointer-events-none"></div>
              <button className="relative z-10 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all duration-200 flex items-center gap-2 font-semibold whitespace-nowrap">
                <ScanLine size={18} /> <span className="hidden sm:inline">Scan Barcode</span>
              </button>
              <div className="flex-1 relative z-10">
                <Input
                  onChange={() => { }}
                  value={""}
                  type="text"
                  placeholder="Type product name or scan to add quickly..."
                  leftIcon={<Search size={18} className="text-blue-400" />}
                  className="!bg-white/80 backdrop-blur-sm !border-slate-200 focus:!border-blue-400 focus:!ring-blue-100 text-slate-800 placeholder:text-slate-400 !shadow-inner"
                />
              </div>
            </div>

            {/* 3. Product Entry Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 bg-amber-500 rounded-full"></div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Items List</h2>
                </div>
                <button onClick={addProduct} className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg hover:bg-blue-100 hover:shadow-sm transition-all flex items-center gap-1.5">
                  <Plus size={16} strokeWidth={2.5} /> Add Row
                </button>
              </div>

              {/* --- NEW: ATTACHED DISTRIBUTOR COST SPLIT SECTION --- */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Distributor Cost Split
                  </span>
                  <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    {["By Unit", "By Value"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setCostMethod(method)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${costMethod === method
                            ? "bg-blue-500 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Cost:</span>
                  <span className="text-xl font-bold tracking-tight text-slate-800">
                    ₹{stats.grandTotal.toLocaleString()}
                  </span>
                  {costMethod === "By Unit" && (
                    <span className="text-xs font-medium text-blue-700 bg-blue-100/50 px-2.5 py-1 rounded-md border border-blue-200">
                      ~₹{stats.totalQty > 0 ? (stats.grandTotal / stats.totalQty).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0} <span className="opacity-70">/ unit</span>
                    </span>
                  )}
                </div>
              </div>
              {/* --- END ATTACHED SECTION --- */}

              <div className="p-0">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <div className="col-span-3">Product Details</div>
                  <div className="col-span-1">QTY</div>
                  <div className="col-span-1">Base Cost</div>
                  <div className="col-span-1">Allocated</div>
                  <div className="col-span-2">Margin (% & ₹)</div>
                  <div className="col-span-2">Selling Price (₹)</div>
                  <div className="col-span-2 text-right">Row Total</div>
                </div>

                {/* Product Rows */}
                <div className="divide-y divide-slate-100 bg-white">
                  {products.map((product, index) => {
                    const q = Number(product.quantity) || 0;
                    const baseCost = Number(product.costPrice) || 0;
                    const rowTotal = q * baseCost;
                    const isExpanded = expandedProductIndex === index;

                    // Calculate Allocations
                    let allocated = 0;
                    if (costMethod === "By Unit" && stats.totalQty > 0) {
                      allocated = stats.totalCharges / stats.totalQty;
                    } else if (costMethod === "By Value" && stats.subtotal > 0) {
                      allocated = (baseCost / stats.subtotal) * stats.totalCharges;
                    }
                    const finalCost = baseCost + allocated;

                    // Calculate Margins and Selling Price live
                    let displayMarginAmount: number | "" = "";
                    let displaySellingPrice: number | "" = "";

                    if (product.marginType === "percent") {
                      const mPct = Number(product.marginPercent) || 0;
                      displayMarginAmount = finalCost * (mPct / 100);
                      displaySellingPrice = finalCost + displayMarginAmount;
                    } else if (product.marginType === "amount") {
                      displayMarginAmount = product.marginAmount;
                      const mAmt = Number(product.marginAmount) || 0;
                      displaySellingPrice = finalCost + mAmt;
                    } else if (product.marginType === "sellingPrice") {
                      displaySellingPrice = product.sellingPrice;
                      const sp = Number(product.sellingPrice) || 0;
                      displayMarginAmount = sp - finalCost;
                    }

                    const isAmountActive = product.marginType === "amount";
                    const isSPActive = product.marginType === "sellingPrice";

                    const valMarginAmount = isAmountActive ? product.marginAmount : (displayMarginAmount !== "" ? Number(displayMarginAmount).toFixed(2) : "");
                    const valSellingPrice = isSPActive ? product.sellingPrice : (displaySellingPrice !== "" ? Number(displaySellingPrice).toFixed(2) : "");

                    return (
                      <div key={product.id} className="group transition-colors">
                                 <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                          
                          <div className="col-span-3">
                            <ReusableSelect
                              value={product.name}
                              onValueChange={(val) => handleProductChange(index, "name", val)}
                              options={productOptions}
                              placeholder="Select product..."
                              className="!bg-white !shadow-sm !border-slate-200"
                            />
                            {product.variant && (
                              <div className="mt-1.5 text-[10px] font-bold text-slate-500 flex gap-2 items-center">
                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{product.variant}</span>
                                <span className="text-slate-400">SKU: {product.sku}</span>
                              </div>
                            )}
                          </div>

                          <div className="col-span-1">
                            <Input
                              type="number"
                              placeholder="0"
                              className="!text-center !px-1 !bg-transparent hover:!bg-white focus:!bg-white !border-transparent hover:!border-slate-200 transition-colors"
                              value={product.quantity as any}
                              onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                            />
                          </div>

                          <div className="col-span-1">
                            <ReusableSelect 
                              placeholder="Unit" 
                              className="!text-center !px-1 !bg-transparent hover:!bg-white focus:!bg-white !border-transparent hover:!border-slate-200 transition-colors"
                              options={[
                                { value: "pc", label: "pc" },
                                { value: "kg", label: "kg" },
                                { value: "ltr", label: "ltr" },
                                { value: "m", label: "m" },
                              ]}
                              value={product.unit}
                              onValueChange={(val) => handleProductChange(index, "unit", val)} 
                            />
                          </div>  

                          <div className="col-span-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="!text-right !px-2 !bg-transparent hover:!bg-white focus:!bg-white !border-transparent hover:!border-slate-200 transition-colors"
                              value={product.costPrice as any}
                              onChange={(e) => handleProductChange(index, "costPrice", e.target.value)}
                            />
                          </div>

                          <div className="col-span-1 flex flex-col justify-center items-end text-xs text-slate-500 pr-2">
                            {finalCost > 0 ? (
                              <div className="text-right flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-400">+{allocated.toFixed(2)}</span>
                                <span className="font-semibold text-indigo-600">₹{finalCost.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-medium">-</span>
                            )}
                          </div>

                          <div className="col-span-2 flex items-center justify-center gap-1 px-2">
                            <Input
                              type="number"
                              placeholder="₹"
                              className="!text-center !px-1 !bg-slate-50 !border-slate-200 focus:!bg-white"
                              value={valMarginAmount as any}
                              onChange={(e) => updateProductFields(index, { marginType: "amount", marginAmount: e.target.value ? Number(e.target.value) : "" })}
                            />
                          </div>

                          <div className="col-span-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="!text-right !font-bold !text-emerald-700 !bg-emerald-50/50 !border-emerald-200/60 focus:!bg-white focus:!ring-emerald-100 focus:!border-emerald-400"
                              value={valSellingPrice as any}
                              onChange={(e) => updateProductFields(index, { marginType: "sellingPrice", sellingPrice: e.target.value ? Number(e.target.value) : "" })}
                            />
                          </div>

                          <div className="col-span-2 flex items-center justify-end gap-3">
                            <div className="flex flex-col items-end w-20">
                               <span className="font-bold text-slate-800 text-sm">₹{rowTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                              <button
                                onClick={() => toggleAdvanced(index)}
                                title="Advanced Options"
                                className={`p-1.5 rounded-lg transition-all duration-200 ${isExpanded ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                              >
                                {isExpanded ? <ChevronUp size={16} strokeWidth={2.5} /> : <Settings size={16} />}
                              </button>
                              <button
                                onClick={() => removeProduct(index)}
                                disabled={products.length === 1}
                                title="Remove Row"
                                className="p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Batch Tracking Toggle & Date Fields */}
                        <div className="px-6 py-3 border-t border-slate-100/80 bg-white flex items-center gap-4 flex-wrap">
                          <button
                            onClick={() => updateProductFields(index, { batchTracking: !product.batchTracking })}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border-2 ${product.batchTracking
                                ? 'bg-gradient-to-r from-blue-500 to-blue-500 text-white border-transparent shadow-md shadow-blue-200'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                          >
                            <CalendarDays size={14} />
                            Batch Tracking
                            {/* Toggle indicator */}
                            <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${product.batchTracking ? 'bg-white/30' : 'bg-slate-200'
                              }`}>
                              <span className={`inline-block h-3.5 w-3.5 rounded-full transition-all duration-300 ${product.batchTracking
                                  ? 'translate-x-[18px] bg-white shadow-sm'
                                  : 'translate-x-[3px] bg-slate-400'
                                }`} />
                            </span>
                          </button>

                          {/* Manufacturing & Expiry Date Fields */}
                          <div
                            className={`flex items-center gap-4 overflow-hidden transition-all duration-400 ease-in-out ${product.batchTracking
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

                        {/* Advanced Settings Drawer */}
                        {isExpanded && (
                          <div className="px-6 py-5 bg-slate-50/80 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-5 shadow-inner">
                            <Input label="Tax/GST %" type="number" value={product.taxGst as any} onChange={(e) => handleProductChange(index, "taxGst", e.target.value)} />
                            <Input label="Storage Location" placeholder="e.g. Shelf A3" value={product.storageLoc} onChange={(e) => handleProductChange(index, "storageLoc", e.target.value)} />
                            <Input label="Reorder Point" type="number" placeholder="Min stock qty" value={product.reorderPoint as any} onChange={(e) => handleProductChange(index, "reorderPoint", e.target.value)} />
                            <Input label="Batch Number" placeholder="BATCH-001" value={product.batchNum} onChange={(e) => handleProductChange(index, "batchNum", e.target.value)} />
                            <Input label="SKU / Barcode" placeholder="WH-001" value={product.sku} onChange={(e) => handleProductChange(index, "sku", e.target.value)} />
                            <Input label="Variant" placeholder="e.g. Color" value={product.variant} onChange={(e) => handleProductChange(index, "variant", e.target.value)} />
                            <Input label="Size" placeholder="S / M / L" value={product.size} onChange={(e) => handleProductChange(index, "size", e.target.value)} />
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
      </div>

      <div className=" flex justify-end items-center p-5">
        <div className="flex gap-3">
          <GradientButton variant="outline" className="hover:bg-slate-50 transition-colors">
            Cancel
          </GradientButton>
          <GradientButton
            variant="primary"
            icon={<Save size={16} />}
            iconPosition="left"
            className="shadow-md hover:shadow-lg transition-all"
            disabled={loading}
            onClick={async () => {
              const payload = {
                shop_id: SHOP_ID,
                type: "PURCHASE CREATE",
                datas: { purchaseDetails, products, charges, payment },
              };
              await postData(ENDPOINTS.PURCHASES, payload);
            }}
          >
            {loading ? "Saving..." : "Save & Add to Stock"}
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;