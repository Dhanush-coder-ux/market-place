import React, { useId } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
  error?: string;
  inputSize?: "sm" | "md" | "lg";
  containerClassName?: string;
}

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-3.5 text-sm",
  lg: "h-11 px-4 text-sm",
};

const Input: React.FC<CustomInputProps> = ({
  label,
  required,
  leftIcon,
  rightIcon,
  tooltip,
  error,
  inputSize = "md",
  className = "",
  containerClassName = "",
  id: manualId,
  ...props
}) => {
  const generatedId = useId();
  const id = manualId || generatedId;

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
      {label && (
        <div className="flex items-center gap-1.5 ml-0.5">
          <label
            htmlFor={id}
            className="text-xs font-medium text-slate-600"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {tooltip && (
            <div className="group relative">
              <Info size={12} className="text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          id={id}
          className={cn(
            "w-full rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 transition-colors outline-none",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15",
            SIZE_CLASSES[inputSize],
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            error && "border-red-400 focus:border-red-500 focus:ring-red-500/15",
            props.disabled ? "bg-slate-50 opacity-60 cursor-not-allowed" : "bg-white",
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 ml-0.5">{error}</p>}
    </div>
  );
};

export default Input;
