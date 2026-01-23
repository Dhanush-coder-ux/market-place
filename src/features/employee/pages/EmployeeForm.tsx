import React from "react";
import Input from "@/components/ui/Input";
import { Users } from "lucide-react";
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

  const handleSubmit = () => {
    // Check for errors
    const hasErrors = {
      name: !name,
      email: !email,
      role: !role,
    };

    // Update UI to show red borders if missing
    setErrors(hasErrors);

    // Stop if any error exists
    if (Object.values(hasErrors).some(Boolean)) {
      alert("Please fill in all mandatory fields marked with *");
      return;
    }

    const additionalSettings = arrayToRecord(customFields);

    const payload: EmployeeFormData = {
      name,
      email,
      role,
      additionalSettings,
    };

    console.log("Submitting:", payload);
  };

  return (
    <div className="space-y-6">
      
      {/* --- NAME FIELD --- */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 font-semibold uppercase ml-1 flex">
          Employee Name <Required/> {/* <--- Added here */}
        </label>
        <Input
          name="name"
          placeholder="Enter employee name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (e.target.value) setErrors(prev => ({ ...prev, name: false }));
          }}
          leftIcon={<Users size={16} />}
          // Optional: Add a visual error state to your Input component if it supports it
          className={errors.name ? "border-red-500 focus:ring-red-500" : ""} 
        />
        {errors.name && <span className="text-xs text-red-500 ml-1">Name is required</span>}
      </div>

      {/* --- EMAIL FIELD --- */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase ml-1 flex">
          Email Address <Required /> {/* <--- Added here */}
        </label>
        <Input
          name="email"
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (e.target.value) setErrors(prev => ({ ...prev, email: false }));
          }}
          leftIcon={<Users size={16} />}
          className={errors.email ? "border-red-500 focus:ring-red-500" : ""}
        />
        {errors.email && <span className="text-xs text-red-500 ml-1">Email is required</span>}
      </div>

      {/* --- ROLE FIELD --- */}
      <div className="flex flex-col gap-2">
        {/* For Custom Components, we usually just pass it in the string label 
            unless your ReusableSelect supports a 'required' prop */}
        <ReusableSelect
          options={roleOptions}
          label="Select Role"
          required={<Required/>} 
          value={role}
          onValueChange={(val) => {
             setRole(val);
             if (val) setErrors(prev => ({ ...prev, role: false }));
          }}
          placeholder="Choose a role"
        />
        {errors.role && <span className="text-xs text-red-500 ml-1">Role is required</span>}
      </div>

      <hr className="border-gray-200 dark:border-gray-700 my-4" />

      <DynamicKeyValueSettings 
        label="Employee Metadata"
        fields={customFields}
        onChange={setCustomFields} 
      />

      <div className="flex justify-end gap-4 mt-10">
        <GradientButton onClick={handleSubmit}>Save & Add More</GradientButton>
        <GradientButton onClick={handleSubmit}>Save</GradientButton>
        <GradientButton variant="danger">Cancel</GradientButton>
      </div>
    </div>
  );
};

export default EmployeeForm;