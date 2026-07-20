import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  FileText,
  Hash,
  Tag,
  BadgeCheck,
  Save,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS } from "@/services/endpoints";
import { shopApi } from "@/services/api/shop";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import ImageUpload from "@/components/common/ImageUpload";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import Loader from "@/components/common/Loader";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ProfileData {
  name: string;
  category: string;
  tagline: string;
  email: string;
  phone: string;
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

// ─── ProfileForm ────────────────────────────────────────────────────────────

const ProfileForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();
  const { postData, putData, getData, loading } = useApi();

  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialFormData: ProfileData = {
    name: "",
    category: "",
    tagline: "",
    email: "",
    phone: "",
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

          setLogoUrl(shop.logo_url || null);
          setBannerUrl(shop.banner_url || null);

          setFormData({
            name: shop.name || "",
            category: shop.categories?.[0] || "",
            tagline: shop.tagline || "",
            description: shop.description || "",
            email: shop.additional_infos?.emails?.[0] || "",
            phone: shop.additional_infos?.mobile_numbers?.[0] || "",
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
          {submitting ? "..." : id ? "Save Changes" : "Create Shop"}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, formData, submitting, id]);

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
    if (!formData.category) return showToast("Category is required", "error");

    setSubmitting(true);

    let finalLogoUrl = logoUrl;
    let finalBannerUrl = bannerUrl;
    try {
      if (logo) {
        const res = await shopApi.uploadShopImage(logo, "logo");
        if (res?.data?.logo_url) finalLogoUrl = res.data.logo_url;
      }
      if (banner) {
        const res = await shopApi.uploadShopImage(banner, "banner");
        if (res?.data?.banner_url) finalBannerUrl = res.data.banner_url;
      }
    } catch (err) {
      console.error("Image upload failed", err);
      showToast("Failed to upload images", "error");
    }

    const payload = {
      name: formData.name,
      tagline: formData.tagline || null,
      description: formData.description || null,
      categories: [formData.category],
      business_infos: {
        type: formData.business_type || "SOLO_PROPRIETOR",
        gst_infos: {
          registered: formData.gst_registered,
          number: formData.gst_number || null,
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
      additional_infos: {
        emails: formData.email ? [formData.email] : [],
        mobile_numbers: formData.phone ? [formData.phone] : [],
      },
      visible_online: false,
      logo_url: finalLogoUrl,
      banner_url: finalBannerUrl,
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
        // After creating → go to shop-select; after editing → stay on profile
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 md:animate-in md:fade-in md:duration-500">
      {/* Page Header — only on create */}
      {!id && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
              <Store size={18} />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Create Your Shop</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium ml-12">
            Set up your basic shop info. You can launch your digital store later via the Setup Wizard.
          </p>
          <div className="mt-4 ml-12 flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg px-3 py-2 w-fit border border-blue-100">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
            Create Shop
            <ChevronRight size={14} className="text-blue-400" />
            <span className="text-slate-400">2. Select Shop</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-400">3. Setup Wizard</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="md:col-span-8 space-y-6">
          {/* Shop Identity */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16" />
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Store size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800">Shop Identity</h3>
                <p className="text-[11px] font-medium text-slate-400">Brand and visual presence</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 gap-2">
                <span className="text-[10px] font-black text-slate-400">Shop Logo</span>
                <ImageUpload label="Logo" value={logo} onChange={setLogo} initialPreview={logoUrl} />
              </div>
              <div className="flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 gap-2">
                <span className="text-[10px] font-black text-slate-400">Banner Image</span>
                <ImageUpload label="Banner" value={banner} onChange={setBanner} initialPreview={bannerUrl} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Input
                  label="Shop Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sunrise Mart"
                  className="h-11 font-bold text-slate-700"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1">Category *</label>
                <ReusableSelect
                  value={formData.category}
                  onValueChange={(val) => setFormData((p) => ({ ...p, category: val }))}
                  options={categoryOptions}
                  placeholder="Select Category"
                />
              </div>
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

          {/* Contact & Location */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800">Contact & Location</h3>
                <p className="text-[11px] font-medium text-slate-400">Where customers can find you</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                label="PIN Code"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="600001"
                leftIcon={<Hash size={16} className="text-slate-400" />}
              />
              <Input
                label="Landmark"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="e.g. Near City Mall"
                leftIcon={<MapPin size={16} className="text-slate-400" />}
              />
              <Input
                label="Latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="e.g. 9.9252"
                leftIcon={<MapPin size={16} className="text-slate-400" />}
              />
              <Input
                label="Longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="e.g. 78.1198"
                leftIcon={<MapPin size={16} className="text-slate-400" />}
              />
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1">Full Address</label>
                <textarea
                  name="full_address"
                  value={formData.full_address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 md:transition-all placeholder:text-slate-300 resize-none outline-none"
                  placeholder="Full street address including area"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-4 space-y-6">
          {/* Business Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mb-8 blur-2xl" />
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600">
                <BadgeCheck size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800">Business Details</h3>
                <p className="text-[11px] font-medium text-slate-400">Legal & financial info</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1">Business Type</label>
                <ReusableSelect
                  value={formData.business_type}
                  onValueChange={(val) => setFormData((p) => ({ ...p, business_type: val }))}
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
                <label className="text-[10px] font-black text-slate-400 ml-1">Currency</label>
                <ReusableSelect
                  value={formData.currency}
                  onValueChange={(val) => setFormData((p) => ({ ...p, currency: val }))}
                  options={currencyOptions}
                  placeholder="Select Currency"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <FileText size={16} />
              </div>
              <h3 className="text-xs font-black text-slate-800">Description</h3>
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

          {/* What's next — only on create */}
          {!id && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-black text-blue-800">What happens next?</p>
              <ul className="space-y-2 text-[11px] font-semibold text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">1</span>
                  Your shop is created and saved
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">2</span>
                  You'll be redirected to the shop selector
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">3</span>
                  Select your new shop to enter the dashboard
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">4</span>
                  Use <strong>Setup Wizard</strong> in the sidebar to launch your digital store
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
