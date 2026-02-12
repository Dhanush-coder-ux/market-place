import  { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  PackageX, 
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
  const [expandedRefill, setExpandedRefill] = useState<string | null>(null);

const [refillDetails, setRefillDetails] = useState<
  Record<string, { qty: string; buyingPrice: string; sellingPrice: string }>
>({});

  


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
const handleRefillDetailChange = (
  id: string,
  field: "qty" | "buyingPrice" | "sellingPrice",
  value: string
) => {
  setRefillDetails((prev) => ({
    ...prev,
    [id]: {
      qty: prev[id]?.qty || "",
      buyingPrice: prev[id]?.buyingPrice || "",
      sellingPrice: prev[id]?.sellingPrice || "",
      [field]: value,
    },
  }));
};
const executeRefill = (id: string) => {
  const data = refillDetails[id];
  if (!data || !data.qty) return;

  const qty = parseInt(data.qty);
  if (qty <= 0) return;

  setProducts((prev) =>
    prev.map((p) =>
      p.id === id
        ? {
            ...p,
            currentStock: p.currentStock + qty,
            lastRestocked: new Date().toISOString().split("T")[0],
          }
        : p
    )
  );

  console.log("Refill Payload:", {
    productId: id,
    quantity: qty,
    buyingPrice: data.buyingPrice,
    sellingPrice: data.sellingPrice,
  });

  setRefillDetails((prev) => ({ ...prev, [id]: { qty: "", buyingPrice: "", sellingPrice: "" } }));
  setExpandedRefill(null);
};


  return (
    <div className="p-6 space-y-8">
      
      {/* 1. HEADER & STATS */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Title icon={<RefreshCcw size={30} />} title="Refill Inventory" subtitle="Manage stock levels and replenish inventory" />
        </div>

        {/* Use your HeaderCard here */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
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
                {/* Stock Level Visuals */}
<div className="flex-1 w-full md:w-auto flex flex-col gap-2">
  <div className="flex justify-between text-xs font-semibold">
    <span className={textColor}>
      Current Stock: {product.currentStock}
    </span>
  </div>

  {/* Progress Bar */}
  <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden border border-black/5">
    <div
      className={`h-full rounded-full transition-all duration-500 ${
        isOut ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
      }`}
      style={{
        width: `${Math.min(
          (product.currentStock / (product.minThreshold * 2)) * 100,
          100
        )}%`,
      }}
    />
  </div>

  {/* Min Threshold Input */}
  <div className="mt-2 max-w-[180px]">
    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
      Minimum Threshold
    </p>
    <Input
      type="number"
      placeholder={product.minThreshold.toString()}
      value={refillDetails[product.id]?.minThreshold || ""}
      onChange={(e) =>
        handleRefillDetailChange(
          product.id,
          "minThreshold",
          e.target.value
        )
      }
      className="h-9 bg-white border-gray-200 focus:border-blue-500"
    />
  </div>
</div>


                {/* Action: Refill Input */}
            {/* Refill Section */}
<div className="w-full lg:w-[450px] border-t md:border-t-0 pt-4 md:pt-0">
  <div className="flex items-center gap-3">
    {/* Quantity Input with Label */}
    <div className="flex-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Restock Qty</p>
      <Input
        type="number"
        placeholder="0"
        value={refillDetails[product.id]?.qty || ""}
        onChange={(e) => handleRefillDetailChange(product.id, "qty", e.target.value)}
        className="h-11 bg-white border-gray-200 focus:border-blue-500 shadow-sm"
      />
    </div>

    {/* Toggle Link - Stylized as a subtle button */}
    <div className="mt-5">
      <button
        onClick={() => setExpandedRefill(expandedRefill === product.id ? null : product.id)}
        className={`flex items-center gap-1 text-[11px] font-bold px-3 py-2 rounded-lg transition-colors ${
          expandedRefill === product.id 
            ? "bg-blue-50 text-blue-600" 
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        {expandedRefill === product.id ? "Hide Prices" : "Update Prices"}
      </button>
    </div>

    {/* Execute Button */}
    <div className="mt-5">
      <button
        onClick={() => executeRefill(product.id)}
        disabled={!refillDetails[product.id]?.qty}
        className="h-11 px-4 flex items-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200 active:scale-95"
      >
        <Plus size={18} strokeWidth={3} />
        <span className="font-bold text-sm">Refill</span>
      </button>
    </div>
  </div>

  {/* Expanded Price Inputs - Now styled as a sub-form */}
  {expandedRefill === product.id && (
    <div className="mt-3 grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
      <div>
        <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 ml-1">New Buying Price (₹)</p>
        <Input
          type="number"
          placeholder="0.00"
          value={refillDetails[product.id]?.buyingPrice || ""}
          onChange={(e) => handleRefillDetailChange(product.id, "buyingPrice", e.target.value)}
          className="bg-white border-blue-200"
        />
      </div>
      <div>
        <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 ml-1">New Selling Price (₹)</p>
        <Input
          type="number"
          placeholder="0.00"
          value={refillDetails[product.id]?.sellingPrice || ""}
          onChange={(e) => handleRefillDetailChange(product.id, "sellingPrice", e.target.value)}
          className="bg-white border-blue-200"
        />
      </div>
    </div>
  )}
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