import React, { useState, useEffect } from "react";
import { Plus, X, Tag, Ruler } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { SHOP_ID } from "@/services/endpoints";

interface CustomListSettingsProps {
  type: "categories" | "units";
}

export const CustomListSettings: React.FC<CustomListSettingsProps> = ({ type }) => {
  const { getData, postData, putData } = useApi();
  const [dropdownId, setDropdownId] = useState<string | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);

  const title = type === "categories" ? "Product Categories" : "Measurement Units";
  const desc = type === "categories" 
    ? "Manage the categories available when creating products."
    : "Manage the measurement units (kg, pcs, box) available for products.";
  const Icon = type === "categories" ? Tag : Ruler;

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    setLoading(true);
    const res = await getData(`/utilities/dropdowns/custom/by/name/${SHOP_ID}/${type}`);
    if (res?.detail?.success && res.data) {
      setDropdownId(res.data.id);
      setItems(res.data.values || []);
    } else {
      setDropdownId(null);
      setItems([]);
    }
    setLoading(false);
  };

  const saveList = async (newItems: string[]) => {
    if (dropdownId) {
      await putData("/utilities/dropdowns/custom", {
        id: dropdownId,
        shop_id: SHOP_ID,
        dd_name: type,
        values: newItems
      });
    } else {
      const res = await postData("/utilities/dropdowns/custom", {
        shop_id: SHOP_ID,
        dd_name: type,
        values: newItems
      });
      // The POST doesn't return the ID cleanly according to typical patterns, so just re-fetch
      if (res?.detail?.success) {
        fetchData();
      }
    }
  };

  const handleAdd = async () => {
    if (!newItem.trim() || items.includes(newItem.trim())) return;
    const newItems = [...items, newItem.trim()];
    setItems(newItems);
    setNewItem("");
    await saveList(newItems);
  };

  const handleDelete = async (itemToRemove: string) => {
    const newItems = items.filter(item => item !== itemToRemove);
    setItems(newItems);
    await saveList(newItems);
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
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`Add a new ${type.slice(0, -1)}...`}
          />
          <button
            onClick={handleAdd}
            disabled={!newItem.trim()}
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
                  key={item}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <span className="text-sm font-semibold text-slate-700">{item}</span>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1 rounded-md text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
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
