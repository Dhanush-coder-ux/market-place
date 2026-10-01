import React from "react";
import {
  IndianRupee,
  MapPin,
  ShoppingBag,
  Truck,
  Zap,
  Globe,
  Timer,
  Sparkles,
  Calculator,
  ArrowRight
} from "lucide-react";
import { StoreFormData } from "@/features/digitalstore/type";

interface Step3Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
}

const DELIVERY_META: Record<
  "instant" | "standard" | "nationwide" | "pickuponly",
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
    title: "Standard Delivery",
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
    title: "Instant Delivery",
    subtitle: "Fast priority delivery for urgent customer orders",
    badge: "Instant",
    icon: Zap,
    accentColor: "text-amber-600",
    activeBg: "bg-amber-50/40",
    activeBorder: "border-amber-400",
    badgeColor: "bg-amber-100 text-amber-700",
    defaultSpeed: "Within 12 Hours"
  },
  nationwide: {
    title: "Nationwide Delivery",
    subtitle: "Deliver orders across the country with our shipping partners",
    badge: "Nationwide",
    icon: Globe,
    accentColor: "text-purple-600",
    activeBg: "bg-purple-50/40",
    activeBorder: "border-purple-400",
    badgeColor: "bg-purple-100 text-purple-700",
    defaultSpeed: "5-7 Business Days"
  },
  pickuponly: {
    title: "Store Pickup",
    subtitle: "Customers can pick up their orders directly from the store",
    badge: "Pickup",
    icon: ShoppingBag,
    accentColor: "text-emerald-600",
    activeBg: "bg-emerald-50/40",
    activeBorder: "border-emerald-400",
    badgeColor: "bg-emerald-100 text-emerald-700",
    defaultSpeed: "Same Day"
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
  helperText
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
  helperText?: string;
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
      {helperText && (
        <p className="text-[10.5px] text-slate-400 mt-1 font-medium">{helperText}</p>
      )}
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
  const isPickup = meta.badge === "Pickup";
  const isDistanceTiered = data?.pricingModel === "DISTANCE_TIERED";

  const baseCharge = Number(data?.deliveryCharge) || 0;
  const baseKm = Number(data?.baseDistance) || 0;
  const stepKm = Number(data?.extraDistanceStep) || 1;
  const extraCharge = Number(data?.chargePerKm) || 0;
  const maxRadius = Number(data?.radius) || 0;
  const freeAbove = Number(data?.freeThreshold) || 0;

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
        <div className="px-5 pb-5 pt-0 border-t border-slate-200/60 animate-in slide-in-from-top-1 fade-in duration-200 space-y-4">
          {!isPickup ? (
            <>
              {/* Pricing Mode Selector */}
              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white/70 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Pricing Calculation Method</span>
                  <span className="text-[11px] text-slate-500">Choose how delivery charge is calculated for orders</span>
                </div>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => updateDelivery("pricingModel", "FLAT")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !isDistanceTiered
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Truck size={13} />
                    Flat Charge
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDelivery("pricingModel", "DISTANCE_TIERED")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isDistanceTiered
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <MapPin size={13} />
                    Distance-Based
                  </button>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isDistanceTiered ? (
                  <>
                    <InputField
                      label="Base Delivery Charge"
                      icon={Truck}
                      iconColor="text-blue-500"
                      value={data?.deliveryCharge}
                      onChange={(v) => updateDelivery("deliveryCharge", v)}
                      prefix="₹"
                      placeholder="100"
                      helperText="Charge for delivery up to base distance"
                    />

                    <InputField
                      label="Base Distance Limit"
                      icon={MapPin}
                      iconColor="text-blue-500"
                      value={data?.baseDistance}
                      onChange={(v) => updateDelivery("baseDistance", v)}
                      suffix="km"
                      placeholder="10"
                      helperText="E.g. ₹100 is charged for up to 10 km"
                    />

                    <InputField
                      label="Extra Distance Step"
                      icon={MapPin}
                      iconColor="text-indigo-500"
                      value={data?.extraDistanceStep}
                      onChange={(v) => updateDelivery("extraDistanceStep", v)}
                      suffix="km"
                      placeholder="1"
                      helperText="For every additional 1, 2, or 3 km"
                    />

                    <InputField
                      label="Extra Fee per Step"
                      icon={IndianRupee}
                      iconColor="text-indigo-500"
                      value={data?.chargePerKm}
                      onChange={(v) => updateDelivery("chargePerKm", v)}
                      prefix="₹"
                      placeholder="10"
                      helperText="Additional charge per distance step"
                    />
                  </>
                ) : (
                  <InputField
                    label="Flat Delivery Charge"
                    icon={Truck}
                    iconColor="text-slate-500"
                    value={data?.deliveryCharge}
                    onChange={(v) => updateDelivery("deliveryCharge", v)}
                    prefix="₹"
                    placeholder="40"
                    helperText="Fixed charge regardless of distance"
                  />
                )}

                <InputField
                  label="Free Delivery Above"
                  icon={IndianRupee}
                  iconColor="text-emerald-500"
                  value={data?.freeThreshold}
                  onChange={(v) => updateDelivery("freeThreshold", v)}
                  prefix="₹"
                  placeholder="500"
                  helperText="Free shipping threshold (0 to disable)"
                />

                <InputField
                  label="Delivery Radius (Optional)"
                  icon={MapPin}
                  iconColor="text-purple-500"
                  value={data?.radius}
                  onChange={(v) => updateDelivery("radius", v)}
                  suffix="km"
                  placeholder="15"
                  helperText="Max range your store delivers to (0 for unlimited)"
                />

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
              </div>

              {/* Dynamic Rate Summary */}
              <div className="bg-white/80 rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Live Delivery Rate Summary</span>
                </div>
                {isDistanceTiered ? (
                  <div className="space-y-2">
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Customers pay <span className="font-bold text-slate-800">₹{baseCharge}</span> for the first{" "}
                      <span className="font-bold text-slate-800">{baseKm} km</span>. Every extra{" "}
                      <span className="font-bold text-slate-800">{stepKm} km</span> adds{" "}
                      <span className="font-bold text-emerald-600">+₹{extraCharge}</span>.
                      {maxRadius > 0 && <span> (Max radius: {maxRadius} km)</span>}
                      {freeAbove > 0 && <span> Free delivery for orders <span className="font-bold text-emerald-600">≥ ₹{freeAbove}</span>.</span>}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10.5px] font-semibold text-slate-400">Sample:</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                        Up to {baseKm || 5} km: ₹{baseCharge}
                      </span>
                      <ArrowRight size={10} className="text-slate-300" />
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100">
                        {(baseKm || 5) + stepKm} km: ₹{baseCharge + extraCharge}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Flat rate of <span className="font-bold text-slate-800">₹{baseCharge}</span> across all delivery locations
                    {maxRadius > 0 ? ` within ${maxRadius} km.` : "."}
                    {freeAbove > 0 && <span> Orders above <span className="font-bold text-emerald-600">₹{freeAbove}</span> get free shipping.</span>}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Pickup Availability / Speed"
                icon={Timer}
                iconColor="text-emerald-500"
                type="text"
                value={data?.speed}
                onChange={(v) => updateDelivery("speed", v)}
                placeholder="Same Day"
              />
              <InputField
                label="Pickup Radius Limit (Optional)"
                icon={MapPin}
                iconColor="text-emerald-500"
                value={data?.radius}
                onChange={(v) => updateDelivery("radius", v)}
                suffix="km"
                placeholder="5"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Step3DeliveryOptions({ form, setForm }: Step3Props) {
  const updateDelivery = (
    type: "instant" | "standard" | "nationwide" | "pickuponly",
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
            Enable shipping options and customize distance-based or flat rate charges.
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
          meta={DELIVERY_META.pickuponly}
          data={form.deliveryOptions.pickuponly}
          updateDelivery={(field, val) => updateDelivery("pickuponly", field, val)}
        />
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
