import { PackageOpen, Truck, AlertCircle, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/common/StatsCard';
import Title from '@/components/common/Title';
// Assuming your mock data uses statuses like 'Completed', 'Pending', and 'Partial'
import { MOCK_PURCHASES } from "@/features/purchase/pages/Purchase";

const GrnHeader = () => {
  // 1. Total Volume
  const totalOrders = MOCK_PURCHASES.length;
  
  // 2. Pending Deliveries (Goods not yet received at all)
  const pendingDeliveries = MOCK_PURCHASES.filter(p => p.status === 'Paid').length;
  
  // 3. Partial Deliveries (Some goods received, waiting on the rest)
  const partialDeliveries = MOCK_PURCHASES.filter(p => p.status === 'Pending').length;
  
  // 4. Value of Received Goods (Only counting Completed and Partial orders)
  const valueReceived = MOCK_PURCHASES
    .filter(p => p.status === 'Paid' || p.status === 'Partial')
    .reduce((acc, curr) => acc + curr.total_cost, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <Title
          title="GRN & Receiving Management"
          subtitle="Monitor incoming shipments, partial deliveries, and receipt values"
        />
      </div>

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