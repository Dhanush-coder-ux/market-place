import React, { useState, Fragment } from "react";
import { 
  Trash, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Package,
  MoreVertical,
  AlertCircle
} from "lucide-react";

// Keep your existing custom components
import InventoryHeader from "../components/InventoryHeader";
import Drawer from "../../../components/common/Drawer";
import SearchActionCard from "@/components/ui/SearchActionCard";
import { InventoryDetailContent } from "../components/InventoryDetailContent";

// --- Types ---
export interface Variant {
  id: string;
  name: string;
  sku: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  hasVariants: boolean;
  variants?: Variant[];
}

const Inventory = () => {
  // --- State ---
  const [selectedItem, setSelectedItem] = useState<Product | Variant | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isOpen, setIsopen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Mock Data ---
  const data: Product[] = [
    {
      id: "PROD-001",
      name: "Wireless ANC Headphones",
      sku: "WH-BASE",
      description: "Over-ear noise cancelling headphones",
      buyPrice: 45.00,
      sellPrice: 129.99,
      stock: 120,
      hasVariants: true,
      variants: [
        { id: "VAR-001-A", name: "Matte Black", sku: "WH-BLK", buyPrice: 45.00, sellPrice: 129.99, stock: 85 },
        { id: "VAR-001-B", name: "Pearl White", sku: "WH-WHT", buyPrice: 45.00, sellPrice: 129.99, stock: 35 },
        { id: "VAR-001-C", name: "Crimson Red", sku: "WH-RED", buyPrice: 45.00, sellPrice: 129.99, stock: 0 },
      ]
    },
    {
      id: "PROD-002",
      name: "USB-C Braided Cable 1M",
      sku: "CBL-USBC-1M",
      description: "Fast charging data sync cable",
      buyPrice: 2.50,
      sellPrice: 12.00,
      stock: 450,
      hasVariants: false
    },
    {
      id: "PROD-003",
      name: "Mechanical Keyboard",
      sku: "MK-BASE",
      description: "Hot-swappable RGB keyboard",
      buyPrice: 65.00,
      sellPrice: 149.00,
      stock: 42,
      hasVariants: true,
      variants: [
        { id: "VAR-003-A", name: "Tactile Blue Switches", sku: "MK-BLU", buyPrice: 65.00, sellPrice: 149.00, stock: 12 },
        { id: "VAR-003-B", name: "Linear Red Switches", sku: "MK-RED", buyPrice: 65.00, sellPrice: 149.00, stock: 30 },
      ]
    }
  ];

  // --- Handlers ---
  const handleRowClick = (item: Product | Variant) => {
    setSelectedItem(item);
    setIsopen(true);
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleSelection = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };

  const isLowStock = (stock: number) => stock > 0 && stock <= 15;
  const isOutOfStock = (stock: number) => stock === 0;

  return (
    <div className="space-y-6 text-slate-800 pb-12 max-w-[1400px] mx-auto">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col gap-4">
        <InventoryHeader
          searchValue={searchQuery}
          lowestStockValue={10}
          onSearchChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          totalCount={1450}
        />

        <SearchActionCard
          searchValue={searchQuery}
          onSearchChange={()=>{}}
          placeholder="Search products by name, SKU, or barcode..."
        />
      </div>

      {/* 2. Bulk Action Bar */}
      {selectedRows.size > 0 && (
        <div className="px-4 py-3 flex justify-between items-center bg-blue-50/80 text-blue-800 rounded-xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="font-semibold text-sm">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md mr-2">
              {selectedRows.size}
            </span> 
            {selectedRows.size === 1 ? 'item' : 'items'} selected
          </p>
          <div className="flex items-center gap-3">
            <div className="h-5 w-px bg-blue-200"></div>
            <button 
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 py-1.5 px-3 rounded-lg transition-colors font-medium text-sm"
              title="Delete Selected"
            >
              <Trash size={15} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* 3. Custom Expandable Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4 w-14 text-center">
                  <input type="checkbox" className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="p-4 w-12"></th>
                <th className="p-4 font-semibold">Product Details</th>
                <th className="p-4 font-semibold">SKU / Barcode</th>
                <th className="p-4 text-right font-semibold">Buy Price</th>
                <th className="p-4 text-right font-semibold">Sell Price</th>
                <th className="p-4 text-right font-semibold">Stock</th>
                <th className="p-4 w-14"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {data.map((product) => {
                const isExpanded = expandedRows.has(product.id);
                const isSelected = selectedRows.has(product.id);

                return (
                  <Fragment key={product.id}>
                    
                    {/* --- MAIN PRODUCT ROW --- */}
                    <tr 
                      onClick={() => handleRowClick(product)}
                      className={`group hover:bg-slate-50/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/30 hover:bg-blue-50/40' : ''}`}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => toggleSelection(e, product.id)}
                          className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer transition-all" 
                        />
                      </td>
                      
                      {/* Expander Button */}
                      <td className="p-4 text-center">
                        {product.hasVariants ? (
                          <button 
                            onClick={(e) => toggleExpand(e, product.id)}
                            className={`p-1.5 rounded-md transition-all duration-200 ${isExpanded ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                          >
                            {isExpanded ? <ChevronDown size={16} strokeWidth={2.5} /> : <ChevronRight size={16} strokeWidth={2.5} />}
                          </button>
                        ) : (
                          <div className="w-7 h-7 flex justify-center items-center text-slate-300">
                            <Package size={16} />
                          </div>
                        )}
                      </td>

                      {/* Product Name & Badges */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                              {product.name}
                              {/* Highlight Badge for Variants */}
                              {product.hasVariants && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-blue-600 bg-blue-50 border border-blue-100/50 text-[10px] font-bold tracking-wide uppercase">
                                  <Layers size={10} />
                                  {product.variants?.length} Variants
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">{product.description}</div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="p-4 text-sm text-slate-600 font-mono text-[13px]">
                        {product.sku}
                      </td>

                      {/* Prices */}
                      <td className="p-4 text-sm text-right text-slate-500">
                        ${product.buyPrice.toFixed(2)}
                      </td>
                      <td className="p-4 text-sm text-right font-medium text-slate-800">
                        ${product.sellPrice.toFixed(2)}
                      </td>

                      {/* Stock */}
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center justify-end gap-1.5 text-sm font-semibold ${
                          isOutOfStock(product.stock) ? 'text-red-600' : 
                          isLowStock(product.stock) ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {isOutOfStock(product.stock) && <AlertCircle size={14} />}
                          {product.stock}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <button 
                          onClick={(e) => e.stopPropagation()} 
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>

                    {/* --- VARIANT ROWS (Nested) --- */}
                    {product.hasVariants && isExpanded && product.variants?.map((variant, index) => {
                      const isLast = index === product.variants!.length - 1;
                      
                      return (
                        <tr 
                          key={variant.id} 
                          onClick={() => handleRowClick(variant)}
                          className="bg-slate-50/30 hover:bg-slate-50 cursor-pointer group"
                        >
                          <td></td>
                          
                          {/* Tree connection graphic */}
                          <td className="relative">
                            <div className="absolute top-0 left-1/2 w-px bg-slate-200 h-full -ml-[0.5px]"></div>
                            <div className={`absolute top-1/2 left-1/2 w-5 h-px bg-slate-200 ${isLast ? 'hidden' : ''}`}></div>
                            {isLast && <div className="absolute top-0 left-1/2 w-px bg-slate-200 h-1/2 -ml-[0.5px]"></div>}
                            {isLast && <div className="absolute top-1/2 left-1/2 w-5 h-px bg-slate-200"></div>}
                          </td>

                          {/* Variant Name */}
                          <td className="p-3 pl-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700">{variant.name}</span>
                            </div>
                          </td>

                          {/* Variant SKU */}
                          <td className="p-3 text-slate-500 font-mono text-[13px]">
                            {variant.sku}
                          </td>

                          {/* Variant Prices */}
                          <td className="p-3 text-sm text-right text-slate-500">
                            ${variant.buyPrice.toFixed(2)}
                          </td>
                          <td className="p-3 text-sm text-right font-medium text-slate-700">
                            ${variant.sellPrice.toFixed(2)}
                          </td>

                          {/* Variant Stock */}
                          <td className="p-3 text-right">
                             <span className={`inline-flex px-2 py-0.5 rounded-md text-[13px] font-medium ${
                               isOutOfStock(variant.stock) ? 'bg-red-50 text-red-600' : 
                               isLowStock(variant.stock) ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {variant.stock} {variant.stock === 0 ? 'Out' : ''}
                            </span>
                          </td>

                          {/* Variant Actions */}
                          <td className="p-3 text-center">
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-200 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Mock Pagination Footer */}
        <div className="px-5 py-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-sm text-slate-600">
          <span className="font-medium">Showing 1 to 3 of 1,450 entries</span>
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 font-medium">Prev</button>
            <button className="px-3 py-1.5 bg-blue-600 text-white font-medium shadow-sm rounded-lg">1</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white transition-colors font-medium">2</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white transition-colors font-medium">3</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white transition-colors font-medium">Next</button>
          </div>
        </div>
      </div>

      {/* 4. Details Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsopen(false)}
        title="Inventory Details"
      >
        <InventoryDetailContent item={selectedItem} />
      </Drawer>
    </div>
  );
};

export default Inventory;