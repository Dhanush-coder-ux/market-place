import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Hash,
  Building2,
  Tag,
  Instagram,
  Facebook,
  Clock,
  BadgeCheck,
  Save,
  Bookmark,
} from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS } from "@/services/endpoints";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import ImageUpload from "@/components/common/ImageUpload";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import Loader from "@/components/common/Loader";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ProfileData {
  name: string;
  shop_code: string;
  category: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  website: string;
  instagram: string;
  facebook: string;
  business_type: string;
  gst_number: string;
  currency: string;
  open_time: string;
  close_time: string;
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
  { label: "Sole Proprietor", value: "sole" },
  { label: "Partnership", value: "partnership" },
  { label: "Private Limited (Pvt. Ltd.)", value: "pvt_ltd" },
  { label: "LLP", value: "llp" },
  { label: "NGO / Trust", value: "ngo" },
];

const currencyOptions = [
  { label: "INR — Indian Rupee (₹)", value: "INR" },
  { label: "USD — US Dollar ($)", value: "USD" },
  { label: "EUR — Euro (€)", value: "EUR" },
  { label: "GBP — British Pound (£)", value: "GBP" },
];

// ─── ProfileForm ────────────────────────────────────────────────────────────

const ProfileForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();
  const { postData, putData, getData, loading } = useApi();
  
  const [logo, setLogo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialFormData: ProfileData = {
    name: "",
    shop_code: "",
    category: "",
    tagline: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    website: "",
    instagram: "",
    facebook: "",
    business_type: "",
    gst_number: "",
    currency: "INR",
    open_time: "09:00",
    close_time: "21:00",
    description: "",
  };

  const [formData, setFormData] = useState<ProfileData>(initialFormData);

  // Load Data/Draft
  useEffect(() => {
    if (id) {
      getData(`${ENDPOINTS.SHOPS}/${id}`).then((res) => {
        if (res && res.data) {
          const shop = res.data;
          const d = shop.datas || {};
          const b = shop.business_infos || {};
          const a = shop.address || {};
          
          setFormData({
            name: shop.name || "",
            shop_code: d.shop_code || "",
            category: shop.category || "",
            tagline: d.tagline || "",
            email: d.emails?.[0] || "",
            phone: d.mobile_numbers?.[0] || "",
            address: a.street || "",
            city: a.city || "",
            pincode: a.pincode || "",
            website: d.website || "",
            instagram: d.instagram || "",
            facebook: d.facebook || "",
            business_type: b.business_type || "",
            gst_number: b.gst || "",
            currency: b.currency || "INR",
            open_time: b.open_time || "09:00",
            close_time: b.close_time || "21:00",
            description: d.description || "",
          });
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

  // Header Actions
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 md:animate-in md:fade-in md:slide-in-from-right-4 md:duration-300">
        {!id && (
          <button 
            type="button"
            onClick={handleSaveDraft}
            className="px-4 h-8 rounded-lg border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 md:hover:bg-blue-100 md:transition-all flex items-center gap-2 whitespace-nowrap overflow-hidden"
          >
            <Bookmark size={14} className="shrink-0" />
            <span className="truncate">Save Draft</span>
          </button>
        )}
        <GradientButton 
          icon={<Save size={16} />} 
          onClick={() => handleSubmit()} 
          disabled={submitting}
          className="rounded-lg shadow-md text-xs px-8 h-8 flex items-center"
        >
          {submitting ? "..." : (id ? "Save Changes" : "Create Shop")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, formData, submitting, id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("profile_drafts") || "[]");
    const draftId = searchParams.get("draftId") || crypto.randomUUID();
    
    const newDraft = {
      id: draftId,
      timestamp: new Date().toISOString(),
      displayName: formData.name || "New Shop",
      data: formData
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
    if (!formData.category) return showToast("Category is required", "error");

    setSubmitting(true);
    
    const payload = {
      name: formData.name,
      category: formData.category,
      business_infos: {
        business_type: formData.business_type,
        gst: formData.gst_number,
        currency: formData.currency,
        open_time: formData.open_time,
        close_time: formData.close_time,
      },
      address: {
        street: formData.address,
        city: formData.city,
        pincode: formData.pincode,
      },
      image_urls: [], // Logic for images can be added later
      datas: {
        description: formData.description,
        emails: [formData.email],
        mobile_numbers: [formData.phone],
        website: formData.website,
        tagline: formData.tagline,
        shop_code: formData.shop_code,
        instagram: formData.instagram,
        facebook: formData.facebook,
      }
    };

    try {
      const res = id 
        ? await putData(ENDPOINTS.SHOPS, { ...payload, id })
        : await postData(ENDPOINTS.SHOPS, payload);

      if (res) {
        showToast(id ? "Shop profile updated" : "Shop created successfully", "success");
        // Remove draft if it exists
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const drafts = JSON.parse(localStorage.getItem("profile_drafts") || "[]");
          localStorage.setItem("profile_drafts", JSON.stringify(drafts.filter((d: any) => d.id !== draftId)));
        }
        navigate("/profile");
      }
    } catch {
      showToast("Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && id) return <div className="py-20 text-center"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 md:animate-in md:fade-in md:duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column (8/12) */}
        <div className="md:col-span-8 space-y-8">
          
          {/* Shop Identity Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16" />
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Store size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-800  ">Shop Identity</h3>
                <p className="text-[11px] font-bold text-slate-400">Brand and visual presence</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 gap-3">
                <span className="text-[10px] font-black text-slate-400  ">Shop Logo</span>
                <ImageUpload label="Logo" value={logo} onChange={setLogo} />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Shop Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sunrise Mart"
                  className="h-12 font-bold text-slate-700"
                  required
                />
              </div>

              <Input
                label="Shop Code / ID"
                name="shop_code"
                value={formData.shop_code}
                onChange={handleChange}
                placeholder="e.g. SHOP-001"
                leftIcon={<Hash size={16} className="text-slate-400" />}
              />

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400   ml-1">Category</label>
                <ReusableSelect
                  value={formData.category}
                  onValueChange={(val) => setFormData(p => ({ ...p, category: val }))}
                  options={categoryOptions}
                  placeholder="Select Category"
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Tagline"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. Fresh deals, every day!"
                  leftIcon={<Tag size={16} className="text-slate-400" />}
                />
              </div>
            </div>
          </div>

          {/* Contact & Location Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-800  ">Contact & Location</h3>
                <p className="text-[11px] font-bold text-slate-400">Physical and digital reach</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="shop@example.com"
                leftIcon={<Mail size={16} className="text-slate-400" />}
              />
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 00000 00000"
                leftIcon={<Phone size={16} className="text-slate-400" />}
              />
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Chennai"
                leftIcon={<Building2 size={16} className="text-slate-400" />}
              />
              <Input
                label="PIN Code"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="600001"
                leftIcon={<Hash size={16} className="text-slate-400" />}
              />
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400   ml-1">Street Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 md:transition-all placeholder:text-slate-300 resize-none outline-none"
                  placeholder="House No, Street, Area"
                />
              </div>
            </div>
          </div>

          {/* Online Presence Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-800  ">Online Presence</h3>
                <p className="text-[11px] font-bold text-slate-400">Social media and website links</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourshop.com"
                leftIcon={<Globe size={16} className="text-slate-400" />}
              />
              <Input
                label="Instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@yourshop"
                leftIcon={<Instagram size={16} className="text-slate-400" />}
              />
              <Input
                label="Facebook"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="facebook.com/yourshop"
                leftIcon={<Facebook size={16} className="text-slate-400" />}
              />
            </div>
          </div>
        </div>

        {/* Right Column (4/12) */}
        <div className="md:col-span-4 space-y-8">
          
          {/* Business Details Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mb-8 blur-2xl" />
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600">
                <BadgeCheck size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black   text-slate-800">Business Details</h3>
                <p className="text-[11px] font-bold text-slate-400">Operational configuration</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400   ml-1">Business Type</label>
                <ReusableSelect
                  value={formData.business_type}
                  onValueChange={(val) => setFormData(p => ({ ...p, business_type: val }))}
                  options={businessTypeOptions}
                  placeholder="Select Type"
                />
              </div>

              <Input
                label="GST Number"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5"
                leftIcon={<FileText size={16} className="text-slate-400" />}
              />

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400   ml-1">Currency</label>
                <ReusableSelect
                  value={formData.currency}
                  onValueChange={(val) => setFormData(p => ({ ...p, currency: val }))}
                  options={currencyOptions}
                  placeholder="Select Currency"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Opening Time"
                  name="open_time"
                  type="time"
                  value={formData.open_time}
                  onChange={handleChange}
                  leftIcon={<Clock size={16} className="text-slate-400" />}
                />
                <Input
                  label="Closing Time"
                  name="close_time"
                  type="time"
                  value={formData.close_time}
                  onChange={handleChange}
                  leftIcon={<Clock size={16} className="text-slate-400" />}
                />
              </div>
            </div>
          </div>

          {/* Shop Description Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <FileText size={16} />
              </div>
              <h3 className="text-[10px] font-black text-slate-800  ">Shop Description</h3>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 md:transition-all placeholder:text-slate-300 resize-none outline-none"
              placeholder="Tell customers what makes your shop special..."
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileForm;

