import { useEffect, useState, ChangeEvent } from "react";
import type { StoreFormData, StoreSetupProps } from "@/features/digitalstore/type"; 
import { MapPin, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { authApi } from "@/services/api/auth";
import { employeeApi } from "@/services/api/employee";

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
  gstRegistered: false,
  gstNumber: "",
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  // Autosave draft only textual details
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

  const validate = (): boolean => {
    const stepErrors: Record<string, string> = {};
    
    if (!form.name || form.name.trim().length < 3) {
      stepErrors.name = "Store name must be at least 3 characters";
    }
    if (!form.category) {
      stepErrors.category = "Category is required";
    }
    if (form.gstRegistered && (!form.gstNumber || form.gstNumber.trim().length !== 15)) {
      stepErrors.gstNumber = "Please enter a valid 15-character GSTIN";
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleSave = async () => {
    if (validate()) {
      setIsLoading(true);
      try {
        const payload = {
          name: form.name,
          description: form.description || null,
          tagline: form.tagline || null,
          categories: [form.category],
          business_infos: {
            type: "OTHERS",
            gst_infos: {
              registered: !!form.gstRegistered,
              number: form.gstRegistered ? (form.gstNumber?.toUpperCase().trim() || null) : null
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
            emails: [],
            mobile_numbers: [],
            website: null
          },
          visible_online: false,
          operating_hours: [],
          delivery_options: []
        };

        const res = await shop.createShop(payload);
        const newShopId = res.data?.id || res.id;

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

          const finalProfileData = {
            name: form.name,
            username: `@${form.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
            location: form.address || "Not specified",
            tagline: form.tagline || "Fresh picks, fair prices — delivered to your door.",
            description: form.description || "Your premium storefront, now online.",
            avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=" + form.name,
            banner: "",
            category: form.category,
            themeColor: form.themeColor,
            followers: 0,
            rating: 5.0,
            reviews: 0,
            verified: false,
            online: true,
            memberSince: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
            contactEmail: "",
            contactPhone: "",
            website: "",
            instagram: "",
            twitter: "",
          };
          
          localStorage.setItem("active-store-profile", JSON.stringify(finalProfileData));
          localStorage.removeItem("store-draft");
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
      <div className="max-w-xl mx-auto w-full space-y-6">
        
        {/* Onboarding Header */}
        <div className="text-center py-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Setup Your Store</h2>
          <p className="text-xs text-slate-400 mt-1">Let's create your shop profile to get you onboarded.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />

          <div className="space-y-5">
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

          {/* ACTION BUTTON */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className={`flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md w-full md:w-auto ${
                isLoading ? "bg-slate-400 cursor-not-allowed text-white" : selectedTheme.primary
              }`}
            >
              {isLoading ? "Creating Store..." : "Create Shop"}
              {!isLoading && <Check size={16} strokeWidth={2.5} />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
