import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, AlertCircle, Save,
  Plus, Minus, Clock,
  CheckCircle2, RefreshCw, Truck,
  PackageCheck,
  Zap,
  X,
  User,
  Smartphone,
  Banknote,
  CreditCard,
  Landmark,
  ChevronDown
} from 'lucide-react';
import { GradientButton } from '@/components/ui/GradientButton';
import { useApi } from '@/context/ApiContext';
import { ENDPOINTS, SHOP_ID } from '@/services/endpoints';
import { useHeader } from '@/context/HeaderContext';
import { useToast } from '@/context/ToastContext';

import Input from "@/components/ui/Input";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { ReusableSelect } from "@/components/ui/ReusableSelect";

// --- Type Definitions ---
type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";
type ReceiveStatus = "Pending" | "Partial" | "Completed";

type POProduct = {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  sku: string;
  variant: string;
  unit: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  receivedQty: number | "";
  costPrice: number;
  batchTracking: boolean;
  batchNum: string;
  manufacturingDate: string;
  expiryDate: string;
  remarks: string;
  unit_price: number;
  remaining: number;
  receiveNow: number | "";
  reason: string;
  customReason: string;
  sellPrice: number;
  serialTracking: boolean;
  serialNumbers: string[];
  // Extended tracking
  has_batch: boolean;
  has_serialno: boolean;
  batch_id: string | null;
  serialno_id: string | null;
  isNewBatch: boolean;
  availableBatches: any[];
  existingSerials: string[];
  reorder_point?: number;
  storageLoc?: string;
  gst: number;
}

interface POSummary {
  id: string;
  referenceNo: string;
  supplierName: string;
  supplierId: string;
  date: string;
  status: ReceiveStatus;
  totalItems: number;
}

const WAREHOUSES = ["Main Warehouse", "Secondary Warehouse", "Shop Floor"];

// ─── UI Building Blocks (Matching PurchaseForm) ───────────────────────────────

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-[11px] font-medium text-slate-400 mb-1.5 tracking-wide uppercase">
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

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
  <div className="bg-white rounded-lg border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-${accentColor}-50 flex items-center justify-center text-${accentColor}-400`}>
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-medium text-slate-700">{title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>
        </div>
      </div>
      {badge}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

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
    <span className={`text-[12px] font-medium ${muted ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
    <span
      className={
        large
          ? "text-[22px] font-bold text-slate-800 tabular-nums tracking-tight"
          : "text-[13px] font-semibold text-slate-700 tabular-nums"
      }
    >
      {value}
    </span>
  </div>
);

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
    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border transition-all text-[11px] font-bold tracking-wide ${
      active
        ? "border-slate-300 bg-slate-50 text-slate-700"
        : "border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-500"
    }`}
  >
    <span className={active ? "text-slate-600" : "text-slate-300"}>{icon}</span>
    {label}
  </button>
);

const HeaderOverview = ({
  title,
  reference,
  stats,
  show,
  onToggle,
  poStatus,
}: {
  title: string;
  reference: string;
  stats: any;
  show: boolean;
  onToggle: () => void;
  poStatus?: string;
}) => (
  <div className="bg-white border-b border-slate-100 overflow-hidden transition-all duration-300 ease-in-out">
    <div className="px-6 md:px-8 py-4 flex items-center justify-between gap-6 flex-wrap lg:flex-nowrap">
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-3">
          <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">{title}</h1>
          {poStatus && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              poStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {poStatus}
            </span>
          )}
        </div>
        <p className="text-[12px] text-slate-400 mt-0.5 font-medium">{reference || "No PO Selected"}</p>
      </div>

      <div className="flex items-center gap-6 md:gap-8 lg:gap-10">
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ordered</p>
          <p className="text-[15px] font-bold text-slate-700">{stats.totalOrdered}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Receiving</p>
          <p className="text-[15px] font-bold text-blue-600">{stats.totalThisRec}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Grand Total</p>
          <p className="text-[15px] font-bold text-slate-800">₹{stats.grandTotal.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Outstanding</p>
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

    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        show ? "max-h-[400px] border-t border-slate-50 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="px-8 py-6 bg-slate-50/30 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3">Quantity Stats</p>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-500 font-medium">Previously Received</span>
              <span className="font-bold text-slate-700">{stats.totalPrevRec}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-500 font-medium">Remaining After This</span>
              <span className="font-bold text-rose-500">{stats.totalRemaining}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3">Receipt Info</p>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="font-bold text-slate-700">{poStatus || "N/A"}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-500 font-medium">Items Count</span>
              <span className="font-bold text-slate-700">{stats.totalOrdered} Units</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-lg p-4 border border-slate-100/50 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
              <Banknote size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Subtotal (Excl. GST)</p>
              <p className="text-[14px] font-bold text-slate-700">₹{stats.receiptValue.toLocaleString()}</p>
            </div>
          </div>
          {stats.totalGst > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm">
                <Banknote size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total GST</p>
                <p className="text-[14px] font-bold text-indigo-600">₹{stats.totalGst.toLocaleString()}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm">
              <Banknote size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Grand Total</p>
              <p className="text-[16px] font-extrabold text-slate-800">₹{stats.grandTotal.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${stats.outstanding > 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"}`}>
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Outstanding</p>
              <p className={`text-[16px] font-extrabold ${stats.outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>₹{stats.outstanding.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseGst(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  const str = String(val).replace("%", "").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/** Fetch PO reference list for SearchSelect */
const fetchPOOptions = async (query: string, getData: Function) => {
  try {
    const res = await getData(`${ENDPOINTS.PURCHASES}/by/shop/${SHOP_ID}`, { q: query, limit: "10" });
    let list: any[] = [];
    if (res?.data) {
      list = Array.isArray(res.data) ? res.data : [res.data];
    } else if (res?.datas) {
      list = Array.isArray(res.datas) ? res.datas : [res.datas];
    }

    return list.map((po: any) => {
      const refNo = po.datas?.purchaseDetails?.referenceNo || po.reference_no || po.id;
      const productNames = po.products?.map((p: any) => p.name).join(", ") || "";
      const label = productNames ? `${refNo} (${productNames})` : refNo;

      return {
        id: po.id,
        label: label,
        value: refNo,
        supplierName: po.datas?.supplier_name || po.supplier_name || "",
        date: po.datas?.purchaseDetails?.date || po.date || "",
        status: po.status || "Pending",
        totalItems: po.products?.length || 0,
      };
    });
  } catch {
    return [];
  }
};

/** Derive receive status from product list */
const deriveStatus = (items: POProduct[]): ReceiveStatus => {
  if (items.length === 0) return "Pending";
  const allFull = items.every(p => {
    const remaining = p.orderedQty - p.previouslyReceivedQty;
    return Number(p.receivedQty) >= remaining;
  });
  const anyReceived = items.some(p => Number(p.receivedQty) > 0);
  if (allFull) return "Completed";
  if (anyReceived) return "Partial";
  return "Pending";
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusPill = ({ status }: { status: ReceiveStatus }) => {
  const cfg = {
    Pending: { icon: <Clock size={11} />, cls: "bg-amber-50 border-amber-200 text-amber-700" },
    Partial: { icon: <AlertCircle size={11} />, cls: "bg-blue-50 border-blue-200 text-blue-700" },
    Completed: { icon: <CheckCircle2 size={11} />, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${cfg.cls}`}>
      {cfg.icon} {status}
    </span>
  );
};

// ─── Bulk Serial Modal ────────────────────────────────────────────────────────

const BulkSerialModal = ({
  isOpen,
  onClose,
  onSave,
  requiredQty,
  productName,
  currentSerials
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serials: string[]) => void;
  requiredQty: number;
  productName: string;
  currentSerials: string[];
}) => {
  const [text, setText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setText(currentSerials.join("\n"));
    }
  }, [isOpen, currentSerials]);

  const { showToast } = useToast();

  const handleSave = () => {
    const lines = text.split(/[\n, ]+/).map(s => s.trim()).filter(Boolean);
    if (lines.length > requiredQty) {
      showToast(`You can only enter up to ${requiredQty} serial numbers`, "error");
      return;
    }
    onSave(lines);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 border border-violet-200 shadow-sm">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Bulk Import Serials</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{productName} (Required: {requiredQty})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-[11px] text-slate-500 font-medium">Paste serial numbers separated by newlines, commas, or spaces.</p>
          <textarea
            className="w-full h-64 p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-300 resize-none font-bold"
            placeholder="SN1001&#10;SN1002&#10;SN1003..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-black px-3 py-1 rounded-lg border transition-all ${
              text.split(/[\n, ]+/).map(s => s.trim()).filter(Boolean).length === requiredQty 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : text.split(/[\n, ]+/).map(s => s.trim()).filter(Boolean).length > requiredQty
                  ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm animate-pulse'
                  : 'bg-slate-50 text-slate-500 border-slate-100'
            }`}>
              {text.split(/[\n, ]+/).map(s => s.trim()).filter(Boolean).length} / {requiredQty} detected
            </span>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <GradientButton onClick={handleSave} className="px-6 py-2 rounded-lg text-xs">Save Serials</GradientButton>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Qty Stepper ---
const QtyInput = ({
  value,
  max,
  onChange,
}: {
  value: number | "";
  max: number;
  onChange: (v: number | "") => void;
}) => {
  const num = Number(value) || 0;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, num - 1))}
        disabled={num <= 0}
        className="w-7 h-7 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all"
      >
        <Minus size={12} />
      </button>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
        className="w-14 h-7 text-center text-[13px] font-bold text-slate-700 border border-slate-100 rounded bg-white focus:outline-none focus:border-slate-300 tabular-nums shadow-sm"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, num + 1))}
        disabled={num >= max}
        className="w-7 h-7 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-100 disabled:opacity-30 transition-all shadow-sm"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ReceiveGoodForm = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getData, postData } = useApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [, setLoadingPO] = useState(false);
  const [poSummary, setPOSummary] = useState<POSummary | null>(null);
  const [items, setItems] = useState<POProduct[]>([]);
  const [selectedPORef, setSelectedPORef] = useState<string>("");

  const [invoiceNo, setInvoiceNo] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [manualStatus, setManualStatus] = useState<ReceiveStatus | null>(null);

  const [showOverview, setShowOverview] = useState(false);
  const [globalData, setGlobalData] = useState({
    received_date: new Date().toISOString().split("T")[0],
    received_by: "Current Admin",
    warehouse: "",
    notes: ""
  });

  const [batchModal, setBatchModal] = useState<{
    isOpen: boolean;
    itemId: string;
    batches: any[];
    productName: string;
    variantName: string;
  }>({ isOpen: false, itemId: "", batches: [], productName: "", variantName: "" });

  const [bulkSerialModal, setBulkSerialModal] = useState<{
    isOpen: boolean;
    itemId: string;
    productName: string;
    requiredQty: number;
    currentSerials: string[];
  }>({ isOpen: false, itemId: "", productName: "", requiredQty: 0, currentSerials: [] });

  useEffect(() => {
    if (batchModal.isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [batchModal.isOpen, bulkSerialModal.isOpen]);

  // Restore PO from URL
  useEffect(() => {
    const poId = searchParams.get("poId");
    if (poId) loadPO(poId);
  }, []);

  const loadPO = useCallback(async (poId: string) => {
    setLoadingPO(true);
    try {
      const res = await getData(`${ENDPOINTS.PURCHASES}/by/${SHOP_ID}/${poId}`);
      const data = res?.data || res?.datas;
      if (!data) { showToast("PO not found", "error"); return; }

      setPOSummary({
        id: data.id || poId,
        referenceNo: data.datas?.purchaseDetails?.referenceNo || data.reference_no || data.referenceNo || poId,
        supplierName: data.datas?.supplier_name || data.supplier_name || "",
        supplierId: data.supplier_id || "",
        date: data.datas?.purchaseDetails?.date || data.date || "",
        status: (data.datas?.status as ReceiveStatus) || (data.status as ReceiveStatus) || "Pending",
        totalItems: data.products?.length || 0,
      });

      const mapped: POProduct[] = (data.products || []).map((p: any) => ({
        id: p.id || crypto.randomUUID(),
        product_id: p.inventory_id || p.product_id || p.id,
        variant_id: p.variant_id || p.varient_id || (p.variants && p.variants.length > 0 ? p.variants[0].id : null),
        name: p.name || "",
        sku: p.barcode || p.sku || "",
        variant: p.variant || "",
        unit: p.unit || "pc",
        orderedQty: Number(p.stocks || p.quantity) || 0,
        previouslyReceivedQty: Number(p.received_stocks || p.received_qty) || 0,
        receivedQty: "",
        costPrice: Number(p.buy_price || p.costPrice) || 0,
        unit_price: Number(p.buy_price || p.costPrice) || 0,
        batchTracking: !!(p.has_batch || p.batch_tracking),
        batchNum: "",
        manufacturingDate: "",
        expiryDate: "",
        remarks: "",
        remaining: (Number(p.stocks) || 0) - (Number(p.received_qty) || 0),
        receiveNow: "",
        reason: "",
        customReason: "",
        sellPrice: Number(p.sell_price || p.sellPrice) || 0,
        serialTracking: !!(p.has_serialno || p.serial_tracking),
        serialNumbers: [],
        has_batch: !!(p.has_batch || p.batch_tracking),
        has_serialno: !!(p.has_serialno || p.serial_tracking),
        serialno_id: p.serialno_id || (p.serial_number as any)?.id || null,
        isNewBatch: false,
        availableBatches: [],
        existingSerials: [],
        reorder_point: p.reorder_point ?? p.datas?.reorder_point ?? 5,
        storageLoc: p.storage_location || p.datas?.storage_location || "",
        gst: parseGst(p.gst || p.datas?.gst || p.taxGst || p.tax_gst || 0),
      }));

      // Fetch full inventory data per unique inventory_id to populate available batches
      const uniqueIds = [...new Set(mapped.map(m => m.product_id).filter(Boolean))];
      const invFetches = await Promise.all(
        uniqueIds.map(async (invId) => {
          try {
            const r = await getData(`${ENDPOINTS.INVENTORIES}/by/id/${SHOP_ID}/${invId}`);
            return { invId, data: r?.data || null };
          } catch { return { invId, data: null }; }
        })
      );
      const invMap: Record<string, any> = {};
      invFetches.forEach(({ invId, data: inv }) => { if (inv) invMap[invId] = inv; });

      const enriched = mapped.map(m => {
        const inv = invMap[m.product_id];
        if (!inv) return { ...m, existingSerials: [] };
        // Find batches: if variant, look inside that variant; else root batches
        let batches: any[] = [];
        let serialno_id = m.serialno_id;

        if (m.variant_id && inv.variants) {
          const v = inv.variants.find((v: any) => v.id === m.variant_id);
          batches = v?.batches ?? [];
          serialno_id = serialno_id || v?.serialno_id || v?.serial_number?.id || v?.datas?.serial_number?.id || v?.serial_numbers?.id || v?.datas?.serial_numbers?.id;
        } else {
          batches = inv.batches ?? [];
          serialno_id = serialno_id || inv.serialno_id || inv.serial_number?.id || inv.datas?.serial_number?.id || inv.serial_numbers?.id || inv.datas?.serial_numbers?.id;
        }

        // Aggregate all existing serial numbers for this product/variant
        const existingSerials: string[] = [];
        batches.forEach((b: any) => {
          const serials = b.serial_numbers?.serial_numbers || b.serial_number?.serial_numbers || [];
          if (Array.isArray(serials)) {
            existingSerials.push(...serials);
          }
        });

        return { ...m, availableBatches: batches, existingSerials, serialno_id };
      });

      setItems(enriched);
      setSelectedPORef(data.id || poId);
      setManualStatus((data.datas?.status as ReceiveStatus) || (data.status as ReceiveStatus) || "Pending");
      setSearchParams(prev => { prev.set("poId", data.id || poId); return prev; }, { replace: true });
    } catch {
      showToast("Failed to load PO", "error");
    } finally {
      setLoadingPO(false);
    }
  }, [getData, showToast, setSearchParams]);

  const updateItem = (id: string, updates: Partial<POProduct>) => {
    setItems(prev => prev.map(p => {
      if (p.id === id) {
        const nextItem = { ...p, ...updates };
        // Sync serial numbers if quantity is reduced
        if (updates.receivedQty !== undefined) {
          const qty = Number(updates.receivedQty) || 0;
          if (nextItem.serialNumbers.length > qty) {
            nextItem.serialNumbers = nextItem.serialNumbers.slice(0, qty);
          }
        }
        return nextItem;
      }
      return p;
    }));
  };

  const fillAll = () => {
    setItems(prev => prev.map(p => ({
      ...p,
      receivedQty: Math.max(0, p.orderedQty - p.previouslyReceivedQty),
    })));
  };

  const liveStatus = useMemo(() => deriveStatus(items), [items]);

  const stats = useMemo(() => {
    const totalOrdered = items.reduce((s, p) => s + p.orderedQty, 0);
    const totalPrevRec = items.reduce((s, p) => s + p.previouslyReceivedQty, 0);
    const totalThisRec = items.reduce((s, p) => s + (Number(p.receivedQty) || 0), 0);
    const totalRemaining = Math.max(0, totalOrdered - totalPrevRec - totalThisRec);
    const receiptValue = items.reduce((s, p) => s + (Number(p.receivedQty) || 0) * p.costPrice, 0);

    const totalGst = items.reduce((s, p) => {
      const q = Number(p.receivedQty) || 0;
      const gstRate = Number(p.gst) || 0;
      return s + (q * p.costPrice * (gstRate / 100));
    }, 0);

    const gstBreakdown: Record<number, number> = {};
    items.forEach((p) => {
      const q = Number(p.receivedQty) || 0;
      const gstRate = Number(p.gst) || 0;
      if (q > 0 && gstRate > 0) {
        const lineGst = q * p.costPrice * (gstRate / 100);
        gstBreakdown[gstRate] = (gstBreakdown[gstRate] || 0) + lineGst;
      }
    });

    const grandTotal = Math.round(receiptValue + totalGst);
    const paid = Number(amountPaid) || 0;
    const outstanding = Math.max(0, grandTotal - paid);

    // Validate batch/serial requirements for items being received
    const itemsToReceive = items.filter(p => Number(p.receivedQty) > 0);
    const batchValid = itemsToReceive.every(p => {
      if (!p.has_batch) return true;
      // Must have either an existing batch selected or a new batch with a name
      return (p.batch_id && !p.isNewBatch) || (p.isNewBatch && p.batchNum.trim().length > 0);
    });
    const serialValid = itemsToReceive.every(p => {
      if (!p.has_serialno) return true;
      return p.serialNumbers.length === Number(p.receivedQty);
    });

    const isValid = !!globalData.warehouse && !!receiptDate && totalThisRec > 0 && batchValid && serialValid;

    return {
      totalOrdered,
      totalPrevRec,
      totalThisRec,
      totalRemaining,
      receiptValue,
      totalGst,
      gstBreakdown,
      grandTotal,
      outstanding,
      isValid,
      batchValid,
      serialValid
    };
  }, [items, globalData.warehouse, receiptDate, amountPaid]);

  const handleSubmit = async () => {
    if (!poSummary) return;

    // Validate batch/serial requirements before submit
    if (!stats.batchValid) {
      showToast("Please select or create a batch for all batch-tracked items", "error");
      return;
    }
    if (!stats.serialValid) {
      showToast("Please enter all required serial numbers for serial-tracked items", "error");
      return;
    }

    setSubmitting(true);
    try {
      const productLines = items.filter(p => Number(p.receivedQty) > 0).map(p => {
        const q = Number(p.receivedQty) || 0;
        return {
          inventory_id: p.product_id || p.id || null,
          variant_id: p.variant_id || null,
          batch_id: p.batch_id || null,
          serialno_id: p.serialno_id || null,
          barcode: p.sku,
          name: p.name,
          stocks: p.orderedQty,
          received_stocks: q,
          buy_price: p.costPrice,
          sell_price: p.sellPrice,
          margin: 0,
          unit: p.unit || "pc",
          gst: Number(p.gst) || 0,
          batch_tracking: p.has_batch,
          serial_tracking: p.has_serialno,
          variant: p.variant || "",
          batch_number: p.batchNum,
          manufacturing_date: p.manufacturingDate || null,
          expiry_date: p.expiryDate || null,
          reorder_point: p.reorder_point ?? 5,
          storage_location: p.storageLoc || globalData.warehouse || "",
          datas: {
            storage_location: p.storageLoc || globalData.warehouse || "",
          },
          // Batch: send batch object if new
          ...(p.has_batch && !p.batch_id ? {
            batches: {
              batch_number: p.batchNum,
              stocks: q,
              manufacturing_date: p.manufacturingDate || null,
              expiry_date: p.expiryDate || null,
            }
          } : {}),
          // Serials
          serial_numbers: p.serialNumbers || [],
        };
      });

      const payload = {
        shop_id: SHOP_ID,
        type: "PO_UPDATE",
        purchase_id: poSummary.id || null,
        po_id: poSummary.id || null,
        supplier_id: poSummary.supplierId,
        calculations: {
          divided_by: "NONE",
          gst: { type: "inclusive", value: Number(items.filter(p => Number(p.receivedQty) > 0)[0]?.gst) || 18, registered: true }
        },
        additional_charges: {
          delivery_charge: 0,
          other_charge: 0,
        },
        datas: {
          supplier_name: poSummary.supplierName,
          po_reference: poSummary.referenceNo,
          receipt_date: receiptDate,
          invoice_no: invoiceNo,
          status: (manualStatus || liveStatus).toUpperCase(),
          warehouse: globalData.warehouse,
          storage_location: globalData.warehouse || "",
          notes: globalData.notes,
          received_by: globalData.received_by,
          payment: {
            method: paymentMethod,
            amountPaid: Number(amountPaid) || 0,
          },
        },
        paid_amount: Number(amountPaid) || 0,
        products: productLines,
      };

      const res = await postData(ENDPOINTS.PURCHASES, payload);
      if (res) {
        showToast("Receipt recorded successfully", "success");
        navigate("/po-grn");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to record receipt", "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-2.5">
        <GradientButton
          icon={submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          onClick={handleSubmit}
          disabled={!stats.isValid || submitting}
          className="rounded-lg shadow-sm text-[12px] px-6 h-8 flex items-center font-bold"
        >
          {submitting ? "Processing…" : "Record Receipt"}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, stats, submitting]);

  return (
    <div className="min-h-screen bg-[#f8f8f7]">
      {/* Sticky Header Overview */}
      <div className="sticky -top-2 md:-top-3 lg:-top-4 z-30 bg-white shadow-sm border-b border-slate-100 -mx-2 md:-mx-3 lg:-mx-4 mb-6">
        <HeaderOverview
          title="Receive Goods"
          reference={poSummary?.referenceNo || "Select a PO to begin"}
          stats={stats}
          show={showOverview}
          onToggle={() => setShowOverview(!showOverview)}
          poStatus={manualStatus || liveStatus}
        />
      </div>

      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* 1. PO Selection & Basic Info */}
          <SectionCard
            icon={<Search size={16} />}
            title="Purchase Order Selection"
            subtitle="Link receipt to a purchase order"
            accentColor="slate"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <FieldLabel required>PO Reference #</FieldLabel>
                <SearchSelect
                  labelKey="label"
                  valueKey="id"
                  fetchOptions={(q) => fetchPOOptions(q, getData)}
                  value={selectedPORef}
                  onChange={(val, opt: any) => {
                    setSelectedPORef(String(val));
                    if (opt?.id) loadPO(opt.id);
                  }}
                  placeholder="Search PO reference…"
                  className="w-full !rounded-lg !border-slate-200 !text-[13px] !font-bold"
                  renderOption={(opt: any) => (
                    <div className="flex items-center justify-between w-full py-0.5">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{opt.label}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{opt.supplierName} · {opt.date}</p>
                      </div>
                      <StatusPill status={opt.status as ReceiveStatus} />
                    </div>
                  )}
                />
              </div>

              <div>
                <FieldLabel>Supplier Invoice #</FieldLabel>
                <Input
                  placeholder="INV-2026-…"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="!rounded-lg !border-slate-200 !text-[13px] !font-bold"
                />
              </div>

              <div>
                <FieldLabel required>Receipt Date</FieldLabel>
                <Input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="!rounded-lg !border-slate-200 !text-[13px] !font-bold"
                />
              </div>
            </div>

            {poSummary && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-6 shadow-sm">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 shrink-0">
                    <User size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Supplier</p>
                    <p className="text-[14px] font-bold text-slate-700 truncate">
                      {poSummary.supplierName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8 pr-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Ordered Date</span>
                    <span className="text-[13px] font-bold text-slate-600">{poSummary.date}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Status</span>
                    <StatusPill status={poSummary.status} />
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* 2. Warehouse & Processing Info */}
          <SectionCard
            icon={<Truck size={16} />}
            title="Logistics & Processing"
            subtitle="Warehouse destination and processing status"
            accentColor="slate"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <FieldLabel required>Warehouse Location</FieldLabel>
                <ReusableSelect
                  options={WAREHOUSES.map(w => ({ value: w, label: w }))}
                  value={globalData.warehouse}
                  onValueChange={(val: string) => setGlobalData({ ...globalData, warehouse: val })}
                  placeholder="Select Warehouse"
                  className="!rounded-lg !border-slate-200 !text-[13px] !font-bold"
                />
              </div>
              <div>
                <FieldLabel>Process Status Override</FieldLabel>
                <ReusableSelect
                  options={[
                    { value: "Pending", label: "Pending Review", icon: <Clock size={14} /> },
                    { value: "Partial", label: "Partial Receipt", icon: <AlertCircle size={14} /> },
                    { value: "Completed", label: "Completed (All Items)", icon: <CheckCircle2 size={14} /> },
                  ]}
                  value={manualStatus || liveStatus}
                  onValueChange={(val: string) => setManualStatus(val as ReceiveStatus)}
                  placeholder="Select Status"
                  className="!rounded-lg !border-slate-200 !text-[13px] !font-bold"
                />
              </div>
              <div>
                <FieldLabel>Received By</FieldLabel>
                <Input
                  value={globalData.received_by}
                  onChange={(e) => setGlobalData({ ...globalData, received_by: e.target.value })}
                  className="!rounded-lg !border-slate-200 !text-[13px] !font-bold"
                />
              </div>
            </div>
          </SectionCard>

          {/* 3. Items Table */}
          {items.length > 0 && (
            <SectionCard
              icon={<PackageCheck size={16} />}
              title="Items to Receive"
              subtitle="Quantity and tracking details per product"
              accentColor="slate"
              badge={
                <button
                  type="button"
                  onClick={fillAll}
                  className="px-4 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-widest shadow-sm"
                >
                  Receive All Items
                </button>
              }
            >
              <div className="overflow-x-auto -mx-6">
                <table className="w-full border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="py-3 px-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Product Info</th>
                      <th className="py-3 px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Ordered</th>
                      <th className="py-3 px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Prev Rec.</th>
                      <th className="py-3 px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Remaining</th>
                      <th className="py-3 px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Receive Now</th>
                      <th className="py-3 px-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Tracking Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(item => {
                      const remaining = Math.max(0, item.orderedQty - item.previouslyReceivedQty);
                      const recvQty = Number(item.receivedQty) || 0;
                      const needsBatch = item.has_batch && recvQty > 0 && !((item.batch_id && !item.isNewBatch) || (item.isNewBatch && item.batchNum.trim().length > 0));
                      const needsSerials = item.has_serialno && recvQty > 0 && item.serialNumbers.length !== recvQty;
                      const hasWarning = needsBatch || needsSerials;

                      return (
                        <tr key={item.id} className={`group hover:bg-slate-50/30 transition-all ${hasWarning ? "bg-rose-50/20" : ""}`}>
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-slate-700 tracking-tight">{item.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">SKU: {item.sku}</span>
                                <span className="text-[9px] font-extrabold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wider font-sans">
                                  GST {item.gst}%
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center text-[13px] font-bold text-slate-500 tabular-nums">{item.orderedQty}</td>
                          <td className="py-4 px-4 text-center text-[13px] font-bold text-slate-400 tabular-nums">{item.previouslyReceivedQty}</td>
                          <td className="py-4 px-4 text-center text-[13px] font-bold text-slate-900 tabular-nums">{remaining}</td>
                          <td className="py-4 px-4 flex justify-center">
                            <QtyInput
                              value={item.receivedQty}
                              max={remaining}
                              onChange={(val) => updateItem(item.id, { receivedQty: val })}
                            />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {item.has_batch && recvQty > 0 && (
                                <button
                                  onClick={() => setBatchModal({
                                    isOpen: true,
                                    itemId: item.id,
                                    batches: item.availableBatches,
                                    productName: item.name,
                                    variantName: item.variant
                                  })}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all shadow-sm ${
                                    needsBatch ? 'bg-rose-50 border-rose-200 text-rose-500 animate-pulse' : 'bg-blue-50 border-blue-100 text-blue-600'
                                  }`}
                                >
                                  {item.batchNum || "Set Batch"}
                                </button>
                              )}
                              {item.has_serialno && recvQty > 0 && (
                                <button
                                  onClick={() => setBulkSerialModal({
                                    isOpen: true,
                                    itemId: item.id,
                                    productName: item.name,
                                    requiredQty: recvQty,
                                    currentSerials: item.serialNumbers
                                  })}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all shadow-sm ${
                                    needsSerials ? 'bg-rose-50 border-rose-200 text-rose-500 animate-pulse' : 'bg-violet-50 border-violet-100 text-violet-600'
                                  }`}
                                >
                                  {item.serialNumbers.length}/{recvQty} Serials
                                </button>
                              )}
                              {!item.has_batch && !item.has_serialno && (
                                <span className="text-[10px] text-slate-300 font-bold italic tracking-wider">SYSTEM TRACKED</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* 4. Payment Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard
              icon={<Banknote size={16} />}
              title="Order Summary"
              subtitle="Receipt value, GST, and outstanding dues"
              accentColor="slate"
            >
              <div className="space-y-4">
                <SummaryRow label="Subtotal (Excl. GST)" value={`₹${stats.receiptValue.toLocaleString()}`} />

                {/* GST Dynamic Breakdown Block */}
                {stats.totalGst > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5 mb-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GST Rate breakdown</span>
                      <span className="text-[11px] font-black text-slate-700 tabular-nums">Total GST: ₹{stats.totalGst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {Object.entries(stats.gstBreakdown).map(([rate, amt]) => {
                      if (Number(amt) <= 0) return null;
                      const basePriceForRate = items.reduce((acc, p) => {
                        const q = Number(p.receivedQty) || 0;
                        const c = Number(p.costPrice) || 0;
                        const r = Number(p.gst) || 0;
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
                      <span>Product base: ₹{stats.receiptValue.toLocaleString()} + GST: ₹{stats.totalGst.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} = ₹{(stats.receiptValue + stats.totalGst).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} with GST</span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <SummaryRow label="Total Balance Due" value={`₹${stats.grandTotal.toLocaleString()}`} large />
                </div>

                {/* Outstanding Balance indicators */}
                {stats.outstanding > 0 ? (
                  <div className="mt-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-rose-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Outstanding Balance</span>
                    </div>
                    <span className="text-[15px] font-extrabold text-rose-600 tabular-nums">
                      ₹{stats.outstanding.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Fully Paid</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold">NO BALANCE DUE</span>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              icon={<CreditCard size={16} />}
              title="Payment Method"
              subtitle="How this receipt was paid"
              accentColor="slate"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { id: "Cash", label: "Cash", icon: <Banknote size={18} /> },
                  { id: "UPI", label: "UPI", icon: <Smartphone size={18} /> },
                  { id: "Card", label: "Card", icon: <CreditCard size={18} /> },
                  { id: "Bank", label: "Bank", icon: <Landmark size={18} /> },
                ].map((m) => (
                  <PaymentBtn
                    key={m.id}
                    label={m.label}
                    icon={m.icon}
                    active={paymentMethod === m.id}
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  />
                ))}
              </div>

              <div>
                <FieldLabel>Amount Paid (₹)</FieldLabel>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))}
                  className="!rounded-lg !border-slate-200 !text-[13px] !font-bold"
                />
              </div>
            </SectionCard>
          </div>
          
          {/* Notes Section */}
          <SectionCard
            icon={<Clock size={16} />}
            title="Internal Observations"
            subtitle="Any specific notes regarding this receipt"
            accentColor="slate"
          >
            <textarea
              rows={3}
              placeholder="Enter notes or observations here..."
              className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-200 transition-all resize-none shadow-inner"
              value={globalData.notes}
              onChange={e => setGlobalData({ ...globalData, notes: e.target.value })}
            />
          </SectionCard>
        </div>
      </div>

      {/* Modals */}
      <BulkSerialModal
        isOpen={bulkSerialModal.isOpen}
        onClose={() => setBulkSerialModal({ ...bulkSerialModal, isOpen: false })}
        onSave={(serials) => updateItem(bulkSerialModal.itemId, { serialNumbers: serials })}
        requiredQty={bulkSerialModal.requiredQty}
        productName={bulkSerialModal.productName}
        currentSerials={bulkSerialModal.currentSerials}
      />

      {/* Batch Modal */}
      {batchModal.isOpen && (
        <BatchSelectionModal
          item={items.find(i => i.id === batchModal.itemId)!}
          onClose={() => setBatchModal({ ...batchModal, isOpen: false })}
          onSave={(updates) => updateItem(batchModal.itemId, updates)}
        />
      )}
    </div>
  );
};

// --- Batch Modal Component ---
const BatchSelectionModal = ({ item, onClose, onSave }: { item: POProduct, onClose: () => void, onSave: (u: any) => void }) => {
  const [isNew, setIsNew] = useState(item.isNewBatch);
  const [selectedId, setSelectedId] = useState(item.batch_id || "");
  const [batchNum, setBatchNum] = useState(item.batchNum || "");
  const [mfg, setMfg] = useState(item.manufacturingDate || "");
  const [exp, setExp] = useState(item.expiryDate || "");

  const handleSave = () => {
    onSave({
      isNewBatch: isNew,
      batch_id: isNew ? null : selectedId,
      batchNum: isNew ? batchNum : (item.availableBatches.find(b => b.id === selectedId)?.batch_number || ""),
      manufacturingDate: mfg,
      expiryDate: exp,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
              <Zap size={16} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Batch Selection</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setIsNew(false)}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${!isNew ? 'bg-white shadow-md text-slate-800' : 'text-slate-400 hover:text-slate-500'}`}
            >
              Existing Batch
            </button>
            <button
              onClick={() => setIsNew(true)}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${isNew ? 'bg-white shadow-md text-slate-800' : 'text-slate-400 hover:text-slate-500'}`}
            >
              New Batch
            </button>
          </div>

          {isNew ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <FieldLabel required>Batch Number</FieldLabel>
                <Input value={batchNum} onChange={e => setBatchNum(e.target.value)} placeholder="Enter batch identifier..." className="!rounded-lg !text-xs !font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>MFG Date</FieldLabel>
                  <Input type="date" value={mfg} onChange={e => setMfg(e.target.value)} className="!rounded-lg !text-xs !font-bold" />
                </div>
                <div>
                  <FieldLabel>EXP Date</FieldLabel>
                  <Input type="date" value={exp} onChange={e => setExp(e.target.value)} className="!rounded-lg !text-xs !font-bold" />
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <FieldLabel required>Select Available Batch</FieldLabel>
              <ReusableSelect
                options={item.availableBatches.map(b => ({ value: b.id, label: `${b.batch_number} (Exp: ${b.expiry_date || 'N/A'})` }))}
                value={selectedId}
                onValueChange={setSelectedId}
                placeholder="Select from existing batches..."
                className="!rounded-lg !font-bold !text-[13px]"
              />
              {item.availableBatches.length === 0 && (
                <p className="text-[10px] text-rose-400 font-bold mt-2 flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg border border-rose-100">
                  <AlertCircle size={12} />
                  No existing batches found for this product.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-50 mt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
            <GradientButton onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold shadow-md">Confirm Selection</GradientButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReceiveGoodForm;
