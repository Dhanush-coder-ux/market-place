import { CircleDot, ShoppingCartIcon } from "lucide-react"
import Title from "../../../components/common/Title"
import OrdersHeader from "../components/OrdersHeader"
import OrdersCard from "../components/OrdersCard"
import { useState } from "react"
import Drawer from "@/components/common/Drawer"
import OrderDetailView from "../components/OrdersDetailView"

const Order = () => {
  const [orderType, setOrderType] = useState("Offline");
  const [status, setStatus] = useState("COMPLETED");
  const [ isOpen, setIsOpen ] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();


const orderTypeOptions = [
  {
    label: "Offline",
    value: "Offline",
    icon: <CircleDot size={16} />,
    activeColor: "text-orange-500",
  },
  {
    label: "Online",
    value: "Online",
    icon: <CircleDot size={16} />,
    activeColor: "text-green-500",
  },
];
 const ordersData = [
  {
    billNo: "BILL-1001",
    customerName: "Siva",
    phone: "9999999999",
    totalAmount: 100,
    orderType: "Offline",
    status: "COMPLETED",
  },
  {
    billNo: "BILL-1002",
    customerName: "Kumar",
    phone: "8888888888",
    totalAmount: 2499,
    orderType: "Online",
    status: "PENDING",
  },
  {
    billNo: "BILL-1003",
    customerName: "Arun",
    phone: "7777777777",
    totalAmount: 560,
    orderType: "Online",
    status: "CANCELLED",
  },
  {
    billNo: "BILL-1004",
    customerName: "Priya",
    phone: "6666666666",
    totalAmount: 899,
    orderType: "Offline",
    status: "COMPLETED",
  }
];
const orderDetailData = {
  billNo: "BILL-1002",
  customerName: "Kumar",
  phone: "8888888888",
  status: "PENDING",
  orderType: "Online",
  items: [
    { name: "Blue T-Shirt", qty: 2, price: 499, total: 998 },
    { name: "Formal Shoes", qty: 1, price: 1999, total: 1999 },
    { name: "Jeans Pant", qty: 1, price: 899, total: 899 },
  ],
  subtotal: 3896,
  gstPercent: 18,
  gstAmount: 3896 * 0.18,  
  grandTotal: 3896 + 3896 * 0.18, 
};


  return (
    <div>
      <Title icon={<ShoppingCartIcon size={30}/>} title="Orders"/>
      <OrdersHeader
        status={status}
        setStatus={setStatus}
        orderType={orderType}
        setOrderType={setOrderType}
        orderTypeOptions={orderTypeOptions}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
      {ordersData.map((order) => (
        <OrdersCard key={order.billNo} order={order} setIsOpen={setIsOpen} />
      ))}
      </div>
      <Drawer
      isOpen={isOpen}
      onClose={()=> setIsOpen(false)}
      title="Customer's Order Info"
      >
        <OrderDetailView
        order={orderDetailData}
        />
      </Drawer>
      
    </div>
  )
}

export default Order
