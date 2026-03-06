
import Title from '@/components/common/Title'
import { GradientButton } from '@/components/ui/GradientButton'
import { AlertTriangle, IndianRupee, Layers, Package} from 'lucide-react'
import { MOCK_PRODUCTS } from '../pages/Product'
import { StatCard } from '@/components/common/StatsCard'

const ProductHeader = () => {
   

  return (
    <div className="space-y-3">

      {/* Top bar: Title + CTA */}
      <div className="flex items-start justify-between gap-4">
        <Title
          title="Product Inventory"
          subtitle="Manage and track your warehouse stock"
        />
        <GradientButton  
        path='/product/add' 
        >
          +   Add Product
        </GradientButton>
      </div>

      {/* Stats row */}
      <div className='flex-none overflow-y-auto px-6 py-2.5 bg-accent'>
      <div className="flex gap-2.5 ">
          <StatCard
     label="Total Products"
          value={MOCK_PRODUCTS.length}
          icon={Package}
  iconBg="bg-blue-50"
  iconColor="text-blue-600"
/>
          <StatCard
    label="Low Stock"
          value="2"
          icon={AlertTriangle}
  iconBg="bg-orange-50"
  iconColor="text-orange-600"
/>
          <StatCard
     label="Out of Stock"
          value="1"
          icon={Layers}
  iconBg="bg-red-50"
  iconColor="text-red-600"
/>
          <StatCard
       label="Inventory Value"
          value="$12,450"
          icon={IndianRupee}
  iconBg="bg-green-50"
  iconColor="text-green-600"
/>
   

      </div>
      </div>
   

    
    </div>
  )
}

export default ProductHeader