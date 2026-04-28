import React, { useState, useMemo } from "react";
import { ScanLine, Copy, X, Plus, AlertCircle } from "lucide-react";

interface LabelProps { text: string; required?: boolean; hint?: string; }
const LocalLabel: React.FC<LabelProps> = ({ text, required, hint }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
    {text}{required && <span className="text-red-400 ml-0.5">*</span>}
    {hint && <span className="ml-1.5 normal-case font-normal text-slate-400">({hint})</span>}
  </label>
);

interface InlineSerialManagerProps {
  serials: string[];
  serialLabel: string;
  onUpdate: (serials: string[]) => void;
  limit?: number;
  existingSerials?: string[];
  validationType?: 'increase' | 'decrease';
  onValidationError?: (msg: string) => void;
}

export const InlineSerialManager: React.FC<InlineSerialManagerProps> = ({ 
  serials, 
  serialLabel, 
  onUpdate, 
  limit,
  existingSerials,
  validationType,
  onValidationError
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

  const validateSerial = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) return false;
    
    // Check for duplicates in current list
    if (serials.includes(trimmed)) {
      onValidationError?.(`${serialLabel} "${trimmed}" is already added.`);
      return false;
    }

    // Check against existing inventory if needed
    if (existingSerials) {
      const exists = existingSerials.includes(trimmed);
      if (validationType === 'increase' && exists) {
        onValidationError?.(`${serialLabel} "${trimmed}" already exists in inventory!`);
        return false;
      }
      if (validationType === 'decrease' && !exists) {
        onValidationError?.(`${serialLabel} "${trimmed}" not found in current inventory.`);
        return false;
      }
    }

    return true;
  };

  const handleAdd = (val: string) => {
    if (limit !== undefined && serials.length >= limit) return;
    if (validateSerial(val)) {
      onUpdate([...serials, val.trim()]);
      setInputValue("");
    }
  };

  const handleRemove = (val: string) => {
    onUpdate(serials.filter(s => s !== val));
  };

  const handleBulkImport = () => {
    const incoming = bulkInput
      .split(/[\n,;]/)
      .map(s => s.trim())
      .filter(Boolean);
    
    const uniqueIncoming = Array.from(new Set(incoming));
    let toAdd = uniqueIncoming.filter(s => !serials.includes(s));

    // Apply existing serials validation for bulk if needed
    if (existingSerials && validationType) {
      toAdd = toAdd.filter(s => {
        const exists = existingSerials.includes(s);
        if (validationType === 'increase' && exists) return false;
        if (validationType === 'decrease' && !exists) return false;
        return true;
      });
    }
    
    if (limit !== undefined) {
      const remaining = limit - serials.length;
      if (remaining <= 0) return;
      if (toAdd.length > remaining) {
        toAdd = toAdd.slice(0, remaining);
      }
    }
    
    if (toAdd.length > 0) {
      onUpdate([...serials, ...toAdd]);
    }
    setBulkInput("");
    setShowBulk(false);
  };

  const bulkPreviewCount = useMemo(() => {
    const incoming = bulkInput.split(/[\n,;]/).map(s => s.trim()).filter(Boolean);
    const unique = Array.from(new Set(incoming)).filter(s => !serials.includes(s));
    if (limit !== undefined) {
      return Math.max(0, Math.min(unique.length, limit - serials.length));
    }
    return unique.length;
  }, [bulkInput, serials, limit]);

  return (
    <div className={`bg-slate-50/80 border rounded-2xl p-4 transition-all duration-300 ${limit !== undefined && serials.length === limit ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
            <ScanLine size={12} />
          </div>
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{serialLabel}s Management</span>
        </div>
        <div className="flex items-center gap-2">
          {limit !== undefined && (
            <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black tabular-nums border transition-all duration-300 ${
              serials.length === limit && limit > 0
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                : limit === 0 
                  ? "bg-slate-200 text-slate-500 border-slate-300"
                  : "bg-white text-slate-700 border-slate-200 shadow-inner"
            }`}>
              {serials.length} / {limit}
            </div>
          )}
          <button 
            type="button"
            onClick={() => setShowBulk(!showBulk)}
            disabled={(limit !== undefined && serials.length >= limit && !showBulk) || limit === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
              showBulk 
                ? "bg-violet-600 text-white shadow-sm" 
                : (limit !== undefined && serials.length >= limit) || limit === 0
                  ? "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-violet-300 hover:text-violet-600"
            }`}
          >
            <Copy size={10} /> Bulk Import
          </button>
        </div>
      </div>

      {showBulk ? (
        <div className="pf-section-enter bg-white border border-violet-200 rounded-xl p-3 shadow-inner mb-3">
          <LocalLabel text={`Paste multiple ${serialLabel.toLowerCase()}s`} hint={`Limit: ${limit ?? 'Unlimited'}`} />
          <textarea
            value={bulkInput}
            onChange={e => setBulkInput(e.target.value)}
            className="w-full p-3 text-xs border border-slate-200 rounded-lg bg-slate-50/30 font-mono min-h-[80px] focus:bg-white outline-none focus:border-violet-300 transition-all"
            placeholder="SN-001, SN-002, SN-003..."
            autoFocus
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {bulkPreviewCount > 0 ? `${bulkPreviewCount} unique ${serialLabel.toLowerCase()}s found` : "No new serials detected"}
            </span>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => { setShowBulk(false); setBulkInput(""); }}
                className="px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleBulkImport}
                disabled={bulkPreviewCount === 0}
                className="px-4 py-1.5 text-[10px] font-bold bg-violet-600 text-white rounded-lg shadow-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Import {bulkPreviewCount > 0 ? bulkPreviewCount : ""}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`flex flex-wrap gap-2 p-2.5 border rounded-xl transition-all duration-300 min-h-[48px] shadow-sm mobile-scroll custom-scrollbar ${
          limit !== undefined && serials.length >= limit 
            ? "bg-slate-50 border-slate-200 cursor-not-allowed" 
            : "bg-white border-slate-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100"
        }`}>
          {serials.map((s, i) => (
            <span key={i} className="px-2.5 py-1.5 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-lg border border-violet-100 flex items-center gap-1.5 animate-in zoom-in-95 duration-150 group">
              {s}
              <button 
                type="button" 
                onClick={() => handleRemove(s)} 
                className="text-violet-300 hover:text-violet-900 transition-colors p-0.5"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "," || e.key === "Enter") {
                e.preventDefault();
                handleAdd(inputValue);
              } else if (e.key === "Backspace" && !inputValue && serials.length > 0) {
                handleRemove(serials[serials.length - 1]);
              }
            }}
            disabled={limit !== undefined && serials.length >= limit}
            placeholder={
              limit === 0 
                ? "No quantity assigned"
                : serials.length === 0 
                  ? `Type ${serialLabel.toLowerCase()} and press Enter...` 
                  : (limit !== undefined && serials.length >= limit)
                    ? "✓ All Serials Registered" 
                    : "Add next..."
            }
            className="flex-1 min-w-[180px] outline-none text-[11px] text-slate-800 placeholder-slate-400 bg-transparent disabled:text-slate-400 font-medium"
          />
        </div>
      )}
      
      {limit !== undefined && limit > serials.length && !showBulk && (
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-[10px] text-amber-700 font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
          <AlertCircle size={12} className="text-amber-500" />
          <span>Requirement: Register {limit - serials.length} more {serialLabel.toLowerCase()}{limit - serials.length === 1 ? "" : "s"}</span>
        </div>
      )}

      {limit !== undefined && limit > 0 && serials.length === limit && !showBulk && (
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700 font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
          <Plus size={12} className="text-emerald-500 rotate-45" />
          <span>Perfect: Full quantity registered for this item.</span>
        </div>
      )}
    </div>
  );
};
