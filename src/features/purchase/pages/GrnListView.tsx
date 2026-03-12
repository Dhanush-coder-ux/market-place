import { Eye, Filter, Search, MoreHorizontal } from "lucide-react";
import Table from "@/components/common/Table";
import GrnHeader from "../components/GrnHeader";

type GRNStatus = "Completed" | "Pending" | "Partial";

interface GRNRecord {
  id: string;
  poReference: string;
  supplier: string;
  date: string;
  itemsCount: number;
  totalValue: number;
  status: GRNStatus;
  product_name?: string; 
  quantity?: number;     
}

// Static data array, no state needed
const tableData: GRNRecord[] = [
  { id: "1",  poReference: "PO-9921", supplier: "Global Tech", date: "2024-03-10", itemsCount: 5, totalValue: 12500, status: "Partial", product_name: "Wireless Headphones", quantity: 10 },
  { id: "2",  poReference: "PO-9925", supplier: "Mainstream Inc", date: "2024-03-11", itemsCount: 2, totalValue: 4200, status: "Pending", product_name: "Mechanical Keyboard", quantity: 5 },
  { id: "3", poReference: "PO-9928", supplier: "Apex Wholesale", date: "2024-03-12", itemsCount: 12, totalValue: 8900, status: "Pending", product_name: "USB-C Hub", quantity: 20 },
];

const getStatusStyle = (status: GRNStatus) => {
  switch (status) {
    case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Pending": return "bg-amber-50 text-amber-700 border-amber-100";
    case "Partial": return "bg-blue-50 text-blue-700 border-blue-100";
    default: return "bg-gray-50 text-gray-700";
  }
};

const GRN_COLUMNS = [

  {
    key: "poReference" as keyof GRNRecord,
    label: "PO Ref",
    render: (value: string) => <span className="text-gray-600 font-medium">{value}</span>,
  },
  { key: "supplier" as keyof GRNRecord, label: "Supplier" },
  {
    key: "date" as keyof GRNRecord,
    label: "Date",
    render: (value: string) => <span className="text-gray-500">{value}</span>,
  },
  {
    key: "totalValue" as keyof GRNRecord,
    label: "Total Value",
    render: (value: number) => <span className="font-semibold text-gray-900">${value.toLocaleString()}</span>,
  },
  {
    key: "status" as keyof GRNRecord,
    label: "Status",
    render: (value: GRNStatus) => (
      <div className="flex justify-start">
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(value)}`}>
          {value}
        </span>
      </div>
    ),
  },
  {
    key: "action" as any,
    label: "Actions",
    render: () => (
      <div className="flex justify-end gap-2">
        <button 
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
          title="View GRN"
        >
          <Eye size={18} />
        </button>
        <button 
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
    ),
  },
];

const GRNListView = () => {
  return (
    <div className="space-y-3">
      <GrnHeader/>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* TOOLBAR */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Search Batch, Product..."
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* TABLE */}
        <Table 
          columns={GRN_COLUMNS}
          data={tableData}
          rowKey="id"
        />
      </div>
    </div>
  );
};

export default GRNListView;