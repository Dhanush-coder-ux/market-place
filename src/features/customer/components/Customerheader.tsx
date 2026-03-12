import Title from '@/components/common/Title'
import { 
  Users, 
  CreditCard, 
  AlertCircle, 
  TrendingUp, 
} from 'lucide-react'
import { StatCard } from '@/components/common/StatsCard'

// Assuming you'll have a MOCK_CUSTOMERS or similar data source
const MOCK_CUSTOMERS_COUNT = 120; 

const CustomerHeader = () => {
  return (
    <div className="space-y-3 font-sans">

      {/* Top bar: Title + CTA */}
      <div className="flex items-start justify-between gap-4">
        <Title
          title="Customer Directory"
          subtitle="Manage client profiles, credit limits, and receivables"
        />
      
      </div>

      {/* Stats row */}
      <div className='flex-none overflow-x-auto px-6 py-2.5 bg-accent rounded-xl'>
        <div className="flex gap-2.5 min-w-max">
          <StatCard
            label="Total Customers"
            value={MOCK_CUSTOMERS_COUNT}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            label="Total Receivables"
            value="₹8,45,200"
            icon={TrendingUp}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            label="Overdue Balances"
            value="₹1,12,000"
            icon={AlertCircle}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
          <StatCard
            label="Active Credit"
            value="42"
            icon={CreditCard}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>
      </div>

    </div>
  )
}

export default CustomerHeader;