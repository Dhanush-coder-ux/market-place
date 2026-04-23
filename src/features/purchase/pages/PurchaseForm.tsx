import { useState, useMemo } from "react";
import {
  Save, Plus, Trash2, Settings, ScanLine, Search,
  Banknote, Smartphone, CreditCard, Landmark, ChevronUp, X, PackageOpen, Check, CalendarDays
} from "lucide-react";

import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { supplierApi } from "@/services/api/supplier";
import { inventoryApi } from "@/services/api/inventory";

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
  category?: string;
}

const LOW_STOCK_THRESHOLD = 5;

const PurchaseForm = () => {
  const { postData, loading } = useApi();

  // --- State Management ---
  const [purchaseDetails, setPurchaseDetails] = useState({
    supplier: "",
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    referenceNo: "PUR-2026-0156",
  });

  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: "1", name: "", quantity: "", costPrice: "", sellingPrice: "",
      marginPercent: "", marginAmount: "", marginType: "percent",
      unit: "pc", taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", manufacturingDate: "", batchTracking: false, batchNum: "", sku: "", variant: "", size: ""
    }
  ]);

  const [charges, setCharges] = useState({ transport: "" as number | "", other: "" as number | "" });
  const [payment, setPayment] = useState({ method: "Cash" as PaymentMethod, amountPaid: "" as number | "" });
  const [costMethod, setCostMethod] = useState("By Value");
  const [expandedProductIndex, setExpandedProductIndex] = useState<number | null>(null);
  const [supplierDetails, setSupplierDetails] = useState<any>(null);

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
      unit: "pc", taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", manufacturingDate: "", batchTracking: false, batchNum: "", sku: "", variant: "", size: ""
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

    // Replace the row that triggered the modal with the first selected variant
    const firstVariant = variantsToAdd[0];
    updatedProducts[variantModal.targetRowIndex] = {
      ...updatedProducts[variantModal.targetRowIndex],
      name: variantModal.baseProduct,
      costPrice: baseOpt.buy_price ?? baseOpt.costPrice ?? "",
      sellingPrice: baseOpt.sell_price ?? baseOpt.sellingPrice ?? "",
      unit: baseOpt.unit ?? "pc",
      category: baseOpt.category ?? "",
      variant: firstVariant.name,
      sku: firstVariant.sku
    };

    // Append remaining selected variants as new rows
    for (let i = 1; i < variantsToAdd.length; i++) {
      const v = variantsToAdd[i];
      updatedProducts.push({
        id: Math.random().toString(),
        name: variantModal.baseProduct,
        quantity: "", 
        costPrice: baseOpt.buy_price ?? baseOpt.costPrice ?? "", 
        sellingPrice: baseOpt.sell_price ?? baseOpt.sellingPrice ?? "",
        marginPercent: "", marginAmount: "", marginType: "percent",
        unit: baseOpt.unit ?? "pc", 
        taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", manufacturingDate: "", batchTracking: false, batchNum: "",
        sku: v.sku, variant: v.name, size: "", category: baseOpt.category ?? ""
      });
    }

    setProducts(updatedProducts);
    setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null });
    setSelectedVariants(new Set());
  };

  // --- SUBMIT HANDLER ---
  const handleSavePurchase = async () => {
    if (!purchaseDetails.supplier) {
      alert("Validation Error: Please select a supplier.");
      return;
    }

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.name) return alert(`Row ${i + 1}: Product name is required.`);
      if (!p.quantity || Number(p.quantity) <= 0) return alert(`Row ${i + 1}: Quantity must be greater than 0.`);
      if (p.costPrice === "" || Number(p.costPrice) < 0) return alert(`Row ${i + 1}: Buy Price is required.`);
      if (!p.sku) return alert(`Row ${i + 1}: Barcode (SKU) is required.`);

      const baseCost = Number(p.costPrice) || 0;
      let finalSellPrice = 0;
      if (p.marginType === "sellingPrice" && Number(p.sellingPrice) > 0) {
        finalSellPrice = Number(p.sellingPrice);
      } else if (p.marginType === "amount" && Number(p.marginAmount) > 0) {
        finalSellPrice = baseCost + Number(p.marginAmount);
      } else if (p.marginType === "percent" && Number(p.marginPercent) > 0) {
        finalSellPrice = baseCost + (baseCost * (Number(p.marginPercent) / 100));
      }

      if (finalSellPrice <= 0 && p.marginType === "sellingPrice") {
        return alert(`Row ${i + 1}: Selling Price is required.`);
      }
    }

    const transformedProducts = products.map((p) => {
      const q = Math.floor(Number(p.quantity) || 0);
      const baseCost = Number(p.costPrice) || 0;

      let allocated = 0;
      if (costMethod === "By Unit" && stats.totalQty > 0) {
        allocated = stats.totalCharges / stats.totalQty;
      } else if (costMethod === "By Value" && stats.subtotal > 0) {
        allocated = (baseCost / stats.subtotal) * stats.totalCharges;
      }
      const finalCost = baseCost + allocated;

      let finalSellPrice = 0;
      if (p.marginType === "percent") {
        finalSellPrice = finalCost + (finalCost * ((Number(p.marginPercent) || 0) / 100));
      } else if (p.marginType === "amount") {
        finalSellPrice = finalCost + (Number(p.marginAmount) || 0);
      } else {
        finalSellPrice = Number(p.sellingPrice) || 0;
      }

      return {
        id: p.id,
        name: p.name,
        barcode: p.sku,
        quantity: q,
        buy_price: baseCost,
        sell_price: Number(finalSellPrice.toFixed(2)),
        unit: p.unit || "pc",
        gst: Number(p.taxGst) || 0,
        storage_location: p.storageLoc,
        reorder_point: Number(p.reorderPoint) || 0,
        batch_tracking: p.batchTracking,
        batch_number: p.batchNum,
        manufacturing_date: p.manufacturingDate,
        expiry_date: p.expiryDate,
        variant: p.variant,
        size: p.size
      };
    });

    const payload = {
      datas: {
        shop_id: SHOP_ID,
        type: "DIRECT",
        supplier_id: supplierDetails?.id || "SUP_" + purchaseDetails.supplier.substring(0, 3).toUpperCase(),
        supplier_name: supplierDetails?.name || purchaseDetails.supplier,
        purchaseDetails: { ...purchaseDetails },
        charges: {
          transport: Number(charges.transport) || 0,
          other: Number(charges.other) || 0
        },
        payment: {
          method: payment.method,
          amountPaid: Number(payment.amountPaid) || 0
        },
        products: transformedProducts,
      }
    };

    try {
      await postData(ENDPOINTS.PURCHASES, payload);
    } catch (error) {
      console.error("Submission failed:", error);
    }
  };

  return (
    <div className="h-full font-sans text-slate-800 bg-[#FAFAFC] min-h-screen relative selection:bg-blue-100">
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
                <button 
                  onClick={() => setVariantModal({ isOpen: false, baseProduct: "", targetRowIndex: -1, variants: [], baseData: null })}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmVariants} 
                  disabled={selectedVariants.size === 0}
                  className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-100"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- END MODAL --- */}

      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col xl:flex-row gap-6 items-start relative">
          <div className="flex-1 space-y-6 w-full pb-10">

            {/* 1. Purchase Details */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-base font-semibold text-slate-800">Purchase Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Supplier <span className="text-red-500">*</span></label>
                  <SearchSelect
                    labelKey="name"
                    valueKey="id"
                    fetchOptions={async (q) => await supplierApi.searchSuppliers(q)}
                    value={purchaseDetails.supplier}
                    onChange={(val, opt: any) => {
                      setPurchaseDetails({ ...purchaseDetails, supplier: String(val) });
                      if (opt) setSupplierDetails(opt);
                    }}
                    placeholder="Search Supplier..."
                    className="w-full !border-slate-200 focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500/20"
                  />
                  {supplierDetails && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm flex flex-col gap-1 text-slate-600">
                      <strong className="text-slate-800 font-medium">{supplierDetails.name || purchaseDetails.supplier}</strong>
                      {supplierDetails.email && <span className="text-xs flex items-center gap-2">✉️ {supplierDetails.email}</span>}
                      {supplierDetails.mobile_number && <span className="text-xs flex items-center gap-2">📞 {supplierDetails.mobile_number}</span>}
                    </div>
                  )}
                </div>

                <Input
                  label="Supplier Invoice #"
                  placeholder="e.g. INV-2026-456"
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* LEFT SIDE: Order Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-full">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-800">Order Summary</h2>
                </div>

                <div className="p-6 space-y-5 flex-1">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-sm">Subtotal (Product Cost)</span>
                    <span className="font-medium text-slate-800">
                      ₹{stats.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-5 border-t border-slate-100 space-y-4">
                    <Input
                      label="Transport Charges"
                      type="number"
                      placeholder="0.00"
                      leftIcon={<span className="text-slate-400 text-sm">₹</span>}
                      value={charges.transport as any}
                      onChange={(e) => setCharges({ ...charges, transport: e.target.value ? Number(e.target.value) : "" })}
                    />
                    <Input
                      label="Other Charges (Loading etc.)"
                      type="number"
                      placeholder="0.00"
                      leftIcon={<span className="text-slate-400 text-sm">₹</span>}
                      value={charges.other as any}
                      onChange={(e) => setCharges({ ...charges, other: e.target.value ? Number(e.target.value) : "" })}
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
                  <span className="block text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Purchase Cost</span>
                  <span className="text-3xl font-semibold tracking-tight text-slate-900">
                    ₹{stats.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* RIGHT SIDE: Payment Details */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-sm font-semibold text-slate-800">Payment Details</h2>
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
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${payment.method === m.id
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50/30"
                        }`}
                    >
                      <div className="mb-2">{m.icon}</div>
                      <span className="text-xs font-medium">{m.id}</span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 p-5 rounded-xl border border-slate-100 items-center mt-auto">
                  <div className="flex-1 w-full">
                    <Input
                      label="Amount Paid Now (₹)"
                      type="number"
                      className="!text-lg !font-medium !text-blue-700"
                      value={payment.amountPaid as any}
                      onChange={(e) => setPayment({ ...payment, amountPaid: e.target.value ? Number(e.target.value) : "" })}
                      placeholder={stats.grandTotal.toString()}
                    />
                  </div>
                  <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>
                  <div className="flex-1 w-full flex flex-col justify-center sm:items-end sm:text-right">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Outstanding
                    </span>
                    <span className={`text-2xl font-semibold tracking-tight ${stats.outstanding > 0 ? "text-blue-600" : "text-emerald-600"}`}>
                      ₹{stats.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Product Entry Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden mt-6">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <h2 className="text-sm font-semibold text-slate-800">Items List</h2>
                <div className="flex items-center gap-3">
                  <button className="text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <ScanLine size={16} /> Scan Barcode
                  </button>
                  <button onClick={addProduct} className="text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm shadow-blue-200/50">
                    <Plus size={16} /> Add Row
                  </button>
                </div>
              </div>

              {/* DISTRIBUTOR COST SPLIT SECTION */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Cost Split Method
                  </span>
                  <div className="flex items-center bg-slate-200/50 p-1 rounded-lg">
                    {["By Unit", "By Value"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setCostMethod(method)}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${costMethod === method
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-0 overflow-x-auto">
                <div className="min-w-[1000px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider items-center">
                    <div className="col-span-3">Product / Item</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-1 text-center">Unit</div>
                    <div className="col-span-1 text-right">Buy Price</div>
                    <div className="col-span-1 text-center">Net Cost</div>
                    <div className="col-span-2 text-center">Margin</div>
                    <div className="col-span-1 text-right">Sell Price</div>
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

                            {/* --- PRODUCT SEARCH SELECT --- */}
                            <div className="col-span-3">
                              <SearchSelect
                                labelKey="name"
                                valueKey="id"
                                fetchOptions={async (q) => await inventoryApi.searchInventories(q)}
                                value={product.name}
                                onChange={(val, opt: any) => {
                                  if (opt) {
                                    // Check if the API response indicates variants
                                    const hasVariants = opt.has_variants || (opt.datas && opt.datas.has_variants);
                                    const combinations = opt.combinations || (opt.datas && opt.datas.combinations) || [];
                                    
                                    if (hasVariants && combinations.length > 0) {
                                      // Transform the raw combinations into the format expected by the modal
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
                                      // Product has no variants, populate row directly
                                      const dataNode = opt.datas || opt;
                                      const updated = [...products];
                                      updated[index].name = dataNode.name || String(val);
                                      updated[index].costPrice = dataNode.buy_price ?? dataNode.costPrice ?? "";
                                      updated[index].sellingPrice = dataNode.sell_price ?? dataNode.sellingPrice ?? "";
                                      updated[index].sku = dataNode.barcode ?? dataNode.sku ?? "";
                                      updated[index].unit = dataNode.unit ?? "pc";
                                      updated[index].category = dataNode.category ?? "";
                                      setProducts(updated);
                                    }
                                  } else {
                                    handleProductChange(index, "name", String(val));
                                  }
                                }}
                                placeholder="Search product..."
                                className="w-full !border-slate-200"
                              />
                              {product.variant && (
                                <div className="mt-2 text-[11px] font-medium text-slate-500 flex gap-2 items-center">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">{product.variant}</span>
                                  <span className="text-slate-400">SKU: {product.sku}</span>
                                </div>
                              )}
                            </div>

                            <div className="col-span-1">
                              <Input
                                type="number"
                                placeholder="0"
                                className="!text-center !px-1 !border-slate-200"
                                value={product.quantity as any}
                                onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                              />
                            </div>

                            <div className="col-span-1">
                              <SearchSelect
                                labelKey="label"
                                valueKey="value"
                                placeholder="Unit"
                                className="w-full !text-center !border-slate-200"
                                options={[
                                  { value: "pc", label: "pc" },
                                  { value: "kg", label: "kg" },
                                  { value: "ltr", label: "ltr" },
                                  { value: "m", label: "m" },
                                ]}
                                value={product.unit}
                                onChange={(val) => handleProductChange(index, "unit", String(val))}
                              />
                            </div>

                            <div className="col-span-1">
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="!text-right !px-2 !border-slate-200"
                                value={product.costPrice as any}
                                onChange={(e) => handleProductChange(index, "costPrice", e.target.value)}
                              />
                            </div>

                            <div className="col-span-1 flex flex-col justify-center items-end text-sm text-slate-500 pr-2">
                              {finalCost > 0 ? (
                                <div className="text-right flex flex-col gap-0.5">
                                  <span className="text-[10px] text-slate-400">+{allocated.toFixed(2)}</span>
                                  <span className="font-medium text-slate-700">₹{finalCost.toFixed(2)}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </div>

                            <div className="col-span-2 flex items-center justify-center gap-1 px-2">
                              <Input
                                type="number"
                                placeholder="₹ Margin"
                                className="!text-center !px-1 !border-slate-200"
                                value={valMarginAmount as any}
                                onChange={(e) => updateProductFields(index, { marginType: "amount", marginAmount: e.target.value ? Number(e.target.value) : "" })}
                              />
                            </div>

                            <div className="col-span-1">
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="!text-right !font-medium !text-slate-800 !border-slate-200"
                                value={valSellingPrice as any}
                                onChange={(e) => updateProductFields(index, { marginType: "sellingPrice", sellingPrice: e.target.value ? Number(e.target.value) : "" })}
                              />
                            </div>

                            <div className="col-span-2 flex items-center justify-end gap-3 h-[42px]">
                              <div className="flex flex-col items-end pr-1">
                                <span className="font-semibold text-slate-800 text-sm">₹{rowTotal.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                                <button
                                  type="button"
                                  onClick={() => toggleAdvanced(index)}
                                  className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                >
                                  {isExpanded ? <ChevronUp size={16} /> : <Settings size={16} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeProduct(index)}
                                  disabled={products.length === 1}
                                  className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md disabled:opacity-30 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Batch Tracking & Dates */}
                          <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 flex items-center gap-4 flex-wrap">
                            <button
                              onClick={() => updateProductFields(index, { batchTracking: !product.batchTracking })}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${product.batchTracking
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-blue-50'
                                }`}
                            >
                              <CalendarDays size={14} />
                              Batch Tracking
                            </button>

                            <div className={`flex items-center gap-4 overflow-hidden transition-all duration-300 ${product.batchTracking ? 'opacity-100 max-w-[600px]' : 'opacity-0 max-w-0 pointer-events-none'}`}>
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

                          {/* Advanced Settings Drawer */}
                          {isExpanded && (
                            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-5">
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

            {/* Action Buttons Integration (Properly aligned inside the main flex-1 container) */}
            <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-200 mt-6">
              <button className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleSavePurchase}
                className="px-8 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200/60 disabled:opacity-50"
              >
                {loading ? "Saving..." : <><Save size={18} /> Save Purchase Order</>}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;