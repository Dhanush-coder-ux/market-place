import { Check, List, X } from "lucide-react";
import { useEffect } from "react";

type SelectCategory = {
  name: string;
  values: string[];
};

interface SelectPickerModalProps {
  options: SelectCategory[];
  onSelect: (opt: SelectCategory) => void;
  onClose: () => void;
  title?: string;
}
export const SelectPickerModal = ({
  options = [], 
  onSelect,
  onClose,
  title = "Select a Category"
}: SelectPickerModalProps) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <List size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Options List */}
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 italic text-sm">
              No categories built yet. Go to Dropdown Settings to create some.
            </div>
          ) : (
            <div className="flex flex-col">
              {options.map((opt) => (
                <button
                  key={opt.name} 
              onClick={() => {
  onSelect(opt);
  onClose();
}}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-indigo-50 transition-all group text-left border-b border-slate-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {opt.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                      {opt.values.length} items: {opt.values.slice(0, 2).join(", ")}...
                    </p>
                  </div>
                  
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Check size={14} className="text-indigo-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};