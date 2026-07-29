import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Package, Save, Cpu, AlertCircle, Layers, Zap, Bookmark,
  Plus, Info, ImagePlus, X, UploadCloud,
  BarChart3, Check, Settings2, FileText,
  IndianRupee, Barcode,
} from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID, ENDPOINTS } from "@/services/endpoints";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "@/services/api/apiClient";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { Switch } from "@/components/ui/switch";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { supplierApi } from "@/services/api/supplier";
import { utilityApi } from "@/services/api/utility";
import { inventoryApi } from "@/services/api/inventory";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { NavigationBlocker } from "@/components/common/NavigationBlocker";
import { QuickCreateSupplierModal } from "@/features/common/QuickCreate/QuickCreateSupplierModal";
import {
  VariantType,
  VariantCombination,
  VariantBuilder,
  VariantMatrixTable,
  generateCombinations,
} from "../components/VariantManager";

/* ─── TYPES ─────────────────────────────────────────────────────────── */

type FormData = {
  name: string;
  stocks: number;
  serial_number: string;
  barcode: string;
  brand: string;
  category: string;
  unit: string;
  description: string;
  is_active: boolean;
  mrp: string;
  selling_price: string;
  cost_to_make: string;
  gst: string;
  hsn: string;
  sku: string;
  supplier: string;
  opening_stock: string;
  reorder_point: string;
  max_stock: string;
  location: string;
  has_variants: boolean;
  batch_tracking: boolean;
  serial_tracking: boolean;
  batch_name: string;
  mfg_date: string;
  exp_date: string;
  track_stock: boolean;            // true = stocked, false = made-to-order
  low_stock_alert: string;
  visible_online: boolean;         // toggle for digital store visibility
};

interface CategoryConfig {
  suggestedVariantTypes: string[];
  supportsSerials: boolean;
  serialLabel: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  "Mobile Phones": { suggestedVariantTypes: ["Storage", "Color", "Model"], supportsSerials: true, serialLabel: "IMEI Number" },
  "Laptops": { suggestedVariantTypes: ["RAM", "Storage", "Color"], supportsSerials: true, serialLabel: "Serial Number" },
  "Clothing": { suggestedVariantTypes: ["Size", "Color"], supportsSerials: false, serialLabel: "Serial Number" },
  "Footwear": { suggestedVariantTypes: ["Size", "Color"], supportsSerials: false, serialLabel: "Serial Number" },
  "Electronics": { suggestedVariantTypes: ["Color", "Wattage", "Model"], supportsSerials: true, serialLabel: "Serial Number" },
  "Accessories": { suggestedVariantTypes: ["Color", "Size"], supportsSerials: false, serialLabel: "Serial Number" },
  "Tablets": { suggestedVariantTypes: ["Storage", "Connectivity", "Color"], supportsSerials: true, serialLabel: "IMEI / Serial" },
  "Food & Beverages": { suggestedVariantTypes: ["Flavor", "Size"], supportsSerials: false, serialLabel: "Serial Number" },
  "Bakery": { suggestedVariantTypes: ["Flavor", "Weight"], supportsSerials: false, serialLabel: "Serial Number" },
  "Juices & Drinks": { suggestedVariantTypes: ["Flavor", "Size"], supportsSerials: false, serialLabel: "Serial Number" },
};

const GST_RATES = ["0", "5", "12", "18", "28"];

const uid = () => `id_${Math.random().toString(36).slice(2, 11)}`;

/* ─── SHARED STYLES ──────────────────────────────────────────────────── */

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  .pf-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
  .pf-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .pf-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .pf-section-enter { animation: secIn 0.22s ease forwards; }
  @keyframes secIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
  .pf-fade-in { animation: fadeIn 0.2s ease forwards; }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

  select.pf-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  .pf-scroll::-webkit-scrollbar { height: 4px; width: 4px; }
  .pf-scroll::-webkit-scrollbar-track { background: transparent; }
  .pf-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

  .pf-card { transition: box-shadow 0.18s ease; }
  .pf-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }

  .pf-img-upload:hover { border-color: #6366f1; background: #f5f5ff; }

  .checklist-item { transition: color 0.2s; }

  .info-tip { transition: all 0.15s; }

  .pf-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: white;
    border-top: 1px solid #e2e8f0;
    padding: 10px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
  }

  .mode-toggle-on  { background: #4f46e5; }
  .mode-toggle-off { background: #e2e8f0; }
`;

/* ─── SMALL UI COMPONENTS ────────────────────────────────────────────── */

interface LabelProps { text: string; required?: boolean; hint?: string; tooltip?: string; }
const Label: React.FC<LabelProps> = ({ text, required, hint, tooltip }) => (
  <div className="flex items-center gap-1.5 mb-1.5">
    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
      {text}{required && <span className="text-red-400 ml-0.5">*</span>}
      {hint && <span className="ml-1.5 normal-case font-normal text-slate-400 lowercase">({hint})</span>}
    </label>
    {tooltip && (
      <div className="group relative flex items-center">
        <Info size={11} className="text-slate-400 cursor-help hover:text-indigo-500 transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl normal-case font-medium tracking-normal leading-relaxed">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
        </div>
      </div>
    )}
  </div>
);

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  hint?: string;
  leftEl?: React.ReactNode;
  rightEl?: React.ReactNode;
  error?: string;
  tooltip?: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, required, hint, leftEl, rightEl, error, tooltip, className = "", ...rest }) => (
  <div className={`transition-opacity duration-200 ${rest.disabled ? "opacity-50" : ""}`}>
    {label && <Label text={label} required={required} hint={hint} tooltip={tooltip} />}
    <div className="relative">
      {leftEl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">{leftEl}</span>}
      <input
        {...rest}
        className={`pf-input w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300 ${leftEl ? "pl-8" : ""} ${rightEl ? "pr-14" : ""} ${error ? "border-red-300 bg-red-50/30" : ""} ${rest.disabled ? "bg-slate-50 cursor-not-allowed" : ""} ${className}`}
      />
      {rightEl && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{rightEl}</span>}
    </div>
    {error && <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={10} />{error}</p>}
  </div>
);

/* Section Card Wrapper */
const SectionCard: React.FC<{ icon: React.ReactNode; iconBg: string; title: string; subtitle?: string; children: React.ReactNode; extra?: React.ReactNode }> = ({ icon, iconBg, title, subtitle, children, extra }) => (
  <div className="pf-card bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {extra}
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

/* ─── MAIN PRODUCT FORM ──────────────────────────────────────────────── */

interface ProductFormProps {
  initialData?: Record<string, unknown>;
  isLoading?: boolean;
}

interface QuickCreateDropdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "categories" | "units";
  onSuccess: (item: { id: string; name: string }) => void;
}

const QuickCreateDropdownModal: React.FC<QuickCreateDropdownModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!value.trim()) return;
    setLoading(true);

    try {
      if (type === "categories") {
        const res = await utilityApi.createShopCategory({ shop_id: SHOP_ID, name: value.trim() });
        if (res?.data) onSuccess({ id: res.data.id, name: res.data.name });
      } else {
        const res = await utilityApi.createShopUnit({
          shop_id: SHOP_ID,
          name: value.trim(),
          short_name: value.trim().substring(0, 3).toUpperCase()
        });
        if (res?.data) onSuccess({ id: res.data.id, name: res.data.name });
      }
      setValue("");
      onClose();
    } catch (err) {
      showToast(`Failed to create ${type === "categories" ? "category" : "unit"}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Add New {type === "categories" ? "Category" : "Unit"}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name</label>
          <input
            type="text"
            autoFocus
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            placeholder={`e.g. ${type === "categories" ? "Beverages" : "Box"}`}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 h-9 rounded-lg font-semibold text-xs text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!value.trim() || loading}
            className="px-4 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ProductForm: React.FC<ProductFormProps> = ({ initialData: propInitialData = {}, isLoading: externalLoading = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { inventory, inventoryCustomFields } = useBusinessApi();
  const { postData } = useApi();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const isLoading = externalLoading || loading || isSubmitting;

  // ── Custom Fields State ──
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Sidebar creation form state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldVisible, setNewFieldVisible] = useState(false);

  const [modalState, setModalState] = useState<{ type: "Supplier" | "Category" | "Unit" | null; query: string }>({ type: null, query: "" });

  const [form, setForm] = useState<FormData>({
    name: (propInitialData.name as string) || "",
    stocks: (propInitialData.stocks as number) || 0,
    serial_number: (propInitialData.serial_number as string) || "",
    barcode: (propInitialData.barcode as string) || "",
    brand: (propInitialData.brand as string) || "",
    category: (propInitialData.category as string) || "",
    unit: (propInitialData.unit as string) || "Piece (pcs)",
    description: (propInitialData.description as string) || "",
    is_active: (propInitialData.is_active as boolean) ?? true,
    mrp: (propInitialData.mrp as string) || "",
    selling_price: "",
    cost_to_make: "",
    gst: String((propInitialData.gst as string) || "18").replace("%", ""),
    hsn: "",
    sku: "",
    supplier: (propInitialData.supplier as string) || "",
    opening_stock: (propInitialData.opening_stock as string) || "0",
    reorder_point: (propInitialData.reorder_point as string) || "5",
    max_stock: (propInitialData.max_stock as string) || "",
    location: (propInitialData.location as string) || "",
    has_variants: false,
    batch_tracking: (propInitialData.batch_tracking as boolean) || false,
    serial_tracking: (propInitialData.serial_tracking as boolean) || false,
    batch_name: "",
    mfg_date: "",
    exp_date: "",
    track_stock: true,
    low_stock_alert: "Notify me",
    visible_online: false,
  });

  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);
  const [baseSerials, setBaseSerials] = useState<string[]>([]);
  // Flag: true while combinations were just loaded from server (skip client-side regeneration)
  const justLoadedCombinationsRef = useRef(false);
  const [supplierDetails, setSupplierDetails] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [baseName, setBaseName] = useState("");
  const [showBarcodeGen, setShowBarcodeGen] = useState(false);
  const [barcodePrefix, setBarcodePrefix] = useState("");
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);

  // Pagination states for Categories (offset represents page number, 1-indexed)
  const [categoriesOffset, setCategoriesOffset] = useState(1);
  const [hasMoreCategories, setHasMoreCategories] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Pagination states for Units (offset represents page number, 1-indexed)
  const [unitsOffset, setUnitsOffset] = useState(1);
  const [hasMoreUnits, setHasMoreUnits] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const fetchMoreCategories = async () => {
    if (loadingCategories || !hasMoreCategories) return;
    setLoadingCategories(true);
    try {
      const nextPage = categoriesOffset + 1;
      const res = await utilityApi.getShopCategories(SHOP_ID, { limit: "100", offset: String(nextPage) });
      if (res?.data && res.data.length > 0) {
        setCategories(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const filtered = res.data.filter((c: any) => !existingIds.has(c.id));
          return [...prev, ...filtered];
        });
        setCategoriesOffset(nextPage);
        if (res.data.length < 100) {
          setHasMoreCategories(false);
        }
      } else {
        setHasMoreCategories(false);
      }
    } catch (e) {
      console.error("Failed to fetch more categories", e);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchMoreUnits = async () => {
    if (loadingUnits || !hasMoreUnits) return;
    setLoadingUnits(true);
    try {
      const nextPage = unitsOffset + 1;
      const res = await utilityApi.getShopUnits(SHOP_ID, { limit: "100", offset: String(nextPage) });
      if (res?.data && res.data.length > 0) {
        setUnits(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const filtered = res.data.filter((u: any) => !existingIds.has(u.id));
          return [...prev, ...filtered];
        });
        setUnitsOffset(nextPage);
        if (res.data.length < 100) {
          setHasMoreUnits(false);
        }
      } else {
        setHasMoreUnits(false);
      }
    } catch (e) {
      console.error("Failed to fetch more units", e);
    } finally {
      setLoadingUnits(false);
    }
  };

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [catRes, unitRes] = await Promise.all([
          utilityApi.getShopCategories(SHOP_ID, { limit: "100", offset: "1" }),
          utilityApi.getShopUnits(SHOP_ID, { limit: "100", offset: "1" })
        ]);
        if (catRes?.data) {
          setCategories(catRes.data);
          if (catRes.data.length < 100) setHasMoreCategories(false);
        }
        if (unitRes?.data) {
          setUnits(unitRes.data);
          if (unitRes.data.length < 100) setHasMoreUnits(false);
        }
      } catch (e) {
        console.error("Failed to fetch custom dropdowns", e);
      }
    };
    fetchDropdowns();
  }, []);

  /* ─── Barcode generator ─── */
  const handleGenerateBarcode = async () => {
    setGeneratingBarcode(true);
    try {
      const res = await postData(ENDPOINTS.GENERATE_BARCODE, { prefix: barcodePrefix || undefined });
      if (res?.data?.barcode) {
        setForm(p => ({ ...p, barcode: res.data.barcode }));
        setShowBarcodeGen(false);
        showToast("Barcode generated", "success");
      } else {
        const localNum = Math.floor(10000000 + Math.random() * 90000000);
        const prefix = barcodePrefix ? barcodePrefix.toUpperCase().trim() : "BAR";
        setForm(p => ({ ...p, barcode: `${prefix}${localNum}` }));
        setShowBarcodeGen(false);
        showToast("Barcode generated locally", "success");
      }
    } catch {
      const localNum = Math.floor(10000000 + Math.random() * 90000000);
      const prefix = barcodePrefix ? barcodePrefix.toUpperCase().trim() : "BAR";
      setForm(p => ({ ...p, barcode: `${prefix}${localNum}` }));
      setShowBarcodeGen(false);
      showToast("Barcode generated locally", "success");
    } finally {
      setGeneratingBarcode(false);
    }
  };

  /* ─── Bottom actions (global header bar) ─── */
  const { setBottomActions } = useHeader();

  // Validation computed values
  const missingFields: string[] = [];
  if (!form.name.trim()) missingFields.push("name");
  if (!form.category) missingFields.push("category");
  // Image is only required for new products; in edit mode the server already has images
  if (!id && existingImages.length === 0 && selectedImageFiles.length === 0) missingFields.push("image");
  if (!form.track_stock && !form.selling_price) missingFields.push("selling price");
  if (!form.track_stock && !form.cost_to_make) missingFields.push("cost");

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="px-4 h-9 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs bg-white hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Bookmark size={14} className="shrink-0" />
            Save draft
          </button>
        )}
        <GradientButton
          icon={<Save size={15} />}
          onClick={handleSubmit}
          disabled={isLoading}
          className="rounded-lg shadow-md text-xs px-6 h-9 flex items-center"
        >
          {isLoading ? "Saving…" : (id ? "Save Changes" : "Create product")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, isLoading, id, form, variantTypes, combinations, baseSerials, supplierDetails, isSavingDraft, existingImages, selectedImageFiles]);

  // Load custom field definitions
  useEffect(() => {
    inventoryCustomFields.getAllFields(SHOP_ID).then((fields) => {
      setCustomFieldDefs(fields);
    });
  }, []);

  /* ─── Load existing product ─── */
  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const res = await inventory.getInventoryById(SHOP_ID, id);
          console.log("=== API RESPONSE ===", res);
          if (res?.data) {
            const prod = Array.isArray(res.data) ? (res.data.find((p: any) => p.id === id) || res.data[0]) : res.data;
            console.log("=== EXTRACTED PROD ===", prod);
            if (!prod) return;
            const additional = prod.additional_infos || prod.datas || {};
            const nextForm = {
              name: prod.name || "",
              stocks: prod.stock_infos?.available_stocks || 0,
              serial_number: (prod.serialno_infos && prod.serialno_infos.length > 0 ? (typeof prod.serialno_infos[0] === 'string' ? prod.serialno_infos[0] : prod.serialno_infos[0].name || "") : ""),
              barcode: prod.barcode || "",
              brand: prod.brand || additional.brand || "",
              category: prod.category_id || "",
              unit: prod.unit_id || "",
              description: prod.description || "",
              is_active: prod.is_active ?? true,
              mrp: String(additional.mrp || ""),
              selling_price: String(prod.pricing_infos?.sell_price || ""),
              cost_to_make: String(prod.pricing_infos?.buy_price || ""),
              gst: String(prod.gst || "18").replace("%", ""),
              hsn: String(additional.hsn || ""),
              sku: prod.sku || "",
              supplier: additional.supplier || "",
              opening_stock: String(additional.opening_stock || "0"),
              reorder_point: String(prod.reorder_point_infos?.reorder_point || "5"),
              max_stock: String(additional.max_stock || ""),
              location: prod.storage_location_infos?.storage_location || "",
              has_variants: !!prod.type_infos?.has_variant,
              batch_tracking: !!prod.type_infos?.has_batch,
              serial_tracking: !!prod.type_infos?.has_serialno,
              batch_name: prod.batch_infos?.name || "",
              mfg_date: prod.batch_infos?.manufacturing_date || "",
              exp_date: prod.batch_infos?.expiry_date || "",
              track_stock: prod.have_tracking ?? true,
              low_stock_alert: additional.low_stock_alert || "Notify me",
              visible_online: prod.visible_online || false,
            };
            console.log("=== SETTING FORM ===", nextForm);
            setForm(nextForm);

            // Ensure the product's category and unit are in the dropdown lists.
            // They might not be if the shop has >100 of them (pagination) or if
            // the lists haven't loaded yet. Inject stub entries so ReusableSelect
            // can resolve the display label immediately.
            if (prod.category_id) {
              setCategories(prev => {
                if (prev.some(c => c.id === prod.category_id)) return prev;
                const label = prod.category_name || prod.category || prod.additional_infos?.category || prod.category_id;
                return [{ id: prod.category_id, name: label }, ...prev];
              });
            }
            if (prod.unit_id) {
              setUnits(prev => {
                if (prev.some(u => u.id === prod.unit_id)) return prev;
                const label = prod.unit_name || prod.unit || prod.additional_infos?.unit || prod.unit_id;
                return [{ id: prod.unit_id, name: label }, ...prev];
              });
            }

            const imgList = prod.image_url || additional.images || [];
            if (imgList && Array.isArray(imgList)) setExistingImages(imgList);

            const loadedBrand = additional.brand || "";
            const loadedName = prod.name || "";
            const baseFromLoad = loadedBrand && loadedName.startsWith(loadedBrand + " ")
              ? loadedName.slice(loadedBrand.length + 1) : loadedName;
            setBaseName(baseFromLoad);

            if (additional.supplier) {
              supplierApi.searchSuppliers(additional.supplier).then((sups: any[]) => {
                const matched = sups.find((s: any) => s.id === additional.supplier);
                if (matched) setSupplierDetails(matched);
              });
            }

            const vInfos = prod.variant_infos || (prod.variants ? Object.values(prod.variants) : []);

            if (additional.variant_types) setVariantTypes(additional.variant_types);
            else if (vInfos.length > 0) {
              const firstVar: any = vInfos[0];
              const attributes = firstVar.additional_infos?.attributes || firstVar.attributes || { "Variant": firstVar.name };
              if (attributes && Object.keys(attributes).length > 0) {
                const types = Object.keys(attributes).map(key => ({
                  id: uid(),
                  name: key,
                  values: Array.from(new Set(vInfos.map((v: any) => 
                    v.additional_infos?.attributes?.[key] || v.attributes?.[key] || (key === "Variant" ? v.name : "")
                  ))).filter(Boolean) as string[],
                }));
                setVariantTypes(types);
              }
            }
            if (vInfos.length > 0) {
              // Mark that we're loading combinations from the server so the
              // generateCombinations useEffect doesn't overwrite prices with zeros.
              justLoadedCombinationsRef.current = true;
              setCombinations(vInfos.map((v: any) => {
                const attrs = v.additional_infos?.attributes || v.attributes || { "Variant": v.name };
                const pricing = v.pricing_infos && Object.keys(v.pricing_infos).length > 0 ? v.pricing_infos : (v.batch_infos?.[0]?.pricing_infos || {});
                const stockInfo = v.stock_infos && Object.keys(v.stock_infos).length > 0 ? v.stock_infos : (v.batch_infos?.[0]?.stock_infos || {});
                const reorderInfo = v.reorder_point_infos && Object.keys(v.reorder_point_infos).length > 0 ? v.reorder_point_infos : (v.batch_infos?.[0]?.reorder_point_infos || {});
                
                return {
                  id: v.id || uid(),
                  attributes: attrs,
                  barcode: v.additional_infos?.barcode || v.barcode || "",
                  sku: v.additional_infos?.sku || v.sku || v.barcode || "",
                  price: String(pricing.sell_price || v.sell_price || ""),
                  buy_price: String(pricing.buy_price || v.buy_price || ""),
                  mrp: String(v.additional_infos?.mrp || pricing.mrp || ""),
                  reorder_point: String(reorderInfo.reorder_point || v.reorder_point || "5"),
                  stock: String(stockInfo.available_stocks || "0"),
                  active: true,
                  serials: (v.additional_infos?.serial_numbers || v.serial_numbers || []).map((sn: string) => ({
                    id: uid(), serial: sn, status: "available" as const, purchaseDate: "", warrantyMonths: "12",
                  })),
                };
              }));
            }
            if (!prod.type_infos?.has_variant && prod.serialno_infos) {
              const baseSn = prod.serialno_infos.map((s: any) => typeof s === 'string' ? s : s.name);
              setBaseSerials(baseSn);
            }
          }
        } catch (err) {
          console.error("Failed to load product", err);
        } finally {
          setLoading(false);
        }
      };

      const fetchCustomFieldValues = async () => {
        const vals = await inventoryCustomFields.getValuesByProduct(SHOP_ID, id);
        const record: Record<string, string> = {};
        vals.forEach((v) => {
          record[v.field_id] = v.value;
        });
        setCustomFieldValues(record);
      };

      fetchProduct();
      fetchCustomFieldValues();
    } else {
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("product_drafts") || "[]");
        const draft = drafts.find((d: any) => d.id === draftId);
        if (draft) {
          setForm(prev => ({ ...prev, ...draft.data.form }));
          if (draft.data.variantTypes) setVariantTypes(draft.data.variantTypes);
          if (draft.data.combinations) setCombinations(draft.data.combinations);
        }
      }
    }
  }, [id, searchParams]);

  const selectedCategoryName = categories.find(c => c.id === form.category)?.name || form.category;
  const categoryConfig = CATEGORY_CONFIGS[selectedCategoryName] ?? {
    suggestedVariantTypes: [], supportsSerials: false, serialLabel: "Serial Number",
  };

  /* Regenerate variant combinations when types change.
   * SKIP if combinations were just loaded from the server — we don't want to
   * overwrite real prices/stock data with zeros during edit-mode init. */
  useEffect(() => {
    if (!form.has_variants) return;
    if (justLoadedCombinationsRef.current) {
      justLoadedCombinationsRef.current = false;
      return;
    }
    const newCombos = generateCombinations(variantTypes, combinations, {
      buy_price: "0", sell_price: "0", mrp: "0", reorder_point: form.reorder_point || "5",
    });
    setCombinations(newCombos);
  }, [variantTypes, form.has_variants]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "gst") {
      setForm(p => ({ ...p, gst: value.replace(/[^0-9.]/g, "") }));
    } else if (name === "name") {
      setForm(p => {
        const stripped = p.brand && value.startsWith(p.brand + " ") ? value.slice(p.brand.length + 1) : value;
        setBaseName(stripped);
        return { ...p, name: p.brand ? `${p.brand} ${stripped}`.trim() : stripped };
      });
    } else if (name === "brand") {
      const fullName = value ? `${value} ${baseName}`.trim() : baseName;
      setForm(p => ({ ...p, brand: value, name: fullName }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  /* ─── Image upload ─── */
  /* ─── Image Selection ─── */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const allowedCount = 3 - (existingImages.length + selectedImageFiles.length);
    if (files.length > allowedCount) {
      showToast(`You can only add ${allowedCount} more image(s).`, "error");
      return;
    }
    setSelectedImageFiles(prev => [...prev, ...files.slice(0, allowedCount)]);
  };

  const removeExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));
  const removeSelectedImage = (index: number) => setSelectedImageFiles(prev => prev.filter((_, i) => i !== index));

  /* ─── Save draft ─── */
  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    const drafts = JSON.parse(localStorage.getItem("product_drafts") || "[]");
    const draftId = searchParams.get("draftId") || Date.now().toString();
    const newDraft = {
      id: draftId,
      data: { form, variantTypes, combinations },
      timestamp: new Date().toISOString(),
      displayName: form.name || "Untitled Product Draft",
    };
    const existingIndex = drafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) drafts[existingIndex] = newDraft;
    else drafts.push(newDraft);
    localStorage.setItem("product_drafts", JSON.stringify(drafts));
    showToast("Progress saved as draft", "info");
    setIsSavingDraft(false);
  };

  /* ─── Submit ─── */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingRef.current) return;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!form.name.trim()) {
      showToast("Product name is required", "error");
      return;
    }
    if (!form.category) {
      showToast("Category is required", "error");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const activeCombinations = combinations.filter(c => c.active);
    if (form.has_variants && activeCombinations.length === 0) {
      showToast("Please have at least one active variant combination", "error");
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const finalImages = [...existingImages];

    // ── Shared variant_infos builder ─────────────────────────────────────────
    // For CREATE  → CreateProdInvVariantType  (no id field)
    // For UPDATE  → UpdateProdInvVariantType  (id field optional, pricing_id etc.)
    const mappedVariants = activeCombinations.map(combo => {
      const variantName = Object.values(combo.attributes).join(" / ");
      const isNew = combo.id.startsWith("id_");
      return {
        ...(id && !isNew ? { id: combo.id } : {}),   // only include id on update for existing variants
        name: variantName,
        storage_location: form.location || null,
        reorder_point: Number(combo.reorder_point) || 5,
        buy_price: Number(combo.buy_price) || null,
        sell_price: Number(combo.price) || null,
        online_sell_price: null,
        visible_online: form.visible_online,
      };
    });

    // ── Shared custom_fields blob (stored as extra metadata) ─────────────────
    const customFieldsBlob: Record<string, any> = {
      brand: form.brand,
      mrp: Number(form.mrp) || 0,
      hsn: form.hsn,
      sku: form.sku,
      supplier: form.supplier,
      is_active: form.is_active,
      variant_types: variantTypes,
      images: finalImages,
      low_stock_alert: form.low_stock_alert,
      // Store variant attribute map for edit-time reconstruction
      variant_attribute_map: form.has_variants
        ? activeCombinations.reduce((acc, combo) => {
          const name = Object.values(combo.attributes).join(" / ");
          acc[name] = { attributes: combo.attributes, barcode: combo.barcode, sku: combo.sku, mrp: combo.mrp };
          return acc;
        }, {} as Record<string, any>)
        : undefined,
      // Dynamic custom fields keyed by field_name
      ...Object.entries(customFieldValues).reduce((acc, [fieldId, val]) => {
        const fieldDef = customFieldDefs.find(fd => fd.id === fieldId);
        if (fieldDef) acc[fieldDef.field_name] = val;
        return acc;
      }, {} as Record<string, any>),
    };

    // For non-variant products with serial tracking, embed serial numbers
    if (!form.has_variants && form.serial_tracking && baseSerials.length > 0) {
      customFieldsBlob.serial_numbers = baseSerials;
    }

    // For non-variant products with batch tracking, embed batch info
    if (!form.has_variants && form.batch_tracking) {
      customFieldsBlob.batch_info = {
        name: form.batch_name || null,
        manufacturing_date: form.mfg_date || null,
        expiry_date: form.exp_date || null,
      };
    }

    const gstFormatted = form.gst
      ? (form.gst.includes("%") ? form.gst : `${form.gst}%`)
      : "0%";

    // ── BUILD PAYLOAD ────────────────────────────────────────────────────────
    let payload: any;

    if (id) {
      // ── UPDATE: UpdateProdInvSchema ──────────────────────────────────────
      // Required: id, shop_id. All other fields optional — only send what changed.
      payload = {
        id,
        shop_id: SHOP_ID,
        name: form.name,
        brand: form.brand || null,
        description: form.description || null,
        barcode: form.barcode || null,
        category_id: form.category || null,
        unit_id: form.unit || null,
        type_infos: {
          has_batch: form.batch_tracking,
          has_variant: form.has_variants,
          has_serialno: form.serial_tracking,
        },
        have_tracking: form.track_stock,
        variant_infos: form.has_variants ? mappedVariants : null,
        storage_location: form.location || null,
        gst: gstFormatted,
        reorder_point: Number(form.reorder_point) || 5,
        visible_online: form.visible_online,
        // Preserve pricing: for stocked items, send if the user has provided a value;
        // for made-to-order items, always send the entered value.
        buy_price: form.selling_price || form.cost_to_make
          ? (Number(form.cost_to_make) || null)
          : null,
        sell_price: form.selling_price
          ? (Number(form.selling_price) || null)
          : null,
        online_sell_price: null,
        custom_fields: customFieldsBlob,
      };
    } else {
      // ── CREATE: CreateProdInvSchema ──────────────────────────────────────
      // Required: shop_id, category_id, unit_id, name, description, type_infos, have_tracking
      payload = {
        shop_id: SHOP_ID,
        category_id: form.category,
        unit_id: form.unit,
        name: form.name,
        brand: form.brand || null,
        description: form.description,
        barcode: form.barcode || null,
        type_infos: {
          has_batch: form.batch_tracking,
          has_variant: form.has_variants,
          has_serialno: form.serial_tracking,
        },
        have_tracking: form.track_stock,
        variant_infos: form.has_variants ? mappedVariants : null,
        storage_location: form.location || null,
        // For made-to-order items set price directly; for stocked items price comes from purchase
        buy_price: !form.track_stock ? (Number(form.cost_to_make) || null) : null,
        sell_price: !form.track_stock ? (Number(form.selling_price) || null) : null,
        online_sell_price: null,
        gst: gstFormatted,
        reorder_point: Number(form.reorder_point) || 5,
        visible_online: form.visible_online,
        custom_fields: {
          ...customFieldsBlob,
          opening_stock: 0,
        },
      };
    }

    // ── API call ─────────────────────────────────────────────────────────────
    let res;
    try {
      if (id) {
        res = await inventoryApi.updateInventory(payload);
      } else {
        res = await inventoryApi.createInventory(payload);
      }
    } catch (e) {
      console.error("Failed to save product:", e);
      showToast("Failed to save product. Please try again.", "error");
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    // apiClient throws on non-200, so if we reach here with a truthy res, it was successful.
    if (res) {
      const savedProductId = res.data?.id || res.id || id;

      // ── Upload any newly selected images ──────────────────────────────────
      if (savedProductId && selectedImageFiles.length > 0) {
        setIsUploadingImages(true);
        const uploadFormData = new FormData();
        uploadFormData.append("shop_id", SHOP_ID);
        uploadFormData.append("product_id", savedProductId);
        selectedImageFiles.forEach(file => {
          uploadFormData.append("files", file);
        });
        try {
          await apiClient.postFormData("/inventories/inventories/upload/images", uploadFormData);
          showToast("Images uploaded successfully", "success");
        } catch (uploadErr) {
          console.error("Failed to upload images:", uploadErr);
          showToast("Product saved, but image upload failed", "warning");
        } finally {
          setIsUploadingImages(false);
        }
      }

      // ── Upsert custom field values ────────────────────────────────────────
      if (savedProductId) {
        const valueInfos = Object.entries(customFieldValues)
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([field_id, value]) => ({ field_id, value: String(value) }));

        if (valueInfos.length > 0) {
          try {
            await inventoryCustomFields.bulkUpsertValues({
              shop_id: SHOP_ID,
              product_id: savedProductId,
              values: valueInfos,
            });
          } catch (cfErr) {
            console.error("Failed to save custom field values:", cfErr);
          }
        }
      }

      // ── Clean up draft if applicable ──────────────────────────────────────
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("product_drafts") || "[]");
        localStorage.setItem("product_drafts", JSON.stringify(drafts.filter((d: any) => d.id !== draftId)));
      }

      showToast(id ? "Product updated successfully" : "Product created successfully", "success");

      // ── Navigate: after update → back to list; after create → product detail ──
      setTimeout(() => {
        if (id) {
          navigate("/product/all");
        } else {
          navigate(`/product/${savedProductId}`);
        }
      }, 800);

    } else {
      showToast("Failed to save product. Server returned an error.", "error");
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };


  const handleCreateCustomField = async () => {
    if (!newFieldName || !newFieldLabel) {
      showToast("Field Name and Label are required", "error");
      return;
    }
    try {
      await inventoryCustomFields.createField({
        shop_id: SHOP_ID,
        field_infos: [{
          field_name: newFieldName,
          label_name: newFieldLabel,
          type: newFieldType,
          required: newFieldRequired,
          visible_online: newFieldVisible,
        }]
      });
      showToast("Custom field created successfully", "success");
      // Refresh definitions
      const fields = await inventoryCustomFields.getAllFields(SHOP_ID);
      setCustomFieldDefs(fields);
      // Reset sidebar form
      setNewFieldName("");
      setNewFieldLabel("");
      setNewFieldType("text");
      setNewFieldRequired(false);
      setNewFieldVisible(false);
      setIsSidebarOpen(false);
    } catch {
      showToast("Failed to create custom field", "error");
    }
  };

  return (
    <>
      <NavigationBlocker data={{ form, variantTypes, combinations, baseSerials, supplierDetails, existingImages, selectedImageFiles }} isLoading={loading} isSubmitting={isSubmitting} />
      <style>{STYLES}</style>
      <div className="pf-root min-h-screen bg-[#f8f9fb]">


        {/* ── Two-column layout ── */}
        <div className="flex gap-5 items-start">

          {/* ══ LEFT: Main form ══ */}
          <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-4">

            {/* SECTION 1: TOP 2-COLUMN SPLIT (Identity & Images Section with Equal Height) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-4">

              {/* COL 1: Product Identity (8 cols) */}
              <div className="lg:col-span-8">
                <SectionCard
                  icon={<Package size={17} className="text-indigo-600" />}
                  iconBg="bg-indigo-50"
                  title="Product identity"
                  subtitle="The basics — what is this product?"
                >
                  <div className="space-y-4">
                    <InputField
                      label="Product name"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Chocolate Brownie Box (6 pc)"
                      tooltip="The display name shown on invoices and your catalog."
                    />

                    <div className="grid grid-cols-2 gap-4">
                      {/* Category */}
                      <div>
                        <Label text="Category" required tooltip="Organize your products into categories for easier filtering." />
                        <ReusableSelect
                          key={`cat-${categories.length}`}
                          value={form.category}
                          onValueChange={(val) => { setForm(p => ({ ...p, category: val })); setVariantTypes([]); setCombinations([]); }}
                          options={categories.map(c => ({ value: c.id, label: c.name }))}
                          placeholder="Select category"
                          onScrollEnd={fetchMoreCategories}
                          footer={
                            <button
                              onClick={() => setModalState({ type: "Category", query: "" })}
                              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              <Plus size={14} />
                              Create New Category
                            </button>
                          }
                        />
                      </div>
                      {/* Unit */}
                      <div>
                        <Label text="Unit" required tooltip="Base unit of measurement." />
                        <ReusableSelect
                          key={`unit-${units.length}`}
                          value={form.unit}
                          onValueChange={(val) => setForm(p => ({ ...p, unit: val }))}
                          options={units.map(u => ({ value: u.id, label: u.name }))}
                          placeholder="Select unit"
                          onScrollEnd={fetchMoreUnits}
                          footer={
                            <button
                              onClick={() => setModalState({ type: "Unit", query: "" })}
                              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              <Plus size={14} />
                              Create New Unit
                            </button>
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Brand */}
                      <InputField
                        label="Brand"
                        name="brand"
                        hint="optional"
                        value={form.brand}
                        onChange={handleChange}
                        placeholder="e.g. Sweet Cravings"
                        tooltip="The manufacturer or brand name."
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <Label text="Description" hint="optional" />
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={2}
                        className="pf-input w-full px-4 py-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 resize-none placeholder-slate-300"
                        placeholder="Key ingredients, materials, size, or flavor."
                      />
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* COL 2: Images Adding & Small Previews (4 cols) */}
              <div className="lg:col-span-4">
                <SectionCard
                  icon={<ImagePlus size={17} className="text-emerald-600" />}
                  iconBg="bg-emerald-50"
                  title="Product images"
                  subtitle="Add up to 3 photos"
                  extra={
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {existingImages.length + selectedImageFiles.length} / 3
                    </span>
                  }
                >
                  <div className="flex flex-col justify-between gap-4">


                    {/* Upload zone */}
                    {existingImages.length + selectedImageFiles.length < 3 ? (
                      <label className="pf-img-upload flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-200 rounded-xl py-8 cursor-pointer transition-all bg-slate-50/60 text-slate-400 hover:text-indigo-500 flex-1 min-h-[140px]">
                        {isUploadingImages ? (
                          <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                        ) : (
                          <>
                            <UploadCloud size={28} className="mb-2 text-slate-400" />
                            <p className="text-sm font-semibold text-center px-4">
                              <span className="text-indigo-500">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 text-center px-2">PNG, JPG up to 5 MB</p>
                          </>
                        )}
                        <input type="file" accept="image/jpeg, image/png, image/webp" multiple onChange={handleImageChange} className="hidden" disabled={isUploadingImages} />
                      </label>
                    ) : (
                      <div className="flex flex-col items-center justify-center border border-slate-200 bg-slate-50/30 rounded-xl py-8 flex-1 min-h-[140px] text-slate-400 text-sm font-semibold">
                        Image limit reached (3/3)
                      </div>
                    )}

                    {/* Small previews row */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      {existingImages.map((url, i) => (
                        <div key={`ext-${i}`} className="relative w-14 h-14 rounded-lg border border-slate-200 overflow-hidden group shadow-sm shrink-0">
                          <img src={url} alt="Product" className="w-full h-full object-cover" />
                          {i === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 text-center bg-black/40 text-white text-[8px] font-bold py-0.2">COVER</span>
                          )}
                          <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-0.5 right-0.5 bg-white/90 p-0.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {selectedImageFiles.map((file, i) => {
                        const previewUrl = URL.createObjectURL(file);
                        const coverIdx = existingImages.length + i;
                        return (
                          <div key={`sel-${i}`} className="relative w-14 h-14 rounded-lg border border-slate-200 overflow-hidden group shadow-sm shrink-0">
                            <img src={previewUrl} alt="Product Draft" className="w-full h-full object-cover" />
                            {coverIdx === 0 && (
                              <span className="absolute bottom-0 left-0 right-0 text-center bg-black/40 text-white text-[8px] font-bold py-0.2">COVER</span>
                            )}
                            <button type="button" onClick={() => removeSelectedImage(i)} className="absolute top-0.5 right-0.5 bg-white/90 p-0.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                              <X size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Helper notes moved from sidebar */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-start gap-2.5 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <Info size={12} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 leading-normal">
                          <span className="font-semibold text-slate-600">SKU</span> will be auto-generated after the product is created.
                        </p>
                      </div>

                      <div className={`rounded-xl border p-3 ${form.track_stock ? "bg-amber-50/50 border-amber-100" : "bg-amber-50/50 border-amber-100"}`}>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-white text-[9px] font-bold">?</span>
                          </div>
                          <div>
                            {form.track_stock ? (
                              <>
                                <p className="text-[10px] font-bold text-amber-800 mb-0.5">Why no price field?</p>
                                <p className="text-[9px] text-amber-700 leading-normal">Price comes from purchase entries so your costs stay accurate automatically. Toggle off stock tracking for made-to-order items to set prices here.</p>
                              </>
                            ) : (
                              <>
                                <p className="text-[10px] font-bold text-amber-800 mb-0.5">Pricing made-to-order items.</p>
                                <p className="text-[9px] text-amber-700 leading-normal">Selling price is what you bill. Cost to make is your estimated recipe cost. Profit is calculated from both.</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </SectionCard>
              </div>

            </div>


            {/* SECTION 2 (Moved): PRODUCT VARIANTS */}
            <div className="pf-card bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <Layers size={17} className="text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Product variants</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Manage configurations like size, color, storage</p>
                  </div>
                </div>
                <Switch
                  checked={form.has_variants}
                  onCheckedChange={(checked) => { setForm(p => ({ ...p, has_variants: checked })); if (!checked) setCombinations([]); }}
                />
              </div>

              {form.has_variants ? (
                <div className="p-6 space-y-5 pf-section-enter">
                  <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/40">
                    <p className="text-[11px] font-semibold text-slate-400 mb-4 uppercase tracking-wide">Define Variant Types</p>
                    <VariantBuilder
                      variantTypes={variantTypes}
                      onChange={setVariantTypes}
                      suggestedTypes={categoryConfig.suggestedVariantTypes}
                    />
                  </div>
                  {combinations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Cpu size={13} className="text-slate-400" />
                        <p className="text-[11px] font-semibold text-slate-400">Variant Matrix ({combinations.length} combinations)</p>
                      </div>
                      <VariantMatrixTable
                        combinations={combinations}
                        variantTypes={variantTypes}
                        onChange={setCombinations}
                      />
                    </div>
                  )}

                </div>
              ) : (
                <div className="px-6 py-5 text-slate-400 text-sm flex items-center gap-3">
                  <Zap size={16} className="text-violet-300" />
                  Enable variants to manage multiple SKUs per product (e.g. iPhone 15 128GB / Black)
                </div>
              )}
            </div>

            {/* SECTION 3: INVENTORY & STOCK */}
            <SectionCard
              icon={<BarChart3 size={17} className="text-blue-600" />}
              iconBg="bg-blue-50"
              title="Inventory & stock"
              subtitle="How this product is tracked"
            >
              <div className="space-y-5">
                {/* Track stock toggle card */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Settings2 size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Track stock for this product</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Keep this ON for stocked goods — their price comes from your purchases. Turn OFF for made-to-order items like juices, chai, or chaat.
                    </p>
                  </div>
                  <Switch
                    checked={form.track_stock}
                    onCheckedChange={(val) => setForm(p => ({ ...p, track_stock: val }))}
                  />
                </div>

                {/* Conditional panel */}
                {form.track_stock ? (
                  /* STOCKED MODE */
                  <div className="pf-section-enter space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <InputField
                        label="MRP"
                        name="mrp"
                        hint="optional"
                        type="number"
                        value={form.mrp}
                        onChange={handleChange}
                        placeholder="0.00"
                        leftEl={<IndianRupee size={13} />}
                        tooltip="Maximum retail price printed on the product packaging."
                      />
                      <InputField
                        label="Reorder point"
                        name="reorder_point"
                        required
                        type="number"
                        disabled={form.has_variants}
                        value={form.reorder_point}
                        onChange={handleChange}
                        placeholder="5"
                        rightEl={units.find(u => u.id === form.unit || u.name === form.unit)?.name || "pcs"}
                        tooltip="Alert triggered when stock falls to this level."
                      />
                      <InputField
                        label="Storage Location"
                        name="location"
                        disabled={form.has_variants}
                        value={form.location}
                        onChange={handleChange}
                        placeholder="e.g. Aisle 4, Shelf B"
                        tooltip="Physical location where this product is stored."
                      />
                    </div>
                    <p className="text-[11px] text-indigo-500 flex items-center gap-1.5">
                      <Info size={11} />
                      Cost &amp; selling price for this product will be set when you record a purchase. No price needed here.
                    </p>
                  </div>
                ) : (
                  /* MADE-TO-ORDER MODE */
                  <div className="pf-section-enter space-y-4">
                    <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-blue-50 border border-blue-100">
                      <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                        <strong>Made-to-order item.</strong> Since this isn't purchased as stock, set its prices here so it can be billed. We'll use these to calculate your profit.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <InputField
                        label="Sell price"
                        name="selling_price"
                        required
                        type="number"
                        value={form.selling_price}
                        onChange={handleChange}
                        placeholder="0.00"
                        leftEl={<IndianRupee size={13} />}
                        tooltip="The price you charge the customer."
                      />
                      <InputField
                        label="Cost price"
                        name="cost_to_make"
                        required
                        type="number"
                        value={form.cost_to_make}
                        onChange={handleChange}
                        placeholder="0.00"
                        leftEl={<IndianRupee size={13} />}
                        tooltip="Your estimated recipe / production cost."
                      />
                      <InputField
                        label="MRP"
                        name="mrp"
                        hint="optional"
                        type="number"
                        value={form.mrp}
                        onChange={handleChange}
                        placeholder="0.00"
                        leftEl={<IndianRupee size={13} />}
                        tooltip="Maximum retail price shown for reference."
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Check size={11} className="text-emerald-400" />
                      This item stays available to bill until you mark it unavailable — no quantity is tracked.
                    </p>
                  </div>
                )}

                {/* Batch & Serial tracking & Visibility */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[12px] font-bold text-slate-700">Batch tracking</h3>
                        {!id && <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[9px] font-bold">Purchase</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">Track manufacturing &amp; expiry dates per batch.</p>
                    </div>
                    <Switch checked={form.batch_tracking} onCheckedChange={(val) => setForm(p => ({ ...p, batch_tracking: val }))} />
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[12px] font-bold text-slate-700">Serial tracking</h3>
                        {!id && <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[9px] font-bold">Unique</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">Track unique ID for each individual unit.</p>
                    </div>
                    <Switch checked={form.serial_tracking} onCheckedChange={(val) => setForm(p => ({ ...p, serial_tracking: val }))} />
                  </div>
                </div>


              </div>
            </SectionCard>

            {/* SECTION 4: TAX & IDENTIFIERS */}
            <SectionCard
              icon={<FileText size={17} className="text-amber-600" />}
              iconBg="bg-amber-50"
              title="Tax & identifiers"
              subtitle="GST and product codes for compliant invoices"
            >
              <div className="grid grid-cols-3 gap-4">
                {/* GST Rate */}
                <div>
                  <Label text="GST rate" required tooltip="Applicable GST tax rate." />
                  <ReusableSelect
                    value={form.gst}
                    onValueChange={(val) => setForm(p => ({ ...p, gst: val }))}
                    options={GST_RATES.map(r => ({ value: r, label: `${r}%` }))}
                    placeholder="18%"
                  />
                </div>
                {/* HSN code */}
                <InputField
                  label="HSN / SAC code"
                  name="hsn"
                  hint="optional"
                  value={form.hsn}
                  onChange={handleChange}
                  placeholder="e.g. 1905"
                  tooltip="Harmonized System of Nomenclature code for GST."
                />
                {/* Barcode — full width of remaining col, popup opens upward */}
                <div className="relative">
                  <Label text="UI_ID / Barcode" hint="optional" tooltip="Unique UI_ID or Barcode / EAN for this product." />
                  <div className="relative">
                    <input
                      name="barcode"
                      value={form.barcode}
                      onChange={handleChange}
                      placeholder="Scan or type"
                      className="pf-input w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBarcodeGen(!showBarcodeGen)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="Generate barcode"
                    >
                      <Barcode size={16} />
                    </button>
                  </div>
                  {showBarcodeGen && (
                    <div className="absolute bottom-full right-0 mb-2 w-60 p-3 bg-white border border-slate-200 shadow-2xl rounded-xl z-[100]">
                      <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5"><Barcode size={12} className="text-indigo-500" />Generate Barcode</h4>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Prefix (Optional)"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          value={barcodePrefix}
                          onChange={e => setBarcodePrefix(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setShowBarcodeGen(false); setBarcodePrefix(""); }} className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                          <button type="button" onClick={handleGenerateBarcode} disabled={generatingBarcode} className="flex-1 py-1.5 text-[10px] font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">{generatingBarcode ? "…" : "Generate"}</button>
                        </div>
                      </div>
                      {/* Arrow pointing down */}
                      <div className="absolute bottom-[-6px] right-4 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* SECTION 5: CUSTOM FIELDS */}
            <SectionCard
              icon={<Layers size={17} className="text-indigo-600" />}
              iconBg="bg-indigo-50"
              title="Custom fields"
              subtitle="Define and populate additional product properties"
              extra={
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="h-8 px-3 rounded-lg border border-indigo-100 text-indigo-600 font-bold text-xs bg-indigo-50/50 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  Create Custom Field
                </button>
              }
            >
              {customFieldDefs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  No custom fields defined yet. Click "Create Custom Field" to add one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customFieldDefs.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label
                        text={field.label_name}
                        required={field.required}
                      />
                      {field.type === 'boolean' ? (
                        <div className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-slate-50/30">
                          <input
                            type="checkbox"
                            id={`cf_${field.id}`}
                            checked={customFieldValues[field.id] === 'true'}
                            onChange={(e) =>
                              setCustomFieldValues((prev) => ({ ...prev, [field.id]: String(e.target.checked) }))
                            }
                            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                          />
                          <label htmlFor={`cf_${field.id}`} className="text-xs font-semibold text-slate-600 cursor-pointer">
                            {field.label_name}
                          </label>
                        </div>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          value={customFieldValues[field.id] || ''}
                          onChange={(e) =>
                            setCustomFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                          }
                          required={field.required}
                          placeholder={`Enter ${field.label_name.toLowerCase()}…`}
                          className="w-full h-10 px-4 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none bg-slate-50/30 font-semibold rounded-lg"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

          </form>
        </div>
      </div>


      {/* Quick Supplier Modal */}
      <QuickCreateSupplierModal
        isOpen={modalState.type === "Supplier"}
        onClose={() => setModalState({ type: null, query: "" })}
        initialName={modalState.query}
        onSuccess={(sup) => { setForm(prev => ({ ...prev, supplier: sup.id })); setSupplierDetails(sup); }}
      />

      <QuickCreateDropdownModal
        isOpen={modalState.type === "Category"}
        onClose={() => setModalState({ type: null, query: "" })}
        type="categories"
        onSuccess={(val) => {
          setCategories(prev => [...prev, val]);
          setForm(p => ({ ...p, category: val.id }));
        }}
      />

      <QuickCreateDropdownModal
        isOpen={modalState.type === "Unit"}
        onClose={() => setModalState({ type: null, query: "" })}
        type="units"
        onSuccess={(val) => {
          setUnits(prev => [...prev, val]);
          setForm(p => ({ ...p, unit: val.id }));
        }}
      />

      {/* Sidebar Filter for Custom Field Creation */}
      <RightSidebarFilter
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onApply={handleCreateCustomField}
        applyLabel="Create"
        onClear={() => {
          setNewFieldName("");
          setNewFieldLabel("");
          setNewFieldType("text");
          setNewFieldRequired(false);
          setNewFieldVisible(false);
        }}
        title="Create Custom Field"
      >
        <div className="space-y-5">
          <InputField
            label="Label Name (Display Name)"
            required
            value={newFieldLabel}
            onChange={(e) => {
              const val = e.target.value;
              setNewFieldLabel(val);
              setNewFieldName(val.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "_"));
            }}
            placeholder="e.g. Rack Number"
          />
          <InputField
            label="Field Name (Internal Name)"
            required
            disabled
            value={newFieldName}
            placeholder="Auto-generated from Label Name"
          />
          <ReusableSelect
            label="Field Type"
            value={newFieldType}
            onValueChange={(val) => setNewFieldType(val)}
            options={[
              { label: "Text", value: "text" },
              { label: "Number", value: "number" },
              { label: "Date", value: "date" },
              { label: "Yes / No (Boolean)", value: "boolean" },
            ]}
            placeholder="Select Type"
          />
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-500">Required Field</span>
            <Switch
              checked={newFieldRequired}
              onCheckedChange={(checked: boolean) => setNewFieldRequired(checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-500">Visible Online</span>
            <Switch
              checked={newFieldVisible}
              onCheckedChange={(checked: boolean) => setNewFieldVisible(checked)}
            />
          </div>
        </div>
      </RightSidebarFilter>
    </>
  );
};

export default ProductForm;
