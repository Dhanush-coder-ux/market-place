import { useState } from "react";
import { Modal } from "@/components/common/SuperUI";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { Wallet, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";
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
  const { showToast } = useToast();

  const [payments, setPayments] = useState<{ mode: string; amount: string }[]>([
    { mode: "UPI", amount: "" }
  ]);
  const [isClearing, setIsClearing] = useState(false);

  const maxOutstanding = Number(customer?.outstanding_infos?.amount ?? customer?.outstanding ?? (customer as any)?.credit_infos?.outstanding ?? customer?.datas?.outstanding_balance ?? 0);

  const addPaymentRow = () => {
    if (payments.length >= 4) return;
    setPayments([...payments, { mode: "Cash", amount: "" }]);
  };

  const removePaymentRow = (idx: number) => {
    if (payments.length <= 1) return;
    setPayments(payments.filter((_, i) => i !== idx));
  };

  const updatePayment = (idx: number, updates: Partial<{ mode: string; amount: string }>) => {
    setPayments(payments.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const handleClose = () => {
    setPayments([{ mode: "UPI", amount: "" }]);
    onClose();
  };

  const handleSavePayment = async () => {
    if (!customer) return;

    const validPayments = payments.filter(p => parseFloat(p.amount) > 0);
    if (validPayments.length === 0) { 
      showToast("Please enter at least one payment amount", "error"); 
      return; 
    }

    setIsClearing(true);
    const methodMap: Record<string, string> = {
      "UPI": "UPI",
      "Cash": "CASH",
      "Card": "CARD",
      "Bank Transfer": "BANK"
    };

    // Build payment_infos as a list of { method, amount } objects
    const paymentInfos = validPayments.map(p => ({
      method: (methodMap[p.mode] || "CASH") as "UPI" | "CASH" | "CARD" | "BANK",
      amount: parseFloat(p.amount),
    }));

    let totalCleared = paymentInfos.reduce((sum, p) => sum + p.amount, 0);

    const payload = {
      shop_id: SHOP_ID,
      customer_id: customer.id,
      id: customer.id,
      payment_infos: paymentInfos,
    };

    try {
      const res = await customerApi.clearOutstanding(payload);
      if (res) {
        showToast(`₹${totalCleared.toLocaleString()} collected successfully`, "success");
        onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error("Payment error:", error);
      showToast("Failed to record payment", "error");
    } finally {
      setIsClearing(false);
    }
  };

  const totalCollected = round2(payments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0));
  const remainingBalance = round2(Math.max(0, maxOutstanding - totalCollected));

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
            disabled={isClearing}
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
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex gap-8">
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
          <button
            onClick={addPaymentRow}
            disabled={payments.length >= 4}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all disabled:opacity-30 border border-blue-100/50"
          >
            <Plus size={12} /> ADD MODE
          </button>
        </div>

        <div className="space-y-4">
          {payments.map((p, idx) => (
            <div key={idx} className="grid grid-cols-[1fr,1fr,auto] gap-3 items-end animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 ml-1">Payment Mode</p>
                <div className="scale-95 origin-left w-[105%]">
                  <ReusableSelect
                    options={[
                      { label: "UPI", value: "UPI" },
                      { label: "Cash", value: "Cash" },
                      { label: "Card", value: "Card" },
                      { label: "Bank Transfer", value: "Bank Transfer" }
                    ]}
                    value={p.mode}
                    onValueChange={(val) => updatePayment(idx, { mode: val })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 ml-1">Amount</p>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 group-focus-within:text-blue-500 transition-colors">₹</span>
                  <input
                    type="number"
                    value={p.amount}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === "") {
                        updatePayment(idx, { amount: "" });
                        return;
                      }
                      let num = parseFloat(val);
                      if (isNaN(num) || num < 0) return;
                      
                      const otherTotal = round2(payments.reduce((acc, curr, i) => i !== idx ? acc + (parseFloat(curr.amount) || 0) : acc, 0));
                      const maxAllowed = round2(Math.max(0, maxOutstanding - otherTotal));
                      
                      if (num > maxAllowed) {
                        num = maxAllowed;
                        val = round2(num).toString();
                      }
                      updatePayment(idx, { amount: val });
                    }}
                    placeholder="0.00"
                    className="w-full h-10 pl-7 pr-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
              {payments.length > 1 && (
                <button
                  onClick={() => removePaymentRow(idx)}
                  className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all mb-[1px]"
                  title="Remove mode"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Collection</span>
            <span className="text-base font-bold text-slate-700 tabular-nums">
              ₹{totalCollected.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, (totalCollected / Math.max(1, maxOutstanding)) * 100)}%`
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
