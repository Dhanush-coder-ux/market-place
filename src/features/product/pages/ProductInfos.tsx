import { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, Search, Filter, Bookmark, Trash2, Edit3, Eye,
  ChevronDown, ChevronRight, Layers, Tag, AlertTriangle,
  X, AlertCircle, Clock, Calendar
} from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { StatCard } from "@/components/common/StatsCard";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GradientButton } from "@/components/ui/GradientButton";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import Input from "@/components/ui/Input";
import Loader from "@/components/common/Loader";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { ProductRecord } from "@/types/api";

const formatCurrency = (amount?: any) => {
  if (amount === undefined || amount === null || amount === "—") return "N/A";
  const num = Number(amount);
  if (isNaN(num)) return amount;
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const columnLabels: Record<string, string> = {
  barcode: "SKU / Barcode",
  buy_price: "Buy Price",
  sell_price: "Sell Price",
  stocks: "Stock",
  category: "Category",
  unit: "Unit",
  brand: "Brand",
  supplier: "Supplier",
  serial_number: "Serial Number",
  hsn_code: "HSN Code",
};

const getColumnLabel = (key: string) => {
  if (columnLabels[key]) return columnLabels[key];
  return key.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const getStockStatus = (stock: number) => {
  const s = Number(stock) || 0;
  if (s <= 0) return { label: "0 In Stock", color: "text-rose-600 bg-rose-50 border-rose-200" };
  if (s <= 15) return { label: `${s} Low Stock`, color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: `${s} In Stock`, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
};

/* ─── Batch Expiry Helpers ────────────────────────────────────────────────── */
const getDaysLeft = (expDate?: string) => {
  if (!expDate) return null;
  const now = new Date();
  const exp = new Date(expDate);
  const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const BatchBadge = ({ expDate, qty }: { expDate?: string; qty: number }) => {
  const days = getDaysLeft(expDate);
  if (qty <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-50 text-slate-500 border-slate-200">
        Depleted
      </span>
    );
  }
  if (days === null) return null;
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-50 text-rose-700 border-rose-200">
        Expired
      </span>
    );
  }
  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-amber-50 text-amber-700 border-amber-200">
        <Clock size={10} /> {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> {days}d left
    </span>
  );
};

/* ─── Batch Cards (With Tree Lines) ───────────────────────────────────────── */
const BatchCards = ({ batches }: { batches: any[] }) => {
  const visible = batches.slice(0, 3);
  const remaining = batches.length - 3;

  return (
    <div className="animate-in fade-in duration-300 pt-2 pb-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={16} className="text-slate-400" />
        <p className="text-sm font-medium text-slate-600">Active Batches</p>
      </div>
      <div className="flex flex-col relative">
        {visible.map((batch: any, idx: number) => {
          const isLast = idx === visible.length - 1 && remaining <= 0;
          return (
            <div key={batch.id || idx} className="relative pl-8 pb-3">
              {/* --- Tree Branches --- */}
              <div className={`absolute left-[11px] w-[2px] bg-slate-200 ${isLast ? 'top-0 h-[34px]' : 'top-0 bottom-0'}`}></div>
              <div className="absolute left-[11px] top-[34px] w-[21px] h-[2px] bg-slate-200"></div>

              {/* Batch Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Tag size={12} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800">{batch.lot_number || batch.batch || `BATCH-${idx + 1}`}</span>
                  </div>
                  <BatchBadge expDate={batch.expiry_date || batch.expiry} qty={Number(batch.quantity || batch.qty || 0)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] text-slate-500 mb-0.5">Mfg Date</p>
                    <p className="text-sm font-medium text-slate-800">{batch.mfg_date || batch.manufacture_date || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 mb-0.5">Exp Date</p>
                    <p className="text-sm font-medium text-slate-800">{batch.expiry_date || batch.expiry || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500 mb-0.5">Available Qty</p>
                    <p className={`text-sm font-bold ${Number(batch.quantity || batch.qty) <= 0 ? "text-rose-600" : "text-slate-800"}`}>
                      {Number(batch.quantity ?? batch.qty ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {remaining > 0 && (
          <div className="relative pl-8 pb-2 pt-1">
            <div className="absolute left-[11px] w-[2px] bg-slate-200 top-0 h-[22px]"></div>
            <div className="absolute left-[11px] top-[22px] w-[21px] h-[2px] bg-slate-200"></div>
            <button className="w-full py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              View All {batches.length} Batches
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Variant Sub-rows (With Tree Lines) ──────────────────────────────────── */
const VariantRows = ({ combinations, baseSellPrice }: { combinations: any[]; baseSellPrice: any }) => {
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  return (
    <div className="animate-in fade-in duration-300 pt-2 pb-4">
      <div className="flex items-center gap-2 mb-4">
        <Layers size={16} className="text-slate-400" />
        <p className="text-sm font-medium text-slate-600">Product Variants</p>
      </div>
      <div className="flex flex-col relative">
        {combinations.map((comb: any, idx: number) => {
          const isLast = idx === combinations.length - 1;
          const variantLabel = Object.values(comb.attributes || {}).join(" / ");
          const variantId = comb.id || String(idx);
          const isVarExpanded = expandedVariant === variantId;
          const batches: any[] = comb.batches || comb.serials || [];
          const hasBatches = batches.length > 0;
          const stockStatus = getStockStatus(Number(comb.stock || 0));

          return (
            <div key={variantId} className="relative pl-8 pb-3">
              {/* --- Tree Branches --- */}
              <div className={`absolute left-[11px] w-[2px] bg-slate-200 ${isLast && !isVarExpanded ? 'top-0 h-[32px]' : 'top-0 bottom-0'}`}></div>
              <div className="absolute left-[11px] top-[32px] w-[21px] h-[2px] bg-slate-200"></div>

              {/* Variant Card */}
              <div className={`border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:border-blue-300 ${isVarExpanded ? 'ring-1 ring-blue-500/20' : ''}`}>
                <div
                  className={`flex items-center gap-4 px-5 py-3.5 ${hasBatches ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                  onClick={() => hasBatches && setExpandedVariant(isVarExpanded ? null : variantId)}
                >
                  {/* Expand Icon for Batches */}
                  {hasBatches && (
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 ${isVarExpanded ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {isVarExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{variantLabel}</p>
                    <p className="text-xs text-slate-500 mt-1">{comb.barcode || "No SKU"}</p>
                  </div>
                  
                  {/* Fixed Width Columns matching table headers */}
                  <div className="flex items-center gap-8 md:gap-16">
                    <p className="text-sm text-slate-600 min-w-[80px]">{formatCurrency(comb.price || baseSellPrice)}</p>
                    <p className="text-sm font-semibold text-slate-800 min-w-[80px]">{formatCurrency(comb.price || baseSellPrice)}</p>
                    <div className="min-w-[120px]">
                      <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-medium border ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nested Batches Area */}
                {isVarExpanded && hasBatches && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 pl-6">
                    <BatchCards batches={batches} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Main ProductInfos ───────────────────────────────────────────────────── */
const ProductInfos = () => {
  const navigate = useNavigate();
  const { setActions } = useHeader();
  const { getData, deleteData, loading, error, clearError } = useApi();
  const { showToast } = useToast();

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("product_table_columns");
    return saved ? JSON.parse(saved) : ["category", "sell_price", "stocks"];
  });

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate("/product/drafts")}
          className="px-4 h-10 rounded-xl border border-blue-100 text-blue-600 font-bold text-[13px] bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <Bookmark size={16} />
          Saved Drafts
        </button>
        <GradientButton path="/product/add" className="h-10 flex items-center px-5 text-sm shadow-sm rounded-lg">
          + Add Product
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    const params: Record<string, string> = { shop_id: SHOP_ID, limit: "100", offset: "1" };
    if (searchTerm) params.q = searchTerm;

    getData(ENDPOINTS.INVENTORIES, params).then((res) => {
      if (res) {
        const data: ProductRecord[] = Array.isArray(res.data) ? res.data : [res.data];
        setProducts(data);

        const keys = new Set<string>();
        data.forEach((p: ProductRecord) => {
          if (p.datas) {
            Object.keys(p.datas).forEach(k => {
              if (!["name", "id", "shop_id", "combinations", "variantTypes", "has_variants", "images", "description"].includes(k)) keys.add(k);
            });
          }
          Object.keys(p).forEach(k => {
            if (!["id", "shop_id", "barcode", "name", "datas", "created_at", "updated_at"].includes(k)) keys.add(k);
          });
        });
        setAvailableKeys(Array.from(keys).sort());
      }
    });
  }, [refreshKey, searchTerm]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteData(`${ENDPOINTS.INVENTORIES}/${productToDelete.id}`);
      showToast("Product deleted successfully", "success");
      setRefreshKey((prev: number) => prev + 1);
    } catch {
      showToast("Failed to delete product", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const toggleExpand = (id: string) => {
    const n = new Set(expandedRows);
    if (n.has(id)) n.delete(id); else n.add(id);
    setExpandedRows(n);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const name = String((p.datas as any)?.name || (p as any).name || "").toLowerCase();
      const sku = String(p.barcode || "").toLowerCase();
      const category = String((p.datas as any)?.category || "").toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || sku.includes(searchTerm.toLowerCase()) || category.includes(searchTerm.toLowerCase());
    });
  }, [products, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats */}
      <div className="flex gap-x-2">
        <StatCard label="Total Products" value={products.length} icon={Package} />
        <StatCard label="Total Stock" value={products.reduce((acc, p) => acc + Number((p.datas as any)?.stocks || 0), 0)}
          icon={Layers} iconBg="bg-blue-50" iconColor="text-blue-700" />
        <StatCard label="Low Stock Items" value={products.filter(p => Number((p.datas as any)?.stocks || 0) <= 15).length}
          icon={AlertTriangle} iconBg="bg-rose-50" iconColor="text-rose-700" />
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Input
              leftIcon={<Search size={16} className="text-slate-400" />}
              type="text"
              placeholder="Search products by name, SKU or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-sm rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
          <ColumnPicker
            availableKeys={availableKeys}
            selectedKeys={selectedKeys}
            onApply={setSelectedKeys}
            storageKey="product_table_columns"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-lg bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={16} />
          </button>
          <ReusableSelect
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
            options={[
              { label: "All Stock Levels", value: "All" },
              { label: "In Stock", value: "In Stock" },
              { label: "Low Stock", value: "Low Stock" },
              { label: "Out of Stock", value: "Out of Stock" },
            ]}
            placeholder="Filter"
            className="w-48 h-10 text-sm rounded-lg"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3 text-rose-700">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button onClick={clearError} className="p-1 hover:bg-rose-100 rounded-lg transition-colors text-rose-500">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-4 w-14 text-center"></th>
                <th className="px-4 py-4 whitespace-nowrap w-full min-w-[260px]">Product Details</th>
                {selectedKeys.map(key => (
                  <th key={key} className="px-4 py-4 whitespace-nowrap">{getColumnLabel(key)}</th>
                ))}
                <th className="px-4 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={selectedKeys.length + 3} className="py-16 text-center"><Loader /></td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={selectedKeys.length + 3} className="py-16 text-center text-slate-500 text-sm">No products matching your search.</td></tr>
              ) : (
                filteredProducts.map((p) => {
                  const datas = (p.datas as any) || {};
                  const hasVariants = datas.has_variants && datas.combinations?.length > 0;
                  const batches: any[] = datas.batches || [];
                  const hasBatches = batches.length > 0;
                  const isExpandable = hasVariants || hasBatches;
                  const isExpanded = expandedRows.has(p.id);
                  
                  // Updated badge to match screenshot
                  let expandBadge = null;
                  if (hasVariants && hasBatches) {
                    expandBadge = <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">Variant + Batch</span>;
                  } else if (hasVariants) {
                    expandBadge = <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1"><Layers size={10}/>{datas.combinations?.length} Variants</span>;
                  } else if (hasBatches) {
                    expandBadge = <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1"><Calendar size={10}/>{batches.length} Batches</span>;
                  }


                  return (
                    <Fragment key={p.id}>
                      <tr
                        className={`group transition-colors ${isExpanded ? "bg-slate-50/30" : "hover:bg-slate-50"}`}
                        onClick={() => isExpandable ? toggleExpand(p.id) : navigate(`/product/${p.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="px-4 py-4 text-center">
                          {isExpandable ? (
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-all shadow-sm ${isExpanded ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-white border border-slate-200 text-slate-500 group-hover:bg-slate-50"}`}>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-md flex items-center justify-center">
                              <Package size={16} className="text-slate-300" />
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            {/* Blue initial circle exactly like screenshot */}
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-base font-semibold shadow-sm shrink-0">
                              {String(datas.name || (p as any).name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[15px] font-semibold text-slate-800">{datas.name || (p as any).name || "N/A"}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[12px] text-slate-500">{p.barcode || "No SKU"}</span>
                                {expandBadge}
                              </div>
                            </div>
                          </div>
                        </td>

                        {selectedKeys.map(key => {
                          const value = datas[key] !== undefined ? datas[key] : (p as any)[key];
                          
                          if (key === "buy_price" || key === "sell_price" || key === "price") {
                            return (
                              <td key={key} className="px-4 py-4 whitespace-nowrap">
                                <span className={`text-[13px] ${key === "sell_price" ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}>
                                  {formatCurrency(value)}
                                </span>
                              </td>
                            );
                          }
                          
                          if (key === "stocks" || key === "quantity") {
                            const stockNumber = Number(value || 0);
                            const stockLabel = `${stockNumber} ${datas.unit ? `(${datas.unit.split(" ")[0]})` : ""}`;
                            const stockStatusColor = stockNumber <= 0 ? "text-rose-600 bg-rose-50 border-rose-200" : stockNumber <= 15 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-emerald-600 bg-emerald-50 border-emerald-200";
                            return (
                              <td key={key} className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1 rounded-md text-[12px] font-medium border ${stockStatusColor}`}>
                                  {stockLabel}
                                </span>
                              </td>
                            );
                          }

                          return (
                            <td key={key} className="px-4 py-4 whitespace-nowrap">
                              <span className="text-[13px] font-medium text-slate-600">{value || "—"}</span>
                            </td>
                          );
                        })}

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/product/${p.id}`); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                              title="View Detail"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/product/${p.id}/edit`); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                              title="Edit Product"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setProductToDelete(p); setIsDeleteDialogOpen(true); }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                              title="Delete Product"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED TREE AREA */}
                      {isExpanded && (
                        <tr key={`${p.id}-expand`} className="bg-slate-50/20">
                          <td colSpan={selectedKeys.length + 3} className="px-0 py-0 border-b border-slate-100">
                            {/* pl-[88px] exactly aligns the sub-cards below the "Ice Cream" text block */}
                            <div className="pl-[88px] pr-6 py-2">
                              {hasVariants && (
                                <VariantRows
                                  combinations={datas.combinations}
                                  baseSellPrice={datas.sell_price || (p as any).sell_price}
                                />
                              )}
                              {!hasVariants && hasBatches && (
                                <BatchCards batches={batches} />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove Product"
        description={`This action cannot be undone. This will permanently remove "${(productToDelete?.datas as any)?.name || (productToDelete as any)?.name}" and all associated data.`}
        confirmText="Remove Product"
        type="danger"
      />
    </div>
  );
};

export default ProductInfos;