import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ReusableSelectProps } from "../types"
import { SelectPortal } from "@radix-ui/react-select"
import { useState } from "react"

export function ReusableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  label,
  className,
  error,
  required,
  footer,
  onScrollEnd
}: ReusableSelectProps) {
  const [open, setOpen] = useState(false);
  const mappedValue = value === "" ? "__EMPTY__" : value;

  const handleValueChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val === "__EMPTY__" ? "" : val);
    }
  };

  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-xs font-semibold text-gray-500   ml-1">
          {label}{required}
        </label>
      )}
      
      <Select value={mappedValue} onValueChange={handleValueChange} open={open} onOpenChange={setOpen}>
        <SelectTrigger 
          className={cn(
            "w-full h-10 rounded-lg border-gray-200 bg-white px-4 py-5 shadow-sm transition-all hover:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none",
            error && "border-red-500 focus:ring-red-500/10",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectPortal>
        <SelectContent 
          position="popper" 
          className="z-[9999] rounded-lg shadow-2xl border-gray-100 overflow-hidden h-64 animate-in fade-in zoom-in-95 duration-200"
          onViewportScroll={(e) => {
            if (!onScrollEnd) return;
            const target = e.currentTarget;
            if (target.scrollHeight - target.scrollTop <= target.clientHeight + 15) {
              onScrollEnd();
            }
          }}
          footer={
            footer && (
              <div onClick={() => setOpen(false)} className="w-full">
                {footer}
              </div>
            )
          }
        >
          {options.map((option) => (
            <SelectItem 
              key={option.value || "__EMPTY__"} 
              value={option.value === "" ? "__EMPTY__" : option.value}
              className="px-3 py-2.5 rounded-lg cursor-pointer transition-colors focus:bg-blue-50 focus:text-blue-600"
            >
              <div className="flex items-center gap-3">
                {option.icon && (
                  <span className="flex-shrink-0 text-gray-400 group-focus:text-blue-500">
                    {option.icon}
                  </span>
                )}
                <span className="font-medium">{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
        </SelectPortal>
      </Select>
      
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  )
}

