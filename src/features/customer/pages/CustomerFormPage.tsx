import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  CreditCard,
  DollarSign,
  Bookmark,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { customerCustomFieldsApi, type CustomerCustomFieldDefinition } from "@/services/api/customer";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { Layers, Plus } from "lucide-react";
import { NavigationBlocker } from "@/components/common/NavigationBlocker";

const CustomerFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customer } = useBusinessApi();
  const { setActions, setBottomActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [loadingData, setLoadingData] = useState(!!id);

  // ── Custom Fields State ──
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomerCustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Sidebar creation form state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldVisible, setNewFieldVisible] = useState(false);

  const initialFormData = {
    first_name: "",
    last_name: "",
    company: "",
    email: "",
    phone: "",
    customer_type: "Normal",
    full_address: "",
    zip_code: "",
    country: "India",
    state: "",
    notes: "",
    is_active: true,
    credit_limit: "",
    credit_terms: "7_DAYS",
    can_have_credit: false,
    gst_number: "",
  };

  // Form State
  const [formData, setFormData] = useState(initialFormData);

  // Header Actions — nothing to show for customer form
  useEffect(() => {
    return () => setActions(null);
  }, [setActions]);


  // Bottom Actions
  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 h-8 rounded-lg border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2 whitespace-nowrap overflow-hidden"
          >
            <Bookmark size={14} className="shrink-0" />
            <span className="truncate">Save Draft</span>
          </button>
        )}
        <GradientButton
          icon={submitting ? <Save className="animate-pulse" size={16} /> : <Save size={16} />}
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg shadow-md text-xs px-8 h-8 flex items-center"
        >
          {submitting ? "Saving..." : (id ? "Update Customer" : "Register Customer")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, submitting, id, formData, customFieldDefs, customFieldValues]);

  // Load Custom Field definitions
  useEffect(() => {
    customerCustomFieldsApi.getAllFields(SHOP_ID).then((fields) => {
      setCustomFieldDefs(fields);
    });
  }, []);

  // Load Existing Customer, Draft, and Custom Field values
  useEffect(() => {
    if (id) {
      const fetchCustomer = async () => {
        const res = await customer.getCustomerById(SHOP_ID, id);
        if (res && res.data) {
          const cust = Array.isArray(res.data) ? res.data[0] : res.data;
          const datas = cust.datas || {};
          const contactInfos = cust.contact_infos || {};
          const creditInfos = cust.credit_infos || {};
          const locationInfos = cust.location_infos || {};
          const address = datas.address || {};

          setFormData({
            ...initialFormData,
            first_name: cust.name?.split(" ")[0] || "",
            last_name: cust.name?.split(" ").slice(1).join(" ") || "",
            company: datas.company || "",
            email: contactInfos.email || cust.email || "",
            phone: contactInfos.mobile_number || cust.mobile_number || "",
            customer_type: datas.customer_type || "Normal",
            full_address: locationInfos.full_address || address.full_address || "",
            zip_code: locationInfos.zipcode || address.zip_code || "",
            country: locationInfos.country || "India",
            state: locationInfos.state || "",
            notes: creditInfos.notes || datas.additional_notes || "",
            is_active: cust.is_active !== undefined ? cust.is_active : true,
            credit_limit: String(creditInfos.limit || cust.credit_limit || ""),
            credit_terms: creditInfos.terms || datas.payment_cycle || "7_DAYS",
            can_have_credit: cust.can_have_credit ?? (Number(creditInfos.limit || cust.credit_limit || 0) > 0),
            gst_number: datas.gst_number || "",
          });
        }
      };

      const fetchCustomFieldValues = async () => {
        const vals = await customerCustomFieldsApi.getValuesByCustomer(SHOP_ID, id);
        const record: Record<string, string> = {};
        vals.forEach((v) => {
          record[v.field_id] = v.value;
        });
        setCustomFieldValues(record);
      };

      Promise.all([fetchCustomer(), fetchCustomFieldValues()]).finally(() => {
        setLoadingData(false);
      });
    } else {
      setLoadingData(false);
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("customer_drafts") || "[]");
        const draft = drafts.find((d: any) => d.id === draftId);
        if (draft) {
          setFormData({ ...initialFormData, ...draft.data });
        }
      }
    }
  }, [id, customer, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("customer_drafts") || "[]");
    const draftId = searchParams.get("draftId") || Date.now().toString();

    const newDraft = {
      id: draftId,
      data: formData,
      timestamp: new Date().toISOString(),
      displayName: `${formData.first_name} ${formData.last_name}`.trim() || formData.company || "Untitled Draft"
    };

    const existingIndex = drafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.push(newDraft);
    }

    localStorage.setItem("customer_drafts", JSON.stringify(drafts));
    showToast("Progress saved as draft", "info");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    const canHaveCredit = formData.can_have_credit || Number(formData.credit_limit) > 0;
    console.log("Customer handleSubmit - customFieldValues:", customFieldValues);
    console.log("Customer handleSubmit - customFieldDefs:", customFieldDefs);

    const payload: any = {
      shop_id: SHOP_ID,
      name: `${formData.first_name} ${formData.last_name}`.trim(),
      contact_infos: {
        email: formData.email || undefined,
        mobile_number: formData.phone || undefined,
      },
      location_infos: {
        full_address: formData.full_address,
        zipcode: formData.zip_code,
        country: formData.country || "India",
        state: formData.state || "",
      },
      can_have_credit: canHaveCredit,
      custom_fields: Object.entries(customFieldValues).reduce((acc, [fieldId, val]) => {
        const fieldDef = customFieldDefs.find(fd => fd.id === fieldId);
        if (fieldDef) {
          acc[fieldDef.field_name] = val;
        }
        return acc;
      }, {} as Record<string, any>)
    };

    // Only send credit_infos when the customer can have credit
    if (canHaveCredit) {
      payload.credit_infos = {
        limit: Number(formData.credit_limit) || 0,
        type: "DIRECT",  // required by CustomerUpdateCreditInfosType — sets limit directly
        notes: formData.notes || undefined,
        terms: formData.credit_terms || undefined,
      };
    }

    if (id) {
      payload.id = id;
    }

    let res;
    try {
      if (id) {
        res = await customer.updateCustomer(payload);
      } else {
        res = await customer.createCustomer(payload);
      }

      if (res) {
        const savedCustomerId = res.data?.id || res.id || id;
        if (savedCustomerId) {
          const valueInfos = Object.entries(customFieldValues)
            .filter(([_, value]) => value !== undefined && value !== "")
            .map(([field_id, value]) => ({
              field_id,
              value: String(value),
            }));

          if (valueInfos.length > 0) {
            await customerCustomFieldsApi.upsertValue({
              shop_id: SHOP_ID,
              customer_id: savedCustomerId,
              value_infos: valueInfos,
            });
          }
        }

        showToast(id ? "Customer updated successfully" : "Customer created successfully", "success");
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const drafts = JSON.parse(localStorage.getItem("customer_drafts") || "[]");
          const filtered = drafts.filter((d: any) => d.id !== draftId);
          localStorage.setItem("customer_drafts", JSON.stringify(filtered));
        }
        navigate("/customers/all");
      } else {
        showToast("Failed to save customer", "error");
      }
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleCreateCustomField = async () => {
    if (!newFieldName || !newFieldLabel) {
      showToast("Field Name and Label are required", "error");
      return;
    }
    try {
      await customerCustomFieldsApi.createField({
        shop_id: SHOP_ID,
        field_infos: [{
          field_name: newFieldName,
          label_name: newFieldLabel,
          type: newFieldType,
          required: newFieldRequired,
          visible_online: newFieldVisible,
        }],
      });
      showToast("Custom field created successfully", "success");
      // Refresh definitions
      const fields = await customerCustomFieldsApi.getAllFields(SHOP_ID);
      setCustomFieldDefs(fields);
      // Reset sidebar form
      setNewFieldName("");
      setNewFieldLabel("");
      setNewFieldType("text");
      setNewFieldRequired(false);
      setNewFieldVisible(false);
      setIsSidebarOpen(false);
    } catch {
      showToast("Failed to create custom field", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50  font-sans">
      <div className="mx-auto space-y-8">

        {/* FORM REMOVED (actions now in global header) */}

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-start">

          {/* BOX 1: IDENTITY (Spans 6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <User size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800  ">Personal Identity</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                required
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
              />
              <Input
                label="Last Name"
                required
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
              />
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                leftIcon={<Mail size={16} className="text-slate-400" />}
              />
              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 00000 00000"
                leftIcon={<Phone size={16} className="text-slate-400" />}
              />
            </div>
          </div>

          {/* BOX 2: STATUS & TYPE (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <Tag size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800  ">Classification</h2>
            </div>
            <div className="p-8 space-y-6">

              <ReusableSelect
                key={`type-${id || searchParams.get("draftId") || "new"}-${formData.customer_type}`}
                label="Customer Category"
                value={formData.customer_type}
                onValueChange={(val) => handleSelectChange("customer_type", val)}
                options={[
                  { label: "Normal", value: "Normal" },
                  { label: "Premium", value: "Premium" },
                  { label: "Wholesale", value: "Wholesale" },
                ]}
                placeholder="Category"
              />
            </div>
          </div>

          {/* BOX 6: BILLING ADDRESS (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <MapPin size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800  ">Billing Address</h2>
            </div>
            <div className="p-8 space-y-6">
              <Input
                label="Full Address"
                name="full_address"
                value={formData.full_address}
                onChange={handleChange}
                placeholder="123, Business Park, City"
                leftIcon={<MapPin size={16} className="text-slate-400" />}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Tamil Nadu"
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
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  placeholder="600001"
                />
              </div>
            </div>
          </div>

          {/* BOX 7: CREDIT & NOTES (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                <CreditCard size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800  ">Financial & Notes</h2>
            </div>
            <div className="p-8 space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500">Allow Credit</span>
                  <Switch
                    checked={formData.can_have_credit}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_have_credit: checked }))}
                  />
                </div>
                {formData.can_have_credit && (
                  <Input
                    label="Credit Limit"
                    type="number"
                    name="credit_limit"
                    value={formData.credit_limit}
                    onChange={handleChange}
                    placeholder="0.00"
                    leftIcon={<DollarSign size={16} className="text-emerald-500" />}
                  />
                )}
                {formData.can_have_credit && (
                  <ReusableSelect
                    key={`terms-${id || searchParams.get("draftId") || "new"}-${formData.credit_terms}`}
                    label="Credit Terms"
                    value={formData.credit_terms}
                    onValueChange={(val) => handleSelectChange("credit_terms", val)}
                    options={[
                      { label: "7 Days", value: "7_DAYS" },
                    ]}
                    placeholder="Select Terms"
                  />
                )}
              <div className="flex flex-col gap-1.5 w-full flex-1">
                <label className="text-[11px] font-bold text-slate-500 ml-1  ">
                  Internal Remarks
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Briefly describe the customer or special needs..."
                  className="w-full px-4 py-4 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none bg-slate-50/30 flex-1"
                />
              </div>
            </div>
          </div>

          {/* BOX 8: CUSTOM FIELDS (Spans 6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Layers size={18} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-800">Custom Fields</h2>
                  <p className="text-[10px] text-slate-400 font-medium">Define and populate additional customer properties</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="h-8 px-3 rounded-lg border border-indigo-100 text-indigo-600 font-bold text-xs bg-indigo-50/50 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
              >
                <Plus size={14} />
                Create Custom Field
              </button>
            </div>
            
            <div className="p-8">
              {customFieldDefs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No custom fields defined yet. Click "Create Custom Field" to add one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customFieldDefs.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 ml-1">
                        {field.label_name}
                        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                      </label>
                      {field.type === 'boolean' ? (
                        <div className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-slate-50/30">
                          <input
                            type="checkbox"
                            id={`cf_${field.id}`}
                            checked={customFieldValues[field.id] === 'true'}
                            onChange={(e) =>
                              setCustomFieldValues((prev) => ({ ...prev, [field.id]: String(e.target.checked) }))
                            }
                            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                          />
                          <label htmlFor={`cf_${field.id}`} className="text-xs font-semibold text-slate-600 cursor-pointer">
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
                          required={field.required}
                          placeholder={`Enter ${field.label_name.toLowerCase()}…`}
                          className="w-full h-10 px-4 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none bg-slate-50/30 font-semibold"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Sidebar Filter for Custom Field Creation */}
        <RightSidebarFilter
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onApply={handleCreateCustomField}
          applyLabel="Create"
          onClear={() => {
            setNewFieldName("");
            setNewFieldLabel("");
            setNewFieldType("text");
            setNewFieldRequired(false);
            setNewFieldVisible(false);
          }}
          title="Create Custom Field"
        >
          <div className="space-y-5">
            <Input
              label="Label Name (Display Name)"
              required
              value={newFieldLabel}
              onChange={(e) => {
                const val = e.target.value;
                setNewFieldLabel(val);
                setNewFieldName(val.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "_"));
              }}
              placeholder="e.g. Loyalty Card ID"
            />
            <Input
              label="Field Name (Internal Name)"
              required
              disabled
              value={newFieldName}
              placeholder="Auto-generated from Label Name"
            />
            <ReusableSelect
              label="Field Type"
              value={newFieldType}
              onValueChange={(val) => setNewFieldType(val)}
              options={[
                { label: "Text", value: "text" },
                { label: "Number", value: "number" },
                { label: "Date", value: "date" },
                { label: "Yes / No (Boolean)", value: "boolean" },
              ]}
              placeholder="Select Type"
            />
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-500">Required Field</span>
              <Switch
                checked={newFieldRequired}
                onCheckedChange={(checked) => setNewFieldRequired(checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-500">Visible Online</span>
              <Switch
                checked={newFieldVisible}
                onCheckedChange={(checked) => setNewFieldVisible(checked)}
              />
            </div>
          </div>
        </RightSidebarFilter>
      </div>
      <NavigationBlocker data={{ formData, customFieldValues }} isLoading={loadingData} isSubmitting={submitting} />
    </div>
  );
};

export default CustomerFormPage;

