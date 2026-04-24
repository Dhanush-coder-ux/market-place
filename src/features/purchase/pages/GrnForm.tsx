import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Save, 
  Plus, 
  Trash2, 
  Settings, 
  ScanLine,
  Banknote, 
  Smartphone, 
  CreditCard, 
  Landmark, 
  ChevronUp, 
  X, 
  PackageOpen, 
  Check, 
  CalendarDays,
  Bookmark,
  ChevronRight,
  Clock,
  Trash,
  AlertTriangle,
  Zap,
  Percent,
  Info,
  FileText,
  Truck
} from "lucide-react";

import { ReusableSelect } from "@/components/ui/ReusableSelect";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { supplierApi } from "@/services/api/supplier";
import { inventoryApi } from "@/services/api/inventory";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import Loader from "@/components/common/Loader";
import { InventoryItemsCard } from "@/features/purchase/components/InventoryItemsCard";

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
  remarks?: string;
}

const GrnForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, getData, putData } = useApi();
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // --- State Management ---
  const [grnDetails, setGrnDetails] = useState({
    supplier: "",
    poReference: "",
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    referenceNo: `GRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    status: "Completed",
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
  const [costMethod, setCostMethod] = useState("None");
  const [supplierDetails, setSupplierDetails] = useState<any>(null);
  const [drafts, setDrafts] = useState<any[]>([]);

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

    const grandTotal = Math.round(subtotal + totalCharges);
    const paid = Number(payment.amountPaid) || 0;
    const outstanding = grandTotal - paid;

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

    return { totalQty, subtotal, totalCharges, grandTotal, outstanding, allocations };
  }, [products, charges, payment.amountPaid, costMethod]);

  // --- Load Drafts for Sidebar ---
  const loadDraftsList = () => {
    const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
    setDrafts(savedDrafts.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));
  };

  useEffect(() => {
    loadDraftsList();
  }, []);

  // --- Load Existing GRN or Draft ---
  useEffect(() => {
    if (id) {
      const fetchGRN = async () => {
        const res = await getData(`${ENDPOINTS.PURCHASES}/${id}`);
        if (res && res.data) {
          const data = res.data;
          setGrnDetails(data.grnDetails || {
            supplier: data.supplier_name,
            poReference: data.po_reference || "",
            invoiceNo: data.invoice_no || "",
            date: data.date || new Date().toISOString().split("T")[0],
            referenceNo: data.reference_no || "",
            status: data.status || "Completed",
          });
          setProducts(data.products.map((p: any) => ({
            id: p.id || Math.random().toString(),
            name: p.name,
            quantity: p.quantity,
            costPrice: p.buy_price,
            sellingPrice: p.sell_price,
            marginPercent: "",
            marginAmount: "",
            marginType: "sellingPrice",
            unit: p.unit || "pc",
            taxGst: p.gst || 18,
            sku: p.barcode,
            variant: p.variant || "",
            batchTracking: p.batch_tracking || false,
            batchNum: p.batch_number || "",
            manufacturingDate: p.manufacturing_date || "",
            expiryDate: p.expiry_date || ""
          })));
          setCharges(data.charges || { transport: 0, other: 0 });
          setPayment(data.payment || { method: "Cash", amountPaid: 0 });
        }
      };
      fetchGRN();
    } else {
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
        const draft = savedDrafts.find((d: any) => d.id === draftId);
        if (draft) {
          setGrnDetails(draft.data.grnDetails);
          setProducts(draft.data.products);
          setCharges(draft.data.charges);
          setPayment(draft.data.payment);
          setSupplierDetails(draft.data.supplierDetails);
        }
      }
    }
  }, [id, getData, searchParams]);

  // --- Header Actions ---
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="hidden md:flex items-center gap-2">
          {!id && (
            <button 
              type="button"
              onClick={handleSaveDraft}
              className="px-4 h-11 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
            >
              <Bookmark size={14} />
              Save Draft
            </button>
          )}
          <GradientButton 
            icon={submitting ? <Loader className="h-4 w-4" /> : <Save size={16} />} 
            onClick={handleSaveGRN} 
            disabled={submitting}
            className="rounded-xl shadow-md text-xs px-6 h-11 h-auto flex items-center py-3"
          >
            {submitting ? "Processing..." : (id ? "Update GRN" : "Confirm GRN")}
          </GradientButton>
        </div>
      </div>
    );
    return () => setActions(null);
  }, [setActions, grnDetails, products, charges, payment, submitting, id]);

  // --- Handlers ---
  const handleProductChange = (index: number, field: string, value: any) => {
    const next = [...products];
    (next[index] as any)[field] = value;
    setProducts(next);
  };

  const updateProductFields = (index: number, updates: Partial<ProductItem>) => {
    const next = [...products];
    next[index] = { ...next[index], ...updates };
    setProducts(next);
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

  const handleSaveDraft = () => {
    const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
    const draftId = searchParams.get("draftId") || Date.now().toString();
    
    const newDraft = {
      id: draftId,
      type: "GRN Purchase", // Tag as requested
      data: { grnDetails, products, charges, payment, supplierDetails },
      timestamp: new Date().toISOString(),
      displayName: `GRN: ${supplierDetails?.name || grnDetails.supplier || "Untitled GRN"}`
    };

    const existingIndex = savedDrafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) {
      savedDrafts[existingIndex] = newDraft;
    } else {
      savedDrafts.push(newDraft);
    }

    localStorage.setItem("purchase_drafts", JSON.stringify(savedDrafts));
    showToast("GRN progress saved as draft", "info");
    loadDraftsList();
    if (!searchParams.get("draftId")) {
      navigate(`?draftId=${draftId}`, { replace: true });
    }
  };

  const deleteDraft = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
    const filtered = savedDrafts.filter((d: any) => d.id !== draftId);
    localStorage.setItem("purchase_drafts", JSON.stringify(filtered));
    loadDraftsList();
    if (searchParams.get("draftId") === draftId) {
      navigate("/po-grn/add", { replace: true });
      window.location.reload();
    }
  };

  const handleSaveGRN = async () => {
    if (!grnDetails.supplier) {
      showToast("Please select a supplier.", "error");
      return;
    }

    if (products.length === 0 || !products[0].name) {
      showToast("Please add at least one product.", "error");
      return;
    }

    setSubmitting(true);
    try {
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
          batch_tracking: p.batchTracking,
          batch_number: p.batchNum,
          manufacturing_date: p.manufacturingDate,
          expiry_date: p.expiryDate,
          variant: p.variant,
        };
      });

      const payload = {
        datas: {
          shop_id: SHOP_ID,
          type: "GRN",
          supplier_id: supplierDetails?.id || "SUP_" + grnDetails.supplier.substring(0, 3).toUpperCase(),
          supplier_name: supplierDetails?.name || grnDetails.supplier,
          grnDetails: { ...grnDetails },
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

      let res;
      if (id) {
        res = await putData(`${ENDPOINTS.PURCHASES}/${id}`, payload);
      } else {
        res = await postData(ENDPOINTS.PURCHASES, payload);
      }

      if (res) {
        showToast(id ? "GRN updated" : "GRN created", "success");
        // Clear draft
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
          const filtered = savedDrafts.filter((d: any) => d.id !== draftId);
          localStorage.setItem("purchase_drafts", JSON.stringify(filtered));
        }
        navigate("/po-grn");
      }
    } catch (error: any) {
      showToast(error.message || "Failed to save GRN", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 font-[Inter,sans-serif]">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-start">
          
          <div className="lg:col-span-5 space-y-6">
            {/* 1. GRN Details Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-5 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm">
                  <Truck size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Goods Receipt (GRN)</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Receive products & update inventory</p>
                </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Supplier *</label>
                  <SearchSelect
                    labelKey="name"
                    valueKey="id"
                    fetchOptions={async (q) => await supplierApi.searchSuppliers(q)}
                    value={grnDetails.supplier}
                    onChange={(val, opt: any) => {
                      setGrnDetails({ ...grnDetails, supplier: String(val) });
                      if (opt) setSupplierDetails(opt);
                    }}
                    placeholder="Search Supplier..."
                    className="w-full"
                  />
                  {supplierDetails && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs flex flex-col gap-1 text-slate-600 animate-in fade-in slide-in-from-top-2">
                      <strong className="text-slate-800 font-bold">{supplierDetails.name}</strong>
                      <span className="opacity-70 flex items-center gap-1.5">✉️ {supplierDetails.email || "No email"}</span>
                      <span className="opacity-70 flex items-center gap-1.5">📞 {supplierDetails.mobile_number || "No phone"}</span>
                    </div>
                  )}
                </div>

                <Input
                  label="PO Reference #"
                  placeholder="PO-..."
                  value={grnDetails.poReference}
                  onChange={(e) => setGrnDetails({ ...grnDetails, poReference: e.target.value })}
                />
                <Input
                  label="Supplier Invoice #"
                  placeholder="INV-..."
                  value={grnDetails.invoiceNo}
                  onChange={(e) => setGrnDetails({ ...grnDetails, invoiceNo: e.target.value })}
                />
                <Input
                  label="Receipt Date"
                  required
                  type="date"
                  value={grnDetails.date}
                  onChange={(e) => setGrnDetails({ ...grnDetails, date: e.target.value })}
                />
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                  <ReusableSelect
                    options={[
                      { value: 'Completed', label: 'Completed (All Items)' },
                      { value: 'Partial', label: 'Partial Receipt' },
                      { value: 'Pending', label: 'Pending Review' }
                    ]}
                    value={grnDetails.status}
                    onValueChange={(val) => setGrnDetails({ ...grnDetails, status: val })}
                    placeholder="Select Status"
                  />
                </div>
              </div>
            </div>

            {/* 2. Items Card */}
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
              type="PURCHASE"
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* 3. Summary Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm">
                  <Banknote size={16} />
                </div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Receipt Summary</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Items Received</span>
                  <span className="text-sm font-black text-slate-800">{products.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Quantity</span>
                  <span className="text-sm font-black text-slate-800">{stats.totalQty}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Subtotal Value</span>
                  <span className="text-sm font-black text-slate-800">₹{stats.subtotal.toLocaleString()}</span>
                </div>
                
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Transport</span>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="0"
                        className="!h-8 !text-right !text-xs !bg-slate-50/50"
                        value={charges.transport as any}
                        onChange={(e) => setCharges({ ...charges, transport: e.target.value ? Number(e.target.value) : "" })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Other Charges</span>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="0"
                        className="!h-8 !text-right !text-xs !bg-slate-50/50"
                        value={charges.other as any}
                        onChange={(e) => setCharges({ ...charges, other: e.target.value ? Number(e.target.value) : "" })}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 mt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                      <span className="text-3xl font-black text-slate-900 tracking-tight">₹{stats.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Payment Details Card (Optional for GRN, but keeping consistent) */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200 shadow-sm">
                  <CreditCard size={16} />
                </div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Payment Status</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "Cash", icon: <Banknote size={16} /> },
                    { id: "UPI", icon: <Smartphone size={16} /> },
                    { id: "Card", icon: <CreditCard size={16} /> },
                    { id: "Bank", icon: <Landmark size={16} /> }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayment({ ...payment, method: m.id as PaymentMethod })}
                      className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${payment.method === m.id
                        ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                        : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-amber-200"
                        }`}
                    >
                      <div className="mb-1.5">{m.icon}</div>
                      <span className="text-[9px] font-black uppercase tracking-widest">{m.id}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 pt-2">
                  <Input
                    label="Amount Paid (₹)"
                    type="number"
                    className="!h-12 !text-lg !font-black !text-emerald-600"
                    value={payment.amountPaid as any}
                    onChange={(e) => setPayment({ ...payment, amountPaid: e.target.value ? Number(e.target.value) : "" })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrnForm;