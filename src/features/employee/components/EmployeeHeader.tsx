import React from "react"
import { EmployeeHeaderProps } from "../types"
import SearchActionCard from "@/components/ui/SearchActionCard"
import HeaderCard from "@/components/common/HeaderCard"
import { PersonStanding, UserX } from "lucide-react"


const EmployeeHeader:React.FC<EmployeeHeaderProps> = ({
    accepted,
    notAccepted,
    searchValue,
    onSearchChange
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-10">
  
      <HeaderCard
      title="Total Employees"
      subtitle="Accepted employees"
      value={accepted}
      theme="blue"
      icon={PersonStanding}
      />
      <HeaderCard
      title="Denied Persons"
      subtitle="Not Accepted employees"
      value={notAccepted}
      theme="red"
      icon={UserX}
      />
    
      <SearchActionCard
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      placeholder="Search Employees"
      buttonLabel="+ New"
      buttonLink="/employee/add"
      />
    </div>
  )
}

export default EmployeeHeader
