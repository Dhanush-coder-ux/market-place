import { useToast } from "@/context/ToastContext";
import { useEffect, useState } from "react";
import { StoreFormData } from "@/features/digitalstore/type";
import { Check, ChevronLeft, ChevronRight, Store, Clock, MapPin, Package, CheckCircle2, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { employeeApi } from "@/services/api/employee";
import { inventoryApi } from "@/services/api/inventory";
import { SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";

// Import steps
import Step1BasicDetails from "../components/wizard/Step1BasicDetails";
import Step2OperatingHours from "../components/wizard/Step2OperatingHours";
import Step3DeliveryOptions from "../components/wizard/Step3DeliveryOptions";
import Step4Products from "../components/wizard/Step3Products";
import Step5Confirmation from "../components/wizard/Step4Confirmation";
import StoreLaunchAnimationModal from "../components/wizard/StoreLaunchAnimationModal";

const INITIAL_STATE: StoreFormData = {
  name: "",
  tagline: "",
  address: "",
  latitude: 0,
  longitude: 0,
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
    instant: { enabled: true, speed: "Within 12 hours", freeThreshold: 50, radius: 5, minOrderAmount: 100, chargePerKm: 15, manageStore: true, partners: true },
    standard: { enabled: false, speed: "1–2 Business Days", freeThreshold: 30, radius: 10, minOrderAmount: 150, chargePerKm: 10, manageStore: false, partners: true },
    nationwide: { enabled: false, speed: "5–7 Business Days", freeThreshold: 100, radius: 100, minOrderAmount: 300, chargePerKm: 5, manageStore: false, partners: true },
    pickuponly: { enabled: true, speed: "Same Day", freeThreshold: 0, radius: 5, minOrderAmount: 0, chargePerKm: 0, manageStore: true, partners: false }
  },
  selectedProducts: {}
};

const STEPS = [
  { id: 1, title: "Basic Details", icon: Store, subtitle: "Name & Images", description: "Set up your store identity, images, and GST info." },
  { id: 2, title: "Operations", icon: Clock, subtitle: "Operating Hours", description: "Configure your store's opening and closing hours." },
  { id: 3, title: "Delivery", icon: MapPin, subtitle: "Delivery Options", description: "Choose delivery types, radius, and pricing." },
  { id: 4, title: "Products", icon: Package, subtitle: "Catalog & Pricing", description: "Select which products appear in your online store." },
  { id: 5, title: "Review", icon: CheckCircle2, subtitle: "Confirm & Launch", description: "Review everything before launching your store." },
];

export default function StoreSetupWizard({ existingData }: { existingData?: Partial<StoreFormData> }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<StoreFormData>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLaunchingModalOpen, setIsLaunchingModalOpen] = useState<boolean>(false);
  const [isLaunchComplete, setIsLaunchComplete] = useState<boolean>(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { shop } = useBusinessApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();

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
          setForm((prev) => {
            const loadedOperatingHours = s.operating_hours?.length > 0 ? s.operating_hours : prev.operatingHours;
            const loadedDeliveryOptions = JSON.parse(JSON.stringify(prev.deliveryOptions));
            
            if (s.delivery_options?.length > 0) {
              s.delivery_options.forEach((d: any) => {
                let key: "instant" | "standard" | "nationwide" | "pickuponly" | null = null;
                if (d.type === "INSTANT" || d.type === "EXPRESS") key = "instant";
                else if (d.type === "STANDARD" || d.type === "NORMAL") key = "standard";
                else if (d.type === "NATIONWIDE" || d.type === "SAME_DAY") key = "nationwide";
                else if (d.type === "PICKUP_ONLY") key = "pickuponly";
                
                if (key) {
                  loadedDeliveryOptions[key] = {
                    ...loadedDeliveryOptions[key],
                    id: d.id,
                    enabled: d.enabled !== false,
                    speed: d.speed || loadedDeliveryOptions[key].speed,
                    freeThreshold: d.free_shipping_amount ?? loadedDeliveryOptions[key].freeThreshold,
                    radius: d.radius ?? loadedDeliveryOptions[key].radius,
                    minOrderAmount: d.min_order_amount ?? loadedDeliveryOptions[key].minOrderAmount,
                    chargePerKm: d.charge_per_km ?? loadedDeliveryOptions[key].chargePerKm,
                    partners: d.delivery_by !== "INHOUSE",
                    manageStore: d.delivery_by === "INHOUSE",
                  };
                }
              });
            }

            return {
              ...prev,
              name: s.name || prev.name,
              tagline: s.tagline || prev.tagline,
              description: s.description || prev.description,
              category: s.categories?.[0] || prev.category,
              address: s.address?.full_address || prev.address,
              latitude: s.address?.latitude || prev.latitude,
              longitude: s.address?.longitude || prev.longitude,
              gstRegistered: !!s.business_infos?.gst_infos?.registered,
              gstNumber: s.business_infos?.gst_infos?.number || "",
              logoPreview: s.logo_url || prev.logoPreview,
              bannerPreview: s.banner_url || prev.bannerPreview,
              contactEmail: s.additional_infos?.emails?.[0] || prev.contactEmail,
              contactPhone: s.additional_infos?.mobile_numbers?.[0] || prev.contactPhone,
              website: s.additional_infos?.website || prev.website,
              instagram: s.additional_infos?.instagram || prev.instagram,
              twitter: s.additional_infos?.facebook || prev.twitter,
              operatingHours: loadedOperatingHours,
              deliveryOptions: loadedDeliveryOptions,
            };
          });
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

  const saveDraft = async () => {
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
            ...(form.gstRegistered && form.gstNumber ? { number: form.gstNumber.toUpperCase().trim() } : {})
          },
          currency: "INR"
        },
        address: {
          full_address: form.address || "Not specified",
          zip_code: "000000",
          landmark: "",
          latitude: form.latitude || 0,
          longitude: form.longitude || 0
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
        delivery_options: Object.entries(form.deliveryOptions).filter(([_, d]) => d.enabled).map(([key, d]) => ({
          type: key === "instant" ? "INSTANT" : key === "standard" ? "STANDARD" : key === "pickuponly" ? "PICKUP_ONLY" : "NATIONWIDE",
          speed: d.speed,
          free_shipping_amount: d.freeThreshold,
          radius: d.radius,
          min_order_amount: d.minOrderAmount,
          charge_per_km: d.chargePerKm,
          delivery_by: d.partners ? "PARTNERS" : "INHOUSE"
        }))
      };

      const currentShopId = localStorage.getItem("shop_id") || SHOP_ID;
      let newShopId = currentShopId;
      let isNewShop = false;

      // 1. Create or Update Shop
      if (currentShopId && currentShopId !== "string") {
        await shop.updateShop({ id: currentShopId, ...fullPayload, visible_online: true });
      } else {
        const res = await shop.createShop({ ...fullPayload, visible_online: true });
        newShopId = res.data?.id || res.id;
        isNewShop = true;
      }

      // If newly created, set local storage and create owner record
      if (isNewShop && newShopId) {
        localStorage.setItem("shop_id", newShopId);
        import('@/services/endpoints').then(module => { module.setShopId(newShopId); });
        
        try {
          await employeeApi.createEmployee({
            shop_id: newShopId,
            name: localStorage.getItem("user_name") || "Owner",
            role: "OWNER",
            joined_date: new Date().toISOString().split('T')[0],
            mobile_number: localStorage.getItem("user_phone") || "0000000000",
            email: localStorage.getItem("user_email") || "owner@example.com",
            additional_infos: {}
          });
        } catch (empErr) {
          console.error("Failed to create employee:", empErr);
        }
      }
      return newShopId;
    } catch (err: any) {
      console.error("Failed to save draft", err);
      throw err;
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && !validateStep1()) return;
    
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    setIsLaunchingModalOpen(true);
    setIsLaunchComplete(false);
    setLaunchError(null);
    setIsLoading(true);

    try {
      const newShopId = await saveDraft();
      
      if (newShopId) {
        // Upload Images if any
        if (form.logo instanceof File) {
          try {
            await shop.uploadShopImage(form.logo, "logo", newShopId);
          } catch (e) {
            console.error("Logo upload error", e);
          }
        }
        if (form.banner instanceof File) {
          try {
            await shop.uploadShopImage(form.banner, "banner", newShopId);
          } catch (e) {
            console.error("Banner upload error", e);
          }
        }

        // Handle Products save using newShopId
        if (form.selectedProducts && Object.keys(form.selectedProducts).length > 0) {
          for (const [productId, prodConfig] of Object.entries(form.selectedProducts)) {
            try {
              const sellPrice = prodConfig.online_selling_price ?? 0;
              await inventoryApi.updateInventory({
                id: productId,
                shop_id: newShopId,
                visible_online: true,
                buy_price: 0,
                sell_price: sellPrice,
                online_sell_price: prodConfig.online_selling_price,
              });
            } catch (prodErr) {
              console.error(`Failed to update product ${productId} online price:`, prodErr);
            }
          }
        }

        // Mark launch animation as complete
        setIsLaunchComplete(true);
      }
    } catch (err: any) {
      console.error("Failed to create shop", err);
      const msg = err?.detail?.description || err?.detail?.msg || err?.message || "Failed to launch shop";
      setLaunchError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchModalFinished = () => {
    setIsLaunchingModalOpen(false);
    showToast("Your store is now live online!", "success");
    navigate("/profile");
  };

  useEffect(() => {
    setBottomActions(
      <div className="flex justify-between items-center w-full px-2 md:px-6">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 1 || isLoading || isLaunchingModalOpen}
          className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm cursor-pointer'}`}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          Back
        </button>

        {/* Step indicator */}
        <span className="text-xs font-medium text-slate-400 hidden sm:block">
          Step {currentStep} of {STEPS.length}
        </span>

        {currentStep < STEPS.length ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center gap-1.5 px-7 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm bg-blue-600 hover:bg-blue-700 active:scale-95 text-white cursor-pointer"
          >
            Continue
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isLaunchingModalOpen}
            className={`flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95 cursor-pointer ${
              isLoading || isLaunchingModalOpen
                ? "bg-slate-400 cursor-not-allowed text-white" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <Rocket size={15} strokeWidth={2} className="animate-bounce" />
            <span>Launch Store</span>
          </button>
        )}
      </div>
    );

    return () => setBottomActions(null);
  }, [currentStep, isLoading, isLaunchingModalOpen, form]);

  const currentStepData = STEPS.find(s => s.id === currentStep)!;
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="w-full min-h-screen bg-slate-50 p-3 md:p-6 lg:p-8 font-sans">
      <div className="w-full mx-auto max-w-3xl space-y-5">

        {/* ── Stepper ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
          {/* Progress bar track */}
          <div className="relative mb-4">
            <div className="absolute top-5 left-0 w-full h-[3px] bg-slate-100 rounded-full z-0" />
            <div
              className="absolute top-5 left-0 h-[3px] bg-blue-600 rounded-full z-0 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Steps */}
            <div className="relative z-10 flex justify-between">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => { if (isCompleted) setCurrentStep(step.id); }}
                    className={`flex flex-col items-center gap-1.5 group ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {/* Circle */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                      ${isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                        : isCompleted
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-400'
                      }
                    `}>
                      {isCompleted ? (
                        <Check size={16} strokeWidth={3} />
                      ) : (
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      )}
                    </div>

                    {/* Label */}
                    <div className="text-center hidden sm:block">
                      <p className={`text-[11px] font-bold leading-tight ${isActive ? 'text-blue-600' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                        {step.title}
                      </p>
                      <p className={`text-[10px] leading-tight ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                        {step.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Form Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-24">

          {/* Step Title Banner */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <currentStepData.icon size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 leading-tight">{currentStepData.title}</h2>
              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{currentStepData.description}</p>
            </div>
            <span className="ml-auto shrink-0 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
              {currentStep}/{STEPS.length}
            </span>
          </div>

          {/* Step Content */}
          <div className="p-5 md:p-6">
            {currentStep === 1 && <Step1BasicDetails form={form} setForm={setForm} errors={errors} setErrors={setErrors} />}
            {currentStep === 2 && <Step2OperatingHours form={form} setForm={setForm} />}
            {currentStep === 3 && <Step3DeliveryOptions form={form} setForm={setForm} />}
            {currentStep === 4 && <Step4Products form={form} setForm={setForm} />}
            {currentStep === 5 && <Step5Confirmation form={form} />}
          </div>
        </div>

      </div>

      {/* ─── IMMERSIVE "OFFLINE SHOP GOING ONLINE" LAUNCH MODAL ─── */}
      <StoreLaunchAnimationModal
        isOpen={isLaunchingModalOpen}
        storeName={form.name}
        category={form.category}
        isComplete={isLaunchComplete}
        error={launchError}
        onFinished={handleLaunchModalFinished}
        onRetry={handleSave}
      />
    </div>
  );
}
