import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Shield,
  Calendar,
  Bookmark,
  Building2,
  FileText,
  Tag
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import Input from "@/components/ui/Input"; 
import { ReusableSelect } from "@/components/ui/ReusableSelect"; 
import { GradientButton } from "@/components/ui/GradientButton";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Staff", value: "staff" },
];

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postData, putData, getData } = useApi();
  const { setActions, setBottomActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const initialFormData = {
    name: "",
    email: "",
    role: "staff",
    mobile_number: "",
    address: "",
    joinDate: new Date().toISOString().split('T')[0],
    is_accepted: true,
    employee_id_custom: "",
    department: "",
    salary_range: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Header Actions
  useEffect(() => {
    setActions(
        <div className="flex items-center gap-3 bg-white px-4 h-11 rounded-2xl border border-slate-200 shadow-sm scale-90 md:scale-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
          <Switch 
            checked={formData.is_accepted} 
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_accepted: checked }))}
          />
        </div>
    );
    return () => setActions(null);
  }, [setActions, formData.is_accepted]);

  useEffect(() => {
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button 
            type="button"
            onClick={handleSaveDraft}
            className="px-6 h-8 rounded-xl border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2"
          >
            <Bookmark size={14} />
            Save Draft
          </button>
        )}
        <GradientButton 
          icon={<Save size={16} />} 
          onClick={handleSubmit} 
          disabled={submitting}
          className="rounded-xl shadow-md text-xs px-8 h-8 flex items-center"
        >
          {submitting ? "..." : (id ? "Save Changes" : "Create Member")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, submitting, id, formData]);

  // Load Existing or Draft
  useEffect(() => {
    const draftId = searchParams.get('draftId');
    if (draftId) {
      const drafts = JSON.parse(localStorage.getItem('employee_drafts') || '[]');
      const draft = drafts.find((d: any) => d.id === draftId);
      if (draft) {
        setFormData(draft);
        showToast("Draft loaded successfully", "success");
      }
    } else if (id) {
      getData(`${ENDPOINTS.EMPLOYEES}/by/${id}`).then(res => {
        if (res?.data) {
          const emp = Array.isArray(res.data) ? res.data[0] : res.data;
          setFormData({
            ...initialFormData,
            ...emp,
            is_accepted: emp.is_accepted ?? true,
          });
        }
      });
    }
  }, [id, searchParams]);

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem('employee_drafts') || '[]');
    const draftId = searchParams.get('draftId') || Date.now().toString();
    
    const newDraft = { 
      ...formData, 
      id: draftId,
      updatedAt: new Date().toISOString() 
    };

    const existingIndex = drafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex > -1) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.unshift(newDraft);
    }

    localStorage.setItem('employee_drafts', JSON.stringify(drafts));
    showToast("Employee details saved as draft", "info");
    
    // Update URL if it's a new draft
    if (!searchParams.get('draftId')) {
      navigate(`/employee/add?draftId=${draftId}`, { replace: true });
    }
  };

  const handleSubmit = async (e: any) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast("Please fill in name and email", "error");
      return;
    }

    setSubmitting(true);
    const payload = {
      datas: {
        ...formData,
        id,
        shop_id: SHOP_ID,
        type: id ? "EMPLOYEE UPDATE" : "EMPLOYEE CREATE"
      }
    };

    try {
      const res = id 
        ? await putData(ENDPOINTS.EMPLOYEES, payload)
        : await postData(ENDPOINTS.EMPLOYEES, payload);

      if (res) {
        showToast(`Employee ${id ? 'updated' : 'created'} successfully`, "success");
        // Clear draft if it was one
        const draftIndex = searchParams.get('draft');
        if (draftIndex !== null) {
          const drafts = JSON.parse(localStorage.getItem('employee_drafts') || '[]');
          drafts.splice(parseInt(draftIndex), 1);
          localStorage.setItem('employee_drafts', JSON.stringify(drafts));
        }
        navigate("/employee/all");
      }
    } catch (_err) {
      showToast("Failed to save employee", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-2 md:p-4 lg:p-6 font-[Inter,sans-serif]">
      <div className="max-w-7xl mx-auto space-y-4 relative">
        

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
                label="Full Name"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Johnathan Doe"
                leftIcon={<User size={16} className="text-slate-300" />}
              />
              <Input
                label="Email Address"
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                leftIcon={<Mail size={16} className="text-slate-300" />}
              />
              <Input
                label="Phone Number"
                type="tel"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                placeholder="+91 00000 00000"
                leftIcon={<Phone size={16} className="text-slate-300" />}
              />
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-wider">System Role</label>
                <ReusableSelect 
                  options={roleOptions}
                  value={formData.role}
                  onValueChange={(val) => handleSelectChange("role", val)}
                  placeholder="Select Permissions"
                />
              </div>
            </div>
          </div>

          {/* BOX 2: CLASSIFICATION (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Shield size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Classification</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Member Active</span>
                <Switch 
                  checked={formData.is_accepted} 
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_accepted: checked }))}
                />
              </div>
              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Sales, Ops"
                leftIcon={<Building2 size={16} className="text-slate-300" />}
              />
            </div>
          </div>

          {/* BOX 3: EMPLOYMENT (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                <Briefcase size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Employment</h2>
            </div>
            <div className="p-8">
              <Input
                label="Employee ID (Custom)"
                name="employee_id_custom"
                value={formData.employee_id_custom}
                onChange={handleChange}
                placeholder="EMP-102"
                leftIcon={<Tag size={16} className="text-slate-300" />}
              />
            </div>
          </div>

          {/* BOX 4: FINANCIALS (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <FileText size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Financial Context</h2>
            </div>
            <div className="p-8">
              <Input
                label="Salary Range / CTC"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleChange}
                placeholder="e.g. 5L - 7L"
                leftIcon={<Tag size={16} className="text-slate-300" />}
              />
            </div>
          </div>

          {/* BOX 5: DATE (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                <Calendar size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Lifecycle</h2>
            </div>
            <div className="p-8">
              <Input
                label="Joining Date"
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
                leftIcon={<Calendar size={16} className="text-slate-300" />}
              />
            </div>
          </div>

          {/* BOX 6: ADDRESS (Spans 6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <MapPin size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Residance & Work Location</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Physical Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Full address of residence or assigned office..."
                className="md:col-span-2"
                leftIcon={<MapPin size={16} className="text-slate-300" />}
              />
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EmployeeForm;