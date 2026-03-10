import React, { useState } from "react";
import Input from "@/components/ui/Input";
import { ProductData } from "../type";
import { GradientButton } from "@/components/ui/GradientButton";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { FileText } from "lucide-react";
import FieldLabel from "@/features/inventory/pages/Fieldlable";
import { FIELD_DESCRIPTIONS } from "@/utils/constants";

interface ProductFormProps {
  initialData?: Partial<ProductData>;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData = {},
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ProductData>({
    id: initialData.id || 0,
    name: initialData.name || "",
    sku: initialData.sku || "",
    describtion:initialData.describtion || "",
    category: initialData.category || "",
    selling_price: initialData.selling_price || 0,
    unit: initialData.unit || "",
    min_threshold: initialData.min_threshold || 0,
    default_supplier: initialData.default_supplier || "",
    avg_buying_cost: initialData.avg_buying_cost || 0,
    current_stock: initialData.current_stock || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting Data:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className=" mx-auto p-6 space-y-10">
      
      {/* SECTION 1: BASIC INFORMATION */}
      <section className="border-b border-gray-200 pb-8">
        <div className="mb-6">
          <h3 className="text-lg  text-gray-900">General Information</h3>
          <p className="text-sm text-gray-500">Essential details to identify your product.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            name="name"
            label="Product Name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Wireless Mouse"
          />
          <Input
            name="sku"
            label="SKU / Barcode"
            value={formData.sku}
            onChange={handleChange}
            placeholder="Unique identifier"
          />
          <Input
            name="category"
            label="Category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g. Electronics"
          />
          <Input
            name="unit"
            label="Unit of Measure"
            value={formData.unit}
            onChange={handleChange}
            placeholder="e.g. pcs, kg, box"
          />
        </div>
           <div className="space-y-1.5 mt-3">
           
              <label htmlFor="description" className="text-s">Description</label>
             <div className="relative group">
                <FileText className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <textarea
                  name="description"
                  value={formData.describtion}
                  onChange={()=>{}}
                  rows={4}
                  className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none resize-none"
                  placeholder="Describe material, dimensions, or key features..."
                />
              </div>
              </div>
      </section>

      {/* SECTION 2: PRICING & SUPPLIER */}
      <section className="border-b border-gray-200 pb-8">
        <div className="mb-6">
          <h3 className="text-lg text-gray-900">Pricing & Sourcing</h3>
          <p className="text-sm text-gray-500">Manage your costs, margins, and primary vendor.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            name="selling_price"
            label="Selling Price"
            type="number"
            value={formData.selling_price}
            onChange={handleChange}
          />
          <Input
            name="avg_buying_cost"
            label="Cost Price"
            type="number"
            value={formData.avg_buying_cost}
            onChange={handleChange}
          />
       
      <div className="space-y-1.5 mb-2">
            <label className="text-sm font-medium text-gray-700">Primary Supplier</label>
            <ReusableSelect
              onValueChange={(val) => setFormData(prev => ({...prev, default_supplier: val}))}
              options={[{label: "Global Tech", value: "gt"}, {label: "Mainstream Inc", value: "mi"}]}
              value={formData.default_supplier}
              placeholder="Select Supplier"
            />
          </div>
        </div>
      </section>

    

      {/* ACTION BAR */}
      <div className="pt-6 flex items-center justify-end gap-4 border-t border-gray-200">
        <button 
          type="button" 
          className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          Discard Changes
        </button>
        <GradientButton
          type="submit"
          disabled={isLoading}
          className="px-10"
        >
          {isLoading ? "Saving..." : "Save Product"}
        </GradientButton>
      </div>
    </form>
  );
};

export default ProductForm;