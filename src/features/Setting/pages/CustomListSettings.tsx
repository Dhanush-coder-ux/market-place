import React, { useCallback, useEffect, useState } from "react";
import { Plus, X, Tag, Ruler, Pencil, Check, Search, Loader2 } from "lucide-react";
import { SHOP_ID, getShopId } from "@/services/endpoints";
import { utilityApi } from "@/services/api/utility";
import { useToast } from "@/context/ToastContext";

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
  const { showToast } = useToast();
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(false);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [subUnits, setSubUnits] = useState<{ name: string; factor: string }[]>([]);

  const title = type === "categories" ? "Product Categories" : "Measurement Units";
  const Icon = type === "categories" ? Tag : Ruler;
  const singular = type === "categories" ? "category" : "unit";

  const fetchData = useCallback(
    async (targetPage = 1, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const activeShopId = getShopId() || SHOP_ID;
        const res =
          type === "categories"
            ? await utilityApi.getShopCategories(activeShopId, {
                limit: "50",
                offset: String(targetPage),
              })
            : await utilityApi.getShopUnits(activeShopId, {
                limit: "50",
                offset: String(targetPage),
              });

        const norm = normalizeItems(res);
        setItems((prev) => {
          if (append) {
            const existingIds = new Set(prev.map((i) => i.id));
            const newUnique = norm.filter((i) => !existingIds.has(i.id));
            return [...prev, ...newUnique];
          }
          return norm;
        });
        setHasMore(norm.length === 50);
        setPage(targetPage);
      } catch {
        if (!append) setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [type]
  );

  useEffect(() => {
    fetchData(1, false);
  }, [fetchData]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 35) {
      if (!loading && !loadingMore && hasMore) {
        fetchData(page + 1, true);
      }
    }
  };

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
    if (items.some((item) => item.name.toLowerCase() === trimmedName.toLowerCase())) {
      showToast(`A ${singular} with the name "${trimmedName}" already exists.`, "error");
      return;
    }

    setSaving(true);
    try {
      const activeShopId = getShopId() || SHOP_ID;
      if (type === "categories") {
        await utilityApi.createShopCategory({
          shop_id: activeShopId,
          name: trimmedName,
          description: description.trim() || undefined,
          is_active: true,
        });
      } else {
        const formattedSubUnits = subUnits
          .filter((su) => su.name.trim() && su.factor.trim())
          .map((su) => ({
            name: su.name.trim(),
            factor: parseFloat(su.factor),
          }))
          .filter((su) => !isNaN(su.factor) && su.factor > 0);

        await utilityApi.createShopUnit({
          shop_id: activeShopId,
          name: trimmedName,
          short_name: shortName.trim() || trimmedName,
          description: description.trim() || undefined,
          is_active: true,
          sub_units: formattedSubUnits.length > 0 ? formattedSubUnits : undefined,
        });
      }
      showToast(`${singular.charAt(0).toUpperCase() + singular.slice(1)} added successfully`, "success");
      resetForm();
      await fetchData(1, false);
    } catch (e: any) {
      showToast(e?.message || `Failed to add ${singular}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemToRemove: ListItem) => {
    if (saving) return;

    setSaving(true);
    try {
      const activeShopId = getShopId() || SHOP_ID;
      if (type === "categories") {
        await utilityApi.deleteShopCategory({ id: itemToRemove.id, shop_id: activeShopId });
      } else {
        await utilityApi.deleteShopUnit({ id: itemToRemove.id, shop_id: activeShopId });
      }
      showToast(`${singular.charAt(0).toUpperCase() + singular.slice(1)} deleted`, "success");
      await fetchData(1, false);
    } catch (err: any) {
      let apiMsg = "";
      const detail = err?.response?.data?.detail;
      if (detail && typeof detail === "object" && detail.description) {
        apiMsg = detail.description;
      } else if (detail && typeof detail === "object" && detail.msg) {
        apiMsg = detail.msg;
      } else if (typeof detail === "string") {
        apiMsg = detail;
      } else {
        apiMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.data?.message ||
          err?.message ||
          "";
      }

      const lower = apiMsg.toLowerCase();
      let friendly: string;
      if (
        lower.includes("product") ||
        lower.includes("item") ||
        lower.includes("tagged") ||
        lower.includes("in use") ||
        lower.includes("referenced") ||
        lower.includes("associated") ||
        lower.includes("foreign key") ||
        lower.includes("constraint")
      ) {
        friendly = `"${itemToRemove.name}" cannot be deleted because one or more products are tagged with this ${singular}. Remove it from products first.`;
      } else if (apiMsg) {
        friendly = `Could not delete "${itemToRemove.name}": ${apiMsg}`;
      } else {
        friendly = `Could not delete "${itemToRemove.name}". It may be in use by an existing product.`;
      }

      showToast(friendly, "error");
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
      const activeShopId = getShopId() || SHOP_ID;
      if (type === "categories") {
        await utilityApi.updateShopCategory({
          id: item.id,
          shop_id: activeShopId,
          name: trimmed,
        });
      } else {
        await utilityApi.updateShopUnit({
          id: item.id,
          shop_id: activeShopId,
          name: trimmed,
          short_name: item.shortName || trimmed,
        });
      }
      showToast(`${singular.charAt(0).toUpperCase() + singular.slice(1)} updated`, "success");
      await fetchData(1, false);
    } catch (e: any) {
      showToast(e?.message || `Failed to update ${singular}`, "error");
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.shortName && item.shortName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[520px] overflow-hidden">
      
      {/* ── Card Header ── */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
              <Icon size={16} />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {title}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-black bg-slate-100 text-slate-600 rounded-full shrink-0">
                {items.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-2xs cursor-pointer shrink-0 active:scale-98"
          >
            {isFormOpen ? <X size={13} /> : <Plus size={13} />}
            <span>{isFormOpen ? "Cancel" : `Add ${singular}`}</span>
          </button>
        </div>

        {/* ── Search Bar with Search Icon (Recent Activity Style) ── */}
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${type === "categories" ? "categories" : "units"}...`}
            className="w-full h-9 pl-9 pr-8 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Inline Add Form (if opened) ── */}
      {isFormOpen && (
        <div className="p-4 bg-emerald-50/40 border-b border-emerald-100 space-y-3 shrink-0 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              New {singular} Details
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <X size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-2xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. ${type === "categories" ? "Electronics" : "Kilogram"}`}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>

            {type === "units" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Short Code / Symbol <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-2xs uppercase"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="e.g. kg, pcs, box"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
            )}
          </div>

          {type === "units" && (
            <div className="pt-2 border-t border-emerald-100/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600">Sub Units (Optional)</span>
                <button
                  type="button"
                  onClick={addSubUnit}
                  className="text-[10px] px-2 py-0.5 bg-white text-emerald-800 font-bold hover:bg-emerald-100 rounded-md border border-emerald-200 flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Plus size={10} /> Add Sub Unit
                </button>
              </div>

              {subUnits.length > 0 && (
                <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                  {subUnits.map((su, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                      <input
                        type="text"
                        className="flex-1 h-7 px-2 bg-slate-50 border border-slate-200 rounded text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                        placeholder="Name (e.g. Gram)"
                        value={su.name}
                        onChange={(e) => updateSubUnit(idx, "name", e.target.value)}
                      />
                      <input
                        type="number"
                        className="w-24 h-7 px-2 bg-slate-50 border border-slate-200 rounded text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                        placeholder="Factor (1000)"
                        value={su.factor}
                        onChange={(e) => updateSubUnit(idx, "factor", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeSubUnit(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="h-7 px-3 text-xs font-semibold text-slate-600 hover:bg-white bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={
                !name.trim() ||
                (type === "units" && !shortName.trim()) ||
                saving
              }
              className="h-7 px-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              <span>Save {singular}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Scrollable Items Container (Scrollable Pagination) ── */}
      <div
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3"
      >
        {loading && items.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="text-emerald-600 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading {title.toLowerCase()}...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
            <Search size={22} className="text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-semibold text-slate-500">
              {search ? `No ${singular}s matching "${search}"` : `No ${type} added yet.`}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-0.5 pb-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/90 hover:border-emerald-200 rounded-xl shadow-2xs transition-all text-xs font-bold text-slate-800"
              >
                {editingId === item.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEditSave(item)}
                      className="h-6 w-24 px-1.5 text-xs font-bold text-slate-800 bg-white border border-emerald-400 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleEditSave(item)}
                      disabled={saving}
                      className="p-1 rounded text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={saving}
                      className="p-1 rounded text-slate-400 hover:bg-slate-200 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="truncate max-w-[160px]">{item.name}</span>
                    {item.shortName && (
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/60 px-1 py-0.2 rounded border border-emerald-200/50">
                        {item.shortName}
                      </span>
                    )}

                    {!item.isDefault && (
                      <div className="flex items-center gap-0.5 ml-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditValue(item.name);
                          }}
                          disabled={saving}
                          title="Rename"
                          className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-white transition-colors cursor-pointer"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={saving}
                          title="Delete"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Scrollable Pagination Loader at Bottom ── */}
        {loadingMore && (
          <div className="py-2.5 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
            <Loader2 size={13} className="text-emerald-600 animate-spin" />
            <span>Loading more {type}...</span>
          </div>
        )}

        {!hasMore && items.length > 0 && !search && (
          <div className="py-3 text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider border-t border-slate-100 mt-2">
            All {items.length} {type} loaded
          </div>
        )}
      </div>

    </div>
  );
};
