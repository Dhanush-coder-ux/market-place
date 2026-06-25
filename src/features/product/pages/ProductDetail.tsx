import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package, Edit3, Trash2, DollarSign, Download, Upload,
  Tag, Layers, Info, BarChart2,
  Hash, ShoppingCart, MapPin, FileText,
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import { Modal, ProfileHeaderCard, SectionCard, DetailItem } from "@/components/common/SuperUI";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useHeader } from "@/context/HeaderContext";
import { VariantRows, SerialBadgeList, BatchCards } from "../../inventory/components/StockTree";
import type { InventoryRecord } from "@/types/api";
import { ProductPurchasesTable } from "@/components/common/HistoryTables";
import StockMovementTab from "../components/StockMovement";

// ── Search bar ───────────────────────────────────────────────────────────────
const ProductSearchSelect = () => {
  const navigate = useNavigate();
  const { getData } = useApi();

  const fetchProducts = async (q: string) => {

    try {
      const res = await getData(`${ENDPOINTS.INVENTORIES}/search/${SHOP_ID}`, { q, limit: "8" });
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      return data.map((p: any) => ({
        ...p,
        displayName: String(p.datas?.name ?? p.name ?? p.barcode ?? p.id),
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
  const { setBottomActions } = useHeader();

  const [product, setProduct] = useState<InventoryRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [viewValue, setViewValue] = useState<{ label: string; value: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [purchases, setPurchases] = useState<any[]>([]);
  const [purLoading, setPurLoading] = useState(false);

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center justify-end w-full animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          type="button"
          onClick={() => navigate("/product")}
          className="px-6 h-8 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center shadow-sm"
        >
          Clear
        </button>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, navigate]);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.INVENTORIES}/by/${SHOP_ID}/${id}`).then(async (res) => {
      if (res) {
        const prod = Array.isArray(res.data) ? res.data[0] : res.data;
        setProduct(prod);
      }
      setRecordLoading(false);
    });
  }, [id]);

  // Lazy-load movements/purchases when their tab is activated
  // These must be here (before early returns) to satisfy Rules of Hooks
  const MOV_TAB_LABEL = "Stock Movements";
  const PUR_TAB_LABEL = "Purchases";

  useEffect(() => {
    // The StockMovementTab handles its own loading.
    if (!id || !product) return;
    const hasInvTab = (product.has_variant === true && (product.variants ?? []).length > 0) || (product.has_batch === true && (product.batches ?? []).length > 0);
    const movIdx = hasInvTab ? 2 : 1;
    if (activeTab !== movIdx) return;
  }, [activeTab, id, product]);

  useEffect(() => {
    if (!id || !product) return;
    if (purchases.length > 0) return; // Already loaded from movements tab
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
  const reorderPoint = product?.reorder_point;
  const initials = name.slice(0, 2).toUpperCase();
  const sku = String(product.ui_id || product.sku || "—");
  const barcode = String(product.barcode || "—");
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
  const isActive = product.is_active === true;


  const TABS = ["General Info", ...((hasVariants || hasBatches) ? ["Inventory & Variants"] : []), MOV_TAB_LABEL, PUR_TAB_LABEL];
  const isTableTab = TABS[activeTab] === MOV_TAB_LABEL || TABS[activeTab] === PUR_TAB_LABEL;

  // Clickable field definition
  const click = (label: string, value: string) => () => setViewValue({ label, value });

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans overflow-hidden relative">
      
      {/* ── Profile Header Card ──────────────────────────────── */}
      <div className="flex-none p-1 pb-0 animate-in fade-in duration-500">
        <ProfileHeaderCard
          name={name}
          initials={initials}
          imageUrl={datas.images}
          subText={`SKU: ${sku} • Barcode: ${barcode}`}
          badges={[
            { text: category, variant: "primary" },
            { text: isActive ? "Active" : "Inactive", variant: isActive ? "success" : "danger", showPulse: true },
          ]}
          infoItems={[
            { icon: Tag, text: `Unit: ${unit}` },
            { icon: ShoppingCart, text: `Available in inventory: ${currentStock}` },
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
      </div>

      {/* ── Tabs + Stats ─────────────────────────────────────── */}
      <div className="flex-none px-1 py-2">
        <div className="flex gap-0.5 bg-white p-1 rounded-lg border border-slate-200 w-fit">
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
      </div>

      {/* ── Tab Panels (scrollable or flex-locked depending on active tab) ──────────────────────────── */}
      <div className={`flex-1 min-h-0 ${isTableTab ? "flex flex-col overflow-hidden" : "overflow-y-auto custom-scrollbar"} px-1 pb-6`}>
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${isTableTab ? "flex flex-col flex-1 min-h-0 h-full" : ""}`}>

        {/* TAB 0 — General Info */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Main 3-col area */}
            <div className="xl:col-span-3 space-y-4">

              {/* Primary Fields */}
              <SectionCard className="rounded-lg border-slate-200 shadow-sm p-4 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl -z-0" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      <Package size={16} />
                    </div>
                    <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">Product Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-6 gap-x-8">
                    <DetailItem icon={Package} label="Product Name" value={name} onClick={click("Product Name", name)} />
                    <DetailItem icon={Tag} label="Category" value={category} onClick={click("Category", category)} />
                    <DetailItem icon={Hash} label="Brand" value={String(datas.brand || "—")} onClick={click("Brand", String(datas.brand || "—"))} />
                    <DetailItem icon={Info} label="Unit" value={unit} onClick={click("Unit", unit)} />
                    <DetailItem icon={Hash} label="SKU" value={sku} onClick={click("SKU", sku)} />
                    <DetailItem icon={Hash} label="Barcode" value={barcode} onClick={click("Barcode", barcode)} />
                    <div className="md:col-span-2">
                      <DetailItem icon={Info} label="Description" value={description} onClick={click("Description", description)} />
                    </div>

                    {/* Dedicated Next Row for Characteristics */}
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-medium text-slate-400 tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                          <Layers size={12} className="text-blue-400" /> Variants
                        </p>
                        {product.has_variant === true ? (
                          <div 
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                            onClick={() => setActiveTab(1)}
                          >
                            <Layers size={12} className="text-indigo-500" />
                            <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                          </div>
                        ) : (
                          <p className="text-[13px] font-semibold text-slate-400">No variants</p>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] font-medium text-slate-400 tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                          <Layers size={12} className="text-blue-400" /> Batches
                        </p>
                        {product.has_batch === true ? (
                          <div 
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                            onClick={() => setActiveTab(1)}
                          >
                            <Layers size={12} className="text-indigo-500" />
                            <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                          </div>
                        ) : (
                          <p className="text-[13px] font-semibold text-slate-400">No batches</p>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] font-medium text-slate-400 tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                          <FileText size={12} className="text-blue-400" /> Serial Numbers
                        </p>
                        {rootSerials.length > 0 ? (
                          <SerialBadgeList serials={rootSerials} />
                        ) : (product.has_serialno === true) ? (
                          <div 
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                            onClick={() => setActiveTab(1)}
                          >
                            <Layers size={12} className="text-indigo-500" />
                            <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                          </div>
                        ) : (
                          <p className="text-[13px] font-semibold text-slate-400">No serial numbers</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
 
              {/* Pricing Section */}
              <SectionCard className="rounded-lg border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <DollarSign size={16} />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">Pricing & Compliance</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                      <Download size={12} className="text-blue-400" /> Buy Price
                    </p>
                    {hasVariants ? (
                      <div 
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => setActiveTab(1)}
                      >
                        <Layers size={12} className="text-indigo-500" />
                        <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                      </div>
                    ) : (
                      <p className="text-[13px] font-semibold text-slate-800 tabular-nums">{String(buyingPrice) !== "—" ? `₹${buyingPrice}` : "—"}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-slate-400 tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                      <Upload size={12} className="text-blue-400" /> Sell Price
                    </p>
                    {hasVariants ? (
                      <div 
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => setActiveTab(1)}
                      >
                        <Layers size={12} className="text-indigo-500" />
                        <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                      </div>
                    ) : (
                      <p className="text-[13px] font-semibold text-slate-800 tabular-nums">{String(sellingPrice) !== "—" ? `₹${sellingPrice}` : "—"}</p>
                    )}
                  </div>
                  <DetailItem icon={Tag} label="MRP" value={datas.mrp ? `₹${datas.mrp}` : "—"} onClick={click("MRP", datas.mrp ? `₹${datas.mrp}` : "—")} />
                  <DetailItem icon={Hash} label="HSN Code" value={String(datas.hsn || "—")} onClick={click("HSN Code", String(datas.hsn || "—"))} />
                  <DetailItem icon={BarChart2} label="GST Rate" value={String(datas.gst || "—")} onClick={click("GST Rate", String(datas.gst || "—"))} />
                  <div>
                    <p className="text-[10px] font-medium text-slate-400  tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                      <Info size={12} className="text-blue-400" /> Reorder Point
                    </p>
                    {hasVariants || hasBatches ? (
                      <div 
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => setActiveTab(1)}
                      >
                        <Layers size={12} className="text-indigo-500" />
                        <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                      </div>
                    ) : (
                      <p className="text-[13px] font-semibold text-slate-800 tabular-nums">{String(reorderPoint || "—")}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                      <MapPin size={12} className="text-blue-400" /> Storage Location
                    </p>
                    <div 
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                      onClick={() => setActiveTab(hasVariants || hasBatches ? 3 : 2)}
                    >
                      <ShoppingCart size={12} className="text-indigo-500" />
                      <span className="text-[11px] font-bold text-indigo-600">Available in Purchases tab</span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Sidebar — 1 col */}
            <div className="xl:col-span-1 space-y-4">
              <SectionCard className="rounded-lg border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                    <Tag size={16} />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">Classification</h2>
                </div>
                <div className="divide-y divide-slate-50 space-y-0">
                  {[
                    { label: "TYPE", value: datas.customer_type || "Product" },
                    { label: "GSTN", value: datas.gst_number || datas.gst || "—" },
                    { label: "STATUS", value: isActive ? "Active" : "Inactive", isStatus: true },
                    { label: "VARIANTS", value: hasVariants ? `${combinations.length} combos` : "None" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2.5">
                      <span className="text-[10px] font-bold text-slate-400  ">{row.label}</span>
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
                <SectionCard className="rounded-lg border-slate-200 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white">
                      <FileText size={16} />
                    </div>
                    <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">Description</h2>
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
                  <SectionCard className="rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-100">
                        <Layers size={16} />
                      </div>
                      <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">Variant Types</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {variantTypes.map(vt => (
                        <div key={vt.id} className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                          <p className="text-[10px] font-bold text-slate-400   mb-1">{vt.name}</p>
                          <p className="text-sm font-bold text-slate-700">{(vt.values as string[]).join(", ")}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                <SectionCard className="rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <Tag size={16} />
                    </div>
                    <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">
                      Combinations ({combinations.length})
                    </h2>
                  </div>

                  <div className="bg-slate-50/30 rounded-lg p-4 border border-slate-100">
                    <VariantRows combinations={combinations} baseSellPrice={sellingPrice} baseBuyPrice={buyingPrice} />
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Root Batches Section (if no variants but has batches) */}
            {!hasVariants && hasBatches && (
              <SectionCard className="rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                    <Tag size={16} />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">Batch Tracking</h2>
                </div>
                <BatchCards batches={batches} />
              </SectionCard>
            )}
          </div>
        )}

        {TABS[activeTab] === MOV_TAB_LABEL && (
          <StockMovementTab
            inventoryId={id || ""}
            product={product}
            onViewDetails={(movementId) => navigate(`/stock-movement/${movementId}`)}
          />
        )}

        {/* TAB — Purchases */}
        {TABS[activeTab] === PUR_TAB_LABEL && (() => {
          const rows: any[] = [];

          purchases.forEach((p: any) => {
            // Support both old formats (p.datas) and new PurchaseReadModel format
            const isNewFormat = !!p.purchase_id;
            const d = p.datas ?? {};
            const pd = d.purchaseDetails ?? {};
            const payment = d.payment ?? {};
            const pType = p.type === 'DIRECT' ? 'Purchase' : (p.type?.includes('PO') ? 'PO Purchase' : 'Purchase');

            const dateStr = isNewFormat ? p.purchase_date : (pd.date || p.created_at);
            const supplierName = isNewFormat ? p.supplier?.supplier_name : d.supplier_name;
            const uiId = isNewFormat ? p.purchase_id.split('-')[0].toUpperCase() : p.ui_id;

            const productsList: any[] = [];
            (p.products ?? []).forEach((prod: any) => {
              // Ensure we only aggregate for the specific product being viewed
              if (prod.inventory_id !== id && prod.product_id !== id && prod.id !== id) return;

              // NEW FORMAT SUPPORT
              if (prod.stocks_added !== undefined) {
                productsList.push({
                  variant: prod.variant?.variant_name || null,
                  batch: prod.batch?.batch_name || null,
                  stocksBefore: prod.stocks_before ?? null,
                  receivedStocks: prod.stocks_added,
                  buyPrice: prod.buy_price,
                  sellPrice: prod.sell_price,
                  serials: prod.serial_info?.serial_numbers || [],
                  variant_details: prod.variant || null,
                  batch_details: prod.batch || null,
                  serial_info: prod.serial_info || null
                });
                return;
              }

              // OLD FORMAT SUPPORT
              const baseProd = {
                stocksBefore: prod.stocks_before ?? null,
                receivedStocks: prod.received_stocks ?? prod.stocks ?? 0,
                buyPrice: prod.buy_price,
                sellPrice: prod.sell_price,
              };

              const variants = prod.variants ?? [];
              if (variants.length > 0) {
                variants.forEach((v: any) => {
                  const batches = v.batches ?? [];
                  if (batches.length > 0) {
                    batches.forEach((b: any) => {
                      const sns = Array.isArray(b.serial_numbers) ? b.serial_numbers : (b.serial_numbers?.serial_numbers ?? []);
                      productsList.push({
                        variant: v.name,
                        batch: b.name,
                        stocksBefore: b.stocks_before ?? v.stocks_before ?? baseProd.stocksBefore,
                        receivedStocks: b.stocks ?? v.stocks ?? baseProd.receivedStocks,
                        buyPrice: v.buy_price ?? baseProd.buyPrice,
                        sellPrice: v.sell_price ?? baseProd.sellPrice,
                        serials: sns
                      });
                    });
                  } else {
                    productsList.push({
                      variant: v.name,
                      batch: null,
                      stocksBefore: v.stocks_before ?? baseProd.stocksBefore,
                      receivedStocks: v.stocks ?? baseProd.receivedStocks,
                      buyPrice: v.buy_price ?? baseProd.buyPrice,
                      sellPrice: v.sell_price ?? baseProd.sellPrice,
                      serials: []
                    });
                  }
                });
              } else {
                productsList.push({
                  variant: null,
                  batch: null,
                  stocksBefore: baseProd.stocksBefore,
                  receivedStocks: baseProd.receivedStocks,
                  buyPrice: baseProd.buyPrice,
                  sellPrice: baseProd.sellPrice,
                  serials: []
                });
              }
            });

            if (productsList.length > 0) {
              const firstItem = productsList[0];
              rows.push({
                id: p.id || p.purchase_id,
                date: dateStr,
                description: `Supplier: ${supplierName || '—'}`,
                displayType: pType,
                isInc: true, // Purchases always add stock
                stocks: firstItem.receivedStocks,
                receivedStocks: firstItem.receivedStocks,
                stocksBefore: firstItem.stocksBefore,
                uiId: uiId,
                buyPrice: firstItem.buyPrice,
                sellPrice: firstItem.sellPrice,
                variant: firstItem.variant,
                batch: firstItem.batch,
                serials: firstItem.serials,
                paymentMethod: isNewFormat ? p.payment_status : (payment.method || "—"),
                amountPaid: isNewFormat ? p.paid_amount : (payment.amountPaid || 0),
                totalCost: isNewFormat ? p.total_cost : (pd.totalCost || 0),
                invoiceNo: isNewFormat ? p.invoice_no : (pd.invoiceNo || "—"),
                referenceNo: isNewFormat ? p.reference_no : (pd.referenceNo || "—"),
                storageLocation: isNewFormat ? productsList[0].storage_location || '—' : (d.storage_location || p.storage_location || '—'),
                productsList: productsList
              });
            }
          });

          rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return (
            <ProductPurchasesTable
              rows={rows}
              loading={purLoading}
              onNavigateToPurchase={(purchaseId) => navigate(`/purchase/detail/${purchaseId}`)}
            />
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
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-sm font-bold text-slate-700 break-words leading-relaxed select-all">
            {viewValue?.value}
          </p>
        </div>
        <p className="mt-4 text-[10px] font-bold text-slate-400   text-center">
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
    </div>
  );
};

export default ProductDetail;

