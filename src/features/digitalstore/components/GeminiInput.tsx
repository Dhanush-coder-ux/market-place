import { useState } from 'react';
import { Megaphone, ChevronDown, SendHorizontal, Trash2, Calendar as CalendarIcon, History } from 'lucide-react';
import { format } from "date-fns";

// Shadcn UI Imports
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

const GeminiInput = () => {
  const [announcement, setAnnouncement] = useState("");
  const [type, setType] = useState("Announcement");
 const [date, setDate] = useState<Date | undefined>(new Date());


  // Mock data for previous announcements
  const previousAnnouncements = [
    { id: 1, text: "50% off all summer drinks!", date: "2024-05-10", type: "Offer" },
    { id: 2, text: "We are closed this Sunday for maintenance.", date: "2024-05-08", type: "Update" },
    { id: 3, text: "New seasonal menu is here!", date: "2024-05-01", type: "Announcement" },
    { id: 3, text: "New seasonal menu is here!", date: "2024-05-01", type: "Announcement" },
    { id: 3, text: "New seasonal menu is here!", date: "2024-05-01", type: "Announcement" },
    { id: 3, text: "New seasonal menu is here!", date: "2024-05-01", type: "Announcement" },
  ];

  return (
    <div className=" my-4 overflow-hidden rounded-3xl border border-gray-200 bg-[#f0f4f9] p-2 focus-within:bg-white focus-within:shadow-md transition-all duration-200">
      
      {/* Header: Type, Date, and History */}
      <div className="flex items-center justify-between px-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors outline-none border border-transparent focus:border-gray-300">
                <Megaphone size={14} className="text-indigo-600" />
                <span>{type}</span>
                <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-xl w-40">
              {["Announcement", "Update", "Offer"].map((item) => (
                <DropdownMenuItem key={item} onClick={() => setType(item)} className="text-xs">
                  {item}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors outline-none",
                  !date ? "text-gray-400" : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100"
                )}
              >
                <CalendarIcon size={14} />
                <span>{date ? format(date, "MMM d") : "Pick a date"}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
           <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />

            </PopoverContent>
          </Popover>
        </div>

        {/* --- NEW: Previous Announcements Button --- */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all outline-none">
              <History size={14} />
              <span className="hidden sm:inline">Your Announcements</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl border-gray-100" align="end">
            <div className="p-4 border-b bg-gray-50/50 rounded-t-2xl">
              <h4 className="text-sm font-semibold text-gray-700">Recent Activity</h4>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
              {previousAnnouncements.map((prev) => (
                <div 
                  key={prev.id} 
                  className="p-3 rounded-xl border border-gray-50 bg-white hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">{prev.type}</span>
                    <span className="text-[10px] text-gray-400">{prev.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 group-hover:text-gray-900 transition-colors">{prev.text}</p>
                </div>
              ))}
              {previousAnnouncements.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 italic">No history yet</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Text Area */}
      <textarea
        placeholder="Write an offer, update, or important info..."
        rows={2}
        maxLength={120}
        value={announcement}
        onChange={(e) => setAnnouncement(e.target.value)}
        className="w-full bg-transparent px-4 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 resize-none min-h-[80px]"
      />

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-3 pb-1">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setAnnouncement("")}
            className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors focus:outline-none"
            title="Clear"
          >
            <Trash2 size={18} />
          </button>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {announcement.length} / 120
          </span>
        </div>

        <button 
          disabled={!announcement}
          className={`rounded-full p-2.5 transition-all ${
            announcement 
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg scale-105 active:scale-95" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          onClick={() => console.log("Sending...", { announcement, type, date })}
        >
          <SendHorizontal size={20} />
        </button>
      </div>
    </div>
  );
};

export default GeminiInput;