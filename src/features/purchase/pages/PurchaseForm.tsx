import React, { useState } from "react";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";

export interface PurchaseData {
  id: number;
  purchase_date: string;
  supplier: string;
  product: string;
  quantity: number;
  total_cost: number;
  invoice_no: string;
  payment_status: string;
}

interface PurchaseFormProps {
  initialData?: Partial<PurchaseData>;
 
  isLoading?: boolean;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({
  initialData = {},
  
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<PurchaseData>({
    id: initialData.id || 0,
    purchase_date: initialData.purchase_date || "",
    supplier: initialData.supplier || "",
    product: initialData.product || "",
    quantity: initialData.quantity || 0,
    total_cost: initialData.total_cost || 0,
    invoice_no: initialData.invoice_no || "",
    payment_status: initialData.payment_status || "",
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
        Purchase Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Input
          name="purchase_date"
          label="Purchase Date"
          type="date"
          value={formData.purchase_date}
          onChange={handleChange}
        />

        <Input
          name="supplier"
          label="Supplier"
          value={formData.supplier}
          onChange={handleChange}
          placeholder="Supplier Name"
        />

        <Input
          name="product"
          label="Product"
          value={formData.product}
          onChange={handleChange}
          placeholder="Product Name"
        />

        <Input
          name="quantity"
          label="Quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Quantity"
        />

        <Input
          name="total_cost"
          label="Total Cost"
          type="number"
          value={formData.total_cost}
          onChange={handleChange}
          placeholder="Total Cost"
        />

        <Input
          name="invoice_no"
          label="Invoice No"
          value={formData.invoice_no}
          onChange={handleChange}
          placeholder="Invoice Number"
        />

        <div className="md:col-span-2">
          <Input
            name="payment_status"
            label="Payment Status"
            value={formData.payment_status}
            onChange={handleChange}
            placeholder="Paid / Pending / Partial"
          />
        </div>

      </div>

      <div className="flex justify-end">
        <GradientButton
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Purchase"}
        </GradientButton>
      </div>
    </form>
  );
};

export default PurchaseForm;
