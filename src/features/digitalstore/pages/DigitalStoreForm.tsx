import { useEffect, useState, ChangeEvent } from "react";
import type { StoreFormData, StoreSetupProps } from "@/features/digitalstore/type";
import { MapPin, Upload } from "lucide-react";

const INITIAL_STATE: StoreFormData = {
  name: "", tagline: "", address: "", description: "", contact: "", logo: null, logoPreview: "",
};

export default function StoreSetupForm({ existingData }: StoreSetupProps) {
  const [form, setForm] = useState<StoreFormData>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingData) setForm((prev) => ({ ...prev, ...existingData }));
  }, [existingData]);

  useEffect(() => {
    const timer = setTimeout(() => localStorage.setItem("store-draft", JSON.stringify(form)), 800);
    return () => clearTimeout(timer);
  }, [form]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === "name") setErrors(prev => ({ ...prev, name: value ? "" : "Required" }));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm(prev => ({ ...prev, logo: file, logoPreview: URL.createObjectURL(file) }));
  };

  const isFormValid = Boolean(form.name);

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-xl shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Store Details</h2>
        <span className="text-xs text-gray-500">* Required fields</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {/* Left Column */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-600">Store Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className={`w-full mt-1 px-3 py-1.5 border rounded-md text-sm ${errors.name ? "border-red-500" : "border-gray-300"}`} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-600">Tagline</label>
            <input name="tagline" value={form.tagline} onChange={handleChange} placeholder="One-liner" className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-600">Address</label>
            <div className="relative">
              <input name="address" value={form.address} onChange={handleChange} className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm pr-8" />
              <MapPin className="absolute right-2 top-3 text-blue-500 cursor-pointer" size={16} />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase text-gray-600">Store Logo</label>
              <label className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-2 cursor-pointer hover:bg-gray-50">
                <Upload size={14} className="mr-2" /> <span className="text-xs">Upload</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
              </label>
            </div>
            {form.logoPreview && <img src={form.logoPreview} className="h-14 w-14 object-cover rounded border mt-4" alt="Preview" />}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-600">Contact Info</label>
            <input name="contact" value={form.contact} onChange={handleChange} className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-600">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm resize-none" />
          </div>
        </div>
      </div>

      <button
        disabled={!isFormValid}
        className={`w-full mt-6 py-2.5 rounded-lg font-bold text-sm transition-colors ${isFormValid ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
      >
        Save & Continue
      </button>
    </div>
  );
}