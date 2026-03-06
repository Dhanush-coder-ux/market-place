import React, { useState } from "react";
import { FileText, Layers, Package, Tag } from "lucide-react";
import { BiRupee } from "react-icons/bi";

import Input from "../../../components/ui/Input";
import { ReusableCombobox } from "@/components/ui/ReusableCombobox";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import ImageUpload from "@/components/common/ImageUpload";
import { GradientButton } from "@/components/ui/GradientButton";

import FieldLabel from "./Fieldlable"; 
import { FIELD_DESCRIPTIONS } from "../../../utils/constants";

const InventoryForm = () => {
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    description: "",
    currentStock: "",
    category: "",
    currentPrice: "",
    sellingPrice: "",
    image: null as File | null,
  });

  const [errors, setErrors] = useState({
    barcode: false,
    name: false,
    category: false,
    currentStock: false,
    currentPrice: false,
    sellingPrice: false,
  });

  const CATEGORIES = [
    { value: "electronics", label: "Electronics" },
    { value: "grocery", label: "Grocery" },
    { value: "clothing", label: "Clothing" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (value && errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  return (
    <form className="max-w-7xl mx-auto space-y-10 p-6 bg-white">
      
      {/* SECTION 1: PRIMARY IDENTIFICATION */}
      <section>
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-8">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Package className="text-indigo-600" size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Product Identity</h3>
            <p className="text-sm text-gray-500">Core details and visual representation.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Essential Inputs */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <FieldLabel
                  label="Barcode / SKU"
                  tooltip={FIELD_DESCRIPTIONS.barcode}
                  required
                />
                <ReusableCombobox
                  options={CATEGORIES}
                  value={formData.barcode}
                  onChange={(val) => {
                    setFormData((p) => ({ ...p, barcode: val }));
                    if (val) setErrors((e) => ({ ...e, barcode: false }));
                  }}
                  placeholder="Search or scan barcode"
                />
                {errors.barcode && <span className="text-xs text-red-500">Required</span>}
              </div>

              <div className="space-y-1.5">
                <FieldLabel
                  label="Product Name"
                  tooltip={FIELD_DESCRIPTIONS.name}
                  required
                />
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Premium Cotton Tee"
                  leftIcon={<Tag size={18} className="text-gray-400" />}
                  className={errors.name ? "border-red-500" : ""}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel
                label="Detailed Description"
                tooltip={FIELD_DESCRIPTIONS.description}
              />
              <div className="relative group">
                <FileText className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none resize-none"
                  placeholder="Describe material, dimensions, or key features..."
                />
              </div>
            </div>
          </div>

          {/* Right: Large Image Upload Preview */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <ImageUpload
                label="Product Showcase"
                value={formData.image}
                onChange={(file) => setFormData((prev) => ({ ...prev, image: file }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INVENTORY & LOGISTICS */}
      <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="text-gray-400" size={18} />
          <h4 className="font-bold text-gray-800 uppercase tracking-widest text-xs">Stock & Categorization</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <FieldLabel label="Category" tooltip={FIELD_DESCRIPTIONS.category} required />
            <ReusableSelect
              value={formData.category}
              options={CATEGORIES}
              onValueChange={(val) => setFormData((p) => ({ ...p, category: val }))}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel label="Initial Stock Level" tooltip={FIELD_DESCRIPTIONS.stock} required />
            <Input
              name="currentStock"
              value={formData.currentStock}
              onChange={handleInputChange}
              type="number"
              leftIcon={<Layers size={18} className="text-gray-400" />}
              placeholder="Quantity in hand"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: PRICING STRATEGY */}
      <section className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BiRupee className="text-gray-400" size={20} />
          <h4 className="font-bold text-gray-800 uppercase tracking-widest text-xs">Financial Configuration</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <FieldLabel label="Purchase Cost (Per Unit)" tooltip={FIELD_DESCRIPTIONS.buyingPrice} required />
            <Input
              name="currentPrice"
              value={formData.currentPrice}
              onChange={handleInputChange}
              type="number"
              leftIcon={<BiRupee className="text-gray-400" />}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel label="Market Selling Price" tooltip={FIELD_DESCRIPTIONS.sellingPrice} required />
            <Input
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleInputChange}
              type="number"
              leftIcon={<BiRupee className="text-gray-400" />}
              placeholder="0.00"
            />
          </div>
        </div>
      </section>

      {/* STICKY FOOTER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 border-t border-gray-100 bg-white">
        <button type="button" className="text-sm font-medium text-gray-400 hover:text-gray-600 px-4">
          Discard Draft
        </button>
        <div className="flex flex-wrap justify-center gap-3">
          <GradientButton variant="outline" className="border-gray-200">
            Save & Add New
          </GradientButton>
          <GradientButton className="shadow-lg shadow-indigo-200 min-w-[180px]">
            Confirm & Save Product
          </GradientButton>
        </div>
      </div>
    </form>
  );
};

export default InventoryForm;