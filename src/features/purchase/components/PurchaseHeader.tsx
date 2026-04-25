import { ShoppingCart, Clock, CheckCircle2, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/common/StatsCard';
import Title from '@/components/common/Title';
import { GradientButton } from '@/components/ui/GradientButton';

const PurchaseHeader = () => {
  return (
    <div className="space-y-4">
      <Title
        title="Purchase Management"
        subtitle="Monitor supplier invoices, and payment statuses"
        actions={
          <GradientButton path="/purchase/add" className="h-10 text-[13px] px-4">
            + Add Direct Purchase
          </GradientButton>
        }
      />

      <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-3 pb-2 -mx-2 px-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 touch-pan-x">
        <StatCard label="Total Orders"     value="—" icon={ShoppingCart} iconBg="bg-blue-50"   iconColor="text-blue-600" className="flex-1" />
        <StatCard label="Pending Payments" value="—" icon={Clock}        iconBg="bg-orange-50" iconColor="text-orange-600" className="flex-1" />
        <StatCard label="Completed"        value="—" icon={CheckCircle2} iconBg="bg-green-50"  iconColor="text-green-600" className="flex-1" />
        <StatCard label="Total Spend"      value="—" icon={IndianRupee}  iconBg="bg-blue-50"   iconColor="text-blue-600" className="flex-1" />
      </div>
    </div>
  );
};

export default PurchaseHeader;
