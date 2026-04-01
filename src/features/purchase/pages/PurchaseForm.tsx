import { useState, useMemo } from "react";
import {
  Save, Plus, Trash2, Settings, ScanLine, Search,
  Banknote, Smartphone, CreditCard, Landmark, ChevronUp, Package,
  ShoppingCart
} from "lucide-react";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";

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
  batchNum: string;
  sku: string;
  variant: string;
  size: string;
}

const PurchaseScreen = () => {
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
      taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", batchNum: "", sku: "", variant: "", size: ""
    }
  ]);

  const [charges, setCharges] = useState({ transport: "" as number | "", other: "" as number | "" });
  const [payment, setPayment] = useState({ method: "Cash" as PaymentMethod, amountPaid: "" as number | "" });
  const [costMethod, setCostMethod] = useState("By Value");
  const [expandedProductIndex, setExpandedProductIndex] = useState<number | null>(null);

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
      taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", batchNum: "", sku: "", variant: "", size: ""
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

  return (
    <div className="h-full font-sans text-slate-800 bg-slate-50/50 min-h-screen">
      
      {/* Header - Added sticky top, blur, and subtle bottom border */}
      <div className=" flex justify-end items-center p-5">
     
        <div className="flex gap-3">
          <GradientButton variant="outline" className="hover:bg-slate-50 transition-colors">
            Cancel
          </GradientButton>
          <GradientButton variant="primary" icon={<Save size={16} />} iconPosition="left" className="shadow-md hover:shadow-lg transition-all">
            Save & Add to Stock
          </GradientButton>
        </div>
      </div>

      <div className="p-5 max-w-[1600px] mx-auto">
        <div className="flex flex-col xl:flex-row gap-6 items-start relative">
          
          <div className="flex-1 space-y-6 w-full pb-10">
            
            {/* Stats Row - Enhanced with icons and gradient backgrounds */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/70 flex items-center justify-between hover:border-blue-200 transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Unique Products</div>
                  <div className="text-3xl font-bold text-slate-800">{products.length}</div>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                  <Package size={24} />
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/70 flex items-center justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Units</div>
                  <div className="text-3xl font-bold text-slate-800">{stats.totalQty}</div>
                </div>
                <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                  <ShoppingCart size={24} />
                </div>
              </div>
            </div>

            {/* 1. Purchase Details - Refined section header and inputs */}
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
                  onValueChange={(val) => setPurchaseDetails({...purchaseDetails, supplier: val})}
                  placeholder="Select Supplier..."
                />
                <Input 
                  label="Supplier Invoice #"
                  placeholder="e.g. INV-2025-456"
                  value={purchaseDetails.invoiceNo}
                  onChange={(e) => setPurchaseDetails({...purchaseDetails, invoiceNo: e.target.value})}
                />
                <Input 
                  label="Purchase Date"
                  required
                  type="date"
                  value={purchaseDetails.date}
                  onChange={(e) => setPurchaseDetails({...purchaseDetails, date: e.target.value})}
                />
              </div>
            </div>

            {/* Middle Section: Summary & Payment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* LEFT SIDE: Order Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden flex flex-col h-full">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Order Summary</h2>
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

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-slate-600">
                    <span className="text-sm font-medium">GST @ 18%</span>
                    <span className="font-semibold text-slate-800">
                      ₹{stats.gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white text-black mt-auto">
                  <span className="block text-black-400 text-xs font-bold uppercase tracking-widest mb-1">Total Purchase Cost</span>
                  <span className="text-4xl font-bold tracking-tight">
                    ₹{stats.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* RIGHT SIDE: Payment Details & Distributor */}
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
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                          payment.method === m.id
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

           {/* Distributor Cost Card */}
<div className="bg-white p-6 rounded-2xl shadow-md flex flex-col gap-4 text-black">
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
      Distributor Cost Split
    </span>
    
    <div className="flex items-center gap-3 self-start sm:self-auto">
      {/* 1. The Toggle */}
      <div className="flex items-center bg-white p-1 rounded-lg border border-slate-700">
        {["By Unit", "By Value"].map((method) => (
          <button
            key={method}
            onClick={() => setCostMethod(method)}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
              costMethod === method 
                ? "bg-blue-500 text-white shadow-sm" 
                : "text-slate-400 hover:text-black hover:bg-white"
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      {/* 2. Your Missing Button (Styled for the dark theme!) */}
      <button className="px-5 py-2 text-xs font-bold text-slate-900 bg-white border border-transparent rounded-lg shadow-sm hover:bg-slate-100 active:bg-slate-200 transition-all duration-200 flex items-center gap-2">
        Distributor Cost
      </button>
    </div>
  </div>

                  <div className="flex items-baseline mt-2">
                    <span className="text-3xl font-bold tracking-tight">
                      ₹{stats.grandTotal.toLocaleString()}
                    </span>
                    {costMethod === "By Unit" && (
                      <span className="ml-3 text-sm font-medium text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-500/30">
                        ~₹{stats.totalQty > 0 ? (stats.grandTotal / stats.totalQty).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0} <span className="text-blue-400/70 text-xs">/ unit</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* 2. Quick Add Bar - Styled like a floating action bar */}
            <div className="bg-white p-3 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 pointer-events-none"></div>
              <button className="relative z-10 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all duration-200 flex items-center gap-2 font-semibold whitespace-nowrap">
                <ScanLine size={18} /> <span className="hidden sm:inline">Scan Barcode</span>
              </button>
              <div className="flex-1 relative z-10">
                <Input 
                  onChange={()=>{}}
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
              
              <div className="p-0">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <div className="col-span-3">Product Details</div>
                  <div className="col-span-1">QTY</div>
                  <div className="col-span-1">Base Cost</div>
                  <div className="col-span-1">Allocated</div>
                  <div className="col-span-2">Margin (% & ₹)</div>
                  <div className="col-span-2">Selling Price (₹)</div>
                  <div className="col-span-2 text-right">Row Total</div>
                </div>

                {/* Product Rows */}
                <div className="divide-y divide-slate-100">
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
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center group-hover:bg-slate-50/50">
                          <div className="col-span-3">
                            <ReusableSelect
                              value={product.name}
                              onValueChange={(val) => handleProductChange(index, "name", val)}
                              options={productOptions}
                              placeholder="Select product..."
                              className="!bg-white" 
                            />
                          </div>
                          <div className="col-span-1 flex gap-1 items-center">
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="!text-center !px-1"
                              value={product.quantity as any} 
                              onChange={(e) => handleProductChange(index, "quantity", e.target.value)} 
                            />
                          </div>
                          <div className="col-span-1 flex flex-col justify-center">
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              value={product.costPrice as any} 
                              onChange={(e) => handleProductChange(index, "costPrice", e.target.value)} 
                            />
                          </div>
                          <div className="col-span-1 flex flex-col justify-center text-xs text-slate-500 bg-slate-50/80 px-2 py-1.5 rounded-lg border border-slate-100">
                            {finalCost > 0 ? (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Alloc</span> 
                                  <span className="font-medium">₹{allocated.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-200/80">
                                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Final</span> 
                                  <span className="font-bold text-blue-600">₹{finalCost.toFixed(2)}</span>
                                </div>
                              </>
                            ) : (
                              <div className="text-center text-slate-300 font-medium">-</div>
                            )}
                          </div>
                          <div className="col-span-2 flex gap-1 items-start">
                          
                             <div className="w-1/2">
                               <Input 
                                 type="number"
                                 placeholder="₹" 
                                 className="!text-center !px-1"
                                 value={valMarginAmount as any}
                                 onChange={(e) => updateProductFields(index, { marginType: "amount", marginAmount: e.target.value ? Number(e.target.value) : "" })}
                               />
                             </div>
                          </div>
                          <div className="col-span-2">
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              className="!text-emerald-700 !bg-emerald-50/50 !border-emerald-200/60 font-semibold focus:!ring-emerald-100 focus:!border-emerald-400"
                              value={valSellingPrice as any} 
                              onChange={(e) => updateProductFields(index, { marginType: "sellingPrice", sellingPrice: e.target.value ? Number(e.target.value) : "" })} 
                            />
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-3">
                            <span className="font-bold text-slate-800 text-sm w-24 text-right">₹{rowTotal.toLocaleString()}</span>
                            <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                              <button 
                                onClick={() => toggleAdvanced(index)} 
                                title="Advanced Options"
                                className={`p-1.5 rounded-lg transition-all duration-200 ${isExpanded ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                              >
                                {isExpanded ? <ChevronUp size={16} strokeWidth={2.5}/> : <Settings size={16} />}
                              </button>
                              <button 
                                onClick={() => removeProduct(index)} 
                                disabled={products.length === 1} 
                                title="Remove Row"
                                className="p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
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
    </div>
  );
};

export default PurchaseScreen;