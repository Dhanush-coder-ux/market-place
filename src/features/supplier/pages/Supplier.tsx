import  { useState } from "react";
import Table from "@/components/common/Table";
import Title from "@/components/common/Title";
import { Search,  Phone, CreditCard, ShoppingBag } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import Input from "@/components/ui/Input";
import { useNavigate } from "react-router-dom";


/* ================= MOCK DATA ================= */
const MOCK_SUPPLIERS = [
  { id: 1, name: "ABC Traders", phone: "+91 98765-43210", gst: "27AAACB1234F1Z5", total_purchases: 45000, outstanding: 1200, status: "Active" },
  { id: 2, name: "XYZ Wholesalers", phone: "+91 99887-76655", gst: "07AAACX5678D2Z1", total_purchases: 82000, outstanding: 0, status: "Active" },
  { id: 3, name: "Logitech Logistics", phone: "+91 91234-56789", gst: "19AABCL9012E1Z9", total_purchases: 15600, outstanding: 5400, status: "On Hold" },
  { id: 4, name: "Samsung Global", phone: "+91 90000-11111", gst: "24AAACS3456G1Z3", total_purchases: 125000, outstanding: 0, status: "Active" }
];

const Supplier = () => {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
 

  /* ================= COLUMN DEFINITION ================= */
  const SUPPLIER_COLUMNS = [
    { 
      key: "name", 
      label: "Supplier Name", 
      render: (value: string) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800">{value}</span>
          <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">Verified Vendor</span>
        </div>
      )
    },
    { 
      key: "phone", 
      label: "Phone", 
      render: (value: string) => (
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Phone size={14} className="text-slate-400" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    { 
      key: "gst", 
      label: "GST Number", 
      render: (value: string) => (
        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-500 uppercase tracking-wider">
          {value}
        </span>
      )
    },
    { 
      key: "total_purchases", 
      label: "Total Purchases", 
      render: (value: number) => (
        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
          <ShoppingBag size={14} className="text-slate-400" />
          <span>₹{value.toLocaleString()}</span>
        </div>
      )
    },
    { 
      key: "outstanding", 
      label: "Outstanding Payment", 
      render: (value: number) => (
        <div className="flex items-center gap-1.5 font-black">
          <CreditCard size={14} className={value > 0 ? "text-orange-400" : "text-emerald-400"} />
          <span className={value > 0 ? "text-orange-600" : "text-emerald-600"}>
            ₹{value.toLocaleString()}
          </span>
        </div>
      )
    }
  ];
  const navigate = useNavigate();
  const handleRowClick = () =>{
    navigate("/supplier/detail")

  }

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex justify-between items-center">
        <Title title="Supplier Master" subtitle="Manage your permanent vendor relationships and accounts" />
        <GradientButton path="/supplier/add">
          + Add Supplier
        </GradientButton>
      </div>

      {/* 2. Main Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden flex flex-col">
        
        {/* Search Bar Container */}
        <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-slate-100 bg-white">
          <div className="w-full max-w-md">
            <Input
              leftIcon={<Search size={18} className="text-slate-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by vendor name or GST..."
            />
          </div>
          
          {selectedIds.length > 0 && (
            <button className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 transition-all active:scale-95 animate-in zoom-in duration-200">
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Reusable Table Container */}
        <div className="flex-1">
          <Table 
            columns={SUPPLIER_COLUMNS} 
            data={MOCK_SUPPLIERS} 
            rowKey="id" 
            selectedIds={selectedIds}
            onSelectionChange={(ids) => setSelectedIds(ids)}
            onRowClick={handleRowClick}
          />
        </div>

      </div>
    </div>
  );
};

export default Supplier;