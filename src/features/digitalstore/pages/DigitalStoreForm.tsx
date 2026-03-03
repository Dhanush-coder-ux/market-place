import { useEffect, useState, ChangeEvent, useRef } from "react";
import type { StoreFormData, StoreSetupProps } from "@/features/digitalstore/type"; 
import { MapPin, Upload, X, Image as ImageIcon, Store, Info } from "lucide-react";
import { Tooltip } from "@/components/common/Tootlip";
import Title from "@/components/common/Title";
import { Link } from "react-router-dom";




const INITIAL_STATE: StoreFormData = {
  name: "",
  tagline: "",
  address: "",
  description: "",
  contact: "",
  logo: null,
  logoPreview: "",
  banner: null,
  bannerPreview: "",
};

export default function StoreSetupForm({ existingData }: StoreSetupProps) {
  const [form, setForm] = useState<StoreFormData>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingData) setForm((prev) => ({ ...prev, ...existingData }));
  }, [existingData]);

  useEffect(() => {
    const timer = setTimeout(() => localStorage.setItem("store-draft", JSON.stringify(form)), 800);
    return () => clearTimeout(timer);
  }, [form]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "name") setErrors((prev) => ({ ...prev, name: value ? "" : "Store name is required" }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        [field]: file,
        [`${field}Preview`]: URL.createObjectURL(file),
      }));
    }
  };

  const removeImage = (field: 'logo' | 'banner') => {
    setForm((prev) => ({
      ...prev,
      [field]: null,
      [`${field}Preview`]: "",
    }));
    if (field === 'banner' && bannerInputRef.current) bannerInputRef.current.value = "";
    if (field === 'logo' && logoInputRef.current) logoInputRef.current.value = "";
  };

  const isFormValid = Boolean(form.name && form.name.length > 2);

  return (
    <div className="w-full  mt-4 overflow-hidden space-y-6 ">
      <Title
       icon={<Store size={22} />} 
      title="Set Up Your Digital Store"
       subtitle="Create a unique storefront to sell your digital products"
       
        />
      
      {/* --- HEADER / BANNER SECTION --- */}
      <div className="relative w-full h-48 bg-slate-50 border-b border-slate-100 group">
        {form.bannerPreview ? (
          <>
            <img 
              src={form.bannerPreview} 
              alt="Store Banner" 
              className="w-full h-full object-cover" 
            />
            <button 
              onClick={() => removeImage('banner')}
              className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-white text-slate-600 rounded-full shadow-sm transition-all backdrop-blur-sm"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div 
            onClick={() => bannerInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            {/* Added Tooltip for Banner */}
            
               <div className="flex flex-col items-center">
                  <ImageIcon size={48} className="opacity-20 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-60">Upload Store Banner</span>
                  <span className="text-[10px] opacity-40 mt-1">Click to browse files</span>
               </div>
           
          </div>
        )}
        <input 
          type="file" 
          ref={bannerInputRef}
          className="hidden" 
          accept="image/*" 
          onChange={(e) => handleFileChange(e, 'banner')} 
        />
      </div>

      <div className="px-8 pb-8">
        {/* --- LOGO UPLOAD --- */}
        <div className="relative -mt-12 mb-6 flex items-end justify-between">
          <div className="relative group">
           
               <div 
                 onClick={() => logoInputRef.current?.click()}
                 className={`
                   h-24 w-24 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer transition-all
                   ${form.logoPreview ? 'bg-white' : 'bg-slate-100 hover:bg-slate-200'}
                 `}
               >
                 {form.logoPreview ? (
                   <img src={form.logoPreview} className="w-full h-full object-cover" alt="Logo" />
                 ) : (
                   <Store size={32} className="text-slate-300" />
                 )}
                 
                 <div className="absolute inset-0 bg-black/10 hidden group-hover:flex items-center justify-center">
                   <Upload size={18} className="text-white drop-shadow-md" />
                 </div>
               </div>
           
             {form.logoPreview && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeImage('logo'); }}
                  className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow border hover:bg-red-50"
                >
                  <X size={12} />
                </button>
             )}

             <input 
               type="file" 
               ref={logoInputRef}
               className="hidden" 
               accept="image/*" 
               onChange={(e) => handleFileChange(e, 'logo')} 
             />
          </div>
          
       
        </div>

        {/* --- FORM FIELDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          
          {/* Left Column */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Store Name <span className="text-red-500">*</span></label>
                {/* Tooltip for Store Name */}
                <Tooltip message="This will appear on your storefront and invoices. Keep it unique!">
                  <Info size={12} className="text-slate-400 cursor-help" />
                </Tooltip>
              </div>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="e.g. Modern Digital Shop"
                className={`input-field ${errors.name ? "border-red-500 ring-red-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} 
              />
              {errors.name && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.name}</p>}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Tagline</label>
                {/* Tooltip for Tagline */}
                <Tooltip message="A short, catchy phrase that appears below your logo (e.g. 'Quality you can trust').">
                  <Info size={12} className="text-slate-400 cursor-help" />
                </Tooltip>
              </div>
              <input 
                name="tagline" 
                value={form.tagline} 
                onChange={handleChange} 
                placeholder="Your store's catchy slogan" 
                className="input-field border-slate-300 focus:border-blue-500 focus:ring-blue-100" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Description</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows={3} 
                placeholder="Tell customers what you sell..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all resize-none" 
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Business Address</label>
              <div className="relative">
                <input 
                  name="address" 
                  value={form.address} 
                  onChange={handleChange} 
                  placeholder="Street, City, Zip Code"
                  className="input-field border-slate-300 focus:border-blue-500 focus:ring-blue-100 pr-9" 
                />
                <MapPin className="absolute right-3 top-3.5 text-blue-500 opacity-60 pointer-events-none" size={18} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Contact Email / Phone</label>
                 {/* Tooltip for Contact */}
                 <Tooltip message="Used for order notifications and customer support inquiries.">
                  <Info size={12} className="text-slate-400 cursor-help" />
                </Tooltip>
              </div>
              <input 
                name="contact" 
                value={form.contact} 
                onChange={handleChange} 
                placeholder="support@mystore.com"
                className="input-field border-slate-300 focus:border-blue-500 focus:ring-blue-100" 
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mt-2 border border-blue-100">
               <h4 className="text-blue-800 text-xs font-bold mb-1">Quick Tip</h4>
               <p className="text-blue-600/80 text-[11px] leading-relaxed">
                 A high-quality banner and logo increase customer trust by 40%. Ensure your images are clear and represent your brand well.
               </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <Link to="/digital-store/profile">
          
          <button
            disabled={!isFormValid}
            className={`
              px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg
              ${isFormValid 
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:-translate-y-0.5" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"}
            `}
          >
             Save Store Details
          </button>
          </Link>
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border-width: 1px;
          outline: none;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
      `}</style>
    </div>
  );
}