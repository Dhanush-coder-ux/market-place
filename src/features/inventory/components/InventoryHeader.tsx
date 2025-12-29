import React, { useState } from "react";
import SearchActionCard from "../../../components/ui/SearchActionCard";
import type { InventoryHeaderProps } from "../types";
import LowStockNotification from "./LowStockNotification";
import { Package, PackageX } from "lucide-react";
import HeaderCard from "../../../components/common/HeaderCard";


const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  totalCount,
  lowestStockValue,
  lowestStockLabel,
  searchValue,
  onSearchChange,
}) => {
  const [showAlert, setShowAlert] = useState(false);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
 
    <HeaderCard 
      value={totalCount}
      title="Total Inventory Stock"
      subtitle="Items below threshold"
      icon={Package}
      theme="blue"
    />
    <div onClick={()=>setShowAlert(true)}>
    <HeaderCard
      value={lowestStockValue}
      title={lowestStockLabel}
      subtitle="Items below threshold"
      icon={PackageX}
      theme="red"
    />
    </div>
 
      
      <SearchActionCard
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        placeholder="Search products..."
        buttonLabel="+ New"
        buttonLink="/inventory/add"
      />
      <LowStockNotification 
      show={showAlert}
      lowestStockValue={lowestStockValue}
      onClose={()=>setShowAlert(false)}

      />
    </div>
  );
};

export default InventoryHeader;
