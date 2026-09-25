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
  Tag,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import Input from "@/components/ui/Input"; 
import { ReusableSelect } from "@/components/ui/ReusableSelect"; 
import { GradientButton } from "@/components/ui/GradientButton";
import { useBusinessApi } from "@/context/BusinessApiContext";
import { SHOP_ID } from "@/services/endpoints";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { NavigationBlocker } from "@/components/common/NavigationBlocker";
import { subscriptionApi } from "@/services/api/subscription";
import { employeeApi } from "@/services/api/employee";

const roleOptions = [
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "Admin", value: "ADMIN" },
  { label: "Biller", value: "BILLER" },
];

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { employee } = useBusinessApi();
  const { setActions, setBottomActions, setBreadcrumbOverride } = useHeader();
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      if (setBreadcrumbOverride) setBreadcrumbOverride(null);
    };
  }, [setBreadcrumbOverride]);

  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(!!id);
  const [limitStatus, setLimitStatus] = useState<{
    isReached: boolean;
    isExpired: boolean;
    currentCount: number;
    maxCount: number;
  }>({
    isReached: false,
    isExpired: false,
    currentCount: 0,
    maxCount: 2,
  });

  // Check subscription limits on new employee addition
  useEffect(() => {
    if (!id) {
      Promise.all([
        subscriptionApi.getCurrentSubscription(SHOP_ID).catch(() => null),
        employeeApi.getEmployeesByShop(SHOP_ID).catch(() => null),
      ]).then(([subRes, empRes]) => {
        const isExpired = subRes?.status === "expired";
        const maxUsers = subRes?.limits?.max_users || 2;
        
        let empCount = 0;
        if (empRes?.data?.datas && Array.isArray(empRes.data.datas)) {
          empCount = empRes.data.datas.length;
        } else if (empRes?.datas && Array.isArray(empRes.datas)) {
          empCount = empRes.datas.length;
        } else if (Array.isArray(empRes?.data)) {
          empCount = empRes.data.length;
        } else if (Array.isArray(empRes)) {
          empCount = empRes.length;
        }

        const isReached = isExpired || empCount >= maxUsers;
        setLimitStatus({
          isReached,
          isExpired,
          currentCount: empCount,
          maxCount: maxUsers,
        });
      });
    }
  }, [id]);
  
  const initialFormData = {
    name: "",
    email: "",
    role: "ADMIN",
    mobile_number: "",
    address: "",
    zip_code: "",
    joinDate: new Date().toISOString().split('T')[0],
    is_accepted: true,
    salary_range: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Header Actions
  useEffect(() => {
    setActions(null);
  }, [setActions]);

  useEffect(() => {
    const isBlocked = !id && limitStatus.isReached;
    setBottomActions(
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
        {!id && (
          <button 
            type="button"
            onClick={handleSaveDraft}
            disabled={isBlocked}
            className="px-4 h-8 rounded-lg border border-blue-100 text-blue-600 font-bold text-xs bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center gap-2 whitespace-nowrap overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Bookmark size={14} className="shrink-0" />
            <span className="truncate">Save Draft</span>
          </button>
        )}
        <GradientButton 
          icon={<Save size={16} />} 
          onClick={handleSubmit} 
          disabled={submitting || isBlocked}
          className="rounded-lg shadow-md text-xs px-8 h-8 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "..." : (id ? "Save Changes" : "Create Member")}
        </GradientButton>
      </div>
    );
    return () => setBottomActions(null);
  }, [setBottomActions, submitting, id, formData, limitStatus]);

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
      setLoadingData(false);
    } else if (id) {
      employee.getEmployeeById(SHOP_ID, id).then(res => {
        if (res?.data) {
          const empData = Array.isArray(res.data) ? res.data[0] : res.data;
          const datas = empData.datas || {};
          const addr = datas.address || {};
          const additional = empData.additional_infos || {};

          setFormData({
            ...initialFormData,
            name: empData.name || "",
            email: empData.email || "",
            role: empData.role || "ADMIN",
            mobile_number: empData.mobile_number || "",
            joinDate: empData.joined_date ? empData.joined_date.split('T')[0] : new Date().toISOString().split('T')[0],
            address: addr.full_address || "",
            zip_code: addr.zip_code || "",
            salary_range: String(datas.salary_range || additional.salary_range || ""),
          });

          if (empData.ui_id && setBreadcrumbOverride) {
            setBreadcrumbOverride(empData.ui_id);
          }
        }
      }).finally(() => setLoadingData(false));
    } else {
      setLoadingData(false);
    }
  }, [id, employee, searchParams, showToast]);

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
    if (!id && limitStatus.isReached) {
      showToast(
        limitStatus.isExpired 
          ? "Subscription expired. Please renew your plan." 
          : `User limit reached (${limitStatus.currentCount}/${limitStatus.maxCount}). Upgrade plan or add extra users.`, 
        "error"
      );
      return;
    }

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

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <NavigationBlocker data={formData} isLoading={loadingData} isSubmitting={submitting} />
      <div className="mx-auto space-y-4 relative">
        
        {/* LIMIT ALERT BANNER */}
        {!id && limitStatus.isReached && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-900 flex items-center justify-between shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold">
                  {limitStatus.isExpired ? "Subscription Expired" : "Staff / User Limit Reached"}
                </h4>
                <p className="text-xs text-red-700 mt-0.5">
                  {limitStatus.isExpired 
                    ? "Your subscription is expired. You cannot add new staff members until renewed." 
                    : `You have reached the maximum allowed staff limit (${limitStatus.currentCount}/${limitStatus.maxCount} users). Please upgrade your plan or add an Extra User add-on.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow transition-all shrink-0 ml-4"
            >
              <span>{limitStatus.isExpired ? "Renew Plan" : "Upgrade Plan"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

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
                <div>
                  <Input 
                    label="Full Name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. John Doe"
                    className="font-medium focus:border-blue-500 rounded-lg text-xs"
                    leftIcon={<User size={16} />}
                  />
                </div>
                <div>
                  <Input 
                    label="Email Address" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    disabled={!!id} 
                    placeholder="john@example.com"
                    className="font-medium focus:border-blue-500 rounded-lg text-xs"
                    leftIcon={<Mail size={16} />}
                  />
                </div>
                <div>
                  <Input 
                    label="Mobile Number" 
                    name="mobile_number" 
                    value={formData.mobile_number} 
                    onChange={handleChange} 
                    placeholder="+91 9876543210"
                    className="font-medium focus:border-blue-500 rounded-lg text-xs"
                    leftIcon={<Phone size={16} />}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BOX 2: WORK & ACCESS (Spans 3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Tag size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800  ">Role & Joining</h2>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <ReusableSelect 
                  label="Role" 
                  value={formData.role} 
                  onValueChange={handleRoleChange} 
                  options={roleOptions} 
                />
              </div>
              <div>
                <Input 
                  label="Joined Date" 
                  name="joinDate" 
                  type="date" 
                  value={formData.joinDate} 
                  onChange={handleChange} 
                  className="font-medium focus:border-blue-500 rounded-lg text-xs"
                  leftIcon={<Calendar size={16} />}
                />
              </div>
            </div>
          </div>

          {/* BOX 3: ADDRESS & FINANCIALS (Spans 3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <MapPin size={18} />
              </div>
              <h2 className="text-xs font-bold text-slate-800  ">Location & Financials</h2>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <Input 
                  label="Salary Range / Expectation" 
                  name="salary_range" 
                  value={formData.salary_range} 
                  onChange={handleChange} 
                  placeholder="e.g. 50000"
                  className="font-medium focus:border-blue-500 rounded-lg text-xs"
                  leftIcon={<FileText size={16} />}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input 
                    label="Address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    placeholder="Street, City, State"
                    className="font-medium focus:border-blue-500 rounded-lg text-xs"
                    leftIcon={<MapPin size={16} />}
                  />
                </div>
                <div>
                  <Input 
                    label="Zip Code" 
                    name="zip_code" 
                    value={formData.zip_code} 
                    onChange={handleChange} 
                    placeholder="123456"
                    className="font-medium focus:border-blue-500 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
