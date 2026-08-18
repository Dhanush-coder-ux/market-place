import { StoreFormData } from "@/features/digitalstore/type";
import { Clock } from "lucide-react";

interface Step2Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
}

export default function Step2OperatingHours({ form, setForm }: Step2Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 h-[450px] overflow-y-auto pr-2 custom-scrollbar">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Operating Hours</h3>
        </div>
        <div className="space-y-3">
          {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((dayName) => {
            const hourConfig = form.operatingHours.find(h => h.day === dayName);
            const isOpen = !!hourConfig;
            return (
              <div key={dayName} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (isOpen) {
                        setForm(prev => ({ ...prev, operatingHours: prev.operatingHours.filter(h => h.day !== dayName) }));
                      } else {
                        setForm(prev => ({ ...prev, operatingHours: [...prev.operatingHours, { day: dayName, open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" }] }));
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${isOpen ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isOpen ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <span className={`text-xs font-bold ${isOpen ? 'text-slate-800' : 'text-slate-400'}`}>
                    {dayName.charAt(0) + dayName.slice(1).toLowerCase()}
                  </span>
                </div>
                {isOpen ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={hourConfig.open_at.replace('+00:00', '')} 
                      onChange={(e) => {
                        const newTime = e.target.value;
                        if (!newTime) return;
                        const formatted = newTime.length === 5 ? `${newTime}:00+00:00` : `${newTime}+00:00`;
                        setForm(prev => ({
                          ...prev,
                          operatingHours: prev.operatingHours.map(h => h.day === dayName ? { ...h, open_at: formatted } : h)
                        }));
                      }}
                      className="text-xs p-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 w-24"
                    />
                    <span className="text-slate-400 text-xs">to</span>
                    <input 
                      type="time" 
                      value={hourConfig.close_at.replace('+00:00', '')} 
                      onChange={(e) => {
                        const newTime = e.target.value;
                        if (!newTime) return;
                        const formatted = newTime.length === 5 ? `${newTime}:00+00:00` : `${newTime}+00:00`;
                        setForm(prev => ({
                          ...prev,
                          operatingHours: prev.operatingHours.map(h => h.day === dayName ? { ...h, close_at: formatted } : h)
                        }));
                      }}
                      className="text-xs p-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 w-24"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
