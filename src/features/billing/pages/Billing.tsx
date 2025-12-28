import { ReceiptIcon } from "lucide-react"
import Title from "../../../components/common/Title"
import BillingTable from "../components/BillingTable"
import BillingHeader from "../components/BillingHeader"
import BillingDetailView from "../components/BillingDetailView"
import Drawer from "@/components/common/Drawer"
import { useState } from "react"

const Billing = () => {
  const [isOpen, setIsOpen] = useState(false);
  const items = [
  {
    qty:4,
    tprice:20
  }
  ]
  return (
    <div>
      <Title icon={<ReceiptIcon size={30}/>} title="Billing"/>
      <BillingHeader items={items} setIsOpen={setIsOpen}/>
      <BillingTable/>
      <Drawer
        isOpen={isOpen}
        title="Billing Details"
        onClose={()=> setIsOpen(false)}
        >
        <BillingDetailView/>
      </Drawer>
      

    </div>
  )
}

export default Billing
