import React, { useState } from "react"
import { EmployeeHeaderProps } from "../types"
import SearchActionCard from "@/components/ui/SearchActionCard"
import HeaderCard from "@/components/common/HeaderCard"
import {  PersonStanding, UserCircle2, UserX } from "lucide-react"
import Title from "@/components/common/Title"
import { GradientButton } from "@/components/ui/GradientButton"
import { FloatingFormCard } from "@/components/common/FloatingFormCard"
import EmployeeForm from "../pages/EmployeeForm"


const EmployeeHeader:React.FC<EmployeeHeaderProps> = ({
    accepted,
    notAccepted,
   
    onSearchChange
}) => {

  const [modelShow, SetIsModelShow ] = useState(false);
  return (
    <div className="my-4">
         <div className="flex justify-between mb-4"> 
      <Title title="Employee" icon={<UserCircle2 size={30}/>}/>
    
      </div>
      <div className="flex justify-end items-end mb-4">
          <GradientButton
      type="button"
      onClick={()=>SetIsModelShow(true)}
      >
        {"+ Add Employee"}
      </GradientButton>
      </div>
    
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
    
  
    </div>
        <SearchActionCard
      searchValue={""}
      onSearchChange={onSearchChange}
      placeholder="Search Employees"
      />
      <FloatingFormCard
        isOpen={modelShow}
        onClose={() => SetIsModelShow(false)}
        title="Add New Employee"
        maxWidth="max-w-4xl"
      >
        <EmployeeForm/>
      </FloatingFormCard>
     </div>
  )
}

export default EmployeeHeader
