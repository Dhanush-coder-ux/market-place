
import Table from "@/components/common/Table";
import type { ReactNode } from "react";
import { PurchaseHistoryData } from "../type";
import PurchaseHeader from "../components/PurchaseHeader";
import { useNavigate } from "react-router-dom";





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
  {
    id: 2,
    date: "March 15, 2024",
    time: "3:20 PM",
    supplier: "ABC Traders",
    product_name: "Wireless Headphones",
    extra_product: "+ Ergonomic Chair",
    quantity: 16,
    total_cost: 8600,
    invoice_no: "INV-003",
    status: "Paid",
  },
  {
    id: 3,
    date: "Feb 10, 2024",
    time: "3:20 PM",
    supplier: "ABC Traders",
    product_name: "Wireless Earbuds",
    extra_product: "+ Gaming Mouse",
    quantity: 20,
    total_cost: 2400,
    invoice_no: "INV-002",
    status: "Due",
  },
  {
    id: 4,
    date: "Jan 12, 2024",
    time: "3:20 PM",
    supplier: "ABC Traders",
    product_name: "Wireless Headphones",
    quantity: 10,
    total_cost: 1000,
    invoice_no: "INV-001",
    status: "Paid",
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
    render: (value) => <span className="text-sm font-bold text-slate-600">{value}</span>,
  },
  {
    key: "product_name",
    label: "Products",
    render: (value, row) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700">{value}</span>
        {row.extra_product && (
          <span className="text-[10px] text-slate-400 italic font-medium">
            {row.extra_product}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "quantity",
    label: "Quantity",
    render: (value) => <span className="text-sm font-bold text-slate-700">{value}</span>,
  },
  {
    key: "total_cost",
    label: "Total Cost",
    render: (value) => (
      <span className="text-sm font-black text-slate-900">₹{value.toLocaleString()}</span>
    ),
  },
  {
    key: "invoice_no",
    label: "Invoice No",
    render: (value) => <span className="text-xs font-bold text-slate-400 uppercase">{value}</span>,
  },
  {
    key: "status",
    label: "Status",
    render: (value) => {
      const isPaid = value === "Paid";
      return (
        <span
          className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${
            isPaid
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-orange-50 text-orange-600 border-orange-100"
          }`}
        >
          {value}
        </span>
      );
    },
  },
];

/* ================= COMPONENT ================= */

const PurchaseHistoryTab = () => {
  const navigate  = useNavigate();
  const handleRowClick = () => {
      navigate('/purchase/detail')
    // navigate(`/purchases/${row.id}`);

  };
  return (
    <div >
      <div className="bg-white">
        <PurchaseHeader/>
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