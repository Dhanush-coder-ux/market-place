import React from "react";
// Update this path to where your types are defined
import type { TableProps as BaseTableProps } from "../types";

// Extend the original props to include selection handling
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
    if (e.target.checked) {
      const allIds = data.map((row) => row[rowKey]);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };


  const handleRowCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, id: any) => {
    e.stopPropagation(); 
    if (!onSelectionChange) return;

    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className={`overflow-x-auto bg-white shadow-md rounded-lg ${className}`}>
      <table className="min-w-full">
        <thead className="table-head bg-gray-50 border-b border-gray-200">
          <tr>
    
            {onSelectionChange && (
              <th className="px-4 py-3 w-10 text-left">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider ${col.className}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="table-data divide-y divide-gray-200">
          {data.map((row, index) => {
            const id = row[rowKey] || index;
            const isSelected = selectedIds.includes(id);

            return (
              <tr
                key={id}
                
                className={`group hover:bg-gray-50 transition-colors duration-150 ${
                  isSelected ? "bg-blue-50" : ""
                } ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
            
                {onSelectionChange && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowCheckboxChange(e, id)}
                        onClick={(e) => e.stopPropagation()} 
                   
                        className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-opacity duration-200 
                          ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                        `}
                      />
                    </div>
                  </td>
                )}

                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;