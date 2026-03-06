import React from "react";
import { Users, Mail, ShieldCheck, UserPlus } from "lucide-react";
import Input from "@/components/ui/Input";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";
import { DynamicKeyValueSettings, KeyValueField } from "@/components/ui/DynamicKeyValueSettings";
import { EmployeeFormData } from "../types";
import { arrayToRecord } from "@/utils/form-helpers";
import { Required } from "@/components/ui/Require";

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Staff", value: "staff" },
];

const EmployeeForm: React.FC = () => {
  const [role, setRole] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [customFields, setCustomFields] = React.useState<KeyValueField[]>([]);

  const [errors, setErrors] = React.useState({ name: false, email: false, role: false });

  const handleSubmit = (action: "save" | "add_more") => {
    const hasErrors = {
      name: !name,
      email: !email,
      role: !role,
    };

    setErrors(hasErrors);

    if (Object.values(hasErrors).some(Boolean)) {
      return;
    }

    const additionalSettings = arrayToRecord(customFields);
    const payload: EmployeeFormData = { name, email, role, additionalSettings };

    console.log(`Action: ${action}`, payload);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 bg-white">
      
      {/* SECTION 1: ACCOUNT IDENTITY */}
      <section>
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-8">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <UserPlus size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Personnel Details</h3>
            <p className="text-sm text-gray-500">Configure basic account information and access levels.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              Employee Name <Required />
            </label>
            <Input
              name="name"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value) setErrors(prev => ({ ...prev, name: false }));
              }}
              leftIcon={<Users size={18} className="text-gray-400" />}
              className={errors.name ? "border-red-500 focus:ring-red-100" : "bg-gray-50/50"} 
            />
            {errors.name && <span className="text-[10px] text-red-500 font-medium italic">Identification is required</span>}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              Email Address <Required />
            </label>
            <Input
              name="email"
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
            {errors.email && <span className="text-[10px] text-red-500 font-medium italic">Valid email required</span>}
          </div>

          {/* Role Field */}
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
            {errors.role && <span className="text-[10px] text-red-500 font-medium italic">Please select a role</span>}
          </div>
        </div>
      </section>

      {/* SECTION 2: CUSTOM METADATA */}
      <section className="bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-200">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-slate-400" />
            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Extended Metadata</h4>
          </div>
          <p className="text-xs text-slate-500">Add custom attributes like Department, Date of Joining, or Employee ID.</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <DynamicKeyValueSettings 
            fields={customFields}
            onChange={setCustomFields} 
          />
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