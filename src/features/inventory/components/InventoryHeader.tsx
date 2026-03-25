import { AlertTriangleIcon, Package, PackageX } from "lucide-react";

import Title from "@/components/common/Title";
import type { InventoryHeaderProps } from "../types";
import { StatCard } from "@/components/common/StatsCard";


const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  totalCount,
  lowestStockValue,
}) => {

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center ">
        <Title title="Inventory" subtitle="Manage and track your product inventory" />

      </div>

      <div className='flex-none overflow-y-auto px-6 py-2.5 bg-accent'>
        <div className="flex gap-2.5 ">
          <StatCard
            label="Total Stock"
            value={totalCount}
            icon={Package}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            label="Low Stock Items"
            value={lowestStockValue}
            icon={AlertTriangleIcon}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
          />
          <StatCard
            label="Low Stock Items"
            value={lowestStockValue}
            icon={AlertTriangleIcon}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
          />
          <StatCard
            label="Out of Stock Items"
            value={0}
            icon={PackageX}
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
        </div>
      </div>
    </div>
  );
};

export default InventoryHeader;