import { useMemo, useState } from "react";
import { 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  Box, 
  AlertCircle, 
  Wallet,
  Filter
} from "lucide-react";

// Mock Data
const rawProducts = [
  { id: 1001, name: "Premium Cotton T-Shirt", price: 599, stock: 45, category: "Clothing", status: "Active", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop" },
  { id: 1002, name: "Noise Cancelling Earbuds", price: 1299, stock: 8, category: "Electronics", status: "Active", image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=100&h=100&fit=crop" },
  { id: 1003, name: "Minimalist Smart Watch", price: 2499, stock: 0, category: "Electronics", status: "Out of Stock", image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=100&h=100&fit=crop" },
  { id: 1004, name: "Ergonomic Desk Chair", price: 8500, stock: 12, category: "Furniture", status: "Active", image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=100&h=100&fit=crop" },
  { id: 1005, name: "Mechanical Keyboard", price: 3200, stock: 5, category: "Electronics", status: "Active", image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=100&h=100&fit=crop" },
];

const ProductDashboard = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // --- Derived Stats ---
  const stats = useMemo(() => {
    const lowStockCount = rawProducts.filter(p => p.stock > 0 && p.stock <= 10).length;
    const totalInventoryValue = rawProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
    return { total: rawProducts.length, lowStockCount, totalInventoryValue };
  }, []);

  // --- Filtering ---
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search);
      const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  // --- Helpers ---
  const getStockPill = (stock: number) => {
    if (stock === 0) return "bg-red-50 text-red-600 border-red-100";
    if (stock <= 10) return "bg-amber-50 text-amber-600 border-amber-100";
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  };

  const getStatusDot = (status: string) => {
    if (status === "Out of Stock") return "bg-red-500";
    if (status === "Draft") return "bg-slate-300";
    return "bg-emerald-500";
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans antialiased text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-medium text-slate-900 tracking-tight">Products</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your inventory, pricing, and product details.</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 shadow-sm">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* ── STATS OVERVIEW ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 transition-shadow hover:shadow-md">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Box size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Products</p>
              <p className="text-2xl font-medium text-slate-900 leading-none">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 transition-shadow hover:shadow-md">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Low Stock</p>
              <p className="text-2xl font-medium text-slate-900 leading-none">{stats.lowStockCount}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 transition-shadow hover:shadow-md">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Inventory Value</p>
              <p className="text-2xl font-medium text-slate-900 leading-none">₹ {stats.totalInventoryValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR (SEARCH & FILTERS) ── */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search products or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-shadow shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md">
                {selectedIds.length} selected
              </span>
            )}
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-600 appearance-none focus:outline-none focus:ring-1 focus:ring-slate-300 shadow-sm cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Clothing">Clothing</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── PRODUCT TABLE ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-6 py-3 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
               </ th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">#{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{product.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">₹ {product.price.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStockPill(product.stock)}`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(product.status)}`}></span>
                        <span className="text-sm text-slate-600">{product.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    No products found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default ProductDashboard;