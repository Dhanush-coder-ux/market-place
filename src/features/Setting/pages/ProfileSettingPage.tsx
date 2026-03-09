import { useState } from "react";
import { 
   ListTree, LogOut, Bell,
  Settings, ChevronRight,
  Truck,
  Timer, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdditionalSettings } from  "@/features/Setting/pages/AdditionalSettings"
import SelectBuilder from "@/features/Setting/pages/SelectBuilder";
import DeliveryPreferences from "@/features/digitalstore/pages/Deliveryinfo";

import OperatingHours from "../components/OperatingHours";
// const productFields = [
//   {
//     name: "Color",
//     values: ["Red", "Blue", "Black"]
//   },
//   {
//     name: "Size",
//     values: ["S", "M", "L", "XL"]
//   },
//   {
//     name: "Material",
//     values: ["Cotton", "Polyester"]
//   }
// ];
export const ProfileSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("dropdowns");
const [builtOptions, setBuiltOptions] = useState([]);
  
  const handleBuilderChange = (options:any) => {
    setBuiltOptions(options);
  };
  const menuItems = [
    // { id: "profile", label: "Account Profile", icon: <User size={18} />, description: "Your personal information" },
    // { id: "email", label: "Email Settings", icon: <Mail size={18} />, description: "SMTP & Credentials" },
    { id: "delivery", label: "Delivery Preference", icon: <Truck size={18}/>, description:"Choose the delivery preference"},
    {id : "operatinghours", label: "Operating Hours",icon:<Timer size={18}/>, description:"Set the Operating Hours"},
    { id: "dropdowns", label: "Dropdown Settings", icon: <ListTree size={18} />, description: "Industries & Sectors" },
    { id: "advanced", label: "Advanced Config", icon: <Settings size={18} />, description: "System-wide variables" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* ── TOP HEADER (User Info & Logout) ── */}
      <header className="bg-white border-b border-slate-200 px-8 py-4  z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-blue-300 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-100">
                DD
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Dhanush Dev</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500">dhanush@gmail.com</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 rounded-xl">
              <Bell size={20} />
            </Button>
            <Button 
              variant="outline" 
              className="border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-2 h-10 px-4 rounded-xl font-bold text-xs"
            >
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto w-full flex-1 flex gap-8 p-8">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-72 space-y-2 shrink-0">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">
            Settings Menu
          </h2>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                activeTab === item.id 
                  ? "bg-white shadow-sm border border-slate-100 text-indigo-600" 
                  : "text-slate-500 hover:bg-slate-100/50"
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${
                activeTab === item.id ? "bg-indigo-50" : "bg-transparent group-hover:bg-white"
              }`}>
                {item.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{item.label}</p>
                <p className="text-[10px] text-slate-400 font-medium">{item.description}</p>
              </div>
              {activeTab === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </aside>

        {/* Right Content Area */}
       <section className="flex-1 min-w-0">
  {activeTab === "advanced" ? (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <AdditionalSettings 
       availableSelectOptions={builtOptions}
        title="Advanced System Configuration"
        description="Modify internal variables and feature flags for the entire platform."
      />
    </div>
  ) : activeTab === "dropdowns" ? (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <SelectBuilder onSettingsChange={handleBuilderChange}/>
    </div>
  ) : activeTab == "delivery" ?(
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
     <DeliveryPreferences/>
    </div>
  ): activeTab == "operatinghours" ? (
    <div  className="animate-in fade-in slide-in-from-right-4 duration-300">
     <OperatingHours/>
    </div>
  ):
  (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <div className="text-indigo-600">
            {menuItems.find(i => i.id === activeTab)?.icon}
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-800">
        {menuItems.find(i => i.id === activeTab)?.label}
      </h3>
      <p className="text-slate-500 max-w-sm mt-2 text-sm">
        This section is under construction. You can manage your {activeTab} settings here shortly.
      </p>
      <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-11">
        Configure Now
      </Button>
    </div>
  )}
</section>
      </main>
    </div>
  );
};