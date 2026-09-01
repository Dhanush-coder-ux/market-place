import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Clock, ChevronDown, Copy, Sun, Moon, Check, Timer, CheckCircle2 } from "lucide-react";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";

/** Parse "HH:MM:SS+00:00" → { hour24, minute } */
function parseTimeString(t: string): { hour24: number; minute: number } {
  const cleaned = t.replace("+00:00", "").replace("Z", "");
  const [hStr, mStr] = cleaned.split(":");
  return { hour24: parseInt(hStr, 10) || 0, minute: parseInt(mStr, 10) || 0 };
}

/** { hour24, minute } → "HH:MM:00+00:00" */
function formatTimeString(hour24: number, minute: number): string {
  const hh = String(hour24).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm}:00+00:00`;
}

/** { hour24, minute } → "9:00 AM" display label */
function formatDisplay(hour24: number, minute: number): string {
  const period = hour24 >= 12 ? "PM" : "AM";
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${h}:${String(minute).padStart(2, "0")} ${period}`;
}

interface TimePickerProps {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}

function TimePicker({ value, onChange, id }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; openUp: boolean }>({
    top: 0,
    left: 0,
    openUp: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { hour24, minute } = parseTimeString(value);
  const period = hour24 >= 12 ? "PM" : "AM";
  const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;

  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const DROPDOWN_H = 320;
    const DROPDOWN_W = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < DROPDOWN_H + 16;
    
    let left = rect.left + window.scrollX;
    if (rect.left + DROPDOWN_W > window.innerWidth - 16) {
      left = rect.right + window.scrollX - DROPDOWN_W;
      if (left < 16) left = 16;
    }

    setDropdownPos({
      top: openUp ? rect.top + window.scrollY - DROPDOWN_H - 6 : rect.bottom + window.scrollY + 6,
      left,
      openUp,
    });
  }, []);

  const openDropdown = () => {
    calcPosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () => calcPosition();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, calcPosition]);

  const setHour = (h12: number, p: "AM" | "PM") => {
    const h24 = h12 % 12 + (p === "PM" ? 12 : 0);
    onChange(formatTimeString(h24, minute));
  };

  const setMinute = (m: number) => {
    onChange(formatTimeString(hour24, m));
  };

  const setPeriod = (p: "AM" | "PM") => {
    const h24 = displayHour % 12 + (p === "PM" ? 12 : 0);
    onChange(formatTimeString(h24, minute));
  };

  const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="relative inline-block" id={id}>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all min-w-[112px] justify-between
          ${open
            ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/15"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          }`}
      >
        <Clock size={13} className={open ? "text-blue-500" : "text-slate-400"} />
        <span className="text-[13px] font-bold">{formatDisplay(hour24, minute)}</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 99999,
          }}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 w-[280px] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-blue-500" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Time</span>
            </div>
            <span className="text-[13px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
              {formatDisplay(hour24, minute)}
            </span>
          </div>

          <div className="p-3 space-y-3">
            <div className="flex gap-2">
              {(["AM", "PM"] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all
                    ${period === p
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-1.5">Hour</p>
                <div className="grid grid-cols-4 gap-1">
                  {HOURS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHour(h, period)}
                      className={`text-[12px] py-1.5 rounded-lg font-semibold transition-all
                        ${displayHour === h
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-px bg-slate-100 self-stretch" />

              <div className="w-[90px]">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-1.5">Min</p>
                <div className="grid grid-cols-2 gap-1">
                  {MINUTES.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinute(m)}
                      className={`text-[12px] py-1.5 rounded-lg font-semibold transition-all
                        ${minute === m
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      :{String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Check size={13} strokeWidth={3} />
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday"
};
const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const WEEKEND = ["SATURDAY", "SUNDAY"];

export default function OperatingHours({ onStatusChange }: { onStatusChange?: (status: React.ReactNode) => void }) {
  const { shop } = useBusinessApi();
  const [operatingHours, setOperatingHours] = useState<Array<{ day: string, open_at: string, close_at: string, id?: number }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    shop.getOperatingHours(SHOP_ID).then(res => {
      if (res && res.data && Array.isArray(res.data)) {
        const hours = res.data.map((h: any) => ({
          day: h.day,
          open_at: h.open_at ? (h.open_at.includes('+') ? h.open_at : `${h.open_at}+00:00`) : "09:00:00+00:00",
          close_at: h.close_at ? (h.close_at.includes('+') ? h.close_at : `${h.close_at}+00:00`) : "18:00:00+00:00",
          id: h.id
        }));
        setOperatingHours(hours.filter((h: any) => ALL_DAYS.includes(h.day as any)));
      }
    }).catch(err => console.error("Failed to load operating hours:", err));
  }, []);

  const toggleDay = (dayName: string, isOpen: boolean) => {
    if (isOpen) {
      setOperatingHours(prev => prev.filter(h => h.day !== dayName));
    } else {
      setOperatingHours(prev => [...prev, { day: dayName, open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" }]);
    }
  };

  const updateTime = (dayName: string, field: "open_at" | "close_at", newValue: string) => {
    setOperatingHours(prev => prev.map(h => h.day === dayName ? { ...h, [field]: newValue } : h));
  };

  const copyToAll = () => {
    const firstOpen = operatingHours[0];
    if (!firstOpen) return;
    setOperatingHours(prev => prev.map(h => ({ ...h, open_at: firstOpen.open_at, close_at: firstOpen.close_at })));
  };

  const applyWeekdaysOnly = () => {
    setOperatingHours(prev => {
      const existing = new Map(prev.map(h => [h.day, h]));
      return ALL_DAYS.map(d =>
        WEEKDAYS.includes(d)
          ? existing.get(d) ?? { day: d, open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" }
          : null
      ).filter(Boolean) as any[];
    });
  };

  const applyAllDays = () => {
    setOperatingHours(prev => {
      const existing = new Map(prev.map(h => [h.day, h]));
      return ALL_DAYS.map(d => existing.get(d) ?? { day: d, open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" });
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentRes = await shop.getOperatingHours(SHOP_ID);
      let currentIds: Record<string, number> = {};
      if (currentRes && currentRes.data && Array.isArray(currentRes.data)) {
         currentRes.data.forEach((h: any) => { currentIds[h.day] = h.id; });
      }

      const activeDays = operatingHours.map(h => h.day);
      
      const promises = ALL_DAYS.map(async (day) => {
        const isActive = activeDays.includes(day);
        const config = operatingHours.find(h => h.day === day);
        const id = currentIds[day];

        if (!isActive) {
          if (id) {
            await shop.deleteOperatingHours(id);
          }
        } else if (config) {
          const payload = {
            day: day,
            open_at: config.open_at.replace("+00:00", ""),
            close_at: config.close_at.replace("+00:00", "")
          };
          if (id) {
            await shop.updateOperatingHours(id, { ...payload, id });
          } else {
            await shop.createOperatingHours(SHOP_ID, payload);
          }
        }
      });

      await Promise.all(promises);
      
      const newRes = await shop.getOperatingHours(SHOP_ID);
      if (newRes && newRes.data && Array.isArray(newRes.data)) {
        const hours = newRes.data.map((h: any) => ({
          day: h.day,
          open_at: h.open_at ? (h.open_at.includes('+') ? h.open_at : `${h.open_at}+00:00`) : "09:00:00+00:00",
          close_at: h.close_at ? (h.close_at.includes('+') ? h.close_at : `${h.close_at}+00:00`) : "18:00:00+00:00",
          id: h.id
        }));
        setOperatingHours(hours.filter((h: any) => ALL_DAYS.includes(h.day as any)));
      }

      alert("Operating hours saved successfully!");
    } catch (err) {
      console.error("Failed to save operating hours", err);
      alert("Failed to save operating hours");
    } finally {
      setIsSaving(false);
    }
  };

  const openCount = operatingHours.length;

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(
        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
          <CheckCircle2 size={12} className="text-blue-500" />
          <span className="text-[12px] font-bold text-blue-600">{openCount} Days Open</span>
        </div>
      );
    }
  }, [openCount, onStatusChange]);

  return (
    <div className="py-5 px-1 space-y-5" style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      
      {!onStatusChange && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff", color: "#3b82f6" }}>
                <Clock size={18} strokeWidth={2.5} />
              </div>
              <h1 className="text-[20px] font-extrabold text-slate-800 tracking-tight">Operating Hours</h1>
            </div>
            <p className="text-[13px] text-slate-400 ml-12">
              Set your store's opening and closing times for delivery and pickup.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 bg-white p-5 rounded-2xl border-[1.5px] border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[14px] font-bold text-slate-800">Weekly Schedule</p>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {openCount === 0 ? "No days configured — store will show as closed." : `Open ${openCount} day${openCount !== 1 ? "s" : ""} a week`}
            </p>
          </div>
          <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${openCount > 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
            {openCount}/7 Open
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={applyAllDays}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Sun size={13} /> All 7 Days
          </button>
          <button
            type="button"
            onClick={applyWeekdaysOnly}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Moon size={13} /> Weekdays Only
          </button>
          {openCount > 1 && (
            <button
              type="button"
              onClick={copyToAll}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Copy size={13} /> Copy Hours to All
            </button>
          )}
        </div>

        <div className="space-y-2">
          {ALL_DAYS.map((dayName) => {
            const hourConfig = operatingHours.find(h => h.day === dayName);
            const isOpen = !!hourConfig;
            const isWeekend = WEEKEND.includes(dayName);

            return (
              <div
                key={dayName}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
                  ${isOpen
                    ? "border-blue-200 bg-blue-50/40"
                    : "border-slate-200 bg-white"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => toggleDay(dayName, isOpen)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
                    ${isOpen ? 'bg-blue-600' : 'bg-slate-300'}`}
                  aria-label={`Toggle ${dayName}`}
                >
                  <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isOpen ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>

                <div className="w-[100px] shrink-0">
                  <span className={`text-[13px] font-bold ${isOpen ? 'text-slate-800' : 'text-slate-400'}`}>
                    {DAY_LABELS[dayName]}
                  </span>
                  {isWeekend && (
                    <span className="ml-1.5 text-[9px] font-bold text-amber-500 uppercase">Weekend</span>
                  )}
                </div>

                {isOpen ? (
                  <div className="flex items-center gap-2 flex-wrap ml-auto">
                    <TimePicker
                      id={`open-${dayName}`}
                      value={hourConfig.open_at}
                      onChange={(v) => updateTime(dayName, "open_at", v)}
                    />
                    <span className="text-[11px] font-semibold text-slate-400">to</span>
                    <TimePicker
                      id={`close-${dayName}`}
                      value={hourConfig.close_at}
                      onChange={(v) => updateTime(dayName, "close_at", v)}
                    />
                  </div>
                ) : (
                  <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    Closed
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-5 border-t border-slate-100 mt-5">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13.5px] font-bold text-white transition-all shadow-md ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}
            style={{ background: "#3b82f6", boxShadow: "0 4px 14px rgba(59,130,246,0.3)" }}
          >
            {isSaving ? <Timer size={15} className="animate-spin" /> : <Check size={15} strokeWidth={3} />}
            {isSaving ? "Saving..." : "Save Operating Hours"}
          </button>
        </div>
      </div>
    </div>
  );
}
