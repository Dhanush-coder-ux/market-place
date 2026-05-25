import { useState, useCallback, useEffect, useMemo } from "react";
import {
  User, Loader2, CheckCircle2, AlertCircle, Wallet,
  Keyboard,
  X
} from "lucide-react";

import BillingTable, { createEmptyRow } from "../components/BillingTable";
import BillingHeader from "../components/BillingHeader";

import { BillingItem, CreateBillingSchema, CustomerData } from "../types";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import CustomerCreateModal from "../components/CustomerCreateModal";

const formatINR = (amount: number, decimals = 2) =>
  amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// ─── Billing Page ─────────────────────────────────────────────────────────────
const Billing = () => {
  const { showToast } = useToast();
  const { postData, getData, putData, loading: isSubmitting } = useApi();

  // ── Table State
  const [items, setItems] = useState<BillingItem[]>([createEmptyRow()]);

  // ── Customer State
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [wasAutofilled, setWasAutofilled] = useState(false);

  // ── Create Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [staticCustomers, setStaticCustomers] = useState<CustomerData[]>([]);
  const [newCreditLimit, setNewCreditLimit] = useState<string>("");
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // ── Billing Totals (lifted from BillingHeader for shared strip)
  const GST_PERCENT = 18;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const [includeGst, setIncludeGst] = useState(false);
  const [payments, setPayments] = useState<{ mode: "cash" | "upi" | "credit"; amount: number }[]>([
    { mode: "cash", amount: 0 },
  ]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + (i.tprice || 0), 0), [items]);
  const gstAmount = useMemo(() => round2((totalAmount * GST_PERCENT) / 100), [totalAmount]);
  const finalAmount = useMemo(() => includeGst ? round2(totalAmount + gstAmount) : totalAmount, [includeGst, totalAmount, gstAmount]);

  // Sync single-mode payment amount when total changes
  useEffect(() => {
    setPayments(prev => prev.length === 1 ? [{ ...prev[0], amount: finalAmount }] : prev);
  }, [finalAmount]);

  // ── Derived Credit Info
  const creditPaymentAmount = payments
    .filter(p => p.mode === "credit")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const projectedOutstanding = (customerData?.outstanding || 0) + creditPaymentAmount;
  const isCreditExceeded = customerData ? projectedOutstanding > customerData.creditLimit : false;

  // ── Handlers
  const handleItemsChange = useCallback((next: BillingItem[]) => setItems(next), []);

  const resetCustomer = useCallback(() => {
    setCustomerData(null);
    setIsLoadingCustomer(false);
    if (wasAutofilled) {
      setCustomerName("");
      setWasAutofilled(false);
    }
  }, [wasAutofilled]);

  // ── Prevent Accidental Tab/Browser Close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only prompt if there are items with content in the bill
      const hasItems = items.some(i => i.name && i.qty > 0);
      if (hasItems) {
        const message = "You have a pending bill. Are you sure you want to leave?";
        e.preventDefault();
        e.returnValue = message; // Standard for most browsers
        return message;          // Extra compatibility for some versions
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [items]);

  const fetchCustomers = useCallback(async (query: string, signal: AbortSignal) => {

    try {
      const res = await getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`, { search: query }, { signal });
      if (res && res.data) {
        // Map backend customer to CustomerData interface
        return res.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.mobile_number || c.phone || c.mobilenum || "",
          outstanding: c.outstanding || 0,
          creditLimit: c.credit_limit || 0,
          totalSpent: c.total_spent || 0,
        }));
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      return [];
    }
  }, [getData]);

  const handleCustomerChange = (val: any, customer?: CustomerData | CustomerData[]) => {
    if (!val || !customer) {
      resetCustomer();
      setPhone("");
      setCustomerName("");
      return;
    }

    if (Array.isArray(customer)) return; // Single select only

    setCustomerData(customer);
    setCustomerName(customer.name);
    setPhone(customer.phone);
    setWasAutofilled(true);
  };

  const handleCreateCustomer = async (customerValues: any) => {
    try {
      setIsCreatingCustomer(true);
      const res = await postData(ENDPOINTS.CUSTOMERS, {
        ...customerValues,
        shop_id: SHOP_ID,
      });

      // Backend structure: { detail: { success: true }, data: { ... } } or { detail: { success: true }, data: [{ ... }] }
      const isSuccess = res?.success || res?.detail?.success;
      const responseData = Array.isArray(res?.data) ? res.data[0] : res?.data;

      if (isSuccess && responseData) {
        // Automatically select the newly created customer
        const newCustomer: CustomerData = {
          id: responseData.id,
          name: responseData.name,
          phone: responseData.mobile_number || responseData.phone || "",
          outstanding: responseData.outstanding || 0,
          creditLimit: responseData.credit_limit || 0,
          totalSpent: responseData.total_spent || 0,
        };

        // Add to static list so SearchSelect can "see" it immediately
        setStaticCustomers(prev => [newCustomer, ...prev]);

        handleCustomerChange(newCustomer.id, newCustomer);
        setIsCustomerModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to create customer:", err);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleUpdateCreditLimit = async () => {
    if (!customerData || !newCreditLimit) return;
    try {
      setIsUpdatingLimit(true);
      const res = await putData(`${ENDPOINTS.CUSTOMERS}`, {
        credit_limit: parseFloat(newCreditLimit),
        id: customerData.id,
        shop_id: SHOP_ID,
      });

      if (res) {
        setCustomerData(prev => prev ? { ...prev, creditLimit: parseFloat(newCreditLimit) } : null);
        setNewCreditLimit("");
        showToast("Credit limit updated successfully", "success");
      }
    } catch (err) {
      console.error("Failed to update credit limit:", err);
      showToast("Failed to update limit", "error");
    } finally {
      setIsUpdatingLimit(false);
    }
  };

  // ── Confirm Order → POST to Billing API
  const handleConfirmOrder = useCallback(async (paymentsArg: { mode: string, amount: number }[], _includeGst: boolean, _status: string) => {
    const filledItems = items.filter(i => !!i.name);
    if (filledItems.length === 0) return;

    const paymentDict: Record<string, number> = {};
    paymentsArg.forEach(p => {
      const key = p.mode.toUpperCase();
      paymentDict[key] = (paymentDict[key] || 0) + p.amount;
    });

    const payload: CreateBillingSchema = {
      shop_id: SHOP_ID,
      payment_method: paymentsArg.map(p => p.mode).join(", "),
      customer_id: customerData?.id || "walk-in",
      payments: paymentDict,
      products: filledItems.map(i => ({
        id: i.inventoryId || "",
        variant_id: i.variantId || undefined,
        batch_id: i.batchId,
        serialno_id: i.serialnoId,
        serial_numbers: i.serialNumbers || [],
        quantity: i.qty
      }))
    };

    const res = await postData(ENDPOINTS.BILLING, payload);
    if (res) {


      setItems([createEmptyRow()]);
      setPhone("");
      setCustomerName("");
      setCustomerData(null);
      setWasAutofilled(false);
      setPayments([{ mode: "cash", amount: 0 }]);
      setIncludeGst(false);
      showToast("Order confirmed successfully", "success");
    }
  }, [items, customerData, postData, putData, showToast]);


  return (
    <div className="flex-1 flex min-h-0 bg-slate-50/80 overflow-hidden h-full">

      {/* ── Left Panel (Customer + Table) ──────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Customer Bar (only spans the table width) */}
        <div className="shrink-0 px-3 sm:px-4 py-2 bg-white border-b border-slate-200/60">
          <div className="flex items-center gap-2">

            {/* Customer Search */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <User size={12} strokeWidth={1.5} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <SearchSelect<CustomerData>
                  placeholder="Search customer..."
                  fetchOptions={fetchCustomers}
                  options={staticCustomers}
                  labelKey="name"
                  valueKey="id"
                  onChange={handleCustomerChange}
                  value={customerData?.id}
                  allowClear
                  className="h-[32px] shadow-none border-slate-200/60 rounded-md text-[12px]"
                  onCreateNew={(name) => {
                    setNewCustomerName(name);
                    setIsCustomerModalOpen(true);
                  }}
                  renderOption={(opt) => (
                    <div className="flex flex-col py-0.5">
                      <span className="text-[12px] font-medium text-slate-700">{opt.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono tracking-wide">{opt.phone}</span>
                    </div>
                  )}
                />
              </div>
              {isLoadingCustomer && <Loader2 size={12} className="text-blue-400 animate-spin shrink-0" />}
              {customerData && !isLoadingCustomer && (
                <span className="hidden sm:flex items-center gap-1 text-[9px] font-medium text-emerald-600 bg-emerald-50/80 border border-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                  <CheckCircle2 size={9} /> {customerData.name}
                </span>
              )}
            </div>


            {customerData && (
              <div className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-medium shrink-0 ${isCreditExceeded
                  ? "bg-red-50/60 border-red-200/60 text-red-600"
                  : "bg-slate-50/60 border-slate-200/60 text-slate-500"
                }`}>
                <Wallet size={10} className={isCreditExceeded ? "text-red-400" : "text-slate-400"} />
                <span>Credit: ₹{formatINR(customerData.creditLimit - customerData.outstanding, 0)}</span>
                {isCreditExceeded && <AlertCircle size={9} className="text-red-500" />}
              </div>
            )}

            {/* Credit Limit Update (only when exceeded) */}
            {customerData && isCreditExceeded && (
              <div className="hidden lg:flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  placeholder="New limit"
                  value={newCreditLimit}
                  onChange={e => setNewCreditLimit(e.target.value)}
                  className="w-16 px-1.5 py-1 text-[10px] border border-red-200/80 rounded-md outline-none focus:border-red-300 bg-white"
                />
                <button
                  onClick={handleUpdateCreditLimit}
                  disabled={isUpdatingLimit || !newCreditLimit}
                  className="px-2 py-1 bg-red-500 text-white text-[9px] font-bold rounded-md hover:bg-red-600 transition-colors disabled:opacity-40"
                >
                  {isUpdatingLimit ? "..." : "Update"}
                </button>
              </div>
            )}

            {/* Shortcuts Button */}
            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              className="flex items-center px-1.5 py-1.5 border border-slate-200/60 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors shrink-0"
              title="Keyboard Shortcuts"
            >
              <Keyboard size={12} />
            </button>
          </div>
        </div>

        {/* Billing Table */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2 sm:p-3">
          <BillingTable items={items} onItemsChange={handleItemsChange} />
        </div>

        {/* ── Mobile Payment Bar (lg:hidden) ────────────────────── */}
        <div className="lg:hidden shrink-0 flex flex-col border-t border-slate-200/60 bg-white max-h-[50vh]">
          <BillingHeader
            items={items}
            customerData={customerData}
            customerName={customerName}
            phone={phone}
            onConfirmOrder={handleConfirmOrder}
            isSubmitting={isSubmitting}
            includeGst={includeGst}
            totalAmount={totalAmount}
            gstAmount={gstAmount}
            finalAmount={finalAmount}
            payments={payments}
            onPaymentsChange={setPayments}
          />
        </div>
      </div>

      {/* ── Right Sidebar (full height) ────────────────────────── */}
      <aside className="hidden lg:flex w-[280px] xl:w-[300px] shrink-0 flex-col border-l border-slate-200/60 bg-white">
        <BillingHeader
          items={items}
          customerData={customerData}
          customerName={customerName}
          phone={phone}
          onConfirmOrder={handleConfirmOrder}
          isSubmitting={isSubmitting}
          includeGst={includeGst}
          totalAmount={totalAmount}
          gstAmount={gstAmount}
          finalAmount={finalAmount}
          payments={payments}
          onPaymentsChange={setPayments}
        />
      </aside>

      {/* Customer Creation Modal */}
      <CustomerCreateModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCreated={handleCreateCustomer}
        initialName={newCustomerName}
        isSubmitting={isCreatingCustomer}
      />

      {/* ── Shortcuts Modal ────────────────────────────────────────── */}
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsShortcutsModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xs overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200/60">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                  <Keyboard size={14} />
                </div>
                <h3 className="text-[13px] font-bold text-slate-800">Shortcuts</h3>
              </div>
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2 bg-white">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100/60">
                <span className="text-[11px] font-medium text-slate-600">Add New Row</span>
                <div className="flex gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-500">Alt</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-500">A</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100/60">
                <span className="text-[11px] font-medium text-slate-600">Delete Last Row</span>
                <div className="flex gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-500">Alt</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-500">⌫</kbd>
                </div>
              </div>
            </div>
            <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-md hover:bg-slate-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
