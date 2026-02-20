import { Calendar } from "@/components/ui/calendar";
import React from "react";
import { type DateRange } from "react-day-picker";
import { format, subDays, startOfMonth } from "date-fns";
import { CalendarIcon, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderDateFilterProps {
  onRangeChange?: (range: DateRange | undefined) => void;
}

const OrderDateFilter: React.FC<OrderDateFilterProps> = ({ onRangeChange }) => {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const presets = [
    { label: "Today", range: { from: new Date(), to: new Date() } },
    { label: "Last 7 Days", range: { from: subDays(new Date(), 7), to: new Date() } },
    { label: "Last 30 Days", range: { from: subDays(new Date(), 30), to: new Date() } },
    { label: "This Month", range: { from: startOfMonth(new Date()), to: new Date() } },
  ];

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (onRangeChange) onRangeChange(range);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white border-l shadow-xl">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-10 bg-white border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-900">Filter by Date</h2>
          <button 
             onClick={() => handleSelect(undefined)}
             className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Reset
          </button>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <CalendarIcon className="w-5 h-5 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-400 font-bold leading-none">Selected Range</span>
            <span className="text-sm font-semibold text-slate-700">
              {dateRange?.from ? (
                <>
                  {format(dateRange.from, "MMM dd")} —{" "}
                  {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "Select end date"}
                </>
              ) : (
                "No dates selected"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* --- Scrollable Content Area --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* --- Section 1: Presets --- */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Quick Select
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => {
              const isActive = dateRange?.from?.toDateString() === preset.range.from.toDateString();
              return (
                <button
                  key={preset.label}
                  onClick={() => handleSelect(preset.range)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl border transition-all",
                    isActive 
                      ? "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-200" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {preset.label}
                  {isActive && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* --- Section 2: Dual Calendars (Stacked) --- */}
        <section className="flex flex-col">
  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
    Custom Range
  </h3>

  <div className="bg-white rounded-xl border border-slate-200 p-2">
  <Calendar
  mode="range"
  selected={dateRange}
  onSelect={handleSelect}
  defaultMonth={dateRange?.from}
  numberOfMonths={2}
  disabled={{ after: new Date() }}
  className="
    text-xs
    [&_.rdp-months]:gap-8
    [&_.rdp-month]:space-y-6
    [&_.rdp-caption]:text-sm pb-2
    [&_.rdp-head_row]:mb-1
    [&_.rdp-head_cell]:text-[10px]
    [&_.rdp-day]:h-7
    [&_.rdp-day]:w-7
    [&_.rdp-day]:text-xs
  "
/>
  </div>
</section>
      </div>

      {/* --- Sticky Footer --- */}
      <div className="sticky bottom-0 bg-white border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <button 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98]"
          onClick={() => {/* Trigger parent filter function */}}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default OrderDateFilter;