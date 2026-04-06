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

} from "lucide-react";

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
const getBatchStatus = (mfgDate: string, expDate: string) => {
  const now = new Date().getTime();
  const mfg = new Date(mfgDate).getTime();
  const exp = new Date(expDate).getTime();
  
  const diffMs = exp - now;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const totalSpan = exp - mfg;
  const elapsed = now - mfg;
  const progressPct = totalSpan > 0 ? Math.min(Math.max((elapsed / totalSpan) * 100, 0), 100) : 0;

  if (daysLeft < 0) return { status: 'expired', daysLeft, progressPct: 100, label: `Expired`, color: 'bg-red-500', statusBg: 'bg-red-50 border-red-200 text-red-700', Icon: XCircle };
  if (daysLeft <= 30) return { status: 'critical', daysLeft, progressPct, label: `${daysLeft}d left`, color: 'bg-red-400', statusBg: 'bg-red-50 border-red-200 text-red-600', Icon: AlertTriangle };
  if (daysLeft <= 90) return { status: 'warning', daysLeft, progressPct, label: `${daysLeft}d left`, color: 'bg-amber-400', statusBg: 'bg-amber-50 border-amber-200 text-amber-700', Icon: Clock };
  return { status: 'active', daysLeft, progressPct, label: `${daysLeft}d left`, color: 'bg-emerald-400', statusBg: 'bg-emerald-50 border-emerald-200 text-emerald-700', Icon: ShieldCheck };
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isLowStock = (stock: number) => stock > 0 && stock <= 15;
const isOutOfStock = (stock: number) => stock === 0;

// --- Sub Components ---

const BatchRow = ({ batch, isLast, indentLevel = 1, isHidden = false }: { batch: Batch; isLast: boolean; indentLevel?: number; isHidden?: boolean }) => {
  const { label,statusBg, Icon } = getBatchStatus(batch.mfgDate, batch.expDate);
  const paddingLeft = indentLevel === 2 ? 'pl-16' : 'pl-4'; 

  if (isHidden) return null;

  return (
    <tr className="bg-slate-50/60 hover:bg-slate-100/60 transition-colors group animate-in fade-in duration-200">
      <td></td>
      <td></td>
      <td colSpan={4} className={`py-3 pr-4 ${paddingLeft} relative`}>
        {/* Tree structural lines */}
        <div className={`absolute top-0 w-px bg-slate-300 h-full ${indentLevel === 2 ? 'left-10' : '-left-[0.5px]'}`}></div>
        <div className={`absolute top-1/2 w-4 h-px bg-slate-300 ${indentLevel === 2 ? 'left-10' : 'hidden'} ${isLast ? 'hidden' : ''}`}></div>
        {isLast && <div className={`absolute top-0 w-px bg-slate-300 h-1/2 ${indentLevel === 2 ? 'left-10' : '-left-[0.5px]'}`}></div>}
        {isLast && <div className={`absolute top-1/2 w-4 h-px bg-slate-300 ${indentLevel === 2 ? 'left-10' : '-left-[0.5px]'}`}></div>}

        <div className="flex flex-col gap-2.5 max-w-2xl">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono text-[13px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
              <CalendarDays size={14} className="text-blue-500" />
              {batch.batchNo}
            </span>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">MFG</span>
              <span className="font-medium text-slate-700">{formatDate(batch.mfgDate)}</span>
              <span className="text-slate-300 mx-1">|</span>
              <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">EXP</span>
              <span className="font-medium text-slate-700">{formatDate(batch.expDate)}</span>
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-bold tracking-wide ${statusBg}`}>
              <Icon size={12} />
              {label}
            </div>
          </div>
   
        </div>
      </td>
      <td className="p-4 text-right">
        <span className={`inline-flex items-center justify-end gap-1.5 text-sm font-semibold ${
          batch.stock === 0 ? 'text-red-600' : batch.stock <= 15 ? 'text-amber-600' : 'text-slate-700'
        }`}>
          {batch.stock === 0 && <AlertCircle size={14} />}
          {batch.stock}
        </span>
      </td>
      <td className="p-4 text-center">
        <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md opacity-0 group-hover:opacity-100 transition-all">
          <MoreVertical size={16} />
        </button>
      </td>
    </tr>
  );
};

const VariantRow = ({ variant, isExpanded, toggleExpand, isLast, expandedBatches, toggleAllBatches }: any) => {
  const hasBatches = variant.batchTracking && variant.batches && variant.batches.length > 0;
  const showAllBatches = expandedBatches.has(variant.id);

  return (
    <Fragment>
      <tr className={`hover:bg-slate-50 cursor-pointer group transition-colors ${isExpanded ? 'bg-slate-50/80' : 'bg-slate-50/30'}`} onClick={(e) => hasBatches && toggleExpand(e, variant.id)}>
        <td></td>
        <td className="p-3 text-center relative">
          {/* Variant Tree Connection */}
          <div className="absolute top-0 left-1/2 w-px bg-slate-300 h-full -ml-[0.5px]"></div>
          {isLast && !isExpanded && <div className="absolute top-1/2 left-1/2 w-px bg-white h-1/2 -ml-[0.5px] z-10"></div>}
          <div className="absolute top-1/2 left-1/2 w-4 h-px bg-slate-300"></div>
          
          {hasBatches && (
            <button className={`relative z-20 p-0.5 rounded-sm bg-white border transition-colors ${isExpanded ? 'border-blue-300 text-blue-600' : 'border-slate-200 text-slate-400'}`}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </td>
        <td className="p-3 pl-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{variant.name}</span>
            {hasBatches && (
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-semibold tracking-wide uppercase">
                {variant.batches?.length} Batches
              </span>
            )}
          </div>
        </td>
        <td className="p-3 text-slate-500 font-mono text-[13px]">{variant.sku}</td>
        <td className="p-3 text-sm text-right text-slate-500">${variant.buyPrice.toFixed(2)}</td>
        <td className="p-3 text-sm text-right font-medium text-slate-700">${variant.sellPrice.toFixed(2)}</td>
        <td className="p-3 text-right">
          <span className={`inline-flex px-2 py-0.5 rounded-md text-[13px] font-medium ${isOutOfStock(variant.stock) ? 'bg-red-50 text-red-600' : isLowStock(variant.stock) ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {variant.stock} {variant.stock === 0 ? 'Out' : ''}
          </span>
        </td>
        <td className="p-3 text-center">
          <button onClick={(e) => e.stopPropagation()} className="p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-200 rounded-md opacity-0 group-hover:opacity-100 transition-all">
            <MoreVertical size={16} />
          </button>
        </td>
      </tr>

      {/* Nested Batches belonging to this Variant */}
      {isExpanded && hasBatches && variant.batches?.map((batch: Batch, idx: number) => {
        const isHidden = !showAllBatches && idx >= 3;
        const isLastBatch = idx === variant.batches!.length - 1;
        const isLastVisible = !showAllBatches && idx === 2;
        
        return (
          <BatchRow 
            key={batch.id} 
            batch={batch} 
            isLast={isLastBatch || isLastVisible} 
            indentLevel={2} 
            isHidden={isHidden}
          />
        );
      })}

      {/* View All Toggle for Variant Batches */}
      {isExpanded && hasBatches && variant.batches!.length > 3 && (
        <tr className="bg-slate-50/60 group animate-in fade-in duration-200">
          <td></td>
          <td className="relative">
            <div className="absolute top-0 left-1/2 w-px bg-slate-300 h-full -ml-[0.5px]"></div>
          </td>
          <td colSpan={6} className="py-2 pl-10 pr-4 relative">
             <div className="absolute top-0 left-10 w-px bg-slate-300 h-1/2"></div>
             <div className="absolute top-1/2 left-10 w-4 h-px bg-slate-300"></div>
            <button 
              onClick={(e) => toggleAllBatches(e, variant.id)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors ml-6"
            >
              {showAllBatches ? 'Show fewer batches' : `View all ${variant.batches!.length} batches`}
            </button>
          </td>
        </tr>
      )}
    </Fragment>
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
    <div className="space-y-6 text-slate-800 max-w-[1400px] mx-auto">
      
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
      {selectedRows.size > 0 && (
        <div className="px-4 py-3 flex justify-between items-center bg-blue-50/80 text-blue-800 rounded-xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="font-semibold text-sm">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md mr-2">{selectedRows.size}</span> 
            {selectedRows.size === 1 ? 'item' : 'items'} selected
          </p>
          <div className="flex items-center gap-3">
            <div className="h-5 w-px bg-blue-200"></div>
            <button className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 py-1.5 px-3 rounded-lg transition-colors font-medium text-sm">
              <Trash size={15} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Inventory Table */}
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
                const showAllBatches = expandedBatches.has(product.id);
                const hasExpandableContent = product.hasVariants || (product.batchTracking && product.batches?.length);

                return (
                  <Fragment key={product.id}>
                    {/* MAIN PRODUCT ROW */}
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
                      
                      <td className="p-4 text-center">
                        {hasExpandableContent ? (
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

                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold text-slate-800 text-sm flex items-center gap-2 flex-wrap">
                            {product.name}
                            
                            {product.hasVariants && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-blue-600 bg-blue-50 border border-blue-100/50 text-[10px] font-bold tracking-wide uppercase">
                                <Layers size={10} />
                                {product.variants?.length} Variants
                              </span>
                            )}
                            
                            {!product.hasVariants && product.batchTracking && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-emerald-600 bg-emerald-50 border border-emerald-100/50 text-[10px] font-bold tracking-wide uppercase">
                                <CalendarDays size={10} />
                                {product.batches?.length || 0} Batches
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-xs">{product.description}</div>
                        </div>
                      </td>

                      <td className="p-4 text-sm text-slate-600 font-mono text-[13px]">{product.sku}</td>
                      <td className="p-4 text-sm text-right text-slate-500">${product.buyPrice.toFixed(2)}</td>
                      <td className="p-4 text-sm text-right font-medium text-slate-800">${product.sellPrice.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center justify-end gap-1.5 text-sm font-semibold ${
                          isOutOfStock(product.stock) ? 'text-red-600' : isLowStock(product.stock) ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {isOutOfStock(product.stock) && <AlertCircle size={14} />}
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4"></td>
                    </tr>

                    {/* NESTED: PRODUCT HAS ONLY BATCHES (No Variants) */}
                    {isExpanded && !product.hasVariants && product.batchTracking && product.batches && product.batches.length > 0 && (
                      <>
                        {product.batches.map((batch, index) => {
                          const isHidden = !showAllBatches && index >= 3;
                          const isLastBatch = index === product.batches!.length - 1;
                          const isLastVisible = !showAllBatches && index === 2;
                          
                          return (
                            <BatchRow 
                              key={batch.id} 
                              batch={batch} 
                              isLast={isLastBatch || isLastVisible} 
                              isHidden={isHidden} 
                              indentLevel={1}
                            />
                          );
                        })}

                        {/* View All Toggle Row */}
                        {product.batches.length > 3 && (
                          <tr className="bg-slate-50/60 group animate-in fade-in duration-200">
                            <td></td>
                            <td className="relative">
                              <div className={`absolute top-0 left-1/2 w-px bg-slate-300 h-full -ml-[0.5px] ${!showAllBatches ? 'h-1/2' : ''}`}></div>
                              {!showAllBatches && <div className="absolute top-1/2 left-1/2 w-5 h-px bg-slate-300"></div>}
                            </td>
                            <td colSpan={6} className="py-2 px-4">
                              <button 
                                onClick={(e) => toggleAllBatches(e, product.id)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                              >
                                {showAllBatches ? 'Show fewer batches' : `View all ${product.batches.length} batches`}
                              </button>
                            </td>
                          </tr>
                        )}
                      </>
                    )}

                    {/* NESTED: PRODUCT HAS VARIANTS (Variants own the batches) */}
                    {isExpanded && product.hasVariants && product.variants?.map((variant, index) => {
                      const isLast = index === product.variants!.length - 1;
                      return (
                        <VariantRow 
                          key={variant.id} 
                          variant={variant} 
                          isExpanded={expandedRows.has(variant.id)} 
                          toggleExpand={toggleExpand}
                          isLast={isLast}
                          expandedBatches={expandedBatches}
                          toggleAllBatches={toggleAllBatches}
                        />
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-sm text-slate-600">
          <span className="font-medium">Showing 1 to 3 of 1,450 entries</span>
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 font-medium">Prev</button>
            <button className="px-3 py-1.5 bg-blue-600 text-white font-medium shadow-sm rounded-lg">1</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white transition-colors font-medium">Next</button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Inventory Details">
        <InventoryDetailContent item={selectedItem} />
      </Drawer>
    </div>
  );
};

export default Inventory;