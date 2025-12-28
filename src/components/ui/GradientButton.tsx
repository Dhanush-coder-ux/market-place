import React from "react";
import type { GradientButtonProps } from "../types";

const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
  icon,
  variant = "gradient", 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl transition-all font-medium active:scale-95";

  const gradientStyles = "btn-gradient-blue text-white px-4 py-2.5 shadow-sm";

  const outlineStyles =
    "px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 shadow-sm";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variant === "gradient" ? gradientStyles : outlineStyles}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {icon}
      {children}
    </button>
  );
};

export default GradientButton;
