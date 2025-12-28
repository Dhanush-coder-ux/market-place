import { Layers, TicketPlus, Users, Users2 } from "lucide-react"
import Title from "../../../components/common/Title"
import EmployeeHeader from "../components/EmployeeHeader"
import Table from "@/components/common/Table"
import { useState } from "react"
import Drawer from "@/components/common/Drawer"
import DetailView from "@/components/common/DetaileView"
import { Link } from "react-router-dom"

const Employee = () => {
  const [ Isopen, setIsOpen ] = useState(false);
  const [ selectedItem, setSelectedItem ] = useState<any>(null);
   const columns = [
   {key:"Role",label:'Role'}, 
  { key: "name", label: "Name" },
  { key: "age", label: "Age" },
  { key: "email", label: "Email" },
  { key: "isAccepted", label: "isAccepted" },
 
];

const data = [
  {id:1, Role: "Admin", name: "Dhanush", age: 21, email: "dhanush@gmail.com", isAccepted:"not accepted"},
  {id:2, Role: "Employee", name: "Zoya", age: 20, email: "zoya@gmail.com",isAccepted:"accepted" },
];
const handleRowClick =(row:any) => {
    setSelectedItem(row)
    setIsOpen(true)
}
  return (
    <div>
       
      <Title icon={<Users size={30}/>} title="Employees" subtitle="Manage your employee information and details" />  

      <EmployeeHeader
      accepted={10}
      notAccepted={3}
      searchValue="siva"
      onSearchChange={()=>("")}
      />
      <Table
        columns={columns}
        data={data}
        onRowClick={(row)=>handleRowClick(row)}
      />
      <Drawer
      isOpen={Isopen}
      onClose={()=>setIsOpen(false)}
      title="Employee Details"
      >
      {selectedItem && <DetailView
       title="Employee Details"
      sections={[
        {
          title: "Basic Information",
          fields: [
            {
              icon: <Users2 size={20} />,
              label: "Employee Role",
              value: selectedItem.Role,
            },
            {
              icon: <Layers size={20} />,
              label: "Name",
              value: selectedItem.name,
            },

         
          ],
        },
        {
          title: "important Information",
          fields: [
               {
              icon: <Layers size={20} />,
              label: "email",
              value: selectedItem.email,
            },
            {
              icon: <TicketPlus size={20} />,
              label: "Price",
              value: selectedItem.isAccepted,
            },
          ],
        },
      ]}
  onEdit={() => console.log("Edit clicked")}
  onDelete={() => console.log("Delete clicked")}
      />}
       
        
      </Drawer>

    </div>
  )
}

export default Employee
