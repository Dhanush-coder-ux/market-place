import React, { useState, useEffect, Fragment, useMemo, useCallback } from "react";
import {
  X,

  Hash,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  Calendar,
  Filter,
  Search,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  IndianRupee,
} from "lucide-react";
import { VariantRows, BatchCards, SerialBadgeList } from "../components/StockTree";
import { useApi } from "@/context/ApiContext";
import { useHeader } from "@/context/HeaderContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import { StatCard } from "@/components/common/StatsCard";
import { useNavigate, useLocation } from "react-router-dom";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";

// --- Types (unchanged) ---
export interface VariantAttribute {
  [key: string]: string;
}

export interface Combination {
  id: string;
  price: string | number;
  stock: string | number;
  active: boolean;
  barcode: string;
  attributes: VariantAttribute;
}

export interface VariantType {
  id: string;
  name: string;
  values: string[];
}

export interface ProductDatas {
  name?: string;
  category?: string;
  supplier?: string;
  brand?: string;
  gst?: string;
  barcode?: string;
  sku?: string;
  hsn?: string;
  mrp?: string;
  unit?: string;
  reorder_point?: string;
  serial_number?: string;
  description?: string;
  has_variants?: boolean;
  has_varients?: boolean;
  variantTypes?: VariantType[];
  variant_types?: any[];
  combinations?: Combination[];
  variants?: any[];
  serial_numbers?: string[];
  batches?: any[];
  images?: string[];
}

export interface InventoryItem {
  id: string;
  barcode: string;
  buy_price: number;
  sell_price: number;
  stocks: number;
  date: string;
  datas?: ProductDatas;
  variants?: any[];
  serial_numbers?: string[];
  batches?: any[];
  name?: string;
  brand?: string;
  category?: string;
  supplier?: string;
  description?: string;
  gst?: string;
  serial_number?: any;
}

// --- Helpers (unchanged logic) ---
const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStockStatus = (stock: number, reorderPoint?: number) => {
  const s = Number(stock) || 0;
  const rp = Number(reorderPoint) || 10;
  if (s <= 0)
    return {
      label: "Out of stock",
      color: "text-red-600 bg-red-50 border-red-100",
      dot: "bg-red-500",
      icon: AlertCircle,
    };
  if (s <= rp)
    return {
      label: "Low stock",
      color: "text-amber-600 bg-amber-50 border-amber-100",
      dot: "bg-amber-400",
      icon: AlertTriangle,
    };
  return {
    label: "In stock",
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    dot: "bg-emerald-500",
    icon: Package,
  };
};

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null) return "—";
  return `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const parseData = (val: any) => {
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") {
    if (Array.isArray(val.serial_numbers)) return val.serial_numbers;
    return val;
  }
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.serial_numbers)
      )
        return parsed.serial_numbers;
      return parsed;
    } catch (e) {
      return [];
    }
  }
  return [];
};


// --- Compact badge ---
const Pill = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "blue" | "purple" | "indigo";
}) => {
  const styles: Record<string, string> = {
    default: "text-slate-500 bg-slate-50 border-slate-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border leading-none ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

// --- Copy SKU Button with Micro-Animation ---
const CopySKUButton = ({ val }: { val: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center p-0.5 rounded transition-all duration-205 ${
        copied ? "text-emerald-500 bg-emerald-50" : "text-slate-350 hover:text-blue-600 hover:bg-slate-100/80"
      }`}
      title="Copy SKU"
    >
      {copied ? (
        <Check size={10} className="animate-in zoom-in duration-200" />
      ) : (
        <Copy size={10} className="transition-transform duration-200 active:scale-75" />
      )}
    </button>
  );
};

// --- Product Row ---
const ProductRow = React.memo(
  ({
    item,
    isSelected,
    onSelect,
    isExpanded,
    toggleExpand,
    innerRef,
  }: {
    item: InventoryItem;
    isSelected: boolean;
    onSelect: (item: InventoryItem) => void;
    isExpanded: boolean;
    toggleExpand: (id: string) => void;
    innerRef?: any;
  }) => {
    const datas = item.datas || {};

    const combinations = useMemo(() => {
      const raw = parseData(
        item.variants || datas.combinations || datas.variants
      );
      return raw.filter((v: any) => v && v.id !== null);
    }, [item.variants, datas.combinations, datas.variants]);

    const batches = useMemo(() => {
      let raw: any[] = [];
      if (
        !(datas.has_variants || datas.has_varients || item.variants?.length) &&
        item.variants &&
        item.variants.length > 0
      ) {
        raw = parseData(item.variants[0].batches);
      } else {
        raw = parseData(item.batches || datas.batches);
      }
      return raw.filter((b: any) => b && b.id !== null);
    }, [
      item.variants,
      item.batches,
      datas.batches,
      datas.has_variants,
      datas.has_varients,
    ]);

    const serials = parseData(
      datas.serial_numbers || item.serial_numbers || item.serial_number
    );

    const hasVariants =
      (datas.has_variants ||
        datas.has_varients ||
        (item as any).has_variant) &&
      combinations.length > 0;
    const hasBatches = batches.length > 0 || (item as any).has_batch;
    const hasSerials = serials.length > 0 || (item as any).has_serialno;
    const isExpandable = hasVariants || hasBatches || hasSerials;

    const stockNumber = Number(item.stocks || 0);
    const reorderPoint = Number(
      (item as any).reorder_point ?? datas.reorder_point ?? 0
    );
    const status = getStockStatus(stockNumber, reorderPoint);


    const { totalSerials, totalBatches } = useMemo(() => {
      let ts = serials.length;
      let tb = batches.length;
      if (hasVariants) {
        combinations.forEach((c: any) => {
          const cDatas = c.datas || {};
          const cSerials = parseData(
            cDatas.serial_numbers ||
              c.serial_numbers ||
              (cDatas.datas && cDatas.datas.serial_numbers)
          );
          ts += cSerials.length;
          const cBatches = parseData(c.batches);
          tb += cBatches.length;
        });
      }
      return { totalSerials: ts, totalBatches: tb };
    }, [serials, batches, hasVariants, combinations]);

    const [showAllBadges, setShowAllBadges] = useState(false);

    const badges = [];
    if (hasVariants) {
      badges.push(
        <Pill key="var" variant="blue">
          <Layers size={9} />
          {combinations.length} var
        </Pill>
      );
    }
    if (totalBatches > 0) {
      badges.push(
        <Pill key="batch" variant="indigo">
          <Calendar size={9} />
          {totalBatches} batch
        </Pill>
      );
    }
    if (totalSerials > 0) {
      badges.push(
        <Pill key="serial" variant="purple">
          <Hash size={9} />
          {totalSerials} serial
        </Pill>
      );
    }

    const visibleBadges = showAllBadges ? badges : badges.slice(0, 2);
    const remainingBadges = badges.length - 2;

    const productName = datas.name || item.name || "N/A";
    const initial = String(productName[0]).toUpperCase();

    return (
      <Fragment>
        <tr
          ref={innerRef}
          onClick={() => onSelect(item)}
          className={`group border-b border-slate-50 transition-colors cursor-pointer ${
            isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : isExpanded ? "bg-slate-50/70" : "hover:bg-slate-50/60"
          }`}
        >
          {/* Expand toggle */}
          <td className="px-3 py-2.5 text-center w-10">
            {isExpandable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(item.id);
                }}
                className={`w-5 h-5 mx-auto rounded flex items-center justify-center transition-colors ${
                  isExpanded
                    ? "bg-blue-600 text-white"
                    : "text-blue-300 hover:text-blue-500"
                }`}
              >
                {isExpanded ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </button>
            ) : (
              <div className="w-5 h-5 mx-auto flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-slate-200" />
              </div>
            )}
          </td>

          {/* Product identity */}
          <td className="px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-[11px] font-semibold shrink-0 select-none overflow-hidden">
                {datas.images && datas.images.length > 0 ? (
                  <img src={datas.images[0]} alt={productName} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[13px] font-medium text-slate-800 truncate leading-none">
                    {productName}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {visibleBadges}
                    {!showAllBadges && remainingBadges > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllBadges(true);
                        }}
                        className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        +{remainingBadges}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium leading-none">
                  {(() => {
                    const rawSku = item.barcode || datas.barcode || (item as any).sku || datas.sku || "";
                    if (!rawSku) {
                      return <span className="font-mono text-slate-400 tabular-nums">—</span>;
                    }
                    const trimmedSku = rawSku.length > 12 ? `${rawSku.slice(0, 8)}...` : rawSku;
                    const uiId = (item as any).ui_id || item.id || "";
                    return (
                      <span className="flex items-center gap-1">
                        <span className="font-mono text-slate-400 tabular-nums" title={uiId}>
                          ID: {uiId}
                        </span>
                        <span className="text-slate-200">·</span>
                        <span className="font-mono text-slate-400 tabular-nums" title={rawSku}>
                          {trimmedSku}
                        </span>
                        <CopySKUButton val={rawSku} />
                      </span>
                    );
                  })()}
                  <span className="text-slate-200">·</span>
                  <span>{datas.brand || item.brand || "Generic"}</span>
                </div>
              </div>
            </div>
          </td>

          {/* Category */}
          <td className="px-3 py-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-medium text-slate-700 leading-none">
                {datas.category || item.category || "Uncategorized"}
              </span>
              {(() => {
                const supplier = datas.supplier || item.supplier || "";
                if (!supplier || supplier.toLowerCase() === "no supplier") {
                  return null;
                }
                return (
                  <span className="text-[11px] text-slate-400 leading-none">
                    {supplier}
                  </span>
                );
              })()}
            </div>
          </td>

          {/* Serial tracking */}
          <td className="px-3 py-2.5">
            {serials.length > 0 ? (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-violet-50 text-violet-600 border border-violet-100 leading-none">
                  {serials[0]}
                </span>
                {serials.length > 1 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    +{serials.length - 1}
                  </span>
                )}
              </div>
            ) : totalSerials > 0 ? (
              <span className="text-[11px] text-slate-400">See variants</span>
            ) : (
              <span className="text-slate-200 text-sm">—</span>
            )}
          </td>


          {/* Unit */}
          <td className="px-3 py-2.5">
            <span className="text-[12px] font-medium text-slate-600">
              {datas.unit || (item as any).unit || "—"}
            </span>
          </td>

          

          {/* Buy price */}
          <td className="px-3 py-2.5 text-right">
            <span className="text-[13px] font-semibold text-slate-700 tabular-nums">
              {hasVariants ? "—" : formatCurrency(item.buy_price)}
            </span>
          </td>

          {/* Sell price */}
          <td className="px-3 py-2.5 text-right">
            <span className="text-[13px] font-semibold text-slate-700 tabular-nums">
              {hasVariants ? "—" : formatCurrency(item.sell_price)}
            </span>
          </td>

          {/* Stock */}
          <td className="px-3 py-2.5 text-right">
            <span className="text-[13px] font-semibold text-blue-600 tabular-nums">
              {stockNumber}
            </span>
          </td>

          {/* Status */}
          <td className="px-3 py-2.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border leading-none ${status.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </td>

          

          {/* Reorder point */}
          <td className="px-3 py-2.5 text-center">
            <span className="text-[13px] font-semibold text-slate-700 tabular-nums">
              {hasVariants ? "—" : (reorderPoint ?? "—")}
            </span>
          </td>

          {/* Updated */}
          <td className="px-3 py-2.5 text-right">
            <span className="text-[11px] text-slate-400 font-medium tabular-nums">
              {formatDate(item.date || (item as any).updated_at)}
            </span>
          </td>

          {/* Actions */}
          <td className="px-3 py-2.5 text-center">
            <ChevronRight size={14} className={`mx-auto transition-all duration-200 ${isSelected ? "text-blue-500 rotate-90" : "text-slate-300 group-hover:text-blue-500"}`} />
          </td>
        </tr>

        {/* Expanded row */}
        {isExpanded && isExpandable && (
          <tr className="bg-slate-50/40">
            <td colSpan={12} className="px-0 py-0">
              <div className="ml-10 mr-4 my-3 space-y-3 border-l border-slate-100 pl-6">



                {/* Serial numbers */}
                {!hasVariants && !hasBatches && hasSerials && (
                  <div className="bg-white border border-slate-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <Hash size={10} className="text-slate-400" />
                      Serial numbers
                    </p>
                    <SerialBadgeList
                      serials={serials}
                      title={`Serials: ${datas.name || item.name}`}
                    />
                  </div>
                )}

                {/* Variants / Batches */}
                <div className="animate-in fade-in duration-300">
                  {hasVariants && (
                    <VariantRows
                      combinations={combinations}
                      baseSellPrice={item.sell_price}
                      baseBuyPrice={item.buy_price}
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
  }
);

// --- Main Component ---
const InventoryPage = () => {
  const { getData, error, clearError } = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";
  const { setActions, setBottomActions } = useHeader();

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}
      </div>
    );
    return () => setActions(null);
  }, [setActions, isCleanMode]);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (selectedItem) {
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              <Package size={14} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">
                {selectedItem.datas?.name || selectedItem.name || "N/A"}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 font-mono">
                {selectedItem.barcode || selectedItem.datas?.barcode || (selectedItem as any).sku || selectedItem.datas?.sku || "No SKU"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedItem(null)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-semibold text-[11px] transition-colors"
            >
              Deselect
            </button>
            <button
              onClick={() => navigate(`/product/${selectedItem.id}`)}
              className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <ChevronRight size={13} />
              View Details
            </button>
          </div>
        </div>
      );
    } else {
      setBottomActions(null);
    }
  }, [selectedItem, setBottomActions, navigate]);
  
  const activeFiltersCount = [fromDate, toDate].filter(Boolean).length;
  
  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setSearchQuery("");
  };

  const fetchPage = useCallback(async (limit: number, offset: number, filters: any) => {
    const params: any = {
      is_active: "true",
      limit: limit.toString(),
      offset: offset.toString()
    };
    if (filters.search) params.search = filters.search;
    if (filters.fromDate) params.from_date = filters.fromDate;
    if (filters.toDate) params.to_date = filters.toDate;

    const res = await getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}`, params);
    
    let itemsRaw: any[] = [];
    let fetchedStats = null;
    let total = 0;
    
    if (res && res.data) {
      itemsRaw = Array.isArray(res.data) ? res.data : (res.data.inventories || res.data.datas || []);
      if (res.data.overall_stats) {
        fetchedStats = res.data.overall_stats;
      } else if (res.datas?.overall_stats) {
        fetchedStats = res.datas.overall_stats;
      }
      total = res.data.total_count || 0;
    }

    return {
      items: itemsRaw,
      hasMore: itemsRaw.length === limit,
      stats: fetchedStats,
      total
    };
  }, [getData]);

  const filters = useMemo(() => ({
    search: debouncedSearch,
    fromDate,
    toDate
  }), [debouncedSearch, fromDate, toDate]);

  const { items: inventory, loading, loadingMore, stats: overallStats, totalCount, lastElementRef } = useInfiniteScroll({
    fetchPage,
    filters,
    limit: 50
  });
  
  const filteredInventory = inventory;



  const stats = useMemo(() => {
    const total = filteredInventory.length;
    const lowStock = filteredInventory.filter((p: InventoryItem) => {
      const stock = Number(p.stocks || 0);
      const rp = Number(
        (p as any).reorder_point ?? p.datas?.reorder_point ?? 10
      );
      return stock <= rp;
    }).length;
    const categories = new Set(
      inventory.map((i) => i.datas?.category || i.category)
    ).size;
    const barcodes = inventory.reduce(
      (acc, curr) => acc + (curr.variants?.length || 1),
      0
    );
    return { total, lowStock, categories, barcodes };
  }, [filteredInventory, inventory]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full overflow-hidden relative">

      {/* Metric bar */}
      {!isCleanMode && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none mt-2">
          <StatCard
            icon={Package}
            label="Total Products"
            value={Math.max(Number(overallStats?.total_product_count || 0), stats.total).toString()}
            subValue="items"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={IndianRupee}
            label="Total Stock Value"
            value={(overallStats?.total_stock_value || 0).toLocaleString()}
            prefix="₹"
            subValue="inventory value"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={overallStats?.low_stocks_count?.toString() || stats.lowStock.toString()}
            subValue="priority"
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <StatCard
            icon={AlertCircle}
            label="Out of Stock"
            value={overallStats?.no_stocks_count?.toString() || (inventory.filter((p: InventoryItem) => Number(p.stocks || 0) === 0).length).toString()}
            subValue="items empty"
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[12px] font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-300 hover:text-red-500 transition-colors p-1 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-slate-100 rounded-lg p-2.5 px-3.5 flex flex-wrap items-center gap-2 shadow-sm mt-2">
        <div className="relative w-80 shrink-0">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name, barcode, category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
          />
        </div>
        <button 
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${activeFiltersCount > 0 ? "border-blue-200 text-blue-600 bg-blue-50/50" : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"}`}
        >
          <Filter size={13} />
          {activeFiltersCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
        </button>
        

        {searchQuery && (
          <span className="text-[11px] text-slate-400 font-medium ml-1 shrink-0">
            {filteredInventory.length} result
            {filteredInventory.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      
      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onClear={resetFilters}
        title="Inventory Filters"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">To</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
      </RightSidebarFilter>

      {/* Main table card */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">

        {/* Table */}
        {loading && inventory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader />
            <p className="text-sm font-medium mt-3">Loading inventory...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Package size={22} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-slate-600">
                No inventory records
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1 max-w-[200px] leading-relaxed">
                Add products to your catalog to start tracking stock.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap text-sm">

              {/* Sticky header */}
              <thead className="sticky top-0 z-20 bg-white border-b border-slate-100">
                <tr>
                  <th className="px-3 py-2.5 w-10" />
                  <th className="px-3 py-2.5 min-w-[280px] text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Serials
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Unit
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right">
                    Buy Price
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right">
                    Sell Price
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right">
                    Stock
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-center">
                    Reorder Point
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right">
                    Last updated
                  </th>
                  <th className="px-3 py-2.5 w-10 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y-0">
                {filteredInventory.map((item: InventoryItem, index) => (
                  <ProductRow
                    key={item.id}
                    item={item}
                    isSelected={selectedItem?.id === item.id}
                    onSelect={(prod) => setSelectedItem(prev => prev?.id === prod.id ? null : prod)}
                    isExpanded={expandedRows.has(item.id)}
                    toggleExpand={toggleExpand}
                    innerRef={index === filteredInventory.length - 1 ? lastElementRef : null}
                  />
                ))}
              </tbody>
            </table>
            {loadingMore && <div className="py-4 text-center text-xs text-slate-500">Loading more...</div>}

            {/* Empty search result */}
            {filteredInventory.length === 0 && searchQuery && (
              <div className="py-16 flex flex-col items-center gap-2 text-center">
                <Search size={18} className="text-slate-300" />
                <p className="text-[12px] font-medium text-slate-400">
                  No results for{" "}
                  <span className="text-slate-600">"{searchQuery}"</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer row count */}
        {!loading && inventory.length > 0 && (
          <div className="border-t border-slate-50 px-4 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {inventory.length} {totalCount > 0 ? `of ${totalCount}` : ''} item
              {inventory.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              {expandedRows.size > 0 && `${expandedRows.size} expanded`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;