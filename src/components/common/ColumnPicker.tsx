import React, { useState } from "react";
import { Columns, GripVertical } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Reorder } from "framer-motion";

interface ColumnPickerProps {
  availableKeys: string[];
  selectedKeys: string[];
  onApply: (keys: string[]) => void;
  storageKey?: string;
}

export const ColumnPicker: React.FC<ColumnPickerProps> = ({ 
  availableKeys, 
  selectedKeys, 
  onApply,
  storageKey 
}) => {
  const [tempSelectedKeys, setTempSelectedKeys] = useState<string[]>(selectedKeys);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [orderedAvailableKeys, setOrderedAvailableKeys] = useState<string[]>(availableKeys);

  // Sync with prop when opened
  React.useEffect(() => {
    if (isColumnPickerOpen) {
      setTempSelectedKeys(selectedKeys);
      setOrderedAvailableKeys(availableKeys);
    }
  }, [isColumnPickerOpen, selectedKeys, availableKeys]);

  const toggleColumn = (key: string) => {
    setTempSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const applyChanges = () => {
    // Reorder the selected keys based on the user's drag-and-drop order
    const orderedSelection = orderedAvailableKeys.filter(key => tempSelectedKeys.includes(key));
    
    onApply(orderedSelection);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(orderedSelection));
    }
    setIsColumnPickerOpen(false);
  };

  return (
    <Popover open={isColumnPickerOpen} onOpenChange={setIsColumnPickerOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-all shrink-0">
          <Columns size={14} className="text-slate-400" />
          <span>Columns</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-2xl overflow-hidden shadow-2xl border border-slate-100 bg-white" align="end">
        <div className="p-3 border-b bg-slate-50/50">
          <h3 className="font-black uppercase text-[9px] text-slate-400 tracking-widest">Columns Layout</h3>
        </div>
        
        <div className="flex justify-between px-4 py-2 border-b border-slate-50 text-[10px] font-black uppercase tracking-wider">
          <button 
            onClick={() => setTempSelectedKeys(orderedAvailableKeys)}
            className="text-blue-600 hover:text-blue-700"
          >
            Select all
          </button>
          <button 
            onClick={() => setTempSelectedKeys([])}
            className="text-rose-600 hover:text-rose-700"
          >
            Clear all
          </button>
        </div>

        <div className="max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
          <Reorder.Group 
            axis="y" 
            values={orderedAvailableKeys} 
            onReorder={setOrderedAvailableKeys}
            className="space-y-0.5"
          >
            {orderedAvailableKeys.map(key => (
              <Reorder.Item 
                key={key} 
                value={key}
                className="flex items-center gap-1 p-1 hover:bg-blue-50/30 rounded-lg cursor-grab active:cursor-grabbing group transition-colors bg-white"
              >
                <div className="p-1 text-slate-300 group-hover:text-blue-400">
                  <GripVertical size={12} />
                </div>
                <label className="flex-1 flex items-center gap-2 p-1 cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={tempSelectedKeys.includes(key)}
                      onChange={() => toggleColumn(key)}
                      className="peer h-3.5 w-3.5 cursor-pointer appearance-none rounded border border-slate-300 transition-all checked:bg-blue-600 checked:border-blue-600"
                    />
                    <svg className="absolute h-2.5 w-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 capitalize group-hover:text-blue-600 truncate">
                    {key.replace(/_/g, ' ')}
                  </span>
                </label>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        <div className="p-3 bg-white border-t border-slate-100">
          <button 
            onClick={applyChanges}
            className="w-full h-9 bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest rounded-lg shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            Apply & Save
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
