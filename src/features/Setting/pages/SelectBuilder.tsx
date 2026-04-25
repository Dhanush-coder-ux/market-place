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
    <div className="w-full">
      {/* Main Card Container */}
      <div className="bg-white md:rounded-2xl border-y md:border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
              <ListTree className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-800 leading-tight">Dropdown Builder</h2>
              <p className="text-xs text-slate-500 mt-0.5">Configure your custom select options</p>
            </div>
          </div>

          {/* Category Input */}
          <div className="space-y-2">
            <label htmlFor="category-name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Category Name
            </label>
            <input
              id="category-name"
              type="text"
              className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              value={fieldName}
              onChange={handleNameChange}
              placeholder="e.g., Product Type"
            />
          </div>
        </div>

        {/* Builder Section */}
        <div className="p-6 space-y-6">
          
          {/* Add Option Input Group */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              New Option
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-slate-300" />
                </div>
                <input
                  type="text"
                  className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addOption()}
                  placeholder="Type a new option..."
                />
              </div>
              <button
                onClick={addOption}
                disabled={!newOptionText.trim()}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-blue-100"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-100 transition-colors border-b border-slate-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Current Options
                </span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black bg-blue-600 text-white rounded-full">
                  {options.length}
                </span>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
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
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-2">
                        <Tag className="w-6 h-6 text-slate-200" />
                      </div>
                      <p className="text-[13px] font-semibold text-slate-400">No options added yet</p>
                    </div>
                  ) : (
                    options.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-blue-50 group transition-all border border-transparent hover:border-blue-100"
                      >
                        <span className="text-sm text-slate-700 font-semibold">{opt.value}</span>
                        <button
                          onClick={() => removeOption(opt.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all focus:opacity-100 shadow-sm bg-white"
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