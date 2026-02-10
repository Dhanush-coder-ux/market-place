import { useState } from "react";
import { Truck, Zap, Globe, Clock } from "lucide-react";
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

/* ----------------------------- CARD WRAPPER ----------------------------- */



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

  const applyPreset = (days: Day[], open: string, close: string) => {
    const updated = { ...storeHours };
    DAYS.forEach((day) => {
      updated[day] = {
        open,
        close,
        closed: !days.includes(day),
      };
    });
    setStoreHours(updated);
  };

  /* -------------------------------- UI -------------------------------- */

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">

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
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-indigo-50">
          <Clock className="text-indigo-600" size={20} />
          <h3 className="font-semibold text-slate-800">Store Operating Hours</h3>
        </div>

        <div className="p-6 space-y-5">
          {/* Day Pills */}
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() =>
                  setStoreHours({
                    ...storeHours,
                    [day]: {
                      ...storeHours[day],
                      closed: !storeHours[day].closed,
                    },
                  })
                }
                className={`px-3 py-1 rounded-lg text-sm border transition ${
                  storeHours[day].closed
                    ? "bg-white text-slate-400"
                    : "bg-indigo-50 border-indigo-400 text-indigo-700"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Time Rows */}
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div
                key={day}
                className="flex items-center justify-between gap-3 border rounded-lg p-3"
              >
                <span className="w-24 text-sm font-medium">{day}</span>

                {storeHours[day].closed ? (
                  <span className="text-xs text-slate-400 italic">Closed</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={storeHours[day].open}
                      onChange={(e) =>
                        setStoreHours({
                          ...storeHours,
                          [day]: {
                            ...storeHours[day],
                            open: e.target.value,
                          },
                        })
                      }
                      className="border rounded-md px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="time"
                      value={storeHours[day].close}
                      onChange={(e) =>
                        setStoreHours({
                          ...storeHours,
                          [day]: {
                            ...storeHours[day],
                            close: e.target.value,
                          },
                        })
                      }
                      className="border rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Presets */}
          <div className="flex gap-2 pt-3">
            <button
              onClick={() =>
                applyPreset(
                  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "09:00",
                  "18:00"
                )
              }
              className="px-3 py-1.5 rounded-lg border text-xs hover:bg-indigo-50"
            >
              Weekdays 9–6
            </button>

            <button
              onClick={() =>
                applyPreset(DAYS, "09:00", "21:00")
              }
              className="px-3 py-1.5 rounded-lg border text-xs hover:bg-indigo-50"
            >
              7 Days 9–9
            </button>

            <button
              onClick={() =>
                applyPreset(DAYS, "00:00", "23:59")
              }
              className="px-3 py-1.5 rounded-lg border text-xs hover:bg-indigo-50"
            >
              24/7
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

/* --------------------- DELIVERY FIELDS COMPONENT ------------------------ */

function DeliveryFields({ data, setData }: any) {
  return (
    <>
      <div>
        <label className="text-sm font-semibold">Delivery Speed</label>
        <select
          value={data.speed}
          onChange={(e) => setData({ ...data, speed: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option>Within 12 hours</option>
          <option>1–2 Business Days</option>
          <option>5–7 Business Days</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold">Free Delivery Threshold</label>
        <input
          type="number"
          value={data.freeThreshold}
          onChange={(e) =>
            setData({ ...data, freeThreshold: Number(e.target.value) })
          }
          className="mt-1 w-full max-w-xs rounded-lg border px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">
          Orders above this amount get free delivery
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={data.manageStore}
            onChange={(e) =>
              setData({ ...data, manageStore: e.target.checked })
            }
          />
          <div>
            <p className="text-sm font-medium">Manage by Your Store</p>
            <p className="text-xs text-slate-500">
              Your team handles delivery directly
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={data.partners}
            onChange={(e) =>
              setData({ ...data, partners: e.target.checked })
            }
          />
          <div>
            <p className="text-sm font-medium">Use Delivery Partners</p>
            <p className="text-xs text-slate-500">
              Integrate third-party services
            </p>
          </div>
        </label>
      </div>
    </>
  );
}
