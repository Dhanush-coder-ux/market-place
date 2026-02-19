import React, { useState } from "react";
import { 
  ArrowLeft, Edit3, MoreHorizontal, Package, 
  TrendingUp, AlertCircle, IndianRupee, History, 
  Truck, Info, ShieldCheck, Search, Filter, ChevronLeft, ChevronRight 
} from "lucide-react";
import PurchaseHistory from "../components/PurchaseHistory";
import GeneralInfoTab from "../components/GeneralInfo";
import StockMovement from "../components/StockMovement";

// Mock Data from image


const ProductDetail = () => {
  const [activeTab, setActiveTab] = useState("Purchase History"); // Defaulted to show work
  

  const tabs = ["General Info", "Purchase History", "Stock Movement", "Suppliers"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      {/* 1. Breadcrumbs & Actions (Keeping original header) */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
        
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Wireless Headphones
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase">Active</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-semibold shadow-lg transition-all active:scale-95">
            <Edit3 size={18} /> Edit Product
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center">
            <div className="w-full aspect-square bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
               <Package size={80} className="text-indigo-200" />
            </div>
            <div className="w-full space-y-4 text-center">
               <p className="text-sm font-bold text-slate-400 uppercase">Current Stock</p>
               <p className="text-3xl font-black text-slate-900">20 Pcs</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
         {activeTab === "General Info" && (
            <GeneralInfoTab/>
            )}

            {activeTab === "Purchase History" && (
            <PurchaseHistory/>
            )}

            {activeTab === "Stock Movement" && (
            <StockMovement/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
const InfoItem = ({ label, value, icon: Icon }: any) => (
  <div className="flex items-start gap-4">
    {Icon && <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Icon size={18} /></div>}
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
      <p className="text-slate-900 font-semibold">{value || "—"}</p>
    </div>
  </div>
);

export default ProductDetail;