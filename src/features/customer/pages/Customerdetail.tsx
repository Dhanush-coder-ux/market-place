import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DollarSign, AlertCircle, Package, Star,
  Banknote, Mail, Wallet, Pencil, User, Tag, MapPin, Phone, Trash2,
  FileText, Database, CreditCard,
  ShoppingCart,
  ArrowRight
} from "lucide-react";
import {
  fmt, StatusBadge, FormInput, FormSelect,
  FormTextarea, SectionCard, ActivityEntry,
} from "./CustomerDetailComponents";
import { Modal, ProfileHeaderCard } from "@/components/common/SuperUI";
import { StatCard } from "@/components/common/StatsCard";
import { BiLogoWhatsapp } from "react-icons/bi";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { CustomerRecord } from "@/types/api";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

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
    } catch (_error) {
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

const INITIAL_ACTIVITIES: ActivityEntry[] = [];
const TABS = ["General Info", "Purchases", "Credit History", "Timeline"];

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
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [outstanding, setOutstanding] = useState(0);
  const [activities, setActivities] = useState<ActivityEntry[]>(INITIAL_ACTIVITIES);
  const [viewValue, setViewValue] = useState<{ label: string, value: string } | null>(null);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [creditLoading, setCreditLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.CUSTOMERS}/by/${SHOP_ID}/${id}`).then((res) => {
      if (res) setCustomer(Array.isArray(res.data) ? res.data[0] : res.data);
      setRecordLoading(false);
    });
  }, [id, getData]);

  useEffect(() => {
    if (activeTab === 1 && id) { // Index 1 is Purchases
      setOrdersLoading(true);
      getData(`${ENDPOINTS.ORDERS}/by/customer/${SHOP_ID}/${id}`).then((res) => {
        if (res && res.data) {
          setCustomerOrders(res.data);
        }
        setOrdersLoading(false);
      });
    }
  }, [activeTab, id, getData]);

  useEffect(() => {
    if (activeTab === 2 && id) { // Index 2 is Credit History
      setCreditLoading(true);
      getData(`${ENDPOINTS.CUSTOMERS}/credit/histories/${SHOP_ID}/${id}`).then((res) => {
        if (res && res.data) {
          setCreditHistory(res.data);
        }
        setCreditLoading(false);
      });
    }
  }, [activeTab, id, getData]);

  function handleSavePayment() {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) { alert("Please enter a valid payment amount"); return; }
    const now = new Date().toLocaleString("en-IN", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true });
    setOutstanding((o) => Math.max(0, o - amt));
    setActivities((a) => [{
      icon: <Banknote className="w-5 h-5 text-emerald-600" />, iconBg: "bg-emerald-100",
      text: `<strong>Payment received</strong> of ₹${amt.toLocaleString()} via ${paymentMethod}`, time: now,
    }, ...a]);
    setShowPayment(false);
    setPaymentAmount(""); setPaymentRef(""); setPaymentNotes("");
    showToast(`Payment of ₹${amt.toLocaleString()} recorded successfully!`, "success");
  }

  async function handleDelete() {
    const targetId = customer?.id || id;
    if (!targetId) return;

    setDeleting(true);
    try {
      const res = await deleteData(`${ENDPOINTS.CUSTOMERS}/${SHOP_ID}/${targetId}`);
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
  const name = customer.name || "Unknown Customer";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);



  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(400px); } to { transform: translateX(0); } }
      `}</style>

      <div className="min-h-screen bg-slate-50/50 font-[Inter,sans-serif]">
        <div className="max-w-full mx-auto px-4 md:px-10 py-3 space-y-4">

          {/* Profile Header Card */}
          <ProfileHeaderCard
            name={name}
            initials={initials}
            subText={`ID: ${customer.id}`}
            badges={[
              { text: String(datas.customer_type || "Normal"), variant: "primary" },
              {
                text: customer.is_active ? "Active" : "Inactive",
                variant: customer.is_active ? "success" : "danger",
                showPulse: true
              }
            ]}
            infoItems={[
              { icon: Mail, text: String(customer.email || "No email") },
              { icon: Phone, text: String(customer.mobile_number || "No phone") }
            ]}
            actions={
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
            }
          />

          {/* Tabs Navigation - Smaller */}
          <div className="flex gap-0.5 bg-white p-1 rounded-xl border border-slate-200 w-fit">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeTab === i
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Stats Grid */}
          <div className="flex flex-wrap gap-2">
            <StatCard
              icon={DollarSign}
              label="Total Revenue"
              value={datas.total_purchases ? `₹${datas.total_purchases}` : "₹0"}
              iconBg="bg-blue-50 text-blue-600"
              className="flex-1 min-w-[140px]"
            />
            <StatCard
              icon={AlertCircle}
              label="Outstanding"
              value={fmt(Number(datas.outstanding_balance) || outstanding || 0)}
              iconBg="bg-rose-50 text-rose-600"
              className="flex-1 min-w-[140px]"
            />
            <StatCard
              icon={Package}
              label="Total Orders"
              value={String(datas.total_orders || "0")}
              iconBg="bg-blue-50 text-blue-600"
              className="flex-1 min-w-[140px]"
            />
            <StatCard
              icon={Star}
              label="LTV Score"
              value={datas.lifetime_value ? `₹${datas.lifetime_value}` : "₹0"}
              iconBg="bg-amber-50 text-amber-600"
              className="flex-1 min-w-[140px]"
            />
          </div>

          {/* Tab Panels */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* TAB 0 — General Info */}
            {activeTab === 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                {/* Main Content Column */}
                <div className="xl:col-span-3 space-y-4">
                  {/* Primary & Dynamic Fields */}
                  <SectionCard className="rounded-[1.5rem] border-slate-200 shadow-sm p-4 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl -z-0" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                          <User size={16} />
                        </div>
                        <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em]">Primary & Dynamic Fields</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-6 gap-x-8">
                        {/* Always show key fields first */}
                        <DetailItem
                          icon={User} label="Full Name" value={name}
                          onClick={() => setViewValue({ label: "Full Name", value: name })}
                        />
                        <DetailItem
                          icon={Mail} label="Email Address" value={String(customer.email || "—")}
                          onClick={() => setViewValue({ label: "Email Address", value: String(customer.email || "—") })}
                        />
                        <DetailItem
                          icon={Phone} label="Phone Number" value={String(customer.mobile_number || "—")}
                          onClick={() => setViewValue({ label: "Phone Number", value: String(customer.mobile_number || "—") })}
                        />
                        <DetailItem
                          icon={CreditCard} label="Credit Limit" value={fmt(customer.credit_limit || 0)}
                          onClick={() => setViewValue({ label: "Credit Limit", value: fmt(customer.credit_limit || 0) })}
                        />

                        {/* Dynamically render all other fields */}
                        {Object.entries(datas).map(([key, val]) => {
                          // Skip fields we already showed or internal ones
                          if (["name", "email", "mobile_number", "credit_limit", "is_active", "shop_id", "id", "ui_id", "created_at", "updated_at", "datas", "address"].includes(key)) return null;

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
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 text-xs font-semibold">Registered Address</p>
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {String((datas.address as any)?.full_address || "No address provided.")}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 text-xs font-semibold">Zip Code</p>
                            <p className="text-sm font-bold font-mono text-slate-700 tracking-tight bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center h-[46px]">
                              {String((datas.address as any)?.zip_code || "—")}
                            </p>
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
                        {String(datas.additional_notes || "No internal notes registered for this customer.")}
                      </p>
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* TAB 1 — Purchases */}
            {activeTab === 1 && (
              <SectionCard className="rounded-[2.5rem] p-8 border-none shadow-xl bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl -z-0" />
                
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.25rem] bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <ShoppingCart size={24} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Purchase History</h2>
                        <p className="text-xs text-slate-400 font-medium tracking-tight">Transactional record of all orders</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Total Orders</p>
                        <p className="text-sm font-black text-slate-700">{customerOrders.length}</p>
                      </div>
                      <div className="px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                        <p className="text-[9px] font-black text-blue-400 uppercase mb-0.5">Total Spend</p>
                        <p className="text-sm font-black text-blue-700">{fmt(customerOrders.reduce((acc, curr) => acc + Number(curr.total_sellprice || 0), 0))}</p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-8 px-8">
                    {ordersLoading ? (
                      <div className="py-24 flex justify-center"><Loader /></div>
                    ) : customerOrders.length === 0 ? (
                      <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                          <Package size={40} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">No Orders Yet</h3>
                        <p className="text-xs text-slate-400 mt-2">When this customer makes a purchase, it will appear here.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                          <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                            <th className="px-6 pb-2">Invoice Identity</th>
                            <th className="px-6 pb-2">Order Date</th>
                            <th className="px-6 pb-2">Volume</th>
                            <th className="px-6 pb-2">Financials</th>
                            <th className="px-6 pb-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerOrders.map((order) => {
                            const date = new Date(order.created_at || order.date).toLocaleDateString('en-IN', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            });
                            const total = Number(order.total_sellprice || order.grand_total || order.total_amount || 0);
                            const products = order.items || order.products || [];
                            const itemCount = order.total_quantity || products.length;
                            const invoiceId = order.ui_id ? `INV-${order.ui_id}` : `#${order.id.slice(0, 8).toUpperCase()}`;

                            return (
                              <tr key={order.id} className="group hover:scale-[1.01] transition-all duration-300">
                                <td className="px-6 py-4 bg-white border-y border-l border-slate-100 rounded-l-2xl shadow-sm group-hover:border-blue-200 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                      <FileText size={14} />
                                    </div>
                                    <span className="text-sm font-black text-slate-700 font-mono tracking-tight group-hover:text-blue-700 transition-colors">{invoiceId}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 bg-white border-y border-slate-100 shadow-sm group-hover:border-blue-200 transition-colors">
                                  <span className="text-xs font-bold text-slate-600">{date}</span>
                                </td>
                                <td className="px-6 py-4 bg-white border-y border-slate-100 shadow-sm group-hover:border-blue-200 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-black text-slate-500 uppercase">{itemCount} {itemCount === 1 ? "Item" : "Units"}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 bg-white border-y border-slate-100 shadow-sm group-hover:border-blue-200 transition-colors">
                                  <span className="text-sm font-black text-slate-800">{fmt(total)}</span>
                                </td>
                                <td className="px-6 py-4 bg-white border-y border-r border-slate-100 rounded-r-2xl shadow-sm text-right group-hover:border-blue-200 transition-colors">
                                  <StatusBadge status={order.status || "Pending"} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* TAB 2 — Credit History */}
            {activeTab === 2 && (
              <SectionCard className="rounded-[2.5rem] p-8 border-none shadow-xl bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl -z-0" />
                
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Database size={24} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Credit Ledger</h2>
                        <p className="text-xs text-slate-400 font-medium tracking-tight">System-wide credit adjustment logs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 self-start md:self-center">
                       <span className="px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{creditHistory.length} Total Logs</span>
                    </div>
                  </div>

                  {creditLoading ? (
                    <div className="py-24 flex justify-center"><Loader /></div>
                  ) : creditHistory.length === 0 ? (
                    <div className="py-24 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                        <CreditCard size={40} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">No Ledger Entries</h3>
                      <p className="text-xs text-slate-400 mt-2">Historical credit changes will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {creditHistory.map((item, _i) => {
                        const isPositive = (item.credit_after - item.credit_before) >= 0;
                        const diff = item.credit_after - item.credit_before;
                        const date = new Date(item.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div key={item.id} className="group relative bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between gap-6">
                              <div className="flex items-center gap-5 min-w-0">
                                <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${item.type === "SALES" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                                  {item.type === "SALES" ? <ShoppingCart size={20} /> : <Database size={20} />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.type}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase">
                                    <span>Before: <span className="text-slate-600">{fmt(item.credit_before)}</span></span>
                                    <ArrowRight size={10} className="text-slate-300" />
                                    <span>After: <span className="text-slate-800">{fmt(item.credit_after)}</span></span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right shrink-0">
                                <div className={`text-lg font-black tracking-tight ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                                  {isPositive ? "+" : ""}{fmt(diff)}
                                </div>
                                <div className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest inline-block mt-1">
                                   Balance Changed
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
            <FormInput label="Email Address" type="email" defaultValue={String(customer.email ?? "")} />
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
