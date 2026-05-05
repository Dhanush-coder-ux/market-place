import React, { useId } from "react";

// Update your InputProps in ../types to include: 
// label?: string;
// required?: boolean;

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
}

const Input: React.FC<CustomInputProps> = ({
  label,
  required,
  leftIcon,
  className = "",
  id: manualId,
  ...props
}) => {
  const generatedId = useId();
  const id = manualId || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-600 ml-0.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
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
            ${props.disabled ? "bg-slate-50 opacity-60 cursor-not-allowed" : "bg-white"}
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;