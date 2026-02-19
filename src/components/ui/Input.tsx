import React, { useId } from "react";
import type { InputProps } from "../types";

// Update your InputProps in ../types to include: 
// label?: string;
// required?: boolean;

const Input: React.FC<InputProps & { label?: string; required?: boolean }> = ({
  value,
  name,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
  className = "",
  leftIcon,
  label,
  required,
}) => {
  const id = useId(); // Generates a unique ID for accessibility

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label Section */}
      {label && (
        <label 
          htmlFor={id} 
          className="text-xs font-semibold text-gray-700 ml-0.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 rounded-lg border border-gray-300 
            text-sm text-gray-900 placeholder:text-gray-400
            transition-all duration-200
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none
            ${leftIcon ? "pl-10" : ""}
            ${disabled ? "bg-gray-50 opacity-60 cursor-not-allowed" : "bg-white"}
            ${className}
          `}
        />
      </div>
    </div>
  );
};

export default Input;