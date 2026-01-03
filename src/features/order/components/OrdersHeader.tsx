import ToggleSelect from '@/components/common/ToggleSelect'
import { ReusableSelect } from '@/components/ui/ReusableSelect'
import { options } from '@/features/billing/components/BillingHeader'
import { OrdersHeaderProps } from '../types'

import GradientButton from '@/components/ui/GradientButton'
import { Calendar } from 'lucide-react'


const OrdersHeader : React.FC<OrdersHeaderProps>= ({
  orderType,
   setOrderType ,
   orderTypeOptions,
   status, 
   setStatus, 
  setIsCalenderOpen
}) => {

  return (
    <div className="card p-6 card-hover flex items-center gap-6 justify-between w-full h-full">
      <div>
        <ReusableSelect
        placeholder='Order Status'
        options={options}
        value={status}
        onValueChange={setStatus}
        />
      </div>
      {/* oredr Type */}
       <ToggleSelect
       value={orderType}
       options={orderTypeOptions}
       onChange={setOrderType}
       />
      
  
      <GradientButton onClick={()=>setIsCalenderOpen(true)} icon={<Calendar size={30}/>}>
        Filter By Calender
      </GradientButton>
     
    </div>
  )
}

export default OrdersHeader
