import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Zap,
  BarChart2,
  Layers,
  CheckCircle2,
  Barcode,
  Plus,
  X,
  IndianRupee,
  AlertCircle,
  ScanLine,
  ChevronDown
} from "lucide-react";
import { QuickCreateModal, QuickCreateStep } from "./QuickCreateModal";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { InlineSerialManager } from "@/components/common/InlineSerialManager";

import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID, getShopId } from "@/services/endpoints";
import { Switch } from "@/components/ui/switch";
import {
  VariantType,
  VariantCombination,
  VariantBuilder,
  VariantMatrixTable,
  generateCombinations
} from "@/features/product/components/VariantManager";

import { utilityApi } from "@/services/api/utility";

// --- Constants (Shared with ProductForm) ---

const CATEGORY_CONFIGS: Record<string, { suggestedVariantTypes: string[]; supportsSerials: boolean; serialLabel: string }> = {
  "Mobile Phones": { suggestedVariantTypes: ["Storage", "Color", "Model"], supportsSerials: true, serialLabel: "IMEI Number" },
  "Laptops": { suggestedVariantTypes: ["RAM", "Storage", "Color"], supportsSerials: true, serialLabel: "Serial Number" },
  "Clothing": { suggestedVariantTypes: ["Size", "Color"], supportsSerials: false, serialLabel: "Serial Number" },
  "Footwear": { suggestedVariantTypes: ["Size", "Color"], supportsSerials: false, serialLabel: "Serial Number" },
  "Electronics": { suggestedVariantTypes: ["Color", "Wattage", "Model"], supportsSerials: true, serialLabel: "Serial Number" },
  "Accessories": { suggestedVariantTypes: ["Color", "Size"], supportsSerials: false, serialLabel: "Serial Number" },
  "Tablets": { suggestedVariantTypes: ["Storage", "Connectivity", "Color"], supportsSerials: true, serialLabel: "IMEI / Serial" },
};


interface QuickCreateDropdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "Category" | "Unit";
  onSuccess: (item: { id: string; name: string }) => void;
}

const QuickCreateDropdownModal: React.FC<QuickCreateDropdownModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      showToast(`${type} Name is required`, "error");
      return;
    }
    if (type === "Unit" && !shortName.trim()) {
      showToast("Unit Short Name / Symbol is required", "error");
      return;
    }
    setLoading(true);

    try {
      const activeShopId = getShopId() || SHOP_ID;
      if (type === "Category") {
        const res = await utilityApi.createShopCategory({
          shop_id: activeShopId,
          name: name.trim(),
          description: description.trim() || undefined
        });
        const data = res?.data ?? res;
        const targetId = data?.id ?? data?._id;
        if (targetId) onSuccess({ id: targetId, name: data.name || name.trim() });
      } else {
        const res = await utilityApi.createShopUnit({
          shop_id: activeShopId,
          name: name.trim(),
          short_name: shortName.trim().toUpperCase(),
          description: description.trim() || undefined
        });
        const data = res?.data ?? res;
        const targetId = data?.id ?? data?._id;
        if (targetId) onSuccess({ id: targetId, name: data.name || name.trim() });
      }
      setName("");
      setShortName("");
      setDescription("");
      onClose();
      showToast(`${type} created successfully`, "success");
    } catch (err: any) {
      const msg = err?.detail?.description || err?.message || `Failed to create ${type}`;
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Add New {type}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              {type === "Category" ? "Category Name" : "Unit Name"} <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              autoFocus
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
              placeholder={`e.g. ${type === "Category" ? "Beverages" : "Box"}`}
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (type === "Unit" && !shortName) {
                  setShortName(e.target.value.substring(0, 3).toUpperCase());
                }
              }}
            />
          </div>

          {type === "Unit" && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Short Name / Symbol <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm uppercase font-mono"
                placeholder="e.g. BX, PCS, KG"
                value={shortName}
                onChange={e => setShortName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Description <span className="normal-case font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm resize-none"
              placeholder="Brief description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 h-9 rounded-lg font-semibold text-xs text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || (type === "Unit" && !shortName.trim()) || loading}
            className="px-4 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface QuickCreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess: (product: any) => void;
  isInitialStockMode?: boolean;
  hideBuyPrice?: boolean;
  fromPurchase?: boolean;
  source?: string;
}

export const QuickCreateProductModal: React.FC<QuickCreateProductModalProps> = ({
  isOpen,
  onClose,
  initialName = "",
  onSuccess,
  isInitialStockMode,
  hideBuyPrice = false,
  fromPurchase = false,
  source,
}) => {
  const shouldHideBuyPrice = hideBuyPrice || fromPurchase || source === "purchase";
  const { postData, getLastError } = useApi();
  const { showToast, showError, showSuccess } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  const [isStockImportCompleted, setIsStockImportCompleted] = useState<boolean>(() => {
    return Boolean(SHOP_ID && localStorage.getItem(`stock_import_completed_${SHOP_ID}`) === "true");
  });

  useEffect(() => {
    if (isOpen && SHOP_ID) {
      import("@/services/api/shop").then(({ shopApi }) => {
        shopApi.getShopById(SHOP_ID).then((res: any) => {
          const shopData = res?.data || res;
          const isImported = Boolean(
            shopData?.initial_stock_imported ||
            shopData?.additional_infos?.initial_stock_imported ||
            shopData?.datas?.initial_stock_imported
          );
          setIsStockImportCompleted(isImported);
          if (isImported) {
            localStorage.setItem(`stock_import_completed_${SHOP_ID}`, "true");
          }
        }).catch(() => {});
      });
    }
  }, [isOpen]);

  const isInitialStockActive = Boolean(isInitialStockMode && !isStockImportCompleted);

  const [batches, setBatches] = useState<{
    id: string;
    name: string;
    manufacturing_date: string;
    expiry_date: string;
    stocks: string;
    buy_price?: string;
    sell_price?: string;
    serial_numbers?: string[];
  }[]>([
    {
      id: "b_1",
      name: "",
      manufacturing_date: "",
      expiry_date: "",
      stocks: "0",
      buy_price: "",
      sell_price: "",
      serial_numbers: [],
    }
  ]);

  const [simpleSerials, setSimpleSerials] = useState<string[]>([]);
  const [expandedBatchSerialId, setExpandedBatchSerialId] = useState<string | null>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [modalState, setModalState] = useState<{ type: "Category" | "Unit" | null; query: string }>({ type: null, query: "" });

  const [categoriesOffset, setCategoriesOffset] = useState(1);
  const [hasMoreCategories, setHasMoreCategories] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);

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
        if (res.data.length < 100) setHasMoreCategories(false);
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
        if (res.data.length < 100) setHasMoreUnits(false);
      } else {
        setHasMoreUnits(false);
      }
    } catch (e) {
      console.error("Failed to fetch more units", e);
    } finally {
      setLoadingUnits(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [catRes, unitRes] = await Promise.all([
        utilityApi.getShopCategories(SHOP_ID, { limit: "100", offset: "1" }),
        utilityApi.getShopUnits(SHOP_ID, { limit: "100", offset: "1" })
      ]);
      if (catRes?.data && catRes.data.length > 0) {
        setCategories(catRes.data);
        setForm(p => ({ ...p, category: p.category && catRes.data.some((c: any) => c.id === p.category) ? p.category : catRes.data[0].id }));
      }
      if (unitRes?.data && unitRes.data.length > 0) {
        setUnits(unitRes.data);
        setForm(p => ({ ...p, unit: p.unit && unitRes.data.some((u: any) => u.id === p.unit) ? p.unit : unitRes.data[0].id }));
      }
    } catch (e) {
      console.error("Failed to fetch shop categories/units", e);
    }
  };

  const [baseName, setBaseName] = useState(initialName || "");

  const [form, setForm] = useState({
    name: initialName,
    barcode: "",
    brand: "",
    category: "",
    unit: "",
    description: "",
    is_active: true,
    buy_price: "",
    sell_price: "",
    mrp: "",
    gst: "18",
    hsn: "",
    opening_stock: "0",
    reorder_point: "1",
    location: "",
    batch_tracking: false,
    serial_tracking: false,
    has_variants: false,
    batch_name: "",
    mfg_date: "",
    exp_date: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
      if (initialName) {
        setBaseName(initialName);
        setForm((prev) => ({
          ...prev,
          name: initialName,
          brand: "",
        }));
      }
    } else {
      setBaseName("");
      setSimpleSerials([]);
      setExpandedBatchSerialId(null);
      setBatches([
        {
          id: "b_1",
          name: "",
          manufacturing_date: "",
          expiry_date: "",
          stocks: "0",
          buy_price: "",
          sell_price: "",
          serial_numbers: [],
        }
      ]);
    }
  }, [isOpen, initialName]);

  // --- Variant State ---
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);

  const config = CATEGORY_CONFIGS[form.category] || {
    suggestedVariantTypes: [],
    supportsSerials: false,
    serialLabel: "Serial Number"
  };

  const [showBarcodeGen, setShowBarcodeGen] = useState(false);
  const [barcodePrefix, setBarcodePrefix] = useState("");
  const [generatingBarcode, setGeneratingBarcode] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (creationError) setCreationError(null);
    const { name, value } = e.target;
    if (name === "name") {
      setForm((p) => {
        const stripped = p.brand && value.startsWith(p.brand + " ")
          ? value.slice(p.brand.length + 1)
          : value;
        setBaseName(stripped);
        return {
          ...p,
          name: p.brand ? `${p.brand} ${stripped}`.trim() : stripped,
        };
      });
    } else if (name === "brand") {
      const fullName = value ? `${value} ${baseName}`.trim() : baseName;
      setForm((p) => ({
        ...p,
        brand: value,
        name: fullName,
      }));
    } else if (name === "mrp") {
      setForm((prev) => ({
        ...prev,
        mrp: value,
        sell_price: (!prev.sell_price || prev.sell_price === prev.mrp) ? value : prev.sell_price,
      }));
    } else if (name === "sell_price") {
      setForm((prev) => ({ ...prev, sell_price: value }));
    } else if (name === "gst") {
      const sanitized = value.replace(/[^0-9.]/g, "");
      setForm((prev) => ({ ...prev, gst: sanitized }));
    } else if (name === "opening_stock") {
      const num = Number(value) || 0;
      setForm((prev) => ({ ...prev, opening_stock: value }));
      setSimpleSerials((prev) => (num < prev.length ? prev.slice(0, num) : prev));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Sync combinations when variant types or base prices change
  useEffect(() => {
    if (form.has_variants) {
      setCombinations(prev => generateCombinations(
        variantTypes,
        prev,
        { buy_price: form.buy_price, sell_price: form.sell_price, mrp: form.mrp, reorder_point: form.reorder_point || "1" }
      ));
    }
  }, [variantTypes, form.has_variants, form.buy_price, form.sell_price, form.mrp, form.reorder_point]);

  const totalOpeningStock = useMemo(() => {
    if (form.has_variants) {
      return combinations.filter(c => c.active).reduce((sum, c) => sum + (Number(c.stock) || 0), 0);
    }
    if (form.batch_tracking) {
      return batches.reduce((sum, b) => sum + (Number(b.stocks) || 0), 0);
    }
    return Number(form.opening_stock) || 0;
  }, [form.has_variants, form.batch_tracking, form.opening_stock, combinations, batches]);

  const isStep1Valid = useMemo(() => {
    if (!form.name || !form.name.trim()) return false;
    if (!form.category) return false;
    if (!form.unit) return false;
    if (form.mrp && form.sell_price && Number(form.sell_price) > Number(form.mrp)) return false;
    if (isInitialStockActive && !form.has_variants) {
      if (!form.buy_price || Number(form.buy_price) <= 0) return false;
      if (!form.sell_price || Number(form.sell_price) <= 0) return false;
    }
    return true;
  }, [form.name, form.category, form.unit, form.mrp, form.sell_price, form.buy_price, isInitialStockActive, form.has_variants]);

  const isStep2Valid = useMemo(() => {
    if (isInitialStockActive) {
      if (!form.has_variants && !form.batch_tracking) {
        const stock = Number(form.opening_stock) || 0;
        if (stock <= 0) return false;
        if (!form.buy_price || Number(form.buy_price) <= 0) return false;
        if (!form.sell_price || Number(form.sell_price) <= 0) return false;
        if (form.serial_tracking && simpleSerials.length !== stock) return false;
      }
      if (!form.has_variants && form.batch_tracking) {
        if (batches.length === 0) return false;
        for (const b of batches) {
          if (!b.name.trim()) return false;
          const stock = Number(b.stocks) || 0;
          if (stock <= 0) return false;
          const bBuy = b.buy_price || form.buy_price;
          if (!bBuy || Number(bBuy) <= 0) return false;
          const bSell = b.sell_price || form.sell_price || form.mrp;
          if (!bSell || Number(bSell) <= 0) return false;
          if (form.serial_tracking && (b.serial_numbers || []).length !== stock) return false;
        }
      }
    }
    return true;
  }, [isInitialStockActive, form.buy_price, form.sell_price, form.mrp, form.serial_tracking, form.has_variants, form.batch_tracking, form.opening_stock, simpleSerials, batches]);

  const isStep3Valid = useMemo(() => {
    if (!form.has_variants) return true;
    const activeCombos = combinations.filter(c => c.active);
    if (activeCombos.length === 0) return false;
    if (isInitialStockActive) {
      for (const combo of activeCombos) {
        const stock = Number(combo.stock) || 0;
        if (stock <= 0) return false;
        const buyPrice = combo.buy_price || form.buy_price;
        if (!buyPrice || Number(buyPrice) <= 0) return false;
        const sellPrice = combo.price || form.sell_price || form.mrp;
        if (!sellPrice || Number(sellPrice) <= 0) return false;
        if (combo.mrp && Number(sellPrice) > Number(combo.mrp)) return false;
        if (form.serial_tracking && (combo.serial_numbers || []).length !== stock) return false;
        if (form.batch_tracking && !combo.batch?.name?.trim()) return false;
      }
    }
    return true;
  }, [form.has_variants, isInitialStockActive, form.serial_tracking, form.batch_tracking, form.buy_price, form.sell_price, form.mrp, combinations]);

  const handleBeforeNext = (stepIdx: number): boolean => {
    if (stepIdx === 0) {
      if (!form.name || !form.name.trim()) {
        showToast("Product name is required", "error");
        return false;
      }
      if (!form.category) {
        showToast("Category is required", "error");
        return false;
      }
      if (!form.unit) {
        showToast("Unit is required", "error");
        return false;
      }
      if (form.mrp && form.sell_price && Number(form.sell_price) > Number(form.mrp)) {
        showToast(`Selling price (₹${form.sell_price}) cannot exceed MRP (₹${form.mrp})`, "error");
        return false;
      }
      if (isInitialStockActive && !form.has_variants) {
        if (!form.buy_price || Number(form.buy_price) <= 0) {
          showToast("Buy price is mandatory and must be greater than 0 for initial stock.", "error");
          return false;
        }
        if (!form.sell_price || Number(form.sell_price) <= 0) {
          showToast("Sell price is mandatory and must be greater than 0 for initial stock.", "error");
          return false;
        }
      }
      return true;
    }

    if (stepIdx === 1) {
      if (isInitialStockActive) {
        if (!form.has_variants && !form.batch_tracking) {
          if (!form.opening_stock || Number(form.opening_stock) <= 0) {
            showToast("Opening stock is mandatory and must be greater than 0 for initial stock.", "error");
            return false;
          }
          if (form.serial_tracking && simpleSerials.length !== Number(form.opening_stock)) {
            showToast(`Please enter all ${form.opening_stock} ${config.serialLabel || "serial number"}s (currently ${simpleSerials.length}/${form.opening_stock})`, "error");
            return false;
          }
        }
        if (!form.has_variants && form.batch_tracking) {
          if (batches.length === 0) {
            showToast("At least one batch is required", "error");
            return false;
          }
          for (let i = 0; i < batches.length; i++) {
            const b = batches[i];
            const batchName = b.name.trim() || `Batch #${i + 1}`;
            if (!b.name.trim()) {
              showToast("Batch number is required for all batches", "error");
              return false;
            }
            if (!b.stocks || Number(b.stocks) <= 0) {
              showToast(`Opening stock is mandatory and must be greater than 0 for batch "${batchName}".`, "error");
              return false;
            }
            const bBuy = b.buy_price || form.buy_price;
            if (!bBuy || Number(bBuy) <= 0) {
              showToast(`Buy price is mandatory and must be greater than 0 for batch "${batchName}".`, "error");
              return false;
            }
            const bSell = b.sell_price || form.sell_price || form.mrp;
            if (!bSell || Number(bSell) <= 0) {
              showToast(`Sell price is mandatory and must be greater than 0 for batch "${batchName}".`, "error");
              return false;
            }
            if (form.serial_tracking && (b.serial_numbers || []).length !== Number(b.stocks)) {
              showToast(`Please enter all ${b.stocks} ${config.serialLabel || "serial number"}s for batch "${batchName}"`, "error");
              return false;
            }
          }
        }
      }
      return true;
    }

    if (stepIdx === 2) {
      if (form.has_variants) {
        const activeCombos = combinations.filter(c => c.active);
        if (activeCombos.length === 0) {
          showToast("At least one variant must be enabled and active", "error");
          return false;
        }
        if (isInitialStockActive) {
          for (const combo of activeCombos) {
            const varLabel = Object.values(combo.attributes).join(" / ") || "variant";
            const cBuy = combo.buy_price || form.buy_price;
            if (!cBuy || Number(cBuy) <= 0) {
              showToast(`Buy price is mandatory and must be greater than 0 for variant "${varLabel}".`, "error");
              return false;
            }
            const cSell = combo.price || form.sell_price || form.mrp;
            if (!cSell || Number(cSell) <= 0) {
              showToast(`Sell price is mandatory and must be greater than 0 for variant "${varLabel}".`, "error");
              return false;
            }
            const cMrp = combo.mrp ? Number(combo.mrp) : (form.mrp ? Number(form.mrp) : null);
            if (cMrp && Number(cSell) > cMrp) {
              showToast(`Selling price (₹${cSell}) cannot exceed MRP (₹${cMrp}) for variant "${varLabel}"`, "error");
              return false;
            }
            const stock = Number(combo.stock) || 0;
            if (stock <= 0) {
              showToast(`Opening stock is mandatory and must be greater than 0 for variant "${varLabel}".`, "error");
              return false;
            }
            if (form.serial_tracking && (combo.serial_numbers || []).length !== stock) {
              showToast(`Please enter all ${stock} ${config.serialLabel || "serial number"}s for variant "${varLabel}"`, "error");
              return false;
            }
            if (form.batch_tracking) {
              if (!combo.batch?.name?.trim()) {
                showToast(`Please provide a Batch Number for variant "${varLabel}"`, "error");
                return false;
              }
            }
          }
        }
      }
      return true;
    }

    return true;
  };

  const steps: QuickCreateStep[] = [
    {
      id: 1,
      title: "Product Identity",
      subtitle: "Basic identification",
      isValid: isStep1Valid,
      content: (
        <div className="space-y-6">
          <Input
            label="Product Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. iPhone 15 Pro"
            className="h-12 font-bold text-slate-700"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 ml-1 block mb-1">Barcode / SKU <span className="normal-case font-normal text-slate-400">(optional)</span></label>
              <div className="relative">
                <input
                  name="barcode"
                  value={form.barcode}
                  onChange={handleChange}
                  placeholder="Scan or type"
                  className="w-full h-10 px-3 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowBarcodeGen(!showBarcodeGen)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Generate barcode"
                >
                  <Barcode size={16} />
                </button>
              </div>
              {showBarcodeGen && (
                <div className="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] p-3 bg-white border border-slate-200 shadow-2xl rounded-xl z-[150]">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5"><Barcode size={12} className="text-emerald-600" />Generate Barcode</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Prefix (Optional)"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      value={barcodePrefix}
                      onChange={e => setBarcodePrefix(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setShowBarcodeGen(false); setBarcodePrefix(""); }} className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                      <button type="button" onClick={handleGenerateBarcode} disabled={generatingBarcode} className="flex-1 py-1.5 text-[10px] font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">{generatingBarcode ? "…" : "Generate"}</button>
                    </div>
                  </div>
                  {/* Arrow pointing up */}
                  <div className="absolute top-[-6px] right-4 w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45" />
                </div>
              )}
            </div>
            <Input label="Brand (optional)" name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Apple" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-1">Category <span className="text-red-500 ml-0.5">*</span></label>
              <ReusableSelect
                key={`cat-${categories.length}`}
                value={form.category}
                onValueChange={(val) => { setForm(p => ({ ...p, category: val })); setVariantTypes([]); setCombinations([]); }}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select category"
                onScrollEnd={fetchMoreCategories}
                footer={
                  <button
                    type="button"
                    onClick={() => setModalState({ type: "Category", query: "" })}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                  >
                    <Plus size={14} />
                    Create New Category
                  </button>
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-1">Unit <span className="text-red-500 ml-0.5">*</span></label>
              <ReusableSelect
                key={`unit-${units.length}`}
                value={form.unit}
                onValueChange={(val) => setForm(p => ({ ...p, unit: val }))}
                options={units.map(u => ({ value: u.id, label: u.name }))}
                placeholder="Select unit"
                onScrollEnd={fetchMoreUnits}
                footer={
                  <button
                    type="button"
                    onClick={() => setModalState({ type: "Unit", query: "" })}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                  >
                    <Plus size={14} />
                    Create New Unit
                  </button>
                }
              />
            </div>
          </div>

          {/* Dedicated Pricing & Taxation Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <IndianRupee size={14} className="text-emerald-600" /> Pricing & Taxation
              </h4>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                All prices are Tax (GST) Inclusive
              </span>
            </div>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${shouldHideBuyPrice ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`}>
              {!shouldHideBuyPrice && (
                <div className="space-y-1">
                  <Input
                    label="Buy Price (Cost Price - Incl. GST)"
                    name="buy_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.buy_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    leftIcon={<IndianRupee size={14} />}
                    required={isInitialStockActive}
                  />
                  <span className="text-[10px] text-slate-400 font-medium block pl-1">
                    Inclusive of GST
                  </span>
                </div>
              )}
              <div className="space-y-1">
                <Input
                  label="Sell Price (Incl. GST)"
                  name="sell_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sell_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  leftIcon={<IndianRupee size={14} />}
                  required={isInitialStockActive}
                  error={
                    form.mrp && form.sell_price && Number(form.sell_price) > Number(form.mrp)
                      ? "Cannot exceed MRP"
                      : undefined
                  }
                />
                <span className="text-[10px] text-slate-400 font-medium block pl-1">
                  Inclusive of GST
                </span>
              </div>
              <Input
                label="MRP (optional)"
                name="mrp"
                type="number"
                min="0"
                step="0.01"
                value={form.mrp}
                onChange={handleChange}
                placeholder="0.00"
                leftIcon={<IndianRupee size={14} />}
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1">GST Rate (optional)</label>
                <ReusableSelect
                  value={form.gst}
                  onValueChange={(val) => setForm(p => ({ ...p, gst: val }))}
                  options={["0", "5", "12", "18", "28"].map(r => ({ value: r, label: `${r}%` }))}
                  placeholder="18%"
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Tracking & Inventory",
      subtitle: "Management settings",
      isValid: isStep2Valid,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Reorder Point (optional)" type="number" name="reorder_point" value={form.reorder_point} onChange={handleChange} />
            <Input label="Storage Location (optional)" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Aisle 4, Shelf B" />
          </div>

          <div className="space-y-4 pt-2">
            {!form.has_variants && !form.batch_tracking && isInitialStockActive && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900">Opening Stock</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Initial Stock</span>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700/80">
                  Enter the initial stock count for this product. Pricing configured in Step 1 applies to this opening inventory.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Opening Stock Quantity"
                    name="opening_stock"
                    type="number"
                    min="0"
                    value={form.opening_stock}
                    onChange={handleChange}
                    placeholder="0"
                    className="font-semibold text-emerald-900"
                  />
                  <div className="p-3 bg-white rounded-lg border border-emerald-200/80 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applicable Pricing</span>
                    <div className="flex items-center gap-2.5 mt-1 text-xs font-bold text-slate-700 flex-wrap">
                      {!shouldHideBuyPrice && (
                        <>
                          <span>Buy (Incl. GST): <span className={form.buy_price && Number(form.buy_price) > 0 ? "text-emerald-700 font-mono" : "text-amber-600"}>{form.buy_price ? `₹${form.buy_price}` : "Not set"}</span></span>
                          <span>•</span>
                        </>
                      )}
                      <span>Sell (Incl. GST): <span className={form.sell_price && Number(form.sell_price) > 0 ? "text-emerald-700 font-mono" : "text-amber-600"}>{form.sell_price ? `₹${form.sell_price}` : (form.mrp ? `₹${form.mrp}` : "Not set")}</span></span>
                      {form.mrp && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 font-mono">MRP: ₹{form.mrp}</span>
                        </>
                      )}
                    </div>
                    {Number(form.opening_stock) > 0 && ((!shouldHideBuyPrice && (!form.buy_price || Number(form.buy_price) <= 0)) || !form.sell_price || Number(form.sell_price) <= 0) && (
                      <span className="text-[10px] text-red-500 font-semibold mt-1">
                        * {shouldHideBuyPrice ? "Sell Price is required for opening stock. Please set it in Step 1." : "Both Buy Price and Sell Price are required for opening stock. Please set them in Step 1."}
                      </span>
                    )}
                  </div>
                </div>

                {form.serial_tracking && Number(form.opening_stock) > 0 && (
                  <div className="pt-2 animate-in fade-in duration-300">
                    <InlineSerialManager
                      serials={simpleSerials}
                      serialLabel={config.serialLabel || "Serial Number"}
                      limit={Number(form.opening_stock)}
                      onUpdate={setSimpleSerials}
                      onValidationError={(msg) => showToast(msg, "error")}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                  <BarChart2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 tracking-tight">Batch Tracking</p>
                  <p className="text-[10px] font-bold text-slate-400">Track expiry & manufacture</p>
                </div>
              </div>
              <Switch checked={form.batch_tracking} onCheckedChange={(val) => setForm(f => ({ ...f, batch_tracking: val }))} />
            </div>

            {form.batch_tracking && !form.has_variants && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Batch Information</h4>
                    <p className="text-[10px] text-amber-700/80">
                      {isInitialStockActive
                        ? "Enter batch numbers, dates, and opening stock for each batch"
                        : "Enter batch numbers and dates"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBatches(prev => [
                      ...prev,
                      { id: `b_${Date.now()}`, name: "", manufacturing_date: "", expiry_date: "", stocks: "0", buy_price: "", sell_price: "", serial_numbers: [] }
                    ])}
                    className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Batch
                  </button>
                </div>

                <div className="space-y-2.5">
                  {batches.map((batch, bIdx) => (
                    <div key={batch.id} className="p-3 bg-white rounded-lg border border-amber-100 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-900 uppercase">Batch #{bIdx + 1}</span>
                        {batches.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setBatches(prev => prev.filter(b => b.id !== batch.id))}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 mb-1 block">Batch Number *</label>
                          <input
                            type="text"
                            placeholder="e.g. BATCH-001"
                            value={batch.name}
                            onChange={e => {
                              const v = e.target.value;
                              setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, name: v } : b));
                            }}
                            className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-md outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 mb-1 block">Mfg Date</label>
                          <input
                            type="date"
                            value={batch.manufacturing_date}
                            onChange={e => {
                              const v = e.target.value;
                              setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, manufacturing_date: v } : b));
                            }}
                            className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 mb-1 block">Expiry Date</label>
                          <input
                            type="date"
                            value={batch.expiry_date}
                            onChange={e => {
                              const v = e.target.value;
                              setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, expiry_date: v } : b));
                            }}
                            className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md outline-none focus:border-amber-500"
                          />
                        </div>
                        {isInitialStockActive && (
                          <div>
                            <label className="text-[10px] font-bold text-emerald-700 mb-1 block">Opening Stock *</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={batch.stocks}
                              onChange={e => {
                                const v = e.target.value;
                                const num = Number(v) || 0;
                                setBatches(prev => prev.map(b => {
                                  if (b.id !== batch.id) return b;
                                  const currentSerials = b.serial_numbers || [];
                                  return {
                                    ...b,
                                    stocks: v,
                                    serial_numbers: num < currentSerials.length ? currentSerials.slice(0, num) : currentSerials,
                                  };
                                }));
                              }}
                              className="w-full h-8 px-2.5 text-xs border border-emerald-300 bg-emerald-50/50 rounded-md outline-none focus:border-emerald-500 font-semibold text-emerald-900"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 mb-1 block">Buy Price (Incl. GST)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={form.buy_price ? String(form.buy_price) : "0.00"}
                            value={batch.buy_price || ""}
                            onChange={e => {
                              const v = e.target.value;
                              setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, buy_price: v } : b));
                            }}
                            className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-md outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 mb-1 block">Sell Price (Incl. GST)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={form.sell_price ? String(form.sell_price) : (form.mrp ? String(form.mrp) : "0.00")}
                            value={batch.sell_price || ""}
                            onChange={e => {
                              const v = e.target.value;
                              setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, sell_price: v } : b));
                            }}
                            className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-md outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>

                      {isInitialStockActive && form.serial_tracking && Number(batch.stocks) > 0 && (
                        <div className="pt-2 border-t border-amber-100 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setExpandedBatchSerialId(prev => prev === batch.id ? null : batch.id)}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                                (batch.serial_numbers || []).length === Number(batch.stocks)
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 shadow-2xs"
                              }`}
                            >
                              <ScanLine size={13} className={(batch.serial_numbers || []).length === Number(batch.stocks) ? "text-emerald-600" : "text-violet-600"} />
                              <span>{config.serialLabel || "Serial"} Numbers ({(batch.serial_numbers || []).length}/{batch.stocks})</span>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${expandedBatchSerialId === batch.id ? "rotate-180" : ""}`} />
                            </button>
                            {(batch.serial_numbers || []).length === Number(batch.stocks) ? (
                              <span className="text-[10px] text-emerald-600 font-bold">✓ All Serials Added</span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-bold">
                                {Number(batch.stocks) - (batch.serial_numbers || []).length} remaining
                              </span>
                            )}
                          </div>

                          {expandedBatchSerialId === batch.id && (
                            <div className="mt-1 animate-in fade-in duration-200">
                              <InlineSerialManager
                                serials={batch.serial_numbers || []}
                                serialLabel={config.serialLabel || "Serial Number"}
                                limit={Number(batch.stocks)}
                                onUpdate={(newSerials) => {
                                  setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, serial_numbers: newSerials } : b));
                                }}
                                onValidationError={(msg) => showToast(msg, "error")}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                  <Layers size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 tracking-tight">Serial Tracking</p>
                  <p className="text-[10px] font-bold text-slate-400">Track unique IDs / IMEIs</p>
                </div>
              </div>
              <Switch checked={form.serial_tracking} onCheckedChange={(val) => setForm(f => ({ ...f, serial_tracking: val }))} />
            </div>

            {!isStep2Valid && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                <span>Please register all required serial numbers for opening stock to proceed.</span>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Variants",
      subtitle: "Product attributes & combinations",
      isValid: isStep3Valid,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 md:p-5 rounded-lg bg-emerald-50/50 border border-emerald-100 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-950 tracking-tight">Enable Variants</p>
                <p className="text-[10px] font-bold text-emerald-600">Multiple sizes, colors, etc.</p>
              </div>
            </div>
            <Switch checked={form.has_variants} onCheckedChange={(val) => setForm(f => ({ ...f, has_variants: val }))} />
          </div>

          {form.has_variants && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <VariantBuilder
                variantTypes={variantTypes}
                onChange={setVariantTypes}
                suggestedTypes={config.suggestedVariantTypes}
              />

              {variantTypes.some(t => t.values.length > 0) && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <VariantMatrixTable
                    combinations={combinations}
                    variantTypes={variantTypes}
                    onChange={setCombinations}
                    trackStock={false}
                    showOpeningStock={isInitialStockActive}
                    hasBatch={form.batch_tracking}
                    hasSerial={form.serial_tracking}
                    serialLabel={config.serialLabel || "Serial Number"}
                    baseMrp={form.mrp ? Number(form.mrp) : undefined}
                    baseBuyPrice={form.buy_price ? Number(form.buy_price) : undefined}
                    baseSellPrice={form.sell_price ? Number(form.sell_price) : undefined}
                    onStockError={(msg) => showToast(msg, "error")}
                  />

                  {!isStep3Valid && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center gap-2 animate-in fade-in">
                      <AlertCircle size={15} className="text-amber-600 shrink-0" />
                      <span>Please register all required serial numbers for active variants with opening stock to proceed.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!form.has_variants && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                <Layers size={32} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 tracking-tight">No Variants Enabled</p>
                <p className="text-[10px] font-bold text-slate-400 max-w-[200px]">
                  Enable variants to add multiple versions of this product
                </p>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 4,
      title: "Overview",
      subtitle: "Review details before creating",
      content: (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-lg p-4 md:p-6 border border-slate-100 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">{form.name || "Untitled Product"}</h4>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  {(categories.find(c => c.id === form.category)?.name || form.category)} • {form.brand || "No Brand"}
                </p>
              </div>
            </div>

            <div className={`grid grid-cols-2 ${shouldHideBuyPrice ? "md:grid-cols-3" : "md:grid-cols-4"} gap-4 pt-6 border-t border-slate-200/60`}>
              {!shouldHideBuyPrice && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400">Buy Price (Incl. GST)</p>
                  <p className="text-sm font-bold text-slate-700">{form.buy_price ? `₹${form.buy_price}` : "N/A"}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400">Sell Price (Incl. GST)</p>
                <p className="text-sm font-bold text-slate-700">{form.sell_price ? `₹${form.sell_price}` : (form.mrp ? `₹${form.mrp}` : "N/A")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400">MRP</p>
                <p className="text-sm font-bold text-slate-700">{form.mrp ? `₹${form.mrp}` : "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400">Tax (GST)</p>
                <p className="text-sm font-bold text-slate-700">{form.gst}%</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              {form.has_variants && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black  ">
                  {combinations.length} Variants
                </span>
              )}
              {form.batch_tracking && (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black  ">
                  Batch Tracked
                </span>
              )}
              {form.serial_tracking && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black  ">
                  Serial Tracked
                </span>
              )}
              {isInitialStockActive && totalOpeningStock > 0 && (
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[9px] font-black shadow-xs">
                  Opening Stock: {totalOpeningStock} units
                </span>
              )}
            </div>
          </div>

          {!form.has_variants && !form.batch_tracking && form.serial_tracking && isInitialStockActive && Number(form.opening_stock) > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <ScanLine size={15} className="text-violet-600" />
                  {config.serialLabel || "Serial"} Numbers ({simpleSerials.length}/{form.opening_stock})
                </span>
                {simpleSerials.length === Number(form.opening_stock) ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ All Registered
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {Number(form.opening_stock) - simpleSerials.length} Missing
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                {simpleSerials.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-mono font-bold rounded border border-violet-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!form.has_variants && form.batch_tracking && batches.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Batch Summary</h3>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {batches.length} Batch{batches.length !== 1 ? "es" : ""}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {batches.map((batch, bIdx) => (
                  <div key={batch.id} className="p-3.5 space-y-2 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                          {bIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{batch.name || `Batch #${bIdx + 1}`}</span>
                        {isInitialStockActive && Number(batch.stocks) > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            Stock: {batch.stocks}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          Buy: ₹{batch.buy_price || form.buy_price || "0"} • Sell: ₹{batch.sell_price || form.sell_price || form.mrp || "0"}
                        </span>
                      </div>
                      {form.serial_tracking && isInitialStockActive && Number(batch.stocks) > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          (batch.serial_numbers || []).length === Number(batch.stocks)
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {(batch.serial_numbers || []).length === Number(batch.stocks)
                            ? `✓ ${(batch.serial_numbers || []).length} Serials`
                            : `Serials: ${(batch.serial_numbers || []).length}/${batch.stocks}`}
                        </span>
                      )}
                    </div>
                    {form.serial_tracking && isInitialStockActive && (batch.serial_numbers || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar pt-1">
                        {(batch.serial_numbers || []).map((sn, sIdx) => (
                          <span key={sIdx} className="px-1.5 py-0.5 bg-violet-50 text-violet-700 text-[9px] font-mono font-bold rounded border border-violet-100">
                            {sn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.has_variants && combinations.filter(c => c.active).length > 0 && (
            <div className="bg-white rounded-lg md:rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Variants Details</h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {combinations.filter(c => c.active).length} Active
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {combinations.filter(c => c.active).map((combo, idx) => (
                  <div key={combo.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 tracking-tight">
                            {Object.values(combo.attributes).join(" / ")}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[9px] font-bold text-slate-400">SKU: {combo.barcode || "N/A"}</span>
                            <span className="text-[9px] font-bold text-slate-600 font-mono">
                              Buy: ₹{combo.buy_price || form.buy_price || "0"} • Sell: ₹{combo.price || form.sell_price || form.mrp || "0"}
                            </span>
                            {isInitialStockActive && Number(combo.stock) > 0 && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                Stock: {combo.stock}
                              </span>
                            )}
                            {form.batch_tracking && combo.batch?.name && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                Batch: {combo.batch.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {form.serial_tracking && isInitialStockActive && Number(combo.stock) > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          (combo.serial_numbers || []).length === Number(combo.stock)
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {(combo.serial_numbers || []).length === Number(combo.stock)
                            ? `✓ ${(combo.serial_numbers || []).length} Serials`
                            : `Serials: ${(combo.serial_numbers || []).length}/${combo.stock}`}
                        </span>
                      )}
                    </div>
                    {form.serial_tracking && isInitialStockActive && (combo.serial_numbers || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar pl-11">
                        {(combo.serial_numbers || []).map((sn, sIdx) => (
                          <span key={sIdx} className="px-1.5 py-0.5 bg-violet-50 text-violet-700 text-[9px] font-mono font-bold rounded border border-violet-100">
                            {sn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {creationError ? (
            <div className="p-4 md:p-5 rounded-xl bg-rose-50 border border-rose-200 flex gap-3 md:gap-4 items-start animate-in fade-in duration-200">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-rose-600 shadow-sm shrink-0 border border-rose-100">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-rose-900">Creation Failed</p>
                <p className="text-[11px] font-semibold text-rose-700 leading-relaxed">
                  {creationError}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6 rounded-lg md:rounded-lg bg-emerald-50/50 border border-emerald-100 flex gap-3 md:gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-emerald-900  ">Ready for Creation</p>
                <p className="text-[10px] font-bold text-emerald-700 leading-relaxed  ">
                  Click complete below to finalize the registration of this product into your inventory.
                </p>
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  const handleSubmit = async () => {
    if (!form.name) return showToast("Product name is required", "error");
    if (!form.category) return showToast("Category is required", "error");
    if (!form.unit) return showToast("Unit is required", "error");

    const parsedMrp = form.mrp && !isNaN(Number(form.mrp)) && Number(form.mrp) > 0 ? Number(form.mrp) : null;
    const parsedSellPrice = form.sell_price && !isNaN(Number(form.sell_price)) && Number(form.sell_price) > 0 ? Number(form.sell_price) : parsedMrp;
    const parsedBuyPrice = form.buy_price && !isNaN(Number(form.buy_price)) ? Number(form.buy_price) : 0;

    // Selling price vs MRP validation
    if (parsedMrp && parsedSellPrice && parsedSellPrice > parsedMrp) {
      return showToast(`Selling price (₹${parsedSellPrice}) cannot exceed MRP (₹${parsedMrp})`, "error");
    }

    if (form.has_variants) {
      for (const combo of combinations.filter(c => c.active)) {
        const cMrp = combo.mrp && !isNaN(Number(combo.mrp)) && Number(combo.mrp) > 0 ? Number(combo.mrp) : parsedMrp;
        const cSell = combo.price && !isNaN(Number(combo.price)) ? Number(combo.price) : parsedSellPrice;
        if (cMrp && cSell && cSell > cMrp) {
          const varLabel = Object.values(combo.attributes).join(" / ") || "variant";
          return showToast(`Selling price (₹${cSell}) cannot exceed MRP (₹${cMrp}) for variant "${varLabel}"`, "error");
        }
      }
    }

    if (form.batch_tracking && !form.has_variants) {
      if (batches.some(b => !b.name.trim())) {
        return showToast("Please provide a Batch Number for each batch", "error");
      }
    }

    if (form.has_variants && form.batch_tracking) {
      for (const combo of combinations.filter(c => c.active)) {
        if (combo.stock && Number(combo.stock) > 0 && !combo.batch?.name?.trim()) {
          const varLabel = Object.values(combo.attributes).join(" / ") || "variant";
          return showToast(`Please provide a Batch Number for variant "${varLabel}"`, "error");
        }
      }
    }

    // Opening Stock validations
    if (isInitialStockActive) {
      if (!form.has_variants && !form.batch_tracking) {
        const numStock = Number(form.opening_stock) || 0;
        if (numStock <= 0) {
          return showToast("Opening stock is mandatory and must be greater than 0 for initial stock.", "error");
        }
        if (!shouldHideBuyPrice && (!parsedBuyPrice || parsedBuyPrice <= 0)) {
          return showToast("Buy price is mandatory and must be greater than 0 for initial stock.", "error");
        }
        if (!parsedSellPrice || parsedSellPrice <= 0) {
          return showToast("Sell price is mandatory and must be greater than 0 for initial stock.", "error");
        }
      }

      if (!form.has_variants && form.batch_tracking) {
        if (batches.length === 0) {
          return showToast("At least one batch is required", "error");
        }
        for (let i = 0; i < batches.length; i++) {
          const b = batches[i];
          const batchName = b.name.trim() || `Batch #${i + 1}`;
          if (!b.name.trim()) {
            return showToast("Please provide a Batch Number for each batch", "error");
          }
          const req = Number(b.stocks) || 0;
          if (req <= 0) {
            return showToast(`Opening stock is mandatory and must be greater than 0 for batch "${batchName}".`, "error");
          }
          const bBuy = b.buy_price && !isNaN(Number(b.buy_price)) ? Number(b.buy_price) : parsedBuyPrice;
          const bSell = b.sell_price && !isNaN(Number(b.sell_price)) ? Number(b.sell_price) : parsedSellPrice;
          if (!shouldHideBuyPrice && (!bBuy || bBuy <= 0)) {
            return showToast(`Buy price is mandatory and must be greater than 0 for batch "${batchName}".`, "error");
          }
          if (!bSell || bSell <= 0) {
            return showToast(`Sell price is mandatory and must be greater than 0 for batch "${batchName}".`, "error");
          }
        }
      }

      if (form.has_variants) {
        const activeCombos = combinations.filter(c => c.active);
        if (activeCombos.length === 0) {
          return showToast("At least one variant must be enabled and active", "error");
        }
        for (const combo of activeCombos) {
          const varLabel = Object.values(combo.attributes).join(" / ") || "variant";
          const req = Number(combo.stock) || 0;
          if (req <= 0) {
            return showToast(`Opening stock is mandatory and must be greater than 0 for variant "${varLabel}".`, "error");
          }
          const cBuy = combo.buy_price && !isNaN(Number(combo.buy_price)) ? Number(combo.buy_price) : parsedBuyPrice;
          const cSell = combo.price && !isNaN(Number(combo.price)) ? Number(combo.price) : parsedSellPrice;
          if (!shouldHideBuyPrice && (!cBuy || cBuy <= 0)) {
            return showToast(`Buy price is mandatory and must be greater than 0 for variant "${varLabel}".`, "error");
          }
          if (!cSell || cSell <= 0) {
            return showToast(`Sell price is mandatory and must be greater than 0 for variant "${varLabel}".`, "error");
          }
          if (form.batch_tracking && !combo.batch?.name?.trim()) {
            return showToast(`Please provide a Batch Number for variant "${varLabel}"`, "error");
          }
        }
      }
    }

    if (form.serial_tracking && isInitialStockActive) {
      if (!form.has_variants && !form.batch_tracking) {
        const req = Number(form.opening_stock) || 0;
        if (req > 0 && simpleSerials.length !== req) {
          return showToast(`Please enter all ${req} ${config.serialLabel || "serial number"}s (currently ${simpleSerials.length}/${req})`, "error");
        }
      }

      if (!form.has_variants && form.batch_tracking) {
        for (let i = 0; i < batches.length; i++) {
          const b = batches[i];
          const req = Number(b.stocks) || 0;
          const count = (b.serial_numbers || []).length;
          if (req > 0 && count !== req) {
            const batchName = b.name.trim() || `Batch #${i + 1}`;
            return showToast(`Please enter all ${req} ${config.serialLabel || "serial number"}s for batch "${batchName}" (currently ${count}/${req})`, "error");
          }
        }
      }

      if (form.has_variants) {
        for (const combo of combinations.filter(c => c.active)) {
          const req = Number(combo.stock) || 0;
          const count = (combo.serial_numbers || []).length;
          if (req > 0 && count !== req) {
            const varLabel = Object.values(combo.attributes).join(" / ") || "variant";
            return showToast(`Please enter all ${req} ${config.serialLabel || "serial number"}s for variant "${varLabel}" (currently ${count}/${req})`, "error");
          }
        }
      }
    }

    setSubmitting(true);
    try {
      const mappedVariants = form.has_variants ? combinations.filter(c => c.active).map(combo => {
        const variantName = Object.values(combo.attributes).join(" / ");

        const vData: any = {
          name: variantName,
          barcode: combo.barcode?.trim() || null,
          sku: combo.sku?.trim() || combo.barcode?.trim() || null,
          storage_location: combo.location?.trim() || form.location || null,
          reorder_point: Number(combo.reorder_point) || Number(form.reorder_point) || 1,
          buy_price: combo.buy_price && !isNaN(Number(combo.buy_price)) ? Number(combo.buy_price) : (parsedBuyPrice || 0),
          buy_price_tax_inclusive: true,
          cost_price_tax_inclusive: true,
          cost_tax_type: "inclusive",
          pricing_tax_type: "inclusive",
          sell_price: combo.price && !isNaN(Number(combo.price)) ? Number(combo.price) : (parsedSellPrice || parsedMrp || 0),
          online_sell_price: combo.price && !isNaN(Number(combo.price)) ? Number(combo.price) : (parsedSellPrice || parsedMrp || 0),
          mrp: combo.mrp && !isNaN(Number(combo.mrp)) ? Number(combo.mrp) : parsedMrp,
          visible_online: false,
        };

        if (isInitialStockActive && combo.stock && Number(combo.stock) > 0) {
          vData.stocks = Number(combo.stock);
          if (form.serial_tracking && combo.serial_numbers && combo.serial_numbers.length > 0) {
            vData.serial_numbers = combo.serial_numbers;
          }
        }

        if (form.batch_tracking) {
          if (combo.batches && combo.batches.length > 0) {
            vData.batches = combo.batches.map(b => ({
              name: b.name.trim(),
              manufacturing_date: b.manufacturing_date || undefined,
              expiry_date: b.expiry_date || undefined,
              stocks: isInitialStockActive && b.stocks ? Number(b.stocks) : undefined,
              buy_price: b.buy_price && !isNaN(Number(b.buy_price)) ? Number(b.buy_price) : (vData.buy_price || undefined),
              buy_price_tax_inclusive: true,
              cost_price_tax_inclusive: true,
              cost_tax_type: "inclusive",
              pricing_tax_type: "inclusive",
              sell_price: b.sell_price && !isNaN(Number(b.sell_price)) ? Number(b.sell_price) : (vData.sell_price || undefined),
              serial_numbers: isInitialStockActive && form.serial_tracking ? (b.serial_numbers || combo.serial_numbers) : undefined,
            }));
          } else if (combo.batch?.name?.trim()) {
            vData.batches = [{
              name: combo.batch.name.trim(),
              manufacturing_date: combo.batch.manufacturing_date || undefined,
              expiry_date: combo.batch.expiry_date || undefined,
              stocks: isInitialStockActive && combo.stock ? Number(combo.stock) : undefined,
              buy_price: combo.batch.buy_price && !isNaN(Number(combo.batch.buy_price)) ? Number(combo.batch.buy_price) : (vData.buy_price || undefined),
              buy_price_tax_inclusive: true,
              cost_price_tax_inclusive: true,
              cost_tax_type: "inclusive",
              pricing_tax_type: "inclusive",
              sell_price: combo.batch.sell_price && !isNaN(Number(combo.batch.sell_price)) ? Number(combo.batch.sell_price) : (vData.sell_price || undefined),
              serial_numbers: isInitialStockActive && form.serial_tracking ? (combo.batch.serial_numbers || combo.serial_numbers) : undefined,
            }];
          }
        }

        return vData;
      }) : null;

      const payload: any = {
        shop_id: SHOP_ID,
        category_id: form.category,
        unit_id: form.unit,
        name: form.name,
        brand: form.brand || null,
        description: form.description,
        barcode: (form.barcode && form.barcode.trim() !== "") ? form.barcode : null,
        type_infos: {
          has_batch: form.batch_tracking,
          has_variant: form.has_variants,
          has_serialno: form.serial_tracking,
        },
        have_tracking: true,
        is_active: isInitialStockActive ? true : form.is_active,
        ...(isInitialStockActive ? { is_initial_stock: true } : {}),
        variant_types: form.has_variants ? variantTypes.map(vt => ({ name: vt.name, values: vt.values })) : null,
        variant_infos: mappedVariants,
        storage_location: form.location || null,
        buy_price: parsedBuyPrice,
        buy_price_tax_inclusive: true,
        cost_price_tax_inclusive: true,
        cost_tax_type: "inclusive",
        pricing_tax_type: "inclusive",
        sell_price: parsedSellPrice,
        online_sell_price: parsedSellPrice || 0,
        mrp: parsedMrp,
        gst: form.gst ? (form.gst.includes("%") ? form.gst : `${form.gst}%`) : "18%",
        reorder_point: Number(form.reorder_point) || 1,
        visible_online: false,
        custom_fields: {
          brand: form.brand,
          mrp: parsedMrp || 0,
          sell_price: parsedSellPrice,
          buy_price: parsedBuyPrice,
          cost_to_make: parsedBuyPrice,
          buy_price_tax_inclusive: true,
          cost_price_tax_inclusive: true,
          cost_tax_type: "inclusive",
          pricing_tax_type: "inclusive",
          hsn: form.hsn,
          sku: "",
          supplier: "",
          opening_stock: isInitialStockActive && form.opening_stock ? Number(form.opening_stock) : 0,
          is_active: isInitialStockActive ? true : form.is_active,
          variant_types: form.has_variants ? variantTypes : [],
          ...(!form.has_variants && form.serial_tracking && simpleSerials.length > 0 ? { serial_numbers: simpleSerials } : {}),
        }
      };

      if (isInitialStockActive && !form.has_variants && !form.batch_tracking && form.opening_stock && Number(form.opening_stock) > 0) {
        payload.stocks = Number(form.opening_stock);
        if (form.serial_tracking && simpleSerials.length > 0) {
          payload.serial_numbers = simpleSerials;
        }
      }

      if (!form.has_variants && form.batch_tracking) {
        const validBatches = batches.filter(b => b.name.trim()).map(b => ({
          name: b.name.trim(),
          manufacturing_date: b.manufacturing_date || undefined,
          expiry_date: b.expiry_date || undefined,
          stocks: isInitialStockActive && b.stocks ? Number(b.stocks) : undefined,
          buy_price: b.buy_price && !isNaN(Number(b.buy_price)) ? Number(b.buy_price) : (parsedBuyPrice || undefined),
          buy_price_tax_inclusive: true,
          cost_price_tax_inclusive: true,
          cost_tax_type: "inclusive",
          pricing_tax_type: "inclusive",
          sell_price: b.sell_price && !isNaN(Number(b.sell_price)) ? Number(b.sell_price) : (parsedSellPrice || undefined),
          serial_numbers: isInitialStockActive && form.serial_tracking && b.serial_numbers && b.serial_numbers.length > 0 ? b.serial_numbers : undefined,
        }));
        if (validBatches.length > 0) {
          payload.batches = validBatches;
        }
      }

      const res = await postData(ENDPOINTS.INVENTORIES, payload);

      if (res) {
        window.dispatchEvent(new CustomEvent('clear-api-cache'));
        const successMsg = isInitialStockActive && totalOpeningStock > 0
          ? `Product created successfully with ${totalOpeningStock} units opening stock!`
          : "Product created successfully";
        showSuccess(successMsg);
        const createdProduct = res.data || res;

        // Inject names so the caller can use them
        const selectedCat = categories.find(c => c.id === form.category);
        const selectedUnit = units.find(u => u.id === form.unit);

        if (selectedCat) createdProduct.category_name = selectedCat.name;
        if (selectedUnit) createdProduct.unit_name = selectedUnit.name;
        if (parsedMrp !== null) {
          createdProduct.mrp = parsedMrp;
          if (!createdProduct.custom_fields) createdProduct.custom_fields = {};
          createdProduct.custom_fields.mrp = parsedMrp;
        }
        if (parsedSellPrice !== null) {
          createdProduct.sell_price = parsedSellPrice;
          if (!createdProduct.custom_fields) createdProduct.custom_fields = {};
          createdProduct.custom_fields.sell_price = parsedSellPrice;
        }
        if (parsedBuyPrice !== null) {
          createdProduct.buy_price = parsedBuyPrice;
          if (!createdProduct.custom_fields) createdProduct.custom_fields = {};
          createdProduct.custom_fields.buy_price = parsedBuyPrice;
        }
        if (form.gst) {
          createdProduct.gst = form.gst;
        }

        onSuccess(createdProduct);
        onClose();
      } else {
        const errorMsg = getLastError?.() || "Failed to create product. Please check your data and try again.";
        setCreationError(errorMsg);
        showError(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error?.message || getLastError?.() || "Failed to create product";
      setCreationError(errorMsg);
      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <QuickCreateModal
        isOpen={isOpen}
        onClose={onClose}
        title="Create New Product"
        steps={steps}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        submitLabel="Complete Creation"
        size="xl"
        onBeforeNext={handleBeforeNext}
      />
      <QuickCreateDropdownModal
        isOpen={modalState.type !== null}
        onClose={() => setModalState({ type: null, query: "" })}
        type={modalState.type as "Category" | "Unit"}
        onSuccess={async (newItem) => {
          await fetchDropdowns();
          if (modalState.type === "Category") {
            setForm((prev) => ({ ...prev, category: newItem.id }));
          } else if (modalState.type === "Unit") {
            setForm((prev) => ({ ...prev, unit: newItem.id }));
          }
          setModalState({ type: null, query: "" });
        }}
      />
    </>
  );
};

