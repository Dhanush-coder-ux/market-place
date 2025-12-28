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
        "flex bg-gray-100 p-1.5 rounded-2xl w-fit",
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
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
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
