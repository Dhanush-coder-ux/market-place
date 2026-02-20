import { useState } from "react";
import { 
  Phone, Globe, MapPin, Mail, 
  ShoppingBag, CreditCard, History, Info, Package 
} from "lucide-react";
import StatsCard from "@/components/common/StatsCard";

const SupplierDetail = () => {
  const [activeTab, setActiveTab] = useState("General Info");
  const tabs = ["General Info", "Products Supplied", "Purchase History", "Payment History"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 1. Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
           
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-100">
                  Verified Supplier
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">ABC Traders</h1>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            Edit Vendor
          </button>
        </div>

        {/* 2. Top Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            label="Total Items Bought" 
            value="120" 
            icon={Package} 
            color="blue" 
            description="Across 5 orders"
          />
          <StatsCard 
            label="Pending Amount" 
            value="₹50,000" 
            icon={CreditCard} 
            color="red" 
            description="Due in 12 days"
          />
          <StatsCard 
            label="Total Purchases" 
            value="₹2,45,000" 
            icon={ShoppingBag} 
            color="green" 
            description="Lifetime volume"
          />
          <StatsCard 
            label="Last Order" 
            value="14 Days Ago" 
            icon={History} 
            color="blue" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 3. Sidebar: Contact & Identity */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-3">Identity</h3>
              <div className="space-y-4">
                <SidebarItem icon={Phone} label="Contact" value="+91 98765-43210" />
                <SidebarItem icon={Mail} label="Email" value="orders@abctraders.com" />
                <SidebarItem icon={Globe} label="GSTIN" value="27AAACB1234F1Z5" isMono />
                <SidebarItem icon={MapPin} label="Location" value="Mumbai, Maharashtra" />
              </div>
            </div>
          </div>

          {/* 4. Main Content Area: Tabs & Content */}
          <div className="lg:col-span-3 space-y-6">
            <nav className="flex gap-2 p-1.5 bg-slate-100/80 backdrop-blur rounded-2xl border border-slate-200/50 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab 
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
              {activeTab === "General Info" && (
                <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
                  <div className="flex items-center gap-2">
                    <Info size={20} className="text-indigo-500" />
                    <h2 className="text-xl font-bold text-slate-800">Business Profile</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">Payment Terms</p>
                      <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        Net 30 - Payment required within 30 days of invoice date.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">Lead Time</p>
                      <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        Typically 3-5 business days.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab !== "General Info" && (
                <div className="p-20 text-center text-slate-400 font-medium">
                  {activeTab} 
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, value, isMono = false }: any) => (
  <div className="flex gap-3">
    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0">
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
      <p className={`text-sm font-bold text-slate-700 truncate ${isMono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  </div>
);

export default SupplierDetail;