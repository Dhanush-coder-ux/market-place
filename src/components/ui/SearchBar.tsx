import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
  inputClassName?: string;
  rightSlot?: React.ReactNode;
  autoFocus?: boolean;
  disabled?: boolean;
  name?: string;
}

const SIZE_CLASSES: Record<"sm" | "md", string> = {
  sm: "h-9 text-xs",
  md: "h-10 text-sm",
};

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(({
  value,
  onChange,
  onClear,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder = "Search...",
  size = "sm",
  className,
  inputClassName,
  rightSlot,
  autoFocus,
  disabled,
  name = "search",
}, ref) => {
  const hasValue = Boolean(value && value.length > 0);

  return (
    <div className={cn("relative w-full", className)}>
      <Search
        size={size === "sm" ? 14 : 16}
        strokeWidth={2}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        ref={ref}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-white pl-9 text-slate-800 placeholder:text-slate-400 transition-colors outline-none",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15",
          SIZE_CLASSES[size],
          hasValue && onClear ? "pr-8" : "pr-3.5",
          rightSlot && "pr-11",
          disabled && "bg-slate-50 opacity-60 cursor-not-allowed",
          inputClassName
        )}
      />
      {hasValue && onClear && !rightSlot && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}
      {rightSlot && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
          {rightSlot}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = "SearchBar";

export default SearchBar;
