import { useState, useEffect } from "react";
import { Hash, Save } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { SHOP_ID } from "@/services/endpoints";
import Table from "@/components/common/Table";
import { Button, Input } from "@/components/ui";

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
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg shadow-sm shrink-0">
            <Hash className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-[15px] font-semibold text-slate-800 leading-tight min-w-0">ID Sequence Configuration</h2>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto gap-2 shrink-0"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-slate-100">
        {MODULES.map((mod) => {
          const current = config[mod.id] || { prefix: mod.defaultPrefix, start_from: 1 };
          return (
            <div key={mod.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-800">{mod.label}</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                  {formatPreview(current.prefix, current.start_from)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prefix</span>
                  <input
                    type="text"
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={current.prefix}
                    onChange={(e) => updateConfig(mod.id, "prefix", e.target.value.toUpperCase())}
                    placeholder="e.g. PUR"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Starts From</span>
                  <input
                    type="number"
                    min="1"
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={current.start_from}
                    onChange={(e) => updateConfig(mod.id, "start_from", parseInt(e.target.value) || 1)}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block p-4">
        <Table
          data={MODULES}
          pagination={{ pageSize: 20 }}
          columns={[
            {
              key: "label",
              label: "Module",
              render: (mod) => <span className="text-sm font-semibold text-slate-700">{mod.label}</span>,
            },
            {
              key: "prefix",
              label: "Prefix",
              render: (mod) => {
                const current = config[mod.id] || { prefix: mod.defaultPrefix, start_from: 1 };
                return (
                  <Input
                    inputSize="sm"
                    type="text"
                    className="uppercase font-semibold"
                    value={current.prefix}
                    onChange={(e) => updateConfig(mod.id, "prefix", e.target.value.toUpperCase())}
                    placeholder="e.g. PUR"
                  />
                );
              },
            },
            {
              key: "start_from",
              label: "Starts From",
              render: (mod) => {
                const current = config[mod.id] || { prefix: mod.defaultPrefix, start_from: 1 };
                return (
                  <Input
                    inputSize="sm"
                    type="number"
                    min={1}
                    className="font-semibold"
                    value={current.start_from}
                    onChange={(e) => updateConfig(mod.id, "start_from", parseInt(e.target.value) || 1)}
                  />
                );
              },
            },
            {
              key: "preview",
              label: "Preview",
              render: (mod) => {
                const current = config[mod.id] || { prefix: mod.defaultPrefix, start_from: 1 };
                return (
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-semibold border border-slate-200">
                    {formatPreview(current.prefix, current.start_from)}
                  </div>
                );
              },
            },
          ]}
        />
      </div>
    </div>
  );
};
