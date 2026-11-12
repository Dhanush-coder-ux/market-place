import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ReusableSelectProps } from "../types";
import { SelectPortal } from "@radix-ui/react-select";
import { useState } from "react";

const TRIGGER_SIZES: Record<"sm" | "md", string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-3.5 text-sm",
};

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
  onScrollEnd,
  disabled,
  size = "md",
}: ReusableSelectProps & { size?: "sm" | "md" }) {
  const [open, setOpen] = useState(false);
  const mappedValue = value === "" ? "__EMPTY__" : value;

  const handleValueChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val === "__EMPTY__" ? "" : val);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-medium text-slate-600 ml-0.5">
          {label}
          {required === true ? <span className="text-red-500 ml-1">*</span> : required}
        </label>
      )}

      <Select
        value={mappedValue}
        onValueChange={handleValueChange}
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            "w-full rounded-lg border-slate-200 bg-white shadow-none transition-colors hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none",
            TRIGGER_SIZES[size],
            error && "border-red-400 focus:ring-red-500/15",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent
            position="popper"
            className="z-[999999] rounded-lg shadow-lg border-slate-200 overflow-hidden max-h-[300px]"
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
                className="px-3 py-2 rounded-md cursor-pointer transition-colors text-[13px] focus:bg-blue-50 focus:text-blue-600"
              >
                <div className="flex items-center gap-2.5">
                  {option.icon && (
                    <span className="flex-shrink-0 text-slate-400">
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

      {error && <p className="text-xs text-red-500 ml-0.5">{error}</p>}
    </div>
  );
}
