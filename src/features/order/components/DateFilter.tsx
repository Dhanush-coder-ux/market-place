import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, Zap } from "lucide-react";
import { FloatingFormCard } from "@/components/common/FloatingFormCard";

// --- Types & Interfaces ---

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface Preset {
  label: string;
  getValue: () => [Date, Date];
}

interface CalendarGridProps {
  year: number;
  month: number;
  startDate: Date | null;
  endDate: Date | null;
  hoverDate: Date | null;
  onDayClick: (date: Date) => void;
  onDayHover: (date: Date | null) => void;
}

interface DateFilterProps {
  onApply: (range: DateRange) => void;
  onClose: () => void;
  isOpen: boolean;
}

// --- Constants ---

const MONTHS: string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS: string[] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const PRESETS: Preset[] = [
  { label: "Today", getValue: () => { const d = new Date(); return [new Date(d), new Date(d)]; } },
  { label: "Yesterday", getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return [new Date(d), new Date(d)]; } },
  { label: "Last 7 days", getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return [s, e]; } },
  { label: "Last 30 days", getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 29); return [s, e]; } },
  { label: "This month", getValue: () => { const n = new Date(); return [new Date(n.getFullYear(), n.getMonth(), 1), new Date(n.getFullYear(), n.getMonth() + 1, 0)]; } },
  { label: "Last month", getValue: () => { const n = new Date(); return [new Date(n.getFullYear(), n.getMonth() - 1, 1), new Date(n.getFullYear(), n.getMonth(), 0)]; } },
];

// --- Helper Functions ---

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBetween(d: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const s = start < end ? start : end;
  const e = start < end ? end : start;
  return d > s && d < e;
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// --- Components ---

function CalendarGrid({ year, month, startDate, endDate, hoverDate, onDayClick, onDayHover }: CalendarGridProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  
  const rangeEnd = hoverDate && startDate && !endDate ? hoverDate : endDate;

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          
          const isStart = isSameDay(date, startDate);
          const isEnd = isSameDay(date, endDate) || (hoverDate && !endDate && isSameDay(date, hoverDate) && startDate);
          const inRange = isBetween(date, startDate, rangeEnd as Date);
          const isToday = isSameDay(date, new Date());
          const isSelected = isStart || isEnd;

          let cellClass = "relative flex items-center justify-center h-8 text-sm cursor-pointer select-none ";
          let innerClass = "w-8 h-8 flex items-center justify-center rounded-full z-10 relative text-[13px] font-medium transition-all duration-150 ";

          if (isStart) {
            cellClass += "bg-indigo-100 rounded-l-full ";
            if (!endDate && !hoverDate) cellClass = "relative flex items-center justify-center h-8 text-sm cursor-pointer select-none rounded-full ";
            innerClass += "bg-indigo-600 text-white font-bold shadow-sm ";
          } else if (isEnd) {
            cellClass += "bg-indigo-100 rounded-r-full ";
            innerClass += "bg-indigo-600 text-white font-bold shadow-sm ";
          } else if (inRange) {
            cellClass += "bg-indigo-50 ";
            innerClass += "text-indigo-700 hover:bg-indigo-100 ";
          } else {
            innerClass += "text-slate-700 hover:bg-slate-100 ";
          }

          return (
            <div key={`${year}-${month}-${date.getDate()}`} className={cellClass}
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
            >
              <div className={innerClass}>
                {date.getDate()}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DateFilter({ onApply, onClose, isOpen }: DateFilterProps) {
  const today = new Date();
  const [leftMonth, setLeftMonth] = useState<number>(today.getMonth() === 0 ? 11 : today.getMonth() - 1);
  const [leftYear, setLeftYear] = useState<number>(today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear());
  const [rightMonth, setRightMonth] = useState<number>(today.getMonth());
  const [rightYear, setRightYear] = useState<number>(today.getFullYear());
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  function handleDayClick(date: Date) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date); setEndDate(null); setActivePreset(null);
    } else {
      if (date < startDate) { setEndDate(startDate); setStartDate(date); }
      else setEndDate(date);
      setActivePreset(null);
    }
  }

  function handlePreset(preset: Preset, idx: number) {
    const [s, e] = preset.getValue();
    setStartDate(s); setEndDate(e); setActivePreset(idx);
    setLeftMonth(s.getMonth()); setLeftYear(s.getFullYear());
    const next = new Date(s.getFullYear(), s.getMonth() + 1, 1);
    setRightMonth(next.getMonth()); setRightYear(next.getFullYear());
  }

  function goLeft() {
    if (leftMonth === 0) { setLeftMonth(11); setLeftYear(y => y - 1); }
    else setLeftMonth(m => m - 1);
  }

  function goRight() {
    if (rightMonth === 11) { setRightMonth(0); setRightYear(y => y + 1); }
    else setRightMonth(m => m + 1);
  }

  const canApply = !!(startDate && endDate);
  const dayCount = canApply ? Math.round(Math.abs((endDate as Date).getTime() - (startDate as Date).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;

  return (
    <FloatingFormCard
      isOpen={isOpen}
      onClose={onClose}
      title="Select Date Range"
      maxWidth="max-w-3xl"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <Calendar size={15} strokeWidth={2.5} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 tracking-tight">Date Range</p>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Select start and end dates</p>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Presets */}
        <div className="w-40 border-r border-slate-100 p-3 flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 flex items-center gap-1.5">
            <Zap size={9} strokeWidth={3} /> Quick
          </p>
          <div className="flex flex-col gap-1">
            {PRESETS.map((preset, i) => (
              <button key={preset.label} onClick={() => handlePreset(preset, i)}
                className={`px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-all duration-150 w-full ${activePreset === i ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"}`}>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendars */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center gap-2 mb-4 bg-slate-50 rounded-xl px-4 py-2.5">
            <div className="flex-1 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Start</p>
              <p className={`text-sm font-black tracking-tight ${startDate ? "text-indigo-600" : "text-slate-300"}`}>
                {startDate ? formatDate(startDate) : "Not selected"}
              </p>
            </div>
            <ArrowRight size={14} strokeWidth={2.5} className="text-slate-300 flex-shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">End</p>
              <p className={`text-sm font-black tracking-tight ${endDate ? "text-indigo-600" : "text-slate-300"}`}>
                {endDate ? formatDate(endDate) : "Not selected"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <button onClick={goLeft} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronLeft size={15} strokeWidth={2.5} />
                </button>
                <span className="text-[13px] font-black text-slate-800 tracking-tight">{MONTHS[leftMonth]} {leftYear}</span>
                <div className="w-7 h-7" />
              </div>
              <CalendarGrid year={leftYear} month={leftMonth} startDate={startDate} endDate={endDate} hoverDate={hoverDate} onDayClick={handleDayClick} onDayHover={setHoverDate} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-7 h-7" />
                <span className="text-[13px] font-black text-slate-800 tracking-tight">{MONTHS[rightMonth]} {rightYear}</span>
                <button onClick={goRight} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronRight size={15} strokeWidth={2.5} />
                </button>
              </div>
              <CalendarGrid year={rightYear} month={rightMonth} startDate={startDate} endDate={endDate} hoverDate={hoverDate} onDayClick={handleDayClick} onDayHover={setHoverDate} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
        <button onClick={() => { setStartDate(null); setEndDate(null); setActivePreset(null); }}
          className="text-[12px] font-semibold text-slate-400 hover:text-rose-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-rose-50">
          Clear
        </button>
        <div className="flex items-center gap-3">
          {canApply && <span className="text-[11px] font-medium text-slate-400">{dayCount} day{dayCount !== 1 ? "s" : ""} selected</span>}
          <button
            onClick={() => canApply && onApply?.({ startDate, endDate })}
            disabled={!canApply}
            className={`px-5 py-2 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-200 ${canApply ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}>
            Apply Filter
          </button>
        </div>
      </div>
    </FloatingFormCard>
  );
}

export default function App() {
  const [applied, setApplied] = useState<DateRange | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 gap-4">
      {applied && (
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-slate-100 text-sm font-semibold text-slate-700">
          ✅ Applied: <span className="text-indigo-600">{formatDate(applied.startDate)}</span> → <span className="text-indigo-600">{formatDate(applied.endDate)}</span>
        </div>
      )}
      <DateFilter
        isOpen={isFilterOpen}
        onApply={(range) => {
          setApplied(range);
          setIsFilterOpen(false);
        }}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}