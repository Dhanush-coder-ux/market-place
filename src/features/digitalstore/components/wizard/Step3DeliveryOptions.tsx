import React from "react";
import { IndianRupee, MapPin, ShoppingBag, Truck, Zap, Globe, Timer, Sparkles, ShieldCheck } from "lucide-react";
import { StoreFormData } from "@/features/digitalstore/type";

interface Step3Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
}

const DELIVERY_META: Record<
  "instant" | "standard" | "nationwide",
  {
    title: string;
    subtitle: string;
    badge: string;
    icon: React.ElementType;
    accentColor: string;
    activeBg: string;
    activeBorder: string;
    badgeColor: string;
    defaultSpeed: string;
  }
> = {
  standard: {
    title: "Normal Delivery",
    subtitle: "Standard shipping option for your regular orders",
    badge: "Standard",
    icon: Truck,
    accentColor: "text-blue-600",
    activeBg: "bg-blue-50/40",
    activeBorder: "border-blue-400",
    badgeColor: "bg-blue-100 text-blue-700",
    defaultSpeed: "2–3 Business Days"
  },
  instant: {
    title: "Express Delivery",
    subtitle: "Fast priority delivery for urgent customer orders",
    badge: "Fast",
    icon: Zap,
    accentColor: "text-amber-600",
    activeBg: "bg-amber-50/40",
    activeBorder: "border-amber-400",
    badgeColor: "bg-amber-100 text-amber-700",
    defaultSpeed: "Within 12 Hours"
  },
  nationwide: {
    title: "Same-Day Delivery",
    subtitle: "Deliver orders on the exact same day within your local radius",
    badge: "Urgent",
    icon: Globe,
    accentColor: "text-purple-600",
    activeBg: "bg-purple-50/40",
    activeBorder: "border-purple-400",
    badgeColor: "bg-purple-100 text-purple-700",
    defaultSpeed: "Within 3–4 Hours"
  },
};

function InputField({
  label,
  icon: Icon,
  iconColor,
  prefix,
  suffix,
  value,
  onChange,
  type = "number",
  placeholder,
}: {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  prefix?: string;
  suffix?: string;
  value: number | string | undefined;
  onChange: (v: any) => void;
  type?: "number" | "text";
  placeholder?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
        <Icon size={12} className={iconColor} />
        {label}
      </label>
      <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all shadow-xs">
        {prefix && (
          <span className="px-3 py-2.5 text-xs font-bold text-slate-500 bg-slate-50 border-r border-slate-200 shrink-0">
            {prefix}
          </span>
        )}
        <input
          type={type}
          min={type === "number" ? "0" : undefined}
          value={value ?? ""}
          onChange={(e) => {
            if (type === "number") {
              onChange(e.target.value === "" ? "" : Number(e.target.value));
            } else {
              onChange(e.target.value);
            }
          }}
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
  data,
  updateDelivery,
}: {
  meta: (typeof DELIVERY_META)["instant"];
  data: any;
  updateDelivery: (field: string, value: any) => void;
}) {
  const Icon = meta.icon;
  const enabled = data?.enabled;

  return (
    <div
      className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        enabled ? `${meta.activeBorder} ${meta.activeBg} shadow-xs` : "border-slate-200 bg-white opacity-80"
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              enabled ? "bg-white shadow-xs" : "bg-slate-100"
            }`}
          >
            <Icon size={18} className={enabled ? meta.accentColor : "text-slate-400"} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold ${enabled ? "text-slate-800" : "text-slate-500"}`}>
                {meta.title}
              </h4>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  enabled ? meta.badgeColor : "bg-slate-100 text-slate-400"
                }`}
              >
                {meta.badge}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={() => updateDelivery("enabled", !enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            enabled ? "bg-blue-600" : "bg-slate-300"
          }`}
          aria-label={`Toggle ${meta.title}`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Expanded settings */}
      {enabled && (
        <div className="px-5 pb-5 pt-0 border-t border-slate-200/60 animate-in slide-in-from-top-1 fade-in duration-200">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Minimum Order Value"
              icon={ShoppingBag}
              iconColor="text-amber-500"
              value={data?.minOrderAmount}
              onChange={(v) => updateDelivery("minOrderAmount", v)}
              prefix="₹"
              placeholder="0"
            />

            <InputField
              label="Estimated Delivery Time"
              icon={Timer}
              iconColor="text-blue-500"
              type="text"
              value={data?.speed}
              onChange={(v) => updateDelivery("speed", v)}
              placeholder={meta.defaultSpeed}
            />

            <InputField
              label="Delivery Charge"
              icon={Truck}
              iconColor="text-slate-500"
              value={data?.chargePerKm}
              onChange={(v) => updateDelivery("chargePerKm", v)}
              prefix="₹"
              placeholder="40"
            />

            <InputField
              label="Free Delivery Above"
              icon={IndianRupee}
              iconColor="text-emerald-500"
              value={data?.freeThreshold}
              onChange={(v) => updateDelivery("freeThreshold", v)}
              prefix="₹"
              placeholder="500"
            />

            <InputField
              label="Delivery Radius (Optional)"
              icon={MapPin}
              iconColor="text-indigo-500"
              value={data?.radius}
              onChange={(v) => updateDelivery("radius", v)}
              suffix="km"
              placeholder="10"
            />

            {/* Delivery By */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                <ShieldCheck size={12} className="text-violet-500" />
                Fulfillment Partner
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateDelivery("manageStore", true)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    data?.manageStore
                      ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  In-House Staff
                </button>
                <button
                  type="button"
                  onClick={() => updateDelivery("manageStore", false)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    !data?.manageStore
                      ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  3rd Party Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Step3DeliveryOptions({ form, setForm }: Step3Props) {
  const updateDelivery = (
    type: "instant" | "standard" | "nationwide",
    field: string,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      deliveryOptions: {
        ...prev.deliveryOptions,
        [type]: {
          ...prev.deliveryOptions[type],
          [field]: value,
        },
      },
    }));
  };

  const activeCount = Object.values(form.deliveryOptions).filter(
    (d) => d.enabled
  ).length;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-bold text-slate-800">
            Delivery Options & Zones
          </p>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            Enable the delivery services you provide and specify fees and delivery times.
          </p>
        </div>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
            activeCount > 0
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {activeCount} Active
        </span>
      </div>

      {/* Delivery cards */}
      <div className="space-y-4">
        <StoreDeliveryCardInner
          meta={DELIVERY_META.standard}
          data={form.deliveryOptions.standard}
          updateDelivery={(field, val) => updateDelivery("standard", field, val)}
        />
        <StoreDeliveryCardInner
          meta={DELIVERY_META.instant}
          data={form.deliveryOptions.instant}
          updateDelivery={(field, val) => updateDelivery("instant", field, val)}
        />
        <StoreDeliveryCardInner
          meta={DELIVERY_META.nationwide}
          data={form.deliveryOptions.nationwide}
          updateDelivery={(field, val) => updateDelivery("nationwide", field, val)}
        />
      </div>

      {/* Helper note */}
      <div className="flex items-start gap-2.5 bg-blue-50/60 border border-blue-100 rounded-2xl px-4 py-3.5">
        <Sparkles size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-[12px] text-blue-800 leading-relaxed">
          <span className="font-bold">Tip:</span> Set free delivery thresholds to encourage larger baskets.
        </p>
      </div>
    </div>
  );
}
