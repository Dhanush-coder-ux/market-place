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



export function ReusableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  label,
  className,
  error,
  required
}: ReusableSelectProps) {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1">
          {label}{required}
        </label>
      )}
      
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger 
          className={cn(
            "w-full h-10 rounded-xl border-gray-200 bg-white px-4 py-5 shadow-sm transition-all hover:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none",
            error && "border-red-500 focus:ring-red-500/10",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectPortal>
        <SelectContent className="rounded-2xl shadow-2xl border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
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