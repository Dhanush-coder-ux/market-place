import React, { useState } from "react";
import { 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  Tag, 
  FileText,
  CheckCircle2
} from "lucide-react";
import { QuickCreateModal, QuickCreateStep } from "./QuickCreateModal";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { useApi } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { supplierCustomFieldsApi } from "@/services/api/supplierCustomFields";

interface QuickCreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess: (supplier: any) => void;
}

export const QuickCreateSupplierModal: React.FC<QuickCreateSupplierModalProps> = ({
  isOpen,
  onClose,
  initialName = "",
  onSuccess,
}) => {
  const { postData } = useApi();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      supplierCustomFieldsApi.getAllFields(SHOP_ID).then((fields) => {
        setCustomFieldDefs(fields || []);
      }).catch(err => {
        console.error("Failed to load supplier custom fields:", err);
      });
    } else {
      setCustomFieldValues({});
    }
  }, [isOpen]);

  const [form, setForm] = useState({
    supplier_name: initialName,
    contact_person: "",
    type: "Vendor",
    email: "",
    phone: "",
    city: "",
    state: "",
    country: "India",
    address: "",
    zipcode: "",
    gst_number: "",
    notes: "",
    contact_person_email: "",
    contact_person_phone: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const finalValue = name.includes("gst") ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [name]: finalValue }));
  };

  const steps: QuickCreateStep[] = [
    {
      id: 1,
      title: "Business Identity",
      subtitle: "Core registration information",
      isValid: !!form.supplier_name,
      content: (
        <div className="space-y-6">
          <Input
            label="Supplier / Business Name"
            name="supplier_name"
            value={form.supplier_name}
            onChange={handleChange}
            placeholder="e.g. Acme Manufacturing Ltd"
            className="h-12 font-bold text-slate-700"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Contact Person Name"
              name="contact_person"
              value={form.contact_person}
              onChange={handleChange}
              placeholder="Full Name"
              leftIcon={<User size={16} className="text-slate-400" />}
            />
            <Input
              label="Contact Person Email"
              name="contact_person_email"
              type="email"
              value={form.contact_person_email}
              onChange={handleChange}
              placeholder="contact@example.com"
              leftIcon={<Mail size={16} className="text-slate-400" />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Contact Person Phone"
              name="contact_person_phone"
              value={form.contact_person_phone}
              onChange={handleChange}
              placeholder="+91 00000 00000"
              leftIcon={<Phone size={16} className="text-slate-400" />}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-1">
                Business Type
              </label>
              <ReusableSelect
                value={form.type}
                onValueChange={(val) => setForm((p) => ({ ...p, type: val }))}
                options={[
                  { label: "Vendor", value: "Vendor" },
                  { label: "Manufacturer", value: "Manufacturer" },
                  { label: "Distributor", value: "Distributor" },
                  { label: "Service Provider", value: "Service Provider" },
                ]}
                placeholder="Select Type"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "Reach & Location",
      subtitle: "Communication and address",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="vendor@example.com"
              leftIcon={<Mail size={16} className="text-slate-400" />}
            />
            <Input
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 00000 00000"
              leftIcon={<Phone size={16} className="text-slate-400" />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="e.g. Mumbai"
              leftIcon={<MapPin size={16} className="text-slate-400" />}
            />
            <Input
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="e.g. Maharashtra"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Country"
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="e.g. India"
            />
            <Input
              label="Zipcode / PIN"
              name="zipcode"
              value={form.zipcode}
              onChange={handleChange}
              placeholder="e.g. 600001"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 ml-1">
              Street Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg md:rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 resize-none"
              placeholder="Enter full address details..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "Tax & Compliance",
      subtitle: "Taxation and Internal Notes",
      isValid: customFieldDefs
        .filter((f) => f.required)
        .every((f) => customFieldValues[f.id] !== undefined && String(customFieldValues[f.id]).trim() !== ""),
      content: (
        <div className="space-y-6">
          <div className="p-4 md:p-6 rounded-lg bg-blue-50 border border-blue-100 flex gap-3 md:gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <Tag size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-blue-800 tracking-tight">Tax Identity</p>
              <p className="text-[10px] font-bold text-blue-600 leading-relaxed uppercase tracking-wider">
                Ensure the Tax ID is valid for generating B2B invoices and claiming ITC.
              </p>
            </div>
          </div>
          <Input
            label="GSTIN / Tax ID"
            name="gst_number"
            value={form.gst_number}
            onChange={handleChange}
            placeholder="22AAAAA0000A1Z5"
            className="h-12 font-bold bg-slate-50 border-slate-100"
          />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-slate-400" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Internal Notes
              </label>
            </div>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg md:rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 resize-none"
              placeholder="Additional comments about this partner..."
            />
          </div>

          {customFieldDefs.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200/60">
              <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Custom Fields</p>
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
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 4,
      title: "Overview",
      subtitle: "Review partner details",
      content: (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-lg md:rounded-lg p-4 md:p-6 border border-slate-100 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">{form.supplier_name || "Untitled Supplier"}</h4>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{form.type} • {form.city || "No City"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Tax ID</p>
                <p className="text-sm font-black text-blue-600 mt-1">{form.gst_number || "NOT PROVIDED"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/60">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400   leading-none">Contact Person</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">{form.contact_person || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400   leading-none">Mobile</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">{form.phone || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <Mail size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400   leading-none">Email Address</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">{form.email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 leading-none">Location</p>
                    <p className="text-xs font-bold text-slate-700 mt-1 truncate max-w-[150px] uppercase tracking-tight">{form.address || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 rounded-lg md:rounded-lg bg-emerald-50/50 border border-emerald-100 flex gap-3 md:gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-emerald-800  ">Verified Details</p>
              <p className="text-[10px] font-bold text-emerald-600 leading-relaxed  ">
                This supplier will be added to your procurement database once you click complete.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleSubmit = async () => {
    if (!form.supplier_name) {
      return showToast("Supplier name is required", "error");
    }

    setSubmitting(true);
    try {
      // Build custom fields mapping using field name as keys (for backend validation / create payload)
      const customFieldsPayload: Record<string, string> = {};
      customFieldDefs.forEach((field) => {
        const val = customFieldValues[field.id];
        if (val !== undefined && val !== "") {
          customFieldsPayload[field.field_name] = String(val);
        }
      });

      const payload: any = {
        shop_id: SHOP_ID,
        name: form.supplier_name,
        email: form.email && form.email.includes("@") ? form.email : null,
        mobile_number: form.phone,
        gst_no: form.gst_number,
        contact_infos: {
          name: form.contact_person,
          email: form.contact_person_email || (form.email && form.email.includes("@") ? form.email : null),
          mobile_number: form.contact_person_phone || form.phone,
          type: form.type,
        },
        location_infos: {
          full_address: form.address,
          city: form.city,
          state: form.state || "",
          country: form.country || "India",
          zipcode: form.zipcode || ""
        },
        datas: {
          internal_notes: form.notes,
        },
        custom_fields: customFieldsPayload
      };

      const res = await postData(ENDPOINTS.SUPPLIERS, payload);
      
      if (res) {
        const supplierId = res.data?.id || res.id;
        
        // Also call upsertValue as a fallback to ensure custom fields are persisted in values table
        const valuesToSave = Object.entries(customFieldValues)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([field_id, value]) => ({ field_id, value: String(value) }));

        if (supplierId && valuesToSave.length > 0) {
          try {
            await supplierCustomFieldsApi.upsertValue({
              shop_id: SHOP_ID,
              supplier_id: supplierId,
              value_infos: valuesToSave,
            });
          } catch (e) {
            console.error("Failed to upsert supplier custom field values:", e);
          }
        }

        showToast("Supplier registered successfully", "success");
        onSuccess(res.data || res);
        onClose();
      }
    } catch (error: any) {
      const errMsg = error?.response?.data?.detail?.description || error?.detail?.description || error?.message || "Failed to register supplier";
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <QuickCreateModal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Supplier Registration"
      steps={steps}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      submitLabel="Register Supplier"
      size="lg"
    />
  );
};

