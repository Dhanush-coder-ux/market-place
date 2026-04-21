import { PackageOpen, Truck, AlertCircle, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/common/StatsCard';

const GrnHeader = () => {
  return (
    <div className="space-y-4">
      <div className="flex-none overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          <StatCard label="Total Orders"        value="—" icon={PackageOpen} iconBg="bg-blue-50"    iconColor="text-blue-600" />
          <StatCard label="Pending Deliveries"  value="—" icon={Truck}       iconBg="bg-amber-50"   iconColor="text-amber-600" />
          <StatCard label="Partially Received"  value="—" icon={AlertCircle} iconBg="bg-purple-50"  iconColor="text-purple-600" />
          <StatCard label="Received Value"      value="—" icon={IndianRupee} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        </div>
      </div>
    </div>
  );
};

export default GrnHeader;
