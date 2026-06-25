import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Package, Save, Cpu, AlertCircle, Layers, Zap, Bookmark,
  Plus, Info, ImagePlus, X, UploadCloud,
  BarChart3, Check, Settings2, FileText,
  Image as ImageIcon, IndianRupee, Barcode,
} from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { Switch } from "@/components/ui/switch";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { supplierApi } from "@/services/api/supplier";
import { QuickCreateSupplierModal } from "@/features/common/QuickCreate/QuickCreateSupplierModal";
import { ImageCarousel } from "@/components/common/SuperUI";
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

const CATEGORIES = Object.keys(CATEGORY_CONFIGS);
const UNITS = ["Piece (pcs)", "Box", "Kilogram (kg)", "Gram (g)", "Litre (L)", "Metre (m)", "Set", "Pair", "Plate", "Cup", "Bottle"];
const GST_RATES = ["0", "5", "12", "18", "28"];
const LOW_STOCK_ALERT_OPTIONS = ["Notify me", "Don't notify", "Block sale"];

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
  <div>
    {label && <Label text={label} required={required} hint={hint} tooltip={tooltip} />}
    <div className="relative">
      {leftEl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">{leftEl}</span>}
      <input
        {...rest}
        className={`pf-input w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300 ${leftEl ? "pl-8" : ""} ${rightEl ? "pr-14" : ""} ${error ? "border-red-300 bg-red-50/30" : ""} ${className}`}
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
  onSuccess: (value: string) => void;
}

const QuickCreateDropdownModal: React.FC<QuickCreateDropdownModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
  const { postData, putData, getData } = useApi();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!value.trim()) return;
    setLoading(true);
    
    // Fetch existing first
    const res = await getData(`/utilities/dropdowns/custom/by/name/${SHOP_ID}/${type}`);
    let existingValues: string[] = [];
    let dropdownId = null;

    if (res?.detail?.success && res.data) {
      dropdownId = res.data.id;
      existingValues = res.data.values || [];
    }

    const newValues = [...existingValues, value.trim()];

    if (dropdownId) {
      await putData("/utilities/dropdowns/custom", {
        id: dropdownId,
        shop_id: SHOP_ID,
        dd_name: type,
        values: newValues
      });
    } else {
      await postData("/utilities/dropdowns/custom", {
        shop_id: SHOP_ID,
        dd_name: type,
        values: newValues
      });
    }

    setLoading(false);
    onSuccess(value.trim());
    setValue("");
    onClose();
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
  const { postData, putData, getData, loading } = useApi();
  const { showToast } = useToast();
  const isLoading = externalLoading || loading;

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
  });

  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);
  const [baseSerials, setBaseSerials] = useState<string[]>([]);
  const [supplierDetails, setSupplierDetails] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [baseName, setBaseName] = useState("");
  const [showBarcodeGen, setShowBarcodeGen] = useState(false);
  const [barcodePrefix, setBarcodePrefix] = useState("");
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customUnits, setCustomUnits] = useState<string[]>([]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [catRes, unitRes] = await Promise.all([
          getData(`/utilities/dropdowns/custom/by/name/${SHOP_ID}/categories`),
          getData(`/utilities/dropdowns/custom/by/name/${SHOP_ID}/units`)
        ]);
        if (catRes?.detail?.success && catRes.data?.values) {
          const parsedCategories = typeof catRes.data.values === 'string' 
            ? JSON.parse(catRes.data.values) 
            : catRes.data.values;
          setCustomCategories(Array.isArray(parsedCategories) ? parsedCategories : []);
        }
        if (unitRes?.detail?.success && unitRes.data?.values) {
          const parsedUnits = typeof unitRes.data.values === 'string' 
            ? JSON.parse(unitRes.data.values) 
            : unitRes.data.values;
          setCustomUnits(Array.isArray(parsedUnits) ? parsedUnits : []);
        }
      } catch (e) {
        console.error("Failed to fetch custom dropdowns", e);
      }
    };
    fetchDropdowns();
  }, [getData]);

  const availableCategories = Array.from(new Set([...CATEGORIES, ...customCategories]));
  const availableUnits = Array.from(new Set([...UNITS, ...customUnits]));

  /* ─── Barcode generator ─── */
  const handleGenerateBarcode = async () => {
    setGeneratingBarcode(true);
    try {
      const res = await postData(ENDPOINTS.GENERATE_BARCODE, { prefix: barcodePrefix || undefined });
      if (res?.data?.barcode) {
        setForm(p => ({ ...p, barcode: res.data.barcode }));
        setShowBarcodeGen(false);
        showToast("Barcode generated", "success");
      } else showToast("Failed to generate barcode", "error");
    } catch { showToast("Failed to generate barcode", "error"); }
    finally { setGeneratingBarcode(false); }
  };

  /* ─── Bottom actions (global header bar) ─── */
  const { setBottomActions } = useHeader();

  // Validation computed values
  const missingFields: string[] = [];
  if (!form.name.trim()) missingFields.push("name");
  if (!form.category) missingFields.push("category");
  if (existingImages.length === 0) missingFields.push("image");
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
  }, [setBottomActions, isLoading, id, form, variantTypes, combinations, baseSerials, supplierDetails, isSavingDraft, existingImages]);

  /* ─── Load existing product ─── */
  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        const res = await getData(`${ENDPOINTS.INVENTORIES}/by/${SHOP_ID}/${id}`);
        if (res?.data) {
          const prod = Array.isArray(res.data) ? res.data[0] : res.data;
          if (!prod) return;
          const datas = prod.datas || {};
          setForm({
            name: prod.name || "",
            stocks: prod.stocks || 0,
            serial_number: (prod.serial_number && prod.serial_number[0]) || "",
            barcode: prod.barcode || "",
            brand: datas.brand || "",
            category: prod.category || "",
            unit: datas.unit || "Piece (pcs)",
            description: prod.description || datas.description || "",
            is_active: prod.is_active ?? datas.is_active ?? true,
            mrp: String(datas.mrp || ""),
            selling_price: String(prod.sell_price || ""),
            cost_to_make: String(prod.buy_price || ""),
            gst: String(datas.gst || "18").replace("%", ""),
            hsn: String(datas.hsn || ""),
            sku: datas.sku || prod.barcode || "",
            supplier: datas.supplier || "",
            opening_stock: String(datas.opening_stock || "0"),
            reorder_point: String(prod.reorder_point || "5"),
            max_stock: String(datas.max_stock || ""),
            location: datas.location || "",
            has_variants: !!prod.has_variant,
            batch_tracking: !!prod.has_batch,
            serial_tracking: !!prod.has_serialno,
            batch_name: prod.batch?.name || "",
            mfg_date: prod.batch?.manufacturing_date || "",
            exp_date: prod.batch?.expiry_date || "",
            track_stock: datas.track_stock !== false,
            low_stock_alert: datas.low_stock_alert || "Notify me",
          });
          if (datas.images && Array.isArray(datas.images)) setExistingImages(datas.images);
          const loadedBrand = datas.brand || "";
          const loadedName = prod.name || "";
          const baseFromLoad = loadedBrand && loadedName.startsWith(loadedBrand + " ")
            ? loadedName.slice(loadedBrand.length + 1) : loadedName;
          setBaseName(baseFromLoad);
          if (datas.supplier) {
            supplierApi.searchSuppliers(datas.supplier).then((sups: any[]) => {
              const matched = sups.find((s: any) => s.id === datas.supplier);
              if (matched) setSupplierDetails(matched);
            });
          }
          if (datas.variantTypes) setVariantTypes(datas.variantTypes);
          else if (prod.variants?.length > 0) {
            const firstVarDatas = prod.variants[0].datas || {};
            const attributes = firstVarDatas.attributes;
            if (attributes) {
              const types = Object.keys(attributes).map(key => ({
                id: uid(),
                name: key,
                values: Array.from(new Set(prod.variants.map((v: any) => v.datas?.attributes?.[key]))).filter(Boolean) as string[],
              }));
              setVariantTypes(types);
            }
          }
          if (prod.variants) {
            setCombinations(prod.variants.map((v: any) => ({
              id: v.id,
              attributes: v.datas?.attributes || {},
              barcode: v.datas?.barcode || "",
              sku: v.datas?.sku || v.datas?.barcode || "",
              price: String(v.sell_price || ""),
              buy_price: String(v.buy_price || ""),
              mrp: String(v.datas?.mrp || ""),
              reorder_point: String(v.reorder_point || v.datas?.reorder_point || "5"),
              stock: String(v.stocks || ""),
              active: true,
              serials: (v.datas?.serial_numbers || []).map((sn: string) => ({
                id: uid(), serial: sn, status: "available" as const, purchaseDate: "", warrantyMonths: "12",
              })),
            })));
          }
          if (!prod.has_variant && prod.serial_number) setBaseSerials(prod.serial_number);
        }
      };
      fetchProduct();
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
  }, [id, getData, searchParams]);

  const categoryConfig = CATEGORY_CONFIGS[form.category] ?? {
    suggestedVariantTypes: [], supportsSerials: false, serialLabel: "Serial Number",
  };

  /* Regenerate variant combinations when types change */
  useEffect(() => {
    if (!form.has_variants) return;
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
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const allowedCount = 3 - existingImages.length;
    if (files.length > allowedCount) { showToast(`You can only add ${allowedCount} more image(s).`, "error"); return; }
    setIsUploadingImages(true);
    const formData = new FormData();
    files.slice(0, allowedCount).forEach(file => formData.append("files", file));
    try {
      const uploadRes = await fetch(`${import.meta.env.VITE_GATEWAY_URL}${ENDPOINTS.UPLOAD_IMAGES}`, { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Failed to upload images");
      const resData = await uploadRes.json();
      if (resData.detail?.success || resData.success) {
        setExistingImages(prev => [...prev, ...resData.data]);
        showToast("Images uploaded successfully", "success");
      } else throw new Error(resData.detail?.msg || "Upload failed");
    } catch (err: any) { showToast(err.message || "Failed to upload images", "error"); }
    finally { setIsUploadingImages(false); }
  };

  const removeExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));

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
    const activeCombinations = combinations.filter(c => c.active);
    if (form.has_variants && activeCombinations.length === 0) {
      showToast("Please have at least one active variant combination", "error"); return;
    }
    const finalImages = [...existingImages];
    const mappedVarients = activeCombinations.map(combo => {
      const variantName = Object.values(combo.attributes).join(" / ");
      const v: any = {
        name: variantName, buy_price: 0, sell_price: 0, stocks: 0,
        reorder_point: Number(combo.reorder_point) || 0,
        serial_numbers: combo.serials.map(s => s.serial),
        datas: { mrp: 0, attributes: combo.attributes },
        batch: null,
      };
      if (combo.barcode?.trim()) v.datas.barcode = combo.barcode;
      if (combo.sku?.trim()) v.datas.sku = combo.sku;
      return v;
    });

    const payload: any = {
      shop_id: SHOP_ID,
      name: form.name,
      category: form.category,
      description: form.description,
      buy_price: form.track_stock ? 0 : Number(form.cost_to_make) || 0,
      sell_price: form.track_stock ? 0 : Number(form.selling_price) || 0,
      stocks: 0,
      has_variant: form.has_variants,
      has_serialno: form.serial_tracking,
      has_batch: form.batch_tracking,
      variants: form.has_variants ? mappedVarients : [],
      serial_numbers: !form.has_variants ? baseSerials : [],
      batch: null,
      reorder_point: Number(form.reorder_point) || 0,
      datas: {
        brand: form.brand,
        unit: form.unit,
        mrp: Number(form.mrp) || 0,
        gst: form.gst ? (form.gst.includes("%") ? form.gst : `${form.gst}%`) : "18%",
        hsn: form.hsn,
        sku: form.sku,
        supplier: form.supplier,
        opening_stock: 0,
        storage_location: form.location,
        is_active: form.is_active,
        variant_types: variantTypes,
        images: finalImages,
        track_stock: form.track_stock,
        low_stock_alert: form.low_stock_alert,
        selling_price: form.selling_price,
        cost_to_make: form.cost_to_make,
      },
    };
    if (form.barcode?.trim()) payload.barcode = form.barcode;
    if (id) payload.id = id;

    let res;
    if (id) res = await putData(`${ENDPOINTS.INVENTORIES}`, payload);
    else res = await postData(ENDPOINTS.INVENTORIES, payload);

    if (res) {
      showToast(id ? "Product updated successfully" : "Product created successfully", "success");
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("product_drafts") || "[]");
        localStorage.setItem("product_drafts", JSON.stringify(drafts.filter((d: any) => d.id !== draftId)));
      }
      setTimeout(() => navigate("/product/all"), 1000);
    } else {
      showToast("Failed to save product", "error");
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="pf-root min-h-screen bg-[#f8f9fb]">


        {/* ── Two-column layout ── */}
        <div className="flex gap-5 items-start">

          {/* ══ LEFT: Main form ══ */}
          <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-4">

            {/* SECTION 1: PRODUCT IDENTITY */}
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

                <div className="grid grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <Label text="Category" required tooltip="Organize your products into categories for easier filtering." />
                    <ReusableSelect
                      value={form.category}
                      onValueChange={(val) => { setForm(p => ({ ...p, category: val })); setVariantTypes([]); setCombinations([]); }}
                      options={availableCategories.map(c => ({ value: c, label: c }))}
                      placeholder="Select category"
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
                  {/* Unit */}
                  <div>
                    <Label text="Unit" required tooltip="Base unit of measurement." />
                    <ReusableSelect
                      value={form.unit}
                      onValueChange={(val) => setForm(p => ({ ...p, unit: val }))}
                      options={availableUnits.map(u => ({ value: u, label: u }))}
                      placeholder="Select unit"
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

                {/* Description */}
                <div>
                  <Label text="Description" hint="optional" />
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="pf-input w-full px-4 py-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 resize-none placeholder-slate-300"
                    placeholder="Key ingredients, materials, size, or flavor."
                  />
                </div>
              </div>
            </SectionCard>

            {/* SECTION 2: PRODUCT IMAGES */}
            <SectionCard
              icon={<ImagePlus size={17} className="text-emerald-600" />}
              iconBg="bg-emerald-50"
              title="Product images"
              subtitle="Add up to 3 photos"
              extra={
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {existingImages.length} / 3
                </span>
              }
            >
              <div>
                {/* Image grid */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {existingImages.map((url, i) => (
                    <div key={`ext-${i}`} className="relative w-20 h-20 rounded-lg border border-slate-200 overflow-hidden group shadow-sm">
                      <img src={url} alt="Product" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 text-center bg-black/40 text-white text-[9px] font-bold py-0.5">COVER</span>
                      )}
                      <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 bg-white/90 p-0.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload zone */}
                {existingImages.length < 3 && (
                  <label className="pf-img-upload flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-200 rounded-xl py-8 cursor-pointer transition-all bg-slate-50/60 text-slate-400 hover:text-indigo-500">
                    {isUploadingImages ? (
                      <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                    ) : (
                      <>
                        <UploadCloud size={26} className="mb-2" />
                        <p className="text-sm font-medium"><span className="text-indigo-500 font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-[11px] text-slate-400 mt-1">PNG, JPG up to 5 MB each · First image becomes the cover</p>
                      </>
                    )}
                    <input type="file" accept="image/jpeg, image/png, image/webp" multiple onChange={handleImageChange} className="hidden" disabled={isUploadingImages} />
                  </label>
                )}
              </div>
            </SectionCard>

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
                        value={form.reorder_point}
                        onChange={handleChange}
                        placeholder="5"
                        rightEl="pcs"
                        tooltip="Alert triggered when stock falls to this level."
                      />
                      <div>
                        <Label text="Low-stock alert" tooltip="What happens when stock falls below reorder point." />
                        <ReusableSelect
                          value={form.low_stock_alert}
                          onValueChange={(val) => setForm(p => ({ ...p, low_stock_alert: val }))}
                          options={LOW_STOCK_ALERT_OPTIONS.map(o => ({ value: o, label: o }))}
                          placeholder="Notify me"
                        />
                      </div>
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

                {/* Batch & Serial tracking */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
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

            {/* SECTION 5: PRODUCT VARIANTS */}
            <div className="pf-card bg-white rounded-xl border border-slate-200 overflow-hidden">
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
                        supportsSerials={form.serial_tracking}
                        supportsBatch={form.batch_tracking}
                        serialLabel={categoryConfig.serialLabel}
                        onChange={setCombinations}
                      />
                    </div>
                  )}
                  {variantTypes.length === 0 && (
                    <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      <Plus size={24} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Add your first variant type above to begin</p>
                    </div>
                  )}
                  {variantTypes.length > 0 && combinations.length === 0 && (
                    <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      <Layers size={24} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Add values to your variant types to generate combinations</p>
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

          </form>

          {/* ══ RIGHT: Preview Sidebar ══ */}
          <div className="w-[260px] shrink-0 sticky top-4 space-y-3">

            {/* Preview card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden pf-card">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preview</span>
                {!form.track_stock && (
                  <span className="text-[9px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">MADE TO ORDER</span>
                )}
              </div>

              {/* Cover image */}
              <div className="mx-4 mt-4 rounded-xl bg-slate-100 overflow-hidden aspect-[4/3] flex items-center justify-center">
                {existingImages.length > 0 ? (
                  <ImageCarousel images={existingImages} alt="cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <ImageIcon size={28} />
                    <span className="text-[10px] mt-1.5 font-medium">No image yet</span>
                  </div>
                )}
              </div>

              {/* Product preview details */}
              <div className="px-4 py-3 space-y-1.5">
                <p className="text-sm font-semibold text-slate-700 leading-snug line-clamp-2">
                  {form.name || <span className="text-slate-300 font-normal">Product name</span>}
                </p>
                {form.category ? (
                  <span className="inline-block text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{form.category}</span>
                ) : (
                  <span className="inline-block text-[10px] bg-slate-100 text-slate-300 px-2 py-0.5 rounded-full font-medium">Category</span>
                )}

                {!form.track_stock && (form.selling_price || form.cost_to_make) && (
                  <div className="pt-1.5 space-y-0.5">
                    {form.selling_price && (
                      <p className="text-xs text-slate-600"><span className="text-slate-400">Sell price</span> ₹{form.selling_price}</p>
                    )}
                    {form.cost_to_make && (
                      <p className="text-xs text-slate-600"><span className="text-slate-400">Cost price</span> ₹{form.cost_to_make}</p>
                    )}
                  </div>
                )}

                {form.track_stock && (
                  <p className="text-[10px] text-slate-400 italic flex items-center gap-1 pt-1">
                    <Info size={10} />
                    Price will be set when you record this product's first purchase.
                  </p>
                )}
              </div>
            </div>

            {/* SKU info note */}
            <div className="flex items-start gap-2.5 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
              <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-600">SKU</span> will be auto-generated after the product is created.
              </p>
            </div>

            {/* Contextual info box */}
            <div className={`rounded-xl border p-4 ${form.track_stock ? "bg-amber-50 border-amber-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-[10px] font-bold">?</span>
                </div>
                <div>
                  {form.track_stock ? (
                    <>
                      <p className="text-[11px] font-bold text-amber-800 mb-1">Why no price field?</p>
                      <p className="text-[10px] text-amber-700 leading-relaxed">For stocked products, the price comes from your purchase entries — so your costs stay accurate automatically. Toggle off stock tracking for made-to-order items to set prices here.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] font-bold text-amber-800 mb-1">Pricing made-to-order items.</p>
                      <p className="text-[10px] text-amber-700 leading-relaxed">Selling price is what you bill the customer. Cost to make is your estimated recipe cost. Profit is calculated from the two.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
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
          setCustomCategories(prev => [...prev, val]);
          setForm(p => ({ ...p, category: val }));
        }}
      />

      <QuickCreateDropdownModal
        isOpen={modalState.type === "Unit"}
        onClose={() => setModalState({ type: null, query: "" })}
        type="units"
        onSuccess={(val) => {
          setCustomUnits(prev => [...prev, val]);
          setForm(p => ({ ...p, unit: val }));
        }}
      />
    </>
  );
};

export default ProductForm;
