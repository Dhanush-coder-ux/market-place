import { useEffect, useState, ChangeEvent, useRef } from "react";
import type { StoreFormData, StoreSetupProps } from "@/features/digitalstore/type"; 
import { 
  MapPin, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Store, 
  Info, 
  Globe, 
  Instagram, 
  Twitter, 
  Mail, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  Check 
} from "lucide-react";
import { Tooltip } from "@/components/common/Tootlip";
import { useNavigate } from "react-router-dom";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { authApi } from "@/services/api/auth";
import { employeeApi } from "@/services/api/employee";
import { utilityApi } from "@/services/api/utility";

const INITIAL_STATE: StoreFormData = {
  name: "",
  tagline: "",
  address: "",
  description: "",
  contactEmail: "",
  contactPhone: "",
  category: "Grocery & Essentials",
  themeColor: "Blue",
  website: "",
  instagram: "",
  twitter: "",
  logo: null,
  logoPreview: "",
  banner: null,
  bannerPreview: "",
};

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



export default function StoreSetupForm({ existingData }: StoreSetupProps) {
  const [form, setForm] = useState<StoreFormData>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<number>(1);
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({ logo: false, banner: false });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { shop } = useBusinessApi();

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

  useEffect(() => {
    // Load local draft if available, else use existingData
    const draft = localStorage.getItem("store-draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setForm((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    } else if (existingData) {
      setForm((prev) => ({ ...prev, ...existingData }));
    }
  }, [existingData]);

  // Autosave draft only textual/branding details (exclude File objects)
  useEffect(() => {
    const { logo, banner, ...textFields } = form;
    const timer = setTimeout(() => {
      localStorage.setItem("store-draft", JSON.stringify(textFields));
    }, 800);
    return () => clearTimeout(timer);
  }, [form]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Quick validation on type
    if (name === "name") {
      setErrors((prev) => ({ 
        ...prev, 
        name: value.trim().length >= 3 ? "" : "Store name must be at least 3 characters" 
      }));
    }
    if (name === "contactEmail") {
      const isValidEmail = !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setErrors((prev) => ({ 
        ...prev, 
        contactEmail: isValidEmail ? "" : "Enter a valid email address" 
      }));
    }
    if (name === "contactPhone") {
      const isValidPhone = !value || /^\+?[0-9\s-]{8,15}$/.test(value);
      setErrors((prev) => ({ 
        ...prev, 
        contactPhone: isValidPhone ? "" : "Enter a valid phone number" 
      }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }
      setForm((prev) => ({
        ...prev,
        [field]: file,
        [`${field}Preview`]: URL.createObjectURL(file),
      }));
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent, field: 'logo' | 'banner', active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [field]: active }));
  };

  const handleDrop = (e: React.DragEvent, field: 'logo' | 'banner') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [field]: false }));
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }
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

  const validateStep = (currStep: number): boolean => {
    const stepErrors: Record<string, string> = {};
    
    if (currStep === 1) {
      if (!form.name || form.name.trim().length < 3) {
        stepErrors.name = "Store name must be at least 3 characters";
      }
      if (!form.category) {
        stepErrors.category = "Category is required";
      }
    }
    
    if (currStep === 3) {
      if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
        stepErrors.contactEmail = "Enter a valid email address";
      }
      if (form.contactPhone && !/^\+?[0-9\s-]{8,15}$/.test(form.contactPhone)) {
        stepErrors.contactPhone = "Enter a valid phone number";
      }
    }

    if (currStep === 4) {
      if (form.website && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(form.website)) {
        stepErrors.website = "URL must start with http:// or https://";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (validateStep(4)) {
      setIsLoading(true);
      try {
        let uploadedLogo = "";
        let uploadedBanner = "";
        const filesToUpload: File[] = [];
        if (form.logo instanceof File) filesToUpload.push(form.logo);
        if (form.banner instanceof File) filesToUpload.push(form.banner);

        if (filesToUpload.length > 0) {
          try {
            const uploadRes = await utilityApi.uploadAssets(filesToUpload);
            const urls = uploadRes?.data || uploadRes || [];
            let urlIdx = 0;
            if (form.logo instanceof File && urls[urlIdx]) uploadedLogo = urls[urlIdx++];
            if (form.banner instanceof File && urls[urlIdx]) uploadedBanner = urls[urlIdx++];
          } catch (uploadErr) {
            console.error("Failed to upload assets:", uploadErr);
          }
        }

        const payload = {
          name: form.name,
          description: form.description || null,
          tagline: form.tagline || null,
          categories: [form.category],
          business_infos: {
            type: "OTHERS",
            gst_infos: {
              registered: false,
              number: null
            },
            currency: "INR"
          },
          address: {
            full_address: form.address || "Not specified",
            zip_code: "000000",
            landmark: "",
            latitude: 0,
            longitude: 0
          },
          datas: {
            emails: form.contactEmail ? [form.contactEmail] : [],
            mobile_numbers: form.contactPhone ? [form.contactPhone] : [],
            website: form.website || null
          },
          visible_online: false,
          operating_hours: [],
          delivery_options: []
        };

        const res = await shop.createShop(payload);
        const newShopId = res.data?.id || res.id;

        if (newShopId && (uploadedLogo || uploadedBanner)) {
          try {
            await shop.updateShop({
              id: newShopId,
              logo_url: uploadedLogo || undefined,
              banner_url: uploadedBanner || undefined
            });
          } catch (updateErr) {
            console.error("Failed to update shop images:", updateErr);
          }
        }

        if (newShopId) {
          
          // 1. Create employee record for owner
          const userEmail = localStorage.getItem("user_email") || "owner@example.com";
          const userName = localStorage.getItem("user_name") || "Owner";
          const userPhone = localStorage.getItem("user_phone") || "";
          
          try {
            await employeeApi.createEmployee({
              shop_id: newShopId,
              name: userName,
              role: "OWNER",
              joined_date: new Date().toISOString().split('T')[0],
              mobile_number: userPhone || "0000000000",
              email: userEmail,
              department: "MANAGER",
              additional_infos: {}
            });
          } catch (empErr) {
            console.error("Failed to create default owner employee:", empErr);
          }

          // 2. Exchange session ID and shop ID for token
          const sessionId = localStorage.getItem("session_id");
          if (sessionId && newShopId) {
            try {
              const tokenRes = await authApi.createToken(sessionId, newShopId);
              const tokenData = tokenRes?.data ?? tokenRes;
              if (tokenData && tokenData.access_token) {
                localStorage.setItem("auth_token", tokenData.access_token);
                if (tokenData.refresh_token) {
                  localStorage.setItem("refresh_token", tokenData.refresh_token);
                }
                
                // Decode access_token and store user_id / shop_id in localStorage
                try {
                  const payload = JSON.parse(atob(tokenData.access_token.split('.')[1]));
                  if (payload.user_id) {
                    localStorage.setItem("user_id", payload.user_id);
                  }
                  if (payload.shop_id) {
                    localStorage.setItem("shop_id", payload.shop_id);
                  }
                } catch (decodeErr) {
                  console.error("Failed to decode token after shop creation:", decodeErr);
                }
              }
            } catch (tokenErr) {
              console.error("Failed to exchange tokens after shop creation:", tokenErr);
            }
          }

          if (newShopId) {
            localStorage.setItem("shop_id", newShopId);
            import('@/services/endpoints').then(module => {
              module.setShopId(newShopId);
            });
          }

          // Final save structure: store to mock profile endpoint / localStorage
          const finalProfileData = {
            name: form.name,
            username: `@${form.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
            location: form.address || "Not specified",
            tagline: form.tagline || "Fresh picks, fair prices — delivered to your door.",
            description: form.description || "Your premium storefront, now online.",
            avatar: uploadedLogo || form.logoPreview || "https://api.dicebear.com/7.x/shapes/svg?seed=" + form.name,
            banner: uploadedBanner || form.bannerPreview || "",
            category: form.category,
            themeColor: form.themeColor,
            followers: 0,
            rating: 5.0,
            reviews: 0,
            verified: false,
            online: true,
            memberSince: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone,
            website: form.website,
            instagram: form.instagram,
            twitter: form.twitter,
          };
          
          localStorage.setItem("active-store-profile", JSON.stringify(finalProfileData));
          // Navigate to dashboard
          navigate("/");
        }
      } catch (err) {
        console.error("Failed to create shop", err);
        alert("Failed to create shop");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-2 md:p-6 lg:p-8" style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .step-transition { animation: fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .glow-active { transition: all 0.3s ease; }
        .custom-glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>



      <div className="grid grid-cols-1 gap-8 items-start">
        {/* --- CENTER PANEL: WIZARD FORM --- */}
        <div className="col-span-1 max-w-3xl mx-auto w-full space-y-6">
          {/* STEP INDICATORS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex justify-between items-center relative">
              {/* Progress Line Background */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
              {/* Progress Line Filled */}
              <div 
                className="absolute top-1/2 left-0 h-0.5 transition-all duration-500 -translate-y-1/2 z-0" 
                style={{ 
                  backgroundColor: selectedTheme.color,
                  width: `${((step - 1) / 3) * 100}%` 
                }} 
              />

              {[
                { s: 1, label: "Identity" },
                { s: 2, label: "Assets" },
                { s: 3, label: "Contacts" },
                { s: 4, label: "Socials" }
              ].map((item) => {
                const isActive = step === item.s;
                const isCompleted = step > item.s;
                return (
                  <button
                    key={item.s}
                    onClick={() => {
                      // Allow navigation back or to steps already completed/validated
                      if (item.s < step) setStep(item.s);
                      else if (item.s > step && validateStep(step)) {
                        // Can click forward only if validated up to targeted step
                        let valid = true;
                        for (let k = step; k < item.s; k++) {
                          if (!validateStep(k)) {
                            valid = false;
                            break;
                          }
                        }
                        if (valid) setStep(item.s);
                      }
                    }}
                    className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                  >
                    <div 
                      className={`
                        h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2
                        ${isCompleted 
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                          : isActive 
                            ? `bg-white text-slate-800 ${selectedTheme.glow}` 
                            : "bg-slate-50 border-slate-200 text-slate-400"}
                      `}
                      style={{ 
                        borderColor: isActive ? selectedTheme.color : (isCompleted ? "#2563eb" : undefined),
                        borderWidth: isActive ? "3px" : "2px"
                      }}
                    >
                      {isCompleted ? <Check size={16} strokeWidth={3} /> : item.s}
                    </div>
                    <span 
                      className={`
                        text-[10px] font-bold mt-2 tracking-wide uppercase transition-colors
                        ${isActive ? selectedTheme.text : (isCompleted ? "text-blue-600" : "text-slate-400")}
                      `}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE STEP CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 relative overflow-hidden transition-all duration-300 hover:shadow-lg">
            {/* Ambient background decoration */}
            <div className={`absolute top-0 left-0 w-full h-1 ${selectedTheme.primary}`} />

            <div className="step-transition">
              {/* STEP 1: IDENTITY */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Store Brand Identity</h3>
                    <p className="text-[11px] text-slate-400">Define your shop name, dynamic slogan, and base industry category.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label className="text-xs font-bold text-slate-500">Store Name <span className="text-blue-500">*</span></label>
                        <Tooltip message="This is your brand's public title. Keep it clean and short.">
                          <Info size={12} className="text-slate-400 cursor-help" />
                        </Tooltip>
                      </div>
                      <input 
                        type="text"
                        name="name" 
                        value={form.name} 
                        onChange={handleChange} 
                        placeholder="e.g. Grace Premium Market"
                        className={`w-full px-4 py-3 rounded-lg border outline-none text-sm transition-all duration-200 focus:ring-4 ${
                          errors.name 
                            ? "border-blue-500 focus:border-blue-500 focus:ring-blue-500/10" 
                            : `border-slate-200 ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`
                        }`} 
                      />
                      {errors.name && <p className="text-[10.5px] text-blue-500 mt-1 font-medium flex items-center gap-1"><X size={11} /> {errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <label className="text-xs font-bold text-slate-500">Tagline / Catchphrase</label>
                          <Tooltip message="A catchy phrase that appears next to your store name. Max 60 characters.">
                            <Info size={12} className="text-slate-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <input 
                          type="text"
                          name="tagline" 
                          maxLength={60}
                          value={form.tagline} 
                          onChange={handleChange} 
                          placeholder="Fresh picks, fair prices..." 
                          className={`w-full px-4 py-3 rounded-lg border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`} 
                        />
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9.5px] text-slate-400">Keep it short and impactful</span>
                          <span className="text-[9.5px] text-slate-400 font-medium">{(form.tagline || "").length}/60</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <label className="text-xs font-bold text-slate-500">Store Category <span className="text-blue-500">*</span></label>
                        </div>
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

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-500">Store Description</label>
                        <span className="text-[9.5px] text-slate-400">{(form.description || "").length}/200</span>
                      </div>
                      <textarea 
                        name="description" 
                        value={form.description} 
                        onChange={handleChange} 
                        maxLength={200}
                        rows={4} 
                        placeholder="Tell your customers about your products, history, shipping details, or store philosophy..."
                        className={`w-full px-4 py-3 rounded-lg border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 resize-none ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: MEDIA ASSETS */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Store Branding Assets</h3>
                    <p className="text-[11px] text-slate-400">Upload your store cover banner and brand logo to stand out in the directory.</p>
                  </div>

                  <div className="space-y-5 pt-2">
                    {/* BANNER UPLOAD ZONE */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs font-bold text-slate-500">Store Banner Cover</label>
                        <Tooltip message="Banner image displays at the top of your store page. PNG/JPG, recommended 1200x400. Max 5MB.">
                          <Info size={12} className="text-slate-400 cursor-help" />
                        </Tooltip>
                      </div>
                      
                      <div 
                        onDragEnter={(e) => handleDrag(e, 'banner', true)}
                        onDragOver={(e) => handleDrag(e, 'banner', true)}
                        onDragLeave={(e) => handleDrag(e, 'banner', false)}
                        onDrop={(e) => handleDrop(e, 'banner')}
                        onClick={() => bannerInputRef.current?.click()}
                        className={`
                          relative w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-200
                          ${form.bannerPreview ? 'border-solid border-slate-200' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'}
                          ${dragActive.banner ? `bg-slate-100 border-solid` : ''}
                        `}
                        style={{ borderColor: dragActive.banner ? selectedTheme.color : undefined }}
                      >
                        {form.bannerPreview ? (
                          <>
                            <img 
                              src={form.bannerPreview} 
                              alt="Store Banner" 
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <span className="px-3 py-1.5 bg-white text-xs font-bold rounded-lg text-slate-700 shadow-sm flex items-center gap-1.5"><Upload size={13} /> Change</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeImage('banner'); }}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg shadow-sm transition-all"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-slate-400 p-4">
                            <div className={`p-3 rounded-full bg-white shadow-sm border border-slate-100 mb-2 group-hover:scale-105 transition-transform`}>
                              <ImageIcon size={24} className={selectedTheme.text} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">Drag and drop cover image here</span>
                            <span className="text-[10px] text-slate-400 mt-1">PNG, JPG or WEBP (Max 5MB) — recommended size 1200x400</span>
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
                    </div>

                    {/* LOGO UPLOAD ZONE */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs font-bold text-slate-500">Store Logo / Icon</label>
                        <Tooltip message="Square logo used for cards, notifications, and avatar displays. Recommended 500x500. Max 5MB.">
                          <Info size={12} className="text-slate-400 cursor-help" />
                        </Tooltip>
                      </div>

                      <div className="flex items-center gap-4">
                        <div 
                          onDragEnter={(e) => handleDrag(e, 'logo', true)}
                          onDragOver={(e) => handleDrag(e, 'logo', true)}
                          onDragLeave={(e) => handleDrag(e, 'logo', false)}
                          onDrop={(e) => handleDrop(e, 'logo')}
                          onClick={() => logoInputRef.current?.click()}
                          className={`
                            relative h-24 w-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer shrink-0 transition-all duration-200
                            ${form.logoPreview ? 'border-solid border-slate-200 bg-white' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'}
                            ${dragActive.logo ? 'bg-slate-100 border-solid' : ''}
                          `}
                          style={{ borderColor: dragActive.logo ? selectedTheme.color : undefined }}
                        >
                          {form.logoPreview ? (
                            <>
                              <img src={form.logoPreview} className="w-full h-full object-cover" alt="Logo" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload size={16} className="text-white drop-shadow-md" />
                              </div>
                            </>
                          ) : (
                            <Store size={28} className="text-slate-300" />
                          )}
                          <input 
                            type="file" 
                            ref={logoInputRef}
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleFileChange(e, 'logo')} 
                          />
                        </div>

                        <div className="flex-1 space-y-1">
                          {form.logoPreview ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">logo-loaded.png</span>
                              <button 
                                onClick={() => removeImage('logo')}
                                className="text-xs text-blue-500 hover:text-red-700 font-bold hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs font-semibold text-slate-600">Select or drop a logo file</p>
                          )}
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Supports JPG, PNG, WebP up to 5MB. Will automatically crop to a square aspect ratio.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CONTACT & LOCATION */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Contacts & Physical Address</h3>
                    <p className="text-[11px] text-slate-400">Specify details for order notifications, support channels, and storefront search routing.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <label className="text-xs font-bold text-slate-500">Contact Email</label>
                          <Tooltip message="We will route purchase alerts and client queries here.">
                            <Info size={12} className="text-slate-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <input 
                            type="email"
                            name="contactEmail" 
                            value={form.contactEmail} 
                            onChange={handleChange} 
                            placeholder="support@grace.com"
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none text-sm transition-all duration-200 focus:ring-4 ${
                              errors.contactEmail 
                                ? "border-blue-500 focus:border-blue-500 focus:ring-blue-500/10" 
                                : `border-slate-200 ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`
                            }`}
                          />
                          <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        </div>
                        {errors.contactEmail && <p className="text-[10px] text-blue-500 mt-1 font-medium">{errors.contactEmail}</p>}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <label className="text-xs font-bold text-slate-500">Hotline Phone</label>
                        </div>
                        <div className="relative">
                          <input 
                            type="text"
                            name="contactPhone" 
                            value={form.contactPhone} 
                            onChange={handleChange} 
                            placeholder="+91 98765 43210"
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none text-sm transition-all duration-200 focus:ring-4 ${
                              errors.contactPhone 
                                ? "border-blue-500 focus:border-blue-500 focus:ring-blue-500/10" 
                                : `border-slate-200 ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`
                            }`}
                          />
                          <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        </div>
                        {errors.contactPhone && <p className="text-[10px] text-blue-500 mt-1 font-medium">{errors.contactPhone}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Business / Shop Address</label>
                      <div className="relative">
                        <input 
                          type="text"
                          name="address" 
                          value={form.address} 
                          onChange={handleChange} 
                          placeholder="Block 4A, Green Street, Chennai, 600001"
                          className={`w-full pl-10 pr-10 py-3 rounded-lg border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`} 
                        />
                        <MapPin className={`absolute left-3.5 top-3.5 text-slate-400`} size={16} />
                        <MapPin className={`absolute right-3.5 top-3.5 ${selectedTheme.text} opacity-60 pointer-events-none`} size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: CUSTOM BRANDING & SOCIALS */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Socials</h3>
                    <p className="text-[11px] text-slate-400">Link your social channels.</p>
                  </div>

                  <div className="space-y-5 pt-2">

                    {/* SOCIAL LINKS */}
                    <div className="space-y-3.5">
                      <label className="block text-xs font-bold text-slate-500">Social Connections</label>
                      
                      <div className="relative">
                        <input 
                          type="text"
                          name="website" 
                          value={form.website} 
                          onChange={handleChange} 
                          placeholder="https://grace-market.com"
                          className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none text-sm transition-all duration-200 focus:ring-4 ${
                            errors.website 
                              ? "border-blue-500 focus:border-blue-500 focus:ring-blue-500/10" 
                              : `border-slate-200 ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`
                          }`}
                        />
                        <Globe className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      </div>
                      {errors.website && <p className="text-[10px] text-blue-500 font-medium">{errors.website}</p>}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="relative">
                          <input 
                            type="text"
                            name="instagram" 
                            value={form.instagram} 
                            onChange={handleChange} 
                            placeholder="Instagram handle (e.g. gracemarket)"
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`} 
                          />
                          <Instagram className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        </div>

                        <div className="relative">
                          <input 
                            type="text"
                            name="twitter" 
                            value={form.twitter} 
                            onChange={handleChange} 
                            placeholder="Twitter handle (e.g. grace_market)"
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 outline-none text-sm transition-all duration-200 focus:ring-4 ${selectedTheme.focusBorder} ${selectedTheme.focusRing}`} 
                          />
                          <Twitter className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between items-center">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-bold text-xs transition-all shadow-sm ${selectedTheme.primary}`}
                >
                  Next Step <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-6 py-2.5 rounded-lg font-bold text-xs transition-all shadow-md ${
                    isLoading ? "bg-slate-400 cursor-not-allowed text-white" : selectedTheme.primary
                  }`}
                >
                  {isLoading ? "Saving..." : "Save Store Details"} 
                  {!isLoading && <Check size={14} strokeWidth={2.5} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
