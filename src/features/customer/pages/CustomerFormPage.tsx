import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Tag,
  CreditCard,
  DollarSign,
  ChevronLeft,
  FileText,
  Bookmark,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import Input from "@/components/ui/Input"; 
import { ReusableSelect } from "@/components/ui/ReusableSelect"; 
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";

const CustomerFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, putData, getData, loading } = useApi();
  const { setActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const initialFormData = {
    first_name: "",
    last_name: "",
    company: "",
    email: "",
    phone: "",
    customer_type: "Normal", 
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    notes: "",
    is_active: true,
    credit_limit: "",
    credit_terms: "7-days",
    gst_number: "",
  };

  // Form State
  const [formData, setFormData] = useState(initialFormData);

  // Header Actions
  useEffect(() => {
    const handleActionSubmit = (e: any) => {
      e.preventDefault();
      handleSubmit(e);
    };

    setActions(
      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-3 bg-white px-4 h-11 rounded-2xl border border-slate-200 shadow-sm scale-90 md:scale-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
          <Switch 
            checked={formData.is_active} 
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
        </div>
        <div className="hidden md:flex items-center gap-2">
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
            onClick={handleActionSubmit} 
            disabled={submitting}
            className="rounded-xl shadow-md text-xs px-6 h-11 h-auto flex items-center py-3"
          >
            {submitting ? "..." : (id ? "Save" : "Create")}
          </GradientButton>
        </div>
      </div>
    );
    return () => setActions(null);
  }, [setActions, formData.is_active, submitting, id, navigate, formData]);

  // Load Existing Customer or Draft
  useEffect(() => {
    if (id) {
      const fetchCustomer = async () => {
        const res = await getData(`${ENDPOINTS.CUSTOMERS}/by/${id}`);
        if (res && res.data) {
          const cust = res.data;
          const datas = cust.datas || {};
          
          setFormData({
            ...initialFormData,
            first_name: cust.first_name || datas.first_name || "",
            last_name: cust.last_name || datas.last_name || "",
            company: cust.company || datas.company || "",
            email: cust.email || datas.email || "",
            phone: cust.phone || datas.phone || "",
            customer_type: cust.customer_type || datas.customer_type || "Normal",
            street_address: datas.street_address || "",
            city: datas.city || "",
            state: datas.state || "",
            zip_code: datas.zip_code || "",
            notes: datas.notes || "",
            is_active: cust.is_active !== undefined ? cust.is_active : (datas.is_active !== undefined ? datas.is_active : true),
            credit_limit: cust.credit_limit || datas.credit_limit || "",
            credit_terms: cust.credit_terms || datas.credit_terms || "7-days",
            gst_number: cust.gst_number || datas.gst_number || "",
          });
        }
      };
      fetchCustomer();
    } else {
      // Check for draft
      const draftId = searchParams.get("draftId");
      if (draftId) {
        const drafts = JSON.parse(localStorage.getItem("customer_drafts") || "[]");
        const draft = drafts.find((d: any) => d.id === draftId);
        if (draft) {
          setFormData({ ...initialFormData, ...draft.data });
        }
      }
    }
  }, [id, getData, searchParams]);

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
    setSubmitting(true);
    const payload = {
      datas: {
        ...formData,
        id,
        shop_id: SHOP_ID,
        type: id ? "CUSTOMER UPDATE" : "CUSTOMER CREATE",
      },
    };
    
    let res;
    try {
      if (id) {
        res = await putData(`${ENDPOINTS.CUSTOMERS}`, payload);
      } else {
        res = await postData(ENDPOINTS.CUSTOMERS, payload);
      }

      if (res) {
        showToast(id ? "Customer updated successfully" : "Customer created successfully", "success");
        // Clear draft if it exists
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const drafts = JSON.parse(localStorage.getItem("customer_drafts") || "[]");
          const filtered = drafts.filter((d: any) => d.id !== draftId);
          localStorage.setItem("customer_drafts", JSON.stringify(filtered));
        }
        navigate("/customers-Summary");
      } else {
        showToast("Failed to save customer", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 font-[Inter,sans-serif]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* FORM REMOVED (actions now in global header) */}

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-start">
          
          {/* BOX 1: IDENTITY (Spans 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <User size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Personal Identity</h2>
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
                required
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
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Tag size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Classification</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Active</span>
                <Switch 
                  checked={formData.is_active} 
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
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

          {/* BOX 3: BUSINESS (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Building2 size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Business</h2>
            </div>
            <div className="p-8">
              <Input
                label="Company Name"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. Acme Industries"
                leftIcon={<Building2 size={16} className="text-slate-400" />}
              />
            </div>
          </div>

          {/* BOX 4: TAX INFO (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <FileText size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Tax Identity</h2>
            </div>
            <div className="p-8">
              <Input
                label="GST Number"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                placeholder="GSTIN"
                leftIcon={<Tag size={16} className="text-slate-400" />}
              />
            </div>
          </div>

          {/* BOX 5: CREDIT TERMS (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                <ChevronLeft size={18} className="rotate-180" />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Payment Cycle</h2>
            </div>
            <div className="p-8">
              <ReusableSelect
                key={`terms-${id || searchParams.get("draftId") || "new"}-${formData.credit_terms}`}
                label="Credit Terms"
                value={formData.credit_terms}
                onValueChange={(val) => handleSelectChange("credit_terms", val)}
                options={[
                  { label: "7 Days", value: "7-days" },
                  { label: "15 Days", value: "15-days" },
                  { label: "30 Days", value: "30-days" },
                  { label: "45 Days", value: "45-days" },
                  { label: "60 Days", value: "60-days" },
                  { label: "90 Days", value: "90-days" },
                ]}
                placeholder="Select Terms"
              />
            </div>
          </div>

          {/* BOX 6: BILLING ADDRESS (Spans 3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <MapPin size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Billing Address</h2>
            </div>
            <div className="p-8 space-y-6">
              <Input
                label="Street Address"
                name="street_address"
                value={formData.street_address}
                onChange={handleChange}
                placeholder="123, Business Park"
                leftIcon={<MapPin size={16} className="text-slate-400" />}
              />
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
                <Input
                  label="ZIP Code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  placeholder="ZIP"
                />
              </div>
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State / Province"
              />
            </div>
          </div>

          {/* BOX 7: CREDIT & NOTES (Spans 3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                <CreditCard size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Financial & Notes</h2>
            </div>
            <div className="p-8 space-y-6 flex-1 flex flex-col">
              <Input
                label="Credit Limit"
                type="number"
                name="credit_limit"
                value={formData.credit_limit}
                onChange={handleChange}
                placeholder="0.00"
                leftIcon={<DollarSign size={16} className="text-emerald-500" />}
              />
              <div className="flex flex-col gap-1.5 w-full flex-1">
                <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-wider">
                  Internal Remarks
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Briefly describe the customer or special needs..."
                  className="w-full px-4 py-4 rounded-3xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none bg-slate-50/30 flex-1"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Mobile Submit Button (Visible only on small screens) */}
        <div className="md:hidden flex flex-col gap-3 pb-8">
          {!id && (
            <button 
              type="button"
              onClick={handleSaveDraft}
              className="w-full h-12 rounded-2xl border border-blue-100 text-blue-600 font-bold text-sm bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
            >
              <Bookmark size={18} />
              Save Draft
            </button>
          )}
          <GradientButton 
            icon={<Save size={18} />} 
            onClick={handleSubmit} 
            disabled={submitting}
            className="w-full rounded-2xl h-12"
          >
            {submitting ? "Processing..." : (id ? "Save Changes" : "Create Customer")}
          </GradientButton>
          <button 
            onClick={() => navigate("/customers-Summary")}
            className="w-full h-12 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors"
          >
            Discard
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomerFormPage;
