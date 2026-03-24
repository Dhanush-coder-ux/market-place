import{ useState, useMemo } from "react";
import {
  Save, Plus, Trash2, Settings, ScanLine, Search,
  Banknote, Smartphone, CreditCard, Landmark // Replaced Heroicons with Lucide equivalents
} from "lucide-react";

// Adjust these imports to match your folder structure
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";

// --- Types ---
type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";

export interface ProductItem {
  id: string;
  name: string;
  quantity: number | "";
  costPrice: number | "";
  sellingPrice: number | "";
  unit: string;
  // Advanced fields
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
      id: "1", name: "", quantity: "", costPrice: "", sellingPrice: "", unit: "Piece",
      taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", batchNum: "", sku: "", variant: "", size: ""
    }
  ]);

  const [charges, setCharges] = useState({ transport: "" as number | "", other: "" as number | "" });
  const [payment, setPayment] = useState({ method: "Cash" as PaymentMethod, amountPaid: "" as number | "" });
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

  const addProduct = () => {
    setProducts([...products, {
      id: Math.random().toString(), name: "", quantity: "", costPrice: "", sellingPrice: "", unit: "Piece",
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
    <div className="min-h-screen  p-4 md:p-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Add Purchase</h1>
          <p className="text-sm text-slate-500">Ref: <span className="font-semibold text-slate-700">{purchaseDetails.referenceNo}</span></p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            Cancel
          </button>
          <button className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition">
            <Save size={16} /> Save & Add to Stock
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* ================= LEFT COLUMN (MAIN FORM) ================= */}
        <div className="flex-1 space-y-6">
          
          {/* 1. Purchase Details */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4"> Purchase Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                required
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

          {/* 2. Quick Add Bar */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-inner flex items-center gap-4">
            <button className="p-3 bg-white text-blue-600 rounded-lg shadow-sm border border-blue-200 hover:bg-blue-50 transition flex items-center gap-2 font-semibold whitespace-nowrap">
              <ScanLine size={18} /> <span className="hidden sm:inline">Scan Barcode</span>
            </button>
            <div className="flex-1">
              <Input 
              onChange={()=>{}}
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
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Products</h2>
              <button onClick={addProduct} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 flex items-center gap-1">
                <Plus size={14} /> Add Row
              </button>
            </div>
            
            <div className="p-0">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Cost Price (₹)</div>
                <div className="col-span-2">Selling Price (₹)</div>
                <div className="col-span-2 text-right">Total (₹)</div>
              </div>

              {/* Product Rows */}
              {products.map((product, index) => {
                const rowTotal = (Number(product.quantity) || 0) * (Number(product.costPrice) || 0);
                const isExpanded = expandedProductIndex === index;

                return (
                  <div key={product.id} className="border-b border-slate-100 last:border-0">
                    <div className="grid grid-cols-12 gap-3 p-4 items-center hover:bg-slate-50/50 transition-colors">
                      <div className="col-span-4">
                        <ReusableSelect
                          value={product.name}
                          onValueChange={(val) => handleProductChange(index, "name", val)}
                          options={productOptions}
                          placeholder="Select..."
                          className="!h-[42px] !py-2" // Adjust height to match inputs
                        />
                      </div>
                      <div className="col-span-2 flex gap-1 items-start">
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={product.quantity as any} 
                          onChange={(e) => handleProductChange(index, "quantity", e.target.value)} 
                        />
                        <span className="p-2.5 bg-slate-100 text-slate-500 rounded-lg text-xs flex items-center border border-slate-200 h-[42px]">Pc</span>
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={product.costPrice as any} 
                          onChange={(e) => handleProductChange(index, "costPrice", e.target.value)} 
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="text-green-700 bg-green-50/30 font-semibold"
                          value={product.sellingPrice as any} 
                          onChange={(e) => handleProductChange(index, "sellingPrice", e.target.value)} 
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-3 h-[42px]">
                        <span className="font-semibold text-slate-700 text-sm">₹{rowTotal.toLocaleString()}</span>
                        <button onClick={() => toggleAdvanced(index)} className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                          <Settings size={16} />
                        </button>
                        <button onClick={() => removeProduct(index)} disabled={products.length === 1} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md disabled:opacity-30">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Advanced Settings Panel */}
                    {isExpanded && (
                      <div className="p-5 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-inner">
                        <Input label="Tax/GST %" type="number" value={product.taxGst as any} onChange={(e) => handleProductChange(index, "taxGst", e.target.value)} />
                        <Input label="Storage Location" placeholder="e.g. Shelf 3" value={product.storageLoc} onChange={(e) => handleProductChange(index, "storageLoc", e.target.value)} />
                        <Input label="Reorder Point" type="number" placeholder="Min stock" value={product.reorderPoint as any} onChange={(e) => handleProductChange(index, "reorderPoint", e.target.value)} />
                        <Input label="Batch Number" placeholder="BATCH-001" value={product.batchNum} onChange={(e) => handleProductChange(index, "batchNum", e.target.value)} />
                        <Input label="SKU / Barcode" placeholder="WH-001" value={product.sku} onChange={(e) => handleProductChange(index, "sku", e.target.value)} />
                        <div className="flex gap-2">
                          <Input label="Variant" placeholder="Color" value={product.variant} onChange={(e) => handleProductChange(index, "variant", e.target.value)} />
                          <Input label="Size" placeholder="S/M/L" value={product.size} onChange={(e) => handleProductChange(index, "size", e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Payment Details */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4"> Payment Details</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { id: "Cash", icon: <Banknote size={24} strokeWidth={1.5} /> },
                { id: "UPI", icon: <Smartphone size={24} strokeWidth={1.5} /> },
                { id: "Card", icon: <CreditCard size={24} strokeWidth={1.5} /> },
                { id: "Bank", icon: <Landmark size={24} strokeWidth={1.5} /> }
              ].map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setPayment({...payment, method: m.id as PaymentMethod})}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${payment.method === m.id ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="mb-2">{m.icon}</div>
                  <span className="text-sm font-bold">{m.id}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex-1">
                <Input 
                  label="Amount Paid Now (₹)"
                  type="number" 
                  className="!text-lg !font-bold !text-blue-700"
                  value={payment.amountPaid as any}
                  onChange={(e) => setPayment({...payment, amountPaid: e.target.value})}
                  placeholder={stats.grandTotal.toString()}
                />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-500 mb-1">Outstanding Balance</span>
                <span className={`text-2xl font-black ${stats.outstanding > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                  ₹{stats.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN (SIDEBAR) ================= */}
        <div className="w-full xl:w-96 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
              <div className="text-3xl font-black text-slate-700">{products.length}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Products</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
              <div className="text-3xl font-black text-slate-700">{stats.totalQty}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Total Units</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Order Summary</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-sm font-semibold">Subtotal (Product Cost)</span>
                <span className="font-bold">₹{stats.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <Input 
                  label="Transport Charges"
                  type="number" 
                  placeholder="0.00" 
                  leftIcon={<span className="text-sm">₹</span>}
                  value={charges.transport as any}
                  onChange={(e) => setCharges({...charges, transport: e.target.value})}
                />
                
                <Input 
                  label="Other Charges (Loading etc.)"
                  type="number" 
                  placeholder="0.00" 
                  leftIcon={<span className="text-sm">₹</span>}
                  value={charges.other as any}
                  onChange={(e) => setCharges({...charges, other: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="text-sm font-semibold">GST @ 18%</span>
                <span className="font-bold">₹{stats.gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="p-5  text-black">
              <div className="flex justify-between items-end">
                <div>
                  <span className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">Total Purchase Cost</span>
                  <span className="text-3xl font-black">₹{stats.grandTotal.toLocaleString()}</span>
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