import React from "react";

import Input from "@/components/ui/Input";
import { Users } from "lucide-react";

import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { GradientButton } from "@/components/ui/GradientButton";

const roleOptions = [
  { label: "Admin", value: "admin", },
  { label: "Manager", value: "manager" },
  { label: "Staff", value: "staff" },
];

const EmployeeForm = () => {
  const [role, setRole] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  return (
    <div className="space-y-6">

      {/* NAME FIELD */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
          Employee Name
        </label>
        <Input
          name="name"
          placeholder="Enter employee name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<Users size={16} />}
        />
      </div>

      {/* EMAIL FIELD */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
          Email Address
        </label>
        <Input
          name="email"
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Users size={16} />}
        />
      </div>

      {/* ROLE FIELD */}
      <div className="flex flex-col gap-2">
        <ReusableSelect
          options={roleOptions}
          label="Select Role"
          value={role}
          onValueChange={(val) => setRole(val)}
          placeholder="Choose a role"
        />
      </div>



      <div className=" flex justify-end gap-4 mt-10">
        <GradientButton variant="outline">cancel</GradientButton>
        <GradientButton>save</GradientButton>
        <GradientButton>save & add more</GradientButton>
      </div>
    </div>
  );
};

export default EmployeeForm;
