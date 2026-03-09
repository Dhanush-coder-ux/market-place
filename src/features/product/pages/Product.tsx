/* ================= IMPORTS ================= */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Package,
  PackageX,
  Upload,
  X,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

import Table from "@/components/common/Table";
import ProductHeader from "../components/ProductHeader";
import ImportExportFloatingCard from "@/components/common/ImportExportCard";
import SearchActionCard from "@/components/ui/SearchActionCard";

import type { ProductData } from "../type";
import type { ReactNode } from "react";

/* ================= MOCK DATA ================= */
export const MOCK_PRODUCTS: ProductData[] = [
  {
    id: 1,
    name: "Mechanical Keyboard G915",
    sku: "KB-915-WL",
    category: "Peripherals",
    selling_price: 249.99,
    unit: "pcs",
    min_threshold: 5,
    default_supplier: "Logitech Logistics",
    avg_buying_cost: 180.0,
    current_stock: 12,
  },
  {
    id: 2,
    name: 'UltraWide Monitor 34"',
    sku: "MON-UW-34",
    category: "Displays",
    selling_price: 899.0,
    unit: "pcs",
    min_threshold: 3,
    default_supplier: "Samsung Global",
    avg_buying_cost: 650.5,
    current_stock: 2,
  },
];

/* ================= TABLE TYPES ================= */
interface Column {
  key: keyof ProductData;
  label: string;
  render?: (value: any, row: ProductData) => ReactNode;
}

/* ================= TABLE COLUMNS ================= */
const PRODUCT_COLUMNS: Column[] = [
  { key: "name", label: "Product Name" },
  { key: "sku", label: "SKU" },
  { key: "category", label: "Category" },
  {
    key: "selling_price",
    label: "Selling Price",
    render: (value: number) => (
      <span className="font-medium text-gray-900">
        ${value.toFixed(2)}
      </span>
    ),
  },
  { key: "unit", label: "Unit" },
  { key: "min_threshold", label: "Min Threshold" },
  {
    key: "avg_buying_cost",
    label: "Avg Buying Cost",
    render: (value: number) => (
      <span className="text-gray-700">
        ${value.toFixed(2)}
      </span>
    ),
  },
  {
    key: "current_stock",
    label: "Current Stock",
    render: (value: number, row: ProductData) => {
      const isOut = value === 0;
      const isLow = value > 0 && value <= row.min_threshold;

      let style = "bg-green-100 text-green-600";
      let text = `${value}`;

      if (isOut) {
        style = "bg-red-100 text-red-600";
        text = "Out";
      } else if (isLow) {
        style = "bg-yellow-100 text-yellow-600";
        text = `Low (${value})`;
      }

      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style}`}>
          {text}
        </span>
      );
    },
  },
  { key: "default_supplier", label: "Supplier" },
];

/* ================= STOCK FILTER OPTIONS ================= */
const STOCK_FILTERS = [
  {
    label: "High Stock",
    value: "HIGHSTOCK",
    icon: Package,
    color: "text-emerald-500",
    bg: "bg-emerald-50 ring-emerald-200",
  },
  {
    label: "Low Stock",
    value: "LOWSTOCK",
    icon: PackageX,
    color: "text-rose-500",
    bg: "bg-rose-50 ring-rose-200",
  },
  {
    label: "Out of Stock",
    value: "OUTOFSTOCK",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50 ring-amber-200",
  },
];

/* ================= MAIN COMPONENT ================= */
const Product = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filterRef = useRef<HTMLDivElement>(null);

  /* ================= CLOSE FILTER ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ================= HANDLERS ================= */
  const handleImport = (file: File) => {
    console.log("Imported:", file);
    setOpen(false); // Close modal on success
  };

  const handleExport = (type: "xlsx" | "docx") => {
    console.log("Exporting:", type);
    setOpen(false); // Close modal on success
  };

  const handleRowClick = () => {
    navigate("/product/detail");
  };

  // Find active filter to dynamically update the filter button label
  const activeFilterConfig = STOCK_FILTERS.find((f) => f.value === activeFilter);

  /* ================= UI ================= */
  return (
    <div className="space-y-3 relative">
      <ProductHeader />

      <div className="flex gap-3 relative">
        <SearchActionCard
          searchValue={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by name, SKU or category…"
        />
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Filter Dropdown */}
          <div ref={filterRef} className="relative z-10">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-[13px] font-semibold bg-white border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
            >
              <SlidersHorizontal size={14} />
              {activeFilterConfig ? activeFilterConfig.label : "Filter"}
              <ChevronDown size={13} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1">
                {STOCK_FILTERS.map((filter) => {
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
                        isActive 
                          ? `${filter.bg} ${filter.color} ring-1` 
                          : "hover:bg-slate-50 text-slate-700"
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

          {/* Import Export Toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-[13px] font-semibold transition-colors ${
              open ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {open ? <X size={14} /> : <Upload size={14} />}
            {open ? "Close" : "Import / Export"}
          </button>
        </div>

        {/* Import Export Card */}
        {open && (
          <div className="absolute right-0 top-12 z-20">
            <ImportExportFloatingCard
              onClose={() => setOpen(false)}
              onImport={handleImport}
              onExport={handleExport}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <Table
          columns={PRODUCT_COLUMNS}
          data={MOCK_PRODUCTS}
          rowKey="id"
          onRowClick={handleRowClick}
         pagination={{pageSize:1}}
        />
      </div>
    </div>
  );
};

export default Product;