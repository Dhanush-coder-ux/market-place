import  { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  PackageX, 
  CheckCircle2, 
  Plus,
  RefreshCcw, 

} from "lucide-react";

import Input from "@/components/ui/Input";

import HeaderCard from "@/components/common/HeaderCard";
import Title from "@/components/common/Title";

// --- Types ---
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minThreshold: number; // The point where it becomes "Low Stock"
  image: string;
  lastRestocked: string;
}

// --- Mock Data ---
const MOCK_INVENTORY: Product[] = [
  { id: "1", name: "Wireless Headphones", sku: "WH-001", category: "Electronics", currentStock: 0, minThreshold: 10, image: "🎧", lastRestocked: "2023-10-01" },
  { id: "2", name: "Ergonomic Mouse", sku: "EM-202", category: "Electronics", currentStock: 4, minThreshold: 15, image: "🖱️", lastRestocked: "2023-11-12" },
  { id: "3", name: "Mechanical Keyboard", sku: "MK-303", category: "Electronics", currentStock: 25, minThreshold: 10, image: "⌨️", lastRestocked: "2023-12-05" },
  { id: "4", name: "USB-C Cable", sku: "CB-101", category: "Accessories", currentStock: 8, minThreshold: 20, image: "🔌", lastRestocked: "2023-11-20" },
  { id: "5", name: "Monitor Stand", sku: "MS-500", category: "Furniture", currentStock: 2, minThreshold: 5, image: "🖥️", lastRestocked: "2023-09-15" },
];

const RefillPage = () => {
  // --- State ---
  const [products, setProducts] = useState<Product[]>(MOCK_INVENTORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "low" | "out">("all");
  
  // Track inputs for each row: { "1": "10", "2": "5" }
  const [refillInputs, setRefillInputs] = useState<Record<string, string>>({});

  // --- Derived Data (Stats) ---
  const stats = useMemo(() => {
    const outOfStock = products.filter(p => p.currentStock === 0).length;
    const lowStock = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minThreshold).length;
    return { outOfStock, lowStock };
  }, [products]);

  // --- Filtering Logic ---
  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filterType === "out") matchesFilter = item.currentStock === 0;
    if (filterType === "low") matchesFilter = item.currentStock > 0 && item.currentStock <= item.minThreshold;

    return matchesSearch && matchesFilter;
  });

  // --- Handlers ---
  const handleRefillChange = (id: string, value: string) => {
    setRefillInputs(prev => ({ ...prev, [id]: value }));
  };

  const executeRefill = (id: string) => {
    const amount = parseInt(refillInputs[id] || "0");
    if (amount <= 0) return;

    // Update Product State
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, currentStock: p.currentStock + amount } : p
    ));

    // Clear Input
    setRefillInputs(prev => ({ ...prev, [id]: "" }));
    
    // Optional: Add Toast Notification here
    console.log(`Refilled item ${id} by ${amount}`);
  };

  return (
    <div className="p-6 space-y-8">
      
      {/* 1. HEADER & STATS */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Title icon={<RefreshCcw size={30} />} title="Refill Inventory" subtitle="Manage stock levels and replenish inventory" />
        </div>

        {/* Use your HeaderCard here */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HeaderCard
            title="Out of Stock" 
            value={stats.outOfStock} 
            subtitle="Immediate action required"
            icon={PackageX} 
            theme="red"
            trend="High Priority"
            trendDirection="up"
          />
          <HeaderCard 
            title="Low Stock" 
            value={stats.lowStock} 
            subtitle="Below minimum threshold"
            icon={AlertTriangle} 
            theme="yellow"
            trend="+5 items"
            trendDirection="down"
          />
           <HeaderCard 
            title="Healthy Stock" 
            value={products.length - (stats.outOfStock + stats.lowStock)} 
            subtitle="Stocked adequately"
            icon={CheckCircle2} 
            theme="green"
            trend="Stable"
            trendDirection="neutral"
          />
        </div>
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-4 z-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
            {(["all", "low", "out"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`
                  flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all
                  ${filterType === tab 
                    ? "bg-white text-gray-800 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"}
                `}
              >
                {tab === "all" ? "All Items" : tab === "low" ? "Low Stock" : "Out of Stock"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full md:w-80">
            <Input 
              leftIcon={<Search size={18} />} 
              placeholder="Search by name or SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border-transparent focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. PRODUCT LIST */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
             <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <Filter className="text-gray-400" size={24} />
             </div>
             <h3 className="text-gray-800 font-bold">No products found</h3>
             <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
           </div>
        ) : (
          filteredProducts.map((product) => {
            // Logic for Color Coding
            const isOut = product.currentStock === 0;
            const isLow = !isOut && product.currentStock <= product.minThreshold;
            const statusColor = isOut ? "bg-red-50 border-red-100" : isLow ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100";
            const textColor = isOut ? "text-red-700" : isLow ? "text-amber-700" : "text-gray-700";

            return (
              <div 
                key={product.id} 
                className={`
                  group relative flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl border transition-all hover:shadow-md
                  ${statusColor}
                `}
              >
                {/* Image & Basic Info */}
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center text-3xl border border-gray-100">
                    {product.image}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-800">{product.name}</h4>
                      {isOut && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Out of Stock</span>}
                      {isLow && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Low Stock</span>}
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">SKU: {product.sku} • {product.category}</p>
                  </div>
                </div>

                {/* Stock Level Visuals */}
                <div className="flex-1 w-full md:w-auto flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className={textColor}>Current: {product.currentStock}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden border border-black/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${Math.min((product.currentStock / (product.minThreshold * 2)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Min Threshold: <span className="font-bold text-gray-500">{product.minThreshold}</span>
                  </p>
                </div>

                {/* Action: Refill Input */}
                <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 border-gray-200/50 pt-4 md:pt-0 mt-2 md:mt-0">
                  <div className="w-32">
                    <Input 
                      type="number" 
                      placeholder="+ Qty" 
                      value={refillInputs[product.id] || ""}
                      onChange={(e) => handleRefillChange(product.id, e.target.value)}
                      className="bg-white/80 border-gray-200"
                    />
                  </div>
                  <button 
                    onClick={() => executeRefill(product.id)}
                    disabled={!refillInputs[product.id]}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RefillPage;