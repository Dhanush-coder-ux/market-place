import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/SuperUI";
import { Wallet, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { useApi } from "@/context/ApiContext";
import { SHOP_ID, ENDPOINTS } from "@/services/endpoints";
import type { CustomerRecord } from "@/types/api";

interface RecordPaymentModalProps {
  show: boolean;
  onClose: () => void;
  customer: CustomerRecord | null;
  onSuccess: () => void;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function RecordPaymentModal({ show, onClose, customer, onSuccess }: RecordPaymentModalProps) {
  const { customer: customerApi } = useBusinessApi();
  const { getData } = useApi();
  const { showToast } = useToast();

  const [isClearing, setIsClearing] = useState(false);

  // Selection state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [clearSearch, setClearSearch] = useState("");
  const [clearAmount, setClearAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [clearingHistories, setClearingHistories] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const maxOutstanding = Number(customer?.outstanding_infos?.amount ?? customer?.outstanding ?? (customer as any)?.credit_infos?.outstanding ?? customer?.datas?.outstanding_balance ?? 0);

  useEffect(() => {
    if (show && customer?.id) {
      setOrdersLoading(true);
      Promise.all([
        getData(`${ENDPOINTS.ORDERS}/by/customer/${localStorage.getItem('shop_id') || SHOP_ID}/${customer.id}`),
        customerApi.getClearingHistoryById(localStorage.getItem('shop_id') || SHOP_ID, customer.id).catch(() => null)
      ])
        .then(([ordersRes, clrRes]: [any, any]) => {
          if (ordersRes && ordersRes.data) {
            let actualData = ordersRes.data;
            if (typeof actualData === 'object' && !Array.isArray(actualData) && 'datas' in actualData) {
              actualData = actualData.datas;
            }
            const fetchedOrders = Array.isArray(actualData) ? actualData : [actualData];
            setOrders(fetchedOrders);
          }
          if (clrRes && clrRes.data) {
            let actualClr = clrRes.data;
            if (typeof actualClr === 'object' && !Array.isArray(actualClr) && 'datas' in actualClr) {
              actualClr = actualClr.datas;
            }
            setClearingHistories(Array.isArray(actualClr) ? actualClr : [actualClr]);
          }
          setOrdersLoading(false);
        })
        .catch(() => setOrdersLoading(false));
    } else {
      // Reset state on close
      setSelectedOrder(null);
      setClearSearch("");
      setClearAmount("");
      setNotes("");
      setPaymentMethod("CASH");
      setClearingHistories([]);
    }
  }, [show, customer?.id, getData, customerApi]);

  // Safe payment extractor to prevent any NaN from malformed payment objects
  const extractPayments = (source: any): { method: string; amount: number }[] => {
    const result: { method: string; amount: number }[] = [];
    if (!source) return result;

    const add = (method: string, amount?: any) => {
      if (!method) return;
      const num = Number(amount);
      result.push({ method: String(method), amount: isNaN(num) ? 0 : num });
    };

    if (Array.isArray(source)) {
      source.forEach((p: any) => {
        if (p && typeof p === "object") {
          add(p.method || p.mode || p.type || p.payment_method || "Other", p.amount ?? p.value);
        }
      });
    } else if (typeof source === "object") {
      if (source.payments && Array.isArray(source.payments)) {
        source.payments.forEach((p: any) => {
          if (p && typeof p === "object") {
            add(p.method || p.mode || p.type || p.payment_method || "Other", p.amount ?? p.value);
          }
        });
      } else if ("amount" in source || "cleared_amount" in source) {
        add(source.payment_method || source.method || source.mode || "Other", source.amount ?? source.cleared_amount);
      } else {
        Object.entries(source).forEach(([k, v]) => {
          if (typeof v === "number") {
            add(k, v);
          } else if (typeof v === "string" && !isNaN(Number(v))) {
            add(k, Number(v));
          } else if (v && typeof v === "object" && ("amount" in (v as any) || "value" in (v as any))) {
            add(k, (v as any).amount ?? (v as any).value);
          }
        });
      }
    }
    return result;
  };

  // Build map of already cleared amounts per invoice/order
  const clearedMap = useMemo(() => {
    const map: Record<string, number> = {};
    clearingHistories.forEach((h: any) => {
      const noteStr = String(h.additional_infos?.notes || h.notes || '').toLowerCase();
      const isInitialBilled = noteStr.includes('billed (on credit)') || noteStr.includes('billed on credit');
      const isCreditAdd = noteStr.includes('added to credit') || h.type === 'INCREMENT';

      // Credit additions (e.g. initial order on credit, exchange added to credit) are debt additions, NOT payments
      if (isInitialBilled || isCreditAdd) return;

      const inv = String(h.invoice_no || h.additional_infos?.invoice_no || h.additional_infos?.entity_id || h.entity_id || '').trim().toUpperCase();
      let amt = Number(h.additional_infos?.cleared_amount ?? h.cleared_amount ?? 0);
      if (!amt && h.payment_infos) {
        const pList = extractPayments(h.payment_infos);
        amt = pList
          .filter(p => !p.method.toUpperCase().includes('CREDIT'))
          .reduce((sum, p) => sum + (p.amount || 0), 0);
      }
      if (!amt && h.cleared_infos) {
        const before = Number(h.cleared_infos.outstanding_before || 0);
        const after = Number(h.cleared_infos.outstanding_after || 0);
        if (before > after) amt = before - after;
      }
      if (inv && amt > 0) {
        map[inv] = (map[inv] || 0) + amt;
      }
    });
    return map;
  }, [clearingHistories]);

  // Compute outstanding balance for an individual order
  const getOrderOutstanding = (o: any) => {
    const orderUiId = String(o.ui_id || '').trim().toUpperCase();
    const orderId = String(o.id || '').trim().toUpperCase();

    // Check if initial order was on credit or partially on credit
    const initialPayments = extractPayments(o.payment_infos);
    let initialNonCreditPaid = 0;
    let initialCreditAmount = 0;

    initialPayments.forEach(p => {
      if (p.method.toUpperCase().includes('CREDIT')) {
        initialCreditAmount += (p.amount || 0);
      } else {
        initialNonCreditPaid += (p.amount || 0);
      }
    });

    if (o.payment_method && String(o.payment_method).toUpperCase().includes('CREDIT') && initialCreditAmount === 0 && initialNonCreditPaid === 0) {
      initialCreditAmount = Number(o.total_sellprice ?? o.calculation_infos?.total ?? o.total_amount) || 0;
    }

    // Exchanges
    let totalReplacementsValue = 0;
    let totalExchangedReturnedValue = 0;
    let exchangeNonCreditPaid = 0;
    let exchangeCreditAdded = 0;

    (o.exchanges || []).forEach((exch: any) => {
      let repVal = Number(exch.total_replacement_amount) || 0;
      const repItems = exch.replaced_items || exch.replacement_items || [];
      if (repVal === 0 && repItems.length > 0) {
        repItems.forEach((r: any) => {
          const rQty = Number(r.entered_qty ?? r.quantity ?? 1) || 1;
          const rPrice = Number(r.total_amount ?? ((r.sell_price || 0) * rQty)) || 0;
          repVal += rPrice;
        });
      }
      totalReplacementsValue += repVal;

      let retVal = Number(exch.total_exchanged_amount) || 0;
      const retItems = exch.items || exch.exchange_items || exch.returned_items || [];
      if (retVal === 0 && retItems.length > 0) {
        retItems.forEach((r: any) => {
          const rQty = Number(r.quantity ?? 1) || 1;
          const rPrice = Number(r.exchange_amount ?? r.total_amount ?? ((r.sell_price || 0) * rQty)) || 0;
          retVal += rPrice;
        });
      }
      totalExchangedReturnedValue += retVal;

      const exchPayments = extractPayments(exch.payment_infos);
      exchPayments.forEach(p => {
        const pAmt = p.amount || 0;
        if (p.method.toUpperCase().includes('CREDIT')) {
          exchangeCreditAdded += pAmt;
        } else {
          exchangeNonCreditPaid += pAmt;
        }
      });
    });

    let totalRefundsValue = 0;
    (o.returns || []).forEach((ret: any) => {
      totalRefundsValue += (Number(ret.total_return_cost ?? ret.total_cost) || 0);
    });

    const baseOrderTotal = Number(o.total_sellprice ?? o.calculation_infos?.total ?? o.total_amount) || 0;
    const netOrderTotal = Math.max(
      0,
      (totalReplacementsValue > 0 || totalExchangedReturnedValue > 0)
        ? (baseOrderTotal - totalExchangedReturnedValue - totalRefundsValue + totalReplacementsValue)
        : (baseOrderTotal - totalRefundsValue)
    );

    const isBilledCredit = initialCreditAmount > 0 || String(o.payment_method || '').toUpperCase().includes('CREDIT');
    const totalDue = isBilledCredit
      ? Math.max(0, netOrderTotal - initialNonCreditPaid - exchangeNonCreditPaid)
      : Math.max(0, initialCreditAmount + exchangeCreditAdded);

    const clearedSoFar = (orderUiId ? (clearedMap[orderUiId] || 0) : 0) + (orderId && orderId !== orderUiId ? (clearedMap[orderId] || 0) : 0);

    const remaining = Math.max(0, (totalDue || 0) - (clearedSoFar || 0));
    const result = maxOutstanding > 0 ? Math.min(remaining, maxOutstanding) : remaining;
    return isNaN(result) ? 0 : result;
  };

  const outstandingOrders = useMemo(() => {
    return orders
      .map(o => ({
        ...o,
        _computedOutstanding: getOrderOutstanding(o)
      }))
      .filter(o => {
        if (o._computedOutstanding <= 0) return false;
        if (!clearSearch) return true;
        const q = clearSearch.toLowerCase();
        return (
          (o.ui_id && o.ui_id.toLowerCase().includes(q)) ||
          (o.id && o.id.toLowerCase().includes(q))
        );
      });
  }, [orders, clearSearch, clearedMap, maxOutstanding]);

  const handleClose = () => {
    onClose();
  };

  const handleSavePayment = async () => {
    if (!customer || !selectedOrder || !clearAmount) return;

    const amount = parseFloat(clearAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid payment amount", "error");
      return;
    }

    setIsClearing(true);

    const orderDisplayId = selectedOrder.ui_id || selectedOrder.id.slice(0, 8).toUpperCase();
    const autoNotes = `Collected ₹${amount.toFixed(2)} via ${paymentMethod} for order ${orderDisplayId}`;
    const finalNotes = notes && notes.trim() ? `${autoNotes} - ${notes.trim()}` : autoNotes;

    const payload = {
      shop_id: localStorage.getItem('shop_id') || SHOP_ID,
      customer_id: customer.id,
      id: customer.id,
      payment_infos: [{
        method: paymentMethod as "UPI" | "CASH" | "CARD" | "BANK",
        amount: amount,
      }],
      invoice_no: orderDisplayId,
      entity_id: selectedOrder.id,
      notes: finalNotes,
    };

    try {
      // 1. Record the payment to clearing history
      await customerApi.clearOutstanding(payload);

      showToast(`₹${amount.toLocaleString()} collected successfully`, "success");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Payment error:", error);
      showToast("Failed to record payment", "error");
    } finally {
      setIsClearing(false);
    }
  };

  const amountNum = parseFloat(clearAmount) || 0;
  const remainingBalance = round2(Math.max(0, maxOutstanding - amountNum));

  return (
    <Modal
      show={show}
      onClose={handleClose}
      title={`Collect Payment: ${customer?.name || 'Customer'}`}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePayment}
            disabled={isClearing || !selectedOrder || !clearAmount || parseFloat(clearAmount) <= 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-200 disabled:opacity-50 transition-all active:scale-95"
          >
            {isClearing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <><Wallet className="w-4 h-4" /> Confirm Collection</>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {!selectedOrder ? (
          <>
            <div>
              <input
                type="text"
                value={clearSearch}
                onChange={e => setClearSearch(e.target.value)}
                placeholder="Search invoice or order ID..."
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              />
            </div>
            <div className="max-h-[360px] overflow-y-auto overscroll-contain space-y-2.5 pr-2 custom-scrollbar select-none" style={{ scrollbarGutter: "stable" }}>
              {ordersLoading ? (
                <div className="p-4 text-center text-xs text-slate-500">Loading orders...</div>
              ) : outstandingOrders.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  {clearSearch ? "No matching outstanding orders found." : "No outstanding orders found for this customer."}
                </div>
              ) : (
                outstandingOrders.map(o => {
                  const orderOutstanding = o._computedOutstanding;
                  const date = o.created_at || o.date ? new Date(o.created_at || o.date).toLocaleDateString() : 'Unknown Date';

                  return (
                    <div
                      key={o.id}
                      onClick={() => {
                        setSelectedOrder(o);
                        const defaultFill = Math.min(orderOutstanding, maxOutstanding);
                        if (defaultFill > 0) {
                          setClearAmount(round2(defaultFill).toString());
                        }
                      }}
                      className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-lg cursor-pointer transition-all shadow-sm flex justify-between items-center group"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{o.ui_id || o.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">Outstanding</p>
                        <p className="text-sm font-black text-rose-500">
                          ₹{orderOutstanding.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Selected Invoice</p>
                <p className="text-sm font-bold text-blue-700">{selectedOrder.ui_id || selectedOrder.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[10px] font-bold px-2.5 py-1.5 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors border border-blue-200 hover:border-blue-600"
              >
                Change
              </button>
            </div>

            <div className="flex gap-8 px-1">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Outstanding Balance</p>
                <p className="text-lg font-bold text-rose-500 tabular-nums">₹{maxOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remaining Balance</p>
                <p className="text-lg font-bold text-slate-700 tabular-nums">
                  ₹{remainingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <ReusableSelect
                  label="Payment Method"
                  value={paymentMethod}
                  onValueChange={val => setPaymentMethod(val)}
                  options={[
                    { label: "Cash", value: "CASH" },
                    { label: "UPI", value: "UPI" },
                    { label: "Card", value: "CARD" },
                    { label: "Bank Transfer", value: "BANK" }
                  ]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 ml-1">Amount to Clear</label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 group-focus-within:text-blue-500 transition-colors">₹</span>
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

                      const maxAllowed = round2(Math.max(0, maxOutstanding));
                      if (num > maxAllowed) {
                        num = maxAllowed;
                        val = round2(num).toString();
                      }
                      setClearAmount(val);
                    }}
                    placeholder="0.00"
                    className="w-full h-10 pl-7 pr-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 ml-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any payment reference or internal note..."
                rows={2}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all placeholder:text-slate-300"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
