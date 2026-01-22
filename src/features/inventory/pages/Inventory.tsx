import { Boxes, Layers, Package, IndianRupee, Trash } from "lucide-react"; // Import IndianRupee if available or use generic
import Table from "../../../components/common/Table";
import InventoryHeader from "../components/InventoryHeader";
import { useState } from "react";
import Drawer from "../../../components/common/Drawer";
import DetailView from "../../../components/common/DetaileView";

const Inventory = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]); 
  const [isOpen, setIsopen] = useState(false);

  const Hello = () => {
    console.log("hello");
  };

  const columns = [
    { key: "barcode", label: "BarCode" },
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "buyprice", label: "Buy Price" },
    { key: "sellprice", label: "Sell Price" },
    { key: "stock", label: "Stock" },
  ];

  const data = [
    { barcode: 1, name: "Dhanush", description: "A product", buyprice: 21, sellprice: 25, stock: 2344 },
    { barcode: 2, name: "Zoya", description: "Another product", buyprice: 20, sellprice: 24, stock: 44553 },
    { barcode: 3, name: "Zoya", description: "Yet another product", buyprice: 20, sellprice: 24, stock: 550 },
    { barcode: 4, name: "Zoya", description: "Yet another product", buyprice: 20, sellprice: 24, stock: 44555 },
  ];

  const handleRowClick = (row: any) => {
    setSelectedItem(row);
    setIsopen(true);
  };

  return (
    <div>
      <InventoryHeader
        searchValue="hello"
        lowestStockValue={10}
        onSearchChange={() => Hello()}
        totalCount={10}
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
        rowKey="barcode" 
        onRowClick={(row) => handleRowClick(row)}
        selectedIds={selectedRows}
        onSelectionChange={setSelectedRows}
      />

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsopen(false)}
        title="Inventory Details"
      >
        {selectedItem && (
          <DetailView
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
                    label: "Description",
                    value: selectedItem.description, 
                  },
                ],
              },
              {
                title: "Stock Information",
                fields: [
                  {
                    icon: <Boxes size={20} />,
                    label: "Available Stock",
                    value: selectedItem.stock, 
                  },
                  {
                    icon: <IndianRupee size={20} />, 
                    label: "Sell Price",
                    value: `₹${selectedItem.sellprice}`, 
                  },
                ],
              },
            ]}
            onEdit={() => console.log("Edit clicked")}
            onDelete={() => console.log("Delete clicked")}
          />
        )}
      </Drawer>
    </div>
  );
};

export default Inventory;