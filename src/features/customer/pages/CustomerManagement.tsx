/* ================= IMPORTS ================= */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircle,
  CreditCard,
  Clock,
  Upload,
  X,
  ChevronDown,
  SlidersHorizontal,
  Mail,
  Phone,
} from "lucide-react";

import Table from "@/components/common/Table";
import ImportExportFloatingCard from "@/components/common/ImportExportCard";
import SearchActionCard from "@/components/ui/SearchActionCard";
import CustomerHeader from "../components/Customerheader";

/* ================= TYPES ================= */
interface CustomerData {
  id: number;
  name: string;
  customer_id: string;
  email: string;
  phone: string;
  total_orders: number;
  outstanding_balance: number;
  credit_limit: number;
  status: "Clear" | "Pending" | "Overdue";
}

interface Column {
  key: keyof CustomerData;
  label: string;
  render?: (value: any, row: CustomerData) => React.ReactNode;
}

/* ================= MOCK DATA ================= */
const MOCK_CUSTOMERS: CustomerData[] = [
  {
    id: 1,
    name: "Arun Kumar",
    customer_id: "CUST-001",
    email: "arun@example.com",
    phone: "+91 98450 12345",
    total_orders: 12,
    outstanding_balance: 15400.00,
    credit_limit: 50000.00,
    status: "Overdue",
  },
  {
    id: 2,
    name: "Priya Sharma",
    customer_id: "CUST-002",
    email: "priya@sharma.in",
    phone: "+91 99001 22334",
    total_orders: 5,
    outstanding_balance: 0.00,
    credit_limit: 25000.00,
    status: "Clear",
  },
];

/* ================= TABLE COLUMNS ================= */
const CUSTOMER_COLUMNS: Column[] = [
  { key: "name", label: "Customer Name" },
  { key: "customer_id", label: "ID" },
  { 
    key: "email", 
    label: "Contact",
    render: (_, row) => (
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-slate-700 text-[13px]"><Mail size={12}/> {row.email}</span>
        <span className="flex items-center gap-1.5 text-slate-400 text-[11px]"><Phone size={11}/> {row.phone}</span>
      </div>
    )
  },
  {
    key: "outstanding_balance",
    label: "Balance",
    render: (value: number) => (
      <span className={`font-medium ${value > 0 ? "text-rose-600" : "text-emerald-600"}`}>
        ₹{value.toLocaleString("en-IN")}
      </span>
    ),
  },
  {
    key: "credit_limit",
    label: "Credit Limit",
    render: (value: number) => <span className="text-slate-600">₹{value.toLocaleString("en-IN")}</span>
  },
  {
    key: "status",
    label: "Status",
    render: (value: string) => {
      let style = "bg-emerald-50 text-emerald-600 ring-emerald-200";
      if (value === "Overdue") style = "bg-rose-50 text-rose-600 ring-rose-200";
      if (value === "Pending") style = "bg-amber-50 text-amber-600 ring-amber-200";

      return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 ${style}`}>
          {value}
        </span>
      );
    },
  },
];

/* ================= FILTER OPTIONS ================= */
const STATUS_FILTERS = [
  { label: "All Clear", value: "CLEAR", icon: UserCircle, color: "text-emerald-500", bg: "bg-emerald-50 ring-emerald-200" },
  { label: "Outstanding", value: "PENDING", icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50 ring-amber-200" },
  { label: "Overdue", value: "OVERDUE", icon: Clock, color: "text-rose-500", bg: "bg-rose-50 ring-rose-200" },
];

/* ================= MAIN COMPONENT ================= */
const CustomerManagement = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRowClick = () => navigate("/customer/detail");
  const activeFilterConfig = STATUS_FILTERS.find((f) => f.value === activeFilter);

  return (
    <div className="space-y-3 relative font-sans">
   <CustomerHeader/>

      <div className="flex gap-3 relative">
        <SearchActionCard
          searchValue={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, ID or phone number..."
        />
        
        <div className="flex items-center gap-2 shrink-0">
          <div ref={filterRef} className="relative z-10">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-[13px] font-medium bg-white border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
            >
              <SlidersHorizontal size={14} />
              {activeFilterConfig ? activeFilterConfig.label : "Filter Status"}
              <ChevronDown size={13} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1">
                {STATUS_FILTERS.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.value;
                  return (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setActiveFilter(isActive ? null : filter.value);
                        setFilterOpen(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
                        isActive ? `${filter.bg} ${filter.color} ring-1` : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <Icon size={16} className={isActive ? filter.color : "text-slate-400"} />
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-[13px] font-medium transition-colors ${
              open ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {open ? <X size={14} /> : <Upload size={14} />}
            {open ? "Close" : "Import / Export"}
          </button>
        </div>

        {open && (
          <div className="absolute right-0 top-12 z-20">
            <ImportExportFloatingCard
              onClose={() => setOpen(false)}
              onImport={(file) => console.log(file)}
              onExport={(type) => console.log(type)}
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <Table
          columns={CUSTOMER_COLUMNS}
          data={MOCK_CUSTOMERS}
          rowKey="id"
          onRowClick={handleRowClick}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default CustomerManagement;