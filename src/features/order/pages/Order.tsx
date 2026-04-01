import { 
  Package, LayoutGrid, List, Inbox, Truck, PackageCheck 
} from "lucide-react";

import OrdersHeader from "../components/OrdersHeader";
import OrdersCard from "../components/OrdersCard";
import {  useState } from "react";
import Drawer from "@/components/common/Drawer";
import OrderDetailView from "../components/OrdersDetailView";
import { DateFilter } from "../components/DateFilter";
import { StatCard } from "@/components/common/StatsCard";

const Order = () => {
  const [status, setStatus] = useState("INCOMING"); // Default to showing new orders
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 1. Updated Mock Data with new statuses
  const ordersData = [
    { billNo: "BILL-1001", customerName: "Siva", phone: "9999999999", totalAmount: 100, status: "INCOMING" },
    { billNo: "BILL-1002", customerName: "pattani", phone: "8888888888", totalAmount: 2499, status: "ACCEPTED" },
    { billNo: "BILL-1003", customerName: "Arun", phone: "7777777777", totalAmount: 560, status: "OUT_FOR_DELIVERY" },
    { billNo: "BILL-1004", customerName: "vijay", phone: "6666666666", totalAmount: 899, status: "DELIVERED" },
    { billNo: "BILL-1005", customerName: "dhaslima", phone: "5555555555", totalAmount: 1250, status: "REJECTED" },
  ];

  const orderDetailData = {
    billNo: "BILL-1002", customerName: "Kumar", phone: "8888888888", status: "ACCEPTED", orderType: "Online",
    items: [
      { name: "Blue T-Shirt", qty: 2, price: 499, total: 998 },
      { name: "Formal Shoes", qty: 1, price: 1999, total: 1999 },
    ],
    subtotal: 2997, gstPercent: 18, gstAmount: 539.46, grandTotal: 3536.46,
  };

  // 2. Updated Derived Stats
  const totalOrders = ordersData.length;
  const incoming = ordersData.filter(o => o.status === "INCOMING").length;
  const outForDelivery = ordersData.filter(o => o.status === "OUT_FOR_DELIVERY").length;
  const delivered = ordersData.filter(o => o.status === "DELIVERED").length;

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans">
      <div className="space-y-4">
        
        

        {/* 3. Updated Stats Row to reflect the pipeline */}
        <div className='flex-none overflow-x-auto pb-1'>
          <div className="flex gap-4 min-w-max">
            <StatCard label="Total Orders" value={totalOrders} icon={Package} iconBg="bg-slate-100" iconColor="text-slate-600" />
            <StatCard label="Incoming" value={incoming} icon={Inbox} iconBg="bg-amber-50" iconColor="text-amber-600" />
            <StatCard label="Out for Delivery" value={outForDelivery} icon={Truck} iconBg="bg-purple-50" iconColor="text-purple-600" />
            <StatCard label="Delivered" value={delivered} icon={PackageCheck} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          </div>
        </div>

        {/* Note: You will need to update OrdersHeader to pass the new statuses (Incoming, Accepted, etc) if it uses tabs */}
        <OrdersHeader
          status={status} setStatus={setStatus}
          setIsDateFilterOpen={setOpen} orderType={""} setOrderType={function (): void {
            throw new Error("Function not implemented.");
          } } orderTypeOptions={[]}        />

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{ordersData.length}</span> orders
          </p>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
            >
              <List size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
            >
              <LayoutGrid size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {ordersData.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
            {ordersData.map((order) => (
              <OrdersCard key={order.billNo} order={order} setIsOpen={setIsOpen} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm py-20 gap-3">
            <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
              <Inbox size={28} strokeWidth={2} />
            </div>
            <p className="text-sm font-bold text-slate-600">No orders found</p>
          </div>
        )}

      </div>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Order Details">
        <OrderDetailView order={orderDetailData} />
      </Drawer>

      <DateFilter isOpen={open} onClose={() => setOpen(false)} onApply={(range) => { console.log(range); setOpen(false); }} />
    </div>
  );
};

export default Order;