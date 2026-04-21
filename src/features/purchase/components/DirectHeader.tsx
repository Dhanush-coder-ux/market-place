import { ShoppingCart, Clock, CheckCircle2, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/common/StatsCard';

const DirectHeader = () => {
  return (
    <div className="space-y-3">
      <div className="flex-none overflow-y-auto px-6 py-2.5 bg-accent">
        <div className="flex gap-2.5">
          <StatCard label="Total Orders"      value="—" icon={ShoppingCart}  iconBg="bg-blue-50"   iconColor="text-blue-600" />
          <StatCard label="Pending Payments"  value="—" icon={Clock}         iconBg="bg-orange-50" iconColor="text-orange-600" />
          <StatCard label="Completed"         value="—" icon={CheckCircle2}  iconBg="bg-green-50"  iconColor="text-green-600" />
          <StatCard label="Total Spend"       value="—" icon={IndianRupee}   iconBg="bg-blue-50"   iconColor="text-blue-600" />
        </div>
      </div>
    </div>
  );
};

export default DirectHeader;
