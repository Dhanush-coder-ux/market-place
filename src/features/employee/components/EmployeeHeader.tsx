import React, { useState } from "react";
import { EmployeeHeaderProps } from "../types";
import SearchActionCard from "@/components/ui/SearchActionCard";
import { PersonStanding, UserCircle2 } from "lucide-react";
import Title from "@/components/common/Title";
import { GradientButton } from "@/components/ui/GradientButton";
import { FloatingFormCard } from "@/components/common/FloatingFormCard";
import EmployeeForm from "../pages/EmployeeForm";
import StatsCard from "@/components/common/StatsCard";


const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
  accepted,
  onSearchChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 mb-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Title title="Employee" subtitle="Manage and track your workforce" icon={<UserCircle2 size={30} />} />
          
       <div className="gap-3 flex">
        <StatsCard
          label="Onboarding Progress"
          value="75%"
          icon={PersonStanding}
          color="green"
          description="75% of employees have completed onboarding"
        />
        <StatsCard
          label="Active Employees"
          value={accepted}
          icon={PersonStanding}
          color="blue"
          description="Currently active employees"
        />
</div>
          <GradientButton
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Employee
          </GradientButton>
       
      </div>


   

      <div className="w-full">
        <SearchActionCard
          searchValue={""}
          onSearchChange={onSearchChange}
          placeholder="Search Employees..."
        />
      </div>


      <FloatingFormCard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Employee"
        maxWidth="max-w-4xl"
      >
        <EmployeeForm />
      </FloatingFormCard>
    </div>
  );
};

export default EmployeeHeader;