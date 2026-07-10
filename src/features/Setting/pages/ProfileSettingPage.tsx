import React, { useState } from "react";
import {
  ListTree,
  Settings,
  ChevronRight,
  ShoppingBag,
  Percent,
  Activity,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { ActivityLogPage } from "@/features/Setting/pages/ActivityLogPage";
import { CustomListSettings } from "@/features/Setting/pages/CustomListSettings";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import { useMediaQuery } from "@/hooks/use-media-query";

// ─── Menu config ─────────────────────────────────────────────────────────────

const MENU_ITEMS = [
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
  violet:  { icon: "bg-violet-50  text-violet-600",  badge: "bg-violet-100  text-violet-700" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
  amber:   { icon: "bg-amber-50   text-amber-600",   badge: "bg-amber-100   text-amber-700"  },
  rose:    { icon: "bg-rose-50    text-rose-600",    badge: "bg-rose-100    text-rose-700"   },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ProfileSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("dropdowns");
  const { settings, toggleSetting, setGstType } = usePurchaseSettings();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const activeItem = MENU_ITEMS.find((i) => i.id === activeTab);

  // ── Content panels ──────────────────────────────────────────────────────────

  const renderContent = () => {
    const wrapper = (children: React.ReactNode) => (
      <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full">
        {children}
      </div>
    );

    switch (activeTab) {
      case "dropdowns":
        return wrapper(
          <div className="space-y-5">
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
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setGstType(opt.value as any)}
                      className={`flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/5"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-800">
                          {opt.label}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isActive ? "border-blue-500 bg-blue-500" : "border-slate-300"
                          }`}
                        >
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{opt.desc}</p>
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
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                    accentClasses[activeItem.accent].icon
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
  

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* ── Sidebar ── */}
        {isMobile ? (
          /* Mobile: horizontal scroll chips */
          <div className="flex gap-2 overflow-x-auto pb-1 px-2 shrink-0 scrollbar-hide w-full">
            {MENU_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon size={13} />
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : (
          /* Desktop: full height sidebar */
          <aside className="w-72 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full">
            <div className="p-4 border-b border-slate-50/80 bg-slate-50/30">
              <p className="text-[10px] font-black text-slate-400 tracking-[0.18em] uppercase">
                Configuration
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {MENU_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                const accent = accentClasses[item.accent];
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? "bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-200/50"
                        : "border border-transparent hover:bg-slate-50/50 hover:border-slate-100"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? accent.icon
                          : "bg-white border border-slate-100 text-slate-400 group-hover:text-slate-600 shadow-sm"
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    {/* Label + desc */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[13px] font-semibold leading-tight mb-1 ${
                          isActive ? "text-slate-900" : "text-slate-600"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight truncate">
                        {item.description}
                      </p>
                    </div>

                    {/* Active chevron */}
                    {isActive && (
                      <ChevronRight size={14} className="text-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* ── Content Panel ── */}
        <section className="flex-1 min-w-0 h-full flex flex-col">
          {/* Panel header (Title context) */}
          {activeItem && !isMobile && (
            <div className="flex items-center gap-2 shrink-0 mb-4 px-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                  accentClasses[activeItem.accent].badge
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
          <div className="flex-1 overflow-y-auto px-2 pb-6 custom-scrollbar">
            {renderContent()}
          </div>
        </section>
      </div>
    </div>
  );
};
