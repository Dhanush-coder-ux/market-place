import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mail, Pencil, User, MapPin, Phone, Trash2,
  Store, Database, AlertCircle, Layers, Check, X as XIcon, ArrowUp, ArrowDown, Search
} from "lucide-react";
import {
  SectionCard, DetailItem, InfoRow, Modal,
  ProfileHeaderCard
} from "@/components/common/SuperUI";
import { AntBadge } from "@/components/ui/AntBadge";
import Loader from "@/components/common/Loader";

import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { useHeader } from "@/context/HeaderContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import type { SupplierRecord } from "@/types/api";
import { SearchSelect } from "@/components/inputbuilders/SearchSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SupplierPurchasesTable } from "@/components/common/HistoryTables";
import { supplierCustomFieldsApi } from "@/services/api/supplierCustomFields";
import { supplierApi } from "@/services/api/supplier";
import { purchaseApi } from "@/services/api/purchase";
import { getSupplierOutstanding } from "../type";
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

const TABS = ["General Info", "Purchases", "Payment Ledger"];

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getData, deleteData } = useApi();
  const { showToast } = useToast();
  const { setBottomActions } = useHeader();

  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [analyticsStats, setAnalyticsStats] = useState<any>(null);

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

  // Outstanding update state
  const [showOutstandingModal, setShowOutstandingModal] = useState(false);
  const [outstandingType, setOutstandingType] = useState<'INCREMENT' | 'DECREMENT' | 'DIRECT'>('INCREMENT');
  const [outstandingAmount, setOutstandingAmount] = useState<string>('');
  const [outstandingSaving, setOutstandingSaving] = useState(false);

  // Cleared History state
  const [clearedHistory, setClearedHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState("");

  // Clear Outstanding Purchases state
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPurchases, setClearPurchases] = useState<any[]>([]);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearSearch, setClearSearch] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [clearAmount, setClearAmount] = useState<string>('');
  const [clearSaving, setClearSaving] = useState(false);

  const fetchOutstandingPurchases = useCallback(async () => {
    if (!id) return;
    setClearLoading(true);
    try {
      const res = await purchaseApi.getPurchasesBySupplier(SHOP_ID, id, { outstanding: true });
      let purList = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      if (res?.data?.datas) purList = res.data.datas;
      
      setClearPurchases(purList);
    } catch {
      showToast("Failed to fetch outstanding purchases", "error");
    } finally {
      setClearLoading(false);
    }
  }, [id]);

  const handleClearOutstandingPayment = async () => {
    if (!selectedPurchase || !clearAmount || !id) return;
    setClearSaving(true);
    try {
      const fullRes = await purchaseApi.getPurchaseById(SHOP_ID, selectedPurchase.purchase_id || selectedPurchase.id);
      const pData = fullRes?.data?.datas?.[0] || fullRes?.data || selectedPurchase;
      
      const amountToPay = Number(clearAmount);
      const newPayment = { method: "CASH", amount: amountToPay, date: new Date().toISOString() };
      const updatedPaymentInfos = [...(pData.payment_infos || []), newPayment];

      const updatePayload = {
        id: pData.purchase_id || pData.id,
        shop_id: SHOP_ID,
        payment_infos: updatedPaymentInfos,
        items: (pData.items || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id || item.inventory_id,
          variant_id: item.variant_id || item.variant_infos?.id || undefined,
          batch_infos: item.batch_infos || undefined,
          serialno_numbers: item.serial_numbers || item.serialno_numbers || undefined,
          storage_location_infos: item.storage_location_infos || undefined,
          reorder_point_infos: item.reorder_point_infos || undefined,
          pricing_infos: item.pricing_infos || { 
            buy_price: Number(item.buy_price || 0), 
            sell_price: Number(item.sell_price || 0) 
          },
          gst: item.gst || "0%",
          stock_infos: item.stock_infos || item.stocks_infos || { stocks: 0 }
        }))
      };
      
      await purchaseApi.updatePurchase(updatePayload);
      
      try {
        await supplierApi.updateOutstanding({
          id,
          shop_id: SHOP_ID,
          outstanding_infos: { amount: amountToPay },
          type: 'DECREMENT'
        });
      } catch (e) {
        // fail silently for supplier if purchase update succeeds
      }
      
      showToast("Payment applied successfully", "success");
      setShowClearModal(false);

      refreshSupplierData();

      if (activeTab === 1) {
        getData(`${ENDPOINTS.PURCHASES}/by/supplier/${SHOP_ID}/${id}`).then((r: any) => {
           setPurchases(r?.data ? (Array.isArray(r.data) ? r.data : [r.data]) : []);
        });
      } else if (activeTab === 2) {
        supplierApi.getClearedHistory(SHOP_ID, id).then((res: any) => {
          let historyList = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
          if (res?.data?.datas) historyList = res.data.datas;
          setClearedHistory(historyList);
        });
      }

    } catch {
      showToast("Failed to apply payment", "error");
    } finally {
      setClearSaving(false);
    }
  };

  const handleSaveOutstanding = async () => {
    if (!id || !outstandingAmount) return;
    setOutstandingSaving(true);
    try {
      await supplierApi.updateOutstanding({
        id,
        shop_id: SHOP_ID,
        outstanding_infos: { amount: Number(outstandingAmount) },
        type: outstandingType
      });
      showToast('Outstanding amount updated', 'success');
      setShowOutstandingModal(false);
      refreshSupplierData();
    } catch {
      showToast('Failed to update outstanding amount', 'error');
    } finally {
      setOutstandingSaving(false);
      setOutstandingAmount('');
    }
  };

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center justify-end w-full animate-in fade-in slide-in-from-right-4 duration-300 gap-2">
        <button 
          onClick={() => {
            setShowClearModal(true);
            fetchOutstandingPurchases();
            setSelectedPurchase(null);
            setClearAmount('');
            setClearSearch('');
          }}
          className="px-6 h-8 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors shadow-sm"
        >
          Record payment
        </button>
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
  }, [setBottomActions, navigate, fetchOutstandingPurchases]);

  const refreshSupplierData = useCallback(async () => {
    if (!id) return;
    try {
      const [res, analyticsRes] = await Promise.all([
        getData(`${ENDPOINTS.SUPPLIERS}/by/${SHOP_ID}/${id}`),
        getData(`${ENDPOINTS.ANALYTICS_SUPPLIER}/${id}`, { shop_id: SHOP_ID })
      ]);
      if (res) {
        let suppData = res.data;
        if (suppData?.datas && Array.isArray(suppData.datas)) suppData = suppData.datas[0];
        setSupplier(Array.isArray(suppData) ? suppData[0] : suppData);
      }
      if (analyticsRes) {
        setAnalyticsStats(analyticsRes.data ?? analyticsRes);
      }
    } catch {
    } finally {
      setRecordLoading(false);
    }
  }, [id, getData]);

  useEffect(() => {
    if (!id) return;
    setRecordLoading(true);
    refreshSupplierData();
  }, [id, refreshSupplierData]);

  useEffect(() => {
    if (!id || activeTab !== 1) return;
    setPurLoading(true);
    getData(`${ENDPOINTS.PURCHASES}/by/supplier/${SHOP_ID}/${id}`).then((res: any) => {
      setPurchases(res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : []);
      setPurLoading(false);
    }).catch(() => setPurLoading(false));
  }, [activeTab, id]);

  useEffect(() => {
    if (!id || activeTab !== 2) return;
    setHistoryLoading(true);
    supplierApi.getClearedHistory(SHOP_ID, id)
      .then((res: any) => {
        let historyList = res?.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
        if (res?.data?.datas) historyList = res.data.datas;
        setClearedHistory(historyList);
        setHistoryLoading(false);
      })
      .catch(() => {
        showToast("Failed to fetch cleared history", "error");
        setHistoryLoading(false);
      });
  }, [activeTab, id, showToast]);

  // Load custom field definitions + values when supplier is loaded (embedded in General Info sidebar)
  useEffect(() => {
    if (!id || !supplier) return;
    setCfLoading(true);
    Promise.all([
      supplierCustomFieldsApi.getAllFields(SHOP_ID),
      supplierCustomFieldsApi.getValuesBySupplier(SHOP_ID, id)
    ]).then(([defs, vals]) => {
      setCustomFieldDefs(defs);
      setCustomFieldValues(vals);
    }).finally(() => setCfLoading(false));
  }, [id, supplier]);

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
      setCustomFieldValues((prev: any[]) => {
        const existing = prev.findIndex((v: any) => v.field_id === fieldId);
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

  if (recordLoading) return <SkeletonLoader variant="detail" />;
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
  const currentOutstandingVal = getSupplierOutstanding(supplier, analyticsStats);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans overflow-hidden relative">
      
      {/* Profile Header Card */}
      <div className="flex-none p-1 pb-0 animate-in fade-in duration-500">
        <ProfileHeaderCard
          name={name}
          initials={initials}
          subText={`Supplier ID: ${supplier.ui_id || supplier.id?.slice(0, 8).toUpperCase()}`}
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

      {/* Tabs Navigation (pinned) */}
      <div className="flex-none px-1 py-2">
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
                    <DetailItem
                      icon={AlertCircle} label="Outstanding Balance" value={`₹${currentOutstandingVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      onClick={() => setShowOutstandingModal(true)}
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
                    <InfoRow label="Business Type" value={<AntBadge variant="lb-brand" type="pill">{String(supplierType)}</AntBadge>} />
                    <InfoRow label="GST Number" value={<span className="text-[12px] font-bold text-slate-700 font-mono">{String(supplier.gst_no || "—")}</span>} />
                    <InfoRow
                      label="Outstanding Balance"
                      value={
                        <div className="flex items-center gap-2">
                          <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${currentOutstandingVal > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-600 bg-slate-50'}`}>
                            ₹{currentOutstandingVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowOutstandingModal(true)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      }
                    />
                  </div>
                </SectionCard>

                {/* Custom Fields — separate card below Business Identity */}
                {(cfLoading || customFieldDefs.length > 0) && (
                  <SectionCard className="rounded-lg border-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Layers size={16} />
                      </div>
                      <h2 className="text-[10px] font-black text-slate-800 tracking-[0.15em]">Custom Attributes</h2>
                    </div>
                    {cfLoading ? (
                      <div className="py-4 flex justify-center"><Loader /></div>
                    ) : (
                      <div className="space-y-2">
                        {customFieldDefs.map((field) => {
                          const currentVal = customFieldValues.find((v) => v.field_id === field.id);
                          const isEditing = editingFieldId === field.id;
                          return (
                            <div key={field.id} className={`group relative p-3 rounded-lg border transition-all ${
                              isEditing ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-100 bg-slate-50 hover:border-indigo-100'
                            }`}>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                                {field.label_name}{field.required && <span className="text-rose-400 ml-0.5">*</span>}
                              </p>
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <input
                                    autoFocus
                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="flex-1 h-7 px-2 text-xs font-semibold bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                  />
                                  <button onClick={() => handleSaveCustomField(field.id)} disabled={cfSaving}
                                    className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-60">
                                    {cfSaving ? <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={11} />}
                                  </button>
                                  <button onClick={() => { setEditingFieldId(null); setEditingValue(''); }}
                                    className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all active:scale-90">
                                    <XIcon size={11} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between cursor-pointer"
                                  onClick={() => { setEditingFieldId(field.id); setEditingValue(currentVal?.value ?? ''); }}>
                                  <p className="text-xs font-bold text-slate-700 truncate">
                                    {currentVal?.value || <span className="text-slate-300 font-medium italic">Click to set</span>}
                                  </p>
                                  <Pencil size={10} className="text-slate-300 group-hover:text-indigo-400 transition-colors ml-2 shrink-0" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                )}
              </div>
            </div>
          )}

          {activeTab === 1 && (() => {
            const rows: any[] = [];
            purchases.forEach((p: any) => {
              const d = p.datas ?? {};
              const pd = d.purchaseDetails ?? {};
              const payment = d.payment ?? {};
              const charges = p.additional_charges ?? {};
              
              const productsList: any[] = [];
              (p.items ?? p.products ?? []).forEach((prod: any) => {
                const isNewItemFormat = prod.stocks_infos !== undefined;
                const baseProd = {
                  productName: prod.name || 'Unknown Product',
                  stocksBefore: isNewItemFormat ? (prod.stocks_infos?.stocks_before ?? null) : (prod.stocks_before ?? null),
                  receivedStocks: isNewItemFormat ? (prod.stocks_infos?.stocks ?? 0) : (prod.stocks_added ?? prod.received_stocks ?? prod.stocks ?? 0),
                  buy_price: prod.buy_price,
                  sell_price: prod.sell_price,
                };

                const v = isNewItemFormat ? prod.variant_infos : prod.variant;
                const b = isNewItemFormat ? prod.batch_infos : prod.batch;
                const s_list = isNewItemFormat ? prod.serial_numbers : (prod.serial_info?.serial_numbers || []);

                productsList.push({
                  ...baseProd,
                  variant: v?.variant_name || v?.name || null,
                  batch: b?.batch_name || b?.name || null,
                  serials: s_list || [],
                  variant_details: v || null,
                  batch_details: b || null,
                  serial_info: s_list || null
                });
              });

              if (productsList.length > 0) {
                const firstItem = productsList[0];
                rows.push({
                  purchaseId: p.id || p.purchase_id,
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
                  paymentMethod: p.payment_infos?.[0]?.method ?? ((p.payment_status && p.payment_status.toLowerCase() === "outstanding") ? "Outstanding" : (payment.method || p.payment_status || '—')),
                   amountPaid: p.paid_amount ?? p.payment_infos?.[0]?.amount ?? payment.amountPaid ?? 0,
                  outstandingAmount: p.outstanding_amount ?? 0,
                  totalCost: p.total_cost ?? p.item_infos?.total_pur_cost ?? pd.totalAmount ?? 0,
                  deliveryCharge: p.transport_charge ?? p.charges_infos?.transport_charge ?? charges.delivery_charge ?? 0,
                  otherCharge: p.other_charges ?? p.charges_infos?.other_charge ?? charges.other_charge ?? 0,
                  uiId: p.ui_id || p.purchase_id?.split('-')[0].toUpperCase() || p.id?.slice(-6),
                  storageLocation: d.storage_location || p.storage_location || '—',
                  version: p.version || d?.version || p.datas?.version || "v1",
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

          {activeTab === 2 && (() => {
            const filteredHistory = clearedHistory.filter((h) => {
              if (!ledgerSearch.trim()) return true;
              const q = ledgerSearch.toLowerCase();
              const refOrInvoice = String(h.reference_no || h.invoice_no || h.ref_no || h.entity_id || "").toLowerCase();
              const notes = String(h.notes || "").toLowerCase();
              const method = String(h.payment_method || h.method || "").toLowerCase();
              const amount = String(h.cleared_amount ?? h.amount ?? "").toLowerCase();
              return refOrInvoice.includes(q) || notes.includes(q) || method.includes(q) || amount.includes(q);
            });

            return (
              <div className="space-y-4 animate-in fade-in duration-300 h-full overflow-y-auto">
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      placeholder="Search invoice no., ref no., payment mode..."
                      className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    {ledgerSearch && (
                      <button
                        onClick={() => setLedgerSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <XIcon size={12} />
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
                    {filteredHistory.length} Recorded Payment{filteredHistory.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <SectionCard title="Outstanding Cleared History" className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Date</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Ref / Invoice No</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Cleared Amount</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Invoice Outstanding</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Payment Mode</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyLoading ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-sm font-semibold">Loading history...</td></tr>
                        ) : filteredHistory.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-sm font-semibold">
                            {ledgerSearch ? `No records found matching "${ledgerSearch}".` : "No cleared records found."}
                          </td></tr>
                        ) : (
                          filteredHistory.map((h, i) => {
                          const isRefund = h.type === 'PURCHASE_RETURN' || h.type === 'REFUND' || h.notes?.toLowerCase().includes('refund');
                          return (
                            <tr key={h.id || i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">
                                {h.created_at || h.date ? new Date(h.created_at || h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </td>
                              <td className="px-4 py-3 text-xs font-black text-indigo-600 whitespace-nowrap font-mono">
                                {h.reference_no || h.invoice_no || h.ref_no || h.entity_id || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm font-black whitespace-nowrap">
                                <span className={`flex items-center gap-1 ${isRefund ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isRefund ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                  ₹{Number(h.cleared_amount ?? h.amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700 font-bold whitespace-nowrap">
                                ₹{Number(h.outstanding_amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center w-fit ${isRefund ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                  {h.payment_method || h.method || "CASH"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-medium text-slate-500 max-w-xs truncate" title={h.notes}>
                                {isRefund && !h.notes ? "Supplier refund" : (h.notes || (isRefund ? "Supplier refund" : "—"))}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          );
        })()}

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
          description="Are you sure you want to delete this supplier? This action cannot be undone."
          loading={deleting}
        />

        <Modal show={showOutstandingModal} onClose={() => setShowOutstandingModal(false)} title="Update Outstanding Balance">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Action</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOutstandingType('INCREMENT')}
                  className={`h-9 text-xs font-bold rounded-lg border transition-all ${outstandingType === 'INCREMENT' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setOutstandingType('DECREMENT')}
                  className={`h-9 text-xs font-bold rounded-lg border transition-all ${outstandingType === 'DECREMENT' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Subtract
                </button>
                <button
                  type="button"
                  onClick={() => setOutstandingType('DIRECT')}
                  className={`h-9 text-xs font-bold rounded-lg border transition-all ${outstandingType === 'DIRECT' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Set Direct
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount (₹)</label>
              <input
                type="number"
                value={outstandingAmount}
                onChange={(e) => setOutstandingAmount(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                placeholder="0.00"
              />
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
              <button
                onClick={() => setShowOutstandingModal(false)}
                className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOutstanding}
                disabled={outstandingSaving || !outstandingAmount || isNaN(Number(outstandingAmount))}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
              >
                {outstandingSaving ? "Saving..." : "Save Balance"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Record Payment Specific Purchases Modal */}
        <Modal show={showClearModal} onClose={() => setShowClearModal(false)} title="Record Payment">
          <div className="space-y-4">
            {!selectedPurchase ? (
              <>
                <div>
                  <input
                    type="text"
                    value={clearSearch}
                    onChange={e => setClearSearch(e.target.value)}
                    placeholder="Search invoice or ID..."
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {clearLoading ? (
                    <div className="p-4 text-center text-xs text-slate-500">Loading purchases...</div>
                  ) : clearPurchases.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No outstanding purchases found.</div>
                  ) : (
                    clearPurchases.filter(p => 
                      !clearSearch || 
                      (p.invoice_no && p.invoice_no.toLowerCase().includes(clearSearch.toLowerCase())) || 
                      (p.ui_id && p.ui_id.toLowerCase().includes(clearSearch.toLowerCase()))
                    ).map(p => {
                      const balance = p.outstanding_amount || 0;
                      
                      return (
                        <div 
                          key={p.id} 
                          onClick={() => setSelectedPurchase(p)}
                          className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-lg cursor-pointer transition-all shadow-sm flex justify-between items-center group"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">{p.invoice_no || p.ui_id || "No Invoice"}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{new Date(p.purchase_date || p.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400">Balance</p>
                            <p className="text-sm font-black text-rose-600 group-hover:text-blue-600 transition-colors">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Purchase</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedPurchase.invoice_no || selectedPurchase.ui_id}</p>
                  </div>
                  <button onClick={() => { setSelectedPurchase(null); setClearAmount(''); }} className="text-xs text-blue-600 font-bold hover:underline">Change</button>
                </div>
                
                {(() => {
                   const balance = selectedPurchase.outstanding_amount || 0;
                   return (
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex justify-between items-end">
                         Payment Amount
                         <span className="text-[10px] font-bold text-rose-600">Max: ₹{balance.toLocaleString('en-IN')}</span>
                       </label>
                       <input
                         type="number"
                         value={clearAmount}
                         onChange={(e) => setClearAmount(e.target.value)}
                         max={balance}
                         className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                         placeholder="0.00"
                       />
                     </div>
                   );
                })()}

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                  <button
                    onClick={() => { setSelectedPurchase(null); setClearAmount(''); }}
                    className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleClearOutstandingPayment}
                    disabled={clearSaving || !clearAmount || isNaN(Number(clearAmount)) || Number(clearAmount) <= 0}
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                  >
                    {clearSaving ? "Processing..." : "Submit Payment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}


