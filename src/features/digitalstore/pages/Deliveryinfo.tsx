import { useState } from "react";
import { Truck, Zap, Globe, Clock, Copy, CheckCircle2 } from "lucide-react";
import { SettingsCard } from "../components/SettingCard";

/* -------------------------------- TYPES -------------------------------- */

type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

const DAYS: Day[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

type DeliveryConfig = {
  enabled: boolean;
  speed: string;
  freeThreshold: number;
  manageStore: boolean;
  partners: boolean;
};

interface DeliveryFieldsProps {
  data: DeliveryConfig;
  setData: (data: DeliveryConfig) => void;
}

/* --------------------------- MAIN COMPONENT ----------------------------- */

export default function DeliveryPreferences() {
  const [instant, setInstant] = useState<DeliveryConfig>({
    enabled: true,
    speed: "Within 12 hours",
    freeThreshold: 50,
    manageStore: true,
    partners: true,
  });

  const [standard, setStandard] = useState<DeliveryConfig>({
    enabled: true,
    speed: "1–2 Business Days",
    freeThreshold: 30,
    manageStore: false,
    partners: true,
  });

  const [nationwide, setNationwide] = useState<DeliveryConfig>({
    enabled: true,
    speed: "5–7 Business Days",
    freeThreshold: 100,
    manageStore: false,
    partners: true,
  });

  const [storeHours, setStoreHours] = useState<Record<Day, DayHours>>(
    DAYS.reduce((acc, day) => {
      acc[day] = { open: "09:00", close: "18:00", closed: false };
      return acc;
    }, {} as Record<Day, DayHours>)
  );

  const [globalOpen, setGlobalOpen] = useState("09:00");
  const [globalClose, setGlobalClose] = useState("18:00");

  // Apply the top times to ALL active days
  const applyToAll = () => {
    const updated = { ...storeHours };
    DAYS.forEach((day) => {
      if (!updated[day].closed) {
        updated[day].open = globalOpen;
        updated[day].close = globalClose;
      }
    });
    setStoreHours(updated);
  };

  const toggleDay = (day: Day) => {
    setStoreHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed },
    }));
  };

  /* -------------------------------- UI -------------------------------- */

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* ----------------------- INSTANT DELIVERY ----------------------- */}
      <SettingsCard
        title="Instant Delivery"
        subtitle="Ultra-fast delivery"
        icon={Zap}
        enabled={instant.enabled}
        onToggle={(v: boolean) => setInstant({ ...instant, enabled: v })}
        color="orange"
      >
        <DeliveryFields data={instant} setData={setInstant} />
      </SettingsCard>

      {/* ---------------------- STANDARD DELIVERY ------------------------ */}
      <SettingsCard
        title="Standard Delivery"
        subtitle="City-wide or intercity"
        icon={Truck}
        enabled={standard.enabled}
        onToggle={(v: boolean) => setStandard({ ...standard, enabled: v })}
        color="blue"
      >
        <DeliveryFields data={standard} setData={setStandard} />
      </SettingsCard>

      {/* -------------------- NATIONWIDE DELIVERY ------------------------ */}
      <SettingsCard
        title="Nationwide Delivery"
        subtitle="Ship anywhere in the country"
        icon={Globe}
        enabled={nationwide.enabled}
        onToggle={(v: boolean) => setNationwide({ ...nationwide, enabled: v })}
        color="green"
      >
        <DeliveryFields data={nationwide} setData={setNationwide} />
      </SettingsCard>

      {/* ---------------------- OPERATING HOURS -------------------------- */}
      {/* Fixed: Removed max-w-2xl so it matches the full width of other cards */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
        {/* --- HEADER: The "Master Control" --- */}
        <div className="bg-slate-50 p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-slate-800">
            <Clock className="text-blue-600" size={20} />
            <h3 className="font-bold">Set Standard Hours</h3>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Opens
              </label>
              <input
                type="time"
                value={globalOpen}
                onChange={(e) => setGlobalOpen(e.target.value)}
                className="block mt-1 p-2 bg-white border border-slate-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
              />
            </div>
            <span className="mb-3 text-slate-400 font-bold hidden sm:block">
              -
            </span>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Closes
              </label>
              <input
                type="time"
                value={globalClose}
                onChange={(e) => setGlobalClose(e.target.value)}
                className="block mt-1 p-2 bg-white border border-slate-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
              />
            </div>

            <button
              onClick={applyToAll}
              className="mb-0.5 ml-auto sm:ml-0 flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200"
            >
              <Copy size={16} /> Apply to All Days
            </button>
          </div>
        </div>

        {/* --- BODY: The Days Grid --- */}
        <div className="p-6">
          <p className="text-xs font-bold text-slate-400 uppercase mb-4">
            Click days to toggle Open/Closed
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DAYS.map((day) => {
              const isOpen = !storeHours[day].closed;
              return (
                <div
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`
                    cursor-pointer flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 select-none
                    ${
                      isOpen
                        ? "border-blue-100 bg-blue-50/50"
                        : "border-slate-100 bg-slate-50 opacity-60 grayscale"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        isOpen
                          ? "bg-blue-500 text-white"
                          : "bg-slate-300 text-slate-50"
                      }`}
                    >
                      {isOpen && <CheckCircle2 size={12} />}
                    </div>
                    <span
                      className={`font-semibold ${
                        isOpen ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  <div className="text-sm font-medium text-slate-600">
                    {isOpen ? (
                      <span>
                        {storeHours[day].open} - {storeHours[day].close}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/* --------------------- DELIVERY FIELDS COMPONENT ------------------------ */

function DeliveryFields({ data, setData }: DeliveryFieldsProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            Delivery Speed
          </label>
          <select
            value={data.speed}
            onChange={(e) => setData({ ...data, speed: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Within 12 hours</option>
            <option>1–2 Business Days</option>
            <option>5–7 Business Days</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">
            Free Delivery Above
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-2 text-slate-400">$</span>
            <input
              type="number"
              value={data.freeThreshold}
              onChange={(e) =>
                setData({ ...data, freeThreshold: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-7 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <label
          className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
            data.manageStore
              ? "border-blue-200 bg-blue-50/30"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <input
            type="checkbox"
            checked={data.manageStore}
            onChange={(e) =>
              setData({ ...data, manageStore: e.target.checked })
            }
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <p className="text-sm font-bold text-slate-700">
              Manage by Your Store
            </p>
            <p className="text-xs text-slate-500 leading-tight">
              Your own team handles the delivery logistics.
            </p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
            data.partners
              ? "border-blue-200 bg-blue-50/30"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <input
            type="checkbox"
            checked={data.partners}
            onChange={(e) => setData({ ...data, partners: e.target.checked })}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <p className="text-sm font-bold text-slate-700">
              Use Delivery Partners
            </p>
            <p className="text-xs text-slate-500 leading-tight">
              Automatically assign to 3rd party couriers.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}