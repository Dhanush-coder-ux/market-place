import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { TableProps as BaseTableProps } from "../types";

interface TableProps extends BaseTableProps {
  selectedIds?: any[];
  onSelectionChange?: (selectedIds: any[]) => void;
  pagination?: {
    pageSize?: number;
  };
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  rowKey = "id",
  onRowClick,
  className = "",
  selectedIds = [],
  onSelectionChange,
  pagination,
}) => {
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = pagination?.pageSize || 10;
  const totalPages = Math.ceil(data.length / pageSize);

  // Calculate current slice
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = pagination ? data.slice(startIndex, startIndex + pageSize) : data;

  // --- Selection Logic ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    // Selecting all rows on the CURRENT page
    const currentPageIds = currentData.map((row) => row[rowKey]);
    if (e.target.checked) {
      const newSelection = Array.from(new Set([...selectedIds, ...currentPageIds]));
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(selectedIds.filter((id) => !currentPageIds.includes(id)));
    }
  };

  const handleRowCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, id: any) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id]
    );
  };

  const isAllSelected = currentData.length > 0 && currentData.every(row => selectedIds.includes(row[rowKey]));
  const isIndeterminate = !isAllSelected && currentData.some(row => selectedIds.includes(row[rowKey]));

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {onSelectionChange && (
                <th className="px-5 py-3.5 w-10 text-left border-b border-slate-100 bg-blue-100 first:rounded-tl-2xl">
                  <input
                    type="checkbox"
                    ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 cursor-pointer accent-indigo-600"
                  />
                </th>
              )}
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className={`
                    px-5 py-3.5 text-left border-b border-slate-100 bg-blue-100
                    text-[11px] font-semibold text-black uppercase tracking-widest
                    ${!onSelectionChange && i === 0 ? "rounded-tl-2xl" : ""}
                    ${i === columns.length - 1 ? "rounded-tr-2xl" : ""}
                    ${col.className ?? ""}
                  `}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {currentData.map((row, index) => {
              const id = row[rowKey] ?? index;
              const isSelected = selectedIds.includes(id);
              const isLast = index === currentData.length - 1;

              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  className={`group transition-colors duration-150 ${isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50/80"} ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {onSelectionChange && (
                    <td className={`px-5 py-3.5 whitespace-nowrap ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowCheckboxChange(e, id)}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-4 h-4 rounded-md border-slate-300 text-indigo-600 transition-opacity duration-150 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                      />
                    </td>
                  )}
                  {columns.map((col, ci) => (
                    <td key={col.key} className={`px-5 py-3.5 text-[13px] text-slate-700 whitespace-nowrap font-medium ${!isLast ? "border-b border-slate-100" : ""}`}>
                      {typeof row[col.key] === "string" || typeof row[col.key] === "number" ? (
                        <span className={ci === 0 ? "font-semibold text-slate-800" : "text-slate-500"}>{row[col.key]}</span>
                      ) : (row[col.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER SECTION --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 bg-white border-t border-slate-100 rounded-b-2xl gap-4">
        
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          {onSelectionChange && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-tight">
                {selectedIds.length} Selected
              </span>
              <button onClick={() => onSelectionChange([])} className="text-indigo-400 hover:text-rose-500 text-[10px] font-bold">CLEAR</button>
            </div>
          )}
          <span className="text-[12px] text-slate-400 font-medium">
            Showing {data.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, data.length)} of {data.length}
          </span>
        </div>

        {/* Pagination Controls */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center px-4 gap-2">
              <span className="text-[13px] font-bold text-slate-700">{currentPage}</span>
              <span className="text-[12px] text-slate-300">/</span>
              <span className="text-[13px] font-medium text-slate-400">{totalPages}</span>
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;