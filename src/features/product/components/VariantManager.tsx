import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  X, 
  ChevronDown, 
  RefreshCw, 
  ScanLine, 
  Plus as PlusIcon,
  Zap,
  Calendar
} from "lucide-react";
import { InlineSerialManager } from "@/components/common/InlineSerialManager";

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
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            <Zap size={9} className="inline mr-1 text-amber-400" />
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
          <div key={vt.id} className="border border-slate-200 rounded-[1.5rem] p-5 bg-slate-50/50 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{vt.name}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                  {vt.values.length} value{vt.values.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button type="button" onClick={() => removeType(vt.id)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
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
                className="flex-1 h-10 px-4 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder={`Add ${vt.name} value`}
                value={inputVal}
                onChange={e => setValueInputs(p => ({ ...p, [vt.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addValue(vt.id, inputVal); } }}
              />
              <button type="button" onClick={() => addValue(vt.id, inputVal)}
                className="px-4 h-10 text-xs font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors">
                Add
              </button>
              {presets.length > 0 && (
                <button type="button"
                  onClick={() => setShowPresets(p => ({ ...p, [vt.id]: !p[vt.id] }))}
                  className="px-4 h-10 text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2">
                  <ChevronDown size={14} className={`transition-transform duration-300 ${showPresets[vt.id] ? "rotate-180" : ""}`} />
                  Presets
                </button>
              )}
            </div>

            {showPresets[vt.id] && unusedPresets.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100 flex flex-wrap gap-2 animate-in fade-in duration-200">
                {unusedPresets.map(p => (
                  <button key={p} type="button" onClick={() => addPresetValue(vt.id, p)}
                    className="px-3 py-1.5 text-[10px] font-bold border border-dashed border-slate-200 rounded-full text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all uppercase tracking-wider">
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
  combinations, supportsSerials, supportsBatch, serialLabel, onChange,
}) => {
  const [expandedSerialId, setExpandedSerialId] = useState<string | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [barcodeBase, setbarcodeBase] = useState("");

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

  if (combinations.length === 0) return null;

  const attrKeys = Object.keys(combinations[0]?.attributes ?? {});

  return (
    <div className="space-y-4">
      {/* Matrix Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">
            {combinations.length} combination{combinations.length !== 1 ? "s" : ""} generated
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              className="h-9 px-3 text-xs border border-slate-200 rounded-xl w-32 font-mono focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="barcode base"
              value={barcodeBase}
              onChange={e => setbarcodeBase(e.target.value)}
            />
            <button type="button" onClick={() => regenAllbarcodes(barcodeBase)}
              disabled={!barcodeBase}
              className="flex items-center gap-2 h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-40">
              <RefreshCw size={12} /> Auto barcode
            </button>
          </div>
          <div className="h-6 w-[1px] bg-slate-200 mx-1" />
          <button type="button" onClick={() => bulkToggleAll(true)}
            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-white border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all">
            All On
          </button>
          <button type="button" onClick={() => bulkToggleAll(false)}
            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            All Off
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {attrKeys.map(k => (
                  <th key={k} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                    {k}
                  </th>
                ))}
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">barcode</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Buy Price</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Sell Price</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">MRP</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Stock</th>
                {supportsSerials && (
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{serialLabel}s</th>
                )}
                {supportsBatch && (
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Batch</th>
                )}
                <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {combinations.map((combo, idx) => {
                const isExpanded = expandedSerialId === combo.id;
                return (
                  <React.Fragment key={combo.id}>
                    <tr className={`hover:bg-slate-50/50 transition-all duration-150 ${!combo.active ? "opacity-40 grayscale-[0.5]" : ""} ${isExpanded ? "bg-blue-50/30" : ""}`}>
                      {attrKeys.map(k => (
                        <td key={k} className="px-5 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight bg-slate-100 text-slate-600">
                            {combo.attributes[k]}
                          </span>
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <input
                          className="h-9 px-3 text-xs border border-slate-200 rounded-xl w-32 font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="SKU-001"
                          value={combo.barcode}
                          onChange={e => update(combo.id, "barcode", e.target.value)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-9 px-3 text-xs border border-slate-200 rounded-xl w-24 focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="0.00"
                          value={combo.buy_price}
                          onChange={e => update(combo.id, "buy_price", e.target.value)}
                          type="number"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-9 px-3 text-xs border border-slate-200 rounded-xl w-24 focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="0.00"
                          value={combo.price}
                          onChange={e => update(combo.id, "price", e.target.value)}
                          type="number"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-9 px-3 text-xs border border-slate-200 rounded-xl w-24 focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="0.00"
                          value={combo.mrp}
                          onChange={e => update(combo.id, "mrp", e.target.value)}
                          type="number"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-9 px-3 text-xs border border-slate-200 rounded-xl w-20 text-center font-black focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="0"
                          value={combo.stock}
                          onChange={e => update(combo.id, "stock", e.target.value)}
                          type="number"
                          min="0"
                        />
                      </td>
                      {supportsSerials && (
                        <td className="px-5 py-4">
                          <button type="button"
                            onClick={() => setExpandedSerialId(isExpanded ? null : combo.id)}
                            className={`flex items-center gap-2 h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm ${isExpanded
                                ? "bg-violet-600 text-white shadow-violet-100"
                                : "text-violet-600 bg-violet-50 border border-violet-100 hover:bg-violet-100"
                              }`}>
                            <ScanLine size={14} />
                            {combo.serials.length > 0
                              ? <span>{combo.serials.length} Added</span>
                              : "Add"}
                          </button>
                        </td>
                      )}
                      {supportsBatch && (
                        <td className="px-5 py-4">
                          <button type="button"
                            onClick={() => setExpandedBatchId(expandedBatchId === combo.id ? null : combo.id)}
                            className={`flex items-center gap-2 h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm ${expandedBatchId === combo.id
                                ? "bg-amber-600 text-white shadow-amber-100"
                                : "text-amber-600 bg-amber-50 border border-amber-100 hover:bg-amber-100"
                              }`}>
                            <Calendar size={14} />
                            {combo.batch?.name ? "Set" : "Add"}
                          </button>
                        </td>
                      )}
                      <td className="px-5 py-4 text-center">
                        <button type="button"
                          onClick={() => update(combo.id, "active", !combo.active)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${combo.active ? "bg-blue-600" : "bg-slate-200"}`}>
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${combo.active ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </td>
                    </tr>
                    {/* CONSOLIDATED EXPANDED MANAGEMENT PANEL */}
                    {(isExpanded || (expandedBatchId === combo.id)) && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={attrKeys.length + 8} className="px-5 py-8 border-y border-slate-100">
                          <div className={`max-w-6xl mx-auto grid gap-6 items-start ${
                            (isExpanded && expandedBatchId === combo.id) ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                          }`}>
                            
                            {/* SERIALS MANAGEMENT PANEL */}
                            {isExpanded && supportsSerials && (
                              <div className="animate-in fade-in slide-in-from-left-4 duration-500 h-full">
                                <div className="bg-white p-1 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 h-full">
                                  <div className="p-1">
                                    <InlineSerialManager
                                      serials={combo.serials.map(s => s.serial)}
                                      serialLabel={serialLabel}
                                      limit={Number(combo.stock) || 0}
                                      onUpdate={(newSerials) => {
                                        const updatedEntries: SerialEntry[] = newSerials.map(s => {
                                          const existing = combo.serials.find(e => e.serial === s);
                                          return existing || { id: uid(), serial: s, purchaseDate: "", warrantyMonths: "12", status: "available" };
                                        });
                                        update(combo.id, "serials", updatedEntries);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* BATCH MANAGEMENT PANEL */}
                            {expandedBatchId === combo.id && supportsBatch && (
                              <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full">
                                <div className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 h-full">
                                  <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-5">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                                      <Calendar size={18} />
                                    </div>
                                    <div>
                                      <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">Batch Details</h3>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                        {Object.values(combo.attributes).join(" · ")}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-6">
                                    <div className="space-y-2">
                                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Batch Name / ID</label>
                                      <input
                                        className="w-full h-12 px-5 text-sm border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-50 focus:border-amber-200 outline-none transition-all placeholder-slate-300 font-medium"
                                        placeholder="e.g. B-BATCH-001"
                                        value={combo.batch?.name || ""}
                                        onChange={e => update(combo.id, "batch", { ...(combo.batch || {}), name: e.target.value })}
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                      <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mfg Date</label>
                                        <input
                                          type="date"
                                          className="w-full h-12 px-5 text-sm border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-50 focus:border-amber-200 outline-none transition-all font-medium"
                                          value={combo.batch?.manufacturing_date || ""}
                                          onChange={e => update(combo.id, "batch", { ...(combo.batch || {}), manufacturing_date: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Expiry Date</label>
                                        <input
                                          type="date"
                                          className="w-full h-12 px-5 text-sm border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-50 focus:border-amber-200 outline-none transition-all font-medium"
                                          value={combo.batch?.expiry_date || ""}
                                          onChange={e => update(combo.id, "batch", { ...(combo.batch || {}), expiry_date: e.target.value })}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
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
  defaults: { buy_price: string; sell_price: string; mrp: string }
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
      price: defaults.sell_price,
      buy_price: defaults.buy_price,
      mrp: defaults.mrp,
      stock: "0",
      active: true,
      serials: [],
    };
  });
};
