import { useState } from 'react'
import { ShoppingCart, Clock, CheckCircle2, IndianRupee } from 'lucide-react'
import StatsCard from '@/components/common/StatsCard'
import Title from '@/components/common/Title'
import { GradientButton } from '@/components/ui/GradientButton'
import SearchActionCard from '@/components/ui/SearchActionCard'
import { FloatingFormCard } from '@/components/common/FloatingFormCard'
import { MOCK_PURCHASES } from '../pages/Purchase'
import PurchaseForm from '../pages/PurchaseForm'

const PurchaseHeader = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const totalPurchases = MOCK_PURCHASES.length;
  const pendingPayments = MOCK_PURCHASES.filter(p => p.status === 'Due').length;
  const totalExpenditure = MOCK_PURCHASES.reduce((acc, curr) => acc + curr.total_cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title 
          title="Purchase Management" 
          subtitle="Monitor procurement costs, supplier invoices, and payment statuses" 
        />
        <GradientButton onClick={() => setIsModalOpen(true)}>
          + Add New Purchase
        </GradientButton>
      </div>

    
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Orders" 
          value={totalPurchases} 
          icon={ShoppingCart} 
          color="blue" 
          description="Total invoices generated"
        />
        <StatsCard
          label="Pending Payments" 
          value={pendingPayments} 
          icon={Clock} 
          color="orange" 
          description="Invoices with 'Due' status"
        />
        <StatsCard
          label="Completed"
          value={totalPurchases - pendingPayments}
          icon={CheckCircle2}
          color="green"
          description="Fully paid transactions"
        />
        <StatsCard
          label="Total Spend" 
          value={`₹${totalExpenditure.toLocaleString()}`} 
          icon={IndianRupee} 
          color="blue" 
          description="Cumulative procurement cost"
        />
      </div>

      <div className="w-full my-4">
        <SearchActionCard
          searchValue={""}
          onSearchChange={() => {}}
          placeholder="Search by Invoice No, Supplier or Product..."
        />
      </div>

      <FloatingFormCard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Purchase"
        maxWidth="max-w-4xl"
      >
      <PurchaseForm  />
      </FloatingFormCard>
    </div>
  )
}

export default PurchaseHeader