import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Store,
  MapPin,
  FileText,
  Hash,
  BadgeCheck,
  Save,
  Bookmark,
  Info,
  AlertCircle
} from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/context/ApiContext";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import { ENDPOINTS } from "@/services/endpoints";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import LocationMapPicker from "@/components/ui/LocationMapPicker";
import Loader from "@/components/common/Loader";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ProfileData {
  name: string;
  category: string[];
  full_address: string;
  landmark: string;
  pincode: string;
  latitude: string;
  longitude: string;
  business_type: string;
  gst_registered: boolean;
  gst_number: string;
  currency: string;
  description: string;
}

// ─── Options ────────────────────────────────────────────────────────────────

const categoryOptions = [
  { label: "Electronics", value: "electronics" },
  { label: "Clothing & Apparel", value: "clothing" },
  { label: "Groceries & Food", value: "groceries" },
  { label: "Home & Furniture", value: "home" },
  { label: "Books & Stationery", value: "books" },
  { label: "Health & Beauty", value: "health" },
  { label: "Sports & Outdoors", value: "sports" },
  { label: "Other", value: "other" },
];

// ─── Shared Styles (from ProductForm) ───────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  .pf-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; background: #f8fafc; }
  .pf-root::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; height: 100vh;
    background: radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.04), transparent 50%),
                radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.04), transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  
  .pf-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
  .pf-input { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
  .pf-input:hover:not(:disabled) { border-color: #cbd5e1; }
  
  .pf-section-enter { animation: secIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes secIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
  .pf-fade-in { animation: fadeIn 0.3s ease forwards; }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

  .pf-card { 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
  }
  .pf-card:hover { 
    box-shadow: 0 12px 24px -8px rgba(99, 102, 241, 0.08); 
    transform: translateY(-2px);
    border-color: rgba(99, 102, 241, 0.2);
  }

  .pf-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(226, 232, 240, 0.8);
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.03);
  }
`;

// ─── UI Components (from ProductForm) ───────────────────────────────────────

interface LabelProps { text: string; required?: boolean; hint?: string; tooltip?: string; }
const Label: React.FC<LabelProps> = ({ text, required, hint, tooltip }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
      {text}{required && <span className="text-red-500 ml-1 text-sm leading-none">*</span>}
      {hint && <span className="ml-2 normal-case font-medium text-slate-400 capitalize-first tracking-normal">({hint})</span>}
    </label>
    {tooltip && (
      <div className="group relative flex items-center">
        <Info size={13} className="text-slate-400 cursor-help hover:text-indigo-500 transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-slate-800 text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl normal-case font-medium tracking-normal leading-relaxed">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
        </div>
      </div>
    )}
  </div>
);

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  hint?: string;
  leftEl?: React.ReactNode;
  rightEl?: React.ReactNode;
  error?: string;
  tooltip?: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, required, hint, leftEl, rightEl, error, tooltip, className = "", ...rest }) => (
  <div className={`transition-opacity duration-200 ${rest.disabled ? "opacity-50" : ""}`}>
    {label && <Label text={label} required={required} hint={hint} tooltip={tooltip} />}
    <div className="relative group">
      {leftEl && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none group-hover:text-indigo-400 transition-colors">{leftEl}</span>}
      <input
        {...rest}
        className={`pf-input w-full px-4 py-3 text-sm font-medium border border-slate-200/80 rounded-xl bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 ${leftEl ? "pl-10" : ""} ${rightEl ? "pr-14" : ""} ${error ? "border-red-300 bg-red-50/30" : ""} ${rest.disabled ? "bg-slate-50 cursor-not-allowed" : ""} ${className}`}
      />
      {rightEl && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{rightEl}</span>}
    </div>
    {error && <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1.5"><AlertCircle size={12} />{error}</p>}
  </div>
);

const SectionCard: React.FC<{ icon: React.ReactNode; iconBg: string; title: string; subtitle?: string; children: React.ReactNode; extra?: React.ReactNode }> = ({ icon, iconBg, title, subtitle, children, extra }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 border-b border-slate-200/50 last:border-0 relative z-10">
    <div className="lg:col-span-1">
      <div className="sticky top-24">
        <div className="flex items-center gap-4 mb-3">
          <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 shadow-sm border border-white/50`}>
            {icon}
          </div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-slate-500 leading-relaxed pr-6">{subtitle}</p>}
        {extra && <div className="mt-4">{extra}</div>}
      </div>
    </div>
    <div className="lg:col-span-2">
      <div className="pf-card rounded-2xl overflow-hidden p-7 bg-white/60">
        {children}
      </div>
    </div>
  </div>
);

// ─── ProfileForm ────────────────────────────────────────────────────────────

const ProfileForm: React.FC = () => {
  const { id: pathId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = pathId || searchParams.get("id") || undefined;
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();
  const { postData, putData, getData, loading } = useApi();
  const { setGstType } = usePurchaseSettings();

  const [submitting, setSubmitting] = useState(false);

  const initialFormData: ProfileData = {
    name: "",
    category: [],
    full_address: "",
    landmark: "",
    pincode: "",
    latitude: "",
    longitude: "",
    business_type: "SOLO_PROPRIETOR",
    gst_registered: false,
    gst_number: "",
    currency: "INR",
    description: "",
  };

  const [formData, setFormData] = useState<ProfileData>(initialFormData);

  // Load Data/Draft
  useEffect(() => {
    if (id) {
      getData(`${ENDPOINTS.SHOPS}/by/${id}`).then((res) => {
        if (res && res.data) {
          const shop = res.data;
          const b = shop.business_infos || {};
          const a = shop.address || {};

          setFormData({
            name: shop.name || "",
            category: Array.isArray(shop.categories) ? shop.categories : (shop.categories ? [shop.categories] : []),
            description: shop.description || "",
            full_address: a.full_address || "",
            landmark: a.landmark || "",
            pincode: a.zip_code || "",
            latitude: String(a.latitude || ""),
            longitude: String(a.longitude || ""),
            business_type: b.type || "SOLO_PROPRIETOR",
            gst_registered: b.gst_infos?.registered ?? false,
            gst_number: b.gst_infos?.number || "",
            currency: b.currency || "INR",
          });
          setGstType(b.gst_infos?.registered ? "registered" : "non-registered");
        }
      });
    } else {
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("profile_drafts") || "[]");
        const draft = drafts.find((d: any) => d.id === draftId);
        if (draft) setFormData(draft.data);
      }
    }
  }, [id, searchParams]);

  // Bottom Action Bar (ProductForm style)
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={submitting}
            className="px-4 h-9 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs bg-white hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Bookmark size={14} className="shrink-0" />
            Save draft
          </button>
        )}
        <GradientButton
          icon={<Save size={15} />}
          onClick={() => handleSubmit()}
          disabled={submitting}
          className="rounded-lg shadow-md text-xs px-6 h-9 flex items-center"
        >
          {submitting ? "Saving..." : id ? "Save Changes" : "Create Shop"}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, formData, submitting, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const finalValue = name.includes("gst") ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("profile_drafts") || "[]");
    const draftId = searchParams.get("draftId") || crypto.randomUUID();

    const newDraft = {
      id: draftId,
      timestamp: new Date().toISOString(),
      displayName: formData.name || "New Shop",
      data: formData,
    };

    const existingIndex = drafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) drafts[existingIndex] = newDraft;
    else drafts.unshift(newDraft);

    localStorage.setItem("profile_drafts", JSON.stringify(drafts));
    showToast("Progress saved to drafts", "success");
    if (!searchParams.get("draftId")) navigate(`/profile/add?draftId=${draftId}`, { replace: true });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name) return showToast("Shop name is required", "error");
    if (formData.category.length === 0) return showToast("Category is required", "error");

    setSubmitting(true);

    const payload = {
      name: formData.name,
      description: formData.description || null,
      categories: formData.category,
      business_infos: {
        type: formData.business_type || "SOLO_PROPRIETOR",
        gst_infos: {
          registered: formData.gst_registered,
          ...(formData.gst_registered && formData.gst_number ? { number: formData.gst_number } : {}),
        },
        currency: formData.currency || "INR",
      },
      address: {
        full_address: formData.full_address || "",
        zip_code: formData.pincode || "",
        landmark: formData.landmark || "",
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
      },
      visible_online: false,
    };

    try {
      const res = id
        ? await putData(ENDPOINTS.SHOPS, { ...payload, id })
        : await postData(ENDPOINTS.SHOPS, payload);

      if (res) {
        showToast(
          id ? "Shop profile updated" : "Shop created! Select it to continue.",
          "success"
        );
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const drafts = JSON.parse(localStorage.getItem("profile_drafts") || "[]");
          localStorage.setItem(
            "profile_drafts",
            JSON.stringify(drafts.filter((d: any) => d.id !== draftId))
          );
        }
        setGstType(formData.gst_registered ? "registered" : "non-registered");
        navigate(id ? "/" : "/shop-select");
      }
    } catch {
      showToast("Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && id) return <div className="py-20 text-center"><Loader /></div>;

  return (
    <div className="pf-root min-h-screen pb-32 relative">
      <style>{STYLES}</style>
      
      {/* Main Container */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:animate-in md:fade-in md:duration-500 relative z-10">
        
        {/* Header Title */}
        <div className="mb-8 border-b border-slate-200/60 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{id ? "Edit Shop Profile" : "Create New Shop"}</h1>
          <p className="text-sm text-slate-500 mt-2">Fill out the details below to set up your shop's profile and settings.</p>
        </div>

        <div className="space-y-4">
          
          {/* SECTION 1: Shop Identity */}
            <SectionCard
              icon={<Store size={17} className="text-blue-600" />}
              iconBg="bg-blue-50"
              title="Shop Identity"
              subtitle="Brand and visual presence"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <InputField
                    label="Shop Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Sunrise Mart"
                    required
                    className="font-bold text-lg py-3"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label text="Categories" required />
                  <SearchSelect
                    value={formData.category}
                    onChange={(val) => setFormData(prev => ({ ...prev, category: val as string[] }))}
                    options={categoryOptions}
                    labelKey="label"
                    valueKey="value"
                    multiple
                    placeholder="Select categories..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label text="Description" hint="Optional" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="pf-input w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-0 transition-all placeholder:text-slate-400 resize-none hover:border-slate-300"
                    placeholder="Tell customers what makes your shop special..."
                  />
                </div>
              </div>
            </SectionCard>

            {/* SECTION 2: Contact & Location */}
            <SectionCard
              icon={<MapPin size={17} className="text-emerald-600" />}
              iconBg="bg-emerald-50"
              title="Contact & Location"
              subtitle="Where customers can find you"
            >
              <div className="space-y-5">

                {/* Interactive Map Picker */}
                <div className="space-y-1.5">
                  <Label text="Pick Location on Map" tooltip="Click on the map or search to set your shop's exact location. Coordinates will be captured automatically." />
                  <LocationMapPicker
                    lat={parseFloat(formData.latitude) || undefined}
                    lng={parseFloat(formData.longitude) || undefined}
                    onChange={(coords, address) => {
                      setFormData(prev => ({
                        ...prev,
                        latitude: String(coords.lat),
                        longitude: String(coords.lng),
                        full_address: address || prev.full_address,
                      }));
                    }}
                  />
                </div>

                <div className="space-y-1.5 mt-4">
                  <Label text="Full Address" />
                  <textarea
                    name="full_address"
                    value={formData.full_address}
                    onChange={handleChange}
                    rows={3}
                    className="pf-input w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-0 transition-all placeholder:text-slate-400 resize-none hover:border-slate-300"
                    placeholder="Full street address including area"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputField
                    label="PIN Code"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="600001"
                    leftEl={<Hash size={14} />}
                  />
                  <InputField
                    label="Landmark"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="e.g. Near City Mall"
                    leftEl={<MapPin size={14} />}
                  />
                </div>
              </div>
            </SectionCard>

            {/* SECTION 3: Legal & Tax Information */}
            <SectionCard
              icon={<BadgeCheck size={17} className="text-purple-600" />}
              iconBg="bg-purple-50"
              title="Legal & Tax"
              subtitle="Business registration and compliance"
            >
              <div className="space-y-5">


                <div className="space-y-4 p-5 bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-xl transition-all hover:bg-slate-50">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={formData.gst_registered}
                        onChange={(e) => setFormData(p => ({ ...p, gst_registered: e.target.checked }))}
                        className="peer w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">GST Registered Business</span>
                  </label>
                  {formData.gst_registered && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <InputField
                        label="GST Number"
                        name="gst_number"
                        value={formData.gst_number}
                        onChange={handleChange}
                        placeholder="22AAAAA0000A1Z5"
                        leftEl={<FileText size={14} />}
                      />
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* What happens next — only on create */}
            {!id && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6 shadow-sm mt-8 relative z-10">
                <h3 className="text-base font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  What happens next?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    "Your shop is created and saved securely.",
                    "You'll be redirected to the shop selector.",
                    "Select your new shop to enter its dashboard.",
                    "Use the Setup Wizard to launch your store."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white/50 p-4 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-medium text-indigo-800 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;

