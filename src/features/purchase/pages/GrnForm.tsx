import React, { useState } from "react";
import { Save, X, Plus, Trash2 } from "lucide-react";
// Import your custom components here based on your file structure
import Input from "@/components/ui/Input"; 
import { ReusableSelect } from "@/components/ui/ReusableSelect";

type GRNStatus = "Completed" | "Pending" | "Partial";

// 1. Define the interface for a single product item
export interface ProductItem {
  id: string; // Added ID for stable React keys during map
  name: string;
  quantity: number | "";
  sellingPrice: number | "";
}

interface GRNFormData {
  poReference: string;
  supplier: string;
  date: string;
  itemsCount: number | "";
  totalValue: number | "";
  status: GRNStatus;
  products: ProductItem[]; // 2. Added products array
}

interface GRNFormProps {
  onSubmit?: (data: GRNFormData) => void;
  onCancel?: () => void;
}

const statusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Partial", label: "Partial" },
  { value: "Completed", label: "Completed" },
];

// Mock supplier options for the Select field
const supplierOptions = [
  { value: "sup-1", label: "Global Tech" },
  { value: "sup-2", label: "Mainstream Inc" },
  { value: "sup-3", label: "Apex Wholesale" },
];

const GRNForm: React.FC<GRNFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<GRNFormData>({
    poReference: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    itemsCount: "",
    totalValue: "",
    status: "Pending",
    // Start with one empty product row
    products: [{ id: Date.now().toString(), name: "", quantity: "", sellingPrice: "" }],
  });

  // Handler for standard Input components
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" ? (value === "" ? "" : Number(value)) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  // Handlers for ReusableSelect
  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as GRNStatus }));
  };

  const handleSupplierChange = (value: string) => {
    setFormData((prev) => ({ ...prev, supplier: value }));
  };

  // --- Dynamic Products Handlers ---
  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { id: Date.now().toString(), name: "", quantity: "", sellingPrice: "" },
      ],
    }));
  };

  const removeProduct = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const updateProduct = (id: string, field: keyof ProductItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id === id) {
          const parsedValue = (field === "quantity" || field === "sellingPrice") && value !== "" 
            ? Number(value) 
            : value;
          return { ...p, [field]: parsedValue };
        }
        return p;
      }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
    console.log("Form Submitted:", formData);
  };

  return (
    <div className="p-6 mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Create New GRN</h2>
        <p className="text-sm text-gray-500">Enter the details for the Good Receipt Note below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* --- GENERAL INFO SECTION --- */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 border-b pb-2">General Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="PO Reference"
              name="poReference"
              placeholder="e.g., PO-9921"
              value={formData.poReference}
              onChange={handleInputChange}
              required
            />

            <ReusableSelect
              label="Supplier"
              value={formData.supplier}
              onValueChange={handleSupplierChange}
              options={supplierOptions}
              placeholder="Select Supplier"
              required={true as any}
            />

            <Input
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />

            <ReusableSelect
              label="Status"
              value={formData.status}
              onValueChange={handleStatusChange}
              options={statusOptions}
              placeholder="Select Status"
              required={true as any}
            />

            <Input
              label="Items Count"
              name="itemsCount"
              type="number"
              placeholder="0"
              value={formData.itemsCount as any}
              onChange={handleInputChange}
            />

            <Input
              label="Total Value ($)"
              name="totalValue"
              type="number"
              placeholder="0.00"
              value={formData.totalValue as any}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* --- DYNAMIC PRODUCTS SECTION --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold text-slate-800">Products List</h3>
            <button
              type="button"
              onClick={addProduct}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus size={14} /> Add Product
            </button>
          </div>

          <div className="space-y-4">
            {formData.products.map((product, index) => (
              <div 
                key={product.id} 
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-lg border border-slate-100"
              >
                <div className="md:col-span-5">
                  <Input
                    label={index === 0 ? "Product Name" : undefined}
                    name={`product_name_${product.id}`}
                    placeholder="e.g., Wireless Headphones"
                    value={product.name}
                    onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                    required
                  />
                </div>
                
                <div className="md:col-span-3">
                  <Input
                    label={index === 0 ? "Quantity" : undefined}
                    name={`quantity_${product.id}`}
                    type="number"
                    placeholder="0"
                    value={product.quantity as any}
                    onChange={(e) => updateProduct(product.id, "quantity", e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-3">
                  <Input
                    label={index === 0 ? "Selling Price ($)" : undefined}
                    name={`price_${product.id}`}
                    type="number"
                    placeholder="0.00"
                    value={product.sellingPrice as any}
                    onChange={(e) => updateProduct(product.id, "sellingPrice", e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-1 flex justify-end pb-2">
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    disabled={formData.products.length === 1}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- ACTION BUTTONS --- */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Save size={16} /> Save Record
          </button>
        </div>
      </form>
    </div>
  );
};

export default GRNForm;