import React from "react";
import { 
  Users, Mail, UserPlus, Phone, 
  MapPin, Briefcase, Calendar, Hash 
} from "lucide-react";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import { Required } from "@/components/ui/Require";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { useParams, useNavigate } from "react-router-dom";

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Staff", value: "staff" },
];



const EmployeeForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { postData, putData, getData, loading } = useApi();
  // --- State Management ---
  const [name, setName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [role, setRole] = React.useState<string>("");
  const [phone, setPhone] = React.useState<string>("");
  const [address, setAddress] = React.useState<string>("");
  const [joinDate, setJoinDate] = React.useState<string>("");
  
  React.useEffect(() => {
    if (id) {
      const fetchEmployee = async () => {
        const res = await getData(`${ENDPOINTS.EMPLOYEES}/by/${id}`);
        if (res && res.data) {
          const emp = res.data;
          setName(emp.name || emp.datas?.name || "");
          setEmail(emp.email || emp.datas?.email || "");
          setRole(emp.role || emp.datas?.role || "");
          setPhone(emp.mobile_number || emp.datas?.mobile_number || "");
          setAddress(emp.address || emp.datas?.address || "");
          setJoinDate(emp.joinDate || emp.datas?.joinDate || "");
        }
      };
      fetchEmployee();
    }
  }, [id]);

  const [errors, setErrors] = React.useState({ name: false, email: false, role: false });

  const handleSubmit = async (action: "save" | "add_more") => {
    const hasErrors = {
      name: !name,
      email: !email,
      role: !role,
    };
    
    setErrors(hasErrors);
    
    if (hasErrors.name || hasErrors.email || hasErrors.role) {
      return;
    }

    const payload = {
      datas: { 
        name, 
        email, 
        role, 
        mobile_number: phone, 
        address, 
        joinDate, 
        shop_id: SHOP_ID,
        id,
        type: id ? "EMPLOYEE UPDATE" : "EMPLOYEE CREATE" 
      }
    };

    let res;
    if (id) {
      res = await putData(`${ENDPOINTS.EMPLOYEES}`, payload);
    } else {
      res = await postData(ENDPOINTS.EMPLOYEES, payload);
    }

    if (res && action === "save") {
      navigate("/employee");
    } else if (res && action === "add_more") {
      setName(""); setEmail(""); setRole(""); setPhone(""); setAddress(""); setJoinDate("");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 bg-white">
      
      {/* SECTION 1: PERSONNEL DETAILS */}
      <section>
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-8">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <UserPlus size={22} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Personnel Details</h3>
            <p className="text-sm text-gray-500">Basic account information and system access.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              Employee Name <Required />
            </label>
            <Input
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value) setErrors(prev => ({ ...prev, name: false }));
              }}
              leftIcon={<Users size={18} className="text-slate-400" />}
              className={errors.name ? "border-red-500" : "bg-slate-50/50"} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              Email Address <Required />
            </label>
            <Input
              type="email"
              placeholder="john@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value) setErrors(prev => ({ ...prev, email: false }));
              }}
              leftIcon={<Mail size={18} className="text-slate-400" />}
              className={errors.email ? "border-red-500" : "bg-slate-50/50"}
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
               System Role <Required />
            </label>
            <ReusableSelect
              options={roleOptions}
              value={role}
              onValueChange={(val) => {
                 setRole(val);
                 if (val) setErrors(prev => ({ ...prev, role: false }));
              }}
              placeholder="Assign Permissions"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: CONTACT & ADDRESS */}
      <section>
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-8">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <MapPin size={22} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Contact Information</h3>
            <p className="text-sm text-gray-500">Reach details and physical office location.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
            <Input
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone size={18} className="text-slate-400" />}
              className="bg-slate-50/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Work Address</label>
            <Input
              placeholder="123 Business Ave, Suite 100"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              leftIcon={<MapPin size={18} className="text-slate-400" />}
              className="bg-slate-50/50"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: EMPLOYMENT DETAILS */}
      <section>
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-8">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Briefcase size={22} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Employment Details</h3>
            <p className="text-sm text-gray-500">Internal IDs and departmental organization.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Employee ID</label>
            <Input
              placeholder="EMP-1002"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              leftIcon={<Hash size={18} className="text-slate-400" />}
              className="bg-slate-50/50"
            />
          </div> */}

   

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Joining Date</label>
            <Input
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              leftIcon={<Calendar size={18} className="text-slate-400" />}
              className="bg-slate-50/50"
            />
          </div>
        </div>
      </section>

      {/* ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-slate-100">
        <button 
          onClick={() => console.log('Cancel')}
          className="text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors px-4 py-2"
        >
          Discard Changes
        </button>

        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <GradientButton 
            variant="outline" 
            onClick={() => handleSubmit("add_more")}
            className="border-slate-200"
            disabled={loading}
          >
            Save & Add Another
          </GradientButton>
          <GradientButton 
            onClick={() => handleSubmit("save")}
            className="min-w-[140px] shadow-lg shadow-emerald-100"
            disabled={loading}
          >
            {loading ? (id ? "Updating..." : "Creating...") : (id ? "Update Employee" : "Create Employee")}
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;