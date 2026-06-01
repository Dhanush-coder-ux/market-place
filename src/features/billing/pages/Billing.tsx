import { useState, useCallback, useEffect, useMemo } from "react";

import BillingTable from "../components/BillingTable";
import BillingHeader from "../components/BillingHeader";

import { BillingItem, CreateBillingSchema, CustomerData } from "../types";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import AttachCustomerModal from "../components/AttachCustomerModal";
import CustomerCreateModal from "../components/CustomerCreateModal";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import { BillingSuccessModal } from "../components/BillingSuccessModal";

// ─── Billing Page ─────────────────────────────────────────────────────────────
const Billing = () => {
  const { showToast } = useToast();
  const { postData, loading: isSubmitting } = useApi();

  // ── Cart Items State (Initial empty list)
  const [items, setItems] = useState<BillingItem[]>([]);

  // ── Customer State
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);

  // ── Attach/Create Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerCreateOpen, setIsCustomerCreateOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // ── Checkout Success Details State
  const [successDetails, setSuccessDetails] = useState<{
    items: any[];
    payments: { mode: string; amount: number }[];
    totalAmount: number;
    gstAmount: number;
    finalAmount: number;
    customerName: string;
    phone: string;
  } | null>(null);

  // ── Billing Totals
  const { settings } = usePurchaseSettings();
  const includeGst = settings.gstType === "registered";
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const [payments, setPayments] = useState<{ mode: "cash" | "upi" | "credit"; amount: number }[]>([
    { mode: "cash", amount: 0 },
  ]);
  
  const totalAmount = useMemo(() => items.reduce((s, i) => s + (i.tprice || 0), 0), [items]);
  const gstAmount = useMemo(() => {
    if (!includeGst) return 0;
    return round2(
      items.reduce((sum, item) => {
        const itemGstPercent = typeof item.gst === "number" ? item.gst : 18;
        return sum + (item.tprice * itemGstPercent) / 100;
      }, 0)
    );
  }, [items, includeGst]);
  const finalAmount = useMemo(() => includeGst ? round2(totalAmount + gstAmount) : totalAmount, [includeGst, totalAmount, gstAmount]);

  // Sync single-mode payment amount when total changes
  useEffect(() => {
    setPayments(prev => prev.length === 1 ? [{ ...prev[0], amount: finalAmount }] : prev);
  }, [finalAmount]);

  // ── Handlers
  const handleItemsChange = useCallback((next: BillingItem[]) => setItems(next), []);

  const resetCustomer = useCallback(() => {
    setCustomerData(null);
    setCustomerName("");
    setPhone("");
  }, []);

  // ── Prevent Accidental Tab/Browser Close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasItems = items.some(i => i.name && i.qty > 0);
      if (hasItems) {
        const message = "You have a pending bill. Are you sure you want to leave?";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [items]);

  // F4 shortcut to open customer attachment modal
  useEffect(() => {
    const handleF4Key = (e: KeyboardEvent) => {
      if (e.key === "F4") {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleF4Key);
    return () => window.removeEventListener("keydown", handleF4Key);
  }, []);

  // Handle Quick Create customer submit in modal
  const handleCreateCustomer = async (customerValues: any) => {
    try {
      setIsCreatingCustomer(true);
      const res = await postData(ENDPOINTS.CUSTOMERS, {
        ...customerValues,
        shop_id: SHOP_ID,
      });

      const isSuccess = res?.success || res?.detail?.success;
      const responseData = Array.isArray(res?.data) ? res.data[0] : res?.data;

      if (isSuccess && responseData) {
        const newCustomer: CustomerData = {
          id: responseData.id,
          name: responseData.name,
          phone: responseData.mobile_number || responseData.phone || "",
          outstanding: responseData.outstanding || 0,
          creditLimit: responseData.credit_limit || 0,
          totalSpent: responseData.total_spent || 0,
        };

        setCustomerData(newCustomer);
        setCustomerName(newCustomer.name);
        setPhone(newCustomer.phone);
        setIsCustomerModalOpen(false);
        setIsCustomerCreateOpen(false);
        showToast("Customer registered and linked successfully!", "success");
      } else {
        showToast("Failed to register customer", "error");
      }
    } catch (err) {
      console.error("Failed to create customer:", err);
      showToast("An error occurred registering customer", "error");
    } finally {
      setIsCreatingCustomer(false);
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
      setSuccessDetails({
        items: [...items],
        payments: [...paymentsArg],
        totalAmount,
        gstAmount,
        finalAmount,
        customerName: customerName || "Walk-in Customer",
        phone: phone || "",
      });
      showToast("Order confirmed successfully", "success");
    }
  }, [items, customerData, postData, showToast, totalAmount, gstAmount, finalAmount, customerName, phone]);

  const handleNextBill = useCallback(() => {
    setItems([]);
    setPhone("");
    setCustomerName("");
    setCustomerData(null);
    setPayments([{ mode: "cash", amount: 0 }]);
    setSuccessDetails(null);
  }, []);

  return (
    <div className="flex-1 flex min-h-0 bg-slate-50/80 overflow-hidden h-full">

      {/* ── Left Panel (Global Search + Table list card) ──────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3.5 gap-4">
        {/* Billing Table */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <BillingTable items={items} onItemsChange={handleItemsChange} />
        </div>

        {/* ── Mobile Payment Bar (lg:hidden) ────────────────────── */}
        <div className="lg:hidden shrink-0 flex flex-col border-t border-slate-200 bg-white max-h-[50vh] rounded-2xl overflow-hidden shadow-lg p-2">
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
            onAddCustomerClick={() => setIsCustomerModalOpen(true)}
            onDetachCustomer={resetCustomer}
          />
        </div>
      </div>

      {/* ── Right Sidebar (full height) ────────────────────────── */}
      <aside className="hidden lg:flex w-[300px] xl:w-[320px] shrink-0 flex-col border-l border-slate-200 bg-white">
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
          onAddCustomerClick={() => setIsCustomerModalOpen(true)}
          onDetachCustomer={resetCustomer}
        />
      </aside>

      {/* Attach Customer Modal */}
      <AttachCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={(customer) => {
          setCustomerData(customer);
          setCustomerName(customer.name);
          setPhone(customer.phone);
        }}
        onOpenCreateCustomer={() => {}}
      />

      {/* Checkout Success Modal */}
      <BillingSuccessModal
        isOpen={!!successDetails}
        details={successDetails}
        onClose={() => setSuccessDetails(null)}
        onNextBill={handleNextBill}
      />
    </div>
  );
};

export default Billing;
