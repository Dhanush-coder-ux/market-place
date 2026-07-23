import { useEffect, useState } from "react";
import { StoreFormData } from "@/features/digitalstore/type"; 
import { Check, ChevronLeft, ChevronRight, Store, Truck, Package, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { employeeApi } from "@/services/api/employee";
import { SHOP_ID } from "@/services/endpoints";

// Import steps (we will create these)
import Step1BasicDetails from "../components/wizard/Step1BasicDetails";
import Step2DeliveryHours from "../components/wizard/Step2DeliveryHours";
import Step3Products from "../components/wizard/Step3Products";
import Step4Confirmation from "../components/wizard/Step4Confirmation";

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
  operatingHours: [
    { day: "MONDAY", open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" },
    { day: "TUESDAY", open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" },
    { day: "WEDNESDAY", open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" },
    { day: "THURSDAY", open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" },
    { day: "FRIDAY", open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" },
    { day: "SATURDAY", open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" },
    { day: "SUNDAY", open_at: "09:00:00+00:00", close_at: "21:00:00+00:00" }
  ],
  deliveryOptions: {
    instant: { enabled: true, speed: "Within 12 hours", freeThreshold: 50, manageStore: true, partners: true },
    standard: { enabled: false, speed: "1–2 Business Days", freeThreshold: 30, manageStore: false, partners: true },
    nationwide: { enabled: false, speed: "5–7 Business Days", freeThreshold: 100, manageStore: false, partners: true }
  },
  selectedProducts: {}
};

const STEPS = [
  { id: 1, title: "Basic Details", icon: Store, subtitle: "Name & Images" },
  { id: 2, title: "Operations", icon: Truck, subtitle: "Delivery & Hours" },
  { id: 3, title: "Products", icon: Package, subtitle: "Catalog & Pricing" },
  { id: 4, title: "Review", icon: CheckCircle2, subtitle: "Confirm & Launch" },
];

export default function StoreSetupWizard({ existingData }: { existingData?: Partial<StoreFormData> }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<StoreFormData>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { shop } = useBusinessApi();

  useEffect(() => {
    if (existingData) {
      setForm((prev) => ({ ...prev, ...existingData }));
      return;
    }

    const currentShopId = localStorage.getItem("shop_id") || SHOP_ID;
    if (currentShopId && currentShopId !== "string") {
      setIsLoading(true);
      shop.getShopById(currentShopId).then((res) => {
        if (res && res.data) {
          const s = res.data;
          setForm((prev) => ({
            ...prev,
            name: s.name || prev.name,
            tagline: s.tagline || prev.tagline,
            description: s.description || prev.description,
            category: s.categories?.[0] || prev.category,
            address: s.address?.full_address || prev.address,
            gstRegistered: !!s.business_infos?.gst_infos?.registered,
            gstNumber: s.business_infos?.gst_infos?.number || "",
            logoPreview: s.logo_url || prev.logoPreview,
            bannerPreview: s.banner_url || prev.bannerPreview,
            contactEmail: s.additional_infos?.emails?.[0] || prev.contactEmail,
            contactPhone: s.additional_infos?.mobile_numbers?.[0] || prev.contactPhone,
            website: s.additional_infos?.website || prev.website,
            instagram: s.additional_infos?.instagram || prev.instagram,
            twitter: s.additional_infos?.facebook || prev.twitter, // using twitter field for facebook temporarily if needed
          }));
        }
      }).catch(err => console.error("Failed to fetch shop:", err))
        .finally(() => setIsLoading(false));
    }
  }, [existingData, shop]);

  const validateStep1 = () => {
    const stepErrors: Record<string, string> = {};
    if (!form.name || form.name.trim().length < 3) stepErrors.name = "Store name must be at least 3 characters";
    if (form.gstRegistered && (!form.gstNumber || form.gstNumber.trim().length !== 15)) stepErrors.gstNumber = "Please enter a valid 15-character GSTIN";
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        tagline: form.tagline || null,
        categories: form.category ? [form.category] : [],
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
        visible_online: true, 
      };

      const fullPayload = {
        ...payload,
        operating_hours: form.operatingHours,
        delivery_options: Object.values(form.deliveryOptions).filter(d => d.enabled).map(d => ({
          type: d.speed.includes("12 hours") ? "INSTANT" : d.speed.includes("1-2") ? "STANDARD" : "NATIONWIDE",
          speed: d.speed,
          free_shipping_amount: d.freeThreshold,
          delivery_by: d.partners ? "PARTNERS" : "INHOUSE"
        }))
      };

      const currentShopId = localStorage.getItem("shop_id") || SHOP_ID;
      let newShopId = currentShopId;
      let isNewShop = false;
      
      // 1. Create or Update Shop (visible_online = true now that we have hours and delivery)
      if (currentShopId && currentShopId !== "string") {
        await shop.updateShop({ id: currentShopId, ...fullPayload, visible_online: true });
      } else {
        const res = await shop.createShop({ ...fullPayload, visible_online: true });
        newShopId = res.data?.id || res.id;
        isNewShop = true;
      }

      // 1.5 Upload Images if any
      if (form.logo instanceof File && newShopId) {
        await shop.uploadShopImage(form.logo, "logo", newShopId);
      }
      if (form.banner instanceof File && newShopId) {
        await shop.uploadShopImage(form.banner, "banner", newShopId);
      }

      if (newShopId) {
        localStorage.setItem("shop_id", newShopId);
        import('@/services/endpoints').then(module => { module.setShopId(newShopId); });

        if (isNewShop) {
          try {
            await employeeApi.createEmployee({
              shop_id: newShopId,
              name: localStorage.getItem("user_name") || "Owner",
              role: "OWNER",
              joined_date: new Date().toISOString().split('T')[0],
              mobile_number: localStorage.getItem("user_phone") || "0000000000",
              email: localStorage.getItem("user_email") || "owner@example.com",
              department: "MANAGER",
              additional_infos: {}
            });
          } catch (empErr) {
            console.error("Failed to create employee:", empErr);
          }
        }
        
        // TODO: Handle Products save using newShopId
        // ...
        
        navigate("/");
      }
    } catch (err) {
      console.error("Failed to create shop", err);
      alert("Failed to create shop");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-2 md:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Onboarding Header */}
        <div className="text-center py-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Setup Your Digital Store</h2>
          <p className="text-xs text-slate-400 mt-1">Complete these steps to launch your online storefront.</p>
        </div>

        {/* Stepper */}
        <div className="flex justify-between items-center mb-8 relative">
          <div className="absolute left-0 top-1/2 w-full h-[2px] bg-slate-200 -z-10 -translate-y-1/2 rounded-full" />
          <div className="absolute left-0 top-1/2 h-[2px] bg-blue-600 -z-10 -translate-y-1/2 transition-all duration-300" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />
          
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-50/50 px-2 relative group cursor-pointer" onClick={() => { if (isCompleted) setCurrentStep(step.id); }}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${isActive ? "bg-blue-600 text-white shadow-blue-200" : isCompleted ? "bg-blue-100 text-blue-600" : "bg-white border-2 border-slate-200 text-slate-400"}`}>
                  <Icon size={isActive ? 18 : 16} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <div className="text-center absolute top-12 whitespace-nowrap">
                  <p className={`text-[11px] font-bold ${isActive ? "text-slate-800" : "text-slate-500"}`}>{step.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-6" />

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden min-h-[400px] flex flex-col">
          <div className="flex-1">
            {currentStep === 1 && <Step1BasicDetails form={form} setForm={setForm} errors={errors} setErrors={setErrors} />}
            {currentStep === 2 && <Step2DeliveryHours form={form} setForm={setForm} />}
            {currentStep === 3 && <Step3Products form={form} setForm={setForm} />}
            {currentStep === 4 && <Step4Confirmation form={form} />}
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between items-center">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1 || isLoading}
              className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
              Back
            </button>
            
            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className={`flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${isLoading ? "bg-slate-400 cursor-not-allowed text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
              >
                {isLoading ? "Creating Store..." : "Launch Store"}
                {!isLoading && <Check size={16} strokeWidth={2.5} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
