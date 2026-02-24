import React, { useState } from "react";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";

export interface SupplierData {
  id: number;
  supplier_name: string;
  phone: string;
  gst: string;
  total_purchases: number;
  outstanding_payment: number;
}

interface SupplierFormProps {
  initialData?: Partial<SupplierData>;
  isLoading?: boolean;
}

const SupplierForm: React.FC<SupplierFormProps> = ({
  initialData = {},

  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SupplierData>({
    id: initialData.id || 0,
    supplier_name: initialData.supplier_name || "",
    phone: initialData.phone || "",
    gst: initialData.gst || "",
    total_purchases: initialData.total_purchases || 0,
    outstanding_payment: initialData.outstanding_payment || 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 space-y-6"
    >
      <h2 className="text-xl font-semibold text-gray-800">
        Supplier Details
      </h2>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Input
          name="supplier_name"
          label="Supplier Name"
          value={formData.supplier_name}
          onChange={handleChange}
          placeholder="Supplier Name"
        />

        <Input
          name="phone"
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone Number"
        />

        <Input
          name="gst"
          label="GST Number"
          value={formData.gst}
          onChange={handleChange}
          placeholder="GST Number"
        />

        <Input
          name="total_purchases"
          label="Total Purchases"
          type="number"
          value={formData.total_purchases}
          onChange={handleChange}
          placeholder="Total Purchases"
        />

        <Input
          name="outstanding_payment"
          label="Outstanding Payment"
          type="number"
          value={formData.outstanding_payment}
          onChange={handleChange}
          placeholder="Outstanding Payment"
        />

      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <GradientButton
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Supplier"}
        </GradientButton>
      </div>
    </form>
  );
};

export default SupplierForm;
