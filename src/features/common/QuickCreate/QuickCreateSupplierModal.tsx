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

  const [form, setForm] = useState({
    supplier_name: initialName,
    contact_person: "",
    type: "Vendor",
    email: "",
    phone: "",
    city: "",
    address: "",
    gst_number: "",
    notes: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
              label="Contact Person"
              name="contact_person"
              value={form.contact_person}
              onChange={handleChange}
              placeholder="Full Name"
              leftIcon={<User size={16} className="text-slate-400" />}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
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
          <Input
            label="City / Region"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="e.g. Mumbai, Maharashtra"
            leftIcon={<MapPin size={16} className="text-slate-400" />}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Street Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 resize-none"
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
      content: (
        <div className="space-y-6">
          <div className="p-6 rounded-[1.5rem] bg-blue-50 border border-blue-100 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <Tag size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-blue-800 uppercase tracking-widest">Tax Identity</p>
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Internal Notes
              </label>
            </div>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 resize-none"
              placeholder="Additional comments about this partner..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: "Overview",
      subtitle: "Review partner details",
      content: (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">{form.supplier_name || "Untitled Supplier"}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{form.type} • {form.city || "No City"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax ID</p>
                <p className="text-sm font-black text-blue-600">{form.gst_number || "NOT PROVIDED"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/60">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Contact Person</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">{form.contact_person || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Mobile</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">{form.phone || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <Mail size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Email Address</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">{form.email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Location</p>
                    <p className="text-xs font-bold text-slate-700 mt-1 truncate max-w-[150px]">{form.address || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-emerald-50/50 border border-emerald-100 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">Verified Details</p>
              <p className="text-[10px] font-bold text-emerald-600 leading-relaxed uppercase tracking-wider">
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
      const payload: any = {
        shop_id: SHOP_ID,
        name: form.supplier_name,
        email: form.email || null,
        mobile_number: form.phone,
        gst_no: form.gst_number,
        contact_info: {
          name: form.contact_person,
          mobile_number: form.phone, // Using business phone as contact phone in quick create
          email: form.email || null,
          type: form.type,
        },
        datas: {
          internal_notes: form.notes,
          address: {
            full_address: form.address,
            city: form.city,
            zipcode: "" // Optional in quick create
          }
        }
      };

      const res = await postData(ENDPOINTS.SUPPLIERS, payload);
      
      if (res) {
        showToast("Supplier registered successfully", "success");
        onSuccess(res.data || res);
        onClose();
      }
    } catch (error) {
      showToast("Failed to register supplier", "error");
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
      size="xl"
    />
  );
};