import React, { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Package,
  PackageX,
  Upload,
  X,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Trash2,
  Edit,
  Layers,
  Tag,
  Calendar,
  MoreVertical,
  AlertCircle
} from "lucide-react";

import ProductHeader from "../components/ProductHeader";
import ImportExportFloatingCard from "@/components/common/ImportExportCard";
import SearchActionCard from "@/components/ui/SearchActionCard";
import Loader from "@/components/common/Loader";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { ProductRecord } from "@/types/api";
import { StatCard } from "@/components/common/StatsCard";

const STOCK_FILTERS = [
  { label: "High Stock", value: "HIGHSTOCK", icon: Package, color: "text-emerald-500", bg: "bg-emerald-50 ring-emerald-200" },
  { label: "Low Stock", value: "LOWSTOCK", icon: PackageX, color: "text-rose-500", bg: "bg-rose-50 ring-rose-200" },
  { label: "Out of Stock", value: "OUTOFSTOCK", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 ring-amber-200" },
];

// --- Helpers ---
const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStockStatus = (stock: number) => {
  const stockNum = Number(stock) || 0;
  if (stockNum <= 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50 border-red-200' };
  if (stockNum <= 15) return { label: 'Low Stock', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { label: 'In Stock', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
};

const formatCurrency = (amount?: any) => {
  if (amount === undefined || amount === null || amount === "—") return 'N/A';
  return `₹${Number(amount).toFixed(2)}`;
};

const ProductRow = ({ 
  item, 
  isExpanded, 
  toggleExpand,
  onEdit,
  onDelete
}: { 
  item: ProductRecord; 
  isExpanded: boolean; 
  toggleExpand: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const datas = (item.datas as any) || {};
  const combinations = datas.combinations || [];
  const hasVariants = datas.has_variants && combinations.length > 0;
  const stockCount = Number(datas.stocks ?? item.barcode ? 0 : 0); // Simplified stock check
  // Note: For inventory data, typically we'd have a stocks value
  const stockValue = Number(datas.stocks ?? 0);
  const stockStatus = getStockStatus(stockValue);

  return (
    <Fragment>
      <tr 
        onClick={() => hasVariants && toggleExpand(item.id)}
        className={`group border-b border-slate-100 hover:bg-slate-50 transition-colors ${hasVariants ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-slate-50' : 'bg-white'}`}
      >
        {/* Expand Icon */}
        <td className="p-4 text-center w-12">
          {hasVariants ? (
            <button className={`p-1 rounded-md transition-all ${isExpanded ? 'bg-blue-100 text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}`}>
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div className="flex justify-center text-slate-300">
              <Package size={18} />
            </div>
          )}
        </td>

        {/* Product Info */}
        <td className="p-4">
          <div className="flex flex-col gap-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-2">
              {datas.name || "N/A"}
              {hasVariants ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Layers size={10} /> Variant Product
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                  <Tag size={10} /> Standard Product
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.barcode || "N/A"}</span>
              <span>Brand: <span className="text-slate-700">{datas.brand || "N/A"}</span></span>
              <span>GST: <span className="text-slate-700">{datas.gst || "N/A"}</span></span>
            </div>
          </div>
        </td>

        {/* Category */}
        <td className="p-4">
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-800">{datas.category || "N/A"}</span>
            <span className="text-xs text-slate-500">{datas.supplier || "N/A"}</span>
          </div>
        </td>

        {/* Pricing */}
        <td className="p-4 text-right">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500 line-through text-xs">{formatCurrency(datas.buy_price)}</span>
            <span className="font-semibold text-slate-800">{formatCurrency(datas.sell_price)}</span>
          </div>
        </td>

        {/* Stock */}
        <td className="p-4 text-right">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${stockStatus.color}`}>
            {stockValue <= 0 && <AlertCircle size={12} />}
            {stockValue} {datas.unit || ''}
          </span>
        </td>

        {/* Actions */}
        <td className="p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Variant/Combination Rows */}
      {isExpanded && hasVariants && combinations.map((comb: any, index: number) => {
        const isLast = index === combinations.length - 1;
        const variantName = comb.attributes ? Object.values(comb.attributes).join(' / ') : 'N/A';
        const combStock = Number(comb.stock) || 0;
        const combStockStatus = getStockStatus(combStock);

        return (
          <tr key={comb.id || index} className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
            <td className="relative">
              <div className="absolute top-0 left-1/2 w-px bg-slate-300 h-full -ml-[0.5px]"></div>
              {isLast && <div className="absolute top-1/2 left-1/2 w-px bg-white h-1/2 -ml-[0.5px] z-10"></div>}
              <div className="absolute top-1/2 left-1/2 w-4 h-px bg-slate-300"></div>
            </td>
            
            <td className="p-3 pl-8" colSpan={1}>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">{variantName}</span>
                <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block w-max">
                  {comb.barcode || "N/A"}
                </span>
              </div>
            </td>
            
            <td className="p-3 text-sm text-slate-500 italic">Variant Combo</td>
            
            <td className="p-3 text-right text-sm font-medium text-slate-700">
              {comb.price ? formatCurrency(Number(comb.price)) : 'Matches Parent'}
            </td>
            
            <td className="p-3 text-right">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${combStockStatus.color}`}>
                {combStock}
              </span>
            </td>
            
            <td></td>
          </tr>
        );
      })}
    </Fragment>
  );
};

const Product = () => {
  const navigate = useNavigate();
  const { getData, deleteData, loading, error, clearError } = useApi();

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Note: We use INVENTORIES endpoint to get full variant/stock info
    getData(`${ENDPOINTS.INVENTORIES}?shop_id=${SHOP_ID}${searchQuery ? `&q=${searchQuery}` : ""}`).then((res) => {
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
    await deleteData(`${ENDPOINTS.INVENTORIES}/${id}`);
    setRefreshKey((k) => k + 1);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const activeFilterConfig = STOCK_FILTERS.find((f) => f.value === activeFilter);

  return (
    <div className="space-y-4 relative bg-slate-50 min-h-screen p-1 rounded-2xl">
      <ProductHeader />

      <div className="flex flex-wrap gap-3 mx-1">
        <StatCard 
          icon={Package} 
          label="Total Products" 
          value={products.length.toString()} 
        />
        <StatCard 
          icon={Layers} 
          label="Total Stock" 
          value={products.reduce((acc, p) => acc + Number((p.datas as any)?.stocks || 0), 0).toString()} 
          iconBg="bg-blue-50" iconColor="text-blue-600"
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Low Stock Items" 
          value={products.filter(p => {
            const stock = Number((p.datas as any)?.stocks || 0);
            return stock > 0 && stock <= 15;
          }).length.toString()} 
          iconBg="bg-amber-50" iconColor="text-amber-600"
        />
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mx-1">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      <div className="flex gap-3 relative px-1">
        <SearchActionCard
          searchValue={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by name, SKU or category…"
        />

        <div className="flex items-center gap-2 shrink-0">
          <div ref={filterRef} className="relative z-10">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border text-[13px] font-semibold bg-white border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 shadow-sm"
            >
              <SlidersHorizontal size={14} />
              {activeFilterConfig ? activeFilterConfig.label : "Filter"}
              <ChevronDown size={13} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 flex flex-col gap-1 overflow-hidden">
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
            className={`inline-flex items-center gap-2 h-11 px-4 rounded-xl border text-[13px] font-semibold transition-colors shadow-sm ${open ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {open ? <X size={14} /> : <Upload size={14} />}
            {open ? "Close" : "Import / Export"}
          </button>
        </div>

        {open && (
          <div className="absolute right-0 top-14 z-20 mr-1">
            <ImportExportFloatingCard
              onClose={() => setOpen(false)}
              onImport={(file) => { console.log("Imported:", file); setOpen(false); }}
              onExport={(type) => { console.log("Exporting:", type); setOpen(false); }}
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mx-1">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader /></div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">No products found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Category & Supplier</th>
                  <th className="p-4 text-right">Pricing (Buy/Sell)</th>
                  <th className="p-4 text-right">Stock</th>
                  <th className="p-4 w-12 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <ProductRow 
                    key={item.id} 
                    item={item} 
                    isExpanded={expandedRows.has(item.id)} 
                    toggleExpand={toggleExpand} 
                    onEdit={(id) => navigate(`/product/${id}/edit`)}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;
