import { ShoppingCart, Clock, CheckCircle2, IndianRupee } from 'lucide-react'
import  { StatCard } from '@/components/common/StatsCard'
import Title from '@/components/common/Title'
import { MOCK_PURCHASES } from "@/features/purchase/pages/Purchase"
import { GradientButton } from '@/components/ui/GradientButton'

const DirectHeader = () => {
  const totalPurchases = MOCK_PURCHASES.length;
  const pendingPayments = MOCK_PURCHASES.filter(p => p.status === 'Pending').length;
  const totalExpenditure = MOCK_PURCHASES.reduce((acc, curr) => acc + curr.total_cost, 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Title
          title="Purchase Management"
          subtitle="Monitor  supplier invoices, and payment statuses"
        />
        <GradientButton
        path='/direct-purchase/add'
        >
         + Add Direct Purchase
        </GradientButton>
      </div>

      <div className='flex-none overflow-y-auto px-6 py-2.5 bg-accent'>
        <div className="flex gap-2.5 ">
          <StatCard
            label="Total Orders"
            value={totalPurchases}
            icon={ShoppingCart}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            label="Pending Payments"
            value={pendingPayments}
            icon={Clock}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />

          <StatCard
            label="Completed"
            value={totalPurchases - pendingPayments}
            icon={CheckCircle2}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            label="Total Spend"
            value={`₹${totalExpenditure.toLocaleString()}`}
            icon={IndianRupee}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />


        </div>
      </div>

    </div>
  )
}

export default DirectHeader