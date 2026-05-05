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
import { useQuickCreate } from "@/features/common/QuickCreate/QuickCreateContext";

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
}

// --- Helpers ---
const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

// getStockStatus is used in VariantRows but defined there. 
// If it's unused here, we can remove it.

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null) return 'N/A';
  return `₹${Number(amount).toFixed(2)}`;
};

// --- Sub Components ---

const parseData = (val: any) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return []; }
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
    if (!(datas.has_variants || datas.has_varients) && item.variants && item.variants.length > 0) {
      raw = parseData(item.variants[0].batches);
    } else {
      raw = parseData(item.batches || datas.batches);
    }
    return raw.filter((b: any) => b && b.id !== null);
  }, [item.variants, item.batches, datas.batches, datas.has_variants, datas.has_varients]);

  const serials = parseData(datas.serial_numbers || item.serial_numbers);
  const variantTypes = datas.variantTypes || datas.variant_types || [];

  const hasVariants = (datas.has_variants || datas.has_varients) && combinations.length > 0;
  const hasBatches = batches.length > 0;
  const hasSerials = serials.length > 0;
  const isExpandable = hasVariants || hasBatches || hasSerials;

  const stockNumber = Number(item.stocks || 0);
  const stockLabel = `${stockNumber} ${datas.unit ? datas.unit.split(" ")[0] : "Units"}`;
  const stockStatusColor = stockNumber <= 0 
    ? "text-rose-600 bg-rose-50 border-rose-100" 
    : stockNumber <= 15 
      ? "text-amber-600 bg-amber-50 border-amber-100" 
      : "text-emerald-600 bg-emerald-50 border-emerald-100";
  
  const navigate = useNavigate();

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
      <span key="var" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100">
        <Layers size={10} className="stroke-[2.5]" /> {combinations.length} Variants
      </span>
    );
  }
  if (totalBatches > 0) {
    badges.push(
      <span key="batch" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100">
        <Calendar size={10} className="stroke-[2.5]" /> {totalBatches} Batches
      </span>
    );
  }
  if (totalSerials > 0) {
    badges.push(
      <span key="serial" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-100">
        <Hash size={10} className="stroke-[2.5]" /> {totalSerials} Serials
      </span>
    );
  }

  const visibleBadges = showAllBadges ? badges : badges.slice(0, 2);
  const remainingBadges = badges.length - 2;

  return (
    <Fragment>
      <tr
        onClick={() => isExpandable && toggleExpand(item.id)}
        className={`group transition-all ${isExpandable ? 'cursor-pointer' : ''} ${isExpanded ? "bg-blue-50/20" : "hover:bg-slate-50/50"}`}
      >
        <td className="px-8 py-5 text-center w-14">
          {isExpandable ? (
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isExpanded ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white border border-slate-200 text-slate-400 group-hover:border-blue-300 group-hover:text-blue-500 shadow-sm"}`}>
              {isExpanded ? <ChevronDown size={18} className="stroke-[3]" /> : <ChevronRight size={18} className="stroke-[3]" />}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto bg-slate-50 text-slate-300">
              <Package size={18} />
            </div>
          )}
        </td>

        <td className="px-6 py-5">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-100 shrink-0">
              {String(datas.name || item.name || "N")[0].toUpperCase()}
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[200px]">
                  {datas.name || item.name || "N/A"}
                </span>
                <div className="flex items-center gap-1.5">
                  {visibleBadges}
                  {!showAllBadges && remainingBadges > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAllBadges(true); }}
                      className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 transition-all"
                    >
                      +{remainingBadges}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span className="font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{item.barcode || "NO-SKU"}</span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span>{datas.brand || item.brand || "Generic"}</span>
              </div>
            </div>
          </div>
        </td>

        <td className="px-6 py-5">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{datas.category || item.category || "Uncategorized"}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{datas.supplier || item.supplier || "No Supplier"}</span>
          </div>
        </td>

        <td className="px-6 py-5 text-right">
          <span className="text-[13px] font-bold text-slate-400">{formatCurrency(item.buy_price)}</span>
        </td>
        <td className="px-6 py-5 text-right">
          <span className="text-[14px] font-black text-slate-800">{formatCurrency(item.sell_price)}</span>
        </td>

        <td className="px-6 py-5 text-right">
          <span className={`inline-flex px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-widest border shadow-sm ${stockStatusColor}`}>
            {stockLabel}
          </span>
        </td>

        <td className="px-6 py-5 text-right">
          <div className="flex flex-col items-end">
            <span className="text-[12px] font-bold text-slate-700">{formatDate(item.date)}</span>
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">System Entry</span>
          </div>
        </td>

        <td className="px-8 py-5 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${(item.id)}`); }}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 shadow-sm active:scale-95"
            title="View Details"
          >
            <Eye size={18} />
          </button>
        </td>
      </tr>

      {isExpanded && isExpandable && (
        <tr className="bg-blue-50/5">
          <td colSpan={8} className="px-0 py-0">
            <div className="pl-[104px] pr-8 py-8 border-l-[3px] border-blue-500/20 ml-12 space-y-6">
              
              {/* Product Overview (Description & Units) */}
              {(datas.description || item.description || datas.unit) && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info size={12} className="text-blue-400" /> Product Overview
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {datas.unit && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Stocking Unit</p>
                        <p className="text-xs font-black text-slate-700">{datas.unit}</p>
                      </div>
                    )}
                    {(datas.description || item.description) && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Description</p>
                        <p className="text-xs font-medium text-slate-600 line-clamp-2">{datas.description || item.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Variant Configuration (if any) */}
              {hasVariants && variantTypes.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Layers size={12} className="text-blue-400" /> Configuration Matrix
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {variantTypes.map((vt: any) => (
                      <div key={vt.id} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">{vt.name}</p>
                        <p className="text-xs font-black text-slate-700">{(vt.values as string[]).join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Root Serial Numbers (if any) */}
              {!hasVariants && !hasBatches && hasSerials && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Hash size={12} className="text-violet-400" /> Serial Number Tracking
                  </p>
                  <SerialBadgeList serials={serials} title={`Serials: ${datas.name || item.name}`} />
                </div>
              )}

              {/* Main Content Areas */}
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
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
  const [refreshKey, setRefreshKey] = useState(0);
  const { openQuickCreate } = useQuickCreate();

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest leading-none">Stock Levels</h1>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Inventory Management Console</p>
            </div>
          </div>
        </div>

        {/* SEARCH BAR - Super UI Style */}
        <div className="relative group w-full lg:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Package size={20} className="stroke-[2.5]" />
          </div>
          <input
            type="text"
            placeholder="Search SKU, name, or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-md focus:ring-8 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-bold text-sm text-slate-700 placeholder-slate-300"
          />
          <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
            <div className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-tighter shadow-inner">
              CTRL + K
            </div>
          </div>
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
          className="rounded-[2rem] border-slate-200 shadow-sm"
        />
        <StatCard
          icon={AlertCircle}
          label="Restock Alerts"
          value={stats.lowStock.toString()}
          subValue="Priority Items"
          iconBg="bg-amber-50" iconColor="text-amber-600"
          className="rounded-[2rem] border-slate-200 shadow-sm"
        />
        <StatCard
          icon={Tag}
          label="Category Count"
          value={new Set(inventory.map(i => i.datas?.category || i.category)).size.toString()}
          subValue="Active Tags"
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
          className="rounded-[2rem] border-slate-200 shadow-sm"
        />
        <StatCard
          icon={Hash}
          label="Total SKU Count"
          value={inventory.reduce((acc, curr) => acc + (curr.variants?.length || 1), 0).toString()}
          subValue="Unique Variants"
          iconBg="bg-violet-50" iconColor="text-violet-600"
          className="rounded-[2rem] border-slate-200 shadow-sm"
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

      {/* Main Table Card - Super UI High Density */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-transparent border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inventory Ledger</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time stock synchronization</p>
          </div>
          <div className="flex items-center gap-4">
            <GradientButton 
              onClick={() => openQuickCreate("PRODUCT", () => setRefreshKey(prev => prev + 1))}
              className="h-8 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100"
            >
              Add Product
            </GradientButton>
            <div className="hidden md:block px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-100">
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
                <tr className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-black">
                  <th className="px-8 py-6 w-14"></th>
                  <th className="px-6 py-6 min-w-[320px]">Product Identity</th>
                  <th className="px-6 py-6">Classification</th>
                  <th className="px-6 py-6 text-right">Costing</th>
                  <th className="px-6 py-6 text-right">Selling</th>
                  <th className="px-6 py-6 text-right">Inventory</th>
                  <th className="px-6 py-6 text-right">Updated</th>
                  <th className="px-8 py-6 w-12 text-center">Detail</th>
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