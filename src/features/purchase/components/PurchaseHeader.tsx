import { ShoppingCart, Clock, CheckCircle2, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/common/StatsCard';
import Title from '@/components/common/Title';
import { GradientButton } from '@/components/ui/GradientButton';

const PurchaseHeader = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Title
          title="Purchase Management"
          subtitle="Monitor supplier invoices, and payment statuses"
        />
        <GradientButton path="/purchase/add">
          + Add Direct Purchase
        </GradientButton>
      </div>

      <div className="flex-none overflow-y-auto px-6 py-2.5 bg-accent">
        <div className="flex gap-2.5">
          <StatCard label="Total Orders"     value="—" icon={ShoppingCart} iconBg="bg-blue-50"   iconColor="text-blue-600" />
          <StatCard label="Pending Payments" value="—" icon={Clock}        iconBg="bg-orange-50" iconColor="text-orange-600" />
          <StatCard label="Completed"        value="—" icon={CheckCircle2} iconBg="bg-green-50"  iconColor="text-green-600" />
          <StatCard label="Total Spend"      value="—" icon={IndianRupee}  iconBg="bg-blue-50"   iconColor="text-blue-600" />
        </div>
      </div>
    </div>
  );
};

export default PurchaseHeader;
