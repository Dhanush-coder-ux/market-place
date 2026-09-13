import { useToast } from "@/context/ToastContext";
import React, { useState, useEffect } from "react";
import { IndianRupee, MapPin, ShoppingBag, Truck, Zap, Globe, Timer, Check, Loader2, Sparkles } from "lucide-react";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";

export type DeliveryConfig = {
  id?: number;
  enabled: boolean;
  speed: string;
  minOrderAmount: number | "";
  deliveryCharge: number | "";
  freeThreshold: number | "";
  radius: number | "";
  chargePerKm: number | "";
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
        <div className="px-5 pb-5 pt-0 border-t border-slate-200/60 animate-in slide-in-from-top-1 fade-in duration-200">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {meta.badge !== "Pickup" && (
              <>
                <InputField
                  label="Minimum Order Value"
                  icon={ShoppingBag}
                  iconColor="text-amber-500"
                  value={data.minOrderAmount}
                  onChange={(v) => onChange("minOrderAmount", v)}
                  prefix="₹"
                  placeholder="0"
                />

                <InputField
                  label="Estimated Delivery Time"
                  icon={Timer}
                  iconColor="text-blue-500"
                  type="text"
                  value={data.speed}
                  onChange={(v) => onChange("speed", v)}
                  placeholder={meta.defaultSpeed}
                />

                <InputField
                  label="Delivery Charge"
                  icon={Truck}
                  iconColor="text-slate-500"
                  value={data.deliveryCharge}
                  onChange={(v) => onChange("deliveryCharge", v)}
                  prefix="₹"
                  placeholder="40"
                />

                <InputField
                  label="Free Delivery Above"
                  icon={IndianRupee}
                  iconColor="text-emerald-500"
                  value={data.freeThreshold}
                  onChange={(v) => onChange("freeThreshold", v)}
                  prefix="₹"
                  placeholder="500"
                />
              </>
            )}

            <InputField
              label="Delivery Radius (Optional)"
              icon={MapPin}
              iconColor="text-indigo-500"
              value={data.radius}
              onChange={(v) => onChange("radius", v)}
              suffix="km"
              placeholder="10"
            />
          </div>
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
      speed: "2–3 Business Days",
      minOrderAmount: 0,
      deliveryCharge: 40,
      freeThreshold: 500,
      radius: 15,
      chargePerKm: 0,
      deliveryBy: "PARTNERS",
    },
    express: {
      enabled: false,
      speed: "Within 12 Hours",
      minOrderAmount: 100,
      deliveryCharge: 80,
      freeThreshold: 800,
      radius: 10,
      chargePerKm: 0,
      deliveryBy: "PARTNERS",
    },
    sameday: {
      enabled: false,
      speed: "Within 3–4 Hours",
      minOrderAmount: 200,
      deliveryCharge: 120,
      freeThreshold: 1200,
      radius: 8,
      chargePerKm: 0,
      deliveryBy: "INHOUSE",
    },
    pickuponly: {
      enabled: true,
      speed: "Same Day",
      minOrderAmount: 0,
      deliveryCharge: 0,
      freeThreshold: 0,
      radius: 5,
      chargePerKm: 0,
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
                (m) => m.backendType === item.type || m.legacyBackendTypes.includes(item.type)
              );
              if (matchedMeta) {
                next[matchedMeta.key] = {
                  id: item.id,
                  enabled: item.enabled !== undefined ? item.enabled : true,
                  speed: item.speed || matchedMeta.defaultSpeed,
                  minOrderAmount: item.min_order_amount ?? 0,
                  deliveryCharge: item.delivery_charge ?? (item.charge_per_km ?? 0),
                  freeThreshold: item.free_shipping_amount ?? 0,
                  radius: item.radius ?? 0,
                  chargePerKm: item.charge_per_km ?? 0,
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
        const payload = {
          type: meta.backendType,
          speed: conf.speed || meta.defaultSpeed,
          free_shipping_amount: Number(conf.freeThreshold) || 0,
          min_order_amount: Number(conf.minOrderAmount) || 0,
          delivery_charge: Number(conf.deliveryCharge) || 0,
          charge_per_km: Number(conf.chargePerKm) || 0,
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
              Configure shipping fees, estimated delivery times, and minimum order values for each delivery type.
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
          <span className="font-bold">Pro Tip:</span> Offering free delivery above a threshold (e.g. ₹500) significantly boosts your average order value.
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
