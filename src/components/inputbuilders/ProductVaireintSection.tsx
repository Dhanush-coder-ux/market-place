/**
 * ProductVariantsSection.tsx
 *
 * Self-contained variant builder that replaces the generic LIST-DICT renderer
 * for the "Product Variants" category.
 *
 * Wire it into AutoFormRenderer via the `customSections` prop:
 *
 *   <AutoFormRenderer
 *     fields={fields}
 *     values={values}
 *     onChange={handleChange}
 *     customSections={{
 *       "Product Variants": (
 *         <ProductVariantsSection
 *           hasVariants={values.hasVariants}
 *           onHasVariantsChange={(v) => handleChange("hasVariants", v)}
 *           variantTypes={variantTypes}
 *           onVariantTypesChange={setVariantTypes}
 *           combinations={combinations}
 *           onCombinationsChange={setCombinations}
 *           category={values.category}
 *           basePriceStr={values.sellingPrice}
 *         />
 *       ),
 *     }}
 *   />
 */

import React, { useState, useEffect } from "react";
import {
  Plus, Trash2, X, ChevronDown, ScanLine, Copy,
  Hash, AlertCircle, RefreshCw, Cpu, Layers, Zap,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */

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
  sku: string;
  price: string;
  stock: string;
  active: boolean;
  serials: SerialEntry[];
}

export interface CategoryConfig {
  suggestedVariantTypes: string[];
  supportsSerials: boolean;
  serialLabel: string;
}

/* ─── Constants ─────────────────────────────────────────── */

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  "Mobile Phones": { suggestedVariantTypes: ["Storage", "Color", "Model"], supportsSerials: true,  serialLabel: "IMEI Number" },
  "Laptops":       { suggestedVariantTypes: ["RAM", "Storage", "Color"],   supportsSerials: true,  serialLabel: "Serial Number" },
  "Clothing":      { suggestedVariantTypes: ["Size", "Color"],             supportsSerials: false, serialLabel: "Serial Number" },
  "Footwear":      { suggestedVariantTypes: ["Size", "Color"],             supportsSerials: false, serialLabel: "Serial Number" },
  "Electronics":   { suggestedVariantTypes: ["Color", "Wattage", "Model"], supportsSerials: true,  serialLabel: "Serial Number" },
  "Accessories":   { suggestedVariantTypes: ["Color", "Size"],             supportsSerials: false, serialLabel: "Serial Number" },
  "Tablets":       { suggestedVariantTypes: ["Storage", "Connectivity", "Color"], supportsSerials: true, serialLabel: "IMEI / Serial" },
};

const PRESET_VALUES: Record<string, string[]> = {
  Storage:      ["64GB", "128GB", "256GB", "512GB", "1TB"],
  Color:        ["Black", "White", "Silver", "Gold", "Blue", "Red", "Green", "Pink"],
  Size:         ["XS", "S", "M", "L", "XL", "XXL"],
  RAM:          ["4GB", "8GB", "16GB", "32GB"],
  Model:        ["Pro", "Pro Max", "Standard", "Plus", "Mini"],
  Connectivity: ["Wi-Fi", "Wi-Fi + Cellular"],
  Wattage:      ["500W", "750W", "1000W"],
};

let _uid = 0;
const uid = () => `v_${++_uid}_${Math.random().toString(36).slice(2, 5)}`;

/* ─── Cartesian product generator ───────────────────────── */

const generateCombinations = (
  variantTypes: VariantType[],
  existing: VariantCombination[],
): VariantCombination[] => {
  const valid = variantTypes.filter((t) => t.values.length > 0);
  if (valid.length === 0) return [];

  const cartesian = (arrays: string[][]): string[][] =>
    arrays.reduce<string[][]>(
      (acc, cur) => acc.flatMap((a) => cur.map((b) => [...a, b])),
      [[]]
    );

  return cartesian(valid.map((t) => t.values)).map((combo) => {
    const attributes: Record<string, string> = {};
    valid.forEach((t, i) => { attributes[t.name] = combo[i]; });

    const key = JSON.stringify(attributes);
    const preserved = existing.find((e) => JSON.stringify(e.attributes) === key);
    if (preserved) return preserved;

    return {
      id: uid(),
      attributes,
      sku: combo.map((v) => v.slice(0, 3).toUpperCase()).join("-"),
      price: "",
      stock: "",
      active: true,
      serials: [],
    };
  });
};

/* ─── Shared mini components ─────────────────────────────── */

const baseInput =
  "block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50 disabled:text-slate-400";

interface TagChipProps { label: string; onRemove: () => void }
const TagChip: React.FC<TagChipProps> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
    {label}
    <button type="button" onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5">
      <X size={10} />
    </button>
  </span>
);

/* ─── Toggle ─────────────────────────────────────────────── */

interface ToggleProps { active: boolean; onChange: () => void; label: string; hint?: string }
const Toggle: React.FC<ToggleProps> = ({ active, onChange, label, hint }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium text-slate-800">{label}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${active ? "bg-blue-500" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${active ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  </div>
);

/* ─── Variant Builder ────────────────────────────────────── */

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
    if (variantTypes.find((t) => t.name.toLowerCase() === name.toLowerCase())) return;
    onChange([...variantTypes, { id: uid(), name: name.trim(), values: [] }]);
    setNewTypeName("");
  };

  const removeType = (id: string) => onChange(variantTypes.filter((t) => t.id !== id));

  const addValue = (typeId: string, val: string) => {
    if (!val.trim()) return;
    onChange(variantTypes.map((t) => {
      if (t.id !== typeId) return t;
      if (t.values.includes(val.trim())) return t;
      return { ...t, values: [...t.values, val.trim()] };
    }));
    setValueInputs((p) => ({ ...p, [typeId]: "" }));
  };

  const removeValue = (typeId: string, val: string) => {
    onChange(variantTypes.map((t) => t.id === typeId ? { ...t, values: t.values.filter((v) => v !== val) } : t));
  };

  const addPreset = (typeId: string, val: string) => {
    onChange(variantTypes.map((t) => {
      if (t.id !== typeId || t.values.includes(val)) return t;
      return { ...t, values: [...t.values, val] };
    }));
  };

  const unusedSuggestions = suggestedTypes.filter(
    (s) => !variantTypes.find((t) => t.name.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Suggested pills */}
      {unusedSuggestions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            <Zap size={9} className="inline mr-1 text-amber-400" />
            Suggested for this category
          </p>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addType(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-full text-slate-600 bg-white hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
              >
                <Plus size={10} />{s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Existing types */}
      {variantTypes.map((vt) => {
        const presets = PRESET_VALUES[vt.name] ?? [];
        const unusedPresets = presets.filter((p) => !vt.values.includes(p));
        const inputVal = valueInputs[vt.id] ?? "";

        return (
          <div key={vt.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-400 rounded-full" />
                <span className="text-sm font-semibold text-slate-800">{vt.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {vt.values.length} value{vt.values.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeType(vt.id)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {vt.values.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {vt.values.map((v) => (
                  <TagChip key={v} label={v} onRemove={() => removeValue(vt.id, v)} />
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder={`Add ${vt.name} value…`}
                value={inputVal}
                onChange={(e) => setValueInputs((p) => ({ ...p, [vt.id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValue(vt.id, inputVal); }}}
              />
              <button
                type="button"
                onClick={() => addValue(vt.id, inputVal)}
                className="px-3 py-2 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Add
              </button>
              {presets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPresets((p) => ({ ...p, [vt.id]: !p[vt.id] }))}
                  className="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  <ChevronDown size={11} className={`transition-transform ${showPresets[vt.id] ? "rotate-180" : ""}`} />
                  Presets
                </button>
              )}
            </div>

            {showPresets[vt.id] && unusedPresets.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {unusedPresets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => addPreset(vt.id, p)}
                    className="px-2.5 py-1 text-[11px] border border-dashed border-slate-300 rounded-full text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    +{p}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add new type input */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          placeholder="New variant type (e.g. Storage, Color)…"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addType(newTypeName); }}}
        />
        <button
          type="button"
          onClick={() => addType(newTypeName)}
          disabled={!newTypeName.trim()}
          className="px-4 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-xl disabled:opacity-40 hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

/* ─── Serial Manager Modal ───────────────────────────────── */

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

  const addSerial = () =>
    setSerials((p) => [...p, { id: uid(), serial: "", purchaseDate: "", warrantyMonths: "12", status: "available" }]);

  const updateSerial = (id: string, field: keyof SerialEntry, val: string) => {
    setSerials((p) => p.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
    setError("");
  };

  const removeSerial = (id: string) => setSerials((p) => p.filter((s) => s.id !== id));

  const importBulk = () => {
    const incoming = bulkInput.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
    const existing = new Set(serials.map((s) => s.serial));
    const dups = incoming.filter((s) => existing.has(s));
    if (dups.length > 0) { setError(`Duplicates: ${dups.join(", ")}`); return; }
    setSerials((p) => [...p, ...incoming.map((s) => ({ id: uid(), serial: s, purchaseDate: "", warrantyMonths: "12", status: "available" as const }))]);
    setBulkInput(""); setShowBulk(false); setError("");
  };

  const save = () => {
    const filled = serials.filter((s) => s.serial.trim());
    const allSN = filled.map((s) => s.serial.trim());
    if (new Set(allSN).size < allSN.length) { setError("Duplicate serial numbers detected."); return; }
    onUpdate(filled); onClose();
  };

  const statusColors: Record<SerialEntry["status"], string> = {
    available: "bg-emerald-50 text-emerald-700 border-emerald-100",
    sold:      "bg-slate-100 text-slate-600 border-slate-200",
    defective: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <ScanLine size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Manage {serialLabel}s</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {Object.values(combo.attributes).join(" / ")} · {combo.sku}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulk((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              <Copy size={12} /> Bulk Import
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200">
              <X size={14} />
            </button>
          </div>
        </div>

        {showBulk && (
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
              Paste serial numbers (comma, semicolon, or newline separated)
            </p>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={3}
              className={`${baseInput} font-mono text-xs resize-none`}
              placeholder={"SN001, SN002\nor one per line"}
            />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={importBulk} className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">Import</button>
              <button type="button" onClick={() => { setShowBulk(false); setBulkInput(""); }} className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
            </div>
          </div>
        )}

        {error && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-100">
            <p className="text-[11px] text-red-600 flex items-center gap-1.5"><AlertCircle size={11}/>{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {serials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <Hash size={20} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">No serial numbers added yet</p>
              <p className="text-xs text-slate-400">Add individually or use bulk import</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 px-5 py-2.5 border-b border-slate-100 bg-slate-50 sticky top-0" style={{ gridTemplateColumns: "1fr 130px 100px 110px 28px" }}>
                {[serialLabel, "Purchase Date", "Warranty", "Status"].map((h) => (
                  <p key={h} className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</p>
                ))}
                <div />
              </div>
              {serials.map((s, idx) => (
                <div key={s.id} className="grid gap-3 items-center px-5 py-3 border-b border-slate-50 hover:bg-slate-50" style={{ gridTemplateColumns: "1fr 130px 100px 110px 28px" }}>
                  <input className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder={`${serialLabel} ${idx + 1}`} value={s.serial} onChange={(e) => updateSerial(s.id, "serial", e.target.value)} />
                  <input type="date" className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400" value={s.purchaseDate} onChange={(e) => updateSerial(s.id, "purchaseDate", e.target.value)} />
                  <div className="flex items-center gap-1">
                    <input className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400" placeholder="12" value={s.warrantyMonths} onChange={(e) => updateSerial(s.id, "warrantyMonths", e.target.value)} />
                    <span className="text-[10px] text-slate-400 shrink-0">mo</span>
                  </div>
                  <select value={s.status} onChange={(e) => updateSerial(s.id, "status", e.target.value as SerialEntry["status"])} className={`text-[10px] font-medium px-2 py-1.5 border rounded-lg focus:outline-none ${statusColors[s.status]}`}>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="defective">Defective</option>
                  </select>
                  <button type="button" onClick={() => removeSerial(s.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"><X size={13} /></button>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <button type="button" onClick={addSerial} className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium border border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
            <Plus size={13} /> Add {serialLabel}
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-400">{serials.filter((s) => s.serial).length} units</span>
            <button type="button" onClick={save} className="px-5 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Variant Matrix Table ───────────────────────────────── */

interface VariantMatrixTableProps {
  combinations: VariantCombination[];
  basePriceStr: string;
  supportsSerials: boolean;
  serialLabel: string;
  onChange: (combos: VariantCombination[]) => void;
}

const VariantMatrixTable: React.FC<VariantMatrixTableProps> = ({
  combinations, basePriceStr, supportsSerials, serialLabel, onChange,
}) => {
  const [serialsFor, setSerialsFor] = useState<VariantCombination | null>(null);
  const [skuBase, setSKUBase] = useState("");

  const update = (id: string, field: keyof VariantCombination, val: unknown) =>
    onChange(combinations.map((c) => (c.id === id ? { ...c, [field]: val } : c)));

  const bulkToggleAll = (active: boolean) =>
    onChange(combinations.map((c) => ({ ...c, active })));

  const regenAllSKUs = () => {
    if (!skuBase) return;
    onChange(combinations.map((c, i) => ({
      ...c,
      sku: `${skuBase}-${Object.values(c.attributes).map((v) => v.slice(0, 3).toUpperCase()).join("-")}-${String(i + 1).padStart(2, "0")}`,
    })));
  };

  if (combinations.length === 0) return null;
  const attrKeys = Object.keys(combinations[0]?.attributes ?? {});

  return (
    <>
      {/* Controls */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-medium text-slate-500">
            {combinations.length} combination{combinations.length !== 1 ? "s" : ""} generated
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <input
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono w-28 focus:outline-none focus:border-blue-400"
              placeholder="SKU base…"
              value={skuBase}
              onChange={(e) => setSKUBase(e.target.value)}
            />
            <button
              type="button"
              onClick={regenAllSKUs}
              disabled={!skuBase}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <RefreshCw size={11} /> Auto SKU
            </button>
          </div>
          <button type="button" onClick={() => bulkToggleAll(true)} className="px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100">All On</button>
          <button type="button" onClick={() => bulkToggleAll(false)} className="px-2.5 py-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100">All Off</button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {attrKeys.map((k) => (
                  <th key={k} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{k}</th>
                ))}
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">SKU</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">Price (₹)</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">Stock</th>
                {supportsSerials && (
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{serialLabel}s</th>
                )}
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combinations.map((combo) => (
                <tr key={combo.id} className={`hover:bg-slate-50 transition-colors ${!combo.active ? "opacity-50" : ""}`}>
                  {attrKeys.map((k) => (
                    <td key={k} className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {combo.attributes[k]}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono w-28 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      placeholder="SKU-001"
                      value={combo.sku}
                      onChange={(e) => update(combo.id, "sku", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative w-24">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        placeholder={basePriceStr || "0"}
                        value={combo.price}
                        onChange={(e) => update(combo.id, "price", e.target.value)}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-center w-20 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      placeholder="0"
                      value={combo.stock}
                      onChange={(e) => update(combo.id, "stock", e.target.value)}
                    />
                  </td>
                  {supportsSerials && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSerialsFor(combo)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 border border-slate-200 rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <ScanLine size={11} />
                        {combo.serials.length > 0
                          ? <span className="font-mono text-blue-600">{combo.serials.filter((s) => s.status === "available").length} avail.</span>
                          : "Add"}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    {/* ← Toggle button instead of a checkbox or text */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={combo.active}
                      onClick={() => update(combo.id, "active", !combo.active)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${combo.active ? "bg-blue-500" : "bg-slate-200"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${combo.active ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {serialsFor && (
        <SerialManager
          combo={serialsFor}
          serialLabel={serialLabel}
          onClose={() => setSerialsFor(null)}
          onUpdate={(serials) => {
            onChange(combinations.map((c) => (c.id === serialsFor.id ? { ...c, serials } : c)));
            setSerialsFor(null);
          }}
        />
      )}
    </>
  );
};

/* ─── ProductVariantsSection (main export) ───────────────── */

export interface ProductVariantsSectionProps {
  /** Value of the hasVariants boolean field */
  hasVariants: boolean;
  onHasVariantsChange: (value: boolean) => void;
  /** Variant type definitions */
  variantTypes: VariantType[];
  onVariantTypesChange: (types: VariantType[]) => void;
  /** Generated combinations */
  combinations: VariantCombination[];
  onCombinationsChange: (combos: VariantCombination[]) => void;
  /**
   * The selected product category — used to look up suggested
   * variant types (Color, Storage, etc.) and serial number support.
   */
  category?: string;
  /** Selling price string — pre-filled as placeholder in the matrix */
  basePriceStr?: string;
}

export const ProductVariantsSection: React.FC<ProductVariantsSectionProps> = ({
  hasVariants,
  onHasVariantsChange,
  variantTypes,
  onVariantTypesChange,
  combinations,
  onCombinationsChange,
  category = "",
  basePriceStr = "",
}) => {
  const categoryConfig: CategoryConfig = CATEGORY_CONFIGS[category] ?? {
    suggestedVariantTypes: [],
    supportsSerials: false,
    serialLabel: "Serial Number",
  };

  // Regenerate the cartesian product whenever types change
  useEffect(() => {
    if (!hasVariants) return;
    onCombinationsChange(generateCombinations(variantTypes, combinations));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantTypes, hasVariants]);

  return (
    <div className="space-y-6">
      {/* Enable / disable variants */}
      <Toggle
        active={hasVariants}
        onChange={() => {
          onHasVariantsChange(!hasVariants);
          if (hasVariants) {
            onVariantTypesChange([]);
            onCombinationsChange([]);
          }
        }}
        label="This product has variants"
        hint="Enable to manage multiple SKUs (e.g. iPhone in 128GB / Black)"
      />

      {hasVariants && (
        <div className="space-y-6">
          {/* Variant type builder */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Define Variant Types
            </p>
            <VariantBuilder
              variantTypes={variantTypes}
              onChange={onVariantTypesChange}
              suggestedTypes={categoryConfig.suggestedVariantTypes}
            />
          </div>

          {/* Combination matrix */}
          {combinations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={13} className="text-slate-400" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Variant Matrix
                </p>
              </div>
              <VariantMatrixTable
                combinations={combinations}
                basePriceStr={basePriceStr}
                supportsSerials={categoryConfig.supportsSerials}
                serialLabel={categoryConfig.serialLabel}
                onChange={onCombinationsChange}
              />
            </div>
          )}

          {/* Empty states */}
          {variantTypes.length > 0 && combinations.length === 0 && (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <Layers size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Add values to your variant types to generate combinations</p>
            </div>
          )}
          {variantTypes.length === 0 && (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <Plus size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Add your first variant type above to get started</p>
              {categoryConfig.suggestedVariantTypes.length > 0 && (
                <p className="text-xs mt-1 text-slate-300">
                  Suggestions available for {category}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductVariantsSection;