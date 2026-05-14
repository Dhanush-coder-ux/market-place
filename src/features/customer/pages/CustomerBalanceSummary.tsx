import {
  Users, Search, Filter, Trash2, Edit3,
  Eye, Bookmark, Banknote, Loader2, Wallet, Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { StatCard } from "@/components/common/StatsCard";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import Input from "@/components/ui/Input";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { CustomerRecord } from "@/types/api";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/common/SuperUI";


export default function CustomerBalanceSummary() {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData, deleteData, postData, loading } = useApi();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<CustomerRecord | null>(null);
  const [payments, setPayments] = useState<{ mode: string, amount: string }[]>([
    { mode: "UPI", amount: "" }
  ]);
  const [isClearing, setIsClearing] = useState(false);

  // Dynamic Column State
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("customer_table_columns");
    return saved ? JSON.parse(saved) : ["email", "phone", "customer_type"];
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/customers/drafts")}
          className="px-4 h-10 rounded-xl border border-blue-100 text-blue-600 font-semibold text-[13px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={16} />
          Saved Drafts
        </button>
        <GradientButton path="/customers/add" className="h-10 flex items-center px-4 text-[13px]">+ Add Customer</GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const params: Record<string, string> = { limit: "100", offset: "1" };
    if (searchTerm) params.q = searchTerm;

    getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`, params).then((res) => {
      if (res) {
        const data: CustomerRecord[] = Array.isArray(res.data) ? res.data : [res.data];
        setCustomers(data);

        // Detect unique keys from both root and datas field
        const keys = new Set<string>();
        data.forEach((c: any) => {
          if (!c) return;
          // Root level keys from schema
          const rootKeys = ["email", "mobile_number", "credit_limit", "is_active", "ui_id", "created_at"];
          rootKeys.forEach(k => keys.add(k));

          // Nested datas keys
          if (c.datas) {
            Object.keys(c.datas).forEach(k => {
              if (k !== "address") { // address is usually too long for a table cell
                keys.add(k);
              }
            });
          }
        });
        setAvailableKeys(Array.from(keys).sort());
      }
    });
  }, [refreshKey, searchTerm]);

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await deleteData(`${ENDPOINTS.CUSTOMERS}/${SHOP_ID}/${customerToDelete.id}`);
      showToast("Customer deleted successfully", "success");
      setRefreshKey(prev => prev + 1);
    } catch (_err) {
      showToast("Failed to delete customer", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const addPaymentRow = () => {
    if (payments.length >= 4) return;
    setPayments([...payments, { mode: "Cash", amount: "" }]);
  };

  const removePaymentRow = (idx: number) => {
    if (payments.length <= 1) return;
    setPayments(payments.filter((_, i) => i !== idx));
  };

  const updatePayment = (idx: number, updates: Partial<{ mode: string, amount: string }>) => {
    setPayments(payments.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const handleSavePayment = async () => {
    if (!selectedCustomerForPayment) return;

    const validPayments = payments.filter(p => parseFloat(p.amount) > 0);
    if (validPayments.length === 0) { showToast("Please enter at least one payment amount", "error"); return; }

    setIsClearing(true);
    const methodMap: Record<string, string> = {
      "UPI": "UPI",
      "Cash": "CASH",
      "Card": "CARD",
      "Bank Transfer": "BANK"
    };

    const paymentDict: Record<string, number> = {};
    let totalCleared = 0;

    validPayments.forEach(p => {
      const mode = methodMap[p.mode] || "CASH";
      const amt = parseFloat(p.amount);
      paymentDict[mode] = (paymentDict[mode] || 0) + amt;
      totalCleared += amt;
    });

    const payload = {
      shop_id: SHOP_ID,
      customer_id: selectedCustomerForPayment.id,
      payments: paymentDict,
      cleared_amount: totalCleared
    };

    try {
      const res = await postData(`${ENDPOINTS.CUSTOMERS}/outstanding/clear`, payload);
      if (res) {
        showToast(`₹${totalCleared.toLocaleString()} collected successfully`, "success");
        setShowPaymentModal(false);
        setRefreshKey(prev => prev + 1);
        setPayments([{ mode: "UPI", amount: "" }]);
      }
    } catch (error) {
      console.error("Payment error:", error);
      showToast("Failed to record payment", "error");
    } finally {
      setIsClearing(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (!c) return false;
      const name = (c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const mobile = (c.mobile_number || "").toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        mobile.includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [customers, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-3 pb-2 -mx-2 px-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 touch-pan-x">
        <StatCard label="Total Customers" value={customers.length} icon={Users} className="flex-1" />
      </div>

      <div className="bg-white p-3 rounded-t-xl border-b border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center mt-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Input
              leftIcon={<Search size={14} className='text-gray-400' />}
              type="text"
              placeholder="Search customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          <ColumnPicker
            availableKeys={availableKeys}
            selectedKeys={selectedKeys}
            onApply={setSelectedKeys}
            storageKey="customer_table_columns"
          />
        </div>
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <Filter className="text-slate-400" size={14} />
          <div className="scale-75 origin-right -mr-2">
            <ReusableSelect
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
              options={[
                { label: "All Statuses", value: "All" },
              ]}
              placeholder="Filter"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto h-[calc(100vh-220px)] pf-scroll">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm shadow-sm">
              <tr className="text-slate-400 text-[10px] font-bold border-b border-slate-100">
                <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">Customer</th>
                {selectedKeys.map(key => (
                  <th key={key} className="px-6 py-4 whitespace-nowrap capitalize">{key.replace(/_/g, ' ')}</th>
                ))}
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={selectedKeys.length + 2} className="py-20 text-center text-slate-400 italic">Loading customers...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={selectedKeys.length + 2} className="py-20 text-center text-slate-400 italic font-medium">No customers found.</td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-100">
                          {String(c.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 tracking-tight">
                            {String(c.name || "Untitled")}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-400">
                            {String(c.mobile_number || "No phone")}
                          </p>
                        </div>
                      </div>
                    </td>
                    {selectedKeys.map(key => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap">
                        <p className={`text-[12px] font-semibold tracking-tight ${key === 'customer_type' || key === 'payment_cycle' ? 'text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-md' : 'text-slate-600'}`}>
                          {key === 'is_active'
                            ? (c[key] ? "Active" : "Inactive")
                            : String((c as any).datas?.[key] ?? (c as any)[key] ?? "—")}
                        </p>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const balance = Number(c.outstanding ?? c.datas?.outstanding_balance ?? 0);
                            setSelectedCustomerForPayment(c);
                            setPayments([{ mode: "UPI", amount: balance > 0 ? String(balance) : "" }]);
                            setShowPaymentModal(true);
                          }}
                          className={`p-2 rounded-xl transition-all shadow-sm active:scale-95 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50`}
                          title="Record Payment"
                        >
                          <Banknote size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}/edit`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCustomerToDelete(c); setIsDeleteDialogOpen(true); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove Customer"
        description={`Are you sure you want to remove ${customerToDelete?.name}? This action cannot be undone.`}
        confirmText="Remove Customer"
        type="danger"
      />

      {/* Record Payment Modal */}
      <Modal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Collect Payment: ${selectedCustomerForPayment?.name}`}
        footer={
          <div className="flex justify-end gap-2 p-4 bg-slate-50/50 rounded-b-2xl border-t border-slate-100">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePayment}
              disabled={isClearing}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-200 disabled:opacity-50 transition-all active:scale-95"
            >
              {isClearing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Wallet className="w-4 h-4" /> Confirm Collection</>}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer balance</p>
              <p className="text-lg font-bold text-rose-500 tabular-nums">₹{Number(selectedCustomerForPayment?.datas?.outstanding_balance || 0).toLocaleString("en-IN")}</p>
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
                      onChange={(e) => updatePayment(idx, { amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full h-10 pl-7 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
                {payments.length > 1 && (
                  <button
                    onClick={() => removePaymentRow(idx)}
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all mb-[1px]"
                    title="Remove mode"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Collection</span>
              <span className="text-base font-bold text-slate-700 tabular-nums">
                ₹{payments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, (payments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0) / Number(selectedCustomerForPayment?.datas?.outstanding_balance || 1)) * 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
