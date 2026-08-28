import { StoreFormData, DeliveryConfig } from "@/features/digitalstore/type";
import { IndianRupee, MapPin, ShoppingBag, Truck, Zap, Globe, Timer } from "lucide-react";

interface Step3Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
}

// ─── Delivery type metadata ───────────────────────────────────────────────────

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

// ─── Reusable sub-components ──────────────────────────────────────────────────

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


// Inner component needs access to form/setForm — pass via closure in parent
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
      {/* Card Header */}
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

        {/* Toggle */}
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

      {/* Expanded settings */}
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

// ─── Main Component ───────────────────────────────────────────────────────────

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

  const activeCount = Object.values(form.deliveryOptions).filter(d => d.enabled).length;

  const DeliveryCardWrapped = ({ type }: { type: "instant" | "standard" | "nationwide" }) => (
    <StoreDeliveryCardInner
      meta={DELIVERY_META[type]}
      Icon={DELIVERY_META[type].icon}
      data={form.deliveryOptions[type]}
      updateDelivery={(field, value) => updateDelivery(type, field, value)}
    />
  );

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Delivery Zones & Pricing</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Enable the delivery types you want to offer and configure pricing for each.</p>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${activeCount > 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
          {activeCount} Active
        </span>
      </div>

      {/* Delivery cards */}
      <div className="space-y-3">
        <DeliveryCardWrapped type="instant" />
        <DeliveryCardWrapped type="standard" />
        <DeliveryCardWrapped type="nationwide" />
      </div>

      {/* Helper note */}
      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <Timer size={13} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-600">Tip:</span> Set the free delivery threshold to encourage larger orders. Delivery charges apply per km above the free threshold.
        </p>
      </div>

    </div>
  );
}
