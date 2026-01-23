
import SearchActionCard from "../../../components/ui/SearchActionCard";
import type { InventoryHeaderProps } from "../types";
import { AlertTriangleIcon, Package, Package2, PackageX, RefreshCcw } from "lucide-react";
import HeaderCard from "../../../components/common/HeaderCard";
import { GradientButton } from "@/components/ui/GradientButton";
import Title from "@/components/common/Title";
import { FloatingFormCard } from "@/components/common/FloatingFormCard";
import { useState } from "react";
import InventoryForm from "../pages/InventoryForm";
import { useNavigate } from "react-router-dom";


const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  totalCount,
  lowestStockValue,
  onSearchChange,
}) => {
  // const [showAlert, setShowAlert] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigator =  useNavigate();
  return (
    <div>
    <div className="flex justify-between my-4"> 
      <Title title="Inventory" icon={<Package2 size={30}/>}/>
     
      </div>

      <div className="flex gap-3 justify-end items-end mb-4">
         <GradientButton
      type="button"
      onClick={()=>setIsModalOpen(true)}
      >
        {"+ Add Inventory"}
      </GradientButton>
         <GradientButton
         onClick={()=>navigator('/re-fill')}
         variant="outline"
         icon={ <RefreshCcw size={16} />}
              title="Refill Stock"
            >

              Refill Stock
            </GradientButton>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
 
    <HeaderCard 
      value={totalCount}
      title="Total product Stock"
      subtitle="Items below threshold"
      icon={Package}
      theme="green"
    />
    
    <HeaderCard
      value={lowestStockValue}
      title="Low Stock Items"
      subtitle="Items below threshold"
      icon={PackageX}
      theme="red"
    />
    <HeaderCard
      value={lowestStockValue}
      title="Out of Stock Items"
      subtitle="Items below threshold"
      icon={AlertTriangleIcon}
      theme="yellow"
    />
 
   
      {/* <LowStockNotification 
      show={showAlert}
      lowestStockValue={lowestStockValue}
      onClose={()=>setShowAlert(false)}

      /> */}
    </div>
       <SearchActionCard
        searchValue={""}
        onSearchChange={onSearchChange}
        placeholder="Search products..."
      
      />

      <FloatingFormCard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Inventory Item"
        maxWidth="max-w-4xl"
      >
        <InventoryForm/>
      </FloatingFormCard>
    </div>
  );
};

export default InventoryHeader; 