import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface CustomTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: string;
  containerClassName?: string;
}

export const Textarea: React.FC<CustomTextareaProps> = ({
  label,
  required,
  error,
  className = "",
  containerClassName = "",
  id: manualId,
  rows = 3,
  ...props
}) => {
  const generatedId = useId();
  const id = manualId || generatedId;

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-slate-600 ml-0.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        id={id}
        rows={rows}
        className={cn(
          "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors outline-none resize-y",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500/15",
          props.disabled ? "bg-slate-50 opacity-60 cursor-not-allowed" : "bg-white",
          className
        )}
        {...props}
      />

      {error && <p className="text-xs text-red-500 ml-0.5">{error}</p>}
    </div>
  );
};

export default Textarea;

