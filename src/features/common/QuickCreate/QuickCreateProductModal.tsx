import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Zap,
  BarChart2,
  Layers,
  CheckCircle2,
  Barcode,
  ChevronDown,
  Plus,
  X
} from "lucide-react";
import { QuickCreateModal, QuickCreateStep } from "./QuickCreateModal";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";

import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
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
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!value.trim()) return;
    setLoading(true);

    try {
      if (type === "Category") {
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
      showToast(`Failed to create ${type}`, "error");
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
        <div className="p-5">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name</label>
          <input
            type="text"
            autoFocus
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            placeholder={`e.g. ${type === "Category" ? "Beverages" : "Box"}`}
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

interface QuickCreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess: (product: any) => void;
}

export const QuickCreateProductModal: React.FC<QuickCreateProductModalProps> = ({
  isOpen,
  onClose,
  initialName = "",
  onSuccess,
}) => {
  const { postData } = useApi();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
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
    if (isOpen) {
      fetchDropdowns();
    }
  }, [isOpen]);

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
    reorder_point: "5",
    location: "",
    batch_tracking: false,
    serial_tracking: false,
    has_variants: false,
    batch_name: "",
    mfg_date: "",
    exp_date: "",
  });

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
    const { name, value } = e.target;
    if (name === "gst") {
      const sanitized = value.replace(/[^0-9.]/g, "");
      setForm((prev) => ({ ...prev, gst: sanitized }));
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
        { buy_price: form.buy_price, sell_price: form.sell_price, mrp: form.mrp, reorder_point: form.reorder_point || "5" }
      ));
    }
  }, [variantTypes, form.has_variants, form.buy_price, form.sell_price, form.mrp, form.reorder_point]);

  const steps: QuickCreateStep[] = [
    {
      id: 1,
      title: "Product Identity",
      subtitle: "Basic identification",
      isValid: !!form.name,
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
              <label className="text-[10px] font-black text-slate-400 ml-1 block mb-1">Barcode / SKU</label>
              <div className="relative">
                <input
                  name="barcode"
                  value={form.barcode}
                  onChange={handleChange}
                  placeholder="Scan or type"
                  className="w-full h-10 px-3 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
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
                  <div className="absolute bottom-[-6px] right-4 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
                </div>
              )}
            </div>
            <Input label="Brand" name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Apple" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-1">Category</label>
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-1">Unit</label>
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
            <div className="space-y-1.5">
              <Input
                label="GST Rate"
                name="gst"
                value={form.gst}
                onChange={handleChange}
                placeholder="e.g. 18"
                rightIcon="%"
                required
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Tracking & Inventory",
      subtitle: "Management settings",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Reorder Point" type="number" name="reorder_point" value={form.reorder_point} onChange={handleChange} />
            <Input label="Storage Location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Aisle 4, Shelf B" />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                  <BarChart2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 tracking-tight">Batch Tracking</p>
                  <p className="text-[10px] font-bold text-slate-400">Track expiry & manufacture</p>
                </div>
              </div>
              <Switch checked={form.batch_tracking} onCheckedChange={(val) => setForm(f => ({ ...f, batch_tracking: val }))} />
            </div>

            <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-violet-600 shadow-sm border border-slate-100">
                  <Layers size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 tracking-tight">Serial Tracking</p>
                  <p className="text-[10px] font-bold text-slate-400">Track unique IDs / IMEIs</p>
                </div>
              </div>
              <Switch checked={form.serial_tracking} onCheckedChange={(val) => setForm(f => ({ ...f, serial_tracking: val }))} />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Variants",
      subtitle: "Product attributes & combinations",
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 md:p-5 rounded-lg bg-indigo-50 border border-indigo-100 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-indigo-900 tracking-tight">Enable Variants</p>
                <p className="text-[10px] font-bold text-indigo-400">Multiple sizes, colors, etc.</p>
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
                <div className="pt-4 border-t border-slate-100">
                  <VariantMatrixTable
                    combinations={combinations}
                    variantTypes={variantTypes}
                    onChange={setCombinations}
                  />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/60">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400">Tax (GST)</p>
                <p className="text-sm font-bold text-slate-700">{form.gst}%</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              {form.has_variants && (
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black  ">
                  {combinations.length} Variants
                </span>
              )}
              {form.batch_tracking && (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black  ">
                  Batch Tracked
                </span>
              )}
              {form.serial_tracking && (
                <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[9px] font-black  ">
                  Serial Tracked
                </span>
              )}
            </div>
          </div>

          {form.has_variants && combinations.filter(c => c.active).length > 0 && (
            <div className="bg-white rounded-lg md:rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400  ">Active Variants Details</h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {combinations.filter(c => c.active).length} Active
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {combinations.filter(c => c.active).map((combo, idx) => (
                  <div key={combo.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800  tracking-tight">
                          {Object.values(combo.attributes).join(" / ")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-400  ">SKU: {combo.barcode || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 md:p-6 rounded-lg md:rounded-lg bg-blue-50/50 border border-blue-100 flex gap-3 md:gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-blue-800  ">Ready for Creation</p>
              <p className="text-[10px] font-bold text-blue-600 leading-relaxed  ">
                Click complete below to finalize the registration of this product into your inventory.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleSubmit = async () => {
    if (!form.name) return showToast("Product name is required", "error");
    if (!form.category) return showToast("Category is required", "error");
    if (!form.unit) return showToast("Unit is required", "error");

    setSubmitting(true);
    try {
      const mappedVariants = form.has_variants ? combinations.filter(c => c.active).map(combo => {
        const variantName = Object.values(combo.attributes).join(" / ");

        const vData: any = {
          name: variantName,
          storage_location: form.location || null,
          reorder_point: Number(combo.reorder_point) || 5,
          buy_price: 0,
          sell_price: 0,
          visible_online: false,
        };

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
        variant_types: form.has_variants ? variantTypes.map(vt => ({ name: vt.name, values: vt.values })) : null,
        variant_infos: mappedVariants,
        storage_location: form.location || null,
        buy_price: null,
        sell_price: null,
        gst: form.gst ? (form.gst.includes("%") ? form.gst : `${form.gst}%`) : "18%",
        reorder_point: Number(form.reorder_point) || 5,
        visible_online: false,
        custom_fields: {
          brand: form.brand,
          mrp: 0,
          hsn: form.hsn,
          sku: "",
          supplier: "",
          opening_stock: 0,
          is_active: form.is_active,
          variant_types: form.has_variants ? variantTypes : [],
        }
      };

      const res = await postData(ENDPOINTS.INVENTORIES, payload);

      if (res) {
        showToast("Product created successfully", "success");
        const createdProduct = res.data || res;

        // Inject names so the caller can use them
        const selectedCat = categories.find(c => c.id === form.category);
        const selectedUnit = units.find(u => u.id === form.unit);

        if (selectedCat) createdProduct.category_name = selectedCat.name;
        if (selectedUnit) createdProduct.unit_name = selectedUnit.name;

        onSuccess(createdProduct);
        onClose();
      }
    } catch (error) {
      showToast("Failed to create product", "error");
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
      />
      <QuickCreateDropdownModal
        isOpen={modalState.type !== null}
        onClose={() => setModalState({ type: null, query: "" })}
        type={modalState.type as "Category" | "Unit"}
        onSuccess={(newItem) => {
          if (modalState.type === "Category") {
            setCategories((prev) => [newItem, ...prev]);
            setForm((prev) => ({ ...prev, category: newItem.id }));
          } else if (modalState.type === "Unit") {
            setUnits((prev) => [newItem, ...prev]);
            setForm((prev) => ({ ...prev, unit: newItem.id }));
          }
          setModalState({ type: null, query: "" });
        }}
      />
    </>
  );
};

