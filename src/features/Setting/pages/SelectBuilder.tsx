import React, { useState, useCallback } from 'react';
import { Plus, X, ChevronDown, ListTree, Tag } from 'lucide-react';

interface SelectOption {
  id: string;
  value: string;
}

interface SelectBuilderProps {
  onSettingsChange?: (settings: { name: string; values: string[] }[]) => void;
}

const SelectBuilder: React.FC<SelectBuilderProps> = ({ onSettingsChange }) => {
  const [fieldName, setFieldName] = useState<string>('Product Type');
  const [options, setOptions] = useState<SelectOption[]>([
    { id: '1', value: 'Electronics' },
    { id: '2', value: 'Furniture' },
  ]);
  const [newOptionText, setNewOptionText] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const updateAndNotify = useCallback((currentName: string, currentOptions: SelectOption[]) => {
    const formatted = [
      {
        name: currentName || "Untitled",
        values: currentOptions.map(opt =>
          opt.value.toLowerCase().replace(/\s+/g, "-")
        )
      }
    ];
    onSettingsChange?.(formatted);
  }, [onSettingsChange]);

  const addOption = () => {
    if (newOptionText.trim()) {
      const newOption: SelectOption = {
        id: crypto.randomUUID(),
        value: newOptionText.trim(),
      };
      const updated = [...options, newOption];
      setOptions(updated);
      setNewOptionText('');
      updateAndNotify(fieldName, updated);
    }
  };

  const removeOption = (id: string) => {
    const updated = options.filter((opt) => opt.id !== id);
    setOptions(updated);
    updateAndNotify(fieldName, updated);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFieldName(newName);
    updateAndNotify(newName, options);
  };

  return (
    <div className="w-full ">
      
      {/* Main Card Container */}
      <div className="overflow-hidden">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
              <ListTree className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 leading-tight">Dropdown Builder</h2>
              <p className="text-sm text-slate-500">Configure your custom select options</p>
            </div>
          </div>

          {/* Category Input */}
          <div className="space-y-2">
            <label htmlFor="category-name" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Category Name
            </label>
            <input
              id="category-name"
              type="text"
              className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
              value={fieldName}
              onChange={handleNameChange}
              placeholder="e.g., Product Type"
            />
          </div>
        </div>

        {/* Builder Section */}
        <div className="p-6 space-y-6">
          
          {/* Add Option Input Group */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addOption()}
                placeholder="Type a new option..."
              />
            </div>
            <button
              onClick={addOption}
              disabled={!newOptionText.trim()}
              className="h-10 px-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          {/* Options List */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Current Options
                </span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-white border border-slate-200 rounded-full text-slate-600">
                  {options.length}
                </span>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>

            <div 
              className={`grid transition-all duration-300 ease-in-out ${
                isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="p-2 space-y-1">
                  {options.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                        <Tag className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-500">No options added yet.</p>
                    </div>
                  ) : (
                    options.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-slate-50 group transition-colors border border-transparent hover:border-slate-100"
                      >
                        <span className="text-sm text-slate-700 font-medium pl-1">{opt.value}</span>
                        <button
                          onClick={() => removeOption(opt.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:opacity-100"
                          title="Remove option"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SelectBuilder;