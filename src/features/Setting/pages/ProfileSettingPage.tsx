import React, { useState } from "react";
import { 
  ListTree,
  Settings, ChevronRight,
  ShoppingBag, 
} from "lucide-react";

// Components
import { Switch } from "@/components/ui/switch";

// Features (Ensure these paths match your project)
import { AdditionalSettings } from "@/features/Setting/pages/AdditionalSettings";
import SelectBuilder from "@/features/Setting/pages/SelectBuilder";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import { useMediaQuery } from "@/hooks/use-media-query";


// --- Configuration ---
const MENU_ITEMS = [
  { id: "dropdowns", label: "Dropdown Settings", icon: <ListTree size={18} />, description: "Industries & Sectors" },
  { id: "advanced", label: "Advanced Config", icon: <Settings size={18} />, description: "System-wide variables" },
  { id: "purchasetypes", label: "Purchase Modules", icon: <ShoppingBag size={18} />, description: "Enable/Disable purchase types" },
];

export const ProfileSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("dropdowns");
  const [builtOptions, setBuiltOptions] = useState<any[]>([]);
  const { settings, toggleSetting } = usePurchaseSettings();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const handleBuilderChange = (options: any) => {
    setBuiltOptions(options);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "advanced":
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <AdditionalSettings 
              availableSelectOptions={builtOptions}
              title="Advanced System Configuration"
              description="Modify internal variables and feature flags for the entire platform."
            />
          </div>
        );
      
      case "dropdowns":
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <SelectBuilder onSettingsChange={handleBuilderChange} />
          </div>
        );

      case "purchasetypes":
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white md:rounded-2xl border-y md:border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Purchase Type Configurations</h3>
                <p className="text-[13.5px] text-slate-500 mt-1">Enable or disable specific purchase flows across your system.</p>
              </div>
              
              <div className="p-6 space-y-4 max-w-2xl">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all">
                  <div className="space-y-0.5 pr-4">
                    <label className="text-[14.5px] font-semibold text-slate-800 cursor-pointer" onClick={() => toggleSetting('poGrn')}>
                      PO-GRN (Goods Receipt Note)
                    </label>
                    <p className="text-[13px] text-slate-500">Enable standard Purchase Order to Goods Receipt Note processing workflow.</p>
                  </div>
                  <Switch 
                    checked={settings.poGrn} 
                    onCheckedChange={() => toggleSetting('poGrn')} 
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all">
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

      default:
        const activeItem = MENU_ITEMS.find(i => i.id === activeTab);
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
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
    <div className="flex flex-col md:flex-row gap-6 p-0">
      <aside className={`${isMobile ? "flex overflow-x-auto gap-2 pb-4 px-2 scrollbar-hide border-b border-slate-100 mb-4" : "w-72 space-y-1.5 shrink-0"}`}>
        {!isMobile && (
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-3">
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
                  ? `px-4 py-2 rounded-xl border flex items-center gap-2.5 ${isActive ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-100" : "bg-white border-slate-200 text-slate-600"}`
                  : `w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl ${isActive ? "bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-200/80" : "border border-transparent hover:bg-white/50 hover:border-slate-100"}`
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${
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

      <section className="flex-1 min-w-0">
        <div className="w-full max-w-4xl mx-auto md:mx-0">
          {renderContent()}
        </div>
      </section>
    </div>
  );
};