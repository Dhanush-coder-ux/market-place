import React from "react";
import { 
  Users, Mail, UserPlus, Phone, 
  MapPin, Briefcase, Calendar, Hash 
} from "lucide-react";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";

import { arrayToRecord } from "@/utils/form-helpers";
import { Required } from "@/components/ui/Require";

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Staff", value: "staff" },
];

const departmentOptions = [
  { label: "Engineering", value: "eng" },
  { label: "Human Resources", value: "hr" },
  { label: "Marketing", value: "mkt" },
  { label: "Sales", value: "sales" },
];

const EmployeeForm: React.FC = () => {
  // --- State Management ---
  const [name, setName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [role, setRole] = React.useState<string>("");
  const [phone, setPhone] = React.useState<string>("");
  const [address, setAddress] = React.useState<string>("");
  const [department, setDepartment] = React.useState<string>("");
  const [employeeId, setEmployeeId] = React.useState<string>("");
  const [joinDate, setJoinDate] = React.useState<string>("");
  

  const [errors, setErrors] = React.useState({ name: false, email: false, role: false });

  const handleSubmit = (action: "save" | "add_more") => {
    const hasErrors = {
      name: !name,
      email: !email,
      role: !role,
    };

    setErrors(hasErrors);

  };

  return (
    <div className="mx-auto p-6 space-y-12 bg-white">
      
      {/* SECTION 1: PERSONNEL DETAILS */}
      <section>
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-8">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <UserPlus size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Personnel Details</h3>
            <p className="text-sm text-gray-500">Basic account information and system access.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              Employee Name <Required />
            </label>
            <Input
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value) setErrors(prev => ({ ...prev, name: false }));
              }}
              leftIcon={<Users size={18} className="text-gray-400" />}
              className={errors.name ? "border-red-500" : "bg-gray-50/50"} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
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
              leftIcon={<Mail size={18} className="text-gray-400" />}
              className={errors.email ? "border-red-500" : "bg-gray-50/50"}
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
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
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-8">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <MapPin size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
            <p className="text-sm text-gray-500">Reach details and physical office location.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
            <Input
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone size={18} className="text-gray-400" />}
              className="bg-gray-50/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Work Address</label>
            <Input
              placeholder="123 Business Ave, Suite 100"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              leftIcon={<MapPin size={18} className="text-gray-400" />}
              className="bg-gray-50/50"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: EMPLOYMENT DETAILS */}
      <section>
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-8">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Briefcase size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Employment Details</h3>
            <p className="text-sm text-gray-500">Internal IDs and departmental organization.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Employee ID</label>
            <Input
              placeholder="EMP-1002"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              leftIcon={<Hash size={18} className="text-gray-400" />}
              className="bg-gray-50/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Department</label>
            <ReusableSelect
              options={departmentOptions}
              value={department}
              onValueChange={setDepartment}
              placeholder="Select Department"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Joining Date</label>
            <Input
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              leftIcon={<Calendar size={18} className="text-gray-400" />}
              className="bg-gray-50/50"
            />
          </div>
        </div>
      </section>

      {/* ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-100">
        <button 
          onClick={() => console.log('Cancel')}
          className="text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors px-4 py-2"
        >
          Discard Changes
        </button>

        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <GradientButton 
            variant="outline" 
            onClick={() => handleSubmit("add_more")}
            className="border-gray-200"
          >
            Save & Add Another
          </GradientButton>
          <GradientButton 
            onClick={() => handleSubmit("save")}
            className="min-w-[140px] shadow-lg shadow-emerald-100"
          >
            Create Employee
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;