import { useMemo, useState, useEffect } from "react";
import {
  Edit2, Plus, Search,
  Box, AlertCircle, Wallet, Eye, EyeOff,
  CheckCircle2, XCircle, LayoutGrid, List,
  Tag, Package, Star, X, Settings2, Sparkles, Loader2
} from "lucide-react";
import { inventoryApi, inventoryCustomFieldsApi, type InventoryCustomFieldDefinition } from "../../../services/api/inventory";
import { SHOP_ID } from "../../../services/endpoints";
import { useToast } from "../../../context/ToastContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  status: "Active" | "Out of Stock" | "Draft";
  image: string;
  rating: number;
  sold: number;
  visibleOnApp: boolean;
  raw: any; // original backend object
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stockStyle(stock: number): { bg: string; text: string; border: string; label: string } {
  if (stock === 0)    return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca",  label: "Out of stock" };
  if (stock <= 10)    return { bg: "#fffbeb", text: "#d97706", border: "#fde68a",  label: `${stock} left` };
  return               { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0",        label: `${stock} in stock` };
}

// ─── Visibility Toggle ────────────────────────────────────────────────────────
function AppVisibilityToggle({ visible, onChange, loading }: { visible: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!loading) onChange(); }}
      disabled={loading}
      title={visible ? "Visible on app — click to hide" : "Hidden from app — click to show"}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-[1.5px] font-bold text-[11px] transition-all cursor-pointer disabled:opacity-50"
      style={
        visible
          ? { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }
          : { background: "#f8fafc", color: "#94a3b8", borderColor: "#e2e8f0" }
      }
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : visible ? (
        <Eye size={12} strokeWidth={2.5} />
      ) : (
        <EyeOff size={12} strokeWidth={2.5} />
      )}
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
  onEdit,
  actionLoading,
}: {
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onEdit: () => void;
  actionLoading?: boolean;
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
            className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg border max-w-[120px] truncate"
            style={{ background: "#eff6ff", color: "#3b82f6", borderColor: "#bfdbfe" }}
          >
            {product.category}
          </span>
          <span className="text-[10.5px] text-slate-400 font-medium truncate">#{product.id.slice(-8)}</span>
        </div>

        {/* Name */}
        <p className="text-[13.5px] font-bold text-slate-800 leading-snug line-clamp-2 h-10">{product.name}</p>

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
          <span className="text-[18px] font-extrabold text-slate-800">₹{product.price.toLocaleString("en-IN")}</span>
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
          <AppVisibilityToggle visible={product.visibleOnApp} onChange={onToggleVisibility} loading={actionLoading} />

          <div className="flex items-center gap-1.5">
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer animate-none"
              title="Edit & Custom Fields"
            >
              <Edit2 size={13} strokeWidth={2.5} />
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
  onEdit,
  actionLoading,
}: {
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onEdit: () => void;
  actionLoading?: boolean;
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
          <span className="text-[10.5px] text-slate-400">#{product.id.slice(-8)}</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border max-w-[100px] truncate"
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
        ₹{product.price.toLocaleString("en-IN")}
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
        <AppVisibilityToggle visible={product.visibleOnApp} onChange={onToggleVisibility} loading={actionLoading} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
        >
          <Edit2 size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ProductDashboard = () => {
  const [products, setProducts]           = useState<Product[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedIds, setSelectedIds]     = useState<string[]>([]);
  const [search, setSearch]               = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter]   = useState<"All" | "Visible" | "Hidden">("All");
  const [viewMode, setViewMode]           = useState<"grid" | "list">("list");
  
  // Custom Field / Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [customFields, setCustomFields] = useState<InventoryCustomFieldDefinition[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [fieldLoading, setFieldLoading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  
  // Create Field Sub-state
  const [showCreateField, setShowCreateField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldVisible, setNewFieldVisible] = useState(true);
  const [creatingField, setCreatingField] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { showToast } = useToast();

  // Load Products
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getInventoriesByShop(SHOP_ID);
      const rawList = Array.isArray(res?.data) 
        ? res.data 
        : (res?.data?.inventories ?? (Array.isArray(res?.datas) ? res.datas : (res?.datas?.inventories ?? [])));

      const mapped: Product[] = (rawList || []).map((p: any) => {
        const physical = p.stock_infos?.physical_stocks ?? p.stock_infos?.available_stocks ?? 0;
        return {
          id: p.id,
          name: p.name || "Unnamed Product",
          price: p.pricing_infos?.sell_price ?? p.sell_price ?? 0,
          stock: physical,
          category: p.category_infos?.name || p.category_id || "Uncategorized",
          status: physical === 0 ? "Out of Stock" : "Active",
          image: p.images?.[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop",
          rating: p.rating || 4.5,
          sold: p.sold || 12,
          visibleOnApp: p.visible_online ?? false,
          raw: p
        };
      });
      setProducts(mapped);
    } catch (err: any) {
      console.error(err);
      showToast("Failed to load products from database", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Dynamically compute categories from active products
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    cats.add("All");
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Load Custom Fields definitions and current product values
  const loadCustomFieldsForProduct = async (product: Product) => {
    try {
      setFieldLoading(true);
      const fields = await inventoryCustomFieldsApi.getAllFields(SHOP_ID);
      setCustomFields(fields);

      const values = await inventoryCustomFieldsApi.getValuesByProduct(SHOP_ID, product.id);
      const valuesMap: Record<string, string> = {};
      values.forEach(v => {
        valuesMap[v.field_id] = v.value;
      });
      setCustomValues(valuesMap);
    } catch (err) {
      console.error(err);
      showToast("Error loading custom fields", "error");
    } finally {
      setFieldLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setShowCreateField(false);
    loadCustomFieldsForProduct(product);
  };

  // Create custom field definition
  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !newFieldLabel.trim()) {
      showToast("Please enter field name and label", "warning");
      return;
    }
    try {
      setCreatingField(true);
      await inventoryCustomFieldsApi.createField({
        shop_id: SHOP_ID,
        field_name: newFieldName.toLowerCase().replace(/\s+/g, "_"),
        label_name: newFieldLabel,
        type: newFieldType,
        required: newFieldRequired,
        visible_online: newFieldVisible
      });
      showToast("Custom field created successfully!", "success");
      setNewFieldName("");
      setNewFieldLabel("");
      setShowCreateField(false);
      
      // Refresh fields list
      if (editingProduct) {
        const fields = await inventoryCustomFieldsApi.getAllFields(SHOP_ID);
        setCustomFields(fields);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to create custom field", "error");
    } finally {
      setCreatingField(false);
    }
  };

  // Save product details and custom fields
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    try {
      setSavingProduct(true);
      
      // Build bulk values payload for custom fields
      const valuesToSave = Object.entries(customValues).map(([fieldId, value]) => ({
        field_id: fieldId,
        value: String(value)
      }));

      // Call bulk update values if values present
      if (valuesToSave.length > 0) {
        await inventoryCustomFieldsApi.bulkUpsertValues({
          shop_id: SHOP_ID,
          product_id: editingProduct.id,
          values: valuesToSave
        });
      }

      // Update product online visibility
      await inventoryApi.updateInventory({
        id: editingProduct.id,
        shop_id: SHOP_ID,
        visible_online: editingProduct.visibleOnApp
      });

      showToast("Product updated successfully", "success");
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      console.error(err);
      showToast("Error updating product details", "error");
    } finally {
      setSavingProduct(false);
    }
  };

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
  const toggleVisibility = async (id: string) => {
    const current = products.find(p => p.id === id);
    if (!current) return;
    try {
      setTogglingId(id);
      await inventoryApi.updateInventory({
        id: current.id,
        shop_id: SHOP_ID,
        visible_online: !current.visibleOnApp
      });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, visibleOnApp: !p.visibleOnApp } : p));
      showToast(`Product visibility updated`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle product visibility", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(p => p.id));
  };

  const bulkToggleVisibility = async (visible: boolean) => {
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await inventoryApi.updateInventory({
          id,
          shop_id: SHOP_ID,
          visible_online: visible
        });
      }
      showToast(`Updated visibility for ${selectedIds.length} products`, "success");
      setSelectedIds([]);
      loadProducts();
    } catch (err) {
      console.error(err);
      showToast("Error updating visibility", "error");
    } finally {
      setLoading(false);
    }
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
      </div>

      {/* Loading state */}
      {loading && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="animate-spin text-blue-500" />
          <span className="text-sm font-semibold text-slate-500">Loading products from database...</span>
        </div>
      ) : (
        <>
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
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 flex-wrap max-h-32 overflow-y-auto">
              {categoriesList.slice(0, 8).map(cat => {
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
                  onEdit={() => handleOpenEdit(p)}
                  actionLoading={togglingId === p.id}
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
                  onEdit={() => handleOpenEdit(p)}
                  actionLoading={togglingId === p.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Product & Custom Fields Modal ── */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Settings2 className="text-blue-500" size={20} />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-[16px]">Manage Online Listing</h3>
                  <p className="text-[11px] text-slate-400">Configure visibility and custom attributes</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingProduct(null)} 
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Product mini info card */}
              <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <img 
                  src={editingProduct.image} 
                  alt={editingProduct.name} 
                  className="w-16 h-16 rounded-xl object-cover border" 
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                    {editingProduct.category}
                  </span>
                  <h4 className="font-extrabold text-slate-800 text-[14px] truncate mt-1">{editingProduct.name}</h4>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">Price: ₹{editingProduct.price} · Stock: {editingProduct.stock}</p>
                </div>
              </div>

              {/* Visibility Section */}
              <div className="space-y-2">
                <label className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider">App Visibility</label>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
                  <div>
                    <p className="text-[13.5px] font-bold text-slate-700">Show on Online Store</p>
                    <p className="text-[11.5px] text-slate-400">Making it visible allows customers to order it online.</p>
                  </div>
                  <AppVisibilityToggle 
                    visible={editingProduct.visibleOnApp} 
                    onChange={() => setEditingProduct({ ...editingProduct, visibleOnApp: !editingProduct.visibleOnApp })} 
                  />
                </div>
              </div>

              {/* Custom Fields Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider">Custom fields</label>
                  {!showCreateField && (
                    <button 
                      onClick={() => setShowCreateField(true)}
                      className="flex items-center gap-1 text-[11.5px] font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      <Plus size={12} /> Add Field
                    </button>
                  )}
                </div>

                {/* Create Custom Field Form */}
                {showCreateField && (
                  <form onSubmit={handleCreateField} className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3 animate-slide-up">
                    <div className="flex items-center justify-between pb-1 border-b border-blue-100">
                      <span className="text-[12px] font-bold text-blue-700 flex items-center gap-1.5">
                        <Sparkles size={13} /> Create Custom Field Definition
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setShowCreateField(false)} 
                        className="text-slate-400 hover:text-slate-600 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400">Field Label (e.g. Warranty)</label>
                        <input 
                          type="text" 
                          value={newFieldLabel} 
                          onChange={(e) => {
                            setNewFieldLabel(e.target.value);
                            if (!newFieldName) {
                              setNewFieldName(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                            }
                          }}
                          placeholder="Warranty Period"
                          className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[12px] outline-none focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400">Database Name (auto-slugified)</label>
                        <input 
                          type="text" 
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                          placeholder="warranty_period"
                          className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[12px] outline-none focus:border-blue-400 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400">Data Type</label>
                        <select 
                          value={newFieldType}
                          onChange={(e) => setNewFieldType(e.target.value)}
                          className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[12px] outline-none focus:border-blue-400"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="boolean">Yes / No</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newFieldRequired} 
                            onChange={(e) => setNewFieldRequired(e.target.checked)} 
                            className="rounded"
                          />
                          Required
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newFieldVisible} 
                            onChange={(e) => setNewFieldVisible(e.target.checked)} 
                            className="rounded"
                          />
                          Visible Online
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={creatingField}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 rounded-xl text-[12.5px] hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {creatingField && <Loader2 size={13} className="animate-spin" />}
                      Add Field definition
                    </button>
                  </form>
                )}

                {/* Field Values Forms */}
                {fieldLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2">
                    <Loader2 className="animate-spin text-blue-500" size={16} />
                    <span className="text-[12px] text-slate-400">Loading custom fields...</span>
                  </div>
                ) : customFields.length === 0 ? (
                  <div className="text-center py-6 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[12px] text-slate-400">No custom fields defined yet.</p>
                    <button 
                      onClick={() => setShowCreateField(true)}
                      className="mt-1 text-[11.5px] font-bold text-blue-500 hover:underline"
                    >
                      Create your first custom field definition
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 max-h-[220px] overflow-y-auto">
                    {customFields.map(field => (
                      <div key={field.id} className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                          <span>
                            {field.label_name} {field.required && <span className="text-red-500">*</span>}
                          </span>
                          <span className="text-[9px] text-slate-300 font-mono">({field.type})</span>
                        </label>
                        {field.type === "boolean" ? (
                          <div className="flex gap-2">
                            {["true", "false"].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setCustomValues({ ...customValues, [field.id]: val })}
                                className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer"
                                style={{
                                  background: customValues[field.id] === val ? "#eff6ff" : "white",
                                  borderColor: customValues[field.id] === val ? "#bfdbfe" : "#cbd5e1",
                                  color: customValues[field.id] === val ? "#2563eb" : "#475569"
                                }}
                              >
                                {val === "true" ? "Yes" : "No"}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input 
                            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                            value={customValues[field.id] || ""}
                            onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                            placeholder={`Enter ${field.label_name.toLowerCase()}...`}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-blue-400"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button 
                onClick={() => setEditingProduct(null)} 
                className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-[13px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProduct} 
                disabled={savingProduct}
                className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-2 rounded-xl text-[13px] hover:bg-blue-700 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {savingProduct && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDashboard;
