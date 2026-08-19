import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Printer, Building2, Calendar, Package,
  ReceiptText, ArrowLeft, User, FileText, CheckCircle2, Clock, Banknote, AlertCircle,
  RotateCcw, X, ChevronRight, Info, Minus, Plus, CornerDownLeft
} from "lucide-react";
import { toDisplayData } from "./PurchaseHistory";
import type { DirectPurchaseData } from "./PurchaseHistory";
import { ProfileHeaderCard, SectionCard, DetailItem, InfoRow } from "@/components/common/SuperUI";

import { useBusinessApi } from "@/context/BusinessApiContext";
import { useHeader } from "@/context/HeaderContext";
import { useApi } from "@/context/ApiContext";
import { SHOP_ID, ENDPOINTS } from "@/services/endpoints";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { useToast } from "@/context/ToastContext";
import { AntBadge } from "@/components/ui/AntBadge";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const formatBatchDate = (dateStr?: string) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const RETURN_REASONS = [
  "Damaged in transit",
  "Wrong item supplied",
  "Quality issue",
  "Excess quantity",
  "Expired",
  "Other",
];

// ─── Purchase Return Dialog ────────────────────────────────────────────────────
interface ReturnItem {
  purchase_item_id: string;
  name: string;
  quantity: number;
  maxQuantity: number;
  buy_price: number;
  returnQty: number;
  reason: string;
}

interface PurchaseReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseId: string;
  shopId: string;
  outstanding: number;
}

const PurchaseReturnDialog = ({
  isOpen,
  onClose,
  onSuccess,
  purchaseId,
  shopId,
  outstanding,
}: PurchaseReturnDialogProps) => {
  const { postData, getData, error: apiError } = useApi();
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [globalReason, setGlobalReason] = useState("");

  // Always fetch fresh purchase data from API when dialog opens
  // so we always have correct backend item IDs (not stale location.state data)
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setGlobalReason("");
    setReturnItems([]);
    setLoadingItems(true);

    getData(`${ENDPOINTS.PURCHASES}/by/id/${shopId}/${purchaseId}`, { shop_id: shopId })
      .then((res: any) => {
        const raw = res?.data ? (Array.isArray(res.data) ? res.data[0] : res.data) : (res?.id ? res : null);
        const rawItems: any[] = raw?.items ?? raw?.products ?? [];
        setReturnItems(
          rawItems
            .filter((p: any) => {
              const qty = Number(p.stocks_infos?.stocks ?? p.stocks ?? p.quantity ?? p.stocks_added ?? 0);
              return qty > 0;
            })
            .map((p: any) => ({
              purchase_item_id: p.id || p.purchase_item_id || "",
              name: String(p.name || p.product_name || p.product_id || "Unknown"),
              quantity: Number(p.stocks_infos?.stocks ?? p.stocks ?? p.quantity ?? p.stocks_added ?? 0),
              maxQuantity: Number(p.stocks_infos?.stocks ?? p.stocks ?? p.quantity ?? p.stocks_added ?? 0),
              buy_price: Number(p.buy_price ?? p.pricing_infos?.[0]?.buy_price ?? 0),
              returnQty: 0,
              reason: "",
            }))
        );
      })
      .catch(() => {
        showToast("Failed to load purchase items. Please close and try again.", "error");
      })
      .finally(() => setLoadingItems(false));
  }, [isOpen, purchaseId, shopId]);

  if (!isOpen) return null;

  const updateQty = (idx: number, val: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, returnQty: Math.max(0, Math.min(val, item.maxQuantity)) }
          : item
      )
    );
  };

  const selectedItems = returnItems.filter((r) => r.returnQty > 0);
  const returnValue = selectedItems.reduce(
    (sum, r) => sum + r.returnQty * r.buy_price,
    0
  );
  const adjustedAgainstOutstanding = Math.min(outstanding, returnValue);
  const cashRefund = Math.max(0, returnValue - adjustedAgainstOutstanding);

  const canProceed1 = selectedItems.length > 0;
  const canProceed2 = globalReason.trim().length > 0;

  const handleSubmit = async () => {
    if (!canProceed2) return;

    // Guard: ensure all selected items have a valid purchase_item_id
    const missingId = selectedItems.find((r) => !r.purchase_item_id);
    if (missingId) {
      showToast(`Item "${missingId.name}" is missing its backend ID. Please refresh the page and try again.`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        purchase_id: purchaseId,
        shop_id: SHOP_ID,
        payment_infos: {
          reason: globalReason,
          return_value: returnValue,
          adjusted_against_outstanding: adjustedAgainstOutstanding,
          cash_refund: cashRefund,
        },
        items: selectedItems.map((r) => ({
          purchase_item_id: r.purchase_item_id,
          quantity: r.returnQty,
          reason: globalReason,
        })),
      };
      const result = await postData(`${ENDPOINTS.PURCHASES}/returns`, payload);
      if (result === null) {
        // postData sets error state on failure and returns null
        const errMsg = apiError || "Failed to record return — check item quantities and try again.";
        showToast(errMsg, "error");
        return;
      }
      showToast("Purchase return recorded successfully", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err?.message || "Failed to record return", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-white flex-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <RotateCcw size={15} className="text-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800">Purchase Return</h2>
              <p className="text-[10px] text-slate-400 font-medium">
                Step {step} of 3 —{" "}
                {step === 1 ? "Select items" : step === 2 ? "Reason" : "Review & confirm"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 flex items-center gap-2 border-b border-slate-50 flex-none">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${step >= s
                  ? "bg-rose-600 text-white"
                  : "bg-slate-100 text-slate-400"
                  }`}
              >
                {step > s ? <CheckCircle2 size={10} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 w-10 rounded-full transition-all ${step > s ? "bg-rose-400" : "bg-slate-100"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Step 1 — Select items */}
          {step === 1 && (
            <div className="p-6 space-y-3">
              {loadingItems ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-medium">Loading items from server...</p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-500 mb-4">
                    Enter the quantity to return for each item. You cannot return more than the original purchase quantity.
                  </p>
                  {returnItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${item.returnQty > 0
                        ? "border-rose-200 bg-rose-50"
                        : "border-slate-100 bg-slate-50/50"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">
                              Purchased: {item.maxQuantity}
                            </span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {fmt(item.buy_price)} / unit
                            </span>
                            {item.returnQty > 0 && (
                              <>
                                <span className="text-[10px] text-slate-300">•</span>
                                <span className="text-[10px] text-rose-600 font-bold">
                                  Return value: {fmt(item.returnQty * item.buy_price)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-none">
                          <button
                            onClick={() => updateQty(idx, item.returnQty - 1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-40"
                            disabled={item.returnQty === 0}
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={item.maxQuantity}
                            value={item.returnQty}
                            onChange={(e) => updateQty(idx, parseInt(e.target.value) || 0)}
                            className="w-12 h-7 text-center text-xs font-black rounded-lg border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
                          />
                          <button
                            onClick={() => updateQty(idx, item.returnQty + 1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-40"
                            disabled={item.returnQty >= item.maxQuantity}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {returnItems.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">No returnable items found.</p>
                  )}
                </>
              )}
            </div>
          )}


          {/* Step 2 — Reason */}
          {step === 2 && (
            <div className="p-6 space-y-4">
              <p className="text-xs font-bold text-slate-500">
                Select a reason for returning {selectedItems.length} item(s) worth {fmt(returnValue)}.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RETURN_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setGlobalReason(reason)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition-all ${globalReason === reason
                      ? "border-rose-400 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    {globalReason === reason && (
                      <span className="mr-1">✓</span>
                    )}
                    {reason}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Custom reason (optional)</label>
                <textarea
                  value={RETURN_REASONS.includes(globalReason) ? "" : globalReason}
                  onChange={(e) => setGlobalReason(e.target.value)}
                  onFocus={() => {
                    if (RETURN_REASONS.includes(globalReason)) setGlobalReason("");
                  }}
                  placeholder="Or type a custom reason..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-3">Return Summary</p>
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-medium">
                      {item.name} × {item.returnQty}
                    </span>
                    <span className="font-black text-slate-800">{fmt(item.returnQty * item.buy_price)}</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-rose-200 flex justify-between items-center">
                  <span className="text-xs font-black text-rose-700">Total Return Value</span>
                  <span className="text-sm font-black text-rose-700">{fmt(returnValue)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Settlement Split</p>
                {adjustedAgainstOutstanding > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center">
                        <Info size={11} className="text-amber-700" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-amber-800">Adjusted against outstanding</p>
                        <p className="text-[9px] text-amber-600">No cash movement</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-amber-700">{fmt(adjustedAgainstOutstanding)}</span>
                  </div>
                )}
                {cashRefund > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center">
                        <Banknote size={11} className="text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-emerald-800">Cash refund to receive</p>
                        <p className="text-[9px] text-emerald-600">Real money returned</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-700">{fmt(cashRefund)}</span>
                  </div>
                )}
                {adjustedAgainstOutstanding === 0 && cashRefund === 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium text-center">
                    Full return value will be refunded in cash.
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                <p className="text-xs text-slate-700 font-medium">{globalReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-none">
          <button
            onClick={step === 1 ? onClose : () => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="px-4 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                disabled={(step === 1 && !canProceed1) || (step === 2 && !canProceed2)}
                className="px-5 h-8 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                Next <ChevronRight size={12} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 h-8 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1.5 disabled:opacity-60 active:scale-95"
              >
                {submitting ? "Processing..." : "Confirm Return"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PurchaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { purchase } = useBusinessApi();
  const { getData } = useApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();

  // Retrieve po from state or use state fetched from API
  const [po, setPo] = useState<DirectPurchaseData | undefined>(location.state?.po);
  const [loading, setLoading] = useState(!po);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returns, setReturns] = useState<any[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const hasRefreshedReturnsRef = useRef<Record<string, boolean>>({});

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center justify-end w-full animate-in fade-in slide-in-from-right-4 duration-300 gap-2">
        {po && po.purchaseType === 'Purchase' && po.status !== 'cancelled' && (
          <button
            type="button"
            onClick={() => {
              const hasReturns = (po?.returns?.length || 0) > 0 || ((po as any)?.purchase_returns?.length || 0) > 0;
              if (hasReturns) {
                showToast("Cannot edit purchase because items have been returned.", "warning");
                return;
              }
              navigate(`/purchase/edit/${po.id}`);
            }}
            disabled={(po?.returns?.length || 0) > 0 || ((po as any)?.purchase_returns?.length || 0) > 0}
            title={((po?.returns?.length || 0) > 0 || ((po as any)?.purchase_returns?.length || 0) > 0) ? "Cannot edit because items have been returned" : "Edit Purchase"}
            className={`px-6 h-8 rounded-lg border font-bold text-xs transition-all flex items-center shadow-sm ${((po?.returns?.length || 0) > 0 || ((po as any)?.purchase_returns?.length || 0) > 0)
                ? "border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed"
                : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            Edit Purchase
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate("/purchase/detail")}
          className="px-6 h-8 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center shadow-sm"
        >
          Clear
        </button>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, navigate, po, showToast]);

  const fetchPo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // First try the purchases endpoint (direct purchase ID with shop scope)
      const res = await purchase.getPurchaseById(SHOP_ID, id);
      let data = res?.data ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
      if (!data && res && res.id) {
        data = res;
      }
      if (data) {
        setPo(toDisplayData(data));
        return;
      }
      // Fallback: try the stock adjustments endpoint by shop list (used when navigating from Stock Movements tab)
      // Since GET /inventories/s-adjustments/:id throws 405 Method Not Allowed, we fetch by shop list and find the record
      const adjRes = await getData(`${ENDPOINTS.S_ADJUSTMENTS}/by/shop/${SHOP_ID}`, { view: "STOCKADJUSTMENT_VIEW", shop_id: SHOP_ID, limit: "100" });
      let adjList: any[] = [];
      if (Array.isArray(adjRes)) adjList = adjRes;
      else if (Array.isArray(adjRes?.data)) adjList = adjRes.data;
      else if (Array.isArray(adjRes?.data?.datas)) adjList = adjRes.data.datas;
      else if (Array.isArray(adjRes?.datas)) adjList = adjRes.datas;
      const adjData = adjList.find((a: any) => a.id === id);
      if (adjData) {
        setPo(toDisplayData(adjData));
      }
    } catch (err: any) {
      console.error("Failed to fetch purchase:", err);
      setErrorMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [id, purchase, getData]);

  useEffect(() => {
    if (!po && id) {
      fetchPo();
    }
  }, [id, po, fetchPo]);

  useEffect(() => {
    if (activeTab === 2) {
      const currentReturns = po?.returns || (po as any)?.purchase_returns || [];
      setReturns(currentReturns);

      // If returns array is empty and we haven't retried for this PO yet, retry once after 600ms
      if (currentReturns.length === 0 && id && !hasRefreshedReturnsRef.current[id]) {
        hasRefreshedReturnsRef.current[id] = true;
        setReturnsLoading(true);
        const timer = setTimeout(async () => {
          try {
            await fetchPo();
          } finally {
            setReturnsLoading(false);
          }
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, po, id, fetchPo]);

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-slate-50/50">
        <SkeletonLoader variant="detail" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-6 text-center">
        <ReceiptText size={48} className="mb-4 text-slate-300" />
        <p className="text-lg font-bold text-slate-800">Purchase details not found</p>
        {errorMsg && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-md p-3 max-w-md my-3 font-mono break-all">
            Error: {errorMsg}
          </p>
        )}
        <button
          onClick={() => navigate("/purchase-history")}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} /> Back to History
        </button>
      </div>
    );
  }


  const subtotal = po.products.reduce(
    (sum, item) => sum + (item.buy_price || 0) * (item.quantity || 0),
    0
  );

  const totalGst = po.products.reduce((sum, item) => {
    let gst = 0;

    if (typeof item.gst === "string") {
      gst = parseFloat(String(item.gst).replace("%", ""));
    } else {
      gst = Number(item.gst ?? 0);
    }

    return sum + ((item.buy_price || 0) * (item.quantity || 0) * gst) / 100;
  }, 0);

  const transportCharge = po.charges?.transport || 0;
  const otherCharge = po.charges?.other || 0;

  const grandTotal =
    subtotal +
    totalGst;

  const outstanding =
    po.outstanding !== undefined ? po.outstanding : Math.max(0, grandTotal - (po.paid_amount || 0));

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans text-slate-900 overflow-hidden relative">

      {/* Profile Header Card */}
      <div className="flex-none p-1 pb-0">
        <ProfileHeaderCard
          name={
            <div className="flex items-center gap-2 flex-wrap">
              <span>Purchase · {po.systemId}</span>
              {po.version && (
                <div className="mt-0.5">
                  <AntBadge variant="meta-version" type="tag">{po.version}</AntBadge>
                </div>
              )}
            </div>
          }
          initials="PO"
          subText={po.systemId && po.systemId !== po.poNumber ? `Invoice No: ${po.poNumber}` : ""}
          badges={[
            { text: po.purchaseType, variant: "vendor", dotColor: "bg-[var(--mv-purchase-dot)]" },
            po.outstanding && po.outstanding > 0
              ? (po.paid_amount === 0
                ? { text: "Pending", variant: "pay-pending", dotColor: "bg-[var(--pay-pending-dot)]" }
                : { text: "Partially paid", variant: "pay-partial", dotColor: "bg-[var(--pay-partial-dot)]" })
              : { text: "Paid", variant: "pay-paid", dotColor: "bg-[var(--pay-paid-dot)]" }
          ]}
          infoItems={[
            { icon: Calendar, text: `${po.date} at ${po.time}` },
            { icon: Building2, text: typeof po.vendor === 'object' ? (po.vendor as any).supplier_name || (po.vendor as any).name || "—" : po.vendor },
            { icon: Banknote, text: `Paid: ${fmt(po.paid_amount || 0)}` },
            { icon: AlertCircle, text: `Due: ${fmt(po.outstanding || 0)}` }
          ]}
          actions={
            <div className="flex items-center gap-2">
              {po && po.purchaseType !== 'Purchase Return' && po.status !== 'cancelled' && (
                <button
                  onClick={() => setShowReturnDialog(true)}
                  className="h-8 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                  title="Record Purchase Return"
                >
                  <RotateCcw size={13} /> Purchase Return
                </button>
              )}
              <button
                className="h-8 px-3 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                title="Print"
              >
                <Printer size={13} /> Print
              </button>
              <button
                onClick={() => navigate("/purchase-history")}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-650 rounded-lg hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
                title="Back to History"
              >
                <ArrowLeft size={14} />
              </button>
            </div>
          }
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex-none px-1 py-2">
        <div className="flex gap-2 p-1 bg-slate-100/50 w-fit rounded-lg border border-slate-200/50">
          {["Overview", "Items", "Returns"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeTab === i
                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                } ${i === 2 ? "flex items-center gap-1" : ""}`}
            >
              {i === 2 && <RotateCcw size={10} />}
              {tab}
              {i === 2 && returns.length > 0 && (
                <span className="ml-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {returns.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1 pb-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* TAB 0 — Overview */}
          {activeTab === 0 && (
            <div className="space-y-4">


              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Vendor Information */}
                  <SectionCard title="Vendor Information">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                      <DetailItem icon={Building2} label="Vendor Name" value={po.vendor} />
                      <DetailItem icon={FileText} label="Purchase Invoice" value={po.poNumber} />
                      {po.systemId && po.systemId !== po.poNumber && (
                        <DetailItem icon={FileText} label="System ID" value={po.systemId} />
                      )}
                      <DetailItem icon={Calendar} label="Date" value={po.date} />
                      <DetailItem icon={Clock} label="Time" value={po.time} />
                      <DetailItem icon={User} label="Purchase Type" value={po.purchaseType} />
                      {po.storage_location && (
                        <DetailItem icon={Building2} label="Storage Location" value={po.storage_location} />
                      )}
                    </div>
                  </SectionCard>

                  {/* Financial Summary */}
                  <SectionCard title="Financial Summary">
                    <div className="space-y-1">
                      <InfoRow
                        label="Subtotal"
                        value={fmt(subtotal)}
                      />

                      <InfoRow
                        label="GST"
                        value={
                          <span className="text-indigo-600 font-semibold">
                            +{fmt(totalGst)}
                          </span>
                        }
                      />

                      <InfoRow
                        label="Transport Charges"
                        value={
                          <span className="text-slate-600">
                            +{fmt(transportCharge)}
                          </span>
                        }
                      />

                      <InfoRow
                        label="Other Charges"
                        value={
                          <span className="text-slate-600">
                            +{fmt(otherCharge)}
                          </span>
                        }
                      />

                      <div className="mt-4 pt-4 border-t-2 border-slate-800 flex justify-between">
                        <span className="font-black">
                          Grand Total
                        </span>

                        <span className="text-xl font-black text-slate-900">
                          {fmt(grandTotal)}
                        </span>
                      </div>

                      {(transportCharge > 0 || otherCharge > 0) && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Additional Charges</p>
                          {transportCharge > 0 && <InfoRow label="Transport Charges" value={<span className="text-slate-600">+{fmt(transportCharge)}</span>} />}
                          {otherCharge > 0 && <InfoRow label="Other Charges" value={<span className="text-slate-600">+{fmt(otherCharge)}</span>} />}
                          <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Additional</span>
                            <span className="text-sm font-black text-slate-700 tabular-nums">+{fmt(po.additional_charges_total || 0)}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  </SectionCard>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-4">
                  <SectionCard title="Purchase Info">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Invoice No</span>
                        <span className="text-xs font-bold text-slate-700">{po.poNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Total Items</span>
                        <span className="text-xs font-bold text-slate-700">{po.totoalItems}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Origin</span>
                        <span className="text-xs font-bold text-slate-700">{po.purchaseType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Payment</span>
                        <span className="text-xs font-bold text-slate-700">{po.paymentMethod || "—"}</span>
                      </div>
                      {po.storage_location && (
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-100/50">
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Storage Location</span>
                          <span className="text-xs font-bold text-slate-700 uppercase">{po.storage_location}</span>
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard title="Payment Summary">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100/50">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Status</span>
                        {outstanding && outstanding > 0 ? (
                          po.paid_amount === 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--pay-pending-bg)] text-[var(--pay-pending-tx)] border border-[var(--pay-pending-bd)]">Pending</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--pay-partial-bg)] text-[var(--pay-partial-tx)] border border-[var(--pay-partial-bd)]">Partially Paid</span>
                          )
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--pay-paid-bg)] text-[var(--pay-paid-tx)] border border-[var(--pay-paid-bd)]">Paid</span>
                        )}
                      </div>
                      {po.paid_amount !== undefined && (
                        <div className="flex justify-between items-center text-sm font-semibold text-slate-600 pt-1">
                          <span>Paid Amount</span>
                          <span className="tabular-nums text-slate-800">{fmt(po.paid_amount)}</span>
                        </div>
                      )}
                      {po.outstanding !== undefined && (
                        <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-100">
                          <span className="text-slate-600">Outstanding</span>
                          <span className={`tabular-nums ${po.outstanding > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                            {fmt(outstanding)}
                          </span>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1 — Items */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <SectionCard title="Products Received" className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Product Details</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Qty</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Stock In/Out</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Stock After</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Unit Price</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {po.products.map((product, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-indigo-50 border-indigo-100 overflow-hidden">
                                {(() => {
                                  const imgUrl = (product as any).image_url || (product as any).image || (product as any).product?.image_url || (product as any).product?.image || (product as any).datas?.image_url || (product as any).datas?.image;
                                  const singleUrl = Array.isArray(imgUrl) ? imgUrl[0] : imgUrl;
                                  return typeof singleUrl === "string" && singleUrl ? (
                                    <img src={singleUrl} alt={product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package size={16} className="text-indigo-500" />
                                  );
                                })()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{product.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {product.barcode && (
                                    <span className="text-[10px] font-mono font-bold text-slate-400">{product.barcode}</span>
                                  )}
                                  {product.gst !== undefined && product.gst > 0 && (
                                    <span className="text-[9px] font-extrabold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wider font-sans">
                                      GST {product.gst}%
                                    </span>
                                  )}
                                  {product.category && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-slate-100 text-slate-500">
                                      {product.category}
                                    </span>
                                  )}
                                </div>

                                {/* Flat Format (PurchaseReadModel) Batches & Serials */}
                                {product.variant && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-100 space-y-2.5">
                                    <p className="text-[10px] font-extrabold text-[var(--at-variant-tx)] bg-[var(--at-variant-bg)] border border-[var(--at-variant-bd)] px-1.5 py-0.5 rounded-xl w-fit">• {product.variant.variant_name}</p>
                                  </div>
                                )}

                                {product.batch && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md text-[10px] text-slate-650 shadow-sm">
                                      <div className="flex justify-between items-center font-bold">
                                        <span className="text-slate-800">Batch: {product.batch.batch_name || "Default"}</span>
                                        <span className="text-indigo-600">Qty: {product.stocks_added ?? product.received_stocks ?? 0}</span>
                                      </div>
                                      {(product.batch.mfg_date || product.batch.exp_date) && (
                                        <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                                          {product.batch.mfg_date && <span>MFG: {formatBatchDate(product.batch.mfg_date)}</span>}
                                          {product.batch.exp_date && <span>EXP: {formatBatchDate(product.batch.exp_date)}</span>}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {product.serial_info && product.serial_info.serial_numbers && product.serial_info.serial_numbers.length > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
                                      <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serial Numbers:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {product.serial_info.serial_numbers.map((sn: any) => (
                                          <span key={typeof sn === 'object' ? ((sn as any).id || (sn as any).name) : sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{typeof sn === 'object' ? ((sn as any).name || (sn as any).id) : sn}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Old Nested Format Variant-Level Batches & Serials */}
                                {(product.variants?.length ?? 0) > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-100 space-y-2.5">
                                    {product.variants?.map((v, vIdx) => (
                                      <div key={vIdx} className="space-y-1">
                                        <p className="text-[10px] font-extrabold text-[var(--at-variant-tx)] bg-[var(--at-variant-bg)] border border-[var(--at-variant-bd)] px-1.5 py-0.5 rounded-xl w-fit">• {v.name} {v.buy_price !== undefined ? `(Buy: ${fmt(v.buy_price)})` : ""}</p>

                                        {/* Variant Batches */}
                                        {v.batches && v.batches.length > 0 && (
                                          <div className="space-y-1 pl-2">
                                            {v.batches.map((b, bIdx) => (
                                              <div key={bIdx} className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md text-[10px] text-slate-600 shadow-sm">
                                                <div className="flex justify-between items-center font-bold">
                                                  <span className="text-slate-800">Batch: {b.name || "Default"}</span>
                                                  <span className="text-indigo-600">Qty: {b.stocks}</span>
                                                </div>
                                                {(b.manufacturing_date || b.expiry_date) && (
                                                  <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                                                    {b.manufacturing_date && <span>MFG: {formatBatchDate(b.manufacturing_date)}</span>}
                                                    {b.expiry_date && <span>EXP: {formatBatchDate(b.expiry_date)}</span>}
                                                  </div>
                                                )}
                                                {b.serial_numbers && b.serial_numbers.length > 0 && (
                                                  <div className="mt-1.5">
                                                    <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serials:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                      {b.serial_numbers.map(sn => (
                                                        <span key={typeof sn === 'object' ? ((sn as any).id || (sn as any).name) : sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{typeof sn === 'object' ? ((sn as any).name || (sn as any).id) : sn}</span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Variant-level Serials (if no batches) */}
                                        {(!v.batches || v.batches.length === 0) && v.serials && v.serials.length > 0 && (
                                          <div className="pl-2 space-y-1">
                                            {v.serials.map((sObj, sIdx) => (
                                              <div key={sIdx} className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
                                                <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serial Numbers:</p>
                                                <div className="flex flex-wrap gap-1">
                                                  {sObj.serial_numbers?.map(sn => (
                                                    <span key={typeof sn === 'object' ? ((sn as any).id || (sn as any).name) : sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{typeof sn === 'object' ? ((sn as any).name || (sn as any).id) : sn}</span>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Top-Level (No Variant) Batches */}
                                {(!product.variants || product.variants.length === 0) && product.batches && product.batches.length > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                    {product.batches.map((b, bIdx) => (
                                      <div key={bIdx} className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md text-[10px] text-slate-650 shadow-sm">
                                        <div className="flex justify-between items-center font-bold">
                                          <span className="text-slate-800">Batch: {b.name || "Default"}</span>
                                          <span className="text-indigo-600">Qty: {b.stocks}</span>
                                        </div>
                                        {(b.manufacturing_date || b.expiry_date) && (
                                          <div className="flex gap-3 text-[9px] text-slate-400 mt-1 font-medium">
                                            {b.manufacturing_date && <span>MFG: {formatBatchDate(b.manufacturing_date)}</span>}
                                            {b.expiry_date && <span>EXP: {formatBatchDate(b.expiry_date)}</span>}
                                          </div>
                                        )}
                                        {b.serial_numbers && b.serial_numbers.length > 0 && (
                                          <div className="mt-1.5">
                                            <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serials:</p>
                                            <div className="flex flex-wrap gap-1">
                                              {b.serial_numbers.map(sn => (
                                                <span key={typeof sn === 'object' ? ((sn as any).id || (sn as any).name) : sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{typeof sn === 'object' ? ((sn as any).name || (sn as any).id) : sn}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Top-Level (No Variant) Serials */}
                                {(!product.variants || product.variants.length === 0) && product.serials && product.serials.length > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-indigo-150 space-y-1.5">
                                    {product.serials.map((sObj, sIdx) => (
                                      <div key={sIdx} className="bg-slate-50 p-2 rounded border border-slate-100 max-w-md shadow-sm">
                                        <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Serial Numbers:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {sObj.serial_numbers?.map(sn => (
                                            <span key={typeof sn === 'object' ? ((sn as any).id || (sn as any).name) : sn} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-slate-200 shadow-sm">{typeof sn === 'object' ? ((sn as any).name || (sn as any).id) : sn}</span>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-black text-slate-600">{product.quantity}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-xs font-bold text-green-600">
                              +{product.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-xs font-black text-blue-600">
                              {product.stocks_before !== undefined && product.stocks_before !== null ? (product.stocks_before + product.quantity) : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {product.buy_price !== undefined ? (
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-slate-800 tabular-nums">{fmt(product.buy_price)}</span>
                                {product.gst !== undefined && product.gst > 0 && (
                                  <span className="text-[9px] text-indigo-600 font-semibold mt-0.5 whitespace-nowrap">
                                    ₹{(product.buy_price * (1 + product.gst / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} incl. {product.gst}% GST
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {product.buy_price !== undefined ? (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-slate-800 tabular-nums">{fmt(product.buy_price * product.quantity)}</span>
                                {product.gst !== undefined && product.gst > 0 && (
                                  <span className="text-[9px] text-indigo-600 font-semibold mt-0.5 whitespace-nowrap">
                                    ₹{((product.buy_price * product.quantity) * (1 + product.gst / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} incl. GST
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {/* TAB 2 — Returns */}
          {activeTab === 2 && (
            <div className="space-y-4">
              <SectionCard
                title="Purchase Returns"
                className="p-0 overflow-hidden"
              >
                {returnsLoading ? (
                  <div className="p-8 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                  </div>
                ) : returns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                      <CornerDownLeft size={24} className="text-rose-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">No returns recorded</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      When a purchase return is recorded, it will appear here.
                    </p>
                    {po && po.purchaseType !== 'Purchase Return' && po.status !== 'cancelled' && (
                      <button
                        onClick={() => setShowReturnDialog(true)}
                        className="mt-5 px-4 h-8 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <RotateCcw size={12} /> Record a Return
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Return ID</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Date</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Items</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Reason</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">GST Amount</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Return Value</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Adjusted</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Cash Refund</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {returns.map((ret: any, idx: number) => {
                          const retDate = ret.created_at || ret.updated_at || ret.date || ret.return_date || po?.date;
                          const formattedDate = retDate
                            ? new Date(retDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "—";
                          const payInfo = ret.payment_infos || {};
                          const returnValue = Number(payInfo.return_value ?? ret.total_refund_amount ?? ret.return_value ?? 0);
                          const gstAmount = Number(ret.total_gst_amount ?? 0);
                          const adjusted = Number(payInfo.adjusted_against_outstanding ?? ret.adjusted_amount ?? 0);
                          const cashRefund = Number(payInfo.cash_refund ?? ret.cash_refund ?? ret.total_refund_amount ?? 0);
                          const reason = payInfo.reason || ret.reason || "—";
                          const status = ret.status || "—";
                          const itemCount = Array.isArray(ret.items) ? ret.items.length : (ret.total_refund_qty ?? ret.total_items ?? "—");
                          const retId = ret.ui_id || ret.sequence_id || ret.return_id || ret.id || `PRET-${idx + 1}`;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4">
                                <span className="text-xs font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                  {retId}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                  {status}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="text-xs font-semibold text-slate-600">{formattedDate}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="text-xs font-bold text-slate-700">{itemCount} item(s)</span>
                                {Array.isArray(ret.items) && ret.items.length > 0 && (
                                  <div className="mt-0.5 space-y-0.5">
                                    {ret.items.slice(0, 3).map((item: any, iIdx: number) => (
                                      <p key={iIdx} className="text-[10px] text-slate-400 font-medium">
                                        {item.inventory_name || item.name || "Item"} × {item.entered_qty || item.quantity || item.returned_qty || "?"} {item.entered_unit || ""}
                                      </p>
                                    ))}
                                    {ret.items.length > 3 && (
                                      <p className="text-[10px] text-slate-300">+{ret.items.length - 3} more</p>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <span className="text-xs text-slate-600 font-medium">{reason}</span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className="text-xs font-black text-indigo-700 tabular-nums">{fmt(gstAmount)}</span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className="text-xs font-black text-rose-700 tabular-nums">{fmt(returnValue)}</span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {adjusted > 0 ? (
                                  <span className="text-xs font-bold text-amber-600 tabular-nums">{fmt(adjusted)}</span>
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {cashRefund > 0 ? (
                                  <span className="text-xs font-bold text-emerald-600 tabular-nums">{fmt(cashRefund)}</span>
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          )}

        </div>
      </div>

      {/* Purchase Return Dialog */}
      <PurchaseReturnDialog
        isOpen={showReturnDialog}
        onClose={() => setShowReturnDialog(false)}
        onSuccess={() => {
          if (id) hasRefreshedReturnsRef.current[id] = false;
          fetchPo();
          setActiveTab(2);
          setTimeout(() => {
            fetchPo();
          }, 800);
        }}
        purchaseId={po.id}
        shopId={SHOP_ID}
        outstanding={outstanding}
      />

    </div>
  );
};

export default PurchaseDetail;

