import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle, Package, Mail, Pencil, User, MapPin, Phone, Trash2,
  Store, Database, ShoppingBag, History,
} from "lucide-react";
import {
  fmt, SectionCard, DetailItem, InfoRow, Modal,
  ProfileHeaderCard
} from "@/components/common/SuperUI";
import { StatCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { SupplierRecord } from "@/types/api";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SupplierPurchasesTable } from "@/components/common/HistoryTables";


const SupplierSearch = () => {
  const navigate = useNavigate();
  const { getData } = useApi();

  const fetchSuppliers = async (q: string) => {

    try {
      const res = await getData(`${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}`, { limit: "8", offset: "1", q });
      const data = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      return data.map((s: any) => ({
        ...s,
        displayName: String(s.name || s.datas?.supplier_name || s.datas?.name || s.supplier_name || s.id)
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

const TABS = ["General Info", "Purchase Orders"];

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData, deleteData } = useApi();
  const { showToast } = useToast();


  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewValue, setViewValue] = useState<{ label: string, value: string } | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purLoading, setPurLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    getData(`${ENDPOINTS.SUPPLIERS}/by/${SHOP_ID}/${id}`).then((res) => {
      if (res) setSupplier(Array.isArray(res.data) ? res.data[0] : res.data);
      setRecordLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id || activeTab !== 1) return;
    setPurLoading(true);
    getData(`${ENDPOINTS.PURCHASES}/by/supplier/${SHOP_ID}/${id}`).then((res: any) => {
      setPurchases(res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : []);
      setPurLoading(false);
    }).catch(() => setPurLoading(false));
  }, [activeTab, id]);

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await deleteData(`${ENDPOINTS.SUPPLIERS}/${SHOP_ID}/${id}`);
      if (res) {
        showToast("Supplier deleted successfully", "success");
        navigate("/supplier/all");
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
  const contact = supplier.contact_info ?? {};
  const name = String(supplier.name || datas.supplier_name || "Unknown Supplier");
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans overflow-hidden relative">
      
      {/* Profile Header Card */}
      <div className="flex-none p-1 pb-0 animate-in fade-in duration-500">
        <ProfileHeaderCard
          name={name}
          initials={initials}
          subText={`ID: ${supplier.id}`}
          badges={[
            { text: String(contact.type || "Vendor"), variant: "primary" },
            {
              text: "Active",
              variant: "success",
              showPulse: true
            }
          ]}
          infoItems={[
            { icon: Mail, text: String(supplier.email || "No email") },
            { icon: Phone, text: String(supplier.mobile_number || "No phone") }
          ]}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/supplier/${id}/edit`)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-lg transition-all shadow-sm active:scale-95"
                title="Edit Supplier"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-300 rounded-lg hover:text-rose-600 transition-all shadow-sm active:scale-95"
                title="Delete Supplier"
              >
                <Trash2 size={18} />
              </button>
            </div>
          }
        />
      </div>

      {/* Tabs Navigation & Quick Stats Grid (pinned) */}
      <div className="flex-none px-1 py-2 space-y-2">
        <div className="flex gap-0.5 bg-white p-1 rounded-lg border border-slate-200 w-fit">
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

        <div className="flex flex-wrap gap-2">
          <StatCard icon={ShoppingBag} label="Total Purchases" value={datas.total_purchases ? `₹${datas.total_purchases}` : "₹0"} iconBg="bg-blue-50 text-blue-600" className="flex-1 min-w-[140px]" />
          <StatCard icon={AlertCircle} label="Outstanding" value={fmt(Number(datas.pending_amount) || 0)} iconBg="bg-rose-50 text-rose-600" className="flex-1 min-w-[140px]" />
          <StatCard icon={Package} label="Total Items" value={String(datas.total_items_bought || "0")} iconBg="bg-blue-50 text-blue-600" className="flex-1 min-w-[140px]" />
          <StatCard icon={History} label="Last Order" value={String(datas.last_order_date || "N/A")} iconBg="bg-amber-50 text-amber-600" className="flex-1 min-w-[140px]" />
        </div>
      </div>

      {/* Tab Panels (scrollable or flex-locked depending on active tab) */}
      <div className={`flex-1 min-h-0 ${activeTab === 1 ? "flex flex-col overflow-hidden" : "overflow-y-auto custom-scrollbar"} px-1 pb-6`}>
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${activeTab === 1 ? "flex flex-col flex-1 min-h-0 h-full" : ""}`}>
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
                      icon={User} label="Contact Person" value={String(contact.name || "—")}
                      onClick={() => setViewValue({ label: "Contact Person", value: String(contact.name || "—") })}
                    />
                    <DetailItem
                      icon={Mail} label="Contact Email" value={String(contact.email || "—")}
                      onClick={() => setViewValue({ label: "Contact Email", value: String(contact.email || "—") })}
                    />
                    <DetailItem
                      icon={Phone} label="Contact Mobile" value={String(contact.mobile_number || "—")}
                      onClick={() => setViewValue({ label: "Contact Mobile", value: String(contact.mobile_number || "—") })}
                    />
                    <DetailItem
                      icon={Mail} label="Email" value={String(supplier.email || "—")}
                      onClick={() => setViewValue({ label: "Email", value: String(supplier.email || "—") })}
                    />
                    <DetailItem
                      icon={Phone} label="Phone" value={String(supplier.mobile_number || "—")}
                      onClick={() => setViewValue({ label: "Phone", value: String(supplier.mobile_number || "—") })}
                    />
                    <DetailItem
                      icon={MapPin} label="City" value={String(datas.address?.city || "—")}
                      onClick={() => setViewValue({ label: "City", value: String(datas.address?.city || "—") })}
                    />
                    <DetailItem
                      icon={MapPin} label="Zip Code" value={String(datas.address?.zipcode || "—")}
                      onClick={() => setViewValue({ label: "Zip Code", value: String(datas.address?.zipcode || "—") })}
                    />

                    {/* Dynamically render all other fields from datas */}
                    {Object.entries(datas).map(([key, val]) => {
                      if (["internal_notes", "supplier_name", "address"].includes(key)) return null;
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
                    <p className="text-[10px] font-bold text-slate-400   text-xs font-semibold">Street Address</p>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                      {String(datas.address?.full_address || "No specific address provided.")}
                    </p>
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-5">
                <SectionCard title="Business Identity">
                  <div className="space-y-3">
                    <InfoRow label="Business Type" value={<span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{String(contact.type || "Vendor")}</span>} />
                    <InfoRow label="GST Number" value={<span className="text-[12px] font-bold text-slate-700 font-mono">{String(supplier.gst_no || "—")}</span>} />
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 1 && (() => {
            // Flatten: purchase → products rows, with purchase-level metadata attached
            const rows: any[] = [];
            purchases.forEach((p: any) => {
              const d = p.datas ?? {};
              const pd = d.purchaseDetails ?? {};
              const payment = d.payment ?? {};
              const charges = p.additional_charges ?? {};
              const purchaseMeta = {
                purchaseId: p.id,
                type: p.type,
                productName: '—', // We'll fill this from products
                invoiceNo: pd.invoiceNo || '—',
                referenceNo: pd.referenceNo || '—',
                purchaseDate: pd.date || p.created_at,
                paymentMethod: payment.method || '—',
                amountPaid: payment.amountPaid ?? 0,
                deliveryCharge: charges.delivery_charge ?? 0,
                otherCharge: charges.other_charge ?? 0,
                uiId: p.ui_id,
              };
              (p.products ?? []).forEach((prod: any) => {
                rows.push({
                  ...purchaseMeta,
                  productName: prod.name || 'Unknown Product',
                  stocks: prod.stocks,
                  receivedStocks: prod.received_stocks ?? prod.stocks ?? 0,
                  buy_price: prod.buy_price,
                  sell_price: prod.sell_price
                });
              });
            });

            return (
              <SupplierPurchasesTable
                rows={rows}
                loading={purLoading}
              />
            );
          })()}
        </div>

        {/* Modal: View Full Value */}
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


