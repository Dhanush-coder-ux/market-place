import  { useState } from "react";
import Table from "@/components/common/Table";
import type { ReactNode } from "react";
import { PurchaseHistoryData } from "../type";
import { useNavigate } from "react-router-dom";
import { Filter, Search } from "lucide-react";

interface Column {
  key: keyof PurchaseHistoryData | "action";
  label: string;
  render?: (value: any, row: PurchaseHistoryData) => ReactNode;
}

/* ================= MOCK DATA ================= */
export const MOCK_PURCHASES: PurchaseHistoryData[] = [
  {
    id: 1,
    date: "April 20, 2024",
    time: "4:20 PM",
    supplier: "XYZ Wholesalers",
    product_name: "Wireless Headphones",
    quantity: 10,
    total_cost: 1300,
    invoice_no: "INV-004",
    status: "Paid",
  },
  // ... other items
];

/* ================= COLUMNS ================= */
const PURCHASE_COLUMNS: Column[] = [
  {
    key: "date",
    label: "Purchase Date",
    render: (_, row) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700">{row.date}</span>
        <span className="text-[10px] text-slate-400 font-medium">{row.time}</span>
      </div>
    ),
  },
  {
    key: "supplier",
    label: "Supplier",
    render: (value) => <span className="text-sm text-slate-600">{value}</span>,
  },
  {
    key: "product_name",
    label: "Products",
    render: (value, row) => (
      <div className="flex flex-col">
        <span className="text-sm text-slate-700">{value}</span>
        {row.extra_product && (
          <span className="text-[10px] text-slate-400 italic font-medium">
            {row.extra_product}
          </span>
        )}
      </div>
    ),
  },
  { key: "quantity", label: "Quantity" },
  {
    key: "total_cost",
    label: "Total Cost",
    render: (value) => <span className="text-sm text-slate-900 font-bold">₹{value.toLocaleString()}</span>,
  },
  {
    key: "status",
    label: "Status",
    render: (value) => {
      const isPaid = value === "Paid";
      return (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${
            isPaid ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
          }`}>
          {value}
        </span>
      );
    },
  },
];

/* ================= COMPONENT ================= */
const PurchaseHistoryTab = () => {
  const navigate = useNavigate();
  const [ searchTerm ,setSearchTerm ] = useState("");

  const handleRowClick = () => {
    navigate('/purchase/detail');
  };

  return (
    <div className="space-y-6">
  
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                <h3 className="text-sm font-bold text-slate-700">Recent Invoices</h3>
             </div>
             <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Search GRN, PO, or Supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border rounded-lg hover:bg-gray-50">
          <Filter size={16} /> Filter
        </button>
      </div>
             <Table 
               columns={PURCHASE_COLUMNS} 
               data={MOCK_PURCHASES} 
               rowKey="id" 
               onRowClick={handleRowClick}
             />
          </div>
    </div>
  );
};

export default PurchaseHistoryTab;