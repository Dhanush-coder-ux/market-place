import React, { useState, useEffect, Fragment } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Package,
  MoreVertical,
  AlertCircle,
  Tag,
  Calendar,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";

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

const getStockStatus = (stock: number) => {
  const stockNum = Number(stock) || 0;
  if (stockNum <= 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50 border-red-200' };
  if (stockNum <= 15) return { label: 'Low Stock', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { label: 'In Stock', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
};

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return 'N/A';
  return `₹${Number(amount).toFixed(2)}`;
};

// --- Sub Components ---

const ProductRow = ({ 
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
  const stockStatus = getStockStatus(item.stocks);

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

        {/* Category & Supplier */}
        <td className="p-4">
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-800">{datas.category || "N/A"}</span>
            <span className="text-xs text-slate-500">{datas.supplier || "N/A"}</span>
          </div>
        </td>

        {/* Pricing */}
        <td className="p-4 text-right">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500 line-through text-xs">{formatCurrency(item.buy_price)}</span>
            <span className="font-semibold text-slate-800">{formatCurrency(item.sell_price)}</span>
          </div>
        </td>

        {/* Stock */}
        <td className="p-4 text-right">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${stockStatus.color}`}>
            {Number(item.stocks) <= 0 && <AlertCircle size={12} />}
            {item.stocks || 0} {datas.unit || ''}
          </span>
        </td>

        {/* Date */}
        <td className="p-4 text-right">
          <div className="flex items-center justify-end gap-1.5 text-sm text-slate-500">
            <Calendar size={14} />
            {formatDate(item.date)}
          </div>
        </td>

        {/* Actions */}
        <td className="p-4 text-center">
          <button onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-all">
            <MoreVertical size={18} />
          </button>
        </td>
      </tr>

      {/* Expanded Variant Rows */}
      {isExpanded && hasVariants && datas.combinations?.map((comb, index) => {
        const isLast = index === datas.combinations!.length - 1;
        // Format attributes (e.g., {"Size": "XXL", "Color": "Pink"} -> "XXL / Pink")
        const variantName = comb.attributes ? Object.values(comb.attributes).join(' / ') : 'N/A';
        const combStock = Number(comb.stock) || 0;
        const combStockStatus = getStockStatus(combStock);

        return (
          <tr key={comb.id} className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
            <td className="relative">
              <div className="absolute top-0 left-1/2 w-px bg-slate-300 h-full -ml-[0.5px]"></div>
              {isLast && <div className="absolute top-1/2 left-1/2 w-px bg-white h-1/2 -ml-[0.5px] z-10"></div>}
              <div className="absolute top-1/2 left-1/2 w-4 h-px bg-slate-300"></div>
            </td>
            
            <td className="p-3 pl-8">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">{variantName}</span>
                <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block w-max">
                  {comb.barcode || "N/A"}
                </span>
              </div>
            </td>
            
            <td className="p-3 text-sm text-slate-500 italic">Variant</td>
            
            <td className="p-3 text-right text-sm font-medium text-slate-700">
              {comb.price ? formatCurrency(Number(comb.price)) : 'Matches Parent'}
            </td>
            
            <td className="p-3 text-right">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${combStockStatus.color}`}>
                {combStock}
              </span>
            </td>
            
            <td colSpan={2}></td>
          </tr>
        );
      })}
    </Fragment>
  );
};

// --- Main Component ---
const InventoryPage = () => {
  const { getData, loading, error, clearError } = useApi();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Assuming getData returns { detail: {...}, data: [...] }
    getData(ENDPOINTS.INVENTORIES, { shop_id: SHOP_ID }).then((res: any) => {
      if (res && res.data) {
        setInventory(res.data);
      }
    });
  }, [refreshKey]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your standard and variant products.</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader /></div>
        ) : inventory.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">No inventory found</h3>
            <p className="text-sm text-slate-500 mt-1">Your product list is currently empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 w-12"></th>
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Category & Supplier</th>
                  <th className="p-4 text-right">Pricing (Buy/Sell)</th>
                  <th className="p-4 text-right">Stock</th>
                  <th className="p-4 text-right">Added Date</th>
                  <th className="p-4 w-12 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
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