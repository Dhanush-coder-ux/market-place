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
  Package,
  CalendarDays,
  User,
  Smartphone,
  Banknote,
  CreditCard,
  Landmark
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch PO reference list for SearchSelect */
const fetchPOOptions = async (query: string, getData: Function) => {
  try {
    const res = await getData(`${ENDPOINTS.PURCHASES}/by/${SHOP_ID}/${query}`);
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-black ${cfg.cls}`}>
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

  const handleSave = () => {
    const lines = text.split(/[\n, ]+/).map(s => s.trim()).filter(Boolean);
    onSave(lines);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-violet-50/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 border border-violet-200">
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
          <p className="text-[11px] text-slate-500">Paste serial numbers separated by newlines, commas, or spaces.</p>
          <textarea
            className="w-full h-64 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-mono focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-300 resize-none"
            placeholder="SN1001&#10;SN1002&#10;SN1003..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-between items-center">
             <span className={`text-[10px] font-black px-3 py-1 rounded-lg border   ${text.split(/[\n, ]+/).map(s => s.trim()).filter(Boolean).length === requiredQty ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                {text.split(/[\n, ]+/).map(s => s.trim()).filter(Boolean).length} / {requiredQty} detected
              </span>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <GradientButton onClick={handleSave} className="px-6 py-2 rounded-xl text-xs">Save Serials</GradientButton>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ received, ordered }: { received: number; ordered: number }) => {
  const pct = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-blue-500" : "bg-slate-200"
            }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-black text-slate-400 w-8 text-right tabular-nums">{pct}%</span>
    </div>
  );
};

// ─── Qty Stepper ──────────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, num - 1))}
        disabled={num <= 0}
        className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all shadow-sm"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Math.min(max, Math.max(0, Number(e.target.value))))}
        className="w-16 h-8 text-center text-sm font-black text-slate-800 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all tabular-nums"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, num + 1))}
        disabled={num >= max}
        className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-100 disabled:opacity-30 transition-all shadow-sm"
      >
        <Plus size={14} />
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
  const [loadingPO, setLoadingPO] = useState(false);
  const [poSummary, setPOSummary] = useState<POSummary | null>(null);
  const [items, setItems] = useState<POProduct[]>([]);
  const [selectedPORef, setSelectedPORef] = useState<string>("");

  const [invoiceNo, setInvoiceNo] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [manualStatus, setManualStatus] = useState<ReceiveStatus | null>(null);

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
      }));

      // Fetch full inventory data per unique inventory_id to populate available batches
      const uniqueIds = [...new Set(mapped.map(m => m.product_id).filter(Boolean))];
      const invFetches = await Promise.all(
        uniqueIds.map(async (invId) => {
          try {
            const r = await getData(`${ENDPOINTS.INVENTORIES}/by/${SHOP_ID}/${invId}`);
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

    return { totalOrdered, totalPrevRec, totalThisRec, totalRemaining, receiptValue, grandTotal: receiptValue, isValid, batchValid, serialValid };
  }, [items, globalData.warehouse, receiptDate]);

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
          inventory_id: p.product_id || p.id,
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
          gst: 18, // Default or pull from item if available
          batch_tracking: p.has_batch,
          serial_tracking: p.has_serialno,
          variant: p.variant || "",
          batch_number: p.batchNum,
          manufacturing_date: p.manufacturingDate || null,
          expiry_date: p.expiryDate || null,
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
        purchase_id: poSummary.id,
        supplier_id: poSummary.supplierId,
        calculations: {
          divided_by: "NONE",
          gst: { type: "inclusive", value: 18, registered: true }
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
          notes: globalData.notes,
          received_by: globalData.received_by,
          payment: {
            method: paymentMethod,
            amountPaid: Number(amountPaid) || 0,
          },
        },
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
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="hidden md:flex flex-col items-end mr-4">
          <span className="text-[10px] font-black text-slate-400 leading-none mb-1 uppercase tracking-wider">Grand Total</span>
          <span className="text-xl font-black text-slate-900 leading-none tabular-nums">₹{stats.grandTotal.toLocaleString()}</span>
        </div>
        <GradientButton
          onClick={handleSubmit}
          disabled={!stats.isValid || submitting}
          className="rounded-xl shadow-md text-xs px-8 h-8 flex items-center"
          icon={submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={18} />}
        >
          {submitting ? "Processing..." : "Record Receipt"}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, stats, submitting]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto">

        {/* ── Page Title ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
              <Truck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Receive Goods</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Record incoming stock against a Purchase Order</p>
            </div>
          </div>
          {poSummary && (
            <div className="flex items-center gap-3">
              <StatusPill status={manualStatus || liveStatus} />
              <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">PO Mode</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-start">

          {/* ── LEFT: PO Search + Items ── */}
          <div className="lg:col-span-5 space-y-6">

            {/* PO Selection Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                    <Search size={20} />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-black text-slate-800">Select Purchase Order</h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Search by PO reference number to load items</p>
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-500 ml-1">PO Reference # *</label>
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
                    className="w-full !rounded-xl !border-slate-200"
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

                <Input
                  label="Supplier Invoice #"
                  placeholder="INV-2026-…"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="!rounded-xl"
                />
                <Input
                  label="Receipt Date"
                  type="date"
                  required
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="!rounded-xl"
                />

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-500 ml-1">Process Status</label>
                  <ReusableSelect
                    options={[
                      { value: "Pending", label: "Pending Review", icon: <Clock size={14} /> },
                      { value: "Partial", label: "Partial Receipt", icon: <AlertCircle size={14} /> },
                      { value: "Completed", label: "Completed (All Items)", icon: <CheckCircle2 size={14} /> },
                    ]}
                    value={manualStatus || liveStatus}
                    onValueChange={(val: string) => setManualStatus(val as ReceiveStatus)}
                    placeholder="Select Status"
                    className="!rounded-xl"
                  />
                </div>
              </div>

              {poSummary && (
                <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm">
                        <Truck size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 mb-0.5 uppercase tracking-wider">PO Reference</p>
                        <p className="text-lg font-black text-slate-800 tracking-tight">{poSummary.referenceNo}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Supplier</span>
                          <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">
                            {poSummary.supplierName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-emerald-200">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                          <CalendarDays size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Order Date</span>
                          <span className="text-[11px] font-bold text-slate-600">
                            {poSummary.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Items Table Card */}
            {loadingPO ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-20 flex flex-col items-center gap-4 text-slate-400 shadow-sm">
                <RefreshCw size={32} className="animate-spin text-blue-500" />
                <p className="text-sm font-black uppercase tracking-widest">Loading Items...</p>
              </div>
            ) : items.length > 0 ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                      <PackageCheck size={20} />
                    </div>
                    <div>
                      <h2 className="text-[13px] font-black text-slate-800">Items to Receive</h2>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Enter quantity received per item</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fillAll}
                    className="px-4 py-1.5 text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm uppercase tracking-wider"
                  >
                    Receive All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="py-4 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-tighter">Product Info</th>
                        <th className="py-4 px-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-tighter">Qty (Ordered/Prev)</th>
                        <th className="py-4 px-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-tighter">Remaining</th>
                        <th className="py-4 px-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-tighter">Receive Now</th>
                        <th className="py-4 px-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-tighter">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map(item => {
                        const remaining = Math.max(0, item.orderedQty - item.previouslyReceivedQty);
                        const totalRecv = item.previouslyReceivedQty + (Number(item.receivedQty) || 0);


                        const recvQty = Number(item.receivedQty) || 0;
                        const needsBatch = item.has_batch && recvQty > 0 && !((item.batch_id && !item.isNewBatch) || (item.isNewBatch && item.batchNum.trim().length > 0));
                        const needsSerials = item.has_serialno && recvQty > 0 && item.serialNumbers.length !== recvQty;
                        const hasWarning = needsBatch || needsSerials;

                        return (
                          <tr key={item.id} className={`group hover:bg-slate-50/50 transition-all ${hasWarning ? "bg-rose-50/30" : ""}`}>
                            <td className="py-5 px-8">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-black text-slate-800 group-hover:text-blue-600 transition-colors tracking-tight leading-tight">{item.name}</span>
                                <div className="flex items-center gap-2 mt-1.5">
                                  {item.variant && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-lg border border-slate-200">
                                      {item.variant}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">{item.sku || "NO SKU"}</span>
                                </div>
                                
                                {/* Tracking Indicators */}
                                <div className="flex items-center gap-3 mt-2">
                                  {item.has_batch && (
                                    <button
                                      onClick={() => setBatchModal({ isOpen: true, itemId: item.id, batches: item.availableBatches, productName: item.name, variantName: item.variant })}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-black transition-all ${needsBatch ? "bg-rose-100 border-rose-200 text-rose-600 shadow-sm animate-pulse" : "bg-blue-50 border-blue-100 text-blue-600"}`}
                                    >
                                      <Zap size={12} />
                                      {item.batchNum ? `Batch: ${item.batchNum}` : "Set Batch"}
                                    </button>
                                  )}
                                  {item.has_serialno && (
                                    <button
                                      onClick={() => setBulkSerialModal({ isOpen: true, itemId: item.id, productName: item.name, requiredQty: recvQty, currentSerials: item.serialNumbers })}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-black transition-all ${needsSerials ? "bg-rose-100 border-rose-200 text-rose-600 shadow-sm animate-pulse" : "bg-violet-50 border-violet-100 text-violet-600"}`}
                                    >
                                      <RefreshCw size={12} />
                                      {item.serialNumbers.length > 0 ? `${item.serialNumbers.length} Serials` : "Add Serials"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-black text-slate-800 tabular-nums">{item.orderedQty}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.unit} / {item.previouslyReceivedQty} prev</span>
                              </div>
                            </td>
                            <td className="py-5 px-4 text-center">
                              <span className={`text-[13px] font-black tabular-nums ${remaining === 0 ? "text-emerald-500" : "text-slate-800"}`}>
                                {remaining === 0 ? "✓" : remaining}
                              </span>
                            </td>
                            <td className="py-5 px-4">
                              <div className="flex justify-center">
                                <QtyInput
                                  value={item.receivedQty}
                                  max={99999}
                                  onChange={(v) => updateItem(item.id, { receivedQty: v })}
                                />
                              </div>
                            </td>
                            <td className="py-5 px-8 text-right min-w-[120px]">
                              <ProgressBar received={totalRecv} ordered={item.orderedQty} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-6 text-[11px]">
                  <div className="flex items-center gap-8 text-slate-400 font-black">
                    <div className="flex flex-col"><span className="uppercase tracking-tighter mb-0.5">Ordered</span><span className="text-[13px] text-slate-800 tabular-nums">{stats.totalOrdered}</span></div>
                    <div className="flex flex-col"><span className="uppercase tracking-tighter mb-0.5">Prev Received</span><span className="text-[13px] text-blue-600 tabular-nums">{stats.totalPrevRec}</span></div>
                    <div className="flex flex-col"><span className="uppercase tracking-tighter mb-0.5">This Receipt</span><span className="text-[13px] text-emerald-600 tabular-nums">{stats.totalThisRec}</span></div>
                    <div className="flex flex-col"><span className="uppercase tracking-tighter mb-0.5">Remaining</span><span className={`text-[13px] tabular-nums ${stats.totalRemaining === 0 ? "text-emerald-600" : "text-rose-600"}`}>{stats.totalRemaining}</span></div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Receipt Value</span>
                    <span className="text-xl font-black text-slate-900 tracking-tight tabular-nums">₹{stats.receiptValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ) : !loadingPO && selectedPORef ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-20 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                  <Package size={32} />
                </div>
                <p className="text-sm font-black text-slate-800">No items found in this PO</p>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shadow-inner">
                  <PackageCheck size={32} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">No Purchase Order Selected</p>
                  <p className="text-[11px] text-slate-400 font-bold max-w-xs mt-1">Search and select a Purchase Order reference above to load items and begin recording the receipt.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Status + Storage + Payment ── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Receipt Status Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                  <Clock size={16} />
                </div>
                <h2 className="text-[12px] font-black text-slate-800">Receipt Status</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight">Detected Status</span>
                  <StatusPill status={liveStatus} />
                </div>
                <div className={`p-4 rounded-[1.5rem] text-[11px] font-bold leading-relaxed ${liveStatus === "Completed" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" :
                  liveStatus === "Partial" ? "bg-blue-50 border border-blue-100 text-blue-700" :
                    "bg-amber-50 border border-amber-100 text-amber-700"
                  }`}>
                  {liveStatus === "Completed" && "✓ All ordered items have been fully received. PO will be closed."}
                  {liveStatus === "Partial" && "⚡ Some items received. PO remains open for future receipts."}
                  {liveStatus === "Pending" && "⏳ No quantities entered yet. Enter quantities to update status."}
                </div>
                {manualStatus && manualStatus !== liveStatus && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-700 flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>Status manually overridden to {manualStatus}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Storage & Admin Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 border border-violet-100 shadow-sm">
                  <Package size={16} />
                </div>
                <h2 className="text-[12px] font-black text-slate-800">Storage & Admin</h2>
              </div>
              <div className="p-6 space-y-5">
                <Input
                  label="Received By *"
                  placeholder="Staff Name..."
                  value={globalData.received_by}
                  onChange={e => setGlobalData({ ...globalData, received_by: e.target.value })}
                  className="!rounded-xl"
                />
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-500 ml-1">Warehouse Location *</label>
                  <ReusableSelect
                    options={WAREHOUSES.map(w => ({ value: w, label: w }))}
                    value={globalData.warehouse}
                    onValueChange={(val) => setGlobalData({ ...globalData, warehouse: val })}
                    placeholder="Select Warehouse"
                    className="!rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-500 ml-1">Internal Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter any observations..."
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-200 transition-all resize-none"
                    value={globalData.notes}
                    onChange={e => setGlobalData({ ...globalData, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
                  <Banknote size={16} />
                </div>
                <h2 className="text-[12px] font-black text-slate-800">Payment (Optional)</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "Cash", icon: <Banknote size={15} /> },
                    { id: "UPI", icon: <Smartphone size={15} /> },
                    { id: "Card", icon: <CreditCard size={15} /> },
                    { id: "Bank", icon: <Landmark size={15} /> }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all ${paymentMethod === m.id
                        ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                        : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-amber-200 hover:bg-white"
                        }`}
                    >
                      <div className="mb-2">{m.icon}</div>
                      <span className="text-[9px] font-black uppercase tracking-wider">{m.id}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-4 pt-2">
                  <Input
                    label="Amount Paid (₹)"
                    type="number"
                    className="!h-14 !text-xl !font-black !text-emerald-600 !rounded-2xl !bg-slate-50/50"
                    placeholder="0.00"
                    value={amountPaid as any}
                    onChange={(e) => setAmountPaid(e.target.value ? Number(e.target.value) : "")}
                  />
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Receipt Value</span>
                    <span className="text-xl font-black text-slate-900 tabular-nums">₹{stats.receiptValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Batch Select Modal (Inline for Premium Feel) */}
      {batchModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Select Batch</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider truncate max-w-[300px]">
                    {batchModal.productName} {batchModal.variantName ? `(${batchModal.variantName})` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBatchModal({ isOpen: false, itemId: "", batches: [], productName: "", variantName: "" })}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              <button
                onClick={() => {
                  updateItem(batchModal.itemId, { isNewBatch: true, batch_id: null, batchNum: "", manufacturingDate: "", expiryDate: "" });
                  setBatchModal({ isOpen: false, itemId: "", batches: [], productName: "", variantName: "" });
                }}
                className="w-full p-6 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-all flex flex-col items-center gap-2 group"
              >
                <Plus size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-wider">Create New Batch</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                  <span className="bg-white px-3">Existing Batches</span>
                </div>
              </div>

              {batchModal.batches.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {batchModal.batches.map((batch: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        updateItem(batchModal.itemId, { batch_id: batch.id, serialno_id: batch.serial_numbers?.id || null, batchNum: batch.name, isNewBatch: false, manufacturingDate: batch.manufacturing_date?.slice(0, 10) || "", expiryDate: batch.expiry_date?.slice(0, 10) || "" });
                        setBatchModal({ isOpen: false, itemId: "", batches: [], productName: "", variantName: "" });
                      }}
                      className="flex items-center justify-between p-5 rounded-[1.5rem] border border-slate-200 bg-white hover:border-amber-300 hover:shadow-md transition-all text-left group"
                    >
                      <div className="space-y-1.5">
                        <p className="text-sm font-black text-slate-800 group-hover:text-amber-700 transition-colors">
                          {batch.name || batch.batch_number}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-tighter text-slate-400">
                          <span className="flex items-center gap-1"><CalendarDays size={12} /> Mfg: {(batch.manufacturing_date || batch.mfg_date) ? new Date(batch.manufacturing_date || batch.mfg_date).toLocaleDateString() : 'N/A'}</span>
                          <span className="flex items-center gap-1"><Clock size={12} className="text-rose-400" /> Exp: {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">In Stock</p>
                        <p className="text-sm font-black text-slate-700 tabular-nums">{batch.stocks || 0} {batchModal.variantName ? "pcs" : ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider italic">No existing batches found</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <BulkSerialModal
        isOpen={bulkSerialModal.isOpen}
        onClose={() => setBulkSerialModal(prev => ({ ...prev, isOpen: false }))}
        onSave={(serials) => updateItem(bulkSerialModal.itemId, { serialNumbers: serials })}
        requiredQty={bulkSerialModal.requiredQty}
        productName={bulkSerialModal.productName}
        currentSerials={bulkSerialModal.currentSerials}
      />
    </div>
  );
};

export default ReceiveGoodForm;
