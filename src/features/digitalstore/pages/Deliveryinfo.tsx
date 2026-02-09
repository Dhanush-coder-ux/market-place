import { useState } from "react";


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

export default function DeliveryPreferences() {
  const [deliveryTypes, setDeliveryTypes] = useState({
    homeDelivery: true,
    pickup: false,
  });

  const [deliveryFeeType, setDeliveryFeeType] = useState<
    "free" | "fixed" | "distance"
  >("free");

  const [fixedFee, setFixedFee] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);

  const [storeHours, setStoreHours] = useState<Record<Day, DayHours>>(
    DAYS.reduce((acc, day) => {
      acc[day] = { open: "09:00", close: "21:00", closed: false };
      return acc;
    }, {} as Record<Day, DayHours>)
  );

  const applySameHours = (open: string, close: string) => {
    const updated: Record<Day, DayHours> = {} as any;
    DAYS.forEach((day) => {
      updated[day] = { ...storeHours[day], open, close };
    });
    setStoreHours(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Delivery Preferences */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Delivery Preferences</h2>

        {/* Delivery Types */}
        <div className="mb-4">
          <p className="font-medium mb-2">Delivery Types</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={deliveryTypes.homeDelivery}
                onChange={(e) =>
                  setDeliveryTypes({
                    ...deliveryTypes,
                    homeDelivery: e.target.checked,
                  })
                }
              />
              Home Delivery
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={deliveryTypes.pickup}
                onChange={(e) =>
                  setDeliveryTypes({
                    ...deliveryTypes,
                    pickup: e.target.checked,
                  })
                }
              />
              Pickup
            </label>
          </div>
        </div>

        {/* Delivery Fee */}
        <div className="mb-4">
          <p className="font-medium mb-2">Delivery Fee</p>
          <div className="flex gap-4 mb-2">
            {["free", "fixed", "distance"].map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryFee"
                  value={type}
                  checked={deliveryFeeType === type}
                  onChange={() =>
                    setDeliveryFeeType(type as "free" | "fixed" | "distance")
                  }
                />
                {type === "free"
                  ? "Free"
                  : type === "fixed"
                  ? "Fixed"
                  : "Distance-based"}
              </label>
            ))}
          </div>

          {deliveryFeeType === "fixed" && (
            <input
              type="number"
              placeholder="Enter fixed fee"
              className="w-48 rounded-lg border px-3 py-2"
              value={fixedFee}
              onChange={(e) => setFixedFee(Number(e.target.value))}
            />
          )}
        </div>

        {/* Minimum Order */}
        <div>
          <p className="font-medium mb-2">Minimum Order Value</p>
          <input
            type="number"
            placeholder="₹ Minimum order amount"
            className="w-48 rounded-lg border px-3 py-2"
            value={minOrderValue}
            onChange={(e) => setMinOrderValue(Number(e.target.value))}
          />
        </div>
      </section>

      {/* Store Operating Hours */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Store Operating Hours</h2>

          <button
            onClick={() =>
              applySameHours(
                storeHours.Monday.open,
                storeHours.Monday.close
              )
            }
            className="text-sm text-blue-600 hover:underline"
          >
            Same hours for all days
          </button>
        </div>

        <div className="space-y-3">
          {DAYS.map((day) => (
            <div
              key={day}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <div className="w-24 font-medium">{day}</div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={storeHours[day].closed}
                  onChange={(e) =>
                    setStoreHours({
                      ...storeHours,
                      [day]: {
                        ...storeHours[day],
                        closed: e.target.checked,
                      },
                    })
                  }
                />
                Closed
              </label>

              {!storeHours[day].closed && (
                <>
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
                    className="rounded-lg border px-2 py-1"
                  />

                  <span>→</span>

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
                    className="rounded-lg border px-2 py-1"
                  />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Holiday Override (Future) */}
        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          Holiday override support will be available for vacation mode.
        </div>
      </section>
  
    </div>
  );
}
