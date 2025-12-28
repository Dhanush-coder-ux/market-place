import { Plus } from "lucide-react";
import React from "react";
import type { HelperFunction } from "../types";

export const FormButton: React.FC<HelperFunction> = ({ label, onClick }) => {
  return (
    <div className="pt-4">
      <button
        onClick={onClick}
        className="w-full group relative overflow-hidden bg-gray-900 text-white py-5 rounded-[20px] font-bold text-lg hover:bg-blue-600 transition-all duration-300 shadow-xl active:scale-[0.98]"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <Plus className="group-hover:rotate-90 transition-transform" />
          {label}
        </span>

        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
};
