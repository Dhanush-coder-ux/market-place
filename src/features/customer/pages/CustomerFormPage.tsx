import { useState } from "react";
import { 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Tag,
} from "lucide-react";

// IMPORTANT: Adjust these import paths to match your project structure
import Input from "@/components/ui/Input"; 
import { ReusableSelect } from "@/components/ui/ReusableSelect"; 
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";

const CustomerFormPage = () => {
  const { postData, loading } = useApi();
  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company: "",
    email: "",
    phone: "",
    customer_type: "Normal", 
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    notes: "",
  });

  // Options for the ReusableSelect
  const customer_typeOptions = [
    { label: "Normal", value: "Normal" },
    { label: "Premium", value: "Premium" },
  ];

  // Standard input handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Dedicated handler for the ReusableSelect (which passes the value directly)
  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, customer_type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      datas: {...formData,shop_id: SHOP_ID,type: "CUSTOMER CREATE",},
    };
    const res = await postData(ENDPOINTS.CUSTOMERS, payload);
    if (res) {
      alert("Customer saved successfully!");
    }
  };

  return (
    <div className="min-h-screen antialiased" >
      <div className="space-y-6">
        
        {/* ── HEADER ── */}
        

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Content (Left Column - Spans 2 cols) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* 1. Personal Information */}
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                <User size={16} className="text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-widest">Personal Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="First Name"
                  required
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. John"
                />
                <Input
                  label="Last Name"
                  required
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Doe"
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Company Name (Optional)"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corp"
                    leftIcon={<Building2 size={16} />}
                  />
                </div>
              </div>
            </div>

            {/* 2. Address */}
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                <MapPin size={16} className="text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-widest">Billing Address</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Input
                    label="Street Address"
                    name="street_address"
                    value={formData.street_address}
                    onChange={handleChange}
                    placeholder="123 Main St, Apt 4B"
                  />
                </div>
                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City Name"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                  />
                  <Input
                    label="ZIP Code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Content (Right Column - Spans 1 col) */}
          <div className="space-y-6">
            
            {/* 3. Contact Details */}
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                <Mail size={16} className="text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-widest">Contact</h2>
              </div>
              <div className="p-6 space-y-5">
                <Input
                  label="Email Address"
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  leftIcon={<Mail size={16} />}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  leftIcon={<Phone size={16} />}
                />
              </div>
            </div>

            {/* 4. Preferences & Notes */}
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden">
               <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                <Tag size={16} className="text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-widest">Details</h2>
              </div>
              <div className="p-6 space-y-5">
                
                {/* Reusable Select Implemented Here */}
                <ReusableSelect
                  label="Customer Type"
                  value={formData.customer_type}
                  onValueChange={handleSelectChange}
                  options={customer_typeOptions}
                  placeholder="Select Type"
                />
                
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold text-gray-700 ml-0.5 flex items-center gap-1.5">
                    Internal Notes
                  </label>
                  <div className="relative">
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Add any specific details or preferences..."
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>
        <div className="flex items-center justify-end">
  
          <div className="flex items-center gap-3">
                   <GradientButton variant="outline" color="danger" >
          Cancel
         </GradientButton>
          <GradientButton icon={<Save size={16} />} onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Customer"}
          </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormPage;