import { ChangeEvent } from "react";
import { StoreFormData } from "@/features/digitalstore/type";
import { MapPin, ImagePlus } from "lucide-react";

interface Step1Props {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const CATEGORIES = [
  "Grocery & Essentials",
  "Fashion & Apparel",
  "Electronics & Gadgets",
  "Restaurant & Cafe",
  "Beauty & Cosmetics",
  "Home & Living",
  "Health & Pharmacy",
  "Books & Stationery",
  "Other",
];

const selectedTheme = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
  text: "text-blue-600",
  bg: "bg-blue-50/50",
  border: "border-blue-200",
  focusBorder: "focus:border-blue-500",
  focusRing: "focus:ring-blue-500/20",
  color: "#2563eb",
  dot: "bg-blue-500",
  glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
  cardAccent: "border-l-4 border-l-blue-500",
};

export default function Step1BasicDetails({ form, setForm, errors, setErrors }: Step1Props) {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    if (name === "name") {
      setErrors((prev) => ({ 
        ...prev, 
        name: value.trim().length >= 3 ? "" : "Store name must be at least 3 characters" 
      }));
    }
    if (name === "gstNumber") {
      setErrors((prev) => ({ 
        ...prev, 
        gstNumber: value.trim().length === 15 ? "" : "GSTIN must be exactly 15 characters" 
      }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Logos & Banners (New fields) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Store Logo</label>
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer overflow-hidden">
            {form.logoPreview ? (
              <img src={form.logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <>
                <ImagePlus size={24} className="mb-1" />
                <span className="text-[10px] font-semibold">Upload</span>
              </>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Store Banner</label>
          <div className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer overflow-hidden">
            {form.bannerPreview ? (
              <img src={form.bannerPreview} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <>
                <ImagePlus size={24} className="mb-1" />
                <span className="text-[10px] font-semibold">Upload Banner (1200x400)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* GST REGISTRATION OPTIONS */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-2">GST Registration Status</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, gstRegistered: true }))}
            className={`py-3 rounded-lg border text-xs font-bold transition-all ${
              form.gstRegistered
                ? "bg-blue-50 border-blue-500 text-blue-600 shadow-sm"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            Yes, GST Registered
          </button>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, gstRegistered: false, gstNumber: "" }))}
            className={`py-3 rounded-lg border text-xs font-bold transition-all ${
              !form.gstRegistered
                ? "bg-blue-50 border-blue-500 text-blue-600 shadow-sm"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            No GST Registration
          </button>
        </div>
      </div>

      {/* GST NUMBER INPUT */}
      {form.gstRegistered && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-xs font-bold text-slate-500">GSTIN / GST Number <span className="text-blue-500">*</span></label>
          </div>
          <input 
            type="text"
            name="gstNumber" 
            value={form.gstNumber} 
            onChange={handleChange} 
            maxLength={15}
            placeholder="e.g. 22AAAAA1111A1Z1"
            className={`w-full px-4 py-3 rounded-lg border outline-none text-sm transition-all duration-200 uppercase ${
              errors.gstNumber 
                ? "border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
                : `border-slate-200 ${selectedTheme.focusBorder} focus:ring-4 ${selectedTheme.focusRing}`
            }`} 
          />
          {errors.gstNumber && <p className="text-[10px] text-blue-500 mt-1 font-medium">{errors.gstNumber}</p>}
        </div>
      )}

      {/* STORE NAME */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="text-xs font-bold text-slate-500">Store Name <span className="text-blue-500">*</span></label>
        </div>
        <input 
          type="text"
          name="name" 
          value={form.name} 
          onChange={handleChange} 
          placeholder="e.g. Grace Premium Market"
          className={`w-full px-4 py-3 rounded-lg border outline-none text-sm transition-all duration-200 ${
            errors.name 
              ? "border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
              : `border-slate-200 ${selectedTheme.focusBorder} focus:ring-4 ${selectedTheme.focusRing}`
          }`} 
        />
        {errors.name && <p className="text-[10px] text-blue-500 mt-1 font-medium">{errors.name}</p>}
      </div>

      {/* TAGLINE & CATEGORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Tagline / Slogan</label>
          <input 
            type="text"
            name="tagline" 
            maxLength={60}
            value={form.tagline} 
            onChange={handleChange} 
            placeholder="Fresh picks, fair prices..." 
            className={`w-full px-4 py-3 rounded-lg border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`} 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Store Category <span className="text-blue-500">*</span></label>
          <select 
            name="category" 
            value={form.category} 
            onChange={handleChange} 
            className={`w-full px-4 py-3 rounded-lg border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 bg-white ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Store Description</label>
        <textarea 
          name="description" 
          value={form.description} 
          onChange={handleChange} 
          maxLength={200}
          rows={3} 
          placeholder="Briefly describe what your store sells..."
          className={`w-full px-4 py-3 rounded-lg border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 resize-none ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`} 
        />
      </div>

      {/* BUSINESS ADDRESS */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Business / Shop Address</label>
        <div className="relative">
          <input 
            type="text"
            name="address" 
            value={form.address} 
            onChange={handleChange} 
            placeholder="Block 4A, Green Street, Chennai, 600001"
            className={`w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`} 
          />
          <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
        </div>
      </div>
    </div>
  );
}
