"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ToggleOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  activeColor?: string; 
}

interface ToggleSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: ToggleOption[];
  className?: string;
}

const ToggleSelect: React.FC<ToggleSelectProps> = ({
  value,
  onChange,
  options,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex bg-gray-100 p-1.5 rounded-lg w-fit max-w-full overflow-x-auto no-scrollbar",
        className
      )}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;

        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0",
              isActive
                ? "bg-white text-gray-900 shadow-md"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <span
              className={cn(
                "transition-all",
                isActive ? opt.activeColor || "text-blue-500" : "text-transparent"
              )}
            >
              {opt.icon}
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default ToggleSelect;

