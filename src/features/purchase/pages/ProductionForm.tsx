import { useState, useMemo } from 'react';
import { 
  Factory, Package, Banknote, 
  Save, Settings, Trash2, Plus, 
  CheckCircle2, Smartphone, CreditCard, Landmark,
  CalendarDays
} from 'lucide-react';

// Adjust these imports to match your project structure
import Input from '@/components/ui/Input'; 
import { ReusableSelect } from '@/components/ui/ReusableSelect';
import { GradientButton } from '@/components/ui/GradientButton';

// --- Types ---
interface FinishedProduct {
  id: string;
  product: string;
  qty: number | "";
  unitCost: number | "";
  sellingPrice: number | "";
  showAdvanced: boolean;
  expiry: string;
  storage: string;
  grade: string;
  reorder: number | "";
  unit: string;
  variant: string;
  marginPercent: number | "";
  marginAmount: number | "";
  marginType: "percent" | "amount" | "sellingPrice";
  manufacturingDate: string;
  expiryDate: string;
  batchTracking: boolean;
}

type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";

export default function ProductionEntryPage() {
  // --- State Management ---
  
  // 1. Production Details
  const [details, setDetails] = useState({
    date: '2025-03-14',
    reference: 'PRD-2025-0089',
    location: 'Workshop A',
    supervisor: 'Sarah Johnson',
    batch: 'BATCH-2025-001',
    status: 'Completed',
    notes: '',
  });

  // 2. Finished Products Array
  const [products, setProducts] = useState<FinishedProduct[]>([
    {
      id: 'prod-1',
      product: 'Handmade Soap Bar',
      qty: 100,
      unitCost: 45.00,
      sellingPrice: 99.00,
      marginPercent: 50,
      marginAmount: 22.50,
      marginType: "percent",
      showAdvanced: false,
      expiry: '2026-03-14',
      storage: 'Storage Room A',
      grade: 'Grade A',
      reorder: 20,
      unit: 'Piece',
      variant: 'Lavender',
      manufacturingDate: "",
      expiryDate: "",
      batchTracking: false,
    }
  ]);

  // 3. Production Costs
  const [costs, setCosts] = useState({
    labor: 1500.00,
    overhead: 500.00,
    packaging: 300.00,
    equipment: 200.00,
    other: 150.00,
  });

  // 4. Order & Payment Details (New State)
  const [charges, setCharges] = useState({ transport: '', other: '' });
  const [payment, setPayment] = useState({ method: 'Cash' as PaymentMethod, amountPaid: '' });
  const [costMethod, setCostMethod] = useState('By Unit');

  // --- Handlers ---
  const handleDetailChange = (field: string, value: any) => setDetails(prev => ({ ...prev, [field]: value }));
  const handleCostChange = (field: string, value: string) => setCosts(prev => ({ ...prev, [field]: Number(value) || 0 }));
  const handleProductChange = (index: number, field: keyof FinishedProduct, value: any) => {
    setProducts(products.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };
  // Product Handlers
  const addProduct = () => {
    setProducts([...products, {
      id: `prod-${Date.now()}`, product: '', qty: 1, unitCost: 0, sellingPrice: 0, showAdvanced: true,
      expiry: '', storage: '', grade: '', reorder: 0, unit: 'Piece', variant: '',
      marginPercent: "", marginAmount: "", marginType: "percent",
      manufacturingDate: "",
      expiryDate: "",
      batchTracking: false,
    }]);
  };
  const updateProduct = (id: string, field: keyof FinishedProduct, value: any) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const updateProductFields = (id: string, fields: Partial<FinishedProduct>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...fields } : p));
  };
  const removeProduct = (id: string) => setProducts(products.filter(p => p.id !== id));
  const toggleAdvanced = (id: string) => updateProduct(id, 'showAdvanced', !products.find(p => p.id === id)?.showAdvanced);

  // --- Calculations ---
  const summary = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);
    const productValue = products.reduce((sum, p) => sum + ((Number(p.qty) || 0) * (Number(p.sellingPrice) || 0)), 0);
    const totalProductionCost = costs.labor + costs.overhead + costs.packaging + costs.equipment + costs.other;

    return { totalProducts, totalUnits, productValue, totalProductionCost };
  }, [products, costs]);

  // Stats calculation for the Order Summary
  const stats = useMemo(() => {
    const subtotal = products.reduce((sum, p) => sum + ((Number(p.qty) || 0) * (Number(p.unitCost) || 0)), 0);
    const totalQty = products.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);
    const transportAmount = Number(charges.transport) || 0;
    const otherAmount = Number(charges.other) || 0;
    
    const grandTotal = subtotal + transportAmount + otherAmount;
    
    const paid = Number(payment.amountPaid) || 0;
    const outstanding = grandTotal - paid;

    return { subtotal, grandTotal, outstanding, totalQty };
  }, [products, charges, payment]);

  // --- Options ---
  const locationOptions = [{ value: 'Workshop A', label: 'Workshop A' }, { value: 'Factory Floor 1', label: 'Factory Floor 1' }];
  const supervisorOptions = [{ value: 'Sarah Johnson', label: 'Sarah Johnson' }, { value: 'Mike Wilson', label: 'Mike Wilson' }];
  const statusOptions = [{ value: 'In Progress', label: 'In Progress' }, { value: 'Completed', label: 'Completed' }];
  const productOptions = [{ value: 'Handmade Soap Bar', label: 'Handmade Soap Bar' }, { value: 'Organic Face Cream', label: 'Organic Face Cream' }];
  const storageOptions = [{ value: 'Storage Room A', label: 'Storage Room A' }, { value: 'Warehouse A', label: 'Warehouse A' }];
  const gradeOptions = [{ value: 'Grade A', label: 'Grade A' }, { value: 'Grade B', label: 'Grade B' }];
  const unitOptions = [{ value: 'Piece', label: 'Piece' }, { value: 'Box', label: 'Box' }, { value: 'Kg', label: 'Kg' }];

  return (
    <div className="flex min-h-screen font-sans text-slate-800 antialiased">
      <main className="flex-1 mx-auto">
        

        {/* Main Grid */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_400px]">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            
            {/* 1. Production Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EFFF] text-[#4F7CFF]">
                  <Factory size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Production Details</h2>
                  <p className="text-[13px] text-slate-500">Basic production information</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Production Date" required type="date" value={details.date} onChange={(e) => handleDetailChange('date', e.target.value)} />
                <Input label="Reference Number" value={details.reference} disabled onChange={() => {}} />
                <ReusableSelect label="Location" required options={locationOptions} value={details.location} onValueChange={(val) => handleDetailChange('location', val)} />
                <ReusableSelect label="Supervisor" options={supervisorOptions} value={details.supervisor} onValueChange={(val) => handleDetailChange('supervisor', val)} />
                <Input label="Batch Number" required value={details.batch} onChange={(e) => handleDetailChange('batch', e.target.value)} />
                <ReusableSelect label="Production Status" options={statusOptions} value={details.status} onValueChange={(val) => handleDetailChange('status', val)} />
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Production Notes</label>
                  <textarea 
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" 
                    rows={3} 
                    value={details.notes}
                    onChange={(e) => handleDetailChange('notes', e.target.value)}
                    placeholder="Optional notes about this production batch..."
                  />
                </div>
              </div>
            </div>

 

            {/* 3. Production Costs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5] text-[#10B981]">
                  <Banknote size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Production Costs</h2>
                  <p className="text-[13px] text-slate-500">Labor, overhead, and other costs</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <Input label="Labor Cost" type="number" value={costs.labor} onChange={(e) => handleCostChange('labor', e.target.value)} />
                <Input label="Overhead Cost" type="number" value={costs.overhead} onChange={(e) => handleCostChange('overhead', e.target.value)} />
                <Input label="Packaging Cost" type="number" value={costs.packaging} onChange={(e) => handleCostChange('packaging', e.target.value)} />
                <Input label="Equipment Cost" type="number" value={costs.equipment} onChange={(e) => handleCostChange('equipment', e.target.value)} />
                <Input label="Other Costs" type="number" value={costs.other} onChange={(e) => handleCostChange('other', e.target.value)} />
              </div>
            </div>

            {/* 4. Order Summary & Payment Details (Newly Inserted Section) */}
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
                      value={charges.transport}
                      onChange={(e) => setCharges({ ...charges, transport: e.target.value })}
                    />

                    <Input
                      label="Other Charges (Loading etc.)"
                      type="number"
                      placeholder="0.00"
                      leftIcon={<span className="text-slate-400 text-sm font-medium">₹</span>}
                      value={charges.other}
                      onChange={(e) => setCharges({ ...charges, other: e.target.value })}
                    />
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
                        value={payment.amountPaid}
                        onChange={(e) => setPayment({ ...payment, amountPaid: e.target.value })}
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

                       {/* 2. Finished Products */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EFFF] text-[#4F7CFF]">
                    <Package size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Finished Products</h2>
                    <p className="text-[13px] text-slate-500">Products being manufactured</p>
                  </div>
                </div>
                <GradientButton variant="outline" icon={<Plus size={16} />} onClick={addProduct}>Add Product</GradientButton>
              </div>

              {/* Distributor Cost Split Bar */}
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
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                          costMethod === method 
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

              {products.map((product, index) => {
                const q = Number(product.qty) || 0;
                const baseCost = Number(product.unitCost) || 0;
                const rowTotal = q * baseCost;

                // Allocable cost: total production costs + any extra charges
                const transportAmount = Number(charges.transport) || 0;
                const otherAmount = Number(charges.other) || 0;
                const totalAllocatable = summary.totalProductionCost + transportAmount + otherAmount;

                // Calculate Allocation
                let allocated = 0;
                if (costMethod === "By Unit" && stats.totalQty > 0) {
                  allocated = totalAllocatable / stats.totalQty;
                } else if (costMethod === "By Value" && stats.subtotal > 0) {
                  allocated = (baseCost / stats.subtotal) * totalAllocatable;
                }
                const finalCost = baseCost + allocated;

                // Calculate Margins
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
                <div key={product.id} className="mb-4 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8EFFF] font-bold text-[#4F7CFF]">{index + 1}</div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleAdvanced(product.id)} className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${product.showAdvanced ? 'bg-[#E8EFFF] border-[#4F7CFF] text-[#4F7CFF]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                        <Settings size={16} />
                      </button>
                      <button onClick={() => removeProduct(product.id)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-red-500 hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 items-start">
                    <div className="lg:col-span-2">
                      <ReusableSelect label="Product *" options={productOptions} value={product.product} onValueChange={(val) => updateProduct(product.id, 'product', val)} />
                    </div>
                    
                    <Input label="Quantity *" type="number" value={product.qty as any} onChange={(e) => updateProduct(product.id, 'qty', e.target.value ? Number(e.target.value) : "")} />
                    
                    <Input label="Base Cost *" type="number" value={product.unitCost as any} onChange={(e) => updateProduct(product.id, 'unitCost', e.target.value ? Number(e.target.value) : "")} />
                    
                    {/* Allocation Read-only */}
                    <div className="flex flex-col justify-center text-xs text-slate-500 bg-slate-50/80 px-3 py-[9px] rounded-lg border border-slate-100 h-[42px] mt-[1.4rem]">
                      {finalCost > 0 ? (
                        <>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">Alloc</span> 
                            <span className="font-medium text-slate-700">₹{allocated.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200/80">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">Final</span> 
                            <span className="font-bold text-blue-600">₹{finalCost.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-slate-400 font-medium py-1">-</div>
                      )}
                    </div>

                    <Input label="Total" disabled value={`₹${rowTotal.toLocaleString()}`} onChange={() => {}} className="font-bold text-slate-800" />
                  </div>

                  {/* Margin Section */}
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl items-end relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Margin (% and ₹)</label>
                      <div className="flex gap-2">
                        <Input 
                          type="number"
                          placeholder="%" 
                          className="!text-center !px-1"
                          value={product.marginType === "percent" ? product.marginPercent as any : (product.marginPercent !== "" ? product.marginPercent : "")}
                          onChange={(e) => updateProductFields(product.id, { marginType: "percent", marginPercent: e.target.value ? Number(e.target.value) : "" })}
                        />
                        <Input 
                          type="number"
                          placeholder="₹" 
                          className="!text-center !px-1"
                          value={valMarginAmount as any}
                          onChange={(e) => updateProductFields(product.id, { marginType: "amount", marginAmount: e.target.value ? Number(e.target.value) : "" })}
                        />
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <Input 
                        label="Final Selling Price (₹)"
                        type="number" 
                        placeholder="0.00" 
                        className="!text-emerald-700 !bg-emerald-50/50 !border-emerald-200/60 font-semibold focus:!ring-emerald-100 focus:!border-emerald-400"
                        value={valSellingPrice as any} 
                        onChange={(e) => {
                          updateProductFields(product.id, { marginType: "sellingPrice", sellingPrice: e.target.value ? Number(e.target.value) : "" });
                        }} 
                      />
                    </div>
                  </div>

                   <div className="px-6 py-3 border-t border-slate-100/80 bg-white flex items-center gap-4 flex-wrap">
                          <button
                            onClick={() => updateProductFields(product.id, { batchTracking: !product.batchTracking })}
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

                  {product.showAdvanced && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                      <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><Settings size={14}/> Advanced Settings</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Input label="Expiry Date" type="date" value={product.expiry} onChange={(e) => updateProduct(product.id, 'expiry', e.target.value)} />
                        <ReusableSelect label="Storage Location" options={storageOptions} value={product.storage} onValueChange={(val) => updateProduct(product.id, 'storage', val)} />
                        <ReusableSelect label="Quality Grade" options={gradeOptions} value={product.grade} onValueChange={(val) => updateProduct(product.id, 'grade', val)} />
                        <Input label="Reorder Point" type="number" value={product.reorder} onChange={(e) => updateProduct(product.id, 'reorder', e.target.value)} />
                        <ReusableSelect label="Unit" options={unitOptions} value={product.unit} onValueChange={(val) => updateProduct(product.id, 'unit', val)} />
                        <Input label="Color/Variant" placeholder="e.g. Lavender" value={product.variant} onChange={(e) => updateProduct(product.id, 'variant', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>

          </div>

          {/* Right Column - Summary Sidebar */}
          <div className="sticky top-6 flex flex-col gap-6">
            
            {/* Quick Stats Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 border-b border-slate-200 pb-4 text-lg font-bold text-slate-800">Production Summary</h3>
              
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Products</div>
                  <div className="tabular-nums text-2xl font-bold text-slate-800">{summary.totalProducts}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Units</div>
                  <div className="tabular-nums text-2xl font-bold text-slate-800">{summary.totalUnits}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Product Value</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{summary.productValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Labor Cost</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{costs.labor.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Overhead</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{costs.overhead.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Packaging</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{costs.packaging.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Equipment</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{costs.equipment.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Other Costs</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">₹{costs.other.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200">
                  <span className="text-[15px] font-bold text-slate-800">Total Prod Cost</span>
                  <span className="tabular-nums text-2xl font-black text-[#4F7CFF]">₹{summary.totalProductionCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Production Info Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-800">Production Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Batch</span>
                  <span className="tabular-nums text-sm font-bold text-slate-800">{details.batch}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Location</span>
                  <span className="text-sm font-bold text-slate-800">{details.location}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-medium text-slate-500">Supervisor</span>
                  <span className="text-sm font-bold text-slate-800">{details.supervisor}</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[13px] font-medium text-slate-500">Status</span>
                  <span className="bg-[#EDE9FE] text-[#8B5CF6] px-2 py-0.5 rounded text-[11px] font-bold uppercase">{details.status}</span>
                </div>
              </div>
            </div>

            {/* Success Alert */}
            <div className="flex items-start gap-3 rounded-xl border border-[#86EFAC] bg-[#D1FAE5] p-4 text-[13px] font-medium text-[#047857]">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>Stock will be updated automatically when you save.</div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <GradientButton variant="primary" icon={<Save className="h-5 w-5" />} className="h-[52px] w-full text-[15px]">
                Save & Add to Stock
              </GradientButton>
              <GradientButton variant="outline" className="h-[52px] w-full text-[15px]">
                Save as Draft
              </GradientButton>
              <GradientButton variant="ghost" className="h-[40px] w-full">
                Clear Form
              </GradientButton>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}