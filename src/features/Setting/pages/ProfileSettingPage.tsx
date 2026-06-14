import React, { useState } from "react";
import { 
  ListTree,
  Settings, ChevronRight,
  ShoppingBag, 
  Percent,
  Activity,
} from "lucide-react";

// Components
import { Switch } from "@/components/ui/switch";

// Features (Ensure these paths match your project)
import { AdditionalSettings } from "@/features/Setting/pages/AdditionalSettings";
import { ActivityLogPage } from "@/features/Setting/pages/ActivityLogPage";
import { CustomListSettings } from "@/features/Setting/pages/CustomListSettings";
import { IdPrefixSettings } from "@/features/Setting/pages/IdPrefixSettings";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Hash } from "lucide-react";


// --- Configuration ---
const MENU_ITEMS = [
  { id: "id_prefixes", label: "ID Sequence", icon: <Hash size={18} />, description: "Set module ID prefixes" },
  { id: "dropdowns", label: "Dropdown Settings", icon: <ListTree size={18} />, description: "Industries & Sectors" },
  { id: "advanced", label: "Advanced Config", icon: <Settings size={18} />, description: "System-wide variables" },
  { id: "purchasetypes", label: "Purchase Modules", icon: <ShoppingBag size={18} />, description: "Enable/Disable purchase types" },
  { id: "gst", label: "GST Configuration", icon: <Percent size={18} />, description: "Registered / Non-Registered" },
  { id: "activity", label: "Activity Log", icon: <Activity size={18} />, description: "System audit trail" },
];

export const ProfileSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("dropdowns");
  const { settings, toggleSetting, setGstType } = usePurchaseSettings();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const renderContent = () => {
    switch (activeTab) {

      case "id_prefixes":
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <IdPrefixSettings />
          </div>
        );
      case "advanced":
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <AdditionalSettings 
              availableSelectOptions={[]}
              title="Advanced System Configuration"
              description="Modify internal variables and feature flags for the entire platform."
            />
          </div>
        );
      
      case "dropdowns":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <CustomListSettings type="categories" />
            <CustomListSettings type="units" />
          </div>
        );

      case "activity":
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full">
            <ActivityLogPage />
          </div>
        );

      case "purchasetypes":
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white md:rounded-lg border-y md:border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Purchase Type Configurations</h3>
                <p className="text-[13.5px] text-slate-500 mt-1">Enable or disable specific purchase flows across your system.</p>
              </div>
              
              <div className="p-6 space-y-4 max-w-2xl">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50 opacity-75 cursor-not-allowed transition-all">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <label className="text-[14.5px] font-semibold text-slate-500 cursor-not-allowed">
                        PO-GRN (Goods Receipt Note)
                      </label>
                      <span className="px-2 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 rounded-full uppercase tracking-wider">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-400">Enable standard Purchase Order to Goods Receipt Note processing workflow.</p>
                  </div>
                  <Switch 
                    checked={false} 
                    disabled={true}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-white hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all">
                  <div className="space-y-0.5 pr-4">
                    <label className="text-[14.5px] font-semibold text-slate-800 cursor-pointer" onClick={() => toggleSetting('productionEntry')}>
                      Production Entry
                    </label>
                    <p className="text-[13px] text-slate-500">Enable internal production entry and manufacturing item consumption.</p>
                  </div>
                  <Switch
                    checked={settings.productionEntry} 
                    onCheckedChange={() => toggleSetting('productionEntry')} 
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "gst":
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white md:rounded-lg border-y md:border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">GST Registration Configuration</h3>
                <p className="text-[13.5px] text-slate-500 mt-1">Configure whether your business is a registered GST tax entity or non-GST registered.</p>
              </div>
              
              <div className="p-6 space-y-5 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: GST Registered */}
                  <div 
                    onClick={() => setGstType("registered")}
                    className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 relative ${
                      settings.gstType === "registered" 
                        ? "border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/5" 
                        : "border-slate-150 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[14.5px] font-bold text-slate-800">GST Registered Entity</span>
                      <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                        settings.gstType === "registered" ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"
                      }`}>
                        {settings.gstType === "registered" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-2.5 leading-relaxed">
                      Enable this if you have a valid GSTIN. Product GST rates (e.g., 18%) will be calculated and printed on invoices.
                    </p>
                  </div>

                  {/* Option 2: Non-GST Registered */}
                  <div 
                    onClick={() => setGstType("non-registered")}
                    className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 relative ${
                      settings.gstType === "non-registered" 
                        ? "border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/5" 
                        : "border-slate-150 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[14.5px] font-bold text-slate-800">Non-GST Registered</span>
                      <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                        settings.gstType === "non-registered" ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"
                      }`}>
                        {settings.gstType === "non-registered" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-2.5 leading-relaxed">
                      Enable this if you are a non-GST registered entity. Product GST taxes will be excluded entirely from billing invoices.
                    </p>
                  </div>
                </div>

                {/* Banner notice */}
                <div className="p-4 rounded-xl bg-blue-50/20 border border-blue-100 text-blue-800 text-xs leading-relaxed flex gap-2">
                  <Settings size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">System Status:</span> Selecting either option automatically configures the POS billing engine in real-time. Invoices will automatically compute or exclude tax metrics based on your choice above.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        const activeItem = MENU_ITEMS.find(i => i.id === activeTab);
        return (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center mb-5 shadow-inner">
              <div className="text-blue-600">
                {activeItem?.icon}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {activeItem?.label}
            </h3>
            <p className="text-slate-500 max-w-sm mt-2.5 text-[14px] leading-relaxed">
              This section is currently under construction.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-0 items-start relative">
      <aside className={`${isMobile ? "flex overflow-x-auto gap-2 pb-4 px-2 scrollbar-hide border-b border-slate-100 mb-4" : "w-72 space-y-1.5 shrink-0 md:sticky md:top-6"}`}>
        {!isMobile && (
          <h2 className="text-[10px] font-black text-slate-400  tracking-[0.2em] px-4 mb-3">
            Configuration
          </h2>
        )}
        
        {MENU_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 transition-all duration-200 group text-left ${
                isMobile
                  ? `px-4 py-2 rounded-lg border flex items-center gap-2.5 ${isActive ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-100" : "bg-white border-slate-200 text-slate-600"}`
                  : `w-full flex items-center gap-3.5 px-4 py-3 rounded-lg ${isActive ? "bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-200/80" : "border border-transparent hover:bg-white/50 hover:border-slate-100"}`
              }`}
            >
              <div className={`p-2 rounded-lg transition-colors ${
                isMobile
                  ? ""
                  : isActive ? "bg-blue-50 text-blue-600" : "bg-white text-slate-400 border border-slate-100 shadow-sm group-hover:text-slate-600"
              }`}>
                {React.cloneElement(item.icon as React.ReactElement, { size: isMobile ? 14 : 18 } as any)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold truncate ${isMobile ? "" : isActive ? "text-blue-950" : "text-slate-700"}`}>
                  {item.label}
                </p>
              </div>
              {!isMobile && isActive && <ChevronRight size={14} className="text-blue-300 ml-2 shrink-0" />}
            </button>
          );
        })}
      </aside>

      <section className="flex-1 min-w-0 pb-20">
        <div className="w-full max-w-4xl mx-auto md:mx-0">
          {renderContent()}
        </div>
      </section>
    </div>
  );
};

