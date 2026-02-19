import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react"
import { useState } from "react";


const PurchaseHistory = () => {
    const PURCHASE_DATA = [
      { date: "April 20, 2024", supplier: "XYZ Wholesalers", invoice: "INV-004", cost: "1,300", status: "Paid", statusColor: "bg-emerald-50 text-emerald-600" },
      { date: "Mar 15, 2024", supplier: "ABC Traders", invoice: "INV-003", cost: "1,100", status: "Paid", statusColor: "bg-amber-50 text-amber-600" },
      { date: "Feb 10, 2024", supplier: "ABC Traders", invoice: "INV-002", cost: "2,400", status: "Due", statusColor: "bg-emerald-50 text-emerald-600" }, // Using image's unique color logic
      { date: "Jan 12, 2024", supplier: "ABC Traders", invoice: "INV-001", cost: "1,000", status: "Paid", statusColor: "bg-amber-50 text-amber-600" },
    ];
    const [historyFilter, setHistoryFilter] = useState("All Items");
  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col">
                {/* Table Header / Search Area */}
                <div className="p-6 space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search by invoice, supplier or date..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                      <Filter size={16} /> Filter
                    </button>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex gap-4 border-b border-slate-100">
                    {["All Items", "Low Stock", "Out of Stock"].map((f) => (
                      <button 
                        key={f}
                        onClick={() => setHistoryFilter(f)}
                        className={`pb-3 text-sm font-bold transition-all px-2 ${
                          historyFilter === f ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-y border-slate-100 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                        <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded" /></th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Supplier</th>
                        <th className="px-6 py-4">Invoice No.</th>
                        <th className="px-6 py-4">Total Cost</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {PURCHASE_DATA.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.date}</td>
                          <td className="px-6 py-4 text-sm text-slate-800 font-bold">{row.supplier}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono">{row.invoice}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-bold">₹{row.cost}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${row.statusColor}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-all">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-6 flex items-center justify-between border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500">Showing 1 to 4 of 4 entries</p>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-600"><ChevronLeft size={18} /></button>
                    <button className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg">1</button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600"><ChevronRight size={18} /></button>
                  </div>
                </div>
              </div>
    </div>
  )
}

export default PurchaseHistory
