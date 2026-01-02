import React from "react";
import type { InputProps } from "../types";

const Input: React.FC<InputProps> = ({
  value,
  name,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
  className = "",
  leftIcon,   
}) => {
  return (
    <div className="relative w-full">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {leftIcon}
        </div>
      )}

      <input
      name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl border border-gray-300 
          focus:ring-2 focus:ring-blue-400 outline-none
          ${leftIcon ? "pl-10" : ""}  // <-- add extra padding when icon is present
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}`}
      />
    </div>
  );
};

export default Input;
