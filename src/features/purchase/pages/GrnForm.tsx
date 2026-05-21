import { useState, useMemo, useEffect, useCallback } from "react";
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
  ChevronDown,
} from "lucide-react";

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

// ─── Field Label ─────────────────────────────────────────────────────────────
const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-[11px] font-medium text-slate-400 mb-1.5 tracking-wide uppercase">
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({
  icon,
  title,
  subtitle,
  accentColor = "slate",
  children,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentColor?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-${accentColor}-50 flex items-center justify-center text-${accentColor}-400`}>
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-medium text-slate-700">{title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {badge}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ─── Summary Row ─────────────────────────────────────────────────────────────
const SummaryRow = ({
  label,
  value,
  muted,
  large,
}: {
  label: string;
  value: string;
  muted?: boolean;
  large?: boolean;
}) => (
  <div className={`flex items-center justify-between ${large ? "pt-4 border-t border-slate-100 mt-2" : ""}`}>
    <span className={`text-[12px] ${muted ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
    <span
      className={
        large
          ? "text-[22px] font-semibold text-slate-800 tabular-nums tracking-tight"
          : "text-[13px] font-medium text-slate-700 tabular-nums"
      }
    >
      {value}
    </span>
  </div>
);

// ─── Payment Method Button ────────────────────────────────────────────────────
const PaymentBtn = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border transition-all text-[11px] font-medium tracking-wide ${
      active
        ? "border-slate-300 bg-slate-50 text-slate-700"
        : "border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-500"
    }`}
  >
    <span className={active ? "text-slate-600" : "text-slate-300"}>{icon}</span>
    {label}
  </button>
);

const StatusBadge = ({ status }: { status: GRNStatus }) => {
  const config = {
    Pending: { icon: <Clock size={11} />, bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600" },
    Partial: { icon: <AlertCircle size={11} />, bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-600" },
    Completed: { icon: <CheckCircle2 size={11} />, bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.border} ${config.text}`}>
      {config.icon} {status}
    </span>
  );
};

// ─── Header Overview ─────────────────────────────────────────────────────────
const HeaderOverview = ({
  title,
  reference,
  stats,
  payment,
  show,
  onToggle,
  id,
  status,
}: {
  title: string;
  reference: string;
  stats: any;
  payment: any;
  show: boolean;
  onToggle: () => void;
  id?: string;
  status?: GRNStatus;
}) => (
  <div className="bg-white border-b border-slate-100 overflow-hidden transition-all duration-300 ease-in-out">
    {/* Main Bar (Always Visible) */}
    <div className="px-6 md:px-8 py-4 flex items-center justify-between gap-6 flex-wrap lg:flex-nowrap">
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-3">
          <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">{title}</h1>
          <div className="flex items-center gap-2">
            {status && <StatusBadge status={status} />}
            {id && (
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Editing
              </span>
            )}
          </div>
        </div>
        <p className="text-[12px] text-slate-400 mt-0.5 font-medium">{reference}</p>
      </div>

      <div className="flex items-center gap-8 lg:gap-12">
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Items</p>
          <p className="text-[15px] font-bold text-slate-700">{stats.totalQty}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total</p>
          <p className="text-[15px] font-bold text-slate-800">₹{stats.grandTotal.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Balance</p>
          <p className={`text-[15px] font-bold ${stats.outstanding > 0 ? "text-rose-500" : "text-emerald-500"}`}>
            ₹{stats.outstanding.toLocaleString()}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          show ? "bg-white text-slate-800 shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
        }`}
      >
        <ChevronDown size={18} className={`transition-transform duration-300 ${show ? "rotate-180" : ""}`} />
      </button>
    </div>

    {/* Expandable Section */}
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        show ? "max-h-[400px] border-t border-slate-50 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="px-8 py-6 bg-slate-50/30 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3">Breakdown</p>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-500">Subtotal (Excl. GST)</span>
              <span className="font-semibold text-slate-700">₹{stats.subtotal.toLocaleString()}</span>
            </div>
            {(stats.totalGst || 0) > 0 && (
              <div className="flex justify-between text-[13px]">
                <span className="text-indigo-500 font-medium">Total GST</span>
                <span className="font-semibold text-indigo-600">₹{stats.totalGst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-500">Charges</span>
              <span className="font-semibold text-slate-700">₹{stats.totalCharges.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3">Payment</p>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-500">Method</span>
              <span className="font-semibold text-slate-700">{payment.method}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-500">Paid</span>
              <span className="font-semibold text-slate-700">₹{(Number(payment.amountPaid) || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-lg p-4 border border-slate-100/50 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              stats.outstanding > 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
            }`}>
              <Banknote size={24} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Calculated Balance</p>
              <p className={`text-[20px] font-extrabold ${
                stats.outstanding > 0 ? "text-rose-500" : "text-emerald-500"
              }`}>
                ₹{Math.abs(stats.outstanding).toLocaleString()}
              </p>
            </div>
          </div>
          {stats.outstanding > 0 && (
            <span className="text-[11px] font-bold text-rose-400 px-3 py-1 bg-rose-50 rounded-lg">
              Pending Payment
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const GrnForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, getData, putData } = useApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const { openQuickCreate } = useQuickCreate();
  const [showOverview, setShowOverview] = useState(false);

  const [grnDetails, setGrnDetails] = useState({
    supplier: "",
    poReference: "",
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    referenceNo: `GRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    status: "Pending" as GRNStatus,
  });

  const defaultProductRow: ProductItem = {
    id: crypto.randomUUID(),
    name: "",
    quantity: "",
    costPrice: "",
    sellingPrice: "",
    marginPercent: "",
    marginAmount: "",
    marginType: "percent",
    unit: "pc",
    taxGst: 18,
    storageLoc: "",
    reorderPoint: "",
    expiryDate: "",
    manufacturingDate: "",
    batchTracking: false,
    serialTracking: false,
    serialNumbers: "",
    batchNum: "",
    sku: "",
    variant: "",
    size: "",
  };

  const [products, setProducts] = useState<ProductItem[]>([defaultProductRow]);
  const [charges, setCharges] = useState({ transport: "" as number | "", other: "" as number | "" });
  const [payment, setPayment] = useState({ method: "Cash" as PaymentMethod, amountPaid: "" as number | "" });
  const [costMethod, setCostMethod] = useState("None");
  const [supplierDetails, setSupplierDetails] = useState<any>(null);

  const stats = useMemo(() => {
    let totalQty = 0;
    let subtotal = 0;
    let totalGst = 0;
    const gstBreakdown: Record<number, number> = {};

    products.forEach((p) => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      const gstRate = Number(p.taxGst) || 0;
      totalQty += q;
      
      const lineExcl = q * c;
      const lineGst = lineExcl * (gstRate / 100);
      
      subtotal += lineExcl;
      totalGst += lineGst;
      if (gstRate > 0) {
        gstBreakdown[gstRate] = (gstBreakdown[gstRate] || 0) + lineGst;
      }
    });

    const transportCost = Number(charges.transport) || 0;
    const otherCost = Number(charges.other) || 0;
    const totalCharges = transportCost + otherCost;

    const grandTotal = Math.round(subtotal + totalGst + totalCharges);
    const paid = Number(payment.amountPaid) || 0;
    const outstanding = grandTotal - paid;

    const allocations = products.map((p) => {
      const q = Number(p.quantity) || 0;
      const c = Number(p.costPrice) || 0;
      let alloc = 0;
      if (costMethod === "By Unit" && totalQty > 0) alloc = (q / totalQty) * totalCharges;
      else if (costMethod === "By Value" && subtotal > 0) alloc = ((q * c) / subtotal) * totalCharges;
      else if (costMethod === "Equally" && products.length > 0) alloc = totalCharges / products.length;
      const netCostPerUnit = q > 0 ? (q * c + alloc) / q : c;
      return { alloc, netCostPerUnit };
    });

    return { totalQty, subtotal, totalGst, gstBreakdown, totalCharges, grandTotal, outstanding, allocations };
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
          setProducts(
            data.products.map((p: any) => ({
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
            }))
          );
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
    setProducts((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;
      return next;
    });
  }, []);

  const updateProductFields = useCallback((index: number, updates: Partial<ProductItem>) => {
    setProducts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const addProduct = () => setProducts((prev) => [...prev, { ...defaultProductRow, id: crypto.randomUUID() }]);
  const removeProduct = (index: number) => {
    if (products.length > 1) setProducts((prev) => prev.filter((_, i) => i !== index));
  };

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
    showToast("Draft saved", "info");
    if (!searchParams.get("draftId")) navigate(`?draftId=${draftId}`, { replace: true });
  }, [grnDetails, products, charges, payment, supplierDetails, searchParams, navigate, showToast]);

  const handleSaveGRN = useCallback(async () => {
    if (!grnDetails.supplier && !supplierDetails?.id) {
      showToast("Please select a supplier.", "error");
      return;
    }
    if (!products[0]?.name) {
      showToast("Please add at least one product.", "error");
      return;
    }
    const unselected = products.find((p) => !p.inventory_id && p.name);
    if (unselected) {
      showToast(`"${unselected.name}" was not selected from inventory.`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const transformedProducts = products.map((p) => {
        const q = Math.floor(Number(p.quantity) || 0);
        const baseCost = Number(p.costPrice) || 0;
        let allocated = 0;
        if (costMethod === "By Unit" && stats.totalQty > 0) allocated = stats.totalCharges / stats.totalQty;
        else if (costMethod === "By Value" && stats.subtotal > 0)
          allocated = (baseCost / stats.subtotal) * stats.totalCharges;
        else if (costMethod === "Equally" && products.length > 0)
          allocated = stats.totalCharges / products.length / (q > 0 ? q : 1);
        const finalCost = baseCost + allocated;
        let finalSellPrice =
          p.marginType === "percent"
            ? finalCost * (1 + (Number(p.marginPercent) || 0) / 100)
            : p.marginType === "amount"
            ? finalCost + (Number(p.marginAmount) || 0)
            : Number(p.sellingPrice) || 0;
        return {
          inventory_id: p.inventory_id || null,
          variant_id: p.variant_id || null,
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
          batches: {
            batch_number: p.batchNum,
            stocks: q,
            manufacturing_date: p.manufacturingDate,
            expiry_date: p.expiryDate,
          },
          serial_numbers: p.serialNumbers
            ? p.serialNumbers
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          variant: p.variant,
        };
      });

      const payload = {
        shop_id: SHOP_ID,
        type: "PO_CREATE",
        supplier_id: supplierDetails?.id || "",
        calculations: {
          divided_by:
            costMethod === "By Unit"
              ? "BY_QUANTITY"
              : costMethod === "By Value"
              ? "BY_VALUE"
              : costMethod === "Equally"
              ? "BY_EQUAL"
              : "NONE",
          gst: { type: "inclusive", value: 18, registered: true },
        },
        additional_charges: {
          delivery_charge: Number(charges.transport) || 0,
          other_charge: Number(charges.other) || 0,
        },
        datas: {
          supplier_name: supplierDetails?.name || grnDetails.supplier,
          purchaseDetails: {
            invoiceNo: grnDetails.invoiceNo,
            date: grnDetails.date,
            referenceNo: grnDetails.referenceNo,
            poReference: grnDetails.poReference,
          },
          payment: { method: payment.method, amountPaid: Number(payment.amountPaid) || 0 },
        },
        paid_amount: Number(payment.amountPaid) || 0,
        products: transformedProducts,
      };

      const res = id
        ? await putData(`${ENDPOINTS.PURCHASES}/${id}`, payload)
        : await postData(ENDPOINTS.PURCHASES, payload);
      if (res) {
        showToast(id ? "GRN updated" : "GRN created", "success");
        navigate("/po-grn");
      }
    } catch (error: any) {
      showToast(error.message || "Failed to save GRN", "error");
    } finally {
      setSubmitting(false);
    }
  }, [
    grnDetails,
    products,
    charges,
    payment,
    supplierDetails,
    costMethod,
    stats,
    id,
    postData,
    putData,
    navigate,
    showToast,
  ]);

  const handleAddNewProduct = useCallback(
    (query: string) => {
      openQuickCreate(
        "PRODUCT",
        (newProduct: any) => {
          const emptyIndex = products.findIndex((p) => !p.name && !p.inventory_id);
          const hasBatchTracking =
            !!newProduct.has_batch || !!(newProduct.datas && newProduct.datas.has_batch);
          const hasSerialTracking =
            !!newProduct.has_serialno || !!(newProduct.datas && newProduct.datas.has_serialno);
          const fields = {
            inventory_id: newProduct.id,
            name: newProduct.name,
            costPrice: newProduct.buy_price,
            sellingPrice: newProduct.sell_price,
            sku: newProduct.barcode,
            unit: newProduct.datas?.unit || "pc",
            taxGst: parseInt(newProduct.datas?.gst) || 18,
            batchTracking: hasBatchTracking,
            serialTracking: hasSerialTracking,
          };
          if (emptyIndex >= 0) updateProductFields(emptyIndex, fields);
          else
            setProducts((prev) => [
              ...prev,
              {
                ...defaultProductRow,
                id: crypto.randomUUID(),
                ...fields,
              },
            ]);
        },
        { name: query }
      );
    },
    [products, defaultProductRow, openQuickCreate, updateProductFields]
  );

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-2.5">
        {!id && (
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 h-8 rounded-lg border border-slate-200 text-slate-500 text-[12px] font-medium bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Bookmark size={13} />
            Save draft
          </button>
        )}
        <GradientButton
          icon={submitting ? <Loader className="h-4 w-4" /> : <Save size={14} />}
          onClick={handleSaveGRN}
          disabled={submitting}
          className="rounded-lg shadow-sm text-[12px] px-6 h-8 flex items-center font-medium"
        >
          {submitting ? "Processing…" : id ? "Update GRN" : "Confirm GRN"}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, submitting, id, handleSaveDraft, handleSaveGRN]);

  return (
    <div className="min-h-screen bg-[#f8f8f7]">
      <div className="">
        {/* Full-Width Sticky Header Overview Section */}
        <div className="sticky -top-2 md:-top-3 lg:-top-4 z-30 bg-white -mx-2 md:-mx-3 lg:-mx-4 shadow-sm mb-6">
          <HeaderOverview
            title={id ? "Edit Goods Receipt" : "New Goods Receipt"}
            reference={grnDetails.referenceNo}
            stats={stats}
            payment={payment}
            show={showOverview}
            onToggle={() => setShowOverview(!showOverview)}
            id={id}
            status={grnDetails.status}
          />
        </div>

        <div className="flex flex-col gap-5">
          {/* ── 1. GRN Details ── */}
          <SectionCard
            icon={<Truck size={16} />}
            title="GRN details"
            subtitle="Supplier and receipt info"
            accentColor="slate"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <FieldLabel required>Supplier</FieldLabel>
                <SearchSelect
                  labelKey="name"
                  valueKey="id"
                  fetchOptions={async (q) => await supplierApi.searchSuppliers(q)}
                  options={supplierDetails ? [supplierDetails] : []}
                  value={supplierDetails?.id || grnDetails.supplier}
                  onChange={(val, opt: any) => {
                    setGrnDetails((d) => ({ ...d, supplier: String(val) }));
                    if (opt) setSupplierDetails(opt);
                  }}
                  onCreateNew={(query) =>
                    openQuickCreate(
                      "SUPPLIER",
                      (sup: any) => {
                        setSupplierDetails(sup);
                        setGrnDetails((d) => ({ ...d, supplier: sup.id }));
                      },
                      { name: query }
                    )
                  }
                  placeholder="Search supplier…"
                  className="w-full !rounded-lg !border-slate-200 !text-[13px]"
                />
              </div>

              <div>
                <FieldLabel>Invoice number</FieldLabel>
                <Input
                  placeholder="INV-..."
                  value={grnDetails.invoiceNo}
                  onChange={(e) => setGrnDetails((d) => ({ ...d, invoiceNo: e.target.value }))}
                  className="!rounded-lg !border-slate-200 !text-[13px]"
                />
              </div>

              <div>
                <FieldLabel required>Receipt date</FieldLabel>
                <Input
                  type="date"
                  value={grnDetails.date}
                  onChange={(e) => setGrnDetails((d) => ({ ...d, date: e.target.value }))}
                  className="!rounded-lg !border-slate-200 !text-[13px]"
                />
              </div>
            </div>

            {/* Supplier info strip */}
            {supplierDetails && (
              <div className="mt-5 p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-700 truncate">
                      {supplierDetails.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Supplier</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {supplierDetails.email && (
                    <div className="flex items-center gap-2 text-[12px] text-slate-500">
                      <Mail size={13} className="text-slate-400" />
                      <span className="truncate max-w-[160px]">{supplierDetails.email}</span>
                    </div>
                  )}
                  {(supplierDetails.mobile_number || supplierDetails.phone) && (
                    <div className="flex items-center gap-2 text-[12px] text-slate-500">
                      <Smartphone size={13} className="text-slate-400" />
                      <span>{supplierDetails.mobile_number || supplierDetails.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── 2. Items ── */}
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
            onAddNewProduct={handleAddNewProduct}
            type="PURCHASE"
          />

          {/* ── 3. Summary + Payment ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Receipt Summary */}
            <SectionCard
              icon={<Banknote size={16} />}
              title="Receipt summary"
              subtitle="Costs and charges"
              accentColor="slate"
            >
              <div className="space-y-3">
                <SummaryRow label="Subtotal (Excl. GST)" value={`₹${stats.subtotal.toLocaleString()}`} />

                {/* GST Dynamic Breakdown Block */}
                {stats.totalGst > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5 mb-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GST Rate breakdown</span>
                      <span className="text-[11px] font-black text-slate-700 tabular-nums">Total GST: ₹{stats.totalGst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {Object.entries(stats.gstBreakdown).map(([rate, amt]) => {
                      if (Number(amt) <= 0) return null;
                      const basePriceForRate = products.reduce((acc, p) => {
                        const q = Number(p.quantity) || 0;
                        const c = Number(p.costPrice) || 0;
                        const r = Number(p.taxGst) || 0;
                        if (r === Number(rate)) {
                          return acc + (q * c);
                        }
                        return acc;
                      }, 0);
                      return (
                        <div key={rate} className="flex justify-between items-center text-[11px] text-slate-600 font-medium">
                          <span className="text-slate-500">
                            GST {rate}% (on ₹{basePriceForRate.toLocaleString()})
                          </span>
                          <span className="text-slate-800 font-bold tabular-nums">
                            ₹{Number(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                    <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200/30 flex flex-col gap-0.5 leading-normal">
                      <span className="font-semibold text-slate-500">Breakdown explanation:</span>
                      <span>Product base: ₹{stats.subtotal.toLocaleString()} + GST: ₹{stats.totalGst.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} = ₹{(stats.subtotal + stats.totalGst).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} with GST</span>
                    </div>
                  </div>
                )}

                {/* Charge inputs */}
                <div className="pt-2 space-y-2.5">
                  {[
                    { key: "transport" as const, label: "Transport" },
                    { key: "other" as const, label: "Other charges" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="text-[12px] text-slate-400">{label}</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={charges[key] as any}
                          onChange={(e) =>
                            setCharges((c) => ({
                              ...c,
                              [key]: e.target.value ? Number(e.target.value) : "",
                            }))
                          }
                          className="w-full pl-7 pr-3 h-9 text-right text-[13px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3">
                  <SummaryRow
                    label="Grand total"
                    value={`₹${stats.grandTotal.toLocaleString()}`}
                    large
                  />
                </div>
              </div>
            </SectionCard>

            {/* Payment Details */}
            <SectionCard
              icon={<CreditCard size={16} />}
              title="Payment"
              subtitle="Method and amount"
              accentColor="slate"
            >
              <div className="space-y-4">
                {/* Method selector */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "Cash", icon: <Banknote size={16} />, label: "Cash" },
                    { id: "UPI", icon: <Smartphone size={16} />, label: "UPI" },
                    { id: "Card", icon: <CreditCard size={16} />, label: "Card" },
                    { id: "Bank", icon: <Landmark size={16} />, label: "Bank" },
                  ].map((m) => (
                    <PaymentBtn
                      key={m.id}
                      icon={m.icon}
                      label={m.label}
                      active={payment.method === m.id}
                      onClick={() => setPayment((p) => ({ ...p, method: m.id as PaymentMethod }))}
                    />
                  ))}
                </div>

                {/* Amount paid */}
                <div>
                  <FieldLabel>Amount paid (₹)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder={stats.grandTotal.toString()}
                      value={payment.amountPaid as any}
                      onChange={(e) =>
                        setPayment((p) => ({
                          ...p,
                          amountPaid: e.target.value ? Number(e.target.value) : "",
                        }))
                      }
                      className="w-full pl-8 pr-4 h-11 text-[15px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
                    />
                  </div>
                </div>

                {/* Balance */}
                <div
                  className={`p-4 rounded-lg border flex items-center justify-between ${
                    stats.outstanding > 0 ? "bg-rose-50/60 border-rose-100" : "bg-emerald-50/60 border-emerald-100"
                  }`}
                >
                  <span className="text-[12px] text-slate-500">Balance due</span>
                  <span
                    className={`text-[18px] font-semibold tabular-nums tracking-tight ${
                      stats.outstanding > 0 ? "text-rose-500" : "text-emerald-500"
                    }`}
                  >
                    ₹{Math.abs(stats.outstanding).toLocaleString()}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrnForm;

