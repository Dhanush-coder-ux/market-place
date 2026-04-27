import { useState, useMemo, useEffect } from "react";
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
  CheckCircle2
} from "lucide-react";

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

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";
type GRNStatus = "Pending" | "Partial" | "Completed";

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

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: GRNStatus }) => {
  const config = {
    Pending:   { icon: <Clock size={11} />,         bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700"   },
    Partial:   { icon: <AlertCircle size={11} />,   bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700"    },
    Completed: { icon: <CheckCircle2 size={11} />,  bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${config.bg} ${config.border} ${config.text}`}>
      {config.icon} {status}
    </span>
  );
};



// ─── Component ────────────────────────────────────────────────────────────────

const GrnForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, getData, putData } = useApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // ── State ──

  const [grnDetails, setGrnDetails] = useState({
    supplier: "",
    poReference: "",
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    referenceNo: `GRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    status: "Pending" as GRNStatus,  // ← default Pending
  });

  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: crypto.randomUUID(), name: "", quantity: "", costPrice: "", sellingPrice: "",
      marginPercent: "", marginAmount: "", marginType: "percent",
      unit: "pc", taxGst: 18, storageLoc: "", reorderPoint: "",
      expiryDate: "", manufacturingDate: "", batchTracking: false,
      batchNum: "", sku: "", variant: "", size: "",
    },
  ]);

  const [charges, setCharges] = useState({ transport: "" as number | "", other: "" as number | "" });
  const [payment, setPayment] = useState({ method: "Cash" as PaymentMethod, amountPaid: "" as number | "" });
  const [costMethod, setCostMethod] = useState("None");
  const [supplierDetails, setSupplierDetails] = useState<any>(null);

  // ── Stats ──

  const stats = useMemo(() => {
    let totalQty = 0;
    let subtotal = 0;

    products.forEach(p => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      totalQty += q;
      subtotal += q * c;
    });

    const transportCost  = Number(charges.transport) || 0;
    const otherCost      = Number(charges.other) || 0;
    const totalCharges   = transportCost + otherCost;
    const grandTotal     = Math.round(subtotal + totalCharges);
    const paid           = Number(payment.amountPaid) || 0;
    const outstanding    = grandTotal - paid;

    const allocations = products.map(p => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      let alloc = 0;
      if (costMethod === "By Unit" && totalQty > 0) {
        alloc = (q / totalQty) * totalCharges;
      } else if (costMethod === "By Value" && subtotal > 0) {
        alloc = ((q * c) / subtotal) * totalCharges;
      } else if (costMethod === "Equally" && products.length > 0) {
        alloc = totalCharges / products.length;
      }
      const netCostPerUnit = q > 0 ? (q * c + alloc) / q : c;
      return { alloc, netCostPerUnit };
    });

    return { totalQty, subtotal, totalCharges, grandTotal, outstanding, allocations };
  }, [products, charges, payment.amountPaid, costMethod]);

  // --- Load Drafts for Sidebar ---
  const loadDraftsList = () => {
    // const savedDrafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
    // setDrafts(savedDrafts.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));
  };

  useEffect(() => {
    if (id) {
      const fetchGRN = async () => {
        const res = await getData(`${ENDPOINTS.PURCHASES}/${id}`);
        if (res?.data) {
          const data = res.data;
          setGrnDetails({
            supplier:       data.supplier_name || "",
            poReference:    data.po_reference || "",
            invoiceNo:      data.invoice_no || "",
            date:           data.date || new Date().toISOString().split("T")[0],
            referenceNo:    data.reference_no || "",
            status:         (data.status as GRNStatus) || "Pending",
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

  // ── Header actions ──

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button 
            type="button"
            onClick={handleSaveDraft}
            className="px-4 h-8 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2 whitespace-nowrap overflow-hidden"
          >
            <Bookmark size={14} className="shrink-0" />
            <span className="truncate">Save Draft</span>
          </button>
        )}
        <GradientButton 
          icon={submitting ? <Loader className="h-4 w-4" /> : <Save size={16} />} 
          onClick={handleSaveGRN} 
          disabled={submitting}
          className="rounded-xl shadow-md text-xs px-8 h-8 flex items-center"
        >
          {submitting ? "Processing..." : (id ? "Update GRN" : "Confirm GRN")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, grnDetails, products, charges, payment, submitting, id]);

  // ── Handlers ──

  const handleProductChange = (index: number, field: string, value: any) => {
    const next = [...products];
    (next[index] as any)[field] = value;
    setProducts(next);
  };

  const updateProductFields = (index: number, updates: Partial<ProductItem>) => {
    setProducts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const addProduct = () =>
    setProducts(prev => [...prev, {
      id: crypto.randomUUID(), name: "", quantity: "", costPrice: "", sellingPrice: "",
      marginPercent: "", marginAmount: "", marginType: "percent",
      unit: "pc", taxGst: 18, storageLoc: "", reorderPoint: "",
      expiryDate: "", manufacturingDate: "", batchTracking: false,
      batchNum: "", sku: "", variant: "", size: "",
    }]);

  const removeProduct = (index: number) => {
    if (products.length > 1) setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
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
    loadDraftsList();
    if (!searchParams.get("draftId")) {
      navigate(`?draftId=${draftId}`, { replace: true });
    }
  };

  const handleSaveGRN = async () => {
    if (!grnDetails.supplier) { showToast("Please select a supplier.", "error"); return; }
    if (!products[0]?.name)   { showToast("Please add at least one product.", "error"); return; }

    setSubmitting(true);
    try {
      const transformedProducts = products.map(p => {
        const q        = Math.floor(Number(p.quantity) || 0);
        const baseCost = Number(p.costPrice) || 0;
        let allocated  = 0;

        if (costMethod === "By Unit" && stats.totalQty > 0) {
          allocated = stats.totalCharges / stats.totalQty;
        } else if (costMethod === "By Value" && stats.subtotal > 0) {
          allocated = (baseCost / stats.subtotal) * stats.totalCharges;
        } else if (costMethod === "Equally" && products.length > 0) {
          allocated = (stats.totalCharges / products.length) / (q > 0 ? q : 1);
        }

        const finalCost = baseCost + allocated;
        let finalSellPrice =
          p.marginType === "percent" ? finalCost * (1 + (Number(p.marginPercent) || 0) / 100) :
          p.marginType === "amount"  ? finalCost + (Number(p.marginAmount) || 0) :
                                       Number(p.sellingPrice) || 0;

        return {
          id: p.id, name: p.name, barcode: p.sku, quantity: q,
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
          type: "PO_CREATE",
          supplier_id:   supplierDetails?.id || "",
          supplier_name: supplierDetails?.name || grnDetails.supplier,
          purchaseDetails: {
            invoiceNo: grnDetails.invoiceNo,
            date: grnDetails.date,
            referenceNo: grnDetails.referenceNo,
            poReference: grnDetails.poReference,
          },
          charges: { transport: Number(charges.transport) || 0, other: Number(charges.other) || 0 },
          payment: { method: payment.method, amountPaid: Number(payment.amountPaid) || 0 },
          products: transformedProducts,
        },
      };

      const res = id
        ? await putData(`${ENDPOINTS.PURCHASES}/${id}`, payload)
        : await postData(ENDPOINTS.PURCHASES, payload);

      if (res) {
        showToast(id ? "GRN updated successfully" : "GRN created successfully", "success");
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const drafts = JSON.parse(localStorage.getItem("purchase_drafts") || "[]");
          localStorage.setItem("purchase_drafts", JSON.stringify(drafts.filter((d: any) => d.id !== draftId)));
        }
        navigate("/po-grn");
      }
    } catch (error: any) {
      showToast(error.message || "Failed to save GRN", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-start">

          {/* ── Left: Main form ── */}
          <div className="lg:col-span-5 space-y-5">

            {/* GRN Details Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] border border-blue-100">
                    <Truck size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#0F172A]">Goods Receipt Note (GRN)</h2>
                    <p className="text-[11px] text-[#64748B] mt-0.5">Receive products &amp; update inventory</p>
                  </div>
                </div>
                <StatusBadge status={grnDetails.status} />
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* Supplier */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <SearchSelect
                    labelKey="name"
                    valueKey="id"
                    fetchOptions={async (q) => await supplierApi.searchSuppliers(q)}
                    value={grnDetails.supplier}
                    onChange={(val, opt: any) => {
                      setGrnDetails(d => ({ ...d, supplier: String(val) }));
                      if (opt) setSupplierDetails(opt);
                    }}
                    placeholder="Search supplier…"
                    className="w-full !border-[#E2E8F0]"
                  />
                  {supplierDetails && (
                    <div className="mt-1.5 px-3 py-2.5 bg-[#EFF6FF] border border-blue-100 rounded-xl text-xs text-[#64748B] space-y-0.5">
                      <p className="font-semibold text-[#0F172A]">{supplierDetails.name}</p>
                      {supplierDetails.email         && <p>✉ {supplierDetails.email}</p>}
                      {supplierDetails.mobile_number && <p>📞 {supplierDetails.mobile_number}</p>}
                    </div>
                  )}
                </div>

                <Input
                  label="PO Reference #"
                  placeholder="PO-..."
                  value={grnDetails.poReference}
                  onChange={(e) => setGrnDetails(d => ({ ...d, poReference: e.target.value }))}
                />

                <Input
                  label="Supplier Invoice #"
                  placeholder="INV-…"
                  value={grnDetails.invoiceNo}
                  onChange={(e) => setGrnDetails(d => ({ ...d, invoiceNo: e.target.value }))}
                />

                <Input
                  label="Receipt Date"
                  required
                  type="date"
                  value={grnDetails.date}
                  onChange={(e) => setGrnDetails(d => ({ ...d, date: e.target.value }))}
                />

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#64748B] uppercase tracking-wide">Status</label>
                  <ReusableSelect
                    options={[
                      { value: "Pending",   label: "Pending Review"      },
                      { value: "Partial",   label: "Partial Receipt"     },
                      { value: "Completed", label: "Completed (All Items)" },
                    ]}
                    value={grnDetails.status}
                    onValueChange={(val: string) => setGrnDetails({ ...grnDetails, status: val as GRNStatus })}
                    placeholder="Select Status"
                  />
                </div>

                {/* GRN Ref (read-only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#64748B] uppercase tracking-wide">GRN Reference</label>
                  <div className="h-10 px-3 flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#64748B]">
                    {grnDetails.referenceNo}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Card */}
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

          {/* ── Right: Summary + Payment ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Receipt Summary */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Banknote size={15} className="text-emerald-600" />
                </div>
                <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">Receipt Summary</h2>
              </div>

              <div className="p-5 space-y-4">
                {[
                  { label: "Items",     value: products.length },
                  { label: "Total Qty", value: stats.totalQty  },
                  { label: "Subtotal",  value: `₹${stats.subtotal.toLocaleString()}` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">{row.label}</span>
                    <span className="text-sm font-semibold text-[#0F172A]">{row.value}</span>
                  </div>
                ))}

                <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748B] shrink-0">Transport</span>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="0"
                        className="!h-8 !text-right !text-xs !bg-[#F8FAFC]"
                        value={charges.transport as any}
                        onChange={(e) => setCharges(c => ({ ...c, transport: e.target.value ? Number(e.target.value) : "" }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748B] shrink-0">Other</span>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="0"
                        className="!h-8 !text-right !text-xs !bg-[#F8FAFC]"
                        value={charges.other as any}
                        onChange={(e) => setCharges(c => ({ ...c, other: e.target.value ? Number(e.target.value) : "" }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-transparent border border-[#E2E8F0] text-white px-4 py-3 rounded-xl">
                  <span className="text-xs font-medium text-slate-800">Grand Total</span>
                  <span className="text-lg font-semibold">₹{stats.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                  <CreditCard size={15} className="text-amber-600" />
                </div>
                <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">Payment</h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { id: "Cash", icon: <Banknote  size={15} /> },
                    { id: "UPI",  icon: <Smartphone size={15} /> },
                    { id: "Card", icon: <CreditCard size={15} /> },
                    { id: "Bank", icon: <Landmark   size={15} /> },
                  ] as { id: PaymentMethod; icon: React.ReactNode }[]).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPayment(p => ({ ...p, method: m.id }))}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[10px] font-semibold uppercase tracking-wide transition-all ${
                        payment.method === m.id
                          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-[#E2E8F0] text-[#64748B] hover:border-blue-200 hover:bg-[#EFF6FF]/40"
                      }`}
                    >
                      {m.icon} {m.id}
                    </button>
                  ))}
                </div>

                <Input
                  label="Amount Paid (₹)"
                  type="number"
                  className="!h-11 !text-base !font-semibold !text-emerald-600"
                  value={payment.amountPaid as any}
                  onChange={(e) => setPayment(p => ({ ...p, amountPaid: e.target.value ? Number(e.target.value) : "" }))}
                  placeholder="0.00"
                />

                {/* Outstanding */}
                {stats.outstanding !== 0 && (
                  <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold ${
                    stats.outstanding > 0
                      ? "bg-orange-50 border-orange-200 text-orange-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}>
                    <span className="text-xs font-medium uppercase tracking-wide">Outstanding</span>
                    <span>₹{Math.abs(stats.outstanding).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GrnForm;