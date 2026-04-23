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
  Tag
} from "lucide-react";
import Input from "@/components/ui/Input";
import { GradientButton } from "@/components/ui/GradientButton";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import Loader from "@/components/common/Loader";

export interface SupplierData {
  supplier_name: string;
  contact_person: string; 
  email: string;          
  phone: string;
  address: string;        
  city: string;           
  type: string;
  gst_number: string;
  notes: string;
}

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, putData, getData, loading } = useApi();
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const initialFormData: SupplierData = {
    supplier_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    type: "Vendor",
    gst_number: "",
    notes: ""
  };

  const [formData, setFormData] = useState<SupplierData>(initialFormData);

  // Header Actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button 
            type="button"
            onClick={handleSaveDraft}
            className="px-4 h-11 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
          >
            <Bookmark size={14} />
            Save Draft
          </button>
        )}
        <GradientButton 
          icon={<Save size={16} />} 
          onClick={handleSubmit} 
          disabled={submitting}
          className="rounded-xl shadow-md text-xs px-6 h-11 flex items-center"
        >
          {submitting ? "..." : (id ? "Save Changes" : "Register Supplier")}
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, formData, submitting, id, navigate]);

  // Load Data/Draft
  useEffect(() => {
    if (id) {
      getData(`${ENDPOINTS.SUPPLIERS}/by/${id}`).then((res) => {
        if (res && res.data) {
          const sup = Array.isArray(res.data) ? res.data[0] : res.data;
          const d = sup.datas || {};
          setFormData({
            supplier_name: sup.supplier_name || d.supplier_name || "",
            contact_person: d.contact_person || "",
            email: d.email || "",
            phone: d.phone || "",
            address: d.address || "",
            city: d.city || "",
            type: d.type || "Vendor",
            gst_number: d.gst_number || d.gstin || "",
            notes: d.notes || ""
          });
        }
      });
    } else {
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("supplier_drafts") || "[]");
        const draft = drafts.find((d: any) => d.id === draftId);
        if (draft) setFormData(draft.data);
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
      data: formData
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

    setSubmitting(true);
    const payload = {
      datas: {
        ...formData,
        shop_id: SHOP_ID,
        type: id ? "SUPPLIER UPDATE" : "SUPPLIER CREATE"
      },
    };

    try {
      const res = id 
        ? await putData(`${ENDPOINTS.SUPPLIERS}/${id}`, payload)
        : await postData(ENDPOINTS.SUPPLIERS, payload);

      if (res) {
        showToast(id ? "Supplier updated" : "Supplier registered", "success");
        // Remove draft if it exists
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const drafts = JSON.parse(localStorage.getItem("supplier_drafts") || "[]");
          localStorage.setItem("supplier_drafts", JSON.stringify(drafts.filter((d: any) => d.id !== draftId)));
        }
        navigate("/supplier");
      }
    } catch {
      showToast("Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && id) return <div className="py-20 text-center"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Main Identity & Contact */}
        <div className="md:col-span-8 space-y-8">
          
          {/* Identity Box */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16" />
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Business Identity</h3>
                <p className="text-[11px] font-bold text-slate-400">Core registration information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Supplier / Business Name"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleChange}
                  placeholder="e.g. Acme Manufacturing Ltd"
                  className="h-12 font-bold text-slate-700"
                />
              </div>
              <Input
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Full Name"
                leftIcon={<User size={16} className="text-slate-400" />}
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Type</label>
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
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Reach & Location</h3>
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
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 00000 00000"
                leftIcon={<Phone size={16} className="text-slate-400" />}
              />
              <div className="md:col-span-2">
                <Input
                  label="City / Region"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai, Maharashtra"
                  leftIcon={<MapPin size={16} className="text-slate-400" />}
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Street Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 resize-none"
                  placeholder="Enter full address details..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tax & Additional Info */}
        <div className="md:col-span-4 space-y-8">
          
          {/* Tax Info Box */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mb-8 blur-2xl" />
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-blue-600">
                <Tag size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Tax Information</h3>
                <p className="text-[11px] font-bold text-slate-400">Compliance details</p>
              </div>
            </div>

            <div className="space-y-6">
              <Input
                label="GSTIN / Tax ID"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5"
                className="bg-slate-50 border-slate-100 text-slate-800 placeholder:text-slate-300 h-12"
              />
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-3 items-start">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                <p className="text-[10px] font-bold text-blue-600 leading-relaxed uppercase tracking-wider">
                  Ensure the Tax ID is valid for generating B2B invoices and claiming Input Tax Credit.
                </p>
              </div>
            </div>
          </div>

          {/* Notes Box */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <FileText size={16} />
              </div>
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Internal Notes</h3>
            </div>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={5}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 resize-none"
              placeholder="Additional comments about this partner..."
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupplierForm;