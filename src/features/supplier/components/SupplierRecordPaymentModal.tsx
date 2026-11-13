import { useState, useEffect, useCallback } from "react";
import { Banknote, CreditCard, QrCode, Building2, Search } from "lucide-react";
import { Modal } from "@/components/common/SuperUI";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { useToast } from "@/context/ToastContext";
import { SHOP_ID, ENDPOINTS } from "@/services/endpoints";
import { useApi } from "@/context/ApiContext";

export interface SupplierRecordPaymentModalProps {
  show: boolean;
  onClose: () => void;
  supplierId?: string;
  supplierName?: string;
  initialPurchaseId?: string;
  initialPurchase?: any;
  onSuccess?: () => void;
}

export function SupplierRecordPaymentModal({
  show,
  onClose,
  supplierId,
  supplierName,
  initialPurchaseId,
  initialPurchase,
  onSuccess,
}: SupplierRecordPaymentModalProps) {
  const { supplier: supplierApi, purchase: purchaseApi } = useBusinessApi();
  const { getData } = useApi();
  const { showToast } = useToast();

  const [resolvedSupplierId, setResolvedSupplierId] = useState<string>(supplierId || "");
  const [resolvedSupplierName, setResolvedSupplierName] = useState<string>(supplierName || "");
  const [clearPurchases, setClearPurchases] = useState<any[]>([]);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearSearch, setClearSearch] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [clearAmount, setClearAmount] = useState<string>("");
  const [clearPaymentMethod, setClearPaymentMethod] = useState<"CASH" | "CARD" | "UPI" | "BANK">("CASH");
  const [clearNotes, setClearNotes] = useState<string>("");
  const [clearSaving, setClearSaving] = useState(false);

  const resetForm = useCallback(() => {
    setSelectedPurchase(null);
    setClearAmount("");
    setClearPaymentMethod("CASH");
    setClearNotes("");
    setClearSearch("");
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const loadSupplierAndPurchases = useCallback(async () => {
    if (!show) return;
    setClearLoading(true);
    let targetId = supplierId || "";
    let targetName = supplierName || "";

    try {
      // 1. Resolve supplierId if missing but supplierName or initialPurchase is present
      if (!targetId) {
        const vendorQuery = targetName || initialPurchase?.vendor || initialPurchase?.supplier_name;
        try {
          const suppRes = await getData(`${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}`);
          const suppList = Array.isArray(suppRes?.data) ? suppRes.data : (suppRes?.data?.datas || suppRes?.datas || []);
          if (vendorQuery) {
            const match = suppList.find(
              (s: any) =>
                (s.supplier_name && s.supplier_name.trim().toLowerCase() === vendorQuery.trim().toLowerCase()) ||
                (s.name && s.name.trim().toLowerCase() === vendorQuery.trim().toLowerCase()) ||
                (s.business_name && s.business_name.trim().toLowerCase() === vendorQuery.trim().toLowerCase()) ||
                (s.id && s.id === vendorQuery)
            );
            if (match?.id) {
              targetId = match.id;
              targetName = match.supplier_name || match.name || targetName;
            }
          }
        } catch (lookupErr) {
          console.warn("Supplier lookup error:", lookupErr);
        }
      }

      setResolvedSupplierId(targetId);
      if (targetName) setResolvedSupplierName(targetName);

      // 2. Fetch outstanding purchases if supplier ID was resolved
      let purList: any[] = [];
      if (targetId) {
        const res = await purchaseApi.getPurchasesBySupplier(SHOP_ID, targetId, {
          outstanding: true,
          exclude_cancel: "true",
          exclude_draft: "true",
        });
        purList = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
        if (res?.data?.datas) purList = res.data.datas;
      }

      // If initialPurchase was provided, ensure it's in the list
      if (initialPurchase) {
        const initId = initialPurchaseId || initialPurchase.id || initialPurchase.purchase_id;
        const exists = purList.some((p: any) => (p.id && p.id === initId) || (p.purchase_id && p.purchase_id === initId));
        if (!exists && Number(initialPurchase.outstanding_amount ?? initialPurchase.outstanding ?? 0) > 0) {
          purList = [
            {
              id: initId,
              purchase_id: initId,
              invoice_no: initialPurchase.invoice_no || initialPurchase.poNumber || initialPurchase.invoice || initialPurchase.ui_id,
              ui_id: initialPurchase.ui_id || initialPurchase.systemId || initialPurchase.poNumber,
              outstanding_amount: Number(initialPurchase.outstanding_amount ?? initialPurchase.outstanding ?? 0),
              created_at: initialPurchase.date || new Date().toISOString(),
              purchase_date: initialPurchase.date || new Date().toISOString(),
            },
            ...purList,
          ];
        }
      }

      setClearPurchases(purList);

      // 3. Pre-select target purchase if specified
      if (initialPurchaseId || initialPurchase) {
        const targetIdOrInvoice = initialPurchaseId || initialPurchase?.id || initialPurchase?.purchase_id;
        const targetInv = initialPurchase?.invoice_no || initialPurchase?.poNumber || initialPurchase?.invoice || initialPurchase?.ui_id;
        const found = purList.find(
          (p: any) =>
            (targetIdOrInvoice && (p.id === targetIdOrInvoice || p.purchase_id === targetIdOrInvoice)) ||
            (targetInv && (p.invoice_no === targetInv || p.ui_id === targetInv))
        );
        if (found) {
          const bal = Number(found.outstanding_amount ?? found.outstanding ?? 0);
          setSelectedPurchase(found);
          setClearAmount(bal > 0 ? String(bal) : "");
        } else if (initialPurchase && Number(initialPurchase.outstanding_amount ?? initialPurchase.outstanding ?? 0) > 0) {
          const bal = Number(initialPurchase.outstanding_amount ?? initialPurchase.outstanding ?? 0);
          setSelectedPurchase(initialPurchase);
          setClearAmount(String(bal));
        }
      }
    } catch (e: any) {
      showToast(e?.message || "Failed to fetch outstanding purchases", "error");
    } finally {
      setClearLoading(false);
    }
  }, [show, supplierId, supplierName, initialPurchaseId, initialPurchase, getData, purchaseApi, showToast]);

  useEffect(() => {
    if (show) {
      resetForm();
      loadSupplierAndPurchases();
    }
  }, [show, loadSupplierAndPurchases, resetForm]);

  const handleClearOutstandingPayment = async () => {
    if (!selectedPurchase || !clearAmount) return;
    const balance = Number(selectedPurchase.outstanding_amount ?? selectedPurchase.outstanding ?? 0);
    const amountToPay = Number(clearAmount);

    if (isNaN(amountToPay) || amountToPay <= 0) {
      showToast("Please enter a valid payment amount greater than zero", "error");
      return;
    }
    if (balance <= 0) {
      showToast("This purchase has already been fully paid with ₹0.00 outstanding", "error");
      return;
    }
    if (amountToPay > balance) {
      showToast(
        `Payment amount cannot exceed purchase outstanding balance of ₹${balance.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
        "error"
      );
      return;
    }

    setClearSaving(true);
    try {
      const purchaseId = selectedPurchase.purchase_id || selectedPurchase.id;
      const invoiceNo = selectedPurchase.invoice_no || selectedPurchase.ui_id || selectedPurchase.poNumber;
      const notesStr = clearNotes.trim() || `Payment for purchase ${invoiceNo}`;

      if (resolvedSupplierId) {
        await supplierApi.updateOutstanding({
          id: resolvedSupplierId,
          shop_id: SHOP_ID,
          outstanding_infos: { amount: amountToPay },
          type: "DECREMENT",
          entity_name: "PURCHASE",
          entity_id: purchaseId,
          invoice_no: invoiceNo,
          payment_method: clearPaymentMethod,
          notes: notesStr,
          cleared_amount: amountToPay,
          outstanding_amount: Math.max(0, balance - amountToPay),
        });
      }

      // Also record payment on purchase service if available
      try {
        if (purchaseApi?.recordPayment) {
          await purchaseApi.recordPayment({
            id: purchaseId,
            purchase_id: purchaseId,
            shop_id: SHOP_ID,
            amount: amountToPay,
            payment_method: clearPaymentMethod,
            notes: notesStr,
            supplier_id: resolvedSupplierId,
            invoice_no: invoiceNo,
          });
        }
      } catch (purPaymentErr) {
        console.warn("purchaseApi.recordPayment non-fatal:", purPaymentErr);
      }

      showToast("Payment applied successfully", "success");
      onSuccess?.();
      handleClose();
    } catch (e: any) {
      const errMsg =
        e?.response?.data?.detail?.description ||
        e?.response?.data?.detail?.msg ||
        e?.message ||
        "Failed to apply payment";
      showToast(errMsg, "error");
    } finally {
      setClearSaving(false);
    }
  };

  return (
    <Modal show={show} onClose={handleClose} title="Record Payment">
      <div className="space-y-4">
        {resolvedSupplierName && (
          <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Supplier</span>
            <span className="font-bold text-slate-800">{resolvedSupplierName}</span>
          </div>
        )}

        {!selectedPurchase ? (
          <>
            <div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={clearSearch}
                  onChange={(e) => setClearSearch(e.target.value)}
                  placeholder="Search invoice or ID..."
                  className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {clearLoading ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading purchases...</div>
              ) : clearPurchases.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No outstanding purchases found.</div>
              ) : (
                clearPurchases
                  .filter((p) => {
                    const balance = Number(p.outstanding_amount ?? p.outstanding ?? 0);
                    if (balance <= 0) return false;
                    return (
                      !clearSearch ||
                      (p.invoice_no && p.invoice_no.toLowerCase().includes(clearSearch.toLowerCase())) ||
                      (p.ui_id && p.ui_id.toLowerCase().includes(clearSearch.toLowerCase()))
                    );
                  })
                  .map((p) => {
                    const balance = Number(p.outstanding_amount ?? p.outstanding ?? 0);
                    const pDate = p.purchase_date || p.created_at || p.date;

                    return (
                      <div
                        key={p.id || p.purchase_id || p.ui_id}
                        onClick={() => {
                          setSelectedPurchase(p);
                          setClearAmount(balance > 0 ? String(balance) : "");
                        }}
                        className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-lg cursor-pointer transition-all shadow-sm flex justify-between items-center group"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {p.invoice_no || p.ui_id || p.poNumber || "No Invoice"}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {pDate ? new Date(pDate).toLocaleDateString("en-IN") : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">Balance</p>
                          <p className="text-sm font-black text-rose-600 group-hover:text-blue-600 transition-colors">
                            ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Purchase</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {selectedPurchase.invoice_no || selectedPurchase.ui_id || selectedPurchase.poNumber}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPurchase(null);
                  setClearAmount("");
                  setClearPaymentMethod("CASH");
                  setClearNotes("");
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: "CASH",
                    label: "Cash",
                    icon: Banknote,
                    activeClass: "bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20",
                  },
                  {
                    id: "CARD",
                    label: "Card",
                    icon: CreditCard,
                    activeClass: "bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-500/20",
                  },
                  {
                    id: "UPI",
                    label: "UPI",
                    icon: QrCode,
                    activeClass: "bg-purple-50 border-purple-300 text-purple-700 ring-2 ring-purple-500/20",
                  },
                  {
                    id: "BANK",
                    label: "Bank",
                    icon: Building2,
                    activeClass: "bg-amber-50 border-amber-300 text-amber-700 ring-2 ring-amber-500/20",
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  const isActive = clearPaymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setClearPaymentMethod(m.id as any)}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                        isActive ? m.activeClass : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {(() => {
              const balance = Number(selectedPurchase.outstanding_amount ?? selectedPurchase.outstanding ?? 0);
              const amountNum = parseFloat(clearAmount) || 0;
              const isExceeded = amountNum > balance;

              return (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex justify-between items-end">
                      Payment Amount
                      <span className="text-[10px] font-bold text-rose-600">
                        Max: ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold transition-colors ${
                          isExceeded ? "text-rose-500" : "text-slate-400"
                        }`}
                      >
                        ₹
                      </span>
                      <input
                        type="number"
                        value={clearAmount}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === "") {
                            setClearAmount("");
                            return;
                          }
                          let num = parseFloat(val);
                          if (isNaN(num) || num < 0) return;
                          if (num > balance) {
                            num = balance;
                            val = num.toString();
                          }
                          setClearAmount(val);
                        }}
                        max={balance}
                        className={`w-full h-10 pl-7 pr-3 bg-white border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-sm ${
                          isExceeded
                            ? "border-rose-400 text-rose-600 focus:ring-rose-400/20"
                            : "border-slate-200 text-slate-800 focus:ring-blue-500 focus:border-transparent"
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {isExceeded && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">
                        Amount cannot exceed purchase outstanding balance of ₹
                        {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Notes <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={clearNotes}
                      onChange={(e) => setClearNotes(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm resize-none"
                      placeholder="Add payment notes or remarks..."
                    />
                  </div>
                </div>
              );
            })()}

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
              <button
                onClick={() => {
                  setSelectedPurchase(null);
                  setClearAmount("");
                  setClearPaymentMethod("CASH");
                  setClearNotes("");
                }}
                className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Back
              </button>
              <button
                onClick={handleClearOutstandingPayment}
                disabled={
                  clearSaving ||
                  !clearAmount ||
                  isNaN(Number(clearAmount)) ||
                  Number(clearAmount) <= 0 ||
                  Number(selectedPurchase?.outstanding_amount ?? selectedPurchase?.outstanding ?? 0) <= 0 ||
                  Number(clearAmount) > Number(selectedPurchase?.outstanding_amount ?? selectedPurchase?.outstanding ?? 0)
                }
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
              >
                {clearSaving ? "Processing..." : "Submit Payment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

