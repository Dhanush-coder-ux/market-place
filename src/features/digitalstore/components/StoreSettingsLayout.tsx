import { useState, useEffect } from "react";
import {
  RotateCcw,
  Store,
  Clock,
  Truck,
  Palmtree,
  AlertTriangle,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  PowerOff,
} from "lucide-react";
import { shopApi } from "@/services/api/shop";
import { ShopProfileForm } from "../../Setting/pages/ShopProfileForm";
import OperatingHours from "../pages/OperatingHours";
import DeliveryPreferences from "../pages/Deliveryinfo";
import { useToast } from "@/context/ToastContext";

type SettingSection = "details" | "hours" | "delivery" | "returns" | "vacation" | "danger";

interface SidebarItem {
  id: SettingSection;
  label: string;
  icon: React.ElementType;
  description: string;
}

export function StoreSettingsLayout({ shop }: { shop: any }) {
  const [activeSection, setActiveSection] = useState<SettingSection>("details");
  const { showToast } = useToast();
  const [turningOff, setTurningOff] = useState(false);

  const handleTurnOffStore = async () => {
    if (!shop?.id) return;
    setTurningOff(true);
    try {
      await shopApi.updateShop({ id: shop.id, visible_online: false });
      showToast("Digital store has been turned off", "success");
      if (shop) shop.visible_online = false;
    } catch (e: any) {
      showToast(e?.message || "Failed to turn off store", "error");
    } finally {
      setTurningOff(false);
    }
  };

  const [hoursStatus, setHoursStatus] = useState<React.ReactNode>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<React.ReactNode>(null);

  // Return & Refund Policy State
  const initialReturns = shop?.additional_infos?.return_policy || {};
  const [policyType, setPolicyType] = useState<string>(
    initialReturns?.type || "7_days_return"
  );
  const [policyTitle, setPolicyTitle] = useState<string>(
    initialReturns?.title || "7-day returns"
  );
  const [policySubtitle, setPolicySubtitle] = useState<string>(
    initialReturns?.subtitle || "Unused items, original packaging"
  );
  const [policyDetails, setPolicyDetails] = useState<string>(
    initialReturns?.details || "Items can be returned within 7 days of delivery if unused and in original packaging. Refund will be issued after inspection."
  );
  const [allowReturns, setAllowReturns] = useState<boolean>(
    initialReturns?.allow_returns ?? true
  );
  const [isExchangeOnly, setIsExchangeOnly] = useState<boolean>(
    initialReturns?.is_exchange_only ?? false
  );
  const [savingReturns, setSavingReturns] = useState(false);
  const [savedReturns, setSavedReturns] = useState(false);

  useEffect(() => {
    const rPolicy = shop?.additional_infos?.return_policy || {};
    if (rPolicy.type) setPolicyType(rPolicy.type);
    if (rPolicy.title) setPolicyTitle(rPolicy.title);
    if (rPolicy.subtitle) setPolicySubtitle(rPolicy.subtitle);
    if (rPolicy.details) setPolicyDetails(rPolicy.details);
    if (rPolicy.allow_returns !== undefined) setAllowReturns(rPolicy.allow_returns);
    if (rPolicy.is_exchange_only !== undefined) setIsExchangeOnly(rPolicy.is_exchange_only);
  }, [shop]);

  const handleSelectPolicyPreset = (typeKey: string) => {
    setPolicyType(typeKey);
    setSavedReturns(false);
    if (typeKey === "7_days_return") {
      setPolicyTitle("7-day returns");
      setPolicySubtitle("Unused items, original packaging");
      setPolicyDetails("Items can be returned within 7 days of delivery if unused and in original packaging. Refund will be issued after inspection.");
      setAllowReturns(true);
      setIsExchangeOnly(false);
    } else if (typeKey === "3_days_return") {
      setPolicyTitle("3-day returns");
      setPolicySubtitle("Unused items, original packaging");
      setPolicyDetails("Items can be returned within 3 days of delivery. Refund will be issued after store inspection.");
      setAllowReturns(true);
      setIsExchangeOnly(false);
    } else if (typeKey === "10_days_return") {
      setPolicyTitle("10-day returns");
      setPolicySubtitle("Unused items, tags intact");
      setPolicyDetails("Items can be returned within 10 days of delivery with all original tags intact.");
      setAllowReturns(true);
      setIsExchangeOnly(false);
    } else if (typeKey === "14_days_return") {
      setPolicyTitle("14-day returns");
      setPolicySubtitle("Unused items, original packaging");
      setPolicyDetails("Items can be returned within 14 days of delivery. Refund will be credited to original payment method.");
      setAllowReturns(true);
      setIsExchangeOnly(false);
    } else if (typeKey === "exchange_only") {
      setPolicyTitle("Replacement / Exchange only");
      setPolicySubtitle("Size issues or defective items only");
      setPolicyDetails("No cash refunds. Free replacement or exchange is provided for defective items or size mismatch reported within 5 days.");
      setAllowReturns(true);
      setIsExchangeOnly(true);
    } else if (typeKey === "no_returns") {
      setPolicyTitle("No returns on this item");
      setPolicySubtitle("Freshly made / Perishable — please check before confirming");
      setPolicyDetails("This item is non-returnable and non-refundable due to hygiene, freshness, or custom preparation.");
      setAllowReturns(false);
      setIsExchangeOnly(false);
    }
  };

  const handleSaveReturns = async () => {
    if (!shop?.id) {
      showToast("Shop not found", "error");
      return;
    }
    setSavingReturns(true);
    setSavedReturns(false);
    try {
      const returnPolicyObj = {
        type: policyType,
        title: policyTitle,
        subtitle: policySubtitle,
        details: policyDetails,
        allow_returns: allowReturns,
        is_exchange_only: isExchangeOnly,
        updated_at: new Date().toISOString()
      };
      const existingAdd = shop?.additional_infos || {};
      const updatedAdd = {
        ...existingAdd,
        return_policy: returnPolicyObj,
        refund_policy: returnPolicyObj,
      };

      await shopApi.updateShop({
        id: shop.id,
        additional_infos: updatedAdd,
      });

      if (shop) {
        shop.additional_infos = updatedAdd;
      }
      setSavedReturns(true);
      showToast("Return & Refund policy saved successfully! Updated on Digital Store app.", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to save return policy", "error");
    } finally {
      setSavingReturns(false);
    }
  };

  // Vacation Mode State
  const initialVacation = shop?.vacation_infos || shop?.additional_infos?.vacation_infos || {};
  const [vacationEnabled, setVacationEnabled] = useState<boolean>(
    shop?.vacation_mode ?? shop?.additional_infos?.vacation_mode ?? initialVacation?.enabled ?? false
  );
  const [vacationMessage, setVacationMessage] = useState<string>(
    shop?.additional_infos?.vacation_message || initialVacation?.message || "We are temporarily taking a break. We will resume taking orders shortly."
  );
  const [resumeDate, setResumeDate] = useState<string>(
    shop?.additional_infos?.vacation_resume_date || initialVacation?.resume_date || ""
  );
  const [savingVacation, setSavingVacation] = useState(false);
  const [savedVacation, setSavedVacation] = useState(false);

  useEffect(() => {
    const vInfos = shop?.vacation_infos || shop?.additional_infos?.vacation_infos || {};
    const isVac = shop?.vacation_mode ?? shop?.additional_infos?.vacation_mode ?? vInfos?.enabled ?? false;
    setVacationEnabled(Boolean(isVac));
    if (shop?.additional_infos?.vacation_message || vInfos?.message) {
      setVacationMessage(shop?.additional_infos?.vacation_message || vInfos?.message);
    }
    if (shop?.additional_infos?.vacation_resume_date || vInfos?.resume_date) {
      setResumeDate(shop?.additional_infos?.vacation_resume_date || vInfos?.resume_date);
    }
  }, [shop]);

  useEffect(() => {
    if (savedVacation) setSavedVacation(false);
  }, [vacationEnabled, vacationMessage, resumeDate]);

  // Danger Zone State
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { id: "details",  label: "Store Details",  icon: Store,         description: "Name, logo, contact info" },
    { id: "hours",    label: "Store Hours",    icon: Clock,         description: "Open / close schedule" },
    { id: "delivery", label: "Delivery",       icon: Truck,         description: "Zones, charges, lead time" },
    { id: "returns",  label: "Return & Refund Policy", icon: RotateCcw, description: "Default return window & rules" },
    { id: "vacation", label: "Vacation Mode",  icon: Palmtree,      description: "Temporarily pause orders" },
    { id: "danger",   label: "Danger Zone",    icon: AlertTriangle, description: "Deactivate or delete store" },
  ];

  const handleSaveVacation = async () => {
    if (!shop?.id) {
      showToast("Shop not found", "error");
      return;
    }
    setSavingVacation(true);
    setSavedVacation(false);
    try {
      const vInfos = {
        enabled: vacationEnabled,
        message: vacationMessage,
        resume_date: resumeDate,
      };
      const existingAdd = shop?.additional_infos || {};
      const updatedAdd = {
        ...existingAdd,
        vacation_mode: vacationEnabled,
        vacation_message: vacationMessage,
        vacation_resume_date: resumeDate,
        vacation_infos: vInfos,
      };

      await shopApi.updateShop({
        id: shop.id,
        additional_infos: updatedAdd,
      });

      if (shop) {
        shop.additional_infos = updatedAdd;
        shop.vacation_mode = vacationEnabled;
        shop.vacation_infos = vInfos;
      }
      setSavedVacation(true);
      showToast(
        vacationEnabled
          ? "Vacation mode turned ON. Online orders are now paused."
          : "Vacation mode turned OFF. Online orders are active.",
        "success"
      );
    } catch (e: any) {
      showToast(e?.message || "Failed to save vacation mode settings", "error");
    } finally {
      setSavingVacation(false);
    }
  };

  const handleDeleteStore = () => {
    if (confirmDelete !== "DELETE") {
      showToast("Please type DELETE to confirm", "error");
      return;
    }
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      showToast("Delete store request submitted", "success");
    }, 1500);
  };

  // Store completeness checks (kept for metadata display)
  const checks = [
    { label: "Logo uploaded",      done: !!shop?.logo_url },
    { label: "Banner uploaded",    done: !!shop?.banner_url },
    { label: "Description added",  done: !!shop?.description },
    { label: "Address set",        done: !!shop?.address?.full_address && shop?.address.full_address !== "Not specified" },
    { label: "Store visible online", done: !!shop?.visible_online },
    { label: "Category selected",  done: shop?.categories && shop?.categories.length > 0 },
  ];
  const done = checks.filter((c) => c.done).length;
  const pct  = Math.round((done / checks.length) * 100);

  return (
    <div className="flex flex-col md:flex-row min-h-[600px] bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* ── Left Sidebar ── */}
      <nav className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/60 shrink-0">
        <div className="p-3 space-y-0.5">
          {sidebarItems.map((item) => {
            const isActive   = activeSection === item.id;
            const isDanger   = item.id === "danger";
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                  isActive
                    ? isDanger
                      ? "bg-red-50 text-red-600 border-l-2 border-red-500"
                      : "bg-white text-blue-600 border-l-2 border-blue-600 shadow-sm"
                    : isDanger
                      ? "text-red-500 hover:bg-red-50/60 border-l-2 border-transparent"
                      : "text-slate-600 hover:bg-white hover:text-slate-800 border-l-2 border-transparent"
                }`}
              >
                <item.icon
                  size={15}
                  className={`shrink-0 ${
                    isActive
                      ? isDanger ? "text-red-500" : "text-blue-500"
                      : isDanger ? "text-red-400" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Right Content ── */}
      <div className="flex-1 p-6 overflow-y-auto">

        {/* ── Store Details ── */}
        {activeSection === "details" && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-slate-900">Store Details</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage your store's public information, branding, and business settings.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form */}
              <div className="lg:col-span-7">
                <ShopProfileForm editPath="/setup-digital-store" />
              </div>

              {/* Sidebar info */}
              <div className="lg:col-span-5 space-y-4">
                {/* Profile completeness */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Profile completeness</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Complete your profile for better visibility</p>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 mb-4 overflow-hidden">
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: pct === 100 ? "#16a34a" : "#2563eb" }}
                    />
                  </div>
                  <div className="space-y-2">
                    {checks.map((c) => (
                      <div key={c.label} className="flex items-center gap-2">
                        {c.done ? (
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle size={13} className="text-slate-300 shrink-0" />
                        )}
                        <span className={`text-[12px] ${c.done ? "text-slate-600" : "text-slate-400"}`}>
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Store Metadata</h3>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Business Type</span>
                      <span className="font-medium text-slate-700">{shop?.business_infos?.type || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Currency</span>
                      <span className="font-medium text-slate-700">{shop?.business_infos?.currency || "INR"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">GST Status</span>
                      <span className="font-medium text-slate-700">
                        {shop?.business_infos?.gst_infos?.registered
                          ? `Registered (${shop.business_infos.gst_infos.number || "—"})`
                          : "Not Registered"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Member Since</span>
                      <span className="font-medium text-slate-700">{shop?.created_at?.slice(0, 10)}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Store ID</span>
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={shop?.id}>
                        {shop?.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Store Hours ── */}
        {activeSection === "hours" && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Store Hours</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Configure when your store is open for business and accepting online orders.
                </p>
              </div>
              {hoursStatus && <div className="shrink-0 ml-4">{hoursStatus}</div>}
            </div>
            <OperatingHours onStatusChange={setHoursStatus} />
          </div>
        )}

        {/* ── Delivery ── */}
        {activeSection === "delivery" && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Delivery Preferences</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Set up delivery zones, charges, and expected lead times.
                </p>
              </div>
              {deliveryStatus && <div className="shrink-0 ml-4">{deliveryStatus}</div>}
            </div>
            <DeliveryPreferences onStatusChange={setDeliveryStatus} />
          </div>
        )}


        {/* ── Return & Refund Policy ── */}
        {activeSection === "returns" && (
          <div className="max-w-3xl animate-in fade-in duration-200">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Return &amp; Refund Policy</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Set your store's default return window and refund rules. Applies globally to all products unless overridden individually.
                </p>
              </div>
              <button
                onClick={handleSaveReturns}
                disabled={savingReturns || savedReturns}
                className={`inline-flex items-center gap-2 h-9 px-4 ${savedReturns ? 'bg-emerald-600 hover:bg-emerald-700 opacity-90' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all shrink-0 ml-4 cursor-pointer`}
              >
                {savedReturns ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {savingReturns ? "Saving…" : savedReturns ? "Saved" : "Save Changes"}
              </button>
            </div>

            {/* Choose Policy Preset */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 shadow-sm">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                1. Select Store Default Policy Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    id: "7_days_return",
                    title: "7-Day Returns",
                    desc: "Standard retail, clothing & electronics.",
                    badge: "Returns Accepted",
                    color: "emerald"
                  },
                  {
                    id: "3_days_return",
                    title: "3-Day Returns",
                    desc: "Short window for perishable items.",
                    badge: "Short Window",
                    color: "emerald"
                  },
                  {
                    id: "10_days_return",
                    title: "10-Day Returns",
                    desc: "Extended return window for general goods.",
                    badge: "Extended",
                    color: "emerald"
                  },
                  {
                    id: "14_days_return",
                    title: "14-Day Returns",
                    desc: "Generous return policy for trusted stores.",
                    badge: "14 Days",
                    color: "emerald"
                  },
                  {
                    id: "exchange_only",
                    title: "Replacement Only",
                    desc: "Size mismatch or defective items only.",
                    badge: "Exchange Only",
                    color: "amber"
                  },
                  {
                    id: "no_returns",
                    title: "No Returns",
                    desc: "Fresh food, bakery, personal hygiene.",
                    badge: "Non-Returnable",
                    color: "rose"
                  },
                ].map((item) => {
                  const isSelected = policyType === item.id;
                  const colorClasses = item.color === "emerald" 
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                    : item.color === "amber"
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-rose-700 bg-rose-50 border-rose-200";
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectPolicyPreset(item.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClasses}`}>
                          {item.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                      <p className="text-[11.5px] text-slate-500 mt-1 leading-snug">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Policy Details & Preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                2. Policy Details &amp; Customer Facing Text
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Headline / Badge
                  </label>
                  <input
                    type="text"
                    value={policyTitle}
                    onChange={(e) => { setPolicyTitle(e.target.value); setSavedReturns(false); }}
                    placeholder="e.g. 7-day returns"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condition Subtitle (Short)
                  </label>
                  <input
                    type="text"
                    value={policySubtitle}
                    onChange={(e) => { setPolicySubtitle(e.target.value); setSavedReturns(false); }}
                    placeholder="e.g. Unused items, original packaging"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Policy Description (Shown on Checkout &amp; Order Details)
                </label>
                <textarea
                  rows={3}
                  value={policyDetails}
                  onChange={(e) => { setPolicyDetails(e.target.value); setSavedReturns(false); }}
                  placeholder="Explain return and refund steps for customers..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Live Digital App Preview */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Live Preview on Customer App (Product Page Banner)
                </label>
                <div 
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    !allowReturns 
                      ? "bg-rose-50/70 border-rose-200 text-rose-900" 
                      : isExchangeOnly 
                      ? "bg-amber-50/70 border-amber-200 text-amber-900" 
                      : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      !allowReturns 
                        ? "bg-rose-100 text-rose-600" 
                        : isExchangeOnly 
                        ? "bg-amber-100 text-amber-600" 
                        : "bg-emerald-100 text-emerald-600"
                    }`}>
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{policyTitle || "7-day returns"}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{policySubtitle || "Unused items, original packaging"}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold opacity-60">›</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Vacation Mode ── */}
        {activeSection === "vacation" && (
          <div className="max-w-2xl animate-in fade-in duration-200">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Vacation Mode</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Temporarily pause online orders and display a notice to visitors.
                </p>
              </div>
              <button
                onClick={handleSaveVacation}
                disabled={savingVacation || savedVacation}
                className={`inline-flex items-center gap-2 h-9 px-4 ${savedVacation ? 'bg-emerald-600 hover:bg-emerald-700 opacity-90' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all shrink-0 ml-4`}
              >
                {savedVacation ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {savingVacation ? "Saving…" : savedVacation ? "Saved" : "Save Changes"}
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Enable Vacation Mode</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Customers can browse your products but cannot place new orders.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={vacationEnabled}
                    onChange={(e) => setVacationEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 h-[22px] bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-[18px]" />
                </label>
              </div>

              {vacationEnabled && (
                <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                      Notice Message
                    </label>
                    <textarea
                      value={vacationMessage}
                      onChange={(e) => setVacationMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                      Expected Resume Date <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={resumeDate}
                      onChange={(e) => setResumeDate(e.target.value)}
                      className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Danger Zone ── */}
        {activeSection === "danger" && (
          <div className="max-w-2xl animate-in fade-in duration-200">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle size={16} /> Danger Zone
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Irreversible actions that affect your online shop storefront.
              </p>
            </div>

            <div className="space-y-4">
              {/* Turn Off Digital Store */}
              <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <PowerOff size={15} className="text-amber-600" />
                      <p className="text-sm font-semibold text-slate-800">Turn Off Digital Store</p>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                      Temporarily turn off your digital store. Your products, operating hours, delivery settings, and configurations will be saved, but the shop won't be accessible or visible to customers online.
                    </p>
                  </div>
                  <button
                    onClick={handleTurnOffStore}
                    disabled={turningOff}
                    className="h-8 px-4 border border-amber-300 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {turningOff ? "Turning Off..." : "Turn Off Store"}
                  </button>
                </div>
              </div>

              {/* Permanent delete */}
              <div className="bg-white rounded-xl border border-red-100 p-5">
                <p className="text-sm font-semibold text-slate-800">Delete Store Permanently</p>
                <p className="text-[12px] text-slate-500 mt-0.5 mb-4 leading-relaxed">
                  Permanently delete all catalog items, order records, and settings. This action is{" "}
                  <strong className="text-red-600">not reversible</strong>.
                </p>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
                    Type <code className="bg-red-50 text-red-500 px-1 rounded">DELETE</code> to confirm
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      className="h-9 px-3 bg-slate-50 border border-red-200 rounded-lg text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                      placeholder="DELETE"
                    />
                    <button
                      onClick={handleDeleteStore}
                      disabled={deleting || confirmDelete !== "DELETE"}
                      className="h-9 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Trash2 size={13} />
                      {deleting ? "Deleting…" : "Permanently Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
