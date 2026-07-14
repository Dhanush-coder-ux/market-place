import { useState, useEffect } from "react";
import {
  Truck, Zap, Globe,
  Info, MapPin, IndianRupee, Timer,
  Store, Users, Check, ChevronDown,
  CheckCircle2, XCircle, Package,
} from "lucide-react";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";

/* ── Types ──────────────────────────────────────────────────────────────── */
type DeliveryConfig = {
  enabled: boolean;
  speed: string;
  freeThreshold: number;
  manageStore: boolean;
  partners: boolean;
  id?: number;
};

/* ── Color Map (blues + muted, no violet) ───────────────────────────────── */
// ... (omitting replacing all of this, just replacing the page component)
// Actually I need to replace from the page component start.
const COLOR_MAP = {
  orange: {
    iconBg:    "#fff7ed",
    iconColor: "#ea580c",
    border:    "#fed7aa",
    activeBg:  "#fff7ed",
    badge:     { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
    toggle:    "#f97316",
    bar:       "#f97316",
  },
  blue: {
    iconBg:    "#eff6ff",
    iconColor: "#2563eb",
    border:    "#bfdbfe",
    activeBg:  "#eff6ff",
    badge:     { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    toggle:    "#3b82f6",
    bar:       "#3b82f6",
  },
  green: {
    iconBg:    "#f0fdf4",
    iconColor: "#16a34a",
    border:    "#bbf7d0",
    activeBg:  "#f0fdf4",
    badge:     { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    toggle:    "#22c55e",
    bar:       "#22c55e",
  },
};

const SPEED_OPTIONS = ["Within 12 hours", "1–2 Business Days", "3–5 Business Days", "5–7 Business Days"];

/* ── Toggle ─────────────────────────────────────────────────────────────── */
function Toggle({
  checked, onChange, color = "#3b82f6",
}: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
      style={{ background: checked ? color : "#e2e8f0" }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}

/* ── Fulfillment Tile ────────────────────────────────────────────────────── */
function FulfillmentTile({
  icon: Icon, label, desc, selected, onClick, color,
}: {
  icon: React.ElementType; label: string; desc: string;
  selected: boolean; onClick: () => void; color: typeof COLOR_MAP[keyof typeof COLOR_MAP];
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-xl border-[1.5px] text-left transition-all duration-150 w-full"
      style={{
        background:   selected ? color.activeBg : "#ffffff",
        borderColor:  selected ? color.border   : "#e2e8f0",
        boxShadow:    selected ? `0 0 0 3px ${color.iconBg}` : "none",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: selected ? color.iconBg : "#f8fafc", color: selected ? color.iconColor : "#94a3b8" }}
      >
        <Icon size={16} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-700 leading-tight mb-0.5">{label}</p>
        <p className="text-[11.5px] text-slate-400 leading-snug">{desc}</p>
      </div>
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-[1.5px] transition-all"
        style={{
          background:  selected ? color.iconColor : "transparent",
          borderColor: selected ? color.iconColor : "#cbd5e1",
        }}
      >
        {selected && <Check size={11} strokeWidth={3} className="text-white" />}
      </div>
    </button>
  );
}

/* ── Delivery Fields ─────────────────────────────────────────────────────── */
function DeliveryFields({
  data, setData, color,
}: { data: DeliveryConfig; setData: (d: DeliveryConfig) => void; color: typeof COLOR_MAP[keyof typeof COLOR_MAP] }) {
  return (
    <div className="space-y-5">
      {/* Speed + Threshold row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Speed */}
        <div>
          <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 tracking-wide uppercase mb-2">
            <Timer size={12} strokeWidth={2.5} /> Delivery Speed
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {SPEED_OPTIONS.map((opt) => {
              const active = data.speed === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setData({ ...data, speed: opt })}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-[1.5px] text-left transition-all"
                  style={{
                    background:  active ? color.activeBg : "#ffffff",
                    borderColor: active ? color.border   : "#e2e8f0",
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center shrink-0"
                    style={{
                      background:  active ? color.iconColor : "transparent",
                      borderColor: active ? color.iconColor : "#cbd5e1",
                    }}
                  >
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />}
                  </div>
                  <span className="text-[12.5px] font-semibold" style={{ color: active ? color.iconColor : "#64748b" }}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Free threshold + fulfillment */}
        <div className="space-y-4">
          {/* Free threshold */}
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 tracking-wide uppercase mb-2">
              <IndianRupee size={12} strokeWidth={2.5} /> Free Shipping Above
            </label>
            <div className="relative">
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold"
                style={{ color: color.iconColor }}
              >₹</span>
              <input
                type="number"
                value={data.freeThreshold}
                onChange={(e) => setData({ ...data, freeThreshold: Number(e.target.value) })}
                className="w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-2.5 pl-8 text-[14px] font-semibold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </div>
            <p className="text-[10.5px] text-slate-400 mt-1.5">Orders above this amount get free delivery</p>
          </div>

          {/* Fulfillment method */}
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 tracking-wide uppercase mb-2">
              <Package size={12} strokeWidth={2.5} /> Fulfillment Method
            </label>
            <div className="space-y-2">
              {[
                { key: "manageStore" as const, icon: Store, label: "In-house Team", desc: "Your staff handles delivery" },
                { key: "partners"   as const, icon: Users, label: "Delivery Partners", desc: "Third-party couriers" },
              ].map(({ key, icon, label, desc }) => (
                <FulfillmentTile
                  key={key}
                  icon={icon}
                  label={label}
                  desc={desc}
                  selected={data[key]}
                  onClick={() => setData({ ...data, [key]: !data[key] })}
                  color={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Settings Card ───────────────────────────────────────────────────────── */
function SettingsCard({
  title, subtitle, icon: Icon, enabled, onToggle, color, tag, children,
}: {
  title: string; subtitle: string; icon: React.ElementType;
  enabled: boolean; onToggle: (v: boolean) => void;
  color: "orange" | "blue" | "green"; tag?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const c = COLOR_MAP[color];

  return (
    <div
      className="bg-white rounded-2xl border-[1.5px] overflow-hidden transition-all duration-200"
      style={{
        borderColor: enabled ? c.border : "#e2e8f0",
        boxShadow: enabled ? `0 2px 16px rgba(0,0,0,0.05)` : "none",
      }}
    >
      {/* Colored top accent */}
      <div className="h-[3px]" style={{ background: enabled ? c.bar : "#e2e8f0" }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: enabled ? c.iconBg : "#f8fafc", color: enabled ? c.iconColor : "#94a3b8" }}
            >
              <Icon size={20} strokeWidth={2} />
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
                {tag && (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase border"
                    style={c.badge}
                  >
                    {tag}
                  </span>
                )}
                {/* Status pill */}
                <span
                  className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border"
                  style={
                    enabled
                      ? { background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }
                      : { background: "#f8fafc",  color: "#94a3b8", borderColor: "#e2e8f0" }
                  }
                >
                  {enabled
                    ? <><CheckCircle2 size={10} /> Active</>
                    : <><XCircle size={10} /> Disabled</>
                  }
                </span>
              </div>
              <p className="text-[12.5px] text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>

          {/* Toggle */}
          <Toggle checked={enabled} onChange={onToggle} color={c.toggle} />
        </div>

        {/* Expand / collapse */}
        {enabled && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronDown
              size={13}
              className="transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
            {open ? "Collapse settings" : "Show settings"}
          </button>
        )}

        {/* Collapsible content */}
        <div
          className="grid transition-all duration-300 ease-in-out"
          style={{ gridTemplateRows: enabled && open ? "1fr" : "0fr", opacity: enabled && open ? 1 : 0, marginTop: enabled && open ? "20px" : 0 }}
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

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function DeliveryPreferences({ onStatusChange }: { onStatusChange?: (status: React.ReactNode) => void }) {
  const { shop } = useBusinessApi();
  const [instant,    setInstant]    = useState<DeliveryConfig>({ enabled: false, speed: "Within 12 hours",    freeThreshold: 50,  manageStore: true,  partners: true  });
  const [standard,   setStandard]   = useState<DeliveryConfig>({ enabled: false, speed: "1–2 Business Days",  freeThreshold: 30,  manageStore: false, partners: true  });
  const [nationwide, setNationwide] = useState<DeliveryConfig>({ enabled: false, speed: "5–7 Business Days",  freeThreshold: 100, manageStore: false, partners: true  });
  const [isSaving, setIsSaving]     = useState(false);

  useEffect(() => {
    shop.getDeliveryOptions(SHOP_ID).then(res => {
      if (res && res.data && Array.isArray(res.data)) {
        res.data.forEach((d: any) => {
          const conf = {
            enabled: true,
            speed: d.speed || "",
            freeThreshold: d.free_shipping_amount || 0,
            manageStore: d.delivery_by === "INHOUSE",
            partners: d.delivery_by === "PARTNERS",
            id: d.id
          };
          if (d.type === "INSTANT") setInstant(conf);
          else if (d.type === "STANDARD") setStandard(conf);
          else if (d.type === "NATIONWIDE") setNationwide(conf);
        });
      }
    }).catch(err => console.error("Failed to fetch delivery options:", err));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const types = [
        { type: "INSTANT", conf: instant, set: setInstant },
        { type: "STANDARD", conf: standard, set: setStandard },
        { type: "NATIONWIDE", conf: nationwide, set: setNationwide }
      ];
      const promises = types.map(async ({ type, conf, set }) => {
        if (!conf.enabled) {
          if (conf.id) {
            await shop.deleteDeliveryOption(conf.id);
            set(p => ({ ...p, id: undefined }));
          }
        } else {
          const payload = {
            type,
            speed: conf.speed,
            free_shipping_amount: conf.freeThreshold,
            delivery_by: conf.partners ? "PARTNERS" : "INHOUSE" // Pick one, prioritize partners if both checked
          };
          if (conf.id) {
            await shop.updateDeliveryOption(conf.id, { ...payload, id: conf.id });
          } else {
            const res = await shop.createDeliveryOption(SHOP_ID, payload);
            if (res && res.data && res.data.id) {
              set(p => ({ ...p, id: res.data.id }));
            }
          }
        }
      });
      await Promise.all(promises);
      alert("Delivery preferences saved successfully!");
    } catch (err) {
      console.error("Failed to save delivery preferences", err);
      alert("Failed to save delivery preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const activeCount = [instant, standard, nationwide].filter((d) => d.enabled).length;

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
            <CheckCircle2 size={12} className="text-blue-500" />
            <span className="text-[12px] font-bold text-blue-600">{activeCount} Active</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-[12px] font-bold text-slate-500">{3 - activeCount} Disabled</span>
          </div>
        </div>
      );
    }
  }, [activeCount, onStatusChange]);

  return (
    <div className="mx-auto py-6 px-1 space-y-5" style={{ fontFamily: "Inter, Poppins, sans-serif" }}>

      {/* ── Page Header ── */}
      {!onStatusChange && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff", color: "#3b82f6" }}>
                <Truck size={18} strokeWidth={2.5} />
              </div>
              <h1 className="text-[20px] font-extrabold text-slate-800 tracking-tight">Delivery Preferences</h1>
            </div>
            <p className="text-[13px] text-slate-400 ml-12">
              Manage fulfillment zones, shipping speeds, and courier partners.
            </p>
          </div>

          {/* Summary pills */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
              <CheckCircle2 size={12} className="text-blue-500" />
              <span className="text-[12px] font-bold text-blue-600">{activeCount} Active</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="text-[12px] font-bold text-slate-500">{3 - activeCount} Disabled</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Pickup Banner ── */}
      <div className="rounded-2xl border-[1.5px] border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <MapPin size={16} className="text-amber-600" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-[13.5px] font-bold text-amber-900 mb-0.5">Pickup Only Mode Active</h4>
            <p className="text-[12.5px] text-amber-700 leading-relaxed">
              Delivery is currently restricted. Your store is only accepting pickup orders.
            </p>
            <div className="flex items-start gap-2 mt-3 p-3 bg-white/70 rounded-xl border border-amber-100">
              <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-amber-800">Default Discovery Radius: 5 KM</p>
                <p className="text-[11.5px] text-amber-700/70 mt-0.5 leading-relaxed">
                  Customers within 5 km can discover your store and place local pickup orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delivery Zone Summary bar ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Instant",    enabled: instant.enabled,    color: "#f97316", bg: "#fff7ed", border: "#fed7aa", icon: <Zap  size={14} strokeWidth={2.5} />, speed: instant.speed    },
          { label: "Standard",   enabled: standard.enabled,   color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: <Truck size={14} strokeWidth={2.5} />, speed: standard.speed   },
          { label: "Nationwide", enabled: nationwide.enabled, color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", icon: <Globe size={14} strokeWidth={2.5} />, speed: nationwide.speed },
        ].map((z) => (
          <div
            key={z.label}
            className="flex items-center gap-3 p-3.5 rounded-xl border-[1.5px]"
            style={{ background: z.enabled ? z.bg : "#f8fafc", borderColor: z.enabled ? z.border : "#e2e8f0" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: z.enabled ? z.bg : "#f1f5f9", color: z.enabled ? z.color : "#94a3b8", border: `1.5px solid ${z.enabled ? z.border : "#e2e8f0"}` }}
            >
              {z.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-slate-700 leading-none mb-0.5">{z.label}</p>
              <p className="text-[10.5px] text-slate-400 truncate">{z.enabled ? z.speed : "Disabled"}</p>
            </div>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: z.enabled ? z.color : "#cbd5e1" }}
            />
          </div>
        ))}
      </div>

      {/* ── Delivery Cards ── */}
      <div className="space-y-4">
        <SettingsCard
          title="Instant Delivery"
          subtitle="Ultra-fast, same-day delivery for local customers"
          icon={Zap}
          enabled={instant.enabled}
          onToggle={(v) => setInstant({ ...instant, enabled: v })}
          color="orange"
          tag="Popular"
        >
          <DeliveryFields data={instant} setData={setInstant} color={COLOR_MAP.orange} />
        </SettingsCard>

        <SettingsCard
          title="Standard Delivery"
          subtitle="City-wide or intercity routing"
          icon={Truck}
          enabled={standard.enabled}
          onToggle={(v) => setStandard({ ...standard, enabled: v })}
          color="blue"
        >
          <DeliveryFields data={standard} setData={setStandard} color={COLOR_MAP.blue} />
        </SettingsCard>

        <SettingsCard
          title="Nationwide Delivery"
          subtitle="Ship anywhere across the country"
          icon={Globe}
          enabled={nationwide.enabled}
          onToggle={(v) => setNationwide({ ...nationwide, enabled: v })}
          color="green"
        >
          <DeliveryFields data={nationwide} setData={setNationwide} color={COLOR_MAP.green} />
        </SettingsCard>
      </div>

      {/* ── Save Button ── */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13.5px] font-bold text-white transition-all shadow-md ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}
          style={{ background: "#3b82f6", boxShadow: "0 4px 14px rgba(59,130,246,0.3)" }}
        >
          {isSaving ? <Timer size={15} className="animate-spin" /> : <Check size={15} strokeWidth={3} />}
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
