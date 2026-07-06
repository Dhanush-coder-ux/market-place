import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Save, 
  Bookmark, 
  FileText,
  User,
  Globe,
  Tag,
  Layers
} from "lucide-react";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import Loader from "@/components/common/Loader";
import { supplierCustomFieldsApi } from "@/services/api/supplierCustomFields";
import type { SupplierCustomFieldDefinition } from "../type";

export interface SupplierData {
  supplier_name: string;
  contact_name: string; 
  contact_email: string;
  contact_mobile: string;
  email: string;          
  phone: string;
  address: string;        
  city: string;
  state: string;
  country: string;
  zipcode: string;
  type: string;
  gst_number: string;
  notes: string;
}

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, putData, getData, loading } = useApi();
  const { setBottomActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const initialFormData: SupplierData = {
    supplier_name: "",
    contact_name: "",
    contact_email: "",
    contact_mobile: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    zipcode: "",
    type: "Vendor",
    gst_number: "",
    notes: ""
  };

  const [formData, setFormData] = useState<SupplierData>(initialFormData);

  // ── Custom Fields State ────────────────────────────────────────────────────
  const [customFieldDefs, setCustomFieldDefs] = useState<SupplierCustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Load custom field definitions for this shop
  useEffect(() => {
    supplierCustomFieldsApi.getAllFields(SHOP_ID).then((fields) => {
      setCustomFieldDefs(fields);
    });
  }, []);

  // Header Actions
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 md:animate-in md:fade-in md:slide-in-from-right-4 md:duration-300">
        {!id && (
          <button 
            type="button"
            onClick={handleSaveDraft}
            className="px-4 h-8 rounded-lg border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 md:hover:bg-blue-100 md:transition-all flex items-center gap-2 whitespace-nowrap overflow-hidden"
          >
            <Bookmark size={14} className="shrink-0" />
            <span className="truncate">Save Draft</span>
          </button>
        )}
        <GradientButton 
          icon={<Save size={16} />} 
          onClick={handleSubmit} 
          disabled={submitting}
          className="rounded-lg shadow-md text-xs px-8 h-8 flex items-center"
        >
          {submitting ? "..." : (id ? "Save Changes" : "Register Supplier")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, formData, submitting, id, navigate]);

  // Load Data/Draft
  useEffect(() => {
    if (id) {
      getData(`${ENDPOINTS.SUPPLIERS}/by/${SHOP_ID}/${id}`).then((res) => {
        if (res && res.data) {
          const sup = Array.isArray(res.data) ? res.data[0] : res.data;
          const d = sup.datas || {};
          const contact = sup.contact_info || {};
          const additional = sup.additional_infos || d || {};
          const loc = sup.location_infos || d.address || {};
          const bizContact = sup.contact_infos || sup || {};
          const personContact = sup.contact_person_infos || contact || {};

          setFormData({
            supplier_name: sup.name || d.supplier_name || "",
            contact_name: personContact.name || contact.contact_person || "",
            contact_email: personContact.email || contact.email || "",
            contact_mobile: personContact.mobile_number || contact.mobile_number || "",
            email: bizContact.email || "",
            phone: bizContact.mobile_number || sup.mobile_number || "",
            address: loc.full_address || loc.address || "",
            city: loc.city || additional.city || "",
            state: loc.state || "",
            country: loc.country || "India",
            zipcode: loc.zipcode || "",
            type: additional.type || contact.type || "Vendor",
            gst_number: sup.gst_no || "",
            notes: additional.internal_notes || d.internal_notes || ""
          });
        }
      });
    } else {
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("supplier_drafts") || "[]");
        const draft = drafts.find((d: any) => d.id === draftId);
        if (draft) {
          setFormData(draft.data);
          if (draft.customFieldValues) setCustomFieldValues(draft.customFieldValues);
        }
      }
    }
  }, [id, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("supplier_drafts") || "[]");
    const draftId = searchParams.get("draftId") || crypto.randomUUID();
    
    const newDraft = {
      id: draftId,
      timestamp: new Date().toISOString(),
      displayName: formData.supplier_name || "New Supplier",
      data: formData,
      customFieldValues
    };

    const existingIndex = drafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) drafts[existingIndex] = newDraft;
    else drafts.unshift(newDraft);

    localStorage.setItem("supplier_drafts", JSON.stringify(drafts));
    showToast("Progress saved to drafts", "success");
    if (!searchParams.get("draftId")) navigate(`/supplier/add?draftId=${draftId}`, { replace: true });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.supplier_name) return showToast("Supplier name is required", "error");
    if (!formData.phone) return showToast("Phone number is required", "error");
    if (!formData.gst_number) return showToast("GSTIN / Tax ID is required", "error");

    setSubmitting(true);
    const payload: any = {
      shop_id: SHOP_ID,
      name: formData.supplier_name,
      gst_no: formData.gst_number,
      contact_infos: {
        email: formData.email || undefined,
        mobile_number: formData.phone || undefined,
      },
      location_infos: {
        zipcode: formData.zipcode,
        country: formData.country || "India",
        state: formData.state || "",
        full_address: formData.address,
      },
      ...(formData.contact_name.trim() && {
        contact_person_infos: {
          name: formData.contact_name,
          email: formData.contact_email || undefined,
          mobile_number: formData.contact_mobile || undefined,
        }
      }),
      additional_infos: {
        internal_notes: formData.notes,
        type: formData.type,
        city: formData.city,
      }
    };

    if (id) {
      payload.id = id;
    }

    try {
      const res = id 
        ? await putData(`${ENDPOINTS.SUPPLIERS}`, payload)
        : await postData(ENDPOINTS.SUPPLIERS, payload);

      if (res) {
        // Bulk upsert custom field values if any are filled
        const supplierId = res?.data?.id || id;
        const valuesToSave = Object.entries(customFieldValues)
          .filter(([, v]) => v !== '')
          .map(([field_id, value]) => ({ field_id, value }));

        if (supplierId && valuesToSave.length > 0) {
          await supplierCustomFieldsApi.bulkUpsertValues({
            shop_id: SHOP_ID,
            supplier_id: supplierId,
            values: valuesToSave,
          });
        }

        showToast(id ? "Supplier updated" : "Supplier registered", "success");
        // Remove draft if it exists
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const drafts = JSON.parse(localStorage.getItem("supplier_drafts") || "[]");
          localStorage.setItem("supplier_drafts", JSON.stringify(drafts.filter((d: any) => d.id !== draftId)));
        }
        navigate("/supplier/all");
      }
    } catch {
      showToast("Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Load existing custom field values when editing
  useEffect(() => {
    if (id) {
      supplierCustomFieldsApi.getValuesBySupplier(SHOP_ID, id).then((vals) => {
        const map: Record<string, string> = {};
        vals.forEach((v) => { map[v.field_id] = v.value; });
        setCustomFieldValues(map);
      });
    }
  }, [id]);

  if (loading && id) return <div className="py-20 text-center"><Loader /></div>;

  return (
    <div className="md:animate-in md:fade-in md:duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Main Identity & Contact */}
        <div className="md:col-span-8 space-y-8">
          
          {/* Identity Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16" />
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-800  ">Business Identity</h3>
                <p className="text-[11px] font-bold text-slate-400">Core registration information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Supplier / Business Name"
                  required
                  tooltip="The legal registered name of the supplier business."
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleChange}
                  placeholder="e.g. Acme Manufacturing Ltd"
                  className="h-12  text-slate-700"
                />
              </div>
              <Input
                label="Contact Person Name"
                tooltip="Name of the primary point of contact at this business. Fill this to unlock contact email & mobile."
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                placeholder="Full Name (optional)"
                leftIcon={<User size={16} className="text-slate-400" />}
              />
              {/* Show contact email & mobile only when contact name is provided */}
              {formData.contact_name.trim() && (
                <>
                  <Input
                    label="Contact Person Email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="contact@example.com"
                    leftIcon={<Mail size={16} className="text-slate-400" />}
                  />
                  <Input
                    label="Contact Person Mobile"
                    tooltip="Mobile number of the primary contact person."
                    name="contact_mobile"
                    value={formData.contact_mobile}
                    onChange={handleChange}
                    placeholder="+91 00000 00000"
                    leftIcon={<Phone size={16} className="text-slate-400" />}
                  />
                </>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400   ml-1">Business Type</label>
                <ReusableSelect
                  value={formData.type}
                  onValueChange={(val) => setFormData(p => ({ ...p, type: val }))}
                  options={[
                    { label: "Vendor", value: "Vendor" },
                    { label: "Manufacturer", value: "Manufacturer" },
                    { label: "Distributor", value: "Distributor" },
                    { label: "Service Provider", value: "Service Provider" }
                  ]}
                  placeholder="Select Type"
                />
              </div>
            </div>
          </div>

          {/* Contact & Location Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-800  ">Reach & Location</h3>
                <p className="text-[11px] font-bold text-slate-400">Communication and physical address</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vendor@example.com"
                leftIcon={<Mail size={16} className="text-slate-400" />}
              />
              <Input
                label="Phone Number"
                required
                tooltip="Primary business phone number for general communication."
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 00000 00000"
                leftIcon={<Phone size={16} className="text-slate-400" />}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Input
                  label="City / Region"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                  leftIcon={<MapPin size={16} className="text-slate-400" />}
                />
                <Input
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                />
                <Input
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="India"
                />
                <Input
                  label="ZIP Code"
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleChange}
                  placeholder="000 000"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400   ml-1">Street Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 md:transition-all placeholder:text-slate-300 resize-none"
                  placeholder="Enter full address details..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tax & Additional Info */}
        <div className="md:col-span-4 space-y-8">
          
          {/* Tax Info Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mb-8 blur-2xl" />
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600">
                <Tag size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black   text-slate-800">Tax Information</h3>
                <p className="text-[11px] font-bold text-slate-400">Compliance details</p>
              </div>
            </div>

            <div className="space-y-6">
              <Input
                label="GSTIN / Tax ID"
                required
                tooltip="Goods and Services Tax Identification Number of the supplier."
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5"
                className="bg-slate-50 border-slate-100 text-slate-800 placeholder:text-slate-300 h-12"
              />
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3 items-start">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 md:animate-pulse shrink-0" />
                <p className="text-[10px] font-bold text-blue-600 leading-relaxed  ">
                  Ensure the Tax ID is valid for generating B2B invoices and claiming Input Tax Credit.
                </p>
              </div>
            </div>
          </div>

          {/* Notes Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <FileText size={16} />
              </div>
              <h3 className="text-[10px] font-black text-slate-800  ">Internal Notes</h3>
            </div>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={5}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 md:transition-all placeholder:text-slate-300 resize-none"
              placeholder="Additional comments about this partner..."
            />
          </div>

          {/* Custom Fields Box */}
          {customFieldDefs.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-slate-800">Custom Fields</h3>
                  <p className="text-[11px] font-bold text-slate-400">Additional supplier attributes</p>
                </div>
              </div>
              <div className="space-y-4">
                {customFieldDefs.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                      {field.label_name}
                      {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                    </label>
                    {field.type === 'boolean' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`cf_${field.id}`}
                          checked={customFieldValues[field.id] === 'true'}
                          onChange={(e) =>
                            setCustomFieldValues((prev) => ({ ...prev, [field.id]: String(e.target.checked) }))
                          }
                          className="w-4 h-4 rounded accent-indigo-600"
                        />
                        <label htmlFor={`cf_${field.id}`} className="text-xs font-semibold text-slate-600">
                          {field.label_name}
                        </label>
                      </div>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) =>
                          setCustomFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                        }
                        placeholder={`Enter ${field.label_name.toLowerCase()}…`}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default SupplierForm;

