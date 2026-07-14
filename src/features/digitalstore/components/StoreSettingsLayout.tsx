import { useState } from "react";
import { 
  Store, 
  Clock, 
  Truck, 
  CreditCard, 
  Palmtree, 
  AlertTriangle,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Package,
  Boxes,
  ShoppingBag,
  BarChart2,
  Settings2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShopProfileForm } from "../../Setting/pages/ShopProfileForm";
import OperatingHours from "../pages/OperatingHours";
import DeliveryPreferences from "../pages/Deliveryinfo";
import { useToast } from "@/context/ToastContext";

type SettingSection = "details" | "hours" | "delivery" | "payments" | "vacation" | "danger";

interface SidebarItem {
  id: SettingSection;
  label: string;
  icon: React.ElementType;
}

const QUICK_ACTIONS = [
  { label: "Add Product", desc: "List a new item", icon: Plus, path: "/product/add", color: "#2563eb", bg: "#eff6ff" },
  { label: "Products", desc: "Manage listings", icon: Package, path: "/product/all", color: "#7c3aed", bg: "#f5f3ff" },
  { label: "Inventory", desc: "Check stock", icon: Boxes, path: "/inventory", color: "#0891b2", bg: "#ecfeff" },
  { label: "Orders", desc: "Recent orders", icon: ShoppingBag, path: "/orders", color: "#16a34a", bg: "#f0fdf4" },
  { label: "Analytics", desc: "View insights", icon: BarChart2, path: "/sales", color: "#d97706", bg: "#fefce8" },
  { label: "Settings", desc: "Store config", icon: Settings2, path: "/settings", color: "#64748b", bg: "#f8fafc" },
];

export function StoreSettingsLayout({ shop }: { shop: any }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingSection>("details");
  const { showToast } = useToast();

  const [hoursStatus, setHoursStatus] = useState<React.ReactNode>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<React.ReactNode>(null);

  // Payments State
  const [codEnabled, setCodEnabled] = useState(true);
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [upiId, setUpiId] = useState("store@upi");
  const [cardEnabled, setCardEnabled] = useState(false);
  const [savingPayments, setSavingPayments] = useState(false);

  // Vacation Mode State
  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [vacationMessage, setVacationMessage] = useState("We are temporarily closed for staff training. We will resume taking orders shortly.");
  const [resumeDate, setResumeDate] = useState("");
  const [savingVacation, setSavingVacation] = useState(false);

  // Danger Zone State
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { id: "details", label: "Store details", icon: Store },
    { id: "hours", label: "Store hours", icon: Clock },
    { id: "delivery", label: "Delivery", icon: Truck },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "vacation", label: "Vacation mode", icon: Palmtree },
    { id: "danger", label: "Danger zone", icon: AlertTriangle },
  ];

  const handleSavePayments = () => {
    setSavingPayments(true);
    setTimeout(() => {
      setSavingPayments(false);
      showToast("Payment options updated successfully", "success");
    }, 800);
  };

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

  // Calculate Health Pct
  const checks = [
    { label: "Logo uploaded", done: !!shop?.logo_url },
    { label: "Banner uploaded", done: !!shop?.banner_url },
    { label: "Description added", done: !!shop?.description },
    { label: "Address set", done: !!shop?.address?.full_address && shop?.address.full_address !== "Not specified" },
    { label: "Store visible online", done: !!shop?.visible_online },
    { label: "Category selected", done: shop?.categories && shop?.categories.length > 0 },
  ];
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);

  return (
    <div className="flex flex-col md:flex-row h-[650px] bg-slate-50/30 rounded-2xl overflow-hidden border border-slate-100">
      {/* Left Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-slate-100 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-1.5">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon size={17} className={isActive ? "text-white" : "text-slate-400"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions inside settings sidebar */}
        <div className="mt-8 border-t border-slate-100 pt-4 space-y-2.5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Quick Actions</h4>
          <div className="grid grid-cols-1 gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/40 transition-all duration-150 group text-left"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: a.bg, color: a.color }}>
                  <a.icon size={13} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 truncate">{a.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Content Panel */}
      <div className="flex-1 bg-white p-6 overflow-y-auto">
        {activeSection === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            <div className="lg:col-span-7">
              <ShopProfileForm />
            </div>
            
            {/* Store Health & Info Card */}
            <div className="lg:col-span-5 space-y-5">
              {/* Store Health */}
              <div className="bg-slate-50/60 rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Store Health</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Complete setup for better visibility</p>
                  </div>
                  <span className="text-sm font-extrabold text-blue-600">{pct}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-4 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: pct === 100 ? "#16a34a" : "#2563eb" }}
                  />
                </div>
                <div className="space-y-2">
                  {checks.map((c) => (
                    <div key={c.label} className="flex items-center gap-2">
                      {c.done
                        ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        : <AlertCircle size={13} className="text-amber-400 shrink-0" />
                      }
                      <span className={`text-[11px] font-semibold ${c.done ? "text-slate-650 text-slate-600" : "text-amber-600"}`}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Store Info Read-only Metadata */}
              <div className="bg-slate-50/60 rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-800">Metadata Summary</h3>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-100/60">
                    <span className="text-slate-400">Business Type</span>
                    <span className="font-semibold text-slate-700">{shop?.business_infos?.type || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100/60">
                    <span className="text-slate-400">Currency</span>
                    <span className="font-semibold text-slate-700">{shop?.business_infos?.currency || "INR"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100/60">
                    <span className="text-slate-400">GST Status</span>
                    <span className="font-semibold text-slate-700">
                      {shop?.business_infos?.gst_infos?.registered
                        ? `Registered (${shop.business_infos.gst_infos.number || "—"})`
                        : "Not Registered"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100/60">
                    <span className="text-slate-400">Member Since</span>
                    <span className="font-semibold text-slate-700">{shop?.created_at}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Store ID</span>
                    <span className="font-mono text-[9px] text-slate-500 truncate max-w-[130px]" title={shop?.id}>{shop?.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "hours" && (
          <div className="h-full space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Store Hours</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Configure when your store is open for business and accepting online orders.
                </p>
              </div>
              <div className="shrink-0">
                {hoursStatus}
              </div>
            </div>
            <OperatingHours onStatusChange={setHoursStatus} />
          </div>
        )}

        {activeSection === "delivery" && (
          <div className="h-full space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Delivery Preferences</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Set up delivery zones, charges, and expected lead times.
                </p>
              </div>
              <div className="shrink-0">
                {deliveryStatus}
              </div>
            </div>
            <DeliveryPreferences onStatusChange={setDeliveryStatus} />
          </div>
        )}

        {activeSection === "payments" && (
          <div className="max-w-2xl space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Payment Options</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Select and configure the payment methods accepted by your online store.
                </p>
              </div>
              <button
                onClick={handleSavePayments}
                disabled={savingPayments}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                {savingPayments ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="space-y-4">
              {/* COD */}
              <div className="flex items-start justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 block">Cash on Delivery (COD)</span>
                  <span className="text-[11px] text-slate-400 block">Allow customers to pay in cash upon receiving order.</span>
                </div>
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => setCodEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 mt-1 cursor-pointer"
                />
              </div>

              {/* UPI */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">UPI Payments</span>
                    <span className="text-[11px] text-slate-400 block">Allow direct instant transfers via UPI ID or QR Code.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={upiEnabled}
                    onChange={(e) => setUpiEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 mt-1 cursor-pointer"
                  />
                </div>
                {upiEnabled && (
                  <div className="pt-3 border-t border-slate-100/70">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">UPI ID (for payments)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full max-w-md h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      placeholder="e.g. storename@upi"
                    />
                  </div>
                )}
              </div>

              {/* Credit/Debit Cards */}
              <div className="flex items-start justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 block">Credit / Debit Cards</span>
                  <span className="text-[11px] text-slate-400 block">Accept Visa, Mastercard, RuPay, and Net Banking.</span>
                </div>
                <input
                  type="checkbox"
                  checked={cardEnabled}
                  onChange={(e) => setCardEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 mt-1 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === "vacation" && (
          <div className="max-w-2xl space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Vacation Mode</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Temporarily pause online orders and display a notice to visitors.
                </p>
              </div>
              <button
                onClick={handleSaveVacation}
                disabled={savingVacation}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                {savingVacation ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Palmtree size={17} className="text-amber-600" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Enable Vacation Mode</span>
                      <span className="text-[11px] text-slate-400 block">Customers can browse your products but cannot place new orders.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={vacationEnabled}
                      onChange={(e) => setVacationEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  {vacationEnabled && (
                    <div className="space-y-3 pt-3 border-t border-slate-100/70">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Notice Message</label>
                        <textarea
                          value={vacationMessage}
                          onChange={(e) => setVacationMessage(e.target.value)}
                          className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Expected Resume Date (Optional)</label>
                        <input
                          type="date"
                          value={resumeDate}
                          onChange={(e) => setResumeDate(e.target.value)}
                          className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "danger" && (
          <div className="max-w-2xl space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-red-100 pb-4">
              <h3 className="text-sm font-bold text-red-650 text-red-655 text-red-600 flex items-center gap-2">
                <AlertTriangle size={18} /> Danger Zone
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Irreversible actions that affect your online shop storefront.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-red-100 bg-red-50/20 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">Deactivate Store</span>
                  <span className="text-[11px] text-slate-500 block">
                    Temporarily take your store offline. Your products and config will be saved, but the shop won't be accessible to any customer.
                  </span>
                </div>
                <button className="h-9 px-4 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg transition-all">
                  Deactivate Store
                </button>
              </div>

              <div className="p-4 rounded-xl border border-red-100 bg-red-50/20 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">Delete Store Permanent</span>
                  <span className="text-[11px] text-slate-500 block text-red-650/80">
                    Permanently delete all catalog items, order records, and settings. This action is <strong>not undoable</strong>.
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500">Type "DELETE" to confirm</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      className="h-9 px-3 bg-white border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm"
                      placeholder="DELETE"
                    />
                    <button
                      onClick={handleDeleteStore}
                      disabled={deleting || confirmDelete !== "DELETE"}
                      className="h-9 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Trash2 size={14} />
                      {deleting ? "Deleting..." : "Permanently Delete"}
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
