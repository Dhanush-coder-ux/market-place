import React, { useState, useMemo, useEffect } from "react";
import {
  Keyboard,
  Search,
  RotateCcw,
  Edit2,
  Check,
  AlertTriangle,
  X,
  Power,
} from "lucide-react";
import {
  useKeyboardShortcuts,
  ShortcutItem,
  eventToKeyCombo,
} from "@/context/KeyboardShortcutsContext";
import KeyboardKey from "@/components/common/KeyboardKey";

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All Shortcuts" },
  { id: "billing", label: "Billing & Invoicing" },
  { id: "navigation", label: "Navigation" },
  { id: "inventory", label: "Products & Inventory" },
  { id: "general", label: "General" },
];

export const KeyboardShortcutsSettings: React.FC = () => {
  const {
    shortcuts,
    enabled,
    setEnabled,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    checkConflict,
  } = useKeyboardShortcuts();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit / customize modal state
  const [editingShortcut, setEditingShortcut] = useState<ShortcutItem | null>(null);
  const [recordedKey, setRecordedKey] = useState<string>("");
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter((s) => {
      const matchCategory =
        activeCategory === "all" ||
        s.category === activeCategory ||
        (activeCategory === "inventory" && (s.category === "inventory" || s.category === "orders"));

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.currentKey.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [shortcuts, activeCategory, searchQuery]);

  // Handle keystroke recording in modal
  useEffect(() => {
    if (!editingShortcut || !isRecording) return;

    const handleRecordKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // If Escape is pressed alone, cancel recording
      if (e.key === "Escape") {
        setIsRecording(false);
        return;
      }

      const combo = eventToKeyCombo(e);
      if (!combo || combo === "ctrl" || combo === "alt" || combo === "shift") {
        return;
      }

      setRecordedKey(combo);
      const conflict = checkConflict(editingShortcut.id, combo);
      if (conflict.hasConflict) {
        setConflictMessage(conflict.message || "Key combo is already in use");
      } else {
        setConflictMessage(null);
      }
      setIsRecording(false);
    };

    window.addEventListener("keydown", handleRecordKeyDown, true);
    return () => window.removeEventListener("keydown", handleRecordKeyDown, true);
  }, [editingShortcut, isRecording, checkConflict]);

  const handleStartEdit = (shortcut: ShortcutItem) => {
    setEditingShortcut(shortcut);
    setRecordedKey(shortcut.currentKey);
    setConflictMessage(null);
    setIsRecording(true);
  };

  const handleSaveEdit = () => {
    if (!editingShortcut || !recordedKey) return;
    const res = updateShortcut(editingShortcut.id, recordedKey);
    if (!res.hasConflict) {
      setEditingShortcut(null);
      setRecordedKey("");
      setConflictMessage(null);
    } else {
      setConflictMessage(res.message || "Conflict detected");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Global Toggle Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Keyboard Shortcuts
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                enabled
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}
            >
              {enabled ? "Active" : "Disabled"}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed max-w-xl">
            Explore and customize global hotkeys to navigate, trigger billing, and perform high-speed store operations without a mouse.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={resetAllShortcuts}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            Reset All
          </button>

          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              enabled
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
            }`}
          >
            <Power size={14} />
            {enabled ? "Hotkeys Enabled" : "Hotkeys Disabled"}
          </button>
        </div>
      </div>

      {/* ── Search Bar & Category Filter Pills ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Reference Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 sm:px-6">Action & Feature</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Assigned Shortcut</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredShortcuts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <Keyboard size={32} className="mx-auto opacity-30 mb-2" />
                      <p className="font-semibold text-slate-600">No shortcuts found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Try searching with a different keyword or category
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredShortcuts.map((item) => {
                    const isCustom = item.currentKey !== item.defaultKey;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-bold text-slate-800 text-[13px] leading-tight">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.description}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 text-slate-600 capitalize">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <KeyboardKey combo={item.currentKey} size="sm" />
                            {isCustom && (
                              <span className="text-[9.5px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                                Modified
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => resetShortcut(item.id)}
                                title="Reset to default key"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}

                            {item.isCustomizable !== false && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer"
                              >
                                <Edit2 size={12} />
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Edit Shortcut Modal ── */}
      {editingShortcut && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Customize Shortcut
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingShortcut.label}
                </p>
              </div>
              <button
                onClick={() => setEditingShortcut(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Recorder Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {isRecording ? "Press desired keys on your keyboard..." : "Recorded Key Combination"}
              </span>

              <div className="py-2">
                {recordedKey ? (
                  <KeyboardKey combo={recordedKey} size="lg" />
                ) : (
                  <span className="text-xs text-slate-400 italic">No key recorded yet</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsRecording(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isRecording
                    ? "bg-emerald-100 text-emerald-800 animate-pulse"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {isRecording ? "Listening for keys..." : "Click to Record New Keys"}
              </button>
            </div>

            {/* Conflict Warning */}
            {conflictMessage && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-amber-800 text-xs">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>{conflictMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingShortcut(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={Boolean(conflictMessage) || !recordedKey}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
              >
                <Check size={14} />
                Save Shortcut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardShortcutsSettings;
