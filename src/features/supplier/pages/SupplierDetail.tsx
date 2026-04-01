import { useState } from "react";
import {
  Phone, Globe, MapPin, Mail,
  ShoppingBag, CreditCard, History, Info, Package,
  CheckCircle2
} from "lucide-react";
import { StatCard } from "@/components/common/StatsCard";


const SidebarItem = ({ icon: Icon, label, value, isMono = false }: { icon: any, label: string, value: string, isMono?: boolean }) => (
  <div className="flex gap-3.5 items-start">
    <div className="p-2 bg-slate-50 rounded-xl text-slate-400 shrink-0 mt-0.5">
      <Icon size={16} strokeWidth={2} />
    </div>
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`text-sm font-medium text-slate-800 truncate ${isMono ? 'font-mono text-[13px]' : ''}`}>
        {value}
      </p>
    </div>
  </div>
);

// --- Main Page Component ---

const SupplierDetail = () => {
  const [activeTab, setActiveTab] = useState("General Info");
  const tabs = ["General Info", "Products Supplied", "Purchase History", "Payment History"];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 md:pt-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-600">
              <CheckCircle2 size={14} strokeWidth={2.5} />
              <span className="text-xs font-medium tracking-wide">Verified Supplier</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
              ABC Traders
            </h1>
          </div>
          <button className="px-5 py-2.5 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            Edit Vendor
          </button>
        </div>

        {/* 2. Top Summary Stats (Neutral & Clean) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          <StatCard label="Total Items Bought" value="120" icon={Package} />
          <StatCard label="Pending Amount" value="₹50,000" icon={CreditCard} />
          <StatCard label="Total Purchases" value="₹2,45,000" icon={ShoppingBag} />
          <StatCard label="Last Order" value="14 Days Ago" icon={History} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* 3. Sidebar: Contact & Identity */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
              <h3 className="text-sm font-semibold text-slate-800 pb-4 border-b border-slate-100">
                Identity & Contact
              </h3>
              <div className="space-y-5">
                <SidebarItem icon={Phone} label="Phone Number" value="+91 98765-43210" />
                <SidebarItem icon={Mail} label="Email Address" value="orders@abctraders.com" />
                <SidebarItem icon={Globe} label="GSTIN" value="27AAACB1234F1Z5" isMono />
                <SidebarItem icon={MapPin} label="Location" value="Mumbai, Maharashtra" />
              </div>
            </div>
          </div>

          {/* 4. Main Content Area: Tabs & Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Soft Pill Tabs */}
            <nav className="flex gap-1 p-1 bg-slate-100/50 rounded-xl w-fit border border-slate-200/50 overflow-x-auto max-w-full">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-blue-50 text-blue-600 font-medium border border-blue-100/50 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 font-medium border border-transparent"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* Flat Content Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden min-h-[400px]">
              {activeTab === "General Info" ? (
                <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5">
                    <Info size={18} className="text-blue-500" />
                    <h2 className="text-lg font-semibold text-slate-800">Business Profile</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-2.5">
                      <p className="text-sm font-medium text-slate-500">Payment Terms</p>
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-sm font-normal text-slate-700 leading-relaxed">
                        Net 30 — Payment required within 30 days of invoice date.
                      </div>
                    </div>
                    
                    <div className="space-y-2.5">
                      <p className="text-sm font-medium text-slate-500">Lead Time</p>
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-sm font-normal text-slate-700 leading-relaxed">
                        Typically 3-5 business days depending on location.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex items-center justify-center text-sm font-medium text-slate-400 animate-in fade-in duration-300">
                  {activeTab} content will appear here
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default SupplierDetail;