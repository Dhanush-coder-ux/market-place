import React from "react";
import Input from "@/components/ui/Input";
import { Plus, Trash2, Settings } from "lucide-react";

// Shared Type Definition
export interface KeyValueField {
  key: string;
  value: string;
}

interface DynamicKeyValueSettingsProps {
  label?: string;            // Allow customizing title (e.g., "Meta Data", "Attributes")
  fields: KeyValueField[];   // The data from the parent
  onChange: (newFields: KeyValueField[]) => void; // How we tell parent to update
}

export const DynamicKeyValueSettings: React.FC<DynamicKeyValueSettingsProps> = ({
  label = "Additional Settings",
  fields,
  onChange,
}) => {
  
  // --- INTERNAL LOGIC ---

  const handleAddField = () => {
    // Notify parent of the new list with an added item
    onChange([...fields, { key: "", value: "" }]);
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    onChange(updatedFields);
  };

  const handleFieldChange = (
    index: number,
    fieldProp: keyof KeyValueField,
    newValue: string
  ) => {
    const updatedFields = [...fields];
    // Create a new object to maintain immutability
    updatedFields[index] = { 
        ...updatedFields[index], 
        [fieldProp]: newValue 
    };
    onChange(updatedFields);
  };

  // --- RENDER ---

  return (
    <div className="flex flex-col gap-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Settings size={14} /> {label}
        </label>
        <button
          type="button"
          onClick={handleAddField}
          className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-500 font-semibold transition-colors"
        >
          <Plus size={14} /> Add Field
        </button>
      </div>

      {/* Empty State */}
      {fields.length === 0 && (
        <p className="text-sm text-gray-400 italic ml-1">No fields added.</p>
      )}

      {/* List Loop */}
      {fields.map((field, index) => (
        <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex-1">
            <Input
              placeholder="Key (e.g. Color)"
              value={field.key}
              onChange={(e) => handleFieldChange(index, "key", e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Value (e.g. Red)"
              value={field.value}
              onChange={(e) => handleFieldChange(index, "value", e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemoveField(index)}
            className="p-3 text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Remove item"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};