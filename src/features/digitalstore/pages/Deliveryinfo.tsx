import { useState } from "react";
import {
  Truck, Zap, Globe, Clock, Copy, 
  Info, MapPin, ChevronDown, IndianRupee, Timer,
  Store, Users, Check, X
} from "lucide-react";

/* ───────────── Types ───────────── */
type Day = "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday";
const DAYS: Day[] = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DAY_SHORT: Record<Day,string> = { Monday:"Mon",Tuesday:"Tue",Wednesday:"Wed",Thursday:"Thu",Friday:"Fri",Saturday:"Sat",Sunday:"Sun" };

type DayHours  = { open: string; close: string; closed: boolean };
type DeliveryConfig = { enabled:boolean; speed:string; freeThreshold:number; manageStore:boolean; partners:boolean };

const COLOR_MAP = {
  orange: { accent:"bg-orange-500", ring:"ring-orange-200", pill:"bg-orange-50 text-orange-600", dot:"bg-orange-500", toggle:"bg-orange-500" },
  blue:   { accent:"bg-indigo-600", ring:"ring-indigo-200", pill:"bg-indigo-50 text-indigo-600",  dot:"bg-indigo-500", toggle:"bg-indigo-600" },
  green:  { accent:"bg-emerald-500",ring:"ring-emerald-200",pill:"bg-emerald-50 text-emerald-600",dot:"bg-emerald-500",toggle:"bg-emerald-500" },
};

/* ───────────── Toggle ───────────── */
function Toggle({ checked, onChange, color="bg-indigo-600" }: { checked:boolean; onChange:(v:boolean)=>void; color?:string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? color : "bg-slate-200"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${checked ? "translate-x-5":"translate-x-0"}`} />
    </button>
  );
}

/* ───────────── Settings Card ───────────── */
function SettingsCard({
  title, subtitle, icon: Icon, enabled, onToggle, color, children,
}: {
  title:string; subtitle:string; icon:any; enabled:boolean;
  onToggle:(v:boolean)=>void; color:"orange"|"blue"|"green"; children:React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const c = COLOR_MAP[color];

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${enabled ? "border-slate-200" : "border-slate-100 opacity-70"}`}
         style={{ fontFamily:"'DM Sans',sans-serif" }}>
      {/* Accent bar */}
      <div className={`h-1 w-full ${c.accent}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${c.ring} ${c.pill}`}>
              <Icon size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[15px] font-black text-slate-800 leading-tight">{title}</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-bold ${enabled ? "text-emerald-600":"text-slate-400"}`}>
              {enabled ? "Active" : "Disabled"}
            </span>
            <Toggle checked={enabled} onChange={onToggle} color={c.toggle} />
          </div>
        </div>

        {/* Expand / collapse */}
        {enabled && (
          <button
            onClick={() => setOpen(v => !v)}
            className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-200 ${open ? "rotate-180":""}`} />
            {open ? "Hide settings" : "Configure"}
          </button>
        )}

        {enabled && open && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── Delivery Fields ───────────── */
function DeliveryFields({ data, setData }: { data:DeliveryConfig; setData:(d:DeliveryConfig)=>void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Speed */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1.5">
            <Timer size={10} strokeWidth={3} /> Speed
          </label>
          <select
            value={data.speed}
            onChange={(e) => setData({ ...data, speed:e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option>Within 12 hours</option>
            <option>1–2 Business Days</option>
            <option>5–7 Business Days</option>
          </select>
        </div>

        {/* Free threshold */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1.5">
            <IndianRupee size={10} strokeWidth={3} /> Free Above
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
            <input
              type="number"
              value={data.freeThreshold}
              onChange={(e) => setData({ ...data, freeThreshold:Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pl-8 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { key:"manageStore" as const, icon:Store,  label:"Manage by Store",      desc:"Your team handles delivery." },
          { key:"partners"    as const, icon:Users,  label:"Delivery Partners",     desc:"Assign to 3rd-party couriers." },
        ].map(({ key, icon:Icon, label, desc }) => (
          <button
            key={key}
            onClick={() => setData({ ...data, [key]:!data[key] })}
            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${data[key] ? "border-indigo-200 bg-indigo-50/50":"border-slate-100 hover:border-slate-200 bg-white"}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${data[key] ? "bg-indigo-600":"bg-slate-100"}`}>
              <Icon size={14} strokeWidth={2.5} className={data[key] ? "text-white":"text-slate-400"} />
            </div>
            <div className="min-w-0">
              <p className={`text-[13px] font-bold leading-tight ${data[key] ? "text-indigo-700":"text-slate-700"}`}>{label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{desc}</p>
            </div>
            {data[key] && <Check size={14} strokeWidth={3} className="text-indigo-600 ml-auto shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Main Page ───────────── */
export default function DeliveryPreferences() {
  const [instant,  setInstant]  = useState<DeliveryConfig>({ enabled:true,  speed:"Within 12 hours",   freeThreshold:50,  manageStore:true,  partners:true  });
  const [standard, setStandard] = useState<DeliveryConfig>({ enabled:true,  speed:"1–2 Business Days", freeThreshold:30,  manageStore:false, partners:true  });
  const [nationwide,setNationwide]=useState<DeliveryConfig>({ enabled:true, speed:"5–7 Business Days",  freeThreshold:100, manageStore:false, partners:true  });
  const [storeHours,setStoreHours]=useState<Record<Day,DayHours>>(
    DAYS.reduce((a,d) => { a[d]={open:"09:00",close:"18:00",closed:false}; return a; }, {} as Record<Day,DayHours>)
  );
  const [globalOpen,  setGlobalOpen]  = useState("09:00");
  const [globalClose, setGlobalClose] = useState("18:00");
  const [applied, setApplied] = useState(false);

  const applyToAll = () => {
    const u = { ...storeHours };
    DAYS.forEach(d => { if(!u[d].closed) { u[d].open=globalOpen; u[d].close=globalClose; } });
    setStoreHours(u);
    setApplied(true);
    setTimeout(() => setApplied(false), 1600);
  };

  const toggleDay = (day:Day) =>
    setStoreHours(p => ({ ...p, [day]:{ ...p[day], closed:!p[day].closed } }));

  const updateTime = (day:Day, field:"open"|"close", val:string) =>
    setStoreHours(p => ({ ...p, [day]:{ ...p[day], [field]:val } }));

  const openCount = DAYS.filter(d => !storeHours[d].closed).length;

  return (
    <div className="space-y-5 py-5" style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Pickup Only Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-100/50 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
            <MapPin size={18} strokeWidth={2.5} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-black text-amber-900">Pickup Only Mode</p>
            <p className="text-[13px] text-amber-800/80 mt-0.5 font-medium">
              No delivery enabled. Your store is in <span className="font-black">Pickup Only</span> mode.
            </p>
            <div className="flex items-start gap-2 mt-3 p-3 bg-white/70 rounded-xl border border-amber-200">
              <Info size={14} strokeWidth={2.5} className="text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-black text-orange-900">Default Discovery Radius: 5 KM</p>
                <p className="text-[11px] text-orange-800/70 mt-0.5 font-medium leading-relaxed">
                  Customers within 5 km can discover and place pickup orders from your store.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delivery Cards ── */}
      <SettingsCard title="Instant Delivery"    subtitle="Ultra-fast, same-day" icon={Zap}   enabled={instant.enabled}   onToggle={v=>setInstant({...instant,enabled:v})}     color="orange">
        <DeliveryFields data={instant}    setData={setInstant}    />
      </SettingsCard>

      <SettingsCard title="Standard Delivery"   subtitle="City-wide or intercity" icon={Truck} enabled={standard.enabled}  onToggle={v=>setStandard({...standard,enabled:v})}   color="blue">
        <DeliveryFields data={standard}   setData={setStandard}   />
      </SettingsCard>

      <SettingsCard title="Nationwide Delivery" subtitle="Ship anywhere"         icon={Globe} enabled={nationwide.enabled} onToggle={v=>setNationwide({...nationwide,enabled:v})} color="green">
        <DeliveryFields data={nationwide} setData={setNationwide} />
      </SettingsCard>

      {/* ── Operating Hours ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="h-1 w-full bg-indigo-600" />
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 ring-1 ring-indigo-200">
              <Clock size={18} strokeWidth={2.5} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-[15px] font-black text-slate-800">Operating Hours</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                {openCount} of {DAYS.length} days open
              </p>
            </div>
          </div>

          {/* Global time setter */}
          <div className="flex flex-wrap items-end gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opens</label>
              <input
                type="time"
                value={globalOpen}
                onChange={(e) => setGlobalOpen(e.target.value)}
                className="mt-1.5 block px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
              />
            </div>
            <span className="text-slate-300 font-black text-lg mb-2.5">→</span>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Closes</label>
              <input
                type="time"
                value={globalClose}
                onChange={(e) => setGlobalClose(e.target.value)}
                className="mt-1.5 block px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
              />
            </div>
            <button
              onClick={applyToAll}
              className={`ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-black transition-all duration-200 shadow-sm ${
                applied
                  ? "bg-emerald-500 text-white shadow-emerald-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300"
              }`}
            >
              {applied ? <><Check size={14} strokeWidth={3} />Applied!</> : <><Copy size={14} strokeWidth={2.5} />Apply to All</>}
            </button>
          </div>
        </div>

        {/* Days grid */}
        <div className="p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="w-3 h-px bg-slate-300 inline-block" />
            Click to toggle · Adjust individual times
            <span className="w-3 h-px bg-slate-300 inline-block" />
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DAYS.map((day) => {
              const isOpen = !storeHours[day].closed;
              return (
                <div
                  key={day}
                  className={`rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                    isOpen ? "border-indigo-200 bg-indigo-50/30" : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  {/* Day header — click to toggle */}
                  <div
                    className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none"
                    onClick={() => toggleDay(day)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isOpen ? "bg-indigo-600":"bg-slate-200"}`}>
                        {isOpen
                          ? <Check size={11} strokeWidth={3} className="text-white" />
                          : <X size={10} strokeWidth={3} className="text-slate-400" />
                        }
                      </div>
                      <span className={`text-[13px] font-black ${isOpen ? "text-slate-800":"text-slate-400"}`}>
                        {DAY_SHORT[day]}
                        <span className="hidden sm:inline font-semibold text-slate-400"> · {day.slice(3)}</span>
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${isOpen ? "bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-400"}`}>
                      {isOpen ? "Open" : "Closed"}
                    </span>
                  </div>

                  {/* Time inputs — only when open */}
                  {isOpen && (
                    <div className="flex items-center gap-1.5 px-3 pb-3">
                      <input
                        type="time"
                        value={storeHours[day].open}
                        onChange={(e) => updateTime(day,"open",e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-white border border-indigo-100 text-[12px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none"
                      />
                      <span className="text-slate-300 font-bold text-xs">–</span>
                      <input
                        type="time"
                        value={storeHours[day].close}
                        onChange={(e) => updateTime(day,"close",e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-white border border-indigo-100 text-[12px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}