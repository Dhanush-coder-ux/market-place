import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, Search, Filter, Bookmark, Trash2, Eye,
  ChevronDown, ChevronRight, Layers, AlertTriangle,
  X, AlertCircle, Calendar, Hash
} from "lucide-react";
import { VariantRows, BatchCards, SerialBadgeList } from "../../inventory/components/StockTree";
import { useHeader } from "@/context/HeaderContext";
import { useApi, useApiLoading } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { StatCard } from "@/components/common/StatsCard";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GradientButton } from "@/components/ui/GradientButton";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import Input from "@/components/ui/Input";
import Loader from "@/components/common/Loader";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { InventoryRecord } from "@/types/api";

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
  reorder_point: "Reorder Pt",
  status: "Stock Status",
};

const getColumnLabel = (key: string) => {
  if (columnLabels[key]) return columnLabels[key];
  return key.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const getStockStatus = (stock: number, reorderPoint?: number) => {
  const s = Number(stock) || 0;
  const rp = Number(reorderPoint) || 10;
  if (s <= 0) return { label: "Out of Stock", color: "text-rose-600 bg-rose-50 border-rose-200", icon: AlertCircle };
  if (s <= rp) return { label: "Low Stock", color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertTriangle };
  return { label: "In Stock", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: Package };
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
  p: InventoryRecord;
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
  selectedKeys: string[];
  formatCurrency: (amount?: number | string) => string;
  navigate: any;
  setProductToDelete: (p: InventoryRecord) => void;
  setIsDeleteDialogOpen: (val: boolean) => void;
}) => {
  const datas = (p.datas as any) || {};

  const extractSerials = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') {
      if (Array.isArray(val.serial_numbers)) return val.serial_numbers;
    }
    return [];
  };


  const combinations = useMemo(() => {
    return (p.variants || []).filter((v: any) => v && v.id !== null);
  }, [p.variants]);

  const batches = useMemo(() => {
    return (p.batches || []).filter((b: any) => b && b.id !== null);
  }, [p.batches]);

  const hasVariants = combinations.length > 0;
  const hasBatches = batches.length > 0;
  const hasSerials = extractSerials(p.serial_number).length > 0;
  const isExpandable = hasVariants || hasBatches || hasSerials;

  // --- Aggregation logic for badges ---
  const rootSerials = extractSerials(p.serial_number);
  const { totalSerials, totalBatches } = useMemo(() => {
    let ts = rootSerials.length;
    let tb = batches.length;

    if (hasVariants) {
      combinations.forEach((c: any) => {
        const cDatas = c.datas || {};
        const cSerials = extractSerials(c.serial_numbers || cDatas.serial_numbers || (cDatas.datas && cDatas.datas.serial_numbers));
        ts += cSerials.length;

        const cBatches = c.batches || [];
        tb += cBatches.length;

        cBatches.forEach((cb: any) => {
          const cbSerials = extractSerials(cb.serial_numbers || (cb.datas && cb.datas.serial_numbers));
          ts += cbSerials.length;
        });
      });
    }
    return { totalSerials: ts, totalBatches: tb };
  }, [rootSerials, batches, hasVariants, combinations]);

  const [showAllBadges, setShowAllBadges] = useState(false);

  const badges = [];
  if (hasVariants) {
    badges.push(
      <span key="var" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold   text-blue-600 bg-blue-50 border border-blue-100 whitespace-nowrap">
        <Layers size={10} /> {combinations.length} Variants
      </span>
    );
  }
  if (totalBatches > 0) {
    badges.push(
      <span key="batch" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold   text-indigo-600 bg-indigo-50 border border-indigo-100 whitespace-nowrap">
        <Calendar size={10} /> {totalBatches} Batches
      </span>
    );
  }
  if (totalSerials > 0) {
    badges.push(
      <span key="serial" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold   text-purple-600 bg-purple-50 border border-purple-100 whitespace-nowrap">
        <Hash size={10} /> {totalSerials} Serials
      </span>
    );
  }

  const visibleBadges = showAllBadges ? badges : badges.slice(0, 2);
  const remainingBadges = badges.length - 2;

  return (
    <Fragment key={p.id}>
      <tr
        className={`group md:transition-colors ${isExpanded ? "bg-slate-50/50" : "md:hover:bg-slate-50"}`}
        onClick={() => isExpandable ? toggleExpand(p.id) : navigate(`/product/${p.id}`)}
        style={{ cursor: "pointer" }}
      >
        <td className="px-4 py-4 text-center relative w-14">
          {/* Vertical Indicator Line */}
          {isExpanded && (
            <div className="absolute top-[50%] bottom-0 left-[27px] w-[1.5px] bg-blue-500/30 z-10" />
          )}

          {isExpandable ? (
            <div className={`w-7 h-7 mx-auto rounded-md flex items-center justify-center md:transition-all shadow-sm ${isExpanded ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-white border border-slate-200 text-slate-500 md:group-hover:bg-slate-50"}`}>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          ) : (
            <div className="w-7 h-7 mx-auto rounded-md flex items-center justify-center">
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
                <p className="text-[14px] sm:text-[15px] font-semibold text-slate-800 truncate">{p.name || "N/A"}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {visibleBadges}
                  {!showAllBadges && remainingBadges > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAllBadges(true); }}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold  bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      +{remainingBadges}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] text-slate-500 font-medium flex-wrap">
                <span className="font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  {p.barcode || datas.barcode || (p as any).sku || datas.sku || "No SKU"}
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-slate-700">{datas.brand || (p as any).brand || "N/A"}</span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-slate-700">GST: {datas.gst || (p as any).gst || "N/A"}</span>
              </div>
            </div>
          </div>
        </td>

        {selectedKeys.map(key => {
          const value = (datas[key] !== undefined && datas[key] !== null) ? datas[key] : (p as any)[key];

          if (key === "buy_price" || key === "sell_price" || key === "price") {
            return (
              <td key={key} className="px-6 py-4 whitespace-nowrap">
                <span className={`text-[13px] ${key === "sell_price" ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}>
                  {hasVariants ? "—" : formatCurrency(value)}
                </span>
              </td>
            );
          }

          if (key === "stocks" || key === "quantity") {
            return (
              <td key={key} className="px-6 py-4 whitespace-nowrap">
                <span className="text-[14px] font-black text-slate-800 tabular-nums">{value}</span>
              </td>
            );
          }

          if (key === "reorder_point") {
            return (
              <td key={key} className="px-6 py-4 whitespace-nowrap">
                <span className="text-[12px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  {value !== undefined && value !== null ? value : "—"}
                </span>
              </td>
            );
          }

          if (key === "status") {
            const stocks = datas.stocks !== undefined ? datas.stocks : (p as any).stocks;
            const reorderPoint = Number((p as any).reorder_point ?? datas.reorder_point ?? 0);
            const status = getStockStatus(stocks, reorderPoint);
            return (
              <td key={key} className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm w-fit ${status.color}`}>
                  <status.icon size={12} />
                  {status.label}
                </span>
              </td>
            );
          }

          if (key === "serial_number") {
            const sList = extractSerials(p.serial_number);
            if (sList.length === 0 && totalSerials > 0) {
              return (
                <td key={key} className="px-6 py-4 whitespace-nowrap">
                  <span className="text-[11px] font-bold text-slate-400   bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    See Variants
                  </span>
                </td>
              );
            }
            return (
              <td key={key} className="px-6 py-4 whitespace-nowrap">
                {sList.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-purple-50 text-purple-600 border border-purple-100">
                      {sList[0]}
                    </span>
                    {sList.length > 1 && (
                      <span className="text-[10px] font-bold text-purple-400">+{sList.length - 1}</span>
                    )}
                  </div>
                ) : <span className="text-slate-300">—</span>}
              </td>
            );
          }

          if (key === "category" || key === "supplier") {
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
            if (key === "supplier" && selectedKeys.includes("category")) return null;

            return (
              <td key={key} className="px-6 py-4 whitespace-nowrap">
                <span className="text-[13px] font-medium text-slate-600">{value || "—"}</span>
              </td>
            );
          }

          const renderValue = () => {
            if (value === undefined || value === null) return "—";
            if (value === "" && key !== "barcode") return "—";
            if (value === "" && key === "barcode") {
              const b = p.barcode || datas.barcode || (p as any).sku || datas.sku || "";
              return b || "—";
            }
            if (Array.isArray(value)) {
              if (value.length === 0) return "—";
              // Handle variant_types specifically
              if (typeof value[0] === 'object' && value[0].name) {
                return value.map((v: any) => v.name).join(", ");
              }
              return value.join(", ");
            }
            if (typeof value === 'object') {
              return JSON.stringify(value);
            }
            return String(value);
          };

          return (
            <td key={key} className="px-6 py-4 whitespace-nowrap">
              <span className="text-[13px] font-medium text-slate-600">{renderValue()}</span>
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
          <td colSpan={selectedKeys.length + 3} className="px-0 py-0 border-b border-slate-100 relative">
            {/* Vertical Route Indicator Line */}
            <div className="absolute top-0 bottom-0 left-[27px] w-[1.5px] bg-blue-500/30 z-10" />

            <div className="md:pl-[84px] pl-10 pr-6 py-6 space-y-6">
              {!hasVariants && rootSerials.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-100 p-4 shadow-sm relative">
                  {/* Horizontal connecting line */}
                  <div className="absolute top-8 left-[-18px] md:left-[-57px] w-4 md:w-[57px] h-[1.5px] bg-blue-500/30" />

                  <div className="flex items-center gap-2 mb-3">
                    <Hash size={12} className="text-violet-400" />
                    <span className="text-[10px] font-bold  text-slate-400 ">Serial Number Tracking</span>
                  </div>
                  <SerialBadgeList serials={rootSerials} title={`Serials: ${p.name}`} />
                </div>
              )}

              <div className="animate-in fade-in slide-in-from-top-4 duration-500 relative">
                {/* Horizontal connecting line for tree components */}
                <div className="absolute top-8 left-[-18px] md:left-[-57px] w-4 md:w-[57px] h-[1.5px] bg-blue-500/30" />

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
  const { getData, deleteData, error, clearError } = useApi();
  const loading = useApiLoading("products-list");
  const { showToast } = useToast();

  const [products, setProducts] = useState<InventoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InventoryRecord | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("product_table_columns");
    return saved ? JSON.parse(saved) : ["category", "sell_price", "stocks", "reorder_point", "status"];
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/product/drafts")}
          className="px-4 h-10 rounded-lg border border-blue-100 text-blue-600 font-semibold text-[13px] bg-blue-50/50 md:hover:bg-blue-100 md:transition-all flex items-center gap-2"
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

    getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}`, params).then((res) => {
      if (res) {
        const data: InventoryRecord[] = Array.isArray(res.data) ? res.data : [res.data];
        setProducts(data);

        const keys = new Set<string>();
        data.forEach((p: InventoryRecord) => {
          if (p.datas) {
            Object.keys(p.datas).forEach(k => {
              if (!["name", "id", "shop_id", "variantTypes", "is_active"].includes(k)) keys.add(k);
            });
          }
          keys.add("category");
          keys.add("sell_price");
          keys.add("buy_price");
          keys.add("stocks");
          keys.add("reorder_point");
          keys.add("status");
        });
        setAvailableKeys(Array.from(keys).sort());
      }
    });
  }, [refreshKey, searchTerm]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteData(`${ENDPOINTS.INVENTORIES}/${SHOP_ID}/${productToDelete.id}`);
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
      const name = String(p.name || "").toLowerCase();
      const sku = String(p.barcode || p.datas?.barcode || (p as any).sku || p.datas?.sku || "").toLowerCase();
      const category = String(p.category || "").toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || sku.includes(searchTerm.toLowerCase()) || category.includes(searchTerm.toLowerCase());
    });
  }, [products, searchTerm]);

  const totalStock = useMemo(() =>
    products.reduce((acc, p) => acc + Number(p.stocks || 0), 0),
    [products]
  );

  const lowStockCount = useMemo(() =>
    products.filter(p => {
      const stock = Number(p.stocks || 0);
      const rp = Number((p as any).reorder_point ?? p.datas?.reorder_point ?? 10);
      return stock <= rp;
    }).length,
    [products]
  );

  return (
    <div className="space-y-6 md:animate-in md:fade-in md:duration-500">
      {/* Stats */}
      <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-3 pb-2 -mx-2 px-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 touch-pan-x">
        <StatCard
          label="Total Products"
          value={products.length.toString()}
          icon={Package}
          className="rounded-lg border-slate-200 shadow-sm"
        />
        <StatCard
          label="Total Stock"
          value={totalStock.toString()}
          icon={Layers}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          className="rounded-lg border-slate-200 shadow-sm"
        />
        <StatCard
          label="Low Stock Items"
          value={lowStockCount.toString()}
          icon={AlertTriangle}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          className="rounded-lg border-slate-200 shadow-sm"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between md:animate-in md:fade-in">
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
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto h-[calc(100vh-220px)] pf-scroll">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm">
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold  ">
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
            <tbody className="divide-y divide-slate-100 performance-list">
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

