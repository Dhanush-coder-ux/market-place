import React, { useState, useRef, useMemo } from "react";
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
  discount_type?: "price" | "percent";
  discount_value?: string;
  discount_percent?: string;
  stock: string;
  active: boolean;
  serials: SerialEntry[];
  batch?: {
    name: string;
    expiry_date: string;
    manufacturing_date: string;
  };
  reorder_point: string;
  location?: string;
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
  const valueInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const addType = (name: string) => {
    if (!name.trim()) return;
    if (variantTypes.find(t => t.name.toLowerCase() === name.toLowerCase())) return;
    const newId = uid();
    onChange([...variantTypes, { id: newId, name: name.trim(), values: [] }]);
    setNewTypeName("");
    setTimeout(() => {
      valueInputRefs.current[newId]?.focus();
    }, 50);
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
                ref={el => { valueInputRefs.current[vt.id] = el; }}
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
  onChange: (combos: VariantCombination[]) => void;
  trackStock?: boolean;
  baseMrp?: number;
  productId?: string;
  onCheckStock?: (combo: VariantCombination) => Promise<boolean>;
  onStockError?: (msg: string) => void;
}

export const VariantMatrixTable: React.FC<VariantMatrixTableProps> = ({
  combinations, onChange, trackStock: _trackStock, baseMrp, productId: _productId, onCheckStock, onStockError
}) => {

  const [barcodeBase, setbarcodeBase] = useState("");
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const update = (id: string, updates: Partial<VariantCombination>) => {
    onChange(combinations.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const activeCount = combinations.filter(c => c.active).length;

  const barcodeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    combinations.forEach(c => {
      const b = (c.barcode || "").trim().toUpperCase();
      if (b) counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [combinations]);

  const handleToggle = async (combo: VariantCombination) => {
    if (combo.active) {
      if (activeCount <= 1) {
        onStockError?.("At least one variant must remain active.");
        return;
      }
      if (onCheckStock) {
        setCheckingId(combo.id);
        try {
          const allowed = await onCheckStock(combo);
          if (!allowed) {
            return;
          }
        } finally {
          setCheckingId(null);
        }
      } else {
        const s = parseFloat(combo.stock) || 0;
        if (s > 0) {
          onStockError?.(`Cannot disable variant '${combo.barcode || combo.sku || "this variant"}': it has stock (${s} available).`);
          return;
        }
      }
      update(combo.id, { active: false });
    } else {
      update(combo.id, { active: true });
    }
  };

  const bulkToggleAll = async (active: boolean) => {
    if (!active) {
      if (combinations.length <= 1) return;
      const updatedCombos = [...combinations];
      let hasBlocked = false;

      for (let i = 0; i < updatedCombos.length; i++) {
        const combo = updatedCombos[i];
        if (!combo.active) continue;
        if (onCheckStock) {
          const allowed = await onCheckStock(combo);
          if (allowed) {
            updatedCombos[i] = { ...combo, active: false };
          } else {
            hasBlocked = true;
          }
        } else {
          const s = parseFloat(combo.stock) || 0;
          if (s <= 0) {
            updatedCombos[i] = { ...combo, active: false };
          } else {
            hasBlocked = true;
          }
        }
      }

      if (hasBlocked) {
        onStockError?.("Some variants could not be disabled because they have active stock.");
      }
      onChange(updatedCombos);
    } else {
      onChange(combinations.map(c => ({ ...c, active: true })));
    }
  };

  const regenAllbarcodes = (basebarcode?: string) => {
    const base = (basebarcode && basebarcode.trim())
      ? basebarcode.trim().toUpperCase()
      : `BAR${Math.floor(1000 + Math.random() * 9000)}`;
    if (!barcodeBase) {
      setbarcodeBase(base);
    }
    const used = new Set<string>();
    onChange(combinations.map((c, i) => {
      const attrCode = Object.values(c.attributes)
        .map(v => String(v).replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase())
        .filter(Boolean)
        .join("-");
      let seq = String(i + 1).padStart(2, "0");
      let candidate = `${base}-${attrCode ? attrCode + "-" : ""}${seq}`;
      let counter = i + 1;
      while (used.has(candidate.toUpperCase())) {
        counter++;
        seq = String(counter).padStart(2, "0");
        candidate = `${base}-${attrCode ? attrCode + "-" : ""}${seq}`;
      }
      used.add(candidate.toUpperCase());
      return {
        ...c,
        barcode: candidate,
        sku: c.sku || candidate,
      };
    }));
  };

  const handleMrpChange = (combo: VariantCombination, val: string) => {
    const clean = val.replace(/[^0-9.]/g, "");
    const numMrp = parseFloat(clean) || 0;
    const sp = parseFloat(combo.price) || 0;
    const discType = combo.discount_type || "price";
    const numDisc = parseFloat(combo.discount_value || "0") || 0;

    let newDiscPercent = combo.discount_percent || "0";
    if (numDisc > 0) {
      if (discType === "percent") {
        newDiscPercent = String(numDisc);
      } else {
        const base = sp > 0 ? sp : numMrp;
        newDiscPercent = base > 0 ? ((numDisc / base) * 100).toFixed(2) : "0";
      }
    }

    update(combo.id, {
      mrp: clean,
      discount_percent: newDiscPercent,
    });
  };

  const handleDiscountChange = (combo: VariantCombination, val: string, discType: "price" | "percent") => {
    const clean = val.replace(/[^0-9.]/g, "");
    const numVal = parseFloat(clean) || 0;
    const sp = parseFloat(combo.price) || 0;
    const effectiveMrp = parseFloat(combo.mrp) || baseMrp || 0;
    const base = sp > 0 ? sp : effectiveMrp;

    let newDiscPercent = "0";
    if (clean !== "" && numVal > 0) {
      if (discType === "percent") {
        newDiscPercent = String(Math.min(99.99, numVal));
      } else {
        newDiscPercent = base > 0 ? Math.min(100, (numVal / base) * 100).toFixed(2) : "0";
      }
    }

    update(combo.id, {
      discount_value: clean,
      discount_type: discType,
      discount_percent: newDiscPercent,
    });
  };

  const handleDiscountTypeChange = (combo: VariantCombination, nextType: "price" | "percent") => {
    const sp = parseFloat(combo.price) || 0;
    const effectiveMrp = parseFloat(combo.mrp) || baseMrp || 0;
    const base = sp > 0 ? sp : effectiveMrp;
    const currentVal = parseFloat(combo.discount_value || "0") || 0;
    let newDiscVal = combo.discount_value || "";
    let newDiscPercent = combo.discount_percent || "0";

    if (currentVal > 0 && base > 0) {
      if (nextType === "price") {
        const amt = (base * currentVal) / 100;
        newDiscVal = amt % 1 === 0 ? String(amt) : amt.toFixed(2);
        newDiscPercent = String(currentVal);
      } else {
        const pct = Math.min(99.99, (currentVal / base) * 100);
        newDiscVal = pct % 1 === 0 ? String(pct) : pct.toFixed(2);
        newDiscPercent = String(pct);
      }
    }

    update(combo.id, {
      discount_type: nextType,
      discount_value: newDiscVal,
      discount_percent: newDiscPercent,
    });
  };

  const handleSellPriceChange = (combo: VariantCombination, val: string) => {
    const clean = val.replace(/[^0-9.]/g, "");
    const sp = parseFloat(clean) || 0;
    const effectiveMrp = parseFloat(combo.mrp) || baseMrp || 0;
    const discType = combo.discount_type || "price";
    const numDisc = parseFloat(combo.discount_value || "0") || 0;

    let newDiscPercent = combo.discount_percent || "0";
    if (numDisc > 0) {
      if (discType === "percent") {
        newDiscPercent = String(numDisc);
      } else {
        const base = sp > 0 ? sp : effectiveMrp;
        newDiscPercent = base > 0 ? ((numDisc / base) * 100).toFixed(2) : "0";
      }
    }

    update(combo.id, {
      price: clean,
      discount_percent: newDiscPercent,
    });
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

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="h-9 px-3 text-xs border border-slate-200 rounded-lg w-28 sm:w-32 font-mono focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="barcode base"
              value={barcodeBase}
              onChange={e => setbarcodeBase(e.target.value)}
            />
            <button type="button" onClick={() => regenAllbarcodes(barcodeBase)}
              className="flex items-center gap-2 h-9 px-3 sm:px-4 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
              <RefreshCw size={12} /> Auto Generate
            </button>
          </div>
          <div className="hidden sm:block h-6 w-[1px] bg-slate-200 mx-1" />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => bulkToggleAll(true)}
              className="h-9 px-3.5 sm:px-4 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all">
              All On
            </button>
            <button type="button" onClick={() => bulkToggleAll(false)}
              disabled={combinations.length <= 1}
              className="h-9 px-3.5 sm:px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              All Off
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {attrKeys.map(k => (
                  <th key={k} className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">
                    {k}
                  </th>
                ))}
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Barcode</th>
                <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">MRP</th>
                <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Discount</th>
                <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Sell Price</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Storage Location</th>
                <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Reorder Pt</th>
                <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {combinations.map((combo) => {
                const effectiveMrp = combo.mrp && !isNaN(Number(combo.mrp)) && Number(combo.mrp) > 0 ? Number(combo.mrp) : (baseMrp || 0);
                const comboSp = combo.price && !isNaN(Number(combo.price)) ? Number(combo.price) : 0;
                const isOverMrp = effectiveMrp > 0 && comboSp > 0 && comboSp > effectiveMrp;

                const discVal = parseFloat(combo.discount_value || "0") || 0;
                const discType = combo.discount_type || "price";
                const baseForDisc = comboSp > 0 ? comboSp : effectiveMrp;

                let directDiscAmt = 0;
                if (discVal > 0 && baseForDisc > 0) {
                  if (discType === "percent") {
                    directDiscAmt = (baseForDisc * discVal) / 100;
                  } else {
                    directDiscAmt = Math.min(baseForDisc, discVal);
                  }
                }

                const mrpDiff = effectiveMrp > 0 && comboSp > 0 && effectiveMrp > comboSp ? (effectiveMrp - comboSp) : 0;
                const totalSavings = mrpDiff + directDiscAmt;
                const referencePrice = effectiveMrp > 0 ? effectiveMrp : comboSp;
                const savingPercent = referencePrice > 0 && totalSavings > 0 ? Math.min(100, (totalSavings / referencePrice) * 100) : 0;

                const isDuplicateBarcode = Boolean(combo.barcode && (barcodeCounts[(combo.barcode || "").trim().toUpperCase()] || 0) > 1);

                return (
                  <React.Fragment key={combo.id}>
                    <tr className={`hover:bg-slate-50/50 transition-all duration-150 ${!combo.active ? "opacity-40 grayscale-[0.5]" : ""}`}>
                      {attrKeys.map(k => (
                        <td key={k} className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black tracking-tight bg-slate-100 text-slate-700">
                            {combo.attributes[k]}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <input
                            className={`h-9 px-2.5 text-xs border rounded-lg w-28 font-mono focus:ring-2 outline-none ${
                              isDuplicateBarcode
                                ? "border-red-400 bg-red-50 text-red-700 focus:ring-red-200"
                                : "border-slate-200 focus:ring-blue-100"
                            }`}
                            placeholder="SKU-001"
                            value={combo.barcode}
                            onChange={e => update(combo.id, { barcode: e.target.value })}
                          />
                          {isDuplicateBarcode && (
                            <span className="text-[9px] text-red-500 font-bold mt-0.5 whitespace-nowrap">
                              Duplicate barcode
                            </span>
                          )}
                        </div>
                      </td>

                      {/* MRP Column */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₹</span>
                            <input
                              className="h-9 pl-6 pr-2 text-xs border border-slate-200 rounded-lg w-24 text-right font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                              placeholder={baseMrp ? String(baseMrp) : "0.00"}
                              type="number"
                              min="0"
                              step="0.01"
                              value={combo.mrp || ""}
                              onChange={e => handleMrpChange(combo, e.target.value)}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Discount Column */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center">
                            <div className="relative flex-1">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                                {combo.discount_type === "percent" ? "%" : "₹"}
                              </span>
                              <input
                                className="h-9 pl-5 pr-1 text-xs border border-r-0 border-slate-200 rounded-l-lg w-20 text-right font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                                placeholder="0"
                                type="number"
                                min="0"
                                step={combo.discount_type === "percent" ? "0.1" : "1"}
                                value={combo.discount_value || ""}
                                onChange={e => handleDiscountChange(combo, e.target.value, combo.discount_type || "price")}
                              />
                            </div>
                            <button
                              type="button"
                              title={`Switch to ${combo.discount_type === "percent" ? "Direct Price (₹)" : "Percentage (%)"}`}
                              onClick={() => {
                                const next = combo.discount_type === "percent" ? "price" : "percent";
                                handleDiscountTypeChange(combo, next);
                              }}
                              className="h-9 px-2 text-[10px] font-bold border border-slate-200 rounded-r-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                            >
                              {combo.discount_type === "percent" ? "%" : "₹"}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Sell Price Column */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₹</span>
                            <input
                              className={`h-9 pl-6 pr-2 text-xs border rounded-lg w-24 text-right font-mono focus:ring-2 focus:ring-blue-100 outline-none ${
                                isOverMrp
                                  ? "border-red-300 bg-red-50/50 text-red-700 font-bold"
                                  : "border-slate-200"
                              }`}
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                              title={isOverMrp ? `Selling price cannot exceed MRP (₹${effectiveMrp})` : undefined}
                              value={combo.price}
                              onChange={e => handleSellPriceChange(combo, e.target.value)}
                            />
                          </div>
                          {totalSavings > 0 && !isOverMrp && (
                            <span className="text-[10px] text-emerald-600 font-bold mt-0.5 whitespace-nowrap">
                              Save ₹{totalSavings % 1 === 0 ? totalSavings : totalSavings.toFixed(2)} ({savingPercent.toFixed(0)}%)
                            </span>
                          )}
                          {isOverMrp && (
                            <span className="text-[9px] text-red-500 font-bold mt-0.5 whitespace-nowrap">
                              Exceeds MRP
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <input
                          className="h-9 px-2.5 text-xs border border-slate-200 rounded-lg w-32 focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="e.g. Shelf B"
                          value={combo.location || ""}
                          onChange={e => update(combo.id, { location: e.target.value })}
                        />
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <input
                          className="h-9 px-2 text-xs border border-slate-200 rounded-lg w-16 text-center font-mono focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="5"
                          type="number"
                          value={combo.reorder_point}
                          onChange={e => update(combo.id, { reorder_point: e.target.value })}
                        />
                      </td>

                      {/* Active Toggle Column */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(combo)}
                          disabled={checkingId === combo.id || (combo.active && activeCount <= 1)}
                          title={combo.active && activeCount <= 1 ? "At least one variant must remain active" : (combo.active ? "Click to disable variant" : "Click to enable variant")}
                          className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                            combo.active ? "bg-emerald-600" : "bg-slate-200"
                          } ${combo.active && activeCount <= 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {checkingId === combo.id ? (
                            <span className="w-3 h-3 m-0.5 border border-white/50 border-t-white rounded-full animate-spin" />
                          ) : (
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                combo.active ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          )}
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
  defaults: {
    buy_price: string;
    sell_price: string;
    mrp: string;
    reorder_point: string;
    discount_type?: "price" | "percent";
    discount_value?: string;
    discount_percent?: string;
    barcode_base?: string;
  }
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

  // Collect existing barcodes to guarantee collision-free uniqueness
  const usedBarcodes = new Set<string>();
  existing.forEach(e => {
    if (e.barcode?.trim()) usedBarcodes.add(e.barcode.trim().toUpperCase());
  });

  const base = (defaults.barcode_base && defaults.barcode_base.trim())
    ? defaults.barcode_base.trim().toUpperCase()
    : "VAR";

  return combos.map((combo, idx) => {
    const attributes: Record<string, string> = {};
    validTypes.forEach((t, i) => { attributes[t.name] = combo[i]; });

    const key = JSON.stringify(attributes);
    const existing_ = existing.find(
      e => JSON.stringify(e.attributes) === key
    );

    if (existing_) return existing_;

    // Generate unique barcode for each variant
    const attrCode = combo.map(v => v.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase()).filter(Boolean).join("-");
    let seq = String(idx + 1).padStart(2, "0");
    let candidate = `${base}-${attrCode ? attrCode + "-" : ""}${seq}`;

    let counter = idx + 1;
    while (usedBarcodes.has(candidate.toUpperCase())) {
      counter++;
      seq = String(counter).padStart(2, "0");
      candidate = `${base}-${attrCode ? attrCode + "-" : ""}${seq}`;
    }
    usedBarcodes.add(candidate.toUpperCase());

    return {
      id: uid(),
      attributes,
      barcode: candidate,
      sku: candidate,
      price: defaults.sell_price,
      buy_price: defaults.buy_price,
      mrp: defaults.mrp,
      discount_type: defaults.discount_type || "price",
      discount_value: defaults.discount_value || "",
      discount_percent: defaults.discount_percent || "0",
      reorder_point: defaults.reorder_point,
      stock: "0",
      active: true,
      serials: [],
    };
  });
};
