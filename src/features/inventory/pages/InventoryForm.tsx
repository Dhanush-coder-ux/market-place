import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Hash, 
  Calendar, 
  ListPlus, 
  Trash2, 
  Settings,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Input from "../../../components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import FieldLabel from "./Fieldlable";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import type { InventoryBatch, InventoryVariant } from "@/types/api";

const CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "grocery", label: "Grocery" },
  { value: "clothing", label: "Clothing" },
];

const InventoryForm = () => {
  const navigate = useNavigate();
  const { postData, loading: submitting, error } = useApi();
  const { setBottomActions } = useHeader();

  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    description: "",
    category: "",
    image: null as File | null,
    
    // Feature Toggles
    has_variant: false,
    has_batch: false,
    has_serialno: false,
    
    // Complex Data
    serial_numbers: [] as string[],
    batch: {
      name: "",
      manufacturing_date: "",
      expiry_date: ""
    } as InventoryBatch,
    variants: [] as InventoryVariant[]
  });



  const [errors, setErrors] = useState({
    barcode: false,
    name: false,
    category: false,
  });



  const validate = (): boolean => {
    const newErrors = {
      barcode: !formData.barcode,
      name: !formData.name,
      category: !formData.category,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const payload: any = {
      shop_id: SHOP_ID,
      barcode: formData.barcode,
      name: formData.name,
      category: formData.category,
      description: formData.description,
      buy_price: 0,
      sell_price: 0,
      stocks: 0,
      
      has_variant: formData.has_variant,
      has_serialno: formData.has_serialno,
      has_batch: formData.has_batch,
      
      datas: {} // Optional generic data
    };

    // No initial data for serial numbers or batch when creating
    if (formData.has_serialno) {
      payload.serial_numbers = [];
    }

    if (formData.has_batch) {
      payload.batch = null;
    }

    if (formData.has_variant) {
      payload.variants = formData.variants;
    }

    const res = await postData(ENDPOINTS.INVENTORIES, payload);
    if (res) navigate("/inventory");
  };



  const addVariant = () => {
    const newVariant: InventoryVariant = {
      name: "",
      buy_price: 0,
      sell_price: 0,
      stocks: 0,
    };
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: keyof InventoryVariant, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }));
  };

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        <button
          type="button"
          onClick={() => navigate("/inventory")}
          className="px-6 h-11 rounded-lg border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all"
        >
          Discard Draft
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

  return (
    <form className="mx-auto space-y-10 p-6 bg-white" onSubmit={handleSubmit}>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      {/* SECTION 2: TRACKING & VARIANTS CONFIGURATION */}
      <section className="bg-slate-50/50 p-8 rounded-lg border border-slate-100 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16" />
        <div className="flex items-center gap-3 border-b border-slate-100 pb-6 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-800  ">Tracking Configuration</h3>
            <p className="text-[11px] font-bold text-slate-400">Enable advanced product features</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {[
            { id: 'has_variant', label: 'Product Variants', icon: ListPlus, desc: 'Sizes, Colors, etc.' },
            { id: 'has_serialno', label: 'Serial Tracking', icon: Hash, desc: 'Unique ID per unit' },
            { id: 'has_batch', label: 'Batch Tracking', icon: Calendar, desc: 'Expiry & Mfg dates' }
          ].map(feature => (
            <button
              key={feature.id}
              type="button"
              onClick={() => setFormData(p => ({ ...p, [feature.id]: !p[feature.id as keyof typeof p] }))}
              className={`flex items-start gap-4 p-5 rounded-lg border md:transition-all text-left ${
                formData[feature.id as keyof typeof formData] 
                  ? "bg-white border-indigo-200 shadow-sm ring-4 ring-indigo-50" 
                  : "bg-white/50 border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className={`p-2.5 rounded-lg ${formData[feature.id as keyof typeof formData] ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
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

      {/* SECTION 3: CONDITIONAL TRACKING DETAILS */}
      {/* SECTION 3: CONDITIONAL TRACKING DETAILS - REMOVED AS PER REQUEST */}

      {/* SECTION 4: VARIANTS OR BASIC LOGISTICS */}
      {formData.has_variant ? (
        <section className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-8">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ListPlus size={20} />
              </div>
              <h3 className="text-[10px] font-black text-slate-800  ">Variants Manager</h3>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black   hover:bg-indigo-700 md:transition-all shadow-md shadow-indigo-100"
            >
              <Plus size={14} /> Add Variant
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-[10px] font-black text-slate-400   text-left pb-4 px-2">Variant Name</th>
                  <th className="pb-4 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {formData.variants.map((v, i) => (
                  <tr key={i} className="group">
                    <td className="py-4 px-2">
                      <Input
                        value={v.name}
                        onChange={(e) => updateVariant(i, 'name', e.target.value)}
                        placeholder="e.g. XL / Blue"
                        className="h-10 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200"
                      />
                    </td>
                    <td className="py-4 px-2">
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="p-2 text-slate-300 hover:text-rose-500 md:transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {formData.variants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium italic text-xs">
                      No variants added. Click "Add Variant" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-slate-50/50 p-8 rounded-lg border border-slate-100 space-y-6 w-full">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-400">
                <Layers size={20} />
              </div>
              <h3 className="text-[10px] font-black text-slate-800  ">Inventory Classification</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <FieldLabel label="Category" required />
                <ReusableSelect
                  value={formData.category}
                  options={CATEGORIES}
                  onValueChange={(val) => setFormData((p) => ({ ...p, category: val }))}
                />
                {errors.category && <span className="text-xs text-red-500">Required</span>}
              </div>
            </div>
          </section>

          {/* Pricing Strategy section removed as per request */}
        </div>
      )}

    </form>
  );
};

export default InventoryForm;
