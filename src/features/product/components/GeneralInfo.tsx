
import { Info, AlertCircle, Truck, ShieldCheck, TrendingUp } from "lucide-react";

// 1. Define Helper Component outside the main return
const InfoItem = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
  <div className="flex items-start gap-4">
    {Icon && (
      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
        <Icon size={18} />
      </div>
    )}
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
      <p className="text-slate-900 font-semibold">{value || "—"}</p>
    </div>
  </div>
);

// 2. Main Component
const GeneralInfoTab = () => {
  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Info size={20} className="text-indigo-500" />
          General Information
        </h2>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
          <AlertCircle size={14} /> Low Threshold Near
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Meta */}
        <div className="space-y-6">
          <InfoItem label="Primary Supplier" value="ABC Traders" icon={Truck} />
          <InfoItem label="Category" value="Electronics" icon={ShieldCheck} />
          <InfoItem label="GST Rate" value="Standard GST (12%)" />
          
          <div className="pt-4 border-t border-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Description</p>
            <p className="text-slate-600 leading-relaxed text-sm font-medium">
              High-quality wireless over-ear headphones with noise-cancellation and Bluetooth connectivity. 
              Designed for ergonomic comfort during long sessions.
            </p>
          </div>
        </div>

        {/* Purchase Insights Box */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Purchase Insights</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-semibold text-slate-400">Last Purchase Price</p>
                <p className="text-2xl font-black text-slate-900">
                  ₹130 <span className="text-xs font-normal text-slate-400">/ unit</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <TrendingUp size={12} /> 7.2% cheaper
                </p>
                <p className="text-[10px] text-slate-400 italic font-medium">vs Market Avg</p>
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-500">Last Source:</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">XYZ Wholesalers</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-500">Purchase Date:</span>
                <span className="text-slate-700 font-bold">April 24, 2024</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-50 text-xs font-medium">
                <span className="text-slate-500">Batch Quantity:</span>
                <span className="text-slate-700 font-bold">10 Units</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralInfoTab;