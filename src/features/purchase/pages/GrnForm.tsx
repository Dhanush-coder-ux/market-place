import React, { useState } from "react";
import { Save, X } from "lucide-react";
// Import your custom components here based on your file structure
import Input from "@/components/ui/Input"; 
import { ReusableSelect } from "@/components/ui/ReusableSelect"

type GRNStatus = "Completed" | "Pending" | "Partial";

interface GRNFormData {
  poReference: string;
  supplier: string;
  date: string;
  itemsCount: number | "";
  totalValue: number | "";
  status: GRNStatus;
  product_name: string;
  quantity: number | "";
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

const GRNForm: React.FC<GRNFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<GRNFormData>({
    poReference: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    itemsCount: "",
    totalValue: "",
    status: "Pending",
    product_name: "",
    quantity: "",
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

  // Handler for ReusableSelect (Radix UI passes the value directly)
  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as GRNStatus,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
    console.log("Form Submitted:", formData);
  };

  return (
    <div className=" p-6 ">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Create New GRN</h2>
        <p className="text-sm text-gray-500">Enter the details for the Good Receipt Note below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Input
            label="PO Reference"
            name="poReference"
            placeholder="e.g., PO-9921"
            value={formData.poReference}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Supplier"
            name="supplier"
            placeholder="e.g., Global Tech"
            value={formData.supplier}
            onChange={handleInputChange}
            required
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
            required={true as any} // Cast as any just in case your interface types it differently
          />

          <Input
            label="Product Name"
            name="product_name"
            placeholder="e.g., Wireless Headphones"
            value={formData.product_name}
            onChange={handleInputChange}
          />

          <Input
            label="Quantity"
            name="quantity"
            type="number"
            placeholder="0"
            value={formData.quantity as any}
            onChange={handleInputChange}
          />

          <Input
            label="Items Count"
            name="itemsCount"
            type="number"
            placeholder="0"
            value={formData.itemsCount as any}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Total Value ($)"
            name="totalValue"
            type="number"
            placeholder="0.00"
            value={formData.totalValue as any}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-transparent rounded-lg transition-colors"
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