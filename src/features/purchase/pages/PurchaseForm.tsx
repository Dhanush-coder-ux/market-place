import React, { useState } from "react";
import { Save, X, Plus, Trash2 } from "lucide-react";
// Adjust imports to match your project structure
import Input from "@/components/ui/Input"; 
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import type { ProductItem } from "./Purchase";

export type PurchaseStatus = "Paid" | "Pending";

interface PurchaseFormData {
  date: string;
  time: string;
  supplier: string;
  products: Array<{ name: string; quantity: number | "" }>;
  total_cost: number | "";
  invoice_no: string;
  status: PurchaseStatus;
}

interface PurchaseFormProps {
  initialData?: Partial<PurchaseFormData>;
  onSubmit?: (data: PurchaseFormData) => void;
  onCancel?: () => void;
}

// --- Mock Data for Dropdowns ---
const statusOptions = [
  { value: "Paid", label: "Paid" },
  { value: "Pending", label: "Pending" },
];

const supplierOptions = [
  { value: "XYZ Wholesalers", label: "XYZ Wholesalers" },
  { value: "Global Tech Supplies", label: "Global Tech Supplies" },
  { value: "Apex Electronics", label: "Apex Electronics" },
  { value: "Nexus Components", label: "Nexus Components" },
];

const productOptions = [
  { value: "Wireless Headphones", label: "Wireless Headphones" },
  { value: "Mechanical Keyboard", label: "Mechanical Keyboard" },
  { value: "Ergonomic Mouse", label: "Ergonomic Mouse" },
  { value: "27-inch Monitor", label: "27-inch Monitor" },
  { value: "USB-C Hub", label: "USB-C Hub" },
];

const PurchaseForm: React.FC<PurchaseFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<PurchaseFormData>({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    time: initialData?.time || new Date().toTimeString().slice(0, 5),
    supplier: initialData?.supplier || "",
    invoice_no: initialData?.invoice_no || "",
    total_cost: initialData?.total_cost || "",
    status: initialData?.status || "Pending",
    products: initialData?.products?.length 
      ? initialData.products 
      : [{ name: "", quantity: "" }],
  });

  // --- Handlers for Basic Fields ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" ? (value === "" ? "" : Number(value)) : value;
    
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as PurchaseStatus }));
  };

  const handleSupplierChange = (value: string) => {
    setFormData((prev) => ({ ...prev, supplier: value }));
  };

  // --- Handlers for Dynamic Product Array ---
  const handleProductChange = (index: number, field: keyof ProductItem, value: string | number) => {
    setFormData((prev) => {
      const updatedProducts = [...prev.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: field === "quantity" && value !== "" ? Number(value) : value,
      };
      return { ...prev, products: updatedProducts };
    });
  };

  const addProductRow = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { name: "", quantity: "" }],
    }));
  };

  const removeProductRow = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, index) => index !== indexToRemove),
    }));
  };

  // --- Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
    console.log("Purchase Saved:", formData);
  };

  return (
    <div className="p-6">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-900">
          {initialData ? "Edit Purchase Invoice" : "Record New Purchase"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter the supplier and product details from the invoice.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Top Section: Basic Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="Invoice Number"
            name="invoice_no"
            placeholder="e.g., INV-004"
            value={formData.invoice_no}
            onChange={handleInputChange}
            required
          />
          
          {/* Replaced Supplier Input with ReusableSelect */}
          <ReusableSelect
            label="Supplier Name"
            value={formData.supplier}
            onValueChange={handleSupplierChange}
            options={supplierOptions}
            placeholder="Select a supplier..."
            required={true as any}
          />

          <ReusableSelect
            label="Payment Status"
            value={formData.status}
            onValueChange={handleStatusChange}
            options={statusOptions}
            placeholder="Select Status"
            required={true as any}
          />
          <Input
            label="Purchase Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Time"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Total Cost (₹)"
            name="total_cost"
            type="number"
            placeholder="0"
            value={formData.total_cost as any}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Bottom Section: Dynamic Products List */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Products Included</h3>
              <p className="text-xs text-slate-500">Select all items purchased in this invoice.</p>
            </div>
            <button
              type="button"
              onClick={addProductRow}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {formData.products.map((product, index) => (
              <div key={index} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Product Name Dropdown */}
                <div className="flex-1">
                  <ReusableSelect
                    value={product.name}
                    onValueChange={(value) => handleProductChange(index, "name", value)}
                    options={productOptions}
                    placeholder="Select a product..."
                    required={true as any}
                  />
                </div>

                {/* Quantity Input */}
                <div className="w-32">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={product.quantity as any}
                    onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                    required
                  />
                </div>
                
                {/* Only allow deletion if there is more than 1 row */}
                <button
                  type="button"
                  onClick={() => removeProductRow(index)}
                  disabled={formData.products.length === 1}
                  className={`mt-1 p-2.5 rounded-lg transition-colors ${
                    formData.products.length === 1 
                      ? "text-slate-300 bg-slate-50 cursor-not-allowed" 
                      : "text-red-500 hover:bg-red-50 hover:text-red-600"
                  }`}
                  title="Remove Item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 border border-transparent rounded-lg transition-colors"
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Save size={16} /> Record Purchase
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseForm;