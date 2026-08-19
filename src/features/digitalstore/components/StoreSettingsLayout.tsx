import { useState } from "react";
import {
  Store,
  Clock,
  Truck,
  Palmtree,
  AlertTriangle,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { ShopProfileForm } from "../../Setting/pages/ShopProfileForm";
import OperatingHours from "../pages/OperatingHours";
import DeliveryPreferences from "../pages/Deliveryinfo";
import { useToast } from "@/context/ToastContext";

type SettingSection = "details" | "hours" | "delivery" | "vacation" | "danger";

interface SidebarItem {
  id: SettingSection;
  label: string;
  icon: React.ElementType;
  description: string;
}

export function StoreSettingsLayout({ shop }: { shop: any }) {
  const [activeSection, setActiveSection] = useState<SettingSection>("details");
  const { showToast } = useToast();

  const [hoursStatus, setHoursStatus] = useState<React.ReactNode>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<React.ReactNode>(null);

  // Vacation Mode State
  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [vacationMessage, setVacationMessage] = useState(
    "We are temporarily closed for staff training. We will resume taking orders shortly."
  );
  const [resumeDate, setResumeDate] = useState("");
  const [savingVacation, setSavingVacation] = useState(false);

  // Danger Zone State
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { id: "details",  label: "Store Details",  icon: Store,         description: "Name, logo, contact info" },
    { id: "hours",    label: "Store Hours",    icon: Clock,         description: "Open / close schedule" },
    { id: "delivery", label: "Delivery",       icon: Truck,         description: "Zones, charges, lead time" },
    { id: "vacation", label: "Vacation Mode",  icon: Palmtree,      description: "Temporarily pause orders" },
    { id: "danger",   label: "Danger Zone",    icon: AlertTriangle, description: "Deactivate or delete store" },
  ];

  const handleSaveVacation = () => {
    setSavingVacation(true);
    setTimeout(() => {
      setSavingVacation(false);
      showToast("Vacation mode settings saved", "success");
    }, 800);
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
                <ShopProfileForm />
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
                disabled={savingVacation}
                className="inline-flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all shrink-0 ml-4"
              >
                <Save className="w-3.5 h-3.5" />
                {savingVacation ? "Saving…" : "Save Changes"}
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
              {/* Deactivate */}
              <div className="bg-white rounded-xl border border-red-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Deactivate Store</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                      Temporarily take your store offline. Your products and configuration will be saved,
                      but the shop won't be accessible to customers.
                    </p>
                  </div>
                  <button className="h-8 px-4 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg transition-all shrink-0 cursor-pointer">
                    Deactivate
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
