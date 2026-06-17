import { useMemo, useState } from "react";
import {
  Edit2, Trash2, Plus, Search,
  Box, AlertCircle, Wallet, Eye, EyeOff,
  CheckCircle2, XCircle, LayoutGrid, List,
  Tag, Package, Star,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  status: "Active" | "Out of Stock" | "Draft";
  image: string;
  rating: number;
  sold: number;
  visibleOnApp: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_PRODUCTS: Product[] = [
  { id: 1001, name: "Premium Cotton T-Shirt",    price: 599,  stock: 45, category: "Clothing",     status: "Active",       image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop", rating: 4.5, sold: 128, visibleOnApp: true  },
  { id: 1002, name: "Noise Cancelling Earbuds",  price: 1299, stock: 8,  category: "Electronics",  status: "Active",       image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200&h=200&fit=crop", rating: 4.2, sold: 64,  visibleOnApp: true  },
  { id: 1003, name: "Minimalist Smart Watch",    price: 2499, stock: 0,  category: "Electronics",  status: "Out of Stock", image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=200&h=200&fit=crop", rating: 4.7, sold: 312, visibleOnApp: false },
  { id: 1004, name: "Ergonomic Desk Chair",      price: 8500, stock: 12, category: "Furniture",    status: "Active",       image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=200&h=200&fit=crop", rating: 4.8, sold: 45,  visibleOnApp: true  },
  { id: 1005, name: "Mechanical Keyboard",       price: 3200, stock: 5,  category: "Electronics",  status: "Active",       image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=200&h=200&fit=crop", rating: 4.6, sold: 88,  visibleOnApp: false },
  { id: 1006, name: "Ceramic Coffee Mug Set",    price: 450,  stock: 60, category: "Kitchen",      status: "Active",       image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=200&h=200&fit=crop", rating: 4.3, sold: 220, visibleOnApp: true  },
];

const CATEGORIES = ["All", "Clothing", "Electronics", "Furniture", "Kitchen"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stockStyle(stock: number): { bg: string; text: string; border: string; label: string } {
  if (stock === 0)    return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca",  label: "Out of stock" };
  if (stock <= 10)    return { bg: "#fffbeb", text: "#d97706", border: "#fde68a",  label: `${stock} left` };
  return               { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0",        label: `${stock} in stock` };
}



// ─── Visibility Toggle ────────────────────────────────────────────────────────
function AppVisibilityToggle({ visible, onChange }: { visible: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      title={visible ? "Visible on app — click to hide" : "Hidden from app — click to show"}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-[1.5px] font-bold text-[11px] transition-all cursor-pointer"
      style={
        visible
          ? { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }
          : { background: "#f8fafc", color: "#94a3b8", borderColor: "#e2e8f0" }
      }
    >
      {visible
        ? <Eye size={12} strokeWidth={2.5} />
        : <EyeOff size={12} strokeWidth={2.5} />
      }
      {visible ? "Visible" : "Hidden"}
    </button>
  );
}

// ─── Product Card (Grid view) ─────────────────────────────────────────────────
function ProductCard({
  product,
  selected,
  onSelect,
  onToggleVisibility,
}: {
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
}) {
  const stock = stockStyle(product.stock);


  return (
    <div
      className="bg-white rounded-2xl border-[1.5px] overflow-hidden transition-all duration-150 flex flex-col"
      style={{
        borderColor: selected ? "#bfdbfe" : "#e2e8f0",
        boxShadow:   selected ? "0 0 0 3px #eff6ff, 0 4px 16px rgba(59,130,246,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
        opacity:     product.visibleOnApp ? 1 : 0.72,
      }}
    >
      {/* Image */}
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-40 object-cover"
          style={{ filter: product.visibleOnApp ? "none" : "grayscale(40%)" }}
          onError={(e) => { e.currentTarget.src = "https://placehold.co/200x160/f1f5f9/94a3b8?text=No+Image"; }}
        />

        {/* Checkbox overlay */}
        <div
          onClick={onSelect}
          className="absolute top-3 left-3 w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all"
          style={{
            background:  selected ? "#2563eb" : "rgba(255,255,255,0.9)",
            borderColor: selected ? "#2563eb" : "rgba(148,163,184,0.7)",
          }}
        >
          {selected && <CheckCircle2 size={13} className="text-white" strokeWidth={3} />}
        </div>

        {/* Hidden badge */}
        {!product.visibleOnApp && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-800/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
            <EyeOff size={10} /> Hidden
          </div>
        )}

        {/* Low stock badge */}
        {product.stock > 0 && product.stock <= 10 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
            <AlertCircle size={10} /> Low stock
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
            <XCircle size={10} /> Out of stock
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Category + ID */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg border"
            style={{ background: "#eff6ff", color: "#3b82f6", borderColor: "#bfdbfe" }}
          >
            {product.category}
          </span>
          <span className="text-[10.5px] text-slate-400 font-medium">#{product.id}</span>
        </div>

        {/* Name */}
        <p className="text-[13.5px] font-bold text-slate-800 leading-snug line-clamp-2">{product.name}</p>

        {/* Rating + Sold */}
        <div className="flex items-center gap-3 text-[11.5px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            {product.rating}
          </span>
          <span className="text-slate-200">·</span>
          <span>{product.sold} sold</span>
        </div>

        {/* Price + Stock */}
        <div className="flex items-center justify-between">
          <span className="text-[18px] font-extrabold text-slate-800">₹{product.price.toLocaleString()}</span>
          <span
            className="text-[11px] font-bold px-2 py-1 rounded-lg border"
            style={{ background: stock.bg, color: stock.text, borderColor: stock.border }}
          >
            {stock.label}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* App Visibility toggle + actions */}
        <div className="flex items-center justify-between gap-2">
          <AppVisibilityToggle visible={product.visibleOnApp} onChange={onToggleVisibility} />

          <div className="flex items-center gap-1.5">
            <button
              className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
              title="Edit"
            >
              <Edit2 size={13} strokeWidth={2.5} />
            </button>
            <button
              className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
              title="Delete"
            >
              <Trash2 size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Row (List view) ──────────────────────────────────────────────────
function ProductRow({
  product,
  selected,
  onSelect,
  onToggleVisibility,
}: {
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
}) {
  const stock = stockStyle(product.stock);

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-b-0 transition-colors hover:bg-slate-50/60 group"
      style={{ opacity: product.visibleOnApp ? 1 : 0.7 }}
    >
      {/* Checkbox */}
      <div
        onClick={onSelect}
        className="w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center cursor-pointer shrink-0 transition-all"
        style={{
          background:  selected ? "#2563eb" : "white",
          borderColor: selected ? "#2563eb" : "#cbd5e1",
        }}
      >
        {selected && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
      </div>

      {/* Image */}
      <div className="w-12 h-12 rounded-xl border border-slate-100 overflow-hidden shrink-0 bg-slate-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          style={{ filter: product.visibleOnApp ? "none" : "grayscale(40%)" }}
          onError={(e) => { e.currentTarget.src = "https://placehold.co/48x48/f1f5f9/94a3b8?text=?"; }}
        />
      </div>

      {/* Name + ID */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold text-slate-800 truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10.5px] text-slate-400">#{product.id}</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border"
            style={{ background: "#eff6ff", color: "#3b82f6", borderColor: "#bfdbfe" }}
          >
            {product.category}
          </span>
        </div>
      </div>

      {/* Rating */}
      <div className="hidden md:flex items-center gap-1 text-[12px] text-slate-500 w-16 shrink-0">
        <Star size={11} className="text-amber-400 fill-amber-400" />
        {product.rating}
      </div>

      {/* Price */}
      <div className="w-24 shrink-0 text-[14px] font-extrabold text-slate-800">
        ₹{product.price.toLocaleString()}
      </div>

      {/* Stock */}
      <div className="w-28 shrink-0">
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-lg border"
          style={{ background: stock.bg, color: stock.text, borderColor: stock.border }}
        >
          {stock.label}
        </span>
      </div>

      {/* App visibility toggle */}
      <div className="w-24 shrink-0">
        <AppVisibilityToggle visible={product.visibleOnApp} onChange={onToggleVisibility} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
          <Edit2 size={13} strokeWidth={2.5} />
        </button>
        <button className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer">
          <Trash2 size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ProductDashboard = () => {
  const [products, setProducts]           = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedIds, setSelectedIds]     = useState<number[]>([]);
  const [search, setSearch]               = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter]   = useState<"All" | "Visible" | "Hidden">("All");
  const [viewMode, setViewMode]           = useState<"grid" | "list">("list");

  // Stats
  const stats = useMemo(() => ({
    total:          products.length,
    visible:        products.filter(p => p.visibleOnApp).length,
    hidden:         products.filter(p => !p.visibleOnApp).length,
    lowStock:       products.filter(p => p.stock > 0 && p.stock <= 10).length,
    outOfStock:     products.filter(p => p.stock === 0).length,
    inventoryValue: products.reduce((a, p) => a + p.price * p.stock, 0),
  }), [products]);

  // Filter
  const filtered = useMemo(() => products.filter(p => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search);
    const matchCategory = categoryFilter === "All" || p.category === categoryFilter;
    const matchStatus   = statusFilter === "All"
      || (statusFilter === "Visible" && p.visibleOnApp)
      || (statusFilter === "Hidden"  && !p.visibleOnApp);
    return matchSearch && matchCategory && matchStatus;
  }), [products, search, categoryFilter, statusFilter]);

  // Handlers
  const toggleVisibility = (id: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, visibleOnApp: !p.visibleOnApp } : p));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(p => p.id));
  };

  const bulkToggleVisibility = (visible: boolean) => {
    setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, visibleOnApp: visible } : p));
    setSelectedIds([]);
  };

  return (
    <div className="py-5 px-1 space-y-5" style={{ fontFamily: "Inter, Poppins, sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff", color: "#3b82f6" }}>
              <Package size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-[20px] font-extrabold text-slate-800 tracking-tight">Product Dashboard</h1>
          </div>
          <p className="text-[13px] text-slate-400 ml-12">
            Manage inventory, pricing, and control what's visible on the customer app.
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 cursor-pointer shrink-0 shadow-md"
          style={{ background: "#3b82f6", boxShadow: "0 4px 14px rgba(59,130,246,0.3)" }}
        >
          <Plus size={15} strokeWidth={2.5} /> Add Product
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Total",       value: stats.total,         icon: <Box size={14} />,          bg: "#eff6ff", color: "#3b82f6",  border: "#bfdbfe" },
          { label: "Visible",     value: stats.visible,       icon: <Eye size={14} />,           bg: "#f0fdf4", color: "#16a34a",  border: "#bbf7d0" },
          { label: "Hidden",      value: stats.hidden,        icon: <EyeOff size={14} />,        bg: "#f8fafc", color: "#64748b",  border: "#e2e8f0" },
          { label: "Low Stock",   value: stats.lowStock,      icon: <AlertCircle size={14} />,   bg: "#fffbeb", color: "#d97706",  border: "#fde68a" },
          { label: "Out of Stock",value: stats.outOfStock,    icon: <XCircle size={14} />,       bg: "#fef2f2", color: "#dc2626",  border: "#fecaca" },
          { label: "Inv. Value",  value: `₹${(stats.inventoryValue/1000).toFixed(1)}k`, icon: <Wallet size={14} />, bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
        ].map(s => (
          <div key={s.label}
            className="flex items-center gap-2.5 p-3 rounded-xl border-[1.5px]"
            style={{ background: s.bg, borderColor: s.border }}
          >
            <span style={{ color: s.color }}>{s.icon}</span>
            <div>
              <p className="text-[18px] font-extrabold text-slate-800 leading-none">{s.value}</p>
              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search products or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-[13px] text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder-slate-400"
          />
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 flex-wrap">
          {CATEGORIES.map(cat => {
            const active = categoryFilter === cat;
            return (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className="px-3 py-1.5 rounded-lg text-[11.5px] font-bold cursor-pointer transition-all border"
                style={active
                  ? { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }
                  : { background: "transparent", color: "#94a3b8", borderColor: "transparent" }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Visibility filter pills */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
          {(["All","Visible","Hidden"] as const).map(v => {
            const active = statusFilter === v;
            return (
              <button key={v} onClick={() => setStatusFilter(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold cursor-pointer transition-all border"
                style={active
                  ? { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }
                  : { background: "transparent", color: "#94a3b8", borderColor: "transparent" }
                }
              >
                {v === "Visible" && <Eye size={11} />}
                {v === "Hidden"  && <EyeOff size={11} />}
                {v === "All"     && <Tag size={11} />}
                {v}
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
          {([
            { m: "grid" as const, icon: <LayoutGrid size={14} /> },
            { m: "list" as const, icon: <List size={14} /> },
          ]).map(({ m, icon }) => (
            <button key={m} onClick={() => setViewMode(m)}
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all border"
              style={viewMode === m
                ? { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }
                : { background: "transparent", color: "#94a3b8", borderColor: "transparent" }
              }
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Result count */}
        <span className="text-[12px] text-slate-400 font-medium whitespace-nowrap">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border-[1.5px]"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "#2563eb" }}
          >
            <CheckCircle2 size={14} className="text-white" />
          </div>
          <span className="text-[13px] font-bold text-blue-700">{selectedIds.length} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => bulkToggleVisibility(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all border"
            style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}
          >
            <Eye size={12} /> Show on App
          </button>
          <button
            onClick={() => bulkToggleVisibility(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all border"
            style={{ background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }}
          >
            <EyeOff size={12} /> Hide from App
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-[11.5px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Select all / count bar ── */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-[12px] font-semibold text-slate-500 hover:text-blue-600 cursor-pointer transition-colors"
          >
            <div
              className="w-4 h-4 rounded border-[1.5px] flex items-center justify-center"
              style={{
                background:  selectedIds.length === filtered.length ? "#2563eb" : "white",
                borderColor: selectedIds.length === filtered.length ? "#2563eb" : "#cbd5e1",
              }}
            >
              {selectedIds.length === filtered.length && <CheckCircle2 size={10} className="text-white" />}
            </div>
            {selectedIds.length === filtered.length ? "Deselect all" : "Select all"}
          </button>
          <span className="text-slate-200">·</span>
          <span className="text-[12px] text-slate-400 font-medium">
            {stats.visible} visible · {stats.hidden} hidden from app
          </span>
        </div>
      )}

      {/* ── Products Grid or List ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Search size={24} className="text-slate-400" />
          </div>
          <p className="text-[14px] font-bold text-slate-700">No products found</p>
          <p className="text-[12.5px] text-slate-400">Try adjusting your filters or search term</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              selected={selectedIds.includes(p.id)}
              onSelect={() => toggleSelect(p.id)}
              onToggleVisibility={() => toggleVisibility(p.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* List Header */}
          <div className="flex items-center gap-4 px-5 py-3 bg-slate-50/70 border-b border-slate-100">
            <div className="w-5 shrink-0" />
            <div className="w-12 shrink-0" />
            <div className="flex-1 text-[10.5px] font-black text-slate-400 uppercase tracking-wider">Product</div>
            <div className="w-16 text-[10.5px] font-black text-slate-400 uppercase tracking-wider hidden md:block">Rating</div>
            <div className="w-24 text-[10.5px] font-black text-slate-400 uppercase tracking-wider">Price</div>
            <div className="w-28 text-[10.5px] font-black text-slate-400 uppercase tracking-wider">Stock</div>
            <div className="w-24 text-[10.5px] font-black text-slate-400 uppercase tracking-wider">App</div>
            <div className="w-20 text-[10.5px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</div>
          </div>
          {filtered.map(p => (
            <ProductRow
              key={p.id}
              product={p}
              selected={selectedIds.includes(p.id)}
              onSelect={() => toggleSelect(p.id)}
              onToggleVisibility={() => toggleVisibility(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductDashboard;
