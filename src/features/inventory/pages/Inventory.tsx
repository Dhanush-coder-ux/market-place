import { Boxes, Layers, Package, Package2 } from "lucide-react"
import Table from "../../../components/common/Table"
import Title from "../../../components/common/Title"
import InventoryHeader from "../components/InventoryHeader"
import { useState } from "react"
import Drawer from "../../../components/common/Drawer"
import DetailView from "../../../components/common/DetaileView"


const Inventory = () => {
  const [ selectedItem,setSelectedItem ] = useState<any>(null);
  const [ isOpen, setIsopen ] = useState(false);
  const Hello = ()=>{
    console.log("hello")
  }
  const columns = [
  { key: "barcode", label: "BarCode" },
  { key: "name", label: "Name" },
  { key: "price", label: "Price" },
  { key: "stock", label: "Stock" },
];

const data = [
  { barcode: 1, name: "Dhanush", price: 21, stock: 2344},
  { barcode: 2, name: "Zoya", price: 20, stock: 44553},
  { barcode: 3, name: "Zoya", price: 20, stock:550 },
  { barcode: 4, name: "Zoya", price: 20, stock: 44555 },
];
const handleRowClick =(row:any) => {
  setSelectedItem(row);
  setIsopen(true);
}

  return (
    <div>
      <Title title="Inventory" icon={<Package2 size={30}/>}/>
      <InventoryHeader searchValue="hello" lowestStockLabel="Low Stock" lowestStockValue={10} onSearchChange={()=>Hello()} totalCount={10}/>
       <Table
      columns={columns}
      data={data}
      onRowClick={(row)=>handleRowClick(row)}
       />
    <Drawer
        isOpen={isOpen}
        onClose={() => setIsopen(false)}
        title="Inventory Details"
      >
    {selectedItem &&     <DetailView
      title="Inventory Details"
      sections={[
        {
          title: "Basic Information",
          fields: [
            {
              icon: <Package size={20} />,
              label: "Product Name",
              value: selectedItem.name,
            },
            {
              icon: <Layers size={20} />,
              label: "Category",
              value: selectedItem.email,
            },
          ],
        },
        {
          title: "Stock Information",
          fields: [
            {
              icon: <Boxes size={20} />,
              label: "Available Stock",
              value: selectedItem.age,
            },
            {
              icon: <Package size={20} />,
              label: "Price",
              value: `₹${selectedItem.price}`,
            },
          ],
        },
      ]}
  onEdit={() => console.log("Edit clicked")}
  onDelete={() => console.log("Delete clicked")}
/>  }   
      </Drawer>

    </div> 
  )
}

export default Inventory
