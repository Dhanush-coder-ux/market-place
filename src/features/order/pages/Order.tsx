import { CircleDot, ShoppingCartIcon, Package, TrendingUp, Clock, XCircle } from "lucide-react"
import Title from "../../../components/common/Title"
import OrdersHeader from "../components/OrdersHeader"
import OrdersCard from "../components/OrdersCard"
import { useState } from "react"
import Drawer from "@/components/common/Drawer"
import OrderDetailView from "../components/OrdersDetailView"
import { DateFilter } from "../components/DateFilter"
import StatsCard from "@/components/common/StatsCard"


const Order = () => {
  const [orderType, setOrderType] = useState("Offline");
  const [status, setStatus] = useState("COMPLETED");
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false);

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
    },
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

  // Derived stats
  const totalOrders = ordersData.length;
  const completed = ordersData.filter(o => o.status === "COMPLETED").length;
  const pending = ordersData.filter(o => o.status === "PENDING").length;
  const cancelled = ordersData.filter(o => o.status === "CANCELLED").length;

  return (
    <div
      className="min-h-screen bg-slate-50/60 "
      
    >
      {/* Max-width container */}
      <div className="space-y-4">

        {/* Page title */}
       
       

        {/* Stats row */}
      <div className="flex justify-between gap-4 w-full">
           <Title icon={<ShoppingCartIcon size={22} />} title="Orders" subtitle= "Manage and track all your orders" />
           <div className="gap-3 flex">
          <StatsCard
            label="Total Orders"
            value={totalOrders}
            icon={Package}
            color="blue"
            description="All time"
          />
          <StatsCard
            label="Completed"
            value={completed}
            icon={TrendingUp}
            color="green"
          
          />
          <StatsCard
            label="Pending"
            value={pending}
            icon={Clock}
            color="orange"
        
          />
          <StatsCard
            label="Cancelled"
            value={cancelled}
            icon={XCircle}
            color="red"
        
            description="vs last week"
          />
          </div>
        </div>

        {/* Filter header */}
        <OrdersHeader
          status={status}
          setStatus={setStatus}
          orderType={orderType}
          setOrderType={setOrderType}
          orderTypeOptions={orderTypeOptions}
         
          setIsDateFilterOpen={setOpen}
        />

        {/* Orders grid */}
        {ordersData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {ordersData.map((order) => (
              <OrdersCard key={order.billNo} order={order} setIsOpen={setIsOpen} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
              <ShoppingCartIcon size={28} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-bold text-slate-500">No orders found</p>
            <p className="text-xs text-slate-400 font-medium">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination hint */}
        <div className="flex items-center justify-between pt-1 pb-2">
          <p className="text-[12px] text-slate-400 font-medium">
            Showing <span className="font-bold text-slate-600">{ordersData.length}</span> orders
          </p>
          {/* Placeholder for future pagination */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(p => (
              <button
                key={p}
                className={`w-8 h-8 rounded-lg text-[12px] font-bold transition-colors ${
                  p === 1
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "text-slate-400 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Customer's Order Info"
      >
        <OrderDetailView order={orderDetailData} />
      </Drawer>

      {/* Date filter */}
      <DateFilter
        isOpen={open}
        onClose={() => setOpen(false)}
        onApply={(range) => {
          console.log(range);
          setOpen(false);
        }}
      />
    </div>
  );
};

export default Order;