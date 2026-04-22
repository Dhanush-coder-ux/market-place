import React, { useState } from "react";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { 
  Building2,  MapPin
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

export interface SupplierData {
  id: number;
  supplier_name: string;
  contact_person: string; 
  email: string;          
  phone: string;
  address: string;        
  city: string;           
}

interface SupplierFormProps {
  initialData?: Partial<SupplierData>;
  isLoading?: boolean;
}

const SupplierForm: React.FC<SupplierFormProps> = ({
  initialData = {},
  isLoading: externalLoading = false,
}) => {
  const { postData, loading } = useApi();
  const isLoading = externalLoading || loading;

  const [formData, setFormData] = useState<SupplierData>({
    id: initialData.id || 0,
    supplier_name: initialData.supplier_name || "",
    contact_person: initialData.contact_person || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    address: initialData.address || "",
    city: initialData.city || ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      datas: {...formData,shop_id: SHOP_ID,
      type: "SUPPLIER CREATE"},
    };
    await postData(ENDPOINTS.SUPPLIERS, payload);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto p-6 space-y-12 bg-white">
      
      {/* SECTION 1: IDENTITY & PRIMARY CONTACT */}
      <section className="space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="text-emerald-600" size={20} /> 
            Supplier Identity
          </h3>
          <p className="text-sm text-gray-500">Legal name and primary contact person details.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            name="supplier_name"
            label="Business Name"
            value={formData.supplier_name}
            onChange={handleChange}
            placeholder="e.g. Acme Corp"
          />
          <Input
            name="contact_person"
            label="Contact Person"
            value={formData.contact_person}
            onChange={handleChange}
            placeholder="John Smith"
          />
          <Input
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="orders@acme.com"
          />
          <Input
            name="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
          />
   
        </div>
      </section>

      {/* SECTION 2: ADDRESS DETAILS */}
      <section className="space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="text-blue-600" size={20} /> 
            Location
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
          <Input
            name="city"
            label="City/State"
            value={formData.city}
            onChange={handleChange}
            placeholder="New York"
          />
              <div className="md:col-span-2">
            <Input
              name="address"
              label="Street Address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Industrial Estate"
            />
          </div>
        </div>
      </section>


      {/* FOOTER ACTIONS */}
      <div className="pt-8 flex items-center justify-end gap-4 border-t border-gray-200">
        <button type="button" className="text-sm font-semibold text-gray-400 hover:text-red-500">
          Cancel
        </button>
        <GradientButton type="submit" disabled={isLoading} >
          {isLoading ? "Processing..." : "Register Supplier"}
        </GradientButton>
      </div>
    </form>
  );
};

export default SupplierForm;