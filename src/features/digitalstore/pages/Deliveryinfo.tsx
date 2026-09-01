import { useState, useEffect } from "react";
import { IndianRupee, MapPin, ShoppingBag, Truck, Zap, Globe, Timer, Check } from "lucide-react";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";

type DeliveryConfig = {
  enabled: boolean;
  speed: string;
  freeThreshold: number;
  radius: number;
  minOrderAmount: number;
  chargePerKm: number;
  manageStore: boolean;
  partners: boolean;
  id?: number;
};

const DELIVERY_META: Record<"instant" | "standard" | "nationwide", {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  accentColor: string;
  activeBg: string;
  activeBorder: string;
  badgeColor: string;
}> = {
  instant: {
    title: "Instant Delivery",
    subtitle: "Same-day delivery within your local area",
    badge: "Fast",
    icon: Zap,
    accentColor: "text-blue-600",
    activeBg: "bg-blue-50/50",
    activeBorder: "border-blue-400",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  standard: {
    title: "Standard Delivery",
    subtitle: "City-wide delivery in 1–2 business days",
    badge: "Popular",
    icon: Truck,
    accentColor: "text-violet-600",
    activeBg: "bg-violet-50/40",
    activeBorder: "border-violet-400",
    badgeColor: "bg-violet-100 text-violet-700",
  },
  nationwide: {
    title: "Nationwide Delivery",
    subtitle: "Country-wide shipping in 5–7 business days",
    badge: "Wide",
    icon: Globe,
    accentColor: "text-indigo-600",
    activeBg: "bg-indigo-50/40",
    activeBorder: "border-indigo-400",
    badgeColor: "bg-indigo-100 text-indigo-700",
  },
};

function NumberField({
  label,
  icon: Icon,
  iconColor,
  prefix,
  suffix,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  prefix?: string;
  suffix?: string;
  value: number | string | undefined;
  onChange: (v: number | "") => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
        <Icon size={12} className={iconColor} />
        {label}
      </label>
      <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
        {prefix && (
          <span className="px-3 py-2.5 text-xs font-bold text-slate-500 bg-slate-50 border-r border-slate-200 shrink-0">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min="0"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent text-slate-700 min-w-0"
        />
        {suffix && (
          <span className="px-3 py-2.5 text-xs font-bold text-slate-500 bg-slate-50 border-l border-slate-200 shrink-0">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function StoreDeliveryCardInner({
  meta,
  Icon,
  data,
  updateDelivery,
}: {
  meta: typeof DELIVERY_META["instant"];
  Icon: React.ElementType;
  data: DeliveryConfig;
  updateDelivery: (field: keyof DeliveryConfig, value: any) => void;
}) {
  const enabled = data.enabled;

  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden
      ${enabled ? `${meta.activeBorder} ${meta.activeBg}` : "border-slate-200 bg-white opacity-80"}`}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${enabled ? meta.activeBg : "bg-slate-100"}`}>
            <Icon size={17} className={enabled ? meta.accentColor : "text-slate-400"} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold ${enabled ? "text-slate-800" : "text-slate-500"}`}>
                {meta.title}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${enabled ? meta.badgeColor : "bg-slate-100 text-slate-400"}`}>
                {meta.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => updateDelivery("enabled", !enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
            ${enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
          aria-label={`Toggle ${meta.title}`}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {enabled && (
        <div className="px-5 pb-5 pt-0 border-t border-slate-200/60 animate-in slide-in-from-top-1 fade-in duration-200">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberField
              label="Delivery Radius"
              icon={MapPin}
              iconColor="text-blue-500"
              value={data.radius}
              onChange={(v) => updateDelivery("radius", v)}
              suffix="km"
              placeholder="5"
            />
            <NumberField
              label="Free Delivery Above"
              icon={IndianRupee}
              iconColor="text-emerald-500"
              value={data.freeThreshold}
              onChange={(v) => updateDelivery("freeThreshold", v)}
              prefix="₹"
              placeholder="500"
            />
            <NumberField
              label="Minimum Order"
              icon={ShoppingBag}
              iconColor="text-amber-500"
              value={data.minOrderAmount}
              onChange={(v) => updateDelivery("minOrderAmount", v)}
              prefix="₹"
              placeholder="100"
            />
            <NumberField
              label="Charge per km"
              icon={Truck}
              iconColor="text-slate-500"
              value={data.chargePerKm}
              onChange={(v) => updateDelivery("chargePerKm", v)}
              prefix="₹"
              suffix="/km"
              placeholder="15"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeliveryPreferences({ onStatusChange }: { onStatusChange?: (status: React.ReactNode) => void }) {
  const { shop } = useBusinessApi();
  const [instant, setInstant] = useState<DeliveryConfig>({ enabled: false, speed: "Within 12 hours", freeThreshold: 50, radius: 5, minOrderAmount: 100, chargePerKm: 15, manageStore: true, partners: true });
  const [standard, setStandard] = useState<DeliveryConfig>({ enabled: false, speed: "1–2 Business Days", freeThreshold: 30, radius: 10, minOrderAmount: 150, chargePerKm: 10, manageStore: false, partners: true });
  const [nationwide, setNationwide] = useState<DeliveryConfig>({ enabled: false, speed: "5–7 Business Days", freeThreshold: 100, radius: 100, minOrderAmount: 300, chargePerKm: 5, manageStore: false, partners: true });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    shop.getDeliveryOptions(SHOP_ID).then(res => {
      if (res && res.data && Array.isArray(res.data)) {
        res.data.forEach((d: any) => {
          const conf = {
            enabled: true,
            speed: d.speed || "",
            freeThreshold: d.free_shipping_amount || 0,
            radius: d.radius || 0,
            minOrderAmount: d.min_order_amount || 0,
            chargePerKm: d.charge_per_km || 0,
            manageStore: d.delivery_by === "INHOUSE",
            partners: d.delivery_by === "PARTNERS",
            id: d.id
          };
          if (d.type === "INSTANT") setInstant(prev => ({ ...prev, ...conf }));
          else if (d.type === "STANDARD") setStandard(prev => ({ ...prev, ...conf }));
          else if (d.type === "NATIONWIDE") setNationwide(prev => ({ ...prev, ...conf }));
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
            radius: conf.radius,
            min_order_amount: conf.minOrderAmount,
            charge_per_km: conf.chargePerKm,
            delivery_by: conf.partners ? "PARTNERS" : "INHOUSE"
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
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${activeCount > 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
            {activeCount} Active
          </span>
        </div>
      );
    }
  }, [activeCount, onStatusChange]);

  const updateDelivery = (type: "instant" | "standard" | "nationwide", field: keyof DeliveryConfig, value: any) => {
    if (type === "instant") setInstant(prev => ({ ...prev, [field]: value }));
    else if (type === "standard") setStandard(prev => ({ ...prev, [field]: value }));
    else if (type === "nationwide") setNationwide(prev => ({ ...prev, [field]: value }));
  };

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
        </div>
      )}

      {/* ── Delivery Cards from Step 3 ── */}
      <div className="space-y-3">
        <StoreDeliveryCardInner
          meta={DELIVERY_META.instant}
          Icon={DELIVERY_META.instant.icon}
          data={instant}
          updateDelivery={(field, value) => updateDelivery("instant", field, value)}
        />
        <StoreDeliveryCardInner
          meta={DELIVERY_META.standard}
          Icon={DELIVERY_META.standard.icon}
          data={standard}
          updateDelivery={(field, value) => updateDelivery("standard", field, value)}
        />
        <StoreDeliveryCardInner
          meta={DELIVERY_META.nationwide}
          Icon={DELIVERY_META.nationwide.icon}
          data={nationwide}
          updateDelivery={(field, value) => updateDelivery("nationwide", field, value)}
        />
      </div>

      {/* Helper note */}
      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <Timer size={13} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-600">Tip:</span> Set the free delivery threshold to encourage larger orders. Delivery charges apply per km above the free threshold.
        </p>
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
