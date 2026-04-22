import { useState, useEffect} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DollarSign, AlertCircle, Package, Star,
  Banknote, Mail, Wallet, Pencil, User, Tag, MapPin, Phone, Trash2,
  Store, FileText, Database
} from "lucide-react";
import {
  fmt, StatusBadge, Modal, FormInput, FormSelect,
  FormTextarea, InfoRow, SectionCard,PaymentEntry, ActivityEntry, PendingInvoice,
} from "./CustomerDetailComponents";
import { StatCard } from "@/components/common/StatsCard";
import {  BiLogoWhatsapp } from "react-icons/bi";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { CustomerRecord } from "@/types/api";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Tooltip } from "@/components/common/Tootlip";

// ── Search bar ──────────────────────────────────────────────────────────────
const CustomerSearch = () => {
  const navigate = useNavigate();
  const { getData } = useApi();

  const fetchCustomers = async (q: string) => {
    if (!q) return [];
    try {
      const res = await getData(ENDPOINTS.CUSTOMERS, { limit: "8", offset: "1", q });
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      return data.map((c: any) => ({
        ...c,
        displayName: String(c.datas?.name ?? c.datas?.full_name ?? c.datas?.customer_name ?? c.id)
      }));
    } catch (error) {
      return [];
    }
  };

  return (
    <div className="w-full relative z-50">
      <SearchSelect
        labelKey="displayName"
        valueKey="id"
        fetchOptions={fetchCustomers}
        placeholder="Search customer by name / ID…"
        className="w-full"
        onChange={(val) => {
          if (val) {
            navigate(`/customers/${val}`);
          }
        }}
      />
    </div>
  );
};

// ── Static payment / activity data (frontend-only feature) ──────────────────
const PENDING_INVOICES: PendingInvoice[] = [];
const INITIAL_PAYMENTS: PaymentEntry[] = [];
const INITIAL_ACTIVITIES: ActivityEntry[] = [];
const TABS = ["General Info", "Financials", "Purchases", "Timeline"];

// ─── Helper Components ────────────────────────────────────────────────────────
const DetailItem = ({ icon: Icon, label, value, onClick }: { icon: any, label: string, value: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`flex items-start gap-3 p-1 -m-1 rounded-lg transition-colors ${onClick ? "cursor-pointer hover:bg-slate-50 active:scale-[0.98]" : ""}`}
  >
    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
      <Icon size={12} strokeWidth={2.5} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.05em] mb-0.5">{label}</p>
      <p className="text-[13px] font-bold text-slate-700 truncate tracking-tight">{value}</p>
    </div>
  </div>
);

// ── Main page ───────────────────────────────────────────────────────────────
export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData, deleteData } = useApi();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);

  // Tab & modal state
  const [activeTab, setActiveTab] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Payment form
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [outstanding, setOutstanding] = useState(0);
  const [payments, setPayments] = useState<PaymentEntry[]>(INITIAL_PAYMENTS);
  const [activities, setActivities] = useState<ActivityEntry[]>(INITIAL_ACTIVITIES);
  const [viewValue, setViewValue] = useState<{ label: string, value: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.CUSTOMERS}/by/${id}`).then((res) => {
      if (res) setCustomer(Array.isArray(res.data) ? res.data[0] : res.data);
      setRecordLoading(false);
    });
  }, [id]);

  function handleSavePayment() {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) { alert("Please enter a valid payment amount"); return; }
    const now = new Date().toLocaleString("en-IN", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true });
    setOutstanding((o) => Math.max(0, o - amt));
    setPayments((p) => [{ title: "Payment Received", amount: amt, date: now, invoice: selectedInvoices.join(", ") || "—", method: paymentMethod }, ...p]);
    setActivities((a) => [{
      icon: <Banknote className="w-5 h-5 text-emerald-600" />, iconBg: "bg-emerald-100",
      text: `<strong>Payment received</strong> of ₹${amt.toLocaleString()} via ${paymentMethod}`, time: now,
    }, ...a]);
    setShowPayment(false);
    setPaymentAmount(""); setPaymentRef(""); setPaymentNotes(""); setSelectedInvoices([]);
    showToast(`Payment of ₹${amt.toLocaleString()} recorded successfully!`, "success");
  }

  async function handleDelete() {
    const targetId = customer?.id || id;
    if (!targetId) return;
    
    setDeleting(true);
    try {
      const res = await deleteData(`${ENDPOINTS.CUSTOMERS}/${targetId}`);
      if (res) {
        showToast("Customer deleted successfully!", "success");
        setTimeout(() => navigate("/customers-Summary"), 1500);
      } else {
        showToast("Failed to delete customer. Please try again.", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("An unexpected error occurred.", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (recordLoading) {
    return <div className="p-12 flex justify-center"><Loader /></div>;
  }

  if (!customer) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-500">Customer not found.</p>
        <div className="flex justify-center"><CustomerSearch /></div>
      </div>
    );
  }

  const datas = customer.datas ?? {};
  const name = (datas.first_name || datas.last_name) ? `${datas.first_name || ""} ${datas.last_name || ""}`.trim() : "Unknown Customer";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  // Build static labeled field list
  const infoFields = [
    { label: "First Name", value: String(datas.first_name ?? "—") },
    { label: "Last Name", value: String(datas.last_name ?? "—") },
    { label: "Company", value: String(datas.company ?? "—") },
    { label: "Email", value: String(datas.email ?? "—") },
    { label: "Phone", value: String(datas.phone ?? "—") },
    { label: "Customer Type", value: String(datas.customer_type ?? "—") },
    { label: "Street Address", value: String(datas.street_address ?? "—") },
    { label: "City", value: String(datas.city ?? "—") },
    { label: "State", value: String(datas.state ?? "—") },
    { label: "ZIP Code", value: String(datas.zip_code ?? "—") },
    { label: "Notes", value: String(datas.notes ?? "—") },
  ];

  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(400px); } to { transform: translateX(0); } }
      `}</style>

      <div className="min-h-screen bg-slate-50/50 font-[Inter,sans-serif]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-6">

          {/* Premium Profile Header Card - More Compact */}
          <div className="bg-white rounded-[1.5rem] p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 blur-3xl" />
            
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-200 ring-2 ring-white">
                  {initials}
                </div>

              {/* Title & Info - Smaller Fonts */}
              <div className="flex-1 space-y-1">
                <div className="flex flex-col mb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">{name}</h1>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-extrabold uppercase tracking-widest border border-blue-100">
                        {String(datas.customer_type || "Normal")}
                      </span>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                        datas.is_active !== false 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${datas.is_active !== false ? "bg-emerald-500" : "bg-rose-500"} animate-pulse`} />
                        {datas.is_active !== false ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 font-mono tracking-tight">
                    ID: {customer.id}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-[12px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} className="text-blue-400" />
                    {String(datas.email || "No email")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-blue-400" />
                    {String(datas.phone || "No phone")}
                  </div>
                </div>
              </div>

              {/* Header Actions - Smaller */}
              <div className="flex items-center gap-1.5">
                <button 
                  className="w-8 h-8 flex items-center justify-center bg-[#25D366] text-white rounded-lg hover:bg-[#20bd5a] transition-all shadow-md shadow-emerald-100 active:scale-95"
                  title="WhatsApp"
                >
                  <BiLogoWhatsapp size={16} />
                </button>
                <button
                  onClick={() => navigate(`/customers/${id}/edit`)}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
                  title="Edit Profile"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-300 rounded-lg hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm active:scale-95"
                  title="Delete Customer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation - Smaller */}
          <div className="flex gap-0.5 bg-white p-1 rounded-xl border border-slate-200 w-fit">
            {TABS.map((tab, i) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(i)}
                className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  activeTab === i 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={DollarSign} 
              label="Total Revenue" 
              value={datas.total_purchases ? `₹${datas.total_purchases}` : "₹0"} 
              iconBg="bg-blue-50 text-blue-600" 
            />
            <StatCard 
              icon={AlertCircle} 
              label="Outstanding" 
              value={fmt(Number(datas.outstanding_balance) || outstanding || 0)} 
              iconBg="bg-rose-50 text-rose-600" 
            />
            <StatCard 
              icon={Package} 
              label="Total Orders" 
              value={String(datas.total_orders || "0")} 
              iconBg="bg-blue-50 text-blue-600" 
            />
            <StatCard 
              icon={Star} 
              label="LTV Score" 
              value={datas.lifetime_value ? `₹${datas.lifetime_value}` : "₹0"} 
              iconBg="bg-amber-50 text-amber-600" 
            />
          </div>

          {/* Tab Panels */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* TAB 0 — General Info */}
            {activeTab === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Primary & Dynamic Fields */}
                  <SectionCard className="rounded-[1.5rem] border-slate-200 shadow-sm p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl -z-0" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                          <User size={16} />
                        </div>
                        <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Detailed Profile Information</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-10">
                        {/* Always show key fields first */}
                        <DetailItem 
                          icon={User} label="Full Name" value={name} 
                          onClick={() => setViewValue({ label: "Full Name", value: name })} 
                        />
                        <DetailItem 
                          icon={Mail} label="Email Address" value={String(datas.email || "—")} 
                          onClick={() => setViewValue({ label: "Email Address", value: String(datas.email || "—") })} 
                        />
                        <DetailItem 
                          icon={Phone} label="Phone Number" value={String(datas.phone || "—")} 
                          onClick={() => setViewValue({ label: "Phone Number", value: String(datas.phone || "—") })} 
                        />
                        <DetailItem 
                          icon={Store} label="Company" value={String(datas.company || "—")} 
                          onClick={() => setViewValue({ label: "Company", value: String(datas.company || "—") })} 
                        />
                        
                        {/* Dynamically render all other fields */}
                        {Object.entries(datas).map(([key, val]) => {
                          // Skip fields we already showed or internal ones
                          if (["first_name", "last_name", "email", "phone", "company", "is_active", "street_address", "city", "state", "zip_code", "notes", "customer_type", "gst_number"].includes(key)) return null;
                          
                          // Format key: snake_case to Title Case
                          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          return (
                            <DetailItem 
                              key={key} 
                              icon={Database} 
                              label={label} 
                              value={String(val ?? "—")} 
                              onClick={() => setViewValue({ label, value: String(val ?? "—") })}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </SectionCard>

                  {/* Address Card */}
                  <SectionCard className="rounded-[1.5rem] border-slate-200 shadow-sm p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-12 -mt-12 blur-2xl -z-0" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                          <MapPin size={16} />
                        </div>
                        <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Registered Address</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 text-xs font-semibold">Street Address</p>
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {String(datas.street_address || "No street address provided.")}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-xs font-semibold">City / State</p>
                            <p className="text-sm font-semibold text-slate-700">{datas.city ? `${datas.city}, ${datas.state || ""}` : "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-xs font-semibold">Zip Code</p>
                            <p className="text-sm font-bold font-mono text-slate-700 tracking-tight">{String(datas.zip_code || "—")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-5">
                  {/* Business Classification */}
                  <SectionCard className="rounded-[1.5rem] border-slate-200 shadow-sm p-5 bg-gradient-to-br from-white to-blue-50/30">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <Tag size={16} />
                      </div>
                      <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Business Identity</h2>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</span>
                        <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{String(datas.customer_type || "Normal")}</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GSTN</span>
                        <span className="text-[12px] font-bold text-slate-700 font-mono tracking-tighter">{String(datas.gst_number || "—")}</span>
                      </div>
                    </div>
                  </SectionCard>

                  {/* Notes Card */}
                  <SectionCard className="rounded-[1.5rem] border-slate-200 shadow-sm p-6 bg-slate-50/50 flex-1">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                        <FileText size={16} />
                      </div>
                      <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Internal Notes</h2>
                    </div>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-full" />
                      <p className="pl-4 text-[13px] font-medium text-slate-500 leading-relaxed italic break-words">
                        {String(datas.notes || "No internal notes registered for this customer.")}
                      </p>
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* TAB 1 — Financials */}
            {activeTab === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard className="rounded-[2rem]">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-8">Payment Timeline</h2>
                  {payments.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                        <Banknote size={32} />
                      </div>
                      <p className="text-slate-400 font-medium">No payments recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {payments.map((p, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white z-10" />
                            {i < payments.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 -my-1" />}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-bold text-slate-800">{p.title}</span>
                              <span className="text-sm font-bold text-emerald-600">+{fmt(p.amount)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{p.date}</div>
                            <p className="text-xs text-slate-500">Via {p.method} • Ref: {p.invoice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <div className="space-y-6">
                  <SectionCard className="rounded-[2rem] bg-slate-900 text-white border-0 shadow-2xl shadow-blue-200">
                    <h2 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-6">Current Balance</h2>
                    <div className="space-y-1 mb-8">
                      <div className="text-4xl font-black">{fmt(outstanding)}</div>
                      <div className="text-xs text-slate-400 font-medium">Net outstanding across all invoices</div>
                    </div>
                    <button 
                      onClick={() => setShowPayment(true)}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
                    >
                      Record New Payment
                    </button>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* TAB 2 — Purchases */}
            {activeTab === 2 && (
              <SectionCard className="rounded-[2rem]">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Purchase History</h2>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {String(datas.total_orders || 0)} Total Orders
                  </div>
                </div>
                
                <div className="overflow-x-auto -mx-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        <th className="px-8 py-4">Invoice ID</th>
                        <th className="px-8 py-4">Date</th>
                        <th className="px-8 py-4">Items</th>
                        <th className="px-8 py-4">Total</th>
                        <th className="px-8 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3].map((_, i) => (
                        <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-8 py-4 font-mono text-xs text-slate-600 font-bold group-hover:text-blue-600 transition-colors">
                            #INV-2024-{(9524 + i)}
                          </td>
                          <td className="px-8 py-4 text-sm text-slate-600 font-medium">
                            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-4 text-sm text-slate-500 font-medium">
                            Electronics & Accessories
                          </td>
                          <td className="px-8 py-4 text-sm font-bold text-slate-800">
                            ₹{(12400 + (i * 2500)).toLocaleString()}
                          </td>
                          <td className="px-8 py-4">
                            <StatusBadge status={i === 0 ? "Paid" : "Pending"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* TAB 3 — Timeline */}
            {activeTab === 3 && (
              <SectionCard className="rounded-[2rem]">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-8">Activity Timeline</h2>
                {activities.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-medium">
                    No recent activity detected.
                  </div>
                ) : (
                  <div className="space-y-0">
                    {activities.map((a, i) => (
                      <div key={i} className="flex gap-6 group relative">
                        <div className="flex flex-col items-center">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.iconBg} z-10 transition-transform group-hover:scale-110`}>
                             {a.icon}
                           </div>
                           {i < activities.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 -my-2" />}
                        </div>
                        <div className="flex-1 pb-10">
                          <div className="text-sm text-slate-800 mb-1" dangerouslySetInnerHTML={{ __html: a.text }} />
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        </div>

        {/* MODAL — View Full Value */}
        <Modal 
          show={!!viewValue} 
          onClose={() => setViewValue(null)} 
          title={viewValue?.label || "Field Detail"}
          className="max-w-md"
        >
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-sm font-bold text-slate-700 break-words leading-relaxed select-all">
              {viewValue?.value}
            </p>
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Double click the text to select and copy
          </p>
        </Modal>

        {/* Bottom Action Bar */}
        {/* <BottomActionBar
          customerName={name}
          actions={[
            { label: "Send Invoice", icon: <Mail className="w-4 h-4" />, variant: "secondary", onClick: () => setShowInvoice(true) },
            { label: "Record Payment", icon: <Wallet className="w-4 h-4" />, variant: "success", onClick: () => setShowPayment(true) },
            { label: "Edit Customer", icon: <Pencil className="w-4 h-4" />, variant: "primary", onClick: () => navigate(`/customers/${id}/edit`) },
          ]}
        /> */}

        {/* MODAL — Record Payment */}
        <Modal show={showPayment} onClose={() => setShowPayment(false)} title="Record Payment"
          footer={
            <>
              <button onClick={() => setShowPayment(false)} className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSavePayment} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold">
                <Wallet className="w-4 h-4" /> Save Payment
              </button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Payment Amount" type="number" value={paymentAmount} onChange={(e: any) => setPaymentAmount(e.target.value)} placeholder="₹0.00" />
              <FormSelect label="Payment Method" options={["UPI", "Cash", "Bank Transfer", "Card", "Cheque"]} value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} />
            </div>
            <FormInput label="Payment Date" type="date" value={paymentDate} onChange={(e: any) => setPaymentDate(e.target.value)} />
            <FormInput label="Reference Number (Optional)" type="text" value={paymentRef} onChange={(e: any) => setPaymentRef(e.target.value)} placeholder="Transaction ID, Cheque #" />
            <FormTextarea label="Notes (Optional)" value={paymentNotes} onChange={(e: any) => setPaymentNotes(e.target.value)} placeholder="Add any notes..." />
          </div>
        </Modal>

        {/* MODAL — Send Invoice */}
        <Modal show={showInvoice} onClose={() => setShowInvoice(false)} title="Send Invoice"
          footer={
            <>
              <button onClick={() => setShowInvoice(false)} className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setShowInvoice(false); showToast("Invoice sent successfully!", "success"); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold">
                <Mail className="w-4 h-4" /> Send Invoice
              </button>
            </>
          }
        >
          <div className="space-y-5">
            <FormInput label="Email Address" type="email" defaultValue={String(datas.email ?? "")} />
            <FormInput label="Subject" type="text" defaultValue="Invoice from Market Place" />
            <FormTextarea label="Message" defaultValue={`Dear ${name},\n\nPlease find attached your invoice.\n\nThank you!\n\nBest regards,\nMarket Place Team`} style={{ minHeight: 120 }} />
          </div>
        </Modal>

        {/* Global Reusable Confirm Dialog */}
        <ConfirmDialog
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Customer"
          description={`This action cannot be undone. This will permanently delete ${name} and all associated data.`}
          confirmText="Delete Customer"
          loading={deleting}
          type="danger"
          icon={Trash2}
        />
      </div>
    </>
  );
}
