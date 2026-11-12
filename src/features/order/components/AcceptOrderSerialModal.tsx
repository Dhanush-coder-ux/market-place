import React, { useEffect, useMemo, useState } from "react";
import { X, Search, CheckCircle2, AlertTriangle, Hash, Loader2 } from "lucide-react";

export interface SerialCandidate {
  id: string;
  name: string;
  status?: string;
}

export interface SerialAssignmentItemInput {
  key: string;
  orderItemId?: string;
  productId: string;
  variantId?: string;
  batchId?: string;
  name: string;
  variantLabel?: string;
  quantity: number;
  availableSerials: SerialCandidate[];
}

export interface SerialAssignmentPayloadItem {
  order_item_id?: string;
  product_id: string;
  variant_id?: string;
  batch_id?: string;
  serialno_infos: Array<{ id: string; name: string }>;
}

interface AcceptOrderSerialModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderLabel: string;
  customerName?: string;
  items: SerialAssignmentItemInput[];
  submitting?: boolean;
  errorMsg?: string | null;
  onConfirm: (assignments: SerialAssignmentPayloadItem[]) => Promise<void> | void;
}

export const AcceptOrderSerialModal: React.FC<AcceptOrderSerialModalProps> = ({
  isOpen,
  onClose,
  orderLabel,
  customerName,
  items,
  submitting = false,
  errorMsg,
  onConfirm,
}) => {
  const [selectedByKey, setSelectedByKey] = useState<Record<string, SerialCandidate[]>>({});
  const [searchByKey, setSearchByKey] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setSelectedByKey({});
      setSearchByKey({});
    }
  }, [isOpen, orderLabel, items]);

  // Track all serial IDs currently assigned to any item row so the same serial cannot be picked twice
  const allSelectedIds = useMemo(() => {
    const map = new Map<string, string>();
    for (const [rowKey, list] of Object.entries(selectedByKey)) {
      for (const sn of list) {
        map.set(sn.id, rowKey);
      }
    }
    return map;
  }, [selectedByKey]);

  const allItemsComplete = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => {
      const picked = selectedByKey[item.key] || [];
      return picked.length === item.quantity;
    });
  }, [items, selectedByKey]);

  if (!isOpen) return null;

  const toggleSerial = (item: SerialAssignmentItemInput, candidate: SerialCandidate) => {
    if (submitting) return;
    setSelectedByKey((prev) => {
      const current = prev[item.key] || [];
      const exists = current.some((s) => s.id === candidate.id);
      if (exists) {
        return {
          ...prev,
          [item.key]: current.filter((s) => s.id !== candidate.id),
        };
      }
      if (current.length >= item.quantity) {
        return prev;
      }
      const ownerKey = allSelectedIds.get(candidate.id);
      if (ownerKey && ownerKey !== item.key) {
        return prev;
      }
      return {
        ...prev,
        [item.key]: [...current, candidate],
      };
    });
  };

  const handleScanEnter = (item: SerialAssignmentItemInput, query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) return;
    const exactMatch = item.availableSerials.find(
      (s) => s.name.trim().toLowerCase() === clean || s.id.trim().toLowerCase() === clean
    );
    if (exactMatch) {
      const current = selectedByKey[item.key] || [];
      const alreadyPicked = current.some((s) => s.id === exactMatch.id);
      const ownerKey = allSelectedIds.get(exactMatch.id);
      if (!alreadyPicked && (!ownerKey || ownerKey === item.key) && current.length < item.quantity) {
        toggleSerial(item, exactMatch);
        setSearchByKey((prev) => ({ ...prev, [item.key]: "" }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!allItemsComplete || submitting) return;
    const payload: SerialAssignmentPayloadItem[] = items.map((item) => {
      const picked = selectedByKey[item.key] || [];
      return {
        ...(item.orderItemId ? { order_item_id: item.orderItemId } : {}),
        product_id: item.productId,
        ...(item.variantId ? { variant_id: item.variantId } : {}),
        ...(item.batchId ? { batch_id: item.batchId } : {}),
        serialno_infos: picked.map((s) => ({ id: s.id, name: s.name })),
      };
    });
    await onConfirm(payload);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-0 sm:p-4">
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92dvh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accept-serial-modal-title"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-white shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Hash size={15} strokeWidth={2.5} />
              </span>
              <h2 id="accept-serial-modal-title" className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Assign Serial Numbers
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Order <span className="font-semibold text-slate-700">#{orderLabel}</span>
              {customerName ? ` • ${customerName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 bg-slate-50/50">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {items.map((item) => {
            const picked = selectedByKey[item.key] || [];
            const query = searchByKey[item.key] || "";
            const qLower = query.trim().toLowerCase();
            const filteredSerials = item.availableSerials.filter((s) =>
              !qLower || s.name.toLowerCase().includes(qLower)
            );
            const isComplete = picked.length === item.quantity;
            const insufficientStock = item.availableSerials.length < item.quantity;

            return (
              <div
                key={item.key}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 break-words">
                      {item.name}
                    </h3>
                    {item.variantLabel && (
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {item.variantLabel}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                      isComplete
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isComplete && <CheckCircle2 size={12} />}
                    {picked.length} / {item.quantity}
                  </span>
                </div>

                {insufficientStock && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>
                      Only {item.availableSerials.length} available serial(s) found in inventory, but order requires {item.quantity}.
                    </span>
                  </div>
                )}

                {/* Search / Scan Input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) =>
                      setSearchByKey((prev) => ({ ...prev, [item.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleScanEnter(item, query);
                      }
                    }}
                    placeholder="Search or scan serial number..."
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                  />
                </div>

                {/* Available Serial Pills */}
                {filteredSerials.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
                    {filteredSerials.map((sn) => {
                      const isSelectedHere = picked.some((p) => p.id === sn.id);
                      const ownerKey = allSelectedIds.get(sn.id);
                      const isUsedElsewhere = Boolean(ownerKey && ownerKey !== item.key);
                      const isLimitReached = !isSelectedHere && picked.length >= item.quantity;
                      const isDisabled = submitting || isUsedElsewhere || isLimitReached;

                      return (
                        <button
                          key={sn.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => toggleSerial(item, sn)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all active:scale-95 ${
                            isSelectedHere
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : isUsedElsewhere
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through"
                                : isLimitReached
                                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                          }`}
                        >
                          <span>{sn.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    {item.availableSerials.length === 0
                      ? "No available serial numbers in stock."
                      : "No serial numbers match your search."}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-slate-100 bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allItemsComplete || submitting}
            className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? "Accepting..." : "Confirm & Accept Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptOrderSerialModal;

