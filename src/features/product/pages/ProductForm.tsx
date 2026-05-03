import React, { useState, useMemo, useEffect } from "react";
import {
  Package, DollarSign, BarChart2, Save, ChevronDown, Hash,
  Cpu, AlertCircle, RefreshCw, ScanLine,
  Layers, Zap, Bookmark, X, Plus, Trash2, CheckCircle2, ChevronLeft, ChevronRight
} from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { Switch } from "@/components/ui/switch";
import { InlineSerialManager } from "@/components/common/InlineSerialManager";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { supplierApi } from "@/services/api/supplier";
import { QuickCreateSupplierModal } from "@/features/common/QuickCreate/QuickCreateSupplierModal";
import { 
  VariantType, 
  VariantCombination, 
  VariantBuilder, 
  VariantMatrixTable, 
  generateCombinations 
} from "../components/VariantManager";

/*   • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   TYPES
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */


/*   • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   MODALS: ON-THE-FLY CREATION
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */

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
  buy_price: string;
  sell_price: string;
  mrp: string;
  gst: string;
  hsn: string;
  supplier: string;
  opening_stock: string;
  reorder_point: string;
  max_stock: string;
  location: string;
  has_variants: boolean;
  batch_tracking: boolean;
  serial_tracking: boolean;
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
};

const CATEGORIES = Object.keys(CATEGORY_CONFIGS);
const UNITS = ["Piece (pcs)", "Box", "Kilogram (kg)", "Gram (g)", "Litre (L)", "Metre (m)", "Set", "Pair"];
const GST_RATES = ["0%", "5%", "12%", "18%", "28%"];

const uid = () => `id_${Math.random().toString(36).slice(2, 11)}`;


/*   • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   STYLES & SMALL REUSABLE UI
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

  .pf-root { font-family: 'Instrument Sans', sans-serif; }
  .pf-mono { font-family: 'JetBrains Mono', monospace; }
  .pf-serif { font-family: 'Instrument Serif', serif; }

  /* Card hover */
  .pf-card { transition: box-shadow 0.2s ease; }
  .pf-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); }

  /* Input focus */
  .pf-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .pf-input { transition: border-color 0.15s, box-shadow 0.15s; }

  /* Tag chip */
  .pf-tag { animation: tagPop 0.15s cubic-bezier(0.34,1.4,0.64,1) forwards; }
  @keyframes tagPop { from { opacity:0; transform: scale(0.8); } to { opacity:1; transform: scale(1); } }

  /* Matrix row */
  .pf-matrix-row { transition: background 0.1s; }
  .pf-matrix-row:hover { background: #f8fafc; }

  /* Combination appear */
  .pf-combo-appear { animation: comboSlide 0.18s ease forwards; }
  @keyframes comboSlide { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }

  /* Serial modal */
  .pf-serial-backdrop { animation: bfIn 0.15s ease forwards; }
  @keyframes bfIn { from { opacity:0; } to { opacity:1; } }
  .pf-serial-modal { animation: smIn 0.2s cubic-bezier(0.34,1.1,0.64,1) forwards; }
  @keyframes smIn { from { opacity:0; transform: scale(0.95) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }

  /* Toggle */
  .pf-toggle { transition: background 0.2s; }
  .pf-toggle-knob { transition: transform 0.2s cubic-bezier(0.34,1.3,0.64,1); }

  /* Variant section */
  .pf-section-enter { animation: secIn 0.25s ease forwards; }
  @keyframes secIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }

  /* Select */
  select.pf-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  /* Sticky table */
  .pf-sticky-th { position: sticky; top: 0; z-index: 5; }

  /* Scrollbar */
  .pf-scroll::-webkit-scrollbar { height: 4px; width: 4px; }
  .pf-scroll::-webkit-scrollbar-track { background: transparent; }
  .pf-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

  /* Btn */
  .pf-btn-primary { transition: all 0.15s; }
  .pf-btn-primary:hover:not(:disabled) { filter: brightness(1.06); box-shadow: 0 4px 14px rgba(37,99,235,0.22); }
  .pf-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .pf-btn-ghost { transition: all 0.15s; }
  .pf-btn-ghost:hover { background: #f1f5f9; }

  /* Suggest pill */
  .pf-suggest { transition: all 0.12s; }
  .pf-suggest:hover { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }

  /* Status badge */
  .pf-status-active { background: #d1fae5; color: #065f46; }
  .pf-status-draft  { background: #f1f5f9; color: #475569; }

  /* Pulse for auto-generated indicator */
  .pf-pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity: 0.5; } }
`;

interface LabelProps { text: string; required?: boolean; hint?: string; }
const Label: React.FC<LabelProps> = ({ text, required, hint }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
    {text}{required && <span className="text-red-400 ml-0.5">*</span>}
    {hint && <span className="ml-1.5 normal-case font-normal text-slate-400">({hint})</span>}
  </label>
);

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  hint?: string;
  leftEl?: React.ReactNode;
  error?: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, required, hint, leftEl, error, className = "", ...rest }) => (
  <div>
    {label && <Label text={label} required={required} hint={hint} />}
    <div className="relative">
      {leftEl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{leftEl}</span>}
      <input
        {...rest}
        className={`pf-input w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300 ${leftEl ? "pl-7" : ""} ${error ? "border-red-300 bg-red-50/30" : ""} ${className}`}
      />
    </div>
    {error && <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={10} />{error}</p>}
  </div>
);

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}
const SelectField: React.FC<SelectFieldProps> = ({ label, required, options, className = "", ...rest }) => (
  <div>
    {label && <Label text={label} required={required} />}
    <select
      {...rest}
      className={`pf-select pf-input w-full px-3 py-2.5 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 ${className}`}
    >
      <option value="">Select</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);


interface TagChipProps { label: string; onRemove: () => void; color?: string; }
const TagChip: React.FC<TagChipProps> = ({ label, onRemove, color = "bg-blue-50 text-blue-700 border-blue-100" }) => (
  <span className={`pf-tag inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${color}`}>
    {label}
    <button type="button" onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5">
      <X size={10} />
    </button>
  </span>
);


/*   • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   VARIANT BUILDER & MATRIX (Unchanged)
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */

/*   • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
   MAIN PRODUCT FORM
 • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • */
interface ProductFormProps {
  initialData?: Record<string, unknown>;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData: propInitialData = {}, isLoading: externalLoading = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, putData, getData, loading } = useApi();
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const isLoading = externalLoading || loading;

  // 💡 NEW: State for On-The-Fly Supplier Creation
  const [modalState, setModalState] = useState<{ type: "Supplier" | null; query: string }>({ type: null, query: "" });

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
    buy_price: (propInitialData.cost_price as string) || "",
    sell_price: (propInitialData.selling_price as string) || "",
    mrp: (propInitialData.mrp as string) || "",
    gst: (propInitialData.gst as string) || "18%",
    hsn: (propInitialData.hsn as string) || "",
    supplier: (propInitialData.supplier as string) || "",
    opening_stock: (propInitialData.opening_stock as string) || "",
    reorder_point: (propInitialData.reorder_point as string) || "5",
    max_stock: (propInitialData.max_stock as string) || "",
    location: (propInitialData.location as string) || "",
    has_variants: false,
    batch_tracking: (propInitialData.batch_tracking as boolean) || false,
    serial_tracking: (propInitialData.serial_tracking as boolean) || false,
  });

  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);
  const [baseSerials, setBaseSerials] = useState<string[]>([]);
  const [supplierDetails, setSupplierDetails] = useState<any>(null);

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3 bg-white px-4 h-11 rounded-2xl border border-slate-200 shadow-sm scale-90 md:scale-100">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
        <Switch
          checked={form.is_active}
          onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
        />
      </div>
    );
    return () => setActions(null);
  }, [setActions, form.is_active]);

  const { setBottomActions } = useHeader();
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 h-8 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2 overflow-hidden"
          >
            <Bookmark size={14} className="shrink-0" />
            <span className="truncate">Save Draft</span>
          </button>
        )}
        <GradientButton
          icon={<Save size={16} />}
          onClick={handleSubmit}
          disabled={isLoading}
          className="rounded-xl shadow-md text-xs px-8 h-8 flex items-center"
        >
          {isLoading ? "..." : (id ? "Save Changes" : "Create Product")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, isLoading, id, form, variantTypes, combinations]);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        const res = await getData(`${ENDPOINTS.INVENTORIES}/by/${id}/${SHOP_ID}`);
        if (res && res.data) {
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
            buy_price: String(prod.buy_price || datas.buy_price || ""),
            sell_price: String(prod.sell_price || datas.sell_price || ""),
            mrp: String(datas.mrp || ""),
            gst: String(datas.gst || "18%"),
            hsn: String(datas.hsn || ""),
            supplier: datas.supplier || "",
            opening_stock: String(datas.opening_stock || ""),
            reorder_point: String(datas.reorder_point || "5"),
            max_stock: String(datas.max_stock || ""),
            location: datas.location || "",
            has_variants: !!prod.has_variant,
            batch_tracking: !!prod.has_batch,
            serial_tracking: !!prod.has_serialno,
          });

          // Fetch matching supplier details for SearchSelect display if ID is set
          if (datas.supplier) {
            supplierApi.searchSuppliers(datas.supplier).then((sups: any[]) => {
              const matched = sups.find((s: any) => s.id === datas.supplier);
              if (matched) setSupplierDetails(matched);
            });
          }

          if (datas.variantTypes) {
            setVariantTypes(datas.variantTypes);
          } else if (prod.variants && prod.variants.length > 0) {
            const firstVarDatas = prod.variants[0].datas || {};
            const attributes = firstVarDatas.attributes;
            if (attributes) {
              const types = Object.keys(attributes).map(key => ({
                id: uid(),
                name: key,
                values: Array.from(new Set(prod.variants.map((v: any) => v.datas?.attributes?.[key]))).filter(Boolean) as string[]
              }));
              setVariantTypes(types);
            }
          }

          if (prod.variants) {
            setCombinations(prod.variants.map((v: any) => ({
              id: v.id,
              attributes: v.datas?.attributes || {},
              barcode: v.datas?.barcode || "",
              price: String(v.sell_price || ""),
              buy_price: String(v.buy_price || ""),
              mrp: String(v.datas?.mrp || ""),
              stock: String(v.stocks || ""),
              active: true,
              serials: (v.datas?.serial_numbers || []).map((sn: string) => ({
                id: uid(),
                serial: sn,
                status: "available" as const,
                purchaseDate: "",
                warrantyMonths: "12",
              }))
            })));
          }

          if (!prod.has_variant && prod.serial_number) {
            setBaseSerials(prod.serial_number);
          }
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
    suggestedVariantTypes: [],
    supportsSerials: false,
    serialLabel: "Serial Number",
  };

  const handleCategoryChange = (val: string) => {
    setForm(p => ({ ...p, category: val }));
    setVariantTypes([]);
    setCombinations([]);
  };

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("product_drafts") || "[]");
    const draftId = searchParams.get("draftId") || Date.now().toString();

    const newDraft = {
      id: draftId,
      data: { form, variantTypes, combinations },
      timestamp: new Date().toISOString(),
      displayName: form.name || "Untitled Product Draft"
    };

    const existingIndex = drafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.push(newDraft);
    }

    localStorage.setItem("product_drafts", JSON.stringify(drafts));
    showToast("Progress saved as draft", "info");
  };

  useEffect(() => {
    if (!form.has_variants) return;
    const newCombos = generateCombinations(variantTypes, combinations, {
      buy_price: form.buy_price,
      sell_price: form.sell_price,
      mrp: form.mrp
    });
    setCombinations(newCombos);
  }, [variantTypes, form.has_variants]);

  const marginStats = useMemo(() => {
    const cost = Number(form.buy_price) || 0;
    const selling = Number(form.sell_price) || 0;
    const profit = selling - cost;
    const pct = selling > 0 ? ((profit / selling) * 100).toFixed(1) : "0.0";
    return { profit, pct };
  }, [form.buy_price, form.sell_price]);

  const totalStock = useMemo(() => {
    if (!form.has_variants) return Number(form.opening_stock) || 0;
    return combinations.reduce((s, c) => s + (Number(c.stock) || 0), 0);
  }, [form.has_variants, form.opening_stock, combinations]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.has_variants && combinations.length === 0) {
      showToast("Please add at least one variant combination", "error");
      return;
    }

    const mappedVarients = combinations.map(combo => {
      const buyPrice = Number(combo.buy_price) || Number(form.buy_price) || 0;
      const sellPrice = Number(combo.price) || Number(form.sell_price) || 0;
      const mrp = Number(combo.mrp) || Number(form.mrp) || 0;
      const stocks = Number(combo.stock) || 0;
      const variantName = Object.values(combo.attributes).join(" / ");

      const v: any = {
        name: variantName,
        buy_price: buyPrice,
        sell_price: sellPrice,
        stocks: stocks,
        serial_numbers: combo.serials.map(s => s.serial),
        datas: {
          barcode: combo.barcode,
          mrp: mrp,
          attributes: combo.attributes,
        },
        batches: []
      };
      return v;
    });

    const payload: any = {
      shop_id: SHOP_ID,
      name: form.name,
      category: form.category,
      description: form.description,
      buy_price: Number(form.buy_price) || 0,
      sell_price: Number(form.sell_price) || 0,
      stocks: totalStock,
      barcode: form.barcode,
      has_variant: form.has_variants,
      has_serialno: form.serial_tracking,
      has_batch: form.batch_tracking,
      variants: form.has_variants ? mappedVarients : [],
      serial_numbers: !form.has_variants ? baseSerials : [],
      datas: {
        brand: form.brand,
        unit: form.unit,
        mrp: Number(form.mrp) || 0,
        gst: form.gst,
        hsn: form.hsn,
        supplier: form.supplier,
        opening_stock: Number(form.opening_stock) || 0,
        reorder_point: Number(form.reorder_point) || 0,
        max_stock: Number(form.max_stock) || 0,
        location: form.location,
        is_active: form.is_active,
        variantTypes,
      }
    };

    if (id) {
      payload.id = id;
    }

    let res;
    if (id) {
      res = await putData(`${ENDPOINTS.INVENTORIES}`, payload);
    } else {
      res = await postData(ENDPOINTS.INVENTORIES, payload);
    }

    if (res) {
      showToast(id ? "Product updated successfully" : "Product created successfully", "success");

      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("product_drafts") || "[]");
        const filtered = drafts.filter((d: any) => d.id !== draftId);
        localStorage.setItem("product_drafts", JSON.stringify(filtered));
      }

      setTimeout(() => {
        navigate("/product/all");
      }, 1000);
    } else {
      console.log(payload);
      showToast("Failed to save product", "error");
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="pf-root min-h-screen bg-slate-50/50 font-[Inter,sans-serif]">
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-5">

          <div className="grid grid-cols-1 lg:grid-cols-6 gap-5 items-start">

            {/* BOX 1: Identity */}
            <div className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Package size={16} />
                </div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Product Identity</h2>
              </div>
              <div className="p-6 space-y-4">
                <InputField label="Product Name" name="name" required
                  value={form.name} onChange={handleChange}
                  placeholder="e.g. Apple iPhone 15 Pro Max"
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InputField label="Barcode / SKU" name="barcode" required
                    value={form.barcode} onChange={handleChange}
                    placeholder="SKU..."
                  />
                  <InputField label="Brand" name="brand"
                    value={form.brand} onChange={handleChange}
                    placeholder="e.g. Apple"
                  />
                  <SelectField label="Category" required
                    value={form.category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                  />
                  <SelectField label="Unit" name="unit" required
                    value={form.unit} onChange={handleChange}
                    options={UNITS.map(u => ({ value: u, label: u }))}
                  />
                </div>

                <div>
                  <Label text="Description" hint="optional" />
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={1}
                    className="pf-input w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 resize-none placeholder-slate-300 min-h-[45px]"
                    placeholder="Key features, materials, dimensions"
                  />
                </div>

                <div className="pt-2 border-t border-slate-50 grid grid-cols-2 gap-4 mt-2">
                  <SelectField label="GST Rate" name="gst" required
                    value={form.gst} onChange={handleChange}
                    options={GST_RATES.map(r => ({ value: r, label: r }))}
                  />
                  <InputField label="HSN Code" name="hsn"
                    value={form.hsn} onChange={handleChange}
                    placeholder="8517"
                  />
                </div>
              </div>
            </div>

            {/* BOX 2: Classification */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Hash size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Classification</h2>
                </div>
                <div className="p-6 space-y-4">

                  {/* 💡 MODIFIED: Changed text input to SearchSelect for Supplier */}
                  <div className="flex flex-col gap-1.5">
                    <Label text="Supplier" hint="optional" />
                    <SearchSelect
                      labelKey="name"
                      valueKey="id"
                      fetchOptions={async (q) => await supplierApi.searchSuppliers(q)}
                      value={supplierDetails?.id || form.supplier}
                      onChange={(val, opt: any) => {
                        setForm(p => ({ ...p, supplier: String(val) }));
                        if (opt) setSupplierDetails(opt);
                      }}
                      // Triggers the On-The-Fly Supplier Modal
                      onCreateNew={(query) => setModalState({ type: "Supplier", query })}
                      placeholder="Search Supplier..."
                    />
                  </div>
                  {/* --- */}

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 mt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Product</span>
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm(p => ({ ...p, is_active: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">
            {/* BOX 3: Pricing */}
            <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <DollarSign size={16} />
                </div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Pricing & Margin</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <InputField label="Cost Price" name="buy_price" required
                    type="number" leftEl=""
                    value={form.buy_price} onChange={handleChange}
                    placeholder="0.00"
                  />
                  <InputField label="Selling Price" name="sell_price" required
                    type="number" leftEl=""
                    value={form.sell_price} onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Est. Margin</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{marginStats.profit.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${marginStats.profit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>{marginStats.pct}%</span>
                  </div>
                </div>
                <InputField label="MRP" name="mrp" type="number" leftEl=""
                  value={form.mrp} onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* BOX 4: Live Summary + Stock */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Live Summary</h2>
                </div>
                <div className="divide-y divide-slate-50 px-6">
                  {[
                    { label: "SKU", value: form.barcode || "-" },
                    { label: "Cost", value: form.buy_price ? `${Number(form.buy_price).toLocaleString()}` : "-" },
                    { label: "Price", value: form.sell_price ? `${Number(form.sell_price).toLocaleString()}` : "-" },
                    { label: "Margin", value: `${marginStats.pct}%`, color: marginStats.profit >= 0 ? "text-emerald-600" : "text-rose-600" },
                    { label: "Variants", value: form.has_variants ? `${combinations.length} combos` : "None" },
                    { label: "Stock", value: totalStock > 0 ? `${totalStock}` : "-" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2.5">
                      <span className="text-[11px] text-slate-400 font-medium">{row.label}</span>
                      <span className={`text-[11px] font-bold font-mono ${(row as any).color ?? "text-slate-800"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all pf-section-enter">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <BarChart2 size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Stock & Inventory</h2>
                </div>
                <div className="p-6 grid grid-cols-3 gap-5">
                  <InputField label="Opening Stock" name="opening_stock"
                    type="number" value={form.opening_stock} onChange={handleChange}
                    placeholder="0"
                    disabled={!!id}
                  />
                  <InputField label="Reorder Point" name="reorder_point" required
                    type="number" value={form.reorder_point} onChange={handleChange}
                    placeholder="5"
                  />
                  <InputField label="Max Stock" name="max_stock"
                    type="number" value={form.max_stock} onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                {form.serial_tracking && !form.has_variants && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <InlineSerialManager
                      serials={baseSerials}
                      serialLabel={categoryConfig.serialLabel}
                      limit={Number(form.opening_stock) || 0}
                      onUpdate={setBaseSerials}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white shadow-sm transition-all duration-300">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Enable Batch Tracking</h3>
                  {!id && <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[8px] font-black uppercase">Purchase Entry</span>}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  If you want batch tracking options during purchase, please enable it. Required for giving manufacture and expiry dates on purchase entries (e.g., medicines, foods).
                </p>
              </div>
              <Switch
                checked={form.batch_tracking}
                onCheckedChange={(val) => setForm(p => ({ ...p, batch_tracking: val }))}
              />
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white shadow-sm transition-all duration-300">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Serial Number Tracking</h3>
                  {!id && <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[8px] font-black uppercase">Unique ID</span>}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Track unique identification numbers for each individual unit. Ideal for electronics like mobile phones, laptops, and appliances.
                </p>
              </div>
              <Switch
                checked={form.serial_tracking}
                onCheckedChange={(val) => setForm(p => ({ ...p, serial_tracking: val }))}
              />
            </div>
          </div>

          {/* ROW 3: Variants (full width) */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="px-6 py-4 bg-gradient-to-r from-violet-50/50 to-transparent border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <Layers size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Product Variants</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Colors, sizes, storage and other variations</p>
                </div>
              </div>
              <Switch
                checked={form.has_variants}
                onCheckedChange={(checked) => {
                  setForm(p => ({ ...p, has_variants: checked }));
                  if (!checked) setCombinations([]);
                }}
              />
            </div>

            {form.has_variants ? (
              <div className="p-6 space-y-5 pf-section-enter">
                <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/40">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4">Define Variant Types</p>
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
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                        Variant Matrix ({combinations.length} combinations)
                      </p>
                    </div>
                    <VariantMatrixTable
                      combinations={combinations}
                      variantTypes={variantTypes}
                      supportsSerials={categoryConfig.supportsSerials}
                      serialLabel={categoryConfig.serialLabel}
                      onChange={setCombinations}
                    />
                  </div>
                )}
                {variantTypes.length === 0 && (
                  <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Plus size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Add your first variant type above to begin</p>
                  </div>
                )}
                {variantTypes.length > 0 && combinations.length === 0 && (
                  <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
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
      </div>

      {/* Quick Supplier Modal */}
      <QuickCreateSupplierModal
        isOpen={modalState.type === "Supplier"}
        onClose={() => setModalState({ type: null, query: "" })}
        initialName={modalState.query}
        onSuccess={(sup) => {
          setForm(prev => ({ ...prev, supplier: sup.id }));
          setSupplierDetails(sup);
        }}
      />
    </>
  );
};

export default ProductForm;