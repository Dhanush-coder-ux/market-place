import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, ShieldCheck, CreditCard, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { PlanItem, AddonItem } from "../types";
import { subscriptionApi } from "@/services/api/subscription";
import { useToast } from "@/context/ToastContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  selectedPlan: PlanItem;
  billingCycle: "monthly" | "annual";
  selectedAddons: Record<string, number>;
  addonsCatalog: AddonItem[];
  onSuccess: () => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  onClose,
  shopId,
  selectedPlan,
  billingCycle,
  selectedAddons,
  addonsCatalog,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const basePrice = billingCycle === "annual" ? selectedPlan.annual_price : selectedPlan.monthly_price;
  
  const activeAddonsList = Object.entries(selectedAddons)
    .filter(([_, qty]) => qty > 0)
    .map(([addonId, qty]) => {
      const addon = addonsCatalog.find((a) => a.id === addonId);
      const pricePerUnit = addon?.price || 0;
      const computedPrice = addon?.billing_cycle === "monthly" && billingCycle === "annual"
        ? pricePerUnit * 10 * qty
        : pricePerUnit * qty;
      return {
        addonId,
        name: addon?.name || addonId,
        quantity: qty,
        price: computedPrice,
        cycle: addon?.billing_cycle || "monthly",
      };
    });

  const addonsTotal = activeAddonsList.reduce((acc, item) => acc + item.price, 0);
  const grandTotal = basePrice + addonsTotal;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Create order on backend
      const orderPayload = {
        shop_id: shopId,
        plan_id: selectedPlan.id,
        billing_cycle: billingCycle,
        addons: activeAddonsList.map((a) => ({ addon_id: a.addonId, quantity: a.quantity })),
      };

      const orderData = await subscriptionApi.createRazorpayOrder(orderPayload);
      const scriptLoaded = await loadRazorpayScript();

      const userEmail = localStorage.getItem("user_email") || "owner@marketplace.io";
      const userName = localStorage.getItem("user_name") || "Shop Owner";

      // 2. Handle Mock Mode or Real Razorpay Gateway
      if (orderData.mock_payment === true) {
        // Simulated Mock Payment Mode
        const mockVerifyPayload = {
          shop_id: shopId,
          plan_id: selectedPlan.id,
          billing_cycle: billingCycle,
          addons: activeAddonsList.map((a) => ({ addon_id: a.addonId, quantity: a.quantity })),
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_sig_valid",
        };

        await subscriptionApi.verifyPayment(mockVerifyPayload);
        setPaymentSuccess(true);
        showToast("Payment simulated successfully! Plan is now active.", "success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
        setLoading(false);
        return;
      }

      // Real Razorpay Mode (MOCK_PAYMENT is false)
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout script. Please check your network connection.");
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount_in_paise,
        currency: orderData.currency || "INR",
        name: "Hyperlocal Inventory",
        description: `${selectedPlan.name} Subscription (${billingCycle})`,
        order_id: orderData.order_id,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#2563eb",
        },
        handler: async (response: any) => {
          try {
            await subscriptionApi.verifyPayment({
              shop_id: shopId,
              plan_id: selectedPlan.id,
              billing_cycle: billingCycle,
              addons: activeAddonsList.map((a) => ({ addon_id: a.addonId, quantity: a.quantity })),
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPaymentSuccess(true);
            showToast("Payment verified! Subscription activated successfully.", "success");
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1800);
          } catch (err: any) {
            setErrorMessage(err?.message || "Payment signature verification failed");
            showToast("Payment verification failed", "error");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setErrorMessage(response?.error?.description || "Payment failed at Razorpay.");
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Could not complete payment request. Please try again.");
      showToast("Order initiation failed", "error");
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !loading && onClose()} />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wider uppercase">
              Razorpay Checkout
            </span>
            <span className="text-white/70 text-xs">• 256-Bit SSL Encrypted</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Complete Subscription</h2>
          <p className="text-blue-100 text-xs mt-1">
            Upgrading shop to <strong className="text-white">{selectedPlan.name}</strong> ({billingCycle})
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {paymentSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
                <CheckCircle size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Payment Successful!</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Your <strong>{selectedPlan.name}</strong> plan is now active. All limits and add-ons have been updated.
              </p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Order Breakdown */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-sm pb-2.5 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{selectedPlan.name} Plan</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold uppercase">
                      {billingCycle}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800">₹{basePrice.toLocaleString()}</span>
                </div>

                {activeAddonsList.length > 0 && (
                  <div className="space-y-2 py-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Add-ons</p>
                    {activeAddonsList.map((addon) => (
                      <div key={addon.addonId} className="flex items-center justify-between text-xs text-slate-600">
                        <span>
                          {addon.name} {addon.quantity > 1 ? `(x${addon.quantity})` : ""}
                        </span>
                        <span className="font-semibold text-slate-700">+₹{addon.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Total Payable Amount</span>
                    <p className="text-[10px] text-slate-400">All inclusive of applicable taxes</p>
                  </div>
                  <span className="text-xl font-black text-blue-600">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Features Guarantee list */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                  <span>Instant plan upgrade</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-500 shrink-0" />
                  <span>Cancel or switch anytime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard size={14} className="text-slate-400 shrink-0" />
                  <span>UPI, Cards, NetBanking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  <span>Invoice & GST ready</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={loading}
                  className="flex-[2] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      <span>Proceed to Pay ₹{grandTotal.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
