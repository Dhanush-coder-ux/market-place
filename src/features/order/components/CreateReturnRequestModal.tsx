import React, { useState } from "react";
import { X, RotateCcw, AlertCircle, Check, Package } from "lucide-react";
import { orderApi } from "@/services/api/order";

interface CreateReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any; // OrderDetailType or OrderRecord
  shopId: string;
  onSubmitted?: () => void;
}

export const CreateReturnRequestModal: React.FC<CreateReturnRequestModalProps> = ({
  isOpen,
  onClose,
  order,
  shopId,
  onSubmitted,
}) => {
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; qty: number; reason: string }>>({});
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const isCancelledOrder = ["CANCELED", "CANCELLED", "REFUNDED", "REJECTED"].includes(
    String(order.status || "").trim().toUpperCase()
  );

  const rawItems: any[] = Array.isArray(order.items) ? order.items : [];

  const handleToggleItem = (itemId: string, defaultQty: number) => {
    setSelectedItems((prev) => {
      const current = prev[itemId];
      if (current?.selected) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          selected: true,
          qty: current?.qty ?? (defaultQty > 0 ? defaultQty : 1),
          reason: current?.reason ?? "",
        },
      };
    });
  };

  const handleQtyChange = (itemId: string, newQty: number, maxQty: number) => {
    const clamped = Math.max(0.1, Math.min(newQty, maxQty));
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        qty: clamped,
      },
    }));
  };

  const selectedCount = Object.values(selectedItems).filter((i) => i.selected).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isCancelledOrder) {
      setError("Return requests cannot be submitted for cancelled or rejected orders.");
      return;
    }

    if (selectedCount === 0) {
      setError("Please select at least one item from this order to return.");
      return;
    }

    if (!description.trim()) {
      setError("Please provide a detailed description explaining the return reason.");
      return;
    }

    try {
      setLoading(true);
      const chosenItemsPayload = Object.entries(selectedItems)
        .filter(([_, val]) => val.selected)
        .map(([key, val]) => {
          const itemObj = rawItems.find((i: any) => (i.id || i.order_item_id || i.product_id) === key);
          return {
            order_item_id: itemObj?.id || itemObj?.order_item_id || key,
            product_id: itemObj?.product_id || key,
            quantity: val.qty,
            reason: val.reason || description.trim(),
            unit: itemObj?.unit || itemObj?.entered_unit || "",
          };
        });

      const payload = {
        order_id: order.id,
        shop_id: order.shop_id || shopId,
        items: chosenItemsPayload,
        description: description.trim(),
        customer_name: order.customerName || order.customer_name || "Customer",
        customer_phone: order.phone || order.customer_phone || "",
      };

      await orderApi.createReturnRequest(payload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSubmitted?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Failed to submit return request", err);
      const msg = err?.response?.data?.detail || err?.message || "Failed to submit return request.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center">
              <RotateCcw size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Submit Return Request</h3>
              <p className="text-xs text-slate-500">Order: {order.billNo || order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {isCancelledOrder ? (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Return Request Not Allowed</p>
                <p className="text-xs text-red-600 mt-1">
                  This order has status {String(order.status || "CANCELED").toUpperCase()}. Cancelled orders cannot have return requests submitted.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <Check size={16} className="shrink-0" strokeWidth={2.5} />
              <span>Return request submitted successfully!</span>
            </div>
          )}

          {/* Item Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <Package size={14} />
              Choose Items to Return ({selectedCount} selected)
            </label>

            {rawItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No items found on this order.</p>
            ) : (
              <div className="space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {rawItems.map((item: any, idx: number) => {
                  const key = String(item.id || item.order_item_id || item.product_id || idx);
                  const isChecked = !!selectedItems[key]?.selected;
                  const itemQty = Number(item.qty ?? item.quantity ?? 1);
                  const currentReturnQty = selectedItems[key]?.qty ?? itemQty;
                  const itemPrice = Number(item.inclusivePrice ?? item.price ?? item.sell_price ?? 0);

                  return (
                    <div
                      key={key}
                      onClick={() => handleToggleItem(key, itemQty)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-blue-50/60 border-blue-300 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleItem(key, itemQty)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {item.name || item.product_name || `Item ${idx + 1}`}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Ordered: {itemQty} {item.unit || ""} • Price: ₹{itemPrice.toFixed(2)}
                          </p>
                        </div>

                        {isChecked && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded border border-blue-200"
                          >
                            <span className="text-[11px] text-slate-500 font-medium">Return Qty:</span>
                            <input
                              type="number"
                              min="0.1"
                              max={itemQty}
                              step="1"
                              value={currentReturnQty}
                              onChange={(e) => handleQtyChange(key, parseFloat(e.target.value) || 1, itemQty)}
                              className="w-14 text-center text-xs font-bold border border-slate-200 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Detailed Return Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete details about why the customer is requesting a return (e.g. damaged goods, defective batch, incorrect item received)..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedCount === 0 || !description.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
            >
              <RotateCcw size={14} strokeWidth={2.5} />
              {loading ? "Submitting..." : "Submit Return Request"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default CreateReturnRequestModal;

