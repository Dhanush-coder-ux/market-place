import { PackageOpen, Truck, AlertCircle, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/common/StatsCard';
import { MOCK_PURCHASES } from "@/features/purchase/pages/Purchase";

const GrnHeader = () => {
  const totalOrders = MOCK_PURCHASES.length;
  const pendingDeliveries = MOCK_PURCHASES.filter(p => p.status === 'Paid').length;
  const partialDeliveries = MOCK_PURCHASES.filter(p => p.status === 'Pending').length;
  const valueReceived = MOCK_PURCHASES
    .filter(p => p.status === 'Paid' || p.status === 'Partial')
    .reduce((acc, curr) => acc + curr.total_cost, 0);

  return (
    <div className="space-y-4">
     

      <div className='flex-none overflow-x-auto pb-2'>
        <div className="flex gap-4 min-w-max">
          
          <StatCard
            label="Total Orders"
            value={totalOrders}
            icon={PackageOpen}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          
          <StatCard
            label="Pending Deliveries"
            value={pendingDeliveries}
            icon={Truck}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />

          <StatCard
            label="Partially Received"
            value={partialDeliveries}
            icon={AlertCircle}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          
          <StatCard
            label="Received Value"
            value={`₹${valueReceived.toLocaleString()}`}
            icon={IndianRupee}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />

        </div>
      </div>
    </div>
  );
};

export default GrnHeader;