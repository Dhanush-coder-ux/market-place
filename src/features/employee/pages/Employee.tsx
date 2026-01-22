import { Layers, TicketPlus, Trash, Users2 } from "lucide-react"
import EmployeeHeader from "../components/EmployeeHeader"
import Table from "@/components/common/Table"
import { useState } from "react"
import Drawer from "@/components/common/Drawer"
import DetailView from "@/components/common/DetaileView"


const Employee = () => {
  const [ Isopen, setIsOpen ] = useState(false);
  const [ selectedItem, setSelectedItem ] = useState<any>(null);
    const [selectedRows, setSelectedRows] = useState<any[]>([]); // Stores Barcodes
   const columns = [
    {key:"employeeId",label:"Employee Id"},
   {key:"Role",label:'Role'}, 
  { key: "name", label: "Name" },
  { key: "age", label: "Age" },
  { key: "email", label: "Email" },
  { key: "isAccepted", label: "isAccepted" },
 
];

const data = [
  {employeeId:1, Role: "Admin", name: "Dhanush", age: 21, email: "dhanush@gmail.com", isAccepted:"not accepted"},
  {employeeId:2, Role: "Employee", name: "Zoya", age: 20, email: "zoya@gmail.com",isAccepted:"accepted" },
];
const handleRowClick =(row:any) => {
    setSelectedItem(row)
    setIsOpen(true)
}
  return (
    <div>

      <EmployeeHeader
      accepted={10}
      notAccepted={3}
      searchValue="siva"
      onSearchChange={()=>("")}
      />
          {selectedRows.length > 0 && (
        <div className="p-2 my-5 flex justify-between bg-blue-100 text-blue-800 rounded mb-2">
          <p>{selectedRows.length} items selected for action</p>
          <Trash size={18} className="text-red-400 hover:text-red-600"/>

        </div>
      )}
      <Table
      className="mt-5"
        columns={columns}
        data={data}
        onRowClick={(row)=>handleRowClick(row)}
        selectedIds={selectedRows}
        onSelectionChange={setSelectedRows}
        rowKey="employeeId"
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
              label: "Status",
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
