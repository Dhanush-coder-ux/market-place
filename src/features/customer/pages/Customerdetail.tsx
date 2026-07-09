import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DollarSign, AlertCircle, Star,
  Mail, Pencil, User, Phone, Trash2,
  CreditCard, Database, MapPin, Tag, FileText, Banknote,
  Layers, Check, X as XIcon
} from "lucide-react";
import {
  fmt, SectionCard, FormInput, FormTextarea
} from "./CustomerDetailComponents";
import { Modal, ProfileHeaderCard } from "@/components/common/SuperUI";
import { StatCard } from "@/components/common/StatsCard";
import { BiLogoWhatsapp } from "react-icons/bi";
import { useApi } from "@/context/ApiContext";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { useToast } from "@/context/ToastContext";
import { useHeader } from "@/context/HeaderContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { CustomerRecord } from "@/types/api";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CustomerPurchasesTable, CustomerCollectionsTable } from "@/components/common/HistoryTables";
import { RecordPaymentModal } from "@/features/customer/components/RecordPaymentModal";
import { customerCustomFieldsApi } from "@/services/api/customer";
import type { CustomerCustomFieldDefinition, CustomerCustomFieldValue } from "../type";

// ── Search bar ──────────────────────────────────────────────────────────────
const CustomerSearch = () => {
  const navigate = useNavigate();
  const { customer: customerApi } = useBusinessApi();

  const fetchCustomers = async (q: string) => {

    try {
      const res = await customerApi.getCustomersByShopId(SHOP_ID, { limit: '8', offset: '1', q });
      let actualData = res?.data;
      if (actualData && typeof actualData === 'object' && !Array.isArray(actualData) && 'datas' in actualData) {
        actualData = actualData.datas;
      }
      const data = actualData ? (Array.isArray(actualData) ? actualData : [actualData]) : [];
      return data.map((c: any) => ({
        ...c,
        displayName: String(c.name || c.datas?.name || c.datas?.full_name || c.datas?.customer_name || c.id)
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
      <p className="text-[10px] font-bold text-slate-400  tracking-[0.05em] mb-0.5">{label}</p>
      <p className="text-[13px] font-bold text-slate-700 truncate tracking-tight">{value}</p>
    </div>
  </div>
);

// ── Main page ───────────────────────────────────────────────────────────────
export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData } = useApi();
  const { customer: customerApi } = useBusinessApi();
  const { showToast } = useToast();
  const { setBottomActions } = useHeader();

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);

  // Tab & modal state
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const [viewValue, setViewValue] = useState<{ label: string, value: string } | null>(null);
  const [clearingHistory, setClearingHistory] = useState<any[]>([]);
  const [clearingLoading, setClearingLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Custom Fields state
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomerCustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<CustomerCustomFieldValue[]>([]);
  const [cfLoading, setCfLoading] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [cfSaving, setCfSaving] = useState(false);

  const fetchCustomerDetail = () => {
    if (!id) return;
    getData(`${ENDPOINTS.CUSTOMERS}/by/id/${SHOP_ID}/${id}`).then((res) => {
      if (res) setCustomer(Array.isArray(res.data) ? res.data[0] : res.data);
    });
    setOrdersLoading(true);
    getData(`${ENDPOINTS.ORDERS}/by/customer/${SHOP_ID}/${id}`, undefined, { cacheKey: `customer-orders-${id}-${Date.now()}` }).then((res) => {
      console.log('ORDERS RAW RES:', res);
      if (res && res.data) {
        let actualData = res.data;
        if (typeof actualData === 'object' && !Array.isArray(actualData) && 'datas' in actualData) {
          actualData = actualData.datas;
        }
        const orders = Array.isArray(actualData) ? actualData : [actualData];
        console.log('PARSED ORDERS:', orders.length, 'total_sellprice values:', orders.map((o: any) => o.total_sellprice));
        setCustomerOrders(orders);
        // Compute stats from the fetched orders
        const salesCount = orders.length;
        const salesValue = orders.reduce((sum: number, o: any) => sum + (o.total_sellprice || 0), 0);
        console.log('COMPUTED STATS:', { salesCount, salesValue });
        setStats({ total_sales_count: salesCount, total_sales_value: salesValue });
      }
      setOrdersLoading(false);
    });
    setClearingLoading(true);
    customerApi.getClearingHistoryById(SHOP_ID, id).then((res) => {
      if (res && res.data) {
        let actualData = res.data;
        if (typeof actualData === 'object' && !Array.isArray(actualData) && 'datas' in actualData) {
          actualData = actualData.datas;
        }
        setClearingHistory(Array.isArray(actualData) ? actualData : [actualData]);
      }
      setClearingLoading(false);
    });
  };

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center justify-end w-full animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          type="button"
          onClick={() => navigate("/customers")}
          className="px-6 h-8 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center shadow-sm"
        >
          Clear
        </button>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, navigate]);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    customerApi.getCustomerById(SHOP_ID, id).then((res) => {
      if (res) setCustomer(Array.isArray(res.data) ? res.data[0] : res.data);
      setRecordLoading(false);
    });
    // Also fetch orders to compute stats on initial load
    getData(`${ENDPOINTS.ORDERS}/by/customer/${SHOP_ID}/${id}`, undefined, { cacheKey: `customer-orders-init-${id}-${Date.now()}` }).then((res) => {
      if (res && res.data) {
        let actualData = res.data;
        if (typeof actualData === 'object' && !Array.isArray(actualData) && 'datas' in actualData) {
          actualData = actualData.datas;
        }
        const orders = Array.isArray(actualData) ? actualData : [actualData];
        const salesCount = orders.length;
        const salesValue = orders.reduce((sum: number, o: any) => sum + (o.total_sellprice || 0), 0);
        setStats({ total_sales_count: salesCount, total_sales_value: salesValue });
      }
    });
  }, [id, getData]);

  useEffect(() => {
    if (activeTab === 1 && id) { // Index 1 is Purchases
      setOrdersLoading(true);
      getData(`${ENDPOINTS.ORDERS}/by/customer/${SHOP_ID}/${id}`, undefined, { cacheKey: `customer-orders-${id}-${Date.now()}` }).then((res) => {
        if (res && res.data) {
          let actualData = res.data;
          if (typeof actualData === 'object' && !Array.isArray(actualData) && 'datas' in actualData) {
            actualData = actualData.datas;
          }
          const orders = Array.isArray(actualData) ? actualData : [actualData];
          setCustomerOrders(orders);
          // Compute stats from the fetched orders
          const salesCount = orders.length;
          const salesValue = orders.reduce((sum: number, o: any) => sum + (o.total_sellprice || 0), 0);
          setStats({ total_sales_count: salesCount, total_sales_value: salesValue });
        }
        setOrdersLoading(false);
      });
    }
  }, [activeTab, id, getData]);

  useEffect(() => {
    if (activeTab === 2 && id) { // Index 2 is Clearing History
      setClearingLoading(true);
      customerApi.getClearingHistoryById(SHOP_ID, id).then((res) => {
        if (res && res.data) {
          let actualData = res.data;
          if (typeof actualData === 'object' && !Array.isArray(actualData) && 'datas' in actualData) {
            actualData = actualData.datas;
          }
          setClearingHistory(Array.isArray(actualData) ? actualData : [actualData]);
        }
        setClearingLoading(false);
      });
    }
  }, [activeTab, id, getData]);

  // Load custom field definitions + values when Custom Fields tab is active
  useEffect(() => {
    if (!id || activeTab !== 3) return;
    setCfLoading(true);
    Promise.all([
      customerCustomFieldsApi.getAllFields(SHOP_ID),
      customerCustomFieldsApi.getValuesByCustomer(SHOP_ID, id)
    ]).then(([defs, vals]) => {
      setCustomFieldDefs(defs);
      setCustomFieldValues(vals);
    }).finally(() => setCfLoading(false));
  }, [activeTab, id]);

  const handleSaveCustomField = async (fieldId: string) => {
    if (!id) return;
    setCfSaving(true);
    try {
      await customerCustomFieldsApi.upsertValue({
        shop_id: SHOP_ID,
        customer_id: id,
        value_infos: [{
          field_id: fieldId,
          value: editingValue,
        }],
      });
      setCustomFieldValues((prev) => {
        const existing = prev.findIndex((v) => v.field_id === fieldId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], value: editingValue };
          return updated;
        }
        return [...prev, { shop_id: SHOP_ID, customer_id: id, field_id: fieldId, value: editingValue }];
      });
      showToast('Custom field updated', 'success');
    } catch {
      showToast('Failed to update field', 'error');
    } finally {
      setCfSaving(false);
      setEditingFieldId(null);
    }
  };

  async function handleDelete() {
    const targetId = customer?.id || id;
    if (!targetId) return;

    setDeleting(true);
    try {
      const res = await customerApi.deleteCustomer(SHOP_ID, targetId);
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
  // Support both new nested and legacy flat shapes
  const customerEmail = (customer as any).contact_infos?.email || customer.email || "";
  const customerPhone = (customer as any).contact_infos?.mobile_number || customer.mobile_number || "";
  const customerCreditLimit = (customer as any).credit_infos?.limit ?? customer.credit_limit ?? 0;
  const customerLocationInfos = (customer as any).location_infos || {};
  const customerAddress = customerLocationInfos.full_address || (datas.address as any)?.full_address || "";
  const customerZipcode = customerLocationInfos.zipcode || (datas.address as any)?.zip_code || "";
  const customerCreditNotes = (customer as any).credit_infos?.notes || datas.additional_notes || "";



  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(400px); } to { transform: translateX(0); } }
      `}</style>

      <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans overflow-hidden relative">
        
        {/* Profile Header Card */}
        <div className="flex-none p-1 pb-0">
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
              { icon: Mail, text: customerEmail || "No email" },
              { icon: Phone, text: customerPhone || "No phone" }
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
        </div>

        {/* Tabs Navigation & Quick Stats Grid (pinned) */}
        <div className="flex-none px-1 py-2 space-y-2">
          <div className="flex gap-2 p-1 bg-slate-100/50 w-fit rounded-lg border border-slate-200/50">
            {["Overview", "Sales", "Collection History", "Custom Fields"].map((tab, i) => (
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

          <div className="flex flex-wrap gap-2">
            <StatCard
              icon={DollarSign}
              label="Total Sales"
              value={`${stats?.total_sales_count || 0} (₹${(stats?.total_sales_value || 0).toFixed(2)})`}
              iconBg="bg-blue-50 text-blue-600"
              className="flex-1 min-w-[140px]"
            />
            <StatCard
              icon={CreditCard}
              label="Credit Limit"
              value={`₹${(customerCreditLimit || 0).toFixed(2)}`}
              iconBg="bg-emerald-50 text-emerald-600"
              className="flex-1 min-w-[140px]"
            />
            <StatCard
              icon={AlertCircle}
              label="Outstanding"
              value={`₹${(customer?.outstanding ?? 0).toFixed(2)}`}
              iconBg={(customer?.outstanding ?? 0) > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}
              className="flex-1 min-w-[140px]"
            />
            <StatCard
              icon={Star}
              label="Customer Balance"
              value={`₹${((customerCreditLimit || 0) - (customer?.outstanding ?? 0)).toFixed(2)}`}
              iconBg="bg-amber-50 text-amber-600"
              className="flex-1 min-w-[140px]"
            />
          </div>
        </div>

        {/* Tab Panels (scrollable or flex-locked depending on active tab) */}
        <div className={`flex-1 min-h-0 ${activeTab === 1 || activeTab === 2 ? "flex flex-col overflow-hidden" : "overflow-y-auto custom-scrollbar"} px-1 pb-6`}>
          <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${activeTab === 1 || activeTab === 2 ? "flex flex-col flex-1 min-h-0 h-full" : ""}`}>
            {/* TAB 0 — General Info */}
            {activeTab === 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                {/* Main Content Column */}
                <div className="xl:col-span-3 space-y-4">
                  {/* Primary & Dynamic Fields */}
                  <SectionCard className="rounded-lg border-slate-200 shadow-sm p-4 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl -z-0" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                          <User size={16} />
                        </div>
                        <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">Primary & Dynamic Fields</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-6 gap-x-8">
                        {/* Always show key fields first */}
                        <DetailItem
                          icon={User} label="Full Name" value={name}
                          onClick={() => setViewValue({ label: "Full Name", value: name })}
                        />
                        <DetailItem
                          icon={Mail} label="Email Address" value={customerEmail || "—"}
                          onClick={() => setViewValue({ label: "Email Address", value: customerEmail || "—" })}
                        />
                        <DetailItem
                          icon={Phone} label="Phone Number" value={customerPhone || "—"}
                          onClick={() => setViewValue({ label: "Phone Number", value: customerPhone || "—" })}
                        />
                        <DetailItem
                          icon={CreditCard} label="Credit Limit" value={fmt(customerCreditLimit)}
                          onClick={() => setViewValue({ label: "Credit Limit", value: fmt(customerCreditLimit) })}
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
                  <SectionCard className="rounded-lg border-slate-200 shadow-sm p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-12 -mt-12 blur-2xl -z-0" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                          <MapPin size={16} />
                        </div>
                        <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">Registered Address</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          <p className="text-[10px] font-bold text-slate-400   mb-1.5 text-xs font-semibold">Registered Address</p>
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                            {customerAddress || "No address provided."}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400   mb-1.5 text-xs font-semibold">Zip Code</p>
                            <p className="text-sm font-bold font-mono text-slate-700 tracking-tight bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center h-[46px]">
                              {customerZipcode || "—"}
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
                  <SectionCard className="rounded-lg border-slate-200 shadow-sm p-5 bg-gradient-to-br from-white to-blue-50/30">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <Tag size={16} />
                      </div>
                      <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">Business Identity</h2>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-lg bg-white border border-slate-100 shadow-sm flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400  ">Type</span>
                        <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{String(datas.customer_type || "Normal")}</span>
                      </div>
                    </div>
                  </SectionCard>

                  {/* Notes Card */}
                  <SectionCard className="rounded-lg border-slate-200 shadow-sm p-6 bg-slate-50/50 flex-1">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                        <FileText size={16} />
                      </div>
                      <h2 className="text-[10px] font-black text-slate-800  tracking-[0.15em]">Internal Notes</h2>
                    </div>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-full" />
                      <p className="pl-4 text-[13px] font-medium text-slate-500 leading-relaxed italic break-words">
                        {customerCreditNotes || "No internal notes registered for this customer."}
                      </p>
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* TAB 1 — Sales */}
            {activeTab === 1 && (
              <CustomerPurchasesTable
                rows={customerOrders}
                loading={ordersLoading}
                onNavigateToSale={(orderId) => navigate(`/sales/${orderId}`)}
              />
            )}

            {/* TAB 2 — Collection History */}
            {activeTab === 2 && (
              <div className="flex flex-col flex-1 min-h-0 h-full gap-3">
                {/* Action Row */}
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-black text-slate-500">
                      {clearingHistory.length} Recorded Payments
                    </span>
                  </div>
                  <button 
                    disabled={Number(customer.outstanding ?? datas.outstanding_balance ?? 0) <= 0}
                    onClick={() => {
                      setShowPayment(true);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-md active:scale-95 ${
                      Number(customer.outstanding ?? datas.outstanding_balance ?? 0) > 0
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100"
                        : "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                    }`}
                  >
                    <Banknote size={12} />
                    RECORD PAYMENT
                  </button>
                </div>

                <CustomerCollectionsTable
                  rows={clearingHistory}
                  loading={clearingLoading}
                />
              </div>
            )}

            {/* TAB 3 — Custom Fields */}
            {activeTab === 3 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {cfLoading ? (
                  <div className="py-16 flex justify-center"><Loader /></div>
                ) : customFieldDefs.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-400 mx-auto mb-3">
                      <Layers size={22} />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No custom fields defined for this shop yet.</p>
                    <p className="text-xs text-slate-300 mt-1">Create field definitions from the Settings panel.</p>
                  </div>
                ) : (
                  <SectionCard className="rounded-lg border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Layers size={16} />
                      </div>
                      <h2 className="text-[10px] font-black text-slate-800 tracking-[0.15em]">CUSTOM ATTRIBUTES</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customFieldDefs.map((field) => {
                        const currentVal = customFieldValues.find((v) => v.field_id === field.id);
                        const isEditing = editingFieldId === field.id;
                        return (
                          <div
                            key={field.id}
                            className={`group relative p-4 rounded-xl border transition-all ${
                              isEditing
                                ? 'border-indigo-200 bg-indigo-50/40'
                                : 'border-slate-100 bg-white hover:border-indigo-100 hover:bg-indigo-50/20'
                            }`}
                          >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                              {field.label_name}
                              {field.required && <span className="text-rose-400 ml-0.5">*</span>}
                            </p>

                            {isEditing ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  autoFocus
                                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  className="flex-1 h-8 px-2 text-xs font-semibold bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                />
                                <button
                                  onClick={() => handleSaveCustomField(field.id)}
                                  disabled={cfSaving}
                                  className="w-7 h-7 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-60"
                                >
                                  {cfSaving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={12} />}
                                </button>
                                <button
                                  onClick={() => { setEditingFieldId(null); setEditingValue(''); }}
                                  className="w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all active:scale-90"
                                >
                                  <XIcon size={12} />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="flex items-center justify-between mt-1 cursor-pointer"
                                onClick={() => {
                                  setEditingFieldId(field.id);
                                  setEditingValue(currentVal?.value ?? '');
                                }}
                              >
                                <p className="text-sm font-bold text-slate-700 truncate">
                                  {currentVal?.value || <span className="text-slate-300 font-medium italic">Click to set value</span>}
                                </p>
                                <Pencil size={11} className="text-slate-300 group-hover:text-indigo-400 transition-colors ml-2 shrink-0" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}
              </div>
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
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-sm font-bold text-slate-700 break-words leading-relaxed select-all">
              {viewValue?.value}
            </p>
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-400   text-center">
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

        <RecordPaymentModal
          show={showPayment}
          onClose={() => setShowPayment(false)}
          customer={customer}
          onSuccess={() => {
            setShowPayment(false);
            fetchCustomerDetail();
          }}
        />

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

