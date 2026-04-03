import { useState } from "react";
import { 
  ListTree, LogOut, Bell,
  Settings, ChevronRight,
  ShoppingBag, 
} from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

// Features (Ensure these paths match your project)
import { AdditionalSettings } from "@/features/Setting/pages/AdditionalSettings";
import SelectBuilder from "@/features/Setting/pages/SelectBuilder";
import { usePurchaseSettings } from "@/context/PurchaseContext";

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
  
  const handleBuilderChange = (options: any) => {
    setBuiltOptions(options);
  };

  // --- Content Router ---
  // Extracting this from the JSX makes the component much easier to read and maintain
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Purchase Type Configurations</h3>
                <p className="text-[13.5px] text-slate-500 mt-1">Enable or disable specific purchase flows across your system.</p>
              </div>
              
              {/* Card Body with Toggle Rows */}
              <div className="p-6 space-y-4 max-w-2xl">
                
                {/* PO-GRN */}
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

                {/* Production Entry */}
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
        // Fallback UI for Under Construction tabs
        const activeItem = MENU_ITEMS.find(i => i.id === activeTab);
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
              <div className="text-indigo-600">
                {activeItem?.icon}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {activeItem?.label}
            </h3>
            <p className="text-slate-500 max-w-sm mt-2.5 text-[14px] leading-relaxed">
              This section is currently under construction. You will be able to manage your {activeItem?.label.toLowerCase()} settings here shortly.
            </p>
            <Button className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-11 font-semibold shadow-md shadow-indigo-200 transition-all">
              Check Back Later
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      
      {/* ── TOP HEADER ── */}
      {/* Added sticky top & backdrop blur for better scrolling UX */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md">
                DD
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 leading-tight">Dhanush Dev</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] text-slate-500">dhanush@gmail.com</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wide">
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
              <Bell size={19} />
            </Button>
            <Button 
              variant="outline" 
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 gap-2 h-10 px-4 rounded-xl font-bold text-[13px] transition-all"
            >
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col md:flex-row gap-8 p-6 md:p-8">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-72 space-y-1.5 shrink-0">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] px-4 mb-3">
            Configuration
          </h2>
          
          {MENU_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 group text-left ${
                  isActive 
                    ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-200/60" 
                    : "border border-transparent hover:bg-slate-100/60"
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${
                  isActive ? "bg-indigo-50 text-indigo-600" : "bg-white text-slate-400 border border-slate-100 shadow-sm group-hover:text-slate-600"
                }`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-bold truncate ${isActive ? "text-indigo-950" : "text-slate-700"}`}>
                    {item.label}
                  </p>
                  <p className="text-[11.5px] text-slate-400 font-medium truncate mt-0.5">
                    {item.description}
                  </p>
                </div>
                {isActive && <ChevronRight size={16} className="text-indigo-400 ml-2 shrink-0" />}
              </button>
            );
          })}
        </aside>

        {/* Right Content Area */}
        <section className="flex-1 min-w-0">
          {renderContent()}
        </section>
        
      </main>
    </div>
  );
};