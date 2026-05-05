import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package, Edit3, Trash2, DollarSign, Download, Upload,
  Tag, Layers, Info, BarChart2,
  Hash, ShoppingCart, MapPin, FileText,
  ArrowUp, ArrowDown, TrendingUp, Activity, RefreshCcw,
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import { StatCard } from "@/components/common/StatsCard";
import { Modal, ProfileHeaderCard, SectionCard, DetailItem } from "@/components/common/SuperUI";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { VariantRows, SerialBadgeList, BatchCards } from "../../inventory/components/StockTree";
import type { InventoryRecord } from "@/types/api";

// ── Search bar ───────────────────────────────────────────────────────────────
const ProductSearchSelect = () => {
  const navigate = useNavigate();
  const { getData } = useApi();

  const fetchProducts = async (q: string) => {
    if (!q) return [];
    try {
      const res = await getData(ENDPOINTS.INVENTORIES, { q, limit: "8", shop_id: SHOP_ID });
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      return data.map((p: any) => ({
        ...p,
        displayName: String(p.datas?.name ?? p.barcode ?? p.id),
      }));
    } catch {
      return [];
    }
  };

  return (
    <div className="w-full max-w-xs relative z-50">
      <SearchSelect
        labelKey="displayName"
        valueKey="id"
        fetchOptions={fetchProducts}
        placeholder="Search product by name…"
        className="w-full"
        onChange={(val) => val && navigate(`/product/${val}`)}
      />
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData, deleteData } = useApi();
  const { showToast } = useToast();

  const [product, setProduct] = useState<InventoryRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [viewValue, setViewValue] = useState<{ label: string; value: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [movLoading, setMovLoading] = useState(false);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purLoading, setPurLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.INVENTORIES}/by/${SHOP_ID}/${id}`).then((res) => {
      if (res) setProduct(Array.isArray(res.data) ? res.data[0] : res.data);
      setRecordLoading(false);
    });
  }, [id]);

  // Lazy-load movements/purchases when their tab is activated
  // These must be here (before early returns) to satisfy Rules of Hooks
  const MOV_TAB_LABEL = "Stock Movements";
  const PUR_TAB_LABEL = "Purchases";

  useEffect(() => {
    if (!id || !product) return;
    const hasInvTab = (product.has_variant === true && (product.variants ?? []).length > 0) || (product.has_batch === true && (product.batches ?? []).length > 0);
    const movIdx = hasInvTab ? 2 : 1;
    if (activeTab !== movIdx) return;
    setMovLoading(true);
    getData(`${ENDPOINTS.S_ADJUSTMENTS}/by/product/${SHOP_ID}/${id}`).then((res: any) => {
      setMovements(res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : []);
      setMovLoading(false);
    }).catch(() => setMovLoading(false));
  }, [activeTab, id, product]);

  useEffect(() => {
    if (!id || !product) return;
    const hasInvTab = (product.has_variant === true && (product.variants ?? []).length > 0) || (product.has_batch === true && (product.batches ?? []).length > 0);
    const purIdx = hasInvTab ? 3 : 2;
    if (activeTab !== purIdx) return;
    setPurLoading(true);
    getData(`${ENDPOINTS.PURCHASES}/by/product/${SHOP_ID}/${id}`).then((res: any) => {
      setPurchases(res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : []);
      setPurLoading(false);
    }).catch(() => setPurLoading(false));
  }, [activeTab, id, product]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteData(`${ENDPOINTS.INVENTORIES}/${SHOP_ID}/${id}`);
      showToast("Product deleted successfully", "success");
      navigate("/product/all");
    } catch {
      showToast("Failed to delete product", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (recordLoading) return <div className="p-12 flex justify-center"><Loader /></div>;

  if (!product) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-500">Product not found.</p>
        <ProductSearchSelect />
      </div>
    );
  }

  const datas = product.datas ?? {};
  const name = String(product.name || "Unknown Product");
  const initials = name.slice(0, 2).toUpperCase();
  const sku = String(product.barcode || "—");
  const category = String(product.category || "—");
  const description = String(product.description || "—");
  const sellingPrice = product.sell_price ?? "—";
  const buyingPrice = product.buy_price ?? "—";
  const currentStock = product.stocks ?? "—";
  const unit = String(datas.unit ?? "—");
  const combinations: any[] = product.variants ?? [];
  const variantTypes: any[] = datas.variant_types ?? datas.variantTypes ?? [];
  const batches: any[] = product.batches ?? [];
  
  const extractSerials = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (val.serial_numbers && Array.isArray(val.serial_numbers)) return val.serial_numbers;
    return [];
  };

  const rootSerials = extractSerials(product.serial_number);
  const hasVariants = product.has_variant === true && combinations.length > 0;
  const hasBatches = product.has_batch === true && batches.length > 0;
  const isActive = datas.is_active !== false;


  const TABS = ["General Info", ...((hasVariants || hasBatches) ? ["Inventory & Variants"] : []), MOV_TAB_LABEL, PUR_TAB_LABEL];

  // Clickable field definition
  const click = (label: string, value: string) => () => setViewValue({ label, value });

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* ── Profile Header Card ──────────────────────────────── */}
      <ProfileHeaderCard
        name={name}
        initials={initials}
        subText={`SKU: ${sku}`}
        badges={[
          { text: category, variant: "primary" },
          { text: isActive ? "Active" : "Inactive", variant: isActive ? "success" : "danger", showPulse: true },
        ]}
        infoItems={[
          { icon: Tag, text: `Unit: ${unit}` },
          { icon: ShoppingCart, text: `Stock: ${currentStock}` },
        ]}
        actions={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/product/${id}/edit`)}
              className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
              title="Edit Product"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-300 rounded-lg hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm active:scale-95"
              title="Delete Product"
            >
              <Trash2 size={14} />
            </button>
          </div>
        }
      />

      {/* ── Tabs + Stats ─────────────────────────────────────── */}
      <div className="flex gap-0.5 bg-white p-1 rounded-xl border border-slate-200 w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeTab === i
                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <StatCard icon={Package} label="Current Stock" value={String(currentStock)}
          iconBg="bg-blue-50" iconColor="text-blue-600" className="flex-1 min-w-[140px]" />
        <StatCard icon={Download} label="Buying Price" value={`₹${buyingPrice}`}
          iconBg="bg-emerald-50" iconColor="text-emerald-600" className="flex-1 min-w-[140px]" />
        <StatCard icon={Upload} label="Selling Price" value={`₹${sellingPrice}`}
          iconBg="bg-rose-50" iconColor="text-rose-600" className="flex-1 min-w-[140px]" />
        <StatCard
          icon={DollarSign}
          label="Stock Value"
          value={
            String(currentStock) !== "—" && String(buyingPrice) !== "—"
              ? `₹${(Number(currentStock) * Number(buyingPrice)).toLocaleString()}`
              : "—"
          }
          iconBg="bg-indigo-50" iconColor="text-indigo-600"
          className="flex-1 min-w-[140px]"
        />
      </div>

      {/* ── Tab Panels ───────────────────────────────────────── */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* TAB 0 — General Info */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Main 3-col area */}
            <div className="xl:col-span-3 space-y-4">

              {/* Primary Fields */}
              <SectionCard className="rounded-[1.5rem] border-slate-200 shadow-sm p-4 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl -z-0" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      <Package size={16} />
                    </div>
                    <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Product Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-6 gap-x-8">
                    <DetailItem icon={Package} label="Product Name" value={name} onClick={click("Product Name", name)} />
                    <DetailItem icon={Tag} label="Category" value={category} onClick={click("Category", category)} />
                    <DetailItem icon={Hash} label="Brand" value={String(datas.brand || "—")} onClick={click("Brand", String(datas.brand || "—"))} />
                    <DetailItem icon={Info} label="Unit" value={unit} onClick={click("Unit", unit)} />
                    <DetailItem icon={Hash} label="Barcode / SKU" value={sku} onClick={click("Barcode / SKU", sku)} />
                    <div className="lg:col-span-2">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                        <FileText size={12} className="text-blue-400" /> Serial Numbers
                      </p>
                      {rootSerials.length > 0 ? (
                        <SerialBadgeList serials={rootSerials} />
                      ) : hasVariants ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl w-fit">
                          <Layers size={12} className="text-indigo-500" />
                          <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                        </div>
                      ) : (
                        <p className="text-[13px] font-semibold text-slate-400">—</p>
                      )}
                    </div>
                    <DetailItem icon={ShoppingCart} label="Supplier" value={String(datas.supplier || "—")} onClick={click("Supplier", String(datas.supplier || "—"))} />
                    <DetailItem icon={Info} label="Description" value={description} onClick={click("Description", description)} />
                  </div>
                </div>
              </SectionCard>

              {/* Pricing Section */}
              <SectionCard className="rounded-[1.5rem] border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <DollarSign size={16} />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Pricing & Compliance</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                  <DetailItem icon={Download} label="Buying Price" value={String(buyingPrice) !== "—" ? `₹${buyingPrice}` : "—"} onClick={click("Buying Price", `₹${buyingPrice}`)} />
                  <DetailItem icon={Upload} label="Selling Price" value={String(sellingPrice) !== "—" ? `₹${sellingPrice}` : "—"} onClick={click("Selling Price", `₹${sellingPrice}`)} />
                  <DetailItem icon={Tag} label="MRP" value={datas.mrp ? `₹${datas.mrp}` : "—"} onClick={click("MRP", datas.mrp ? `₹${datas.mrp}` : "—")} />
                  <DetailItem icon={BarChart2} label="GST Rate" value={String(datas.gst || "—")} onClick={click("GST Rate", String(datas.gst || "—"))} />
                  <DetailItem icon={Info} label="Reorder Point" value={String(datas.reorder_point || "—")} onClick={click("Reorder Point", String(datas.reorder_point || "—"))} />
                  <DetailItem icon={MapPin} label="Location" value={String(datas.storage_location || datas.location || "—")} onClick={click("Location", String(datas.storage_location || datas.location || "—"))} />
                </div>
              </SectionCard>
            </div>

            {/* Sidebar — 1 col */}
            <div className="xl:col-span-1 space-y-4">
              <SectionCard className="rounded-[1.5rem] border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                    <Tag size={16} />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Classification</h2>
                </div>
                <div className="divide-y divide-slate-50 space-y-0">
                  {[
                    { label: "TYPE", value: datas.customer_type || "Product" },
                    { label: "GSTN", value: datas.gst_number || datas.gst || "—" },
                    { label: "STATUS", value: isActive ? "Active" : "Inactive", isStatus: true },
                    { label: "VARIANTS", value: hasVariants ? `${combinations.length} combos` : "None" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.label}</span>
                      {row.isStatus ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                          {row.value}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-700">{row.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>

              {description && description !== "—" && (
                <SectionCard className="rounded-[1.5rem] border-slate-200 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white">
                      <FileText size={16} />
                    </div>
                    <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Description</h2>
                  </div>
                  <p className="text-[12px] text-slate-600 leading-relaxed">{description}</p>
                </SectionCard>
              )}
            </div>
          </div>
        )}

        {/* TAB 1 — Inventory & Variants */}
        {activeTab === 1 && (hasVariants || hasBatches) && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Variants Section */}
            {hasVariants && (
              <div className="space-y-4">
                {variantTypes.length > 0 && (
                  <SectionCard className="rounded-[1.5rem] p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-100">
                        <Layers size={16} />
                      </div>
                      <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Variant Types</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {variantTypes.map(vt => (
                        <div key={vt.id} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{vt.name}</p>
                          <p className="text-sm font-bold text-slate-700">{(vt.values as string[]).join(", ")}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                <SectionCard className="rounded-[1.5rem] p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <Tag size={16} />
                    </div>
                    <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">
                      Combinations ({combinations.length})
                    </h2>
                  </div>

                  <div className="bg-slate-50/30 rounded-2xl p-4 border border-slate-100">
                    <VariantRows combinations={combinations} baseSellPrice={sellingPrice} />
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Root Batches Section (if no variants but has batches) */}
            {!hasVariants && hasBatches && (
              <SectionCard className="rounded-[1.5rem] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                    <Tag size={16} />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Batch Tracking</h2>
                </div>
                <BatchCards batches={batches} />
              </SectionCard>
            )}
          </div>
        )}

        {/* TAB — Stock Movements */}
        {TABS[activeTab] === "Stock Movements" && (() => {
          // Flatten nested structure: adjustment → products → variants → batches → rows
          const rows: any[] = [];
          movements.forEach((adj: any) => {
            (adj.products ?? []).forEach((prod: any) => {
              const isInc = prod.type === 'INCREMENT';
              const baseRow = {
                adjId: adj.id,
                date: adj.adjusted_date || adj.created_at,
                description: adj.description,
                type: prod.type,
                isInc,
                productName: prod.name,
                barcode: prod.barcode,
                stocks: prod.stocks,
              };

              const variants = prod.variants ?? [];
              if (variants.length > 0) {
                variants.forEach((v: any) => {
                  const batches = v.batches ?? [];
                  if (batches.length > 0) {
                    batches.forEach((b: any) => {
                      const sns = Array.isArray(b.serial_numbers) ? b.serial_numbers : (b.serial_numbers?.serial_numbers ?? []);
                      rows.push({ ...baseRow, variant: v.name, batch: b.name, batchStocks: b.stocks, serials: sns });
                    });
                  } else {
                    rows.push({ ...baseRow, variant: v.name, batch: null, batchStocks: null, serials: [] });
                  }
                });
              } else {
                rows.push({ ...baseRow, variant: null, batch: null, batchStocks: null, serials: [] });
              }
            });
          });

          return (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100"><Activity size={16} /></div>
                  <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Stock Adjustments</h2>
                </div>
                {movLoading && <RefreshCcw size={14} className="text-slate-400 animate-spin" />}
              </div>
              {movLoading ? (
                <div className="py-16 flex justify-center"><RefreshCcw size={24} className="text-blue-400 animate-spin" /></div>
              ) : rows.length === 0 ? (
                <div className="py-16 text-center">
                  <TrendingUp size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No stock adjustments found</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-slate-50/50">
                          <th className="px-5 py-3">Type</th>
                          <th className="px-5 py-3">Qty</th>
                          <th className="px-5 py-3">Variant</th>
                          <th className="px-5 py-3">Batch</th>
                          <th className="px-5 py-3">Serials</th>
                          <th className="px-5 py-3">Description</th>
                          <th className="px-5 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {rows.map((r: any, i: number) => (
                          <tr key={`${r.adjId}-${i}`} className={`hover:bg-slate-50/60 transition-colors ${r.isInc ? 'border-l-2 border-emerald-300' : 'border-l-2 border-rose-300'}`}>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                r.isInc ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {r.isInc ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                                {r.type}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`font-black text-sm tabular-nums ${r.isInc ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {r.isInc ? '+' : '-'}{r.batchStocks ?? r.stocks ?? 0}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {r.variant ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100">{r.variant}</span>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              {r.batch ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">{r.batch}</span>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              {r.serials.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {r.serials.slice(0, 3).map((s: string, si: number) => (
                                    <span key={si} className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600">{s}</span>
                                  ))}
                                  {r.serials.length > 3 && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-500">+{r.serials.length - 3}</span>
                                  )}
                                </div>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-500 max-w-[160px] truncate">{r.description || '—'}</td>
                            <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB — Purchases */}
        {TABS[activeTab] === "Purchases" && (() => {
          // Flatten: purchase → products rows, with purchase-level metadata attached
          const rows: any[] = [];
          purchases.forEach((p: any) => {
            const d = p.datas ?? {};
            const pd = d.purchaseDetails ?? {};
            const payment = d.payment ?? {};
            const charges = p.additional_charges ?? {};
            const purchaseMeta = {
              purchaseId: p.id,
              type: p.type,
              supplier: d.supplier_name || '—',
              invoiceNo: pd.invoiceNo || '—',
              referenceNo: pd.referenceNo || '—',
              purchaseDate: pd.date || p.created_at,
              paymentMethod: payment.method || '—',
              amountPaid: payment.amountPaid ?? 0,
              deliveryCharge: charges.delivery_charge ?? 0,
              otherCharge: charges.other_charge ?? 0,
              uiId: p.ui_id,
            };
            (p.products ?? []).forEach((prod: any) => {
              rows.push({ ...purchaseMeta, stocks: prod.stocks, buy_price: prod.buy_price, sell_price: prod.sell_price });
            });
          });

          return (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100"><ShoppingCart size={16} /></div>
                  <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Purchase History</h2>
                </div>
                {purLoading && <RefreshCcw size={14} className="text-slate-400 animate-spin" />}
              </div>
              {purLoading ? (
                <div className="py-16 flex justify-center"><RefreshCcw size={24} className="text-indigo-400 animate-spin" /></div>
              ) : rows.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No purchases found for this product</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-slate-50/50">
                          <th className="px-5 py-3">#</th>
                          <th className="px-5 py-3">Type</th>
                          <th className="px-5 py-3">Supplier</th>
                          <th className="px-5 py-3">Qty</th>
                          <th className="px-5 py-3">Buy Price</th>
                          <th className="px-5 py-3">Sell Price</th>
                          <th className="px-5 py-3">Payment</th>
                          <th className="px-5 py-3">Invoice</th>
                          <th className="px-5 py-3">Reference</th>
                          <th className="px-5 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {rows.map((r: any, i: number) => (
                          <tr key={`${r.purchaseId}-${i}`} className="hover:bg-indigo-50/20 transition-colors border-l-2 border-indigo-200">
                            <td className="px-5 py-3">
                              <span className="text-[10px] font-black text-slate-400 tabular-nums">#{r.uiId}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                r.type === 'DIRECT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                r.type?.includes('PO') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-slate-50 text-slate-600 border-slate-200'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {(r.type || '—').replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-medium text-slate-700">{r.supplier}</td>
                            <td className="px-5 py-3">
                              <span className="font-black text-sm text-slate-800 tabular-nums">{r.stocks ?? '—'}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-bold text-slate-700">₹{r.buy_price ?? '—'}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-bold text-emerald-700">₹{r.sell_price ?? '—'}</span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md w-fit ${
                                  r.paymentMethod === 'Cash' ? 'bg-green-50 text-green-700' :
                                  r.paymentMethod === 'UPI' ? 'bg-violet-50 text-violet-700' :
                                  'bg-slate-50 text-slate-600'
                                }`}>{r.paymentMethod}</span>
                                {r.amountPaid > 0 && (
                                  <span className="text-[9px] text-slate-400 font-bold">Paid: ₹{r.amountPaid}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-xs font-mono text-slate-500">{r.invoiceNo}</td>
                            <td className="px-5 py-3 text-xs font-mono text-slate-400">{r.referenceNo}</td>
                            <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Charges footer summary */}
                  {rows.some(r => r.deliveryCharge > 0 || r.otherCharge > 0) && (
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Delivery charges may apply — check individual purchase records</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Field Value Modal (global SuperUI Modal) ──────────── */}
      <Modal
        show={!!viewValue}
        onClose={() => setViewValue(null)}
        title={viewValue?.label || "Field Detail"}
        className="max-w-md"
      >
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-sm font-bold text-slate-700 break-words leading-relaxed select-all">
            {viewValue?.value}
          </p>
        </div>
        <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
          Double click the text to select and copy
        </p>
      </Modal>

      {/* ── Delete Confirm (global ConfirmDialog) ─────────────── */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`This action cannot be undone. This will permanently delete "${name}" and all associated data.`}
        confirmText="Delete Product"
        loading={deleting}
        type="danger"
        icon={Trash2}
      />
    </div>
  );
};

export default ProductDetail;
