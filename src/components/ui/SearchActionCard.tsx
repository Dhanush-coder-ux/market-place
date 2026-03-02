import React, { useState, useRef, useEffect } from "react";
import type { SearchActionCardProps } from "../types";
import Input from "./Input";
import {
  Search, Package, PackageX, AlertTriangle,
  Upload,
  X, SlidersHorizontal, ChevronDown
} from "lucide-react";
import ImportExportFloatingCard from "../common/ImportExportCard";

const STOCK_FILTERS = [
  { label: "High Stock",    value: "HIGHSTOCK",   icon: Package,       color: "text-emerald-500", bg: "bg-emerald-50 ring-emerald-200" },
  { label: "Low Stock",     value: "LOWSTOCK",    icon: PackageX,      color: "text-rose-500",    bg: "bg-rose-50 ring-rose-200"       },
  { label: "Out of Stock",  value: "OUTOFSTOCK",  icon: AlertTriangle, color: "text-amber-500",   bg: "bg-amber-50 ring-amber-200"     },
];

const SearchActionCard: React.FC<SearchActionCardProps> = ({
  searchValue,
  onSearchChange,
  placeholder = "Search inventory…",
}) => {
  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleImport = (file: File) => console.log("Imported:", file);
  const handleExport = (type: "xlsx" | "docx") => console.log("Exporting:", type);

  const active = STOCK_FILTERS.find(f => f.value === activeFilter);

  return (
    <div className="flex flex-col gap-3 w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">

        {/* ── Search ── */}
        <div className="flex-1 min-w-0">
          <Input
            name="search"
            value={searchValue}
            onChange={onSearchChange}
            placeholder={placeholder}
            leftIcon={<Search size={16} strokeWidth={2.5} className="text-slate-400" />}
            className="w-full bg-white rounded-xl border-slate-200 h-10 text-sm focus:border-indigo-400 focus:ring-indigo-100"
          />
        </div>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Stock filter dropdown */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen(v => !v)}
              className={`
                inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-[13px] font-semibold
                transition-all duration-150 whitespace-nowrap
                ${active
                  ? `${active.bg} ring-1 ${active.color} border-transparent`
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                }
              `}
            >
              {active
                ? <active.icon size={14} strokeWidth={2.5} className={active.color} />
                : <SlidersHorizontal size={14} strokeWidth={2.5} />
              }
              <span className="hidden sm:inline">{active ? active.label : "Filter"}</span>
              <ChevronDown
                size={13}
                strokeWidth={2.5}
                className={`transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 py-2 min-w-[180px] overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3.5 pb-1.5 pt-0.5">
                  Stock Status
                </p>
                {STOCK_FILTERS.map(({ label, value, icon: Icon, color, bg }) => {
                  const isActive = activeFilter === value;
                  return (
                    <button
                      key={value}
                      onClick={() => { setActiveFilter(isActive ? null : value); setFilterOpen(false); }}
                      className={`
                        w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold
                        transition-colors duration-100
                        ${isActive ? `${bg} ring-1 ${color}` : "hover:bg-slate-50 text-slate-700"}
                      `}
                    >
                      <Icon size={14} strokeWidth={2.5} className={color} />
                      {label}
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />}
                    </button>
                  );
                })}
                {activeFilter && (
                  <>
                    <div className="h-px bg-slate-100 mx-3 my-1.5" />
                    <button
                      onClick={() => { setActiveFilter(null); setFilterOpen(false); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] font-semibold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <X size={12} strokeWidth={2.5} />
                      Clear filter
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Export/Import button */}
          <div className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              className={`
                inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-[13px] font-semibold
                transition-all duration-150
                ${open
                  ? "bg-indigo-600 text-white border-transparent shadow-sm shadow-indigo-200"
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                }
              `}
            >
              {open
                ? <X size={14} strokeWidth={2.5} />
                : <Upload size={14} strokeWidth={2.5} />
              }
              <span className="hidden sm:inline">{open ? "Close" : "Import / Export"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active filter chip */}
      {active && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Filtered by:</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ${active.bg} ${active.color}`}>
            <active.icon size={10} strokeWidth={2.5} />
            {active.label}
            <button onClick={() => setActiveFilter(null)} className="ml-1 hover:opacity-70 transition-opacity">
              <X size={10} strokeWidth={3} />
            </button>
          </span>
        </div>
      )}

      {/* Import / Export floating card */}
      {open && (
        <ImportExportFloatingCard
          onClose={() => setOpen(false)}
          onImport={handleImport}
          onExport={handleExport}
        />
      )}
    </div>
  );
};

export default SearchActionCard;