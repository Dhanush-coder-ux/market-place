import React from "react";
import { ArrowUpRight, ArrowDownLeft, Eye } from "lucide-react";

// Mock Data based on your screenshot
const movementData = [
  { id: 1, date: "April 20, 2024", time: "2:45 PM", type: "Added", source: "XYZ Wholesalers", ref: "INV-004 PU03TO-34", change: 10, stock: 20 },
  { id: 2, date: "April 17, 2024", time: "11:00 AM", type: "Deducted", source: "Sales Invoice", ref: "INV-034 PU03093", change: -6, stock: 10 },
  { id: 3, date: "Mar 15, 2024", time: "3:20 PM", type: "Added", source: "Purchase INV-003", ref: "ABC Traders PU0389", change: 10, stock: 16 },
  { id: 4, date: "Feb 23, 2024", time: "9:30 AM", type: "Deducted", source: "Stock Adjustment", ref: "Missing item #0034", change: -5, stock: 6 },
  { id: 5, date: "Feb 10, 2024", time: "10:00 AM", type: "Added", source: "Purchase INV-002", ref: "ABC Traders PU0513", change: 18, stock: 11 },
  { id: 6, date: "Jan 30, 2024", time: "4:15 PM", type: "Deducted", source: "Sales Invoice INV-012", ref: "ABC Traders PY05", change: -7, stock: 0 },
];

const StockMovementTab = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* 1. Summary Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 font-bold text-sm">+38</span>
          <span className="text-slate-400 text-sm font-medium">Added /</span>
          <span className="text-orange-500 font-bold text-sm">-28</span>
          <span className="text-slate-400 text-sm font-medium">Deducted</span>
        </div>
      </div>

      {/* 2. Movement Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4 text-center">Stock Change</th>
              <th className="px-6 py-4">Updated Stock</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {movementData.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-700">{row.date}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{row.time}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tight ${
                    row.type === 'Added' 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-orange-50 text-orange-600 border border-orange-100'
                  }`}>
                    {row.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-800 tracking-tight">{row.source}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{row.ref}</p>
                </td>
                <td className={`px-6 py-4 text-center font-bold text-sm ${
                  row.change > 0 ? 'text-emerald-600' : 'text-orange-500'
                }`}>
                  {row.change > 0 ? `+ ${row.change}` : row.change}
                </td>
                <td className="px-6 py-4 text-sm font-black text-slate-700">
                  {row.stock}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm">
                    <Eye size={14} /> View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Footer Pagination */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
        <p className="text-[11px] text-slate-400 font-bold uppercase">
          Showing 1 to 6 of 6 entries
        </p>
        <div className="flex gap-1">
            <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600">Prev</button>
            <button className="w-8 h-8 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100">1</button>
            <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600">Next</button>
        </div>
      </div>
    </div>
  );
};

export default StockMovementTab;