import { EmployeeHeaderProps } from "../types";
import SearchActionCard from "@/components/ui/SearchActionCard";
import { PersonStanding } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { StatCard } from "@/components/common/StatsCard";
import { useNavigate } from "react-router-dom";



const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
  accepted,
  onSearchChange,
}) => {
const navigate = useNavigate();

  return (
    <div className="flex flex-col space-y-3">

      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">

        <GradientButton
          type="button"
          onClick={() => navigate("/employee/add")}
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


    </div>
  );
};

export default EmployeeHeader;