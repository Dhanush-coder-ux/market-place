import { Filter, Search } from "lucide-react";
import { useState } from "react";
import Table from "@/components/common/Table";

const PurchaseHistory = () => {
  const [historyFilter, setHistoryFilter] = useState("All Items");
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  /* ================= COLUMNS DEFINITION ================= */
  const PURCHASE_COLUMNS = [
    {
      key: "date",
      label: "Date",
      render: (value: string) => (
        <span className="text-sm text-slate-600 font-medium">{value}</span>
      ),
    },
    {
      key: "supplier",
      label: "Supplier",
      render: (value: string) => (
        <span className="text-sm text-slate-800 font-bold">{value}</span>
      ),
    },
    {
      key: "invoice",
      label: "Invoice No.",
      render: (value: string) => (
        <span className="text-sm text-slate-500 font-mono">{value}</span>
      ),
    },
    {
      key: "cost",
      label: "Total Cost",
      render: (value: string) => (
        <span className="text-sm text-slate-900 font-bold">₹{value}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string, row: any) => (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${row.statusColor}`}>
          {value}
        </span>
      ),
    },
    {
      key: "id", // Using ID or action key for the button
      label: "Action",
      render: () => (
        <div className="text-right">
          <button className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-all">
            View Details
          </button>
        </div>
      ),
    },
  ];
  const handleSelectionChange = (ids: (string | number)[]) => {
    setSelectedIds(ids);
    console.log("Selected Purchase IDs:", ids);
  };

  /* ================= MOCK DATA ================= */
  const PURCHASE_DATA = [
    { id: 1, date: "April 20, 2024", supplier: "XYZ Wholesalers", invoice: "INV-004", cost: "1,300", status: "Paid", statusColor: "bg-emerald-50 text-emerald-600" },
    { id: 2, date: "Mar 15, 2024", supplier: "ABC Traders", invoice: "INV-003", cost: "1,100", status: "Paid", statusColor: "bg-amber-50 text-amber-600" },
    { id: 3, date: "Feb 10, 2024", supplier: "ABC Traders", invoice: "INV-002", cost: "2,400", status: "Due", statusColor: "bg-emerald-50 text-emerald-600" },
    { id: 4, date: "Jan 12, 2024", supplier: "ABC Traders", invoice: "INV-001", cost: "1,000", status: "Paid", statusColor: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden">
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
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
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
                  historyFilter === f
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Reusable Table Component */}
        <Table
         columns={PURCHASE_COLUMNS}
          data={PURCHASE_DATA}
          rowKey="id"
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
        />

        {/* Pagination Footer */}
        <div className="p-6 flex items-center justify-between border-t border-slate-100 bg-slate-50/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
            Showing 1 to {PURCHASE_DATA.length} of {PURCHASE_DATA.length} entries
          </p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600">Prev</button>
            <button className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-100">1</button>
            <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistory;