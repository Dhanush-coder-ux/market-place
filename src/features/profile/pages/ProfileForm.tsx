import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Store,
  MapPin,
  FileText,
  Hash,
  BadgeCheck,
  Save,
  Info,
} from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/context/ApiContext";
import { usePurchaseSettings } from "@/context/PurchaseContext";
import { ENDPOINTS } from "@/services/endpoints";
import { getGatewayBaseUrl } from "@/services/api/tokenManager";
import { GradientButton } from "@/components/ui/GradientButton";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import LocationMapPicker from "@/components/ui/LocationMapPicker";
import Loader from "@/components/common/Loader";
import Input from "@/components/ui/Input";
import { NavigationBlocker } from "@/components/common/NavigationBlocker";
import ImageUpload from "@/components/common/ImageUpload";

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
  logo_url?: string;
  logo_file?: File | null;
}

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
  const [loadingData, setLoadingData] = useState(!!id);

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
    logo_url: "",
    logo_file: null,
  };

  const [formData, setFormData] = useState<ProfileData>(initialFormData);

  useEffect(() => {
    if (id) {
      setLoadingData(true);
      getData(`${ENDPOINTS.SHOPS}/by/${id}`)
        .then((res) => {
          if (res && res.data) {
            const shop = res.data;
            const b = shop.business_infos || {};
            const a = shop.address || {};

            setFormData({
              name: shop.name || "",
              category: Array.isArray(shop.categories)
                ? shop.categories
                : shop.categories
                ? [shop.categories]
                : [],
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
              logo_url: shop.logo_url || shop.logo || "",
              logo_file: null,
            });
            setGstType(b.gst_infos?.registered ? "registered" : "non-registered");
          }
        })
        .finally(() => setLoadingData(false));
    } else {
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("profile_drafts") || "[]");
        const draft = drafts.find((d: any) => d.id === draftId);
        if (draft) setFormData(draft.data);
      }
      setLoadingData(false);
    }
  }, [id, searchParams, getData, setGstType]);

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        <GradientButton
          icon={<Save size={16} />}
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg shadow-md text-xs px-8 h-8 flex items-center"
        >
          {submitting ? "..." : id ? "Save Changes" : "Create Shop"}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, submitting, id, formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const finalValue = name.includes("gst") ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
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
      // 1. Create/Update Shop Profile (JSON payload)
      const res = id
        ? await putData(ENDPOINTS.SHOPS, { ...payload, id })
        : await postData(ENDPOINTS.SHOPS, payload);

      if (res) {
        // Shop ID might be res.data.id or res.id, or just 'id' if updating
        const shopIdToUse = id || res.data?.id || res.id;
        
        // 2. Upload Logo if a file was selected
        if (shopIdToUse && formData.logo_file) {
          const userId = localStorage.getItem("user_id");
          const fd = new FormData();
          fd.append("shop_id", shopIdToUse);
          fd.append("user_id", userId || "");
          fd.append("image_type", "logo");
          fd.append("files", formData.logo_file);

          const token = localStorage.getItem("auth_token");
          let url = ENDPOINTS.SHOPS.startsWith("http") 
            ? `${ENDPOINTS.SHOPS}/upload/images`
            : `${getGatewayBaseUrl()}${ENDPOINTS.SHOPS.replace(/^\/api/, '')}/upload/images`;

          await fetch(url, {
            method: "POST",
            headers: {
              ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: fd
          });
        }

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
    } catch (e: any) {
      showToast(e?.message || "Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && id) return <div className="py-20 text-center"><Loader /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <NavigationBlocker data={formData} isLoading={loadingData} isSubmitting={submitting} />
      <div className="mx-auto space-y-4 relative">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-start">
          {/* BOX 1: IDENTITY (Spans 6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Store size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800">Shop Identity</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-32 shrink-0">
                  <ImageUpload
                    label="Shop Logo"
                    value={formData.logo_file || null}
                    onChange={(file) => setFormData((prev) => ({ ...prev, logo_file: file }))}
                    initialPreview={formData.logo_url}
                  />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Shop Name"
                    required
                    name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sunrise Mart"
                  leftIcon={<Store size={16} className="text-slate-300" />}
                />
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex items-center gap-1.5 ml-0.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Categories <span className="text-red-500 ml-1">*</span>
                    </label>
                  </div>
                  <SearchSelect
                    value={formData.category}
                    onChange={(val) => setFormData((prev) => ({ ...prev, category: val as string[] }))}
                    options={categoryOptions}
                    labelKey="label"
                    valueKey="value"
                    multiple
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full mt-2">
              <div className="flex items-center gap-1.5 ml-0.5">
                <label className="text-xs font-semibold text-slate-600">
                  Description
                </label>
              </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                  placeholder="Tell customers what makes your shop special..."
                />
              </div>
            </div>
          </div>

          {/* BOX 2: CONTACT & LOCATION (Spans 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <MapPin size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800">Contact & Location</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 ml-1">
                  Pick Location on Map
                  <div className="group relative">
                    <Info size={12} className="text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      Click on the map or search to set your shop's exact location. Coordinates will be captured automatically.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                    </div>
                  </div>
                </label>
                <LocationMapPicker
                  lat={parseFloat(formData.latitude) || undefined}
                  lng={parseFloat(formData.longitude) || undefined}
                  onChange={(coords, address) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: String(coords.lat),
                      longitude: String(coords.lng),
                      full_address: address || prev.full_address,
                    }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">
                  Full Address
                </label>
                <textarea
                  name="full_address"
                  value={formData.full_address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                  placeholder="Full street address including area"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="PIN Code"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="600001"
                  leftIcon={<Hash size={16} className="text-slate-300" />}
                />
                <Input
                  label="Landmark"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="e.g. Near City Mall"
                  leftIcon={<MapPin size={16} className="text-slate-300" />}
                />
              </div>
            </div>
          </div>

          {/* BOX 3: LEGAL & TAX (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <BadgeCheck size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800">Legal & Tax</h2>
            </div>
            <div className="p-8 space-y-6">
              <label className="flex items-center gap-3 cursor-pointer group p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.gst_registered}
                  onChange={(e) => setFormData((p) => ({ ...p, gst_registered: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700">
                  GST Registered Business
                </span>
              </label>

              {formData.gst_registered && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    label="GST Number"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleChange}
                    placeholder="22AAAAA0000A1Z5"
                    leftIcon={<FileText size={16} className="text-slate-300" />}
                  />
                </div>
              )}
            </div>
          </div>
        </form>

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
                "Use the Setup Wizard to launch your store.",
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/50 p-4 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-medium text-indigo-800 leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileForm;
