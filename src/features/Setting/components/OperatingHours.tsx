
import {
  Clock, Copy, 
  Check, X
} from "lucide-react";
import { useState } from "react";
/* ───────────── Types ───────────── */
type Day = "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday";
const DAYS: Day[] = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DAY_SHORT: Record<Day,string> = { Monday:"Mon",Tuesday:"Tue",Wednesday:"Wed",Thursday:"Thu",Friday:"Fri",Saturday:"Sat",Sunday:"Sun" };

type DayHours  = { open: string; close: string; closed: boolean };


const OperatingHours = () => {
      
      const [storeHours,setStoreHours]=useState<Record<Day,DayHours>>(
        DAYS.reduce((a,d) => { a[d]={open:"09:00",close:"18:00",closed:false}; return a; }, {} as Record<Day,DayHours>)
      );
      const [globalOpen,  setGlobalOpen]  = useState("09:00");
      const [globalClose, setGlobalClose] = useState("18:00");
      const [applied, setApplied] = useState(false);
    
      const applyToAll = () => {
        const u = { ...storeHours };
        DAYS.forEach(d => { if(!u[d].closed) { u[d].open=globalOpen; u[d].close=globalClose; } });
        setStoreHours(u);
        setApplied(true);
        setTimeout(() => setApplied(false), 1600);
      };
    
      const toggleDay = (day:Day) =>
        setStoreHours(p => ({ ...p, [day]:{ ...p[day], closed:!p[day].closed } }));
    
      const updateTime = (day:Day, field:"open"|"close", val:string) =>
        setStoreHours(p => ({ ...p, [day]:{ ...p[day], [field]:val } }));
    
      const openCount = DAYS.filter(d => !storeHours[d].closed).length;

  return (
    <div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="h-1 w-full bg-blue-300" />
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 ring-1 ring-blue-200">
              <Clock size={18} strokeWidth={2.5} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[15px] font-black text-slate-800">Operating Hours</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                {openCount} of {DAYS.length} days open
              </p>
            </div>
          </div>

          {/* Global time setter */}
          <div className="flex flex-wrap items-end gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opens</label>
              <input
                type="time"
                value={globalOpen}
                onChange={(e) => setGlobalOpen(e.target.value)}
                className="mt-1.5 block px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
              />
            </div>
            <span className="text-slate-300 font-black text-lg mb-2.5">→</span>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Closes</label>
              <input
                type="time"
                value={globalClose}
                onChange={(e) => setGlobalClose(e.target.value)}
                className="mt-1.5 block px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
              />
            </div>
            <button
              onClick={applyToAll}
              className={`ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px]  transition-all duration-200 shadow-sm ${
                applied
                  ? "bg-emerald-500 text-white shadow-emerald-200"
                  : "bg-blue-500 hover:bg-blue-500 text-white shadow-blue-200 hover:shadow-blue-300"
              }`}
            >
              {applied ? <><Check size={14} strokeWidth={3} />Applied!</> : <><Copy size={14} strokeWidth={2.5} />Apply to All</>}
            </button>
          </div>
        </div>

        {/* Days grid */}
        <div className="p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="w-3 h-px bg-slate-300 inline-block" />
            Click to toggle · Adjust individual times
            <span className="w-3 h-px bg-slate-300 inline-block" />
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DAYS.map((day) => {
              const isOpen = !storeHours[day].closed;
              return (
                <div
                  key={day}
                  className={`rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                    isOpen ? "border-blue-200 bg-blue-50/30" : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  {/* Day header — click to toggle */}
                  <div
                    className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none"
                    onClick={() => toggleDay(day)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isOpen ? "bg-blue-600":"bg-slate-200"}`}>
                        {isOpen
                          ? <Check size={11} strokeWidth={3} className="text-white" />
                          : <X size={10} strokeWidth={3} className="text-slate-400" />
                        }
                      </div>
                      <span className={`text-[13px] font-black ${isOpen ? "text-slate-800":"text-slate-400"}`}>
                        {DAY_SHORT[day]}
                        <span className="hidden sm:inline font-semibold text-slate-400"> · {day.slice(3)}</span>
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${isOpen ? "bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-400"}`}>
                      {isOpen ? "Open" : "Closed"}
                    </span>
                  </div>

                  {/* Time inputs — only when open */}
                  {isOpen && (
                    <div className="flex items-center gap-1.5 px-3 pb-3">
                      <input
                        type="time"
                        value={storeHours[day].open}
                        onChange={(e) => updateTime(day,"open",e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-white border border-blue-100 text-[12px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                      />
                      <span className="text-slate-300 font-bold text-xs">–</span>
                      <input
                        type="time"
                        value={storeHours[day].close}
                        onChange={(e) => updateTime(day,"close",e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-white border border-blue-100 text-[12px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default OperatingHours
