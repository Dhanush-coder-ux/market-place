import React, { useCallback, useEffect, useState } from "react";
import { Plus, X, Tag, Ruler } from "lucide-react";
import { SHOP_ID } from "@/services/endpoints";
import { utilityApi } from "@/services/api/utility";

interface CustomListSettingsProps {
  type: "categories" | "units";
}

type ListItem = {
  id: string;
  name: string;
  shortName?: string;
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
    }))
    .filter((item: ListItem) => item.id && item.name);
};

export const CustomListSettings: React.FC<CustomListSettingsProps> = ({ type }) => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleAdd = async () => {
    const name = newItem.trim();
    if (!name || saving) return;
    if (items.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;

    setSaving(true);
    try {
      if (type === "categories") {
        await utilityApi.createShopCategory({ shop_id: SHOP_ID, name, is_active: true });
      } else {
        await utilityApi.createShopUnit({
          shop_id: SHOP_ID,
          name,
          short_name: name,
          is_active: true,
        });
      }
      setNewItem("");
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
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            className="flex-1 h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={`Add a new ${singular}...`}
          />
          <button
            onClick={handleAdd}
            disabled={!newItem.trim() || saving}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4">
          <h3 className="text-xs font-bold text-slate-700 tracking-wide mb-3 flex items-center gap-2">
            Current {title}
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black bg-slate-200 text-slate-600 rounded-full">
              {items.length}
            </span>
          </h3>

          {items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] font-medium text-slate-400">No items added yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={saving}
                    className="p-1 rounded-md text-slate-400 hover:bg-rose-100 hover:text-rose-600 disabled:opacity-40 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
