import React from "react";
import { Pencil, Trash2, ChevronRight } from "lucide-react";
import type { DetailViewProps } from "../types";


const DetailView: React.FC<DetailViewProps> = ({
  title = "Details",
  subtitle,
  sections,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm active:scale-95"
            >
              <Pencil size={18} />
              <span>Edit Details</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all active:scale-95"
              title="Delete Record"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* --- CONTENT SECTIONS --- */}
      <div className="grid grid-cols-1 gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className="group">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-1 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                {section.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.fields.map((field, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group/card"
                >
                  {/* Subtle Background Accent */}
                  <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <ChevronRight size={14} className="text-blue-200" />
                  </div>

                  {/* Icon Container */}
                  {field.icon && (
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600">
                      {field.icon}
                    </div>
                  )}

                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-medium text-gray-400 mb-0.5 truncate uppercase tracking-tighter">
                      {field.label}
                    </p>
                    <div className="text-base font-semibold text-gray-800 break-words leading-tight">
                      {field.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailView;