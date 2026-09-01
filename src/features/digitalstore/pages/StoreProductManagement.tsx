import { useMemo, useState, useEffect } from "react";
import { useRef } from "react";
import {
  Edit2, Plus, Search,
  AlertCircle, Eye, EyeOff,
  CheckCircle2, XCircle, LayoutGrid, List,
  Tag, Loader2,
  MoreVertical, ChevronDown, Sliders, GripVertical, Trash2,
} from "lucide-react";
import { inventoryApi, inventoryCustomFieldsApi } from "../../../services/api/inventory";
import { SHOP_ID } from "../../../services/endpoints";
import { useToast } from "../../../context/ToastContext";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  buyPrice?: number;
  onlineSellPrice?: number;
  stock: number;
  category: string;
  status: "Active" | "Out of Stock" | "Draft";
  image: string;
  rating: number;
  sold: number;
  visibleOnApp: boolean;
  hasBatch: boolean;
  hasVariant: boolean;
  hasSerialNo: boolean;
  batchCount: number;
  variantCount: number;
  unit: string;
  sku: string;
  uiId: string;
  gst: string;
  isActive: boolean;
  haveTracking?: boolean;
  raw: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stockStyle(stock: number): { textColor: string; label: string; indicator: string } {
  if (stock === 0) return { textColor: "text-red-600", label: "Out of stock", indicator: "bg-red-400" };
  if (stock <= 10) return { textColor: "text-amber-600", label: `${stock} left`, indicator: "bg-amber-400" };
  return { textColor: "text-emerald-600", label: `${stock}`, indicator: "bg-emerald-400" };
}

// ─── Visibility Toggle ────────────────────────────────────────────────────────
function AppVisibilityToggle({ visible, onChange, loading }: { visible: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!loading) onChange(); }}
      disabled={loading}
      title={visible ? "Visible on app — click to hide" : "Hidden from app — click to show"}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-medium transition-all cursor-pointer disabled:opacity-50 ${visible
        ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
        }`}
    >
      {loading ? (
        <Loader2 size={11} className="animate-spin" />
      ) : visible ? (
        <Eye size={11} strokeWidth={2} />
      ) : (
        <EyeOff size={11} strokeWidth={2} />
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
      className={`bg-white rounded-xl border overflow-hidden flex flex-col transition-all duration-150 ${selected ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
        }`}
      style={{ opacity: product.visibleOnApp ? 1 : 0.65 }}
    >
      {/* Image */}
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-36 object-cover"
          style={{ filter: product.visibleOnApp ? "none" : "grayscale(40%)" }}
          onError={(e) => { e.currentTarget.src = "https://placehold.co/200x144/f1f5f9/94a3b8?text=No+Image"; }}
        />

        {/* Checkbox */}
        <div
          onClick={onSelect}
          className={`absolute top-2.5 left-2.5 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${selected ? "bg-blue-600 border-blue-600" : "bg-white/90 border-slate-300"
            }`}
        >
          {selected && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
        </div>

        {/* Hidden badge */}
        {!product.visibleOnApp && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-800/75 text-white text-[10px] font-medium px-2 py-0.5 rounded">
            <EyeOff size={9} /> Hidden
          </div>
        )}

        {/* Stock alert */}
        {product.stock === 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-red-500 text-white text-[10px] font-medium px-2 py-0.5 rounded">
            <XCircle size={9} /> Out of stock
          </div>
        )}
        {product.stock > 0 && product.stock <= 10 && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-medium px-2 py-0.5 rounded">
            <AlertCircle size={9} /> Low stock
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1 gap-2.5">
        <div>
          <span className="text-[10.5px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
            {product.category}
          </span>
          <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 mt-1.5">
            {product.name}
          </p>
          {product.description && (
            <p className="text-[11px] text-slate-500 line-clamp-2 italic mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
              {product.description}
            </p>
          )}
          {product.sku && (
            <p className="text-[10px] font-mono text-slate-400 mt-1">{product.sku}</p>
          )}
        </div>

        {/* Tracking badges */}
        {(product.hasBatch || product.hasVariant || product.hasSerialNo || (!product.isActive && product.haveTracking !== false)) && (
          <div className="flex flex-wrap gap-1">
            {product.hasBatch && (
              <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200">
                Batch ·{product.batchCount}
              </span>
            )}
            {product.hasVariant && (
              <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200">
                Variants ·{product.variantCount}
              </span>
            )}
            {product.hasSerialNo && (
              <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200">
                Serial
              </span>
            )}
            {!product.isActive && product.haveTracking !== false && (
              <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded border bg-slate-50 text-slate-400 border-slate-200">
                Inactive
              </span>
            )}
          </div>
        )}

        {/* Price + Stock */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-emerald-600">
                ₹{(product.onlineSellPrice ?? product.price ?? 0).toLocaleString("en-IN")}
              </span>
              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                Online SP
              </span>
            </div>
            {product.price > 0 && (
              <span className="text-[10px] text-slate-400">
                Store SP: ₹{product.price.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <span className={`text-[11px] font-medium ${stock.textColor} flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stock.indicator} inline-block`} />
            {stock.label}
          </span>
        </div>

        <div className="border-t border-slate-100" />

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <AppVisibilityToggle visible={product.visibleOnApp} onChange={onToggleVisibility} loading={actionLoading} />
          <CardMoreMenu onEdit={onEdit} onToggleVisibility={onToggleVisibility} visible={product.visibleOnApp} actionLoading={actionLoading} />
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
    <tr
      className={`group transition-all cursor-default ${selected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-slate-50/60"} ${!product.visibleOnApp ? "opacity-65" : ""}`}
    >
      {/* Checkbox */}
      <td className="px-4 py-4 border-b border-slate-200 w-10 text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
        />
      </td>

      {/* Product */}
      <td className="px-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-slate-100 overflow-hidden shrink-0 bg-slate-50">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              style={{ filter: product.visibleOnApp ? "none" : "grayscale(40%)" }}
              onError={(e) => { e.currentTarget.src = "https://placehold.co/40x40/f1f5f9/94a3b8?text=?"; }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-800 truncate max-w-[180px]">{product.name}</p>
            {product.description && (
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] italic">{product.description}</p>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              {!product.isActive && product.haveTracking !== false && (
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  Inactive
                </span>
              )}
              {product.hasBatch && (
                <span className="text-[10px] text-slate-400">Batch ·{product.batchCount}</span>
              )}
              {product.hasVariant && (
                <span className="text-[10px] text-slate-400">Variants ·{product.variantCount}</span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* SKU */}
      <td className="px-4 py-4 border-b border-slate-200 hidden md:table-cell">
        <span className="text-[11px] font-mono text-slate-400 font-semibold">
          {product.sku || product.uiId || `#${product.id.slice(-6)}`}
        </span>
      </td>

      {/* Category */}
      <td className="px-4 py-4 border-b border-slate-200">
        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {product.category}
        </span>
      </td>

      {/* Store SP */}
      <td className="px-4 py-4 border-b border-slate-200 text-right">
        <span className="text-[13px] font-bold text-slate-700 font-mono">
          {product.price > 0
            ? `₹${product.price.toLocaleString("en-IN")}`
            : <span className="text-slate-300">—</span>
          }
        </span>
      </td>

      {/* Online SP */}
      <td className="px-4 py-4 border-b border-slate-200 text-right">
        <span className="text-[13px] font-bold font-mono text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md inline-block">
          ₹{(product.onlineSellPrice ?? product.price ?? 0).toLocaleString("en-IN")}
        </span>
      </td>

      {/* Stock */}
      <td className="px-4 py-4 border-b border-slate-200">
        <span className={`text-[12px] font-medium ${stock.textColor} flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${stock.indicator} inline-block shrink-0`} />
          {stock.label}
        </span>
      </td>

      {/* Visibility */}
      <td className="px-4 py-4 border-b border-slate-200">
        <AppVisibilityToggle visible={product.visibleOnApp} onChange={onToggleVisibility} loading={actionLoading} />
      </td>

      {/* Actions */}
      <td className="px-4 py-4 border-b border-slate-200 text-right sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-200 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] transition-colors whitespace-nowrap">
        <RowMoreMenu onEdit={onEdit} onToggleVisibility={onToggleVisibility} visible={product.visibleOnApp} actionLoading={actionLoading} />
      </td>
    </tr>
  );
}

// ─── Row More Menu ─────────────────────────────────────────────────────────────
function RowMoreMenu({ onEdit, onToggleVisibility, visible, actionLoading }: { onEdit: () => void; onToggleVisibility: () => void; visible: boolean; actionLoading?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useState(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  });

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
        title="More actions"
      >
        <MoreVertical size={13} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[160px]">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors text-left"
          >
            <Sliders size={12} className="text-blue-500" />
            Custom Fields
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); setOpen(false); }}
            disabled={actionLoading}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors text-left disabled:opacity-50"
          >
            {visible
              ? <><EyeOff size={12} className="text-slate-400" /> Hide from App</>
              : <><Eye size={12} className="text-emerald-500" /> Show on App</>
            }
          </button>
          <div className="h-px bg-slate-100 mx-3 my-1" />
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors text-left"
          >
            <Edit2 size={12} className="text-slate-400" />
            Edit Product
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Card More Menu ────────────────────────────────────────────────────────────
function CardMoreMenu({ onEdit, onToggleVisibility, visible, actionLoading }: { onEdit: () => void; onToggleVisibility: () => void; visible: boolean; actionLoading?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useState(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all cursor-pointer"
        title="More actions"
      >
        <MoreVertical size={13} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute right-0 bottom-9 z-30 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[160px]">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors text-left"
          >
            <Sliders size={12} className="text-blue-500" />
            Custom Fields
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); setOpen(false); }}
            disabled={actionLoading}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors text-left disabled:opacity-50"
          >
            {visible
              ? <><EyeOff size={12} className="text-slate-400" /> Hide from App</>
              : <><Eye size={12} className="text-emerald-500" /> Show on App</>
            }
          </button>
          <div className="h-px bg-slate-100 mx-3 my-1" />
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors text-left"
          >
            <Edit2 size={12} className="text-slate-400" />
            Edit Product
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ProductDashboard = () => {

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Visible" | "Hidden">("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Custom Field / Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [savingProduct, setSavingProduct] = useState(false);

  // Additional Details State
  const [additionalSections, setAdditionalSections] = useState<{ id: string; title: string; content: string }[]>([]);

  const addSection = () => {
    if (additionalSections.length >= 3) return;
    setAdditionalSections([...additionalSections, { id: Date.now().toString(), title: "", content: "" }]);
  };

  const updateSection = (id: string, field: 'title' | 'content', value: string) => {
    setAdditionalSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSection = (id: string) => {
    setAdditionalSections(prev => prev.filter(s => s.id !== id));
  };

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { showToast } = useToast();

  // Load Products
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getInventoriesByShop(SHOP_ID, { active: "true" });
      const rawList = Array.isArray(res?.data)
        ? res.data
        : (res?.data?.inventories ?? (Array.isArray(res?.datas) ? res.datas : (res?.datas?.inventories ?? [])));

      const mapped: Product[] = (rawList || []).map((p: any) => {
        const image = Array.isArray(p.image_url) && p.image_url.length > 0
          ? p.image_url[0]
          : (p.images?.[0] || "https://placehold.co/200x160/f1f5f9/94a3b8?text=No+Image");

        const hasBatch = p.type_infos?.has_batch ?? false;
        const hasVariant = p.type_infos?.has_variant ?? false;
        const hasSerialNo = p.type_infos?.has_serialno ?? false;

        let totalStock = 0;
        let price = 0;
        let buyPrice = 0;
        let onlineSellPrice = 0;

        if (hasBatch && Array.isArray(p.batch_infos) && p.batch_infos.length > 0) {
          totalStock = p.batch_infos.reduce((sum: number, b: any) => {
            return sum + (b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? 0);
          }, 0);
          const batchWithPrice = p.batch_infos.find((b: any) => b.pricing_infos?.sell_price);
          price = batchWithPrice?.pricing_infos?.sell_price ?? 0;
          buyPrice = batchWithPrice?.pricing_infos?.buy_price ?? 0;
          onlineSellPrice = batchWithPrice?.pricing_infos?.online_sell_price ?? price;
        } else if (hasVariant && p.variants && typeof p.variants === "object") {
          const variantList = Object.values(p.variants) as any[];
          totalStock = variantList.reduce((sum: number, v: any) => {
            return sum + (v.stock_infos?.available_stocks ?? v.stock_infos?.physical_stocks ?? 0);
          }, 0);
          const variantWithPrice = variantList.find((v: any) => v.pricing_infos?.sell_price);
          price = variantWithPrice?.pricing_infos?.sell_price ?? 0;
          buyPrice = variantWithPrice?.pricing_infos?.buy_price ?? 0;
          onlineSellPrice = variantWithPrice?.pricing_infos?.online_sell_price ?? price;
        } else {
          totalStock = p.stock_infos?.available_stocks ?? p.stock_infos?.physical_stocks ?? 0;
          price = p.pricing_infos?.sell_price ?? p.sell_price ?? 0;
          buyPrice = p.pricing_infos?.buy_price ?? p.buy_price ?? 0;
          onlineSellPrice = p.pricing_infos?.online_sell_price ?? p.online_sell_price ?? price;
        }

        const batchCount = Array.isArray(p.batch_infos) ? p.batch_infos.length : 0;
        const variantCount = p.variants && typeof p.variants === "object" ? Object.keys(p.variants).length : 0;

        return {
          id: p.id,
          name: p.name || "Unnamed Product",
          description: p.description || "",
          price,
          buyPrice,
          onlineSellPrice,
          stock: Math.floor(totalStock),
          category: p.category_infos?.name || p.category_id || "Uncategorized",
          status: !p.is_active ? "Draft" : totalStock === 0 ? "Out of Stock" : "Active",
          image,
          rating: p.rating || 4.5,
          sold: p.sold || 0,
          visibleOnApp: p.visible_online ?? false,
          hasBatch,
          hasVariant,
          hasSerialNo,
          batchCount,
          variantCount,
          unit: p.unit_infos?.name || "",
          sku: p.sku || p.barcode || "",
          uiId: p.ui_id || "",
          gst: p.gst || "0%",
          isActive: p.is_active ?? true,
          haveTracking: p.have_tracking ?? true,
          raw: p,
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

  useEffect(() => { loadProducts(); }, []);

  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    cats.add("All");
    products.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats);
  }, [products]);

  const loadCustomFieldsForProduct = async (product: Product) => {
    try {
      const values = await inventoryCustomFieldsApi.getValuesByProduct(SHOP_ID, product.id);
      const valuesMap: Record<string, string> = {};
      values.forEach((v) => { valuesMap[v.field_id] = v.value; });
      setCustomValues(valuesMap);
    } catch (err) {
      console.error(err);
      showToast("Error loading custom fields", "error");
    }
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setAdditionalSections(product.raw?.additional_sections || []);
    loadCustomFieldsForProduct(product);
  };



  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    try {
      setSavingProduct(true);
      const valuesToSave = Object.entries(customValues).map(([fieldId, value]) => ({
        field_id: fieldId,
        value: String(value),
      }));
      if (valuesToSave.length > 0) {
        await inventoryCustomFieldsApi.bulkUpsertValues({
          shop_id: SHOP_ID,
          product_id: editingProduct.id,
          values: valuesToSave,
        });
      }
      const buyPrice = editingProduct.buyPrice ?? editingProduct.raw?.pricing_infos?.buy_price ?? editingProduct.raw?.buy_price ?? 0;
      const sellPrice = editingProduct.price ?? editingProduct.raw?.pricing_infos?.sell_price ?? 0;
      const onlinePrice = editingProduct.onlineSellPrice ?? sellPrice;
      await inventoryApi.updateInventory({
        id: editingProduct.id,
        shop_id: SHOP_ID,
        visible_online: editingProduct.visibleOnApp,
        description: editingProduct.description,
        buy_price: buyPrice,
        sell_price: sellPrice,
        online_sell_price: onlinePrice,
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

  const stats = useMemo(() => ({
    total: products.length,
    visible: products.filter((p) => p.visibleOnApp).length,
    hidden: products.filter((p) => !p.visibleOnApp).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    inventoryValue: products.reduce((a, p) => a + p.price * p.stock, 0),
  }), [products]);

  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search);
    const matchCategory = categoryFilter === "All" || p.category === categoryFilter;
    const matchStatus = statusFilter === "All"
      || (statusFilter === "Visible" && p.visibleOnApp)
      || (statusFilter === "Hidden" && !p.visibleOnApp);
    return matchSearch && matchCategory && matchStatus;
  }), [products, search, categoryFilter, statusFilter]);

  const toggleVisibility = async (id: string) => {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    try {
      setTogglingId(id);
      await inventoryApi.updateInventory({
        id: current.id,
        shop_id: SHOP_ID,
        visible_online: !current.visibleOnApp,
      });
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, visibleOnApp: !p.visibleOnApp } : p));
      showToast("Product visibility updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle product visibility", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((p) => p.id));
  };

  const bulkToggleVisibility = async (visible: boolean) => {
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await inventoryApi.updateInventory({ id, shop_id: SHOP_ID, visible_online: visible });
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
    <div className="space-y-4" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input
            type="text"
            placeholder="Search products or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder-slate-400"
          />
        </div>

        {/* Category filter */}
        <div className="relative min-w-[160px]">
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-9 appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-7 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer"
          >
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
        </div>

        {/* Visibility filter */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
          {(["All", "Visible", "Hidden"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium cursor-pointer transition-colors ${statusFilter === v
                ? "bg-white text-blue-600 shadow-sm border border-blue-100"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {v === "Visible" && <Eye size={11} />}
              {v === "Hidden" && <EyeOff size={11} />}
              {v}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Product count */}
        <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </span>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
          {([
            { m: "list" as const, icon: <List size={14} /> },
            { m: "grid" as const, icon: <LayoutGrid size={14} /> },
          ]).map(({ m, icon }) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors ${viewMode === m
                ? "bg-white text-blue-600 shadow-sm border border-blue-100"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-sm font-semibold text-blue-700">{selectedIds.length} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => bulkToggleVisibility(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-sm font-medium text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Eye size={12} /> Show on App
          </button>
          <button
            onClick={() => bulkToggleVisibility(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <EyeOff size={12} /> Hide from App
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-sm font-medium text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && products.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin text-blue-500" />
          <span className="text-sm text-slate-500">Loading products…</span>
        </div>
      ) : (
        <>
          {/* Select all bar */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-[12px] font-medium text-slate-500 hover:text-blue-600 cursor-pointer transition-colors"
              >
                <div
                  className="w-4 h-4 rounded border-[1.5px] flex items-center justify-center"
                  style={{
                    background: selectedIds.length === filtered.length ? "#2563eb" : "white",
                    borderColor: selectedIds.length === filtered.length ? "#2563eb" : "#cbd5e1",
                  }}
                >
                  {selectedIds.length === filtered.length && <CheckCircle2 size={10} className="text-white" />}
                </div>
                {selectedIds.length === filtered.length ? "Deselect all" : "Select all"}
              </button>
              <span className="text-slate-200">·</span>
              <span className="text-[12px] text-slate-400">
                {stats.visible} visible · {stats.hidden} hidden from app
              </span>
            </div>
          )}

          {/* ── Products Grid or List ── */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Search size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No products found</p>
              <p className="text-[12px] text-slate-400">Try adjusting your filters or search term</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => (
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-1">
              <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-100">
                <table className="w-full text-left min-w-[700px] border-collapse relative">
                  <thead className="sticky top-14 z-20 bg-white shadow-[0_1px_0_0_#e2e8f0]">
                    <tr>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filtered.length > 0 && selectedIds.length === filtered.length}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">SKU</th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Store SP</th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Online SP</th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Visibility</th>
                      <th className="py-3 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right w-16 sticky right-0 bg-white shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {filtered.map((p) => (
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
                </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Product & Custom Fields Sidebar ── */}
      {editingProduct && (
        <RightSidebarFilter
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onApply={handleSaveProduct}
          applyLabel={savingProduct ? "Saving..." : "Save Changes"}
          onClear={() => setEditingProduct(null)}
          title={`Configure ${editingProduct.name}`}
        >
          <div className="space-y-6 pb-4">

            {/* ── PRICING ── */}
            <div className="space-y-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">PRICING</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">Shop price (from catalog)</label>
                  <div className="flex items-center h-9 rounded-lg border border-slate-200 bg-[#fbfaf8] overflow-hidden">
                    <div className="h-full px-2.5 flex items-center justify-center border-r border-slate-200 bg-[#f4f2ee] text-slate-500 text-xs font-semibold">
                      ₹
                    </div>
                    <input
                      type="number"
                      readOnly
                      value={editingProduct.price || 0}
                      className="w-full bg-transparent px-3 text-sm font-medium text-blue-600 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">Store price (online)</label>
                  <div className="flex items-center h-9 rounded-lg border border-slate-200 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <div className="h-full px-2.5 flex items-center justify-center border-r border-slate-200 bg-[#f4f2ee] text-slate-500 text-xs font-semibold">
                      ₹
                    </div>
                    <input
                      type="number"
                      value={editingProduct.onlineSellPrice ?? editingProduct.price ?? 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, onlineSellPrice: e.target.value !== "" ? Number(e.target.value) : 0 })}
                      className="w-full bg-transparent px-3 text-sm font-semibold text-slate-800 outline-none"
                      placeholder="e.g. 299"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Product mini info */}
            <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <img
                src={editingProduct.image}
                alt={editingProduct.name}
                className="w-14 h-14 rounded-lg object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  {editingProduct.category}
                </span>
                <h4 className="font-semibold text-slate-800 text-sm truncate mt-1">{editingProduct.name}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ₹{editingProduct.price} · {editingProduct.stock} in stock
                </p>
              </div>
            </div>

            {/* Product Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Description</label>
              <textarea
                value={editingProduct.description || ""}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                placeholder="Enter product description..."
                className="w-full h-24 resize-none border border-slate-200 rounded-lg p-3 text-[12px] outline-none focus:border-blue-500 bg-white"
              />
            </div>

            {/* Additional Details */}
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ADDITIONAL DETAILS <span className="text-slate-400 font-normal normal-case ml-1">(optional, up to 3)</span>
                </p>
                <p className="text-[12px] text-slate-500 mt-1">
                  Add custom sections like ingredients, storage instructions, allergen info, or anything your customers should know.
                </p>
              </div>

              {additionalSections.map((section, index) => (
                <div key={section.id} className="border border-[#e5e2db] rounded-xl overflow-hidden bg-[#fdfaf5]">
                  <div className="px-3 py-2.5 flex items-center justify-between border-b border-[#e5e2db]">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical size={14} className="text-slate-300 cursor-grab shrink-0" />
                      <div className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        placeholder="Section heading (e.g. Storage instructions)"
                        className="bg-transparent border-none outline-none text-sm font-semibold text-slate-600 placeholder:text-slate-400 w-full"
                      />
                    </div>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="text-slate-400 hover:text-red-500 shrink-0 ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="p-3 bg-[#fdfaf5]">
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      placeholder="What should customers know? Keep it short and clear."
                      className="w-full h-20 resize-none border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              ))}

              {additionalSections.length < 3 && (
                <button
                  onClick={addSection}
                  className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={16} /> Add another section
                </button>
              )}
            </div>
          </div>
        </RightSidebarFilter>
      )}
    </div>
  );
};

export default ProductDashboard;
