import { StoreFormData } from "@/features/digitalstore/type";
import { Store, Truck, Package, Clock } from "lucide-react";

interface Step4Props {
  form: StoreFormData;
}

export default function Step4Confirmation({ form }: Step4Props) {
  
  const deliveryActiveCount = Object.values(form.deliveryOptions).filter(d => d.enabled).length;
  const productCount = Object.keys(form.selectedProducts).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">
        <h3 className="text-sm font-bold mb-1">Ready to Launch!</h3>
        <p className="text-[11px]">Please review your digital store configuration below. Upon confirmation, your store will be created and made visible online immediately.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Basic Info Summary */}
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Store size={16} className="text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Store Details</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500">Name</span>
              <span className="text-[11px] font-bold text-slate-700">{form.name || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500">Category</span>
              <span className="text-[11px] font-bold text-slate-700">{form.category || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500">GST Registration</span>
              <span className="text-[11px] font-bold text-slate-700">{form.gstRegistered ? form.gstNumber : "Not Registered"}</span>
            </div>
          </div>
        </div>

        {/* Operations Summary */}
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-amber-500" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Operations</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500 flex items-center gap-1"><Clock size={12}/> Hours</span>
              <span className="text-[11px] font-bold text-slate-700">Default (9 AM - 9 PM)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500 flex items-center gap-1"><Truck size={12}/> Delivery Zones</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{deliveryActiveCount} Active</span>
            </div>
          </div>
        </div>

      </div>

      {/* Catalog Summary */}
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-indigo-500" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Catalog Overview</h4>
          </div>
          <span className="text-[11px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
            {productCount} Products Selected
          </span>
        </div>
        
        {productCount === 0 ? (
          <p className="text-[11px] text-slate-400 italic">No products selected. Your digital store will be empty.</p>
        ) : (
          <div className="text-[11px] text-slate-600">
            You have configured {productCount} products for online sales. Product prices and custom fields will be synced to the storefront.
          </div>
        )}
      </div>

    </div>
  );
}
