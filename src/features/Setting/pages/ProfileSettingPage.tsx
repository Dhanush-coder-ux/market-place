import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  ListTree,
  Settings,
  ShoppingBag,
  Percent,
  Activity,
  Store,
  AlertTriangle,
  X,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { ActivityLogPage } from "@/features/Setting/pages/ActivityLogPage";
import { CustomListSettings } from "@/features/Setting/pages/CustomListSettings";
import { ShopProfileForm } from "@/features/Setting/pages/ShopProfileForm";
import { BusinessCategorySettings } from "@/features/Setting/pages/BusinessCategorySettings";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import { shopApi } from "@/services/api/shop";
import { SHOP_ID } from "@/services/endpoints";
import { useToast } from "@/context/ToastContext";

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
    id: "activity",
    label: "Activity Log",
    icon: Activity,
    description: "System audit trail",
    accent: "rose",
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
  const [activeTab, setActiveTab] = useState("dropdowns");
  const { settings, toggleSetting, setGstType } = usePurchaseSettings();
  const { showToast } = useToast();
  const [gstNumber, setGstNumber] = useState<string>("");

  // ── GST downgrade confirmation dialog state ──────────────────────────────
  const [showGstConfirm, setShowGstConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [gstConfirmLoading, setGstConfirmLoading] = useState(false);

  React.useEffect(() => {
    // Sync GST setting with backend when Settings page is opened
    shopApi.getShopById(SHOP_ID).then((res) => {
      const shop = res?.data ?? res;
      if (shop && shop.business_infos?.gst_infos) {
        setGstType(shop.business_infos.gst_infos.registered ? "registered" : "non-registered");
        setGstNumber(shop.business_infos.gst_infos.number || "");
      }
    }).catch((err) => {
      console.error("Failed to sync initial GST settings", err);
    });
  }, [setGstType]);

  const handleGstChange = async (value: "registered" | "non-registered") => {
    // Switching to non-registered is a high-impact, irreversible-feeling action —
    // require explicit confirmation before saving.
    if (value === "non-registered" && settings.gstType === "registered") {
      setConfirmInput("");
      setShowGstConfirm(true);
      return;
    }
    await applyGstChange(value);
  };

  const applyGstChange = async (value: "registered" | "non-registered") => {
    setGstType(value);
    setGstConfirmLoading(true);
    try {
      const shopRes = await shopApi.getShopById(SHOP_ID);
      const shop = shopRes?.data ?? shopRes;
      if (shop) {
        const payload = { ...shop, id: SHOP_ID };
        payload.business_infos = {
          ...(payload.business_infos || {}),
          gst_infos: {
            registered: value === "registered",
            ...(value === "registered" && payload.business_infos?.gst_infos?.number
              ? { number: payload.business_infos.gst_infos.number }
              : {})
          }
        };
        await shopApi.updateShop(payload);
        showToast("GST configuration updated successfully", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to sync GST configuration with backend", "error");
    } finally {
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

              {/* Active row */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all">
                <div className="space-y-0.5 pr-4">
                  <span
                    className="text-sm font-semibold text-slate-800 cursor-pointer"
                    onClick={() => toggleSetting("productionEntry")}
                  >
                    Production Entry
                  </span>
                  <p className="text-xs text-slate-500">
                    Internal production entry and manufacturing item consumption.
                  </p>
                </div>
                <Switch
                  checked={settings.productionEntry}
                  onCheckedChange={() => toggleSetting("productionEntry")}
                />
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
                  const isDangerousChange = opt.value === "non-registered" && settings.gstType === "registered";
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
                          {isDangerousChange && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                              <AlertTriangle size={8} />Requires confirmation
                            </span>
                          )}
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

                      {opt.value === "registered" && gstNumber && (
                        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Saved GSTIN</span>
                          <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/40">{gstNumber}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex gap-2.5">
                <Settings size={15} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>System Status:</strong> Selecting an option automatically configures
                  the POS billing engine in real-time. Invoices will compute or exclude
                  tax metrics based on your selection.
                </p>
              </div>
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
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
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
                  setShowGstConfirm(false);
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
    </div>
  );
};

