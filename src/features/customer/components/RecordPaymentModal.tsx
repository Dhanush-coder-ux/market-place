import { useState, useEffect } from "react";
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
  const [ordersLoading, setOrdersLoading] = useState(false);

  const maxOutstanding = Number(customer?.outstanding_infos?.amount ?? customer?.outstanding ?? (customer as any)?.credit_infos?.outstanding ?? customer?.datas?.outstanding_balance ?? 0);

  useEffect(() => {
    if (show && customer?.id) {
      setOrdersLoading(true);
      getData(`${ENDPOINTS.ORDERS}/by/customer/${SHOP_ID}/${customer.id}`)
        .then((res: any) => {
          if (res && res.data) {
            let actualData = res.data;
            if (typeof actualData === 'object' && !Array.isArray(actualData) && 'datas' in actualData) {
              actualData = actualData.datas;
            }
            const fetchedOrders = Array.isArray(actualData) ? actualData : [actualData];
            
            // Try to filter to only outstanding, or just show all if we can't tell
            // For now, let's just show all recent orders since they can have balances.
            setOrders(fetchedOrders);
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
    }
  }, [show, customer?.id, getData]);


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

    const payload = {
      shop_id: SHOP_ID,
      customer_id: customer.id,
      id: customer.id,
      payment_infos: [{
        method: paymentMethod as "UPI" | "CASH" | "CARD" | "BANK",
        amount: amount,
      }],
      invoice_no: selectedOrder.ui_id || selectedOrder.id.slice(0, 8).toUpperCase(),
      entity_id: selectedOrder.id,
      notes: notes,
    };

    try {
      // 1. Record the payment to clearing history
      await customerApi.clearOutstanding(payload);
      
      // 2. Decrement the customer's outstanding balance
      await customerApi.addOutstanding({
        id: customer.id,
        shop_id: SHOP_ID,
        outstanding_infos: { amount: amount },
        type: 'DECREMENT'
      });

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
        <div className="flex justify-end gap-2 p-4 bg-slate-50/50 rounded-b-2xl border-t border-slate-100">
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
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {ordersLoading ? (
                <div className="p-4 text-center text-xs text-slate-500">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No recent orders found.</div>
              ) : (
                orders.filter(o => 
                  !clearSearch || 
                  (o.ui_id && o.ui_id.toLowerCase().includes(clearSearch.toLowerCase())) || 
                  (o.id && o.id.toLowerCase().includes(clearSearch.toLowerCase()))
                ).map(o => {
                  const total = Number(o.calculation_infos?.total ?? o.total_sellprice ?? o.grand_total ?? o.total_amount ?? 0);
                  const date = o.created_at || o.date ? new Date(o.created_at || o.date).toLocaleDateString() : 'Unknown Date';
                  
                  return (
                    <div 
                      key={o.id} 
                      onClick={() => setSelectedOrder(o)}
                      className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-lg cursor-pointer transition-all shadow-sm flex justify-between items-center group"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{o.ui_id || o.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">Total</p>
                        <p className="text-sm font-black text-rose-500">₹{total.toLocaleString()}</p>
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 ml-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
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
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Transaction ID, remarks, etc."
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
