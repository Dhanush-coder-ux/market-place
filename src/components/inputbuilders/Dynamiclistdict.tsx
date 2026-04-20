import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { FieldDefinition } from "./context/InputBuilderContext";
import DynamicField from "./Dynamicfield";

export type ListRow = { _id: string } & Record<string, any>;

export interface DynamicListDictProps {
  listField: FieldDefinition;
  rows: ListRow[];
  onRowsChange: (rows: ListRow[]) => void;
  minRows?: number;
}

let _uid = 0;
const uid = () => `row_${++_uid}_${Math.random().toString(36).slice(2, 5)}`;

export const createEmptyRow = (schemas: Record<string, FieldDefinition>): ListRow => {
  const row: ListRow = { _id: uid() };
  // Fallback to empty object to protect Object.keys
  Object.keys(schemas || {}).forEach((key) => {
    row[key] = "";
  });
  return row;
};

export const DynamicListDict: React.FC<DynamicListDictProps> = ({
  listField,
  rows,
  onRowsChange,
  minRows = 1,
}) => {
  // FIX 1: Ensure listField.values actually exists before trying to cast it
  const schemas: Record<string, FieldDefinition> =
    listField?.type === "LIST-DICT" && listField.values && !Array.isArray(listField.values)
      ? (listField.values as Record<string, FieldDefinition>)
      : {};

  // FIX 2: Fallback to an empty object just in case schemas somehow evaluates to falsy
  const schemaEntries = Object.entries(schemas || {}).filter(([, f]) => f.view_mode !== "HIDE");

  const addRow = () => onRowsChange([...rows, createEmptyRow(schemas)]);
  const removeRow = (id: string) => {
    if (rows.length <= minRows) return;
    onRowsChange(rows.filter((r) => r._id !== id));
  };
  const updateField = (id: string, name: string, value: any) => {
    onRowsChange(
      rows.map((r) =>
        r._id === id ? { ...r, [name]: value } : r
      )
    );
  };
  
  if (schemaEntries.length === 0) return null;

  return (
    <div className="flex flex-col space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{listField.label_name}</h3>
          {listField.category_description && (
            <p className="text-sm text-slate-500 mt-1">{listField.category_description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          <Plus size={16} className="-ml-0.5" />
          Add Row
        </button>
      </div>

      {/* Table Container (Allows horizontal scrolling for many fields) */}
      <div className="overflow-x-auto ring-1 ring-slate-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {/* Dynamic Column Headers */}
              {schemaEntries.map(([key, f]) => (
                <th
                  key={key}
                  scope="col"
                  className="px-4 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide whitespace-nowrap"
                >
                  {f.label_name}
                  {f.required && <span className="text-red-500 ml-1">*</span>}
                </th>
              ))}
              {/* Actions Column Header */}
              <th scope="col" className="relative px-4 py-3.5 w-12 text-center">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row) => (
              <tr key={row._id} className="hover:bg-slate-50 transition-colors group">
                {/* Dynamic Row Fields */}
                {schemaEntries.map(([key, field]) => (
                  <td key={key} className="px-4 py-3 align-top min-w-[200px]">
                    <DynamicField
                      field={{ ...field }}
                      value={row[key]}
                      onChange={(name, val) => updateField(row._id, name, val)}
                      hideLabel={true} // Removes the label since it's in the table header
                    />
                  </td>
                ))}
                {/* Delete Row Action */}
                <td className="px-4 py-3 align-top text-center w-12">
                  <button
                    type="button"
                    onClick={() => removeRow(row._id)}
                    disabled={rows.length <= minRows}
                    className="mt-1 inline-flex p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title="Remove row"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Empty State */}
            {rows.length === 0 && (
              <tr>
                <td colSpan={schemaEntries.length + 1} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Plus className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm">No items added yet.</p>
                    <button onClick={addRow} type="button" className="text-blue-600 font-medium hover:underline mt-1 text-sm">
                      Add your first row
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicListDict;