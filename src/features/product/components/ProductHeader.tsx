import StatsCard from '@/components/common/StatsCard'
import Title from '@/components/common/Title'
import { GradientButton } from '@/components/ui/GradientButton'
import { AlertTriangle, BadgeDollarSign, IndianRupee, Layers, Package } from 'lucide-react'
import { MOCK_PRODUCTS } from '../pages/Product'
import SearchActionCard from '@/components/ui/SearchActionCard'
import ProductForm from '../pages/ProductForm'
import { FloatingFormCard } from '@/components/common/FloatingFormCard'
import { useState } from 'react'

const ProductHeader = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div>
        <div className="flex justify-between items-center">
        <div>
        <Title title="Product Inventory" subtitle="Manage and track your warehouse stock" />
        </div>
        <GradientButton onClick={() => setIsModalOpen(true)}>
          Add New Product
        </GradientButton>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Products" 
          value={MOCK_PRODUCTS.length} 
          icon={Package} 
          color="blue" 
          description="Total SKUs active"
        />
        <StatsCard
          label="Low Stock" 
          value="2" 
          icon={AlertTriangle} 
          color="orange" 
          description="Items below threshold"
        />
        <StatsCard
        label="Out of Stock"
        value="1"
        icon={Layers}
        color="red"
        description="Items currently unavailable"
      />
        <StatsCard
          label="Inventory Value" 
          value="$12,450" 
          icon={IndianRupee} 
          color="green" 
          description="Total asset value"
        />

        
      </div>
          <div className="w-full my-5">
        <SearchActionCard
          searchValue={""}
          onSearchChange={() => {}}
          placeholder="Search products..."
        />
      </div>
       <FloatingFormCard
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Add New Inventory Item"
              maxWidth="max-w-4xl"
            >
                <ProductForm 
                onSubmit={()=>{}}
                />
            </FloatingFormCard>
    </div>
  )
}

export default ProductHeader
