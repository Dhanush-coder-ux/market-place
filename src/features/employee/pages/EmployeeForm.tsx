import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Bookmark,
  FileText,
  Tag
} from "lucide-react";
import Input from "@/components/ui/Input"; 
import { ReusableSelect } from "@/components/ui/ReusableSelect"; 
import { GradientButton } from "@/components/ui/GradientButton";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";

const roleOptions = [
  { label: "Owner", value: "OWNER" },
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "Admin", value: "ADMIN" },
  { label: "Biller", value: "BILLER" },
  { label: "User", value: "USER" },
];

const departmentOptions = [
  { label: "Sales", value: "SALES" },
  { label: "Biller", value: "BILLER" },
  { label: "Manager", value: "MANAGER" },
];

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { employee } = useBusinessApi();
  const { setActions, setBottomActions } = useHeader();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const initialFormData = {
    name: "",
    email: "",
    role: "USER",
    mobile_number: "",
    address: "",
    zip_code: "",
    joinDate: new Date().toISOString().split('T')[0],
    is_accepted: true,
    department: "",
    salary_range: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Header Actions
  useEffect(() => {
    setActions(null);
  }, [setActions]);

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
          icon={<Save size={16} />} 
          onClick={handleSubmit} 
          disabled={submitting}
          className="rounded-lg shadow-md text-xs px-8 h-8 flex items-center"
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
      employee.getEmployeeById(SHOP_ID, id).then(res => {
        if (res?.data) {
          const emp = Array.isArray(res.data) ? res.data[0] : res.data;
          const datas = emp.datas || {};
          setFormData({
            name: emp.name || "",
            email: emp.email || "",
            role: emp.role || "staff",
            mobile_number: emp.mobile_number || "",
            address: datas.address?.full_address || "",
            zip_code: datas.address?.zip_code || "",
            joinDate: emp.joined_date || new Date().toISOString().split('T')[0],
            is_accepted: true,
            department: emp.department || "",
            salary_range: String(datas.salary_range || ""),
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
    const payload: any = {
      shop_id: SHOP_ID,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      mobile_number: formData.mobile_number,
      joined_date: formData.joinDate,
      department: formData.department,
    };
    
    const nestedData = {
      salary_range: Number(formData.salary_range) || 0,
      address: { 
        full_address: formData.address,
        zip_code: formData.zip_code
      }
    };

    if (id) {
      payload.id = id;
      payload.datas = nestedData;
    } else {
      payload.additional_infos = nestedData;
    }

    try {
      const res = id 
        ? await employee.updateEmployee(payload)
        : await employee.createEmployee(payload);

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
    } catch (_err: any) {
      showToast(_err.message || "Failed to save employee", "error");
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
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <div className="mx-auto space-y-4 relative">
        

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-start">
          
          {/* BOX 1: IDENTITY (Spans 6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <User size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800  ">Personal Identity</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1  ">System Role</label>
                  <ReusableSelect 
                    options={roleOptions}
                    value={formData.role}
                    onValueChange={(val) => handleSelectChange("role", val)}
                    placeholder="Select Permissions"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1  ">Department</label>
                  <ReusableSelect
                    options={departmentOptions}
                    value={formData.department}
                    onValueChange={(val) => handleSelectChange("department", val)}
                    placeholder="Select Department"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BOX 2: FINANCIAL & LIFECYCLE (Spans 3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <FileText size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800  ">Financial & Lifecycle</h2>
            </div>
            <div className="p-8 space-y-6">
              <Input
                label="Salary Range / CTC"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleChange}
                placeholder="e.g. 50000"
                leftIcon={<Tag size={16} className="text-slate-300" />}
              />
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

          {/* BOX 3: ADDRESS (Spans 3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <MapPin size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800  ">Residence & Work Location</h2>
            </div>
            <div className="p-8 space-y-6">
              <Input
                label="Physical Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street, Area, City"
                leftIcon={<MapPin size={16} className="text-slate-300" />}
              />
              <Input
                label="ZIP Code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="ZIP"
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

