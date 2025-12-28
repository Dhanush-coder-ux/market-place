import React from "react";
import type { TableProps } from "../types";


const Table: React.FC<TableProps> = ({
  columns,
  data,
  rowKey = "id",
  onRowClick,
  className = "",
}) => {
  console.log("this the table datas",data,columns);
  
  return (
    <div className={`overflow-x-auto bg-white shadow-md rounded-lg ${className}`}>
      <table className="min-w-full ">
        <thead className="table-head">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-md font-semibold ${col.className}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="table-data">
          {data.map((row, index) => (
            <tr
              key={row[rowKey] || index}
              className={`hover:bg-gray-50 cursor-pointer ${
                onRowClick ? "cursor-pointer" : ""
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="table-cell"
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
