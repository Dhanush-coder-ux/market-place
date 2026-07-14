import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import BillingTable from "../components/BillingTable";
import BillingHeader from "../components/BillingHeader";

import { BillingItem, CustomerData } from "../types";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { apiClient } from "@/services/api/apiClient";
import AttachCustomerModal from "../components/AttachCustomerModal";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import { BillingSuccessModal } from "../components/BillingSuccessModal";
import { NavigationBlocker } from "@/components/common/NavigationBlocker";

// ─── Billing Page ─────────────────────────────────────────────────────────────
const Billing = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { loading: isSubmitting } = useApi();

  // ── Cart Session (Order Service)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cartInitialized, setCartInitialized] = useState(false);
  const sessionDoneRef = useRef(false); // true after submit or explicit cancel

  // ── Cart Items State (Initial empty list)
  const [items, setItems] = useState<BillingItem[]>([]);

  // ── Customer State
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);

  // ── Attach/Create Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

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
  const finalAmount = useMemo(() => {
    const rawVal = includeGst ? totalAmount + gstAmount : totalAmount;
    return rawVal < 0.01 ? Number(rawVal.toFixed(6)) : round2(rawVal);
  }, [includeGst, totalAmount, gstAmount]);

  // Sync single-mode payment amount when total changes
  useEffect(() => {
    setPayments(prev => prev.length === 1 ? [{ ...prev[0], amount: finalAmount }] : prev);
  }, [finalAmount]);

  // ─── Initialize Order Cart Session on mount ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const initCart = async () => {
      try {
        const res = await apiClient.post(`${ENDPOINTS.ORDER_CART}/init`, {});
        if (!cancelled) {
          const sid = res?.data?.session_id;
          if (sid) {
            setSessionId(sid);
            setCartInitialized(true);
          }
        }
      } catch (e) {
        console.error("Failed to init order cart session", e);
        if (!cancelled) showToast("Failed to initialize cart session", "error");
      }
    };
    initCart();
    return () => { cancelled = true; };
  }, []);

  // ─── Cancel session on SPA navigation away (unmount) ──────────────────────
  useEffect(() => {
    return () => {
      if (sessionId && !sessionDoneRef.current) {
        apiClient.post(`${ENDPOINTS.ORDER_CART}/cancel`, { session_id: sessionId }).catch(() => {});
      }
    };
  }, [sessionId]);

  // ─── Cancel session on browser tab close ──────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (sessionId && !sessionDoneRef.current) {
        apiClient.post(`${ENDPOINTS.ORDER_CART}/cancel`, { session_id: sessionId }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [sessionId]);

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

  // ── Add item to Order Cart (called on every item change from BillingTable)
  // We add items to the cart when confirmed at checkout, not on every UI change.
  // (Items are already tracked locally in `items` state)

  // ── Confirm Order → Order Service Cart flow
  const handleConfirmOrder = useCallback(async (paymentsArg: { mode: string, amount: number }[], _includeGst: boolean, _status: string) => {
    const filledItems = items.filter(i => !!i.name);
    if (filledItems.length === 0) return;

    if (!sessionId) {
      showToast("Cart session not ready. Please wait a moment.", "error");
      return;
    }

    try {
      const mapSerialsToInfos = (item: any) => {
        const serialNames = item.serialNumbers || [];
        if (serialNames.length === 0) return null;

        const prod = item._product || {};
        let serialObjects: any[] = [];

        const getSerialObjects = (infos: any): any[] => {
          if (Array.isArray(infos)) return infos;
          return [];
        };

        serialObjects = [...serialObjects, ...getSerialObjects(prod.serialno_infos)];

        let variantsSource = prod.variants || prod.variant_infos || prod.varients || prod.combinations;
        if (variantsSource && typeof variantsSource === 'object' && !Array.isArray(variantsSource)) {
          variantsSource = Object.values(variantsSource);
        }
        if (Array.isArray(variantsSource)) {
          const matchedVariant = variantsSource.find((v: any) => v.id === item.variantId);
          if (matchedVariant) {
            serialObjects = [...serialObjects, ...getSerialObjects(matchedVariant.serialno_infos)];
            if (item.batchId && matchedVariant.batch_infos) {
              const matchedBatch = matchedVariant.batch_infos.find((b: any) => b.id === item.batchId);
              if (matchedBatch) {
                serialObjects = [...serialObjects, ...getSerialObjects(matchedBatch.serialno_infos)];
              }
            }
          }
        }

        if (item.batchId && prod.batch_infos) {
          const matchedBatch = prod.batch_infos.find((b: any) => b.id === item.batchId);
          if (matchedBatch) {
            serialObjects = [...serialObjects, ...getSerialObjects(matchedBatch.serialno_infos)];
          }
        }

        return serialNames.map((sn: string) => {
          const foundObj = serialObjects.find(obj => obj && (obj.name === sn || obj.serial === sn));
          return {
            id: foundObj?.id || item.serialnoId || "",
            name: sn
          };
        });
      };

      // ── Step 1: Reserve all items in the Order Cart ─────────────────────────
      for (const item of filledItems) {
        await apiClient.post(`${ENDPOINTS.ORDER_CART}/add`, {
          session_id: sessionId,
          shop_id: SHOP_ID,
          product_id: item.inventoryId || "",
          variant_id: item.variantId || null,
          batch_id: item.batchId || null,
          serialno_infos: mapSerialsToInfos(item),
          qty: item.qty,
          unit: item.selectedUnit || null,
        });
      }

      // ── Step 2: Build payment_infos for the order ───────────────────────────
      const paymentInfos = paymentsArg.reduce((acc, p) => {
        const method = p.mode.toUpperCase();
        acc[method] = (acc[method] || 0) + p.amount;
        return acc;
      }, {} as Record<string, number>);

      // ── Step 3: Build calculation_infos ────────────────────────────────────
      const calcInfos = {
        subtotal: totalAmount,
        gst_amount: gstAmount,
        total: finalAmount,
        include_gst: includeGst,
        items: filledItems.map(i => ({
          product_id: i.inventoryId,
          name: i.name,
          qty: i.qty,
          price: i.price,
          total: i.tprice,
          gst: i.gst ?? 0,
        })),
      };

      // ── Step 4: POST /orders to confirm the order ───────────────────────────
      const orderPayload = {
        shop_id: SHOP_ID,
        session_id: sessionId,
        customer_id: customerData?.id || "",
        status: "COMPLETED",
        origin: "OFFLINE",
        type: "IN-STORE",
        calculation_infos: calcInfos,
        charges_infos: {},
        payment_infos: paymentInfos,
        additional_infos: {
          customer_name: customerName || "Walk-in Customer",
          customer_phone: phone || "",
        },
      };

      const res = await apiClient.post(ENDPOINTS.ORDERS, orderPayload);
      if (res) {
        // Mark session as done so unmount cleanup doesn't cancel it
        sessionDoneRef.current = true;

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
    } catch (err: any) {
      console.error("Order confirmation failed:", err);
      showToast(err?.message || "Failed to confirm order", "error");
    }
  }, [items, customerData, sessionId, showToast, totalAmount, gstAmount, finalAmount, customerName, phone, includeGst]);

  const handleNextBill = useCallback(async () => {
    setItems([]);
    setPhone("");
    setCustomerName("");
    setCustomerData(null);
    setPayments([{ mode: "cash", amount: 0 }]);
    setSuccessDetails(null);
    sessionDoneRef.current = false;

    // Start a fresh cart session for the next bill
    try {
      const res = await apiClient.post(`${ENDPOINTS.ORDER_CART}/init`, {});
      const sid = res?.data?.session_id;
      if (sid) {
        setSessionId(sid);
        setCartInitialized(true);
      }
    } catch (e) {
      console.error("Failed to re-init cart session", e);
    }
  }, []);

  const hasItemsForBlocker = items.some(i => i.name && i.qty > 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/80 overflow-hidden h-screen">
      <div className="flex-1 flex min-h-0 bg-slate-50/80 overflow-hidden">
        <NavigationBlocker shouldBlock={hasItemsForBlocker} />

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
              isSubmitting={isSubmitting || !cartInitialized}
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
        <aside className="hidden lg:flex w-[360px] xl:w-[400px] shrink-0 flex-col border-l border-slate-200 bg-white">
          <BillingHeader
            items={items}
            customerData={customerData}
            customerName={customerName}
            phone={phone}
            onConfirmOrder={handleConfirmOrder}
            isSubmitting={isSubmitting || !cartInitialized}
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
        />

        {/* Checkout Success Modal */}
        <BillingSuccessModal
          isOpen={!!successDetails}
          details={successDetails}
          onClose={() => setSuccessDetails(null)}
          onNextBill={handleNextBill}
        />
      </div>

      {/* ── Small Fixed Branded Bottombar ── */}
      <div className="shrink-0 h-7 bg-white border-t border-slate-200/80 flex items-center justify-center text-[10px] text-slate-400 select-none">
        <span>Powered by </span>
        <button 
          onClick={() => navigate("/")} 
          className="ml-1 font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
        >
          marketplace
        </button>
      </div>
    </div>
  );
};

export default Billing;
