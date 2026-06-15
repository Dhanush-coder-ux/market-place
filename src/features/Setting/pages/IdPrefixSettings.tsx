import { useState, useEffect } from "react";
import { Hash, Save } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { SHOP_ID } from "@/services/endpoints";

const MODULES = [
  { id: "purchase", label: "Purchase", defaultPrefix: "PUR" },
  { id: "stock_movement", label: "Stock Movement", defaultPrefix: "SMV" },
  { id: "inventory", label: "Inventory Adjustment", defaultPrefix: "INV" },
  { id: "customer", label: "Customer", defaultPrefix: "CUS" },
  { id: "supplier", label: "Supplier", defaultPrefix: "SUP" },
  { id: "employee", label: "Employee", defaultPrefix: "EMP" },
  { id: "order", label: "Order", defaultPrefix: "ORD" },
  { id: "billing", label: "Billing", defaultPrefix: "BIL" },
];

export const IdPrefixSettings = () => {
  const { getData, postData, isLoading } = useApi();
  const [config, setConfig] = useState<Record<string, { prefix: string; start_from: number }>>({});
  const isSaving = isLoading("save-id-config");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const res = await getData(`/utilities/shop-id-config/${SHOP_ID}`);
    if (res?.detail?.success && res.data?.config) {
      setConfig(res.data.config);
    } else {
      // Fallback defaults
      const defaults: any = {};
      MODULES.forEach(m => {
        defaults[m.id] = { prefix: m.defaultPrefix, start_from: 1 };
      });
      setConfig(defaults);
    }
  };

  const handleSave = async () => {
    await postData("/utilities/shop-id-config", {
      shop_id: SHOP_ID,
      config: config
    });
  };

  const updateConfig = (moduleId: string, field: "prefix" | "start_from", value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value
      }
    }));
  };

  const formatPreview = (prefix: string, start: number) => {
    const p = prefix ? `${prefix}-` : "";
    const s = String(start).padStart(4, "0");
    return `${p}${s}`;
  };

  return (
    <div className="bg-white md:rounded-lg border-y md:border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
            <Hash className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 leading-tight">ID Sequence Configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">Set the prefix and starting number for auto-generated IDs.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-1/4">Module</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-1/4">Prefix</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-1/4">Starts From</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-1/4">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MODULES.map((mod) => {
              const current = config[mod.id] || { prefix: mod.defaultPrefix, start_from: 1 };
              return (
                <tr key={mod.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700">{mod.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={current.prefix}
                      onChange={(e) => updateConfig(mod.id, "prefix", e.target.value.toUpperCase())}
                      placeholder="e.g. PUR"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      min="1"
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={current.start_from}
                      onChange={(e) => updateConfig(mod.id, "start_from", parseInt(e.target.value) || 1)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-bold border border-slate-200">
                      {formatPreview(current.prefix, current.start_from)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
