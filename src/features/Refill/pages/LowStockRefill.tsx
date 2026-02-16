import { useState, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  PackageX,
  RefreshCcw,
  Truck,
  CheckCircle2,
  ChevronDown,
  X,
} from "lucide-react";

import Input from "@/components/ui/Input"; // Assuming you have this
import HeaderCard from "@/components/common/HeaderCard"; // Assuming you have this
import Title from "@/components/common/Title"; // Assuming you have this

// --- Types ---
interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  image: string;
  lastRestocked: string;
  supplierId: string; // Link to a supplier
}

interface RefillDetails {
  qty: string;
  buyingPrice: string;
  sellingPrice: string;
  minThreshold: string;
  supplierId: string; // Selected supplier ID
  newSupplierName?: string; // If adding a new one
}

// --- Mock Data ---
const MOCK_SUPPLIERS: Supplier[] = [
  { id: "s1", name: "TechDistro Global" },
  { id: "s2", name: "Office Essentials Ltd" },
  { id: "s3", name: "CableConnect Inc" },
];

const MOCK_INVENTORY: Product[] = [
  { id: "1", name: "Wireless Headphones", sku: "WH-001", category: "Electronics", currentStock: 0, minThreshold: 10, image: "🎧", lastRestocked: "2023-10-01", supplierId: "s1" },
  { id: "2", name: "Ergonomic Mouse", sku: "EM-202", category: "Electronics", currentStock: 4, minThreshold: 15, image: "🖱️", lastRestocked: "2023-11-12", supplierId: "s1" },
  { id: "3", name: "Mechanical Keyboard", sku: "MK-303", category: "Electronics", currentStock: 25, minThreshold: 10, image: "⌨️", lastRestocked: "2023-12-05", supplierId: "s2" },
  { id: "4", name: "USB-C Cable", sku: "CB-101", category: "Accessories", currentStock: 8, minThreshold: 20, image: "🔌", lastRestocked: "2023-11-20", supplierId: "s3" },
  { id: "5", name: "Monitor Stand", sku: "MS-500", category: "Furniture", currentStock: 2, minThreshold: 5, image: "🖥️", lastRestocked: "2023-09-15", supplierId: "s2" },
];

const RefillPage = () => {
  // --- State ---
  const [products, setProducts] = useState<Product[]>(MOCK_INVENTORY);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "low" | "out">("all");
  
  // Track expanded rows for editing details
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Stores the staging data for refills
  const [refillDetails, setRefillDetails] = useState<Record<string, RefillDetails>>({});

  // --- Derived Data ---
  const stats = useMemo(() => {
    const outOfStock = products.filter(p => p.currentStock === 0).length;
    const lowStock = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minThreshold).length;
    return { outOfStock, lowStock };
  }, [products]);

  // Identify which items have been "selected" (i.e., have a valid qty entered)
  const selectedItems = useMemo(() => {
    return Object.entries(refillDetails).filter(([_, details]) => {
      const qty = parseInt(details.qty, 10);
      return !isNaN(qty) && qty > 0;
    });
  }, [refillDetails]);

  // --- Handlers ---
  const toggleExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDetailChange = (id: string, field: keyof RefillDetails, value: string) => {
    setRefillDetails(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
        // Ensure other fields preserve current product state if not set yet
        supplierId: prev[id]?.supplierId || products.find(p => p.id === id)?.supplierId || "",
      }
    }));
  };


  const executeBulkRefill = (idsToRefill: string[] = []) => {
    // If no specific IDs passed, use all selected
    const targetIds = idsToRefill.length > 0 
      ? idsToRefill 
      : selectedItems.map(([id]) => id);

    if (targetIds.length === 0) return;

    setProducts(prev => prev.map(p => {
      if (!targetIds.includes(p.id)) return p;

      const details = refillDetails[p.id];
      if (!details) return p;

      const qtyToAdd = parseInt(details.qty, 10) || 0;
      
      // Handle New Supplier Creation Logic Here (Mock)
      if (details.supplierId === "new" && details.newSupplierName) {
        // In a real app, you'd add this to the DB
        console.log(`Created new supplier: ${details.newSupplierName}`);
      }

      return {
        ...p,
        currentStock: p.currentStock + qtyToAdd,
        minThreshold: details.minThreshold ? parseInt(details.minThreshold) : p.minThreshold,
        supplierId: (details.supplierId === "new" ? "s-new-mock" : details.supplierId) || p.supplierId,
        lastRestocked: new Date().toISOString().split("T")[0],
      };
    }));

    // Clear staged data for processed items
    setRefillDetails(prev => {
      const next = { ...prev };
      targetIds.forEach(id => delete next[id]);
      return next;
    });
    
    // Collapse rows
    setExpandedRows({});
    setSuppliers([])
  };

  // Filter Logic
  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = true;
    if (filterType === "out") matchesFilter = item.currentStock === 0;
    if (filterType === "low") matchesFilter = item.currentStock > 0 && item.currentStock <= item.minThreshold;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-8 pb-32 relative">
      
      {/* HEADER */}
      <div className="space-y-6">
        <Title icon={<RefreshCcw size={30} />} title="Refill Inventory" subtitle="Manage stock levels and replenish inventory" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
          <HeaderCard title="Out of Stock" value={stats.outOfStock} subtitle="Immediate action required" icon={PackageX} theme="red" trend="High Priority" trendDirection="up" />
          <HeaderCard title="Low Stock" value={stats.lowStock} subtitle="Below minimum threshold" icon={AlertTriangle} theme="yellow" trend="+5 items" trendDirection="down" />
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-4 z-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
            {(["all", "low", "out"] as const).map((tab) => (
              <button key={tab} onClick={() => setFilterType(tab)} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${filterType === tab ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {tab === "all" ? "All Items" : tab === "low" ? "Low Stock" : "Out of Stock"}
              </button>
            ))}
          </div>
          <div className="w-full md:w-80">
            <Input leftIcon={<Search size={18} />} placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-gray-50 border-transparent focus:bg-white" />
          </div>
        </div>
      </div>

      {/* PRODUCT LIST */}
      <div className="space-y-4">
        {filteredProducts.map((product) => {
          const isOut = product.currentStock === 0;
          const isLow = !isOut && product.currentStock <= product.minThreshold;
          
          // Check if user has started entering data for this product
          const stagedData = refillDetails[product.id] || {};
          const isSelected = !!stagedData.qty && parseInt(stagedData.qty) > 0;
          const isExpanded = expandedRows[product.id];

          return (
            <div key={product.id} className={`group relative flex flex-col rounded-2xl border transition-all ${isSelected ? "border-blue-400 bg-blue-50/10 shadow-md ring-1 ring-blue-100" : "bg-white border-gray-100 hover:shadow-sm"}`}>
              
              {/* Main Row Content */}
              <div className="flex flex-col md:flex-row items-center gap-6 p-4">
                
                {/* Product Info */}
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center text-3xl border border-gray-100 relative">
                    {product.image}
                    {isSelected && <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1"><CheckCircle2 size={12} /></div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{product.name}</h4>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">SKU: {product.sku} • {product.currentStock} in stock</p>
                    <div className="flex gap-2 mt-1">
                      {isOut && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Out of Stock</span>}
                      {isLow && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase">Low Stock</span>}
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                  <div className="w-full md:w-32">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Add Qty</p>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={stagedData.qty || ""} 
                      onChange={(e) => handleDetailChange(product.id, "qty", e.target.value)}
                      className={`h-10 text-center font-bold ${isSelected ? "border-blue-500 text-blue-700 bg-blue-50" : ""}`}
                    />
                  </div>
                  
                  {/* Expand Button */}
                  <div className="mt-5">
                    <button 
                      onClick={() => toggleExpand(product.id)}
                      className={`h-10 px-3 rounded-lg border flex items-center gap-2 text-sm font-medium transition-colors ${isExpanded ? "bg-gray-100 border-gray-300 text-gray-900" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                    >
                      {isExpanded ? <ChevronDown className="rotate-180" size={16}/> : <ChevronDown size={16}/>}
                      {isExpanded ? "Close" : "Details"}
                    </button>
                  </div>
                </div>
              </div>

              {/* EXPANDED DETAILS SECTION */}
              {isExpanded && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Column 1: Pricing & Thresholds */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <RefreshCcw size={14} /> Refill Details
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                          <label className="text-[11px] text-gray-500 font-medium">Buy Price (₹)</label>
                          <Input type="number" placeholder="0.00" value={stagedData.buyingPrice || ""} onChange={(e) => handleDetailChange(product.id, "buyingPrice", e.target.value)} className="bg-white h-9 text-sm" />
                         </div>
                         <div>
                          <label className="text-[11px] text-gray-500 font-medium">Sell Price (₹)</label>
                          <Input type="number" placeholder="0.00" value={stagedData.sellingPrice || ""} onChange={(e) => handleDetailChange(product.id, "sellingPrice", e.target.value)} className="bg-white h-9 text-sm" />
                         </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 font-medium">New Min Threshold</label>
                        <Input type="number" placeholder={product.minThreshold.toString()} value={stagedData.minThreshold || ""} onChange={(e) => handleDetailChange(product.id, "minThreshold", e.target.value)} className="bg-white h-9 text-sm" />
                      </div>
                    </div>

                    {/* Column 2: Supplier Info */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Truck size={14} /> Supplier Information
                      </h5>
                      
                      <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="mb-2">
                          <label className="text-[11px] text-gray-500 font-medium block mb-1">Select Supplier</label>
                          <select 
                            className="w-full text-sm p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={stagedData.supplierId || product.supplierId}
                            onChange={(e) => handleDetailChange(product.id, "supplierId", e.target.value)}
                          >
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            <option value="new">+ Add New Supplier</option>
                          </select>
                        </div>

                        {/* Show input if "Add New" is selected */}
                        {stagedData.supplierId === "new" && (
                          <div className="animate-in fade-in zoom-in-95 duration-200">
                             <label className="text-[11px] text-blue-600 font-bold block mb-1">New Supplier Name</label>
                             <div className="flex gap-2">
                               <Input 
                                 placeholder="Enter name..." 
                                 value={stagedData.newSupplierName || ""} 
                                 onChange={(e) => handleDetailChange(product.id, "newSupplierName", e.target.value)} 
                                 className="h-9 text-sm border-blue-200 bg-blue-50/20"
                               
                               />
                             </div>
                          </div>
                        )}
                        
                        {stagedData.supplierId !== "new" && (
                           <p className="text-[11px] text-gray-400 mt-2 italic">
                             Currently supplied by: {suppliers.find(s => s.id === (stagedData.supplierId || product.supplierId))?.name || "Unknown"}
                           </p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. FLOATING BULK REFILL BAR */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl  text-black bg-white p-4 rounded-2xl shadow-2xl shadow-blue-900/20 z-50 animate-in slide-in-from-bottom-6 fade-in duration-300 flex items-center justify-between ">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
              {selectedItems.length}
            </div>
            <div>
              <h4 className="font-bold text-sm">Products Selected</h4>
              <p className="text-xs text-gray-400">Ready to update stock levels</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => setRefillDetails({})} 
               className="p-2 text-gray-400  rounded-lg transition-colors"
               title="Clear Selection"
             >
               <X size={20} />
             </button>
             <button
               onClick={() => executeBulkRefill()}
               className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-50 hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
             >
               <RefreshCcw size={16} className={selectedItems.length > 0 ? "animate-spin-once" : ""} />
               Refill All
             </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default RefillPage;