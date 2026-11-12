import React, { useState } from "react";
import {
  User, Phone, Package, RotateCcw, Check, X,
  Clock, IndianRupee, MessageSquareQuote, ArrowRight, AlertCircle
} from "lucide-react";
import type { ReturnRequestRecord } from "../types";

interface ReturnRequestCardProps {
  request: ReturnRequestRecord;
  onStatusChange: (requestId: string, newStatus: "ACCEPTED" | "REJECTED", notes?: string) => Promise<void>;
  onViewOrder?: (orderId: string) => void;
  viewMode?: "grid" | "list";
}

export const ReturnRequestCard: React.FC<ReturnRequestCardProps> = ({
  request,
  onStatusChange,
  onViewOrder,
  viewMode = "list"
}) => {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const status = (request.status || "PENDING").toUpperCase();
  const isPending = status === "PENDING";
  const isAccepted = status === "ACCEPTED";
  const isRejected = status === "REJECTED";

  const totalRefundAmount = (request.items || []).reduce(
    (acc, itm) => acc + (Number(itm.total_amount) || (Number(itm.price || 0) * Number(itm.quantity || 1))),
    0
  );

  const totalItemsCount = (request.items || []).reduce(
    (acc, itm) => acc + (Number(itm.quantity) || 1),
    0
  );

  const handleAction = async (newStatus: "ACCEPTED" | "REJECTED", notes?: string) => {
    try {
      setLoading(true);
      await onStatusChange(request.id, newStatus, notes);
    } finally {
      setLoading(false);
      setShowRejectModal(false);
    }
  };

  const getStatusBadge = () => {
    if (isAccepted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
          <Check size={12} strokeWidth={2.5} />
          Return Accepted
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-sm">
          <X size={12} strokeWidth={2.5} />
          Return Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm animate-pulse">
        <Clock size={12} strokeWidth={2.5} />
        Return Requested
      </span>
    );
  };

  const formattedDate = request.created_at
    ? new Date(request.created_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

  const isGrid = viewMode === "grid";

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 font-sans overflow-hidden flex flex-col justify-between ${isGrid ? "h-full" : ""}`}>
      {/* Top Header Bar */}
      <div className="bg-slate-50/70 border-b border-slate-100 px-4 sm:px-5 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <RotateCcw size={15} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order</span>
              <span className="text-sm font-bold text-slate-800">{request.order_ui_id || request.order_id}</span>
            </div>
            {formattedDate && (
              <p className="text-[11px] text-slate-400">{formattedDate}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <div className="flex items-baseline gap-0.5 pl-2 border-l border-slate-200">
            <span className="text-xs text-slate-400 mr-1">Refund Val:</span>
            <IndianRupee size={13} className="text-slate-800" strokeWidth={2} />
            <span className="text-base font-bold text-slate-800">
              {totalRefundAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Customer & Order Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <User size={14} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Customer</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{request.customer_name || "Customer"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <Phone size={14} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Contact</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{request.customer_phone || "—"}</p>
            </div>
          </div>
        </div>

        {/* Chosen Items Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Package size={13} strokeWidth={2} />
              Chosen Items for Return ({totalItemsCount})
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-lg border border-slate-200/80 divide-y divide-slate-100">
            {(request.items || []).map((itm, idx) => (
              <div key={idx} className="p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 text-xs">
                <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                  <p className="font-semibold text-slate-800 break-words sm:truncate">
                    {itm.product_name}
                    {itm.variant_name ? ` (${itm.variant_name})` : ""}
                  </p>
                  {itm.reason && itm.reason !== request.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 break-words sm:truncate italic">Note: {itm.reason}</p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0 w-full sm:w-auto flex sm:block items-center justify-between">
                  <div className="font-medium text-slate-600">
                    Qty: <span className="font-bold text-slate-800">{itm.quantity}</span> {itm.unit || ""}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    ₹{Number(itm.price || 0).toFixed(2)} ea • Total: ₹{Number(itm.total_amount || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Detailed Description */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <MessageSquareQuote size={13} strokeWidth={2} />
            Customer Description
          </p>
          <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200/80 text-xs text-slate-700 leading-relaxed font-normal">
            {request.description}
          </div>
        </div>

        {/* Admin Notes if any */}
        {request.admin_notes && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Admin Remarks:</span> {request.admin_notes}
          </div>
        )}

        {/* Status Changing Options: Accept & Reject */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {onViewOrder && (
              <button
                type="button"
                onClick={() => onViewOrder(request.order_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                View Order Details
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isPending && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowRejectModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <X size={14} strokeWidth={2.5} />
                  Reject
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleAction("ACCEPTED")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Check size={14} strokeWidth={2.5} />
                  Accept
                </button>
              </>
            )}

            {!isPending && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Change Status:</span>
                {isRejected && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleAction("ACCEPTED")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <Check size={12} strokeWidth={2.5} />
                    Change to Accept
                  </button>
                )}
                {isAccepted && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white transition-all"
                  >
                    <X size={12} strokeWidth={2.5} />
                    Change to Reject
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Remarks Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-5 w-full max-w-md max-h-[90dvh] overflow-y-auto space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertCircle size={20} strokeWidth={2.5} />
              <h3 className="text-base font-bold text-slate-800">Reject Return Request</h3>
            </div>
            <p className="text-xs text-slate-500">
              Provide a reason or note explaining why this return request is being rejected. This will be recorded in the status audit log.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g. Item packaging was unsealed, perishable goods policy, or invalid claim."
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction("REJECTED", rejectReason)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnRequestCard;

