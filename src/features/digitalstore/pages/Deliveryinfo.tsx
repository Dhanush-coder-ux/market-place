import { useState } from "react";
import {
  Truck, Zap, Globe,  
  Info, MapPin, IndianRupee, Timer,
  Store, Users, Check, ChevronDown
} from "lucide-react";

/* ───────────── Types ───────────── */
type DeliveryConfig = { 
  enabled: boolean; 
  speed: string; 
  freeThreshold: number; 
  manageStore: boolean; 
  partners: boolean;
};

const COLOR_MAP = {
  orange: { bg: "bg-orange-50/50", text: "text-orange-600", border: "border-orange-100", toggle: "bg-orange-400" },
  blue:   { bg: "bg-indigo-50/50", text: "text-indigo-600", border: "border-indigo-100", toggle: "bg-indigo-400" },
  green:  { bg: "bg-emerald-50/50", text: "text-emerald-600", border: "border-emerald-100", toggle: "bg-emerald-400" },
};

/* ───────────── Toggle ───────────── */
function Toggle({ checked, onChange, color = "bg-slate-700" }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 ${
        checked ? color : "bg-slate-200 hover:bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ───────────── Settings Card ───────────── */
function SettingsCard({
  title, subtitle, icon: Icon, enabled, onToggle, color, children,
}: {
  title: string; subtitle: string; icon: any; enabled: boolean;
  onToggle: (v: boolean) => void; color: "orange" | "blue" | "green"; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const c = COLOR_MAP[color];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="p-6">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${c.bg} ${c.border}`}>
              <Icon size={18} strokeWidth={2} className={c.text} />
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-slate-800">{title}</h3>
              <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-[13px] font-medium transition-colors ${enabled ? "text-slate-700" : "text-slate-400"}`}>
              {enabled ? "Active" : "Disabled"}
            </span>
            <Toggle checked={enabled} onChange={onToggle} color={c.toggle} />
          </div>
        </div>

        {/* Expand / Collapse Trigger */}
        {enabled && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            {open ? "Hide configuration" : "Show configuration"}
          </button>
        )}

        {/* Content Area */}
        <div 
          className={`grid transition-all duration-300 ease-in-out ${enabled && open ? "grid-rows-[1fr] opacity-100 mt-5" : "grid-rows-[0fr] opacity-0 mt-0"}`}
        >
          <div className="overflow-hidden">
            <div className="pt-5 border-t border-slate-100">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Delivery Fields ───────────── */
function DeliveryFields({ data, setData }: { data: DeliveryConfig; setData: (d: DeliveryConfig) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Speed Selection */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5">
            <Timer size={14} strokeWidth={2} /> Delivery Speed
          </label>
          <select
            value={data.speed}
            onChange={(e) => setData({ ...data, speed: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200 transition-all hover:bg-slate-50/50"
          >
            <option>Within 12 hours</option>
            <option>1–2 Business Days</option>
            <option>5–7 Business Days</option>
          </select>
        </div>

        {/* Free Threshold Input */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5">
            <IndianRupee size={14} strokeWidth={2} /> Free Shipping Above
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
            <input
              type="number"
              value={data.freeThreshold}
              onChange={(e) => setData({ ...data, freeThreshold: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-8 text-[14px] text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200 transition-all hover:bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Fulfillment Methods (Selection Tiles) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: "manageStore" as const, icon: Store, label: "Manage by Store", desc: "Your in-house team handles delivery." },
          { key: "partners" as const, icon: Users, label: "Delivery Partners", desc: "Assign orders to third-party couriers." },
        ].map(({ key, icon: Icon, label, desc }) => (
          <button
            key={key}
            onClick={() => setData({ ...data, [key]: !data[key] })}
            className={`group flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
              data[key] 
                ? "border-slate-400 bg-slate-50 shadow-sm" 
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <Icon size={18} className={`mt-0.5 transition-colors ${data[key] ? "text-slate-800" : "text-slate-400"}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[14px] font-medium leading-tight ${data[key] ? "text-slate-900" : "text-slate-700"}`}>
                {label}
              </p>
              <p className="text-[13px] text-slate-500 mt-1 leading-snug">
                {desc}
              </p>
            </div>
            {data[key] && <Check size={16} strokeWidth={2.5} className="text-slate-700 ml-auto shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Main Page ───────────── */
export default function DeliveryPreferences() {
  const [instant, setInstant] = useState<DeliveryConfig>({ enabled: true, speed: "Within 12 hours", freeThreshold: 50, manageStore: true, partners: true });
  const [standard, setStandard] = useState<DeliveryConfig>({ enabled: true, speed: "1–2 Business Days", freeThreshold: 30, manageStore: false, partners: true });
  const [nationwide, setNationwide] = useState<DeliveryConfig>({ enabled: false, speed: "5–7 Business Days", freeThreshold: 100, manageStore: false, partners: true });

  return (
    <div className=" mx-auto space-y-6 py-8 antialiased">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-medium text-slate-900 tracking-tight">Delivery Preferences</h1>
        <p className="text-[14px] text-slate-500 mt-1">Manage fulfillment zones, shipping speeds, and active courier partners.</p>
      </div>

      {/* ── Pickup Only Banner ── */}
      <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-5">
        <div className="flex items-start gap-4">
          <MapPin size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-medium text-amber-900">Pickup Only Mode Active</h4>
            <p className="text-[13px] text-amber-800/80 mt-1 leading-relaxed">
              Delivery is currently restricted. Your store is only accepting pickup orders.
            </p>
            
            <div className="flex items-start gap-2.5 mt-4 p-3 bg-white/60 rounded-lg border border-amber-100/50">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-medium text-amber-900">Default Discovery Radius: 5 KM</p>
                <p className="text-[12px] text-amber-800/70 mt-0.5 leading-relaxed">
                  Customers within 5 kilometers can discover your store and place local pickup orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delivery Cards ── */}
      <div className="space-y-5">
        <SettingsCard 
          title="Instant Delivery" 
          subtitle="Ultra-fast, same-day delivery for local customers" 
          icon={Zap} 
          enabled={instant.enabled} 
          onToggle={(v) => setInstant({ ...instant, enabled: v })} 
          color="orange"
        >
          <DeliveryFields data={instant} setData={setInstant} />
        </SettingsCard>

        <SettingsCard 
          title="Standard Delivery" 
          subtitle="City-wide or intercity routing" 
          icon={Truck} 
          enabled={standard.enabled} 
          onToggle={(v) => setStandard({ ...standard, enabled: v })} 
          color="blue"
        >
          <DeliveryFields data={standard} setData={setStandard} />
        </SettingsCard>

        <SettingsCard 
          title="Nationwide Delivery" 
          subtitle="Ship anywhere across the country" 
          icon={Globe} 
          enabled={nationwide.enabled} 
          onToggle={(v) => setNationwide({ ...nationwide, enabled: v })} 
          color="green"
        >
          <DeliveryFields data={nationwide} setData={setNationwide} />
        </SettingsCard>
      </div>

    </div>
  );
}