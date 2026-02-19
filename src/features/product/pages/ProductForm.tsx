import React, { useState } from "react";
import Input from "@/components/ui/Input";
import { ProductData } from "../type";
import { GradientButton } from "@/components/ui/GradientButton";


interface ProductFormProps {
  initialData?: Partial<ProductData>;
  onSubmit: (data: ProductData) => void;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ProductData>({
    id: initialData.id || 0,
    name: initialData.name || "",
    sku: initialData.sku || "",
    category: initialData.category || "",
    selling_price: initialData.selling_price || 0,
    unit: initialData.unit || "",
    min_threshold: initialData.min_threshold || 0,
    default_supplier: initialData.default_supplier || "",
    avg_buying_cost: initialData.avg_buying_cost || 0,
    current_stock: initialData.current_stock || 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 space-y-6"
    >
      <h2 className="text-xl font-semibold text-gray-800">
        Product Details
      </h2>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Input
          name="name"
          label="Product name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Product Name"
        />

        <Input
          name="sku"
          label="SKU"
          value={formData.sku}
          onChange={handleChange}
          placeholder="SKU"
        />

        <Input
          name="category"
          label="Category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Category"
        />

        <Input
          name="unit"
          value={formData.unit}
          label="Unit"
          onChange={handleChange}
          placeholder="Unit (pcs, kg, etc.)"
        />

        <Input
          name="selling_price"
          label="Selling Price"
          type="number"
          value={formData.selling_price}
          onChange={handleChange}
          placeholder="Selling Price"
        />

        <Input
          name="avg_buying_cost"
          label="Average Buying Cost"
          type="number"
          value={formData.avg_buying_cost}
          onChange={handleChange}
          placeholder="Average Buying Cost"
        />

        <Input
          name="min_threshold"
          label="Minimum Stock Threshold"
          type="number"
          value={formData.min_threshold}
          onChange={handleChange}
          placeholder="Minimum Stock Threshold"
        />

        <Input
          name="current_stock"
          label="Current Stock"
          type="number"
          value={formData.current_stock}
          onChange={handleChange}
          placeholder="Current Stock"
        />

        <div className="md:col-span-2">
          <Input
            label="Default Supplier"
            name="default_supplier"
            value={formData.default_supplier}
            onChange={handleChange}
            placeholder="Default Supplier"
          />
        </div>

      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <GradientButton
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Product"}
        </GradientButton>
      </div>
    </form>
  );
};

export default ProductForm;
