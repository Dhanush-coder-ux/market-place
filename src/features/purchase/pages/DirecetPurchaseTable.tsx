import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Search} from "lucide-react";
import Table from "@/components/common/Table";
import DirectHeader from "../components/DirectHeader";

/* ================= TYPES ================= */
export interface ProductItem {
  name: string;
  quantity: number;
}

export interface DirectPurchaseData {
  id: string;
  poNumber: string;
  date: string;
  time: string;
  vendor: string;
  products: ProductItem[];
  total_cost: number;
  status: "Completed" | "Pending" | "Partial";
}

export interface Column {
  key: keyof DirectPurchaseData | "action";
  label: string;
  render?: (value: any, row: DirectPurchaseData) => ReactNode;
}

/* ================= MOCK DATA ================= */
export const MOCK_DIRECT_PURCHASES: DirectPurchaseData[] = [
  {
    id: "po-1",
    poNumber: "PO-2024-001",
    date: "April 20, 2024",
    time: "4:20 PM",
    vendor: "Global Tech",
    products: [
      { name: "Wireless Headphones", quantity: 10 },
      { name: "USB-C Cables", quantity: 50 },
    ],
    total_cost: 1300,
    status: "Partial",
  },
  {
    id: "po-2",
    poNumber: "PO-2024-002",
    date: "April 21, 2024",
    time: "10:15 AM",
    vendor: "Mainstream Inc",
    products: [
      { name: "Mechanical Keyboard", quantity: 5 },
      { name: "Ergonomic Mouse", quantity: 5 },
      { name: "27-inch Monitor", quantity: 2 },
      { name: "Docking Station", quantity: 10 },
      // ... imagine 16 more products here
    ],
    total_cost: 45000,
    status: "Completed",
  },
  {
    id: "po-3",
    poNumber: "PO-2024-003",
    date: "April 22, 2024",
    time: "09:00 AM",
    vendor: "Apex Wholesale",
    products: [
      { name: "Ergonomic Chairs", quantity: 12 },
    ],
    total_cost: 3200,
    status: "Pending",
  },
];

/* ================= COLUMNS ================= */
const PURCHASE_COLUMNS: Column[] = [
  {
    key: "poNumber",
    label: "PO Number",
    render: (value) => <span className="font-bold text-blue-600">{value}</span>,
  },
  {
    key: "date",
    label: "Order Date",
    render: (_, row) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700">{row.date}</span>
        <span className="text-[10px] text-slate-400 font-medium">{row.time}</span>
      </div>
    ),
  },
  {
    key: "vendor",
    label: "Vendor",
    render: (value) => <span className="text-sm text-slate-600">{value}</span>,
  },
  {
    key: "products",
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
    key: "products", 
    label: "Total Qty",
    render: (_, row) => {
      const totalQty = row.products.reduce((sum, item) => sum + item.quantity, 0);
      return <span className="text-sm text-slate-600">{totalQty}</span>;
    }
  },
  {
    key: "total_cost",
    label: "Total Amount",
    render: (value) => (
      <span className="text-sm text-slate-900 font-bold">${value.toLocaleString()}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => {
      let colors = "bg-slate-50 text-slate-600 border-slate-200"; // Default (Draft)
      
      if (value === "Approved") colors = "bg-emerald-50 text-emerald-600 border-emerald-100";
      if (value === "Sent") colors = "bg-blue-50 text-blue-600 border-blue-100";

      return (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${colors}`}>
          {value}
        </span>
      );
    },
  },
];

/* ================= COMPONENT ================= */
const DirectPurchaseTableView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleRowClick = () => {
    // Navigate to the direct purchase detail/edit page
    navigate('/purchase/direct/detail');
  };


  return (
    <div className="space-y-6">
      <DirectHeader/>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
   
        
        {/* Toolbar: Search & Filter */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search PO Number, Vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* Table Component */}
        <Table 
          columns={PURCHASE_COLUMNS} 
          data={MOCK_DIRECT_PURCHASES} 
          rowKey="id" 
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

export default DirectPurchaseTableView;