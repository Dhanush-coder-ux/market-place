import { useToast } from "@/context/ToastContext";
import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  MapPin,
  ShoppingBag,
  Truck,
  Zap,
  Globe,
  Timer,
  Check,
  Loader2,
  Sparkles,
  Calculator,
  ArrowRight
} from "lucide-react";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";

export type DeliveryConfig = {
  id?: number;
  enabled: boolean;
  pricingModel: "FLAT" | "DISTANCE_TIERED";
  speed: string;
  minOrderAmount: number | "";
  deliveryCharge: number | "";
  baseDistance: number | "";
  extraDistanceStep: number | "";
  chargePerKm: number | "";
  freeThreshold: number | "";
  radius: number | "";
  deliveryBy: "PARTNERS" | "INHOUSE";
};

interface DeliveryCardMeta {
  key: "normal" | "express" | "sameday" | "pickuponly";
  backendType: "STANDARD" | "INSTANT" | "NATIONWIDE" | "PICKUP_ONLY";
  legacyBackendTypes: string[];
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

export const DELIVERY_OPTIONS_CONFIG: DeliveryCardMeta[] = [
  {
    key: "pickuponly",
    backendType: "PICKUP_ONLY",
    legacyBackendTypes: ["PICKUP_ONLY"],
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
  {
    key: "normal",
    backendType: "STANDARD",
    legacyBackendTypes: ["NORMAL", "STANDARD"],
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
  {
    key: "express",
    backendType: "INSTANT",
    legacyBackendTypes: ["EXPRESS", "INSTANT"],
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
  {
    key: "sameday",
    backendType: "NATIONWIDE",
    legacyBackendTypes: ["SAME_DAY", "NATIONWIDE"],
    title: "Nationwide Delivery",
    subtitle: "Deliver orders across the country with our shipping partners",
    badge: "Nationwide",
    icon: Globe,
    accentColor: "text-purple-600",
    activeBg: "bg-purple-50/40",
    activeBorder: "border-purple-400",
    badgeColor: "bg-purple-100 text-purple-700",
    defaultSpeed: "5-7 Business Days"
  }
];

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
  step,
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
  step?: string;
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
          step={step}
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

export function DeliveryCardInner({
  meta,
  data,
  onChange,
}: {
  meta: DeliveryCardMeta;
  data: DeliveryConfig;
  onChange: (field: keyof DeliveryConfig, value: any) => void;
}) {
  const Icon = meta.icon;
  const enabled = data.enabled;
  const isPickup = meta.badge === "Pickup";
  const isDistanceTiered = data.pricingModel === "DISTANCE_TIERED";

  const baseCharge = Number(data.deliveryCharge) || 0;
  const baseKm = Number(data.baseDistance) || 0;
  const stepKm = Number(data.extraDistanceStep) || 1;
  const extraCharge = Number(data.chargePerKm) || 0;
  const maxRadius = Number(data.radius) || 0;
  const freeAbove = Number(data.freeThreshold) || 0;

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

        {/* Toggle switch */}
        <button
          type="button"
          onClick={() => onChange("enabled", !enabled)}
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
                  <span className="text-[11px] text-slate-500">Choose how delivery charge is calculated for customer orders</span>
                </div>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => onChange("pricingModel", "FLAT")}
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
                    onClick={() => onChange("pricingModel", "DISTANCE_TIERED")}
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
                {/* Distance-Based Inputs */}
                {isDistanceTiered ? (
                  <>
                    <InputField
                      label="Base Delivery Charge"
                      icon={Truck}
                      iconColor="text-blue-500"
                      value={data.deliveryCharge}
                      onChange={(v) => onChange("deliveryCharge", v)}
                      prefix="₹"
                      placeholder="100"
                      helperText="Charge for delivery up to the base distance"
                    />

                    <InputField
                      label="Base Distance Limit"
                      icon={MapPin}
                      iconColor="text-blue-500"
                      value={data.baseDistance}
                      onChange={(v) => onChange("baseDistance", v)}
                      suffix="km"
                      placeholder="10"
                      helperText="E.g. ₹100 is charged for up to 10 km"
                    />

                    <InputField
                      label="Extra Distance Step"
                      icon={MapPin}
                      iconColor="text-indigo-500"
                      value={data.extraDistanceStep}
                      onChange={(v) => onChange("extraDistanceStep", v)}
                      suffix="km"
                      placeholder="1"
                      helperText="For every additional 1, 2, or 3 km"
                    />

                    <InputField
                      label="Extra Fee per Step"
                      icon={IndianRupee}
                      iconColor="text-indigo-500"
                      value={data.chargePerKm}
                      onChange={(v) => onChange("chargePerKm", v)}
                      prefix="₹"
                      placeholder="10"
                      helperText="Additional charge per distance step (e.g. ₹10)"
                    />
                  </>
                ) : (
                  /* Flat Rate Input */
                  <InputField
                    label="Flat Delivery Charge"
                    icon={Truck}
                    iconColor="text-slate-500"
                    value={data.deliveryCharge}
                    onChange={(v) => onChange("deliveryCharge", v)}
                    prefix="₹"
                    placeholder="40"
                    helperText="Fixed charge regardless of delivery distance"
                  />
                )}

                {/* Common fields */}
                <InputField
                  label="Free Delivery Above"
                  icon={IndianRupee}
                  iconColor="text-emerald-500"
                  value={data.freeThreshold}
                  onChange={(v) => onChange("freeThreshold", v)}
                  prefix="₹"
                  placeholder="500"
                  helperText="Orders above this amount get free shipping (0 to disable)"
                />

                <InputField
                  label="Maximum Delivery Radius"
                  icon={MapPin}
                  iconColor="text-purple-500"
                  value={data.radius}
                  onChange={(v) => onChange("radius", v)}
                  suffix="km"
                  placeholder="15"
                  helperText="Maximum range your store delivers to (0 for unlimited)"
                />

                <InputField
                  label="Minimum Order Value"
                  icon={ShoppingBag}
                  iconColor="text-amber-500"
                  value={data.minOrderAmount}
                  onChange={(v) => onChange("minOrderAmount", v)}
                  prefix="₹"
                  placeholder="0"
                  helperText="Minimum cart value required to place an order"
                />

                <InputField
                  label="Estimated Delivery Time"
                  icon={Timer}
                  iconColor="text-blue-500"
                  type="text"
                  value={data.speed}
                  onChange={(v) => onChange("speed", v)}
                  placeholder={meta.defaultSpeed}
                  helperText="Display text shown to buyers (e.g. 2–3 Business Days)"
                />
              </div>

              {/* Dynamic Rate Summary / Calculator Card */}
              <div className="bg-white/80 rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Live Delivery Calculation Preview</span>
                </div>
                {isDistanceTiered ? (
                  <div className="space-y-2">
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Customers pay <span className="font-bold text-slate-800">₹{baseCharge}</span> for the first{" "}
                      <span className="font-bold text-slate-800">{baseKm} km</span>. Every extra{" "}
                      <span className="font-bold text-slate-800">{stepKm} km</span> adds{" "}
                      <span className="font-bold text-emerald-600">+₹{extraCharge}</span>.
                      {maxRadius > 0 && <span> Maximum deliverable radius: <span className="font-bold text-slate-800">{maxRadius} km</span>.</span>}
                      {freeAbove > 0 && <span> Free delivery for orders <span className="font-bold text-emerald-600">≥ ₹{freeAbove}</span>.</span>}
                    </p>

                    {/* Example distance breakdown chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10.5px] font-semibold text-slate-400">Sample rates:</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                        Up to {baseKm || 5} km: ₹{baseCharge}
                      </span>
                      <ArrowRight size={10} className="text-slate-300" />
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100">
                        {(baseKm || 5) + stepKm} km: ₹{baseCharge + extraCharge}
                      </span>
                      <ArrowRight size={10} className="text-slate-300" />
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-100">
                        {(baseKm || 5) + (stepKm * 2)} km: ₹{baseCharge + (extraCharge * 2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Flat rate of <span className="font-bold text-slate-800">₹{baseCharge}</span> delivery fee applied to all orders
                    {maxRadius > 0 ? <span> within <span className="font-bold text-slate-800">{maxRadius} km</span></span> : " across all serviceable areas"}.
                    {freeAbove > 0 && <span> Orders above <span className="font-bold text-emerald-600">₹{freeAbove}</span> get free shipping.</span>}
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Store Pickup Settings */
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Pickup Availability / Speed"
                icon={Timer}
                iconColor="text-emerald-500"
                type="text"
                value={data.speed}
                onChange={(v) => onChange("speed", v)}
                placeholder="Same Day"
                helperText="Estimated time order is ready for customer pickup"
              />
              <InputField
                label="Pickup Radius Limit (Optional)"
                icon={MapPin}
                iconColor="text-emerald-500"
                value={data.radius}
                onChange={(v) => onChange("radius", v)}
                suffix="km"
                placeholder="5"
                helperText="Geographical radius of customers allowed for pickup"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeliveryPreferences({ onStatusChange }: { onStatusChange?: (status: React.ReactNode) => void }) {
  const { showToast } = useToast();
  const { shop } = useBusinessApi();
  const currentShopId = localStorage.getItem("shop_id") || SHOP_ID;

  const [deliveryConfigs, setDeliveryConfigs] = useState<Record<string, DeliveryConfig>>({
    normal: {
      enabled: true,
      pricingModel: "DISTANCE_TIERED",
      speed: "2–3 Business Days",
      minOrderAmount: 0,
      deliveryCharge: 100,
      baseDistance: 10,
      extraDistanceStep: 1,
      chargePerKm: 10,
      freeThreshold: 500,
      radius: 15,
      deliveryBy: "PARTNERS",
    },
    express: {
      enabled: false,
      pricingModel: "DISTANCE_TIERED",
      speed: "Within 12 Hours",
      minOrderAmount: 100,
      deliveryCharge: 150,
      baseDistance: 5,
      extraDistanceStep: 1,
      chargePerKm: 15,
      freeThreshold: 800,
      radius: 10,
      deliveryBy: "PARTNERS",
    },
    sameday: {
      enabled: false,
      pricingModel: "FLAT",
      speed: "Within 3–4 Hours",
      minOrderAmount: 200,
      deliveryCharge: 120,
      baseDistance: 0,
      extraDistanceStep: 1,
      chargePerKm: 0,
      freeThreshold: 1200,
      radius: 8,
      deliveryBy: "INHOUSE",
    },
    pickuponly: {
      enabled: true,
      pricingModel: "FLAT",
      speed: "Same Day",
      minOrderAmount: 0,
      deliveryCharge: 0,
      baseDistance: 0,
      extraDistanceStep: 1,
      chargePerKm: 0,
      freeThreshold: 0,
      radius: 5,
      deliveryBy: "INHOUSE",
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing options from backend
  useEffect(() => {
    if (!currentShopId || currentShopId === "string") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    shop.getDeliveryOptions(currentShopId)
      .then((res: any) => {
        const dataList = res?.data;
        if (Array.isArray(dataList) && dataList.length > 0) {
          setDeliveryConfigs((prev) => {
            const next = { ...prev };
            dataList.forEach((item: any) => {
              const matchedMeta = DELIVERY_OPTIONS_CONFIG.find(
                (m) => m.backendType === item.type || m.legacyBackendTypes?.includes(item.type)
              );
              if (matchedMeta) {
                const isDistance = item.pricing_model === "DISTANCE_TIERED" || (item.base_distance > 0 || (item.charge_per_km > 0 && item.base_distance !== undefined));
                next[matchedMeta.key] = {
                  id: item.id,
                  enabled: item.enabled !== undefined ? item.enabled : true,
                  pricingModel: isDistance ? "DISTANCE_TIERED" : "FLAT",
                  speed: item.speed || matchedMeta.defaultSpeed,
                  minOrderAmount: item.min_order_amount ?? 0,
                  deliveryCharge: item.delivery_charge ?? 0,
                  baseDistance: item.base_distance ?? 10,
                  extraDistanceStep: item.extra_distance_step ?? 1,
                  chargePerKm: item.charge_per_km ?? 0,
                  freeThreshold: item.free_shipping_amount ?? 0,
                  radius: item.radius ?? 0,
                  deliveryBy: item.delivery_by === "INHOUSE" ? "INHOUSE" : "PARTNERS",
                };
              }
            });
            return next;
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch delivery options:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentShopId]);

  const activeCount = Object.values(deliveryConfigs).filter((d) => d.enabled).length;

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(
        <div className="flex items-center gap-2 shrink-0">
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
      );
    }
  }, [activeCount, onStatusChange]);

  const updateCard = (key: string, field: keyof DeliveryConfig, value: any) => {
    setDeliveryConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!currentShopId || currentShopId === "string") {
      showToast("Please select or create a store first.", "error");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const promises = DELIVERY_OPTIONS_CONFIG.map(async (meta) => {
        const conf = deliveryConfigs[meta.key];
        const isDist = conf.pricingModel === "DISTANCE_TIERED";
        const payload = {
          type: meta.backendType,
          speed: conf.speed || meta.defaultSpeed,
          free_shipping_amount: Number(conf.freeThreshold) || 0,
          min_order_amount: Number(conf.minOrderAmount) || 0,
          delivery_charge: Number(conf.deliveryCharge) || 0,
          charge_per_km: isDist ? (Number(conf.chargePerKm) || 0) : 0,
          base_distance: isDist ? (Number(conf.baseDistance) || 0) : 0,
          extra_distance_step: isDist ? (Number(conf.extraDistanceStep) || 1) : 1,
          pricing_model: conf.pricingModel || "FLAT",
          radius: Number(conf.radius) || 0,
          delivery_by: conf.deliveryBy,
          enabled: conf.enabled,
        };

        if (!conf.enabled) {
          if (conf.id) {
            await shop.updateDeliveryOption(conf.id, { ...payload, id: conf.id, enabled: false });
          }
        } else {
          if (conf.id) {
            await shop.updateDeliveryOption(conf.id, { ...payload, id: conf.id });
          } else {
            const res = await shop.createDeliveryOption(currentShopId, payload);
            if (res && res.data && res.data.id) {
              setDeliveryConfigs((prev) => ({
                ...prev,
                [meta.key]: { ...prev[meta.key], id: res.data.id },
              }));
            }
          }
        }
      });

      await Promise.all(promises);
      setSaveSuccess(true);
      showToast("Delivery preferences updated successfully", "success");
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save delivery preferences:", err);
      showToast("Failed to save delivery options", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-xs font-semibold">Loading delivery configurations...</p>
      </div>
    );
  }

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
              <h1 className="text-[20px] font-extrabold text-slate-800 tracking-tight">Delivery Options</h1>
            </div>
            <p className="text-[13px] text-slate-400 ml-12">
              Configure shipping fees, distance-based incremental charges, and estimated delivery times for each shipping option.
            </p>
          </div>
        </div>
      )}

      {/* ── Delivery Cards ── */}
      <div className="space-y-4">
        {DELIVERY_OPTIONS_CONFIG.map((meta) => (
          <DeliveryCardInner
            key={meta.key}
            meta={meta}
            data={deliveryConfigs[meta.key]}
            onChange={(field, value) => updateCard(meta.key, field, value)}
          />
        ))}
      </div>

      {/* Helper note */}
      <div className="flex items-start gap-2.5 bg-blue-50/60 border border-blue-100 rounded-2xl px-4 py-3.5">
        <Sparkles size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-[12px] text-blue-800 leading-relaxed">
          <span className="font-bold">Pro Tip:</span> Offering distance-tiered delivery (e.g. ₹100 for first 10 km, then ₹10 per extra km) ensures fair delivery compensation while staying competitive for local buyers.
        </p>
      </div>

      {/* ── Save Button ── */}
      <div className="flex items-center justify-between pt-2">
        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-in fade-in">
            <Check size={14} strokeWidth={3} />
            Delivery preferences saved successfully!
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-7 py-2.5 rounded-xl text-[13.5px] font-bold text-white transition-all shadow-md ${
              isSaving
                ? "opacity-70 cursor-not-allowed bg-blue-400"
                : "bg-blue-600 hover:bg-blue-700 active:scale-98 cursor-pointer"
            }`}
            style={{ boxShadow: "0 4px 14px rgba(59,130,246,0.3)" }}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
