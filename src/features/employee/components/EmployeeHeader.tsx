import React, { useState } from "react";
import { EmployeeHeaderProps } from "../types";
import SearchActionCard from "@/components/ui/SearchActionCard";
import { PersonStanding } from "lucide-react";
import Title from "@/components/common/Title";
import { GradientButton } from "@/components/ui/GradientButton";
import { FloatingFormCard } from "@/components/common/FloatingFormCard";
import EmployeeForm from "../pages/EmployeeForm";
import { StatCard } from "@/components/common/StatsCard";



const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
  accepted,
  onSearchChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-3">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Title title="Employee" subtitle="Manage and track your workforce" />


        <GradientButton
          type="button"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Employee
        </GradientButton>

      </div>
      <div className='flex-none overflow-y-auto px-6 py-2.5 bg-accent'>
        <div className="flex gap-2.5 ">

          <StatCard
            label="Onboarding Progress"
            value={"17%"}
            icon={PersonStanding}
            iconBg="bg-green-50"
            iconColor="text-green-700"
          />
          <StatCard
            label="Active Employees"
            value={accepted}
            icon={PersonStanding}
            iconBg="bg-blue-50"
            iconColor="text-blue-700"
          />

        </div>
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