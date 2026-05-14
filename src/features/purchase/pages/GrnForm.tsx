import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Save,
  Banknote,
  Smartphone,
  CreditCard,
  Landmark,
  Bookmark,
  Truck,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  PackageOpen
} from "lucide-react"

import { ReusableSelect } from "@/components/ui/ReusableSelect";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { supplierApi } from "@/services/api/supplier";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import Loader from "@/components/common/Loader";
import { InventoryItemsCard } from "@/features/purchase/components/InventoryItemsCard";
import { useQuickCreate } from "@/features/common/QuickCreate/QuickCreateContext";

type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";
type GRNStatus = "Pending" | "Partial" | "Completed";

export interface ProductItem {
  id: string;
  inventory_id?: string;
  variant_id?: string;
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
  remarks?: string;
}

const StatusBadge = ({ status }: { status: GRNStatus }) => {
  const config = {
    Pending: { icon: <Clock size={11} />, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
    Partial: { icon: <AlertCircle size={11} />, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    Completed: { icon: <CheckCircle2 size={11} />, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${config.bg} ${config.border} ${config.text}`}>
      {config.icon} {status}
    </span>
  );
};

const GrnForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, getData, putData } = useApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const { openQuickCreate } = useQuickCreate();

  const [grnDetails, setGrnDetails] = useState({
    supplier: "",
    poReference: "",
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    referenceNo: `GRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    status: "Pending" as GRNStatus,
  });

  const defaultProductRow: ProductItem = {
    id: crypto.randomUUID(), name: "", quantity: "", costPrice: "", sellingPrice: "",
    marginPercent: "", marginAmount: "", marginType: "percent",
    unit: "pc", taxGst: 18, storageLoc: "", reorderPoint: "",
    expiryDate: "", manufacturingDate: "", batchTracking: false,
    serialTracking: false, serialNumbers: "",
    batchNum: "", sku: "", variant: "", size: "",
  };

  const [products, setProducts] = useState<ProductItem[]>([defaultProductRow]);
  const [charges, setCharges] = useState({ transport: "" as number | "", other: "" as number | "" });
  const [payment, setPayment] = useState({ method: "Cash" as PaymentMethod, amountPaid: "" as number | "" });
  const [costMethod, setCostMethod] = useState("None");
  const [supplierDetails, setSupplierDetails] = useState<any>(null);

  const stats = useMemo(() => {
    let totalQty = 0;
    let subtotal = 0;
    products.forEach(p => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      totalQty += q;
      subtotal += q * c;
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
      if (costMethod === "By Unit" && totalQty > 0) alloc = (q / totalQty) * totalCharges;
      else if (costMethod === "By Value" && subtotal > 0) alloc = ((q * c) / subtotal) * totalCharges;
      else if (costMethod === "Equally" && products.length > 0) alloc = totalCharges / products.length;
      const netCostPerUnit = q > 0 ? (q * c + alloc) / q : c;
      return { alloc, netCostPerUnit };
    });
    return { totalQty, subtotal, totalCharges, grandTotal, outstanding, allocations };
  }, [products, charges, payment.amountPaid, costMethod]);

  useEffect(() => {
    if (id) {
      const fetchGRN = async () => {
        const res = await getData(`${ENDPOINTS.PURCHASES}/${id}`);
        if (res?.data) {
          const data = res.data;
          setGrnDetails({
            supplier: data.supplier_name || "",
            poReference: data.po_reference || "",
            invoiceNo: data.invoice_no || "",
            date: data.date || new Date().toISOString().split("T")[0],
            referenceNo: data.reference_no || "",
            status: (data.status as GRNStatus) || "Pending",
          });
          setProducts(data.products.map((p: any) => ({
            id: p.id || Math.random().toString(),
            name: p.name,
            quantity: p.quantity,
            costPrice: p.buy_price,
            sellingPrice: p.sell_price,
            marginPercent: "",
            marginAmount: "",
            marginType: "sellingPrice" as const,
            unit: p.unit || "pc",
            taxGst: p.gst || 18,
            sku: p.barcode,
            variant: p.variant || "",
            batchTracking: p.batch_tracking || false,
            batchNum: p.batch_number || "",
            manufacturingDate: p.manufacturing_date || "",
            expiryDate: p.expiry_date || "",
            storageLoc: "",
            reorderPoint: "",
            size: "",
          })));
          setCharges(data.charges || { transport: 0, other: 0 });
          setPayment(data.payment || { method: "Cash", amountPaid: 0 });
        }
      };
      fetchGRN();
    } else {
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const saved = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
        const draft = saved.find((d: any) => d.id === draftId);
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

  const handleProductChange = useCallback((index: number, field: string, value: any) => {
    setProducts(prev => {
      const next = [...prev];
      (next[index] as any)[field] = value;
      return next;
    });
  }, []);

  const updateProductFields = useCallback((index: number, updates: Partial<ProductItem>) => {
    setProducts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const addProduct = () => setProducts(prev => [...prev, { ...defaultProductRow, id: crypto.randomUUID() }]);
  const removeProduct = (index: number) => { if (products.length > 1) setProducts(prev => prev.filter((_, i) => i !== index)); };

  const handleSaveDraft = useCallback(() => {
    const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
    const draftId = searchParams.get("draftId") || Date.now().toString();
    const newDraft = {
      id: draftId,
      type: "GRN Purchase",
      data: { grnDetails, products, charges, payment, supplierDetails },
      timestamp: new Date().toISOString(),
      displayName: `GRN: ${supplierDetails?.name || grnDetails.supplier || "Untitled GRN"}`,
    };
    const existingIndex = savedDrafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) savedDrafts[existingIndex] = newDraft;
    else savedDrafts.push(newDraft);
    localStorage.setItem("purchase_drafts", JSON.stringify(savedDrafts));
    showToast("GRN progress saved as draft", "info");
    if (!searchParams.get("draftId")) navigate(`?draftId=${draftId}`, { replace: true });
  }, [grnDetails, products, charges, payment, supplierDetails, searchParams, navigate, showToast]);

  const handleSaveGRN = useCallback(async () => {
    if (!grnDetails.supplier && !supplierDetails?.id) { showToast("Please select a supplier.", "error"); return; }
    if (!products[0]?.name) { showToast("Please add at least one product.", "error"); return; }
    const unselected = products.find(p => !p.inventory_id && p.name);
    if (unselected) { showToast(`Product "${unselected.name}" was not selected from inventory.`, "error"); return; }

    setSubmitting(true);
    try {
      const transformedProducts = products.map(p => {
        const q = Math.floor(Number(p.quantity) || 0);
        const baseCost = Number(p.costPrice) || 0;
        let allocated = 0;
        if (costMethod === "By Unit" && stats.totalQty > 0) allocated = stats.totalCharges / stats.totalQty;
        else if (costMethod === "By Value" && stats.subtotal > 0) allocated = (baseCost / stats.subtotal) * stats.totalCharges;
        else if (costMethod === "Equally" && products.length > 0) allocated = (stats.totalCharges / products.length) / (q > 0 ? q : 1);
        const finalCost = baseCost + allocated;
        let finalSellPrice = p.marginType === "percent" ? finalCost * (1 + (Number(p.marginPercent) || 0) / 100) : p.marginType === "amount" ? finalCost + (Number(p.marginAmount) || 0) : Number(p.sellingPrice) || 0;
        return {
          inventory_id: p.inventory_id,
          variant_id: p.variant_id,
          name: p.name,
          barcode: p.sku,
          stocks: q,
          received_stocks: q,
          buy_price: baseCost,
          sell_price: Number(finalSellPrice.toFixed(2)),
          margin: Number(p.marginPercent) || 0,
          unit: p.unit || "pc",
          gst: Number(p.taxGst) || 0,
          batch_tracking: p.batchTracking,
          serial_tracking: p.serialTracking,
          batch_number: p.batchNum,
          manufacturing_date: p.manufacturingDate,
          expiry_date: p.expiryDate,
          batches: { batch_number: p.batchNum, stocks: q, manufacturing_date: p.manufacturingDate, expiry_date: p.expiryDate },
          serial_numbers: p.serialNumbers ? p.serialNumbers.split(",").map(s => s.trim()).filter(Boolean) : [],
          variant: p.variant,
        };
      });

      const payload = {
        shop_id: SHOP_ID,
        type: "PO_CREATE",
        supplier_id: supplierDetails?.id || "",
        calculations: { divided_by: costMethod === "By Unit" ? "BY_QUANTITY" : costMethod === "By Value" ? "BY_VALUE" : costMethod === "Equally" ? "BY_EQUAL" : "NONE", gst: { type: "inclusive", value: 18, registered: true } },
        additional_charges: { delivery_charge: Number(charges.transport) || 0, other_charge: Number(charges.other) || 0 },
        datas: { supplier_name: supplierDetails?.name || grnDetails.supplier, purchaseDetails: { invoiceNo: grnDetails.invoiceNo, date: grnDetails.date, referenceNo: grnDetails.referenceNo, poReference: grnDetails.poReference }, payment: { method: payment.method, amountPaid: Number(payment.amountPaid) || 0 }, },
        products: transformedProducts,
      };

      const res = id ? await putData(`${ENDPOINTS.PURCHASES}/${id}`, payload) : await postData(ENDPOINTS.PURCHASES, payload);
      if (res) {
        showToast(id ? "GRN updated successfully" : "GRN created successfully", "success");
        navigate("/po-grn");
      }
    } catch (error: any) { showToast(error.message || "Failed to save GRN", "error"); } finally { setSubmitting(false); }
  }, [grnDetails, products, charges, payment, supplierDetails, costMethod, stats, id, postData, putData, navigate, showToast]);

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button type="button" onClick={handleSaveDraft} className="px-4 h-8 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2">
            <Bookmark size={14} />
            <span>Save Draft</span>
          </button>
        )}
        <GradientButton icon={submitting ? <Loader className="h-4 w-4" /> : <Save size={16} />} onClick={handleSaveGRN} disabled={submitting} className="rounded-xl shadow-md text-xs px-8 h-8">
          {submitting ? "Processing..." : (id ? "Update GRN" : "Confirm GRN")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, submitting, id, handleSaveDraft, handleSaveGRN]);

  const handleAddNewProduct = useCallback((query: string) => {
    openQuickCreate("PRODUCT", (newProduct: any) => {
      const emptyIndex = products.findIndex(p => !p.name && !p.inventory_id);
      const productData = {
        inventory_id: newProduct.id,
        name: newProduct.name,
        costPrice: newProduct.buy_price,
        sellingPrice: newProduct.sell_price,
        sku: newProduct.barcode,
        unit: newProduct.datas?.unit || "pc",
        taxGst: parseInt(newProduct.datas?.gst) || 18,
        batchTracking: !!newProduct.has_batch || !!(newProduct.datas && newProduct.datas.has_batch),
        serialTracking: !!newProduct.has_serialno || !!(newProduct.datas && newProduct.datas.has_serialno)
      };
      if (emptyIndex >= 0) updateProductFields(emptyIndex, productData);
      else setProducts(prev => [...prev, { ...defaultProductRow, ...productData, id: crypto.randomUUID(), quantity: 1 }]);
    }, { name: query });
  }, [openQuickCreate, products, updateProductFields, defaultProductRow]);

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 font-sans">
        <div className=" mx-auto">
          <div className="flex flex-col gap-6  mx-auto">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-black text-slate-800">Goods Receipt Note (GRN)</h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Receive products & update inventory</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={grnDetails.status} />
                  {id && (
                    <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Edit Mode</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-500 ml-1">Supplier *</label>
                  <SearchSelect
                    labelKey="name" valueKey="id"
                    fetchOptions={async (q) => await supplierApi.searchSuppliers(q)}
                    options={supplierDetails ? [supplierDetails] : []}
                    value={supplierDetails?.id || grnDetails.supplier}
                    onChange={(val, opt: any) => { setGrnDetails(d => ({ ...d, supplier: String(val) })); if (opt) setSupplierDetails(opt); }}
                    onCreateNew={(query) => openQuickCreate("SUPPLIER", (sup: any) => { setSupplierDetails(sup); setGrnDetails(d => ({ ...d, supplier: sup.id })); }, { name: query })}
                    placeholder="Search Supplier..."
                    className="w-full !rounded-xl !border-slate-200"
                  />
                </div>
                <Input label="Supplier Invoice #" placeholder="INV-..." value={grnDetails.invoiceNo} onChange={(e) => setGrnDetails(d => ({ ...d, invoiceNo: e.target.value }))} className="!rounded-xl" />
                <Input label="Receipt Date" required type="date" value={grnDetails.date} onChange={(e) => setGrnDetails(d => ({ ...d, date: e.target.value }))} className="!rounded-xl" />
              </div>

              {supplierDetails && (
                <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 mb-0.5">Supplier Details</p>
                        <p className="text-lg font-black text-slate-800 tracking-tight">{supplierDetails.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><Mail size={14} /></div>
                        <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400">Email</span><span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">{supplierDetails.email || "N/A"}</span></div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-emerald-200">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><Smartphone size={14} /></div>
                        <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400">Contact</span><span className="text-[11px] font-bold text-slate-600">{supplierDetails.mobile_number || supplierDetails.phone || "N/A"}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <InventoryItemsCard
              products={products} stats={stats} costMethod={costMethod} setCostMethod={setCostMethod}
              handleProductChange={handleProductChange} updateProductFields={updateProductFields}
              setProducts={setProducts} addProduct={addProduct} removeProduct={removeProduct}
            />


            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm"><Banknote size={16} /></div>
                <h2 className="text-[12px] font-black text-slate-800">Receipt Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                {[{ label: "Total Items", value: products.length }, { label: "Total Quantity", value: stats.totalQty }, { label: "Subtotal Value", value: `₹${stats.subtotal.toLocaleString()}` }].map(row => (
                  <div key={row.label} className="flex justify-between items-center"><span className="text-[11px] font-black text-slate-400">{row.label}</span><span className="text-[13px] font-black text-slate-800 tabular-nums">{row.value}</span></div>
                ))}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center gap-4"><span className="text-[11px] font-black text-slate-400 shrink-0">Transport</span><div className="w-28"><Input type="number" placeholder="0.00" className="!h-9 !text-right !text-[12px] !font-black !bg-slate-50/50 !rounded-xl !border-transparent hover:!border-slate-200" value={charges.transport as any} onChange={(e) => setCharges(c => ({ ...c, transport: e.target.value ? Number(e.target.value) : "" }))} /></div></div>
                  <div className="flex justify-between items-center gap-4"><span className="text-[11px] font-black text-slate-400 shrink-0">Other</span><div className="w-28"><Input type="number" placeholder="0.00" className="!h-9 !text-right !text-[12px] !font-black !bg-slate-50/50 !rounded-xl !border-transparent hover:!border-slate-200" value={charges.other as any} onChange={(e) => setCharges(c => ({ ...c, other: e.target.value ? Number(e.target.value) : "" }))} /></div></div>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-2">
                  <div className="flex flex-col gap-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Grand Total</span><span className="text-[32px] font-black text-slate-900 tracking-tighter tabular-nums">₹{stats.grandTotal.toLocaleString()}</span></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm"><CreditCard size={16} /></div>
                <h2 className="text-[12px] font-black text-slate-800">Payment</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {[{ id: "Cash", icon: <Banknote size={15} /> }, { id: "UPI", icon: <Smartphone size={15} /> }, { id: "Card", icon: <CreditCard size={15} /> }, { id: "Bank", icon: <Landmark size={15} /> }].map(m => (
                    <button key={m.id} onClick={() => setPayment(p => ({ ...p, method: m.id as PaymentMethod }))} className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all ${payment.method === m.id ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm" : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-amber-200 hover:bg-white"}`}><div className="mb-2">{m.icon}</div><span className="text-[9px] font-black uppercase tracking-wider">{m.id}</span></button>
                  ))}
                </div>
                <div className="space-y-4 pt-2">
                  <Input label="Paid Now (₹)" type="number" className="!h-14 !text-xl !font-black !text-emerald-600 !rounded-2xl !bg-slate-50/50" value={payment.amountPaid as any} onChange={(e) => setPayment(p => ({ ...p, amountPaid: e.target.value ? Number(e.target.value) : "" }))} placeholder={stats.grandTotal.toString()} />
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Balance</span>
                    <span className={`text-[22px] font-black tabular-nums ${stats.outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>₹{Math.abs(stats.outstanding).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GrnForm;
