import React, {
  useState, useMemo, useEffect,
} from "react";
import {
  Package, DollarSign, BarChart2, Save, ChevronDown, Hash,
  Cpu, AlertCircle, RefreshCw,  ScanLine, Copy,
  Layers,  Zap,
  Bookmark,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { Switch } from "@/components/ui/switch";

/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   TYPES
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */

interface VariantType {
  id: string;
  name: string;          // e.g. "Color"
  values: string[];      // e.g. ["Black", "White", "Silver"]
}

interface VariantCombination {
  id: string;
  attributes: Record<string, string>;  // { Color: "Black", Storage: "128GB" }
  barcode: string;
  price: string;
  stock: string;
  active: boolean;
  serials: SerialEntry[];
}

interface SerialEntry {
  id: string;
  serial: string;       // IMEI / Serial Number
  purchaseDate: string;
  warrantyMonths: string;
  status: "available" | "sold" | "defective";
}

interface CategoryConfig {
  suggestedVariantTypes: string[];
  supportsSerials: boolean;
  serialLabel: string;
}

type FormData = {
  name: string;
  stocks: number;
  serial_number: string;
  barcode: string;
  brand: string;
  category: string;
  unit: string;
  description: string;
  is_active: boolean;
  buy_price: string;
  sell_price: string;
  mrp: string;
  gst: string;
  hsn: string;
  supplier: string;
  opening_stock: string;
  reorder_point: string;
  max_stock: string;
  location: string;
  has_variants: boolean;
  batch_tracking: boolean;
  serial_tracking: boolean;
};

/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   CONSTANTS
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  "Mobile Phones": {
    suggestedVariantTypes: ["Storage", "Color", "Model"],
    supportsSerials: true,
    serialLabel: "IMEI Number",
  },
  "Laptops": {
    suggestedVariantTypes: ["RAM", "Storage", "Color"],
    supportsSerials: true,
    serialLabel: "Serial Number",
  },
  "Clothing": {
    suggestedVariantTypes: ["Size", "Color"],
    supportsSerials: false,
    serialLabel: "Serial Number",
  },
  "Footwear": {
    suggestedVariantTypes: ["Size", "Color"],
    supportsSerials: false,
    serialLabel: "Serial Number",
  },
  "Electronics": {
    suggestedVariantTypes: ["Color", "Wattage", "Model"],
    supportsSerials: true,
    serialLabel: "Serial Number",
  },
  "Accessories": {
    suggestedVariantTypes: ["Color", "Size"],
    supportsSerials: false,
    serialLabel: "Serial Number",
  },
  "Tablets": {
    suggestedVariantTypes: ["Storage", "Connectivity", "Color"],
    supportsSerials: true,
    serialLabel: "IMEI / Serial",
  },
};

const PRESET_VALUES: Record<string, string[]> = {
  "Storage":      ["64GB", "128GB", "256GB", "512GB", "1TB"],
  "Color":        ["Black", "White", "Silver", "Gold", "Blue", "Red", "Green", "Pink"],
  "Size":         ["XS", "S", "M", "L", "XL", "XXL"],
  "RAM":          ["4GB", "8GB", "16GB", "32GB"],
  "Model":        ["Pro", "Pro Max", "Standard", "Plus", "Mini"],
  "Connectivity": ["Wi-Fi", "Wi-Fi + Cellular"],
  "Wattage":      ["500W", "750W", "1000W"],
};

const CATEGORIES = Object.keys(CATEGORY_CONFIGS);
const UNITS = ["Piece (pcs)", "Box", "Kilogram (kg)", "Gram (g)", "Litre (L)", "Metre (m)", "Set", "Pair"];
const GST_RATES = ["0%", "5%", "12%", "18%", "28%"];
// const SUPPLIERS = ["TechDistro Global", "ABC Electronics", "Prime Supplies", "Metro Wholesale"];
// const LOCATIONS = ["Shelf 1 - Main", "Warehouse A", "Warehouse B", "Store Room"];

let _uid = 0;
const uid = () => `id_${++_uid}_${Math.random().toString(36).slice(2, 6)}`;

/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   STYLES
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

  .pf-root { font-family: 'Instrument Sans', sans-serif; }
  .pf-mono { font-family: 'JetBrains Mono', monospace; }
  .pf-serif { font-family: 'Instrument Serif', serif; }

  /* Card hover */
  .pf-card { transition: box-shadow 0.2s ease; }
  .pf-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); }

  /* Input focus */
  .pf-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .pf-input { transition: border-color 0.15s, box-shadow 0.15s; }

  /* Tag chip */
  .pf-tag { animation: tagPop 0.15s cubic-bezier(0.34,1.4,0.64,1) forwards; }
  @keyframes tagPop { from { opacity:0; transform: scale(0.8); } to { opacity:1; transform: scale(1); } }

  /* Matrix row */
  .pf-matrix-row { transition: background 0.1s; }
  .pf-matrix-row:hover { background: #f8fafc; }

  /* Combination appear */
  .pf-combo-appear { animation: comboSlide 0.18s ease forwards; }
  @keyframes comboSlide { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }

  /* Serial modal */
  .pf-serial-backdrop { animation: bfIn 0.15s ease forwards; }
  @keyframes bfIn { from { opacity:0; } to { opacity:1; } }
  .pf-serial-modal { animation: smIn 0.2s cubic-bezier(0.34,1.1,0.64,1) forwards; }
  @keyframes smIn { from { opacity:0; transform: scale(0.95) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }

  /* Toggle */
  .pf-toggle { transition: background 0.2s; }
  .pf-toggle-knob { transition: transform 0.2s cubic-bezier(0.34,1.3,0.64,1); }

  /* Variant section */
  .pf-section-enter { animation: secIn 0.25s ease forwards; }
  @keyframes secIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }

  /* Select */
  select.pf-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  /* Sticky table */
  .pf-sticky-th { position: sticky; top: 0; z-index: 5; }

  /* Scrollbar */
  .pf-scroll::-webkit-scrollbar { height: 4px; width: 4px; }
  .pf-scroll::-webkit-scrollbar-track { background: transparent; }
  .pf-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

  /* Btn */
  .pf-btn-primary { transition: all 0.15s; }
  .pf-btn-primary:hover:not(:disabled) { filter: brightness(1.06); box-shadow: 0 4px 14px rgba(37,99,235,0.22); }
  .pf-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .pf-btn-ghost { transition: all 0.15s; }
  .pf-btn-ghost:hover { background: #f1f5f9; }

  /* Suggest pill */
  .pf-suggest { transition: all 0.12s; }
  .pf-suggest:hover { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }

  /* Status badge */
  .pf-status-active { background: #d1fae5; color: #065f46; }
  .pf-status-draft  { background: #f1f5f9; color: #475569; }

  /* Pulse for auto-generated indicator */
  .pf-pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity: 0.5; } }
`;

/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   SMALL REUSABLE UI
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */

interface LabelProps { text: string; required?: boolean; hint?: string; }
const Label: React.FC<LabelProps> = ({ text, required, hint }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
    {text}{required && <span className="text-red-400 ml-0.5">*</span>}
    {hint && <span className="ml-1.5 normal-case font-normal text-slate-400">({hint})</span>}
  </label>
);

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  hint?: string;
  leftEl?: React.ReactNode;
  error?: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, required, hint, leftEl, error, className = "", ...rest }) => (
  <div>
    {label && <Label text={label} required={required} hint={hint} />}
    <div className="relative">
      {leftEl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{leftEl}</span>}
      <input
        {...rest}
        className={`pf-input w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300 ${leftEl ? "pl-7" : ""} ${error ? "border-red-300 bg-red-50/30" : ""} ${className}`}
      />
    </div>
    {error && <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/>{error}</p>}
  </div>
);

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}
const SelectField: React.FC<SelectFieldProps> = ({ label, required, options, className = "", ...rest }) => (
  <div>
    {label && <Label text={label} required={required} />}
    <select
      {...rest}
      className={`pf-select pf-input w-full px-3 py-2.5 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 ${className}`}
    >
      <option value="">Select</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);


/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   SECTION HEADER
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */

/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   TAG / CHIP
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */
interface TagChipProps { label: string; onRemove: () => void; color?: string; }
const TagChip: React.FC<TagChipProps> = ({ label, onRemove, color = "bg-blue-50 text-blue-700 border-blue-100" }) => (
  <span className={`pf-tag inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${color}`}>
    {label}
    <button type="button" onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5">
      <X size={10} />
    </button>
  </span>
);

/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   VARIANT BUILDER
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */
interface VariantBuilderProps {
  variantTypes: VariantType[];
  onChange: (types: VariantType[]) => void;
  suggestedTypes: string[];
}

const VariantBuilder: React.FC<VariantBuilderProps> = ({ variantTypes, onChange, suggestedTypes }) => {
  const [newTypeName, setNewTypeName] = useState("");
  const [valueInputs, setValueInputs] = useState<Record<string, string>>({});
  const [showPresets, setShowPresets] = useState<Record<string, boolean>>({});

  const addType = (name: string) => {
    if (!name.trim()) return;
    if (variantTypes.find(t => t.name.toLowerCase() === name.toLowerCase())) return;
    onChange([...variantTypes, { id: uid(), name: name.trim(), values: [] }]);
    setNewTypeName("");
  };

  const removeType = (id: string) => onChange(variantTypes.filter(t => t.id !== id));

  const addValue = (typeId: string, val: string) => {
    if (!val.trim()) return;
    onChange(variantTypes.map(t => {
      if (t.id !== typeId) return t;
      if (t.values.includes(val.trim())) return t;
      return { ...t, values: [...t.values, val.trim()] };
    }));
    setValueInputs(p => ({ ...p, [typeId]: "" }));
  };

  const addPresetValue = (typeId: string, val: string) => {
    onChange(variantTypes.map(t => {
      if (t.id !== typeId) return t;
      if (t.values.includes(val)) return t;
      return { ...t, values: [...t.values, val] };
    }));
  };

  const removeValue = (typeId: string, val: string) => {
    onChange(variantTypes.map(t =>
      t.id === typeId ? { ...t, values: t.values.filter(v => v !== val) } : t
    ));
  };

  const unusedSuggestions = suggestedTypes.filter(
    s => !variantTypes.find(t => t.name.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Suggested types pills */}
      {unusedSuggestions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            <Zap size={9} className="inline mr-1 text-amber-400" />
            Suggested for this category
          </p>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.map(s => (
              <button key={s} type="button" onClick={() => addType(s)}
                className="pf-suggest px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-full text-slate-600 bg-white flex items-center gap-1.5">
                <Plus size={10} />{s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Existing variant types */}
      {variantTypes.map(vt => {
        const presets = PRESET_VALUES[vt.name] ?? [];
        const unusedPresets = presets.filter(p => !vt.values.includes(p));
        const inputVal = valueInputs[vt.id] ?? "";

        return (
          <div key={vt.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 pf-section-enter">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-400 rounded-full" />
                <span className="text-sm font-semibold text-slate-800">{vt.name}</span>
                <span className="text-[10px] text-slate-400 pf-mono">{vt.values.length} value{vt.values.length !== 1 ? "s" : ""}</span>
              </div>
              <button type="button" onClick={() => removeType(vt.id)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                <Trash2 size={13} />
              </button>
            </div>

            {/* Value chips */}
            {vt.values.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {vt.values.map(v => (
                  <TagChip key={v} label={v} onRemove={() => removeValue(vt.id, v)} />
                ))}
              </div>
            )}

            {/* Add value input */}
            <div className="flex gap-2">
              <input
                className="pf-input flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300"
                placeholder={`Add ${vt.name} value`}
                value={inputVal}
                onChange={e => setValueInputs(p => ({ ...p, [vt.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addValue(vt.id, inputVal); } }}
              />
              <button type="button" onClick={() => addValue(vt.id, inputVal)}
                className="px-3 py-2 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">
                Add
              </button>
              {presets.length > 0 && (
                <button type="button"
                  onClick={() => setShowPresets(p => ({ ...p, [vt.id]: !p[vt.id] }))}
                  className="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1">
                  <ChevronDown size={11} className={`transition-transform ${showPresets[vt.id] ? "rotate-180" : ""}`} />
                  Presets
                </button>
              )}
            </div>

            {/* Preset picker */}
            {showPresets[vt.id] && unusedPresets.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {unusedPresets.map(p => (
                  <button key={p} type="button" onClick={() => addPresetValue(vt.id, p)}
                    className="px-2.5 py-1 text-[11px] border border-dashed border-slate-300 rounded-full text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
                    +{p}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add new variant type */}
      <div className="flex gap-2">
        <input
          className="pf-input flex-1 px-3 py-2.5 text-sm border border-dashed border-slate-300 rounded-xl bg-white text-slate-800 placeholder-slate-400"
          placeholder="New variant type (e.g. Storage, Color)"
          value={newTypeName}
          onChange={e => setNewTypeName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addType(newTypeName); } }}
        />
        <button type="button" onClick={() => addType(newTypeName)}
          disabled={!newTypeName.trim()}
          className="pf-btn-primary px-4 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-xl disabled:opacity-40">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   SERIAL NUMBER MANAGER (MODAL)
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */
interface SerialManagerProps {
  combo: VariantCombination;
  serialLabel: string;
  onClose: () => void;
  onUpdate: (serials: SerialEntry[]) => void;
}

const SerialManager: React.FC<SerialManagerProps> = ({ combo, serialLabel, onClose, onUpdate }) => {
  const [serials, setSerials] = useState<SerialEntry[]>(combo.serials);
  const [bulkInput, setBulkInput] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [error, setError] = useState("");

  const addSerial = () => {
    const entry: SerialEntry = {
      id: uid(), serial: "", purchaseDate: "", warrantyMonths: "12", status: "available",
    };
    setSerials(p => [...p, entry]);
  };

  const updateSerial = (id: string, field: keyof SerialEntry, val: string) => {
    setSerials(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));
    setError("");
  };

  const removeSerial = (id: string) => setSerials(p => p.filter(s => s.id !== id));

  const importBulk = () => {
    const incoming = bulkInput
      .split(/[\n,;]/)
      .map(s => s.trim())
      .filter(Boolean);

    const existing = new Set(serials.map(s => s.serial));
    const duplicates = incoming.filter(s => existing.has(s));

    if (duplicates.length > 0) {
      setError(`Duplicate serials: ${duplicates.join(", ")}`);
      return;
    }

    const newEntries: SerialEntry[] = incoming.map(s => ({
      id: uid(), serial: s, purchaseDate: "", warrantyMonths: "12", status: "available",
    }));

    setSerials(p => [...p, ...newEntries]);
    setBulkInput("");
    setShowBulk(false);
    setError("");
  };

  const save = () => {
    const serials_ = serials.filter(s => s.serial.trim());
    const allSerials = serials_.map(s => s.serial.trim());
    const unique = new Set(allSerials);
    if (unique.size < allSerials.length) {
      setError("Duplicate serial numbers detected.");
      return;
    }
    onUpdate(serials_);
    onClose();
  };

  const statusColors: Record<SerialEntry["status"], string> = {
    available: "bg-emerald-50 text-emerald-700 border-emerald-100",
    sold:      "bg-slate-100 text-slate-600 border-slate-200",
    defective: "bg-red-50 text-red-600 border-red-100",
  };

  const comboLabel = Object.values(combo.attributes).join(" / ");

  return (
    <div className="pf-serial-backdrop fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div className="pf-serial-modal bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <ScanLine size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Manage {serialLabel}s</p>
              <p className="text-[11px] text-slate-400 pf-mono mt-0.5">{comboLabel}  · {combo.barcode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowBulk(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
              <Copy size={12} /> Bulk Import
            </button>
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Bulk import */}
        {showBulk && (
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 pf-section-enter">
            <Label text="Paste serial numbers (comma, semicolon, or newline separated)" />
            <textarea
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              rows={3}
              className="pf-input w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg resize-none bg-white pf-mono"
              placeholder="SN001, SN002, SN003&#10;or one per line"
            />
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={importBulk}
                className="pf-btn-primary px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg">
                Import
              </button>
              <button type="button" onClick={() => { setShowBulk(false); setBulkInput(""); }}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-100">
            <p className="text-[11px] text-red-600 flex items-center gap-1.5"><AlertCircle size={11}/>{error}</p>
          </div>
        )}

        {/* Serials list */}
        <div className="pf-scroll flex-1 overflow-y-auto">
          {serials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <Hash size={20} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">No serial numbers added yet</p>
              <p className="text-xs text-slate-400">Add individually or use bulk import</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid gap-3 px-5 py-2.5 border-b border-slate-100 bg-slate-50 pf-sticky-th"
                style={{ gridTemplateColumns: "1fr 130px 100px 110px 28px" }}>
                {[serialLabel, "Purchase Date", "Warranty", "Status"].map(h => (
                  <p key={h} className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</p>
                ))}
                <div />
              </div>
              {serials.map((s, idx) => (
                <div key={s.id}
                  className="pf-matrix-row grid gap-3 items-center px-5 py-3 border-b border-slate-50"
                  style={{ gridTemplateColumns: "1fr 130px 100px 110px 28px" }}>
                  <input
                    className="pf-input px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg pf-mono"
                    placeholder={`${serialLabel} ${idx + 1}`}
                    value={s.serial}
                    onChange={e => updateSerial(s.id, "serial", e.target.value)}
                  />
                  <input
                    type="date"
                    className="pf-input px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    value={s.purchaseDate}
                    onChange={e => updateSerial(s.id, "purchaseDate", e.target.value)}
                  />
                  <div className="flex items-center gap-1">
                    <input
                      className="pf-input w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                      placeholder="12"
                      value={s.warrantyMonths}
                      onChange={e => updateSerial(s.id, "warrantyMonths", e.target.value)}
                    />
                    <span className="text-[10px] text-slate-400 shrink-0">mo</span>
                  </div>
                  <select
                    value={s.status}
                    onChange={e => updateSerial(s.id, "status", e.target.value as SerialEntry["status"])}
                    className={`pf-select text-[10px] font-medium px-2 py-1.5 border rounded-lg ${statusColors[s.status]}`}
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="defective">Defective</option>
                  </select>
                  <button type="button" onClick={() => removeSerial(s.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <button type="button" onClick={addSerial}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium border border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
            <Plus size={13} /> Add {serialLabel}
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-400">{serials.filter(s => s.serial).length} units</span>
            <button type="button" onClick={save}
              className="pf-btn-primary px-5 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-xl">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   VARIANT MATRIX TABLE
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */
interface VariantMatrixTableProps {
  combinations: VariantCombination[];
  variantTypes: VariantType[];
  basePriceStr: string;
  supportsSerials: boolean;
  serialLabel: string;
  onChange: (combos: VariantCombination[]) => void;
}

const VariantMatrixTable: React.FC<VariantMatrixTableProps> = ({
  combinations, basePriceStr, supportsSerials, serialLabel, onChange,
}) => {
  const [serialsFor, setSerialsFor] = useState<VariantCombination | null>(null);
  // const [showAllbarcodes, setShowAllbarcodes] = useState(false);

  const update = (id: string, field: keyof VariantCombination, val: unknown) => {
    onChange(combinations.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const bulkToggleAll = (active: boolean) => {
    onChange(combinations.map(c => ({ ...c, active })));
  };

  const regenAllbarcodes = (basebarcode: string) => {
    if (!basebarcode) return;
    onChange(combinations.map((c, i) => ({
      ...c,
      barcode: `${basebarcode}-${Object.values(c.attributes).map(v => v.slice(0, 3).toUpperCase()).join("-")}-${String(i + 1).padStart(2, "0")}`,
    })));
  };

  const [barcodeBase, setbarcodeBase] = useState("");

  if (combinations.length === 0) return null;

  const attrKeys = Object.keys(combinations[0]?.attributes ?? {});

  return (
    <>
      {/* Controls bar */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 pf-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-slate-500">
              {combinations.length} combination{combinations.length !== 1 ? "s" : ""} generated
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <input
              className="pf-input px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg w-28 pf-mono"
              placeholder="barcode base"
              value={barcodeBase}
              onChange={e => setbarcodeBase(e.target.value)}
            />
            <button type="button" onClick={() => regenAllbarcodes(barcodeBase)}
              disabled={!barcodeBase}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-40">
              <RefreshCw size={11} /> Auto barcode
            </button>
          </div>
          <button type="button" onClick={() => bulkToggleAll(true)}
            className="px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors">
            All On
          </button>
          <button type="button" onClick={() => bulkToggleAll(false)}
            className="px-2.5 py-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
            All Off
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="pf-scroll overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="pf-sticky-th bg-slate-50 border-b border-slate-200">
                {attrKeys.map(k => (
                  <th key={k} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                    {k}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">barcode</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">Price ()</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">Stock</th>
                {supportsSerials && (
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{serialLabel}s</th>
                )}
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combinations.map((combo, idx) => (
                <tr key={combo.id} className={`pf-matrix-row pf-combo-appear ${!combo.active ? "opacity-50" : ""}`}
                  style={{ animationDelay: `${idx * 0.02}s` }}>
                  {attrKeys.map(k => (
                    <td key={k} className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {combo.attributes[k]}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <input
                      className="pf-input px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg w-28 pf-mono"
                      placeholder="barcode-001"
                      value={combo.barcode}
                      onChange={e => update(combo.id, "barcode", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative w-24">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></span>
                      <input
                        className="pf-input w-full pl-6 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                        placeholder={basePriceStr || "0"}
                        value={combo.price}
                        onChange={e => update(combo.id, "price", e.target.value)}
                        type="number"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="pf-input px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg w-20 text-center"
                      placeholder="0"
                      value={combo.stock}
                      onChange={e => update(combo.id, "stock", e.target.value)}
                      type="number"
                      min="0"
                    />
                  </td>
                  {supportsSerials && (
                    <td className="px-4 py-3">
                      <button type="button"
                        onClick={() => setSerialsFor(combo)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 border border-slate-200 rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <ScanLine size={11} />
                        {combo.serials.length > 0
                          ? <span className="pf-mono text-blue-600">{combo.serials.filter(s => s.status === "available").length} avail.</span>
                          : "Add"}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <button type="button"
                      onClick={() => update(combo.id, "active", !combo.active)}
                      className={`relative inline-flex h-4.5 w-8 h-[18px] w-[32px] items-center rounded-full pf-toggle ${combo.active ? "bg-blue-500" : "bg-slate-200"}`}>
                      <span className={`pf-toggle-knob inline-block h-3 w-3 rounded-full bg-white shadow-sm ${combo.active ? "translate-x-[16px]" : "translate-x-[2px]"}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Serial manager modal */}
      {serialsFor && (
        <SerialManager
          combo={serialsFor}
          serialLabel={serialLabel}
          onClose={() => setSerialsFor(null)}
          onUpdate={(serials) => {
            onChange(combinations.map(c => c.id === serialsFor.id ? { ...c, serials } : c));
            setSerialsFor(null);
          }}
        />
      )}
    </>
  );
};

/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   COMBINATION GENERATOR (useMemo hook logic)
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */
const generateCombinations = (
  variantTypes: VariantType[],
  existing: VariantCombination[],
): VariantCombination[] => {
  const validTypes = variantTypes.filter(t => t.values.length > 0);
  if (validTypes.length === 0) return [];

  // Cartesian product
  const product = (arrays: string[][]): string[][] =>
    arrays.reduce<string[][]>(
      (acc, cur) => acc.flatMap(a => cur.map(b => [...a, b])),
      [[]]
    );

  const valueSets = validTypes.map(t => t.values);
  const combos = product(valueSets);

  return combos.map(combo => {
    const attributes: Record<string, string> = {};
    validTypes.forEach((t, i) => { attributes[t.name] = combo[i]; });

    // Preserve existing combo data if attributes match
    const key = JSON.stringify(attributes);
    const existing_ = existing.find(
      e => JSON.stringify(e.attributes) === key
    );

    if (existing_) return existing_;

    const barcodeSuffix = combo.map(v => v.slice(0, 3).toUpperCase()).join("-");
    return {
      id: uid(),
      attributes,
      barcode: barcodeSuffix,
      price: "",
      stock: "",
      active: true,
      serials: [],
    };
  });
};

/*  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   MAIN PRODUCT FORM
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */
interface ProductFormProps {
  initialData?: Record<string, unknown>;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData: propInitialData = {}, isLoading: externalLoading = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, putData, getData, loading } = useApi();
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const isLoading = externalLoading || loading;
  // Core form
  const [form, setForm] = useState<FormData>({
    name: (propInitialData.name as string) || "",
    stocks: (propInitialData.stocks as number) || 0,
    serial_number: (propInitialData.serial_number as string) || "",
    barcode: (propInitialData.barcode as string) || "",
    brand: (propInitialData.brand as string) || "",
    category: (propInitialData.category as string) || "",
    unit: (propInitialData.unit as string) || "Piece (pcs)",
    description: (propInitialData.description as string) || "",
    is_active: (propInitialData.is_active as boolean) ?? true,
    buy_price: (propInitialData.cost_price as string) || "",
    sell_price: (propInitialData.selling_price as string) || "",
    mrp: (propInitialData.mrp as string) || "",
    gst: (propInitialData.gst as string) || "18%",
    hsn: (propInitialData.hsn as string) || "",
    supplier: (propInitialData.supplier as string) || "",
    opening_stock: (propInitialData.opening_stock as string) || "",
    reorder_point: (propInitialData.reorder_point as string) || "5",
    max_stock: (propInitialData.max_stock as string) || "",
    location: (propInitialData.location as string) || "",
    has_variants: false,
    batch_tracking: (propInitialData.batch_tracking as boolean) || false,
    serial_tracking: (propInitialData.serial_tracking as boolean) || false,
  });

  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);

  // Header Actions
  useEffect(() => {

    setActions(
        <div className="flex items-center gap-3 bg-white px-4 h-11 rounded-2xl border border-slate-200 shadow-sm scale-90 md:scale-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
          <Switch 
            checked={form.is_active} 
            onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
          />
        </div>
    );
    return () => setActions(null);
  }, [setActions, form.is_active]);

  const { setBottomActions } = useHeader();
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button 
            type="button"
            onClick={handleSaveDraft}
            className="px-4 h-8 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2 whitespace-nowrap overflow-hidden"
          >
            <Bookmark size={14} className="shrink-0" />
            <span className="truncate">Save Draft</span>
          </button>
        )}
        <GradientButton 
          icon={<Save size={16} />} 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="rounded-xl shadow-md text-xs px-8 h-8 flex items-center"
        >
          {isLoading ? "..." : (id ? "Save Changes" : "Create Product")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, isLoading, id, form, variantTypes, combinations]);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        const res = await getData(`${ENDPOINTS.INVENTORIES}/by/${id}/${SHOP_ID}`);
        if (res && res.data) {
          const prod = res.data;
          const datas = prod.datas || {};
          setForm({
            name: prod.name || datas.name || "",
            stocks: prod.stocks || datas.stocks || 0,
            serial_number: prod.serial_number || datas.serial_number || "",
            barcode: prod.barcode || datas.barcode || "",
            brand: prod.brand || datas.brand || "",
            category: prod.category || datas.category || "",
            unit: prod.unit || datas.unit || "Piece (pcs)",
            description: prod.description || datas.description || "",
            is_active: prod.is_active ?? datas.is_active ?? true,
            buy_price: String(prod.buy_price || datas.buy_price || ""),
            sell_price: String(prod.sell_price || datas.sell_price || ""),
            mrp: String(datas.mrp || ""),
            gst: String(datas.gst || "18%"),
            hsn: String(datas.hsn || ""),
            supplier: datas.supplier || "",
            opening_stock: String(datas.opening_stock || ""),
            reorder_point: String(datas.reorder_point || "5"),
            max_stock: String(datas.max_stock || ""),
            location: datas.location || "",
            has_variants: !!datas.has_variants,
            batch_tracking: !!datas.batch_tracking,
            serial_tracking: !!datas.serial_tracking,
          });
          if (datas.variantTypes) setVariantTypes(datas.variantTypes);
          if (datas.combinations) setCombinations(datas.combinations);
        }
      };
      fetchProduct();
    } else {
      // Check for draft
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("product_drafts") || "[]");
        const draft = drafts.find((d: any) => d.id === draftId);
        if (draft) {
          setForm(prev => ({ ...prev, ...draft.data.form }));
          if (draft.data.variantTypes) setVariantTypes(draft.data.variantTypes);
          if (draft.data.combinations) setCombinations(draft.data.combinations);
        }
      }
    }
  }, [id, getData, searchParams]);


  const categoryConfig = CATEGORY_CONFIGS[form.category] ?? {
    suggestedVariantTypes: [],
    supportsSerials: false,
    serialLabel: "Serial Number",
  };

  // When category changes, optionally pre-suggest types
  const handleCategoryChange = (val: string) => {
    setForm(p => ({ ...p, category: val }));
    // Reset variant types when category changes
    setVariantTypes([]);
    setCombinations([]);
  };

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("product_drafts") || "[]");
    const draftId = searchParams.get("draftId") || Date.now().toString();
    
    const newDraft = {
      id: draftId,
      data: { form, variantTypes, combinations },
      timestamp: new Date().toISOString(),
      displayName: form.name || "Untitled Product Draft"
    };

    const existingIndex = drafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.push(newDraft);
    }

    localStorage.setItem("product_drafts", JSON.stringify(drafts));
    showToast("Progress saved as draft", "info");
  };

  // Regenerate combinations whenever variant types change
  useEffect(() => {
    if (!form.has_variants) return;
    const newCombos = generateCombinations(variantTypes, combinations);
    setCombinations(newCombos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantTypes, form.has_variants]);

  const marginStats = useMemo(() => {
    const cost    = Number(form.buy_price) || 0;
    const selling = Number(form.sell_price) || 0;
    const profit  = selling - cost;
    const pct     = selling > 0 ? ((profit / selling) * 100).toFixed(1) : "0.0";
    return { profit, pct };
  }, [form.buy_price, form.sell_price]);

  const totalStock = useMemo(() => {
    if (!form.has_variants) return Number(form.opening_stock) || 0;
    return combinations.reduce((s, c) => s + (Number(c.stock) || 0), 0);
  }, [form.has_variants, form.opening_stock, combinations]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      datas: { 
        ...form, 
        variantTypes, 
        combinations,
        shop_id: SHOP_ID,
        id,
        stocks:form.opening_stock,
        type: id ? "DIRECT" : "DIRECT"
      },
    };
    
    let res;
    if (id) {
      res = await putData(`${ENDPOINTS.INVENTORIES}`, payload);
    } else {
      res = await postData(ENDPOINTS.INVENTORIES, payload);
    }

    if (res) {
      showToast(id ? "Product updated successfully" : "Product created successfully", "success");
      
      // Clear draft if it exists
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("product_drafts") || "[]");
        const filtered = drafts.filter((d: any) => d.id !== draftId);
        localStorage.setItem("product_drafts", JSON.stringify(filtered));
      }
      
      setTimeout(() => {
        navigate("/product/all");
      }, 1000);
    } else {
      showToast("Failed to save product", "error");
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="pf-root min-h-screen bg-slate-50/50 font-[Inter,sans-serif]">
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-5">

          {/* ROW 1: Product Identity (4 cols) + Classification & Summary (2 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-5 items-start">

            {/* BOX 1: Identity */}
            <div className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Package size={16} />
                </div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Product Identity</h2>
              </div>
              <div className="p-6 space-y-4">
                <InputField label="Product Name" name="name" required
                  value={form.name} onChange={handleChange}
                  placeholder="e.g. Apple iPhone 15 Pro Max"
                />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InputField label="Barcode / SKU" name="barcode" required
                    value={form.barcode} onChange={handleChange}
                    placeholder="SKU..."
                  />
                  <InputField label="Brand" name="brand"
                    value={form.brand} onChange={handleChange}
                    placeholder="e.g. Apple"
                  />
                  <SelectField label="Category" required
                    value={form.category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                  />
                  <SelectField label="Unit" name="unit" required
                    value={form.unit} onChange={handleChange}
                    options={UNITS.map(u => ({ value: u, label: u }))}
                  />
                </div>

                <div>
                  <Label text="Description" hint="optional" />
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={1}
                    className="pf-input w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 resize-none placeholder-slate-300 min-h-[45px]"
                    placeholder="Key features, materials, dimensions"
                  />
                </div>

                <div className="pt-2 border-t border-slate-50 grid grid-cols-2 gap-4 mt-2">
                  <SelectField label="GST Rate" name="gst" required
                    value={form.gst} onChange={handleChange}
                    options={GST_RATES.map(r => ({ value: r, label: r }))}
                  />
                  <InputField label="HSN Code" name="hsn"
                    value={form.hsn} onChange={handleChange}
                    placeholder="8517"
                  />
                </div>
              </div>
            </div>

            {/* BOX 2: Classification */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Hash size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Classification</h2>
                </div>
                <div className="p-6 space-y-4">
                  <InputField label="Supplier" name="supplier"
                    value={form.supplier} onChange={handleChange}
                    placeholder="e.g. TechDistro"
                  />
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Product</span>
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm(p => ({ ...p, is_active: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Pricing (3 cols) + Tax & Stock (3 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">

            {/* BOX 3: Pricing */}
            <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <DollarSign size={16} />
                </div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Pricing & Margin</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <InputField label="Cost Price" name="buy_price" required
                    type="number" leftEl=""
                    value={form.buy_price} onChange={handleChange}
                    placeholder="0.00"
                  />
                  <InputField label="Selling Price" name="sell_price" required
                    type="number" leftEl=""
                    value={form.sell_price} onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Est. Margin</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{marginStats.profit.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      marginStats.profit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}>{marginStats.pct}%</span>
                  </div>
                </div>
                <InputField label="MRP" name="mrp" type="number" leftEl=""
                  value={form.mrp} onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* BOX 4: Live Summary + Stock */}
            <div className="lg:col-span-3 space-y-5">
              {/* Live Summary card */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Live Summary</h2>
                </div>
                <div className="divide-y divide-slate-50 px-6">
                  {[
                    { label: "SKU",      value: form.barcode || "-" },
                    { label: "Cost",     value: form.buy_price ? `${Number(form.buy_price).toLocaleString()}` : "-" },
                    { label: "Price",    value: form.sell_price ? `${Number(form.sell_price).toLocaleString()}` : "-" },
                    { label: "Margin",   value: `${marginStats.pct}%`, color: marginStats.profit >= 0 ? "text-emerald-600" : "text-rose-600" },
                    { label: "Variants", value: form.has_variants ? `${combinations.length} combos` : "None" },
                    { label: "Stock",    value: totalStock > 0 ? `${totalStock}` : "-" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2.5">
                      <span className="text-[11px] text-slate-400 font-medium">{row.label}</span>
                      <span className={`text-[11px] font-bold font-mono ${(row as any).color ?? "text-slate-800"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all pf-section-enter">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <BarChart2 size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Stock & Inventory</h2>
                </div>
                <div className="p-6 grid grid-cols-3 gap-5">
                   <InputField label="Opening Stock" name="opening_stock"
                    type="number" value={form.opening_stock} onChange={handleChange}
                    placeholder="0"
                    disabled={!!id}
                  />
                  <InputField label="Reorder Point" name="reorder_point" required
                    type="number" value={form.reorder_point} onChange={handleChange}
                    placeholder="5"
                  />
                  <InputField label="Max Stock" name="max_stock"
                    type="number" value={form.max_stock} onChange={handleChange}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white shadow-sm transition-all duration-300">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Enable Batch Tracking</h3>
                    {!id && <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[8px] font-black uppercase">Purchase Entry</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    If you want batch tracking options during purchase, please enable it. Required for giving manufacture and expiry dates on purchase entries (e.g., medicines, foods).
                  </p>
                </div>
                <Switch 
                  checked={form.batch_tracking}
                  onCheckedChange={(val) => setForm(p => ({ ...p, batch_tracking: val }))}
                />
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white shadow-sm transition-all duration-300">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Serial Number Tracking</h3>
                    {!id && <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[8px] font-black uppercase">Unique ID</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    Track unique identification numbers for each individual unit. Ideal for electronics like mobile phones, laptops, and appliances.
                  </p>
                </div>
                <Switch 
                  checked={form.serial_tracking}
                  onCheckedChange={(val) => setForm(p => ({ ...p, serial_tracking: val }))}
                />
              </div>
            </div>

          {/* ROW 3: Variants (full width) */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="px-6 py-4 bg-gradient-to-r from-violet-50/50 to-transparent border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <Layers size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Product Variants</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Colors, sizes, storage and other variations</p>
                </div>
              </div>
              <Switch
                checked={form.has_variants}
                onCheckedChange={(checked) => {
                  setForm(p => ({ ...p, has_variants: checked }));
                  if (!checked) setCombinations([]);
                }}
              />
            </div>

            {form.has_variants ? (
              <div className="p-6 space-y-5 pf-section-enter">
                <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/40">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4">Define Variant Types</p>
                  <VariantBuilder
                    variantTypes={variantTypes}
                    onChange={setVariantTypes}
                    suggestedTypes={categoryConfig.suggestedVariantTypes}
                  />
                </div>
                {combinations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu size={13} className="text-slate-400" />
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                        Variant Matrix ({combinations.length} combinations)
                      </p>
                    </div>
                    <VariantMatrixTable
                      combinations={combinations}
                      variantTypes={variantTypes}
                      basePriceStr={form.sell_price}
                      supportsSerials={categoryConfig.supportsSerials}
                      serialLabel={categoryConfig.serialLabel}
                      onChange={setCombinations}
                    />
                  </div>
                )}
                {variantTypes.length === 0 && (
                  <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Plus size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Add your first variant type above to begin</p>
                  </div>
                )}
                {variantTypes.length > 0 && combinations.length === 0 && (
                  <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Layers size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Add values to your variant types to generate combinations</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 py-5 text-slate-400 text-sm flex items-center gap-3">
                <Zap size={16} className="text-violet-300" />
                Enable variants to manage multiple SKUs per product (e.g. iPhone 15 128GB / Black)
              </div>
            )}
          </div>

        </form>
      </div>
    </>
  );
};

export default ProductForm;
