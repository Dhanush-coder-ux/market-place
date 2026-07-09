import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle, Package, Mail, Pencil, User, MapPin, Phone, Trash2,
  Store, Database, ShoppingBag, History, Layers, Check, X as XIcon
} from "lucide-react";
import {
  SectionCard, DetailItem, InfoRow, Modal,
  ProfileHeaderCard
} from "@/components/common/SuperUI";
import { StatCard } from "@/components/common/StatsCard";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { useHeader } from "@/context/HeaderContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import Loader from "@/components/common/Loader";
import type { SupplierRecord } from "@/types/api";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SupplierPurchasesTable } from "@/components/common/HistoryTables";
import { supplierCustomFieldsApi } from "@/services/api/supplierCustomFields";
import type { SupplierCustomFieldDefinition, SupplierCustomFieldValue } from "../type";


const SupplierSearch = () => {
  const navigate = useNavigate();
  const { getData } = useApi();

  const fetchSuppliers = async (q: string) => {

    try {
      const res = await getData(`${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}`, { limit: "8", q });
      const rawData = res?.data || [];
      const data = Array.isArray(rawData) ? rawData : (rawData?.datas ?? []);
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

const TABS = ["General Info", "Custom Fields", "Purchases"];

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData, deleteData } = useApi();
  const { showToast } = useToast();
  const { setBottomActions } = useHeader();

  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewValue, setViewValue] = useState<{ label: string, value: string } | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purLoading, setPurLoading] = useState(false);

  // Custom Fields state
  const [customFieldDefs, setCustomFieldDefs] = useState<SupplierCustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<SupplierCustomFieldValue[]>([]);
  const [cfLoading, setCfLoading] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [cfSaving, setCfSaving] = useState(false);

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center justify-end w-full animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          type="button"
          onClick={() => navigate("/supplier")}
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
    
    import("@/services/api/supplier").then(({ supplierApi }) => {
      Promise.all([
        getData(`${ENDPOINTS.SUPPLIERS}/by/${SHOP_ID}/${id}`),
        supplierApi.getSupplierPurchaseStats(id)
      ]).then(([res, statsRes]) => {
        if (res) {
          let suppData = res.data;
          if (suppData?.datas && Array.isArray(suppData.datas)) suppData = suppData.datas[0];
          setSupplier(Array.isArray(suppData) ? suppData[0] : suppData);
        }
        if (statsRes) {
          setStats(statsRes);
        }
        setRecordLoading(false);
      }).catch(() => setRecordLoading(false));
    });
  }, [id]);

  useEffect(() => {
    if (!id || activeTab !== 2) return;
    setPurLoading(true);
    getData(`${ENDPOINTS.PURCHASES}/by/supplier/${SHOP_ID}/${id}`).then((res: any) => {
      setPurchases(res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : []);
      setPurLoading(false);
    }).catch(() => setPurLoading(false));
  }, [activeTab, id]);

  // Load custom field definitions + values when tab becomes active
  useEffect(() => {
    if (!id || activeTab !== 1) return;
    setCfLoading(true);
    Promise.all([
      supplierCustomFieldsApi.getAllFields(SHOP_ID),
      supplierCustomFieldsApi.getValuesBySupplier(SHOP_ID, id)
    ]).then(([defs, vals]) => {
      setCustomFieldDefs(defs);
      setCustomFieldValues(vals);
    }).finally(() => setCfLoading(false));
  }, [activeTab, id]);

  const handleSaveCustomField = async (fieldId: string) => {
    if (!id) return;
    setCfSaving(true);
    try {
      await supplierCustomFieldsApi.upsertValue({
        shop_id: SHOP_ID,
        supplier_id: id,
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
        return [...prev, { shop_id: SHOP_ID, supplier_id: id, field_id: fieldId, value: editingValue }];
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
  const additionalInfos = (supplier as any).additional_infos ?? datas;
  const contact = supplier.contact_info ?? {};
  const bizContact = (supplier as any).contact_infos ?? supplier;
  const personContact = (supplier as any).contact_person_infos ?? contact;
  const loc = (supplier as any).location_infos ?? datas.address ?? {};
  
  const name = String(supplier.name || additionalInfos.supplier_name || "Unknown Supplier");
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const supplierEmail = bizContact.email || supplier.email || "No email";
  const supplierPhone = bizContact.mobile_number || supplier.mobile_number || "No phone";
  const supplierType = additionalInfos.type || contact.type || "Vendor";

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans overflow-hidden relative">
      
      {/* Profile Header Card */}
      <div className="flex-none p-1 pb-0 animate-in fade-in duration-500">
        <ProfileHeaderCard
          name={name}
          initials={initials}
          subText={`ID: ${supplier.id}`}
          badges={[
            { text: String(supplierType), variant: "primary" },
            {
              text: "Active",
              variant: "success",
              showPulse: true
            }
          ]}
          infoItems={[
            { icon: Mail, text: String(supplierEmail) },
            { icon: Phone, text: String(supplierPhone) }
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

        <div className="flex flex-wrap gap-2">
          <StatCard icon={ShoppingBag} label="Total Purchases" value={`${stats?.purchase_count || 0} (₹${(stats?.total_purchase_value || 0).toFixed(2)})`} iconBg="bg-blue-50 text-blue-600" className="flex-1 min-w-[140px]" />
          <StatCard icon={AlertCircle} label="Outstanding" value={`${stats?.outstanding_count || 0} (₹${(stats?.outstanding_value || 0).toFixed(2)})`} iconBg={stats?.outstanding_value > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"} className="flex-1 min-w-[140px]" />
          <StatCard icon={Package} label="Total Stocks" value={String(stats?.total_items_bought || "0")} iconBg="bg-indigo-50 text-indigo-600" className="flex-1 min-w-[140px]" />
          <StatCard icon={History} label="Last Order" value={stats?.last_order_date ? new Date(stats.last_order_date).toLocaleDateString() : "N/A"} iconBg="bg-amber-50 text-amber-600" className="flex-1 min-w-[140px]" />
        </div>
      </div>

      {/* Tab Panels */}
      <div className={`flex-1 min-h-0 ${activeTab === 2 ? "flex flex-col overflow-hidden" : "overflow-y-auto custom-scrollbar"} px-1 pb-6`}>
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${activeTab === 2 ? "flex flex-col flex-1 min-h-0 h-full" : ""}`}>
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
                      icon={User} label="Contact Person Name" value={String(personContact.name || "—")}
                      onClick={() => setViewValue({ label: "Contact Person Name", value: String(personContact.name || "—") })}
                    />
                    <DetailItem
                      icon={Mail} label="Contact Person Email" value={String(personContact.email || "—")}
                      onClick={() => setViewValue({ label: "Contact Person Email", value: String(personContact.email || "—") })}
                    />
                    <DetailItem
                      icon={Phone} label="Contact Person Mobile No." value={String(personContact.mobile_number || "—")}
                      onClick={() => setViewValue({ label: "Contact Person Mobile No.", value: String(personContact.mobile_number || "—") })}
                    />
                    <DetailItem
                      icon={Mail} label="Supplier Email" value={String(supplierEmail === "No email" ? "—" : supplierEmail)}
                      onClick={() => setViewValue({ label: "Supplier Email", value: String(supplierEmail) })}
                    />
                    <DetailItem
                      icon={Phone} label="Supplier Mobile No." value={String(supplierPhone === "No phone" ? "—" : supplierPhone)}
                      onClick={() => setViewValue({ label: "Supplier Mobile No.", value: String(supplierPhone) })}
                    />
                    <DetailItem
                      icon={MapPin} label="City" value={String(loc.city || additionalInfos.city || "—")}
                      onClick={() => setViewValue({ label: "City", value: String(loc.city || additionalInfos.city || "—") })}
                    />
                    <DetailItem
                      icon={MapPin} label="State" value={String(loc.state || "—")}
                      onClick={() => setViewValue({ label: "State", value: String(loc.state || "—") })}
                    />
                    <DetailItem
                      icon={MapPin} label="Country" value={String(loc.country || "—")}
                      onClick={() => setViewValue({ label: "Country", value: String(loc.country || "—") })}
                    />
                    <DetailItem
                      icon={MapPin} label="Zip Code" value={String(loc.zipcode || "—")}
                      onClick={() => setViewValue({ label: "Zip Code", value: String(loc.zipcode || "—") })}
                    />

                    {/* Dynamically render all other fields from additionalInfos */}
                    {Object.entries(additionalInfos).map(([key, val]) => {
                      if (["internal_notes", "supplier_name", "address", "city", "type"].includes(key)) return null;
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
                      {String(loc.full_address || "No specific address provided.")}
                    </p>
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-5">
                <SectionCard title="Business Identity">
                  <div className="space-y-3">
                    <InfoRow label="Business Type" value={<span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{String(supplierType)}</span>} />
                    <InfoRow label="GST Number" value={<span className="text-[12px] font-bold text-slate-700 font-mono">{String(supplier.gst_no || "—")}</span>} />
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 1 && (
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
                <SectionCard title="Custom Attributes" className="p-5">
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
                                className="w-7 h-7 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                              >
                                {cfSaving ? '…' : <Check size={13} />}
                              </button>
                              <button
                                onClick={() => setEditingFieldId(null)}
                                className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-rose-500 hover:border-rose-200 transition-colors shrink-0"
                              >
                                <XIcon size={13} />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => {
                                setEditingFieldId(field.id);
                                setEditingValue(currentVal?.value || '');
                              }}
                            >
                              <p className="text-sm font-semibold text-slate-700 truncate">
                                {currentVal?.value
                                  ? (field.type === 'boolean'
                                      ? (currentVal.value === 'true' ? '✓ Yes' : '✗ No')
                                      : currentVal.value)
                                  : <span className="text-slate-300 italic">—</span>}
                              </p>
                              <Pencil size={11} className="shrink-0 text-slate-300 group-hover:text-indigo-400 transition-colors ml-2" />
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

          {activeTab === 2 && (() => {
            const rows: any[] = [];
            purchases.forEach((p: any) => {
              const d = p.datas ?? {};
              const pd = d.purchaseDetails ?? {};
              const payment = d.payment ?? {};
              const charges = p.additional_charges ?? {};
              
              const productsList: any[] = [];
              (p.products ?? []).forEach((prod: any) => {
                const baseProd = {
                  productName: prod.name || 'Unknown Product',
                  stocksBefore: prod.stocks_before ?? null,
                  receivedStocks: prod.stocks_added ?? prod.received_stocks ?? prod.stocks ?? 0,
                  buy_price: prod.buy_price,
                  sell_price: prod.sell_price,
                };

                // PurchaseReadModel provides variant, batch, and serial_info directly on the product
                const v = prod.variant;
                const b = prod.batch;
                const s = prod.serial_info;
                
                productsList.push({
                  ...baseProd,
                  variant: v?.variant_name || null,
                  batch: b?.batch_name || null,
                  serials: s?.serial_numbers || [],
                  variant_details: v || null,
                  batch_details: b || null,
                  serial_info: s || null
                });
              });

              if (productsList.length > 0) {
                const firstItem = productsList[0];
                rows.push({
                  purchaseId: p.id,
                  type: p.type,
                  productName: firstItem.productName,
                  stocksBefore: firstItem.stocksBefore,
                  receivedStocks: firstItem.receivedStocks,
                  buy_price: firstItem.buy_price,
                  sell_price: firstItem.sell_price,
                  variant: firstItem.variant,
                  batch: firstItem.batch,
                  serials: firstItem.serials,
                  variant_details: firstItem.variant_details,
                  batch_details: firstItem.batch_details,
                  serial_info: firstItem.serial_info,
                  invoiceNo: p.invoice_no || pd.invoiceNo || '—',
                  referenceNo: pd.referenceNo || '—',
                  purchaseDate: p.purchase_date || pd.date || p.created_at,
                  paymentMethod: (p.payment_status && p.payment_status.toLowerCase() === "outstanding") ? "Outstanding" : (payment.method || p.payment_status || '—'),
                  amountPaid: p.paid_amount ?? payment.amountPaid ?? 0,
                  totalCost: p.total_cost ?? pd.totalAmount ?? 0,
                  deliveryCharge: p.transport_charge ?? charges.delivery_charge ?? 0,
                  otherCharge: p.other_charges ?? charges.other_charge ?? 0,
                  uiId: p.ui_id || p.purchase_id?.slice(-6),
                  storageLocation: d.storage_location || p.storage_location || '—',
                  productsList: productsList
                });
              }
            });

            return (
              <SupplierPurchasesTable
                rows={rows}
                loading={purLoading}
                onNavigateToPurchase={(purchaseId) => navigate(`/purchase/detail/${purchaseId}`)}
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


