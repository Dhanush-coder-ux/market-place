import React, { useCallback, useEffect, useState } from "react";
import { Plus, X, Tag, Ruler, Pencil, Check } from "lucide-react";
import { SHOP_ID } from "@/services/endpoints";
import { utilityApi } from "@/services/api/utility";

interface CustomListSettingsProps {
  type: "categories" | "units";
}

type ListItem = {
  id: string;
  name: string;
  shortName?: string;
  isDefault?: boolean;
};

const normalizeItems = (res: any): ListItem[] => {
  const data = res?.data ?? res;
  const rawItems = Array.isArray(data)
    ? data
    : data?.datas ?? data?.items ?? data?.results ?? [];

  return (Array.isArray(rawItems) ? rawItems : [])
    .map((item: any) => ({
      id: String(item.id ?? item.datas?.id ?? ""),
      name: String(item.name ?? item.datas?.name ?? item.value ?? "").trim(),
      shortName: item.short_name ?? item.datas?.short_name,
      isDefault: item.is_default ?? item.datas?.is_default ?? false,
    }))
    .filter((item: ListItem) => item.id && item.name);
};

export const CustomListSettings: React.FC<CustomListSettingsProps> = ({ type }) => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [subUnits, setSubUnits] = useState<{name: string, factor: string}[]>([]);

  const title = type === "categories" ? "Product Categories" : "Measurement Units";
  const desc = type === "categories"
    ? "Manage the categories available when creating products."
    : "Manage the measurement units (kg, pcs, box) available for products.";
  const Icon = type === "categories" ? Tag : Ruler;
  const singular = type === "categories" ? "category" : "unit";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = type === "categories"
        ? await utilityApi.getShopCategories(SHOP_ID, { limit: "100", offset: "1" })
        : await utilityApi.getShopUnits(SHOP_ID, { limit: "100", offset: "1" });

      setItems(normalizeItems(res));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setName("");
    setShortName("");
    setDescription("");
    setSubUnits([]);
    setIsFormOpen(false);
  };

  const addSubUnit = () => setSubUnits([...subUnits, { name: "", factor: "" }]);
  const removeSubUnit = (index: number) => setSubUnits(subUnits.filter((_, i) => i !== index));
  const updateSubUnit = (index: number, field: "name" | "factor", value: string) => {
    const newSubUnits = [...subUnits];
    newSubUnits[index] = { ...newSubUnits[index], [field]: value };
    setSubUnits(newSubUnits);
  };

  const handleAdd = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || saving) return;
    if (items.some((item) => item.name.toLowerCase() === trimmedName.toLowerCase())) return;

    setSaving(true);
    try {
      if (type === "categories") {
        await utilityApi.createShopCategory({
          shop_id: SHOP_ID,
          name: trimmedName,
          description: description.trim() || undefined,
          is_active: true,
        });
      } else {
        const formattedSubUnits = subUnits
          .filter(su => su.name.trim() && su.factor.trim())
          .map(su => ({
            name: su.name.trim(),
            factor: parseFloat(su.factor),
          }))
          .filter(su => !isNaN(su.factor) && su.factor > 0);

        await utilityApi.createShopUnit({
          shop_id: SHOP_ID,
          name: trimmedName,
          short_name: shortName.trim() || trimmedName,
          description: description.trim() || undefined,
          is_active: true,
          sub_units: formattedSubUnits.length > 0 ? formattedSubUnits : undefined,
        });
      }
      resetForm();
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemToRemove: ListItem) => {
    if (saving) return;
    setItems((prev) => prev.filter((item) => item.id !== itemToRemove.id));
    setSaving(true);
    try {
      if (type === "categories") {
        await utilityApi.deleteShopCategory({ id: itemToRemove.id, shop_id: SHOP_ID });
      } else {
        await utilityApi.deleteShopUnit({ id: itemToRemove.id, shop_id: SHOP_ID });
      }
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (item: ListItem) => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === item.name || saving) {
      setEditingId(null);
      return;
    }

    setSaving(true);
    try {
      if (type === "categories") {
        await utilityApi.updateShopCategory({
          id: item.id,
          shop_id: SHOP_ID,
          name: trimmed,
        });
      } else {
        await utilityApi.updateShopUnit({
          id: item.id,
          shop_id: SHOP_ID,
          name: trimmed,
          short_name: item.shortName || trimmed,
        });
      }
      await fetchData();
    } catch {
      // Handle error implicitly
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading {title}...</div>;
  }

  return (
    <div className="bg-white md:rounded-lg border-y md:border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 leading-tight">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {isFormOpen ? (
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-sm transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Add New {singular}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`e.g. ${type === "categories" ? "Electronics" : "Kilogram"}`}
                  />
                </div>
                {type === "units" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Short Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      placeholder="e.g. kg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief description"
                />
              </div>

              {type === "units" && (
                <div className="pt-3 border-t border-slate-200 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-xs font-semibold text-slate-600">Sub Units (Optional)</label>
                    <button
                      onClick={addSubUnit}
                      className="text-[11px] px-2 py-1 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 hover:text-blue-700 rounded transition-colors flex items-center gap-1 border border-blue-200"
                    >
                      <Plus className="w-3 h-3" /> Add Sub Unit
                    </button>
                  </div>
                  
                  {subUnits.length === 0 ? (
                    <div className="text-xs text-slate-400 italic bg-white border border-slate-200 border-dashed rounded-lg p-3 text-center">
                      No sub units added. Click the button above to add one.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subUnits.map((su, index) => (
                        <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <input
                            type="text"
                            className="flex-1 h-8 px-2.5 bg-slate-50 border border-slate-200 rounded text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            placeholder="Name (e.g. Gram)"
                            value={su.name}
                            onChange={(e) => updateSubUnit(index, "name", e.target.value)}
                          />
                          <input
                            type="number"
                            className="w-24 md:w-32 h-8 px-2.5 bg-slate-50 border border-slate-200 rounded text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            placeholder="Factor (e.g. 1000)"
                            value={su.factor}
                            onChange={(e) => updateSubUnit(index, "factor", e.target.value)}
                          />
                          <button
                            onClick={() => removeSubUnit(index)}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                            title="Remove Sub Unit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 mt-4">
                <button
                  onClick={resetForm}
                  className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={
                    !name.trim() || 
                    (type === "units" && !shortName.trim()) || 
                    saving ||
                    (type === "units" && subUnits.some(su => !su.name.trim() || !su.factor.trim() || isNaN(parseFloat(su.factor)) || parseFloat(su.factor) <= 0))
                  }
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
                >
                  Save {singular}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex">
            <button
              onClick={() => setIsFormOpen(true)}
              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New {singular}
            </button>
          </div>
        )}

        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4">
          <h3 className="text-xs font-bold text-slate-700 tracking-wide mb-3 flex items-center gap-2">
            Current {title}
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black bg-slate-200 text-slate-600 rounded-full">
              {items.length}
            </span>
          </h3>

          {items.length === 0 ? (
            <div className="py-8 text-center bg-white border border-slate-100 rounded-lg">
              <p className="text-[13px] font-medium text-slate-400">No items added yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave(item)}
                        className="h-6 w-24 px-1 text-sm font-semibold text-slate-700 bg-white border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleEditSave(item)}
                        disabled={saving}
                        className="p-1 rounded-md text-emerald-600 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                        className="p-1 rounded-md text-slate-400 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                      {!item.isDefault && (
                        <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditValue(item.name);
                            }}
                            disabled={saving}
                            className="p-1 rounded-md text-slate-400 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-40 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={saving}
                            className="p-1 rounded-md text-slate-400 hover:bg-rose-100 hover:text-rose-600 disabled:opacity-40 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
