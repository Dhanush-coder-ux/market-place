import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, Keyboard } from "lucide-react";
import { useKeyboardShortcuts, ShortcutCategory } from "@/context/KeyboardShortcutsContext";
import KeyboardKey from "./KeyboardKey";

const CATEGORY_NAMES: Record<ShortcutCategory, string> = {
  general: "General Productivity",
  navigation: "Navigation & Pages",
  billing: "Billing & Invoicing",
  inventory: "Products & Stock",
  customers: "Customers & Directory",
  orders: "Orders & Sales",
};

export const ShortcutsCheatSheetModal: React.FC = () => {
  const { isCheatSheetOpen, setCheatSheetOpen, shortcuts } = useKeyboardShortcuts();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set<ShortcutCategory>();
    shortcuts.forEach((s) => set.add(s.category));
    return ["all", ...Array.from(set)];
  }, [shortcuts]);

  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter((s) => {
      const matchCat = selectedCategory === "all" || s.category === selectedCategory;
      const matchQuery =
        !search.trim() ||
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.currentKey.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [shortcuts, selectedCategory, search]);

  // Group by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, typeof filteredShortcuts> = {};
    filteredShortcuts.forEach((s) => {
      const catTitle = CATEGORY_NAMES[s.category] || s.category;
      if (!groups[catTitle]) groups[catTitle] = [];
      groups[catTitle].push(s);
    });
    return groups;
  }, [filteredShortcuts]);

  if (!isCheatSheetOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setCheatSheetOpen(false);
      }}
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Keyboard size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Keyboard Shortcuts Reference
              </h2>
              <p className="text-xs text-slate-400">
                Navigate and operate InventQ faster with hotkeys
              </p>
            </div>
          </div>

          <button
            onClick={() => setCheatSheetOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts by action, description, or key..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-xs"
              autoFocus
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "all" ? "All Shortcuts" : CATEGORY_NAMES[cat as ShortcutCategory] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {Object.keys(groupedShortcuts).length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Keyboard size={32} className="mx-auto opacity-30" />
              <p className="text-sm font-semibold text-slate-600">No shortcuts match your search</p>
            </div>
          ) : (
            Object.entries(groupedShortcuts).map(([groupTitle, items]) => (
              <div key={groupTitle} className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  {groupTitle}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 leading-tight">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <KeyboardKey combo={item.currentKey} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Press <KeyboardKey combo="esc" size="xs" /> to close this cheatsheet
          </span>
          <span className="font-semibold text-slate-600">
            Customize shortcuts in Settings → Keyboard Shortcuts
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShortcutsCheatSheetModal;
