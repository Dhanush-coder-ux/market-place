import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, Search, Filter, Bookmark, Trash2, Edit3, Eye,
  ChevronDown, ChevronRight, Layers, Tag, AlertTriangle,
  X, AlertCircle, Calendar, Hash
} from "lucide-react";
import { VariantRows, BatchCards } from "../../inventory/components/StockTree";
import { useHeader } from "@/context/HeaderContext";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { StatCard } from "@/components/common/StatsCard";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GradientButton } from "@/components/ui/GradientButton";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import Input from "@/components/ui/Input";
import Loader from "@/components/common/Loader";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { ProductRecord } from "@/types/api";

const formatCurrency = (amount?: any) => {
  if (amount === undefined || amount === null || amount === "—") return "N/A";
  const num = Number(amount);
  if (isNaN(num)) return amount;
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const columnLabels: Record<string, string> = {
  barcode: "SKU / Barcode",
  buy_price: "Buy Price",
  sell_price: "Sell Price",
  stocks: "Stock",
  category: "Category",
  unit: "Unit",
  brand: "Brand",
  supplier: "Supplier",
  serial_number: "Serial Number",
  hsn_code: "HSN Code",
};

const getColumnLabel = (key: string) => {
  if (columnLabels[key]) return columnLabels[key];
  return key.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const getStockStatus = (stock: number) => {
  const s = Number(stock) || 0;
  if (s <= 0) return { label: "0 In Stock", color: "text-rose-600 bg-rose-50 border-rose-200" };
  if (s <= 15) return { label: `${s} Low Stock`, color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: `${s} In Stock`, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
};

/* ─── Product Row Component ────────────────────────────────────────────────── */
const ProductRow = React.memo(({ 
  p, 
  isExpanded, 
  toggleExpand,
  selectedKeys,
  formatCurrency,
  navigate,
  setProductToDelete,
  setIsDeleteDialogOpen
}: { 
  p: ProductRecord; 
  isExpanded: boolean; 
  toggleExpand: (id: string) => void;
  selectedKeys: string[];
  formatCurrency: (amount?: number | string) => string;
  navigate: any;
  setProductToDelete: (p: ProductRecord) => void;
  setIsDeleteDialogOpen: (val: boolean) => void;
}) => {
  const datas = (p.datas as any) || {};
  
  const parseData = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return [];
  };

  const combinations = parseData(p.variants || datas.combinations || datas.variants);
  const batches = parseData(p.batches || datas.batches);
  const hasVariants = datas.has_variants && (combinations.length > 0);
  const hasBatches = batches.length > 0;
  const isExpandable = hasVariants || hasBatches;
  
  // --- Aggregation logic for badges ---
  const serials = parseData(datas.serial_numbers || (p as any).serial_numbers);
  let totalSerials = serials.length;
  let totalBatches = batches.length;

  if (hasVariants) {
    combinations.forEach((c: any) => {
      const cDatas = c.datas || {};
      const cSerials = parseData(cDatas.serial_numbers || c.serial_numbers);
      totalSerials += cSerials.length;
      
      const cBatches = parseData(c.batches);
      totalBatches += cBatches.length;
    });
  }

  const [showAllBadges, setShowAllBadges] = useState(false);

  const badges = [];
  if (hasVariants) {
    badges.push(
      <span key="var" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 whitespace-nowrap">
        <Layers size={10} /> {combinations.length} Variants
      </span>
    );
  }
  if (totalBatches > 0) {
    badges.push(
      <span key="batch" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 whitespace-nowrap">
        <Calendar size={10} /> {totalBatches} Batches
      </span>
    );
  }
  if (totalSerials > 0) {
    badges.push(
      <span key="serial" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 border border-purple-100 whitespace-nowrap">
        <Hash size={10} /> {totalSerials} Serials
      </span>
    );
  }
  if (badges.length === 0) {
    badges.push(
      <span key="std" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-200 whitespace-nowrap">
        <Tag size={10} /> Standard
      </span>
    );
  }

  const visibleBadges = showAllBadges ? badges : badges.slice(0, 2);
  const remainingBadges = badges.length - 2;

  return (
    <Fragment key={p.id}>
      <tr
        className={`group md:transition-colors ${isExpanded ? "bg-slate-50/30" : "md:hover:bg-slate-50"}`}
        onClick={() => isExpandable ? toggleExpand(p.id) : navigate(`/product/${p.id}`)}
        style={{ cursor: "pointer" }}
      >
        <td className="px-4 py-4 text-center">
          {isExpandable ? (
            <div className={`w-7 h-7 rounded-md flex items-center justify-center md:transition-all shadow-sm ${isExpanded ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-white border border-slate-200 text-slate-500 md:group-hover:bg-slate-50"}`}>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          ) : (
            <div className="w-7 h-7 rounded-md flex items-center justify-center">
              <Package size={16} className="text-slate-300" />
            </div>
          )}
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-base font-semibold shadow-sm shrink-0">
              {String(datas.name || (p as any).name || "?")[0].toUpperCase()}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[14px] sm:text-[15px] font-semibold text-slate-800 truncate">{datas.name || (p as any).name || "N/A"}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {visibleBadges}
                  {!showAllBadges && remainingBadges > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAllBadges(true); }}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      +{remainingBadges} more
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] text-slate-500 font-medium flex-wrap">
                <span className="font-mono text-slate-500">{p.barcode || "No SKU"}</span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                   <span className="sm:hidden">Brand: </span>
                   <span className="text-slate-700">{datas.brand || (p as any).brand || "N/A"}</span>
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                   <span className="sm:hidden">GST: </span>
                   <span className="text-slate-700">{datas.gst || (p as any).gst || "N/A"}</span>
                </span>
              </div>
            </div>
          </div>
        </td>

        {selectedKeys.map(key => {
          const value = datas[key] !== undefined ? datas[key] : (p as any)[key];
          
          if (key === "buy_price" || key === "sell_price" || key === "price") {
            return (
              <td key={key} className="px-6 py-4 whitespace-nowrap">
                <span className={`text-[13px] ${key === "sell_price" ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}>
                  {formatCurrency(value)}
                </span>
              </td>
            );
          }
          
          if (key === "stocks" || key === "quantity") {
            const status = getStockStatus(value);
            return (
              <td key={key} className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-3 py-1 rounded-md text-[12px] font-medium border ${status.color}`}>
                  {status.label}
                </span>
              </td>
            );
          }

          if (key === "category" || key === "supplier") {
            // Only render once if both are selected, but we need to handle the loop
            if (key === "category" && selectedKeys.includes("supplier")) {
               return (
                <td key="cat_sup" className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-medium text-slate-800">{datas.category || (p as any).category || "N/A"}</span>
                    <span className="text-[12px] text-slate-500 font-medium">{datas.supplier || (p as any).supplier || "N/A"}</span>
                  </div>
                </td>
               );
            }
            if (key === "supplier" && selectedKeys.includes("category")) return null; // Skip supplier if category handled it
            
            return (
              <td key={key} className="px-6 py-4 whitespace-nowrap">
                <span className="text-[13px] font-medium text-slate-600">{value || "—"}</span>
              </td>
            );
          }

          return (
            <td key={key} className="px-6 py-4 whitespace-nowrap">
              <span className="text-[13px] font-medium text-slate-600">{value || "—"}</span>
            </td>
          );
        })}

        <td className="px-6 py-4 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/product/${p.id}`); }}
              className="p-2 text-slate-400 md:hover:text-blue-600 md:hover:bg-blue-50 rounded-lg md:transition-colors border border-transparent md:hover:border-blue-100"
              title="View Detail"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/product/${p.id}/edit`); }}
              className="p-2 text-slate-400 md:hover:text-blue-600 md:hover:bg-blue-50 rounded-lg md:transition-colors border border-transparent md:hover:border-blue-100"
              title="Edit Product"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setProductToDelete(p); setIsDeleteDialogOpen(true); }}
              className="p-2 text-slate-400 md:hover:text-rose-600 md:hover:bg-rose-50 rounded-lg md:transition-colors border border-transparent md:hover:border-rose-100"
              title="Delete Product"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>

      {/* EXPANDED TREE AREA */}
      {isExpanded && (
        <tr key={`${p.id}-expand`} className="bg-slate-50/20">
          <td colSpan={selectedKeys.length + 3} className="px-0 py-0 border-b border-slate-100">
            {/* Responsive padding: large on desktop to align with text, small on mobile to save space */}
            <div className="md:pl-[88px] pl-4 pr-4 sm:pr-6 py-2">
              {hasVariants && (
                <VariantRows
                  combinations={combinations}
                  baseSellPrice={datas.sell_price || (p as any).sell_price}
                  baseBuyPrice={datas.buy_price || (p as any).buy_price}
                />
              )}
              {!hasVariants && hasBatches && (
                <BatchCards batches={batches} />
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
});

/* ─── Main ProductInfos ───────────────────────────────────────────────────── */
const ProductInfos = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData, deleteData, loading, error, clearError } = useApi();
  const { showToast } = useToast();

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("product_table_columns");
    return saved ? JSON.parse(saved) : ["category", "sell_price", "stocks"];
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate("/product/drafts")}
          className="px-4 h-10 rounded-xl border border-blue-100 text-blue-600 font-semibold text-[13px] bg-blue-50/50 md:hover:bg-blue-100 md:transition-all flex items-center gap-2"
        >
          <Bookmark size={16} />
          Saved Drafts
        </button>
        <GradientButton path="/product/add" className="h-10 flex items-center px-5 text-sm shadow-sm rounded-lg">
          + Add Product
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const params: Record<string, string> = { shop_id: SHOP_ID, limit: "100", offset: "1" };
    if (searchTerm) params.q = searchTerm;

    getData(ENDPOINTS.INVENTORIES, params).then((res) => {
      if (res) {
        const data: ProductRecord[] = Array.isArray(res.data) ? res.data : [res.data];
        setProducts(data);

        const keys = new Set<string>();
        data.forEach((p: ProductRecord) => {
          if (p.datas) {
            Object.keys(p.datas).forEach(k => {
              if (!["name", "id", "shop_id", "combinations", "variantTypes", "has_variants", "images", "description"].includes(k)) keys.add(k);
            });
          }
          Object.keys(p).forEach(k => {
            if (!["id", "shop_id", "barcode", "name", "datas", "created_at", "updated_at"].includes(k)) keys.add(k);
          });
        });
        setAvailableKeys(Array.from(keys).sort());
      }
    });
  }, [refreshKey, searchTerm]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteData(`${ENDPOINTS.INVENTORIES}/${productToDelete.id}/${SHOP_ID}`);
      showToast("Product deleted successfully", "success");
      setRefreshKey((prev: number) => prev + 1);
    } catch {
      showToast("Failed to delete product", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const toggleExpand = (id: string) => {
    const n = new Set(expandedRows);
    if (n.has(id)) n.delete(id); else n.add(id);
    setExpandedRows(n);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const name = String((p.datas as any)?.name || (p as any).name || "").toLowerCase();
      const sku = String(p.barcode || "").toLowerCase();
      const category = String((p.datas as any)?.category || "").toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || sku.includes(searchTerm.toLowerCase()) || category.includes(searchTerm.toLowerCase());
    });
  }, [products, searchTerm]);

  const totalStock = useMemo(() => 
    products.reduce((acc, p) => acc + Number((p.datas as any)?.stocks || 0), 0), 
    [products]
  );

  const lowStockCount = useMemo(() => 
    products.filter(p => Number((p.datas as any)?.stocks || 0) <= 15).length, 
    [products]
  );

  return (
    <div className="space-y-6 md:animate-in md:fade-in md:duration-500">
      {/* Stats */}
      <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-3 pb-2 -mx-2 px-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 touch-pan-x">
        <StatCard label="Total Products" value={products.length} icon={Package} />
        <StatCard 
          label="Total Stock" 
          value={totalStock}
          icon={Layers} 
          iconBg="bg-blue-50" 
          iconColor="text-blue-700" 
        />
        <StatCard 
          label="Low Stock Items" 
          value={lowStockCount}
          icon={AlertTriangle} 
          iconBg="bg-rose-50" 
          iconColor="text-rose-700" 
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Input
              leftIcon={<Search size={16} className="text-slate-400" />}
              type="text"
              placeholder="Search products by name, SKU or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-sm rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
          <ColumnPicker
            availableKeys={availableKeys}
            selectedKeys={selectedKeys}
            onApply={setSelectedKeys}
            storageKey="product_table_columns"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-lg bg-white text-slate-500 border border-slate-200 md:hover:bg-slate-50 md:transition-all shadow-sm">
            <Filter size={16} />
          </button>
          <ReusableSelect
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
            options={[
              { label: "All Stock Levels", value: "All" },
              { label: "In Stock", value: "In Stock" },
              { label: "Low Stock", value: "Low Stock" },
              { label: "Out of Stock", value: "Out of Stock" },
            ]}
            placeholder="Filter"
            className="w-48 h-10 text-sm rounded-lg"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between md:animate-in md:fade-in">
          <div className="flex items-center gap-3 text-rose-700">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button onClick={clearError} className="p-1 md:hover:bg-rose-100 rounded-lg md:transition-colors text-rose-500">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-6 py-4 w-14 text-center"></th>
                <th className="px-6 py-4 whitespace-nowrap w-full min-w-[260px]">Product Details</th>
                {selectedKeys.map(key => {
                  if (key === "category" && selectedKeys.includes("supplier")) {
                    return <th key="cat_sup" className="px-6 py-4 whitespace-nowrap">Category & Supplier</th>;
                  }
                  if (key === "supplier" && selectedKeys.includes("category")) return null;
                  return <th key={key} className="px-6 py-4 whitespace-nowrap">{getColumnLabel(key)}</th>;
                })}
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={selectedKeys.length + 3} className="py-16 text-center"><Loader /></td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={selectedKeys.length + 3} className="py-16 text-center text-slate-500 text-sm">No products matching your search.</td></tr>
                ) : (
                  filteredProducts.map((p) => (
                    <ProductRow
                      key={p.id}
                      p={p}
                      isExpanded={expandedRows.has(p.id)}
                      toggleExpand={toggleExpand}
                      selectedKeys={selectedKeys}
                      formatCurrency={formatCurrency}
                      navigate={navigate}
                      setProductToDelete={setProductToDelete}
                      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove Product"
        description={`This action cannot be undone. This will permanently remove the product and all associated data.`}
        confirmText="Remove Product"
        type="danger"
      />
    </div>
  );
};

export default ProductInfos;