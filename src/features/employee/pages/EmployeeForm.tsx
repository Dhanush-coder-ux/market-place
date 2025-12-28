import React from "react";
import FormCard from "@/components/common/FormCard";
import Title from "@/components/common/Title";
import Input from "@/components/ui/Input";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { FormButton } from "@/features/inventory/components/HelperFunctions";

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
      {/* PAGE HEADER */}
      <div className="flex items-center gap-2">
        <Link to="/employee">
          <Title title="Employees" icon={<Users size={30} />} />
        </Link>
        <Title title="/ Employee Management" />
      </div>

      {/* FORM CARD */}
      <FormCard>
        

          {/* NAME FIELD */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
              Employee Name
            </label>
            <Input
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
       

        <FormButton
        label="Save Employee"
        />
       
      </FormCard>
    </div>
  );
};

export default EmployeeForm;
