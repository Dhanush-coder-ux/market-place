import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package, Edit3, Trash2, DollarSign, Download, Upload,
  Tag, Layers, Info, BarChart2,
  Hash, ShoppingCart, MapPin, FileText,
  Check, X as XIcon, Pencil, Image as ImageIcon,
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import { Modal, ProfileHeaderCard, SectionCard, DetailItem } from "@/components/common/SuperUI";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import SkeletonLoader from "@/components/common/SkeletonLoader";

import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { useHeader } from "@/context/HeaderContext";
import { VariantRows, SerialBadgeList, BatchCards } from "../../inventory/components/StockTree";
import type { InventoryRecord } from "@/types/api";
import { ProductPurchasesTable } from "@/components/common/HistoryTables";
import StockMovementTab from "../components/StockMovement";
import { inventoryCustomFieldsApi } from "@/services/api/inventory";
import type { InventoryCustomFieldDefinition, InventoryCustomFieldValue } from "@/features/inventory/types";

// ── Search bar ───────────────────────────────────────────────────────────────
const ProductSearchSelect = () => {
  const navigate = useNavigate();
  const { getData } = useApi();

  const fetchProducts = async (q: string) => {

    try {
      const res = await getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}`, { q, limit: "8" });
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

  // Custom Fields state
  const [customFieldDefs, setCustomFieldDefs] = useState<InventoryCustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<InventoryCustomFieldValue[]>([]);
  const [cfLoading, setCfLoading] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [cfSaving, setCfSaving] = useState(false);

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
    Promise.all([
      getData(`${ENDPOINTS.INVENTORIES}/by/id/${SHOP_ID}/${id}`),
      getData(`${ENDPOINTS.ANALYTICS_PRODINV}/${id}`, { shop_id: SHOP_ID })
    ]).then(([res]) => {
      if (res) {
        const prod = Array.isArray(res.data) ? res.data[0] : res.data;
        setProduct(prod);
      }
      setRecordLoading(false);
    }).catch(() => setRecordLoading(false));
  }, [id]);

  // Lazy-load movements/purchases when their tab is activated
  // These must be here (before early returns) to satisfy Rules of Hooks
  const MOV_TAB_LABEL = "Stock Movements";
  const PUR_TAB_LABEL = "Purchases";

  useEffect(() => {
    // The StockMovementTab handles its own loading.
    if (!id || !product) return;
    const hasVariants = !!product.type_infos?.has_variant || (product.variant_infos || product.variants ? Object.values(product.variant_infos || product.variants || {}).length > 0 : false);
    const batches = Array.isArray(product.batch_infos) ? product.batch_infos : (product.batch_infos ? [product.batch_infos] : (product.batches || []));
    const hasBatches = !!product.type_infos?.has_batch || batches.length > 0;
    const isStockTracked = (product as any).have_tracking !== false && (product as any).is_stock_tracked !== false && (product as any).track_stock !== false && (product as any).type !== "service";
    const dynamicTabs = ["General Info", ...((hasVariants || hasBatches) ? ["Inventory & Variants"] : []), "Images", MOV_TAB_LABEL, ...(isStockTracked ? [PUR_TAB_LABEL] : [])];

    if (dynamicTabs[activeTab] !== MOV_TAB_LABEL) return;
  }, [activeTab, id, product]);

  useEffect(() => {
    if (!id || !product) return;
    if (purchases.length > 0) return; // Already loaded from movements tab

    // We can't access TABS here because it's defined lower in the component,
    // so we recalculate the tabs array to find the correct label
    const hasVariants = !!product.type_infos?.has_variant || (product.variant_infos || product.variants ? Object.values(product.variant_infos || product.variants || {}).length > 0 : false);
    const batches = Array.isArray(product.batch_infos) ? product.batch_infos : (product.batch_infos ? [product.batch_infos] : (product.batches || []));
    const hasBatches = !!product.type_infos?.has_batch || batches.length > 0;
    const isStockTracked = (product as any).have_tracking !== false && (product as any).is_stock_tracked !== false && (product as any).track_stock !== false && (product as any).type !== "service";
    const dynamicTabs = ["General Info", ...((hasVariants || hasBatches) ? ["Inventory & Variants"] : []), "Images", MOV_TAB_LABEL, ...(isStockTracked ? [PUR_TAB_LABEL] : [])];

    if (dynamicTabs[activeTab] !== PUR_TAB_LABEL) return;

    setPurLoading(true);
    getData(`${ENDPOINTS.PURCHASES}/by/product/${SHOP_ID}/${id}`).then((res: any) => {
      setPurchases(res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : []);
      setPurLoading(false);
    }).catch(() => setPurLoading(false));
  }, [activeTab, id, product]);

  // Load custom field definitions + values when product is loaded (embedded in General Info sidebar)
  useEffect(() => {
    if (!id || !product) return;
    setCfLoading(true);
    Promise.all([
      inventoryCustomFieldsApi.getAllFields(SHOP_ID),
      inventoryCustomFieldsApi.getValuesByProduct(SHOP_ID, id)
    ]).then(([defs, vals]) => {
      setCustomFieldDefs(defs);
      setCustomFieldValues(vals);
    }).finally(() => setCfLoading(false));
  }, [id, product]);

  const handleSaveCustomField = async (fieldId: string) => {
    if (!id) return;
    setCfSaving(true);
    try {
      await inventoryCustomFieldsApi.upsertValue({
        shop_id: SHOP_ID,
        product_id: id,
        field_id: fieldId,
        value: editingValue,
      });
      setCustomFieldValues((prev) => {
        const existing = prev.findIndex((v) => v.field_id === fieldId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], value: editingValue };
          return updated;
        }
        return [...prev, { shop_id: SHOP_ID, product_id: id, field_id: fieldId, value: editingValue }];
      });
      showToast('Custom field updated', 'success');
    } catch {
      showToast('Failed to update field', 'error');
    } finally {
      setCfSaving(false);
      setEditingFieldId(null);
    }
  };

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

  if (recordLoading) return <SkeletonLoader variant="detail" />;

  if (!product) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-500">Product not found.</p>
        <ProductSearchSelect />
      </div>
    );
  }

  const datas = product.custom_fields || product.additional_infos || product.datas || {};
  const name = String(product.name || "Unknown Product");
  // Prefer reorder_point_infos from root; batch-level handled in Inventory tab
  const reorderPoint = (product as any).reorder_point_infos?.reorder_point ?? product.reorder_point ?? null;
  const initials = name.slice(0, 2).toUpperCase();
  const rawSku = product.sku || datas.sku || "";
  const uiId = (product as any).ui_id || "";
  const skuValue = rawSku || uiId || product.id || "—";
  const barcode = String(product.barcode || "—");
  const categoryName = (product as any).category_infos?.name || product.category || "—";
  const unitName = (product as any).unit_infos?.name || product.unit || "—";
  const description = String(product.description || "—");
  const sellingPrice = product.pricing_infos?.sell_price ?? product.sell_price ?? null;
  const buyingPrice = product.pricing_infos?.buy_price ?? product.buy_price ?? null;

  // ── Compute TOTAL available stocks across all sources ──────────────────────
  // Root stock_infos is often empty {} for batch/variant products.
  // We sum: root + all batch stocks + all variant stocks (direct + inside variant batches).
  const computeTotalStock = (): number | null => {
    let total = 0;
    let found = false;

    // Root level
    const rootStock = product.stock_infos?.available_stocks ?? product.stocks ?? null;
    if (rootStock !== null && rootStock !== undefined) { total += Number(rootStock); found = true; }

    // Batch level (for simple batch products)
    const batchList: any[] = Array.isArray((product as any).batch_infos)
      ? (product as any).batch_infos
      : ((product as any).batch_infos ? [(product as any).batch_infos] : []);
    for (const b of batchList) {
      const bs = b.stock_infos?.available_stocks;
      if (bs !== null && bs !== undefined) { total += Number(bs); found = true; }
    }

    // Variant level (direct stock_infos + variant's own batch_infos)
    const variantMap = (product as any).variant_infos || (product as any).variants;
    const variantList: any[] = variantMap
      ? (Array.isArray(variantMap) ? variantMap : Object.values(variantMap))
      : [];
    for (const v of variantList) {
      const vs = v.stock_infos?.available_stocks;
      if (vs !== null && vs !== undefined) { total += Number(vs); found = true; }
      const vBatches: any[] = Array.isArray(v.batch_infos) ? v.batch_infos : (v.batch_infos ? [v.batch_infos] : []);
      for (const vb of vBatches) {
        const vbs = vb.stock_infos?.available_stocks;
        if (vbs !== null && vbs !== undefined) { total += Number(vbs); found = true; }
      }
    }

    return found ? total : null;
  };
  const totalAvailableStock = computeTotalStock();

  // GST is at root level in the new API response
  const gstValue = (product as any).gst || datas.gst || "—";
  const storageLocation = (product as any).storage_location_infos?.storage_location || datas.storage_location || null;
  // Normalize variants: backend may return a dict {id: {...}} or an array
  const normalizeVariants = (raw: any): any[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return Object.values(raw);
    return [];
  };
  const combinations: any[] = normalizeVariants(product.variant_infos || product.variants);
  const variantTypes: any[] = datas.variant_types ?? datas.variantTypes ?? [];
  const batches: any[] = Array.isArray(product.batch_infos) ? product.batch_infos : (product.batch_infos ? [product.batch_infos] : (product.batches || []));

  const extractSerials = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v: any) => typeof v === 'string' ? v : v.name || "");
    if (val.serial_numbers && Array.isArray(val.serial_numbers)) return val.serial_numbers.map((v: any) => typeof v === 'string' ? v : v.name || "");
    return [];
  };

  const rootSerials = extractSerials(product.serialno_infos || product.serial_number);
  const hasVariants = !!product.type_infos?.has_variant || combinations.length > 0;
  const hasBatches = !!product.type_infos?.has_batch || batches.length > 0;
  const isActive = product.is_active === true;
  const isStockTracked = (product as any).have_tracking !== false && (product as any).is_stock_tracked !== false && (product as any).track_stock !== false && (product as any).type !== "service";

  const TABS = ["General Info", ...((hasVariants || hasBatches) ? ["Inventory & Variants"] : []), "Images", MOV_TAB_LABEL, ...(isStockTracked ? [PUR_TAB_LABEL] : [])];
  const IMG_TAB_LABEL = "Images";
  const inventoryTabIdx = TABS.indexOf("Inventory & Variants");
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
          imageUrl={
            Array.isArray((product as any).image_url)
              ? (product as any).image_url[0]
              : (product as any).image_url || datas.images?.[0] || datas.images || ""
          }
          subText={`SKU: ${skuValue}${uiId && uiId !== skuValue ? ` • ${uiId}` : ''} • Barcode: ${barcode}`}
          badges={[
            { text: categoryName, variant: "primary" },
            ...(!isActive && (product as any).have_tracking === false ? [] : [{ text: isActive ? "Active" : "Inactive", variant: isActive ? "success" : "danger", showPulse: true }]),
          ]}
          infoItems={[
            { icon: Tag, text: `Unit: ${unitName}` },
            ...(isStockTracked ? [{ icon: ShoppingCart, text: `Available in inventory: ${totalAvailableStock !== null ? totalAvailableStock : "—"}` }] : []),
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
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-300 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
                title="Delete Product"
              >
                <Trash2 size={14} />
              </button>
            </div>
          }
        />
      </div>

      {/* ── Tabs + Stats ─────────────────────────────────────── */}
      <div className="flex-none px-1 py-2 space-y-2">
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
                      <DetailItem icon={Tag} label="Category" value={categoryName} onClick={click("Category", categoryName)} />
                      <DetailItem icon={Hash} label="Brand" value={String(product.brand || datas.brand || "—")} onClick={click("Brand", String(product.brand || datas.brand || "—"))} />
                      <DetailItem icon={Info} label="Unit" value={unitName} onClick={click("Unit", unitName)} />
                      <DetailItem icon={Hash} label="SKU" value={skuValue} onClick={click("SKU", skuValue)} />
                      {uiId && uiId !== skuValue && <DetailItem icon={Hash} label="Product ID" value={uiId} onClick={click("Product ID", uiId)} />}
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
                          {hasVariants ? (
                            <div
                              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                              onClick={() => setActiveTab(inventoryTabIdx)}
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
                          {hasBatches ? (
                            <div
                              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                              onClick={() => setActiveTab(inventoryTabIdx)}
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
                          ) : (!!product.type_infos?.has_serialno || !!product.has_serialno) ? (
                            <div
                              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                              onClick={() => setActiveTab(inventoryTabIdx)}
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
                      {hasVariants || hasBatches ? (
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                          onClick={() => setActiveTab(inventoryTabIdx)}
                        >
                          <Layers size={12} className="text-indigo-500" />
                          <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                        </div>
                      ) : buyingPrice !== null ? (
                        <p className="text-[13px] font-semibold text-slate-800 tabular-nums">{`₹${buyingPrice}`}</p>
                      ) : (
                        <p className="text-[13px] font-semibold text-slate-400">—</p>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-medium text-slate-400 tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                        <Upload size={12} className="text-blue-400" /> Sell Price
                      </p>
                      {hasVariants || hasBatches ? (
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                          onClick={() => setActiveTab(inventoryTabIdx)}
                        >
                          <Layers size={12} className="text-indigo-500" />
                          <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                        </div>
                      ) : sellingPrice !== null ? (
                        <p className="text-[13px] font-semibold text-slate-800 tabular-nums">{`₹${sellingPrice}`}</p>
                      ) : (
                        <p className="text-[13px] font-semibold text-slate-400">—</p>
                      )}
                    </div>
                    <DetailItem icon={Tag} label="MRP" value={datas.mrp ? `₹${datas.mrp}` : "—"} onClick={click("MRP", datas.mrp ? `₹${datas.mrp}` : "—")} />
                    <DetailItem icon={Hash} label="HSN Code" value={String(datas.hsn || "—")} onClick={click("HSN Code", String(datas.hsn || "—"))} />
                    <DetailItem icon={BarChart2} label="GST Rate" value={gstValue} onClick={click("GST Rate", gstValue)} />
                    <div>
                      <p className="text-[10px] font-medium text-slate-400  tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                        <Info size={12} className="text-blue-400" /> Reorder Point
                      </p>
                      {(hasVariants || hasBatches) ? (
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                          onClick={() => setActiveTab(inventoryTabIdx)}
                        >
                          <Layers size={12} className="text-indigo-500" />
                          <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                        </div>
                      ) : reorderPoint !== null ? (
                        <p className="text-[13px] font-semibold text-slate-800 tabular-nums">{String(reorderPoint)}</p>
                      ) : (
                        <p className="text-[13px] font-semibold text-slate-400">—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                        <MapPin size={12} className="text-blue-400" /> Storage Location
                      </p>
                      {storageLocation ? (
                        <p className="text-[13px] font-semibold text-slate-800">{storageLocation}</p>
                      ) : (hasVariants || hasBatches) ? (
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                          onClick={() => setActiveTab(inventoryTabIdx)}
                        >
                          <Layers size={12} className="text-indigo-500" />
                          <span className="text-[11px] font-bold text-indigo-600">Available in Inventory tab</span>
                        </div>
                      ) : (
                        <p className="text-[13px] font-semibold text-slate-400">—</p>
                      )}
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
                      { label: "PRODUCT ID", value: uiId || product.id || "—" },
                      { label: "TYPE", value: datas.customer_type || "Product" },
                      { label: "GST", value: gstValue },
                      (!isActive && (product as any).have_tracking === false) ? null : { label: "STATUS", value: isActive ? "Active" : "Inactive", isStatus: true },
                      { label: "ONLINE", value: (product as any).visible_online ? "Visible" : "Hidden", isOnline: true },
                      { label: "VARIANTS", value: hasVariants ? `${combinations.length} combo${combinations.length !== 1 ? 's' : ''}` : "None" },
                      { label: "BATCHES", value: hasBatches ? `${batches.length} batch${batches.length !== 1 ? 'es' : ''}` : "None" },
                      { label: "SERIALS", value: (product as any).type_infos?.has_serialno ? "Tracked" : "Not tracked" },
                    ].filter(Boolean).map(row => {
                      if (!row) return null;
                      return (
                      <div key={row.label} className="flex items-center justify-between py-2.5">
                        <span className="text-[10px] font-bold text-slate-400  ">{row.label}</span>
                        {(row as any).isStatus ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                            {row.value}
                          </span>
                        ) : (row as any).isOnline ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(product as any).visible_online ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                            {row.value}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-700">{row.value}</span>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </SectionCard>

                {/* Custom Fields — separate card below Classification */}
                {(cfLoading || customFieldDefs.length > 0) && (
                  <SectionCard className="rounded-lg border-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Layers size={16} />
                      </div>
                      <h2 className="text-[10px] font-black text-slate-800 tracking-[0.15em]">Custom Attributes</h2>
                    </div>
                    {cfLoading ? (
                      <div className="py-4 flex justify-center"><Loader /></div>
                    ) : (
                      <div className="space-y-2">
                        {customFieldDefs.map((field) => {
                          const currentVal = customFieldValues.find((v) => v.field_id === field.id);
                          const isEditing = editingFieldId === field.id;
                          return (
                            <div key={field.id} className={`group relative p-3 rounded-lg border transition-all ${isEditing ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-100 bg-slate-50 hover:border-indigo-100'
                              }`}>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                                {field.label_name}{field.required && <span className="text-rose-400 ml-0.5">*</span>}
                              </p>
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <input
                                    autoFocus
                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="flex-1 h-7 px-2 text-xs font-semibold bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                  />
                                  <button onClick={() => handleSaveCustomField(field.id)} disabled={cfSaving}
                                    className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-60">
                                    {cfSaving ? <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={11} />}
                                  </button>
                                  <button onClick={() => { setEditingFieldId(null); setEditingValue(''); }}
                                    className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all active:scale-90">
                                    <XIcon size={11} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between cursor-pointer"
                                  onClick={() => { setEditingFieldId(field.id); setEditingValue(currentVal?.value ?? ''); }}>
                                  <p className="text-xs font-bold text-slate-700 truncate">
                                    {currentVal?.value || <span className="text-slate-300 font-medium italic">Click to set</span>}
                                  </p>
                                  <Pencil size={10} className="text-slate-300 group-hover:text-indigo-400 transition-colors ml-2 shrink-0" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                )}

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

          {/* TAB — Images */}
          {TABS[activeTab] === IMG_TAB_LABEL && (() => {
            // Collect all image URLs from the product
            const imageUrls: string[] = [];
            if ((product as any).image_url) {
              if (Array.isArray((product as any).image_url)) {
                imageUrls.push(...(product as any).image_url.filter(Boolean));
              } else {
                imageUrls.push((product as any).image_url);
              }
            }
            if (datas.images) {
              if (Array.isArray(datas.images)) imageUrls.push(...datas.images.filter(Boolean));
              else if (typeof datas.images === 'string') imageUrls.push(datas.images);
            }
            // Also look for images from variants if any
            combinations.forEach((v: any) => {
              if (v.image_url) imageUrls.push(v.image_url);
            });
            const uniqueImages = [...new Set(imageUrls.filter(Boolean))];

            return (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <SectionCard className="rounded-lg border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-100">
                      <ImageIcon size={16} />
                    </div>
                    <h2 className="text-[10px] font-black text-slate-800 tracking-[0.15em]">Product Images</h2>
                    {uniqueImages.length > 0 && (
                      <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {uniqueImages.length} image{uniqueImages.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {uniqueImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <ImageIcon size={32} className="text-slate-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-400">No images uploaded</p>
                        <p className="text-xs text-slate-300 mt-1">Edit the product to add images</p>
                      </div>
                      <button
                        onClick={() => navigate(`/product/${id}/edit`)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 active:scale-95"
                      >
                        Edit Product
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {uniqueImages.map((url, idx) => (
                        <div
                          key={url + idx}
                          className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <img
                            src={url}
                            alt={`Product image ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-bold transition-opacity">Open</span>
                          </div>
                          {idx === 0 && (
                            <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">MAIN</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            );
          })()}

          {/* TAB — Inventory & Variants */}
          {TABS[activeTab] === "Inventory & Variants" && (hasVariants || hasBatches) && (
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
                      <VariantRows combinations={combinations} baseSellPrice={sellingPrice} />
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
              const pType = p.type === 'PURCHASE_UPDATE' ? 'Purchase Update' : (p.type === 'DIRECT' ? 'Purchase' : (p.type?.includes('PO') ? 'PO Purchase' : 'Purchase'));

              const dateStr = isNewFormat ? p.purchase_date : (pd.date || p.created_at);
              const supplierName = isNewFormat ? p.supplier?.supplier_name : d.supplier_name;
              const uiId = isNewFormat ? p.purchase_id.split('-')[0].toUpperCase() : p.ui_id;

              const productsList: any[] = [];
              (p.items ?? p.products ?? []).forEach((prod: any) => {
                // Ensure we only aggregate for the specific product being viewed
                if (prod.inventory_id !== id && prod.product_id !== id && prod.id !== id) return;

                // NEW FORMAT SUPPORT
                if (prod.stocks_infos !== undefined) {
                  productsList.push({
                    variant: prod.variant_infos?.variant_name || prod.variant_infos?.name || null,
                    batch: prod.batch_infos?.batch_name || prod.batch_infos?.name || null,
                    stocksBefore: prod.stocks_infos?.stocks_before ?? null,
                    receivedStocks: prod.stocks_infos?.stocks || 0,
                    buyPrice: prod.buy_price,
                    sellPrice: prod.sell_price,
                    serials: prod.serial_numbers || [],
                    variant_details: prod.variant_infos || null,
                    batch_details: prod.batch_infos || null,
                    serial_info: prod.serial_numbers || null
                  });
                  return;
                }

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

                const variants = normalizeVariants(prod.variants ?? null);
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
                  paymentMethod: p.payment_infos?.[0]?.method ?? (isNewFormat ? p.payment_status : (payment.method || "—")),
                  amountPaid: p.paid_amount ?? p.payment_infos?.[0]?.amount ?? (isNewFormat ? 0 : (payment.amountPaid || 0)),
                  totalCost: p.total_cost ?? p.item_infos?.total_pur_cost ?? (isNewFormat ? 0 : (pd.totalCost || 0)),
                  invoiceNo: p.invoice_no ?? (isNewFormat ? "" : (pd.invoiceNo || "—")),
                  referenceNo: p.reference_no ?? (isNewFormat ? "" : (pd.referenceNo || "—")),
                  storageLocation: isNewFormat ? productsList[0].storage_location || '—' : (d.storage_location || p.storage_location || '—'),
                  version: p.version || d?.version || p.datas?.version || "v1",
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

