import React, { useState, useEffect, Fragment, useMemo, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Package,
  AlertCircle,
  Tag,
  Calendar,
  X,
  Eye,
  Hash,
  Info
} from "lucide-react";
import { VariantRows, BatchCards, SerialBadgeList } from "../components/StockTree";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import { StatCard } from "@/components/common/StatsCard";
import { useNavigate } from "react-router-dom";
import { GradientButton } from "@/components/ui/GradientButton";

// --- Types based on your exact API response ---
export interface VariantAttribute {
  [key: string]: string; // e.g., { "Size": "XXL", "Color": "Pink" }
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

// --- Helpers ---
const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStockStatus = (stock: number) => {
  const s = Number(stock) || 0;
  if (s <= 0) return { label: "0 In Stock", color: "text-rose-600 bg-rose-50 border-rose-200" };
  if (s <= 15) return { label: `${s} Low Stock`, color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: `${s} In Stock`, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
};

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null) return 'N/A';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// --- Sub Components ---

const parseData = (val: any) => {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') {
    if (Array.isArray(val.serial_numbers)) return val.serial_numbers;
    return val;
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.serial_numbers)) return parsed.serial_numbers;
      return parsed;
    } catch (e) { return []; }
  }
  return [];
};

const ProductRow = React.memo(({
  item,
  isExpanded,
  toggleExpand
}: {
  item: InventoryItem;
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
}) => {
  const datas = item.datas || {};
  
  const combinations = useMemo(() => {
    const raw = parseData(item.variants || datas.combinations || datas.variants);
    return raw.filter((v: any) => v && v.id !== null);
  }, [item.variants, datas.combinations, datas.variants]);

  const batches = useMemo(() => {
    let raw: any[] = [];
    if (!(datas.has_variants || datas.has_varients || item.variants?.length) && item.variants && item.variants.length > 0) {
      raw = parseData(item.variants[0].batches);
    } else {
      raw = parseData(item.batches || datas.batches);
    }
    return raw.filter((b: any) => b && b.id !== null);
  }, [item.variants, item.batches, datas.batches, datas.has_variants, datas.has_varients]);

  const serials = parseData(datas.serial_numbers || item.serial_numbers || item.serial_number);
  const variantTypes = datas.variantTypes || datas.variant_types || [];

  const hasVariants = (datas.has_variants || datas.has_varients || (item as any).has_variant) && combinations.length > 0;
  const hasBatches = (batches.length > 0 || (item as any).has_batch);
  const hasSerials = (serials.length > 0 || (item as any).has_serialno);
  const isExpandable = hasVariants || hasBatches || hasSerials;

  const stockNumber = Number(item.stocks || 0);
  const stockLabel = `${stockNumber} ${datas.unit ? datas.unit.split(" ")[0] : "Units"}`;
  const status = getStockStatus(stockNumber);
  
  const navigate = useNavigate();

  let totalSerials = serials.length;
  let totalBatches = batches.length;

  if (hasVariants) {
    combinations.forEach((c: any) => {
      const cDatas = c.datas || {};
      const cSerials = parseData(cDatas.serial_numbers || c.serial_numbers || (cDatas.datas && cDatas.datas.serial_numbers));
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

  const visibleBadges = showAllBadges ? badges : badges.slice(0, 2);
  const remainingBadges = badges.length - 2;

  return (
    <Fragment>
      <tr
        onClick={() => isExpandable && toggleExpand(item.id)}
        className={`group md:transition-colors ${isExpandable ? "cursor-pointer" : ""} ${isExpanded ? "bg-slate-50/50" : "md:hover:bg-slate-50"}`}
      >
        <td className="px-4 py-4 text-center w-14 relative">
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

        <td className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-base font-semibold shadow-sm shrink-0">
              {String(datas.name || item.name || "N")[0].toUpperCase()}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[14px] sm:text-[15px] font-semibold text-slate-800 truncate">
                  {datas.name || item.name || "N/A"}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {visibleBadges}
                  {!showAllBadges && remainingBadges > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAllBadges(true); }}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      +{remainingBadges}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] text-slate-500 font-medium flex-wrap">
                <span className="font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  {item.barcode || "NO-SKU"}
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-slate-700">{datas.brand || item.brand || "Generic"}</span>
              </div>
            </div>
          </div>
        </td>

        <td className="px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-medium text-slate-800">{datas.category || item.category || "Uncategorized"}</span>
            <span className="text-[12px] text-slate-500 font-medium">{datas.supplier || item.supplier || "No Supplier"}</span>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          {serials.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-violet-50 text-violet-600 border border-violet-100">
                {serials[0]}
              </span>
              {serials.length > 1 && (
                <span className="text-[10px] font-bold text-violet-400">+{serials.length - 1}</span>
              )}
            </div>
          ) : totalSerials > 0 ? (
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              See Variants
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>

        <td className="px-6 py-4 text-right">
          <span className="text-[13px] font-medium text-slate-400">{formatCurrency(item.buy_price)}</span>
        </td>
        <td className="px-6 py-4 text-right">
          <span className="text-[14px] font-semibold text-slate-800">{formatCurrency(item.sell_price)}</span>
        </td>

        <td className="px-6 py-4 text-right">
          <span className={`inline-flex px-3 py-1 rounded-md text-[12px] font-medium border ${status.color}`}>
            {status.label}
          </span>
        </td>

        <td className="px-6 py-4 text-right">
          <div className="flex flex-col items-end">
            <span className="text-[12px] font-medium text-slate-700">{formatDate(item.date || (item as any).updated_at)}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">System Entry</span>
          </div>
        </td>

        <td className="px-8 py-4 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${(item.id)}`); }}
            className="p-2 text-slate-400 md:hover:text-blue-600 md:hover:bg-blue-50 rounded-lg md:transition-colors border border-transparent md:hover:border-blue-100"
            title="View Details"
          >
            <Eye size={18} />
          </button>
        </td>
      </tr>

      {isExpanded && isExpandable && (
        <tr className="bg-slate-50/20">
          <td colSpan={8} className="px-0 py-0 relative">
            {/* Vertical Route Indicator Line */}
            <div className="absolute top-0 bottom-0 left-[27px] w-[1.5px] bg-blue-500/30 z-10" />
            
            <div className="md:pl-[84px] pl-10 pr-6 py-6 space-y-6">
              {/* Product Overview (Description & Units) */}
              {(datas.description || item.description || datas.unit) && (
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm relative">
                   {/* Horizontal connecting line */}
                  <div className="absolute top-8 left-[-18px] md:left-[-57px] w-4 md:w-[57px] h-[1.5px] bg-blue-500/30" />
                  
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info size={12} className="text-blue-400" /> Product Overview
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {datas.unit && (
                      <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Stocking Unit</p>
                        <p className="text-xs font-bold text-slate-700">{datas.unit}</p>
                      </div>
                    )}
                    {(datas.description || item.description) && (
                      <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Description</p>
                        <p className="text-xs font-medium text-slate-600 line-clamp-2">{datas.description || item.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Variant Configuration (if any) */}
              {hasVariants && variantTypes.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm relative">
                  {/* Horizontal connecting line */}
                  <div className="absolute top-8 left-[-18px] md:left-[-57px] w-4 md:w-[57px] h-[1.5px] bg-blue-500/30" />

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Layers size={12} className="text-blue-400" /> Configuration Matrix
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {variantTypes.map((vt: any) => (
                      <div key={vt.id} className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">{vt.name}</p>
                        <p className="text-xs font-bold text-slate-700">{(vt.values as string[]).join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Root Serial Numbers (if any) */}
              {!hasVariants && !hasBatches && hasSerials && (
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm relative">
                  {/* Horizontal connecting line */}
                  <div className="absolute top-8 left-[-18px] md:left-[-57px] w-4 md:w-[57px] h-[1.5px] bg-blue-500/30" />

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Hash size={12} className="text-violet-400" /> Serial Number Tracking
                  </p>
                  <SerialBadgeList serials={serials} title={`Serials: ${datas.name || item.name}`} />
                </div>
              )}

              {/* Main Content Areas */}
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 relative">
                 {/* Horizontal connecting line for tree components */}
                 <div className="absolute top-8 left-[-18px] md:left-[-57px] w-4 md:w-[57px] h-[1.5px] bg-blue-500/30" />
                 
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
});

// --- Main Component ---
const InventoryPage = () => {
  const { getData, loading, error, clearError } = useApi();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [refreshKey] = useState(0);

  useEffect(() => {
    getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}`).then((res: any) => {
      if (res && res.data) {
        setInventory(res.data);
      }
    });
  }, [refreshKey, getData]);

  // --- Optimized Filtering ---
  const filteredInventory = useMemo(() => {
    if (!searchQuery) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter(item =>
      item.barcode?.toLowerCase().includes(q) ||
      (item.datas?.name || item.name || "").toLowerCase().includes(q) ||
      (item.datas?.brand || item.brand || "").toLowerCase().includes(q) ||
      (item.datas?.category || item.category || "").toLowerCase().includes(q)
    );
  }, [inventory, searchQuery]);

  // --- Optimized Stats ---
  const stats = useMemo(() => {
    const total = filteredInventory.length;
    const lowStock = filteredInventory.filter((p: InventoryItem) => {
      const stock = Number(p.stocks || 0);
      return stock > 0 && stock <= 15;
    }).length;
    return { total, lowStock };
  }, [filteredInventory]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-8 bg-slate-50/50 min-h-screen p-2 sm:p-4 animate-in fade-in duration-700">

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Stock Levels</h1>
              <p className="text-[12px] text-slate-500 font-medium mt-1">Real-time inventory management console</p>
            </div>
          </div>
        </div>

        {/* SEARCH BAR - Refined Style */}
        <div className="relative w-full lg:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Package size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by SKU, name, or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm text-slate-700 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Package}
          label="Catalog Coverage"
          value={stats.total.toString()}
          subValue="Total Items"
          iconBg="bg-blue-50" iconColor="text-blue-600"
          className="rounded-xl border-slate-200 shadow-sm"
        />
        <StatCard
          icon={AlertCircle}
          label="Restock Alerts"
          value={stats.lowStock.toString()}
          subValue="Priority Items"
          iconBg="bg-amber-50" iconColor="text-amber-600"
          className="rounded-xl border-slate-200 shadow-sm"
        />
        <StatCard
          icon={Tag}
          label="Category Count"
          value={new Set(inventory.map(i => i.datas?.category || i.category)).size.toString()}
          subValue="Active Tags"
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
          className="rounded-xl border-slate-200 shadow-sm"
        />
        <StatCard
          icon={Hash}
          label="Total SKU Count"
          value={inventory.reduce((acc, curr) => acc + (curr.variants?.length || 1), 0).toString()}
          subValue="Unique Variants"
          iconBg="bg-violet-50" iconColor="text-violet-600"
          className="rounded-xl border-slate-200 shadow-sm"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-between p-5 bg-rose-50 border border-rose-100 rounded-[1.5rem] text-rose-700 text-xs font-black uppercase tracking-widest shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-rose-400 hover:text-rose-700 transition-colors p-2 hover:bg-white rounded-xl shadow-sm">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Table Card - Modern & Refined */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-transparent border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inventory Ledger</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time stock synchronization</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-100">
              Live Feed
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex justify-center"><Loader /></div>
        ) : inventory.length === 0 ? (
          <div className="p-32 text-center flex flex-col items-center justify-center bg-slate-50/20">
            <div className="w-20 h-20 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6 shadow-sm">
              <Package size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">No Inventory Records</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-[240px]">Start adding products to your catalog to track stock levels.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pf-scroll">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 w-14 text-center"></th>
                  <th className="px-6 py-6 min-w-[300px]">Product Identity</th>
                  <th className="px-6 py-6">Classification</th>
                  <th className="px-6 py-6">Serial Tracking</th>
                  <th className="px-6 py-6 text-right">Costing</th>
                  <th className="px-6 py-6 text-right">Selling</th>
                  <th className="px-6 py-6 text-right">Inventory</th>
                  <th className="px-6 py-6 text-right">Updated</th>
                  <th className="px-8 py-6 w-12 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInventory.map((item: InventoryItem) => (
                  <ProductRow
                    key={item.id}
                    item={item}
                    isExpanded={expandedRows.has(item.id)}
                    toggleExpand={toggleExpand}
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

export default InventoryPage;