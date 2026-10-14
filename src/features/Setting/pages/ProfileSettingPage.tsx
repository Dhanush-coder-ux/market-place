import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  ListTree,
  ShoppingBag,
  Percent,
  Activity,
  Store,
  AlertTriangle,
  X,
  LayoutTemplate,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Check,
  ShieldCheck,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { ActivityLogPage } from "@/features/Setting/pages/ActivityLogPage";
import { CustomListSettings } from "@/features/Setting/pages/CustomListSettings";
import { ShopProfileForm } from "@/features/Setting/pages/ShopProfileForm";
import { BusinessCategorySettings } from "@/features/Setting/pages/BusinessCategorySettings";
import PricingPlansPage from "@/features/subscription/pages/PricingPlansPage";
import { useSearchParams } from "react-router-dom";
import { InvoiceTemplateSettings } from "@/features/Setting/pages/InvoiceTemplateSettings";
import { ThemeSwitcher } from "@/features/Setting/components/ThemeSwitcher";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import { shopApi } from "@/services/api/shop";
import { SHOP_ID, getShopId } from "@/services/endpoints";
import { useToast } from "@/context/ToastContext";

// Standard Indian 15-character GSTIN regex format:
// 2 digits state code + 10 alphanumeric PAN chars + 1 entity code + 1 check/assigned char + 1 checksum char
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[A-Z0-9]{1}[0-9A-Z]{1}$/;

// ─── Menu config ─────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  {
    id: "shopprofile",
    label: "Shop Profile",
    icon: Store,
    description: "Update shop details",
    accent: "blue",
  },
  {
    id: "dropdowns",
    label: "Dropdown Settings",
    icon: ListTree,
    description: "Categories & units",
    accent: "violet",
  },
  {
    id: "purchasetypes",
    label: "Purchase Modules",
    icon: ShoppingBag,
    description: "Enable purchase types",
    accent: "emerald",
  },
  {
    id: "gst",
    label: "GST Configuration",
    icon: Percent,
    description: "Registered / Non-registered",
    accent: "amber",
  },
  {
    id: "templates",
    label: "Invoice Templates",
    icon: LayoutTemplate,
    description: "Choose invoice design",
    accent: "blue",
  },
  {
    id: "activity",
    label: "Activity Log",
    icon: Activity,
    description: "System audit trail",
    accent: "rose",
  },
  {
    id: "subscription",
    label: "Plans & Billing",
    icon: CreditCard,
    description: "Subscription, limits & Razorpay payments",
    accent: "blue",
  },
];

const accentClasses: Record<string, { icon: string; badge: string }> = {
  blue: { icon: "bg-blue-50    text-blue-600", badge: "bg-blue-100    text-blue-700" },
  violet: { icon: "bg-violet-50  text-violet-600", badge: "bg-violet-100  text-violet-700" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
  amber: { icon: "bg-amber-50   text-amber-600", badge: "bg-amber-100   text-amber-700" },
  rose: { icon: "bg-rose-50    text-rose-600", badge: "bg-rose-100    text-rose-700" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ProfileSettingsPage = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "shopprofile";
  const [activeTab, setActiveTab] = useState(initialTab);

  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  const { settings, setGstType } = usePurchaseSettings();
  const { showToast } = useToast();
  const [gstNumber, setGstNumber] = useState<string>("");

  // ── GST downgrade confirmation dialog state ──────────────────────────────
  const [showGstConfirm, setShowGstConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [gstConfirmLoading, setGstConfirmLoading] = useState(false);

  // ── GST switch to registered (GSTIN entry) dialog state ───────────────────
  const [showGstRegisterModal, setShowGstRegisterModal] = useState(false);
  const [gstInput, setGstInput] = useState("");
  const [gstInputError, setGstInputError] = useState("");
  const [gstRegisterLoading, setGstRegisterLoading] = useState(false);
  const [isEditingGstNumber, setIsEditingGstNumber] = useState(false);

  React.useEffect(() => {
    // Sync GST setting with backend when Settings page is opened
    const activeShopId = getShopId() || SHOP_ID;
    if (!activeShopId || activeShopId === "string") return;

    shopApi.getShopById(activeShopId).then((res) => {
      const shop = res?.data ?? res;
      if (shop && shop.business_infos?.gst_infos) {
        setGstType(shop.business_infos.gst_infos.registered ? "registered" : "non-registered");
        setGstNumber(shop.business_infos.gst_infos.number || "");
      }
    }).catch((err) => {
      console.error("Failed to sync initial GST settings", err);
    });
  }, [setGstType]);

  const handleGstInputChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    setGstInput(clean);
    if (!clean) {
      setGstInputError("GSTIN is required to register as a GST entity");
    } else if (clean.length < 15) {
      setGstInputError(`GSTIN must be 15 characters (currently ${clean.length}/15)`);
    } else if (!GSTIN_REGEX.test(clean)) {
      setGstInputError("Invalid GSTIN structure. Expected format: 2 state digits + 10 PAN chars + entity code + Z + checksum");
    } else {
      setGstInputError("");
    }
  };

  const handleGstChange = (value: "registered" | "non-registered") => {
    if (value === "non-registered") {
      // Switching to non-registered is a high-impact, irreversible-feeling action —
      // require explicit confirmation before saving.
      if (settings.gstType === "registered") {
        setConfirmInput("");
        setShowGstConfirm(true);
      }
      return;
    }

    // Switching from non-GST to GST registration or editing GSTIN
    if (value === "registered") {
      const initialVal = gstNumber || "";
      setGstInput(initialVal);
      setIsEditingGstNumber(settings.gstType === "registered" && !!gstNumber);
      if (initialVal && initialVal.length === 15 && GSTIN_REGEX.test(initialVal)) {
        setGstInputError("");
      } else if (initialVal) {
        setGstInputError(`GSTIN must be 15 characters (currently ${initialVal.length}/15)`);
      } else {
        setGstInputError("");
      }
      setShowGstRegisterModal(true);
    }
  };

  const applyGstChange = async (
    value: "registered" | "non-registered",
    newGstNumber?: string
  ) => {
    const isRegistering = value === "registered";
    if (isRegistering) {
      setGstRegisterLoading(true);
    } else {
      setGstConfirmLoading(true);
    }

    try {
      const activeShopId = getShopId() || SHOP_ID;
      const shopRes = await shopApi.getShopById(activeShopId);
      const shop = shopRes?.data ?? shopRes;
      if (shop) {
        const finalNumber = isRegistering
          ? (newGstNumber ?? gstNumber ?? "").trim().toUpperCase()
          : undefined;

        const currentBusinessInfos = shop.business_infos || {};
        const payload: Record<string, any> = {
          id: activeShopId,
          business_infos: {
            ...currentBusinessInfos,
            gst_infos: {
              registered: isRegistering,
              ...(isRegistering && finalNumber ? { number: finalNumber } : {}),
            },
          },
        };

        await shopApi.updateShop(payload);

        setGstType(value);
        if (isRegistering) {
          if (finalNumber) setGstNumber(finalNumber);
          setShowGstRegisterModal(false);
          showToast(
            isEditingGstNumber
              ? "GSTIN number updated successfully"
              : "GST registration enabled successfully",
            "success"
          );
        } else {
          setGstNumber("");
          setShowGstConfirm(false);
          showToast("Switched to Non-GST configuration successfully", "success");
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "Failed to sync GST configuration with backend", "error");
    } finally {
      setGstRegisterLoading(false);
      setGstConfirmLoading(false);
    }
  };

  const activeItem = MENU_ITEMS.find((i) => i.id === activeTab);

  // ── Content panels ──────────────────────────────────────────────────────────

  const renderContent = () => {
    const wrapper = (children: React.ReactNode) => (
      <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full">
        {children}
      </div>
    );

    switch (activeTab) {
      case "subscription":
        return wrapper(<PricingPlansPage isEmbedded={true} />);

      case "theme":
        return wrapper(<ThemeSwitcher />);

      case "templates":
        return wrapper(<InvoiceTemplateSettings />);

      case "shopprofile":
        return <ShopProfileForm />;

      case "dropdowns":
        return wrapper(
          <div className="space-y-5">
            <BusinessCategorySettings />
            <CustomListSettings type="categories" />
            <CustomListSettings type="units" />
          </div>
        );

      case "activity":
        return wrapper(<ActivityLogPage />);

      case "purchasetypes":
        return wrapper(
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-slate-50/80 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ShoppingBag size={17} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Purchase Type Configurations
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Enable or disable specific purchase flows across your system.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3 max-w-2xl">
              {/* Coming Soon row */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 opacity-60">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">
                      PO-GRN (Goods Receipt Note)
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 rounded-full uppercase tracking-widest">
                      Soon
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Purchase Order to Goods Receipt Note workflow.
                  </p>
                </div>
                <Switch checked={false} disabled />
              </div>

              {/* Production Entry row - Soon */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-400">
                      Production Entry
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 rounded-full uppercase tracking-widest">
                      Soon
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Internal production entry and manufacturing item consumption.
                  </p>
                </div>
                <Switch checked={false} disabled />
              </div>
            </div>
          </div>
        );

      case "gst":
        return wrapper(
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-slate-50/80 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Percent size={17} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    GST Registration Configuration
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Configure whether your business is a registered GST entity.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    value: "registered",
                    label: "GST Registered Entity",
                    desc: "Enable if you have a valid GSTIN. Product GST rates will be calculated and printed on invoices.",
                  },
                  {
                    value: "non-registered",
                    label: "Non-GST Registered",
                    desc: "Enable if you are not a GST registered entity. Taxes will be excluded from billing invoices.",
                  },
                ].map((opt) => {
                  const isActive = settings.gstType === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleGstChange(opt.value as any)}
                      className={`flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isActive
                          ? opt.value === "non-registered"
                            ? "border-amber-400 bg-amber-50/30 ring-4 ring-amber-500/5"
                            : "border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/5"
                          : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">
                            {opt.label}
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${isActive
                              ? opt.value === "non-registered"
                                ? "border-amber-500 bg-amber-500"
                                : "border-blue-500 bg-blue-500"
                              : "border-slate-300"
                            }`}
                        >
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">{opt.desc}</p>

                      {opt.value === "registered" && (
                        <div className="mt-auto pt-3 border-t border-slate-100">
                          {gstNumber ? (
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Saved GSTIN</span>
                                <span className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/50 mt-0.5 inline-block">
                                  {gstNumber}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGstInput(gstNumber);
                                  setGstInputError("");
                                  setIsEditingGstNumber(true);
                                  setShowGstRegisterModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 cursor-pointer"
                              >
                                <Edit2 size={11} />
                                Edit GSTIN
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                Click to enter GSTIN
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status info banner */}
              {settings.gstType === "registered" ? (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex gap-3">
                  <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-900">
                      GST Billing Active {gstNumber ? `(${gstNumber})` : ""}
                    </p>
                    <p className="text-[11px] text-blue-700 leading-relaxed mt-0.5">
                      POS invoices and digital store orders will calculate tax breakdowns (CGST, SGST, IGST).
                      Your GSTIN will be printed on invoices and customer receipts.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex gap-3">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900">
                      Non-GST Mode Active
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Taxes are excluded from billing calculations. Invoices are generated as
                      standard commercial bills without tax line items. To enable GST, select GST Registered Entity above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300 min-h-[400px]">
            {activeItem && (
              <>
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${accentClasses[activeItem.accent].icon
                    }`}
                >
                  <activeItem.icon size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeItem.label}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
                  This section is currently under construction.
                </p>
              </>
            )}
          </div>
        );
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-400">


      <div className="flex flex-col gap-6 flex-1 min-h-0">
        {/* ── Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 px-2 shrink-0 custom-scrollbar w-full border-b border-slate-100">
          {MENU_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 text-[13px] font-bold whitespace-nowrap shrink-0 transition-all ${isActive
                  ? ""
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                style={isActive ? { borderColor: 'var(--t-primary)', color: 'var(--t-primary)', backgroundColor: 'var(--t-primary-lighter)' } : undefined}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ── Content Panel ── */}
        <section className="flex-1 min-w-0 min-h-0 flex flex-col">
          {/* Panel header (Title context) */}
          {activeItem && activeTab !== "activity" && (
            <div className="flex items-center gap-2 shrink-0 mb-4 px-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${accentClasses[activeItem.accent].badge
                  } border-current/20`}
              >
                <activeItem.icon size={13} />
                {activeItem.label}
              </span>
              <span className="text-[12px] text-slate-400 font-medium">
                — {activeItem.description}
              </span>
            </div>
          )}

          {/* Full height scrollable content area */}
          <div className={`flex-1 ${activeTab === "activity" ? "min-h-0 pb-0" : "overflow-y-auto px-2 pb-6 custom-scrollbar"}`}>
            {renderContent()}
          </div>
        </section>
      </div>

      {/* ── GST Downgrade Confirmation Dialog ── */}
      {showGstConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => !gstConfirmLoading && setShowGstConfirm(false)}
          />
          <div className="relative w-full max-w-[420px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle size={15} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-slate-900">Switch to Non-GST?</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">This will update your billing engine configuration.</p>
              </div>
              <button
                onClick={() => !gstConfirmLoading && setShowGstConfirm(false)}
                className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center border-none cursor-pointer text-slate-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* What changes */}
            <div className="px-5 py-4 space-y-2">
              {[
                "GST amounts will no longer appear on invoices",
                "Billing engine will stop computing tax breakdowns",
                "Your saved GSTIN will be removed from the system",
                "Existing invoice history will not be affected",
              ].map((pt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0 mt-[7px]" />
                  <p className="text-[12px] text-slate-600">{pt}</p>
                </div>
              ))}
            </div>

            {/* Confirm input */}
            <div className="px-5 pb-4">
              <p className="text-[11px] text-slate-500 mb-1.5">
                Type <span className="font-semibold text-slate-700 font-mono">CONFIRM</span> to continue
              </p>
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                disabled={gstConfirmLoading}
                placeholder="CONFIRM"
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter" && confirmInput === "CONFIRM") {
                    setShowGstConfirm(false);
                    applyGstChange("non-registered");
                  }
                }}
                className={`w-full h-9 px-3 text-[13px] font-mono border rounded-lg outline-none transition-colors disabled:opacity-50 ${confirmInput === "CONFIRM"
                    ? "border-green-400 bg-green-50 text-green-800"
                    : "border-slate-300 bg-white text-slate-800 focus:border-slate-400"
                  }`}
              />
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowGstConfirm(false)}
                disabled={gstConfirmLoading}
                className="px-4 h-8 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 bg-white"
              >
                Cancel
              </button>
              <button
                disabled={confirmInput !== "CONFIRM" || gstConfirmLoading}
                onClick={async () => {
                  await applyGstChange("non-registered");
                }}
                className="px-4 h-8 text-[12px] font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {gstConfirmLoading
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                  : "Switch to Non-GST"
                }
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── GST Enable / Edit GSTIN Dialog ── */}
      {showGstRegisterModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => !gstRegisterLoading && setShowGstRegisterModal(false)}
          />
          <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/30 to-white flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                <Percent size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-slate-900 leading-snug">
                  {isEditingGstNumber ? "Update GSTIN Number" : "Enable GST Registration"}
                </h3>
                <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                  {isEditingGstNumber
                    ? "Update your official 15-character Goods and Services Tax Identification Number."
                    : "Enter your 15-character GSTIN to switch from non-GST to GST registered entity."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !gstRegisterLoading && setShowGstRegisterModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    GSTIN / GST Number
                    <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      gstInput.length === 15 && !gstInputError
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {gstInput.length} / 15 chars
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FileText size={16} className={gstInput.length === 15 && !gstInputError ? "text-emerald-500" : "text-slate-400"} />
                  </div>
                  <input
                    type="text"
                    value={gstInput}
                    onChange={(e) => handleGstInputChange(e.target.value)}
                    disabled={gstRegisterLoading}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    maxLength={15}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && gstInput.length === 15 && !gstInputError && !gstRegisterLoading) {
                        applyGstChange("registered", gstInput);
                      }
                    }}
                    className={`w-full h-11 pl-10 pr-10 text-[13px] font-mono uppercase tracking-wider font-semibold rounded-xl border outline-none transition-all ${
                      gstInputError
                        ? "border-rose-300 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : gstInput.length === 15
                        ? "border-emerald-300 bg-emerald-50/20 text-emerald-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        : "border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {gstInput.length === 15 && !gstInputError && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-500">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>

                {/* Validation Feedback */}
                {gstInputError ? (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1.5 font-medium mt-1">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{gstInputError}</span>
                  </p>
                ) : gstInput.length === 15 ? (
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1.5 font-medium mt-1">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>Valid GSTIN format verified</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format: 2 digits (State) + 10 chars (PAN) + 1 char (Entity) + 1 char + 1 checksum char
                  </p>
                )}
              </div>

              {/* Information Cards / What happens */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  What happens when enabled:
                </span>
                <div className="space-y-1.5">
                  {[
                    "Billing engine computes CGST, SGST & IGST tax breakdowns",
                    "This GSTIN will be automatically printed on all customer invoices",
                    "Your GSTIN is displayed on your digital store and legal compliance documents",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check size={13} className="text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-600 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowGstRegisterModal(false)}
                disabled={gstRegisterLoading}
                className="px-4 h-9 text-[12px] font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50 bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={gstInput.length !== 15 || !!gstInputError || gstRegisterLoading}
                onClick={() => applyGstChange("registered", gstInput)}
                className="px-5 h-9 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-blue-500/20"
              >
                {gstRegisterLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>{isEditingGstNumber ? "Update GSTIN" : "Switch to GST Registration"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

