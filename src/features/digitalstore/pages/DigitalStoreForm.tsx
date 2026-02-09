import { useEffect, useState, ChangeEvent } from "react";
import type { StoreFormData, StoreSetupProps } from "@/features/digitalstore/type"
import { MapPin } from "lucide-react";

const INITIAL_STATE: StoreFormData = {
  name: "",
  tagline: "",
  address: "",
  description: "",
  contact: "",
  logo: null,
  logoPreview: "",
};

export default function StoreSetupForm({ existingData }: StoreSetupProps) {
  const [form, setForm] = useState<StoreFormData>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* 🔁 Prepopulate data */
  useEffect(() => {
    if (existingData) {
      setForm((prev) => ({ ...prev, ...existingData }));
    }
  }, [existingData]);

  /* 💾 Autosave Draft */
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("store-draft", JSON.stringify(form));
    }, 800);
    return () => clearTimeout(timer);
  }, [form]);

  /* ✅ Validation */
  const validateField = (name: keyof StoreFormData, value: string) => {
    if (name === "name" && !value.trim()) {
      return "Store name is required";
    }
    return "";
  };

  /* ✍ Input handler */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    const error = validateField(name as keyof StoreFormData, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  /* 🖼 Logo Upload */
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      logo: file,
      logoPreview: URL.createObjectURL(file),
    }));
  };

  const isFormValid = Boolean(form.name && !errors.name);

  return (
    <div className="max-w-2xl mx-auto rounded-xl bg-white p-6 shadow">
      <h2 className="mb-6 text-xl font-semibold">Store Details</h2>

      {/* Store Name */}
      <div className="mb-4">
        <label className="text-sm font-medium">
          Store Name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring
            ${errors.name ? "border-red-500" : ""}`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Tagline */}
      <div className="mb-4">
        <label className="text-sm font-medium">Tagline</label>
        <input
          name="tagline"
          value={form.tagline}
          onChange={handleChange}
          placeholder="A short one-liner"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      {/* Address */}
      <div className="mb-4">
        <label className="text-sm font-medium">Address</label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Street, City, State"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
        <button
          type="button"
          className="mt-1 text-sm text-blue-600 hover:underline"
        >
          <MapPin className="inline mr-1" size={14} />
          Use current location
        </button>
      </div>

      {/* Logo */}
      <div className="mb-4">
        <label className="text-sm font-medium">Store Logo</label>
        <input type="file" accept="image/*" onChange={handleLogoChange} />
        {form.logoPreview && (
          <img
            src={form.logoPreview}
            alt="Logo Preview"
            className="mt-2 h-20 rounded border"
          />
        )}
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="text-sm font-medium">Store Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      {/* Contact Info */}
      <div className="mb-6">
        <label className="text-sm font-medium">Contact Info</label>
        <input
          name="contact"
          value={form.contact}
          onChange={handleChange}
          placeholder="Phone or email"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      {/* Save */}
      <button
        disabled={!isFormValid}
        className={`w-full rounded-lg py-3 font-medium text-white
          ${
            isFormValid
              ? "bg-blue-600 hover:bg-blue-700"
              : "cursor-not-allowed bg-gray-400"
          }`}
      >
        Save & Continue
      </button>

    </div>
  );
}
