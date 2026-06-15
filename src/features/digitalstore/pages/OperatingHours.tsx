import { useState } from "react";
import {
  Clock, Copy, Check, Timer, Calendar, CheckCircle2, ChevronRight, AlertCircle
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
const DAYS: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


type DayHours = { open: string; close: string; closed: boolean };

/* ── Main Component ──────────────────────────────────────────────────────────── */
const OperatingHours = () => {
  const [storeHours, setStoreHours] = useState<Record<Day, DayHours>>(
    DAYS.reduce((a, d) => { a[d] = { open: "09:00", close: "18:00", closed: false }; return a; }, {} as Record<Day, DayHours>)
  );
  const [globalOpen, setGlobalOpen] = useState("09:00");
  const [globalClose, setGlobalClose] = useState("18:00");
  const [applied, setApplied] = useState(false);

  const applyToAll = () => {
    const u = { ...storeHours };
    DAYS.forEach(d => { if (!u[d].closed) { u[d].open = globalOpen; u[d].close = globalClose; } });
    setStoreHours(u);
    setApplied(true);
    setTimeout(() => setApplied(false), 1600);
  };

  const toggleDay = (day: Day) =>
    setStoreHours(p => ({ ...p, [day]: { ...p[day], closed: !p[day].closed } }));

  const updateTime = (day: Day, field: "open" | "close", val: string) =>
    setStoreHours(p => ({ ...p, [day]: { ...p[day], [field]: val } }));

  const openCount = DAYS.filter(d => !storeHours[d].closed).length;

  return (
    <div className="py-5 px-1 space-y-5" style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
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

        {/* Summary pills */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
            <CheckCircle2 size={12} className="text-blue-500" />
            <span className="text-[12px] font-bold text-blue-600">{openCount} Days Open</span>
          </div>
        </div>
      </div>

      {/* ── Main Card ── */}
      <div className="bg-white rounded-2xl border-[1.5px] border-slate-200 overflow-hidden shadow-sm">
        
        {/* Top blue accent bar */}
        <div className="h-[3px] bg-blue-500" />

        <div className="p-5 md:p-6">
          
          {/* ── Global Time Setter (Quick Apply) ── */}
          <div className="bg-slate-50 border-[1.5px] border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Timer size={14} className="text-slate-400" />
              <span className="text-[13px] font-bold text-slate-700">Quick Apply to All Open Days</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Opens At</label>
                  <input
                    type="time"
                    value={globalOpen}
                    onChange={(e) => setGlobalOpen(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="text-slate-300 font-bold text-lg mb-2 flex-shrink-0">
                  <ChevronRight size={20} />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Closes At</label>
                  <input
                    type="time"
                    value={globalClose}
                    onChange={(e) => setGlobalClose(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
              
              <button
                onClick={applyToAll}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-bold text-white transition-all hover:opacity-90 cursor-pointer w-full sm:w-auto shrink-0 shadow-md h-[46px]"
                style={{ background: applied ? "#16a34a" : "#3b82f6", boxShadow: applied ? "0 4px 14px rgba(22,163,74,0.3)" : "0 4px 14px rgba(59,130,246,0.3)" }}
              >
                {applied ? <><Check size={16} strokeWidth={3} /> Applied</> : <><Copy size={15} strokeWidth={2.5} /> Apply to All</>}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-[13px] font-bold text-slate-700">Weekly Schedule</span>
          </div>

          {/* ── Days Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {DAYS.map((day) => {
              const isOpen = !storeHours[day].closed;
              return (
                <div
                  key={day}
                  className="rounded-xl border-[1.5px] overflow-hidden transition-all duration-200 flex flex-col"
                  style={{
                    borderColor: isOpen ? "#bfdbfe" : "#e2e8f0",
                    background:  isOpen ? "#eff6ff" : "#f8fafc",
                    boxShadow:   isOpen ? "0 0 0 2px #eff6ff" : "none"
                  }}
                >
                  {/* Day Header (Clickable) */}
                  <div
                    className="flex items-center justify-between px-3.5 py-3 cursor-pointer select-none border-b"
                    style={{ borderColor: isOpen ? "rgba(191,219,254,0.5)" : "#e2e8f0" }}
                    onClick={() => toggleDay(day)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center transition-all"
                        style={{
                          background:  isOpen ? "#3b82f6" : "white",
                          borderColor: isOpen ? "#3b82f6" : "#cbd5e1"
                        }}
                      >
                        {isOpen && <Check size={12} strokeWidth={3} className="text-white" />}
                      </div>
                      <span className="text-[13px] font-extrabold" style={{ color: isOpen ? "#1e293b" : "#94a3b8" }}>
                        {day}
                      </span>
                    </div>
                    <span
                      className="text-[10.5px] font-bold tracking-wide px-2 py-0.5 rounded-md border"
                      style={{
                        background:  isOpen ? "#dbeafe" : "#f1f5f9",
                        color:       isOpen ? "#2563eb" : "#94a3b8",
                        borderColor: isOpen ? "#bfdbfe" : "#e2e8f0"
                      }}
                    >
                      {isOpen ? "Open" : "Closed"}
                    </span>
                  </div>

                  {/* Time Inputs */}
                  <div className="px-3.5 py-3 flex-1 flex flex-col justify-center bg-white" style={{ opacity: isOpen ? 1 : 0.4, pointerEvents: isOpen ? "auto" : "none" }}>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="time"
                          value={storeHours[day].open}
                          onChange={(e) => updateTime(day, "open", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-[12px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm"
                        />
                      </div>
                      <span className="text-slate-300 font-bold text-xs">–</span>
                      <div className="relative flex-1">
                        <input
                          type="time"
                          value={storeHours[day].close}
                          onChange={(e) => updateTime(day, "close", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-[12px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Alert Note ── */}
          <div className="mt-5 flex items-start gap-2.5 p-4 rounded-xl border-[1.5px] border-blue-100 bg-blue-50/50">
            <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="m-0 text-[12px] font-medium text-slate-600 leading-relaxed">
              Customers will not be able to place new orders when your store is closed. Deliveries will only be scheduled during operating hours.
            </p>
          </div>

        </div>
      </div>

      {/* ── Save Button ── */}
      <div className="flex justify-end pt-2">
        <button
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13.5px] font-bold text-white transition-all hover:opacity-90 cursor-pointer shadow-md"
          style={{ background: "#3b82f6", boxShadow: "0 4px 14px rgba(59,130,246,0.3)" }}
        >
          <Check size={15} strokeWidth={3} />
          Save Operating Hours
        </button>
      </div>

    </div>
  );
};

export default OperatingHours;
