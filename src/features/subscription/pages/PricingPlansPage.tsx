import React, { useState, useEffect } from "react";
import { Check, Sparkles, Plus, Minus, ArrowRight, Store, Users, Database, Award, Loader2 } from "lucide-react";
import { PlanItem, SubscriptionData, SubscriptionCatalogResponse } from "../types";
import { subscriptionApi } from "@/services/api/subscription";
import { RazorpayCheckoutModal } from "../components/RazorpayCheckoutModal";
import { useToast } from "@/context/ToastContext";

export const PricingPlansPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [catalog, setCatalog] = useState<SubscriptionCatalogResponse | null>(null);
  const [currentSub, setCurrentSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialLoading, setTrialLoading] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  
  // Checkout Modal
  const [checkoutPlan, setCheckoutPlan] = useState<PlanItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const shopId = localStorage.getItem("shop_id") || "default_shop";
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, subRes] = await Promise.all([
        subscriptionApi.getPlans().catch(() => null),
        subscriptionApi.getCurrentSubscription(shopId).catch(() => null),
      ]);

      if (catRes) {
        setCatalog(catRes);
      }
      if (subRes) {
        setCurrentSub(subRes);
      }
    } catch (err) {
      console.error("Failed to load subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const handleStartTrial = async (planId: string = "basic") => {
    setTrialLoading(true);
    try {
      const res = await subscriptionApi.startTrial(shopId, planId);
      setCurrentSub(res);
      showToast("14-Day Free Trial started successfully! Enjoy all premium features.", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to start trial", "error");
    } finally {
      setTrialLoading(false);
    }
  };

  const handleOpenCheckout = (plan: PlanItem) => {
    setCheckoutPlan(plan);
    setIsCheckoutOpen(true);
  };

  const handleAddonChange = (addonId: string, delta: number) => {
    setSelectedAddons((prev) => {
      const current = prev[addonId] || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [addonId]: updated };
    });
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading pricing plans & features...</p>
      </div>
    );
  }

  const plans = catalog?.plans || [];
  const addons = catalog?.addons || [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 pb-20 animate-in fade-in duration-300" style={{ fontFamily: "Inter, sans-serif" }}>
      
      {/* ── Top Header Section (Matching Slide 1) ── */}
      <div className="text-center pt-10 pb-8 px-4 max-w-4xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Simple pricing. No commission. Grow your business.
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto">
          Choose the plan that fits your business. Upgrade or cancel anytime.
        </p>

        {/* Free trial badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-bold shadow-xs">
          <Check size={16} className="text-emerald-600 stroke-[3]" />
          <span>14-day free trial</span>
          <span className="text-emerald-400">•</span>
          <span>No card required</span>
        </div>

        {/* Billing cycle toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-bold cursor-pointer ${billingCycle === "monthly" ? "text-blue-600" : "text-slate-400"}`} onClick={() => setBillingCycle("monthly")}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
            className="w-12 h-6 rounded-full bg-slate-200 p-0.5 relative transition-colors focus:outline-none"
          >
            <div className={`w-5 h-5 rounded-full bg-blue-600 transition-transform ${billingCycle === "annual" ? "translate-x-6" : "translate-x-0"}`} />
          </button>
          <span className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer ${billingCycle === "annual" ? "text-blue-600" : "text-slate-400"}`} onClick={() => setBillingCycle("annual")}>
            Annual Billing
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase">
              Save 17%
            </span>
          </span>
        </div>
      </div>

      {/* ── Pricing Tiers Grid (Slide 1) ── */}
      <div className="max-w-6xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isPopular = plan.badge === "MOST POPULAR" || plan.id === "basic";
            const price = billingCycle === "annual" ? plan.annual_price : plan.monthly_price;
            const isCurrentPlan = currentSub?.plan_id === plan.id && currentSub?.status === "active";

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl bg-white border flex flex-col transition-all duration-200 ${
                  isPopular
                    ? "border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20 md:-translate-y-2 z-10"
                    : "border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300"
                }`}
              >
                {/* Most Popular Ribbon */}
                {isPopular && (
                  <div className="bg-blue-600 text-white text-[11px] font-extrabold tracking-widest text-center py-1.5 rounded-t-[22px] uppercase">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  {/* Plan Name & Desc */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                    <p className="text-xs text-slate-500 mt-1 min-h-[34px] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900">
                        ₹{price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        /{billingCycle === "annual" ? "year" : "month"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {billingCycle === "annual" ? "Billed annually" : "Billed monthly"}
                    </p>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      if (!currentSub?.has_subscription && plan.id === "basic") {
                        handleStartTrial(plan.id);
                      } else {
                        handleOpenCheckout(plan);
                      }
                    }}
                    disabled={isCurrentPlan || trialLoading}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mb-6 ${
                      isPopular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 active:scale-[0.99]"
                        : "bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 active:scale-[0.99]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isCurrentPlan ? (
                      "Current Active Plan"
                    ) : (
                      <>
                        <span>{plan.button_text}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  {/* Included features list */}
                  <div className="border-t border-slate-100 pt-5 flex-1 flex flex-col">
                    <p className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase mb-3">
                      {plan.id === "digital_store"
                        ? "WHAT'S INCLUDED"
                        : plan.id === "basic"
                        ? "EVERYTHING IN DIGITAL STORE, PLUS"
                        : "EVERYTHING IN BASIC, PLUS"}
                    </p>
                    <ul className="space-y-2.5 flex-1">
                      {plan.included_features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-tight">
                          <Check size={14} className="text-emerald-500 shrink-0 mt-0.5 stroke-[2.5]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Optional Add-ons Section (Matching Slide 2) ── */}
      <div className="max-w-6xl mx-auto px-4 w-full mt-16 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Optional add-ons</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Extend any plan as the business grows. Billed alongside your subscription.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {addons.map((addon) => {
            const count = selectedAddons[addon.id] || 0;
            const iconsMap: Record<string, any> = {
              extra_store: Store,
              extra_user: Users,
              sku_expansion: Database,
              verified_badge: Award,
            };
            const Icon = iconsMap[addon.id] || Sparkles;

            return (
              <div
                key={addon.id}
                className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                  count > 0 ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md" : "border-slate-200/80 shadow-xs hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-800">{addon.name}</span>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600">
                      <Icon size={16} />
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-xl font-black text-blue-600">
                      ₹{addon.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium"> / {addon.billing_cycle}</span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed min-h-[48px]">
                    {addon.description}
                  </p>
                </div>

                {/* Add-on selector controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {addon.id === "verified_badge" || addon.id === "sku_expansion" ? (
                    <button
                      onClick={() => handleAddonChange(addon.id, count > 0 ? -1 : 1)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        count > 0 ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count > 0 ? "Selected (1)" : "+ Add Add-on"}
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-slate-500 font-semibold">Qty:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddonChange(addon.id, -1)}
                          disabled={count === 0}
                          className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-slate-800">{count}</span>
                        <button
                          onClick={() => handleAddonChange(addon.id, 1)}
                          className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 flex items-center justify-center text-blue-700 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Marketplace Policy Banner (Slide 2 callout) ── */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3 shadow-xs">
          <div className="w-6 h-6 rounded-md bg-amber-200/60 flex items-center justify-center shrink-0 mt-0.5 text-amber-800 font-black">
            !
          </div>
          <div>
            <strong className="font-bold text-amber-950">Marketplace:</strong> No commission on retailer sales. Customers see the retailer's selling price; applicable delivery or payment-processing costs are handled separately according to the platform's payment and delivery terms.
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutPlan && (
        <RazorpayCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          shopId={shopId}
          selectedPlan={checkoutPlan}
          billingCycle={billingCycle}
          selectedAddons={selectedAddons}
          addonsCatalog={addons}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
export default PricingPlansPage;
