import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, AlertCircle, Save,
  Plus, Minus, Clock,
  CheckCircle2, ChevronDown, BarChart3, RefreshCw, Truck,
  PackageCheck
} from 'lucide-react';
import { GradientButton } from '@/components/ui/GradientButton';
import { useApi } from '@/context/ApiContext';
import { ENDPOINTS, SHOP_ID } from '@/services/endpoints';
import { useHeader } from '@/context/HeaderContext';
import { useToast } from '@/context/ToastContext';

import Input from "@/components/ui/Input";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";

// --- Type Definitions ---
type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";
type ReceiveStatus = "Pending" | "Partial" | "Completed";

type POProduct = {
  id: string;
  product_id: string; // for API payload
  name: string;
  sku: string;
  variant: string;
  unit: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  receivedQty: number | "";   // what user enters now
  costPrice: number;
  batchTracking: boolean;
  batchNum: string;
  manufacturingDate: string;
  expiryDate: string;
  remarks: string;
  unit_price: number; // for financial math
  remaining: number; // for form state
  receiveNow: number | "";
  reason: string;
  customReason: string;
  sellPrice: number;
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
    const res = await getData(`${ENDPOINTS.PURCHASES}?search=${encodeURIComponent(query)}&view=PO_VIEW`);
    const list: any[] = res?.data || res?.datas || [];
    return list.map((po: any) => ({
      id: po.id,
      label: po.reference_no || po.referenceNo || po.id,
      value: po.reference_no || po.id,
      supplierName: po.supplier_name || "",
      date: po.date || "",
      status: po.status || "Pending",
      totalItems: po.products?.length || 0,
    }));
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
    Pending:   { icon: <Clock size={11} />,        cls: "bg-amber-50 border-amber-200 text-amber-700"   },
    Partial:   { icon: <AlertCircle size={11} />,  cls: "bg-blue-50 border-blue-200 text-blue-700"      },
    Completed: { icon: <CheckCircle2 size={11} />, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${cfg.cls}`}>
      {cfg.icon} {status}
    </span>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ received, ordered }: { received: number; ordered: number }) => {
  const pct = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-blue-500" : "bg-slate-200"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-medium text-[#64748B] w-8 text-right">{pct}%</span>
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
        className="w-7 h-7 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-100 disabled:opacity-30 transition-colors"
      >
        <Minus size={12} />
      </button>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Math.min(max, Math.max(0, Number(e.target.value))))}
        className="w-14 h-7 text-center text-sm font-semibold text-[#0F172A] border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, num + 1))}
        disabled={num >= max}
        className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-blue-100 flex items-center justify-center text-[#2563EB] hover:bg-blue-100 disabled:opacity-30 transition-colors"
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
  const { getData, putData } = useApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [loadingPO, setLoadingPO] = useState(false);
  const [poSummary, setPOSummary] = useState<POSummary | null>(null);
  const [items, setItems] = useState<POProduct[]>([]);
  const [selectedPORef, setSelectedPORef] = useState<string>("");
  const [expandedRows, setExpandedRows]  = useState<Set<string>>(new Set());
  
  const [invoiceNo, setInvoiceNo] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [amountPaid, setAmountPaid] = useState<number | "">("");

  const [globalData, setGlobalData] = useState({
    received_date: new Date().toISOString().split("T")[0],
    received_by: "Current Admin",
    warehouse: "",
    notes: ""
  });

  // Restore PO from URL
  useEffect(() => {
    const poId = searchParams.get("poId");
    if (poId) loadPO(poId);
  }, []);

  const loadPO = useCallback(async (poId: string) => {
    setLoadingPO(true);
    try {
      const res = await getData(`${ENDPOINTS.PURCHASES}/${poId}`);
      const data = res?.data || res?.datas;
      if (!data) { showToast("PO not found", "error"); return; }

      setPOSummary({
        id:            data.id || poId,
        referenceNo:   data.reference_no || data.referenceNo || poId,
        supplierName:  data.supplier_name || "",
        supplierId:    data.supplier_id   || "",
        date:          data.date          || "",
        status:        (data.status as ReceiveStatus) || "Pending",
        totalItems:    data.products?.length || 0,
      });

      const mapped: POProduct[] = (data.products || []).map((p: any) => ({
        id:                   p.id || crypto.randomUUID(),
        product_id:           p.product_id || p.id,
        name:                 p.name || "",
        sku:                  p.barcode || p.sku || "",
        variant:              p.variant || "",
        unit:                 p.unit || "pc",
        orderedQty:           Number(p.quantity) || 0,
        previouslyReceivedQty: Number(p.received_qty) || 0,
        receivedQty:          "",
        costPrice:            Number(p.buy_price || p.costPrice) || 0,
        unit_price:           Number(p.buy_price || p.costPrice) || 0,
        batchTracking:        !!p.batch_tracking,
        batchNum:             p.batch_number || "",
        manufacturingDate:    p.manufacturing_date || "",
        expiryDate:           p.expiry_date || "",
        remarks:              "",
        remaining:            (Number(p.quantity) || 0) - (Number(p.received_qty) || 0),
        receiveNow:           "",
        reason:               "",
        customReason:         "",
        sellPrice:            Number(p.sell_price || p.sellPrice) || 0,
      }));

      setItems(mapped);
      setSearchParams(prev => { prev.set("poId", data.id || poId); return prev; }, { replace: true });
    } catch {
      showToast("Failed to load PO", "error");
    } finally {
      setLoadingPO(false);
    }
  }, [getData, showToast, setSearchParams]);

  const updateItem = (id: string, updates: Partial<POProduct>) => {
    setItems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const fillAll = () => {
    setItems(prev => prev.map(p => ({
      ...p,
      receivedQty: Math.max(0, p.orderedQty - p.previouslyReceivedQty),
    })));
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const liveStatus = useMemo(() => deriveStatus(items), [items]);

  const stats = useMemo(() => {
    const totalOrdered   = items.reduce((s, p) => s + p.orderedQty, 0);
    const totalPrevRec   = items.reduce((s, p) => s + p.previouslyReceivedQty, 0);
    const totalThisRec   = items.reduce((s, p) => s + (Number(p.receivedQty) || 0), 0);
    const totalRemaining = Math.max(0, totalOrdered - totalPrevRec - totalThisRec);
    const receiptValue   = items.reduce((s, p) => s + (Number(p.receivedQty) || 0) * p.costPrice, 0);
    
    const isValid = !!globalData.warehouse && !!receiptDate && totalThisRec > 0;

    return { totalOrdered, totalPrevRec, totalThisRec, totalRemaining, receiptValue, grandTotal: receiptValue, isValid };
  }, [items, globalData.warehouse, receiptDate]);

  const handleSubmit = async () => {
    if (!poSummary) return;
    setSubmitting(true);
    try {
      const payload = {
        datas: {
          shop_id: SHOP_ID,
          type: "PO_UPDATE",
          id: poSummary.id,
          po_reference: poSummary.referenceNo,
          supplier_id: poSummary.supplierId,
          supplier_name: poSummary.supplierName,
          receipt_date: receiptDate,
          invoice_no: invoiceNo,
          status: liveStatus,
          warehouse: globalData.warehouse,
          notes: globalData.notes,
          received_by: globalData.received_by,
          payment: {
            method: paymentMethod,
            amount_paid: Number(amountPaid) || 0,
          },
          products: items.filter(p => Number(p.receivedQty) > 0).map(p => ({
            id: p.product_id,
            barcode: p.sku,
            name: p.name,
            quantity: Number(p.receivedQty),
            buy_price: p.costPrice,
            sell_price: p.sellPrice,
            batch_tracking: p.batchTracking,
            batch_number: p.batchNum,
            manufacturing_date: p.manufacturingDate,
            expiry_date: p.expiryDate,
            remarks: p.remarks,
            ...(Number(p.receivedQty) < (p.orderedQty - p.previouslyReceivedQty) ? { 
              reason: p.reason === "Other" ? p.customReason : p.reason 
            } : {})
          })),
        }
      };

      const res = await putData(ENDPOINTS.PURCHASES, payload);
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
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Grand Total</span>
          <span className="text-xl font-black text-slate-900 leading-none">₹{stats.grandTotal.toLocaleString()}</span>
        </div>
        <GradientButton 
          onClick={handleSubmit}
          disabled={!stats.isValid || submitting}
          className="rounded-xl shadow-md text-xs px-8 h-8 flex items-center"
          icon={submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={18} />}
        >
          {submitting ? "Recording..." : "Record Receipt"}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, stats, submitting]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-5">

        {/* ── Page Title ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#0F172A]">Receive Goods</h1>
            <p className="text-sm text-[#64748B] mt-0.5">Record incoming stock against a Purchase Order</p>
          </div>
          {poSummary && <StatusPill status={liveStatus} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-5 items-start">

          {/* ── LEFT: PO Search + Items ── */}
          <div className="lg:col-span-5 space-y-5">

            {/* PO Selection Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center border border-blue-100">
                  <Search size={16} className="text-[#2563EB]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#0F172A]">Select Purchase Order</h2>
                  <p className="text-[11px] text-[#64748B]">Search by PO reference number to load items</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* PO Ref SearchSelect */}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    PO Reference # <span className="text-red-500">*</span>
                  </label>
                  <SearchSelect
                    labelKey="label"
                    valueKey="id"
                    fetchOptions={(q) => fetchPOOptions(q, getData)}
                    value={selectedPORef}
                    onChange={(val, opt: any) => {
                      setSelectedPORef(String(val));
                      if (opt?.id) loadPO(opt.id);
                    }}
                    placeholder="Search PO-2026-0001…"
                    className="w-full !border-[#E2E8F0]"
                    renderOption={(opt: any) => (
                      <div className="flex items-center justify-between w-full py-0.5">
                        <div>
                          <p className="text-xs font-semibold text-[#0F172A]">{opt.label}</p>
                          <p className="text-[11px] text-[#64748B]">{opt.supplierName} · {opt.date}</p>
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
                />
                <Input
                  label="Receipt Date"
                  type="date"
                  required
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                />
              </div>

              {/* PO Info strip */}
              {poSummary && (
                <div className="px-6 py-3 bg-[#EFF6FF] border-t border-blue-100 flex flex-wrap items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-[#2563EB] font-semibold">
                    <Truck size={13} /> {poSummary.referenceNo}
                  </span>
                  <span className="text-[#64748B]">Supplier: <strong className="text-[#0F172A]">{poSummary.supplierName}</strong></span>
                  <span className="text-[#64748B]">PO Date: <strong className="text-[#0F172A]">{poSummary.date}</strong></span>
                  <span className="text-[#64748B]">{poSummary.totalItems} item(s)</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            {loadingPO ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 flex flex-col items-center gap-3 text-[#64748B]">
                <RefreshCw size={24} className="animate-spin text-[#2563EB]" />
                <p className="text-sm font-medium">Loading PO items…</p>
              </div>
            ) : items.length > 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
                {/* Table Header */}
                <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-[#E2E8F0]">
                      <PackageCheck size={16} className="text-[#64748B]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#0F172A]">Items to Receive</h2>
                      <p className="text-[11px] text-[#64748B]">Enter quantity received per item</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fillAll}
                    className="px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Receive All Remaining
                  </button>
                </div>

                {/* Column Header */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-medium uppercase tracking-wider text-[#64748B]">
                  <div className="col-span-4">Product</div>
                  <div className="col-span-1 text-center">Ordered</div>
                  <div className="col-span-1 text-center">Prev Rec</div>
                  <div className="col-span-1 text-center">Remaining</div>
                  <div className="col-span-2 text-center">Receive Now</div>
                  <div className="col-span-2 text-center">Progress</div>
                  <div className="col-span-1" />
                </div>

                {/* Rows */}
                <div className="divide-y divide-[#F1F5F9]">
                  {items.map(item => {
                    const remaining  = Math.max(0, item.orderedQty - item.previouslyReceivedQty);
                    const totalRecv  = item.previouslyReceivedQty + (Number(item.receivedQty) || 0);
                    const isFull     = totalRecv >= item.orderedQty;
                    const isExpanded = expandedRows.has(item.id);

                    return (
                      <div key={item.id} className={`bg-white hover:bg-[#F8FAFC] transition-colors ${isFull ? "border-l-2 border-emerald-400" : ""}`}>
                        {/* Main row */}
                        <div className="grid grid-cols-12 gap-3 px-6 py-4 items-center">

                          {/* Product info */}
                          <div className="col-span-4">
                            <p className="text-sm font-semibold text-[#0F172A] leading-tight">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.variant && (
                                <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded font-medium border border-blue-100">
                                  {item.variant}
                                </span>
                              )}
                              {item.sku && (
                                <span className="text-[10px] text-[#64748B] font-mono">{item.sku}</span>
                              )}
                              {isFull && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 font-medium">
                                  ✓ Complete
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Ordered */}
                          <div className="col-span-1 text-center">
                            <span className="text-sm font-medium text-[#0F172A]">{item.orderedQty}</span>
                            <span className="text-[10px] text-[#64748B] block">{item.unit}</span>
                          </div>

                          {/* Previously received */}
                          <div className="col-span-1 text-center">
                            <span className={`text-sm font-medium ${item.previouslyReceivedQty > 0 ? "text-blue-600" : "text-slate-300"}`}>
                              {item.previouslyReceivedQty || "—"}
                            </span>
                          </div>

                          {/* Remaining */}
                          <div className="col-span-1 text-center">
                            <span className={`text-sm font-semibold ${remaining === 0 ? "text-emerald-600" : "text-[#0F172A]"}`}>
                              {remaining === 0 ? "✓" : remaining}
                            </span>
                          </div>

                          {/* Receive qty stepper */}
                          <div className="col-span-2 flex justify-center">
                            {remaining > 0 ? (
                              <QtyInput
                                value={item.receivedQty}
                                max={remaining}
                                onChange={(v) => updateItem(item.id, { receivedQty: v })}
                              />
                            ) : (
                              <span className="text-xs text-emerald-600 font-medium">All received</span>
                            )}
                          </div>

                          {/* Progress */}
                          <div className="col-span-2">
                            <ProgressBar
                              received={totalRecv}
                              ordered={item.orderedQty}
                            />
                          </div>

                          {/* Expand toggle */}
                          <div className="col-span-1 flex justify-end">
                            {(item.batchTracking || true) && (
                              <button
                                type="button"
                                onClick={() => toggleRow(item.id)}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isExpanded
                                    ? "bg-[#EFF6FF] border-blue-100 text-[#2563EB]"
                                    : "border-[#E2E8F0] text-[#64748B] hover:bg-slate-50"
                                }`}
                              >
                                <ChevronDown
                                  size={14}
                                  className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded: batch + remarks */}
                        {isExpanded && (
                          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#F1F5F9]">
                            {item.batchTracking ? (
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2 md:col-span-4 mb-1">
                                  <div className="w-5 h-5 rounded-md bg-[#EFF6FF] flex items-center justify-center">
                                    <BarChart3 size={11} className="text-[#2563EB]" />
                                  </div>
                                  <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide">Batch Information</span>
                                </div>
                                <Input
                                  label="Batch Number *"
                                  placeholder="BATCH-001"
                                  value={item.batchNum}
                                  onChange={(e) => updateItem(item.id, { batchNum: e.target.value })}
                                  className="!h-8 !text-xs !border-[#E2E8F0]"
                                />
                                <Input
                                  label="Manufacturing Date"
                                  type="date"
                                  value={item.manufacturingDate}
                                  onChange={(e) => updateItem(item.id, { manufacturingDate: e.target.value })}
                                  className="!h-8 !text-xs !border-[#E2E8F0]"
                                />
                                <Input
                                  label="Expiry Date"
                                  type="date"
                                  value={item.expiryDate}
                                  onChange={(e) => updateItem(item.id, { expiryDate: e.target.value })}
                                  className="!h-8 !text-xs !border-[#E2E8F0]"
                                />
                                <Input
                                  label="Remarks"
                                  placeholder="Optional note…"
                                  value={item.remarks}
                                  onChange={(e) => updateItem(item.id, { remarks: e.target.value })}
                                  className="!h-8 !text-xs !border-[#E2E8F0]"
                                />
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-4">
                                <Input
                                  label="Remarks"
                                  placeholder="Optional note about this item…"
                                  value={item.remarks}
                                  onChange={(e) => updateItem(item.id, { remarks: e.target.value })}
                                  className="!h-8 !text-xs !border-[#E2E8F0]"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Table footer summary */}
                <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-6 text-[#64748B]">
                    <span>Ordered: <strong className="text-[#0F172A]">{stats.totalOrdered}</strong></span>
                    <span>Previously Received: <strong className="text-blue-600">{stats.totalPrevRec}</strong></span>
                    <span>This Receipt: <strong className="text-emerald-600">{stats.totalThisRec}</strong></span>
                    <span>Remaining: <strong className={stats.totalRemaining === 0 ? "text-emerald-600" : "text-orange-600"}>{stats.totalRemaining}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B]">Receipt Value:</span>
                    <span className="font-semibold text-[#0F172A]">₹{stats.receiptValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ) : !loadingPO && selectedPORef ? null : (
              /* Empty state */
              <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] p-16 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                  <PackageCheck size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-[#64748B]">No PO Selected</p>
                <p className="text-xs text-[#64748B] max-w-xs">Search and select a Purchase Order reference above to load its items and begin recording the receipt.</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Status + Payment ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Receipt Status Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0]">
                <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">Receipt Status</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#64748B]">Detected Status</span>
                  <StatusPill status={liveStatus} />
                </div>
                <div className={`p-3 rounded-xl text-xs ${
                  liveStatus === "Completed" ? "bg-emerald-50 border border-emerald-100 text-emerald-800" :
                  liveStatus === "Partial"   ? "bg-blue-50 border border-blue-100 text-blue-800" :
                                               "bg-amber-50 border border-amber-100 text-amber-800"
                }`}>
                  {liveStatus === "Completed" && "✓ All ordered items have been fully received. PO will be closed."}
                  {liveStatus === "Partial"   && "⚡ Some items received. PO remains open for future receipts."}
                  {liveStatus === "Pending"   && "⏳ No quantities entered yet. Enter quantities to update status."}
                </div>
              </div>
            </div>

            {/* Global Fields Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0]">
                <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">Global Info</h2>
              </div>
              <div className="p-5 space-y-4">
                <Input
                  label="Received By *"
                  value={globalData.received_by}
                  onChange={e => setGlobalData({...globalData, received_by: e.target.value})}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#64748B] uppercase tracking-wide">Warehouse Location *</label>
                  <select 
                    required 
                    value={globalData.warehouse} 
                    onChange={e => setGlobalData({...globalData, warehouse: e.target.value})} 
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Select Location...</option>
                    {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#64748B] uppercase tracking-wide">Remarks / Notes</label>
                  <textarea 
                    rows={2} 
                    value={globalData.notes} 
                    onChange={e => setGlobalData({...globalData, notes: e.target.value})} 
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white" 
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0]">
                <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">Payment (Optional)</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-4 gap-1.5">
                  {(["Cash", "UPI", "Card", "Bank"] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl border text-[10px] font-semibold uppercase transition-all ${
                        paymentMethod === m
                          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-[#E2E8F0] text-[#64748B] hover:border-blue-200"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <Input
                  label="Amount Paid (₹)"
                  type="number"
                  placeholder="0.00"
                  value={amountPaid as any}
                  onChange={(e) => setAmountPaid(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveGoodForm;