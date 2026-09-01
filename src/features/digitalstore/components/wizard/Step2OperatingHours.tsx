import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { StoreFormData } from "@/features/digitalstore/type";
import { Clock, ChevronDown, Copy, Sun, Moon, Check } from "lucide-react";

interface Step2Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
}

// ─── Time Utility Helpers ─────────────────────────────────────────────────────

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

// ─── TimePicker — portal-based so it's never clipped ─────────────────────────

interface TimePickerProps {
  value: string; // "HH:MM:SS+00:00"
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

  // Calculate portal position from trigger's bounding rect
  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const DROPDOWN_H = 320; // approximate dropdown height
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

  // Close on outside click
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

  // Recalculate on scroll / resize while open
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
      {/* ── Trigger Button ── */}
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

      {/* ── Portal Dropdown ── */}
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
          {/* Header */}
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
            {/* ── AM / PM first (clearest UX) ── */}
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
              {/* ── Hours ── */}
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

              {/* ── Divider ── */}
              <div className="w-px bg-slate-100 self-stretch" />

              {/* ── Minutes ── */}
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

          {/* Footer */}
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

// ─── Main Component ───────────────────────────────────────────────────────────

const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday"
};
const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const WEEKEND = ["SATURDAY", "SUNDAY"];

export default function Step2OperatingHours({ form, setForm }: Step2Props) {
  const toggleDay = (dayName: string, isOpen: boolean) => {
    if (isOpen) {
      setForm(prev => ({ ...prev, operatingHours: prev.operatingHours.filter(h => h.day !== dayName) }));
    } else {
      setForm(prev => ({ ...prev, operatingHours: [...prev.operatingHours, { day: dayName, open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" }] }));
    }
  };

  const updateTime = (dayName: string, field: "open_at" | "close_at", newValue: string) => {
    setForm(prev => ({
      ...prev,
      operatingHours: prev.operatingHours.map(h => h.day === dayName ? { ...h, [field]: newValue } : h)
    }));
  };

  /** Copy the first open day's hours to all currently-open days */
  const copyToAll = () => {
    const firstOpen = form.operatingHours[0];
    if (!firstOpen) return;
    setForm(prev => ({
      ...prev,
      operatingHours: prev.operatingHours.map(h => ({ ...h, open_at: firstOpen.open_at, close_at: firstOpen.close_at }))
    }));
  };

  /** Open weekdays only with default hours */
  const applyWeekdaysOnly = () => {
    setForm(prev => {
      const existing = new Map(prev.operatingHours.map(h => [h.day, h]));
      const next = ALL_DAYS.map(d =>
        WEEKDAYS.includes(d)
          ? existing.get(d) ?? { day: d, open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" }
          : null
      ).filter(Boolean) as any[];
      return { ...prev, operatingHours: next };
    });
  };

  /** Open all 7 days */
  const applyAllDays = () => {
    setForm(prev => {
      const existing = new Map(prev.operatingHours.map(h => [h.day, h]));
      const next = ALL_DAYS.map(d => existing.get(d) ?? { day: d, open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" });
      return { ...prev, operatingHours: next };
    });
  };

  const openCount = form.operatingHours.length;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Weekly Schedule</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {openCount === 0 ? "No days configured — store will show as closed." : `Open ${openCount} day${openCount !== 1 ? "s" : ""} a week`}
          </p>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${openCount > 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
          {openCount}/7 Open
        </span>
      </div>

      {/* Quick-apply toolbar */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyAllDays}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Sun size={12} /> All 7 Days
        </button>
        <button
          type="button"
          onClick={applyWeekdaysOnly}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <Moon size={12} /> Weekdays Only
        </button>
        {openCount > 1 && (
          <button
            type="button"
            onClick={copyToAll}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Copy size={12} /> Copy Hours to All
          </button>
        )}
      </div>

      {/* Day rows */}
      <div className="space-y-2">
        {ALL_DAYS.map((dayName) => {
          const hourConfig = form.operatingHours.find(h => h.day === dayName);
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
              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => toggleDay(dayName, isOpen)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
                  ${isOpen ? 'bg-blue-600' : 'bg-slate-300'}`}
                aria-label={`Toggle ${dayName}`}
              >
                <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isOpen ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>

              {/* Day name */}
              <div className="w-[90px] shrink-0">
                <span className={`text-[13px] font-bold ${isOpen ? 'text-slate-800' : 'text-slate-400'}`}>
                  {DAY_LABELS[dayName]}
                </span>
                {isWeekend && (
                  <span className="ml-1.5 text-[9px] font-bold text-amber-500 uppercase">Weekend</span>
                )}
              </div>

              {/* Time pickers or Closed badge */}
              {isOpen ? (
                <div className="flex items-center gap-2 flex-wrap">
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

    </div>
  );
}
