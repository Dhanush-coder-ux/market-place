import React from "react";
import type { TableProps as BaseTableProps } from "../types";

interface TableProps extends BaseTableProps {
  selectedIds?: any[];
  onSelectionChange?: (selectedIds: any[]) => void;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  rowKey = "id",
  onRowClick,
  className = "",
  selectedIds = [],
  onSelectionChange,
}) => {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    onSelectionChange(e.target.checked ? data.map((row) => row[rowKey]) : []);
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

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <div
      className={`overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}
    
    >
      <table className="min-w-full border-separate border-spacing-0">
        {/* Head */}
        <thead>
          <tr>
            {onSelectionChange && (
              <th className="px-5 py-3.5 w-10 text-left  first:rounded-tl-2xl border-b border-slate-100 bg-blue-100">
                <input
                  type="checkbox"
                  ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-600"
                />
              </th>
            )}
            {columns.map((col, i) => (
              <th
                key={col.key}
                className={`
                  px-5 py-3.5 text-left  border-b border-slate-100
                  bg-blue-100
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

        {/* Body */}
        <tbody>
          {data.map((row, index) => {
            const id = row[rowKey] ?? index;
            const isSelected = selectedIds.includes(id);
            const isLast = index === data.length - 1;

            return (
              <tr
                key={id}
                onClick={() => onRowClick?.(row)}
                className={`
                  group transition-colors duration-150
                  ${isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50/80"}
                  ${onRowClick ? "cursor-pointer" : ""}
                `}
              >
                {onSelectionChange && (
                  <td className={`px-5 py-3.5 whitespace-nowrap ${!isLast ? "border-b border-slate-100" : ""} ${isLast ? "first:rounded-bl-2xl" : ""}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleRowCheckboxChange(e, id)}
                      onClick={(e) => e.stopPropagation()}
                      className={`
                        w-4 h-4 rounded-md border-slate-300 text-indigo-600
                        focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-600
                        transition-opacity duration-150
                        ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                      `}
                    />
                  </td>
                )}

                {columns.map((col, ci) => (
                  <td
                    key={col.key}
                    className={`
                      px-5 py-3.5 text-[13px] text-slate-700 whitespace-nowrap font-medium
                      ${!isLast ? "border-b border-slate-100" : ""}
                      ${isLast && !onSelectionChange && ci === 0 ? "rounded-bl-2xl" : ""}
                      ${isLast && ci === columns.length - 1 ? "rounded-br-2xl" : ""}
                    `}
                  >
                    {/* If the cell is a string/number, wrap in span; else render as-is */}
                    {typeof row[col.key] === "string" || typeof row[col.key] === "number" ? (
                      <span
                        className={`
                          ${ci === 0 ? "font-semibold text-slate-800" : "text-slate-500"}
                        `}
                      >
                        {row[col.key]}
                      </span>
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            );
          })}

          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                className="px-5 py-12 text-center text-[13px] text-slate-400 font-medium rounded-b-2xl"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer: selection count */}
      {onSelectionChange && selectedIds.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-2.5 border-t border-slate-100 bg-indigo-50/50 rounded-b-2xl">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black">
            {selectedIds.length}
          </span>
          <span className="text-[12px] font-semibold text-indigo-700">
            row{selectedIds.length !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => onSelectionChange([])}
            className="ml-auto text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;