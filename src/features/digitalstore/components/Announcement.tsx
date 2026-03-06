import { useState, useRef } from 'react';
import {
  Megaphone, ChevronDown, SendHorizontal, Trash2,
  Calendar as CalendarIcon, History, X, Sparkles,
  Tag, Zap, Info, Check
} from 'lucide-react';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import SearchActionCard from '@/components/ui/SearchActionCard';

const TYPE_CONFIG = {
  Announcement: { icon: Megaphone, color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-200", dot: "bg-indigo-500", label: "Announcement" },
  Update:       { icon: Info,      color: "text-sky-600",    bg: "bg-sky-50",    ring: "ring-sky-200",    dot: "bg-sky-500",    label: "Update"       },
  Offer:        { icon: Tag,       color: "text-emerald-600",bg: "bg-emerald-50",ring: "ring-emerald-200",dot: "bg-emerald-500",label: "Offer"        },
};

const PREVIOUS = [
  { id: 1, text: "50% off all summer drinks this weekend only!", date: "2024-05-10", type: "Offer" },
  { id: 2, text: "We are closed this Sunday for maintenance.", date: "2024-05-08", type: "Update" },
  { id: 3, text: "New seasonal menu is here! Come try our new offerings.", date: "2024-05-01", type: "Announcement" },
  { id: 4, text: "Extended hours during the festive season.", date: "2024-04-28", type: "Update" },
  { id: 5, text: "Buy 2 get 1 free on all bakery items!", date: "2024-04-20", type: "Offer" },
];

const SUGGESTIONS = [
  "🎉 Grand sale — up to 50% off this weekend!",
  "⏰ Closing early today at 6 PM.",
  "🆕 New arrivals just landed. Come check them out!",
  "🎁 Buy 2 get 1 free on all items today.",
];

export default function Announcement() {
  const [announcement, setAnnouncement] = useState("");
  const [type, setType] = useState<keyof typeof TYPE_CONFIG>("Announcement");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [focused, setFocused] = useState(false);
  const [sent, setSent] = useState(false);
  // Optional: keep historyOpen if you want to toggle the right panel on mobile
  const [historyOpen, setHistoryOpen] = useState(true); 
  const textRef = useRef<HTMLTextAreaElement>(null);

  const config = TYPE_CONFIG[type];
  const TypeIcon = config.icon;
  const charCount = announcement.length;
  const maxLen = 160;
  const progress = (charCount / maxLen) * 100;

  const handleSend = () => {
    if (!announcement.trim()) return;
    setSent(true);
    setTimeout(() => { setSent(false); setAnnouncement(""); }, 1800);
  };

  const handleSuggestion = (s: string) => {
    setAnnouncement(s);
    textRef.current?.focus();
  };

  return (
    <div
      className="w-full max-w-5xl mx-auto my-6 p-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── Main Two-Column Layout ── */}
      <div className='flex flex-col md:flex-row gap-6 items-start'>
        
        {/* ── Left Column: Editor Card ── */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div
            className={`
              relative bg-white rounded-3xl border transition-all duration-300 overflow-hidden
              ${focused
                ? "border-indigo-200 shadow-xl shadow-indigo-100/60"
                : "border-slate-200 shadow-md shadow-slate-100/80"
              }
            `}
          >
            {/* Colored top accent */}
            <div className={`h-1 w-full transition-all duration-300 ${
              type === "Offer" ? "bg-emerald-500" : type === "Update" ? "bg-sky-500" : "bg-indigo-500"
            }`} />

            {/* ── Top controls ── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">

                {/* Type selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                      text-[12px] font-bold border ring-1 transition-all duration-150 outline-none
                      ${config.color} ${config.bg} ${config.ring}
                    `}>
                      <TypeIcon size={13} strokeWidth={2.5} />
                      {type}
                      <ChevronDown size={12} strokeWidth={2.5} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-2xl p-1.5 w-44 shadow-xl border-slate-100 bg-white">
                    {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((t) => {
                      const c = TYPE_CONFIG[t];
                      const TIcon = c.icon;
                      return (
                        <DropdownMenuItem
                          key={t}
                          onClick={() => setType(t)}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold cursor-pointer transition-colors outline-none ${type === t ? `${c.bg} ${c.color}` : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          <TIcon size={13} strokeWidth={2.5} className={type === t ? c.color : "text-slate-400"} />
                          {t}
                          {type === t && <Check size={12} strokeWidth={3} className="ml-auto" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Date picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all outline-none bg-white",
                      date
                        ? "text-slate-600 bg-slate-50 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                        : "text-slate-400 border-slate-200 hover:border-slate-300"
                    )}>
                      <CalendarIcon size={13} strokeWidth={2.5} />
                      {date ? format(date, "MMM d, yyyy") : "Pick date"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-100 bg-white" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* ── Textarea ── */}
            <div className="px-4 py-2">
              <textarea
                ref={textRef}
                placeholder={`Write your ${type.toLowerCase()} here…`}
                rows={4}
                maxLength={maxLen}
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400 resize-none leading-relaxed font-medium"
              />
            </div>

            {/* ── Suggestions (shown when empty) ── */}
            {!announcement && focused && (
              <div className="px-4 pb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Sparkles size={9} strokeWidth={3} />
                  Quick suggestions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={(e) => { e.preventDefault(); handleSuggestion(s); }}
                      className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[11px] font-semibold text-slate-600 hover:text-indigo-700 transition-all text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Progress bar ── */}
            <div className="px-4">
              <div className="h-0.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progress > 90 ? "bg-rose-500" : progress > 70 ? "bg-amber-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-4 py-3 mt-1 bg-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAnnouncement("")}
                  disabled={!announcement}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all outline-none ${
                    announcement
                      ? "text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                      : "text-slate-200 cursor-not-allowed"
                  }`}
                >
                  <Trash2 size={15} strokeWidth={2.5} />
                </button>
                <span className={`text-[11px] font-bold tabular-nums transition-colors ${
                  progress > 90 ? "text-rose-500" : progress > 70 ? "text-amber-500" : "text-slate-400"
                }`}>
                  {charCount} / {maxLen}
                </span>
              </div>

              {/* Send button */}
              <button
                disabled={!announcement.trim() || sent}
                onClick={handleSend}
                className={`
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-black
                  transition-all duration-200 relative overflow-hidden outline-none
                  ${sent
                    ? "bg-emerald-500 text-white scale-95"
                    : announcement.trim()
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 active:scale-95"
                      : "bg-slate-100 text-slate-300 cursor-not-allowed"
                  }
                `}
              >
                {sent ? (
                  <>
                    <Check size={15} strokeWidth={3} />
                    Sent!
                  </>
                ) : (
                  <>
                    <Zap size={14} strokeWidth={2.5} />
                    Publish
                    <SendHorizontal size={14} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Preview badge below card ── */}
          {announcement && (
            <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${config.bg} ${config.ring} ring-1`}>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${config.color} ${config.bg}`}>
                <TypeIcon size={14} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>{type}</span>
                  {date && <span className="text-[10px] text-slate-400 font-medium">{format(date, "MMM d")}</span>}
                </div>
                <p className="text-[12px] font-semibold text-slate-700 leading-relaxed">{announcement}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: History ── */}
        {historyOpen && (
          <div className="w-full md:w-1/3 bg-white rounded-3xl border border-slate-200 shadow-md shadow-slate-100/80 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className='flex flex-col space-y-3'>
              <p className="text-[13px] font-black text-slate-800 flex items-center gap-2">
                
                <History size={14} className="text-slate-500" /> 
                Past Announcements
              </p>
              <SearchActionCard
              maxWidth='max-w-4xl'
              onSearchChange={()=>{}}
              searchValue=''
              />
           
              </div>
              <button 
                onClick={() => setHistoryOpen(false)} 
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors md:hidden"
                aria-label="Close history"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-2.5 space-y-1.5 max-h-[350px]">
              {PREVIOUS.map((prev) => {
                const pc = TYPE_CONFIG[prev.type as keyof typeof TYPE_CONFIG];
                return (
                  <button
                    key={prev.id}
                    onClick={() => { 
                      setAnnouncement(prev.text); 
                      setType(prev.type as keyof typeof TYPE_CONFIG); 
                      // setHistoryOpen(false); // Uncomment if you want clicking an item to close the panel on mobile
                    }}
                    className="w-full text-left p-3 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/40 transition-all group outline-none"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${pc.bg} ${pc.color}`}>
                        <span className={`w-1 h-1 rounded-full ${pc.dot}`} />
                        {prev.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{prev.date}</span>
                    </div>
                    <p className="text-[12px] text-slate-600 line-clamp-2 group-hover:text-slate-900 transition-colors">
                      {prev.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}