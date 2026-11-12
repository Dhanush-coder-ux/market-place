import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from "lucide-react";
import type { TableProps as BaseTableProps } from "../types";
import { cn } from "@/lib/utils";

interface TableProps extends BaseTableProps {
  selectedIds?: any[];
  onSelectionChange?: (selectedIds: any[]) => void;
  pagination?: {
    pageSize?: number;
  };
  emptyMessage?: string;
  emptyState?: React.ReactNode;
  loading?: boolean;
  compact?: boolean;
}

const ALIGN_CLASS: Record<"left" | "center" | "right", string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const Table: React.FC<TableProps> = ({
  columns,
  data,
  rowKey = "id",
  onRowClick,
  className = "",
  selectedIds = [],
  onSelectionChange,
  pagination,
  emptyMessage = "No records found",
  emptyState,
  loading = false,
  compact = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = pagination?.pageSize || 10;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const currentData = pagination
    ? data.slice(startIndex, startIndex + pageSize)
    : data;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    const currentPageIds = currentData.map((row) => row[rowKey]);
    if (e.target.checked) {
      const newSelection = Array.from(new Set([...selectedIds, ...currentPageIds]));
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(selectedIds.filter((id) => !currentPageIds.includes(id)));
    }
  };

  const handleRowCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: any
  ) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id]
    );
  };

  const isAllSelected =
    currentData.length > 0 &&
    currentData.every((row) => selectedIds.includes(row[rowKey]));

  const isIndeterminate =
    !isAllSelected &&
    currentData.some((row) => selectedIds.includes(row[rowKey]));

  const cellPad = compact ? "px-3 py-2 sm:px-3.5 sm:py-2.5" : "px-3 py-2.5 sm:px-4 sm:py-3";

  return (
    <div
      className={cn(
        "flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {onSelectionChange && (
                <th className={cn(cellPad, "w-10 text-left border-b border-slate-200/80 bg-slate-50/90")}>
                  <input
                    type="checkbox"
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                  />
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    cellPad,
                    "border-b border-slate-200/80 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap",
                    ALIGN_CLASS[col.align || "left"],
                    col.headerClassName,
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="py-12 text-center text-xs font-medium text-slate-400"
                >
                  Loading...
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="py-12 text-center"
                >
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Inbox size={22} strokeWidth={1.75} />
                      <span className="text-xs font-medium">{emptyMessage}</span>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              currentData.map((row, index) => {
                const id = row[rowKey] ?? index;
                const isSelected = selectedIds.includes(id);
                const isLast = index === currentData.length - 1;

                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "group transition-colors duration-150",
                      isSelected ? "bg-blue-50/60" : "hover:bg-slate-50/80",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {onSelectionChange && (
                      <td
                        className={cn(
                          cellPad,
                          "whitespace-nowrap",
                          !isLast && "border-b border-slate-100"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowCheckboxChange(e, id)}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer transition-opacity duration-150",
                            isSelected ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          )}
                        />
                      </td>
                    )}

                    {columns.map((col, ci) => {
                      const value = row[col.key];
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            cellPad,
                            "text-[13px] text-slate-700 whitespace-nowrap font-medium",
                            ALIGN_CLASS[col.align || "left"],
                            !isLast && "border-b border-slate-100",
                            col.className
                          )}
                        >
                          {col.render ? (
                            col.render(value, row)
                          ) : typeof value === "string" || typeof value === "number" ? (
                            <span className={ci === 0 ? "font-semibold text-slate-800" : "text-slate-600"}>
                              {value}
                            </span>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {(data.length > 0 || (onSelectionChange && selectedIds.length > 0)) && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            {onSelectionChange && selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <span className="text-[11px] font-semibold text-blue-700">
                  {selectedIds.length} Selected
                </span>
                <button
                  type="button"
                  onClick={() => onSelectionChange([])}
                  className="text-blue-500 hover:text-red-600 text-[10px] font-bold uppercase"
                >
                  Clear
                </button>
              </div>
            )}

            <span className="text-xs text-slate-400 font-medium">
              Showing {data.length > 0 ? startIndex + 1 : 0} to{" "}
              {Math.min(startIndex + pageSize, data.length)} of {data.length}
            </span>
          </div>

          {pagination && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronLeft size={15} />
              </button>

              <div className="flex items-center px-3 gap-1.5 text-xs">
                <span className="font-semibold text-slate-700">{currentPage}</span>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-400">{totalPages}</span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronsRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Table;
