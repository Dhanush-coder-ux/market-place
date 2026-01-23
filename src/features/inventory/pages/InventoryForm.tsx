import React, { useState } from "react";
import { FileText, Layers, Package, Tag } from "lucide-react";
import { BiRupee } from "react-icons/bi";
import Input from "../../../components/ui/Input";
import { ReusableCombobox } from "@/components/ui/ReusableCombobox";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import ImageUpload from "@/components/common/ImageUpload";
import { GradientButton } from "@/components/ui/GradientButton";

import { DynamicKeyValueSettings, KeyValueField } from "@/components/ui/DynamicKeyValueSettings";
import { arrayToRecord } from "@/utils/form-helpers";
import { Required } from "@/components/ui/Require";



const InventoryForm = () => {
  // 2. Main Form State
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

  // 3. Dynamic Fields State (For Attributes like Color, Size)
  const [customFields, setCustomFields] = useState<KeyValueField[]>([]);

  // 4. Error Tracking State
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
 
    if (value && errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      barcode: !formData.barcode,
      name: !formData.name,
      category: !formData.category,
      currentStock: !formData.currentStock,
      currentPrice: !formData.currentPrice,
      sellingPrice: !formData.sellingPrice,
    };

    setErrors(newErrors);

    // Stop if any error exists
    if (Object.values(newErrors).some(Boolean)) {
      // Optional: Scroll to top or show toast
      alert("Please fill in all required fields marked with *");
      return;
    }

    // 6. Merge Static Data with Dynamic Settings
    const additionalAttributes = arrayToRecord(customFields);

    const payload = {
      ...formData,
      attributes: additionalAttributes,
    };

    console.log("Form Submitted Successfully:", payload);

    // Reset Form
    setFormData({
      barcode: "",
      name: "",
      description: "",
      currentStock: "",
      category: "",
      currentPrice: "",
      sellingPrice: "",
      image: null,
    });
    setCustomFields([]); 
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="text-blue-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 tracking-tight">
                Product Details
              </h3>
            </div>

            {/* Product Code */}
            <div className="group space-y-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest ml-1 flex">
                Barcode / SKU <Required />
              </label>
              <div className="relative">
                <ReusableCombobox
                  options={CATEGORIES}
                  value={formData.barcode}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, barcode: val }));
                    if(val) setErrors(prev => ({...prev, barcode: false}));
                  }}
                  placeholder="Search or enter barcode"
                  searchPlaceholder="Search product barcode"
                />
                {errors.barcode && <span className="text-[10px] text-red-500 ml-1">Barcode is required</span>}
              </div>
            </div>

            {/* Product Name */}
            <div className="group space-y-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest ml-1 flex">
                Product Name <Required />
              </label>
              <div className="relative">
                <Input
                  name="name"
                  onChange={handleInputChange}
                  value={formData.name}
                  type="text"
                  placeholder="Enter item name..."
                  leftIcon={
                    <Tag
                      className="text-gray-500 group-focus-within:text-blue-500 transition-colors"
                      size={20}
                    />
                  }
                  className={`w-full bg-gray-50 focus:bg-white transition-all font-medium ${
                    errors.name ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {errors.name && <span className="text-[10px] text-red-500 ml-1">Name is required</span>}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <ImageUpload
            label="Product Image"
            value={formData.image}
            onChange={(file) => setFormData((prev) => ({ ...prev, image: file }))}
          />
        </div>

        {/* Description */}
        <div className="group space-y-2 mt-4">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest ml-1">
            Description
          </label>
          <div className="relative">
            <FileText
              className="absolute left-4 top-4 text-gray-500 group-focus-within:text-blue-500 transition-colors"
              size={20}
            />
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the product features..."
              className="w-full pl-12 pr-4 py-2 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none"
            />
          </div>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          
          {/* Category */}
          <div className={`p-2 bg-gray-50 rounded-2xl border ${errors.category ? "border-red-300 bg-red-50" : "border-gray-100"} space-y-2 group`}>
            <label className="text-[10px] font-semibold text-gray-500 uppercase flex">
              Category <Required />
            </label>
            <div className="relative cursor-pointer">
              <ReusableSelect
                value={formData.category}
                options={CATEGORIES}
                onValueChange={(val) => {
                   setFormData((prev) => ({ ...prev, category: val }));
                   if(val) setErrors(prev => ({...prev, category: false}));
                }}
                placeholder="Select category"
              />
            </div>
          </div>

          {/* Stock */}
          <div className={`p-2 bg-gray-50 rounded-2xl border ${errors.currentStock ? "border-red-300 bg-red-50" : "border-gray-100"} space-y-2`}>
            <label className="text-[10px] font-semibold text-gray-500 uppercase flex">
              Current Stock <Required />
            </label>
            <div className="flex items-center gap-2">
              <Input
                name="currentStock"
                onChange={handleInputChange}
                value={formData.currentStock}
                leftIcon={<Layers size={18} className="text-gray-500" />}
                type="number"
                placeholder="0"
                className="w-full bg-transparent font-bold text-gray-700 outline-none border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          {/* Current Price */}
          <div className={`p-2 bg-gray-50 rounded-2xl border ${errors.currentPrice ? "border-red-300 bg-red-50" : "border-gray-100"} space-y-2`}>
            <label className="text-[10px] font-semibold text-gray-500 uppercase flex">
              Buying Price <Required />
            </label>
            <div className="flex items-center gap-1">
              <Input
                name="currentPrice"
                onChange={handleInputChange}
                value={formData.currentPrice}
                leftIcon={<BiRupee size={18} />}
                type="number"
                placeholder="0.00"
                className="w-full bg-transparent font-bold text-gray-700 outline-none border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <div className={`p-2 rounded-2xl space-y-2 border ${errors.sellingPrice ? "border-red-300 bg-red-50" : "border-gray-100"}`}>
            <label className="text-[10px] font-semibold text-gray-500 uppercase flex">
              Selling Price <Required />
            </label>
            <div className="flex items-center gap-1 text-white">
              <Input
                name="sellingPrice"
                onChange={handleInputChange}
                value={formData.sellingPrice}
                leftIcon={<BiRupee size={18} className="text-blue-200" />}
                type="number"
                placeholder="0.00"
                className="w-full bg-transparent font-bold text-gray-700 outline-none border-none p-0 focus:ring-0"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700 my-6" />

        <DynamicKeyValueSettings 
          label="Product Attributes (e.g. Color, Size)"
          fields={customFields}
          onChange={setCustomFields}
        />

        <div className="flex justify-end gap-4 mt-8">
          <GradientButton onClick={handleSubmit}>Save & Add More</GradientButton>
          <GradientButton onClick={handleSubmit}>Save</GradientButton>
          <GradientButton variant="danger">Cancel</GradientButton>
        </div>
      </form>
    </div>
  );
};

export default InventoryForm;