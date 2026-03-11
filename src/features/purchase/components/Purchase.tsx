import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Search } from "lucide-react";

// Assuming your Table component is imported from here
import Table from "@/components/common/Table";

/* ================= TYPES ================= */
// It's best practice to define the structure of a single product
export interface ProductItem {
  name: string;
  quantity: number;
}

export interface PurchaseHistoryData {
  id: number;
  date: string;
  time: string;
  supplier: string;
  products: ProductItem[]; // Changed from a single string to an array of products
  total_cost: number;
  invoice_no: string;
  status: "Paid" | "Pending";
}

export interface Column {
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
    products: [
      { name: "Wireless Headphones", quantity: 10 }
    ],
    total_cost: 1300,
    invoice_no: "INV-004",
    status: "Paid",
  },
  {
    id: 2,
    date: "April 21, 2024",
    time: "10:15 AM",
    supplier: "Global Tech Supplies",
    products: [
      { name: "Mechanical Keyboard", quantity: 5 },
      { name: "Ergonomic Mouse", quantity: 5 },
      { name: "27-inch Monitor", quantity: 2 },
      { name: "USB-C Hub", quantity: 10 },
      // ... imagine 16 more products here
    ],
    total_cost: 45000,
    invoice_no: "INV-005",
    status: "Pending",
  },
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
    key: "products", // Changed key to match the new array property
    label: "Products",
    render: (_, row) => {
      const productList = row.products || [];
      const firstProduct = productList[0]?.name || "Unknown Product";
      const extraCount = productList.length - 1;

      return (
        <div className="flex flex-col items-start">
          <span className="text-sm text-slate-700 font-medium">{firstProduct}</span>
          {extraCount > 0 && (
            <span className="mt-1 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-md">
              +{extraCount} more items
            </span>
          )}
        </div>
      );
    },
  },
  { 
    key: "products", // Using the products array to calculate total quantity
    label: "Total Qty",
    render: (_, row) => {
      // Sum up the quantities of all products in this order
      const totalQty = row.products.reduce((sum, item) => sum + item.quantity, 0);
      return <span className="text-sm text-slate-600">{totalQty}</span>;
    }
  },
  {
    key: "total_cost",
    label: "Total Cost",
    render: (value) => (
      <span className="text-sm text-slate-900 font-bold">₹{value.toLocaleString()}</span>
    ),
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
  const [searchTerm, setSearchTerm] = useState("");

  const handleRowClick = () => {
    // Ideally, pass the ID to the detail page: navigate(`/purchase/detail/${id}`);
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
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors">
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