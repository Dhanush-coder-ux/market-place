import ToggleSelect from '@/components/common/ToggleSelect'
import { ReusableSelect } from '@/components/ui/ReusableSelect'
import { options } from '@/features/billing/components/BillingHeader'
import { OrdersHeaderProps } from '../types'

const OrdersHeader : React.FC<OrdersHeaderProps>= ({orderType, setOrderType ,orderTypeOptions,status, setStatus}) => {
   
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
      <div>hii</div>
    </div>
  )
}

export default OrdersHeader
