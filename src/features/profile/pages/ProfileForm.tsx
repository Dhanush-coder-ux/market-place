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
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
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

const businessTypeOptions = [
  { label: "Sole Proprietor", value: "SOLO_PROPRIETOR" },
  { label: "Partnership", value: "PARTNERSHIP" },
  { label: "Private Limited (Pvt. Ltd.)", value: "PRIVATE_LIMITED" },
  { label: "LLP", value: "LLP" },
  { label: "Others", value: "OTHERS" },
];

const currencyOptions = [
  { label: "INR — Indian Rupee (₹)", value: "INR" },
  { label: "USD — US Dollar ($)", value: "USD" },
  { label: "EUR — Euro (€)", value: "EUR" },
];

// ─── Shared Styles (from ProductForm) ───────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  .pf-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
  .pf-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .pf-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .pf-section-enter { animation: secIn 0.22s ease forwards; }
  @keyframes secIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
  .pf-fade-in { animation: fadeIn 0.2s ease forwards; }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

  .pf-card { transition: box-shadow 0.18s ease; }
  .pf-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }

  .pf-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: white;
    border-top: 1px solid #e2e8f0;
    padding: 10px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
  }
`;

// ─── UI Components (from ProductForm) ───────────────────────────────────────

interface LabelProps { text: string; required?: boolean; hint?: string; tooltip?: string; }
const Label: React.FC<LabelProps> = ({ text, required, hint, tooltip }) => (
  <div className="flex items-center gap-1.5 mb-1.5">
    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
      {text}{required && <span className="text-red-400 ml-0.5">*</span>}
      {hint && <span className="ml-1.5 normal-case font-normal text-slate-400 lowercase">({hint})</span>}
    </label>
    {tooltip && (
      <div className="group relative flex items-center">
        <Info size={11} className="text-slate-400 cursor-help hover:text-indigo-500 transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl normal-case font-medium tracking-normal leading-relaxed">
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
    <div className="relative">
      {leftEl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">{leftEl}</span>}
      <input
        {...rest}
        className={`pf-input w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-300 ${leftEl ? "pl-8" : ""} ${rightEl ? "pr-14" : ""} ${error ? "border-red-300 bg-red-50/30" : ""} ${rest.disabled ? "bg-slate-50 cursor-not-allowed" : ""} ${className}`}
      />
      {rightEl && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{rightEl}</span>}
    </div>
    {error && <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={10} />{error}</p>}
  </div>
);

const SectionCard: React.FC<{ icon: React.ReactNode; iconBg: string; title: string; subtitle?: string; children: React.ReactNode; extra?: React.ReactNode }> = ({ icon, iconBg, title, subtitle, children, extra }) => (
  <div className="pf-card bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {extra}
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// ─── ProfileForm ────────────────────────────────────────────────────────────

const ProfileForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      getData(`${ENDPOINTS.SHOPS}/${id}`).then((res) => {
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
          number: formData.gst_registered ? (formData.gst_number || null) : null,
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
        navigate(id ? "/profile" : "/shop-select");
      }
    } catch {
      showToast("Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && id) return <div className="py-20 text-center"><Loader /></div>;

  return (
    <div className="pf-root bg-slate-50 min-h-screen pb-32">
      <style>{STYLES}</style>
      
      {/* Main Container */}
      <div className="w-full mx-auto px-4 py-8 md:animate-in md:fade-in md:duration-500">

        {/* Using a grid to accommodate the sections nicely */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            
            {/* SECTION 1: Shop Identity */}
            <SectionCard
              icon={<Store size={17} className="text-blue-600" />}
              iconBg="bg-blue-50"
              title="Shop Identity"
              subtitle="Brand and visual presence"
            >
              <div className="space-y-5">
                <InputField
                  label="Shop Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sunrise Mart"
                  required
                  className="font-semibold text-base"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <Label text="Currency" />
                    <ReusableSelect
                      value={formData.currency}
                      onValueChange={(val) => setFormData((p) => ({ ...p, currency: val }))}
                      options={currencyOptions}
                      placeholder="Select Currency"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label text="Description" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="pf-input w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 focus:ring-0 transition-all placeholder:text-slate-300 resize-none"
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
                <div className="space-y-1.5">
                  <Label text="Full Address" />
                  <textarea
                    name="full_address"
                    value={formData.full_address}
                    onChange={handleChange}
                    rows={3}
                    className="pf-input w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 focus:ring-0 transition-all placeholder:text-slate-300 resize-none"
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
                  <InputField
                    label="Latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g. 9.9252"
                  />
                  <InputField
                    label="Longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g. 78.1198"
                  />
                </div>
              </div>
            </SectionCard>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* SECTION 3: Legal & Tax Information */}
            <SectionCard
              icon={<BadgeCheck size={17} className="text-purple-600" />}
              iconBg="bg-purple-50"
              title="Legal & Tax"
              subtitle="Business registration and compliance"
            >
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label text="Business Type" />
                  <ReusableSelect
                    value={formData.business_type}
                    onValueChange={(val) => setFormData((p) => ({ ...p, business_type: val }))}
                    options={businessTypeOptions}
                    placeholder="Select Type"
                  />
                </div>

                <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.gst_registered}
                      onChange={(e) => setFormData(p => ({ ...p, gst_registered: e.target.checked }))}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                    />
                    <span className="text-sm font-semibold text-slate-700">GST Registered</span>
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
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  What happens next?
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    "Your shop is created and saved securely.",
                    "You'll be redirected to the shop selector.",
                    "Select your new shop to enter its dashboard.",
                    "Use the Setup Wizard to launch your store."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs font-medium text-indigo-800 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;

