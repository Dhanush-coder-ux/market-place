import React, { useState, useEffect } from "react";
import {
  Hash,
  Calendar,
  ListPlus,
  Trash2,
  Settings,
  Plus,
  Package,
  IndianRupee,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Input from "../../../components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import FieldLabel from "./Fieldlable";
import { useApi } from "@/context/ApiContext";
import { SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { utilityApi } from "@/services/api/utility";
import { inventoryApi } from "@/services/api/inventory";
import type { CreateInventoryPayload, CreateProdInvVariant } from "@/features/inventory/types";

// ─── GST Options ──────────────────────────────────────────────────────────────
const GST_OPTIONS = [
  { value: "0%", label: "0% GST" },
  { value: "5%", label: "5% GST" },
  { value: "12%", label: "12% GST" },
  { value: "18%", label: "18% GST" },
  { value: "28%", label: "28% GST" },
];

// ─── InventoryForm Component ──────────────────────────────────────────────────

const InventoryForm = () => {
  const navigate = useNavigate();
  const { loading: submitting } = useApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();

  // ── Dropdown data from Utility Service ─────────────────────────────────────
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  useEffect(() => {
    const fetchDropdowns = async () => {
      setDropdownLoading(true);
      try {
        const [catRes, unitRes] = await Promise.all([
          utilityApi.getShopCategories(SHOP_ID),
          utilityApi.getShopUnits(SHOP_ID),
        ]);
        if (catRes?.data) {
          const cats = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.datas ?? []);
          setCategories(cats);
        }
        if (unitRes?.data) {
          const uns = Array.isArray(unitRes.data) ? unitRes.data : (unitRes.data?.datas ?? []);
          setUnits(uns);
        }
      } catch (e) {
        console.error("Failed to fetch dropdowns", e);
      } finally {
        setDropdownLoading(false);
      }
    };
    fetchDropdowns();
  }, []);

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const unitOptions = units.map((u) => ({ value: u.id, label: u.name }));

  // ── Form State ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    barcode: "",
    gst: "0%",
    buy_price: "",
    sell_price: "",
    reorder_point: "5",
    storage_location: "",
    category_id: "",
    unit_id: "",

    // Tracking toggles → type_infos
    has_variant: false,
    has_batch: false,
    has_serialno: false,

    // Variants
    variants: [] as CreateProdInvVariant[],
  });

  const [errors, setErrors] = useState({
    name: false,
    category_id: false,
    unit_id: false,
  });

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors = {
      name: !formData.name.trim(),
      category_id: !formData.category_id,
      unit_id: !formData.unit_id,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // ── Submit → CreateProdInvSchema ─────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const payload: CreateInventoryPayload = {
      shop_id: SHOP_ID,
      category_id: formData.category_id,
      unit_id: formData.unit_id,
      name: formData.name.trim(),
      description: formData.description.trim(),
      barcode: formData.barcode || undefined,
      gst: formData.gst || "0%",
      type_infos: {
        has_variant: formData.has_variant,
        has_batch: formData.has_batch,
        has_serialno: formData.has_serialno,
      },
      have_tracking: formData.has_variant || formData.has_batch || formData.has_serialno,
      buy_price: formData.buy_price ? Number(formData.buy_price) : undefined,
      sell_price: formData.sell_price ? Number(formData.sell_price) : undefined,
      reorder_point: Number(formData.reorder_point) || 5,
      storage_location: formData.storage_location || undefined,
    };

    // Attach variant infos when variant tracking is on
    if (formData.has_variant && formData.variants.length > 0) {
      payload.variant_infos = formData.variants;
    }

    try {
      const res = await inventoryApi.createInventory(payload);
      if (res) {
        showToast("Product created successfully", "success");
        navigate("/inventory");
      } else {
        showToast("Failed to create product", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to create product", "error");
    }
  };

  // ── Variant helpers ─────────────────────────────────────────────────────────
  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: "", reorder_point: 5 },
      ],
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariant = (index: number, field: keyof CreateProdInvVariant, value: any) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  // ── Bottom Actions ───────────────────────────────────────────────────────────
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        <button
          type="button"
          onClick={() => navigate("/inventory")}
          className="px-6 h-11 rounded-lg border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all"
        >
          Discard
        </button>
        <GradientButton
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg shadow-md text-xs px-8 h-11 flex items-center"
        >
          {submitting ? "Saving…" : "Confirm & Save Product"}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, submitting, formData]);

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <form className="mx-auto space-y-8 p-6 bg-white" onSubmit={handleSubmit}>

      {/* ── SECTION 1: PRODUCT IDENTITY ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50/60 to-transparent border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Package size={18} />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-800">Product Identity</h2>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Core product information</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Name */}
          <div className="lg:col-span-2">
            <FieldLabel label="Product Name" required />
            <Input
              name="name"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Premium Basmati Rice"
            />
            {errors.name && <p className="mt-1 text-[10px] text-rose-500 font-semibold">Product name is required</p>}
          </div>

          {/* Barcode */}
          <div>
            <FieldLabel label="Barcode / SKU" />
            <Input
              name="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData((p) => ({ ...p, barcode: e.target.value }))}
              placeholder="Scan or type barcode"
            />
          </div>

          {/* Category */}
          <div>
            <FieldLabel label="Category" required />
            <ReusableSelect
              key={`cat-${categories.length}`}
              value={formData.category_id}
              options={categoryOptions}
              onValueChange={(val) => setFormData((p) => ({ ...p, category_id: val }))}
              placeholder={dropdownLoading ? "Loading…" : "Select category"}
            />
            {errors.category_id && <p className="mt-1 text-[10px] text-rose-500 font-semibold">Category is required</p>}
          </div>

          {/* Unit */}
          <div>
            <FieldLabel label="Unit of Measure" required />
            <ReusableSelect
              key={`unit-${units.length}`}
              value={formData.unit_id}
              options={unitOptions}
              onValueChange={(val) => setFormData((p) => ({ ...p, unit_id: val }))}
              placeholder={dropdownLoading ? "Loading…" : "Select unit (e.g. Piece, Kg)"}
            />
            {errors.unit_id && <p className="mt-1 text-[10px] text-rose-500 font-semibold">Unit is required</p>}
          </div>

          {/* GST */}
          <div>
            <FieldLabel label="GST Rate" />
            <ReusableSelect
              value={formData.gst}
              options={GST_OPTIONS}
              onValueChange={(val) => setFormData((p) => ({ ...p, gst: val }))}
              placeholder="Select GST %"
            />
          </div>

          {/* Description */}
          <div className="lg:col-span-3">
            <FieldLabel label="Description" />
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Brief product description…"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none bg-slate-50/30 transition-all"
            />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: TRACKING CONFIGURATION ── */}
      <section className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16" />
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Settings size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800">Tracking Configuration</h3>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Enable advanced product tracking features</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {[
            { id: "has_variant", label: "Product Variants", icon: ListPlus, desc: "Sizes, Colors, etc." },
            { id: "has_serialno", label: "Serial Tracking", icon: Hash, desc: "Unique ID per unit" },
            { id: "has_batch", label: "Batch Tracking", icon: Calendar, desc: "Expiry & Mfg dates" },
          ].map((feature) => (
            <button
              key={feature.id}
              type="button"
              onClick={() =>
                setFormData((p) => ({ ...p, [feature.id]: !p[feature.id as keyof typeof p] }))
              }
              className={`flex items-start gap-4 p-5 rounded-xl border transition-all text-left ${formData[feature.id as keyof typeof formData]
                  ? "bg-white border-indigo-200 shadow-sm ring-4 ring-indigo-50"
                  : "bg-white/50 border-slate-100 hover:border-slate-200"
                }`}
            >
              <div
                className={`p-2.5 rounded-lg ${formData[feature.id as keyof typeof formData]
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-400"
                  }`}
              >
                <feature.icon size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">{feature.label}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{feature.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: PRICING & STOCK ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/60 to-transparent border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
            <IndianRupee size={18} />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-800">Pricing & Stock</h2>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Set initial pricing and reorder point</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <FieldLabel label="Buy Price (Cost)" />
            <Input
              type="number"
              name="buy_price"
              value={formData.buy_price}
              onChange={(e) => setFormData((p) => ({ ...p, buy_price: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <FieldLabel label="Sell Price (MRP)" />
            <Input
              type="number"
              name="sell_price"
              value={formData.sell_price}
              onChange={(e) => setFormData((p) => ({ ...p, sell_price: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <FieldLabel label="Reorder Point" />
            <Input
              type="number"
              name="reorder_point"
              value={formData.reorder_point}
              onChange={(e) => setFormData((p) => ({ ...p, reorder_point: e.target.value }))}
              placeholder="5"
            />
          </div>
          <div>
            <FieldLabel label="Storage Location" />
            <Input
              name="storage_location"
              value={formData.storage_location}
              onChange={(e) => setFormData((p) => ({ ...p, storage_location: e.target.value }))}
              placeholder="e.g. Shelf B-3"
              leftIcon={<MapPin size={14} className="text-slate-400" />}
            />
          </div>
        </div>
      </section>

      {/* ── SECTION 4: VARIANTS (conditional) ── */}
      {formData.has_variant && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-50/60 to-transparent border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ListPlus size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800">Variants Manager</h3>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Define product variants (e.g. sizes, colors)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              <Plus size={14} /> Add Variant
            </button>
          </div>

          <div className="p-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-[10px] font-black text-slate-400 text-left pb-3 px-2">Variant Name</th>
                  <th className="text-[10px] font-black text-slate-400 text-left pb-3 px-2">Buy Price</th>
                  <th className="text-[10px] font-black text-slate-400 text-left pb-3 px-2">Sell Price</th>
                  <th className="text-[10px] font-black text-slate-400 text-left pb-3 px-2">Reorder Pt</th>
                  <th className="pb-3 px-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {formData.variants.map((v, i) => (
                  <tr key={i} className="group">
                    <td className="py-3 px-2">
                      <Input
                        value={v.name}
                        onChange={(e) => updateVariant(i, "name", e.target.value)}
                        placeholder="e.g. XL / Blue"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        value={String(v.buy_price ?? "")}
                        onChange={(e) => updateVariant(i, "buy_price", Number(e.target.value))}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        value={String(v.sell_price ?? "")}
                        onChange={(e) => updateVariant(i, "sell_price", Number(e.target.value))}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        value={String(v.reorder_point ?? 5)}
                        onChange={(e) => updateVariant(i, "reorder_point", Number(e.target.value))}
                        placeholder="5"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {formData.variants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-medium italic text-xs">
                      No variants added yet. Click "Add Variant" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </form>
  );
};

export default InventoryForm;
