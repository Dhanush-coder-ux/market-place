import { StoreFormData, DeliveryConfig } from "@/features/digitalstore/type";
import { Truck, Timer, IndianRupee, MapPin } from "lucide-react";

interface Step3Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
}

const SPEED_OPTIONS = ["Within 12 hours", "1–2 Business Days", "3–5 Business Days", "5–7 Business Days"];

export default function Step3DeliveryOptions({ form, setForm }: Step3Props) {
  const updateDelivery = (type: "instant" | "standard" | "nationwide", field: keyof DeliveryConfig, value: any) => {
    setForm(prev => ({
      ...prev,
      deliveryOptions: {
        ...prev.deliveryOptions,
        [type]: {
          ...prev.deliveryOptions[type],
          [field]: value
        }
      }
    }));
  };

  const DeliveryCard = ({ type, title, subtitle }: { type: "instant" | "standard" | "nationwide", title: string, subtitle: string }) => {
    const data = form.deliveryOptions[type];
    const enabled = data.enabled;
    return (
      <div className={`border-2 rounded-xl p-4 transition-all ${enabled ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">{title}</h4>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
          <button
            onClick={() => updateDelivery(type, "enabled", !enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        
        {enabled && (
          <div className="space-y-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in">
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1"><Timer size={12}/> Speed</label>
              <select 
                value={data.speed} 
                onChange={(e) => updateDelivery(type, "speed", e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              >
                {SPEED_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1"><IndianRupee size={12}/> Free Shipping Threshold</label>
              <input 
                type="number" 
                value={data.freeThreshold} 
                onChange={(e) => updateDelivery(type, "freeThreshold", Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1"><Truck size={12}/> Delivery By</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateDelivery(type, "manageStore", !data.manageStore)}
                  className={`flex-1 p-2 text-[11px] font-bold border rounded-lg ${data.manageStore ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}
                >In-house Staff</button>
                <button 
                  onClick={() => updateDelivery(type, "partners", !data.partners)}
                  className={`flex-1 p-2 text-[11px] font-bold border rounded-lg ${data.partners ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}
                >3rd Party Partners</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 h-[450px] overflow-y-auto pr-2 custom-scrollbar">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Delivery Options</h3>
        </div>
        <div className="space-y-4">
          <DeliveryCard type="instant" title="Instant Delivery" subtitle="Same-day local delivery" />
          <DeliveryCard type="standard" title="Standard Delivery" subtitle="City-wide delivery" />
          <DeliveryCard type="nationwide" title="Nationwide Delivery" subtitle="Country-wide shipping" />
        </div>
      </section>
    </div>
  );
}
