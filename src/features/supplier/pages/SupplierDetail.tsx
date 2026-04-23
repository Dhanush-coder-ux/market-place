import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DollarSign, AlertCircle, Package, Star,
  Mail, Pencil, User, Tag, MapPin, Phone, Trash2,
  Store, FileText, Database, ShoppingBag, History, CreditCard, Banknote
} from "lucide-react";
import {
  fmt, StatusBadge, SectionCard, DetailItem, InfoRow, Modal,
  ProfileHeaderCard
} from "@/components/common/SuperUI";
import { StatCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { SupplierRecord } from "@/types/api";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useHeader } from "@/context/HeaderContext";

const SupplierSearch = () => {
  const navigate = useNavigate();
  const { getData } = useApi();

  const fetchSuppliers = async (q: string) => {
    if (!q) return [];
    try {
      const res = await getData(ENDPOINTS.SUPPLIERS, { limit: "8", offset: "1", q });
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      return data.map((s: any) => ({
        ...s,
        displayName: String(s.datas?.supplier_name || s.supplier_name || s.id)
      }));
    } catch { return []; }
  };

  return (
    <div className="w-full relative z-50">
      <SearchSelect
        labelKey="displayName"
        valueKey="id"
        fetchOptions={fetchSuppliers}
        placeholder="Search supplier by name / ID…"
        className="w-full"
        onChange={(val) => val && navigate(`/supplier/${val}`)}
      />
    </div>
  );
};

const TABS = ["General Info", "Financials", "Purchase Orders", "Timeline"];

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData, deleteData } = useApi();
  const { showToast } = useToast();
  const { setActions } = useHeader();

  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewValue, setViewValue] = useState<{ label: string, value: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.SUPPLIERS}/by/${id}`).then((res) => {
      if (res) setSupplier(Array.isArray(res.data) ? res.data[0] : res.data);
      setRecordLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await deleteData(`${ENDPOINTS.SUPPLIERS}/${id}`);
      if (res) {
        showToast("Supplier deleted successfully", "success");
        navigate("/supplier");
      }
    } catch {
      showToast("Failed to delete supplier", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (recordLoading) return <div className="p-12 flex justify-center"><Loader /></div>;
  if (!supplier) return (
    <div className="text-center py-20 space-y-4">
      <p className="text-slate-500">Supplier not found.</p>
      <div className="flex justify-center max-w-sm mx-auto"><SupplierSearch /></div>
    </div>
  );

  const datas = supplier.datas ?? {};
  const name = String(datas.supplier_name || (supplier as any).supplier_name || "Unknown Supplier");
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50/50 font-[Inter,sans-serif] animate-in fade-in duration-500">
      <div className="mx-auto py-3 space-y-4">

        {/* Profile Header Card */}
        <ProfileHeaderCard
          name={name}
          initials={initials}
          subText={`ID: ${supplier.id}`}
          badges={[
            { text: String(datas.type || "Vendor"), variant: "primary" },
            {
              text: datas.is_active !== false ? "Active" : "Inactive",
              variant: datas.is_active !== false ? "success" : "danger",
              showPulse: true
            }
          ]}
          infoItems={[
            { icon: Mail, text: String(datas.email || "No email") },
            { icon: Phone, text: String(datas.phone || "No phone") }
          ]}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/supplier/${id}/edit`)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm active:scale-95"
                title="Edit Supplier"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-300 rounded-xl hover:text-rose-600 transition-all shadow-sm active:scale-95"
                title="Delete Supplier"
              >
                <Trash2 size={18} />
              </button>
            </div>
          }
        />

        {/* Tabs Navigation */}
        <div className="flex gap-0.5 bg-white p-1 rounded-xl border border-slate-200 w-fit">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeTab === i ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Quick Stats Grid */}
        <div className="flex flex-wrap gap-2">
          <StatCard icon={ShoppingBag} label="Total Purchases" value={datas.total_purchases ? `₹${datas.total_purchases}` : "₹0"} iconBg="bg-blue-50 text-blue-600" className="flex-1 min-w-[140px]" />
          <StatCard icon={AlertCircle} label="Outstanding" value={fmt(Number(datas.pending_amount) || 0)} iconBg="bg-rose-50 text-rose-600" className="flex-1 min-w-[140px]" />
          <StatCard icon={Package} label="Total Items" value={String(datas.total_items_bought || "0")} iconBg="bg-blue-50 text-blue-600" className="flex-1 min-w-[140px]" />
          <StatCard icon={History} label="Last Order" value={String(datas.last_order_date || "N/A")} iconBg="bg-amber-50 text-amber-600" className="flex-1 min-w-[140px]" />
        </div>

        {/* Tab Panels */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              <div className="xl:col-span-3 space-y-4">
                <SectionCard title="Supplier Profile Information" className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-6 gap-x-8">
                    <DetailItem
                      icon={Store} label="Business Name" value={name}
                      onClick={() => setViewValue({ label: "Business Name", value: name })}
                    />
                    <DetailItem
                      icon={User} label="Contact Person" value={String(datas.contact_person || "—")}
                      onClick={() => setViewValue({ label: "Contact Person", value: String(datas.contact_person || "—") })}
                    />
                    <DetailItem
                      icon={Mail} label="Email" value={String(datas.email || "—")}
                      onClick={() => setViewValue({ label: "Email", value: String(datas.email || "—") })}
                    />
                    <DetailItem
                      icon={Phone} label="Phone" value={String(datas.phone || "—")}
                      onClick={() => setViewValue({ label: "Phone", value: String(datas.phone || "—") })}
                    />
                    <DetailItem
                      icon={MapPin} label="City" value={String(datas.city || "—")}
                      onClick={() => setViewValue({ label: "City", value: String(datas.city || "—") })}
                    />

                    {/* Dynamically render all other fields from datas */}
                    {Object.entries(datas).map(([key, val]) => {
                      if (["supplier_name", "contact_person", "email", "phone", "city", "address", "shop_id", "type", "id", "pending_amount", "total_purchases", "total_items_bought", "last_order_date"].includes(key)) return null;
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <DetailItem
                          key={key} icon={Database} label={label} value={String(val ?? "—")}
                          onClick={() => setViewValue({ label, value: String(val ?? "—") })}
                        />
                      );
                    })}
                  </div>
                </SectionCard>

                <SectionCard title="Business Address">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-xs font-semibold">Street Address</p>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {String(datas.address || "No specific address provided.")}
                    </p>
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-5">
                <SectionCard title="Business Identity">
                  <div className="space-y-3">
                    <InfoRow label="Business Type" value={<span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{String(datas.type || "Vendor")}</span>} />
                    <InfoRow label="GST Number" value={<span className="text-[12px] font-bold text-slate-700 font-mono">{String(datas.gst_number || datas.gstin || "—")}</span>} />
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="Payment Status">
                <div className="flex flex-col items-center py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                    <CreditCard size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">Financial records module loading...</p>
                </div>
              </SectionCard>
              <SectionCard className="bg-slate-900 text-white border-0 shadow-2xl shadow-blue-200">
                <h2 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-6">Current Payable</h2>
                <div className="space-y-1 mb-8">
                  <div className="text-4xl font-black">{fmt(Number(datas.pending_amount) || 0)}</div>
                  <div className="text-xs text-slate-400 font-medium">Net amount payable to this vendor</div>
                </div>
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-900/20">
                  Record Payment
                </button>
              </SectionCard>
            </div>
          )}
        </div>

        {/* Modal: View Full Value */}
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

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Supplier"
          description={`This action cannot be undone. This will permanently delete ${name} and all associated data.`}
          confirmText="Delete Partner"
          loading={deleting}
          type="danger"
        />
      </div>
    </div>
  );
}

