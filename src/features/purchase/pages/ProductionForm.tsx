import React, { useState } from "react";
import { Save, X } from "lucide-react";
// Adjust these import paths to match your project structure
import Input from "@/components/ui/Input"; 
import { ReusableSelect } from "@/components/ui/ReusableSelect";

type ProductionStatus = "Planned" | "In Progress" | "Completed" | "Cancelled";

interface ProductionFormData {
  batchNumber: string;
  productName: string;
  targetQuantity: number | "";
  startDate: string;
  estCost: number | "";
  status: ProductionStatus;
}

interface ProductionFormProps {
  initialData?: Partial<ProductionFormData>;
  onSubmit?: (data: ProductionFormData) => void;
  onCancel?: () => void;
}

const statusOptions = [
  { value: "Planned", label: "Planned" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

const ProductionForm: React.FC<ProductionFormProps> = ({ initialData, onSubmit, onCancel }) => {
  // Initialize state with initialData if provided (for edits), otherwise use defaults
  const [formData, setFormData] = useState<ProductionFormData>({
    batchNumber: initialData?.batchNumber || "",
    productName: initialData?.productName || "",
    targetQuantity: initialData?.targetQuantity || "",
    startDate: initialData?.startDate || new Date().toISOString().split("T")[0],
    estCost: initialData?.estCost || "",
    status: initialData?.status || "Planned",
  });

  // Handle standard inputs (text, number, date)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Parse numbers automatically so they don't get saved as strings
    const parsedValue = type === "number" ? (value === "" ? "" : Number(value)) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  // Handle Radix UI ReusableSelect 
  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as ProductionStatus,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
    console.log("Production Form Submitted:", formData);
  };

  return (
    <div className="p-6 mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          {initialData ? "Edit Production Batch" : "Create New Production Batch"}
        </h2>
        <p className="text-sm text-slate-500">
          Enter the details for the manufacturing production run below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Input
            label="Batch Number"
            name="batchNumber"
            placeholder="e.g., MFG-2024-001"
            value={formData.batchNumber}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Product Name"
            name="productName"
            placeholder="e.g., Premium Silk Thread"
            value={formData.productName}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Target Quantity (Units)"
            name="targetQuantity"
            type="number"
            placeholder="0"
            value={formData.targetQuantity as any}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Estimated Cost ($)"
            name="estCost"
            type="number"
            placeholder="0.00"
            value={formData.estCost as any}
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

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 border border-transparent rounded-lg transition-colors"
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Save size={16} /> {initialData ? "Update Batch" : "Save Batch"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductionForm;