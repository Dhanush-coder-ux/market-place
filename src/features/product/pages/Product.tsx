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
  Trash2,
} from "lucide-react";

import Table from "@/components/common/Table";
import ProductHeader from "../components/ProductHeader";
import ImportExportFloatingCard from "@/components/common/ImportExportCard";
import SearchActionCard from "@/components/ui/SearchActionCard";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { useInputBuilderContext } from "@/components/inputbuilders/context/InputBuilderContext";
import { ENDPOINTS } from "@/services/endpoints";
import type { ProductRecord } from "@/types/api";
import type { ReactNode } from "react";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
}

const STOCK_FILTERS = [
  { label: "High Stock", value: "HIGHSTOCK", icon: Package, color: "text-emerald-500", bg: "bg-emerald-50 ring-emerald-200" },
  { label: "Low Stock", value: "LOWSTOCK", icon: PackageX, color: "text-rose-500", bg: "bg-rose-50 ring-rose-200" },
  { label: "Out of Stock", value: "OUTOFSTOCK", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 ring-amber-200" },
];

const Product = () => {
  const navigate = useNavigate();
  const { getData, deleteData, loading, error, clearError } = useApi();
  const { fields, fetchProductFields } = useInputBuilderContext();

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProductFields();
  }, []);

  useEffect(() => {
    const params: Record<string, string> = { limit: "50", offset: "1" };
    if (searchQuery) params.q = searchQuery;
    getData(ENDPOINTS.PRODUCTS, params).then((res) => {
      if (res) setProducts(Array.isArray(res.data) ? res.data : [res.data]);
    });
  }, [refreshKey, searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await deleteData(`${ENDPOINTS.PRODUCTS}/${id}`);
    setRefreshKey((k) => k + 1);
  };

  const dynamicColumns: Column[] = fields
    ? Object.entries(fields)
        .filter(([, def]) => def.view_mode === "SHOW")
        .map(([fieldName, def]) => ({
          key: fieldName,
          label: def.label_name,
          render: (_: any, row: ProductRecord) => String(row.datas?.[fieldName] ?? "—"),
        }))
    : [
        { key: "barcode", label: "Barcode", render: (_: any, row: ProductRecord) => row.barcode },
        { key: "id", label: "ID", render: (_: any, row: ProductRecord) => row.id },
      ];

  const columns: Column[] = [
    ...dynamicColumns,
    {
      key: "_actions",
      label: "",
      render: (_: any, row: ProductRecord) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  const activeFilterConfig = STOCK_FILTERS.find((f) => f.value === activeFilter);

  return (
    <div className="space-y-3 relative">
      <ProductHeader />

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      <div className="flex gap-3 relative">
        <SearchActionCard
          searchValue={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by name, SKU or category…"
        />

        <div className="flex items-center gap-2 shrink-0">
          <div ref={filterRef} className="relative z-10">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-[13px] font-semibold bg-white border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
            >
              <SlidersHorizontal size={14} />
              {activeFilterConfig ? activeFilterConfig.label : "Filter"}
              <ChevronDown size={13} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1">
                {STOCK_FILTERS.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.value;
                  return (
                    <button
                      key={filter.value}
                      onClick={() => { setActiveFilter(isActive ? null : filter.value); setFilterOpen(false); }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${isActive ? `${filter.bg} ${filter.color} ring-1` : "hover:bg-slate-50 text-slate-700"}`}
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
            className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-[13px] font-semibold transition-colors ${open ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {open ? <X size={14} /> : <Upload size={14} />}
            {open ? "Close" : "Import / Export"}
          </button>
        </div>

        {open && (
          <div className="absolute right-0 top-12 z-20">
            <ImportExportFloatingCard
              onClose={() => setOpen(false)}
              onImport={(file) => { console.log("Imported:", file); setOpen(false); }}
              onExport={(type) => { console.log("Exporting:", type); setOpen(false); }}
            />
          </div>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <Table
          columns={columns}
          data={products}
          rowKey="id"
          onRowClick={(row) => navigate(`/product/${row.id}`)}
          pagination={{ pageSize: 20 }}
        />
      )}

      {!loading && products.length === 0 && !error && (
        <div className="text-center py-12 text-slate-500 text-sm">No products found.</div>
      )}
    </div>
  );
};

export default Product;
