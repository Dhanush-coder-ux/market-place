import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  X, 
  ChevronDown, 
  RefreshCw, 
  Plus as PlusIcon,
  Zap
} from "lucide-react";


// --- Types ---

export interface VariantType {
  id: string;
  name: string;
  values: string[];
}

export interface SerialEntry {
  id: string;
  serial: string;
  purchaseDate: string;
  warrantyMonths: string;
  status: "available" | "sold" | "defective";
}

export interface VariantCombination {
  id: string;
  attributes: Record<string, string>;
  barcode: string;
  sku: string;
  price: string;
  buy_price: string;
  mrp: string;
  stock: string;
  active: boolean;
  serials: SerialEntry[];
  batch?: {
    name: string;
    expiry_date: string;
    manufacturing_date: string;
  };
  reorder_point: string;
}

// --- Constants ---

export const PRESET_VALUES: Record<string, string[]> = {
  "Storage": ["64GB", "128GB", "256GB", "512GB", "1TB"],
  "Color": ["Black", "White", "Silver", "Gold", "Blue", "Red", "Green", "Pink"],
  "Size": ["XS", "S", "M", "L", "XL", "XXL"],
  "RAM": ["4GB", "8GB", "16GB", "32GB"],
  "Model": ["Pro", "Pro Max", "Standard", "Plus", "Mini"],
  "Connectivity": ["Wi-Fi", "Wi-Fi + Cellular"],
  "Wattage": ["500W", "750W", "1000W"],
};

const uid = () => `id_${Math.random().toString(36).slice(2, 11)}`;

// --- Components ---

interface TagChipProps { label: string; onRemove: () => void; color?: string; }
const TagChip: React.FC<TagChipProps> = ({ label, onRemove, color = "bg-blue-50 text-blue-700 border-blue-100" }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border animate-in zoom-in-95 duration-150 ${color}`}>
    {label}
    <button type="button" onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5">
      <X size={10} />
    </button>
  </span>
);

interface VariantBuilderProps {
  variantTypes: VariantType[];
  onChange: (types: VariantType[]) => void;
  suggestedTypes: string[];
}

export const VariantBuilder: React.FC<VariantBuilderProps> = ({ variantTypes, onChange, suggestedTypes }) => {
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
      {unusedSuggestions.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">
            <Zap size={10} className="inline mr-1 text-amber-500" />
            Suggested for this category
          </p>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.map(s => (
              <button key={s} type="button" onClick={() => addType(s)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-full text-slate-600 bg-white flex items-center gap-1.5 hover:bg-blue-50 hover:border-blue-200 transition-all">
                <Plus size={10} />{s}
              </button>
            ))}
          </div>
        </div>
      )}

      {variantTypes.map(vt => {
        const presets = PRESET_VALUES[vt.name] ?? [];
        const unusedPresets = presets.filter(p => !vt.values.includes(p));
        const inputVal = valueInputs[vt.id] ?? "";

        return (
          <div key={vt.id} className="border border-slate-200 rounded-lg p-5 bg-slate-50/50 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                <span className="text-sm font-black text-slate-800 tracking-tight uppercase">{vt.name}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                  {vt.values.length} value{vt.values.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button type="button" onClick={() => removeType(vt.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                <Trash2 size={14} />
              </button>
            </div>

            {vt.values.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {vt.values.map(v => (
                  <TagChip key={v} label={v} onRemove={() => removeValue(vt.id, v)} />
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                className="flex-1 h-10 px-4 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder={`Add ${vt.name} value`}
                value={inputVal}
                onChange={e => setValueInputs(p => ({ ...p, [vt.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addValue(vt.id, inputVal); } }}
              />
              <button type="button" onClick={() => addValue(vt.id, inputVal)}
                className="px-5 h-10 text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                Add
              </button>
              {presets.length > 0 && (
                  <button type="button"
                  onClick={() => setShowPresets(p => ({ ...p, [vt.id]: !p[vt.id] }))}
                  className="px-4 h-10 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
                  <ChevronDown size={14} className={`transition-transform duration-300 ${showPresets[vt.id] ? "rotate-180" : ""}`} />
                  Presets
                </button>
              )}
            </div>

            {showPresets[vt.id] && unusedPresets.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-slate-100 flex flex-wrap gap-2 animate-in fade-in duration-200">
                {unusedPresets.map(p => (
                  <button key={p} type="button" onClick={() => addPresetValue(vt.id, p)}
                    className="px-3 py-1.5 text-[10px] font-black border border-dashed border-slate-200 rounded-full text-slate-500 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all uppercase">
                    +{p}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex gap-2">
        <input
          className="flex-1 h-12 px-5 text-sm border border-dashed border-slate-300 rounded-[1.25rem] bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          placeholder="New variant type (e.g. Color, Storage, RAM)"
          value={newTypeName}
          onChange={e => setNewTypeName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addType(newTypeName); } }}
        />
        <button type="button" onClick={() => addType(newTypeName)}
          disabled={!newTypeName.trim()}
          className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-[1.25rem] disabled:opacity-40 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
          <PlusIcon size={20} />
        </button>
      </div>
    </div>
  );
};

interface VariantMatrixTableProps {
  combinations: VariantCombination[];
  variantTypes: VariantType[];
  supportsSerials: boolean;
  supportsBatch: boolean;
  serialLabel: string;
  onChange: (combos: VariantCombination[]) => void;
}

export const VariantMatrixTable: React.FC<VariantMatrixTableProps> = ({
  combinations, onChange, supportsSerials, supportsBatch, serialLabel
}) => {

  const [barcodeBase, setbarcodeBase] = useState("");

  const update = (id: string, field: keyof VariantCombination, val: unknown) => {
    onChange(combinations.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const activeCount = combinations.filter(c => c.active).length;

  const bulkToggleAll = (active: boolean) => {
    if (!active && combinations.length <= 1) return; // Can't turn off all if only 1
    onChange(combinations.map(c => ({ ...c, active })));
  };

  const regenAllbarcodes = (basebarcode: string) => {
    if (!basebarcode) return;
    onChange(combinations.map((c, i) => ({
      ...c,
      barcode: `${basebarcode}-${Object.values(c.attributes).map(v => v.slice(0, 3).toUpperCase()).join("-")}-${String(i + 1).padStart(2, "0")}`,
    })));
  };

  if (combinations.length === 0) return null;

  const attrKeys = Object.keys(combinations[0]?.attributes ?? {});

  return (
    <div className="space-y-4">
      {/* Matrix Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-50/50 p-4 rounded-lg border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
            {combinations.length} combination{combinations.length !== 1 ? "s" : ""} generated
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              className="h-9 px-3 text-xs border border-slate-200 rounded-lg w-32 font-mono focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="barcode base"
              value={barcodeBase}
              onChange={e => setbarcodeBase(e.target.value)}
            />
              <button type="button" onClick={() => regenAllbarcodes(barcodeBase)}
              disabled={!barcodeBase}
              className="flex items-center gap-2 h-9 px-4 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-40">
              <RefreshCw size={12} /> Auto Generate
            </button>
          </div>
          <div className="h-6 w-[1px] bg-slate-200 mx-1" />
          <button type="button" onClick={() => bulkToggleAll(true)}
            className="h-9 px-4 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all">
            All On
          </button>
          <button type="button" onClick={() => bulkToggleAll(false)}
            disabled={combinations.length <= 1}
            className="h-9 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            All Off
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {attrKeys.map(k => (
                  <th key={k} className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">
                    {k}
                  </th>
                ))}
                <th className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">SKU</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Barcode</th>
                <th className="px-5 py-4 text-center text-[10px] font-black uppercase text-slate-400">Buy Price</th>
                <th className="px-5 py-4 text-center text-[10px] font-black uppercase text-slate-400">Sell Price</th>
                <th className="px-5 py-4 text-center text-[10px] font-black uppercase text-slate-400">Reorder Pt</th>
                <th className="px-5 py-4 text-center text-[10px] font-black uppercase text-slate-400">Tracking</th>
                <th className="px-5 py-4 text-center text-[10px] font-black uppercase text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {combinations.map((combo) => {
                return (
                  <React.Fragment key={combo.id}>
                    <tr className={`hover:bg-slate-50/50 transition-all duration-150 ${!combo.active ? "opacity-40 grayscale-[0.5]" : ""}`}>
                      {attrKeys.map(k => (
                        <td key={k} className="px-5 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-black  tracking-tight bg-slate-100 text-slate-600">
                            {combo.attributes[k]}
                          </span>
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <input
                          className="h-9 px-3 text-xs border border-slate-200 rounded-lg w-32 font-mono focus:ring-2 focus:ring-blue-100 outline-none mb-1"
                          placeholder="SKU-001"
                          value={combo.sku || ""}
                          onChange={e => update(combo.id, "sku", e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-9 px-3 text-xs border border-slate-200 rounded-lg w-32 font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="SKU-001"
                          value={combo.barcode}
                          onChange={e => update(combo.id, "barcode", e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-9 px-3 text-xs border border-slate-200 rounded-lg w-20 text-center font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="0.00"
                          type="number"
                          min="0"
                          step="0.01"
                          value={combo.buy_price}
                          onChange={e => update(combo.id, "buy_price", e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-9 px-3 text-xs border border-slate-200 rounded-lg w-20 text-center font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="0.00"
                          type="number"
                          min="0"
                          step="0.01"
                          value={combo.price}
                          onChange={e => update(combo.id, "price", e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-9 px-3 text-xs border border-slate-200 rounded-lg w-20 text-center font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="5"
                          type="number"
                          value={combo.reorder_point}
                          onChange={e => update(combo.id, "reorder_point", e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {supportsSerials && <span className="px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 text-[9px] font-bold border border-violet-100" title={serialLabel}>Serial</span>}
                          {supportsBatch && <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold border border-blue-100">Batch</span>}
                          {!supportsSerials && !supportsBatch && <span className="text-[10px] text-slate-300 font-medium">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button type="button"
                          onClick={() => {
                            // Prevent turning off the last active variant
                            if (combo.active && activeCount <= 1) return;
                            update(combo.id, "active", !combo.active);
                          }}
                          disabled={combo.active && activeCount <= 1}
                          className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${combo.active ? "bg-blue-600" : "bg-slate-200"} ${combo.active && activeCount <= 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${combo.active ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const generateCombinations = (
  variantTypes: VariantType[],
  existing: VariantCombination[],
  defaults: { buy_price: string; sell_price: string; mrp: string; reorder_point: string }
): VariantCombination[] => {
  const validTypes = variantTypes.filter(t => t.values.length > 0);
  if (validTypes.length === 0) return [];

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
      sku: "",
      price: defaults.sell_price,
      buy_price: defaults.buy_price,
      mrp: defaults.mrp,
      reorder_point: defaults.reorder_point,
      stock: "0",
      active: true,
      serials: [],
    };
  });
};

