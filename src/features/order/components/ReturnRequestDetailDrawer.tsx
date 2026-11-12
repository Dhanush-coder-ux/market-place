import React, { useState, useEffect } from "react";
import {
  X, Check, AlertCircle, Clock, RotateCcw, Package,
  User, Phone, Mail, FileText, ChevronRight, AlertTriangle, Loader2
} from "lucide-react";
import Drawer from "@/components/common/Drawer";
import type { ReturnRequestRecord } from "../types";
import { orderApi } from "@/services/api/order";

interface ReturnRequestDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request: ReturnRequestRecord | null;
  shopId: string;
  onStatusUpdated: () => void;
  onViewOrder?: (orderId: string) => void;
}

export const ReturnRequestDetailDrawer: React.FC<ReturnRequestDetailDrawerProps> = ({
  isOpen,
  onClose,
  request,
  shopId,
  onStatusUpdated,
  onViewOrder,
}) => {
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "ACCEPTED" | "REJECTED";
  }>({ open: false, type: "ACCEPTED" });

  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Original order details fetched for context
  const [originalOrder, setOriginalOrder] = useState<any | null>(null);

  useEffect(() => {
    if (request && isOpen) {
      setAdminNotes(request.admin_notes || "");
      setActionError(null);
      setConfirmModal({ open: false, type: "ACCEPTED" });

      if (request.order_id && shopId) {
        orderApi.getOrderById(shopId, request.order_id)
          .then((res: any) => {
            const ord = Array.isArray(res?.data)
              ? res.data[0]
              : (Array.isArray(res?.data?.datas) ? res.data.datas[0] : res?.data);
            setOriginalOrder(ord || null);
          })
          .catch((err) => {
            console.warn("Could not fetch original order detail:", err);
            setOriginalOrder(null);
          });
      }
    } else {
      setOriginalOrder(null);
    }
  }, [request, isOpen, shopId]);

  if (!request) return null;

  const status = (request.status || "PENDING").toUpperCase();
  const isPending = status === "PENDING";
  const isAccepted = status === "ACCEPTED";
  const isRejected = status === "REJECTED";

  const totalRefundAmount = (request.items || []).reduce(
    (acc, itm) => acc + (Number(itm.total_amount) || (Number(itm.price || 0) * Number(itm.quantity || 1))),
    0
  );

  const formattedDate = request.created_at
    ? new Date(request.created_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const handleOpenConfirm = (type: "ACCEPTED" | "REJECTED") => {
    setActionError(null);
    setAdminNotes(type === "ACCEPTED" ? "Return request approved." : "");
    setConfirmModal({ open: true, type });
  };

  const handleConfirmSubmit = async () => {
    if (confirmModal.type === "REJECTED" && !adminNotes.trim()) {
      setActionError("Please provide an explanation reason for rejecting this return request.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      await orderApi.updateReturnRequestStatus(request.id, {
        status: confirmModal.type,
        admin_notes: adminNotes.trim(),
      });

      setConfirmModal({ open: false, type: "ACCEPTED" });
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      setActionError(err?.message || "Failed to update return request status. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isAccepted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check size={12} strokeWidth={2.5} />
          Accepted
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          <X size={12} strokeWidth={2.5} />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={12} strokeWidth={2.5} />
        Pending Review
      </span>
    );
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Return Request #${request.id.slice(0, 8).toUpperCase()}`}
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans text-slate-800">
          {/* Status & ID Summary */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Status</span>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Submitted On</span>
              <span className="text-xs font-bold text-slate-700 mt-1 block">{formattedDate}</span>
            </div>
          </div>

          {/* Seller / Admin Notes (if present) */}
          {request.admin_notes && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
                Merchant Note / Decision Feedback:
              </span>
              <p className="text-sm text-blue-800 leading-relaxed">{request.admin_notes}</p>
            </div>
          )}

          {/* Customer Details */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User size={15} className="text-slate-500" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Name</span>
                <span className="font-semibold text-slate-800">{request.customer_name || "Customer"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone size={11} /> Phone
                </span>
                <span className="font-semibold text-slate-800">{request.customer_phone || "—"}</span>
              </div>
              {request.customer_email && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail size={11} /> Email
                  </span>
                  <span className="font-semibold text-slate-800">{request.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package size={15} className="text-slate-500" />
                Original Order
              </h3>
              {onViewOrder && (
                <button
                  type="button"
                  onClick={() => onViewOrder(request.order_id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  View Order <ChevronRight size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-sm pt-1">
              <div>
                <span className="text-xs text-slate-500 block">Bill / Order ID</span>
                <span className="font-bold text-slate-800">#{request.order_ui_id || request.order_id}</span>
              </div>
              {originalOrder?.status && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Order Status</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {originalOrder.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Return Items Breakdown */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <RotateCcw size={15} className="text-slate-500" />
              Requested Return Items ({request.items?.length || 0})
            </h3>
            <div className="divide-y divide-slate-100">
              {(request.items || []).map((itm, idx) => (
                <div key={idx} className="py-3 first:pt-1 last:pb-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{itm.product_name || "Product Item"}</h4>
                      {itm.variant_name && (
                        <span className="text-xs text-slate-500 block">{itm.variant_name}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      ₹{((Number(itm.price) || 0) * (Number(itm.quantity) || 1)).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                      Return Qty: <b>{itm.quantity}</b> {itm.unit || ""}
                    </span>
                    <span>Rate: ₹{Number(itm.price || 0).toFixed(2)}</span>
                  </div>

                  {itm.reason && (
                    <div className="text-xs text-amber-800 bg-amber-50/60 border border-amber-200/60 px-2.5 py-1 rounded-md">
                      Reason: <span className="font-medium">{itm.reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Total Return / Refund Value</span>
              <span className="text-base font-extrabold text-slate-900">₹{totalRefundAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Description */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={15} className="text-slate-500" />
              Customer Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {request.description || "No description provided."}
            </p>
          </div>

          {/* Status History */}
          {request.status_history && request.status_history.length > 0 && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock size={15} className="text-slate-500" />
                Audit Trail / History
              </h3>
              <div className="space-y-2 text-xs">
                {request.status_history.map((hist, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                    <div>
                      <span className="font-bold text-slate-800">{hist.status}</span> by{" "}
                      <span className="font-medium text-slate-700">{hist.updated_by}</span>
                      {hist.notes && <span className="text-slate-500 block">"{hist.notes}"</span>}
                      {hist.timestamp && (
                        <span className="text-[11px] text-slate-400 block">
                          {new Date(hist.timestamp).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Only if PENDING) */}
        {isPending && (
          <div className="p-4 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-slate-200 bg-white flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenConfirm("REJECTED")}
              className="flex-1 px-4 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <X size={16} strokeWidth={2.5} />
              Reject Return
            </button>
            <button
              type="button"
              onClick={() => handleOpenConfirm("ACCEPTED")}
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check size={16} strokeWidth={2.5} />
              Accept Return
            </button>
          </div>
        )}
      </Drawer>

      {/* Confirmation & Seller Notes Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmModal.type === "ACCEPTED"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {confirmModal.type === "ACCEPTED" ? <Check size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {confirmModal.type === "ACCEPTED" ? "Accept Return Request?" : "Reject Return Request?"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {confirmModal.type === "ACCEPTED"
                    ? `You are about to accept the return request for order #${request.order_ui_id || request.order_id}.`
                    : `Please provide an explanation for rejecting this return request.`}
                </p>
              </div>
            </div>

            {actionError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="mt-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                {confirmModal.type === "ACCEPTED" ? "Seller Notes (Optional)" : "Rejection Reason (Required)"}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  confirmModal.type === "ACCEPTED"
                    ? "e.g. Return request approved. Please ship items back..."
                    : "e.g. The item return window has expired / packaging damaged..."
                }
                rows={3}
                className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmModal({ open: false, type: "ACCEPTED" })}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmSubmit}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2 transition-all ${
                  confirmModal.type === "ACCEPTED"
                    ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400"
                    : "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                }`}
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                {confirmModal.type === "ACCEPTED" ? "Confirm Accept" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
