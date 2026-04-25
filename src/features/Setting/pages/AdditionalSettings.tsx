import { useState} from "react";
import { 
  Plus, Trash2, Type, ToggleRight, Settings2, 
  Save, MoreVertical, Hash, Calendar, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DropDown from "@/components/common/Dropdown";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { SelectPickerModal } from "../components/SelectPickerModal";
import { useMediaQuery } from "@/hooks/use-media-query";

export type SettingType = "string" | "boolean" | "number" | "date" | "select";

export interface SettingRow {
  id: string;
  key: string;
  value: any;
  type: SettingType;
  options?: { label: string; value: string }[];
}

interface AdditionalSettingsProps {
  initialData?: SettingRow[];
  onSave?: (data: SettingRow[]) => void;
  title?: string;
  description?: string;
availableSelectOptions?: {
  name: string;
  values: string[];
}[];
}

// ── Center Modal ─────────────────────────────────────────────────────────────

// ── Main Component ────────────────────────────────────────────────────────────
export const AdditionalSettings = ({
  initialData = [],
  onSave,
  title = "Custom Configurations",
  description = "Manage dynamic key-value pairs for your environment.",
  availableSelectOptions = [],
}: AdditionalSettingsProps) => {
  const [settings, setSettings] = useState<SettingRow[]>(
    initialData.length > 0
      ? initialData
      : [{ id: "1", key: "", value: "", type: "string" }]
  );

  // Which row triggered the modal (null = closed)
  const [pickerRowId, setPickerRowId] = useState<string | null>(null);

  const addSetting = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setSettings([...settings, { id: newId, key: "", value: "", type: "string" }]);
  };

  const removeSetting = (id: string) => {
    setSettings(settings.filter((s) => s.id !== id));
  };

const updateSetting = (id: string, field: keyof SettingRow, val: any) => {
    setSettings((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (field === "type") {
            let defaultValue: any = "";
            if (val === "boolean") defaultValue = false;
            if (val === "number") defaultValue = 0;
            if (val === "date") defaultValue = new Date().toISOString().split("T")[0];
            
            if (val === "select") {
              // Open modal immediately to let user choose which product field to use
              setPickerRowId(id); 
              // Set a temporary placeholder or the first available option
              defaultValue = availableSelectOptions[0]?.values || "";
            }
            return { ...s, type: val as SettingType, value: defaultValue };
          }
          return { ...s, [field]: val };
        }
        return s;
      })
    );
  };


  const handlePickerSelect = (opt: { name: string; values: string[] }) => {
    if (!pickerRowId) return;
   const autoKey = opt.name.toUpperCase().replace(/\s+/g, "_");

const defaultValue = opt.values?.[0] || "";
    setSettings((prev) =>
      prev.map((s) =>
        s.id === pickerRowId
          ? { 
              ...s, 
              key: autoKey, 
              value: defaultValue, 
              type: "select" 
            }
          : s
      )
    );
    setPickerRowId(null);
  };
  const renderValueInput = (setting: SettingRow) => {
    switch (setting.type) {
      case "select":
     const selectedCategory = availableSelectOptions.find(
  (opt) => opt.name.toUpperCase().replace(/\s+/g, "_") === setting.key
);
        
const dropdownOptions = selectedCategory 
  ? selectedCategory.values.map(v => ({ label: v, value: v }))
  : [];
        return (
          <div className="flex gap-1">
          <ReusableSelect
              value={setting.value}
              onValueChange={(val) => updateSetting(setting.id, "value", val)}
              options={dropdownOptions}
              placeholder="Select option..."
              className="h-10 py-0 text-sm flex-1"
            />
            {/* Re-open modal to swap field */}
            <button
              onClick={() => setPickerRowId(setting.id)}
              title="Change field"
              className="h-10 w-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors text-slate-400 shrink-0"
            >
              <List size={14} />
            </button>
          </div>
        );

      case "boolean":
        return (
          <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-lg h-10">
            <span className="text-[10px] font-bold text-slate-400 w-10 uppercase">
              {setting.value ? "True" : "False"}
            </span>
            <button
              onClick={() => updateSetting(setting.id, "value", !setting.value)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                setting.value ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  setting.value ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => updateSetting(setting.id, "value", Number(e.target.value))}
            className="w-full h-10 px-3 py-2 text-sm bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={setting.value}
            onChange={(e) => updateSetting(setting.id, "value", e.target.value)}
            className="w-full h-10 px-3 py-2 text-sm bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        );

      default:
        return (
          <input
            type="text"
            placeholder="Value"
            value={setting.value}
            onChange={(e) => updateSetting(setting.id, "value", e.target.value)}
            className="w-full h-10 px-3 py-2 text-sm bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        );
    }
  };

  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <>
      {/* Modal — rendered at root level so it overlays everything */}
      {pickerRowId !== null && (
        <SelectPickerModal
          options={availableSelectOptions}
          onSelect={handlePickerSelect}
          onClose={() => setPickerRowId(null)}
        />
      )}

      <div className="w-full bg-white md:rounded-2xl border-y md:border border-slate-200 shadow-sm overflow-hidden mb-20 md:mb-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          <Button
            onClick={addSetting}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 h-9 text-xs font-semibold shrink-0 hidden md:flex"
          >
            <Plus size={14} /> Add Row
          </Button>
          <button
            onClick={addSetting}
            className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl md:hidden"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-3">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="flex flex-col md:flex-row md:items-center gap-3 p-3 md:p-2 rounded-xl border border-slate-100 md:border-transparent md:hover:border-slate-100 md:hover:bg-slate-50/50 transition-all group"
            >
              <div className="flex-[0.8]">
                <div className="flex items-center justify-between mb-1.5 md:hidden">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Config Key</span>
                </div>
                <input
                  type="text"
                  placeholder="CONFIG_KEY"
                  value={setting.key}
                  onChange={(e) =>
                    updateSetting(
                      setting.id,
                      "key",
                      e.target.value.toUpperCase().replace(/\s+/g, "_")
                    )
                  }
                  className="w-full h-10 px-3 py-2 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5 md:hidden">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Value ({setting.type})</span>
                </div>
                {renderValueInput(setting)}
              </div>

              <div className="flex items-center justify-end border-t border-slate-50 mt-2 pt-2 md:border-none md:mt-0 md:pt-0">
                <DropDown
                  triggerIcon={
                    <div className="flex items-center gap-2 px-3 py-1.5 md:p-0 rounded-lg bg-slate-50 md:bg-transparent">
                      <span className="text-[10px] font-semibold text-slate-500 md:hidden uppercase">Settings</span>
                      <MoreVertical
                        size={18}
                        className="text-slate-400 group-hover:text-slate-600"
                      />
                    </div>
                  }
                  label="Data Type"
                  items={[
                    { label: "String", icon: <Type size={14} />, onClick: () => updateSetting(setting.id, "type", "string") },
                    { label: "Number", icon: <Hash size={14} />, onClick: () => updateSetting(setting.id, "type", "number") },
                    { label: "Boolean", icon: <ToggleRight size={14} />, onClick: () => updateSetting(setting.id, "type", "boolean") },
                    { label: "Date", icon: <Calendar size={14} />, onClick: () => updateSetting(setting.id, "type", "date") },
                    { label: "Select List", icon: <List size={14} />, onClick: () => updateSetting(setting.id, "type", "select") },
                    { label: "Delete Row", icon: <Trash2 size={14} />, onClick: () => removeSetting(setting.id), danger: true },
                  ]}
                />
              </div>
            </div>
          ))}

          {settings.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <Settings2 size={32} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-900">No settings defined</p>
              <p className="text-xs text-slate-500 mt-1">Click "Add Row" to create your first configuration key.</p>
            </div>
          )}
        </div>

        {/* Footer (Desktop) */}
        <div className="hidden md:flex px-6 py-4 bg-slate-50/50 border-t border-slate-100 justify-between items-center">
          <p className="text-[10px] text-slate-400 font-medium italic">Changes will be applied system-wide.</p>
          <Button
            onClick={() => onSave?.(settings)}
            className="bg-blue-600 hover:bg-blue-700 gap-2 px-6 h-9 text-xs font-semibold shadow-md shadow-blue-100"
          >
            <Save size={14} /> Save Configuration
          </Button>
        </div>
      </div>

      {/* Mobile Fixed Action Bar */}
      {isMobile && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 pt-4 pb-4 bg-white/95 backdrop-blur-3xl border-t border-slate-200 z-[100] flex gap-3 shadow-[0_-15px_45px_rgba(0,0,0,0.12)]">
          <Button
            onClick={() => onSave?.(settings)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            <Save size={18} /> Save Settings
          </Button>
        </div>
      )}
    </>
  );
};