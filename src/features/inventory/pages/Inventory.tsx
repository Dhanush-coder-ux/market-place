import React, { useState, Fragment } from "react";
import { 
  Trash, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Package,
  MoreVertical,
  AlertCircle,
  CalendarDays,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Box,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Assuming these are your existing imports ---
import InventoryHeader from "../components/InventoryHeader";
import Drawer from "../../../components/common/Drawer";
import SearchActionCard from "@/components/ui/SearchActionCard";
import { InventoryDetailContent } from "../components/InventoryDetailContent";

// --- Types ---
export interface Batch {
  id: string;
  batchNo: string;
  mfgDate: string;
  expDate: string;
  stock: number;
}

export interface Variant {
  id: string;
  name: string;
  sku: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  batchTracking?: boolean; 
  batches?: Batch[];        
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
  batchTracking?: boolean; 
  batches?: Batch[]; 
}

// --- Helpers ---
const getBatchStatus = (_mfgDate: string, expDate: string) => {
  const now = new Date().getTime();
  const exp = new Date(expDate).getTime();
  
  const diffMs = exp - now;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return { status: 'expired', daysLeft, label: `Expired`, statusBg: 'bg-red-50 border-red-200 text-red-700', Icon: XCircle };
  if (daysLeft <= 30) return { status: 'critical', daysLeft, label: `${daysLeft}d left`, statusBg: 'bg-red-50 border-red-200 text-red-600', Icon: AlertTriangle };
  if (daysLeft <= 90) return { status: 'warning', daysLeft, label: `${daysLeft}d left`, statusBg: 'bg-amber-50 border-amber-200 text-amber-700', Icon: Clock };
  return { status: 'active', daysLeft, label: `${daysLeft}d left`, statusBg: 'bg-emerald-50 border-emerald-200 text-emerald-700', Icon: ShieldCheck };
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isLowStock = (stock: number) => stock > 0 && stock <= 15;
const isOutOfStock = (stock: number) => stock === 0;

// --- Sub Components ---

const BatchCard = ({ batch }: { batch: Batch }) => {
  const { label, statusBg, Icon } = getBatchStatus(batch.mfgDate, batch.expDate);
  const isOut = isOutOfStock(batch.stock);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white rounded-xl border ${isOut ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200'} p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col h-full`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-slate-800">
            <Box size={14} className="text-slate-400" />
            {batch.batchNo}
          </span>
          {isOut && <span className="text-[11px] font-medium text-slate-400">Out of Stock</span>}
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold tracking-wide ${isOut ? 'bg-slate-100 border-slate-200 text-slate-500' : statusBg}`}>
          <Icon size={12} strokeWidth={2.5} />
          {isOut ? 'Depleted' : label}
        </div>
      </div>

      {/* Body: Metrics Grid */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mt-auto">
        <div>
          <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider mb-1">MFG Date</p>
          <p className="font-medium text-slate-700">{formatDate(batch.mfgDate)}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider mb-1">EXP Date</p>
          <p className="font-medium text-slate-700">{formatDate(batch.expDate)}</p>
        </div>
        <div className="col-span-2 pt-3 border-t border-slate-100 flex items-center justify-between">
           <div>
            <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider mb-0.5">Available Qty</p>
            <p className={`text-lg font-bold ${isOut ? 'text-red-500' : 'text-slate-800'}`}>{batch.stock}</p>
           </div>
           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                <Eye size={16} />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                <MoreVertical size={16} />
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const VariantCard = ({ variant, isExpanded, toggleExpand, expandedBatches, toggleAllBatches }: any) => {
  const hasBatches = variant.batchTracking && variant.batches && variant.batches.length > 0;
  const showAllBatches = expandedBatches.has(variant.id);
  const displayedBatches = showAllBatches ? variant.batches : variant.batches?.slice(0, 3);
  const outOfStock = isOutOfStock(variant.stock);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 mb-3 last:mb-0 ${isExpanded ? 'border-blue-200 shadow-md shadow-blue-50/50' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
      {/* Variant Header Row */}
      <div 
        onClick={(e) => hasBatches && toggleExpand(e, variant.id)}
        className={`flex items-center gap-4 p-4 cursor-pointer ${isExpanded ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/50'}`}
      >
        <div className="flex-shrink-0">
          <button className={`p-1 rounded-md transition-all ${!hasBatches ? 'invisible' : isExpanded ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
        
        <div className="flex-grow grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4 flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-slate-800">{variant.name}</span>
            <span className="text-xs font-mono text-slate-500">{variant.sku}</span>
          </div>
          <div className="col-span-2 text-right text-sm text-slate-500">${variant.buyPrice.toFixed(2)}</div>
          <div className="col-span-2 text-right text-sm font-medium text-slate-700">${variant.sellPrice.toFixed(2)}</div>
          <div className="col-span-2 text-right">
            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${outOfStock ? 'bg-red-50 text-red-600' : isLowStock(variant.stock) ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {variant.stock} {outOfStock ? 'Out' : 'In Stock'}
            </span>
          </div>
          <div className="col-span-2 text-right flex justify-end items-center gap-3">
             {hasBatches && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-semibold tracking-wide uppercase">
                {variant.batches?.length} Batches
              </span>
            )}
            <button onClick={(e) => e.stopPropagation()} className="p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Batch Grid for Variant */}
      <AnimatePresence>
        {isExpanded && hasBatches && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
          >
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedBatches.map((batch: Batch) => (
                  <BatchCard key={batch.id} batch={batch} />
                ))}
              </div>
              
              {variant.batches!.length > 3 && (
                <div className="mt-5 text-center">
                  <button 
                    onClick={(e) => toggleAllBatches(e, variant.id)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    {showAllBatches ? 'Show Less' : `View All ${variant.batches!.length} Batches`}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// --- Main Component ---
const Inventory = () => {
  // --- State ---
  const [selectedItem, setSelectedItem] = useState<Product | Variant | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["PROD-003"])); 
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set()); 
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Mock Data ---
  const data: Product[] = [
    {
      id: "PROD-001",
      name: "Organic Face Cleanser",
      sku: "OFC-100ML",
      description: "Gentle daily cleanser for acne-prone skin",
      buyPrice: 8.50,
      sellPrice: 24.99,
      stock: 450,
      hasVariants: false,
      batchTracking: true,
      batches: [
        { id: "B1", batchNo: "LOT-2025-A1", mfgDate: "2025-01-10", expDate: "2025-12-10", stock: 0 },
        { id: "B2", batchNo: "LOT-2025-A2", mfgDate: "2025-06-15", expDate: "2026-06-15", stock: 150 },
        { id: "B3", batchNo: "LOT-2025-B1", mfgDate: "2025-11-20", expDate: "2026-11-20", stock: 100 },
        { id: "B4", batchNo: "LOT-2026-A1", mfgDate: "2026-02-01", expDate: "2027-02-01", stock: 200 }, 
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
      hasVariants: false,
      batchTracking: false,
    },
    {
      id: "PROD-003",
      name: "Hyaluronic Acid Serum",
      sku: "HAS-BASE",
      description: "Hydrating facial serum",
      buyPrice: 12.00,
      sellPrice: 34.99,
      stock: 450,
      hasVariants: true,
      batchTracking: true, 
      variants: [
        {
          id: "VAR-003-30ML",
          name: "30ml Bottle",
          sku: "HAS-30ML",
          buyPrice: 12.00,
          sellPrice: 34.99,
          stock: 300,
          batchTracking: true,
          batches: [
            { id: "B1", batchNo: "LOT-A-01", mfgDate: "2025-01-10", expDate: "2025-12-10", stock: 100 },
            { id: "B2", batchNo: "LOT-A-02", mfgDate: "2025-06-15", expDate: "2026-06-15", stock: 200 },
          ]
        },
        {
          id: "VAR-003-50ML",
          name: "50ml Value Size",
          sku: "HAS-50ML",
          buyPrice: 18.00,
          sellPrice: 49.99,
          stock: 150,
          batchTracking: true,
          batches: [
            { id: "B3", batchNo: "LOT-B-01", mfgDate: "2025-02-01", expDate: "2026-02-01", stock: 150 },
            { id: "B4", batchNo: "LOT-B-02", mfgDate: "2025-03-01", expDate: "2026-03-01", stock: 0 },
            { id: "B5", batchNo: "LOT-B-03", mfgDate: "2025-04-01", expDate: "2026-04-01", stock: 50 },
            { id: "B6", batchNo: "LOT-B-04", mfgDate: "2025-05-01", expDate: "2026-05-01", stock: 100 },
          ]
        }
      ]
    }
  ];

  // --- Handlers ---
  const handleRowClick = (item: Product | Variant) => {
    setSelectedItem(item);
    setIsOpen(true);
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedRows);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const toggleAllBatches = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedBatches);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpandedBatches(newExpanded);
  };

  const toggleSelection = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    const newSelection = new Set(selectedRows);
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
    setSelectedRows(newSelection);
  };

  return (
    <div className="space-y-6 text-slate-800 max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Header Area */}
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

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedRows.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-5 py-3.5 flex justify-between items-center bg-slate-800 text-white rounded-xl shadow-lg"
          >
            <p className="font-semibold text-sm flex items-center gap-3">
              <span className="bg-slate-700 text-white px-2.5 py-0.5 rounded-md">{selectedRows.size}</span> 
              {selectedRows.size === 1 ? 'item' : 'items'} selected
            </p>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors font-medium text-sm">
                <Trash size={16} /> Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* Table Header */}
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="p-4 w-14 text-center">
                  <input type="checkbox" className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer h-4 w-4" />
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
                const showAllBatches = expandedBatches.has(product.id);
                const hasExpandableContent = product.hasVariants || (product.batchTracking && product.batches?.length);
                const displayedBatches = showAllBatches ? product.batches : product.batches?.slice(0, 3);

                return (
                  <Fragment key={product.id}>
                    {/* MAIN PRODUCT ROW */}
                    <tr 
                      onClick={() => handleRowClick(product)}
                      className={`group hover:bg-slate-50/60 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/40 hover:bg-blue-50/60' : ''}`}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => toggleSelection(e, product.id)}
                          className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer transition-all" 
                        />
                      </td>
                      
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {hasExpandableContent ? (
                          <button 
                            onClick={(e) => toggleExpand(e, product.id)}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${isExpanded ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                          >
                            <ChevronRight size={18} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        ) : (
                          <div className="w-8 h-8 flex justify-center items-center text-slate-300">
                            <Package size={18} />
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="font-semibold text-slate-800 text-sm flex items-center gap-2 flex-wrap">
                            {product.name}
                            
                            {product.hasVariants && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-blue-700 bg-blue-50 border border-blue-200/60 text-[10px] font-bold tracking-wide uppercase">
                                <Layers size={12} />
                                {product.variants?.length} Variants
                              </span>
                            )}
                            
                            {!product.hasVariants && product.batchTracking && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-emerald-700 bg-emerald-50 border border-emerald-200/60 text-[10px] font-bold tracking-wide uppercase">
                                <CalendarDays size={12} />
                                {product.batches?.length || 0} Batches
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 truncate max-w-sm">{product.description}</div>
                        </div>
                      </td>

                      <td className="p-4 text-sm text-slate-600 font-mono">{product.sku}</td>
                      <td className="p-4 text-sm text-right text-slate-500">${product.buyPrice.toFixed(2)}</td>
                      <td className="p-4 text-sm text-right font-medium text-slate-800">${product.sellPrice.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center justify-end gap-1.5 text-sm font-semibold ${
                          isOutOfStock(product.stock) ? 'text-red-600 bg-red-50 px-2.5 py-1 rounded-md' : 
                          isLowStock(product.stock) ? 'text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md' : 'text-slate-800'
                        }`}>
                          {isOutOfStock(product.stock) && <AlertCircle size={14} />}
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED CONTENT AREA */}
                    <AnimatePresence>
                      {isExpanded && hasExpandableContent && (
                        <tr>
                          <td colSpan={8} className="p-0 border-b-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-slate-50/50 shadow-inner"
                            >
                              <div className="px-6 py-6 border-b border-slate-200">
                                
                                {/* SCENARIO A: Only Batches (No Variants) */}
                                {!product.hasVariants && product.batches && (
                                  <div className="space-y-5">
                                    <h4 className="heading-label text-slate-800 flex items-center gap-2">
                                      <CalendarDays size={16} className="text-slate-400" /> 
                                      Active Batches
                                    </h4>
                                    
                                    {product.batches.length === 0 ? (
                                      <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                        <p className="text-slate-500 text-sm">No batches found for this product.</p>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                          {displayedBatches?.map(batch => (
                                            <BatchCard key={batch.id} batch={batch} />
                                          ))}
                                        </div>
                                        
                                        {product.batches.length > 3 && (
                                          <div className="pt-2 text-center">
                                            <button 
                                              onClick={(e) => toggleAllBatches(e, product.id)}
                                              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-sm hover:shadow px-4 py-2 rounded-lg transition-all"
                                            >
                                              {showAllBatches ? 'Collapse Batches' : `View All ${product.batches.length} Batches`}
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}

                                {/* SCENARIO B: Product has Variants */}
                                {product.hasVariants && product.variants && (
                                  <div className="space-y-4">
                                    <h4 className="heading-label text-slate-800 flex items-center gap-2 mb-2">
                                      <Layers size={16} className="text-slate-400" /> 
                                      Product Variants
                                    </h4>
                                    
                                    <div className="flex flex-col">
                                      {product.variants.map((variant) => (
                                        <VariantCard 
                                          key={variant.id}
                                          variant={variant}
                                          isExpanded={expandedRows.has(variant.id)}
                                          toggleExpand={toggleExpand}
                                          expandedBatches={expandedBatches}
                                          toggleAllBatches={toggleAllBatches}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer / Pagination */}
        {/* <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between text-sm text-slate-600">
          <span className="font-medium">Showing 1 to 3 of 1,450 entries</span>
          <div className="flex gap-2">
            <button className="px-3.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 font-semibold text-slate-700 shadow-sm">Previous</button>
            <button className="px-4 py-2 bg-slate-800 text-white font-semibold shadow-sm rounded-lg hover:bg-slate-700 transition-colors">1</button>
            <button className="px-3.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-slate-700 shadow-sm">Next</button>
          </div>
        </div> */}
      </div>

      {/* Drawer */}
      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Inventory Details">
        <InventoryDetailContent item={selectedItem} />
      </Drawer>
    </div>
  );
};

export default Inventory;