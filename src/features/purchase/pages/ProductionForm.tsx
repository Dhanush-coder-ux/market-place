import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Save, 
  Plus, 
  Factory, 
  Banknote, 
  PackageOpen, 
  Check, 
  Bookmark,
  User,
  MapPin,
  ClipboardList,
  Clock,
  Info,
  Zap
} from "lucide-react";

import { ReusableSelect } from "@/components/ui/ReusableSelect";

import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import Loader from "@/components/common/Loader";
import { InventoryItemsCard } from "../components/InventoryItemsCard";

type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";

export interface ProductionItem {
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


const ProductionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData } = useApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // --- State Management ---
  const [productionDetails, setProductionDetails] = useState({
    location: "Workshop A",
    supervisor: "Sarah Johnson",
    date: new Date().toISOString().split("T")[0],
    referenceNo: `PRD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    batchNo: `BATCH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
    status: "Completed",
    notes: ""
  });

  const [products, setProducts] = useState<ProductionItem[]>([
    {
      id: "1", name: "", quantity: "", costPrice: "", sellingPrice: "",
      marginPercent: "", marginAmount: "", marginType: "percent",
      unit: "pc", taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", manufacturingDate: "", batchTracking: false, serialTracking: false, serialNumbers: "", batchNum: "", sku: "", variant: "", size: ""
    }
  ]);

  const [productionCosts, setProductionCosts] = useState({
    labor: "" as number | "",
    overhead: "" as number | "",
    packaging: "" as number | "",
    equipment: "" as number | "",
    other: "" as number | ""
  });

  const [charges, setCharges] = useState({ transport: "" as number | "", other: "" as number | "" });
  const [payment, setPayment] = useState({ method: "Cash" as PaymentMethod, amountPaid: "" as number | "" });
  const [costMethod, setCostMethod] = useState("None");


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

    const labor = Number(productionCosts.labor) || 0;
    const overhead = Number(productionCosts.overhead) || 0;
    const packaging = Number(productionCosts.packaging) || 0;
    const equipment = Number(productionCosts.equipment) || 0;
    const prodOther = Number(productionCosts.other) || 0;
    const transport = Number(charges.transport) || 0;
    const other = Number(charges.other) || 0;

    const totalProductionCosts = labor + overhead + packaging + equipment + prodOther;
    const totalCharges = totalProductionCosts + transport + other;

    const grandTotal = Math.round(subtotal + totalCharges);
    const paid = Number(payment.amountPaid) || 0;
    const outstanding = grandTotal - paid;

    // Per-product charge allocation
    const allocations = products.map(p => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      let alloc = 0;
      if (costMethod === "By Unit" && totalQty > 0) {
        alloc = (q / totalQty) * totalCharges;
      } else if (costMethod === "By Value" && subtotal > 0) {
        alloc = ((q * c) / subtotal) * totalCharges;
      }
      const netCostPerUnit = q > 0 ? (q * c + alloc) / q : c;
      return { alloc, netCostPerUnit };
    });

    return { totalQty, subtotal, totalCharges, totalProductionCosts, grandTotal, outstanding, allocations };
  }, [products, productionCosts, charges, payment.amountPaid, costMethod]);

  // --- Load Drafts ---



  // --- Load Existing or Draft ---
  useEffect(() => {
    const draftId = searchParams.get("draftId");
    if (draftId) {
      const savedDrafts = JSON.parse(localStorage.getItem("production_drafts") || "[]");
      const draft = savedDrafts.find((d: any) => d.id === draftId);
      if (draft) {
        setProductionDetails(draft.data.productionDetails);
        setProducts(draft.data.products);
        setProductionCosts(draft.data.productionCosts);
        setCharges(draft.data.charges);
        setPayment(draft.data.payment);
      }
    }
  }, [searchParams]);

  // --- Header Actions ---
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button 
            type="button"
            onClick={handleSaveDraft}
            className="px-6 h-8 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
          >
            <Bookmark size={14} />
            Save Draft
          </button>
        )}
        <GradientButton 
          icon={submitting ? <Loader className="h-4 w-4" /> : <Save size={16} />} 
          onClick={handleSaveProduction} 
          disabled={submitting}
          className="rounded-xl shadow-md text-xs px-8 h-8 flex items-center"
        >
          {submitting ? "Processing..." : (id ? "Update Production" : "Confirm Production")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, productionDetails, products, productionCosts, charges, payment, submitting, id]);

  // --- Handlers ---
  const handleProductChange = (index: number, field: string, value: any) => {
    const next = [...products];
    (next[index] as any)[field] = value;
    setProducts(next);
  };

  const updateProductFields = (index: number, updates: Partial<ProductionItem>) => {
    const next = [...products];
    next[index] = { ...next[index], ...updates };
    setProducts(next);
  };

  const addProduct = () => {
    setProducts([...products, {
      id: Math.random().toString(), name: "", quantity: "", costPrice: "", sellingPrice: "",
      marginPercent: "", marginAmount: "", marginType: "percent",
      unit: "pc", taxGst: 18, storageLoc: "", reorderPoint: "", expiryDate: "", manufacturingDate: "", batchTracking: false, serialTracking: false, serialNumbers: "", batchNum: "", sku: "", variant: "", size: ""
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };



  const handleSaveDraft = () => {
    const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
    const draftId = searchParams.get("draftId") || Date.now().toString();
    
    const newDraft = {
      id: draftId,
      type: "PRODUCTION",
      data: { productionDetails, products, productionCosts, charges, payment },
      timestamp: new Date().toISOString(),
      displayName: `Production - ${productionDetails.batchNo}`
    };

    const existingIndex = savedDrafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) {
      savedDrafts[existingIndex] = newDraft;
    } else {
      savedDrafts.push(newDraft);
    }

    localStorage.setItem("purchase_drafts", JSON.stringify(savedDrafts));
    showToast("Progress saved as production draft", "info");
    if (!searchParams.get("draftId")) {
      navigate(`?draftId=${draftId}`, { replace: true });
    }
  };

  const handleSaveProduction = async () => {
    if (!productionDetails.batchNo) {
      showToast("Please enter a batch number.", "error");
      return;
    }

    if (products.length === 0 || !products[0].name) {
      showToast("Please add at least one finished product.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const transformedProducts = products.map((p, idx) => {
        const q = Math.floor(Number(p.quantity) || 0);
        const baseCost = Number(p.costPrice) || 0;
        const netCostPerUnit = stats.allocations[idx]?.netCostPerUnit || baseCost;

        let finalSellPrice = 0;
        if (p.marginType === "percent") {
          finalSellPrice = netCostPerUnit * (1 + (Number(p.marginPercent) || 0) / 100);
        } else if (p.marginType === "amount") {
          finalSellPrice = netCostPerUnit + (Number(p.marginAmount) || 0);
        } else {
          finalSellPrice = Number(p.sellingPrice) || 0;
        }

        return {
          id: p.id,
          name: p.name,
          barcode: p.sku,
          quantity: q,
          cost_price: baseCost,
          net_cost: Number(netCostPerUnit.toFixed(2)),
          sell_price: Number(finalSellPrice.toFixed(2)),
          unit: p.unit || "pc",
          gst: Number(p.taxGst) || 0,
          batch_tracking: p.batchTracking,
          serial_tracking: p.serialTracking,
          batch_number: p.batchNum || productionDetails.batchNo,
          manufacturing_date: p.manufacturingDate,
          expiry_date: p.expiryDate,
          serial_numbers: p.serialNumbers,
          variant: p.variant,
        };
      });

      const payload = {
        datas: {
          shop_id: SHOP_ID,
          type: "PRODUCTION",
          productionDetails: { ...productionDetails },
          productionCosts: { ...productionCosts },
          charges: { ...charges },
          payment: { ...payment },
          products: transformedProducts,
        }
      };

      const res = await postData(ENDPOINTS.PURCHASES, payload); // Using purchase endpoint as generic entry point for now
      if (res) {
        showToast("Production record saved successfully", "success");
        // Clear draft
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
          const filtered = savedDrafts.filter((d: any) => d.id !== draftId);
          localStorage.setItem("purchase_drafts", JSON.stringify(filtered));
        }
        navigate("/purchase-Summary");
      }
    } catch (error: any) {
      showToast(error.message || "Failed to save production", "error");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 font-[Inter,sans-serif]">
      


      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-start">
          
          {/* LEFT COLUMN: Main Form (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Production Header Details Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-5 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm">
                  <Factory size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Production Setup</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Batch information & workflow</p>
                </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Location / Floor *</label>
                  <div className="relative group">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors z-10" />
                    <ReusableSelect
                      options={[
                        { value: 'Workshop A', label: 'Workshop A', icon: <MapPin size={14} /> },
                        { value: 'Factory Floor 1', label: 'Factory Floor 1', icon: <MapPin size={14} /> },
                        { value: 'Packaging Area', label: 'Packaging Area', icon: <MapPin size={14} /> }
                      ]}
                      value={productionDetails.location}
                      onValueChange={(val: string) => setProductionDetails({ ...productionDetails, location: val })}
                      placeholder="Select Location"
                      className="!pl-11"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Supervisor *</label>
                  <div className="relative group">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors z-10" />
                    <ReusableSelect
                      options={[
                        { value: 'Sarah Johnson', label: 'Sarah Johnson', icon: <User size={14} /> },
                        { value: 'Mike Wilson', label: 'Mike Wilson', icon: <User size={14} /> },
                        { value: 'Alex Chen', label: 'Alex Chen', icon: <User size={14} /> }
                      ]}
                      value={productionDetails.supervisor}
                      onValueChange={(val: string) => setProductionDetails({ ...productionDetails, supervisor: val })}
                      placeholder="Select Supervisor"
                      className="!pl-11"
                    />
                  </div>
                </div>

                <Input
                  label="Production Date"
                  required
                  type="date"
                  value={productionDetails.date}
                  onChange={(e) => setProductionDetails({ ...productionDetails, date: e.target.value })}
                />

                <Input
                  label="Batch # (Auto-generated)"
                  value={productionDetails.batchNo}
                  onChange={(e) => setProductionDetails({ ...productionDetails, batchNo: e.target.value })}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Process Status</label>
                  <div className="relative group">
                    <ClipboardList size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors z-10" />
                    <ReusableSelect
                      options={[
                        { value: 'In Progress', label: 'In Progress', icon: <Clock size={14} /> },
                        { value: 'Quality Check', label: 'Quality Check', icon: <Info size={14} /> },
                        { value: 'Completed', label: 'Completed', icon: <Check size={14} /> }
                      ]}
                      value={productionDetails.status}
                      onValueChange={(val: string) => setProductionDetails({ ...productionDetails, status: val })}
                      placeholder="Status"
                      className="!pl-11"
                    />
                  </div>
                </div>

                <Input
                  label="Ref #"
                  value={productionDetails.referenceNo}
                  disabled
                  onChange={() => {}}
                />
              </div>
            </div>

            {/* 2. Finished Products Card */}
            <InventoryItemsCard
              products={products}
              stats={stats}
              costMethod={costMethod}
              setCostMethod={setCostMethod}
              handleProductChange={handleProductChange}
              updateProductFields={updateProductFields}
              setProducts={setProducts}
              addProduct={addProduct}
              removeProduct={removeProduct}
              type="PRODUCTION"
            />
          </div>

          {/* RIGHT COLUMN: Sidebar (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Production Costs Sidebar Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-5 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm">
                  <Banknote size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Production Costs</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Labor, overhead & extra costs</p>
                </div>
              </div>
              
              <div className="p-8 space-y-5">
                <Input label="Labor Cost" type="number" placeholder="0.00" leftIcon={<User size={14} />} value={productionCosts.labor as any} onChange={(e) => setProductionCosts({...productionCosts, labor: e.target.value ? Number(e.target.value) : ""})} />
                <Input label="Overhead Cost" type="number" placeholder="0.00" leftIcon={<Zap size={14} />} value={productionCosts.overhead as any} onChange={(e) => setProductionCosts({...productionCosts, overhead: e.target.value ? Number(e.target.value) : ""})} />
                <Input label="Packaging Cost" type="number" placeholder="0.00" leftIcon={<PackageOpen size={14} />} value={productionCosts.packaging as any} onChange={(e) => setProductionCosts({...productionCosts, packaging: e.target.value ? Number(e.target.value) : ""})} />
                <Input label="Equipment Cost" type="number" placeholder="0.00" leftIcon={<Factory size={14} />} value={productionCosts.equipment as any} onChange={(e) => setProductionCosts({...productionCosts, equipment: e.target.value ? Number(e.target.value) : ""})} />
                <Input label="Other Prod. Cost" type="number" placeholder="0.00" leftIcon={<Plus size={14} />} value={productionCosts.other as any} onChange={(e) => setProductionCosts({...productionCosts, other: e.target.value ? Number(e.target.value) : ""})} />
                
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Production Expenses</div>
                  <div className="text-2xl font-black text-slate-800">₹{stats.totalProductionCosts.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Logistics & Summary Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700" />
              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Final Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-medium"><span className="text-slate-400">Products Produced</span><span className="text-slate-800 font-black">{stats.totalQty} {products[0].unit}</span></div>
                    <div className="flex justify-between text-sm font-medium"><span className="text-slate-400">Total Material Value</span><span className="text-slate-800 font-black">₹{stats.subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm font-medium"><span className="text-slate-400">Total Extra Charges</span><span className="text-slate-800 font-black">₹{stats.totalCharges.toLocaleString()}</span></div>
                  </div>
                </div>

                <div className="py-6 border-y border-slate-100 space-y-5">
                   <Input label="Transport Charges" type="number" className="!h-12" value={charges.transport as any} onChange={(e) => setCharges({...charges, transport: e.target.value ? Number(e.target.value) : ""})} />
                   <Input label="Logistics / Other" type="number" className="!h-12" value={charges.other as any} onChange={(e) => setCharges({...charges, other: e.target.value ? Number(e.target.value) : ""})} />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Production Cost</span>
                  <div className="text-[42px] font-black text-slate-900 leading-none tracking-tighter">₹{stats.grandTotal.toLocaleString()}</div>
                </div>
              </div>
            </div>

        </div>
      </div>
    </div>
  </div>
  );
};

export default ProductionForm;