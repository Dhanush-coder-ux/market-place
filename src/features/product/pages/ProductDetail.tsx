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
import { StatCard } from "@/components/common/StatsCard";
import { Modal, ProfileHeaderCard, SectionCard, DetailItem } from "@/components/common/SuperUI";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { VariantRows, SerialBadgeList } from "../../inventory/components/StockTree";
import type { ProductRecord } from "@/types/api";

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

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [viewValue, setViewValue] = useState<{ label: string; value: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.INVENTORIES}/by/${id}/${SHOP_ID}`).then((res) => {
      if (res) setProduct(Array.isArray(res.data) ? res.data[0] : res.data);
      setRecordLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteData(`${ENDPOINTS.INVENTORIES}/${id}/${SHOP_ID}`);
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

  const datas = (product as any).datas ?? {};
  const name = String(datas.name ?? datas.product_name ?? product.barcode ?? "Unknown Product");
  const initials = name.slice(0, 2).toUpperCase();
  const sku = String(product.barcode ?? datas.barcode ?? "—");
  const category = String(datas.category ?? "—");
  const description = String(datas.description ?? "—");
  const sellingPrice = (product as any).sell_price ?? datas.sell_price ?? datas.selling_price ?? "—";
  const buyingPrice = (product as any).buy_price ?? datas.buy_price ?? datas.buying_price ?? "—";
  const currentStock = (product as any).stocks ?? datas.stocks ?? datas.stock ?? "—";
  const unit = String(datas.unit ?? "—");
  const combinations: any[] = product.variants ?? datas.combinations ?? [];
  const variantTypes: any[] = datas.variantTypes ?? [];
  const hasVariants = datas.has_variants === true || datas.has_varients === true || combinations.length > 0;
  const isActive = datas.is_active !== false;

  const TABS = ["General Info", ...(hasVariants ? ["Variants"] : [])];

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
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              activeTab === i
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
            currentStock !== "—" && buyingPrice !== "—"
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
                      {datas.serial_numbers && datas.serial_numbers.length > 0 ? (
                        <SerialBadgeList serials={datas.serial_numbers} />
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
                  <DetailItem icon={Download} label="Buying Price" value={buyingPrice !== "—" ? `₹${buyingPrice}` : "—"} onClick={click("Buying Price", `₹${buyingPrice}`)} />
                  <DetailItem icon={Upload} label="Selling Price" value={sellingPrice !== "—" ? `₹${sellingPrice}` : "—"} onClick={click("Selling Price", `₹${sellingPrice}`)} />
                  <DetailItem icon={Tag} label="MRP" value={datas.mrp ? `₹${datas.mrp}` : "—"} onClick={click("MRP", datas.mrp ? `₹${datas.mrp}` : "—")} />
                  <DetailItem icon={BarChart2} label="GST Rate" value={String(datas.gst || "—")} onClick={click("GST Rate", String(datas.gst || "—"))} />
                  <DetailItem icon={Hash} label="HSN Code" value={String(datas.hsn || "—")} onClick={click("HSN Code", String(datas.hsn || "—"))} />
                  <DetailItem icon={Info} label="Reorder Point" value={String(datas.reorder_point || "—")} onClick={click("Reorder Point", String(datas.reorder_point || "—"))} />
                  <DetailItem icon={Package} label="Max Stock" value={String(datas.max_stock || "—")} onClick={click("Max Stock", String(datas.max_stock || "—"))} />
                  <DetailItem icon={MapPin} label="Location" value={String(datas.location || "—")} onClick={click("Location", String(datas.location || "—"))} />
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

        {/* TAB 1 — Variants */}
        {activeTab === 1 && hasVariants && (
          <div className="space-y-4">
            {/* Variant types chips */}
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

            {/* Combinations tree */}
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
