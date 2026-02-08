import React, { useState } from "react";
import { FileText, Layers, Package, Tag } from "lucide-react";
import { BiRupee } from "react-icons/bi";

import Input from "../../../components/ui/Input";
import { ReusableCombobox } from "@/components/ui/ReusableCombobox";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import ImageUpload from "@/components/common/ImageUpload";
import { GradientButton } from "@/components/ui/GradientButton";

import FieldLabel from "./Fieldlable"; // Note: Check if filename is FieldLabel.tsx
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
    <form className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Header Section */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Package className="text-blue-600" size={20} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 tracking-tight">
          Product Details
        </h3>
      </div>

      {/* Primary Details Section */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Inputs */}
        <div className="flex-1 space-y-5">
          <div className="space-y-1">
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
              placeholder="Search or enter barcode"
            />
            {errors.barcode && (
              <span className="text-xs text-red-500 font-medium">Barcode is required</span>
            )}
          </div>

          <div className="space-y-1">
            <FieldLabel
              label="Product Name"
              tooltip={FIELD_DESCRIPTIONS.name}
              required
            />
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              leftIcon={<Tag size={18} className="text-gray-400" />}
              className={errors.name ? "border-red-500" : ""}
            />
          </div>
        </div>

        {/* Right Side: Image Upload */}
        <div className="w-full lg:w-72">
          <ImageUpload
            label="Product Image"
            value={formData.image}
            onChange={(file) => setFormData((prev) => ({ ...prev, image: file }))}
          />
        </div>
      </div>

      {/* Description Section */}
      <div className="space-y-1">
        <FieldLabel
          label="Description"
          tooltip={FIELD_DESCRIPTIONS.description}
        />
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            placeholder="Detailed product features and specifications..."
          />
        </div>
      </div>

      {/* Grid: Stock & Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-1">
          <FieldLabel
            label="Category"
            tooltip={FIELD_DESCRIPTIONS.category}
            required
          />
          <ReusableSelect
            value={formData.category}
            options={CATEGORIES}
            onValueChange={(val) =>
              setFormData((p) => ({ ...p, category: val }))
            }
          />
        </div>

        <div className="space-y-1">
          <FieldLabel
            label="Current Stock"
            tooltip={FIELD_DESCRIPTIONS.stock}
            required
          />
          <Input
            name="currentStock"
            value={formData.currentStock}
            onChange={handleInputChange}
            type="number"
            leftIcon={<Layers size={18} className="text-gray-400" />}
            placeholder="0"
          />
        </div>

        <div className="space-y-1">
          <FieldLabel
            label="Buying Price"
            tooltip={FIELD_DESCRIPTIONS.buyingPrice}
            required
          />
          <Input
            name="currentPrice"
            value={formData.currentPrice}
            onChange={handleInputChange}
            type="number"
            leftIcon={<BiRupee className="text-gray-400" />}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-1">
          <FieldLabel
            label="Selling Price"
            tooltip={FIELD_DESCRIPTIONS.sellingPrice}
            required
          />
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

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
        <GradientButton className="order-2 sm:order-1" variant="outline">
          Cancel
        </GradientButton>
        <GradientButton className="order-1 sm:order-2">
          Save & Add More
        </GradientButton>
        <GradientButton className="order-0 sm:order-3">
          Save Product
        </GradientButton>
      </div>
    </form>
  );
};

export default InventoryForm;