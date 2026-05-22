import React, { useId } from "react";
import { Info } from "lucide-react";

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
}

const Input: React.FC<CustomInputProps> = ({
  label,
  required,
  leftIcon,
  rightIcon,
  tooltip,
  className = "",
  id: manualId,
  ...props
}) => {
  const generatedId = useId();
  const id = manualId || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <div className="flex items-center gap-1.5 ml-0.5">
          <label
            htmlFor={id}
            className="text-xs font-semibold text-slate-600"
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

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          id={id}
          className={`
            w-full px-4 py-3 rounded-lg border border-slate-200
            text-sm text-slate-900 placeholder:text-slate-400
            transition-all duration-200
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none
            ${leftIcon ? "pl-10" : ""}
            ${rightIcon ? "pr-10" : ""}
            ${props.disabled ? "bg-slate-50 opacity-60 cursor-not-allowed" : "bg-white"}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
