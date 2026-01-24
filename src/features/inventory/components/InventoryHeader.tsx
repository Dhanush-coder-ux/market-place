import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangleIcon, Package, Package2, PackageX, RefreshCcw } from "lucide-react";

import SearchActionCard from "../../../components/ui/SearchActionCard";
import HeaderCard from "../../../components/common/HeaderCard";
import { GradientButton } from "@/components/ui/GradientButton";
import Title from "@/components/common/Title";
import { FloatingFormCard } from "@/components/common/FloatingFormCard";
import InventoryForm from "../pages/InventoryForm";
import type { InventoryHeaderProps } from "../types";

const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  totalCount,
  lowestStockValue,
  onSearchChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigator = useNavigate();

  return (
    <div className="flex flex-col gap-6 mb-6">
      

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Title title="Inventory" icon={<Package2 size={30} />} />

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <GradientButton
            onClick={() => navigator("/re-fill")}
            variant="outline"
            icon={<RefreshCcw size={16} />}
            title="Refill Stock"
          >
            Refill Stock
          </GradientButton>

          <GradientButton 
            type="button" 
            onClick={() => setIsModalOpen(true)}
          >
            + Add Inventory
          </GradientButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
        <HeaderCard
          value={totalCount}
          title="Total Stock"
          subtitle="Total items on hand"
          icon={Package}
          theme="blue" 
        />

        <HeaderCard
          value={lowestStockValue}
          title="Low Stock"
          subtitle="Items below threshold"
          icon={AlertTriangleIcon}
          theme="yellow" 
        />

        <HeaderCard
          value={0} 
          title="Out of Stock"
          subtitle="Urgent replenishment needed"
          icon={PackageX}
          theme="red"
        />
      </div>


      <div className="w-full">
        <SearchActionCard
          searchValue={""}
          onSearchChange={onSearchChange}
          placeholder="Search products..."
        />
      </div>

      <FloatingFormCard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Inventory Item"
        maxWidth="max-w-4xl"
      >
        <InventoryForm />
      </FloatingFormCard>
    </div>
  );
};

export default InventoryHeader;