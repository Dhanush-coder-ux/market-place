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
  Eye
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import { StatCard } from "@/components/common/StatsCard";
import { useNavigate } from "react-router-dom";

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
  variantTypes?: VariantType[];
  combinations?: Combination[];
}

export interface InventoryItem {
  id: string;
  barcode: string;
  buy_price: number;
  sell_price: number;
  stocks: number;
  date: string;
  datas?: ProductDatas;
}

// --- Helpers ---
const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStockStatus = (stock: number | string) => {
  const stockNum = Number(stock) || 0;
  if (stockNum <= 0) return { label: '0 In Stock', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  if (stockNum <= 15) return { label: `${stockNum} Low Stock`, color: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { label: `${stockNum} In Stock`, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
};

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null) return 'N/A';
  return `₹${Number(amount).toFixed(2)}`;
};

// --- Sub Components ---

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
  const hasVariants = datas.has_variants && datas.combinations && datas.combinations.length > 0;
  
  // Use explicit stock number to combine with units properly for the parent
  const stockNumber = Number(item.stocks || 0);
  const stockLabel = `${stockNumber} ${datas.unit ? `(${datas.unit.split(" ")[0]})` : ""}`;
  const stockStatusColor = stockNumber <= 0 ? "text-rose-600 bg-rose-50 border-rose-200" : stockNumber <= 15 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-emerald-600 bg-emerald-50 border-emerald-200";
  const navigate = useNavigate();
  return (
    <Fragment>
      <tr 
        onClick={() => hasVariants && toggleExpand(item.id)}
        className={`group transition-colors ${hasVariants ? 'cursor-pointer' : ''} ${isExpanded ? "bg-slate-50/30" : "hover:bg-slate-50"}`}
      >
        {/* Expand Icon */}
        <td className="px-6 py-4 text-center w-14">
          {hasVariants ? (
            <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-all shadow-sm mx-auto ${isExpanded ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-white border border-slate-200 text-slate-500 group-hover:bg-slate-50"}`}>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          ) : (
            <div className="w-7 h-7 rounded-md flex items-center justify-center mx-auto">
              <Package size={16} className="text-slate-300" />
            </div>
          )}
        </td>

        {/* Product Info */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-base font-semibold shadow-sm shrink-0">
              {String(datas.name || "N")[0].toUpperCase()}
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                {datas.name || "N/A"}
                {hasVariants ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100">
                    <Layers size={10} /> {datas.combinations?.length} Variants
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200">
                    <Tag size={10} /> Standard
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[12px] text-slate-500 font-medium">
                <span className="font-mono text-slate-500">{item.barcode || "No SKU"}</span>
                <span className="text-slate-300">•</span>
                <span>Brand: <span className="text-slate-700">{datas.brand || "N/A"}</span></span>
                <span className="text-slate-300">•</span>
                <span>GST: <span className="text-slate-700">{datas.gst || "N/A"}</span></span>
              </div>
            </div>
          </div>
        </td>

        {/* Category & Supplier */}
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-medium text-slate-800">{datas.category || "N/A"}</span>
            <span className="text-[12px] text-slate-500">{datas.supplier || "N/A"}</span>
          </div>
        </td>

        {/* Pricing */}
        <td className="px-6 py-4 text-right">
          <span className="text-[14px] font-medium text-slate-500">{formatCurrency(item.buy_price)}</span>
        </td>
        <td className="px-6 py-4 text-right">
          <span className="text-[14px] font-semibold text-slate-800">{formatCurrency(item.sell_price)}</span>
        </td>

        {/* Stock */}
        <td className="px-6 py-4 text-right">
          <span className={`inline-flex px-3 py-1 rounded-md text-[12px] font-medium border ${stockStatusColor}`}>
            {stockLabel}
          </span>
        </td>

        {/* Date */}
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-1.5 text-[13px] text-slate-500">
            <Calendar size={14} />
            {formatDate(item.date)}
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${(item.id)}`); }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
            title="View Detail"
          >
            <Eye size={16} />
          </button>
        </td>
      </tr>

      {isExpanded && hasVariants && (
        <tr className="bg-slate-50/20">
          <td colSpan={8} className="px-0 py-0 border-b border-slate-100">
            {/* pl-[88px] aligns the thread exactly under the title area */}
            <div className="pl-[88px] pr-6 py-2 pb-4">
              <div className="flex flex-col relative">
                {datas.combinations?.map((comb, index) => {
                  const isLast = index === datas.combinations!.length - 1;
                  const variantLabel = comb.attributes ? Object.values(comb.attributes).join(' / ') : 'N/A';
                  const combStockStatus = getStockStatus(comb.stock);

                  return (
                    <div key={comb.id} className="relative pl-8 pb-3 pt-1 animate-in fade-in duration-300">
                      {/* --- Tree Branches --- */}
                      <div className={`absolute left-[11px] w-[2px] bg-slate-200 ${isLast ? 'top-0 h-[30px]' : 'top-0 bottom-0'}`}></div>
                      <div className="absolute left-[11px] top-[30px] w-[21px] h-[2px] bg-slate-200"></div>

                      {/* Variant Card */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:border-blue-300">
                        <div className="flex items-center gap-4 px-5 py-3.5">
                          
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{variantLabel}</p>
                            <p className="text-xs text-slate-500 mt-1">{comb.barcode || "No SKU"}</p>
                          </div>
                          
                          <div className="flex items-center gap-8 md:gap-16">
                            <p className="text-sm text-slate-600 min-w-[80px] text-right">
                              {/* Display buy price if available, else blank */}
                              —
                            </p>
                            <p className="text-sm font-semibold text-slate-800 min-w-[80px] text-right">
                              {comb.price ? formatCurrency(comb.price) : 'Matches Parent'}
                            </p>
                            <div className="min-w-[120px] text-right">
                              <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-medium border ${combStockStatus.color}`}>
                                {combStockStatus.label}
                              </span>
                            </div>
                            {/* Empty space matching the width of standard Actions column for alignment */}
                            <div className="w-8"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
    getData(ENDPOINTS.INVENTORIES, { shop_id: SHOP_ID }).then((res: any) => {
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
      item.datas?.name?.toLowerCase().includes(q) ||
      item.datas?.brand?.toLowerCase().includes(q) ||
      item.datas?.category?.toLowerCase().includes(q)
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
    <div className="space-y-6 bg-slate-50 min-h-screen">
      
      {/* Search and Stats Section */}
      <div className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Package size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by name, SKU, brand, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-medium text-slate-700"
          />
        </div>

        <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-3 pb-2 -mx-2 px-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 touch-pan-x">
          <StatCard 
            icon={Package} 
            label="Total Inventory Items" 
            value={stats.total.toString()} 
            className="flex-1"
          />
          <StatCard 
            icon={AlertCircle} 
            label="Low Stock Items" 
            value={stats.lowStock.toString()} 
            iconBg="bg-amber-50" iconColor="text-amber-600"
            className="flex-1"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-rose-500 hover:text-rose-700 transition-colors p-1 hover:bg-rose-100 rounded-lg">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center"><Loader /></div>
        ) : inventory.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 shadow-sm">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">No inventory found</h3>
            <p className="text-sm text-slate-500 mt-1">Your product list is currently empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-6 py-4 w-14"></th>
                  <th className="px-6 py-4 min-w-[260px]">Product Details</th>
                  <th className="px-6 py-4">Category & Supplier</th>
                  <th className="px-6 py-4 text-right">Buy Price</th>
                  <th className="px-6 py-4 text-right">Sell Price</th>
                  <th className="px-6 py-4 text-right">Stock</th>
                  <th className="px-6 py-4 text-right">Added Date</th>
                  <th className="px-6 py-4 w-12 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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