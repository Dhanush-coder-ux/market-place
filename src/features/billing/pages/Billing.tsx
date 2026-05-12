import { useState, useCallback } from "react";
import {
  User, Loader2, CheckCircle2, AlertCircle, Wallet,
} from "lucide-react";

import BillingTable, { createEmptyRow } from "../components/BillingTable";
import BillingHeader from "../components/BillingHeader";
import BillingDetailView from "../components/BillingDetailView";
import Drawer from "@/components/common/Drawer";

import { BillingItem, InvoicePayload, CreateBillingSchema, CustomerData } from "../types";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import CustomerCreateModal from "../components/CustomerCreateModal";

const formatINR = (amount: number, decimals = 2) =>
  amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// ─── Billing Page ─────────────────────────────────────────────────────────────
const Billing = () => {
  const { postData, getData, loading: isSubmitting } = useApi();

  // ── Table State
  const [items, setItems] = useState<BillingItem[]>([createEmptyRow()]);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState<InvoicePayload | null>(null);

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

  // ── Derived Credit Info
  const isCreditExceeded = customerData ? customerData.outstanding >= customerData.creditLimit : false;
  const creditRemaining = customerData ? Math.max(0, customerData.creditLimit - customerData.outstanding) : 0;

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

  const fetchCustomers = useCallback(async (query: string, signal: AbortSignal) => {
    if (!query) return [];
    try {
      const res = await getData(ENDPOINTS.CUSTOMERS, { search: query }, { signal });
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

  // ── Invoice ready → open drawer with payload (don't POST yet)
  const handleInvoiceReady = useCallback((payload: InvoicePayload) => {
    setPendingInvoice(payload);
    setIsOpen(true);
  }, []);

  // ── Confirm Order → POST to Billing API
  const handleConfirmOrder = useCallback(async () => {
    if (!pendingInvoice) return;

    const filledItems = pendingInvoice.items.filter(i => !!i.name);

    const payload: CreateBillingSchema = {
      shop_id: SHOP_ID,
      payment_method: pendingInvoice.paymentMode.toLowerCase(),
      customer_id: pendingInvoice.customer?.id || "walk-in",
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
      // Success — reset billing state
      setIsOpen(false);
      setPendingInvoice(null);
      setItems([createEmptyRow()]);
      setPhone("");
      setCustomerName("");
      setCustomerData(null);
      setWasAutofilled(false);
    }
  }, [pendingInvoice, postData]);

  const handleHoldBill = useCallback(() => {
    console.log("[Billing] Bill held:", items);
    setItems([createEmptyRow()]);
    setPhone("");
    setCustomerName("");
    setIsLoadingCustomer(false);
    setWasAutofilled(false);
  }, [items]);

  const handleClearBill = useCallback(() => {
    setItems([createEmptyRow()]);
  }, []);

  return (
    <div className="flex flex-col lg:h-[calc(100vh-2rem)] gap-4">

      {/* Customer Details Section */}
      <div className="shrink-0 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row gap-6">

        {/* Left: Inputs */}
        <div className="flex-1 flex flex-col gap-4 justify-center">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={15} /> Customer Details
            </h3>
            {isLoadingCustomer && <Loader2 size={14} className="text-indigo-400 animate-spin" />}
            {customerData && !isLoadingCustomer && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={10} /> Verified
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Customer SearchSelect */}
            <div className="w-full">
              <SearchSelect<CustomerData>
                label="Search Customer (Name/Phone)"
                placeholder="Start typing name or phone..."
                fetchOptions={fetchCustomers}
                options={staticCustomers}
                labelKey="name"
                valueKey="id"
                onChange={handleCustomerChange}
                value={customerData?.id}
                allowClear
                className="h-11"
                onCreateNew={(name) => {
                  setNewCustomerName(name);
                  setIsCustomerModalOpen(true);
                }}
                renderOption={(opt) => (
                  <div className="flex flex-col py-1">
                    <span className="font-semibold text-slate-800">{opt.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{opt.phone}</span>
                  </div>
                )}
              />
            </div>
          </div>

        </div>

        {/* Right: Credit Summary */}
        <div className="w-full md:w-[320px] shrink-0">
          {customerData ? (
            <div className={`h-full p-4 rounded-xl border flex flex-col justify-center ${isCreditExceeded ? "bg-red-50/60 border-red-200" : "bg-slate-50 border-slate-200"
              }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet size={12} className="text-slate-400" /> Credit Summary
                </p>
                <span className="text-[10px] font-bold text-slate-400">#{customerData.id}</span>
              </div>

              <div className="mb-3">
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isCreditExceeded ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, (customerData.outstanding / customerData.creditLimit) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-semibold text-slate-500">
                  <span>Out: ₹{formatINR(customerData.outstanding, 0)}</span>
                  <span>Limit: ₹{formatINR(customerData.creditLimit, 0)}</span>
                </div>
              </div>

              {isCreditExceeded ? (
                <div className="flex items-start gap-1.5 text-red-700 bg-red-100/60 p-2 rounded-lg">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" strokeWidth={2.5} />
                  <p className="text-[10px] font-bold leading-tight">Credit limit exceeded. Clear dues to allow credit.</p>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                  <span className="text-slate-600 font-bold">Remaining Credit</span>
                  <span className="font-black tabular-nums text-emerald-600">₹{formatINR(creditRemaining, 0)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center p-4">
              <p className="text-xs text-slate-400 font-medium text-center">Enter a valid phone number to view credit limits.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Split Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden gap-6 pb-4">

        {/* Left: Line-item table */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <BillingTable items={items} onItemsChange={handleItemsChange} />
        </div>

        {/* Right: Invoice Summary & Payment */}
        <div className="w-full lg:w-[380px] shrink-0 lg:h-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <BillingHeader
            items={items}
            customerData={customerData}
            customerName={customerName}
            phone={phone}
            onInvoiceReady={handleInvoiceReady}
            setIsOpen={setIsOpen}
            onHoldBill={handleHoldBill}
            onClearBill={handleClearBill}
          />
        </div>
      </div>

      {/* Customer Creation Modal */}
      <CustomerCreateModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCreated={handleCreateCustomer}
        initialName={newCustomerName}
        isSubmitting={isCreatingCustomer}
      />

      {/* Invoice Review Drawer */}
      <Drawer isOpen={isOpen} title="Review & Confirm Order" onClose={() => setIsOpen(false)}>
        <BillingDetailView
          invoice={pendingInvoice}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirmOrder}
        />
      </Drawer>
    </div>
  );
};

export default Billing;