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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving Supplier:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-6 space-y-10 bg-white">
      
      {/* SECTION 1: IDENTITY & CONTACT */}
      <section className="border-b border-gray-200 pb-8">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900">Supplier Identity</h3>
          <p className="text-sm text-gray-500">Primary contact and legal identification details.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Input
              name="supplier_name"
              label="Supplier Name"
              value={formData.supplier_name}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <Input
            name="phone"
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
          />
          <Input
            name="gst"
            label="GST Number"
            value={formData.gst}
            onChange={handleChange}
            placeholder="22AAAAA0000A1Z5"
          />
        </div>
      </section>

      {/* SECTION 2: FINANCIAL SUMMARY */}
      <section>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900">Financial Overview</h3>
          <p className="text-sm text-gray-500">Track purchase history and current liabilities.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            name="total_purchases"
            label="Total Purchase Volume"
            type="number"
            value={formData.total_purchases}
            onChange={handleChange}
          />
          <div className="relative">
             <Input
              name="outstanding_payment"
              label="Outstanding Balance"
              type="number"
              value={formData.outstanding_payment}
              onChange={handleChange}
            />
            {formData.outstanding_payment > 0 && (
              <span className="text-[10px] font-bold text-red-500 absolute -bottom-5 right-0 uppercase tracking-wider">
                Pending Liability
              </span>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER ACTIONS */}
      <div className="pt-8 flex items-center justify-end gap-4 border-t border-gray-200">
        <button 
          type="button" 
          className="text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        <GradientButton
          type="submit"
          disabled={isLoading}
          className="min-w-[160px]"
        >
          {isLoading ? "Processing..." : "Register Supplier"}
        </GradientButton>
      </div>
    </form>
  );
};

export default SupplierForm;