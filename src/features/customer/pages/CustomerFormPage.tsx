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

const CustomerFormPage = () => {
  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    customerType: "Normal", 
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  });

  // Options for the ReusableSelect
  const customerTypeOptions = [
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
    setFormData((prev) => ({ ...prev, customerType: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Customer Data Submitted:", formData);
    alert("Customer saved successfully!");
  };

  return (
    <div className="min-h-screen antialiased" >
      <div className="space-y-6">
        
        {/* ── HEADER ── */}
        <div className="flex items-center justify-end">
         
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all shadow-sm">
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-all shadow-sm"
            >
              <Save size={16} />
              Save Customer
            </button>
          </div>
        </div>

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
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. John"
                />
                <Input
                  label="Last Name"
                  required
                  name="lastName"
                  value={formData.lastName}
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
                    name="streetAddress"
                    value={formData.streetAddress}
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
                    name="zipCode"
                    value={formData.zipCode}
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
                  value={formData.customerType}
                  onValueChange={handleSelectChange}
                  options={customerTypeOptions}
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
      </div>
    </div>
  );
};

export default CustomerFormPage;