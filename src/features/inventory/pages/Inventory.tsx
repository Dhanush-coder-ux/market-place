import { Boxes, Layers, Package, IndianRupee, Trash, RefreshCcw } from "lucide-react"; // 1. Added RefreshCcw
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

  // 2. Handler for the Refill Action
  const handleRefill = () => {
    console.log("Refill stock for:", selectedRows);
    // Add your stock update logic here (e.g., open a modal or call an API)
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

      {/* 3. Updated Bulk Action Bar */}
      {selectedRows.length > 0 && (
        <div className="p-3 my-5 flex justify-between items-center bg-blue-50 text-blue-800 rounded-lg border border-blue-200 shadow-sm">
          <p className="font-medium text-sm">
            {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
          </p>
          
          <div className="flex items-center gap-4">
            <div className="h-6 w-px bg-blue-200"></div>

            <button 
              className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors px-2"
              title="Delete Selected"
            >
              <Trash size={18} />
            </button>
          </div>
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