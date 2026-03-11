import { useState} from "react";
import { 
  Plus, Trash2, Type, ToggleRight, Settings2, 
  Save, MoreVertical, Hash, Calendar, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DropDown from "@/components/common/Dropdown";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { SelectPickerModal } from "../components/SelectPickerModal";

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

      <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{title}</h2>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
          <Button
            onClick={addSetting}
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-2 h-9 text-xs font-bold"
          >
            <Plus size={14} /> Add Row
          </Button>
        </div>

        <div className="p-6 space-y-3">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all group"
            >
              <div className="flex-[0.8]">
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
                  className="w-full h-10 px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex-1">
                {renderValueInput(setting)}
              </div>

              <div className="flex items-center">
                <DropDown
                  triggerIcon={
                    <MoreVertical
                      size={18}
                      className="text-slate-400 group-hover:text-slate-600"
                    />
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-[10px] text-slate-400 font-medium italic" />
          <Button
            onClick={() => onSave?.(settings)}
            className="bg-blue-600 hover:bg-blue-700 gap-2 px-6 h-9 text-xs font-bold shadow-md shadow-blue-100"
          >
            <Save size={14} /> Save Configuration
          </Button>
        </div>
      </div>
    </>
  );
};