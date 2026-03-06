import { useMemo, useState } from "react";
import { Edit2, Trash2, Plus, Search, Box, AlertTriangle, IndianRupee } from "lucide-react";
import Input from "@/components/ui/Input";
import Table from "@/components/common/Table";
import { StatCard } from "@/components/common/StatsCard";

const ProductDashboard = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const rawProducts = [
    { id: 1, name: "Premium T-Shirt", price: 599, stock: 45, category: "Clothing", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200" },
    { id: 2, name: "Wireless Earbuds", price: 1299, stock: 5, category: "Electronics", image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200" },
    { id: 3, name: "Smart Watch", price: 2499, stock: 0, category: "Electronics", image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=200" },
  ];

  // --- 💡 Logic for Stats ---
  const stats = useMemo(() => {
    const lowStockCount = rawProducts.filter(p => p.stock <= 10).length;
    const totalInventoryValue = rawProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
    return { lowStockCount, totalInventoryValue };
  }, [rawProducts]);

  const getStockBadge = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-600";
    if (stock <= 10) return "bg-orange-100 text-orange-600";
    return "bg-green-100 text-green-600";
  };

  const filtered = useMemo(() => {
    return rawProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, rawProducts]);

  // --- 🎨 Transform Data for Table ---
  const tableData = filtered.map((product) => ({
    ...product,
    product: (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden border">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-110 transition" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{product.name}</p>
          <p className="text-xs text-gray-400">ID: #{product.id}</p>
        </div>
      </div>
    ),
    category: <span className="text-sm text-gray-600">{product.category}</span>,
    price: <span className="font-semibold text-gray-800">₹ {product.price}</span>,
    stock: (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStockBadge(product.stock)}`}>
        {product.stock} units
      </span>
    ),
    status: product.stock === 0 ? (
      <span className="text-red-500 text-sm font-medium">Out of Stock</span>
    ) : (
      <span className="text-green-600 text-sm font-medium">Active</span>
    ),
    actions: (
      <div className="flex gap-2 justify-end">
        <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"><Edit2 size={16} /></button>
        <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"><Trash2 size={16} /></button>
      </div>
    ),
  }));

  const columns = [
    { key: "product", label: "Product" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price (₹)", className: "text-center" },
    { key: "stock", label: "Stock", className: "text-center" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", className: "text-right" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
          <p className="text-gray-500 text-sm">Manage your inventory and product details</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-md active:scale-95">
          <Plus size={20} /> Add New Product
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <StatCard
          label="Total Products" value={rawProducts.length} icon={Box}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Low Stock Items" value={stats.lowStockCount} icon={AlertTriangle}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatCard
          label="Inventory Value" value={`₹ ${stats.totalInventoryValue.toLocaleString()}`} icon={IndianRupee}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />

      </div>

      <div className="flex justify-end mb-4">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <Table
          columns={columns}
          data={tableData}
          rowKey="id"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    </div>
  );
};

export default ProductDashboard;